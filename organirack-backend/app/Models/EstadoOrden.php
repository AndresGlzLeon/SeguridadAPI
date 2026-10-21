<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EstadoOrden extends Model
{
    use HasFactory;

    protected $table = 'estados_orden';

    protected $fillable = [
        'nombre',
        'color_hex',
    ];

    public function ordenes(): HasMany
    {
        return $this->hasMany(OrdenSurtido::class, 'estado_id');
    }
}
