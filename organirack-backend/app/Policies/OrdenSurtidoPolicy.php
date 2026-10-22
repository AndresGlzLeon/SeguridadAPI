<?php

namespace App\Policies;

use App\Models\OrdenSurtido;
use App\Models\User;

/**
 * Policy: OrdenSurtidoPolicy
 *
 * Centraliza la lógica de autorización para el modelo OrdenSurtido.
 * Protege contra ataques BOLA/IDOR verificando que el recurso pertenezca
 * al usuario autenticado (capturista_id), con excepción de roles privilegiados.
 *
 * Roles con acceso irrestricto:
 *   - Administrador
 *   - Gerencia de Operaciones
 */
class OrdenSurtidoPolicy
{
    /**
     * Bypass automático para roles de alto privilegio.
     *
     * Este método se ejecuta ANTES que cualquier otro método de la policy.
     * Si retorna true, la autorización se concede sin evaluar las demás reglas.
     * Si retorna null, se continúa evaluando el método de la acción específica.
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->hasRole(['Administrador', 'Gerencia de Operaciones'])) {
            return true; // Acceso irrestricto: omite las demás verificaciones
        }

        return null; // Continúa evaluando el método de la acción
    }

    /**
     * Determina si el usuario puede ver una orden específica.
     * Protección IDOR: solo el capturista que creó la orden puede verla.
     */
    public function view(User $user, OrdenSurtido $orden): bool
    {
        return $user->id === $orden->capturista_id;
    }

    /**
     * Determina si el usuario puede actualizar una orden específica.
     * Protección IDOR: solo el capturista propietario puede modificarla.
     */
    public function update(User $user, OrdenSurtido $orden): bool
    {
        return $user->id === $orden->capturista_id;
    }

    /**
     * Determina si el usuario puede eliminar una orden específica.
     * Protección IDOR: solo el capturista propietario puede eliminarla.
     */
    public function delete(User $user, OrdenSurtido $orden): bool
    {
        return $user->id === $orden->capturista_id;
    }
}
