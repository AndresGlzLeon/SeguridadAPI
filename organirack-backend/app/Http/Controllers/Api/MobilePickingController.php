<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PickingService;
use App\Models\OrdenSurtido;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * MobilePickingController
 * 
 * API REST para la aplicación móvil de picking.
 * Endpoints para:
 * - Obtener órdenes asignadas al almacenista
 * - Obtener lista de recolección sugerida
 * - Confirmar picks (recolecciones)
 */
class MobilePickingController extends Controller
{
    /**
     * Inyectar PickingService
     */
    public function __construct(private PickingService $pickingService) {}

    /**
     * Obtiene todas las órdenes asignadas al almacenista autenticado.
     * GET /api/mobile/picking/orders
     * 
     * @return JsonResponse
     */
    public function getOrders(): JsonResponse
    {
        try {
            $userId = auth()->id();

            \Log::info('📱 Solicitud móvil: Obtener órdenes del almacenista', [
                'user_id' => $userId,
            ]);

            // Obtener órdenes del almacenista autenticado (pendientes o en proceso)
            $ordenes = OrdenSurtido::where('almacenista_id', $userId)
                ->whereIn('estado_id', [1, 2]) // 1: Pendiente, 2: En proceso
                ->with([
                    'estado',
                    'prioridad',
                    'capturista',
                    'almacenista',
                    'detalles.producto',
                    'detalles.estanteSugerido',
                    'detalles.ubicaciones.estante',  // ✨ NUEVO: Ubicaciones recolectadas
                    'detalles.ubicaciones.usuario',  // ✨ NUEVO: Usuario que hizo el pick
                ])
                ->orderBy('created_at', 'desc')
                ->get();

            \Log::info('✅ Órdenes obtenidas correctamente', [
                'usuario_id' => $userId,
                'total_ordenes' => $ordenes->count(),
            ]);

            return response()->json([
                'message' => 'Órdenes obtenidas correctamente',
                'data' => $ordenes,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('❌ Error al obtener órdenes del almacenista:', [
                'user_id' => auth()->id(),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Error al obtener órdenes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene la lista de recolección sugerida para una orden.
     * GET /api/mobile/picking/{ordenId}/sugerencias
     * 
     * @param int $ordenId ID de la orden de surtido
     * @return JsonResponse
     */
    public function getSuggestions(int $ordenId): JsonResponse
    {
        try {
            \Log::info('📱 Solicitud móvil: Obtener sugerencias de picking', [
                'orden_id' => $ordenId,
                'user_id' => auth()->id(),
            ]);

            $orden = $this->pickingService->getSuggestedPickingList($ordenId);

            return response()->json([
                'message' => 'Lista de picking sugerida obtenida correctamente',
                'data' => $orden,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            \Log::warning('⚠️ Orden de surtido no encontrada', [
                'orden_id' => $ordenId,
            ]);

            return response()->json([
                'message' => 'Orden de surtido no encontrada',
                'error' => 'NOT_FOUND',
            ], 404);

        } catch (\Exception $e) {
            \Log::error('❌ Error al obtener lista de picking:', [
                'orden_id' => $ordenId,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Error al obtener lista de picking',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Confirma un pick (recolección) de un producto.
     * POST /api/mobile/picking/{ordenId}/confirmar
     * 
     * Body (JSON):
     * {
     *   "producto_id": 1,
     *   "estante_id_escaneado": 5,
     *   "cantidad_tomada": 10
     * }
     * 
     * @param int $ordenId ID de la orden de surtido
     * @param Request $request
     * @return JsonResponse
     */
    public function confirmPick(int $ordenId, Request $request): JsonResponse
    {
        try {
            // Validación de entrada
            $validated = $request->validate([
                'producto_id' => 'required|integer|exists:productos,id',
                'estante_id_escaneado' => 'required|integer|exists:estantes,id',
                'cantidad_tomada' => 'required|numeric|min:0.01',
            ], [
                'producto_id.required' => 'ID del producto es requerido',
                'producto_id.exists' => 'Producto no encontrado',
                'estante_id_escaneado.required' => 'ID del estante es requerido',
                'estante_id_escaneado.exists' => 'Estante no encontrado',
                'cantidad_tomada.required' => 'Cantidad tomada es requerida',
                'cantidad_tomada.min' => 'Cantidad debe ser mayor a 0',
            ]);

            \Log::info('📱 Solicitud móvil: Confirmar pick', [
                'orden_id' => $ordenId,
                'user_id' => auth()->id(),
                'producto_id' => $validated['producto_id'],
                'estante_id' => $validated['estante_id_escaneado'],
                'cantidad' => $validated['cantidad_tomada'],
            ]);

            // Llamar al servicio de picking
            $resultado = $this->pickingService->confirmPick($ordenId, $validated);

            // NOTA: El PickingService ya se encarga de validar completitud automáticamente
            // y marcar la orden como COMPLETADA si es necesario. No necesitamos llamar a
            // checkAndUpdateOrderStatus() nuevamente.

            return response()->json([
                'message' => $resultado['message'],
                'data' => $resultado['data'],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('⚠️ Validación fallida en confirmación de pick', [
                'orden_id' => $ordenId,
                'errors' => $e->errors(),
            ]);

            return response()->json([
                'message' => 'Datos de validación inválidos',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            // Asegurar que $statusCode sea un entero válido para HTTP
            $statusCode = 500;
            $code = $e->getCode();
            
            // Si es un código HTTP válido (entre 100 y 599), usarlo
            if (is_int($code) && $code >= 100 && $code <= 599) {
                $statusCode = $code;
            }

            // Si es una excepción HTTP 400 (stock insuficiente), returnar 400
            if ($statusCode === 400) {
                \Log::warning('⚠️ Error de validación de inventario:', [
                    'orden_id' => $ordenId,
                    'message' => $e->getMessage(),
                ]);

                return response()->json([
                    'message' => $e->getMessage(),
                    'error' => 'INSUFFICIENT_STOCK',
                ], 400);
            }

            \Log::error('❌ Error al confirmar pick:', [
                'orden_id' => $ordenId,
                'message' => $e->getMessage(),
                'code' => $code,
                'http_status' => $statusCode,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Error al confirmar pick',
                'error' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * Marca una orden como "En Proceso" si aún no lo está.
     * POST /api/mobile/picking/{ordenId}/marcar-en-proceso
     * 
     * @param int $ordenId ID de la orden de surtido
     * @return JsonResponse
     */
    public function markAsInProgress(int $ordenId): JsonResponse
    {
        try {
            \Log::info('📱 Marcar orden como En Proceso', [
                'orden_id' => $ordenId,
                'user_id' => auth()->id(),
            ]);

            $orden = OrdenSurtido::findOrFail($ordenId);

            // Si no está en proceso (estado_id = 2), cambiar a en proceso
            if ($orden->estado_id != 2) {
                $estadoAnterior = $orden->estado_id;
                $orden->update(['estado_id' => 2]); // 2 = En Proceso
                
                \Log::info('✅ Orden marcada como En Proceso', [
                    'orden_id' => $ordenId,
                    'estado_anterior' => $estadoAnterior,
                ]);

                return response()->json([
                    'message' => 'Orden marcada como En Proceso',
                    'data' => $orden,
                ], 200);
            }

            return response()->json([
                'message' => 'Orden ya está En Proceso',
                'data' => $orden,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            \Log::warning('⚠️ Orden no encontrada para marcar como En Proceso', [
                'orden_id' => $ordenId,
            ]);

            return response()->json([
                'message' => 'Orden no encontrada',
                'error' => 'NOT_FOUND',
            ], 404);

        } catch (\Exception $e) {
            \Log::error('❌ Error al marcar orden como En Proceso:', [
                'orden_id' => $ordenId,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Error al actualizar estado de la orden',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * FUNCIÓN PRIVADA: Verifica si una orden está completa y actualiza su estado automáticamente.
     * 
     * Lógica:
     * 1. Si la orden NO está en proceso (estado_id != 2), la cambia a En Proceso
     * 2. Si todos los detalles están surtidos (cantidad_surtida >= cantidad_requerida), cambia a Completada
     * 
     * @param int $ordenId ID de la orden de surtido
     * @return void
     */
    private function checkAndUpdateOrderStatus(int $ordenId): void
    {
        try {
            $orden = OrdenSurtido::with('detalles')->findOrFail($ordenId);

            // 1. Si no está en proceso, cambiar a en proceso
            if ($orden->estado_id != 2) {
                $orden->update(['estado_id' => 2]); // 2 = En Proceso
                \Log::info('🔄 Orden actualizada a En Proceso (automático)', [
                    'orden_id' => $ordenId,
                ]);
            }

            // 2. Verificar si todos los detalles están completamente surtidos
            $todosCompletados = $orden->detalles->every(function ($detalle) {
                return $detalle->cantidad_surtida >= $detalle->cantidad_requerida;
            });

            if ($todosCompletados && $orden->estado_id != 3) { // 3 = Completada
                $orden->update(['estado_id' => 3]); // 3 = Completada
                
                \Log::info('✅ Orden completada automáticamente', [
                    'orden_id' => $ordenId,
                    'total_detalles' => $orden->detalles->count(),
                ]);
            }

        } catch (\Exception $e) {
            \Log::error('❌ Error al verificar estado de la orden:', [
                'orden_id' => $ordenId,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
