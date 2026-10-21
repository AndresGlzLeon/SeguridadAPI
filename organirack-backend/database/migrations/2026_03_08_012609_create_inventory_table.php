<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. La nueva tabla de catálogo
        Schema::create('estados_inventario', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50)->unique(); // Ej: Disponible, Dañado, En Cuarentena, Merma
            $table->text('descripcion')->nullable();
            $table->timestamps();
        });

        // 2. Nuestra tabla pivote actualizada
        Schema::create('inventarios', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('producto_id')->constrained('productos')->restrictOnDelete();
            $table->foreignId('estante_id')->constrained('estantes')->restrictOnDelete();
            
            // ¡Aquí entra la nueva normalización!
            $table->foreignId('estado_id')->constrained('estados_inventario')->restrictOnDelete();
            
            $table->decimal('cantidad', 10, 2)->default(0); 
            $table->timestamps();

            // La regla de oro ahora incluye el estado. 
            // Permite tener 8 laptops "Disponibles" y 2 "Dañadas" en el mismo estante en filas separadas.
            $table->unique(['producto_id', 'estante_id', 'estado_id']); 
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventarios');
        Schema::dropIfExists('estados_inventario');
    }
};