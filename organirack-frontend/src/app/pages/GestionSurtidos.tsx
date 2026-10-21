import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { 
  PackageSearch, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Truck,
  User,
  Calendar,
  FileText,
  Play,
  CheckCheck,
  ShoppingCart,
  X,
  Trash2,
  Loader2,
  AlertCircle,
  FileDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { 
  OrdenSurtido, 
  Producto, 
  EstadoOrden, 
  PrioridadOrden,
  DetalleCarrito,
  CreateOrderPayload,
  DetalleSurtido
} from "../../tipos/ordenes";
import orderService from "../../services/orderService";
import productService from "../../services/productService";

// ============================================================================
// BADGE COMPONENTS
// ============================================================================

interface EstadoBadgeProps {
  estado: EstadoOrden;
}

function EstadoBadge({ estado }: EstadoBadgeProps) {
  const getIcon = () => {
    const nombre = estado.nombre.toLowerCase();
    if (nombre.includes("pendiente")) return <Clock className="size-3" />;
    if (nombre.includes("proceso")) return <Play className="size-3" />;
    if (nombre.includes("completa")) return <CheckCircle2 className="size-3" />;
    if (nombre.includes("cancelada")) return <XCircle className="size-3" />;
    return <FileText className="size-3" />;
  };

  const bgColor = `${estado.color_hex}20`;
  const textColor = estado.color_hex;
  const borderColor = `${estado.color_hex}30`;

  return (
    <Badge 
      className="gap-1.5 shadow-sm font-normal"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderColor: borderColor,
      }}
    >
      {getIcon()}
      {estado.nombre}
    </Badge>
  );
}

interface PrioridadBadgeProps {
  prioridad: PrioridadOrden;
}

function PrioridadBadge({ prioridad }: PrioridadBadgeProps) {
  const getColorClass = () => {
    const nivel = prioridad.nivel_ordenamiento;
    if (nivel <= 2) return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    if (nivel <= 5) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  return (
    <Badge className={`${getColorClass()} font-normal`}>
      {prioridad.nombre}
    </Badge>
  );
}

// ============================================================================
// CREAR ORDEN PANEL (SLIDE-OVER WITH SHOPPING CART PATTERN)
// ============================================================================

interface CrearOrdenPanelProps {
  isOpen: boolean;
  onClose: () => void;
  productos: Producto[];
  prioridades: PrioridadOrden[];
  onOrderCreated: () => void;
}

function CrearOrdenPanel({
  isOpen,
  onClose,
  productos,
  prioridades,
  onOrderCreated,
}: CrearOrdenPanelProps) {
  const [selectedProducto, setSelectedProducto] = useState<string>("");
  const [cantidad, setCantidad] = useState<number>(1);
  const [carrito, setCarrito] = useState<DetalleCarrito[]>([]);
  const [prioridadId, setPrioridadId] = useState<string>("");
  const [referencia, setReferencia] = useState<string>("");
  const [fechaRequerida, setFechaRequerida] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  const handleAddToCart = () => {
    if (!selectedProducto || cantidad <= 0) {
      toast.error("Selecciona producto y cantidad");
      return;
    }

    const producto = productos.find(p => p.id.toString() === selectedProducto);
    if (!producto) return;

    const existingItem = carrito.find(item => item.producto_id === producto.id);
    if (existingItem) {
      setCarrito(
        carrito.map(item =>
          item.producto_id === producto.id
            ? { ...item, cantidad_requerida: item.cantidad_requerida + cantidad }
            : item
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          tempId: `temp-${Date.now()}-${Math.random()}`,
          producto_id: producto.id,
          producto: producto,
          cantidad_requerida: cantidad,
        },
      ]);
    }

    setCantidad(1);
    setSelectedProducto("");
    toast.success("Producto añadido al carrito");
  };

  const handleRemoveFromCart = (tempId: string) => {
    setCarrito(carrito.filter(item => item.tempId !== tempId));
  };

  const handleCreateOrder = async () => {
    if (!prioridadId || carrito.length === 0 || !fechaRequerida) {
      toast.error("Completa todos los campos requeridos");
      return;
    }

    setIsCreating(true);
    try {
      // Convertir fecha de datetime-local (YYYY-MM-DDTHH:mm) a formato backend (YYYY-MM-DD HH:mm)
      const fechaFormato = fechaRequerida.replace('T', ' ');

      // Construir payload con detalles correctos
      const payload: CreateOrderPayload = {
        prioridad_id: parseInt(prioridadId),
        referencia_destino: referencia || undefined,
        fecha_requerida: fechaFormato,
        detalles: carrito.map(item => ({
          producto_id: item.producto_id,
          cantidad_requerida: item.cantidad_requerida,
          // estante_sugerido_id es opcional, se usa default en backend
        })),
      };

      console.log('📤 Enviando orden al backend:', JSON.stringify(payload, null, 2));

      const resultado = await orderService.crearOrden(payload);
      
      console.log('✅ Orden creada exitosamente:', resultado);
      toast.success(`Orden ${resultado.data.folio} creada exitosamente`);
      
      // Reset form
      setCarrito([]);
      setReferencia("");
      setFechaRequerida("");
      setPrioridadId("");
      setSelectedProducto("");
      setCantidad(1);
      onClose();
      onOrderCreated();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Error desconocido";
      console.error('❌ Error al crear orden:', {
        status: error.response?.status,
        message: error.message,
        error: errorMessage,
        data: error.response?.data
      });
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  const totalUnidades = carrito.reduce((sum, item) => sum + item.cantidad_requerida, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-over Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-96 bg-card border-l border-border shadow-2xl z-50 transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="size-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Nueva Salida de Inventario</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Section 1: Data Entry */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                1
              </span>
              Información General
            </h3>

            <div className="space-y-2">
              <Label htmlFor="prioridad" className="text-sm">
                Prioridad *
              </Label>
              <Select value={prioridadId} onValueChange={setPrioridadId}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Selecciona prioridad" />
                </SelectTrigger>
                <SelectContent>
                  {prioridades.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencia" className="text-sm">
                Referencia
              </Label>
              <Input
                id="referencia"
                placeholder="Referencia o código de orden"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha" className="text-sm">
                Fecha Requerida *
              </Label>
              <Input
                id="fecha"
                type="datetime-local"
                value={fechaRequerida}
                onChange={(e) => setFechaRequerida(e.target.value)}
                className="border-border"
              />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Section 2: Product Selector */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                2
              </span>
              Seleccionar Productos
            </h3>

            <div className="space-y-2">
              <Label htmlFor="producto" className="text-sm">
                Producto
              </Label>
              <Select value={selectedProducto} onValueChange={setSelectedProducto}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Busca y selecciona producto" />
                </SelectTrigger>
                <SelectContent>
                  {productos.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.nombre} (SKU: {p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="cantidad" className="text-sm">
                  Cantidad
                </Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                  className="border-border"
                />
              </div>
              <Button
                onClick={handleAddToCart}
                className="self-end bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="size-4 mr-1" />
                Añadir
              </Button>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Section 3: Shopping Cart */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                3
              </span>
              Carrito ({carrito.length}
              {carrito.length !== 1 ? " artículos" : " artículo"})
            </h3>

            {carrito.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">El carrito está vacío</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {carrito.map(item => (
                    <div
                      key={item.tempId}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded border border-border text-sm"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.producto?.nombre}</p>
                        <p className="text-xs text-muted-foreground">SKU: {item.producto?.sku}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">{item.cantidad_requerida}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromCart(item.tempId)}
                          className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-muted/50 p-3 rounded border border-border">
                  <p className="text-sm text-muted-foreground">Total de unidades:</p>
                  <p className="text-2xl font-bold text-foreground">{totalUnidades}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border p-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-border"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateOrder}
            disabled={isCreating || carrito.length === 0}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isCreating && <Loader2 className="size-4 mr-2 animate-spin" />}
            {isCreating ? "Creando..." : "Crear Orden"}
          </Button>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GestionSurtidos() {
  const [ordenes, setOrdenes] = useState<OrdenSurtido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [prioridades, setPrioridades] = useState<PrioridadOrden[]>([]);
  const [estados, setEstados] = useState<EstadoOrden[]>([]);
  const [almacenistas, setAlmacenistas] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstadoId, setFilterEstadoId] = useState<string>("all");
  const [filterPrioridadId, setFilterPrioridadId] = useState<string>("all");
  const [panelCrearOpen, setPanelCrearOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenSurtido | null>(null);
  
  // Modal de asignación
  const [asignarOpen, setAsignarOpen] = useState(false);
  const [ordenAAsignar, setOrdenAAsignar] = useState<OrdenSurtido | null>(null);
  const [almacenistaSeleccionado, setAlmacenistaSeleccionado] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Download PDF
  const [pdfDownloadingId, setPdfDownloadingId] = useState<number | null>(null);

  // Load data on mount
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [ordenesRes, productosRes, almacenistasRes] = await Promise.all([
        orderService.getOrdenes({ per_page: 50 }),
        productService.getProducts({ per_page: 500 }),
        orderService.getAlmacenistas(),
      ]);

      setOrdenes(ordenesRes.data || []);
      setProductos(productosRes.data || []);
      setAlmacenistas(almacenistasRes.data || []);

      // Extract ALL unique estados and prioridades from all órdenes
      if (ordenesRes.data && ordenesRes.data.length > 0) {
        // Extraer estados únicos
        const estadosMap = new Map<number, EstadoOrden>();
        ordenesRes.data.forEach((orden: OrdenSurtido) => {
          if (orden.estado && !estadosMap.has(orden.estado.id)) {
            estadosMap.set(orden.estado.id, orden.estado);
          }
        });
        setEstados(Array.from(estadosMap.values()));

        // Extraer prioridades únicas
        const prioridadesMap = new Map<number, PrioridadOrden>();
        ordenesRes.data.forEach((orden: OrdenSurtido) => {
          if (orden.prioridad && !prioridadesMap.has(orden.prioridad.id)) {
            prioridadesMap.set(orden.prioridad.id, orden.prioridad);
          }
        });
        setPrioridades(Array.from(prioridadesMap.values()));
      }
    } catch (error) {
      toast.error("Error al cargar datos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalOrdenes = ordenes.length;
  const pendientes = ordenes.filter(o => o.estado?.nombre.toLowerCase().includes("pendiente")).length;
  const enProceso = ordenes.filter(o => o.estado?.nombre.toLowerCase().includes("proceso")).length;
  const completadas = ordenes.filter(o => o.estado?.nombre.toLowerCase().includes("completa")).length;

  // Filter ordenes
  const filteredOrdenes = ordenes.filter(orden => {
    const matchSearch =
      orden.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (orden.referencia_destino?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchEstado = filterEstadoId === "all" || !filterEstadoId || orden.estado?.id.toString() === filterEstadoId;
    const matchPrioridad = filterPrioridadId === "all" || !filterPrioridadId || orden.prioridad?.id.toString() === filterPrioridadId;

    return matchSearch && matchEstado && matchPrioridad;
  });

  // Chart data
  const estadoData = estados.map(est => ({
    name: est.nombre,
    value: ordenes.filter(o => o.estado?.id === est.id).length,
  }));

  const prioridadData = prioridades.map(pri => ({
    name: pri.nombre,
    value: ordenes.filter(o => o.prioridad?.id === pri.id).length,
  }));

  const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

  // Assignment handler
  const handleAsignarAlmacenista = async () => {
    if (!ordenAAsignar || !almacenistaSeleccionado) return;

    try {
      setIsAssigning(true);
      const response = await orderService.asignarAlmacenista(
        ordenAAsignar.id,
        parseInt(almacenistaSeleccionado)
      );

      if (response.data) {
        toast.success(`Almacenista asignado exitosamente a ${ordenAAsignar.folio}`);
        setAsignarOpen(false);
        setAlmacenistaSeleccionado("");
        setOrdenAAsignar(null);

        // Reload orders to show updated state
        await cargarDatos();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "Error desconocido";
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setIsAssigning(false);
    }
  };

  // PDF Download handler
  const handleDescargarPdf = async (ordenId: number, folio: string) => {
    try {
      setPdfDownloadingId(ordenId);
      console.log('📄 Iniciando descarga de PDF para orden:', folio);
      
      const pdfBlob = await orderService.downloadPdf(ordenId);
      
      // Crear URL a partir del Blob
      const url = window.URL.createObjectURL(pdfBlob);
      
      // Crear link temporal para descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `Remision_${folio}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Descargar
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`PDF de ${folio} descargado exitosamente`);
      console.log('✅ PDF descargado:', link.download);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "Error al descargar PDF";
      console.error('❌ Error al descargar PDF:', errorMsg);
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setPdfDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-info bg-clip-text text-transparent">
            Salidas de Inventario
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Gestión y asignación de órdenes de surtido (Outbound)</p>
        </div>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-40 group-hover:opacity-70 transition duration-300" />
          <Button
            onClick={() => setPanelCrearOpen(true)}
            className="relative bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-xl"
          >
            <Plus className="size-4 mr-2" />
            Nueva Salida (Surtido)
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Órdenes</CardTitle>
            <PackageSearch className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalOrdenes}</div>
            <p className="text-xs text-muted-foreground mt-1">Órdenes registradas</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">{pendientes}</div>
            <p className="text-xs text-muted-foreground mt-1">Por procesar</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">{completadas}</div>
            <p className="text-xs text-muted-foreground mt-1">Finalizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border shadow-md bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Distribución por Estado</CardTitle>
            <CardDescription>Estado actual de las órdenes</CardDescription>
          </CardHeader>
          <CardContent>
            {estadoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={estadoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estadoData.map((entry, index) => (
                      <Cell key={`cell-estado-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--card)", borderRadius: "8px", border: "1px solid var(--border)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Sin datos</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-md bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Distribución por Prioridad</CardTitle>
            <CardDescription>Prioridades asignadas</CardDescription>
          </CardHeader>
          <CardContent>
            {prioridadData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={prioridadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{ backgroundColor: "var(--card)", borderRadius: "8px", border: "1px solid var(--border)" }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" name="Órdenes" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Sin datos</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Órdenes */}
      <Card className="border-border shadow-md overflow-hidden bg-card">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-lg text-foreground">Listado de Órdenes</CardTitle>
          <CardDescription>Gestión y seguimiento de órdenes de surtido</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filtros */}
          <div className="p-4 border-b border-border bg-card flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por folio o referencia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-input border-border"
                />
              </div>
            </div>

            <Select value={filterEstadoId} onValueChange={setFilterEstadoId}>
              <SelectTrigger className="w-[180px] border-border">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {estados.map(est => (
                  <SelectItem key={est.id} value={est.id.toString()}>
                    {est.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPrioridadId} onValueChange={setFilterPrioridadId}>
              <SelectTrigger className="w-[180px] border-border">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {prioridades.map(pri => (
                  <SelectItem key={pri.id} value={pri.id.toString()}>
                    {pri.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                  <TableHead className="font-semibold text-foreground">Folio</TableHead>
                  <TableHead className="font-semibold text-foreground">Referencia</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Detalles</TableHead>
                  <TableHead className="font-semibold text-foreground">Prioridad</TableHead>
                  <TableHead className="font-semibold text-foreground">Estado</TableHead>
                  <TableHead className="font-semibold text-foreground">Fecha Requerida</TableHead>
                  <TableHead className="font-semibold text-foreground">Capturista</TableHead>
                  <TableHead className="font-semibold text-foreground">Almacenista</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrdenes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No hay órdenes que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrdenes.map((orden, index) => (
                    <TableRow
                      key={orden.id}
                      className={`group transition-colors hover:bg-muted/50 ${
                        index % 2 === 0 ? "bg-card" : "bg-muted/20"
                      }`}
                    >
                      <TableCell className="font-mono text-xs font-medium text-foreground bg-muted/30 rounded-md py-1 px-2 m-1 w-fit inline-block">
                        {orden.folio}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{orden.referencia_destino || "-"}</TableCell>
                      <TableCell className="text-right text-sm text-foreground">
                        {orden.detalles?.length || 0}
                      </TableCell>
                      <TableCell>
                        {orden.prioridad && <PrioridadBadge prioridad={orden.prioridad} />}
                      </TableCell>
                      <TableCell>
                        {orden.estado && <EstadoBadge estado={orden.estado} />}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3" />
                          {orden.fecha_requerida ? new Date(orden.fecha_requerida).toLocaleDateString() : "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {orden.capturista ? (
                          <div className="flex items-center gap-1.5">
                            <User className="size-3" />
                            {orden.capturista.name}
                          </div>
                        ) : (
                          <span className="italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {orden.almacenista ? (
                          <div className="flex items-center gap-1.5">
                            <User className="size-3" />
                            {orden.almacenista.name}
                          </div>
                        ) : (
                          <span className="italic">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 hover:text-amber-700 border-amber-300 hover:bg-amber-50"
                            onClick={() => handleDescargarPdf(orden.id, orden.folio)}
                            disabled={pdfDownloadingId === orden.id}
                            title="Descargar Vale de Salida (PDF)"
                          >
                            {pdfDownloadingId === orden.id ? (
                              <Loader2 className="size-3 mr-1 animate-spin" />
                            ) : (
                              <FileDown className="size-3 mr-1" />
                            )}
                            {pdfDownloadingId === orden.id ? "..." : "PDF"}
                          </Button>

                          {orden.estado && orden.estado.nombre !== "Completada" && orden.estado.nombre !== "Cancelada" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-muted-foreground hover:text-foreground border-muted hover:bg-muted"
                              onClick={() => {
                                setOrdenAAsignar(orden);
                                setAsignarOpen(true);
                                setAlmacenistaSeleccionado("");
                              }}
                              title="Asignar almacenista"
                            >
                              <User className="size-3 mr-1" />
                              Asignar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => {
                              setOrdenSeleccionada(orden);
                              setDetalleOpen(true);
                            }}
                          >
                            <FileText className="size-3 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t border-border bg-card text-sm text-muted-foreground">
            Mostrando {filteredOrdenes.length} de {ordenes.length} órdenes
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Detalles de Orden: {ordenSeleccionada?.folio}
            </DialogTitle>
            <DialogDescription>
              Información completa de la orden de surtido
            </DialogDescription>
          </DialogHeader>

          {ordenSeleccionada && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Folio</Label>
                  <p className="font-mono text-sm">{ordenSeleccionada.folio}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Referencia</Label>
                  <p className="text-sm">{ordenSeleccionada.referencia_destino || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Prioridad</Label>
                  <div className="mt-1">
                    {ordenSeleccionada.prioridad && (
                      <PrioridadBadge prioridad={ordenSeleccionada.prioridad} />
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Estado</Label>
                  <div className="mt-1">
                    {ordenSeleccionada.estado && (
                      <EstadoBadge estado={ordenSeleccionada.estado} />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Fecha Requerida</Label>
                  <p className="text-sm">
                    {ordenSeleccionada.fecha_requerida ? new Date(ordenSeleccionada.fecha_requerida).toLocaleDateString() : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Creada</Label>
                  <p className="text-sm">
                    {new Date(ordenSeleccionada.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-medium text-foreground mb-3">Detalles de Productos</h4>
                {ordenSeleccionada.detalles && ordenSeleccionada.detalles.length > 0 ? (
                  <div className="space-y-2">
                    {ordenSeleccionada.detalles.map((detalle: DetalleSurtido, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-muted/50 rounded border border-border text-sm"
                      >
                        <p className="font-medium text-foreground">
                          {detalle.producto?.nombre || "Producto"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {detalle.producto?.sku}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <span className="text-xs text-muted-foreground">Cantidad Requerida: </span>
                            <span className="text-sm font-medium text-foreground">
                              {detalle.cantidad_requerida}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Cantidad Surtida: </span>
                            <span className="text-sm font-medium text-foreground">
                              {detalle.cantidad_surtida || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin detalles</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetalleOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Modal */}
      <Dialog open={asignarOpen} onOpenChange={setAsignarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="size-5" />
              Asignar Almacenista a Orden {ordenAAsignar?.folio}
            </DialogTitle>
            <DialogDescription>
              Selecciona un almacenista disponible para asignar a esta orden. El estado cambiará automáticamente a "Asignada".
            </DialogDescription>
          </DialogHeader>

          {ordenAAsignar && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Referencia Destino</p>
                  <p className="font-medium text-foreground">{ordenAAsignar.referencia_destino || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cantidad Productos</p>
                  <p className="font-medium text-foreground">{ordenAAsignar.detalles?.length || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prioridad</p>
                  {ordenAAsignar.prioridad && <PrioridadBadge prioridad={ordenAAsignar.prioridad} />}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado Actual</p>
                  {ordenAAsignar.estado && <EstadoBadge estado={ordenAAsignar.estado} />}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="almacenista-select" className="text-sm font-medium">
                  Almacenista *
                </Label>
                {almacenistas.length > 0 ? (
                  <Select
                    value={almacenistaSeleccionado}
                    onValueChange={setAlmacenistaSeleccionado}
                    disabled={isAssigning}
                  >
                    <SelectTrigger id="almacenista-select" className="w-full">
                      <SelectValue placeholder="Selecciona un almacenista" />
                    </SelectTrigger>
                    <SelectContent>
                      {almacenistas.map((almacenista) => (
                        <SelectItem key={almacenista.id} value={almacenista.id.toString()}>
                          {almacenista.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <AlertCircle className="size-4 inline mr-2" />
                    No hay almacenistas disponibles
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAsignarOpen(false);
                setAlmacenistaSeleccionado("");
              }}
              disabled={isAssigning}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAsignarAlmacenista}
              disabled={isAssigning || !almacenistaSeleccionado}
              className="bg-primary hover:bg-primary/90"
            >
              {isAssigning && <Loader2 className="size-4 mr-2 animate-spin" />}
              {isAssigning ? "Asignando..." : "Asignar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Order Panel */}
      <CrearOrdenPanel
        isOpen={panelCrearOpen}
        onClose={() => setPanelCrearOpen(false)}
        productos={productos}
        prioridades={prioridades}
        onOrderCreated={cargarDatos}
      />
    </div>
  );
}