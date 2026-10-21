<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function __construct(private AuditService $auditService)
    {
    }

    /**
     * Obtiene la bitacora de auditoria paginada con filtros.
     * GET /api/audit-logs
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to'),
                'causer_id' => $request->query('causer_id'),
                'tipo_movimiento' => $request->query('tipo_movimiento'),
                'search' => $request->query('search'),
                'per_page' => $request->query('per_page', 15),
            ];

            $logs = $this->auditService->getAuditLogs($filters);
            $filterOptions = $this->auditService->getFilterOptions();

            // Transformar los datos para incluir información relacionada
            $transformedData = $logs->getCollection()->map(function ($log) {
                return [
                    'id' => $log->id,
                    'detalle_surtido_id' => $log->detalle_surtido_id,
                    'user_id' => $log->user_id,
                    'estante_origen_id' => $log->estante_origen_id,
                    'estante_destino_id' => $log->estante_destino_id,
                    'tipo_movimiento' => $log->tipo_movimiento,
                    'cantidad_anterior' => $log->cantidad_anterior,
                    'cantidad_nueva' => $log->cantidad_nueva,
                    'observaciones' => $log->observaciones,
                    'fecha_hora' => $log->fecha_hora,
                    'created_at' => $log->created_at,
                    'updated_at' => $log->updated_at,
                    // Información relacionada
                    'user' => $log->user ? [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                        'username' => $log->user->username,
                    ] : null,
                    'detalle_surtido' => $log->detalleSurtido ? [
                        'id' => $log->detalleSurtido->id,
                        'producto' => $log->detalleSurtido->producto ? [
                            'id' => $log->detalleSurtido->producto->id,
                            'sku' => $log->detalleSurtido->producto->sku,
                            'nombre' => $log->detalleSurtido->producto->nombre,
                        ] : null,
                        'estante_sugerido' => $log->detalleSurtido->estanteSugerido ? [
                            'id' => $log->detalleSurtido->estanteSugerido->id,
                            'codigo_etiqueta' => $log->detalleSurtido->estanteSugerido->codigo_etiqueta,
                        ] : null,
                        'estante_real' => $log->detalleSurtido->estanteReal ? [
                            'id' => $log->detalleSurtido->estanteReal->id,
                            'codigo_etiqueta' => $log->detalleSurtido->estanteReal->codigo_etiqueta,
                        ] : null,
                        'fue_modificado' => $log->detalleSurtido->fue_modificado,
                    ] : null,
                    'estante_origen' => $log->estanteOrigen ? [
                        'id' => $log->estanteOrigen->id,
                        'codigo_etiqueta' => $log->estanteOrigen->codigo_etiqueta,
                    ] : null,
                    'estante_destino' => $log->estanteDestino ? [
                        'id' => $log->estanteDestino->id,
                        'codigo_etiqueta' => $log->estanteDestino->codigo_etiqueta,
                    ] : null,
                ];
            });

            return response()->json([
                'message' => 'Bitacora de auditoria obtenida correctamente',
                'data' => $transformedData,
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                    'last_page' => $logs->lastPage(),
                    'from' => $logs->firstItem(),
                    'to' => $logs->lastItem(),
                ],
                'filters' => $filterOptions,
            ], 200);
        } catch (\Throwable $exception) {
            \Log::error('Error al obtener la bitacora de auditoria', [
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ]);

            return response()->json([
                'message' => 'Error al obtener la bitacora de auditoria',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }
}
