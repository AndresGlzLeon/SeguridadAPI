<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\OrdenSurtido;
use App\Models\Inventario;
use App\Models\Producto;
use App\Models\Almacen;
use App\Models\Estante;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardService
{
    /**
     * Gráfica 1: Estado de Órdenes de Surtido
     * Retorna distribución de órdenes por estado
     *
     * @return array
     */
    public function getOrdersByState(): array
    {
        $data = OrdenSurtido::select(
            'estados_orden.nombre as label',
            'estados_orden.color_hex as color',
            DB::raw('COUNT(ordenes_surtido.id) as value')
        )
            ->leftJoin('estados_orden', 'ordenes_surtido.estado_id', '=', 'estados_orden.id')
            ->groupBy('estados_orden.id', 'estados_orden.nombre', 'estados_orden.color_hex')
            ->get();

        return [
            'labels' => $data->pluck('label')->toArray(),
            'colors' => $data->pluck('color')->toArray(),
            'data' => $data->pluck('value')->toArray(),
            'total' => $data->sum('value'),
        ];
    }

    /**
     * Gráfica 2: Órdenes por Prioridad (Últimas 30 días)
     * Retorna cantidad de órdenes agrupadas por prioridad
     *
     * @return array
     */
    public function getOrdersByPriority(): array
    {
        $thirtyDaysAgo = Carbon::now()->subDays(30);

        $data = OrdenSurtido::select(
            'prioridades_orden.nombre as label',
            'prioridades_orden.nivel_ordenamiento',
            DB::raw('COUNT(ordenes_surtido.id) as value')
        )
            ->leftJoin('prioridades_orden', 'ordenes_surtido.prioridad_id', '=', 'prioridades_orden.id')
            ->where('ordenes_surtido.created_at', '>=', $thirtyDaysAgo)
            ->groupBy('prioridades_orden.id', 'prioridades_orden.nombre', 'prioridades_orden.nivel_ordenamiento')
            ->orderBy('prioridades_orden.nivel_ordenamiento', 'asc')
            ->get();

        return [
            'labels' => $data->pluck('label')->toArray(),
            'data' => $data->pluck('value')->toArray(),
            'total' => $data->sum('value'),
        ];
    }

    /**
     * Gráfica 3: Inventario por Categoría
     * Retorna cantidad total de unidades en stock por categoría
     *
     * @return array
     */
    public function getInventoryByCategory(): array
    {
        $data = Inventario::select(
            'categorias.nombre as label',
            DB::raw('SUM(inventarios.cantidad) as value')
        )
            ->join('productos', 'inventarios.producto_id', '=', 'productos.id')
            ->leftJoin('categorias', 'productos.categoria_id', '=', 'categorias.id')
            ->where('productos.estado', true) // Solo productos activos
            ->groupBy('categorias.id', 'categorias.nombre')
            ->orderBy('value', 'desc')
            ->get();

        return [
            'labels' => $data->pluck('label')->toArray(),
            'data' => $data->pluck('value')->map(fn($val) => (int)$val)->toArray(),
            'total' => (int)$data->sum('value'),
        ];
    }

    /**
     * Gráfica 4: Ocupación de Almacenes
     * Retorna porcentaje de ocupación por almacén
     *
     * @return array
     */
    public function getWarehouseOccupancy(): array
    {
        try {
            // Obtener almacenes usando relaciones eager loading
            $almacenes = Almacen::with(['pasillos' => function($q) {
                $q->with(['racks' => function($r) {
                    $r->with('estantes');
                }]);
            }])
            ->select('almacenes.id', 'almacenes.nombre')
            ->get();

            $occupancy = $almacenes->map(function ($almacen) {
                $totalEstantes = 0;
                $ocupados = 0;

                foreach ($almacen->pasillos ?? [] as $pasillo) {
                    foreach ($pasillo->racks ?? [] as $rack) {
                        $estantesInRack = $rack->estantes ?? collect();
                        $totalEstantes += $estantesInRack->count();
                        
                        // Contar estantes con inventario
                        foreach ($estantesInRack as $estante) {
                            $inventarioCount = DB::table('inventarios')
                                ->where('estante_id', $estante->id)
                                ->where('cantidad', '>', 0)
                                ->count();
                            
                            if ($inventarioCount > 0) {
                                $ocupados++;
                            }
                        }
                    }
                }

                $porcentaje = $totalEstantes > 0 ? round(($ocupados / $totalEstantes) * 100, 2) : 0;

                return [
                    'name' => $almacen->nombre,
                    'total' => $totalEstantes,
                    'ocupados' => $ocupados,
                    'porcentaje' => $porcentaje,
                ];
            })->toArray();

            return [
                'almacenes' => $occupancy,
                'promedioOcupacion' => collect($occupancy)->avg('porcentaje') ?? 0,
            ];
        } catch (\Exception $e) {
            \Log::error('Error en getWarehouseOccupancy: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'almacenes' => [],
                'promedioOcupacion' => 0,
            ];
        }
    }

    /**
     * Gráfica 5: Productos con Stock Crítico
     * Retorna listado de productos con stock por debajo del mínimo
     *
     * @param int $limit Número máximo de registros a retornar
     * @return array
     */
    public function getCriticalStockProducts(int $limit = 15): array
    {
        $data = Producto::select(
            'productos.id',
            'productos.sku',
            'productos.nombre',
            'productos.stock_min',
            'categorias.nombre as categoria',
            DB::raw('COALESCE(SUM(inventarios.cantidad), 0) as stock_actual')
        )
            ->leftJoin('categorias', 'productos.categoria_id', '=', 'categorias.id')
            ->leftJoin('inventarios', 'productos.id', '=', 'inventarios.producto_id')
            ->where('productos.estado', true)
            ->groupBy(
                'productos.id',
                'productos.sku',
                'productos.nombre',
                'productos.stock_min',
                'categorias.nombre'
            )
            ->havingRaw('COALESCE(SUM(inventarios.cantidad), 0) <= productos.stock_min')
            ->orderBy('stock_actual', 'asc')
            ->limit($limit)
            ->get();

        return [
            'productos' => $data->map(fn($p) => [
                'id' => $p->id,
                'sku' => $p->sku,
                'nombre' => $p->nombre,
                'categoria' => $p->categoria,
                'stock_actual' => (int)$p->stock_actual,
                'stock_minimo' => $p->stock_min,
                'diferencia' => (int)$p->stock_actual - $p->stock_min,
                'alerta' => 'critical',
            ])->toArray(),
            'total' => $data->count(),
        ];
    }

    /**
     * Dashboard general - Agrupa todas las métricas
     *
     * @return array
     */
    public function getDashboardMetrics(): array
    {
        return [
            'estadoOrdenes' => $this->safeCall('getOrdersByState'),
            'ordenesPorPrioridad' => $this->safeCall('getOrdersByPriority'),
            'inventarioPorCategoria' => $this->safeCall('getInventoryByCategory'),
            'ocupacionAlmacenes' => $this->safeCall('getWarehouseOccupancy'),
            'productosStockCritico' => $this->safeCall('getCriticalStockProducts'),
        ];
    }

    /**
     * Ejecuta un método de forma segura con manejo de errores
     *
     * @param string $method
     * @return array
     */
    private function safeCall(string $method): array
    {
        try {
            return $this->$method();
        } catch (\Exception $e) {
            \Log::error("Error in DashboardService::{$method}: " . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'error' => "Error loading {$method}",
                'message' => $e->getMessage(),
            ];
        }
    }
}
