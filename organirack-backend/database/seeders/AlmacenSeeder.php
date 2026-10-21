<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Almacen;
use App\Models\Pasillo;
use App\Models\Rack;
use App\Models\Estante;
use Illuminate\Database\Seeder;

class AlmacenSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear 1 Almacén Principal
        $almacen = Almacen::create([
            'nombre' => 'Almacén Principal',
            'siglas' => 'AP',
        ]);

        // Crear 2 Pasillos en el almacén
        for ($p = 1; $p <= 2; $p++) {
            $pasillo = Pasillo::create([
                'almacen_id' => $almacen->id,
                'nombre' => "Pasillo {$p}",
            ]);

            // Crear 2 Racks en cada pasillo
            for ($r = 1; $r <= 2; $r++) {
                $rack = Rack::create([
                    'pasillo_id' => $pasillo->id,
                    'nombre_rack' => "Rack {$r}",
                ]);

                // Crear 5 Estantes en cada rack
                for ($e = 1; $e <= 5; $e++) {
                    Estante::create([
                        'rack_id' => $rack->id,
                        'nivel' => $e,
                        'codigo_etiqueta' => "EST-{$almacen->id}-{$p}-{$r}-{$e}",
                        'tipo_zona' => ['general', 'refrigerada', 'restringida'][array_rand([0, 1, 2])],
                        'esta_lleno' => false,
                    ]);
                }
            }
        }
    }
}
