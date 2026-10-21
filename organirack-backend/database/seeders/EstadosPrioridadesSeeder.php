<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\EstadoOrden;
use App\Models\PrioridadOrden;
use Illuminate\Database\Seeder;

class EstadosPrioridadesSeeder extends Seeder
{
    /**
     * Seed the application's database with order states and priorities.
     */
    public function run(): void
    {
        // ============ ESTADOS DE ORDEN ============
        EstadoOrden::firstOrCreate(
            ['nombre' => 'Pendiente'],
            ['color_hex' => '#FFC107']
        );

        EstadoOrden::firstOrCreate(
            ['nombre' => 'En Proceso'],
            ['color_hex' => '#2196F3']
        );

        EstadoOrden::firstOrCreate(
            ['nombre' => 'Completada'],
            ['color_hex' => '#4CAF50']
        );

        EstadoOrden::firstOrCreate(
            ['nombre' => 'Cancelada'],
            ['color_hex' => '#F44336']
        );

        // ============ PRIORIDADES DE ORDEN ============
        PrioridadOrden::firstOrCreate(
            ['nombre' => 'Baja'],
            ['nivel_ordenamiento' => 4]
        );

        PrioridadOrden::firstOrCreate(
            ['nombre' => 'Normal'],
            ['nivel_ordenamiento' => 3]
        );

        PrioridadOrden::firstOrCreate(
            ['nombre' => 'Alta'],
            ['nivel_ordenamiento' => 2]
        );

        PrioridadOrden::firstOrCreate(
            ['nombre' => 'Urgente'],
            ['nivel_ordenamiento' => 1]
        );
    }
}
