import axiosInstance from './axios';

/**
 * Servicios de API centralizados
 * Todos usan el cliente axios configurado con autenticación automática
 */

// ========== AUTH SERVICES ==========

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  email: string;
  roles?: string[];
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await axiosInstance.get('/user');
  return response.data;
}

// ========== DASHBOARD SERVICES ==========

export async function getOrdersByState() {
  const response = await axiosInstance.get('/dashboard/orders-by-state');
  return response.data;
}

export async function getOrdersByPriority() {
  const response = await axiosInstance.get('/dashboard/orders-by-priority');
  return response.data;
}

export async function getInventoryByCategory() {
  const response = await axiosInstance.get('/dashboard/inventory-by-category');
  return response.data;
}

export async function getWarehouseOccupancy() {
  const response = await axiosInstance.get('/dashboard/warehouse-occupancy');
  return response.data;
}

export async function getCriticalStock() {
  const response = await axiosInstance.get('/dashboard/critical-stock');
  return response.data;
}

export async function getDashboardMetrics() {
  const response = await axiosInstance.get('/dashboard/metrics');
  return response.data;
}

// ========== PICKING SERVICES ==========

export interface OverrideLocationPayload {
  location_id: number;
  new_quantity: number;
}

export async function overridePickingLocation(payload: OverrideLocationPayload) {
  const response = await axiosInstance.post('/picking/override-location', payload);
  return response.data;
}

// ========== TEST/DEBUG SERVICES ==========

export async function testDashboardPing() {
  const response = await axiosInstance.get('/test/dashboard/ping');
  return response.data;
}

export async function testDashboardSimple() {
  const response = await axiosInstance.get('/test/dashboard/simple');
  return response.data;
}

export async function testDashboardOrders() {
  const response = await axiosInstance.get('/test/dashboard/orders');
  return response.data;
}

/**
 * Uso ejemplo:
 *
 * import { getCurrentUser, getOrdersByState } from '@/app/lib/apiServices';
 *
 * // En un componente:
 * try {
 *   const user = await getCurrentUser();
 *   const orders = await getOrdersByState();
 * } catch (error) {
 *   console.error('Error:', error);
 * }
 */
