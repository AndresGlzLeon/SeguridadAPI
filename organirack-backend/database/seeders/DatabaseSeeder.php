<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Almacen;
use App\Models\DetalleSurtido;
use App\Models\EstadoOrden;
use App\Models\Estante;
use App\Models\OrdenSurtido;
use App\Models\Pasillo;
use App\Models\PrioridadOrden;
use App\Models\Producto;
use App\Models\Rack;
use App\Models\User;
use Illuminate\Database\Seeder;

// Seeders
use Database\Seeders\RoleSeeder;
use Database\Seeders\CatalogosSeeder;
use Database\Seeders\EstadosPrioridadesSeeder;
use Database\Seeders\LocationSeeder;
use Database\Seeders\ProductoSeeder;
use Database\Seeders\InventarioSeeder;
use Database\Seeders\OrdenesSeeder;
use Database\Seeders\DetallesSurtidoUbicacionesSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * ============================================================
     * FASE DE SEEDING - 30 ÓRDENES DE PICKING - TESTING MASIVO
     * ============================================================
     * 
     * FASE 1: USUARIOS Y ROLES
     * ├─ 1. RoleSeeder: Crea roles (Jefe de Almacen, Almacenista, Capturista)
     * └─ 2. Crear usuario Admin y 5+ Almacenistas para órdenes variadas
     * 
     * FASE 2: CATÁLOGOS Y ESTRUCTURA MAESTRA
     * ├─ 3. CatalogosSeeder: Categorías (10), Marcas (15), Unidades (8), Estados Inv (4)
     * ├─ 4. EstadosPrioridadesSeeder: Estados de Órdenes + Prioridades
     * └─ 5. LocationSeeder: Estructura EXPANDIDA: 
     *        - 2 Edificios
     *        - 8 Almacenes (4 por edificio)
     *        - 6-7 Pasillos por almacén
     *        - 3-4 Racks por pasillo
     *        - 3-4 Estantes por rack
     *        = ~120-150 estantes totales ✅
     * 
     * FASE 3: DATOS DE NEGOCIO MASIVOS
     * ├─ 6. ProductoSeeder: 50 productos con factory
     * ├─ 7. InventarioSeeder: Distribuye 50 productos en 3-5 ubicaciones cada uno
     * │                        Total: ~200 registros inventario (expandido de 150)
     * │                        Crítico para override picking y múltiples ubicaciones
     * └─ 8. OrdenesSeeder: 30 ÓRDENES (expandido de 5) con escenarios realistas:
     *        - 10 órdenes: Estado "Pendiente" 🔵 (listos para picking)
     *        - 12 órdenes: Estado "En Progreso" 🟡 (con picks parciales)
     *        - 8 órdenes: Estado "Completada" 🟢 (con picks completos)
     *        - Total: ~30 órdenes × 3.5 detalles = ~105 líneas de picking
     *        - Overrides: ~15-20 detalles con estante_real_id ≠ estante_sugerido_id
     * 
     * ============================================================
     * TOTALES ESPERADOS AL FINALIZAR - AMBIENTE DE TESTING MASIVO:
     * ============================================================
     * ✅ Almacenes: 8 (expandido de 4)
     * ✅ Ubicaciones (Estantes): ~120-150 (expandido de ~50)
     * ✅ Productos: 50
     * ✅ Registros Inventario: ~200 (expandido de ~150)
     * ✅ Órdenes: 30 (expandido de 5)
     * ✅ Detalles de Picking: ~105 líneas
     * ✅ Casos de Override: ~15-20 (estante_real ≠ estante_sugerido)
     * 
     * ESCENARIOS CUBIERTOS:
     * ✅ Picking pendiente (sin comenzar)
     * ✅ Picking en progreso (parcial)
     * ✅ Picking completado (con confirmación)
     * ✅ Override de ubicación (almacenista escanea diferente)
     * ✅ Múltiples ubicaciones por producto
     * ✅ Variedad de almacenistas y prioridades
     * 
     * ============================================================
     */
    public function run(): void
    {
        \Log::info('========================================');
        \Log::info('🚀 INICIANDO SEEDING MASIVO DE BDATOS');
        \Log::info('========================================');

        // ============== FASE 1: USUARIOS Y ROLES ==============
        \Log::info('FASE 1️⃣: Usuarios y Roles para 30 órdenes');
        $this->call(RoleSeeder::class);

        // ADMIN
        $admin = User::factory()->create([
            'name' => 'Admin OrganiRack',
            'username' => 'admin01',
            'email' => 'admin@organirack.com',
        ]);
        $admin->assignRole('Jefe de Almacen');

        // ALMACENISTAS (Expandido a 6 para casos de estudio)
        $almacenistas = [];
        $nombresAlmacenistas = [
            'Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Luis Rodríguez', 'Sofia Chen'
        ];

        foreach ($nombresAlmacenistas as $idx => $nombre) {
            $almacenista = User::factory()->create([
                'name' => "{$nombre} - Almacenista",
                'username' => 'almac' . str_pad((string)($idx + 1), 3, '0', STR_PAD_LEFT),
                'email' => 'almacenista' . ($idx + 1) . '@organirack.com',
            ]);
            $almacenista->assignRole('Almacenista');
            $almacenistas[] = $almacenista;
        }

        \Log::info('✅ Usuarios y roles creados', [
            'admin' => 1,
            'almacenistas' => count($almacenistas),
            'total_usuarios' => count($almacenistas) + 1,
        ]);

        // ============== FASE 2: CATÁLOGOS Y ESTRUCTURA ==============
        \Log::info('FASE 2️⃣: Catálogos y Estructura Maestra');

        // Catálogos base
        $this->call(CatalogosSeeder::class);
        \Log::info('✅ Catálogos creados (categorías, marcas, unidades, estados inventario)');

        // Estados y prioridades de órdenes
        $this->call(EstadosPrioridadesSeeder::class);
        \Log::info('✅ Estados y prioridades de órdenes creados');

        // Estructura del almacén (EXPANDIDA: ~120-150 estantes)
        $this->call(LocationSeeder::class);
        \Log::info('✅ Estructura del almacén creada (8 almacenes, ~120-150 estantes)');

        // ============== FASE 3: DATOS DE NEGOCIO MASIVOS ==============
        \Log::info('FASE 3️⃣: Datos de Negocio Masivos');

        // Productos (50)
        $this->call(ProductoSeeder::class);
        \Log::info('✅ 50 productos generados');

        // Inventarios distribuidos (EXPANDIDO: ~200 registros, 3-5 ubicaciones por producto)
        $this->call(InventarioSeeder::class);
        \Log::info('✅ Inventarios distribuidos (~200 registros, múltiples ubicaciones)');

        // ========== 30 ÓRDENES DE PICKING - ESCENARIOS MASIVOS ==========
        \Log::info('🎯 Iniciando generación de 30 órdenes de picking con escenarios variados');
        $this->call(OrdenesSeeder::class);
        \Log::info('✅ 30 órdenes de picking creadas:');
        \Log::info('   ├─ 10 órdenes: Estado "Pendiente" (listos para picking)');
        \Log::info('   ├─ 12 órdenes: Estado "En Progreso" (picks parciales)');
        \Log::info('   ├─ 8 órdenes: Estado "Completada" (con confirmación + overrides)');
        \Log::info('   ├─ Total detalles: ~105 líneas de picking');
        \Log::info('   └─ Overrides registrados: ~15-20 casos (ubicación diferente)');

        // Registrar ubicaciones reales (audit trail de picking con override)
        $this->call(DetallesSurtidoUbicacionesSeeder::class);
        \Log::info('✅ Ubicaciones reales de picking registradas (audit trail de overrides)');

        // ============== FASE 4: TEST DATA (Opcional) ==============
        \Log::info('FASE 4️⃣: Test Data (Producto BRG-8822X)');

        $almacen = Almacen::create([
            'nombre' => 'Almacén Test',
            'siglas' => 'ALM-TEST',
        ]);

        $pasillo = Pasillo::create([
            'almacen_id' => $almacen->id,
            'nombre' => 'Pasillo Test',
        ]);

        $rack = Rack::create([
            'pasillo_id' => $pasillo->id,
            'nombre_rack' => 'Rack Test',
        ]);

        $estanteSugerido = Estante::create([
            'rack_id' => $rack->id,
            'nivel' => 'L2',
            'codigo_etiqueta' => 'TEST-L2',
            'tipo_zona' => 'picking',
            'esta_lleno' => false,
        ]);

        $estanteReal = Estante::create([
            'rack_id' => $rack->id,
            'nivel' => 'L3',
            'codigo_etiqueta' => 'TEST-L3',
            'tipo_zona' => 'picking',
            'esta_lleno' => false,
        ]);

        // Obtener categoría, unidad y marca válidas
        $categoria = \App\Models\Categoria::first();
        $unidad = \App\Models\UnidadMedida::first();
        $marca = \App\Models\Marca::first();

        $producto = Producto::create([
            'sku' => 'BRG-8822X',
            'nombre' => 'Rodamiento de Bolas 6205',
            'categoria_id' => $categoria?->id ?? 1,
            'unidad_medida_id' => $unidad?->id ?? 1,
            'marca_id' => $marca?->id,
            'stock_min' => 10,
            'stock_max' => 100,
            'estado' => true,
        ]);

        $estadoPendiente = EstadoOrden::where('nombre', 'Pendiente')->first();
        $prioridadNormal = PrioridadOrden::where('nombre', 'MEDIA')->first() 
                        ?? PrioridadOrden::first();

        if ($estadoPendiente && $prioridadNormal && count($almacenistas) > 0) {
            $orden = OrdenSurtido::create([
                'folio' => 'ORD-TEST-0001',
                'capturista_id' => $admin->id,
                'almacenista_id' => $almacenistas[0]->id,
                'referencia_destino' => 'Centro de Test',
                'estado_id' => $estadoPendiente->id,
                'prioridad_id' => $prioridadNormal->id,
                'fecha_requerida' => now()->addDays(2),
            ]);

            DetalleSurtido::create([
                'orden_surtido_id' => $orden->id,
                'producto_id' => $producto->id,
                'cantidad_requerida' => 50,
                'cantidad_surtida' => 0,
                'estante_sugerido_id' => $estanteSugerido->id,
                'estante_real_id' => null,
                'fue_modificado' => false,
            ]);

            \Log::info('✅ Dato de prueba BRG-8822X creado');
        }

        \Log::info('========================================');
        \Log::info('✅ SEEDING COMPLETADO EXITOSAMENTE');
        \Log::info('========================================');
        \Log::info('📊 RESUMEN FINAL:', [
            'estantes' => Estante::count(),
            'productos' => Producto::count(),
            'inventarios' => \App\Models\Inventario::count(),
            'ordenes' => OrdenSurtido::count(),
            'detalles_orden' => DetalleSurtido::count(),
        ]);
    }
}