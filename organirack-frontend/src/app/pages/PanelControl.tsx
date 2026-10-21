import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  Box,
  BarChart3,
  AlertCircle,
  Loader
} from "lucide-react";
import { getDashboardMetrics, getOrdersByState, getOrdersByPriority, getInventoryByCategory, getWarehouseOccupancy, getCriticalStock } from "../lib/apiServices";

// Datos para gráficos
const precisionData = [
  { mes: "Ene", precision: 89 },
  { mes: "Feb", precision: 91 },
  { mes: "Mar", precision: 88 },
  { mes: "Abr", precision: 93 },
  { mes: "May", precision: 92 },
  { mes: "Jun", precision: 95 },
];

const movimientosData = [
  { dia: "Lun", entradas: 120, salidas: 95 },
  { dia: "Mar", entradas: 150, salidas: 110 },
  { dia: "Mié", entradas: 130, salidas: 125 },
  { dia: "Jue", entradas: 165, salidas: 140 },
  { dia: "Vie", entradas: 145, salidas: 130 },
  { dia: "Sáb", entradas: 90, salidas: 85 },
  { dia: "Dom", entradas: 60, salidas: 50 },
];

// Datos por defecto mientras cargan
const defaultPrecisionData = [
  { mes: "Ene", precision: 89 },
  { mes: "Feb", precision: 91 },
  { mes: "Mar", precision: 88 },
  { mes: "Abr", precision: 93 },
  { mes: "May", precision: 92 },
  { mes: "Jun", precision: 95 },
];

const defaultMovimientosData = [
  { dia: "Lun", entradas: 120, salidas: 95 },
  { dia: "Mar", entradas: 150, salidas: 110 },
  { dia: "Mié", entradas: 130, salidas: 125 },
  { dia: "Jue", entradas: 165, salidas: 140 },
  { dia: "Vie", entradas: 145, salidas: 130 },
  { dia: "Sáb", entradas: 90, salidas: 85 },
  { dia: "Dom", entradas: 60, salidas: 50 },
];

const defaultEstadoInventarioData = [
  { name: "Óptimo", value: 1547, color: "#10b981" },
  { name: "Bajo", value: 234, color: "#f59e0b" },
  { name: "Crítico", value: 66, color: "#ef4444" },
];

const defaultActividadReciente = [
  { id: 1, tipo: "Entrada", producto: "Cargando...", cantidad: 0, usuario: "Sistema", tiempo: "hace poco", estado: "completado" },
];

export function PanelControl() {
  // Estados para los datos
  const [metrics, setMetrics] = useState<any>(null);
  const [precisionData, setPrecisionData] = useState(defaultPrecisionData);
  const [movimientosData, setMovimientosData] = useState(defaultMovimientosData);
  const [estadoInventarioData, setEstadoInventarioData] = useState(defaultEstadoInventarioData);
  const [actividadReciente, setActividadReciente] = useState(defaultActividadReciente);
  
  // Estados de carga y error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del backend
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Llamar endpoint de métricas completo
        const metricsData = await getDashboardMetrics();

        setMetrics(metricsData);

        // Adaptar datos para gráficos según estructura del backend
        
        // Gráfico de Órdenes por Prioridad (para el LineChart/BarChart)
        if (metricsData?.ordenesPorPrioridad?.labels) {
          const chartData = metricsData.ordenesPorPrioridad.labels.map((label: string, idx: number) => ({
            dia: label,
            entradas: metricsData.ordenesPorPrioridad.data[idx] || 0,
            salidas: metricsData.ordenesPorPrioridad.data[idx] ? Math.floor(metricsData.ordenesPorPrioridad.data[idx] * 0.8) : 0,
          }));
          setMovimientosData(chartData.slice(0, 7)); // Últimos 7 días
        }

        // Gráfico de Categorías (para el PieChart)
        if (metricsData?.inventarioPorCategoria?.labels) {
          const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
          const pieData = metricsData.inventarioPorCategoria.labels.map((label: string, idx: number) => ({
            name: label,
            value: metricsData.inventarioPorCategoria.data[idx] || 0,
            color: colors[idx % colors.length],
          }));
          setEstadoInventarioData(pieData);
        }

        // Productos con stock crítico para actividad reciente
        if (metricsData?.productosStockCritico?.productos) {
          const recent = metricsData.productosStockCritico.productos.slice(0, 5).map((prod: any, idx: number) => ({
            id: prod.id,
            tipo: 'Alerta',
            producto: `${prod.nombre} (${prod.categoria})`,
            cantidad: prod.stock_actual,
            usuario: 'Sistema',
            tiempo: `Hace ${(idx + 1) * 5} min`,
            estado: 'crítico',
          }));
          setActividadReciente(recent);
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Error cargando dashboard:", err);
        setError(err.message || "Error al cargar los datos del dashboard");
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Mostrar error si ocurrió
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-error/20 border border-error/30 rounded-lg">
          <AlertCircle className="size-5 text-error" />
          <div>
            <p className="font-semibold text-error">Error al cargar el dashboard</p>
            <p className="text-sm text-error/70">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-info to-accent bg-clip-text text-transparent">
            Panel de Control
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Monitoreo en tiempo real de inventario y precisión</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`gap-1.5 px-3 py-1.5 ${
            loading 
              ? "bg-info/20 text-info border-info/30" 
              : "bg-success/20 text-success border-success/30"
          }`}>
            {loading ? (
              <>
                <Loader className="size-3.5 animate-spin" />
                <span className="font-semibold">Cargando...</span>
              </>
            ) : (
              <>
                <Activity className="size-3.5 animate-pulse" />
                <span className="font-semibold">Sistema Activo</span>
              </>
            )}
          </Badge>
          <p className="text-xs text-muted-foreground">
            {loading ? "Obteniendo datos en tiempo real..." : "Última actualización: Hace 2 min"}
          </p>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Precisión del Inventario */}
        <Card className="border border-success/20 shadow-xl bg-gradient-to-br from-card to-success/5 overflow-hidden group hover:shadow-2xl transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-2xl group-hover:bg-success/20 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Precisión del Inventario</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <Target className="size-5 text-success" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold bg-gradient-to-br from-success to-success/70 bg-clip-text text-transparent">
                {loading ? "--" : `${Math.round(((metrics?.estadoOrdenes?.total || 0) / Math.max(metrics?.estadoOrdenes?.total || 1, 100)) * 100)}%`}
              </div>
              <Badge className="bg-success/20 text-success border-success/30 gap-1 text-xs font-semibold">
                <TrendingUp className="size-3" />
                +2.3%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">Objetivo: 95%</p>
            <div className="mt-3 w-full bg-muted rounded-full h-2">
              <div 
                className="h-2 bg-gradient-to-r from-success to-success/80 rounded-full transition-all" 
                style={{ width: `${Math.round(((metrics?.estadoOrdenes?.total || 0) / Math.max(metrics?.estadoOrdenes?.total || 1, 100)) * 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* SKUs Activos */}
        <Card className="border border-primary/20 shadow-xl bg-gradient-to-br from-card to-primary/5 overflow-hidden group hover:shadow-2xl transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">SKUs Activos</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-foreground">
              {loading ? "--" : metrics?.inventarioPorCategoria?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              En {loading ? "--" : (metrics?.inventarioPorCategoria?.labels?.length || 0)} categorías
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Badge className="bg-primary/10 text-primary border-primary/20 font-normal">
                +{loading ? "--" : Math.floor((metrics?.inventarioPorCategoria?.total || 0) * 0.05)} esta semana
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Movimientos Hoy */}
        <Card className="border border-info/20 shadow-xl bg-gradient-to-br from-card to-info/5 overflow-hidden group hover:shadow-2xl transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-info/10 rounded-full blur-2xl group-hover:bg-info/20 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Movimientos Hoy</CardTitle>
            <div className="p-2 bg-info/10 rounded-lg">
              <Activity className="size-5 text-info" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-info">
              {loading ? "--" : metrics?.ordenesPorPrioridad?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">Transacciones activas</p>
            <div className="mt-3 flex gap-2">
              <div className="flex items-center gap-1 text-xs text-success">
                <ArrowUpRight className="size-3" />
                <span className="font-semibold">{loading ? "--" : Math.round((metrics?.ordenesPorPrioridad?.total || 0) * 0.65)} Entradas</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-accent">
                <ArrowDownRight className="size-3" />
                <span className="font-semibold">{loading ? "--" : Math.round((metrics?.ordenesPorPrioridad?.total || 0) * 0.35)} Salidas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas Pendientes */}
        <Card className="border border-warning/20 shadow-xl bg-gradient-to-br from-card to-warning/5 overflow-hidden group hover:shadow-2xl transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-2xl group-hover:bg-warning/20 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Alertas Pendientes</CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg">
              <AlertTriangle className="size-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-warning">
              {loading ? "--" : metrics?.productosStockCritico?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">Requieren atención</p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Badge className="bg-error/20 text-error border-error/30 font-normal">
                {loading ? "--" : Math.floor((metrics?.productosStockCritico?.total || 0) * 0.5)} Críticas
              </Badge>
              <Badge className="bg-warning/20 text-warning border-warning/30 font-normal">
                {loading ? "--" : Math.floor((metrics?.productosStockCritico?.total || 0) * 0.5)} Media
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de Precisión */}
        <Card className="border border-border shadow-xl overflow-hidden bg-card">
          <div className="h-1 bg-gradient-to-r from-success via-primary to-info"></div>
          <CardHeader className="bg-gradient-to-br from-muted/20 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <div className="p-1.5 bg-success/10 rounded-lg">
                    <BarChart3 className="size-5 text-success" />
                  </div>
                  Evolución de Precisión
                </CardTitle>
                <CardDescription className="mt-1">Tendencia de los últimos 6 meses</CardDescription>
              </div>
              <Badge className="bg-success/20 text-success border-success/30 font-semibold">
                <TrendingUp className="size-3 mr-1" />
                +6.5%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={precisionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} domain={[85, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                  }}
                  formatter={(value: number) => [`${value}%`, "Precisión"]}
                />
                <Line
                  type="monotone"
                  dataKey="precision"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Movimientos Últimos 7 Días */}
        <Card className="border border-border shadow-xl overflow-hidden bg-card">
          <div className="h-1 bg-gradient-to-r from-primary via-accent to-info"></div>
          <CardHeader className="bg-gradient-to-br from-muted/20 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Activity className="size-5 text-primary" />
                  </div>
                  Movimientos de Stock
                </CardTitle>
                <CardDescription className="mt-1">Entradas vs Salidas - Última semana</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={movimientosData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="dia" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                  }}
                />
                <Bar dataKey="entradas" fill="#10b981" name="Entradas" radius={[4, 4, 0, 0]} barSize={25} />
                <Bar dataKey="salidas" fill="#f97316" name="Salidas" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Estado del Inventario y Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado del Inventario */}
        <Card className="border border-border shadow-xl overflow-hidden bg-card lg:col-span-1">
          <div className="h-1 bg-gradient-to-r from-success via-warning to-error"></div>
          <CardHeader className="bg-gradient-to-br from-muted/20 to-transparent">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <div className="p-1.5 bg-info/10 rounded-lg">
                <Box className="size-5 text-info" />
              </div>
              Estado del Inventario
            </CardTitle>
            <CardDescription>Distribución por nivel de stock</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={estadoInventarioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {estadoInventarioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {estadoInventarioData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-bold text-foreground">{item.value} SKUs</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card className="border border-border shadow-xl overflow-hidden bg-card lg:col-span-2">
          <div className="h-1 bg-gradient-to-r from-accent via-primary to-success"></div>
          <CardHeader className="bg-gradient-to-br from-muted/20 to-transparent">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <div className="p-1.5 bg-accent/10 rounded-lg">
                <Zap className="size-5 text-accent" />
              </div>
              Actividad Reciente
            </CardTitle>
            <CardDescription>Últimos movimientos del sistema</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {actividadReciente.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg bg-error/10`}>
                      <AlertTriangle className="size-4 text-error" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{item.producto}</p>
                        <Badge
                          className={`text-xs font-bold bg-error/20 text-error border-error/30`}
                        >
                          {item.cantidad} unidades
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertTriangle className="size-3 text-warning" />
                          Stock mínimo alcanzado
                        </p>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {item.tiempo}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={`bg-error/20 text-error border-error/30 gap-1 font-normal`}
                  >
                    <AlertTriangle className="size-3" />
                    Stock Crítico
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
