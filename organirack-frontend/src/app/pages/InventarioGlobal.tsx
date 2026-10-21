/**
 * PÁGINA: InventarioGlobal.tsx
 * Dashboard de inventario en tiempo real con gráficas y KPIs pre-calculados.
 */

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Loader2, Search, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { toast } from 'sonner';

import inventoryDashboardService, {
  InventoryTableItem,
  StateDistributionItem,
  TopShelfItem,
  CategoryDistributionItem,
  KpisResponse
} from '../../services/inventoryDashboardService';

export function InventarioGlobal() {

  // ============================================================
  // SECCIÓN 1: ESTADOS REACT
  // ============================================================
  
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Filtro de estado activo. Valores posibles:
   *   'todos' → sin filtro
   *   '1'     → Disponible
   *   '2'     → Dañado
   *   '3'     → En Cuarentena
   *   '4'     → Merma
   * Son strings porque el <Select> trabaja con strings.
   */
  const [filterEstado, setFilterEstado] = useState('todos');

  /**
   * Array completo de registros de inventario.
   * Origen: GET /api/dashboard/inventory/table
   * NOTA: Se carga TODO sin paginación desde el servidor.
   * El filtrado y la paginación se hacen en cliente (useMemo).
   */
  const [inventoryData, setInventoryData] = useState<InventoryTableItem[]>([]);

  /**
   * Datos agregados por estado para el PieChart.
   * Origen: GET /api/dashboard/inventory/distribution-by-state
   * El backend ya devuelve el GROUP BY + SUM + porcentaje calculado.
   * El array tendrá ~4 elementos (uno por estado de inventario).
   */
  const [distributionData, setDistributionData] = useState<StateDistributionItem[]>([]);

  /**
   * Top 5 estantes con más unidades en inventario para el BarChart.
   * Origen: GET /api/dashboard/inventory/top-shelves
   * El backend devuelve exactamente 5 filas (LIMIT 5 en SQL).
   */
  const [topShelvesData, setTopShelvesData] = useState<TopShelfItem[]>([]);

  /**
   * Distribución de inventario por categoría de producto para el BarChart.
   * Origen: GET /api/dashboard/inventory/distribution-by-category
   * El backend hace JOIN inventarios → productos → categorias + GROUP BY.
   */
  const [categoryData, setCategoryData] = useState<CategoryDistributionItem[]>([]);

  /**
   * KPIs procesados ultra rápidos desde el backend.
   * Reemplaza el antiguo modelo de cálculo manual en frontend.
   */
  const [kpis, setKpis] = useState<KpisResponse | null>(null);

  /** Controla el spinner de carga mientras llegan los datos */
  const [isLoading, setIsLoading] = useState(true);

  /** Página actual de la tabla (1-indexed) */
  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage] = useState(25);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);


  // ============================================================
  // SECCIÓN 2: EFECTOS (useEffect)
  // ============================================================

  /**
   * EFECTO PRINCIPAL: Carga inicial de datos
   * 
   * Se ejecuta una sola vez al montar el componente (dependencias: []).
   * 
   * Usa Promise.all para disparar las 4 peticiones HTTP en PARALELO,
   * reduciendo el tiempo total de carga al máximo de las 4 duraciones
   * en lugar de su suma.
   * 
   * Si cualquiera de las 4 promesas falla, el catch captura el error,
   * muestra un toast y deja todos los estados como arrays vacíos
   * (los gráficos simplemente no se renderizan con arrays vacíos).
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Lanzamos las 4 peticiones simultáneamente.
        // Cada una llama a un endpoint diferente del backend.
        // El backend ejecuta queries SQL optimizados con GROUP BY/JOIN.
        const [kpisData, tableData, distData, topShelvesData, catData] = await Promise.all([
          inventoryDashboardService.getKpis(),                    // Nuevos KPIs directamente desde la BD
          inventoryDashboardService.getInventoryTable(),             // Todos los registros (sin paginar)
          inventoryDashboardService.getInventoryDistributionByState(), // Agregado por estado
          inventoryDashboardService.getTopShelvesByQuantity(),         // Top 5 estantes
          inventoryDashboardService.getInventoryDistributionByCategory(), // Agregado por categoría
        ]);

        // Poblar cada estado con su respuesta correspondiente
        setKpis(kpisData);
        setInventoryData(tableData);
        setDistributionData(distData);
        setTopShelvesData(topShelvesData);
        setCategoryData(catData);

        // Siempre volver a página 1 cuando llegan datos frescos
        setCurrentPage(1);

        // Avisar si la BD no tiene datos (puede ser un ambiente recién instalado)
        if (tableData.length === 0) {
          toast.warning('No hay datos de inventario disponibles');
        }
      } catch (error) {
        console.error('❌ Error crítico al cargar datos de inventario:', error);
        toast.error('Error al cargar los datos. Por favor, recarga la página.');
        // Los estados permanecen como arrays vacíos → los charts no se renderizan
        // (cada chart tiene un guard: `{chartData.length > 0 && (<Card>...)}`)
      } finally {
        // Se ejecuta siempre (éxito o error) para quitar el spinner
        setIsLoading(false);
      }
    };

    loadData();
  }, []); // [] = solo al montar; no se re-ejecuta al cambiar filtros


  /** Resetear a página 1 al cambiar filtros */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado]);


  // ============================================================
  // SECCIÓN 3: FUNCIONES DE UTILIDAD (useCallback)
  // ============================================================
  
  /** 
   * Devuelve un <Badge> con color semántico según el nombre del estado.
   */
  const getEstadoBadge = useCallback((estadoNombre: string) => {
    const estadoLower = estadoNombre?.toLowerCase() || '';

    if (estadoLower.includes('disponible') || estadoLower.includes('ok')) {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-sm font-normal">
          {estadoNombre}
        </Badge>
      );
    } else if (estadoLower.includes('cuarentena')) {
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 shadow-sm font-normal">
          {estadoNombre}
        </Badge>
      );
    } else if (estadoLower.includes('dañado') || estadoLower.includes('critico')) {
      return (
        <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-sm font-normal">
          {estadoNombre}
        </Badge>
      );
    } else {
      // Fallback para cualquier estado no contemplado
      return <Badge variant="outline">{estadoNombre}</Badge>;
    }
  }, []);

  /** Navega a MapaAlmacen pasando el estante seleccionado por query string */
  const handleGoToMap = useCallback((estanteId: number, ubicacion: string) => {
    window.location.href = `/mapa?estante=${estanteId}&ubicacion=${encodeURIComponent(ubicacion)}`;
  }, []);

  /** Aplica debounce de 150ms a la búsqueda local */
  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 150);
  }, []);


  // ============================================================
  // SECCIÓN 4: COMPONENTE MEMOIZADO — FILA DE TABLA
  // ============================================================
  
  const InventoryTableRow = memo(({ item, index }: { item: InventoryTableItem; index: number }) => (
    <TableRow
      
      className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
    >
            <TableCell className="font-mono text-xs font-medium text-foreground">
        {item.sku}
      </TableCell>

            <TableCell className="font-medium text-foreground">
        {item.producto_nombre}
      </TableCell>

            <TableCell className="text-sm text-muted-foreground">
        {item.ubicacion}
      </TableCell>

            <TableCell className="text-center font-medium text-foreground">
        {item.cantidad}
      </TableCell>

            <TableCell>
        {getEstadoBadge(item.estado_nombre)}
      </TableCell>

            <TableCell className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleGoToMap(item.estante_id, item.ubicacion)}
          className="hover:bg-primary/20"
          title="Ir al mapa del almacén"
        >
          <ArrowRight className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  ));

  InventoryTableRow.displayName = 'InventoryTableRow';


  // ============================================================
  // SECCIÓN 5: DATOS DERIVADOS (useMemo)
  // ============================================================
  
  /** Filtro en memoria (Búsqueda global + Select de estados) */
  const filteredData = useMemo(() => {
    return inventoryData.filter((item) => {
      // Búsqueda case-insensitive en tres campos
      const matchSearch =
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.producto_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.ubicacion && item.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtro por estado_id (comparamos string con string)
      const matchEstado =
        filterEstado === 'todos' ||
        item.estado_id.toString() === filterEstado;

      return matchSearch && matchEstado;
    });
  }, [inventoryData, searchTerm, filterEstado]);

  /** Paginación local sobre la lista filtrada */
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  
  const totalPages = useMemo(() => {
    return Math.ceil(filteredData.length / itemsPerPage);
  }, [filteredData.length, itemsPerPage]);


  /** Catálogo estático de estados para filtro dropdown */
  const estadosUnicos = useMemo(() => {
    return [
      { id: 1, nombre: 'Disponible' },
      { id: 2, nombre: 'Dañado' },
      { id: 3, nombre: 'En Cuarentena' },
      { id: 4, nombre: 'Merma' }
    ];
  }, []);

  /** Colorea los datos del PieChart devueltos por el backend */
  const chartData = useMemo(() => {
    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];
    return distributionData.map((item, index) => ({
      ...item,
      color: colors[index % colors.length], // % para no salirse del array si hay más estados
    }));
  }, [distributionData]);

  /** Colorea los datos por categoría. */
  const categoryChartData = useMemo(() => {
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
    return categoryData.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length],
    }));
  }, [categoryData]);


  // ============================================================
  // SECCIÓN 6: RENDER CONDICIONAL — ESTADO DE CARGA
  // ============================================================
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="size-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando inventario...</p>
        </div>
      </div>
    );
  }


  // ============================================================
  // SECCIÓN 7: RENDER PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-6">

      
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
          Inventario Global
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Dashboard de inventario.
        </p>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* KPI 1: Cantidad Total */}
        <Card className="border border-primary/20 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Cantidad Total</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg className="size-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042L5.960 9H9a2 2 0 110 4H5.96l-.625 2.501a.997.997 0 00-.01.042L5 16H3a1 1 0 100 2h2.191A3 3 0 0010 16h4a2 2 0 100-4h-4a1 1 0 01-.82-1.569l1.07-1.616h5.694a2 2 0 110 4h-.351a3 3 0 01-2.866 2H13a1 1 0 100-2h-.134a1 1 0 00-.988.833l-.287 1.722A1 1 0 0010 18H5.464a3 3 0 00-2.986-2.3H2a1 1 0 100 2h.478a1 1 0 00.988-.833l.287-1.722A1 1 0 007 10H3a1 1 0 100 2h3.82l.625-2.501a.997.997 0 00.01-.042L9 4H3a1 1 0 000-2z" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{kpis ? kpis.unidades_totales : 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Unidades en stock</p>
          </CardContent>
        </Card>

        {/* KPI 2: Ubicaciones activas */}
        <Card className="border border-info/20 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Ubicaciones</CardTitle>
            <div className="p-2 bg-info/10 rounded-lg">
              <svg className="size-4 text-info" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a1 1 0 110 2h-2.343a3 3 0 01-2.828-1.98 3 3 0 00-5.658 0A3 3 0 012.343 18H2a1 1 0 110-2V4z" clipRule="evenodd" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-info">{kpis ? kpis.ubicaciones_activas : 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Estantes activos</p>
          </CardContent>
        </Card>

        {/* KPI 3: Tipos de productos únicos */}
        <Card className="border border-success/20 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Productos</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <svg className="size-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.293l1.146 1.147a1 1 0 101.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.707V16z" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{kpis ? kpis.productos_unicos : 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Tipos únicos</p>
          </CardContent>
        </Card>
      </div>


      {/* ── GRÁFICA 1: PIE CHART (Estados) ── */}
      {chartData.length > 0 && (
        <Card className="border-border/50 shadow-xl bg-card overflow-hidden">
          {/* Barra decorativa superior con gradiente */}
          <div className="h-1 bg-gradient-to-r from-success via-primary to-info" />
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              Distribución de Inventario por Estado
            </CardTitle>
            <CardDescription>
              Visualización de cantidad total de unidades clasificadas por estado
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col lg:flex-row gap-8">

            {/* Contenedor del Pie Chart (Recharts) */}
            <div className="flex-1">
              {/*
                ResponsiveContainer: adapta el chart al ancho del contenedor padre.
                height={300} fix para evitar que el chart colapse a 0px.
              */}
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}           // Array con { estado_nombre, cantidad_total, color }
                    cx="50%"                   // Centro horizontal
                    cy="50%"                   // Centro vertical
                    labelLine={false}          // Sin líneas hacia etiquetas externas
                    label={({ estado_nombre, porcentaje }) => `${estado_nombre}: ${porcentaje}%`}
                    outerRadius={100}
                    fill="#8884d8"             // Color fallback (sobreescrito por Cell)
                    dataKey="cantidad_total"   // Campo numérico que determina el tamaño del sector
                  >
                    {/*
                      Cada <Cell> aplica el color correspondiente a su sector.
                      El color viene de chartData[index].color (paleta del useMemo).
                    */}
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>

                  {/* Tooltip al hacer hover sobre un sector */}
                  <Tooltip
                    formatter={(value: number) => `${value} unidades`}
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />

                  {/* Leyenda automática (usa el campo `name` o el dataKey) */}
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Panel lateral: lista de estados con cantidad exacta */}
            <div className="space-y-3 lg:w-64">
              <h4 className="font-semibold text-foreground">Resumen</h4>
              {chartData.map((item) => (
                <div key={item.estado_id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {/* Punto de color que coincide con el sector del pie */}
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.estado_nombre}</span>
                  </div>
                  {/* Cantidad total de unidades en ese estado */}
                  <span className="font-semibold text-foreground">{item.cantidad_total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* ── GRÁFICA 2: BAR CHART (Top 5 Estantes) ── */}
      {topShelvesData.length > 0 && (
        <Card className="border-border/50 shadow-xl bg-card overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-info via-accent to-primary" />
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              Top 5 Estantes por Cantidad
            </CardTitle>
            <CardDescription>
              Los 5 estantes con mayor cantidad de unidades en inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={topShelvesData}  // Array de 5 items del backend
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

                {/* Eje X: código de etiqueta del estante (ej. "A1-R2-N3") */}
                <XAxis
                  dataKey="estante_codigo"
                  angle={-45}          // Texto inclinado para evitar solapamiento
                  textAnchor="end"
                  height={100}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />

                {/* Eje Y: cantidad de unidades */}
                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  label={{ value: 'Cantidad', angle: -90, position: 'insideLeft' }}
                />

                <Tooltip
                  formatter={(value: number) => [`${value} unidades`, 'Total']}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                  }}
                  labelStyle={{ color: 'var(--foreground)' }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />

                {/* Barra principal: altura = total_cantidad del estante */}
                <Bar
                  dataKey="total_cantidad"
                  fill="#3b82f6"          // Azul fijo para todas las barras
                  radius={[8, 8, 0, 0]}  // Bordes redondeados solo arriba
                  name="Cantidad Total"
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Mini-cards debajo del chart: detalle de cada estante del Top 5 */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
              {topShelvesData.map((shelf) => (
                <div key={shelf.estante_id} className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="text-center">
                    {/* Código de etiqueta (coincide con el eje X del chart) */}
                    <p className="text-sm font-semibold text-foreground">{shelf.estante_codigo}</p>
                    {/* Nivel del estante dentro del rack (ej. A, B, C) */}
                    <p className="text-xs text-muted-foreground">Nivel: {shelf.estante_nivel}</p>
                    {/* Cifra principal: total de unidades */}
                    <div className="mt-2 flex items-baseline justify-center gap-1">
                      <span className="text-lg font-bold text-primary">{shelf.total_cantidad}</span>
                      <span className="text-xs text-muted-foreground">unidades</span>
                    </div>
                    {/* Diversidad: cuántos productos distintos tiene este estante */}
                    <p className="text-xs text-muted-foreground mt-1">
                      {shelf.cantidad_productos} producto{shelf.cantidad_productos > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* ── GRÁFICA 3: BAR CHART (Categorías) ── */}
      {categoryChartData.length > 0 && (
        <Card className="border-border/50 shadow-xl bg-card overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-accent via-primary to-info" />
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              Inventario por Categorías
            </CardTitle>
            <CardDescription>
              Distribución de unidades físicas clasificadas por categoría de producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={categoryChartData}  // Datos del backend + campo `fill` agregado en cliente
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                {/* Solo líneas horizontales (vertical={false}) para estética más limpia */}
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

                {/* Eje X: nombre de la categoría */}
                <XAxis
                  dataKey="categoria_nombre"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />

                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  label={{ value: 'Unidades', angle: -90, position: 'insideLeft', fill: 'var(--muted-foreground)' }}
                />

                {/* Tooltip con valor + porcentaje del total (porcentaje viene del backend) */}
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [`${value} unidades (${props.payload.porcentaje}%)`, 'Total']}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold', marginBottom: '4px' }}
                  cursor={{ fill: 'var(--muted)' }}
                />

                {/*
                  Bar sin fill fijo → cada Cell aplica su propio color.
                  Esto permite que cada categoría tenga un color distinto,
                  a diferencia del Top 5 que usa un color uniforme.
                */}
                <Bar
                  dataKey="cantidad_total"
                  radius={[6, 6, 0, 0]}
                  name="Cantidad Total"
                >
                  {categoryChartData.map((entry, index) => (
                    // entry.fill viene del useMemo `categoryChartData` (paleta de 7 colores)
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}


      {/* ── TABLA DE EXISTENCIAS ── */}
      <Card className="border-border/50 shadow-xl bg-card overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-accent to-success" />
        <CardHeader className="bg-gradient-to-br from-muted/30 to-transparent border-b border-border">
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Control de Existencias</CardTitle>
              <CardDescription>
                Datos de inventario detallados.
              </CardDescription>
            </div>

            
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar SKU, producto, ubicación..."
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        {/* ── BARRA DE FILTROS ── */}
        {/* Solo se muestra si hay datos cargados */}
        {inventoryData.length > 0 && (
          <div className="flex gap-3 flex-wrap px-4 py-3 border-b border-border bg-card/50">

            
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[180px] h-8 text-xs border-dashed">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {estadosUnicos.map((estado) => (
                  <SelectItem key={estado.id} value={estado.id.toString()}>
                    {estado.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            
            <div className="text-xs text-muted-foreground">
              {filteredData.length > 0
                ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredData.length)} de ${filteredData.length} registros`
                : `0 de ${inventoryData.length} registros`
              }
            </div>
          </div>
        )}

        <CardContent className="p-0 overflow-hidden">

          
          {inventoryData.length === 0 && (
            <div className="flex items-center justify-center gap-3 p-12 bg-destructive/5">
              <svg className="size-6 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-center">
                <p className="font-semibold text-destructive">No hay datos de inventario</p>
                <p className="text-xs text-muted-foreground">Verifica que el backend esté disponible</p>
              </div>
            </div>
          )}

          
          
          {inventoryData.length > 0 && filteredData.length === 0 && (
            <div className="flex items-center justify-center gap-3 p-12 bg-muted/30">
              <div className="text-center">
                <p className="font-semibold text-foreground">No se encontraron registros</p>
                <p className="text-xs text-muted-foreground">Intenta cambiar los filtros o términos de búsqueda</p>
              </div>
            </div>
          )}

          
          {filteredData.length > 0 && (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-b border-border">
                      <TableHead className="font-semibold text-foreground w-[100px]">SKU</TableHead>
                      <TableHead className="font-semibold text-foreground">Producto</TableHead>
                      <TableHead className="font-semibold text-foreground">Ubicación</TableHead>
                      <TableHead className="text-center font-semibold text-foreground">Cantidad</TableHead>
                      <TableHead className="font-semibold text-foreground">Estado</TableHead>
                      <TableHead className="text-center font-semibold text-foreground w-12">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    
                    {paginatedData.map((item, index) => (
                      <InventoryTableRow
                        key={`${item.id}-${index}`}
                        item={item}
                        index={index}  // Para el zebra striping (filas alternas)
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ── PAGINACIÓN EN CLIENTE ── */}
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 pb-4">
                  <div className="text-xs text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Botón "Anterior" — deshabilitado en la primera página */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>

                    {/* Botones numéricos de página con lógica de ventana deslizante */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        
                        const distance = Math.abs(page - currentPage);
                        if (distance <= 1 || (totalPages <= 5)) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="h-8 w-8 p-0"
                            >
                              {page}
                            </Button>
                          );
                        } else if (distance === 2) {
                          // Ellipsis para páginas intermedias omitidas
                          return (
                            <span key={`dots-${page}`} className="text-xs text-muted-foreground">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    {/* Botón "Siguiente" — deshabilitado en la última página */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
