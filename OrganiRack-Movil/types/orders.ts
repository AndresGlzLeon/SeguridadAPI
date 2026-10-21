/**
 * Tipos de datos para órdenes de surtido (picking)
 * Basados en estructura BD: ordenes_surtido, detalles_surtido, inventarios
 */

/**
 * Usuario (Capturista o Almacenista)
 */
export interface Usuario {
  id: number;
  name: string;
  username: string;
  email: string;
  is_active: boolean;
}

/**
 * Estado de la orden (PENDIENTE, EN_PROGRESO, COMPLETADA, CANCELADA)
 */
export interface EstadoOrden {
  id: number;
  nombre: string;
  descripcion?: string;
}

/**
 * Prioridad de la orden
 * nivel_ordenamiento: número usado para determinar prioridad en UI
 */
export interface PrioridadOrden {
  id: number;
  nombre: string; // ej: "Urgente", "Normal", "Baja"
  nivel_ordenamiento: number; // 1 = urgente/high, 2+ = normal/medium, 3+ = baja/low
  created_at?: string;
  updated_at?: string;
}

/**
 * Ubicación sugerida: estante con stock del producto
 * Mapea la respuesta de la API: ubicaciones_sugeridas[]
 */
export interface UbicacionSugerida {
  inventario_id?: number;
  estante_id: number;
  estante_codigo: string;
  cantidad_disponible: number;
  estado?: string;
}

/**
 * ✨ NUEVO: Ubicación recolectada (del nuevo backend de multi-picking)
 * Registra cada pick que se realiza desde diferentes ubicaciones
 */
export interface UbicacionRecolectada {
  estante_id: number;
  estante_codigo: string;
  cantidad_tomada: number;
  usuario: string;
  timestamp: string;
}

/**
 * ✨ NUEVO: Estado extendido de una orden (progreso)
 */
export interface EstadoOrdenExtendido {
  completa: boolean;
  items_completos: number;
  items_totales: number;
}

/**
 * Producto en detalle de orden
 */
export interface Producto {
  id: number;
  nombre: string;
  sku: string;
  descripcion?: string;
  categoria_id?: number;
  marca_id?: number;
  unidad_medida_id?: number;
}

/**
 * Detalle de surtido (un ítem dentro de una orden)
 */
export interface DetalleSurtido {
  id: number;
  orden_surtido_id: number;
  producto_id: number;
  cantidad_requerida: string | number; // cantidad solicitada
  cantidad_surtida: string | number; // cantidad ya surtida
  estante_sugerido_id?: number;
  estante_real_id?: number | null;
  fue_modificado: boolean;
  created_at?: string;
  updated_at?: string;
  producto: Producto;
  ubicaciones_sugeridas?: UbicacionSugerida[];

  // ✨ NUEVO: Multi-picking fields
  ubicaciones_recolectadas?: UbicacionRecolectada[]; // Histórico de picks desde diferentes ubicaciones
  es_completo?: boolean; // ¿Está con cantidad_surtida >= cantidad_requerida?
}

/**
 * Orden de surtido (orden de picking)
 * Estructura completa desde BD
 */
export interface OrdenSurtido {
  id: number;
  folio: string; // ej: "ORD-2441"
  estado_id: number;
  prioridad_id: number;
  capturista_id: number;
  almacenista_id: number;
  observaciones?: string;
  created_at: string;
  updated_at: string;

  // Relaciones cargadas
  estado?: EstadoOrden;
  prioridad?: PrioridadOrden;
  capturista?: Usuario;
  almacenista?: Usuario;
  detalles: DetalleSurtido[];
}

/**
 * Props para OrderCard component
 */
export interface OrderCardProps {
  id: number; // ID numérico único (usado internamente, en API, routing)
  folio: string; // Código visual (ej: "ORD-2441", mostrado al usuario)
  itemCount: number;
  priority: "high" | "medium" | "low";
  onPress: () => void;
}

/**
 * Respuesta del endpoint GET /api/mobile/picking/orders
 */
export interface GetOrdersResponse {
  message: string;
  data: OrdenSurtido[];
}

/**
 * Mapea prioridades de BD a UI basado en nivel_ordenamiento
 * nivel_ordenamiento: 1 = urgente/high, 2 = normal/medium, 3+ = baja/low
 */
export function mapPriorityToUI(
  prioridad: PrioridadOrden,
): "high" | "medium" | "low" {
  if (!prioridad) return "low";

  const nivel = prioridad.nivel_ordenamiento;
  if (nivel === 1) return "high";
  if (nivel === 2) return "medium";
  return "low";
}

/**
 * Transforma OrdenSurtido a OrderCardProps
 * Mapea: id, folio, cantidad de items, y prioridad mapeada
 */
export function transformOrderToCardProps(orden: OrdenSurtido): OrderCardProps {
  return {
    id: orden.id,
    folio: orden.folio,
    itemCount: orden.detalles.length,
    priority: orden.prioridad ? mapPriorityToUI(orden.prioridad) : "low",
    onPress: () => {}, // Se establece en la pantalla
  };
}
