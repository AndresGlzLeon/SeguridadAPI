<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Producto extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'productos';

    protected $fillable = [
        'sku',
        'nombre',
        'categoria_id',
        'unidad_medida_id',
        'marca_id',
        'stock_min',
        'stock_max',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'estado' => 'boolean',
            'stock_min' => 'integer',
            'stock_max' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('producto')
            ->logOnly(['nombre', 'stock_min', 'stock_max', 'estado'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $eventName) => "Producto {$eventName}");
    }

    // ============== RELACIONES ==============

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function unidadMedida(): BelongsTo
    {
        return $this->belongsTo(UnidadMedida::class, 'unidad_medida_id');
    }

    public function marca(): BelongsTo
    {
        return $this->belongsTo(Marca::class);
    }

    public function inventarios(): HasMany
    {
        return $this->hasMany(Inventario::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'producto_id');
    }

    // ============== SCOPES ==============

    public function scopeActivos($query)
    {
        return $query->where('estado', true);
    }

    public function scopePorSku($query, string $sku)
    {
        return $query->where('sku', $sku);
    }
}