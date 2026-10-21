<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PrioridadOrden extends Model
{
    use HasFactory;

    protected $table = 'prioridades_orden';

    protected $fillable = [
        'nombre',
        'nivel_ordenamiento',
    ];

    public function ordenes(): HasMany
    {
        return $this->hasMany(OrdenSurtido::class, 'prioridad_id');
    }
}
