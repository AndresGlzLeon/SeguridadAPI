<?php

use Illuminate\Support\Facades\Route;

/**
 * HEALTH CHECK ENDPOINT
 * Retorna estado del API
 */
Route::get('/', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'OrganiRack+ API - Headless Backend',
        'version' => app()->version(),
        'timestamp' => now(),
    ], 200);
});
