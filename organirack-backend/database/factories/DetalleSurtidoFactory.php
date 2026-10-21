<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\DetalleSurtido;
use App\Models\OrdenSurtido;
use App\Models\Producto;
use App\Models\Estante;
use Illuminate\Database\Eloquent\Factories\Factory;

class DetalleSurtidoFactory extends Factory
{
    protected $model = DetalleSurtido::class;

    public function definition(): array
    {
        return [
            'orden_surtido_id' => OrdenSurtido::factory(),
            'producto_id' => Producto::inRandomOrder()->first()?->id ?? Producto::factory()->create()->id,
            'cantidad_requerida' => fake()->numberBetween(100, 2000),
            'cantidad_surtida' => 0,
            'estante_sugerido_id' => Estante::inRandomOrder()->first()?->id ?? Estante::factory()->create()->id,
            'estante_real_id' => null,
            'fue_modificado' => false,
        ];
    }
}
