/**
 * Hook: useAvailabilityCheck
 *
 * Responsabilidad única: Verificación de disponibilidad con soporte multi-picking
 * - Verifica si hay stock suficiente en una ubicación
 * - Si NO hay suficiente → sugiere ubicaciones alternativas (modo override)
 * - Bloquea si no hay suficiente en ningún lado
 *
 * ❌ No se encarga de:
 * - Gestionar estado de picking global
 * - Confirmar picks
 * - Seleccionar items
 */

import { checkLocationAvailability, LocationAvailability } from "@API/picking";
import { PICKING_ERRORS } from "@constants/picking";
import type { DetalleSurtido, OrdenSurtido } from "@models/orders";
import { useCallback, useState } from "react";

export interface AvailabilityResult {
  isAvailable: boolean; // ¿Hay suficiente stock general?
  esSuficiente: boolean; // ¿Es suficiente en ESTA ubicación?
  availableQuantity: number; // Cantidad en la ubicación actual
  cantidadFaltante?: number; // Si no es suficiente, cuánto falta
  message: string;
  // ✨ NUEVO: Ubicaciones alternativas para override
  ubicacionesAlternativas?: Array<{
    estante_id: number;
    estante_codigo: string;
    cantidad_disponible: number;
  }>;
}

interface UseAvailabilityCheckResult {
  availabilityResult: AvailabilityResult | null;
  isChecking: boolean;
  error: string | null;
  checkAvailability: (
    orden: OrdenSurtido,
    detail: DetalleSurtido,
    estanteCodigo: string,
  ) => Promise<AvailabilityResult>;
  clearResult: () => void;
  clearError: () => void;
}

/**
 * ✨ NUEVO: Gestiona la verificación de disponibilidad con soporte multi-picking
 *
 * LÓGICA:
 * 1. Verifica si hay suficiente stock en la ubicación escaneada
 * 2. Si SÍ → Permite proceder normalmente
 * 3. Si NO → Retorna ubicaciones alternativas y sugiere modo override
 * 4. Si tampoco hay en alternativas → Bloquea la operación
 *
 * @example
 * const { checkAvailability, availabilityResult } = useAvailabilityCheck();
 *
 * try {
 *   const result = await checkAvailability(orden, detail, "A-01-01");
 *
 *   if (result.esSuficiente) {
 *     // Hay suficiente → Proceder con confirmación normal
 *   } else if (result.isAvailable && result.ubicacionesAlternativas?.length > 0) {
 *     // No hay suficiente pero hay stock en otros lados → Ir a modo override
 *   } else {
 *     // No hay suficiente en ningún lado → Bloquear
 *   }
 * } catch (err) {
 *   // Manejar error
 * }
 */
export function useAvailabilityCheck(): UseAvailabilityCheckResult {
  const [availabilityResult, setAvailabilityResult] =
    useState<AvailabilityResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(
    async (
      orden: OrdenSurtido,
      detail: DetalleSurtido,
      estanteCodigo: string,
    ): Promise<AvailabilityResult> => {
      try {
        setIsChecking(true);
        setError(null);

        if (!estanteCodigo) {
          throw new Error(PICKING_ERRORS.NO_LOCATION_SPECIFIED);
        }

        const locationResult: LocationAvailability = checkLocationAvailability(
          orden,
          detail.id,
          estanteCodigo,
        );

        const cantidadRequerida = Number(detail.cantidad_requerida);
        const cantidadSurtida = Number(detail.cantidad_surtida);
        const cantidadRestante = cantidadRequerida - cantidadSurtida;

        // ✨ NUEVO: Lógica multi-picking
        let message = "";
        let isAvailable = false;

        if (locationResult.esSuficiente) {
          // CASO 1: Hay suficiente en la ubicación escaneada
          message = `✅ Ubicación con stock suficiente (${locationResult.cantidad_disponible} disponibles)`;
          isAvailable = true;
        } else if (
          locationResult.ubicacionesAlternativas &&
          locationResult.ubicacionesAlternativas.length > 0
        ) {
          // CASO 2: No hay suficiente aquí, pero hay en otros lados
          const cantidadTotal =
            locationResult.cantidad_disponible +
            locationResult.ubicacionesAlternativas.reduce(
              (sum, ub) => sum + ub.cantidad_disponible,
              0,
            );

          if (cantidadTotal >= cantidadRestante) {
            // Hay suficiente en combinación → Sugerir override
            message = `⚠️ Stock insuficiente aquí (${locationResult.cantidad_disponible} vs ${cantidadRestante} requerido). Falta: ${locationResult.cantidadFaltante}. Hay alternativas disponibles.`;
            isAvailable = true;
          } else {
            // Ni en combinación hay suficiente
            message = `❌ Stock insuficiente incluso con todas las ubicaciones disponibles`;
            isAvailable = false;
          }
        } else {
          // CASO 3: No hay stock en ningún lado
          message = `❌ Producto no disponible en ninguna ubicación`;
          isAvailable = false;
        }

        const transformedResult: AvailabilityResult = {
          isAvailable,
          esSuficiente: locationResult.esSuficiente,
          availableQuantity: locationResult.cantidad_disponible,
          cantidadFaltante: locationResult.cantidadFaltante,
          message,
          ubicacionesAlternativas: locationResult.ubicacionesAlternativas,
        };

        setAvailabilityResult(transformedResult);
        return transformedResult;
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : PICKING_ERRORS.AVAILABILITY_CHECK_FAILED;
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsChecking(false);
      }
    },
    [],
  );

  const clearResult = useCallback(() => setAvailabilityResult(null), []);
  const clearError = useCallback(() => setError(null), []);

  return {
    availabilityResult,
    isChecking,
    error,
    checkAvailability,
    clearResult,
    clearError,
  };
}
