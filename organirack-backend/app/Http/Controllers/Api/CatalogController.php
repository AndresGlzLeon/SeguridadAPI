<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\Marca;
use App\Models\UnidadMedida;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CatalogController extends Controller
{
    /**
     * GET /api/catalogs
     * Obtiene todas las listas de catálogos en un solo endpoint
     */
    public function getCatalogs(): JsonResponse
    {
        return response()->json([
            'data' => [
                'categorias' => Categoria::select('id', 'nombre')->get(),
                'marcas' => Marca::select('id', 'nombre')->get(),
                'unidades_medida' => UnidadMedida::select('id', 'nombre', 'abreviatura')->get(),
            ],
            'message' => 'Catálogos obtenidos exitosamente',
        ]);
    }

    /**
     * POST /api/categorias
     * Crea una nueva categoría
     */
    public function storeCategoria(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:categorias,nombre',
        ], [
            'nombre.required' => 'El nombre de la categoría es obligatorio.',
            'nombre.unique' => 'Esta categoría ya existe.',
            'nombre.max' => 'El nombre no puede exceder 100 caracteres.',
        ]);

        $categoria = Categoria::create($validated);

        return response()->json([
            'data' => $categoria->only(['id', 'nombre']),
            'message' => 'Categoría creada exitosamente',
        ], 201);
    }

    /**
     * POST /api/marcas
     * Crea una nueva marca
     */
    public function storeMarca(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:marcas,nombre',
        ], [
            'nombre.required' => 'El nombre de la marca es obligatorio.',
            'nombre.unique' => 'Esta marca ya existe.',
            'nombre.max' => 'El nombre no puede exceder 100 caracteres.',
        ]);

        $marca = Marca::create($validated);

        return response()->json([
            'data' => $marca->only(['id', 'nombre']),
            'message' => 'Marca creada exitosamente',
        ], 201);
    }

    /**
     * PUT /api/categorias/{id}
     * Actualiza una categoría existente
     */
    public function updateCategoria(Request $request, $id): JsonResponse
    {
        $categoria = Categoria::findOrFail($id);

        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:categorias,nombre,' . $id,
        ], [
            'nombre.required' => 'El nombre de la categoría es obligatorio.',
            'nombre.unique' => 'Esta categoría ya existe.',
            'nombre.max' => 'El nombre no puede exceder 100 caracteres.',
        ]);

        $categoria->update($validated);

        return response()->json([
            'data' => $categoria->only(['id', 'nombre']),
            'message' => 'Categoría actualizada exitosamente',
        ]);
    }

    /**
     * DELETE /api/categorias/{id}
     * Elimina una categoría
     */
    public function destroyCategoria($id): JsonResponse
    {
        $categoria = Categoria::findOrFail($id);
        $categoria->delete();

        return response()->json([
            'message' => 'Categoría eliminada exitosamente',
        ]);
    }

    /**
     * PUT /api/marcas/{id}
     * Actualiza una marca existente
     */
    public function updateMarca(Request $request, $id): JsonResponse
    {
        $marca = Marca::findOrFail($id);

        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:marcas,nombre,' . $id,
        ], [
            'nombre.required' => 'El nombre de la marca es obligatorio.',
            'nombre.unique' => 'Esta marca ya existe.',
            'nombre.max' => 'El nombre no puede exceder 100 caracteres.',
        ]);

        $marca->update($validated);

        return response()->json([
            'data' => $marca->only(['id', 'nombre']),
            'message' => 'Marca actualizada exitosamente',
        ]);
    }

    /**
     * DELETE /api/marcas/{id}
     * Elimina una marca
     */
    public function destroyMarca($id): JsonResponse
    {
        $marca = Marca::findOrFail($id);
        $marca->delete();

        return response()->json([
            'message' => 'Marca eliminada exitosamente',
        ]);
    }}