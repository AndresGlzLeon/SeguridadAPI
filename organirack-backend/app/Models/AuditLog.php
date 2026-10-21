<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $table = 'audit_logs';

    protected $fillable = [
        'producto_id',
        'detalle_surtido_id',
        'user_id',
        'estante_origen_id',
        'estante_destino_id',
        'tipo_movimiento',
        'cantidad_anterior',
        'cantidad_nueva',
        'observaciones',
        'fecha_hora',
    ];

    protected function casts(): array
    {
        return [
            'cantidad_anterior' => 'integer',
            'cantidad_nueva' => 'integer',
            'fecha_hora' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // ============== RELACIONES ==============

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function estanteOrigen(): BelongsTo
    {
        return $this->belongsTo(Estante::class, 'estante_origen_id');
    }

    public function estanteDestino(): BelongsTo
    {
        return $this->belongsTo(Estante::class, 'estante_destino_id');
    }

    public function detalleSurtido(): BelongsTo
    {
        return $this->belongsTo(DetalleSurtido::class, 'detalle_surtido_id');
    }

    // ============== SCOPES ==============

    public function scopePorTipo($query, string $tipo)
    {
        return $query->where('tipo_movimiento', $tipo);
    }

    public function scopeDelUsuario($query, int $usuarioId)
    {
        return $query->where('user_id', $usuarioId);
    }
}
