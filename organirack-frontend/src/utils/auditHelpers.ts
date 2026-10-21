/**
 * utils/auditHelpers.ts
 * Funciones auxiliares para la Bitácora de Auditoría
 * Separa la lógica de presentación del componente principal
 */

import { ActivityLog, AuditLogProperties } from '../services/AuditService';

/**
 * Obtiene el nombre del usuario que causó el evento
 * Fallback a "Sistema" si no hay información del usuario
 */
export function getDisplayUser(log: ActivityLog): string {
  if (log.causer?.name) {
    return log.causer.name;
  }
  return log.causer_id ? `Usuario #${log.causer_id}` : 'Sistema';
}

/**
 * Extrae el nombre simple de la clase FQCN
 * Ejemplos:
 * - "App\Models\Inventario" → "Inventario"
 * - "App\Models\OrdenSurtido" → "OrdenSurtido"
 */
export function getDisplayModule(subjectType: string | null): string {
  if (!subjectType) {
    return 'Sistema';
  }

  const parts = subjectType.split('\\');
  return parts[parts.length - 1] ?? subjectType;
}

/**
 * Obtiene el nombre del evento con fallback
 */
export function getDisplayEvent(event: string | null): string {
  if (!event) {
    return 'evento desconocido';
  }
  // Humanizar: created → Created, updated → Updated
  return event.charAt(0).toUpperCase() + event.slice(1);
}

/**
 * Extrae las diferencias de propiedades entre valores antiguos y nuevos
 * @returns Array de cambios {key, oldValue, newValue}
 */
export function getPropertyDiff(properties: AuditLogProperties | null): Array<{
  key: string;
  oldValue: unknown;
  newValue: unknown;
}> {
  const oldValues = properties?.old ?? {};
  const newValues = properties?.attributes ?? {};
  const keys = Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)]));

  return keys.map((key) => ({
    key,
    oldValue: oldValues[key],
    newValue: newValues[key],
  }));
}

/**
 * Convierte cualquier valor a una representación de string legible
 * - null/undefined → "-"
 * - objetos → JSON stringificado
 * - primitivos → string normal
 */
export function toPrettyValue(value: unknown): string {
  if (value === null || typeof value === 'undefined') {
    return '-';
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

/**
 * Obtiene el color de badge según el tipo de evento
 */
export function getEventBadgeVariant(event: string | null): 'default' | 'secondary' | 'outline' | 'destructive' | 'success' {
  if (!event) return 'secondary';
  
  const variantMap: Record<string, 'default' | 'secondary' | 'outline' | 'destructive' | 'success'> = {
    'created': 'success',
    'updated': 'default',
    'deleted': 'destructive',
  };
  
  return variantMap[event.toLowerCase()] ?? 'outline';
}

/**
 * Obtiene el ícono correspondiente al tipo de evento
 */
export function getEventEmoji(event: string | null): string {
  if (!event) return '📝';
  
  return {
    'created': '✨',
    'updated': '✏️',
    'deleted': '🗑️',
  }[event.toLowerCase()] ?? '📝';
}

/**
 * Formatea una fecha en formato legible
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Obtiene tiempo relativo desde hace X tiempo (ej: "hace 2 horas")
 */
export function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'hace unos segundos';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 7) return `hace ${diffDays}d`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}
