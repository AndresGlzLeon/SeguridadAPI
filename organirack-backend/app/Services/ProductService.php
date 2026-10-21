<?php

namespace App\Services;

use App\Models\Producto;
use Illuminate\Pagination\LengthAwarePaginator;

class ProductService
{
    /**
     * Obtiene todos los productos con paginación y filtros.
     * ¡CRÍTICO!: Utiliza Eager Loading para evitar problemas N+1.
     *
     * @param array $filters Array con filtros: ['search' => '', 'estado' => true, 'per_page' => 15]
     * @return LengthAwarePaginator
     */
    public function getAllProducts(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per_page'] ?? 15;
        $search = $filters['search'] ?? '';
        $estado = $filters['estado'] ?? null;
        $categoria_id = $filters['categoria_id'] ?? null;

        // Construir consulta con Eager Loading
        $query = Producto::with([
            'categoria',
            'unidadMedida',
            'marca',
        ]);

        // Filtro de búsqueda por SKU o nombre
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('sku', 'like', "%{$search}%")
                  ->orWhere('nombre', 'like', "%{$search}%");
            });
        }

        // Filtro por estado
        if ($estado !== null) {
            $query->where('estado', $estado);
        }

        // Filtro por categoría
        if ($categoria_id !== null) {
            $query->where('categoria_id', $categoria_id);
        }

        // Ordenar por nombre
        $query->orderBy('nombre', 'asc');

        // Retornar paginado
        return $query->paginate($perPage);
    }

    /**
     * Obtiene un producto específico por ID con sus relaciones.
     *
     * @param int $id
     * @return Producto|null
     */
    public function getProductById(int $id): ?Producto
    {
        return Producto::with([
            'categoria',
            'unidadMedida',
            'marca',
        ])->find($id);
    }

    /**
     * Crea un nuevo producto.
     *
     * @param array $data Datos del producto
     * @return Producto
     */
    public function createProduct(array $data): Producto
    {
        return Producto::create($data);
    }

    /**
     * Actualiza un producto existente.
     *
     * @param int $id ID del producto
     * @param array $data Datos a actualizar
     * @return Producto
     */
    public function updateProduct(int $id, array $data): Producto
    {
        $producto = Producto::findOrFail($id);
        $producto->update($data);
        
        // Recargar relaciones para retornar el objeto actualizado
        return $producto->load([
            'categoria',
            'unidadMedida',
            'marca',
        ]);
    }

    /**
     * Cambia el estado de un producto (activo/inactivo).
     * BORRADO LÓGICO: No elimina el registro, solo cambia el estado.
     *
     * @param int $id ID del producto
     * @return Producto
     */
    public function toggleProductState(int $id): Producto
    {
        $producto = Producto::findOrFail($id);
        
        // Invertir el estado
        $producto->estado = !$producto->estado;
        $producto->save();

        return $producto->load([
            'categoria',
            'unidadMedida',
            'marca',
        ]);
    }

    /**
     * Elimina lógicamente un producto (cambia estado a inactivo).
     *
     * @param int $id ID del producto
     * @return bool
     */
    public function deleteProduct(int $id): bool
    {
        $producto = Producto::findOrFail($id);
        $producto->estado = false;
        return $producto->save();
    }
}
