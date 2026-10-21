<?php

namespace App\Console\Commands;

use App\Models\Estante;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ExportarCodigosEstantes extends Command
{
    protected $signature = 'export:codigos-estantes {--formato=csv : Formato de exportación (csv, json, txt)}';
    protected $description = 'Exporta todos los códigos de estantes para generar QR';

    public function handle()
    {
        $formato = $this->option('formato');
        $estantes = Estante::all(['id', 'codigo_etiqueta', 'tipo_zona', 'esta_lleno']);

        if ($estantes->isEmpty()) {
            $this->error('No hay estantes para exportar');
            return 1;
        }

        $contenido = match($formato) {
            'csv' => $this->generarCSV($estantes),
            'json' => $this->generarJSON($estantes),
            'txt' => $this->generarTXT($estantes),
            default => $this->generarCSV($estantes),
        };

        $nombreArchivo = "estantes_codigos_" . now()->format('Ymd_His') . ".$formato";
        $rutaArchivo = storage_path("app/exports/$nombreArchivo");

        // Crear directorio si no existe
        File::ensureDirectoryExists(dirname($rutaArchivo));
        File::put($rutaArchivo, $contenido);

        $this->info("✅ Archivo exportado: $nombreArchivo");
        $this->line("📁 Ubicación: $rutaArchivo");
        $this->line("📊 Total de estantes: " . $estantes->count());
        
        return 0;
    }

    private function generarCSV($estantes)
    {
        $csv = "ID,CODIGO_ETIQUETA,TIPO_ZONA,ESTADO\n";
        
        foreach ($estantes as $estante) {
            $estado = $estante->esta_lleno ? 'Lleno' : 'Libre';
            $csv .= "{$estante->id},{$estante->codigo_etiqueta},{$estante->tipo_zona},{$estado}\n";
        }
        
        return $csv;
    }

    private function generarJSON($estantes)
    {
        return json_encode($estantes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    private function generarTXT($estantes)
    {
        $txt = "CÓDIGOS DE ESTANTES PARA QR\n";
        $txt .= "=".str_repeat("=", 99)."\n";
        $txt .= "Generado: " . now()->format('Y-m-d H:i:s') . "\n";
        $txt .= "Total: " . $estantes->count() . " estantes\n";
        $txt .= "=".str_repeat("=", 99)."\n\n";
        
        foreach ($estantes as $estante) {
            $txt .= $estante->codigo_etiqueta . "\n";
        }
        
        return $txt;
    }
}
