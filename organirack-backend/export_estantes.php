<?php

/**
 * Script Simple para Exportar Códigos de Estantes
 * 
 * USAR:
 * php export_estantes.php csv    → Genera archivo CSV
 * php export_estantes.php json   → Genera archivo JSON
 * php export_estantes.php txt    → Solo códigos (uno por línea)
 */

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Http\Kernel');
$response = $kernel->handle($request = Illuminate\Http\Request::capture());

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

$formato = isset($argv[1]) ? $argv[1] : 'csv';

echo "🚀 Exportando códigos de estantes...\n\n";

// Obtener todos los estantes
$estantes = DB::table('estantes')
    ->select('id', 'codigo_etiqueta', 'tipo_zona', 'esta_lleno')
    ->get();

if ($estantes->isEmpty()) {
    echo "❌ Error: No hay estantes en la base de datos\n";
    exit(1);
}

// Generar contenido según formato
$contenido = '';
$nombreArchivo = "estantes_codigos_" . date('Ymd_His');

switch($formato) {
    case 'csv':
        $nombreArchivo .= ".csv";
        $contenido = "ID,CODIGO_ETIQUETA,TIPO_ZONA,ESTADO\n";
        foreach ($estantes as $estante) {
            $estado = $estante->esta_lleno ? 'Lleno' : 'Libre';
            $contenido .= "{$estante->id},{$estante->codigo_etiqueta},{$estante->tipo_zona},{$estado}\n";
        }
        break;

    case 'json':
        $nombreArchivo .= ".json";
        $contenido = json_encode($estantes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        break;

    case 'txt':
        $nombreArchivo .= ".txt";
        $contenido = "CÓDIGOS DE ESTANTES PARA QR\n";
        $contenido .= "=".str_repeat("=", 50)."\n";
        $contenido .= "Generado: " . date('Y-m-d H:i:s') . "\n";
        $contenido .= "Total: " . count($estantes) . " estantes\n";
        $contenido .= "=".str_repeat("=", 50)."\n\n";
        foreach ($estantes as $estante) {
            $contenido .= $estante->codigo_etiqueta . "\n";
        }
        break;

    default:
        echo "❌ Formato desconocido: $formato\n";
        echo "   Usa: csv, json o txt\n";
        exit(1);
}

// Crear directorio de exports
$directorioExports = storage_path('app/exports');
if (!is_dir($directorioExports)) {
    mkdir($directorioExports, 0755, true);
}

// Guardar archivo
$rutaArchivo = "$directorioExports/$nombreArchivo";
file_put_contents($rutaArchivo, $contenido);

echo "✅ Archivo exportado exitosamente\n\n";
echo "📄 Nombre: $nombreArchivo\n";
echo "📁 Ruta: $rutaArchivo\n";
echo "📊 Total de estantes: " . count($estantes) . "\n\n";

// Mostrar preview
if ($formato === 'txt' || $formato === 'csv') {
    echo "📋 Preview (primeros 5 códigos):\n";
    echo "───────────────────────────────\n";
    $lineas = explode("\n", $contenido);
    for ($i = 0; $i < min(7, count($lineas)); $i++) {
        if (!empty($lineas[$i])) {
            echo $lineas[$i] . "\n";
        }
    }
    echo "───────────────────────────────\n";
}

echo "\n✨ ¡Listo para convertir a QR!\n";
