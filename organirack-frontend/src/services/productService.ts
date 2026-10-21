/**
 * services/productService.ts
 * Cliente HTTP para la API de Productos (catálogo maestro)
 * Centraliza todas las peticiones relacionadas con productos, categorías, marcas y unidades
 */

import { Producto, ApiResponsePaginated, ApiResponse, Categoria, UnidadMedida, Marca } from '../tipos/ordenes';
import axiosInstance from '../app/lib/axios';

// Re-exportar interfaces del tipos/ordenes.ts para compatibilidad
export type { Categoria, UnidadMedida, Marca, Producto };

export interface CatalogsResponse {
  categorias: Categoria[];
  marcas: Marca[];
  unidades_medida: UnidadMedida[];
}

class ProductService {

  /**
   * Obtiene todos los catálogos (categorías, marcas, unidades)
   * GET /api/catalogs
   */
  async getCatalogs(): Promise<CatalogsResponse> {
    try {
      const response = await axiosInstance.get<{ data: CatalogsResponse }>('/catalogs');
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error al obtener catálogos:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene lista de productos
   * GET /api/products
   */
  async getProducts(filters?: {
    search?: string;
    estado?: boolean;
    categoria_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<ApiResponsePaginated<Producto>> {
    try {
      const response = await axiosInstance.get<ApiResponsePaginated<Producto>>('/products', {
        params: {
          per_page: 500,
          ...filters,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al obtener productos:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene un producto específico
   * GET /api/products/:id
   */
  async getProduct(id: number): Promise<ApiResponse<Producto>> {
    try {
      const response = await axiosInstance.get<ApiResponse<Producto>>(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al obtener producto ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuevo producto
   * POST /api/products
   */
  async createProduct(productData: Partial<Producto>): Promise<ApiResponse<Producto>> {
    try {
      const response = await axiosInstance.post<ApiResponse<Producto>>('/products', productData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al crear producto:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Actualiza un producto existente
   * PUT /api/products/:id
   */
  async updateProduct(id: number, productData: Partial<Producto>): Promise<ApiResponse<Producto>> {
    try {
      const response = await axiosInstance.put<ApiResponse<Producto>>(`/products/${id}`, productData);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error al actualizar producto ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Elimina/desactiva un producto
   * DELETE /api/products/:id
   */
  async deleteProduct(id: number): Promise<ApiResponse<Producto>> {
    try {
      const response = await axiosInstance.delete<ApiResponse<Producto>>(`/products/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error al eliminar producto ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Crea una nueva categoría
   * POST /api/categorias
   */
  async createCategoria(nombre: string): Promise<ApiResponse<Categoria>> {
    try {
      const response = await axiosInstance.post<ApiResponse<Categoria>>('/categorias', { nombre });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al crear categoría:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Actualiza una categoría existente
   * PUT /api/categorias/:id
   */
  async updateCategoria(id: number, nombre: string): Promise<ApiResponse<Categoria>> {
    try {
      const response = await axiosInstance.put<ApiResponse<Categoria>>(`/categorias/${id}`, { nombre });
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error al actualizar categoría ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Elimina una categoría
   * DELETE /api/categorias/:id
   */
  async deleteCategoria(id: number): Promise<ApiResponse<Categoria>> {
    try {
      const response = await axiosInstance.delete<ApiResponse<Categoria>>(`/categorias/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error al eliminar categoría ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Crea una nueva marca
   * POST /api/marcas
   */
  async createMarca(nombre: string): Promise<ApiResponse<Marca>> {
    try {
      const response = await axiosInstance.post<ApiResponse<Marca>>('/marcas', { nombre });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al crear marca:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Actualiza una marca existente
   * PUT /api/marcas/:id
   */
  async updateMarca(id: number, nombre: string): Promise<ApiResponse<Marca>> {
    try {
      const response = await axiosInstance.put<ApiResponse<Marca>>(`/marcas/${id}`, { nombre });
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error al actualizar marca ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Elimina una marca
   * DELETE /api/marcas/:id
   */
  async deleteMarca(id: number): Promise<ApiResponse<Marca>> {
    try {
      const response = await axiosInstance.delete<ApiResponse<Marca>>(`/marcas/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error al eliminar marca ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }
}

export default new ProductService();
