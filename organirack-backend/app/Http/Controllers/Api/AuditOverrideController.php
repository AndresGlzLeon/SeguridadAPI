<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditOverrideController extends Controller
{
    /**
     * Obtiene los overrides (discrepancias forzadas) paginados con filtros.
     * Un override se detecta cuando el detalle de surtido fue modificado o el estante real difiere del sugerido.
     * GET /api/audit-overrides
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'user_id' => $request->query('user_id'),
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to'),
                'sku' => $request->query('sku'),
                'per_page' => $request->query('per_page', 15),
            ];

            // Consulta base: audit_logs donde el detalle_surtido tiene fue_modificado=true o estante_sugerido_id != estante_real_id
            $query = AuditLog::with([
                'detalleSurtido.producto:id,sku,nombre',
                'user:id,name,username'
            ])
            ->join('detalles_surtido', 'audit_logs.detalle_surtido_id', '=', 'detalles_surtido.id')
            ->where(function ($q) {
                $q->where('detalles_surtido.fue_modificado', true)
                  ->orWhereColumn('detalles_surtido.estante_sugerido_id', '!=', 'detalles_surtido.estante_real_id');
            })
            ->select('audit_logs.*'); // Evitar duplicados de columnas

            // Aplicar filtros
            if ($filters['user_id']) {
                $query->where('audit_logs.user_id', $filters['user_id']);
            }

            if ($filters['date_from']) {
                $query->where('audit_logs.fecha_hora', '>=', $filters['date_from']);
            }

            if ($filters['date_to']) {
                $query->where('audit_logs.fecha_hora', '<=', $filters['date_to']);
            }

            if ($filters['sku']) {
                $query->whereHas('detalleSurtido.producto', function ($q) use ($filters) {
                    $q->where('sku', 'like', '%' . $filters['sku'] . '%');
                });
            }

            // Ordenar por fecha_hora descendente
            $query->orderBy('audit_logs.fecha_hora', 'desc');

            // Paginación
            $overrides = $query->paginate($filters['per_page']);

            // KPIs
            $kpis = $this->getKPIs($filters);

            // Opciones de filtros
            $filterOptions = $this->getFilterOptions();

            return response()->json([
                'message' => 'Overrides de auditoría obtenidos correctamente',
                'data' => $overrides->items(),
                'pagination' => [
                    'current_page' => $overrides->currentPage(),
                    'per_page' => $overrides->perPage(),
                    'total' => $overrides->total(),
                    'last_page' => $overrides->lastPage(),
                    'from' => $overrides->firstItem(),
                    'to' => $overrides->lastItem(),
                ],
                'kpis' => $kpis,
                'filters' => $filterOptions,
            ], 200);
        } catch (\Throwable $exception) {
            \Log::error('Error al obtener los overrides de auditoría', [
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ]);

            return response()->json([
                'message' => 'Error al obtener los overrides de auditoría',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    /**
     * Calcula los KPIs para el dashboard de overrides.
     */
    private function getKPIs(array $filters): array
    {
        $baseQuery = DB::table('audit_logs')
            ->join('detalles_surtido', 'audit_logs.detalle_surtido_id', '=', 'detalles_surtido.id')
            ->where(function ($q) {
                $q->where('detalles_surtido.fue_modificado', true)
                  ->orWhereColumn('detalles_surtido.estante_sugerido_id', '!=', 'detalles_surtido.estante_real_id');
            });

        // Aplicar filtros de fecha si existen
        if ($filters['date_from']) {
            $baseQuery->where('audit_logs.fecha_hora', '>=', $filters['date_from']);
        }
        if ($filters['date_to']) {
            $baseQuery->where('audit_logs.fecha_hora', '<=', $filters['date_to']);
        }

        // Total de overrides en el mes actual
        $currentMonth = now()->startOfMonth();
        $totalOverridesMes = (clone $baseQuery)
            ->where('audit_logs.fecha_hora', '>=', $currentMonth)
            ->count();

        // Producto con más overrides
        $productoMasOverrides = (clone $baseQuery)
            ->join('productos', 'detalles_surtido.producto_id', '=', 'productos.id')
            ->select('productos.nombre', 'productos.sku', DB::raw('COUNT(*) as total_overrides'))
            ->groupBy('productos.id', 'productos.nombre', 'productos.sku')
            ->orderBy('total_overrides', 'desc')
            ->first();

        return [
            'total_overrides_mes_actual' => $totalOverridesMes,
            'producto_mas_overrides' => $productoMasOverrides ? [
                'nombre' => $productoMasOverrides->nombre,
                'sku' => $productoMasOverrides->sku,
                'total_overrides' => $productoMasOverrides->total_overrides,
            ] : null,
        ];
    }

    /**
     * Obtiene las opciones para los filtros (usuarios disponibles).
     */
    private function getFilterOptions(): array
    {
        $usuarios = User::where('is_active', true)
            ->select('id', 'name', 'username')
            ->orderBy('name')
            ->get();

        return [
            'usuarios' => $usuarios,
        ];
    }
}