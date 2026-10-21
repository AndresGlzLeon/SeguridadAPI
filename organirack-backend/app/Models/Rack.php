<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rack extends Model
{
    use HasFactory;

    protected $table = 'racks';

    protected $fillable = [
        'pasillo_id',
        'nombre_rack',
    ];

    public function pasillo(): BelongsTo
    {
        return $this->belongsTo(Pasillo::class);
    }

    public function estantes(): HasMany
    {
        return $this->hasMany(Estante::class);
    }
}
