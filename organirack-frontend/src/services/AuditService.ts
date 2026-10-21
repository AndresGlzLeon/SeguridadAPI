import { AxiosError } from 'axios';
import axiosInstance from '../app/lib/axios';

// ====== TIPOS ======
export interface AuditLogUser {
  id: number;
  name: string;
  username: string;
}

export interface AuditLogProducto {
  id: number;
  sku: string;
  nombre: string;
}

export interface AuditLogEstante {
  id: number;
  codigo_etiqueta: string;
}

export interface AuditLogDetalleSurtido {
  id: number;
  producto: AuditLogProducto | null;
  estante_sugerido: AuditLogEstante | null;
  estante_real: AuditLogEstante | null;
  fue_modificado: boolean;
}

export interface AuditLog {
  id: number;
  detalle_surtido_id: number | null;
  user_id: number;
  estante_origen_id: number | null;
  estante_destino_id: number | null;
  tipo_movimiento: string;
  cantidad_anterior: number;
  cantidad_nueva: number;
  observaciones: string | null;
  fecha_hora: string;
  created_at: string;
  updated_at: string;
  user: AuditLogUser | null;
  detalle_surtido: AuditLogDetalleSurtido | null;
  estante_origen: AuditLogEstante | null;
  estante_destino: AuditLogEstante | null;
}

// Tipos legacy que necesita auditHelpers (alias de compatibilidad)
export type ActivityLog = AuditLog & {
  description?: string;
  subject_type?: string;
  causer_id?: number;
  causer?: { id: number; name: string; email: string } | null;
  event?: string;
  properties?: AuditLogProperties | null;
};

export interface AuditLogProperties {
  attributes?: Record<string, unknown>;
  old?: Record<string, unknown>;
}

export interface AuditPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface AuditFilterUserOption {
  id: number;
  name: string;
  email: string;
}

export interface AuditFilterMovementTypeOption {
  value: string;
  label: string;
}

export interface AuditFilterOptions {
  users: AuditFilterUserOption[];
  movement_types: AuditFilterMovementTypeOption[];
}

export interface AuditLogsResponse {
  message: string;
  data: AuditLog[];
  pagination: AuditPagination;
  filters: AuditFilterOptions;
}

export interface AuditLogFilters {
  search?: string;
  causer_id?: number;
  tipo_movimiento?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface AuditServiceError {
  message: string;
  statusCode?: number;
  details?: unknown;
}

// ====== CLASE ======
class AuditService {
  /**
   * Valida que las fechas sean válidas y date_from <= date_to
   */
  private validateDateRange(date_from?: string, date_to?: string): void {
    if (date_from && date_to) {
      const fromDate = new Date(date_from);
      const toDate = new Date(date_to);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw { message: 'Fechas de rango inválido', statusCode: 400 } as AuditServiceError;
      }
      if (fromDate > toDate) {
        throw { message: 'date_from no puede ser mayor que date_to', statusCode: 400 } as AuditServiceError;
      }
    }
  }

  /**
   * Extrae el mensaje de error de una respuesta Axios
   */
  private extractErrorMessage(error: unknown): AuditServiceError {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      return { message: String(message), statusCode: status, details: error.response?.data };
    }
    return { message: 'Error desconocido al obtener auditoría', details: error };
  }

  /**
   * Obtiene registros de auditoría con filtros opcionales
   * GET /audit-logs
   */
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogsResponse> {
    try {
      this.validateDateRange(filters.date_from, filters.date_to);

      // Limpiar params: eliminar undefined, null, y strings vacíos
      const cleanParams: Record<string, string | number> = {};
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = value;
        }
      }

      const response = await axiosInstance.get<AuditLogsResponse>('/audit-logs', {
        params: cleanParams,
      });

      return response.data;
    } catch (error) {
      const err = this.extractErrorMessage(error);
      console.error('❌ Error al obtener auditoría:', err);
      throw err;
    }
  }
}

export default new AuditService();
