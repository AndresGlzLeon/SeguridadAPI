/**
 * Hook: useOverrideLocations
 *
 * ✅ Responsabilidad ÚNICA: Gestionar ubicaciones para modo override
 * - Solo se carga cuando usuario entra a override screen
 * - Recibe ubicaciones alternativas desde availability check
 * - Normaliza y filtra ubicaciones
 * - Maneja estado local de UI (cantidad per ubicación)
 *
 * ❌ NO se encarga de:
 * - Confirmar picks (eso es usePickingConfirm)
 * - Verificar disponibilidad (eso es useAvailabilityCheck)
 * - Gestionar detalle actual (eso es usePickingDetails)
 */

import type { UbicacionSugerida } from "@models/orders";
import { normalizeUbicacionesForOverride } from "@utils/pickingHelpers";
import { useCallback, useState } from "react";

export interface LocationSelection {
  ubicacion_id: number;
  cantidad_tomada: number;
  codigo_etiqueta: string;
  cantidadMaxima: number;
  es_sugerida?: boolean;
}

interface UseOverrideLocationsResult {
  // Estado
  selections: LocationSelection[];
  isLoading: boolean;

  // Acciones
  initializeLocations: (ubicaciones: UbicacionSugerida[] | undefined) => void;
  updateQuantity: (index: number, quantity: number) => void;
  getSelection: (index: number) => LocationSelection | undefined;

  // Validaciones
  canConfirm: (faltante: number, totalDisponible: number) => boolean;
  validateSelections: (faltante: number) => string | null;
  getInvalidSelections: () => LocationSelection[];

  // Resumen
  totalSelected: () => number;
  activeSelections: () => LocationSelection[];
}

/**
 * ✨ NUEVO: Hook dedicado para gestionar estado de override
 *
 * VENTAJAS:
 * - Responsabilidad única: solo override
 * - No interfiere con estado de picking normal
 * - Lazy loading: solo carga si usuario entra a override
 * - Fácil de testear
 *
 * @example
 * const override = useOverrideLocations();
 *
 * useEffect(() => {
 *   // Cuando entras a override screen
 *   override.initializeLocations(availabilityResult?.ubicacionesAlternativas);
 * }, []);
 *
 * return (
 *   <Button
 *     disabled={!override.canConfirm(faltante, totalDisponible)}
 *     onPress={() => handleConfirm(override.activeSelections())}
 *   />
 * );
 */
export function useOverrideLocations(): UseOverrideLocationsResult {
  const [selections, setSelections] = useState<LocationSelection[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Inicializa ubicaciones solo una vez (cuando entra a override screen)
   * Este método reemplaza el useEffect que causaba loops infinitos
   */
  const initializeLocations = useCallback(
    (ubicaciones: UbicacionSugerida[] | undefined) => {
      setIsLoading(true);

      try {
        if (!ubicaciones || ubicaciones.length === 0) {
          setSelections([]);
          return;
        }

        // Normalizar ubicaciones (valida + mapea campos)
        const normalized = normalizeUbicacionesForOverride(ubicaciones);

        if (normalized.length === 0) {
          setSelections([]);
          return;
        }

        // Convertir a selections (con cantidad_tomada = 0 inicial)
        const locationSelections: LocationSelection[] = normalized.map(
          (ub) => ({
            ubicacion_id: ub.estante_id,
            codigo_etiqueta: ub.estante_codigo,
            cantidadMaxima: ub.cantidad_disponible,
            cantidad_tomada: 0,
          }),
        );

        setSelections(locationSelections);
      } catch (err) {
        setSelections([]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Actualiza cantidad para una ubicación específica
   */
  const updateQuantity = useCallback((index: number, quantity: number) => {
    setSelections((prev) => {
      const capped = Math.min(quantity, prev[index]?.cantidadMaxima || 0);
      const updated = [...prev];
      if (updated[index]) {
        updated[index].cantidad_tomada = capped;
      }
      return updated;
    });
  }, []);

  /**
   * Obtiene una selección específica
   */
  const getSelection = useCallback(
    (index: number): LocationSelection | undefined => selections[index],
    [selections],
  );

  /**
   * Validación 1: Verifica si puede confirmar
   */
  const canConfirm = useCallback(
    (faltante: number, totalDisponible: number): boolean => {
      const total = totalSelected();
      return total >= faltante && total <= totalDisponible && total > 0;
    },
    [selections],
  );

  /**
   * Validación 2: Valida todas las selecciones
   * Retorna mensaje de error si hay problemas, null si todo ok
   */
  const validateSelections = useCallback(
    (faltante: number): string | null => {
      const active = activeSelections();

      if (active.length === 0) {
        return "Debe seleccionar al menos una ubicación";
      }

      // Validar estante_id válido
      const invalid = active.filter(
        (sel) => !Number.isInteger(sel.ubicacion_id) || sel.ubicacion_id <= 0,
      );

      if (invalid.length > 0) {
        return `${invalid.length} ubicación(es) con ID inválido en BD`;
      }

      // Validar cantidad
      const total = totalSelected();
      if (total < faltante) {
        return `Cantidad total (${total}) menor a lo requerido (${faltante})`;
      }

      return null;
    },
    [selections],
  );

  /**
   * Validación 3: Obtiene selecciones inválidas (para logging)
   */
  const getInvalidSelections = useCallback((): LocationSelection[] => {
    return selections.filter(
      (sel) => sel.cantidad_tomada > 0 && sel.ubicacion_id <= 0,
    );
  }, [selections]);

  /**
   * Calcula total de cantidad seleccionada
   */
  const totalSelected = useCallback((): number => {
    return selections.reduce((sum, sel) => sum + sel.cantidad_tomada, 0);
  }, [selections]);

  /**
   * Obtiene solo las selecciones con cantidad > 0
   */
  const activeSelections = useCallback((): LocationSelection[] => {
    return selections.filter((sel) => sel.cantidad_tomada > 0);
  }, [selections]);

  return {
    selections,
    isLoading,
    initializeLocations,
    updateQuantity,
    getSelection,
    canConfirm,
    validateSelections,
    getInvalidSelections,
    totalSelected,
    activeSelections,
  };
}
