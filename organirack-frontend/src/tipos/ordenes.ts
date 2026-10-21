/**
 * tipos/ordenes.ts
 * Interfaces TypeScript para el módulo de Gestión de Surtidos
 * Basadas en la estructura de la API REST del backend
 */

/**
 * Estado de la Orden
 */
export interface EstadoOrden {
  id: number;
  nombre: string;
  color_hex: string;
}

/**
 * Prioridad de la Orden
 */
export interface PrioridadOrden {
  id: number;
  nombre: string;
  nivel_ordenamiento: number;
}

/**
 * Categoría de Producto
 */
export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
}

/**
 * Unidad de Medida
 */
export interface UnidadMedida {
  id: number;
  nombre: string;
  abreviatura?: string;
}

/**
 * Marca
 */
export interface Marca {
  id: number;
  nombre: string;
  sitio_web?: string;
}

/**
 * Producto en el catálogo
 */
export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  categoria_id: number;
  unidad_medida_id: number;
  marca_id: number;
  stock_min: number;
  stock_max: number;
  estado: boolean;
  // Relaciones opcionales cuando vienen cargadas desde el backend
  categoria?: Categoria;
  unidad_medida?: UnidadMedida;
  marca?: Marca;
  created_at?: string;
  updated_at?: string;
}

/**
 * Estante en el almacén
 */
export interface Estante {
  id: number;
  pasillo_id: number;
  posicion: string;
  capacidad: number;
  ocupacion_actual: number;
}

/**
 * Usuario (Capturista o Almacenista)
 */
export interface Usuario {
  id: number;
  name: string;
  email: string;
}

/**
 * Detalle de la Orden (Partida)
 */
export interface DetalleSurtido {
  id: number;
  orden_surtido_id: number;
  producto_id: number;
  cantidad_requerida: string | number;
  cantidad_surtida: string | number;
  fue_modificado: boolean;
  estante_sugerido_id: number | null;
  estante_real_id: number | null;
  // Relaciones cargadas desde el backend
  producto?: Producto;
  estante_sugerido?: Estante;
  estante_real?: Estante | null;
}

/**
 * Orden de Surtido (Cabecera)
 */
export interface OrdenSurtido {
  id: number;
  folio: string;
  referencia_destino: string | null;
  capturista_id: number;
  almacenista_id: number | null;
  estado_id: number;
  prioridad_id: number;
  fecha_requerida: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones cargadas desde el backend (Eager Loading)
  estado?: EstadoOrden;
  prioridad?: PrioridadOrden;
  capturista?: Usuario;
  almacenista?: Usuario | null;
  detalles?: DetalleSurtido[];
}

/**
 * Payload para crear orden (POST /api/orders)
 */
export interface CreateOrderPayload {
  prioridad_id: number;
  referencia_destino?: string;
  fecha_requerida?: string;
  detalles: Array<{
    producto_id: number;
    cantidad_requerida: number;
    estante_sugerido_id?: number;
  }>;
}

/**
 * Respuesta de la API (con paginación)
 */
export interface ApiResponsePaginated<T> {
  message: string;
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

/**
 * Respuesta de la API (sin paginación)
 */
export interface ApiResponse<T> {
  message: string;
  data: T;
}

/**
 * Detalle temporal para el "carrito" de creación
 */
export interface DetalleCarrito {
  tempId: string; // ID temporal para React key
  producto_id: number;
  cantidad_requerida: number;
  estante_sugerido_id?: number;
  // Info del producto para mostrar
  producto?: Producto;
}
