<?php

namespace App\Services;

use App\Models\OrdenSurtido;
use App\Models\DetalleSurtido;
use App\Models\DetalleSurtidoUbicacion;
use App\Models\Estante;
use App\Models\Inventario;
use App\Models\AuditLog;
use App\Models\EstadoOrden;
use Illuminate\Support\Facades\DB;
use Exception;

/**
 * PickingService
 * 
 * Motor de Picking para aplicación móvil.
 * Implementa:
 * - Lista de Recolección Sugerida (por producto, sin FIFO)
 * - Validación de Ubicación con Override Dinámico
 */
class PickingService
{
    /**
     * Obtiene la lista de recolección sugerida para una orden.
     * 
     * Analiza cada detalle de la orden y sugiere los estantes donde
     * hay stock disponible del producto. No respeta FIFO, solo busca
     * ubicaciones con cantidad > 0.
     * 
     * @param int $ordenId ID de la orden de surtido
     * @return OrdenSurtido Orden con estructura de ubicaciones_sugeridas
     * @throws Exception Si la orden no existe
     */
    public function getSuggestedPickingList(int $ordenId): OrdenSurtido
    {
        // Obtener orden con detalles y relaciones
        $orden = OrdenSurtido::with([
            'estado',
            'prioridad',
            'capturista',
            'almacenista',
            'detalles.producto',
            'detalles.ubicaciones.estante',  // ✨ NUEVO: Ubicaciones recolectadas
            'detalles.ubicaciones.usuario',  // ✨ NUEVO: Usuario que hizo el pick
        ])->findOrFail($ordenId);

        \Log::info('📦 Generando lista de picking sugerida para orden:', [
            'orden_id' => $ordenId,
            'folio' => $orden->folio,
            'detalles_count' => $orden->detalles->count(),
        ]);

        // Mapear detalles con ubicaciones sugeridas
        $orden->detalles->each(function (DetalleSurtido $detalle) {
            // Encontrar todos los estantes con stock del producto
            $ubicacionesSugeridas = Inventario::where('producto_id', $detalle->producto_id)
                ->where('cantidad', '>', 0)
                ->with('estante')
                ->get()
                ->map(function (Inventario $inv) {
                    return [
                        'estante_id' => $inv->estante_id,
                        'estante_codigo' => $inv->estante?->codigo_etiqueta,
                        'cantidad_disponible' => (float)$inv->cantidad,
                        'estado' => $inv->estado?->nombre,
                    ];
                })
                ->values();

            // Agregar ubicaciones sugeridas al detalle
            $detalle->ubicaciones_sugeridas = $ubicacionesSugeridas;

            \Log::debug('📍 Ubicaciones sugeridas para producto:', [
                'producto_id' => $detalle->producto_id,
                'producto_nombre' => $detalle->producto?->nombre,
                'ubicaciones_count' => $ubicacionesSugeridas->count(),
            ]);
        });

        \Log::info('✅ Lista de picking sugerida generada correctamente', [
            'orden_id' => $ordenId,
        ]);

        return $orden;
    }

    /**
     * Confirma un pick (recolección) de un producto desde una ubicación específica.
     * 
     * VALIDACIÓN CRÍTICA:
     * 1. Verifica que el estante escaneado tenga el producto con stock suficiente.
     * 2. Si no hay stock, lanza Exception HTTP 400.
     * 3. Si hay stock, descuenta la cantidad del inventario.
     * 
     * LÓGICA DE OVERRIDE:
     * - El sistema confía ciegamente en el estante_id_escaneado.
     * - Si es distinto al sugerido, se descuenta del escaneado.
     * - Esto permite al usuario hacer override dinámico en el sitio.
     * 
     * @param int $ordenId ID de la orden
     * @param array $pickData Contiene: producto_id, estante_id_escaneado, cantidad_tomada
     * @return array Confirmación con detalles actualizados
     * @throws Exception Si hay error de validación o stock insuficiente
     */
    public function confirmPick(int $ordenId, array $pickData): array
    {
        $productoId = $pickData['producto_id'] ?? null;
        $estanteIdEscaneado = $pickData['estante_id_escaneado'] ?? null;
        $cantidadTomada = $pickData['cantidad_tomada'] ?? 0;

        // Validaciónes básicas
        if (!$productoId || !$estanteIdEscaneado || $cantidadTomada <= 0) {
            throw new Exception('Parámetros inválidos: producto_id, estante_id_escaneado y cantidad_tomada son requeridos.', 400);
        }

        \Log::info('🔍 Iniciando confirmación de pick:', [
            'orden_id' => $ordenId,
            'producto_id' => $productoId,
            'estante_id_escaneado' => $estanteIdEscaneado,
            'cantidad_tomada' => $cantidadTomada,
        ]);

        // VALIDACIÓN CRÍTICA: Verificar stock en la ubicación escaneada
        $inventarioEscaneado = Inventario::where('producto_id', $productoId)
            ->where('estante_id', $estanteIdEscaneado)
            ->first();

        if (!$inventarioEscaneado) {
            \Log::warning('❌ Producto no encontrado en ubicación escaneada:', [
                'producto_id' => $productoId,
                'estante_id' => $estanteIdEscaneado,
            ]);
            throw new Exception('Producto no encontrado en la ubicación escaneada.', 400);
        }

        if ($inventarioEscaneado->cantidad < $cantidadTomada) {
            \Log::warning('❌ Stock insuficiente en ubicación escaneada:', [
                'producto_id' => $productoId,
                'estante_id' => $estanteIdEscaneado,
                'cantidad_requerida' => $cantidadTomada,
                'cantidad_disponible' => $inventarioEscaneado->cantidad,
            ]);
            throw new Exception(
                "Stock insuficiente en la ubicación escaneada. "
                . "Requerido: {$cantidadTomada}, Disponible: {$inventarioEscaneado->cantidad}",
                400
            );
        }

        // TRANSACCIÓN: Descontar inventario
        return DB::transaction(function () use (
            $ordenId,
            $productoId,
            $estanteIdEscaneado,
            $cantidadTomada,
            $inventarioEscaneado
        ) {
            // Descontar cantidad del inventario
            $cantidadActual = $inventarioEscaneado->cantidad;
            $cantidadNueva = $cantidadActual - $cantidadTomada;

            $inventarioEscaneado->update([
                'cantidad' => $cantidadNueva,
            ]);

            // Buscar o actualizar el detalle de la orden para este producto
            $detalle = DetalleSurtido::where('orden_surtido_id', $ordenId)
                ->where('producto_id', $productoId)
                ->first();

            if ($detalle) {
                $cantidadSurtidaActual = $detalle->cantidad_surtida ?? 0;
                $cantidadSurtidaNueva = $cantidadSurtidaActual + $cantidadTomada;  // ✨ ACUMULA
                $cantidadMaxima = $detalle->cantidad_requerida;

                // ✨ NUEVA VALIDACIÓN: Prevenir sobre-picking
                // No permitir que la cantidad surtida EXCEDA la cantidad requerida
                if ($cantidadSurtidaNueva > $cantidadMaxima) {
                    $exceso = $cantidadSurtidaNueva - $cantidadMaxima;
                    $faltante = $cantidadMaxima - $cantidadSurtidaActual;
                    
                    \Log::warning('⚠️ Intento de sobre-picking rechazado:', [
                        'orden_id' => $ordenId,
                        'detalle_id' => $detalle->id,
                        'producto_id' => $productoId,
                        'cantidad_requerida' => $cantidadMaxima,
                        'cantidad_surtida_actual' => $cantidadSurtidaActual,
                        'faltante' => $faltante,
                        'cantidad_solicitada' => $cantidadTomada,
                        'cantidad_total_seria' => $cantidadSurtidaNueva,
                        'exceso' => $exceso,
                    ]);

                    throw new Exception(
                        "No se puede recoger más de lo requerido. "
                        . "Esta orden requiere {$cantidadMaxima} unidades, "
                        . "ya se han recolectado {$cantidadSurtidaActual}, "
                        . "faltante: {$faltante}, pero intenta tomar {$cantidadTomada} (exceso: {$exceso})",
                        400
                    );
                }

                $estanteSugeridoId = $detalle->estante_sugerido_id;
                $fueOverride = $estanteIdEscaneado != ($estanteSugeridoId ?? null);

                $detalle->update([
                    'cantidad_surtida' => $cantidadSurtidaNueva,  // ✨ Acumulada
                    'estante_real_id' => $estanteIdEscaneado,  // Último estante (legacy)
                    'fue_modificado' => $fueOverride,
                ]);

                // ✨ NUEVO: Registrar en tabla pivot para trazabilidad
                DetalleSurtidoUbicacion::create([
                    'detalle_surtido_id' => $detalle->id,
                    'estante_id' => $estanteIdEscaneado,
                    'cantidad_tomada' => $cantidadTomada,
                    'user_id' => auth()->id(),
                    'created_at' => now(),
                ]);

                \Log::info('📍 Pick registrado en tabla pivot', [
                    'detalle_id' => $detalle->id,
                    'estante_id' => $estanteIdEscaneado,
                    'cantidad_tomada' => $cantidadTomada,
                ]);

                // ✨ Registrar en audit_logs para trazabilidad en bitácora
                $tipoMov = $fueOverride ? 'picking_override' : 'picking';
                $obsTexto = $fueOverride
                    ? "Override de picking: se tomaron {$cantidadTomada} unidades del estante #{$estanteIdEscaneado} (sugerido: #{$estanteSugeridoId})"
                    : "Picking confirmado: se tomaron {$cantidadTomada} unidades del estante #{$estanteIdEscaneado}";

                AuditLog::create([
                    'detalle_surtido_id' => $detalle->id,
                    'user_id'            => auth()->id(),
                    'estante_origen_id'  => $estanteIdEscaneado,
                    'estante_destino_id' => null,
                    'tipo_movimiento'    => $tipoMov,
                    'cantidad_anterior'  => (int) $cantidadActual,
                    'cantidad_nueva'     => (int) $cantidadNueva,
                    'observaciones'      => $obsTexto,
                    'fecha_hora'         => now(),
                ]);

                // ✨ NUEVO: Validar completitud automática
                $this->validateAndUpdateOrderCompletion($detalle);

                if ($fueOverride) {
                    $estanteSugeridoCodigo = null;
                    $estanteEscaneadoCodigo = null;

                    if ($estanteSugeridoId) {
                        $estanteSugeridoCodigo = Estante::query()
                            ->where('id', $estanteSugeridoId)
                            ->value('codigo_etiqueta');
                    }

                    $estanteEscaneadoCodigo = Estante::query()
                        ->where('id', $estanteIdEscaneado)
                        ->value('codigo_etiqueta');

                    $activity = activity('picking')
                        ->performedOn($detalle)
                        ->withProperties([
                            'orden_id' => $ordenId,
                            'producto_id' => $productoId,
                            'old' => [
                                'estante_sugerido_id' => $estanteSugeridoId,
                                'estante_sugerido_codigo' => $estanteSugeridoCodigo,
                            ],
                            'attributes' => [
                                'estante_escaneado_id' => $estanteIdEscaneado,
                                'estante_escaneado_codigo' => $estanteEscaneadoCodigo,
                                'cantidad_tomada' => $cantidadTomada,
                            ],
                        ])
                        ->event('override');

                    if (auth()->check()) {
                        $activity->causedBy(auth()->user());
                    }

                    $activity->log('Override de Picking ejecutado');
                }

                \Log::info('✅ Pick confirmado exitosamente:', [
                    'orden_id' => $ordenId,
                    'producto_id' => $productoId,
                    'estante_escaneado' => $estanteIdEscaneado,
                    'cantidad_tomada' => $cantidadTomada,
                    'inventario_anterior' => $cantidadActual,
                    'inventario_nuevo' => $cantidadNueva,
                    'surtida_anterior' => $cantidadSurtidaActual,
                    'surtida_nueva' => $cantidadSurtidaNueva,
                ]);
            }

            // ✨ NUEVO: Recargar relaciones para la respuesta
            $detalle->load([
                'ubicaciones.estante',
                'ubicaciones.usuario',
                'ordenSurtido.detalles',
                'producto',
            ]);

            $orden = $detalle->ordenSurtido;

            // Verificar si TODA la orden está completa
            $todosLosDetallesCompletos = $orden->detalles->every(function ($d) {
                return $d->cantidad_surtida >= $d->cantidad_requerida;
            });

            // Construir datos de ubicaciones recolectadas
            $ubicacionesRecolectadas = $detalle->ubicaciones
                ->map(function (DetalleSurtidoUbicacion $ub) {
                    return [
                        'inventario_id' => $ub->id,
                        'estante_id' => $ub->estante_id,
                        'estante_codigo' => $ub->estante?->codigo_etiqueta,
                        'cantidad_tomada' => (float)$ub->cantidad_tomada,
                        'usuario_id' => $ub->user_id,
                        'usuario_nombre' => $ub->usuario?->name,
                        'timestamp' => $ub->created_at?->format('Y-m-d H:i:s'),
                    ];
                })
                ->values();

            return [
                'success' => true,
                'message' => 'Pick confirmado exitosamente',
                'data' => [
                    'orden_id' => $ordenId,
                    'detalle' => [
                        'id' => $detalle->id,
                        'producto_id' => $productoId,
                        'cantidad_requerida' => (float)$detalle->cantidad_requerida,
                        'cantidad_surtida' => (float)$detalle->cantidad_surtida,  // ✨ Acumulada
                        'es_completo' => $detalle->cantidad_surtida >= $detalle->cantidad_requerida,  // ✨ Nuevo
                        'ubicaciones_recolectadas' => $ubicacionesRecolectadas,  // ✨ Nuevo
                        'orden_estado' => [
                            'id' => $orden->estado_id,
                            'nombre' => $orden->estado->nombre ?? 'Desconocido',
                            'incompleta' => !$todosLosDetallesCompletos,
                            'completa' => $todosLosDetallesCompletos,
                            'items_completos' => $orden->detalles
                                ->filter(fn($d) => $d->cantidad_surtida >= $d->cantidad_requerida)
                                ->count(),
                            'items_totales' => $orden->detalles->count(),
                        ],
                    ],
                    'inventario' => [
                        'anterior' => (float)$cantidadActual,
                        'nuevo' => (float)$cantidadNueva,
                    ],
                ],
            ];
        });
    }

    /**
     * ✨ NUEVO: Valida si un detalle está completo y actualiza estado de orden automáticamente
     * 
     * Lógica:
     * 1. Si detalle RECIÉN completó (cantidad_surtida >= cantidad_requerida)
     * 2. Verifica si TODOS los detalles de la orden están completos
     * 3. Si sí → Cambia orden a COMPLETADA
     * 
     * @param DetalleSurtido $detalle
     * @return void
     */
    private function validateAndUpdateOrderCompletion(DetalleSurtido $detalle): void
    {
        try {
            // Recargar detalle con orden y asegurarse de validar
            $detalle->load('ordenSurtido.detalles');
            $orden = $detalle->ordenSurtido;

            // Verificar si el detalle está completamente surtido
            $estaCompleto = $detalle->cantidad_surtida >= $detalle->cantidad_requerida;

            if (!$estaCompleto) {
                return; // Detalle aún incompleto, salir
            }

            \Log::info('✅ Detalle completado', [
                'detalle_id' => $detalle->id,
                'cantidad' => $detalle->cantidad_surtida,
            ]);

            // Verificar si TODOS los detalles están completos
            $todosCompletos = $orden->detalles->every(function ($d) {
                return $d->cantidad_surtida >= $d->cantidad_requerida;
            });

            if ($todosCompletos) {
                // Cambiar estado a COMPLETADA (estado_id = 3)
                $estadoCompletada = EstadoOrden::where('nombre', 'Completada')
                    ->orWhere('nombre', 'COMPLETADA')
                    ->first();

                if ($estadoCompletada) {
                    $orden->update(['estado_id' => $estadoCompletada->id]);

                    \Log::info('🎉 Orden completada automáticamente', [
                        'orden_id' => $orden->id,
                        'folio' => $orden->folio,
                        'timestamp' => now(),
                    ]);

                    // Registrar en activity logs si está disponible
                    if (method_exists($orden, 'activity') && method_exists('activity', '__invoke')) {
                        activity('picking')
                            ->performedOn($orden)
                            ->withProperties(['tipo' => 'auto_completion'])
                            ->log('Orden completada automáticamente al confirmar último pick');
                    }
                }
            }

        } catch (\Exception $e) {
            \Log::error('❌ Error validando completitud de orden', [
                'detalle_id' => $detalle->id ?? null,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
