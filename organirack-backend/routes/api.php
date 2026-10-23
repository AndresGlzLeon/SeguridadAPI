<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
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
            'show'  => 'orders.show',
        ]);

    // Endpoint para asignar almacenista a una orden
    // Nota: {order} usa route model binding => resuelve OrdenSurtido automáticamente
    Route::put('/orders/{order}/assign', [OrderController::class, 'assign'])
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

/**
 * SECURITY LAB ROUTES (Demostración interactiva de seguridad)
 *
 * V2: API Key de la aplicación
 * V3: Sanctum / JWT del usuario
 * V4: BOLA / IDOR y RBAC por roles
 * V5: Rate limiting real sobre consulta pesada de productos
 */
Route::middleware(['api.key'])->get('/security/app-check', function () {
    return response()->json([
        'status'  => 'ok',
        'layer'   => 'API Key Middleware',
        'message' => 'Dispositivo / Aplicación autorizada mediante X-API-KEY.',
        'app'     => config('app.name'),
    ]);
})->name('security.app-check');

Route::middleware(['auth:sanctum', 'api.key'])->get('/security/me', function (Request $request) {
    $user = $request->user();

    return response()->json([
        'status' => 'authenticated',
        'layer' => 'Laravel Sanctum (equivalente JWT stateless)',
        'message' => 'Identidad del usuario verificada mediante Bearer Token.',
        'user_profile' => [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'roles' => $user->getRoleNames(),
        ],
        'token_info' => [
            'token_id' => $user->currentAccessToken()?->id,
            'token_name' => $user->currentAccessToken()?->name,
            'abilities' => $user->currentAccessToken()?->abilities,
        ],
    ]);
})->name('security.me');

Route::middleware(['auth:sanctum'])->get('/security/orders/{order}', function (Request $request, \App\Models\OrdenSurtido $order) {
    $user = $request->user();
    $controlActivo = $request->query('control', 'on') === 'on';

    $order->load(['capturista:id,name,email', 'almacenista:id,name,email', 'estado', 'prioridad']);

    if ($controlActivo) {
        $esAdmin = $user->hasRole(['Administrador', 'Gerencia de Operaciones']);
        $esPropietario = $user->id === $order->capturista_id || $user->id === $order->almacenista_id;

        if (! $esAdmin && ! $esPropietario) {
            return response()->json([
                'error' => '403 Forbidden — Protección BOLA / IDOR Activa (OrdenSurtidoPolicy)',
                'message' => "Acceso bloqueado: Intentaste acceder a la Orden #{$order->id} ({$order->folio}), pero no te pertenece.",
                'tu_usuario' => "{$user->name} (ID: {$user->id}, Rol: " . $user->getRoleNames()->implode(', ') . ')',
                'dueno_real' => "Capturista ID: {$order->capturista_id} ({$order->capturista?->name}) / Almacenista asignado ID: {$order->almacenista_id} ({$order->almacenista?->name})",
            ], 403);
        }
    }

    return response()->json([
        'warning' => $controlActivo
            ? '✅ Acceso legítimo: eres el propietario o tienes un rol administrativo.'
            : '⚠️ VULNERABILIDAD BOLA/IDOR EXPLOTADA: la policy se desactivó y el servidor entregó una orden ajena.',
        'tu_usuario' => "{$user->name} (ID: {$user->id})",
        'data' => $order,
    ]);
})->name('security.orders.show');

Route::middleware(['auth:sanctum'])->delete('/security/products/{id}', function (Request $request, int $id) {
    $user = $request->user();
    $controlActivo = $request->query('control', 'on') === 'on';
    $producto = \App\Models\Producto::findOrFail($id);

    if ($controlActivo) {
        if (! $user->hasRole(['Administrador', 'Gerencia de Operaciones'])) {
            return response()->json([
                'error' => '403 Forbidden — Acción No Autorizada para tu Rol',
                'message' => "El usuario '{$user->name}' tiene rol de Almacenista y NO tiene permiso para eliminar productos del catálogo.",
                'accion' => "Intento de DELETE sobre Producto #{$producto->id} ({$producto->nombre})",
                'rol_actual' => $user->getRoleNames(),
            ], 403);
        }
    }

    return response()->json([
        'warning' => $controlActivo
            ? '✅ Eliminación autorizada por Rol Administrador (simulada para no vaciar la BD).'
            : '⚠️ VULNERABILIDAD EXPLOTADA: sin validación de Policy/Rol, un Almacenista pudo ejecutar DELETE sobre un producto del catálogo.',
        'producto_afectado' => [
            'id' => $producto->id,
            'sku' => $producto->sku,
            'nombre' => $producto->nombre,
        ],
    ]);
})->name('security.products.delete');

Route::middleware(['auth:sanctum', 'api.key'])->get('/security/heavy-products', function (Request $request) {
    $controlActivo = $request->query('control', 'on') === 'on';

    if ($controlActivo) {
        $key = 'heavy-catalog:' . ($request->user()?->id ?: $request->ip());

        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'error' => '429 Too Many Requests — Rate Limiter Activo (throttle:3,1)',
                'message' => 'Se detectó una ráfaga de peticiones sobre el catálogo pesado de productos. Petición bloqueada para proteger MySQL.',
                'retry_after' => "$seconds segundos",
            ], 429);
        }

        RateLimiter::hit($key, 60);
    }

    $productos = \App\Models\Producto::with(['categoria', 'marca', 'unidadMedida'])->paginate(10);

    return response()->json([
        'status' => 'ok',
        'protection' => $controlActivo ? 'Rate Limiter ACTIVO (máx. 3 req/min)' : 'SIN Rate Limiter (servidor expuesto a saturación)',
        'message' => 'Catálogo pesado de productos cargado desde MySQL.',
        'total_items_in_db' => $productos->total(),
        'sample_data' => collect($productos->items())->take(2),
    ]);
})->name('security.heavy-products');

Route::prefix('security')
    ->middleware(['auth:sanctum', 'api.key', 'throttle:3,1'])
    ->group(function () {
        Route::get('/status', function () {
            return response()->json([
                'status' => 'ok',
                'message' => 'API Key válida. Acceso autorizado.',
                'user' => auth()->user()?->name,
            ]);
        })->name('security.status');

        Route::get('/ping', function () {
            return response()->json([
                'pong' => true,
                'message' => 'Rate limiter activo. Máximo 3 peticiones por minuto.',
            ]);
        })->name('security.ping');
    });
