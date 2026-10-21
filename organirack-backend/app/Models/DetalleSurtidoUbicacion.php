<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * DetalleSurtidoUbicacion
 * 
 * Mapea tabla: detalles_surtido_ubicaciones
 * 
 * Registra cada pick individual en el proceso de recolección.
 * Permite múltiples ubicaciones por detalle de surtido.
 * Proporciona trazabilidad completa: quién, qué, cuándo y de dónde.
 */
class DetalleSurtidoUbicacion extends Model
{
    use HasFactory;

    protected $table = 'detalles_surtido_ubicaciones';

    // Sin timestamps automáticos en update, solo usamos created_at manual
    public $timestamps = false;

    protected $fillable = [
        'detalle_surtido_id',
        'estante_id',
        'cantidad_tomada',
        'user_id',
    ];

    protected $casts = [
        'cantidad_tomada' => 'float',
        'created_at' => 'datetime',
    ];

    // ============================================
    // RELACIONES
    // ============================================

    /**
     * Un registro de ubicación pertenece a UN detalle de surtido
     */
    public function detalle(): BelongsTo
    {
        return $this->belongsTo(DetalleSurtido::class, 'detalle_surtido_id');
    }

    /**
     * Un registro de ubicación pertenece a UN estante (dónde se tomó)
     */
    public function estante(): BelongsTo
    {
        return $this->belongsTo(Estante::class, 'estante_id');
    }

    /**
     * Un registro fue creado por UN usuario (almacenista)
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
