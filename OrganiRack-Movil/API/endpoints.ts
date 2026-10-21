/**
 * Definición de endpoints de la API
 * Las rutas son relativas ya que el cliente axios maneja la URL base
 */

/**
 * Rutas de autenticación
 */
export const AUTH_ENDPOINTS = {
  login: "/login",
} as const;

/**
 * Rutas de órdenes
 */
export const ORDERS_ENDPOINTS = {
  getAll: "/orders",
  getById: (id: number) => `/orders/${id}`,
  create: "/orders",
} as const;

/**
 * Rutas de productos
 */
export const PRODUCTS_ENDPOINTS = {
  getAll: "/products",
  getById: (id: number) => `/products/${id}`,
  create: "/products",
  update: (id: number) => `/products/${id}`,
  delete: (id: number) => `/products/${id}`,
} as const;

/**
 * Rutas de catálogos
 */
export const CATALOG_ENDPOINTS = {
  getAll: "/catalogs",
  createCategory: "/categorias",
  createBrand: "/marcas",
} as const;

/**
 * Rutas de picking/inventario
 */
export const PICKING_ENDPOINTS = {
  overrideLocation: "/picking/override-location",
} as const;

/**
 * Rutas móviles de picking - MobilePickingController
 * API específica para aplicación móvil de picking
 */
export const MOBILE_PICKING_ENDPOINTS = {
  getOrders: "/mobile/picking/orders",
  getSuggestions: (ordenId: number | string) =>
    `/mobile/picking/${ordenId}/sugerencias`,
  confirmPick: (ordenId: number | string) =>
    `/mobile/picking/${ordenId}/confirmar`,
} as const;

/**
 * Rutas del dashboard
 */
export const DASHBOARD_ENDPOINTS = {
  ordersByState: "/dashboard/orders-by-state",
  ordersByPriority: "/dashboard/orders-by-priority",
  inventoryByCategory: "/dashboard/inventory-by-category",
  warehouseOccupancy: "/dashboard/warehouse-occupancy",
  criticalStock: "/dashboard/critical-stock",
  metrics: "/dashboard/metrics",
} as const;

/**
 * Rutas de prueba (DEBUG)
 */
export const TEST_ENDPOINTS = {
  ping: "/test/dashboard/ping",
  simple: "/test/dashboard/simple",
  orders: "/test/dashboard/orders",
  debugError: "/test/dashboard/debug-error",
} as const;
