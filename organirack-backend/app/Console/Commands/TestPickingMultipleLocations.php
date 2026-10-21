<?php

namespace App\Console\Commands;

use App\Models\OrdenSurtido;
use App\Models\DetalleSurtido;
use App\Models\Producto;
use App\Models\Estante;
use App\Models\Inventario;
use App\Models\EstadoOrden;
use App\Models\User;
use App\Services\PickingService;
use Illuminate\Console\Command;

class TestPickingMultipleLocations extends Command
{
    protected $signature = 'test:picking-multiple-locations {--user-id= : ID del usuario almacenista}';
    protected $description = 'Test the picking system with multiple locations';

    public function handle(): int
    {
        $this->info('🚀 Iniciando prueba de picking con múltiples ubicaciones...');
        $this->newLine();

        try {
            // Obtener o crear usuario
            $userId = $this->option('user-id');
            if ($userId) {
                $almacenista = User::findOrFail($userId);
            } else {
                $almacenista = User::factory()->create();
                $this->info("✅ Usuario creado: {$almacenista->email} (ID: {$almacenista->id})");
            }

            // Crear producto
            $producto = Producto::factory()->create();
            $this->info("✅ Producto creado: {$producto->nombre} (ID: {$producto->id})");

            // Crear estantes
            $estante1 = Estante::factory()->create();
            $estante2 = Estante::factory()->create();
            $estante3 = Estante::factory()->create();
            $this->info("✅ Estantes creados: {$estante1->codigo_etiqueta}, {$estante2->codigo_etiqueta}, {$estante3->codigo_etiqueta}");

            // Crear orden
            $estadoPendiente = EstadoOrden::firstOrCreate(['nombre' => 'Pendiente']);
            $orden = OrdenSurtido::factory()->create([
                'estado_id' => $estadoPendiente->id,
                'almacenista_id' => $almacenista->id,
            ]);
            $this->info("✅ Orden creada: {$orden->folio} (ID: {$orden->id})");

            // Crear detalle
            $detalle = DetalleSurtido::factory()->create([
                'orden_surtido_id' => $orden->id,
                'producto_id' => $producto->id,
                'cantidad_requerida' => 1000,
                'cantidad_surtida' => 0,
                'estante_sugerido_id' => $estante1->id,
            ]);
            $this->info("✅ Detalle de orden creado (Cantidad requerida: 1000)");

            // Crear inventarios
            Inventario::factory()->create([
                'producto_id' => $producto->id,
                'estante_id' => $estante1->id,
                'cantidad' => 350,
            ]);
            Inventario::factory()->create([
                'producto_id' => $producto->id,
                'estante_id' => $estante2->id,
                'cantidad' => 400,
            ]);
            Inventario::factory()->create([
                'producto_id' => $producto->id,
                'estante_id' => $estante3->id,
                'cantidad' => 250,
            ]);
            $this->info("✅ Inventarios creados (350 + 400 + 250 = 1000 total)");

            $this->newLine();
            $this->info('📍 Iniciando picks...');
            $this->newLine();

            $pickingService = app(PickingService::class);

            // Pick 1
            $this->info('Pick #1: 350 unidades de A-01-01...');
            $resultado1 = $this->executePickWithAuth($pickingService, $almacenista, $orden->id, [
                'producto_id' => $producto->id,
                'estante_id_escaneado' => $estante1->id,
                'cantidad_tomada' => 350,
            ]);

            $this->line("  └─ Cantidad acumulada: {$resultado1['data']['detalle']['cantidad_surtida']}/{$detalle->cantidad_requerida}");
            $this->line("  └─ ¿Está completo? " . ($resultado1['data']['detalle']['es_completo'] ? '✅ SÍ' : '❌ NO'));
            $this->line("  └─ Ubicaciones recolectadas: {$resultado1['data']['detalle']['ubicaciones_recolectadas'][0]['estante_codigo']}");

            $this->newLine();

            // Pick 2
            $this->info('Pick #2: 400 unidades de A-02-01...');
            $resultado2 = $this->executePickWithAuth($pickingService, $almacenista, $orden->id, [
                'producto_id' => $producto->id,
                'estante_id_escaneado' => $estante2->id,
                'cantidad_tomada' => 400,
            ]);

            $this->line("  └─ Cantidad acumulada: {$resultado2['data']['detalle']['cantidad_surtida']}/{$detalle->cantidad_requerida}");
            $this->line("  └─ ¿Está completo? " . ($resultado2['data']['detalle']['es_completo'] ? '✅ SÍ' : '❌ NO'));

            foreach ($resultado2['data']['detalle']['ubicaciones_recolectadas'] as $idx => $ub) {
                $this->line("  └─ Ubicación " . ($idx + 1) . ": {$ub['estante_codigo']} ({$ub['cantidad_tomada']} unidades)");
            }

            $this->newLine();

            // Pick 3 (Completa la orden)
            $this->info('Pick #3: 250 unidades de B-01-01 (completa la orden)...');
            $resultado3 = $this->executePickWithAuth($pickingService, $almacenista, $orden->id, [
                'producto_id' => $producto->id,
                'estante_id_escaneado' => $estante3->id,
                'cantidad_tomada' => 250,
            ]);

            $this->line("  └─ Cantidad acumulada: {$resultado3['data']['detalle']['cantidad_surtida']}/{$detalle->cantidad_requerida}");
            $this->line("  └─ ¿Está completo? " . ($resultado3['data']['detalle']['es_completo'] ? '✅ SÍ' : '❌ NO'));
            $this->line("  └─ ¿Orden completada? " . ($resultado3['data']['detalle']['orden_estado']['completa'] ? '✅ SÍ' : '❌ NO'));

            foreach ($resultado3['data']['detalle']['ubicaciones_recolectadas'] as $idx => $ub) {
                $this->line("  └─ Ubicación " . ($idx + 1) . ": {$ub['estante_codigo']} ({$ub['cantidad_tomada']} unidades)");
            }

            $this->newLine();
            $this->info('✨ Verificación de datos en tabla pivot...');
            $this->newLine();

            // Verificar tabla pivot
            $pivotRecords = \App\Models\DetalleSurtidoUbicacion::where('detalle_surtido_id', $detalle->id)
                ->with('estante', 'usuario')
                ->orderBy('created_at', 'ASC')
                ->get();

            $this->table(
                ['#', 'Estante', 'Cantidad', 'Usuario', 'Fecha/Hora'],
                $pivotRecords->map(function ($record, $index) {
                    return [
                        $index + 1,
                        $record->estante->codigo_etiqueta,
                        $record->cantidad_tomada,
                        $record->usuario->email,
                        $record->created_at->format('Y-m-d H:i:s'),
                    ];
                })->toArray()
            );

            $this->newLine();
            $this->info('🎉 Prueba completada exitosamente!');
            $this->newLine();

            $this->table(
                ['Métrica', 'Valor'],
                [
                    ['Orden ID', $orden->id],
                    ['Folio', $orden->folio],
                    ['Producto', $producto->nombre],
                    ['Cantidad Requerida', 1000],
                    ['Cantidad Surtida', $resultado3['data']['detalle']['cantidad_surtida']],
                    ['Picks Realizados', $pivotRecords->count()],
                    ['Estado de Orden', 'COMPLETADA'],
                ]
            );

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Error: ' . $e->getMessage());
            return self::FAILURE;
        }
    }

    private function executePickWithAuth(PickingService $service, User $user, int $ordenId, array $pickData): array
    {
        // Simular autenticación
        auth()->setUser($user);
        return $service->confirmPick($ordenId, $pickData);
    }
}
