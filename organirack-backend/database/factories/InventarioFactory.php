<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Inventario;
use App\Models\Producto;
use App\Models\Estante;
use App\Models\EstadoInventario;
use Illuminate\Database\Eloquent\Factories\Factory;

class InventarioFactory extends Factory
{
    protected $model = Inventario::class;

    public function definition(): array
    {
        return [
            'producto_id' => Producto::inRandomOrder()->first()?->id ?? Producto::factory()->create()->id,
            'estante_id' => Estante::inRandomOrder()->first()?->id ?? Estante::factory()->create()->id,
            'estado_id' => EstadoInventario::where('nombre', 'Disponible')
                ->orWhere('nombre', 'Disponible')
                ->first()?->id ?? EstadoInventario::inRandomOrder()->first()?->id ?? 1,
            'cantidad' => fake()->numberBetween(10, 500),
        ];
    }
}
