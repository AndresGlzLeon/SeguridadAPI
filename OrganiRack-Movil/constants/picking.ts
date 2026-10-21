/**
 * Constantes para operaciones de picking
 * Centraliza textos, códigos de error, y configuración
 */

// Mensajes de error
export const PICKING_ERRORS = {
  NO_PRODUCT_SELECTED: "No hay producto seleccionado",
  NO_LOCATION_SPECIFIED: "Debe ingresar o escanear una ubicación",
  LOAD_ORDER_FAILED: "Error al cargar orden",
  AVAILABILITY_CHECK_FAILED: "Error al verificar disponibilidad",
  PICK_CONFIRMATION_FAILED: "Error al confirmar",
  INVALID_LOCATION_CODE: "Código de estante inválido",
  LOCATION_NOT_AVAILABLE: (code: string) =>
    `Ubicación "${code}" no disponible para este producto`,
};

// Estados de producto
export const PRODUCT_STATUS = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PICKED: "Recogido",
} as const;

// Secciones UI
export const PICKING_SECTIONS = {
  PROGRESS: "Progreso de Picking",
  PRODUCT: "Producto a Recoger",
  LOCATION: "Especificar Ubicación",
  AVAILABILITY: "Verificar Disponibilidad",
  CONFIRM: "Confirmar Recolección",
} as const;

// Placeholders
export const PICKING_PLACEHOLDERS = {
  LOCATION_CODE: "Ej. EST-1-1-1-4",
  LOADING: "Cargando detalles de orden...",
  RETRY: "REINTENTAR",
  NO_DATA: "No hay datos disponibles",
} as const;

// Textos de interfaz (sin emojis - los iconos se agregan en componentes)
export const PICKING_LABELS = {
  SCAN_QR: "ESCANEAR UBICACIÓN",
  SCAN_QR_ICON: "qrcode-scan", // Ícono para usar con IconLabel
  PROBLEMS: "¿Problemas?",
  OVERRIDE: "MODO OVERRIDE",
  AVAILABLE: "Disponibles", // Usar con cantidad en componente
  AVAILABLE_ICON: "check",
  READY_TO_CONFIRM: "CONFIRMADO",
  READY_TO_CONFIRM_ICON: "check-bold",
  ERROR_STATE: "ERROR",
  ERROR_STATE_ICON: "close-circle",
  ORDER_LABEL: "ORDEN",
} as const;

// Valores por defecto
export const PICKING_DEFAULTS = {
  EMPTY_DETAIL_ID: null,
  EMPTY_LOCATION_CODE: "",
  AVAILABLE_QUANTITY: null,
  AVAILABILITY_STATUS: null,
} as const;
