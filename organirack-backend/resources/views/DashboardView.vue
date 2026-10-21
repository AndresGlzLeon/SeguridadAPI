<template>
  <div class="dashboard-container">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      <!-- Gráfica 1: Estado de Órdenes -->
      <div class="card">
        <h3 class="card-title">Estado de Órdenes</h3>
        <div v-if="loading.ordersByState" class="text-center py-4">
          <div class="spinner"></div>
        </div>
        <canvas v-else id="ordersByStateChart"></canvas>
      </div>

      <!-- Gráfica 2: Órdenes por Prioridad -->
      <div class="card">
        <h3 class="card-title">Órdenes por Prioridad (30 días)</h3>
        <div v-if="loading.ordersByPriority" class="text-center py-4">
          <div class="spinner"></div>
        </div>
        <canvas v-else id="ordersByPriorityChart"></canvas>
      </div>

      <!-- Gráfica 3: Inventario por Categoría -->
      <div class="card">
        <h3 class="card-title">Inventario por Categoría</h3>
        <div v-if="loading.inventoryByCategory" class="text-center py-4">
          <div class="spinner"></div>
        </div>
        <canvas v-else id="inventoryByCategoryChart"></canvas>
      </div>
    </div>

    <!-- Gráfica 4: Ocupación de Almacenes -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="card">
        <h3 class="card-title">Ocupación de Almacenes</h3>
        <div v-if="loading.warehouseOccupancy" class="text-center py-4">
          <div class="spinner"></div>
        </div>
        <div v-else>
          <div class="mb-4">
            <p class="text-sm text-gray-600">Promedio de Ocupación: <span class="font-bold">{{ dashboardData.ocupacionAlmacenes.promedioOcupacion }}%</span></p>
          </div>
          <div class="space-y-3">
            <div v-for="almacen in dashboardData.ocupacionAlmacenes.almacenes" :key="almacen.name" class="flex items-center gap-2">
              <span class="text-sm w-32">{{ almacen.name }}</span>
              <div class="flex-1 bg-gray-200 rounded h-6">
                <div
                  class="bg-blue-500 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                  :style="{ width: almacen.porcentaje + '%' }"
                >
                  {{ almacen.porcentaje }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráfica 5: Productos Stock Crítico -->
      <div class="card">
        <h3 class="card-title">Productos con Stock Crítico ({{ dashboardData.productosStockCritico.total }})</h3>
        <div v-if="loading.criticalStock" class="text-center py-4">
          <div class="spinner"></div>
        </div>
        <div v-else class="overflow-y-auto max-h-96">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-gray-100">
              <tr>
                <th class="text-left p-2">SKU</th>
                <th class="text-left p-2">Producto</th>
                <th class="text-right p-2">Stock</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="producto in dashboardData.productosStockCritico.productos" :key="producto.id" class="border-t hover:bg-red-50">
                <td class="p-2 font-mono text-xs">{{ producto.sku }}</td>
                <td class="p-2">
                  <div class="text-xs font-semibold">{{ producto.nombre }}</div>
                  <div class="text-xs text-gray-500">{{ producto.categoria }}</div>
                </td>
                <td class="p-2 text-right">
                  <span class="inline-block px-2 py-1 rounded bg-red-100 text-red-800 font-bold">
                    {{ producto.stock_actual }} / {{ producto.stock_minimo }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { Chart } from 'chart.js/auto';

export default {
  name: 'DashboardView',
  setup() {
    const dashboardData = ref({
      estadoOrdenes: {},
      ordenesPorPrioridad: {},
      inventarioPorCategoria: {},
      ocupacionAlmacenes: {},
      productosStockCritico: {},
    });

    const loading = ref({
      ordersByState: true,
      ordersByPriority: true,
      inventoryByCategory: true,
      warehouseOccupancy: true,
      criticalStock: true,
    });

    const chartInstances = ref({});

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const token = localStorage.getItem('sanctum_token');

    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${baseURL}/dashboard/metrics`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Error fetching dashboard data');

        const data = await response.json();
        dashboardData.value = data;

        // Renderizar gráficas después de obtener datos
        setTimeout(() => {
          initializeCharts();
        }, 100);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        Object.keys(loading.value).forEach(key => {
          loading.value[key] = false;
        });
      }
    };

    const initializeCharts = () => {
      // Gráfica 1: Estado de Órdenes (Dona)
      const ctx1 = document.getElementById('ordersByStateChart');
      if (ctx1 && dashboardData.value.estadoOrdenes.labels) {
        if (chartInstances.value.ordersByState) {
          chartInstances.value.ordersByState.destroy();
        }
        chartInstances.value.ordersByState = new Chart(ctx1, {
          type: 'doughnut',
          data: {
            labels: dashboardData.value.estadoOrdenes.labels,
            datasets: [
              {
                label: 'Órdenes',
                data: dashboardData.value.estadoOrdenes.data,
                backgroundColor: dashboardData.value.estadoOrdenes.colors || [
                  '#FF6384',
                  '#36A2EB',
                  '#FFCE56',
                  '#4BC0C0',
                  '#9966FF',
                ],
                borderColor: '#fff',
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom',
              },
            },
          },
        });
      }

      // Gráfica 2: Órdenes por Prioridad (Barras)
      const ctx2 = document.getElementById('ordersByPriorityChart');
      if (ctx2 && dashboardData.value.ordenesPorPrioridad.labels) {
        if (chartInstances.value.ordersByPriority) {
          chartInstances.value.ordersByPriority.destroy();
        }
        chartInstances.value.ordersByPriority = new Chart(ctx2, {
          type: 'bar',
          data: {
            labels: dashboardData.value.ordenesPorPrioridad.labels,
            datasets: [
              {
                label: 'Cantidad',
                data: dashboardData.value.ordenesPorPrioridad.data,
                backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                borderColor: '#fff',
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'x',
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });
      }

      // Gráfica 3: Inventario por Categoría (Barras Horizontal)
      const ctx3 = document.getElementById('inventoryByCategoryChart');
      if (ctx3 && dashboardData.value.inventarioPorCategoria.labels) {
        if (chartInstances.value.inventoryByCategory) {
          chartInstances.value.inventoryByCategory.destroy();
        }
        chartInstances.value.inventoryByCategory = new Chart(ctx3, {
          type: 'bar',
          data: {
            labels: dashboardData.value.inventarioPorCategoria.labels,
            datasets: [
              {
                label: 'Unidades en Stock',
                data: dashboardData.value.inventarioPorCategoria.data,
                backgroundColor: '#3B82F6',
                borderColor: '#1E40AF',
                borderWidth: 1,
              },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              x: {
                beginAtZero: true,
              },
            },
          },
        });
      }
    };

    onMounted(() => {
      fetchDashboardData();
    });

    return {
      dashboardData,
      loading,
    };
  },
};
</script>

<style scoped>
.dashboard-container {
  padding: 1.5rem;
}

.card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
}

.spinner {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
