<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Estante extends Model
{
    use HasFactory;

    protected $table = 'estantes';

    protected $fillable = [
        'rack_id',
        'nivel',
        'codigo_etiqueta',
        'tipo_zona',
        'esta_lleno',
    ];

    protected function casts(): array
    {
        return [
            'esta_lleno' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // ============== RELACIONES ==============

    public function rack(): BelongsTo
    {
        return $this->belongsTo(Rack::class);
    }

    public function inventarios(): HasMany
    {
        return $this->hasMany(Inventario::class);
    }

    public function auditLogsOrigen(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'estante_origen_id');
    }

    public function auditLogsDestino(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'estante_destino_id');
    }

    // ============== SCOPES ==============

    public function scopePorCodigo($query, string $codigo)
    {
        return $query->where('codigo_etiqueta', $codigo);
    }

    public function scopeNoLlenos($query)
    {
        return $query->where('esta_lleno', false);
    }
}
