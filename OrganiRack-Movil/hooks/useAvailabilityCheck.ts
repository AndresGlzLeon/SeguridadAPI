import { checkLocationAvailability } from "@API/picking";
import { DetalleSurtido } from "@models/orders";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";

interface AvailabilityCheckResult {
  isAvailable: boolean;
  availableQuantity: number;
  message: string;
  locationCode: string;
}

interface UseAvailabilityCheckReturn {
  result: AvailabilityCheckResult | null;
  isLoading: boolean;
  check: (
    detalle: DetalleSurtido,
    locationCode: string,
  ) => Promise<AvailabilityCheckResult>;
  reset: () => void;
}

/**
 * Custom hook para verificar disponibilidad real de productos
 * Usa datos de las sugerencias de picking sin llamadas API adicionales
 *
 * @returns Object con result, isLoading, check function y reset
 */
export function useAvailabilityCheck(): UseAvailabilityCheckReturn {
  const [result, setResult] = useState<AvailabilityCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const check = useCallback(
    async (
      detalle: DetalleSurtido,
      locationCode: string,
    ): Promise<AvailabilityCheckResult> => {
      try {
        setIsLoading(true);
        setResult(null);

        // Usar la función real que analiza ubicaciones sugeridas
        const availability = checkLocationAvailability(
          { id: detalle.id, detalles: [detalle] } as any,
          detalle.id,
          locationCode,
        );

        const pendingQuantity =
          Number(detalle.cantidad_requerida) - Number(detalle.cantidad_surtida);

        // Determinar si hay suficiente disponibilidad
        const isValid =
          availability.es_sugestion &&
          availability.cantidad_disponible >= pendingQuantity;

        const resultData: AvailabilityCheckResult = {
          isAvailable: isValid,
          availableQuantity: availability.cantidad_disponible,
          locationCode,
          message: isValid
            ? `✓ Disponibles ${availability.cantidad_disponible} un. en ${locationCode}`
            : `✗ Solo ${availability.cantidad_disponible} de ${pendingQuantity} en ${locationCode}${availability.ubicacion_alternativa ? `. Prueba en ${availability.ubicacion_alternativa}` : ""}`,
        };

        // Haptic feedback
        if (isValid) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        } else {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          );
        }

        setResult(resultData);
        return resultData;
      } catch (error) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        const errorMsg =
          error instanceof Error
            ? error.message
            : "Error al verificar disponibilidad";

        const errorResult: AvailabilityCheckResult = {
          isAvailable: false,
          availableQuantity: 0,
          locationCode,
          message: `❌ ${errorMsg}`,
        };

        setResult(errorResult);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return { result, isLoading, check, reset };
}
