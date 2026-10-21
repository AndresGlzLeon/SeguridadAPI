<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ejecutar las migraciones.
     */
    public function up(): void
    {
        // 1. Catálogo: Estados de la Orden
        Schema::create('estados_orden', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50)->unique(); 
            $table->string('color_hex', 7)->default('#808080'); 
            $table->timestamps();
        });

        // 2. Catálogo: Prioridades
        Schema::create('prioridades_orden', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50)->unique(); 
            $table->integer('nivel_ordenamiento')->default(0); 
            $table->timestamps();
        });

        // 3. Cabecera: Órdenes de Surtido
        Schema::create('ordenes_surtido', function (Blueprint $table) {
            $table->id();
            
            $table->string('folio', 20)->unique(); // Ej. ORD-2441
            
            $table->foreignId('capturista_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('almacenista_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->string('referencia_destino', 150)->nullable(); 
            
            $table->foreignId('estado_id')->constrained('estados_orden')->restrictOnDelete();
            $table->foreignId('prioridad_id')->constrained('prioridades_orden')->restrictOnDelete();
            
            $table->dateTime('fecha_requerida')->nullable();
            
            $table->timestamps();
        });

        // 4. Detalle: Partidas de la Orden
        Schema::create('detalles_surtido', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('orden_surtido_id')->constrained('ordenes_surtido')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('productos')->restrictOnDelete();
            
            $table->decimal('cantidad_requerida', 10, 2);
            $table->decimal('cantidad_surtida', 10, 2)->default(0); 
            
            // Origen sugerido vs Origen real (OVERRIDE)
            $table->foreignId('estante_sugerido_id')->constrained('estantes')->restrictOnDelete();
            $table->foreignId('estante_real_id')->nullable()->constrained('estantes')->restrictOnDelete();
            
            $table->boolean('fue_modificado')->default(false); 
            
            $table->timestamps();
        });
    }

    /**
     * Revertir las migraciones (Rollback).
     */
    public function down(): void
    {
        // ¡El orden inverso es vital!
        Schema::dropIfExists('detalles_surtido');
        Schema::dropIfExists('ordenes_surtido');
        Schema::dropIfExists('prioridades_orden');
        Schema::dropIfExists('estados_orden');
    }
};