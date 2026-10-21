<?php

namespace Tests\Feature;

use App\Models\OrdenSurtido;
use App\Models\DetalleSurtido;
use App\Models\DetalleSurtidoUbicacion;
use App\Models\Inventario;
use App\Models\Producto;
use App\Models\Estante;
use App\Models\EstadoOrden;
use App\Models\User;
use App\Services\PickingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PickingMultipleLocationsTest extends TestCase
{
    use RefreshDatabase;

    private PickingService $pickingService;
    private User $almacenista;
    private Producto $producto;
    private Estante $estante1;
    private Estante $estante2;
    private Estante $estante3;
    private OrdenSurtido $orden;
    private DetalleSurtido $detalle;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pickingService = app(PickingService::class);

        // Crear usuario
        $this->almacenista = User::factory()->create();
        $this->actingAs($this->almacenista);

        // Crear producto
        $this->producto = Producto::factory()->create();

        // Crear estantes
        $this->estante1 = Estante::factory()->create(['codigo_etiqueta' => 'A-01-01']);
        $this->estante2 = Estante::factory()->create(['codigo_etiqueta' => 'A-02-01']);
        $this->estante3 = Estante::factory()->create(['codigo_etiqueta' => 'B-01-01']);

        // Crear orden
        $estadoPendiente = EstadoOrden::firstOrCreate(['nombre' => 'Pendiente']);
        $this->orden = OrdenSurtido::factory()->create([
            'estado_id' => $estadoPendiente->id,
            'almacenista_id' => $this->almacenista->id,
        ]);

        // Crear detalle con cantidad requerida de 1000
        $this->detalle = DetalleSurtido::factory()->create([
            'orden_surtido_id' => $this->orden->id,
            'producto_id' => $this->producto->id,
            'cantidad_requerida' => 1000,
            'cantidad_surtida' => 0,
            'estante_sugerido_id' => $this->estante1->id,
        ]);

        // Crear inventarios para cada estante
        Inventario::factory()->create([
            'producto_id' => $this->producto->id,
            'estante_id' => $this->estante1->id,
            'cantidad' => 350,
        ]);

        Inventario::factory()->create([
            'producto_id' => $this->producto->id,
            'estante_id' => $this->estante2->id,
            'cantidad' => 400,
        ]);

        Inventario::factory()->create([
            'producto_id' => $this->producto->id,
            'estante_id' => $this->estante3->id,
            'cantidad' => 250,
        ]);
    }

    /**
     * Test: Múltiples picks acumulan la cantidad_surtida
     */
    public function test_multiple_picks_accumulate_quantity(): void
    {
        // Pick 1: 350 de A-01-01
        $resultado1 = $this->pickingService->confirmPick($this->orden->id, [
            'producto_id' => $this->producto->id,
            'estante_id_escaneado' => $this->estante1->id,
            'cantidad_tomada' => 350,
        ]);

        // Validaciones Pick 1
        $this->assertTrue($resultado1['success']);
        $this->assertEquals(350, $resultado1['data']['detalle']['cantidad_surtida']);
        $this->assertFalse($resultado1['data']['detalle']['es_completo']);
        $this->assertCount(1, $resultado1['data']['detalle']['ubicaciones_recolectadas']);

        // Pick 2: 400 de A-02-01
        $resultado2 = $this->pickingService->confirmPick($this->orden->id, [
            'producto_id' => $this->producto->id,
            'estante_id_escaneado' => $this->estante2->id,
            'cantidad_tomada' => 400,
        ]);

        // Validaciones Pick 2
        $this->assertTrue($resultado2['success']);
        $this->assertEquals(750, $resultado2['data']['detalle']['cantidad_surtida']); // ✨ ACUMULADO
        $this->assertFalse($resultado2['data']['detalle']['es_completo']);
        $this->assertCount(2, $resultado2['data']['detalle']['ubicaciones_recolectadas']);

        // Pick 3: 250 de B-01-01 (COMPLETA)
        $resultado3 = $this->pickingService->confirmPick($this->orden->id, [
            'producto_id' => $this->producto->id,
            'estante_id_escaneado' => $this->estante3->id,
            'cantidad_tomada' => 250,
        ]);

        // Validaciones Pick 3
        $this->assertTrue($resultado3['success']);
        $this->assertEquals(1000, $resultado3['data']['detalle']['cantidad_surtida']);
        $this->assertTrue($resultado3['data']['detalle']['es_completo']);
        $this->assertTrue($resultado3['data']['detalle']['orden_estado']['completa']);
        $this->assertCount(3, $resultado3['data']['detalle']['ubicaciones_recolectadas']);

        // Verificar tabla pivot
        $pivotRecords = DetalleSurtidoUbicacion::where('detalle_surtido_id', $this->detalle->id)->get();
        $this->assertCount(3, $pivotRecords);
        $this->assertEquals(350, $pivotRecords[0]->cantidad_tomada);
        $this->assertEquals(400, $pivotRecords[1]->cantidad_tomada);
        $this->assertEquals(250, $pivotRecords[2]->cantidad_tomada);
    }

    /**
     * Test: Orden se marca como COMPLETADA automáticamente
     */
    public function test_order_is_completed_automatically(): void
    {
        // Hacer un único pick que completa toda la cantidad
        $this->pickingService->confirmPick($this->orden->id, [
            'producto_id' => $this->producto->id,
            'estante_id_escaneado' => $this->estante1->id,
            'cantidad_tomada' => 1000,
        ]);

        // Actualizar inventario (simular que hay más stock)
        Inventario::where('producto_id', $this->producto->id)
            ->where('estante_id', $this->estante1->id)
            ->update(['cantidad' => 1000]);

        // Re-hacer el pick con la cantidad completa
        $resultado = $this->pickingService->confirmPick($this->orden->id, [
            'producto_id' => $this->producto->id,
            'estante_id_escaneado' => $this->estante1->id,
            'cantidad_tomada' => 1000,
        ]);

        // Validar
        $this->assertTrue($resultado['success']);
        $this->assertTrue($resultado['data']['detalle']['orden_estado']['completa']);

        // Verificar en BD
        $this->orden->refresh();
        $this->assertEquals(3, $this->orden->estado_id); // Completada
    }

    /**
     * Test: Trazabilidad completa de picks
     */
    public function test_full_traceability_of_picks(): void
    {
        // Hacer 3 picks
        $this->pickingService->confirmPick($this->orden->id, [
            'producto_id' => $this->producto->id,
            'estante_id_escaneado' => $this->estante1->id,
            'cantidad_tomada' => 350,
        ]);

        $this->pickingService->confirmPick($this->orden->id, [
            'producto_id' => $this->producto->id,
            'estante_id_escaneado' => $this->estante2->id,
            'cantidad_tomada' => 400,
        ]);

        $this->pickingService->confirmPick($this->orden->id, [
            'producto_id' => $this->producto->id,
            'estante_id_escaneado' => $this->estante3->id,
            'cantidad_tomada' => 250,
        ]);

        // Verificar registros en tabla pivot
        $ubicaciones = DetalleSurtidoUbicacion::where('detalle_surtido_id', $this->detalle->id)
            ->with('estante', 'usuario')
            ->orderBy('created_at', 'ASC')
            ->get();

        // Validar cantidad de registros
        $this->assertCount(3, $ubicaciones);

        // Validar primer pick
        $this->assertEquals($this->estante1->id, $ubicaciones[0]->estante_id);
        $this->assertEquals(350, $ubicaciones[0]->cantidad_tomada);
        $this->assertEquals($this->almacenista->id, $ubicaciones[0]->user_id);

        // Validar segundo pick
        $this->assertEquals($this->estante2->id, $ubicaciones[1]->estante_id);
        $this->assertEquals(400, $ubicaciones[1]->cantidad_tomada);

        // Validar tercer pick
        $this->assertEquals($this->estante3->id, $ubicaciones[2]->estante_id);
        $this->assertEquals(250, $ubicaciones[2]->cantidad_tomada);
    }

    /**
     * Test: Stock insuficiente retorna error
     */
    public function test_insufficient_stock_throws_exception(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionCode(400);

        $this->pickingService->confirmPick($this->orden->id, [
            'producto_id' => $this->producto->id,
            'estante_id_escaneado' => $this->estante1->id,
            'cantidad_tomada' => 1000, // Más de lo disponible (350)
        ]);
    }

    /**
     * Test: Verificar cantidad acumulada desde tabla pivot
     */
    public function test_calculate_accumulated_quantity_from_pivot(): void
    {
        // Hacer picks
        $this->pickingService->confirmPick($this->orden->id, [
            'producto_id' => $this->producto->id,
            'estante_id_escaneado' => $this->estante1->id,
            'cantidad_tomada' => 350,
        ]);

        $this->pickingService->confirmPick($this->orden->id, [
            'producto_id' => $this->producto->id,
            'estante_id_escaneado' => $this->estante2->id,
            'cantidad_tomada' => 400,
        ]);

        // Recargar detalle
        $this->detalle->refresh();
        $this->detalle->load('ubicaciones');

        // Validar método calculador
        $cantidadCalculada = $this->detalle->calcularCantidadSurtidaDesdeUbicaciones();
        $this->assertEquals(750, $cantidadCalculada);

        // Validar que coincide con campo de BD
        $this->assertEquals($this->detalle->cantidad_surtida, $cantidadCalculada);
    }
}
