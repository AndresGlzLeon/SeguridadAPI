<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pasillo extends Model
{
    use HasFactory;

    protected $table = 'pasillos';

    protected $fillable = [
        'almacen_id',
        'nombre',
    ];

    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class);
    }

    public function racks(): HasMany
    {
        return $this->hasMany(Rack::class);
    }
}
