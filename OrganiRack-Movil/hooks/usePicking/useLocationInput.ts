/**
 * Hook: useLocationInput
 *
 * ✅ Responsabilidad única: Gestión del input de ubicación
 * - Maneja el código de estante ingresado
 * - Parsea y valida QR de ubicaciones
 * - Resetea el estado de ubicación
 *
 * ❌ No se encarga de:
 * - Verificar disponibilidad en la ubicación
 * - Confirmar picking
 * - Cargar órdenes
 */

import { parseLocationQR } from "@API/picking";
import { PICKING_ERRORS } from "@constants/picking";
import { useCallback, useState } from "react";

interface UseLocationInputResult {
  estanteCodigo: string;
  updateLocation: (code: string) => void;
  parseQRLocation: (rawQRData: string) => string | null;
  clearLocation: () => void;
}

/**
 * Gestiona la entrada y validación de códigos de ubicación (estantes)
 *
 * @example
 * const { estanteCodigo, updateLocation, parseQRLocation } = useLocationInput();
 *
 * // Con escaneo QR
 * const parsed = parseQRLocation(qrRawData);
 * if (parsed) updateLocation(parsed);
 */
export function useLocationInput(): UseLocationInputResult {
  const [estanteCodigo, setEstanteCodigo] = useState("");

  const updateLocation = useCallback((code: string) => {
    const normalized = code.trim();
    setEstanteCodigo(normalized);
  }, []);

  const parseQRLocation = useCallback((rawQRData: string): string | null => {
    try {
      const parsedCode = parseLocationQR(rawQRData);
      return parsedCode || null;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : PICKING_ERRORS.INVALID_LOCATION_CODE;
      throw new Error(msg);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setEstanteCodigo("");
  }, []);

  return {
    estanteCodigo,
    updateLocation,
    parseQRLocation,
    clearLocation,
  };
}
