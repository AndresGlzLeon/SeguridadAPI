<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ejecutar las migraciones.
     * 
     * Crea tabla pivot para registrar cada pick individual en el proceso de recolección.
     * Permite trazabilidad completa: quién recolectó qué, cuándo y de dónde.
     */
    public function up(): void
    {
        Schema::create('detalles_surtido_ubicaciones', function (Blueprint $table) {
            $table->id();
            
            // FK a detalle de surtido
            $table->foreignId('detalle_surtido_id')
                ->constrained('detalles_surtido')
                ->cascadeOnDelete();
            
            // FK a estante (dónde se tomó)
            $table->foreignId('estante_id')
                ->constrained('estantes')
                ->restrictOnDelete();
            
            // Cantidad tomada en este pick
            $table->decimal('cantidad_tomada', 10, 2)->not_null();
            
            // Usuario que realizó el pick
            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();
            
            // Timestamp de cuándo se realizó el pick
            $table->timestamp('created_at')->useCurrent();
            
            // Índices para optimizar queries
            $table->index('detalle_surtido_id');
            $table->index('estante_id');
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    /**
     * Revertir las migraciones (Rollback).
     */
    public function down(): void
    {
        Schema::dropIfExists('detalles_surtido_ubicaciones');
    }
};
