<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class OrdenSurtido extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'ordenes_surtido';

    protected $fillable = [
        'folio',
        'capturista_id',
        'almacenista_id',
        'referencia_destino',
        'estado_id',
        'prioridad_id',
        'fecha_requerida',
    ];

    protected function casts(): array
    {
        return [
            'fecha_requerida' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('orden_surtido')
            ->logOnly(['estado_id', 'prioridad_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $eventName) => "Orden de surtido {$eventName}");
    }

    public function capturista(): BelongsTo
    {
        return $this->belongsTo(User::class, 'capturista_id');
    }

    public function almacenista(): BelongsTo
    {
        return $this->belongsTo(User::class, 'almacenista_id');
    }

    public function estado(): BelongsTo
    {
        return $this->belongsTo(EstadoOrden::class);
    }

    public function prioridad(): BelongsTo
    {
        return $this->belongsTo(PrioridadOrden::class, 'prioridad_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(DetalleSurtido::class, 'orden_surtido_id');
    }
}
