<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Almacen extends Model
{
    use HasFactory;

    protected $table = 'almacenes';

    protected $fillable = [
        'nombre',
        'siglas',
    ];


    public function pasillos(): HasMany
    {
        return $this->hasMany(Pasillo::class);
    }
}
