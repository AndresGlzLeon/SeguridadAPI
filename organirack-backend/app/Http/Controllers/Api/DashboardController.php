<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(private DashboardService $dashboardService)
    {
    }

    /**
     * Obtener estado de órdenes de surtido
     * GET /api/dashboard/orders-by-state
     */
    public function ordersByState(): JsonResponse
    {
        return response()->json(
            $this->dashboardService->getOrdersByState()
        );
    }

    /**
     * Obtener órdenes por prioridad (últimos 30 días)
     * GET /api/dashboard/orders-by-priority
     */
    public function ordersByPriority(): JsonResponse
    {
        return response()->json(
            $this->dashboardService->getOrdersByPriority()
        );
    }

    /**
     * Obtener inventario por categoría
     * GET /api/dashboard/inventory-by-category
     */
    public function inventoryByCategory(): JsonResponse
    {
        return response()->json(
            $this->dashboardService->getInventoryByCategory()
        );
    }

    /**
     * Obtener ocupación de almacenes
     * GET /api/dashboard/warehouse-occupancy
     */
    public function warehouseOccupancy(): JsonResponse
    {
        return response()->json(
            $this->dashboardService->getWarehouseOccupancy()
        );
    }

    /**
     * Obtener productos con stock crítico
     * GET /api/dashboard/critical-stock
     */
    public function criticalStock(): JsonResponse
    {
        return response()->json(
            $this->dashboardService->getCriticalStockProducts()
        );
    }

    /**
     * Obtener todas las métricas del dashboard
     * GET /api/dashboard/metrics
     */
    public function metrics(): JsonResponse
    {
        return response()->json(
            $this->dashboardService->getDashboardMetrics()
        );
    }
}
