<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class DetalleSurtido extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'detalles_surtido';

    protected $fillable = [
        'orden_surtido_id',
        'producto_id',
        'cantidad_requerida',
        'cantidad_surtida',
        'estante_sugerido_id',
        'estante_real_id',
        'fue_modificado',
    ];

    protected function casts(): array
    {
        return [
            'fue_modificado' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('detalle_surtido')
            ->logOnly(['cantidad_surtida', 'fue_modificado', 'estante_real_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $eventName) => "Detalle de surtido {$eventName}");
    }

    // ============== RELACIONES ==============

    public function ordenSurtido(): BelongsTo
    {
        return $this->belongsTo(OrdenSurtido::class, 'orden_surtido_id');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function estanteSugerido(): BelongsTo
    {
        return $this->belongsTo(Estante::class, 'estante_sugerido_id');
    }

    public function estanteReal(): BelongsTo
    {
        return $this->belongsTo(Estante::class, 'estante_real_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'detalle_surtido_id');
    }

    /**
     * ✨ NUEVO: Un detalle puede tener múltiples registros de recolección
     * desde diferentes ubicaciones (tabla pivot)
     */
    public function ubicaciones(): HasMany
    {
        return $this->hasMany(DetalleSurtidoUbicacion::class, 'detalle_surtido_id');
    }

    /**
     * Calcular cantidad total surtida sumando desde tabla pivot
     * (NOTA: cantidad_surtida en detalles_surtido también se actualiza)
     * Este método permite validar integridad de datos
     */
    public function calcularCantidadSurtidaDesdeUbicaciones(): float
    {
        return (float)$this->ubicaciones()->sum('cantidad_tomada');
    }

    /**
     * Verificar si detalle está completo
     * (cantidad_surtida >= cantidad_requerida)
     */
    public function estaCompleto(): bool
    {
        return (float)$this->cantidad_surtida >= (float)$this->cantidad_requerida;
    }

    /**
     * Obtener cantidad restante para completar este detalle
     */
    public function getCantidadRestante(): float
    {
        $restante = (float)$this->cantidad_requerida - (float)$this->cantidad_surtida;
        return max(0, $restante);
    }
}
