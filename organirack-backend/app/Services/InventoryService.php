<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditLog;
use App\Models\DetalleSurtido;
use App\Models\Estante;
use App\Models\Producto;
use App\Models\Inventario;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Procesa un override (modificación de ubicación de origen) en el inventario.
     *
     * @param string $sku SKU del producto a mover
     * @param string $codigoEstante Código del estante de origen desde donde se toma el material
     * @param int $cantidad Cantidad del material tomado
     * @param int $usuarioId ID del usuario que realiza el override
     * @param int $detalleSurtidoId ID del detalle de surtido que se está modificando
     *
     * @throws Exception Si hay problemas en la lógica del negocio
     *
     * @return array Array con datos del movimiento registrado
     */
    public function processOverride(
        string $sku,
        string $codigoEstante,
        int $cantidad,
        int $usuarioId,
        int $detalleSurtidoId
    ): array {
        return DB::transaction(function () use ($sku, $codigoEstante, $cantidad, $usuarioId, $detalleSurtidoId) {
            // ============== VALIDACIONES INICIALES ==============

            // Validar que la cantidad sea positiva
            if ($cantidad <= 0) {
                throw new Exception('La cantidad debe ser mayor a 0.');
            }

            // ============== BÚSQUEDA DE MODELOS ==============

            // a) Buscar el producto por SKU
            $producto = Producto::porSku($sku)->activos()->first();
            if (!$producto) {
                throw new Exception(
                    "Producto con SKU '{$sku}' no encontrado o está inactivo."
                );
            }

            // b) Buscar el estante por código
            $estante = Estante::porCodigo($codigoEstante)->first();
            if (!$estante) {
                throw new Exception(
                    "Estante con código '{$codigoEstante}' no encontrado."
                );
            }

            // Validar que el usuario exista
            $usuario = User::find($usuarioId);
            if (!$usuario) {
                throw new Exception("Usuario con ID {$usuarioId} no encontrado.");
            }

            // Validar que el detalle de surtido exista
            $detalleSurtido = DetalleSurtido::find($detalleSurtidoId);
            if (!$detalleSurtido) {
                throw new Exception(
                    "Detalle de surtido con ID {$detalleSurtidoId} no encontrado."
                );
            }

            // ============== VALIDACIÓN DE STOCK ==============

            // c) Validar que el estante exista y tenga stock suficiente
            if (!$estante->exists) {
                throw new Exception(
                    "El estante {$estante->codigo_etiqueta} no existe en el sistema."
                );
            }

            // ============== ACTUALIZAR DETALLE DE SURTIDO ==============

            // d) Actualizar el registro en detalles_surtido:
            // - Cambiar estante_real_id al nuevo estante escaneado
            // - Marcar fue_modificado como true
            $detalleSurtido->update([
                'estante_real_id' => $estante->id,
                'fue_modificado' => true,
            ]);

            // ============== REGISTRAR EN AUDIT LOG ==============

            // e) Registrar el movimiento en AuditLog con trazabilidad completa
            $auditLog = AuditLog::create([
                'detalle_surtido_id' => $detalleSurtidoId,
                'user_id' => $usuarioId,
                'estante_origen_id' => $estante->id,
                'estante_destino_id' => null,
                'tipo_movimiento' => 'override',
                'cantidad_anterior' => 0,
                'cantidad_nueva' => $cantidad,
                'observaciones' => "Override: {$cantidad} unidades de {$producto->nombre} ({$sku}) desde {$estante->codigo_etiqueta}",
                'fecha_hora' => now(),
            ]);

            // ============== RETORNAR RESPUESTA ==============

            return [
                'success' => true,
                'message' => "Override registrado exitosamente.",
                'data' => [
                    'audit_log_id' => $auditLog->id,
                    'detalle_surtido_id' => $detalleSurtidoId,
                    'producto_sku' => $producto->sku,
                    'producto_nombre' => $producto->nombre,
                    'estante_codigo' => $estante->codigo_etiqueta,
                    'cantidad_movida' => $cantidad,
                    'fue_modificado' => true,
                    'usuario_id' => $usuarioId,
                    'timestamp' => $auditLog->fecha_hora,
                ],
            ];
        });
    }

    /**
     * Establece o sobrescribe la cantidad de inventario en una ubicación.
     * Genera registros de auditoría si hay diferencia.
     */
    public function setManualStock(
        int $productoId,
        int $estanteId,
        int $estadoId,
        float $cantidad,
        int $usuarioId
    ): array {
        return DB::transaction(function () use ($productoId, $estanteId, $estadoId, $cantidad, $usuarioId) {
            if ($cantidad < 0) {
                throw new Exception('La cantidad no puede ser negativa.');
            }

            $producto = Producto::find($productoId);
            if (!$producto) throw new Exception('Producto no encontrado.');

            $estante = Estante::find($estanteId);
            if (!$estante) throw new Exception('Estante no encontrado.');

            $inventario = Inventario::where('producto_id', $productoId)
                ->where('estante_id', $estanteId)
                ->where('estado_id', $estadoId)
                ->first();

            $cantidadAnterior = $inventario ? $inventario->cantidad : 0;

            if ($cantidad === $cantidadAnterior) {
                return [
                    'success' => true,
                    'message' => 'El stock actual es igual a la cantidad ingresada. No hubo cambios.',
                    'data' => ['cantidad' => $cantidad]
                ];
            }

            $inventario = Inventario::updateOrCreate(
                [
                    'producto_id' => $productoId,
                    'estante_id' => $estanteId,
                    'estado_id' => $estadoId,
                ],
                [
                    'cantidad' => $cantidad
                ]
            );

            $tipoMovimiento = 'ajuste_manual';
            if ($cantidad == 0) {
                $tipoMovimiento = 'vaciado_manual';
            }

            AuditLog::create([
                'detalle_surtido_id' => null,
                'user_id' => $usuarioId,
                'estante_origen_id' => $estante->id,
                'estante_destino_id' => null,
                'tipo_movimiento' => $tipoMovimiento,
                'cantidad_anterior' => $cantidadAnterior,
                'cantidad_nueva' => $cantidad,
                'observaciones' => "Ajuste manual de inventario: pasó de {$cantidadAnterior} a {$cantidad}",
                'fecha_hora' => now(),
            ]);

            return [
                'success' => true,
                'message' => 'Stock actualizado correctamente.',
                'data' => [
                    'inventario_id' => $inventario->id,
                    'cantidad_anterior' => $cantidadAnterior,
                    'cantidad_nueva' => $cantidad
                ]
            ];
        });
    }
}
