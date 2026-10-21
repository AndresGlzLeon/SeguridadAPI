<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Categorías (Base)
        Schema::create('categorias', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100)->unique();
            $table->text('descripcion')->nullable();
            $table->timestamps();
        });

        // 2. Unidades de Medida (Base)
        Schema::create('unidades_medida', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50)->unique();
            $table->string('abreviatura', 10)->nullable();
            $table->timestamps();
        });

        // 3. Marcas (Base)
        Schema::create('marcas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100)->unique();
            $table->string('sitio_web')->nullable();
            $table->timestamps();
        });

        // 4. Productos (Depende de las 3 anteriores)
        Schema::create('productos', function (Blueprint $table) {
            $table->id();
            $table->string('sku', 50)->unique();
            $table->string('nombre', 150);
            
            // Llaves foráneas a catálogos
            $table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
            $table->foreignId('unidad_medida_id')->nullable()->constrained('unidades_medida')->nullOnDelete();
            $table->foreignId('marca_id')->nullable()->constrained('marcas')->nullOnDelete();
            
            // Control de inventarios
            $table->integer('stock_min')->default(0);
            $table->integer('stock_max')->nullable();
            $table->boolean('estado')->default(true);
            
            $table->timestamps();
            
            // Índices para búsquedas rápidas
            $table->index('sku');
            $table->index('categoria_id');
        });
    }

    public function down(): void
    {
        // Orden inverso: primero la que tiene dependencias
        Schema::dropIfExists('productos');
        Schema::dropIfExists('marcas');
        Schema::dropIfExists('unidades_medida');
        Schema::dropIfExists('categorias');
    }
};
