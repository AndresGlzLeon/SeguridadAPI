/**
 * CONSTANTES: Iconografía Formal Sistema OrganiRack+
 * 
 * Reemplaza emojis por MaterialCommunityIcons
 * Centraliza nombres de iconos, colores y tamaños
 */

// ==================== ICONOS ====================

export const FORM_ICONS = {
  // Confirmación/Éxito
  SUCCESS_CHECK: 'check-circle',
  SUCCESS_CHECK_SIMPLE: 'check',
  SUCCESS_CHECK_FILLED: 'check-bold',
  SUCCESS_CHECK_OUTLINE: 'check-outline',

  // Error/Negación
  ERROR_CLOSE: 'close-circle',
  ERROR_CLOSE_SIMPLE: 'close',
  ERROR_ALERT: 'alert-circle',
  ERROR_BLOCK: 'block-helper',

  // Advertencia
  WARNING_ALERT: 'alert',
  WARNING_EXCLAMATION: 'exclamation',
  WARNING_OUTLINE: 'alert-outline',

  // Información
  INFO_LIGHTBULB: 'lightbulb-on',
  INFO_ICON: 'information',

  // Acciones
  ACTION_CAMERA: 'camera-scanline',
  ACTION_QR: 'qrcode-scan',

  // Navegación
  NAV_CHEVRON_RIGHT: 'chevron-right',
  NAV_CHEVRON_DOWN: 'chevron-down',
  NAV_CHEVRON_UP: 'chevron-up',
  NAV_CHEVRON_LEFT: 'chevron-left',
} as const;

// ==================== COLORES ====================

export const FORM_COLORS = {
  success: '#10B981',    // Verde - Confirmación
  error: '#EF4444',      // Rojo - Error/Crítico
  warning: '#F59E0B',    // Naranja - Advertencia
  info: '#3B82F6',       // Azul - Información
  default: '#1B6497',    // Azul corporativo - General
} as const;

// ==================== TAMAÑOS ====================

export const FORM_SIZES = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 32,
} as const;

// ==================== TIPOS DE ESTADO ====================

export const STATUS_TYPES = {
  success: {
    icon: FORM_ICONS.SUCCESS_CHECK,
    color: FORM_COLORS.success,
    label: 'Éxito',
  },
  error: {
    icon: FORM_ICONS.ERROR_ALERT,
    color: FORM_COLORS.error,
    label: 'Error',
  },
  warning: {
    icon: FORM_ICONS.WARNING_ALERT,
    color: FORM_COLORS.warning,
    label: 'Advertencia',
  },
  info: {
    icon: FORM_ICONS.INFO_ICON,
    color: FORM_COLORS.info,
    label: 'Información',
  },
} as const;

// ==================== MAPEOS PERSONALIZADOS ====================

/**
 * Mapeo de emojis a iconos para referencia histórica
 * Útil para buscar qué ícono reemplaza qué emoji
 */
export const EMOJI_TO_ICON_MAP = {
  '✓': FORM_ICONS.SUCCESS_CHECK,           // Check simple
  '✅': FORM_ICONS.SUCCESS_CHECK,          // Check en círculo
  '✗': FORM_ICONS.ERROR_CLOSE,             // X error simple
  '❌': FORM_ICONS.ERROR_ALERT,            // X error círculo
  '⚠️': FORM_ICONS.WARNING_ALERT,          // Warning
  '💡': FORM_ICONS.INFO_LIGHTBULB,         // Lightbulb
  '📱': FORM_ICONS.ACTION_QR,              // Smartphone → QR
  '▶': FORM_ICONS.NAV_CHEVRON_RIGHT,       // Flecha derecha
  '▼': FORM_ICONS.NAV_CHEVRON_DOWN,        // Flecha abajo
} as const;

// ==================== CONFIGURACIONES PREDEFINIDAS ====================

/**
 * Configuraciones de ícono + color para uso rápido
 */
export const ICON_CONFIGS = {
  // Para PickingProgressSection
  progressComplete: {
    icon: FORM_ICONS.SUCCESS_CHECK,
    color: FORM_COLORS.success,
    size: FORM_SIZES.md,
  },

  // Para availabilityChecker - Estados
  statusAvailable: {
    icon: FORM_ICONS.SUCCESS_CHECK,
    color: FORM_COLORS.success,
    size: FORM_SIZES.lg,
  },
  statusUnavailable: {
    icon: FORM_ICONS.ERROR_CLOSE,
    color: FORM_COLORS.error,
    size: FORM_SIZES.lg,
  },

  // Para overrideScreen - Botón confirmar
  confirmButton: {
    icon: FORM_ICONS.SUCCESS_CHECK_FILLED,
    color: '#FFFFFF', // Override para botón verde
    size: FORM_SIZES.md,
  },

  // Para errores modales
  errorModal: {
    icon: FORM_ICONS.ERROR_ALERT,
    color: FORM_COLORS.error,
    size: FORM_SIZES.xl,
  },

  // Para warnings/advertencias
  warningBanner: {
    icon: FORM_ICONS.WARNING_ALERT,
    color: FORM_COLORS.warning,
    size: FORM_SIZES.lg,
  },

  // Para tips/información
  infoTip: {
    icon: FORM_ICONS.INFO_LIGHTBULB,
    color: FORM_COLORS.info,
    size: FORM_SIZES.md,
  },

  // Para botones de acción (escaneo)
  actionScan: {
    icon: FORM_ICONS.ACTION_QR,
    color: FORM_COLORS.default,
    size: FORM_SIZES.lg,
  },
} as const;

// ==================== VALIDACIÓN EN TIEMPO DE COMPILACIÓN ====================

/**
 * Tipos para garantizar que solo se usen iconos válidos
 */
export type FormIconName = typeof FORM_ICONS[keyof typeof FORM_ICONS];
export type FormColorName = keyof typeof FORM_COLORS;
export type FormSizeName = keyof typeof FORM_SIZES;
export type StatusType = keyof typeof STATUS_TYPES;
