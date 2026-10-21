/**
 * services/orderService.ts
 * Cliente HTTP para la API de Órdenes de Surtido
 * Proporciona acceso tipado y validado a endpoints de órdenes de surtido
 */

import {
  OrdenSurtido,
  CreateOrderPayload,
  ApiResponsePaginated,
  ApiResponse,
} from '../tipos/ordenes';
import axiosInstance from '../app/lib/axios';

// ====== CLASE ======
class OrderService {

  /**
   * Obtiene lista de órdenes con filtros y paginación
   * GET /api/orders
   * @param {OrderFilters} filters - Filtros opcionales
   * @returns {Promise<ApiResponsePaginated<OrdenSurtido>>}
   * @throws {OrderServiceError}
   */
  async getOrdenes(filters?: OrderFilters): Promise<ApiResponsePaginated<OrdenSurtido>> {
    try {
      const response = await axiosInstance.get<ApiResponsePaginated<OrdenSurtido>>('/orders', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      const err = this.extractErrorMessage(error);
      console.error('❌ Error al obtener órdenes:', err);
      throw err;
    }
  }

  /**
   * Obtiene una orden específica
   * GET /api/orders/:id
   */
  async getOrden(id: number): Promise<ApiResponse<OrdenSurtido>> {
    try {
      const response = await axiosInstance.get<ApiResponse<OrdenSurtido>>(`/orders/${id}`);
      return response.data;
    } catch (error) {
      const err = this.extractErrorMessage(error);
      console.error(`❌ Error al obtener orden ${id}:`, err);
      throw err;
    }
  }

  /**
   * Crea una nueva orden
   * POST /api/orders
   */
  async crearOrden(payload: CreateOrderPayload): Promise<ApiResponse<OrdenSurtido>> {
    try {
      if (!payload) throw { message: 'Payload de orden requerido', statusCode: 400 } as OrderServiceError;
      console.log('📦 Enviando orden al backend:', payload);
      const response = await axiosInstance.post<ApiResponse<OrdenSurtido>>('/orders', payload);
      console.log('✅ Orden creada exitosamente:', response.data);
      return response.data;
    } catch (error) {
      const err = this.extractErrorMessage(error);
      console.error('❌ Error al crear orden:', err);
      throw err;
    }
  }

  /**
   * Actualiza el estado de una orden
   * PATCH /api/orders/:id/status
   */
  async actualizarEstado(id: number, estado_id: number): Promise<ApiResponse<OrdenSurtido>> {
    try {
      const response = await axiosInstance.patch<ApiResponse<OrdenSurtido>>(
        `/orders/${id}/status`,
        { estado_id }
      );
      return response.data;
    } catch (error) {
      const err = this.extractErrorMessage(error);
      console.error(`❌ Error al actualizar estado de orden ${id}:`, err);
      throw err;
    }
  }

  /**
   * Asigna un almacenista a una orden
   * PUT /api/orders/:id/assign
   */
  async asignarAlmacenista(id: number, almacenista_id: number): Promise<ApiResponse<OrdenSurtido>> {
    try {
      const response = await axiosInstance.put<ApiResponse<OrdenSurtido>>(
        `/orders/${id}/assign`,
        { almacenista_id }
      );
      return response.data;
    } catch (error) {
      const err = this.extractErrorMessage(error);
      console.error(`❌ Error al asignar almacenista a orden ${id}:`, err);
      throw err;
    }
  }

  /**
   * Obtiene lista de usuarios con rol almacenista
   * GET /api/users/almacenistas
   */
  async getAlmacenistas(): Promise<ApiResponse<{ id: number; name: string }[]>> {
    try {
      const response = await axiosInstance.get<ApiResponse<{ id: number; name: string }[]>>('/users/almacenistas');
      return response.data;
    } catch (error) {
      const err = this.extractErrorMessage(error);
      console.error('❌ Error al obtener almacenistas:', err);
      throw err;
    }
  }

  /**
   * Descarga PDF (Vale de Salida / Remisión de Surtido)
   * GET /api/orders/:id/pdf
   * Returns: Blob de PDF
   */
  async downloadPdf(id: number): Promise<Blob> {
    try {
      console.log('📄 Descargando PDF de orden:', id);
      const response = await axiosInstance.get(`/orders/${id}/pdf`, {
        responseType: 'blob',
      });
      console.log('✅ PDF descargado exitosamente:', {
        size: response.data.size,
        type: response.data.type,
      });
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error al descargar PDF de orden ${id}:`, error.message);
      throw error;
    }
  }
}

export default new OrderService();
