<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventario extends Model
{
    use HasFactory;

    protected $table = 'inventarios';

    protected $fillable = [
        'producto_id',
        'estante_id',
        'estado_id',
        'cantidad',
    ];

    protected function casts(): array
    {
        return [
            'cantidad' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }



    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function estante(): BelongsTo
    {
        return $this->belongsTo(Estante::class);
    }

    public function estado(): BelongsTo
    {
        return $this->belongsTo(EstadoInventario::class, 'estado_id');
    }
}
