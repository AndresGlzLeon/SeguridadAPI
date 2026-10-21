<?php

namespace App\Services;

use App\Models\OrdenSurtido;
use App\Models\DetalleSurtido;
use App\Models\EstadoOrden;
use App\Models\Estante;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class OrderService
{
    /**
     * Obtiene todas las órdenes de surtido con paginación y filtros.
     * CRÍTICO: Utiliza Eager Loading para evitar N+1 queries.
     *
     * @param array $filters Array con filtros: ['estado_id' => 1, 'prioridad_id' => null, 'per_page' => 15]
     * @return LengthAwarePaginator
     */
    public function getAllOrders(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;
        $estado_id = $filters['estado_id'] ?? null;
        $prioridad_id = $filters['prioridad_id'] ?? null;
        $search = $filters['search'] ?? '';

        // Construir consulta con Eager Loading
        $query = OrdenSurtido::with([
            'estado',
            'prioridad',
            'capturista',
            'almacenista',
            'detalles.producto',
            'detalles.estanteSugerido',
            'detalles.estanteReal',
        ]);

        // Filtro por estado
        if ($estado_id !== null) {
            $query->where('estado_id', $estado_id);
        }

        // Filtro por prioridad
        if ($prioridad_id !== null) {
            $query->where('prioridad_id', $prioridad_id);
        }

        // Filtro de búsqueda por folio o referencia
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('folio', 'like', "%{$search}%")
                  ->orWhere('referencia_destino', 'like', "%{$search}%");
            });
        }

        // Ordenar por fecha de creación descendente (las más recientes primero)
        $query->orderBy('created_at', 'desc');

        // Retornar paginado
        return $query->paginate($perPage);
    }

    /**
     * Obtiene una orden específica por ID con todas sus relaciones.
     *
     * @param int $id ID de la orden
     * @return OrdenSurtido|null
     */
    public function getOrderById(int $id): ?OrdenSurtido
    {
        return OrdenSurtido::with([
            'estado',
            'prioridad',
            'capturista',
            'almacenista',
            'detalles.producto',
            'detalles.estanteSugerido',
            'detalles.estanteReal',
        ])->find($id);
    }

    /**
     * Crea una nueva orden de surtido con sus detalles.
     * CRÍTICO: Envuelto en DB::transaction() para mantener integridad ACID.
     *
     * @param array $data Datos validados de StoreOrderRequest
     * @return OrdenSurtido La orden creada con todas sus relaciones
     * @throws \Exception si ocurre un error durante la creación
     */
    public function createOrder(array $data): OrdenSurtido
    {
        return DB::transaction(function () use ($data) {
            // Obtener el estado por defecto: "Pendiente" (normalmente ID = 1)
            $estadoPendiente = EstadoOrden::where('nombre', 'Pendiente')->first();
            
            if (!$estadoPendiente) {
                throw new \Exception('No se encontró el estado "Pendiente" en la base de datos.');
            }

            // Obtener un estante válido por defecto
            $estanteDefault = Estante::first();
            if (!$estanteDefault) {
                throw new \Exception('No hay estantes disponibles en la base de datos.');
            }

            // Generar folio único
            $folio = $this->generateFolio();

            // 1. Crear la OrdenSurtido
            $orden = OrdenSurtido::create([
                'folio' => $folio,
                'capturista_id' => Auth::id() ?? 1, // El usuario autenticado
                'almacenista_id' => null, // Se asignará posteriormente
                'referencia_destino' => $data['referencia_destino'] ?? null,
                'estado_id' => $estadoPendiente->id,
                'prioridad_id' => $data['prioridad_id'],
                'fecha_requerida' => $data['fecha_requerida'] ?? null,
            ]);

            // 2. Crear los detalles de la orden
            foreach ($data['detalles'] as $detalle) {
                DetalleSurtido::create([
                    'orden_surtido_id' => $orden->id,
                    'producto_id' => $detalle['producto_id'],
                    'cantidad_requerida' => $detalle['cantidad_requerida'],
                    'cantidad_surtida' => 0,
                    'estante_sugerido_id' => $detalle['estante_sugerido_id'] ?? $estanteDefault->id,
                    'estante_real_id' => null,
                    'fue_modificado' => false,
                ]);
            }

            // 3. Retornar la orden con todas las relaciones cargadas
            return $this->getOrderById($orden->id);
        });
    }

    /**
     * Actualiza el estado de una orden.
     *
     * @param int $id ID de la orden
     * @param int $estado_id ID del nuevo estado
     * @return OrdenSurtido La orden actualizada
     */
    public function updateOrderStatus(int $id, int $estado_id): OrdenSurtido
    {
        $orden = OrdenSurtido::findOrFail($id);
        $orden->update(['estado_id' => $estado_id]);

        return $this->getOrderById($id);
    }

    /**
     * Asigna un almacenista a una orden y cambia estado de Pendiente a Asignada.
     *
     * @param int $id ID de la orden
     * @param int $almacenista_id ID del almacenista (User)
     * @return OrdenSurtido La orden actualizada
     * @throws \Exception si ocurre un error durante la asignación
     */
    public function assignAlmacenista(int $id, int $almacenista_id): OrdenSurtido
    {
        return DB::transaction(function () use ($id, $almacenista_id) {
            $orden = OrdenSurtido::findOrFail($id);
            
            // Obtener estados para transición
            $estadoPendiente = EstadoOrden::where('nombre', 'Pendiente')->first();
            $estadoEnProceso = EstadoOrden::where('nombre', 'En Proceso')->first();
            
            if (!$estadoEnProceso) {
                throw new \Exception('No se encontró el estado "En Proceso" en la base de datos.');
            }
            
            // Actualizar almacenista y cambiar estado de Pendiente a En Proceso
            $orden->update([
                'almacenista_id' => $almacenista_id,
                'estado_id' => $estadoPendiente && $orden->estado_id === $estadoPendiente->id 
                    ? $estadoEnProceso->id 
                    : $orden->estado_id,
            ]);

            return $this->getOrderById($id);
        });
    }

    /**
     * Actualiza el detalle de una partida en la orden.
     *
     * @param int $detalleId ID del detalle
     * @param array $data Datos a actualizar
     * @return DetalleSurtido
     */
    public function updateDetallePartida(int $detalleId, array $data): DetalleSurtido
    {
        $detalle = DetalleSurtido::findOrFail($detalleId);

        $detalle->update([
            'cantidad_surtida' => $data['cantidad_surtida'] ?? $detalle->cantidad_surtida,
            'estante_real_id' => $data['estante_real_id'] ?? $detalle->estante_real_id,
            'fue_modificado' => $data['fue_modificado'] ?? $detalle->fue_modificado,
        ]);

        return $detalle->load(['producto', 'estanteSugerido', 'estanteReal']);
    }

    /**
     * Genera un folio único para la orden.
     * Formato: ORD-YYYYMMDD-XXXXX (donde XXXXX es un contador)
     *
     * @return string
     */
    private function generateFolio(): string
    {
        $fecha = now()->format('Ymd');
        $contador = OrdenSurtido::whereDate('created_at', today())
            ->count() + 1;

        return sprintf('ORD-%s-%05d', $fecha, $contador);
    }
}
