<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Almacenes (Raíz máxima actual)
        Schema::create('almacenes', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->string('siglas', 10)->nullable();
            $table->timestamps();
        });

        // 3. Pasillos (Vinculados a Almacén)
        Schema::create('pasillos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('almacen_id')->constrained('almacenes')->restrictOnDelete();
            $table->string('nombre', 50);
            $table->timestamps();
        });

        // 4. Racks (Vinculados a Pasillo)
        Schema::create('racks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pasillo_id')->constrained('pasillos')->restrictOnDelete();
            $table->string('nombre_rack', 50);
            $table->timestamps();
        });

        // 5. Estantes / Niveles (El "Nodo" final para el picking)
        Schema::create('estantes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rack_id')->constrained('racks')->restrictOnDelete();
            $table->string('nivel', 50);
            $table->string('codigo_etiqueta', 50)->unique();
            $table->string('tipo_zona', 50)->nullable();
            $table->boolean('esta_lleno')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // El orden inverso es obligatorio para no romper las llaves foráneas
        Schema::dropIfExists('estantes');
        Schema::dropIfExists('racks');
        Schema::dropIfExists('pasillos');
        Schema::dropIfExists('almacenes');
    }
};
