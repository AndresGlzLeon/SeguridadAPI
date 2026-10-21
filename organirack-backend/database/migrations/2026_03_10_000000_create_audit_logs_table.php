<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ejecutar las migraciones.
     * REQ-008: Registro inmutable de movimientos
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('detalle_surtido_id')->nullable()->constrained('detalles_surtido')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            
            // Ubicaciones origen y destino
            $table->foreignId('estante_origen_id')->constrained('estantes')->restrictOnDelete();
            $table->foreignId('estante_destino_id')->nullable()->constrained('estantes')->nullOnDelete();
            
            // Tipo de movimiento: 'picking', 'reconteo', 'ajuste', etc.
            $table->string('tipo_movimiento', 50);
            
            // Trazabilidad de cantidades
            $table->integer('cantidad_anterior');
            $table->integer('cantidad_nueva');
            
            // Observaciones del movimiento
            $table->text('observaciones')->nullable();
            
            // Timestamp del movimiento
            $table->timestamp('fecha_hora')->useCurrent();
            
            // Auditoría estándar
            $table->timestamps();
            
            // Índices para búsquedas frecuentes
            $table->index('user_id');
            $table->index('fecha_hora');
            $table->index('tipo_movimiento');
        });
    }

    /**
     * Revertir las migraciones (Rollback).
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
