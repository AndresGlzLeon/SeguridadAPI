/**
 * Hook personalizado: usePicking
 * Gestiona TODA la lógica de estado y operaciones de picking
 * Separation of Concerns: Solo lógica, sin presentación
 */

import { PICKING_DEFAULTS } from "@constants/picking";
import { DetalleSurtido, OrdenSurtido } from "@models/orders";
import { useCallback, useState } from "react";

interface PickingState {
  currentDetailId: number | null;
  estanteCodigo: string;
  availableQuantity: number | null;
  isAvailable: boolean | null;
}

interface UsePickingReturn {
  pickingState: PickingState;
  getCurrentDetail: (orden: OrdenSurtido | null) => DetalleSurtido | null;
  updateLocation: (estanteCodigo: string) => void;
  updateAvailability: (isAvailable: boolean, quantity: number) => void;
  clearLocation: () => void;
  resetAvailability: () => void;
  selectDetail: (detailId: number | null) => void;
  resetPickingState: () => void;
  advanceToNextItem: (orden: OrdenSurtido, exclude?: { id: number }) => void;
}

/**
 * Hook que encapsula toda la lógica de picking
 * Mantiene el estado y proporciona acciones puras
 */
export function usePicking(): UsePickingReturn {
  const [pickingState, setPickingState] = useState<PickingState>({
    currentDetailId: PICKING_DEFAULTS.EMPTY_DETAIL_ID,
    estanteCodigo: PICKING_DEFAULTS.EMPTY_LOCATION_CODE,
    availableQuantity: PICKING_DEFAULTS.AVAILABLE_QUANTITY,
    isAvailable: PICKING_DEFAULTS.AVAILABILITY_STATUS,
  });

  /**
   * Obtiene el detalle actual sin lógica de presentación
   */
  const getCurrentDetail = useCallback(
    (orden: OrdenSurtido | null): DetalleSurtido | null => {
      if (!orden || !pickingState.currentDetailId) return null;
      return (
        orden.detalles.find((d) => d.id === pickingState.currentDetailId) ||
        null
      );
    },
    [pickingState.currentDetailId],
  );

  /**
   * Actualiza solo la ubicación
   */
  const updateLocation = useCallback((code: string) => {
    setPickingState((prev) => ({
      ...prev,
      estanteCodigo: code,
      isAvailable: null, // Reset disponibilidad al cambiar ubicación
    }));
  }, []);

  /**
   * Actualiza disponibilidad verificada
   */
  const updateAvailability = useCallback(
    (isAvailable: boolean, qty: number) => {
      setPickingState((prev) => ({
        ...prev,
        isAvailable,
        availableQuantity: qty,
      }));
    },
    [],
  );

  /**
   * Limpia ubicación
   */
  const clearLocation = useCallback(() => {
    setPickingState((prev) => ({
      ...prev,
      estanteCodigo: PICKING_DEFAULTS.EMPTY_LOCATION_CODE,
      isAvailable: null,
    }));
  }, []);

  /**
   * Resetea disponibilidad
   */
  const resetAvailability = useCallback(() => {
    setPickingState((prev) => ({
      ...prev,
      isAvailable: null,
      availableQuantity: null,
    }));
  }, []);

  /**
   * Selecciona un detalle específico
   */
  const selectDetail = useCallback((detailId: number | null) => {
    setPickingState((prev) => ({
      ...prev,
      currentDetailId: detailId,
      estanteCodigo: PICKING_DEFAULTS.EMPTY_LOCATION_CODE,
      isAvailable: null,
      availableQuantity: null,
    }));
  }, []);

  /**
   * Resetea completamente el estado de picking
   */
  const resetPickingState = useCallback(() => {
    setPickingState({
      currentDetailId: PICKING_DEFAULTS.EMPTY_DETAIL_ID,
      estanteCodigo: PICKING_DEFAULTS.EMPTY_LOCATION_CODE,
      availableQuantity: PICKING_DEFAULTS.AVAILABLE_QUANTITY,
      isAvailable: PICKING_DEFAULTS.AVAILABILITY_STATUS,
    });
  }, []);

  /**
   * Avanza automáticamente al siguiente item pendiente
   * Usado después de confirmar un pick
   */
  const advanceToNextItem = useCallback(
    (orden: OrdenSurtido, exclude?: { id: number }) => {
      const nextPending = orden.detalles.find(
        (d) =>
          d.cantidad_surtida < d.cantidad_requerida &&
          (!exclude || d.id !== exclude.id),
      );

      selectDetail(nextPending?.id ?? null);
    },
    [selectDetail],
  );

  return {
    pickingState,
    getCurrentDetail,
    updateLocation,
    updateAvailability,
    clearLocation,
    resetAvailability,
    selectDetail,
    resetPickingState,
    advanceToNextItem,
  };
}
