/**
 * services/inventoryDashboardService.ts
 * 
 * SERVICIO UNIFICADO DE ANALÍTICA Y DASHBOARD
 * Centraliza todas las peticiones relacionadas con KPIs, gráficas y control
 * estadístico del inventario. Todo lo que es "analítica" o "solo lectura masiva"
 * vive aquí, separado de las funciones operacionales de inventoryService.ts.
 */

import axiosInstance from '../app/lib/axios';

// ==========================================
// INTERFACES (Tipos TypeScript)
// ==========================================

export interface DashboardApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface TopUbicacion {
  estante_id: number;
  codigo_etiqueta: string;
  cantidad: number;
}

export interface KpisResponse {
  unidades_totales: number;
  ubicaciones_activas: number; // Directo desde BD (antes se calculaba en frontend)
  productos_unicos: number;    // Directo desde BD (antes se calculaba en frontend)
  top_ubicaciones: TopUbicacion[];
  timestamp: string;
}

export interface InventoryTableItem {
  id: number;
  producto_id: number;
  estante_id: number;
  estado_id: number;
  sku: string;
  producto_nombre: string;
  ubicacion: string;
  cantidad: number;
  estado_nombre: string;
  created_at?: string;
  updated_at?: string;
}

export interface StateDistributionItem {
  estado_id: number;
  estado_nombre: string;
  cantidad_total: number;
  porcentaje: number;
}

export interface CategoryDistributionItem {
  categoria_id: number | null;
  categoria_nombre: string;
  cantidad_total: number;
  porcentaje: number;
}

export interface TopShelfItem {
  estante_id: number;
  estante_codigo: string;
  estante_nivel: string;
  total_cantidad: number;
  cantidad_productos: number;
}

// Existencias detalladas y paginables
export interface RegistroInventario {
  id: number;
  producto_id: number;
  sku: string;
  producto_nombre: string;
  estante_id: number;
  ubicacion: string; 
  ubicacion_nivel: string;
  cantidad: number;
  estado_id: number;
  estado_nombre: string;
  estado_simple: 'ok' | 'critico';
  created_at: string;
  updated_at: string;
}

export interface ExistenciasResponse {
  data: RegistroInventario[];
  total: number;
  timestamp: string;
}


// ==========================================
// SERVICIO PRINCIPAL
// ==========================================

class InventoryDashboardService {

  /**
   * Obtener KPIs del inventario (Optimizados en Backend)
   * GET /api/dashboard/inventory/kpis
   * @returns Promise<KpisResponse>
   */
  async getKpis(): Promise<KpisResponse> {
    try {
      console.log('📊 Solicitando KPIs optimizados al backend...');
      const response = await axiosInstance.get<DashboardApiResponse<KpisResponse>>(
        '/dashboard/inventory/kpis'
      );
      return response.data.data;
    } catch (error) {
      console.error('❌ Error al obtener KPIs de inventario:', error);
      throw error;
    }
  }

  /**
   * Obtener tabla plana de inventario (Ideal para tablas estáticas masivas en frontend)
   * GET /api/dashboard/inventory/table
   */
  async getInventoryTable(): Promise<InventoryTableItem[]> {
    try {
      const response = await axiosInstance.get('/dashboard/inventory/table');
      const data = response.data?.data?.data || response.data?.data || [];
      return data;
    } catch (error) {
      console.error('❌ Error al obtener tabla plana de inventario:', error);
      throw error;
    }
  }

  /**
   * Gráfica: Distribución de inventario por estado (Disponible, Dañado, etc)
   * GET /api/dashboard/inventory/distribution-by-state
   */
  async getInventoryDistributionByState(): Promise<StateDistributionItem[]> {
    try {
      const response = await axiosInstance.get('/dashboard/inventory/distribution-by-state');
      const data = response.data?.data?.data || response.data?.data || [];
      return data;
    } catch (error) {
      console.error('❌ Error al obtener distribución por estado:', error);
      throw error;
    }
  }

  /**
   * Gráfica: Distribución de inventario por categoría
   * GET /api/dashboard/inventory/distribution-by-category
   */
  async getInventoryDistributionByCategory(): Promise<CategoryDistributionItem[]> {
    try {
      const response = await axiosInstance.get('/dashboard/inventory/distribution-by-category');
      const data = response.data?.data?.data || response.data?.data || [];
      return data;
    } catch (error) {
      console.error('❌ Error al obtener distribución por categoría:', error);
      throw error;
    }
  }

  /**
   * Gráfica: Top 5 estantes por cantidad de unidades
   * GET /api/dashboard/inventory/top-shelves
   */
  async getTopShelvesByQuantity(): Promise<TopShelfItem[]> {
    try {
      const response = await axiosInstance.get('/dashboard/inventory/top-shelves');
      const data = response.data?.data?.data || response.data?.data || [];
      return data;
    } catch (error) {
      console.error('❌ Error al obtener top estantes:', error);
      throw error;
    }
  }

  /**
   * Obtener existencias detalladas con paginación/filtros desde servidor
   * GET /api/dashboard/inventory/existencias
   */
  async getExistencias(filters?: {
    search?: string;
    almacen_id?: number;
  }): Promise<ExistenciasResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.almacen_id) params.append('almacen_id', filters.almacen_id.toString());

      const response = await axiosInstance.get<DashboardApiResponse<ExistenciasResponse>>(
        `/dashboard/inventory/existencias?${params.toString()}`
      );
      return response.data.data;
    } catch (error) {
      console.error('❌ Error al obtener existencias con filtro:', error);
      throw error;
    }
  }

  /**
   * Auxiliar: Obtener almacenes (Catálogos)
   * GET /api/almacenes
   */
  async getAlmacenes(): Promise<{ id: number; nombre: string; siglas?: string }[]> {
    try {
      const response = await axiosInstance.get<{ data: { id: number; nombre: string; siglas?: string }[] }>(
        '/almacenes'
      );
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Error al obtener almacenes:', error);
      return [];
    }
  }
}

export const inventoryDashboardService = new InventoryDashboardService();
export default inventoryDashboardService;
