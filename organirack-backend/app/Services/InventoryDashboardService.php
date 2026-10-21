<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Inventario;
use App\Models\Producto;
use App\Models\Estante;
use Illuminate\Support\Facades\DB;

class InventoryDashboardService
{
    /**
     * Endpoint 1: GET /api/dashboard/kpis
     * Calcula métricas rápidas del inventario (Optimizadas)
     *
     * @return array
     */
    public function getKpis(): array
    {
        // 1. Unidades totales: suma total de cantidad de todos los registros en inventarios
        $unidadesTotales = (int) Inventario::sum('cantidad');

        // 2. Ubicaciones activas: cantidad de estantes distintos que tienen inventario (cantidad > 0)
        $ubicacionesActivas = (int) Inventario::where('cantidad', '>', 0)
                                            ->distinct('estante_id')
                                            ->count('estante_id');

        // 3. Productos únicos: cantidad de productos distintos que tienen inventario (cantidad > 0)
        $productosUnicos = (int) Inventario::where('cantidad', '>', 0)
                                            ->distinct('producto_id')
                                            ->count('producto_id');

        // 4. (Opcional pero útil) Top 5 ubicaciones: los 5 estantes con mayor suma de inventario
        $topUbicaciones = Inventario::select(
            'estante_id',
            DB::raw('SUM(inventarios.cantidad) as total_cantidad')
        )
            ->join('estantes', 'inventarios.estante_id', '=', 'estantes.id')
            ->groupBy('estante_id', 'estantes.codigo_etiqueta')
            ->with('estante')
            ->orderByDesc('total_cantidad')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'estante_id' => $item->estante_id,
                    'codigo_etiqueta' => $item->estante->codigo_etiqueta ?? 'S/D',
                    'cantidad' => $item->total_cantidad,
                ];
            })
            ->toArray();

        return [
            'unidades_totales' => $unidadesTotales,
            'ubicaciones_activas' => $ubicacionesActivas,
            'productos_unicos' => $productosUnicos,
            'top_ubicaciones' => $topUbicaciones,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Endpoint 2: GET /api/dashboard/existencias
     * Devuelve registros planos de inventario sin agrupación (nodos de stock)
     *
     * @return array
     */
    public function getExistencias(): array
    {
        // Obtener todos los registros de inventario con relaciones cargadas
        $registros = Inventario::with([
            'producto:id,sku,nombre',
            'estante:id,codigo_etiqueta,nivel',
            'estado:id,nombre'
        ])
            ->where('cantidad', '>', 0)
            ->orderBy('producto_id')
            ->orderBy('estante_id')
            ->get()
            ->map(function ($inventario) {
                // Determinar estado: si cantidad > 0 es "ok", si está en 0 es "crítico"
                $estadoInventario = $inventario->cantidad > 0 ? 'ok' : 'critico';

                return [
                    'id' => $inventario->id,
                    'producto_id' => $inventario->producto_id,
                    'sku' => $inventario->producto?->sku ?? 'S/D',
                    'producto_nombre' => $inventario->producto?->nombre ?? 'Producto desconocido',
                    'estante_id' => $inventario->estante_id,
                    'ubicacion' => $inventario->estante?->codigo_etiqueta ?? 'S/D',
                    'ubicacion_nivel' => $inventario->estante?->nivel ?? 'S/D',
                    'cantidad' => (int) $inventario->cantidad,
                    'estado_id' => $inventario->estado_id,
                    'estado_nombre' => $inventario->estado?->nombre ?? 'Desconocido',
                    'estado_simple' => $estadoInventario, // ok o crítico para el frontend
                    'created_at' => $inventario->created_at?->toIso8601String(),
                    'updated_at' => $inventario->updated_at?->toIso8601String(),
                ];
            })
            ->toArray();

        return [
            'data' => $registros,
            'total' => count($registros),
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * TAREA 3: Distribución de inventario por estado
     * Retorna agrupación de cantidad total por estado_id para la gráfica
     * Endpoint: GET /api/dashboard/inventory/distribution-by-state
     *
     * @return array
     */
    public function getInventoryDistributionByState(): array
    {
        $distribution = Inventario::select(
            'estado_id',
            DB::raw('SUM(cantidad) as total_cantidad')
        )
            ->with('estado:id,nombre')
            ->groupBy('estado_id')
            ->orderBy('total_cantidad', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'estado_id' => $item->estado_id,
                    'estado_nombre' => $item->estado?->nombre ?? 'Desconocido',
                    'cantidad_total' => (int) $item->total_cantidad,
                    'porcentaje' => 0, // Se calcula en el frontend después de sumar
                ];
            })
            ->toArray();

        // Calcular porcentajes
        $total = collect($distribution)->sum('cantidad_total');
        if ($total > 0) {
            $distribution = array_map(function ($item) use ($total) {
                $item['porcentaje'] = round(($item['cantidad_total'] / $total) * 100, 2);
                return $item;
            }, $distribution);
        }

        return [
            'data' => $distribution,
            'total' => $total,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Distribución de inventario por categoría
     * Retorna cantidad total de unidades en stock por categoría para la gráfica
     * Endpoint: GET /api/dashboard/inventory/distribution-by-category
     *
     * @return array
     */
    public function getInventoryDistributionByCategory(): array
    {
        $distribution = Inventario::select(
            'categorias.id as categoria_id',
            'categorias.nombre as categoria_nombre',
            DB::raw('SUM(inventarios.cantidad) as total_cantidad')
        )
            ->join('productos', 'inventarios.producto_id', '=', 'productos.id')
            ->leftJoin('categorias', 'productos.categoria_id', '=', 'categorias.id')
            ->where('productos.estado', true)
            ->groupBy('categorias.id', 'categorias.nombre')
            ->orderBy('total_cantidad', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'categoria_id' => $item->categoria_id,
                    'categoria_nombre' => $item->categoria_nombre ?? 'Sin Categoría',
                    'cantidad_total' => (int) $item->total_cantidad,
                    'porcentaje' => 0,
                ];
            })
            ->toArray();

        // Calcular porcentajes
        $total = collect($distribution)->sum('cantidad_total');
        if ($total > 0) {
            $distribution = array_map(function ($item) use ($total) {
                $item['porcentaje'] = round(($item['cantidad_total'] / $total) * 100, 2);
                return $item;
            }, $distribution);
        }

        return [
            'data' => $distribution,
            'total' => $total,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * TAREA 4: Top 5 Estantes por cantidad de productos
     * Retorna los 5 estantes con mayor cantidad de unidades en inventario
     * Endpoint: GET /api/dashboard/inventory/top-shelves
     *
     * @return array
     */
    public function getTopShelvesByQuantity(): array
    {
        $topShelves = Inventario::select(
            'estante_id',
            DB::raw('SUM(cantidad) as total_cantidad'),
            DB::raw('COUNT(DISTINCT producto_id) as cantidad_productos')
        )
            ->with('estante:id,codigo_etiqueta,nivel')
            ->groupBy('estante_id')
            ->orderByDesc('total_cantidad')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'estante_id' => $item->estante_id,
                    'estante_codigo' => $item->estante?->codigo_etiqueta ?? 'S/D',
                    'estante_nivel' => $item->estante?->nivel ?? 'N/A',
                    'total_cantidad' => (int) $item->total_cantidad,
                    'cantidad_productos' => (int) $item->cantidad_productos,
                ];
            })
            ->toArray();

        return [
            'data' => $topShelves,
            'total' => count($topShelves),
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * TAREA 1: Tabla principal refactorizada
     * Retorna los datos de inventario con SOLO las columnas reales necesarias
     * Endpoint: GET /api/dashboard/inventory/table
     *
     * @return array
     */
    public function getInventoryTable(): array
    {
        try {
            $items = Inventario::query()
                ->with([
                    'producto:id,sku,nombre',
                    'estante:id,codigo_etiqueta,nivel',
                    'estado:id,nombre'
                ])
                ->orderBy('producto_id')
                ->orderBy('estante_id')
                ->get()
                ->map(function ($inventario) {
                    return [
                        'id' => $inventario->id,
                        'producto_id' => $inventario->producto_id,
                        'estante_id' => $inventario->estante_id,
                        'estado_id' => $inventario->estado_id,
                        // Columnas reales que mostraremos
                        'sku' => $inventario->producto?->sku ?? 'S/D',
                        'producto_nombre' => $inventario->producto?->nombre ?? 'Producto desconocido',
                        'ubicacion' => $inventario->estante?->codigo_etiqueta ?? 'S/D',
                        'cantidad' => (int) $inventario->cantidad,
                        'estado_nombre' => $inventario->estado?->nombre ?? 'Desconocido',
                        // Metadata para navegación
                        'created_at' => $inventario->created_at?->toIso8601String(),
                        'updated_at' => $inventario->updated_at?->toIso8601String(),
                    ];
                })
                ->toArray();

            return [
                'data' => $items,
                'total' => count($items),
                'timestamp' => now()->toIso8601String(),
            ];
        } catch (\Exception $e) {
            \Log::error('Error en getInventoryTable:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'data' => [],
                'total' => 0,
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ];
        }
    }
}
