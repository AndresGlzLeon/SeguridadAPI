/**
 * Hook: usePickingDetails
 *
 * Responsabilidad única: Navegación y selección de detalles
 * - Gestiona qué detalle está actualmente seleccionado
 * - Obtiene el detalle actual
 * - Auto-selecciona primer item pendiente
 * - Avanza al siguiente item pendiente
 *
 * No se encarga de:
 * - Cargar datos (responsabilidad de usePickingOrder)
 * - Verificar disponibilidad
 * - Confirmar picking
 */

import type { DetalleSurtido, OrdenSurtido } from "@models/orders";
import { getPendingDetails } from "@utils/pickingHelpers";
import { useCallback, useState } from "react";

interface UsePickingDetailsResult {
  currentDetailId: number | null;
  selectDetail: (detailId: number) => void;
  getCurrentDetail: (orden: OrdenSurtido | null) => DetalleSurtido | null;
  getNextPendingDetail: (orden: OrdenSurtido | null) => DetalleSurtido | null;
  moveToNextPending: (orden: OrdenSurtido | null) => void;
  reset: () => void;
}

/**
 * Gestiona la navegación y selección entre detalles de una orden
 *
 * @example
 * const { currentDetailId, selectDetail, getCurrentDetail } = usePickingDetails();
 * const currentDetail = getCurrentDetail(orden);
 */
export function usePickingDetails(): UsePickingDetailsResult {
  const [currentDetailId, setCurrentDetailId] = useState<number | null>(null);

  const selectDetail = useCallback((detailId: number) => {
    setCurrentDetailId(detailId);
  }, []);

  const getCurrentDetail = useCallback(
    (orden: OrdenSurtido | null): DetalleSurtido | null => {
      if (!orden || !currentDetailId) return null;
      return (
        orden.detalles.find((d: DetalleSurtido) => d.id === currentDetailId) ||
        null
      );
    },
    [currentDetailId],
  );

  const getNextPendingDetail = useCallback(
    (orden: OrdenSurtido | null): DetalleSurtido | null => {
      if (!orden) return null;
      const pendingDetails = getPendingDetails(orden.detalles);
      return pendingDetails[0] || null;
    },
    [],
  );

  const moveToNextPending = useCallback((orden: OrdenSurtido | null) => {
    if (!orden) return;
    const nextPending = getPendingDetails(orden.detalles)[0];
    if (nextPending) {
      setCurrentDetailId(nextPending.id);
    } else {
      setCurrentDetailId(null);
    }
  }, []);

  const reset = useCallback(() => setCurrentDetailId(null), []);

  return {
    currentDetailId,
    selectDetail,
    getCurrentDetail,
    getNextPendingDetail,
    moveToNextPending,
    reset,
  };
}
