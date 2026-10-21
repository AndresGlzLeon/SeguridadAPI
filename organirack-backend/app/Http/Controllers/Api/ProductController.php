<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Inyecta el ProductService en el constructor.
     */
    public function __construct(private ProductService $productService) {}

    /**
     * Obtiene la lista de productos con paginación y filtros.
     * GET /api/products
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'search' => $request->query('search', ''),
                'estado' => $request->query('estado') !== null 
                    ? filter_var($request->query('estado'), FILTER_VALIDATE_BOOLEAN)
                    : null,
                'categoria_id' => $request->query('categoria_id'),
                'per_page' => $request->query('per_page', 500), // Cambié de 15 a 500 para evitar paginación por defecto
            ];

            $productos = $this->productService->getAllProducts($filters);

            return response()->json([
                'message' => 'Productos obtenidos correctamente',
                'data' => $productos->items(),
                'pagination' => [
                    'current_page' => $productos->currentPage(),
                    'per_page' => $productos->perPage(),
                    'total' => $productos->total(),
                    'last_page' => $productos->lastPage(),
                    'from' => $productos->firstItem(),
                    'to' => $productos->lastItem(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener productos',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crea un nuevo producto.
     * POST /api/products
     *
     * @param StoreProductRequest $request
     * @return JsonResponse
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        try {
            \Log::info('📝 Datos validados recibidos:', $request->validated());
            
            $producto = $this->productService->createProduct($request->validated());

            // Recargar con relaciones para la respuesta
            $producto->load(['categoria', 'unidadMedida', 'marca']);

            return response()->json([
                'message' => 'Producto creado correctamente',
                'data' => $producto,
            ], 201);

        } catch (\Exception $e) {
            \Log::error('❌ Error al crear producto:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'Error al crear el producto',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene un producto específico.
     * GET /api/products/{product}
     *
     * @param int $product ID del producto
     * @return JsonResponse
     */
    public function show(int $product): JsonResponse
    {
        try {
            $producto = $this->productService->getProductById($product);

            if (!$producto) {
                return response()->json([
                    'message' => 'Producto no encontrado',
                ], 404);
            }

            return response()->json([
                'message' => 'Producto obtenido correctamente',
                'data' => $producto,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener el producto',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualiza un producto existente.
     * PUT /api/products/{product}
     *
     * @param UpdateProductRequest $request
     * @param int $product ID del producto
     * @return JsonResponse
     */
    public function update(UpdateProductRequest $request, int $product): JsonResponse
    {
        try {
            $producto = $this->productService->updateProduct($product, $request->validated());

            return response()->json([
                'message' => 'Producto actualizado correctamente',
                'data' => $producto,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Producto no encontrado',
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar el producto',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Elimina lógicamente un producto (cambia estado a inactivo).
     * DELETE /api/products/{product}
     *
     * @param int $product ID del producto
     * @return JsonResponse
     */
    public function destroy(int $product): JsonResponse
    {
        try {
            $producto = $this->productService->toggleProductState($product);

            return response()->json([
                'message' => 'Producto eliminado/desactivado correctamente',
                'data' => $producto,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Producto no encontrado',
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar el producto',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
