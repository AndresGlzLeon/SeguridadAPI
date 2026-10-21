/**
 * Hook: useOverrideMode
 *
 * Responsabilidad: Gestionar el flujo de modo override
 * - Cuando no hay suficiente stock en ubicación sugerida
 * - Proporciona lista de ubicaciones alternativas
 * - Permite seleccionar ubicación y cantidad parcial
 * - Confirma pick desde ubicación alternativa
 *
 * Flujo:
 * 1. checkAvailability retorna esSuficiente: false + ubicacionesAlternativas
 * 2. Cambiar a override mode
 * 3. Permitir seleccionar ubicación alternativa
 * 4. Permitir ingresar cantidad parcial o completa
 * 5. Confirmar pick desde ubicación seleccionada
 * 6. Si aún falta, repetir con próxima ubicación alternativa
 */

import type { DetalleSurtido, UbicacionSugerida } from "@models/orders";
import { useCallback, useState } from "react";

export interface OverrideModeState {
  isActive: boolean;
  selectedUbicacion: UbicacionSugerida | null;
  cantidadIngresada: number;
  ubicacionesDisponibles: UbicacionSugerida[];
}

interface UseOverrideModeResult {
  overrideState: OverrideModeState;
  activateOverride: (
    ubicaciones: UbicacionSugerida[],
    detalle: DetalleSurtido,
  ) => void;
  selectUbicacion: (ubicacion: UbicacionSugerida) => void;
  setCantidad: (cantidad: number) => void;
  deactivateOverride: () => void;
}

/**
 * Gestiona el modo override (picking desde ubicación alternativa)
 *
 * @example
 * const { overrideState, activateOverride } = useOverrideMode();
 *
 * if (result.ubicacionesAlternativas && result.ubicacionesAlternativas.length > 0) {
 *   activateOverride(result.ubicacionesAlternativas, detail);
 *   // usuarioNavigaAOverrideScreen()
 * }
 */
export function useOverrideMode(): UseOverrideModeResult {
  const [overrideState, setOverrideState] = useState<OverrideModeState>({
    isActive: false,
    selectedUbicacion: null,
    cantidadIngresada: 0,
    ubicacionesDisponibles: [],
  });

  const activateOverride = useCallback(
    (ubicaciones: UbicacionSugerida[], detalle: DetalleSurtido) => {
      const cantidadFaltante =
        Number(detalle.cantidad_requerida) - Number(detalle.cantidad_surtida);

      setOverrideState({
        isActive: true,
        selectedUbicacion: null,
        cantidadIngresada: cantidadFaltante, // Pre-llenar con cantidad faltante
        ubicacionesDisponibles: ubicaciones,
      });
    },
    [],
  );

  const selectUbicacion = useCallback((ubicacion: UbicacionSugerida) => {
    setOverrideState((prev) => ({
      ...prev,
      selectedUbicacion: ubicacion,
    }));
  }, []);

  const setCantidad = useCallback((cantidad: number) => {
    setOverrideState((prev) => ({
      ...prev,
      cantidadIngresada: cantidad,
    }));
  }, []);

  const deactivateOverride = useCallback(() => {
    setOverrideState({
      isActive: false,
      selectedUbicacion: null,
      cantidadIngresada: 0,
      ubicacionesDisponibles: [],
    });
  }, []);

  return {
    overrideState,
    activateOverride,
    selectUbicacion,
    setCantidad,
    deactivateOverride,
  };
}
