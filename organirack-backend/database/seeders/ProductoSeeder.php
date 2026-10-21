<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Producto;
use Database\Factories\ProductoFactory;
use Illuminate\Database\Seeder;

class ProductoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Genera 50 productos realistas usando ProductoFactory.
     * Asigna aleatoriamente:
     * - Categorías (10 disponibles)
     * - Marcas (15 disponibles)
     * - Unidades de Medida (8 disponibles)
     */
    public function run(): void
    {
        \Log::info('📦 Iniciando generación de 50 productos...');

        // Resetear contador del factory
        ProductoFactory::resetCounter();

        // Generar 50 productos masivos usando factory
        Producto::factory()
            ->count(50)
            ->create();

        \Log::info('✅ Total de 50 productos generados correctamente');
    }
}

