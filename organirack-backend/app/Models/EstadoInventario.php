<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EstadoInventario extends Model
{
    use HasFactory;

    protected $table = 'estados_inventario';

    protected $fillable = [
        'nombre',
    ];

    public function inventarios(): HasMany
    {
        return $this->hasMany(Inventario::class, 'estado_id');
    }
}
