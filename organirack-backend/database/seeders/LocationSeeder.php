<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Almacen;
use App\Models\Pasillo;
use App\Models\Rack;
use App\Models\Estante;
use Illuminate\Database\Seeder;

/**
 * LocationSeeder - ESCENARIOS DE PICKING MASIVOS
 * 
 * Genera la estructura completa del almacén para 30 órdenes de picking:
 * - 2 Edificios
 * - 8 Almacenes (4 por edificio)
 * - 6-7 Pasillos por almacén (50+ total)
 * - 3-4 Racks por pasillo
 * - 3-4 Estantes por rack
 * - Tipos de zonas: PREMIUM, STANDARD, ZONA_ACCESO_RAPIDO
 * 
 * Total de Estantes generados: ~120-150 estantes
 * Nomenclatura: {Sección}-{Pasillo}-{Rack}-{Nivel}
 * 
 * DISEÑO PARA TESTING:
 * - Suficientes ubicaciones para distribuir 50+ productos
 * - Variedad de zonas para simular diferentes estrategias de picking
 * - Estructura realista para validar motor de sugerencias de ubicaciones
 */
class LocationSeeder extends Seeder
{
    public function run(): void
    {
        \Log::info('🏢 Iniciando creación de ubicaciones masivas para 30 órdenes de picking');

        // ============ DEFINIR ALMACENES Y SECCIONES ============
        $almacenes = [
            // Edificio 1: Almacén Centro
            ['edificio' => 'Almacén Centro', 'letra' => 'A', 'nombre' => 'Sección A - Electrónica'],
            ['edificio' => 'Almacén Centro', 'letra' => 'B', 'nombre' => 'Sección B - Ferretería'],
            ['edificio' => 'Almacén Centro', 'letra' => 'C', 'nombre' => 'Sección C - Construcción'],
            ['edificio' => 'Almacén Centro', 'letra' => 'D', 'nombre' => 'Sección D - Consumibles'],
            
            // Edificio 2: Almacén Expansión
            ['edificio' => 'Almacén Expansión', 'letra' => 'E', 'nombre' => 'Sección E - Plásticos'],
            ['edificio' => 'Almacén Expansión', 'letra' => 'F', 'nombre' => 'Sección F - Metales'],
            ['edificio' => 'Almacén Expansión', 'letra' => 'G', 'nombre' => 'Sección G - Químicos'],
            ['edificio' => 'Almacén Expansión', 'letra' => 'H', 'nombre' => 'Sección H - Especiales'],
        ];

        $contadorEstantes = 0;
        $zonas = ['PREMIUM', 'STANDARD', 'ZONA_ACCESO_RAPIDO'];

        foreach ($almacenes as $almacenData) {
            $edificioNombre = $almacenData['edificio'];
            $letra = $almacenData['letra'];
            $nombreSeccion = $almacenData['nombre'];

            // Crear Almacén por Sección
            $almacen = Almacen::firstOrCreate(
                ['siglas' => "ALM-{$letra}"],
                ['nombre' => $nombreSeccion]
            );

            \Log::debug('📦 Creado almacén', [
                'almacen_id' => $almacen->id,
                'seccion' => $letra,
                'edificio' => $edificioNombre,
            ]);

            // ============ CREAR 6-7 PASILLOS POR ALMACÉN (más que antes) ============
            $numPasillos = random_int(6, 7);
            
            for ($numPasillo = 1; $numPasillo <= $numPasillos; $numPasillo++) {
                $codigoPasillo = str_pad((string)$numPasillo, 2, '0', STR_PAD_LEFT);
                
                $pasillo = Pasillo::firstOrCreate(
                    [
                        'almacen_id' => $almacen->id,
                        'nombre' => "{$letra}-{$codigoPasillo}",
                    ]
                );

                // ============ CREAR 3-4 RACKS POR PASILLO (más que antes) ============
                $numRacks = random_int(3, 4);
                
                for ($numRack = 1; $numRack <= $numRacks; $numRack++) {
                    $rack = Rack::firstOrCreate(
                        [
                            'pasillo_id' => $pasillo->id,
                            'nombre_rack' => "{$letra}-{$codigoPasillo}-R{$numRack}",
                        ]
                    );

                    // ============ CREAR 3-4 ESTANTES POR RACK ============
                    $numEstantes = random_int(3, 4);
                    
                    for ($nivel = 1; $nivel <= $numEstantes; $nivel++) {
                        $contadorEstantes++;
                        $codigoEstante = "{$letra}-{$codigoPasillo}-{$numRack}{$nivel}";

                        Estante::create([
                            'rack_id' => $rack->id,
                            'nivel' => "N{$nivel}",
                            'codigo_etiqueta' => $codigoEstante,
                            'tipo_zona' => $zonas[array_rand($zonas)],
                            'esta_lleno' => false,
                        ]);

                        if ($contadorEstantes % 10 === 0) {
                            \Log::debug("📍 Creados {$contadorEstantes} estantes...");
                        }
                    }
                }
            }
        }

        \Log::info('✅ Estructura del almacén creada para 30 órdenes', [
            'total_estantes' => $contadorEstantes,
            'total_almacenes' => count($almacenes),
        ]);
    }
}
