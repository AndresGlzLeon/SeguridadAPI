<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\DetalleSurtido;
use App\Models\Estante;
use App\Models\User;
use Illuminate\Database\Seeder;

class DetallesSurtidoUbicacionesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * ========================================================================
     * DETALLES DE UBICACIONES REALES - PICKING CON OVERRIDE Y MULTIPLES SITIOS
     * ========================================================================
     * 
     * Este seeder registra en detalles_surtido_ubicaciones dónde REALMENTE
     * se tomó el inventario cuando:
     * 
     * 1. El almacenista escanea una ubicación diferente a la sugerida (OVERRIDE)
     * 2. El producto debe ser tomado de múltiples ubicaciones (PICKING COMPLEJO)
     * 3. Casos donde la ubicación sugerida no tiene stock
     * 
     * DATOS GENERADOS:
     * - ~20-30 registros de picks reales
     * - Simula almacenistas realizando picking en campo
     * - Valida que el sistema registre correctamente el audit trail
     * 
     * BENEFICIO:
     * - Tests de integridad: estante_sugerido vs estante_real
     * - Validar reportes de override/discrepancias
     * - Auditoría completa del proceso de picking
     */
    public function run(): void
    {
        \Log::info('📍 Iniciando registro de ubicaciones reales (picking con override)');

        // Obtener detalles que tienen estante_real_id (ya fueron modificados)
        $detallesConOverride = DetalleSurtido::where('fue_modificado', true)
            ->whereNotNull('estante_real_id')
            ->get();

        if ($detallesConOverride->isEmpty()) {
            \Log::info('ℹ️ No hay detalles con override para registrar ubicaciones reales');
            return;
        }

        $almacenistas = User::whereHas('roles', function ($query) {
            $query->where('name', 'Almacenista');
        })->get();

        if ($almacenistas->isEmpty()) {
            \Log::warning('⚠️ No hay almacenistas disponibles para registrar picks');
            return;
        }

        $registrosCreados = 0;

        foreach ($detallesConOverride as $detalle) {
            // Validar que tiene ubicación real
            if (!$detalle->estante_real_id) {
                continue;
            }

            // En casos complejos, podría haber múltiples ubicaciones para un mismo detalle
            // Por simplicidad, registramos la ubicación real principal
            try {
                $detalle->detallesSurtidoUbicaciones()->firstOrCreate(
                    [
                        'detalle_surtido_id' => $detalle->id,
                        'estante_id' => $detalle->estante_real_id,
                        'user_id' => $almacenistas->random()->id,
                    ],
                    [
                        'cantidad_tomada' => $detalle->cantidad_surtida,
                    ]
                );

                $registrosCreados++;

                \Log::debug('✅ Ubicación real registrada', [
                    'detalle_id' => $detalle->id,
                    'sugerida' => $detalle->estanteSugerido->codigo_etiqueta ?? 'N/A',
                    'real' => $detalle->estanteReal->codigo_etiqueta ?? 'N/A',
                    'cantidad' => $detalle->cantidad_surtida,
                ]);

            } catch (\Exception $e) {
                \Log::warning('⚠️ Error al registrar ubicación real', [
                    'detalle_id' => $detalle->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        \Log::info('✅ Ubicaciones reales registradas (picking con override)', [
            'registros_creados' => $registrosCreados,
            'total_detalles_procesados' => $detallesConOverride->count(),
            'nota' => 'Asegura audit trail completo del picking',
        ]);
    }
}
