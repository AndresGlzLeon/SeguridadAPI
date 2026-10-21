/**
 * Hook: usePickingUIState
 *
 * ✅ Responsabilidad única: Gestión de estado de UI
 * - Controla visibilidad de modales (cámara, confirmación)
 * - Maneja datos transitorios de modales
 * - No tiene lógica de negocio
 *
 * ❌ No se encarga de:
 * - Lógica de picking
 * - Llamadas a API
 * - Verificación de disponibilidad
 */

import type { PickConfirmData } from "@components/pickConfirmButton";
import { useCallback, useState } from "react";

interface UsePickingUIStateResult {
  isCameraOpen: boolean;
  openCamera: () => void;
  closeCamera: () => void;

  showConfirmationModal: boolean;
  modalConfirmData: PickConfirmData | null;
  openConfirmationModal: (data: PickConfirmData) => void;
  closeConfirmationModal: () => void;

  reset: () => void;
}

/**
 * Gestiona el estado de presentación (UI) para modales y overlays
 * Esta es una UI concern, completamente separada de la lógica de picking
 *
 * @example
 * const { isCameraOpen, openCamera, closeCamera } = usePickingUIState();
 *
 * return (
 *   <>
 *     <Button onPress={openCamera} />
 *     {isCameraOpen && <Camera onClose={closeCamera} />}
 *   </>
 * )
 */
export function usePickingUIState(): UsePickingUIStateResult {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [modalConfirmData, setModalConfirmData] =
    useState<PickConfirmData | null>(null);

  const openCamera = useCallback(() => setIsCameraOpen(true), []);
  const closeCamera = useCallback(() => setIsCameraOpen(false), []);

  const openConfirmationModal = useCallback((data: PickConfirmData) => {
    setModalConfirmData(data);
    setShowConfirmationModal(true);
  }, []);

  const closeConfirmationModal = useCallback(() => {
    setShowConfirmationModal(false);
    setModalConfirmData(null);
  }, []);

  const reset = useCallback(() => {
    setIsCameraOpen(false);
    setShowConfirmationModal(false);
    setModalConfirmData(null);
  }, []);

  return {
    isCameraOpen,
    openCamera,
    closeCamera,
    showConfirmationModal,
    modalConfirmData,
    openConfirmationModal,
    closeConfirmationModal,
    reset,
  };
}
