<?php

use Illuminate\Support\Facades\Route;

/**
 * HEALTH CHECK ENDPOINT
 * Retorna estado del API
 */
Route::get('/', function () {
    return response()->json([
        'status'    => 'ok',
        'message'   => 'OrganiRack+ API - Headless Backend',
        'version'   => app()->version(),
        'timestamp' => now(),
    ], 200);
});

/**
 * SECURITY LAB — Interfaz de pruebas de seguridad
 * Accede desde el navegador en: /lab
 */
Route::get('/lab', function () {
    return view('security-lab');
})->name('security.lab');
