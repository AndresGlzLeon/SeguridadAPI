/**
 * Hook personalizado: usePickingOrders
 * Gestiona fetch y estado de órdenes de picking
 * Separation of Concerns: Solo API y estado de órdenes
 */

import { fetchPickingSuggestions } from "@API/picking";
import { PICKING_ERRORS } from "@constants/picking";
import { OrdenSurtido } from "@models/orders";
import { useCallback, useState } from "react";

interface UsePickingOrdersReturn {
  orden: OrdenSurtido | null;
  isLoading: boolean;
  error: string | null;
  loadOrden: (ordenId: number) => Promise<void>;
  refreshOrden: (ordenId: number) => Promise<OrdenSurtido>;
  clearError: () => void;
}

/**
 * Hook que encapsula la lógica de fetch y gestión de órdenes
 */
export function usePickingOrders(ordenId: number): UsePickingOrdersReturn {
  const [orden, setOrden] = useState<OrdenSurtido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga la orden (con estado loading)
   */
  const loadOrden = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const ordenData = await fetchPickingSuggestions(id);
      setOrden(ordenData);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : PICKING_ERRORS.LOAD_ORDER_FAILED;
      setError(errorMsg);
      console.error("Error loading order:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresca la orden sin cambiar loading inicial
   * Usado después de confirmar un pick
   * @returns Orden actualizada
   */
  const refreshOrden = useCallback(
    async (id: number): Promise<OrdenSurtido> => {
      try {
        const ordenData = await fetchPickingSuggestions(id);
        setOrden(ordenData);
        setError(null);
        return ordenData;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : PICKING_ERRORS.LOAD_ORDER_FAILED;
        setError(errorMsg);
        throw err;
      }
    },
    [],
  );

  /**
   * Limpia errores
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    orden,
    isLoading,
    error,
    loadOrden,
    refreshOrden,
    clearError,
  };
}
