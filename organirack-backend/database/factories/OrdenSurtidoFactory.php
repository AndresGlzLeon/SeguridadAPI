<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\OrdenSurtido;
use App\Models\User;
use App\Models\EstadoOrden;
use App\Models\PrioridadOrden;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrdenSurtidoFactory extends Factory
{
    protected $model = OrdenSurtido::class;

    private static int $counter = 0;

    public function definition(): array
    {
        // Generar folio único usando timestamp + random
        $timestamp = (int)(microtime(true) * 1000);
        $random = fake()->numberBetween(1000, 9999);
        $folio = 'ORD-' . str_pad((string)($timestamp % 1000000), 6, '0', STR_PAD_LEFT);

        // Obtener usuarios
        $capturista = User::whereHas('roles', function ($query) {
            $query->where('name', 'Capturista');
        })->inRandomOrder()->first() ?? User::factory()->create();

        $almacenista = User::whereHas('roles', function ($query) {
            $query->where('name', 'Almacenista');
        })->inRandomOrder()->first() ?? User::factory()->create();

        // Obtener estado pendiente
        $estadoPendiente = EstadoOrden::where('nombre', 'Pendiente')
            ->orWhere('nombre', 'PENDIENTE')
            ->first();
        
        if (!$estadoPendiente) {
            $estadoPendiente = EstadoOrden::factory()->create(['nombre' => 'Pendiente']);
        }

        // Obtener prioridad
        $prioridad = PrioridadOrden::first() ?? PrioridadOrden::factory()->create();

        return [
            'folio' => $folio,
            'capturista_id' => $capturista->id,
            'almacenista_id' => $almacenista->id,
            'referencia_destino' => fake()->numerify('REF-####'),
            'estado_id' => $estadoPendiente->id,
            'prioridad_id' => $prioridad->id,
            'fecha_requerida' => now()->addDays(fake()->numberBetween(1, 30)),
        ];
    }

    public static function resetCounter(): void
    {
        self::$counter = 0;
    }
}
