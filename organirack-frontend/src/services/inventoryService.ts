/**
 * services/inventoryService.ts
 * Servicio para operaciones transaccionales y físicas de inventario (CRUD).
 * NOTA: Los métodos de reporte, KPIs y Dashboard han sido migrados a inventoryDashboardService.ts.
 */

import axiosInstance from '../app/lib/axios';

export interface InventoryItem {
  id: number;
  producto_id: number;
  estante_id: number;
  estado_id: number;
  sku: string;
  producto_nombre: string;
  ubicacion: string;
  cantidad: number;
  estado_nombre: string;
  fisico?: number;
  sistema?: number;
  nodo?: string;
  producto?: string;
  created_at?: string;
  updated_at?: string;
}

class InventoryService {

  /**
   * Método compatible (mantiene funcionalidad del mapa del almacén y reportes heredados)
   * Obtiene el inventario completo desde el endpoint heredado.
   */
  async getInventory(): Promise<InventoryItem[]> {
    try {
      console.log('📦 Obteniendo inventario completo...');
      const response = await axiosInstance.get('/inventario/completo');
      const almacenes = response.data?.data || [];

      const inventoryItems: InventoryItem[] = [];
      let itemId = 1;

      // Recorrer la estructura completa
      for (const almacen of almacenes) {
        const pasillos = almacen.pasillos || [];

        for (const pasillo of pasillos) {
          const racks = pasillo.racks || [];

          for (const rack of racks) {
            const estantes = rack.estantes || [];

            for (const estante of estantes) {
              const inventarios = estante.inventarios || [];

              if (inventarios.length > 0) {
                inventarios.forEach((inv: any) => {
                  const product = inv.producto;
                  if (product) {
                    inventoryItems.push({
                      id: itemId++,
                      producto_id: product.id,
                      estante_id: estante.id,
                      estado_id: inv.estado_id || 1,
                      sku: product.sku,
                      producto_nombre: product.nombre,
                      producto: product.nombre, // Compatibilidad heredada
                      ubicacion: estante.codigo_etiqueta || `${pasillo.nombre}-${rack.nombre_rack}-${estante.nivel}`,
                      cantidad: inv.cantidad || 0,
                      fisico: inv.cantidad || 0, // Compatibilidad heredada
                      sistema: inv.cantidad || 0, // Compatibilidad heredada
                      estado_nombre: inv.estado?.nombre || 'Disponible',
                      nodo: almacen.nombre // Compatibilidad heredada
                    });
                  }
                });
              }
            }
          }
        }
      }

      console.log(`✅ Inventario cargado: ${inventoryItems.length} items`);
      return inventoryItems;
    } catch (error) {
      console.error('❌ Error al obtener inventario:', error);
      return [];
    }
  }

  /**
   * Sincronizar inventario (recarga datos del servidor)
   */
  async syncInventory(): Promise<boolean> {
    try {
      console.log('📡 Sincronizando inventario...');
      const response = await axiosInstance.get('/inventario/completo');
      
      if (response.status === 200) {
        console.log('✅ Sincronización completada');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error al sincronizar inventario:', error);
      return false;
    }
  }

  /**
   * Ajuste manual de stock mediante CRUD Estructural
   * POST /api/inventory/manual-adjust
   */
  async addManualStock(producto_id: number, estante_id: number, estado_id: number, cantidad: number): Promise<any> {
    try {
      console.log('🔄 Ajustando stock manualmente...', { producto_id, estante_id, estado_id, cantidad });
      const response = await axiosInstance.post('/inventory/manual-adjust', {
        producto_id,
        estante_id,
        estado_id,
        cantidad,
      });
      console.log('✅ Stock ajustado correctamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al ajustar stock:', error);
      throw error;
    }
  }
}

const inventoryService = new InventoryService();
export default inventoryService;
