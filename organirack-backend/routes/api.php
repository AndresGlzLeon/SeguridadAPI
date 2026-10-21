<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PickingController;
use App\Http\Controllers\Api\MobilePickingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InventoryDashboardController;
use App\Http\Controllers\Api\TestDashboardController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\AuditOverrideController;

/**
 * AUTH ROUTES (Sin autenticación)
 * Estas rutas son públicas para permitir el login
 */
Route::post('/login', [AuthController::class, 'login'])
    ->name('api.login');

/**
 * PUBLIC ROUTES (Sin autenticación)
 * Endpoints públicos para lectura
 */
Route::apiResource('products', ProductController::class)
    ->only(['index', 'show'])
    ->names([
        'index' => 'products.index',
        'show' => 'products.show',
    ]);

Route::prefix('ubicaciones')->group(function () {
    Route::get('/arbol', [LocationController::class, 'getTree'])
        ->name('ubicaciones.arbol');
    Route::get('/estantes/{id}/inventario', [LocationController::class, 'getInventoryByEstante'])
        ->name('ubicaciones.estantes.inventario');
});

// Endpoint optimizado: Inventario completo en una SOLA petición
Route::get('/inventario/completo', [LocationController::class, 'getCompleteInventory'])
    ->name('inventario.completo');

/**
 * AUTHENTICATED ROUTES 
 * Requiere token Sanctum
 */
Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

/**
 * PRODUCTS CATALOG ROUTES (CREATE/UPDATE/DELETE)
 * API REST para la gestión del catálogo maestro de productos
 * Requiere autenticación via Laravel Sanctum
 */
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('products', ProductController::class)
        ->only(['store', 'update', 'destroy'])
        ->names([
            'store' => 'products.store',
            'update' => 'products.update',
            'destroy' => 'products.destroy',
        ]);

    /**
     * CATALOG MANAGEMENT ROUTES
     * Endpoints para obtener y crear catálogos (categorías, marcas, unidades)
     */
    Route::get('/catalogs', [CatalogController::class, 'getCatalogs'])
        ->name('catalogs.get');
    
    // Categorías
    Route::post('/categorias', [CatalogController::class, 'storeCategoria'])
        ->name('categorias.store');
    Route::put('/categorias/{id}', [CatalogController::class, 'updateCategoria'])
        ->name('categorias.update');
    Route::delete('/categorias/{id}', [CatalogController::class, 'destroyCategoria'])
        ->name('categorias.destroy');
    
    // Marcas
    Route::post('/marcas', [CatalogController::class, 'storeMarca'])
        ->name('marcas.store');
    Route::put('/marcas/{id}', [CatalogController::class, 'updateMarca'])
        ->name('marcas.update');
    Route::delete('/marcas/{id}', [CatalogController::class, 'destroyMarca'])
        ->name('marcas.destroy');
});

/**
 * ORDERS MANAGEMENT ROUTES
 * API REST para la gestión de órdenes de surtido (Picking)
 * Requiere autenticación via Laravel Sanctum
 */
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('orders', OrderController::class)
        ->names([
            'index' => 'orders.index',
            'store' => 'orders.store',
            'show' => 'orders.show',
        ]);
    
    // Endpoint para asignar almacenista a una orden
    Route::put('/orders/{id}/assign', [OrderController::class, 'assign'])
        ->name('orders.assign');
    
    // Endpoint para generar PDF (Vale de Salida / Remisión de Surtido)
    Route::get('/orders/{id}/pdf', [OrderController::class, 'generatePdf'])
        ->name('orders.pdf');
});

/**
 * USERS MANAGEMENT ROUTES
 * Endpoints para obtener usuarios por rol (almacenista, capturista, etc.)
 * Requiere autenticación via Laravel Sanctum
 */
Route::middleware('auth:sanctum')->group(function () {
    // Endpoints por rol (DEBEN IR ANTES de apiResource para evitar conflicto con {id})
    Route::get('/users/almacenistas', [UserController::class, 'getAlmacenistas'])
        ->name('users.almacenistas');
    Route::get('/users/capturistas', [UserController::class, 'getCapturistas'])
        ->name('users.capturistas');
    Route::get('/users/administradores', [UserController::class, 'getAdministradores'])
        ->name('users.administradores');
    Route::get('/users/gerentes', [UserController::class, 'getGerentes'])
        ->name('users.gerentes');
    
    // CRUD Completo para usuarios
    Route::apiResource('users', UserController::class)
        ->names([
            'index' => 'users.index',
            'store' => 'users.store',
            'show' => 'users.show',
            'update' => 'users.update',
            'destroy' => 'users.destroy',
        ]);
    
    // Endpoint específico para cambiar estado
    Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus'])
        ->name('users.toggle-status');
    
    Route::get('/audit-logs', [AuditController::class, 'index'])
        ->name('audit-logs.index');
    
    Route::get('/audit-overrides', [AuditOverrideController::class, 'index'])
        ->name('audit-overrides.index');
});

/**
 * MOBILE PICKING ROUTES
 * API REST para aplicación móvil de picking (Outbound)
 * Motor de Picking: Lista sugerida + Validación + Override dinámico
 * Requiere autenticación via Laravel Sanctum
 */
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('mobile/picking')->group(function () {
        // Obtener órdenes asignadas al almacenista autenticado
        Route::get('/orders', [MobilePickingController::class, 'getOrders'])
            ->name('mobile.picking.orders');
        
        // Obtener lista de recolección sugerida
        Route::get('/{ordenId}/sugerencias', [MobilePickingController::class, 'getSuggestions'])
            ->name('mobile.picking.suggestions');
        
        // Confirmar un pick (recolección)
        Route::post('/{ordenId}/confirmar', [MobilePickingController::class, 'confirmPick'])
            ->name('mobile.picking.confirm');
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/picking/override-location', [PickingController::class, 'overrideLocation'])
        ->name('picking.override-location');
});

/**
 * WMS STRUCTURE & INVENTORY MANAGEMENT ROUTES
 * Endpoints CRUD para la estructura física y ajuste manual de stock.
 * Requiere autenticación via Laravel Sanctum
 */
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('ubicaciones/crud')->group(function () {
        // Almacenes
        Route::post('/almacenes', [LocationController::class, 'storeAlmacen']);
        Route::put('/almacenes/{id}', [LocationController::class, 'updateAlmacen']);
        Route::delete('/almacenes/{id}', [LocationController::class, 'destroyAlmacen']);
        // Pasillos
        Route::post('/pasillos', [LocationController::class, 'storePasillo']);
        Route::put('/pasillos/{id}', [LocationController::class, 'updatePasillo']);
        Route::delete('/pasillos/{id}', [LocationController::class, 'destroyPasillo']);
        // Racks
        Route::post('/racks', [LocationController::class, 'storeRack']);
        Route::put('/racks/{id}', [LocationController::class, 'updateRack']);
        Route::delete('/racks/{id}', [LocationController::class, 'destroyRack']);
        // Estantes
        Route::post('/estantes', [LocationController::class, 'storeEstante']);
        Route::put('/estantes/{id}', [LocationController::class, 'updateEstante']);
        Route::delete('/estantes/{id}', [LocationController::class, 'destroyEstante']);
    });

    Route::post('/inventory/manual-adjust', [InventoryController::class, 'addManualStock'])
        ->name('inventory.manual-adjust');
});

/**
 * DASHBOARD ROUTES
 * Requiere autenticación via Laravel Sanctum
 */
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('dashboard')->group(function () {
        Route::get('/orders-by-state', [DashboardController::class, 'ordersByState'])
            ->name('dashboard.orders-by-state');
        Route::get('/orders-by-priority', [DashboardController::class, 'ordersByPriority'])
            ->name('dashboard.orders-by-priority');
        Route::get('/inventory-by-category', [DashboardController::class, 'inventoryByCategory'])
            ->name('dashboard.inventory-by-category');
        Route::get('/warehouse-occupancy', [DashboardController::class, 'warehouseOccupancy'])
            ->name('dashboard.warehouse-occupancy');
        Route::get('/critical-stock', [DashboardController::class, 'criticalStock'])
            ->name('dashboard.critical-stock');
        Route::get('/metrics', [DashboardController::class, 'metrics'])
            ->name('dashboard.metrics');

        /**
         * INVENTORY DASHBOARD ROUTES
         * Endpoints específicos para el dashboard de inventario global
         */
        Route::prefix('inventory')->group(function () {
            Route::get('/kpis', [InventoryDashboardController::class, 'getKpis'])
                ->name('dashboard.inventory.kpis');
            Route::get('/existencias', [InventoryDashboardController::class, 'getExistencias'])
                ->name('dashboard.inventory.existencias');
            // TAREA 1: Tabla refactorizada con datos reales
            Route::get('/table', [InventoryDashboardController::class, 'getInventoryTable'])
                ->name('dashboard.inventory.table');
            // TAREA 3: Distribución por estado para la gráfica
            Route::get('/distribution-by-state', [InventoryDashboardController::class, 'getInventoryDistributionByState'])
                ->name('dashboard.inventory.distribution-by-state');
            // NUEVO: Distribución por categoría para la nueva gráfica
            Route::get('/distribution-by-category', [InventoryDashboardController::class, 'getInventoryDistributionByCategory'])
                ->name('dashboard.inventory.distribution-by-category');
            // TAREA 4: Top 5 estantes por cantidad para gráfica de barras
            Route::get('/top-shelves', [InventoryDashboardController::class, 'getTopShelvesByQuantity'])
                ->name('dashboard.inventory.top-shelves');
        });
    });

    /**
     * TEST DASHBOARD ROUTES - Para debugging
     */
    Route::prefix('test/dashboard')->group(function () {
        Route::get('/ping', [TestDashboardController::class, 'ping'])
            ->name('test.dashboard.ping');
        Route::get('/simple', [TestDashboardController::class, 'simple'])
            ->name('test.dashboard.simple');
        Route::get('/orders', [TestDashboardController::class, 'testOrders'])
            ->name('test.dashboard.orders');
        Route::get('/debug-error', [TestDashboardController::class, 'debugError'])
            ->name('test.dashboard.debug-error');
    });
});
