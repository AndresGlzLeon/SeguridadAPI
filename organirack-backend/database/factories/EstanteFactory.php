<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Estante;
use App\Models\Rack;
use Illuminate\Database\Eloquent\Factories\Factory;

class EstanteFactory extends Factory
{
    protected $model = Estante::class;

    private static int $counter = 0;

    public function definition(): array
    {
        // Generar código de etiqueta único: TST-[timestamp]-[random]
        $timestamp = (int)(microtime(true) * 1000);
        $random = fake()->numberBetween(1000, 9999);
        $codigoEtiqueta = "TST-{$timestamp}-{$random}";

        // Obtener ID de rack existente o crear uno
        $rackId = Rack::pluck('id')->random() ?? Rack::factory()->create()->id;

        return [
            'rack_id' => $rackId,
            'nivel' => fake()->numberBetween(1, 5),
            'codigo_etiqueta' => $codigoEtiqueta,
            'tipo_zona' => fake()->randomElement(['Normal', 'Refrigerado', 'Especial']),
            'esta_lleno' => false,
        ];
    }

    public static function resetCounter(): void
    {
        self::$counter = 0;
    }
}
