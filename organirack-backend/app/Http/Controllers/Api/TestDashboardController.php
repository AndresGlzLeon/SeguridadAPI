<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class TestDashboardController extends Controller
{
    /**
     * Testing individual endpoints to isolate errors
     * GET /api/test/dashboard/ping
     */
    public function ping(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'message' => 'Autenticación funcionando correctamente',
            'user' => auth()->user() ? auth()->user()->email : null,
        ]);
    }

    /**
     * Test básico sin queries complejas
     * GET /api/test/dashboard/simple
     */
    public function simple(): JsonResponse
    {
        try {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'timestamp' => now(),
                    'authenticated' => auth()->check(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test de órdenes (query simple)
     * GET /api/test/dashboard/orders
     */
    public function testOrders(): JsonResponse
    {
        try {
            $ordenes = \App\Models\OrdenSurtido::count();

            return response()->json([
                'status' => 'success',
                'total_ordenes' => $ordenes,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ], 500);
        }
    }

    /**
     * Test de error detallado
     * GET /api/test/dashboard/debug-error
     */
    public function debugError(): JsonResponse
    {
        try {
            \DB::connection()->getPdo();

            return response()->json([
                'status' => 'success',
                'database' => 'connected',
                'config' => [
                    'driver' => config('database.default'),
                    'database' => config('database.connections.mysql.database'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'database_error' => $e->getMessage(),
            ], 500);
        }
    }
}
