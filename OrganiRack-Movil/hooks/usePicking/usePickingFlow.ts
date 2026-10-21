/**
 * Hook: usePickingFlow
 *
 * Responsabilidad: Orquestación del flujo completo de picking
 * - Coordina todos los hooks anteriores
 * - Maneja la secuencia de acciones
 * - Centraliza manejo de errores y casos especiales
 * - Mantiene scannerScreen limpio y enfocado en presentación
 *
 * Este hook es opcional pero recomendado para mantener
 * el componente limpio y enfocado solo en UI
 */

import type { PickConfirmData } from "@components/pickConfirmButton";
import { PICKING_ERRORS } from "@constants/picking";
import type { DetalleSurtido, OrdenSurtido } from "@models/orders";
import { triggerHaptic } from "@utils/haptics";
import { getPendingDetails } from "@utils/pickingHelpers";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect } from "react";
import { useAvailabilityCheck } from "./useAvailabilityCheck";
import { useLocationInput } from "./useLocationInput";
import { useOverrideMode } from "./useOverrideMode";
import { usePickingConfirm } from "./usePickingConfirm";
import { usePickingDetails } from "./usePickingDetails";
import { usePickingOrder } from "./usePickingOrder";
import { usePickingUIState } from "./usePickingUIState";

interface UsePickingFlowResult {
  // Orden
  orden: OrdenSurtido | null;
  isLoadingOrder: boolean;
  orderError: string | null;
  isOrderComplete: boolean;
  pendingCount: number;

  // Detalles
  currentDetail: DetalleSurtido | null;
  currentDetailId: number | null;

  // Ubicación
  estanteCodigo: string;

  // Disponibilidad
  availabilityResult: any;
  isCheckingAvailability: boolean;

  // Confirmación
  isConfirming: boolean;

  // Override Mode (NUEVO)
  needsOverride: boolean;
  overrideMode: any;
  activateOverrideMode: () => void;
  deactivateOverrideMode: () => void;

  // Estado general
  globalError: string | null;

  // Acciones
  loadOrder: (id: number) => Promise<void>;
  handleLocationScanned: (data: string | null) => Promise<void>;
  handleAvailabilityCheck: () => Promise<void>;
  handlePickConfirm: (
    data: PickConfirmData,
    estanteId?: number,
  ) => Promise<void>;
  handleOverridePickConfirm: (
    estanteId: number,
    cantidadTomada: number,
  ) => Promise<void>;
  clearErrors: () => void;

  // UI
  isCameraOpen: boolean;
  openCamera: () => void;
  closeCamera: () => void;
  showConfirmationModal: boolean;
  modalConfirmData: PickConfirmData | null;
  openConfirmationModal: (data: PickConfirmData) => void;
  closeConfirmationModal: () => void;
}

/**
 * Hook maestro que orquesta TODO el flujo de picking.
 * Combina todos los hooks especializados en una interfaz limpia.
 *
 * VENTAJAS:
 * - scannerScreen es mucho más limpio y legible
 * - Toda la lógica de flujo está centralizada aquí
 * - Fácil de testear (cada subhook es testeable por separado)
 * - Fácil de extender (agregar nuevas reglas de flujo)
 *
 * @example
 * const flow = usePickingFlow();
 *
 * return (
 *   <>
 *     <Producto nombre={flow.currentDetail?.producto.nombre} />
 *     <Input value={flow.estanteCodigo} />
 *     <Button onPress={flow.handleAvailabilityCheck} />
 *     <Button onPress={() => flow.handlePickConfirm(...)} />
 *   </>
 * )
 */
export function usePickingFlow(ordenId: number): UsePickingFlowResult {
  // Todos los hooks subordinados
  const pickingOrder = usePickingOrder();
  const pickingDetails = usePickingDetails();
  const locationInput = useLocationInput();
  const availabilityCheck = useAvailabilityCheck();
  const pickingConfirm = usePickingConfirm();
  const uiState = usePickingUIState();
  const overrideMode = useOverrideMode();

  // Error global (el más reciente de cualquier operación)
  const globalError =
    pickingOrder.error ||
    availabilityCheck.error ||
    pickingConfirm.error ||
    null;

  // ===== EFECTOS DE CICLO DE VIDA =====

  // Cargar orden cuando el componente toma foco (solo si no está ya cargada)
  useFocusEffect(
    useCallback(() => {
      // Solo cargar si la orden aún no existe
      // No usar pickingOrder.orden como dependencia para evitar bucles
      if (!pickingOrder.orden) {
        pickingOrder.loadOrder(ordenId, false);
      }
    }, [ordenId]), // Solo ordenId, nada más
  );

  // Auto-seleccionar primer item pendiente cuando carga la orden (inicial)
  // Mantener solo para inicialización, no para re-sincronización
  useEffect(() => {
    if (
      pickingOrder.orden &&
      !pickingDetails.currentDetailId &&
      !pickingOrder.isLoading
    ) {
      const firstPending = getPendingDetails(pickingOrder.orden.detalles)[0];
      if (firstPending) {
        pickingDetails.selectDetail(firstPending.id);
      }
    }
  }, [
    pickingOrder.orden?.id,
    pickingOrder.isLoading,
    pickingDetails.selectDetail,
  ]);

  // Limpiar ubicación cuando cambia el item seleccionado
  useEffect(() => {
    locationInput.clearLocation();
    availabilityCheck.clearResult?.();
  }, [
    pickingDetails.currentDetailId,
    locationInput.clearLocation,
    availabilityCheck.clearResult,
  ]);

  // ===== FUNCIONES DE ORQUESTACIÓN =====

  const handleLocationScanned = useCallback(
    async (data: string | null) => {
      if (!data) return;

      try {
        const parsed = locationInput.parseQRLocation(data);
        if (parsed) {
          locationInput.updateLocation(parsed);
        } else {
          throw new Error(PICKING_ERRORS.INVALID_LOCATION_CODE);
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : PICKING_ERRORS.INVALID_LOCATION_CODE;
        throw new Error(msg);
      } finally {
        uiState.closeCamera();
      }
    },
    [locationInput, uiState],
  );

  const handleAvailabilityCheck = useCallback(async () => {
    const detail = pickingDetails.getCurrentDetail(pickingOrder.orden);
    if (!detail) {
      throw new Error(PICKING_ERRORS.NO_PRODUCT_SELECTED);
    }

    if (!locationInput.estanteCodigo) {
      throw new Error(PICKING_ERRORS.NO_LOCATION_SPECIFIED);
    }

    if (!pickingOrder.orden) {
      throw new Error(PICKING_ERRORS.LOAD_ORDER_FAILED);
    }

    try {
      const result = await availabilityCheck.checkAvailability(
        pickingOrder.orden,
        detail,
        locationInput.estanteCodigo,
      );

      // Nueva lógica: Determinar si necesita override mode
      if (result.esSuficiente) {
        // Stock suficiente en ubicación sugerida, proceder normalmente
        triggerHaptic("success");
        overrideMode.deactivateOverride();
      } else if (
        result.ubicacionesAlternativas &&
        result.ubicacionesAlternativas.length > 0
      ) {
        // Stock insuficiente pero hay ubicaciones alternativas disponibles
        // Sugerir modo override
        triggerHaptic("warning");
        overrideMode.activateOverride(result.ubicacionesAlternativas, detail);
      } else {
        // Stock insuficiente en todas partes, error bloqueante
        triggerHaptic("error");
        throw new Error(
          `Stock insuficiente. Faltante: ${result.cantidadFaltante} unidades`,
        );
      }
    } catch (err) {
      triggerHaptic("error");
      throw err;
    }
  }, [
    pickingDetails,
    pickingOrder.orden,
    locationInput.estanteCodigo,
    availabilityCheck,
    overrideMode,
  ]);

  const handlePickConfirm = useCallback(
    async (data: PickConfirmData, estanteId?: number) => {
      const detail = pickingDetails.getCurrentDetail(pickingOrder.orden);
      if (!detail) {
        throw new Error(PICKING_ERRORS.NO_PRODUCT_SELECTED);
      }

      try {
        // Convertir estante_codigo a estante_id
        // Problema: Se estaba enviando código en lugar de ID
        let estanteIdNumerico: number | null = null;

        if (estanteId) {
          // Ya tiene ID (desde override screen)
          estanteIdNumerico = estanteId;
        } else if (locationInput.estanteCodigo) {
          // Buscar el ID correspondiente en las ubicaciones sugeridas
          const ubicacionSugerida = detail.ubicaciones_sugeridas?.find(
            (ub) => ub.estante_codigo === locationInput.estanteCodigo,
          );

          if (ubicacionSugerida) {
            estanteIdNumerico = ubicacionSugerida.estante_id;
          } else {
            // Si no está en sugerencias, intentar con el estante sugerido
            if (detail.estante_sugerido_id) {
              estanteIdNumerico = detail.estante_sugerido_id;
            }
          }
        }

        if (!estanteIdNumerico || estanteIdNumerico <= 0) {
          throw new Error(PICKING_ERRORS.NO_LOCATION_SPECIFIED);
        }

        const updatedOrden = await pickingConfirm.confirmPicking(
          ordenId,
          detail,
          estanteIdNumerico,
        );

        if (!updatedOrden) {
          throw new Error(PICKING_ERRORS.LOAD_ORDER_FAILED);
        }

        // Actualizar la orden en estado
        pickingOrder.updateOrden(updatedOrden);

        // Avanzar al siguiente item pendiente
        pickingDetails.moveToNextPending(updatedOrden);

        // Limpiar UI
        locationInput.clearLocation();
        availabilityCheck.clearResult?.();
        overrideMode.deactivateOverride();

        triggerHaptic("success");
      } catch (err) {
        triggerHaptic("error");
        throw err;
      }
    },
    [
      pickingDetails,
      pickingOrder.orden,
      pickingOrder.updateOrden,
      pickingConfirm,
      locationInput,
      availabilityCheck,
      overrideMode,
      ordenId,
    ],
  );

  const handleOverridePickConfirm = useCallback(
    async (estanteId: number, cantidadTomada: number) => {
      // Crtico: Guardar el detalle actual antes de hacer confirmaciones
      // Asegura que si hay múltiples picks en override,
      // todos van al mismo detalle aunque el estado cambie
      const originalDetail = pickingDetails.getCurrentDetail(
        pickingOrder.orden,
      );
      if (!originalDetail) {
        throw new Error(PICKING_ERRORS.NO_PRODUCT_SELECTED);
      }

      if (!estanteId) {
        throw new Error("Debe seleccionar una ubicación para el override");
      }

      try {
        // Confirmar pick con cantidad parcial usando el detalle ORIGINAL
        const updatedOrden = await pickingConfirm.confirmPicking(
          ordenId,
          originalDetail, // Usar detalle original, no el actual
          estanteId,
          cantidadTomada,
        );

        if (!updatedOrden) {
          throw new Error(PICKING_ERRORS.LOAD_ORDER_FAILED);
        }

        // Actualizar la orden en estado
        pickingOrder.updateOrden(updatedOrden);

        // Verificar si el detalle original está completo ahora
        const updatedDetail = updatedOrden.detalles.find(
          (d) => d.id === originalDetail.id, // Buscar por ID del detalle original
        );

        if (updatedDetail?.es_completo) {
          // Detalle ahora está completo, avanzar al siguiente
          pickingDetails.moveToNextPending(updatedOrden);
          overrideMode.deactivateOverride();
        }

        triggerHaptic("success");
      } catch (err) {
        triggerHaptic("error");
        throw err;
      }
    },
    [
      pickingDetails,
      pickingOrder.orden,
      pickingOrder.updateOrden,
      pickingConfirm,
      overrideMode,
      ordenId,
    ],
  );

  const clearErrors = useCallback(() => {
    pickingOrder.clearError();
    availabilityCheck.clearError();
    pickingConfirm.clearError();
  }, [pickingOrder, availabilityCheck, pickingConfirm]);

  // ===== RETORNO =====

  // ===== CÁLCULOS DERIVADOS =====

  const pendingCount = pickingOrder.orden
    ? getPendingDetails(pickingOrder.orden.detalles).length
    : 0;

  const isOrderComplete = !!(pickingOrder.orden && pendingCount === 0);

  // ===== RETORNO =====

  return {
    // Orden
    orden: pickingOrder.orden,
    isLoadingOrder: pickingOrder.isLoading,
    orderError: pickingOrder.error,
    isOrderComplete,
    pendingCount,

    // Detalles
    currentDetail: pickingDetails.getCurrentDetail(pickingOrder.orden),
    currentDetailId: pickingDetails.currentDetailId,

    // Ubicación
    estanteCodigo: locationInput.estanteCodigo,

    // Disponibilidad
    availabilityResult: availabilityCheck.availabilityResult,
    isCheckingAvailability: availabilityCheck.isChecking,

    // Confirmación
    isConfirming: pickingConfirm.isConfirming,

    // Override Mode (NUEVO)
    needsOverride: overrideMode.overrideState.isActive,
    overrideMode: overrideMode.overrideState,
    activateOverrideMode: () => {
      // Nota: Ya se llama desde handleAvailabilityCheck
      // Este es un callback auxiliar si se necesita desde la UI
    },
    deactivateOverrideMode: overrideMode.deactivateOverride,

    // Errores
    globalError,

    // Acciones
    loadOrder: pickingOrder.loadOrder,
    handleLocationScanned,
    handleAvailabilityCheck,
    handlePickConfirm,
    handleOverridePickConfirm,
    clearErrors,

    // UI
    isCameraOpen: uiState.isCameraOpen,
    openCamera: uiState.openCamera,
    closeCamera: uiState.closeCamera,
    showConfirmationModal: uiState.showConfirmationModal,
    modalConfirmData: uiState.modalConfirmData,
    openConfirmationModal: uiState.openConfirmationModal,
    closeConfirmationModal: uiState.closeConfirmationModal,
  };
}
