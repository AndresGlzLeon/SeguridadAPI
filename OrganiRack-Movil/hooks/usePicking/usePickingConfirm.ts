/**
 * Hook: usePickingConfirm
 *
 * Responsabilidad única: Confirmación de picking con soporte multi-picking
 * - Confirma un pick en el servidor
 * - Maneja la transición de estado después de confirmar
 * - Retorna nueva orden actualizada con ubicaciones recolectadas
 * - Soporta cantidad parcial (si va a modo override)
 *
 * No se encarga de:
 * - Verificar disponibilidad previamente
 * - Seleccionar items
 * - Gestionar ubicaciones
 */

import { confirmPick, fetchPickingSuggestions } from "@API/picking";
import { PICKING_ERRORS } from "@constants/picking";
import type { DetalleSurtido, OrdenSurtido } from "@models/orders";
import { triggerHaptic } from "@utils/haptics";
import { useCallback, useState } from "react";

export interface ConfirmPickPayload {
  producto_id: number;
  estante_id_escaneado: number;
  cantidad_tomada: number; // Puede ser cantidad parcial
}

interface UsePickingConfirmResult {
  isConfirming: boolean;
  error: string | null;
  confirmPicking: (
    ordenId: number,
    detail: DetalleSurtido,
    estanteId: number,
    cantidadTomada?: number, // Para cantidad parcial en override
  ) => Promise<OrdenSurtido | null>;
  clearError: () => void;
}

/**
 * Gestiona la confirmación de picks con soporte multi-picking
 *
 * FLUJO:
 * 1. Confirmar pick en servidor (API retorna ubicaciones_recolectadas[])
 * 2. Actualizar estado de orden si es necesario
 * 3. Recargar orden con nuevas sugerencias
 * 4. Retornar orden actualizada
 *
 * @example
 * const { confirmPicking } = usePickingConfirm();
 *
 * try {
 *   const updatedOrden = await confirmPicking(
 *     ordenId,
 *     detail,
 *     estanteId,
 *     cantidadTomada // Opcional: si es override con cantidad parcial
 *   );
 *   // La orden está actualizada con nuevos detalles
 * } catch (err) {
 *   // Manejar error de confirmación
 * }
 */
export function usePickingConfirm(): UsePickingConfirmResult {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmPicking = useCallback(
    async (
      ordenId: number,
      detail: DetalleSurtido,
      estanteId: number,
      cantidadTomada?: number,
    ): Promise<OrdenSurtido | null> => {
      try {
        setIsConfirming(true);
        setError(null);

        // Validación: Asegurar que estanteId es número entero positivo
        if (!Number.isInteger(estanteId) || estanteId <= 0) {
          throw new Error(
            `Error: estanteId debe ser entero mayor a 0. Recibido: ${estanteId} (tipo: ${typeof estanteId})`,
          );
        }

        // Calcular cantidad a tomar si no se especifica
        const cantidad = cantidadTomada ?? Number(detail.cantidad_requerida);

        // Debug: Payload que se envía al servidor
        const payload = {
          producto_id: detail.producto_id,
          estante_id_escaneado: estanteId,
          cantidad_tomada: cantidad,
        };

        // Confirmar en API
        const response = await confirmPick(ordenId, payload);

        // Validación: La respuesta debe contener datos
        if (!response.data) {
          throw new Error(
            `Error: No hay datos en la respuesta del servidor. Respuesta completa: ${JSON.stringify(response)}`,
          );
        }

        triggerHaptic("success");

        // Obtener orden actualizada
        const updatedOrden = await fetchPickingSuggestions(ordenId);
        if (!updatedOrden) {
          throw new Error(PICKING_ERRORS.LOAD_ORDER_FAILED);
        }

        return updatedOrden;
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : PICKING_ERRORS.PICK_CONFIRMATION_FAILED;

        // ✨ NUEVA: Detectar y mejorar mensajes de error específicos
        let userFriendlyMsg = msg;

        // Detectar error de sobre-picking (400 con mensaje específico)
        if (
          msg.includes("No se puede recoger más") ||
          msg.includes("exceso") ||
          msg.includes("cantidad requerida")
        ) {
          userFriendlyMsg = `⚠️ Límite de cantidad excedido: ${msg}`;
        }

        // Detectar stock insuficiente en ubicación
        if (msg.includes("Stock insuficiente")) {
          userFriendlyMsg = `❌ Stock insuficiente en esta ubicación: ${msg}`;
        }

        // Detectar producto no encontrado en ubicación
        if (msg.includes("Producto no encontrado")) {
          userFriendlyMsg = `❌ Producto no encontrado en la ubicación escaneada`;
        }

        setError(userFriendlyMsg);
        triggerHaptic("error");

        throw new Error(userFriendlyMsg);
      } finally {
        setIsConfirming(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    isConfirming,
    error,
    confirmPicking,
    clearError,
  };
}
