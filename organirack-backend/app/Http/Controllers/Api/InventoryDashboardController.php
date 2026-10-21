<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\InventoryDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryDashboardController extends Controller
{
    public function __construct(private InventoryDashboardService $inventoryDashboardService)
    {
    }

    /**
     * Obtener KPIs del inventario (Unidades totales, Ubicaciones vacías, Top 5 Ubicaciones)
     * GET /api/dashboard/inventory/kpis
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getKpis(Request $request): JsonResponse
    {
        $kpis = $this->inventoryDashboardService->getKpis();

        return response()->json([
            'success' => true,
            'data' => $kpis,
            'message' => 'KPIs del inventario obtenidos exitosamente',
        ]);
    }

    /**
     * Obtener existencias agrupadas por producto
     * GET /api/dashboard/inventory/existencias
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getExistencias(Request $request): JsonResponse
    {
        $existencias = $this->inventoryDashboardService->getExistencias();

        return response()->json([
            'success' => true,
            'data' => $existencias,
            'message' => 'Existencias obtenidas exitosamente',
        ]);
    }

    /**
     * Obtener tabla de inventario refactorizada (TAREA 1)
     * GET /api/dashboard/inventory/table
     * Retorna las columnas reales directamente de la BD sin datos ficticios
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getInventoryTable(Request $request): JsonResponse
    {
        $table = $this->inventoryDashboardService->getInventoryTable();

        return response()->json([
            'success' => true,
            'data' => $table,
            'message' => 'Tabla de inventario obtenida exitosamente',
        ]);
    }

    /**
     * Obtener distribución de inventario por estado (TAREA 3)
     * GET /api/dashboard/inventory/distribution-by-state
     * Para la gráfica de dona/pastel mostrando cantidad por estado
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getInventoryDistributionByState(Request $request): JsonResponse
    {
        $distribution = $this->inventoryDashboardService->getInventoryDistributionByState();

        return response()->json([
            'success' => true,
            'data' => $distribution,
            'message' => 'Distribución de inventario por estado obtenida exitosamente',
        ]);
    }

    /**
     * Obtener distribución de inventario por categoría
     * GET /api/dashboard/inventory/distribution-by-category
     * Para la gráfica mostrando cantidad por categoría
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getInventoryDistributionByCategory(Request $request): JsonResponse
    {
        $distribution = $this->inventoryDashboardService->getInventoryDistributionByCategory();

        return response()->json([
            'success' => true,
            'data' => $distribution,
            'message' => 'Distribución de inventario por categoría obtenida exitosamente',
        ]);
    }

    /**
     * Obtener top 5 estantes por cantidad (TAREA 4)
     * GET /api/dashboard/inventory/top-shelves
     * Para la gráfica de barras mostrando los 5 estantes con más productos
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getTopShelvesByQuantity(Request $request): JsonResponse
    {
        $topShelves = $this->inventoryDashboardService->getTopShelvesByQuantity();

        return response()->json([
            'success' => true,
            'data' => $topShelves,
            'message' => 'Top 5 estantes obtenidos exitosamente',
        ]);
    }
}
