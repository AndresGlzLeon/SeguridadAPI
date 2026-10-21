<?php

namespace App\Services;

use App\Models\Almacen;
use App\Models\Pasillo;
use App\Models\Rack;
use App\Models\Estante;
use App\Models\Inventario;
use Illuminate\Database\Eloquent\Collection;

class LocationService
{
    /**
     * Obtiene la jerarquía completa de ubicaciones desde Almacenes.
     * ¡CRÍTICO!: Utiliza Eager Loading para evitar problemas N+1.
     * Incluye el edificio como metadato para cada almacén.
     *
     * @return Collection
     */
    public function getLocationTree(): Collection
    {
        return Almacen::with([
            'pasillos.racks.estantes'
        ])->get();
    }

    /**
     * Obtiene el inventario de un estante específico.
     * Solo incluye inventarios con cantidad > 0.
     * ¡CRÍTICO!: Utiliza Eager Loading para el producto.
     *
     * @param int $estanteId
     * @return Collection
     */
    public function getInventoryByEstante(int $estanteId): Collection
    {
        return Inventario::with('producto')
            ->where('estante_id', $estanteId)
            ->where('cantidad', '>', 0)
            ->get();
    }

    /**
     * Obtiene la estructura completa de ubicaciones CON inventario incluido.
     * Optimalizado: Una sola petición con eager loading.
     * Incluye productos en cada estante dentro de la estructura.
     *
     * @return Collection
     */
    public function getCompleteInventoryWithLocations(): Collection
    {
        return Almacen::with([
            'pasillos.racks.estantes.inventarios.producto'
        ])->get();
    }

    // ==========================================
    // CRUD ESTRUCTURAL DEL ALMACÉN
    // ==========================================

    // --- Edificios ---
    // Métodos eliminados

    // --- Almacenes ---
    public function createAlmacen(array $data): Almacen { return Almacen::create($data); }
    public function updateAlmacen(int $id, array $data): Almacen { $almacen = Almacen::findOrFail($id); $almacen->update($data); return $almacen; }
    public function deleteAlmacen(int $id): bool {
        $almacen = Almacen::findOrFail($id);
        if (Pasillo::where('almacen_id', $id)->exists()) {
            throw new \Exception('No se puede eliminar el almacén porque contiene pasillos estructurados.');
        }
        return $almacen->delete();
    }

    // --- Pasillos ---
    public function createPasillo(array $data): Pasillo { return Pasillo::create($data); }
    public function updatePasillo(int $id, array $data): Pasillo { $pasillo = Pasillo::findOrFail($id); $pasillo->update($data); return $pasillo; }
    public function deletePasillo(int $id): bool {
        $pasillo = Pasillo::findOrFail($id);
        if (Rack::where('pasillo_id', $id)->exists()) {
            throw new \Exception('No se puede eliminar el pasillo porque contiene racks estructurados.');
        }
        return $pasillo->delete();
    }

    // --- Racks ---
    public function createRack(array $data): Rack { return Rack::create($data); }
    public function updateRack(int $id, array $data): Rack { $rack = Rack::findOrFail($id); $rack->update($data); return $rack; }
    public function deleteRack(int $id): bool {
        $rack = Rack::findOrFail($id);
        if (Estante::where('rack_id', $id)->exists()) {
            throw new \Exception('No se puede eliminar el rack porque contiene estantes estructurados.');
        }
        return $rack->delete();
    }

    // --- Estantes ---
    public function createEstante(array $data): Estante { return Estante::create($data); }
    public function updateEstante(int $id, array $data): Estante { $estante = Estante::findOrFail($id); $estante->update($data); return $estante; }
    public function deleteEstante(int $id): bool {
        $estante = Estante::findOrFail($id);
        if (Inventario::where('estante_id', $id)->exists()) {
            throw new \Exception('No se puede eliminar el estante porque contiene productos asociados en inventario.');
        }
        return $estante->delete();
    }
}