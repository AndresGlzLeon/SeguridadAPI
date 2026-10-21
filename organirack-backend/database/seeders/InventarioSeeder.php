<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Inventario;
use App\Models\Producto;
use App\Models\Estante;
use App\Models\EstadoInventario;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class InventarioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * DISTRIBUCIÓN MASIVA Y REALISTA PARA 30 ÓRDENES
     * 
     * REGLA DE NEGOCIO PARA PICKING Y OVERRIDE:
     * - Por cada producto, crear 3-5 registros en inventarios (aumentado de 2-4)
     * - Cada registro asigna el producto a estantes DIFERENTES
     * - Esto simula stock distribuido en ubicaciones múltiples
     * - Crea escenarios complejos para validar:
     *   a) Motor de picking sugiere ubicación correcta
     *   b) Override cuando almacenista escanea ubicación diferente
     *   c) Pick parcial desde múltiples ubicaciones
     * - Todas las locaciones con estado_id = 1 (Disponible)
     * - Cantidades aleatorias: 10-100 unidades por ubicación
     * 
     * Total esperado: 50 productos × 4 ubicaciones promedio = ~200 registros
     * 
     * BENEFICIO PARA TESTING:
     * - Validar Motor de Picking con datos realistas
     * - Pruebas exhaustivas de override de ubicaciones
     * - Casos complejos de picking desde múltiples sitios
     */
    public function run(): void
    {
        \Log::info('📊 Iniciando distribución masiva de inventarios para 30 órdenes');

        $productos = Producto::all();
        $estantes = Estante::all();

        // Asegurar que existe el estado "Disponible" (id=1)
        $estadoDisponible = EstadoInventario::firstOrCreate(
            ['id' => 1],
            ['nombre' => 'Disponible', 'descripcion' => 'Stock listo para picking']
        );

        if ($productos->isEmpty() || $estantes->isEmpty()) {
            \Log::warning('⚠️ No hay productos o estantes para distribuir inventario');
            return;
        }

        \Log::info('📍 Datos disponibles:', [
            'total_productos' => $productos->count(),
            'total_estantes' => $estantes->count(),
            'estado_disponible_id' => $estadoDisponible->id,
        ]);

        $inventariosCreados = 0;
        $contadorProductos = 0;

        foreach ($productos as $producto) {
            $contadorProductos++;

            // REGLA MEJORADA: Cada producto se distribuye en 3-5 estantes (más ubicaciones para override testing)
            $numUbicaciones = random_int(3, 5);
            
            // Seleccionar estantes aleatorios (sin duplicar)
            $estantesSeleccionados = $estantes
                ->random(min($numUbicaciones, $estantes->count()))
                ->unique('id');

            foreach ($estantesSeleccionados as $estante) {
                // Cantidad realista: 10-100 unidades
                $cantidad = random_int(10, 100);

                try {
                    Inventario::create([
                        'producto_id' => $producto->id,
                        'estante_id' => $estante->id,
                        'estado_id' => $estadoDisponible->id,
                        'cantidad' => $cantidad,
                    ]);

                    $inventariosCreados++;

                } catch (\Illuminate\Database\QueryException $e) {
                    // Ignorar duplicados (unique constraint)
                    \Log::debug('⚠️ Inventario duplicado (esperado):', [
                        'producto_id' => $producto->id,
                        'estante_id' => $estante->id,
                    ]);
                }
            }

            // Log de progreso cada 10 productos
            if ($contadorProductos % 10 === 0) {
                \Log::debug("📦 Procesados {$contadorProductos} productos, {$inventariosCreados} inventarios creados");
            }
        }

        \Log::info('✅ Distribución de inventario completada para testing masivo', [
            'productos_procesados' => $contadorProductos,
            'inventarios_creados' => $inventariosCreados,
            'promedio_ubicaciones_por_producto' => round($inventariosCreados / $contadorProductos, 2),
            'nota' => 'Múltiples ubicaciones por producto para escenarios de override y picking complejo',
        ]);
    }
}
