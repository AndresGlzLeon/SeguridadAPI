<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\OrdenSurtido;
use App\Models\DetalleSurtido;
use App\Models\EstadoOrden;
use App\Models\PrioridadOrden;
use App\Models\Estante;
use App\Models\User;
use App\Models\Producto;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class OrdenesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * ========================================================================
     * 30 ÓRDENES PARA TESTING COMPLETO DEL MOTOR DE PICKING
     * ========================================================================
     * 
     * Genera 30 órdenes de picking con escenarios realistas:
     * 
     * DISTRIBUCIÓN POR ESTADO:
     * - 10 órdenes: "Pendiente" (listos para iniciar picking)
     * - 12 órdenes: "En Progreso" (con picks parciales y algunos overrides)
     * - 8 órdenes: "Completada" (con picks completos, múltiples overrides)
     * 
     * ESCENARIOS DE OVERRIDE INCLUIDOS:
     * - ~15-20% de órdenes con estante_real_id ≠ estante_sugerido_id
     * - Esto simula almacenista que escanea ubicación diferente durante picking
     * - Valida que el sistema registre correctamente la ubicación real
     * 
     * DETALLES POR ORDEN:
     * - 3-4 detalles (líneas de picking) por orden
     * - Total: 30 órdenes × 3.5 detalles promedio = ~105 líneas de picking
     * 
     * DATOS GENERADOS:
     * - Totales: 30 órdenes, ~105 detalles de picking
     * - Overrides: ~15-20 detalles con estante_real_id diferente
     * - Almacenistas: Asignados aleatoriamente para simular equipo de picking
     */
    public function run(): void
    {
        \Log::info('📋 ========== INICIANDO GENERACIÓN DE 30 ÓRDENES DE PICKING ==========');

        $estados = EstadoOrden::all();
        $prioridades = PrioridadOrden::all();
        $productos = Producto::all();
        $usuarios = User::all();
        $estantes = Estante::all();

        // Validaciones de dependencias
        if ($estados->isEmpty() || $prioridades->isEmpty()) {
            \Log::warning('⚠️ No existen estados u prioridades de órdenes');
            return;
        }

        if ($usuarios->isEmpty() || $productos->isEmpty() || $estantes->isEmpty()) {
            \Log::warning('⚠️ No existen usuarios, productos o estantes');
            return;
        }

        // Obtener estados principales
        $estadoPendiente = $estados->firstWhere('nombre', 'Pendiente') ?? $estados->first();
        $estadoEnProgreso = $estados->firstWhere('nombre', 'En Progreso') ?? $estados->skip(1)->first();
        $estadoCompletada = $estados->firstWhere('nombre', 'Completada') ?? $estados->skip(2)->first();

        \Log::info('🎯 Configuración de 30 órdenes:', [
            'estados_disponibles' => $estados->count(),
            'usuarios' => $usuarios->count(),
            'productos' => $productos->count(),
            'estantes' => $estantes->count(),
        ]);

        $detallesCreados = 0;
        $overridesCreados = 0;

        // ==================== GRUPO 1: 10 ÓRDENES PENDIENTES ====================
        \Log::info('🔵 GRUPO 1: Creando 10 órdenes PENDIENTE...');
        
        for ($i = 1; $i <= 10; $i++) {
            $this->crearOrden(
                $i,
                $estadoPendiente,
                $prioridades,
                $productos,
                $usuarios,
                $estantes,
                false,
                $detallesCreados,
                $overridesCreados
            );
        }

        // ==================== GRUPO 2: 12 ÓRDENES EN PROGRESO ====================
        \Log::info('🟡 GRUPO 2: Creando 12 órdenes EN_PROGRESO (con overrides parciales)...');
        
        for ($i = 11; $i <= 22; $i++) {
            // 30% de estas órdenes tendrán overrides
            $conOverride = rand(1, 100) <= 30;
            
            $this->crearOrden(
                $i,
                $estadoEnProgreso,
                $prioridades,
                $productos,
                $usuarios,
                $estantes,
                $conOverride,
                $detallesCreados,
                $overridesCreados
            );
        }

        // ==================== GRUPO 3: 8 ÓRDENES COMPLETADAS ====================
        \Log::info('🟢 GRUPO 3: Creando 8 órdenes COMPLETADA (con overrides registrados)...');
        
        for ($i = 23; $i <= 30; $i++) {
            // 50% de estas órdenes tendrán overrides (porque están completadas)
            $conOverride = rand(1, 100) <= 50;
            
            $this->crearOrden(
                $i,
                $estadoCompletada,
                $prioridades,
                $productos,
                $usuarios,
                $estantes,
                $conOverride,
                $detallesCreados,
                $overridesCreados
            );
        }

        \Log::info('✅ ========== GENERACIÓN COMPLETADA ==========', [
            'total_ordenes' => 30,
            'total_detalles' => $detallesCreados,
            'detalles_con_override' => $overridesCreados,
            'porcentaje_override' => round(($overridesCreados / $detallesCreados) * 100, 2) . '%',
        ]);
    }

    /**
     * Crea una orden individual con sus detalles
     */
    private function crearOrden(
        int $numero,
        $estado,
        $prioridades,
        $productos,
        $usuarios,
        $estantes,
        bool $conOverride,
        &$detallesCreados,
        &$overridesCreados
    ): void {
        $folio = 'ORD-' . str_pad((string)$numero, 4, '0', STR_PAD_LEFT);
        $capturista = $usuarios->first();
        $almacenista = $usuarios->random();
        $prioridad = $prioridades->random();

        $orden = OrdenSurtido::create([
            'folio' => $folio,
            'capturista_id' => $capturista->id,
            'almacenista_id' => $almacenista->id,
            'referencia_destino' => "Despacho {$numero}",
            'estado_id' => $estado->id,
            'prioridad_id' => $prioridad->id,
            'fecha_requerida' => Carbon::now()->addDays(random_int(1, 7)),
        ]);

        // 3-4 detalles por orden
        $numDetalles = random_int(3, 4);
        $productosSeleccionados = $productos->random($numDetalles);

        foreach ($productosSeleccionados as $producto) {
            $cantidadRequerida = random_int(5, 30);
            $estanteSugerido = $estantes->random();

            // Los detalles completados podrían tener estante_real_id
            $estanteReal = null;
            $cantidadSurtida = 0;
            $fueModificado = false;

            if ($estado->nombre === 'En Progreso' || $estado->nombre === 'Completada') {
                $cantidadSurtida = $cantidadRequerida; // O parcial, pero simplificamos
                
                // Simular override: 30-50% de probabilidad en órdenes en progreso/completadas
                if ($conOverride && rand(1, 100) <= 60) {
                    $estanteReal = $estantes->random();
                    // Asegurar que es diferente del sugerido
                    while ($estanteReal->id === $estanteSugerido->id && $estantes->count() > 1) {
                        $estanteReal = $estantes->random();
                    }
                    $fueModificado = true;
                    $overridesCreados++;
                } else {
                    $estanteReal = $estanteSugerido;
                }
            }

            $detalle = DetalleSurtido::create([
                'orden_surtido_id' => $orden->id,
                'producto_id' => $producto->id,
                'cantidad_requerida' => $cantidadRequerida,
                'cantidad_surtida' => $cantidadSurtida,
                'estante_sugerido_id' => $estanteSugerido->id,
                'estante_real_id' => $estanteReal?->id,
                'fue_modificado' => $fueModificado,
            ]);

            $detallesCreados++;

            \Log::debug("  ├─ Detalle #{$detallesCreados}", [
                'producto' => $producto->sku,
                'cantidad' => $cantidadRequerida,
                'sugerido' => $estanteSugerido->codigo_etiqueta,
                'real' => $estanteReal?->codigo_etiqueta ?? 'N/A',
                'override' => $fueModificado ? 'SÍ' : 'NO',
            ]);
        }

        $estadoLabel = match ($estado->nombre) {
            'Pendiente' => '🔵',
            'En Progreso' => '🟡',
            'Completada' => '🟢',
            default => '⚪',
        };

        \Log::info("{$estadoLabel} Orden #{$numero}", [
            'folio' => $folio,
            'estado' => $estado->nombre,
            'almacenista' => $almacenista->name,
            'prioridad' => $prioridad->nombre,
            'detalles' => $numDetalles,
            'con_overrides' => $conOverride ? 'SÍ' : 'NO',
        ]);
    }
}

