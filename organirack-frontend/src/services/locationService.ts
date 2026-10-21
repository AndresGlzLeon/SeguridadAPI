/**
 * services/locationService.ts
 * Cliente HTTP para la API de Ubicaciones (Mapa de Almacén)
 * Centraliza todas las peticiones relacionadas con la jerarquía de almacén y inventarios
 */

import axiosInstance from '../app/lib/axios';
import { ApiResponse } from '../tipos/ordenes';

// Interfaces para la jerarquía de ubicaciones
export interface Almacen {
  id: number;
  nombre: string;
  siglas: string;
  pasillos?: Pasillo[];
}

export interface Pasillo {
  id: number;
  almacen_id: number;
  nombre: string;
  racks?: Rack[];
}

export interface Rack {
  id: number;
  pasillo_id: number;
  nombre_rack: string;
  estantes?: Estante[];
}

export interface Estante {
  id: number;
  rack_id: number;
  nivel: number;
  codigo_etiqueta: string;
  tipo_zona: string;
  esta_lleno: boolean;
}

// Interfaces para inventario
export interface Inventario {
  id: number;
  producto_id: number;
  estante_id: number;
  estado_id: number;
  cantidad: number;
  producto?: Producto;
  estante?: Estante;
  estado?: EstadoInventario;
}

export interface EstadoInventario {
  id: number;
  nombre: string;
}

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
}

class LocationService {

  /**
   * Obtiene la jerarquía completa de ubicaciones (árbol)
   * GET /api/ubicaciones/arbol
   */
  async getTree(): Promise<Almacen[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<Almacen[]>>('/ubicaciones/arbol');
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error al obtener el árbol de ubicaciones:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene el inventario de un estante específico
   * GET /api/ubicaciones/estantes/{id}/inventario
   */
  async getInventoryByEstante(estanteId: number): Promise<Inventario[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<Inventario[]>>(`/ubicaciones/estantes/${estanteId}/inventario`);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error al obtener el inventario del estante:', error.message);
      throw error;
    }
  }

  // --- Almacenes ---
  async createAlmacen(data: { nombre: string; siglas?: string }): Promise<Almacen> {
    const res = await axiosInstance.post('/ubicaciones/crud/almacenes', data);
    return res.data;
  }
  async updateAlmacen(id: number, data: Partial<{ nombre: string; siglas: string }>): Promise<Almacen> {
    const res = await axiosInstance.put(`/ubicaciones/crud/almacenes/${id}`, data);
    return res.data;
  }
  async deleteAlmacen(id: number): Promise<void> {
    await axiosInstance.delete(`/ubicaciones/crud/almacenes/${id}`);
  }

  // --- Pasillos ---
  async createPasillo(data: { almacen_id: number; nombre: string }): Promise<Pasillo> {
    const res = await axiosInstance.post('/ubicaciones/crud/pasillos', data);
    return res.data;
  }
  async updatePasillo(id: number, data: Partial<{ almacen_id: number; nombre: string }>): Promise<Pasillo> {
    const res = await axiosInstance.put(`/ubicaciones/crud/pasillos/${id}`, data);
    return res.data;
  }
  async deletePasillo(id: number): Promise<void> {
    await axiosInstance.delete(`/ubicaciones/crud/pasillos/${id}`);
  }

  // --- Racks ---
  async createRack(data: { pasillo_id: number; nombre_rack: string }): Promise<Rack> {
    const res = await axiosInstance.post('/ubicaciones/crud/racks', data);
    return res.data;
  }
  async updateRack(id: number, data: Partial<{ pasillo_id: number; nombre_rack: string }>): Promise<Rack> {
    const res = await axiosInstance.put(`/ubicaciones/crud/racks/${id}`, data);
    return res.data;
  }
  async deleteRack(id: number): Promise<void> {
    await axiosInstance.delete(`/ubicaciones/crud/racks/${id}`);
  }

  // --- Estantes ---
  async createEstante(data: { rack_id: number; nivel: string; codigo_etiqueta: string; tipo_zona?: string; esta_lleno?: boolean }): Promise<Estante> {
    const res = await axiosInstance.post('/ubicaciones/crud/estantes', data);
    return res.data;
  }
  async updateEstante(id: number, data: Partial<{ rack_id: number; nivel: string; codigo_etiqueta: string; tipo_zona: string; esta_lleno: boolean }>): Promise<Estante> {
    const res = await axiosInstance.put(`/ubicaciones/crud/estantes/${id}`, data);
    return res.data;
  }
  async deleteEstante(id: number): Promise<void> {
    await axiosInstance.delete(`/ubicaciones/crud/estantes/${id}`);
  }
}

export default new LocationService();