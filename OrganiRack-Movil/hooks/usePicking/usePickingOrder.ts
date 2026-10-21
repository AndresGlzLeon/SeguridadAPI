/**
 * Hook: usePickingOrder
 *
 * Responsabilidad única: Gestión de orden y detalles
 * - Carga datos remotos de la orden
 * - Maneja errores de carga
 * - Maneja estados de loading
 * - Fuerza reload desde API cuando es necesario (override, cambios múltiples)
 *
 * No se encarga de:
 * - Estado de picking local (ubicaciones, disponibilidad)
 * - Navegación entre items
 * - Confirmación de picks
 */

import { fetchPickingSuggestions } from "@API/picking";
import { PICKING_ERRORS } from "@constants/picking";
import type { OrdenSurtido } from "@models/orders";
import { useCallback, useState } from "react";

interface UsePickingOrderResult {
  orden: OrdenSurtido | null;
  isLoading: boolean;
  error: string | null;
  loadOrder: (id: number, forceRefresh?: boolean) => Promise<void>;
  updateOrden: (updatedOrden: OrdenSurtido) => void;
  clearError: () => void;
  // Marcar que necesita reload desde API
  needsReload: boolean;
  setNeedsReload: (value: boolean) => void;
}

/**
 * Gestiona el ciclo de vida de carga de una orden de picking
 */
export function usePickingOrder(): UsePickingOrderResult {
  const [orden, setOrden] = useState<OrdenSurtido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsReload, setNeedsReload] = useState(false);

  const loadOrder = useCallback(
    async (id: number, forceRefresh: boolean = false) => {
      // Si forceRefresh=true, cargar aunque ya haya orden
      if (!forceRefresh && orden) {
        // Ya tenemos orden, no recargar
        setNeedsReload(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchPickingSuggestions(id);
        setOrden(data);
        setNeedsReload(false);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : PICKING_ERRORS.LOAD_ORDER_FAILED;
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [orden],
  );

  const clearError = useCallback(() => setError(null), []);

  const updateOrden = useCallback((updatedOrden: OrdenSurtido) => {
    setOrden(updatedOrden);
  }, []);

  return {
    orden,
    isLoading,
    error,
    loadOrder,
    updateOrden,
    clearError,
    needsReload,
    setNeedsReload,
  };
}
