<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Http\Kernel');
$response = $kernel->handle($request = Illuminate\Http\Request::capture());

use Illuminate\Support\Facades\DB;

echo "=== VERIFICACIÓN DE DATOS GENERADOS ===\n\n";

$estantes = DB::table('estantes')->count();
$productos = DB::table('productos')->count();
$inventarios = DB::table('inventarios')->count();
$ordenes = DB::table('ordenes_surtido')->count();
$detalles = DB::table('detalles_surtido')->count();
$usuarios = DB::table('users')->count();
$almacenes = DB::table('almacenes')->count();

echo "ESTRUCTURA:\n";
echo "├─ Almacenes: $almacenes\n"; 
echo "├─ Estantes/Ubicaciones: $estantes\n";
echo "└─ Usuarios: $usuarios\n\n";

echo "DATOS DE NEGOCIO:\n";
echo "├─ Productos: $productos\n";
echo "├─ Registros Inventario: $inventarios\n";
echo "├─ Órdenes de Picking: $ordenes\n";
echo "└─ Detalles de Picking: $detalles\n\n";

$overrides = DB::table('detalles_surtido')
    ->where('fue_modificado', true)
    ->whereNotNull('estante_real_id')
    ->count();

$pctOverride = round(($overrides / $detalles) * 100, 1);
echo "CASOS DE OVERRIDE:\n";
echo "└─ Detalles con override: $overrides (~$pctOverride%)\n\n";

// Distribución por estado
$estados = DB::table('ordenes_surtido')
    ->join('estados_orden', 'ordenes_surtido.estado_id', '=', 'estados_orden.id')
    ->select('estados_orden.nombre', DB::raw('COUNT(*) as count'))
    ->groupBy('estados_orden.nombre')
    ->get();

echo "DISTRIBUCIÓN POR ESTADO:\n";
foreach ($estados as $estado) {
    echo "├─ " . $estado->nombre . ": " . $estado->count . " órdenes\n";
}

// Primeras y últimas órdenes
$primerasOrdenes = DB::table('ordenes_surtido')
    ->select('folio')
    ->orderBy('id')
    ->limit(3)
    ->pluck('folio');

$ultimasOrdenes = DB::table('ordenes_surtido')
    ->select('folio')
    ->orderBy('id', 'DESC')
    ->limit(3)
    ->pluck('folio');

echo "\nPRIMERAS 3 ÓRDENES:\n";
foreach ($primerasOrdenes as $folio) {
    echo "├─ $folio\n";
}

echo "\nÚLTIMAS 3 ÓRDENES:\n";
foreach ($ultimasOrdenes as $folio) {
    echo "├─ $folio\n";
}

// Almacenistas
$almacenistas = DB::table('users')
    ->join('model_has_roles', 'users.id', '=', 'model_has_roles.model_id')
    ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
    ->where('roles.name', 'Almacenista')
    ->select('users.name')
    ->get();

echo "\nALMACENISTAS CREADOS (" . count($almacenistas) . "):\n";
foreach ($almacenistas as $almacenista) {
    echo "├─ " . $almacenista->name . "\n";
}

echo "\n✅ SEEDING COMPLETADO EXITOSAMENTE\n";
