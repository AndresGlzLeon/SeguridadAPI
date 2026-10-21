import {
  EstadoOrdenExtendido,
  OrdenSurtido,
  UbicacionRecolectada,
} from "@models/orders";
import apiClient from "./client";
import { MOBILE_PICKING_ENDPOINTS } from "./endpoints";

/**
 * Tipos para operaciones de picking móvil
 */

/**
 * Sugerencia de ubicación para recolección
 */
export interface PickingSuggestion {
  detalle_id: number;
  producto_id: number;
  producto: {
    id: number;
    nombre: string;
    sku: string;
  };
  cantidad_requerida: number;
  cantidad_surtida: number;
  ubicaciones_sugeridas: Array<{
    estante_id: number;
    estante_codigo: string;
    cantidad_disponible: number;
  }>;
}

/**
 * ✨ NUEVO: Resultado de validación de disponibilidad con soporte multi-picking
 * Indica si hay suficiente stock en la ubicación sugerida
 * Si no, sugiere modo override con ubicaciones alternativas
 */
export interface LocationAvailability {
  estante_codigo: string;
  cantidad_disponible: number;
  es_sugestion: boolean;
  esSuficiente: boolean; // ✨ NUEVO: ¿hay suficiente para completar el item?
  cantidadFaltante?: number; // ✨ NUEVO: cantidad que falta si es insuficiente
  ubicacionesAlternativas?: Array<{
    // ✨ NUEVO: dónde tomar el faltante
    estante_id: number;
    estante_codigo: string;
    cantidad_disponible: number;
  }>;
}

/**
 * Datos de confirmación de pick
 */
export interface PickConfirmRequest {
  producto_id: number;
  estante_id_escaneado: number;
  cantidad_tomada: number;
}

/**
 * ✨ NUEVO: Respuesta mejorada de confirmación de pick (con multi-picking)
 * Incluye trazabilidad completa y estado de orden
 */
export interface PickConfirmResponse {
  success: boolean;
  data: {
    detalle: {
      id: number;
      cantidad_surtida: number; // Acumulada
      es_completo: boolean; // ¿está completo?
      ubicaciones_recolectadas: UbicacionRecolectada[]; // Histórico de picks
      orden_estado: EstadoOrdenExtendido; // Progreso de la orden
    };
  };
}

/**
 * ============================================================================
 * FUNCIONES DE PICKING MÓVIL
 * ============================================================================
 */

/**
 * Obtiene la lista de recolección sugerida para una orden
 * GET /api/mobile/picking/{ordenId}/sugerencias
 *
 * @param ordenId - ID de la orden
 * @returns Promise<OrdenSurtido> - Orden con detalles y sugerencias
 */
export async function fetchPickingSuggestions(
  ordenId: string | number,
): Promise<OrdenSurtido> {
  try {
    const response = await apiClient.get<{
      message: string;
      data: OrdenSurtido;
    }>(MOBILE_PICKING_ENDPOINTS.getSuggestions(ordenId));

    return response.data.data;
  } catch (error) {
    console.error("Error fetching picking suggestions:", error);
    throw error;
  }
}

/**
 * ✨ NUEVO: Valida disponibilidad considerando multi-picking
 *
 * Lógica:
 * - Si hay suficiente en la ubicación sugerida → procede normalmente
 * - Si NO hay suficiente → retorna ubicaciones alternativas donde tomar el faltante
 * - Si no hay suficiente en ningún lado → bloquea (esSuficiente: false)
 *
 * @param orden - Orden de surtido con sugerencias
 * @param detalleId - ID del detalle de surtido
 * @param ubicacion - Ubicación código (ej: "A-01-03")
 * @returns LocationAvailability - Disponibilidad y alternativas
 */
export function checkLocationAvailability(
  orden: OrdenSurtido,
  detalleId: number,
  ubicacion: string,
): LocationAvailability {
  // Buscar el detalle en la orden
  const detalle = orden.detalles.find((d) => d.id === detalleId);

  if (!detalle || !detalle.ubicaciones_sugeridas) {
    return {
      estante_codigo: ubicacion,
      cantidad_disponible: 0,
      es_sugestion: false,
      esSuficiente: false,
      cantidadFaltante: Number(detalle?.cantidad_requerida || 0),
    };
  }

  const cantidadRequerida = Number(detalle.cantidad_requerida);
  const cantidadRestante = cantidadRequerida - Number(detalle.cantidad_surtida);

  // Buscar la ubicación entre las sugerencias
  const ubicacionSugerida = detalle.ubicaciones_sugeridas.find(
    (ub) => ub.estante_codigo === ubicacion,
  );

  if (ubicacionSugerida) {
    const esSuficiente =
      ubicacionSugerida.cantidad_disponible >= cantidadRestante;

    // Si es suficiente, retornar directamente
    if (esSuficiente) {
      return {
        estante_codigo: ubicacion,
        cantidad_disponible: ubicacionSugerida.cantidad_disponible,
        es_sugestion: true,
        esSuficiente: true,
      };
    }

    // Si NO es suficiente, buscar ubicaciones alternativas
    const cantidadFaltante =
      cantidadRestante - ubicacionSugerida.cantidad_disponible;
    const ubicacionesAlternativas = detalle.ubicaciones_sugeridas.filter(
      (ub) => ub.estante_codigo !== ubicacion && ub.cantidad_disponible > 0,
    );

    return {
      estante_codigo: ubicacion,
      cantidad_disponible: ubicacionSugerida.cantidad_disponible,
      es_sugestion: true,
      esSuficiente: false,
      cantidadFaltante,
      ubicacionesAlternativas,
    };
  }

  // Si no encuentra en sugerencias, retornar como ubicación alternativa
  const firstSuggestion = detalle.ubicaciones_sugeridas[0];
  return {
    estante_codigo: ubicacion,
    cantidad_disponible: 0,
    es_sugestion: false,
    esSuficiente: false,
    cantidadFaltante: cantidadRestante,
    ubicacionesAlternativas: detalle.ubicaciones_sugeridas.filter(
      (ub) => ub.cantidad_disponible > 0,
    ),
  };
}

/**
 * Confirma la recolección de un producto
 * POST /api/mobile/picking/{ordenId}/confirmar
 *
 * @param ordenId - ID de la orden
 * @param data - Datos de confirmación
 * @returns Promise<PickConfirmResponse> - Respuesta del servidor
 */
export async function confirmPick(
  ordenId: string | number,
  data: PickConfirmRequest,
): Promise<PickConfirmResponse> {
  try {
    const response = await apiClient.post<PickConfirmResponse>(
      MOBILE_PICKING_ENDPOINTS.confirmPick(ordenId),
      {
        producto_id: data.producto_id,
        estante_id_escaneado: data.estante_id_escaneado,
        cantidad_tomada: data.cantidad_tomada,
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error confirming pick:", error);
    throw error;
  }
}

/**
 * Obtiene el folio de la orden (usado para validación)
 *
 * @param orden - Orden de surtido
 * @returns string - Folio de la orden (ej: "ORD-2441")
 */
export function getOrderFolio(orden: OrdenSurtido): string {
  return orden.folio;
}

/**
 * Cuenta los items pendientes en una orden
 *
 * @param orden - Orden de surtido
 * @returns number - Cantidad de items pendientes
 */
export function countPendingItems(orden: OrdenSurtido): number {
  return orden.detalles.filter(
    (detalle) => detalle.cantidad_surtida < detalle.cantidad_requerida,
  ).length;
}

/**
 * Obtiene el progreso de recolección de una orden (en porcentaje)
 *
 * @param orden - Orden de surtido
 * @returns number - Porcentaje de progreso (0-100)
 */
export function getPickingProgress(orden: OrdenSurtido): number {
  if (orden.detalles.length === 0) return 0;

  const completedItems = orden.detalles.filter(
    (detalle) => detalle.cantidad_surtida >= detalle.cantidad_requerida,
  ).length;

  return Math.round((completedItems / orden.detalles.length) * 100);
}

/**
 * Calcula el total de unidades a recoger
 *
 * @param orden - Orden de surtido
 * @returns number - Total de unidades
 */
export function getTotalUnits(orden: OrdenSurtido): number {
  return orden.detalles.reduce((sum, detalle) => {
    return sum + Number(detalle.cantidad_requerida);
  }, 0);
}

/**
 * Calcula el total de unidades ya recogidas
 *
 * @param orden - Orden de surtido
 * @returns number - Total recogido
 */
export function getPickedUnits(orden: OrdenSurtido): number {
  return orden.detalles.reduce((sum, detalle) => {
    return sum + Number(detalle.cantidad_surtida);
  }, 0);
}

/**
 * Valida si una orden está completamente recogida
 *
 * @param orden - Orden de surtido
 * @returns boolean - True si toda la orden está completa
 */
export function isOrderComplete(orden: OrdenSurtido): boolean {
  return orden.detalles.every(
    (detalle) => detalle.cantidad_surtida >= detalle.cantidad_requerida,
  );
}

/**
 * Parsea ubicación QR y retorna el código de estante completo
 * Formato QR esperado: "EST-1-1-1-4" (ya es el código completo)
 * o puede venir como string directo del escaneo
 *
 * @param qrData - Datos del QR (código de estante completo)
 * @returns string - Código de estante (ej: "EST-1-1-1-4")
 */
export function parseLocationQR(qrData: string): string | null {
  // Si el QR contiene "EST-", es un código válido
  if (qrData.includes("EST-")) {
    return qrData.trim();
  }
  // Si viene en otro formato, intentar parsear
  if (qrData.length > 0) {
    return qrData.trim();
  }
  return null;
}

/**
 * Formatea ubicación - en realidad solo retorna el código tal cual
 * Se mantiene para compatibilidad backward, pero es un pass-through
 *
 * @param estanteCodigo - Código de estante completo (ej: "EST-1-1-1-4")
 * @returns string - Código de estante sin cambios
 */
export function formatLocationCode(estanteCodigo: string): string {
  return estanteCodigo.trim();
}

/**
 * Obtiene el estante_id basado en el código de ubicación
 * Busca en las ubicaciones sugeridas del detalle actual
 *
 * @param detalle - Detalle de surtido con ubicaciones sugeridas
 * @param locationCode - Código de ubicación (ej: "A-01-03")
 * @returns number | null - estante_id si encuentra coincidencia, null si no
 */
export function getEstanteIdByLocation(
  detalle: any,
  locationCode: string,
): number | null {
  if (
    !detalle?.ubicaciones_sugeridas ||
    detalle.ubicaciones_sugeridas.length === 0
  ) {
    return null;
  }

  // Buscar exacta por código de estante
  const found = detalle.ubicaciones_sugeridas.find(
    (ub: any) => ub.estante_codigo === locationCode,
  );

  if (found) {
    return found.estante_id;
  }

  // Si no encuentra exacta, retornar el primero disponible como fallback
  return detalle.ubicaciones_sugeridas[0]?.estante_id || null;
}

/**
 * ✨ NUEVO: Valida que la cantidad total de picking NO EXCEDA lo requerido
 *
 * Considerando:
 * - cantidad_requerida: lo que la orden necesita
 * - cantidad_surtida: lo que ya se ha recolectado
 * - cantidadARecoger: lo que SE INTENTA recoger ahora
 *
 * @param detalle - Detalle de surtido
 * @param cantidadARecoger - Cantidad que quiere recoger ahora
 * @returns { valid: boolean, error?: string, cantidadMaximaPermitida?: number }
 */
export function validatePickingQuantity(
  detalle: any,
  cantidadARecoger: number,
): { valid: boolean; error?: string; cantidadMaximaPermitida?: number } {
  const cantidadRequerida = Number(detalle?.cantidad_requerida || 0);
  const cantidadSurtida = Number(detalle?.cantidad_surtida || 0);
  const cantidadTotal = cantidadSurtida + cantidadARecoger;

  // Validación: No puede exceder lo requerido
  if (cantidadTotal > cantidadRequerida) {
    const exceso = cantidadTotal - cantidadRequerida;
    const maximo = cantidadRequerida - cantidadSurtida;

    return {
      valid: false,
      error: `Exceso de ${exceso} unidades. Máximo permitido: ${maximo} unidades (Requerido: ${cantidadRequerida}, Ya surtido: ${cantidadSurtida})`,
      cantidadMaximaPermitida: maximo,
    };
  }

  // También validar que cantidad positiva
  if (cantidadARecoger <= 0) {
    return {
      valid: false,
      error: "Cantidad debe ser mayor a 0",
    };
  }

  return { valid: true };
}

/**
 * ✨ NUEVO: Valida cantidad acumulativa en modo override
 *
 * Verifica que el TOTAL de todos los picks en override
 * NO exceda la cantidad restante faltante
 *
 * @param detalle - Detalle de surtido
 * @param selecciones - Array de selecciones (cada una con cantidad_tomada)
 * @returns { valid: boolean, error?: string, diference?: number }
 */
export function validateAccumulativePickingAmount(
  detalle: any,
  selecciones: Array<{ cantidad_tomada: number }>,
): { valid: boolean; error?: string; difference?: number } {
  const cantidadRequerida = Number(detalle?.cantidad_requerida || 0);
  const cantidadSurtida = Number(detalle?.cantidad_surtida || 0);
  const cantidadRestante = cantidadRequerida - cantidadSurtida;

  // Sumar todas las cantidades seleccionadas
  const totalARecoger = selecciones.reduce(
    (sum, sel) => sum + (sel.cantidad_tomada || 0),
    0,
  );

  const totalNuevo = cantidadSurtida + totalARecoger;

  // Validación: No puede exceder lo requerido
  if (totalNuevo > cantidadRequerida) {
    const exceso = totalNuevo - cantidadRequerida;
    return {
      valid: false,
      error: `Total de picks excede cantidad requerida por ${exceso} unidades. Máximo en este lote: ${cantidadRestante} unidades`,
      difference: exceso,
    };
  }

  // Validación: No puede estar vacío
  if (totalARecoger <= 0) {
    return {
      valid: false,
      error: "Debe seleccionar al menos 1 unidad",
    };
  }

  return { valid: true };
}
