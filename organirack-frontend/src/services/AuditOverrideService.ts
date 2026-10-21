import { AxiosError } from 'axios';
import axiosInstance from '../app/lib/axios';

// ====== TIPOS ======
export interface AuditOverrideUser {
  id: number;
  name: string;
  username: string;
}

export interface AuditOverrideProducto {
  id: number;
  sku: string;
  nombre: string;
}

export interface AuditOverrideDetalleSurtido {
  id: number;
  producto: AuditOverrideProducto;
}

export interface AuditOverride {
  id: number;
  detalle_surtido_id: number;
  user_id: number;
  tipo_movimiento: string;
  cantidad_anterior: number;
  cantidad_nueva: number;
  observaciones: string | null;
  fecha_hora: string;
  created_at: string;
  updated_at: string;
  detalleSurtido: AuditOverrideDetalleSurtido;
  user: AuditOverrideUser;
}

export interface AuditOverridePagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface AuditOverrideKPIs {
  total_overrides_mes_actual: number;
  producto_mas_overrides: {
    nombre: string;
    sku: string;
    total_overrides: number;
  } | null;
}

export interface AuditOverrideUserOption {
  id: number;
  name: string;
  username: string;
}

export interface AuditOverrideFilterOptions {
  usuarios: AuditOverrideUserOption[];
}

export interface AuditOverrideResponse {
  message: string;
  data: AuditOverride[];
  pagination: AuditOverridePagination;
  kpis: AuditOverrideKPIs;
  filters: AuditOverrideFilterOptions;
}

export interface AuditOverrideFilters {
  user_id?: number;
  date_from?: string;
  date_to?: string;
  sku?: string;
  page?: number;
  per_page?: number;
}

export interface AuditOverrideServiceError {
  message: string;
  statusCode?: number;
  details?: unknown;
}

// ====== CLASE ======
class AuditOverrideService {
  /**
   * Valida que las fechas sean válidas y date_from <= date_to
   */
  private validateDateRange(date_from?: string, date_to?: string): void {
    if (date_from && date_to) {
      const fromDate = new Date(date_from);
      const toDate = new Date(date_to);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw { message: 'Fechas de rango inválido', statusCode: 400 } as AuditOverrideServiceError;
      }
      if (fromDate > toDate) {
        throw { message: 'date_from no puede ser mayor que date_to', statusCode: 400 } as AuditOverrideServiceError;
      }
    }
  }

  /**
   * Extrae el mensaje de error de una respuesta Axios
   */
  private extractErrorMessage(error: unknown): AuditOverrideServiceError {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      return { message: String(message), statusCode: status, details: error.response?.data };
    }
    return { message: 'Error desconocido al obtener overrides de auditoría', details: error };
  }

  /**
   * Obtiene registros de overrides de auditoría con filtros opcionales
   * GET /api/audit-overrides
   * @param {AuditOverrideFilters} filters - Filtros opcionales
   * @returns {Promise<AuditOverrideResponse>}
   * @throws {AuditOverrideServiceError}
   */
  async getAuditOverrides(filters: AuditOverrideFilters = {}): Promise<AuditOverrideResponse> {
    try {
      // Validar rango de fechas si ambas están presentes
      this.validateDateRange(filters.date_from, filters.date_to);

      const response = await axiosInstance.get<AuditOverrideResponse>('/api/audit-overrides', {
        params: filters,
      });

      return response.data;
    } catch (error) {
      const err = this.extractErrorMessage(error);
      console.error('❌ Error al obtener overrides de auditoría:', err);
      throw err;
    }
  }
}

export default new AuditOverrideService();