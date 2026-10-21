import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { 
  Warehouse, 
  ChevronRight, 
  ChevronDown, 
  Box,
  Grid3x3,
  Layers,
  PackagePlus,
  MapPin,
  Building2,
  Loader2,
  Plus,
  Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import locationService, { Almacen, Estante, Inventario } from "../../services/locationService";
import { ModalEstructura, EstructuraTipo } from "../components/almacen/ModalEstructura";
import { ModalAjusteStock } from "../components/almacen/ModalAjusteStock";

export function MapaAlmacen() {
  const [searchParams] = useSearchParams();
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(true);
  const [almacenExpandido, setAlmacenExpandido] = useState<string | null>(null);
  const [pasilloExpandido, setPasilloExpandido] = useState<string | null>(null);
  const [rackExpandido, setRackExpandido] = useState<string | null>(null);
  const [estanteSeleccionado, setEstanteSeleccionado] = useState<Estante | null>(null);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [loadingInventario, setLoadingInventario] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [modalEstructuraOpen, setModalEstructuraOpen] = useState(false);
  const [modalEstructuraConfig, setModalEstructuraConfig] = useState<{tipo: EstructuraTipo | null, parentId: number | null}>({tipo: null, parentId: null});
  const [modalStockOpen, setModalStockOpen] = useState(false);

  // Función para buscar un estante por código en la estructura jerárquica
  const buscarEstanteEnArbol = (
    almacenesData: Almacen[], 
    codigoUbicacion: string
  ): { estante: Estante | null; almacenId: number; pasilloId: number; rackId: number } | null => {
    for (const almacen of almacenesData) {
      if (almacen.pasillos) {
        for (const pasillo of almacen.pasillos) {
          if (pasillo.racks) {
            for (const rack of pasillo.racks) {
              if (rack.estantes) {
                const estante = rack.estantes.find(
                  (e) => e.codigo_etiqueta === codigoUbicacion
                );
                if (estante) {
                  return {
                    estante,
                    almacenId: almacen.id,
                    pasilloId: pasillo.id,
                    rackId: rack.id,
                  };
                }
              }
            }
          }
        }
      }
    }
    return null;
  };

  // Cargar datos iniciales
  const fetchArbol = async () => {
    try {
      const data = await locationService.getTree();
      setAlmacenes(data);
      return data;
    } catch (error) {
      console.error("Error al cargar el árbol de almacenes:", error);
      toast.error("Error al cargar la estructura de almacenes");
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const data = await fetchArbol();

      // Buscar la ubicación en parámetros
      if (data) {
        const ubicacion = searchParams.get("ubicacion");
        if (ubicacion && data.length > 0) {
          const resultado = buscarEstanteEnArbol(data, ubicacion);
          if (resultado) {
            const { estante, almacenId, pasilloId, rackId } = resultado;
            setAlmacenExpandido(almacenId.toString());
            setPasilloExpandido(pasilloId.toString());
            setRackExpandido(rackId.toString());
            setEstanteSeleccionado(estante);
            toast.success(`Ubicación ${ubicacion} encontrada`, {
              description: `Nivel ${estante.nivel} - ${estante.tipo_zona}`,
            });
          } else {
            toast.warning(`Ubicación ${ubicacion} no encontrada`, {
              description: "La ubicación especificada no existe en el almacén",
            });
            if (data.length > 0) setAlmacenExpandido(data[0].id.toString());
          }
        } else {
          if (data.length > 0) setAlmacenExpandido(data[0].id.toString());
        }
      }
      setLoading(false);
    };

    init();
  }, [searchParams]);

  const handleDelete = async (tipo: EstructuraTipo, id: number) => {
    if (!confirm(`¿Estás seguro de eliminar este ${tipo}? Si tiene elementos dependientes la acción será denegada.`)) return;
    try {
      if (tipo === 'almacen') await locationService.deleteAlmacen(id);
      if (tipo === 'pasillo') await locationService.deletePasillo(id);
      if (tipo === 'rack') await locationService.deleteRack(id);
      if (tipo === 'estante') await locationService.deleteEstante(id);
      toast.success(`${tipo} eliminado`);
      fetchArbol();
      if (tipo === 'estante' && estanteSeleccionado?.id === id) {
        setEstanteSeleccionado(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al eliminar la ubicación");
    }
  };

  // Cargar inventario cuando se selecciona un estante
  useEffect(() => {
    const cargarInventario = async () => {
      if (!estanteSeleccionado) {
        setInventario([]);
        return;
      }

      setLoadingInventario(true);
      try {
        const data = await locationService.getInventoryByEstante(estanteSeleccionado.id);
        setInventario(data);
      } catch (error) {
        console.error('Error al cargar inventario:', error);
        toast.error('Error al cargar el inventario del estante');
        setInventario([]);
      } finally {
        setLoadingInventario(false);
      }
    };

    cargarInventario();
  }, [estanteSeleccionado]);

  const toggleAlmacen = (id: number) => {
    setAlmacenExpandido(almacenExpandido === id.toString() ? null : id.toString());
    setPasilloExpandido(null);
    setRackExpandido(null);
    setEstanteSeleccionado(null);
  };

  const togglePasillo = (id: number) => {
    setPasilloExpandido(pasilloExpandido === id.toString() ? null : id.toString());
    setRackExpandido(null);
    setEstanteSeleccionado(null);
  };

  const toggleRack = (id: number) => {
    setRackExpandido(rackExpandido === id.toString() ? null : id.toString());
    setEstanteSeleccionado(null);
  };

  const seleccionarEstante = (estante: Estante) => {
    setEstanteSeleccionado(estante);
  };

  const calcularEstadisticas = (almacen: Almacen) => {
    let totalEstantes = 0;
    almacen.pasillos?.forEach(pasillo => {
      pasillo.racks?.forEach(rack => {
        totalEstantes += rack.estantes?.length || 0;
      });
    });
    return { totalEstantes };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando estructura de almacenes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-info to-accent bg-clip-text text-transparent">
              Mapa de Almacén
            </h2>
            <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-full border border-border">
              <Switch id="edit-mode" checked={editMode} onCheckedChange={setEditMode} />
              <Label htmlFor="edit-mode" className="text-xs font-medium cursor-pointer">Modo Constructor</Label>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Visor de la infraestructura logística y contenido de estantes</p>
        </div>
      </div>

      {/* Estadísticas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Almacenes</CardTitle>
            <Warehouse className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{almacenes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total configurados</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pasillos</CardTitle>
            <MapPin className="size-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {almacenes.reduce((acc, a) => acc + (a.pasillos?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">En todos los almacenes</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Racks</CardTitle>
            <Grid3x3 className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {almacenes.reduce((acc, a) => {
                return acc + (a.pasillos?.reduce((pAcc, p) => pAcc + (p.racks?.length || 0), 0) || 0);
              }, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Estructuras de almacenamiento</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Estantes</CardTitle>
            <Layers className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {almacenes.reduce((acc, a) => {
                return acc + (a.pasillos?.reduce((pAcc, p) => {
                  return pAcc + (p.racks?.reduce((rAcc, r) => rAcc + (r.estantes?.length || 0), 0) || 0);
                }, 0) || 0);
              }, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Posiciones de almacenamiento</p>
          </CardContent>
        </Card>
      </div>

      {/* Vista de Almacenes en Árbol */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo - Árbol de Navegación */}
        <div className="lg:col-span-1">
          <Card className="border-border shadow-md bg-card">
            <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <Building2 className="size-5 text-primary" />
                  Estructura
                </CardTitle>
                <CardDescription>Navegación jerárquica de almacenes</CardDescription>
              </div>
              {editMode && (
                <Button size="sm" onClick={() => {
                  setModalEstructuraConfig({tipo: 'almacen', parentId: null});
                  setModalEstructuraOpen(true);
                }}>
                  <Plus className="size-4 mr-1" /> Nuevo Almacén
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 max-h-[600px] overflow-y-auto">
              <div className="space-y-2">
                {almacenes.map((almacen) => {
                  const stats = calcularEstadisticas(almacen);
                  const isExpanded = almacenExpandido === almacen.id.toString();
                  
                  return (
                    <div key={almacen.id} className="border border-border rounded-lg overflow-hidden bg-card">
                      {/* Almacén */}
                      <button
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('.action-btn')) return;
                          toggleAlmacen(almacen.id);
                        }}
                        className="w-full p-3 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <Warehouse className="size-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0 flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-foreground text-sm truncate">{almacen.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {almacen.pasillos?.length || 0} pasillos · {stats.totalEstantes} estantes
                            </div>
                          </div>
                          {editMode && (
                            <div className="flex items-center gap-1 action-btn">
                              <Button variant="ghost" size="icon" className="h-7 w-7 bg-primary/10 hover:bg-primary/20" onClick={() => {
                                setModalEstructuraConfig({tipo: 'pasillo', parentId: almacen.id});
                                setModalEstructuraOpen(true);
                              }}>
                                <Plus className="size-3 text-primary" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 bg-destructive/10 hover:bg-destructive/20" onClick={() => {
                                handleDelete('almacen', almacen.id);
                              }}>
                                <Trash2 className="size-3 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Pasillos */}
                      {isExpanded && (
                        <div className="border-t border-border bg-muted/20">
                          {(!almacen.pasillos || almacen.pasillos.length === 0) ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Sin pasillos configurados
                            </div>
                          ) : (
                            almacen.pasillos.map((pasillo) => {
                              const isPasilloExpanded = pasilloExpandido === pasillo.id.toString();
                              
                              return (
                                <div key={pasillo.id} className="border-b border-border last:border-b-0">
                                  <button
                                    onClick={(e) => {
                                      if ((e.target as HTMLElement).closest('.action-btn')) return;
                                      togglePasillo(pasillo.id);
                                    }}
                                    className="w-full p-3 pl-8 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left"
                                  >
                                    {isPasilloExpanded ? (
                                      <ChevronDown className="size-3 text-muted-foreground flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="size-3 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <MapPin className="size-3 text-accent flex-shrink-0" />
                                    <div className="flex-1 min-w-0 flex items-center justify-between">
                                      <div>
                                        <div className="font-medium text-foreground text-sm">Pasillo {pasillo.nombre}</div>
                                        <div className="text-xs text-muted-foreground">{pasillo.racks?.length || 0} racks</div>
                                      </div>
                                      {editMode && (
                                        <div className="flex items-center gap-1 action-btn">
                                          <Button variant="ghost" size="icon" className="h-6 w-6 bg-primary/10 hover:bg-primary/20" onClick={() => {
                                            setModalEstructuraConfig({tipo: 'rack', parentId: pasillo.id});
                                            setModalEstructuraOpen(true);
                                          }}>
                                            <Plus className="size-3 text-primary" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-6 w-6 bg-destructive/10 hover:bg-destructive/20" onClick={() => {
                                            handleDelete('pasillo', pasillo.id);
                                          }}>
                                            <Trash2 className="size-3 text-destructive" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </button>

                                  {/* Racks */}
                                  {isPasilloExpanded && (
                                    <div className="bg-muted/30">
                                      {(!pasillo.racks || pasillo.racks.length === 0) ? (
                                        <div className="p-3 pl-12 text-sm text-muted-foreground">
                                          Sin racks configurados
                                        </div>
                                      ) : (
                                        pasillo.racks.map((rack) => {
                                          const isRackExpanded = rackExpandido === rack.id.toString();
                                          
                                          return (
                                            <div key={rack.id}>
                                              <button
                                                onClick={(e) => {
                                                  if ((e.target as HTMLElement).closest('.action-btn')) return;
                                                  toggleRack(rack.id);
                                                }}
                                                className="w-full p-2 pl-12 flex items-center gap-2 hover:bg-muted/70 transition-colors text-left"
                                              >
                                                {isRackExpanded ? (
                                                  <ChevronDown className="size-3 text-muted-foreground flex-shrink-0" />
                                                ) : (
                                                  <ChevronRight className="size-3 text-muted-foreground flex-shrink-0" />
                                                )}
                                                <Box className="size-3 text-muted-foreground flex-shrink-0" />
                                                <div className="flex-1 min-w-0 flex justify-between items-center">
                                                  <div>
                                                    <div className="font-medium text-foreground text-xs">{rack.nombre_rack}</div>
                                                    <div className="text-xs text-muted-foreground">{rack.estantes?.length || 0} estantes</div>
                                                  </div>
                                                  {editMode && (
                                                    <div className="flex items-center gap-1 action-btn">
                                                      <Button variant="ghost" size="icon" className="h-5 w-5 bg-primary/10 hover:bg-primary/20" onClick={() => {
                                                        setModalEstructuraConfig({tipo: 'estante', parentId: rack.id});
                                                        setModalEstructuraOpen(true);
                                                      }}>
                                                        <Plus className="size-3 text-primary" />
                                                      </Button>
                                                      <Button variant="ghost" size="icon" className="h-5 w-5 bg-destructive/10 hover:bg-destructive/20" onClick={() => {
                                                        handleDelete('rack', rack.id);
                                                      }}>
                                                        <Trash2 className="size-3 text-destructive" />
                                                      </Button>
                                                    </div>
                                                  )}
                                                </div>
                                              </button>

                                              {/* Estantes */}
                                              {isRackExpanded && (
                                                <div className="bg-muted/50">
                                                  {(!rack.estantes || rack.estantes.length === 0) ? (
                                                    <div className="p-2 pl-16 text-xs text-muted-foreground">
                                                      Sin estantes configurados
                                                    </div>
                                                  ) : (
                                                    rack.estantes.map((estante) => (
                                                      <div key={estante.id} className="w-full flex items-center justify-between hover:bg-muted/70 transition-colors text-left">
                                                        <button
                                                          onClick={() => seleccionarEstante(estante)}
                                                          className={`flex-1 p-2 pl-16 flex items-center gap-2 ${
                                                            estanteSeleccionado?.id === estante.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                                                          }`}
                                                        >
                                                          <Layers className="size-3 text-muted-foreground flex-shrink-0" />
                                                          <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-foreground text-xs text-left">
                                                              Nivel {estante.nivel} - {estante.codigo_etiqueta}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground text-left">
                                                              {estante.tipo_zona} {estante.esta_lleno ? '(Lleno)' : '(Disponible)'}
                                                            </div>
                                                          </div>
                                                        </button>
                                                        {editMode && (
                                                          <div className="pr-2">
                                                            <Button variant="ghost" size="icon" className="h-5 w-5 bg-destructive/10 hover:bg-destructive/20" onClick={() => {
                                                              handleDelete('estante', estante.id);
                                                            }}>
                                                              <Trash2 className="size-3 text-destructive" />
                                                            </Button>
                                                          </div>
                                                        )}
                                                      </div>
                                                    ))
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel Derecho - Visor de Inventario */}
        <div className="lg:col-span-2">
          {estanteSeleccionado ? (
            <Card className="border-border shadow-md bg-card">
              <CardHeader className="bg-muted/30 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-foreground flex items-center gap-2">
                      Estante {estanteSeleccionado.codigo_etiqueta}
                    </CardTitle>
                    <CardDescription>
                      Nivel {estanteSeleccionado.nivel} - {estanteSeleccionado.tipo_zona}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={estanteSeleccionado.esta_lleno ? "destructive" : "secondary"}>
                      {estanteSeleccionado.esta_lleno ? "Lleno" : "Disponible"}
                    </Badge>
                    {editMode && (
                      <Button size="sm" onClick={() => setModalStockOpen(true)}>
                        <PackagePlus className="size-4 mr-2" />
                        Ajustar Stock
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loadingInventario ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Cargando inventario...</span>
                  </div>
                ) : inventario.length === 0 ? (
                  <div className="text-center py-8">
                    <PackagePlus className="size-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Estante vacío</h3>
                    <p className="text-muted-foreground">
                      No hay productos almacenados en este estante.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Productos almacenados</h4>
                    <div className="space-y-3">
                      {inventario.map((item) => (
                        <div
                          key={item.id}
                          className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-foreground">{item.producto?.sku}</span>
                                <Badge variant="outline" className="text-xs">
                                  {item.producto?.nombre}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Cantidad física: <span className="font-semibold text-foreground">{item.cantidad}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Resumen del Estante */}
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="font-semibold text-foreground mb-3">Resumen del Estante</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-foreground">
                            {inventario.length}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Productos diferentes</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {inventario.reduce((acc, item) => acc + item.cantidad, 0)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Unidades totales</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border shadow-sm bg-card">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="bg-muted/50 p-6 rounded-full mb-4">
                  <Layers className="size-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Selecciona un estante</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Navega por la estructura de almacenes en el panel izquierdo y selecciona un estante para ver su contenido actual.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ModalEstructura 
        isOpen={modalEstructuraOpen}
        onClose={() => setModalEstructuraOpen(false)}
        tipo={modalEstructuraConfig.tipo}
        parentId={modalEstructuraConfig.parentId}
        onSuccess={fetchArbol}
      />

      <ModalAjusteStock 
        isOpen={modalStockOpen}
        onClose={() => setModalStockOpen(false)}
        estanteId={estanteSeleccionado?.id || null}
        onSuccess={() => {
           const id = estanteSeleccionado?.id;
           if(id) {
             setLoadingInventario(true);
             locationService.getInventoryByEstante(id).then(setInventario).finally(()=>setLoadingInventario(false));
           }
        }}
      />
    </div>
  );
}