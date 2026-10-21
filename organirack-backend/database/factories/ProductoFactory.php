<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Categoria;
use App\Models\Marca;
use App\Models\Producto;
use App\Models\UnidadMedida;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * ProductoFactory
 * 
 * Factory para generar 50 productos realistas de prueba.
 * Asigna aleatoriamente categorías, marcas y unidades de medida.
 */
class ProductoFactory extends Factory
{
    protected $model = Producto::class;

    private static int $counter = 0;

    /**
     * Define the model's default state
     */
    public function definition(): array
    {
        // SKU única: TEST-[timestamp-random]
        // Esto evita conflictos con seeders existentes
        $timestamp = (int)(microtime(true) * 1000);
        $random = fake()->numberBetween(1000, 9999);
        $sku = 'TST-' . $timestamp . '-' . $random;

        // Nombres de productos realistas
        $nombres = [
            'Tornillo de Acero Galvanizado 3/8"',
            'Tuerca M10 Zinc',
            'Arandela de Presión',
            'Perno de Acero Inoxidable',
            'Cable Electricidad #2',
            'Cable Tierra #2',
            'Madera Contrachapada 3/4"',
            'Lámina Galvanizada Calibre 18',
            'Pintura Acrílica (5 Gal)',
            'Pegamento Industrial PU-100',
            'Masilla Acrílica Blanca',
            'Espuma Expansiva 750ml',
            'Cinta Aislante Negra',
            'Cinta Masking 24mm',
            'Manguera Reforzada 1/2"',
            'Abrazadera Metálica 1"',
            'Tubo PVC 4"',
            'Codo PVC 90° 2"',
            'Tee PVC 2"',
            'Válvula de Compuerta 1"',
            'Sensor Ultrasónico HC-SR04',
            'Relé Electromagnético 12V',
            'Transistor NPN 2N2222',
            'Condensador Electrolítico 100µF',
            'Resistencia 10K 1/4W',
            'LED Rojo 5mm',
            'Switch Basculante 6A',
            'Conector RJ45 CAT6',
            'Modulo GSM SIM800L',
            'Microcontrolador Arduino Uno',
            'Placa Prototipo PCB',
            'Soldadura Estaño 60/40',
            'Desoldador Manual',
            'Estaño 1mm Rollo 500g',
            'Flux Líquido 30ml',
            'Aislante Térmico 30mm',
            'Espuma EVA 25mm',
            'Fieltro Negro 3mm',
            'Corcho Natural 10mm',
            'Goma Espuma 50mm',
            'Cable Multipolar 4x2.5mm2',
            'Condulet EMT 1/2"',
            'Niple Galvanizado 3/4"',
            'Unión Gibault 1"',
            'Empaque Nylon 1.5mm',
            'O-Ring Caucho Nitrilo',
            'Filtro de Aire Papel',
            'Filtro Hidráulico 10 micras',
            'Lubricante ISO 46 (1L)',
            'Grasa NLGI 2 (400g)',
            'Desengrasante Industrial (5L)',
        ];

        // Obtener IDs existentes de catálogos
        $categoriaIds = Categoria::pluck('id')->toArray();
        $marcaIds = Marca::pluck('id')->toArray();
        $unidadIds = UnidadMedida::pluck('id')->toArray();

        // Si no existen datos maestros, usar valores por defecto
        $categoriaId = $categoriaIds ? $this->faker->randomElement($categoriaIds) : 1;
        $marcaId = $marcaIds ? $this->faker->randomElement($marcaIds) : null;
        $unidadId = $unidadIds ? $this->faker->randomElement($unidadIds) : 1;

        return [
            'sku' => $sku,
            'nombre' => $this->faker->randomElement($nombres) . ' - ' . $this->faker->word(),
            'categoria_id' => $categoriaId,
            'marca_id' => $marcaId,
            'unidad_medida_id' => $unidadId,
            'stock_min' => fake()->numberBetween(5, 20),
            'stock_max' => fake()->numberBetween(500, 1000),
            'estado' => true,
        ];
    }

    /**
     * Reset counter para testing
     */
    public static function resetCounter(): void
    {
        self::$counter = 0;
    }
}
