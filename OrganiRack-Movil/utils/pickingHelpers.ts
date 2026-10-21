/**
 * Utilities para operaciones de picking
 * Funciones puras sin dependencias de React
 */

import { PRODUCT_STATUS } from "@constants/picking";
import { DetalleSurtido } from "@models/orders";

/**
 * Determina el estado visual de un producto basado en cantidades
 */
export function getProductStatus(detail: DetalleSurtido): string {
  const required = Number(detail.cantidad_requerida);
  const picked = Number(detail.cantidad_surtida);

  if (picked >= required) return PRODUCT_STATUS.PICKED;
  if (picked > 0) return PRODUCT_STATUS.PARTIAL;
  return PRODUCT_STATUS.PENDING;
}

/**
 * Calcula cantidad pendiente de recoger
 */
export function getPendingQuantity(detail: DetalleSurtido): number {
  const required = Number(detail.cantidad_requerida);
  const picked = Number(detail.cantidad_surtida);
  return Math.max(0, required - picked);
}

/**
 * Calcula progreso general (0-100)
 */
export function calculateProgressPercentage(
  completedItems: number,
  totalItems: number,
): number {
  if (totalItems === 0) return 0;
  return Math.round((completedItems / totalItems) * 100);
}

/**
 * Filtra solo detalles pendientes
 */
export function getPendingDetails(
  detalles: DetalleSurtido[],
): DetalleSurtido[] {
  return detalles.filter((d) => d.cantidad_surtida < d.cantidad_requerida);
}

/**
 * Encuentra el siguiente detalle pendiente
 */
export function getNextPendingDetail(
  detalles: DetalleSurtido[],
  currentId?: number,
): DetalleSurtido | undefined {
  const pending = getPendingDetails(detalles);
  if (!currentId) return pending[0];

  const currentIndex = pending.findIndex((d) => d.id === currentId);
  return pending[currentIndex + 1];
}

/**
 * Valida si hay ubicación especificada
 */
export function isLocationSpecified(estanteCodigo: string): boolean {
  return estanteCodigo.trim().length > 0;
}

/**
 * Valida si debe mostrar disponibilidad
 */
export function shouldShowAvailability(
  location: string,
  hasDetail: boolean,
): boolean {
  return isLocationSpecified(location) && hasDetail;
}

/**
 * Valida si debe mostrar botón de confirmar
 */
export function shouldShowConfirmButton(
  isAvailable: boolean | null,
  hasDetail: boolean,
): boolean {
  return isAvailable === true && hasDetail;
}

/**
 * ✨ NUEVO: Interface para ubicaciones normalizadas
 * Garantiza estructura consistente para override mode
 */
export interface NormalizedUbicacion {
  estante_id: number;
  estante_codigo: string;
  cantidad_disponible: number;
  es_sugerida?: boolean;
}

/**
 * ✨ NUEVO: Normaliza ubicaciones para garantizar estructura consistente
 *
 * Problema solucionado:
 * - Convierte diferentes nombres de campo a estructura estándar
 * - Filtra ubicaciones sin estante_id o cantidad_disponible
 * - Evita NaN cuando se accede a campos inválidos
 *
 * @param ubicacionesRaw - Ubicaciones sin normalizar (de API o props)
 * @returns Ubicaciones normalizadas con validación
 *
 * @example
 * const ubicaciones = [
 *   { estante_id: 1, estante_codigo: 'A-01', cantidad_disponible: 50 },
 *   { estante_id: 2, estante_codigo: 'B-02', cantidad_disponible: 30 }
 * ];
 * const normalized = normalizeUbicacionesForOverride(ubicaciones);
 * // Resultado: Array de NormalizedUbicacion garantizados
 */
export function normalizeUbicacionesForOverride(
  ubicacionesRaw: any[],
): NormalizedUbicacion[] {
  if (!Array.isArray(ubicacionesRaw)) {
    return [];
  }

  return ubicacionesRaw
    .filter((ub) => {
      // Filtrar ubicaciones sin estante_id o cantidad_disponible válida
      if (!ub?.estante_id || (ub?.cantidad_disponible ?? 0) <= 0) {
        return false;
      }
      return true;
    })
    .map((ub) => {
      // Mapeo seguro de campos
      const normalized: NormalizedUbicacion = {
        estante_id: Number(ub.estante_id),
        estante_codigo: String(ub.estante_codigo || `ESTANTE-${ub.estante_id}`),
        cantidad_disponible: Number(ub.cantidad_disponible || 0),
        es_sugerida: ub.es_sugerida === true,
      };

      return normalized;
    });
}

/**
 * ✨ NUEVO: Construye la lista completa de ubicaciones para override screen
 *
 * ✅ CORRECCIÓN (3.31.26):
 * - NO incluir ubicación sugerida en override
 * - Razón: La sugerida ya se intentó y NO tenía suficiente stock
 * - No tiene sentido darle al usuario la opción de intentar de nuevo
 * - Además: No tenemos estante_id de la sugerida (causa error 422)
 *
 * FLUJO CORRECTO:
 * 1. Usuario escanea ubicación sugerida
 * 2. Stock insuficiente → Se sugiere override mode
 * 3. OverrideScreen muestra SOLO ubicaciones alternativas
 * 4. Usuario selecciona una alternativa
 * 5. Confirma pick → Backend recibe estante_id válido (no 0)
 *
 * @param estanteCodigo - Ignorado (ya se intentó)
 * @param availabilityResult - Ignorado (ya se verificó que falla)
 * @param ubicacionesAlternativas - Ubicaciones alternativas (solo estas se muestran)
 * @returns Array de ubicaciones alternativas normalizadas
 *
 * @example
 * const ubicaciones = buildUbicacionesForOverride(
 *   "A-01-01",  // Ya intentada, insuficiente
 *   { availableQuantity: 50, ... },
 *   [
 *     { estante_id: 2, estante_codigo: "A-02", cantidad_disponible: 30 },
 *     { estante_id: 3, estante_codigo: "B-01", cantidad_disponible: 20 }
 *   ]
 * );
 * // Resultado: Solo 2 ubicaciones (sin la sugerida que falló)
 */
export function buildUbicacionesForOverride(
  estanteCodigo: string,
  availabilityResult: any,
  ubicacionesAlternativas: any[],
): NormalizedUbicacion[] {
  // ✨ CORRECCIÓN: NO incluir ubicación sugerida
  // La sugerida ya se intentó y failó la disponibilidad
  // No tiene sentido incluirla nuevamente en override

  console.info(
    "✅ buildUbicacionesForOverride: Usando SOLO ubicaciones alternativas",
    {
      estante_sugerido: estanteCodigo,
      alternativas_count: ubicacionesAlternativas?.length || 0,
      razon: "La sugerida ya falló la disponibilidad",
    },
  );

  // 1. Normalizar ubicaciones alternativas
  if (
    !Array.isArray(ubicacionesAlternativas) ||
    ubicacionesAlternativas.length === 0
  ) {
    return [];
  }

  const normalized = normalizeUbicacionesForOverride(ubicacionesAlternativas);

  return normalized;
}
