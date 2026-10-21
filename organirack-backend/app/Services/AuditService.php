<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditLog;
use App\Models\DetalleSurtido;
use App\Models\Inventario;
use App\Models\OrdenSurtido;
use App\Models\Producto;
use App\Models\User;
use Carbon\Carbon;
use Carbon\Exceptions\InvalidFormatException;
use Illuminate\Pagination\LengthAwarePaginator;

class AuditService
{
    /**
     * Máximo de registros permitidos por página
     */
    private const MAX_PER_PAGE = 100;

    /**
     * Valor por defecto de registros por página
     */
    private const DEFAULT_PER_PAGE = 15;

    /**
     * Obtiene logs de auditoria paginados con filtros.
     * Valida todos los filtros antes de consultarlos.
     *
     * @param array<string, mixed> $filters Filtros: date_from, date_to, causer_id, subject_type, search, per_page, page
    * @return LengthAwarePaginator Resultados paginados con causer eager-loaded
     *
     * @throws \Exception Si los filtros de fecha son inválidos
     */
    public function getAuditLogs(array $filters = []): LengthAwarePaginator
    {
        // Validar y normalizar filtros
        $this->validateFilters($filters);

        $perPage = (int) ($filters['per_page'] ?? self::DEFAULT_PER_PAGE);
        $perPage = $perPage > 0 ? min($perPage, self::MAX_PER_PAGE) : self::DEFAULT_PER_PAGE;

        $query = AuditLog::query()
            ->with([
                'user:id,name,username',
                'detalleSurtido.producto:id,sku,nombre',
                'detalleSurtido.estanteSugerido:id,codigo_etiqueta',
                'detalleSurtido.estanteReal:id,codigo_etiqueta',
                'estanteOrigen:id,codigo_etiqueta',
                'estanteDestino:id,codigo_etiqueta'
            ])
            ->latest('fecha_hora');

        // Filtro: desde fecha
        if (!empty($filters['date_from'])) {
            try {
                $fromDate = Carbon::parse((string) $filters['date_from'])->startOfDay();
                $query->where('fecha_hora', '>=', $fromDate);
            } catch (InvalidFormatException $e) {
                throw new \Exception("Formato de date_from inválido: {$e->getMessage()}");
            }
        }

        // Filtro: hasta fecha
        if (!empty($filters['date_to'])) {
            try {
                $toDate = Carbon::parse((string) $filters['date_to'])->endOfDay();
                $query->where('fecha_hora', '<=', $toDate);
            } catch (InvalidFormatException $e) {
                throw new \Exception("Formato de date_to inválido: {$e->getMessage()}");
            }
        }

        // Filtro: usuario que causó la auditoría
        if (!empty($filters['causer_id'])) {
            $causerId = (int) $filters['causer_id'];
            if ($causerId > 0) {
                $query->where('user_id', $causerId);
            }
        }

        // Filtro: tipo de movimiento
        if (!empty($filters['tipo_movimiento'])) {
            $query->where('tipo_movimiento', (string) $filters['tipo_movimiento']);
        }

        // Filtro: búsqueda de texto en descripción, evento, etc.
        if (!empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            if (strlen($search) > 2) { // Evitar búsquedas muy cortas
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('observaciones', 'like', "%{$search}%")
                        ->orWhere('tipo_movimiento', 'like', "%{$search}%")
                        ->orWhere('cantidad_nueva', 'like', "%{$search}%")
                        ->orWhere('cantidad_anterior', 'like', "%{$search}%");
                });
            }
        }
        return $query->paginate($perPage);
    }

    /**
     * Obtiene opciones para los selects de filtro.
     *
     * @return array<string, mixed> Array con 'users' y 'movement_types'
     */
    public function getFilterOptions(): array
    {
        $causerIds = AuditLog::query()
            ->whereNotNull('user_id')
            ->distinct()
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        $users = User::query()
            ->whereIn('id', $causerIds)
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->values()
            ->all();

        // Obtener tipos de movimiento reales de la BD
        $movementTypes = AuditLog::query()
            ->whereNotNull('tipo_movimiento')
            ->distinct()
            ->pluck('tipo_movimiento')
            ->map(fn ($type) => [
                'value' => $type,
                'label' => $this->humanizeMovementType((string) $type),
            ])
            ->values()
            ->all();

        return [
            'users' => $users,
            'movement_types' => $movementTypes,
        ];
    }

    /**
     * Valida los filtros de búsqueda.
     *
     * @param array<string, mixed> $filters
     * @throws \Exception Si algún filtro es inválido
     */
    private function validateFilters(array &$filters): void
    {
        if (isset($filters['per_page']) && !is_numeric($filters['per_page'])) {
            throw new \Exception('per_page debe ser un número');
        }
        if (isset($filters['page']) && !is_numeric($filters['page'])) {
            throw new \Exception('page debe ser un número');
        }
        if (isset($filters['search']) && strlen((string) $filters['search']) > 255) {
            throw new \Exception('search no puede exceder 255 caracteres');
        }
        if (isset($filters['causer_id']) && !is_numeric($filters['causer_id'])) {
            throw new \Exception('causer_id debe ser un número');
        }
    }

    /**
     * Humaniza el tipo de movimiento para mostrar en la interfaz.
     */
    private function humanizeMovementType(string $type): string
    {
        return match (strtolower(trim($type))) {
            'override' => 'Override (Cambio de ubicación)',
            'ajuste_manual' => 'Ajuste Manual de Stock',
            'vaciado_manual' => 'Vaciado Manual',
            'picking' => 'Picking (Surtido)',
            'reconteo' => 'Reconteo',
            'entrada' => 'Entrada de Mercancía',
            'salida' => 'Salida de Mercancía',
            default => ucfirst(str_replace('_', ' ', $type)),
        };
    }
}
