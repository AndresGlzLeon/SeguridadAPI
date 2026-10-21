import React, { useState, useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';

const DashboardReact = ({ apiUrl = 'http://localhost:8000/api', token }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartInstances = useRef({});

  // Références para los canvas
  const canvasRefs = {
    ordersByState: useRef(null),
    ordersByPriority: useRef(null),
    inventoryByCategory: useRef(null),
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${apiUrl}/dashboard/metrics`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Error fetching dashboard data');

        const dashboardData = await response.json();
        setData(dashboardData);

        // Renderizar gráficas después
        setTimeout(() => {
          initializeCharts(dashboardData);
        }, 100);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup: destruir gráficas al desmontar
    return () => {
      Object.values(chartInstances.current).forEach(chart => {
        if (chart) chart.destroy();
      });
    };
  }, [apiUrl, token]);

  const initializeCharts = (dashboardData) => {
    // Gráfica 1: Estado de Órdenes (Dona)
    if (canvasRefs.ordersByState.current) {
      const ctx = canvasRefs.ordersByState.current.getContext('2d');
      if (chartInstances.current.ordersByState) {
        chartInstances.current.ordersByState.destroy();
      }
      chartInstances.current.ordersByState = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: dashboardData.estadoOrdenes.labels,
          datasets: [
            {
              label: 'Órdenes',
              data: dashboardData.estadoOrdenes.data,
              backgroundColor: dashboardData.estadoOrdenes.colors || [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
              ],
              borderColor: '#fff',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
          },
        },
      });
    }

    // Gráfica 2: Órdenes por Prioridad (Barras)
    if (canvasRefs.ordersByPriority.current) {
      const ctx = canvasRefs.ordersByPriority.current.getContext('2d');
      if (chartInstances.current.ordersByPriority) {
        chartInstances.current.ordersByPriority.destroy();
      }
      chartInstances.current.ordersByPriority = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dashboardData.ordenesPorPrioridad.labels,
          datasets: [
            {
              label: 'Cantidad',
              data: dashboardData.ordenesPorPrioridad.data,
              backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }

    // Gráfica 3: Inventario por Categoría (Barras Horizontal)
    if (canvasRefs.inventoryByCategory.current) {
      const ctx = canvasRefs.inventoryByCategory.current.getContext('2d');
      if (chartInstances.current.inventoryByCategory) {
        chartInstances.current.inventoryByCategory.destroy();
      }
      chartInstances.current.inventoryByCategory = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dashboardData.inventarioPorCategoria.labels,
          datasets: [
            {
              label: 'Unidades',
              data: dashboardData.inventarioPorCategoria.data,
              backgroundColor: '#3B82F6',
              borderColor: '#1E40AF',
              borderWidth: 1,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true } },
        },
      });
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Cargando dashboard...</div>;
  }

  if (!data) {
    return <div className="p-4 text-center text-red-600">Error cargando datos</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Dashboard OrganiRackPlus</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Gráfica 1 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Estado de Órdenes</h3>
          <canvas ref={canvasRefs.ordersByState}></canvas>
        </div>

        {/* Gráfica 2 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Órdenes por Prioridad (30 días)</h3>
          <canvas ref={canvasRefs.ordersByPriority}></canvas>
        </div>

        {/* Gráfica 3 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Inventario por Categoría</h3>
          <canvas ref={canvasRefs.inventoryByCategory}></canvas>
        </div>
      </div>

      {/* Ocupación de Almacenes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Ocupación de Almacenes</h3>
          <p className="text-sm text-gray-600 mb-4">
            Promedio: <span className="font-bold">{data.ocupacionAlmacenes.promedioOcupacion}%</span>
          </p>
          <div className="space-y-3">
            {data.ocupacionAlmacenes.almacenes.map((almacen, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-sm w-32">{almacen.name}</span>
                <div className="flex-1 bg-gray-200 rounded h-6 relative">
                  <div
                    className="bg-blue-500 h-6 rounded flex items-center justify-center text-white text-xs font-bold transition-all"
                    style={{ width: `${almacen.porcentaje}%` }}
                  >
                    {almacen.porcentaje}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Crítico */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Productos con Stock Crítico ({data.productosStockCritico.total})
          </h3>
          <div className="overflow-y-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">Producto</th>
                  <th className="text-right p-2">Stock</th>
                </tr>
              </thead>
              <tbody>
                {data.productosStockCritico.productos.map((producto, idx) => (
                  <tr key={idx} className="border-t hover:bg-red-50">
                    <td className="p-2 font-mono text-xs">{producto.sku}</td>
                    <td className="p-2">
                      <div className="text-xs font-semibold">{producto.nombre}</div>
                      <div className="text-xs text-gray-500">{producto.categoria}</div>
                    </td>
                    <td className="p-2 text-right">
                      <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 font-bold">
                        {producto.stock_actual} / {producto.stock_minimo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardReact;
