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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Search, Plus, Edit, Trash2, Package2, FileText, CheckCircle2, AlertCircle, Box, Boxes, BarChart3, Tag, Grid3x3, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import productService, { Categoria, UnidadMedida, Marca } from "../../services/productService";
import { Producto } from "../../tipos/ordenes";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

export function GestionProductos() {
  // ==================== UI STATE ====================
  const [tabActual, setTabActual] = useState<"productos" | "categorias" | "marcas">("productos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [maestroEditModal, setMaestroEditModal] = useState(false);
  const [maestroType, setMaestroType] = useState<"categoria" | "marca" | null>(null);
  
  // ==================== PRODUCTOS ====================
  const [products, setProducts] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("todas");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterMarca, setFilterMarca] = useState("todas");
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ==================== CATEGORIAS ====================
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [searchCategorias, setSearchCategorias] = useState("");
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [maestroName, setMaestroName] = useState("");
  const [savingMaestro, setSavingMaestro] = useState(false);
  
  // ==================== MARCAS ====================
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [searchMarcas, setSearchMarcas] = useState("");
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
  
  // ==================== OTROS ====================
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [showNewMaestro, setShowNewMaestro] = useState(false);
  const [newMaestroName, setNewMaestroName] = useState("");
  const [creatingMaestro, setCreatingMaestro] = useState(false);

  // Función para obtener catalogs (categorías, marcas, unidades)
  const fetchCatalogs = async () => {
    try {
      const catalogs = await productService.getCatalogs();
      setCategorias(catalogs.categorias);
      setMarcas(catalogs.marcas);
      setUnidades(catalogs.unidades_medida || []);
    } catch (err: any) {
      console.error('Error fetching catalogs:', err);
    }
  };

  // ==================== CRUD CATEGORIAS ====================
  const handleCreateCategoria = async () => {
    if (!newMaestroName.trim()) {
      toast.error("Ingresa un nombre para la categoría");
      return;
    }

    try {
      setCreatingMaestro(true);
      const response = await productService.createCategoria(newMaestroName);
      
      if (response.data) {
        setCategorias([...categorias, response.data]);
        setNewMaestroName("");
        setShowNewMaestro(false);
        toast.success("Categoría creada exitosamente");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setCreatingMaestro(false);
    }
  };

  const handleEditCategoriaOpen = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setMaestroName(categoria.nombre);
    setMaestroType("categoria");
    setMaestroEditModal(true);
  };

  const handleSaveCategoria = async () => {
    if (!editingCategoria || !maestroName.trim()) return;

    try {
      setSavingMaestro(true);
      const response = await productService.updateCategoria(editingCategoria.id, maestroName);
      
      if (response.data) {
        setCategorias(categorias.map(c => c.id === editingCategoria.id ? response.data : c));
        setMaestroEditModal(false);
        setEditingCategoria(null);
        setMaestroName("");
        toast.success("Categoría actualizada");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setSavingMaestro(false);
    }
  };

  const handleDeleteCategoria = async (id: number) => {
    if (!confirm("⚠️ ¿Está seguro de eliminar esta categoría? Esta acción NO se puede deshacer.")) return;

    try {
      await productService.deleteCategoria(id);
      setCategorias(categorias.filter(c => c.id !== id));
      await fetchProducts();
      toast.success("Categoría eliminada exitosamente");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Error al eliminar";
      toast.error(`Error: ${errorMsg}`);
    }
  };

  // ==================== CRUD MARCAS ====================
  const handleCreateMarca = async () => {
    if (!newMaestroName.trim()) {
      toast.error("Ingresa un nombre para la marca");
      return;
    }

    try {
      setCreatingMaestro(true);
      const response = await productService.createMarca(newMaestroName);
      
      if (response.data) {
        setMarcas([...marcas, response.data]);
        setNewMaestroName("");
        setShowNewMaestro(false);
        toast.success("Marca creada exitosamente");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setCreatingMaestro(false);
    }
  };

  const handleEditMarcaOpen = (marca: Marca) => {
    setEditingMarca(marca);
    setMaestroName(marca.nombre);
    setMaestroType("marca");
    setMaestroEditModal(true);
  };

  const handleSaveMarca = async () => {
    if (!editingMarca || !maestroName.trim()) return;

    try {
      setSavingMaestro(true);
      const response = await productService.updateMarca(editingMarca.id, maestroName);
      
      if (response.data) {
        setMarcas(marcas.map(m => m.id === editingMarca.id ? response.data : m));
        setMaestroEditModal(false);
        setEditingMarca(null);
        setMaestroName("");
        toast.success("Marca actualizada");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setSavingMaestro(false);
    }
  };

  const handleDeleteMarca = async (id: number) => {
    if (!confirm("⚠️ ¿Está seguro de eliminar esta marca? Esta acción NO se puede deshacer.")) return;

    try {
      await productService.deleteMarca(id);
      setMarcas(marcas.filter(m => m.id !== id));
      await fetchProducts();
      toast.success("Marca eliminada exitosamente");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Error al eliminar";
      toast.error(`Error: ${errorMsg}`);
    }
  };

  // Función para obtener productos de la API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await productService.getProducts();

      if (response.data) {
        setProducts(response.data);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('No autorizado. Por favor inicia sesión nuevamente.');
      } else if (err.response?.status === 404) {
        setError('Endpoint de API no encontrado. Verifica que el servidor esté corriendo en http://localhost:8000');
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
        setError('Error de conexión. Asegúrate que el servidor Laravel esté corriendo en http://localhost:8000');
        setProducts([]);
      } else {
        setError(`Error: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch products y catalogs cuando se monta el componente
  useEffect(() => {
    fetchCatalogs();
    fetchProducts();
  }, []);

  const [formData, setFormData] = useState<Partial<Producto>>({
    sku: "",
    nombre: "",
    categoria_id: undefined,
    unidad_medida_id: undefined,
    marca_id: undefined,
    stock_min: 0,
    stock_max: 0,
    estado: true,
  });

  // Filtrar productos
  const filteredProducts = products.filter((product) => {
    const matchSearch =
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria =
      filterCategoria === "todas" || 
      product.categoria_id === parseInt(filterCategoria);
    const matchEstado = 
      filterEstado === "todos" || 
      (filterEstado === "activo" ? product.estado : !product.estado);
    const matchMarca =
      filterMarca === "todas" || 
      product.marca_id === parseInt(filterMarca);

    return matchSearch && matchCategoria && matchEstado && matchMarca;
  });

  const handleOpenDialog = (product?: Producto) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        sku: "",
        nombre: "",
        categoria_id: undefined,
        unidad_medida_id: undefined,
        marca_id: undefined,
        stock_min: 0,
        stock_max: 0,
        estado: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingProduct) {
        // Actualizar producto existente
        const response = await productService.updateProduct(editingProduct.id, formData);

        if (response.data) {
          setProducts(
            products.map((p) =>
              p.id === editingProduct.id ? response.data : p
            )
          );
          toast.success("Producto actualizado correctamente");
        }
      } else {
        // Crear nuevo producto
        const response = await productService.createProduct(formData);

        if (response.data) {
          setProducts([...products, response.data]);
          toast.success("Producto creado correctamente");
        }
      }

      setDialogOpen(false);
      await fetchProducts(); // Refresh para sincronizar
    } catch (err: any) {
      const errorMsg = err.response?.data?.errors || err.response?.data?.error || err.response?.data?.message || err.message;
      toast.error(`Error: ${JSON.stringify(errorMsg)}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro? Este producto se desactivará (no se puede eliminar si está en uso sostenidamente).")) {
      try {
        // Desactivar producto (soft delete - cambiar estado a false)
        const response = await productService.updateProduct(id, { estado: false });

        if (response.data) {
          setProducts(
            products.map((p) =>
              p.id === id ? response.data : p
            )
          );
          toast.success("Producto desactivado correctamente");
        }
      } catch (err: any) {
        console.error('Error al desactivar producto:', err);
        toast.error("Error al desactivar el producto");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
            Gestión de Productos
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Administración del catálogo maestro y propiedades</p>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={tabActual} onValueChange={(value) => setTabActual(value as "productos" | "categorias" | "marcas")}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="productos" className="flex items-center gap-2">
            <Package2 className="size-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center gap-2">
            <Grid3x3 className="size-4" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="marcas" className="flex items-center gap-2">
            <Tag className="size-4" />
            Marcas
          </TabsTrigger>
        </TabsList>

        {/* ==================== TAB: PRODUCTOS ==================== */}
        <TabsContent value="productos" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-40 group-hover:opacity-70 transition duration-300" />
              <Button 
                onClick={() => handleOpenDialog()} 
                className="relative bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-xl"
              >
                <Plus className="size-4 mr-2" />
                Nuevo Producto
              </Button>
            </div>
          </div>

          {/* Estadísticas Productos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border border-primary/20 shadow-xl bg-gradient-to-br from-card to-primary/5 overflow-hidden group hover:shadow-2xl transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Total Productos
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package2 className="size-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-foreground">{products.length}</div>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">Registrados en el sistema</p>
              </CardContent>
            </Card>

            <Card className="border border-success/20 shadow-xl bg-gradient-to-br from-card to-success/5 overflow-hidden group hover:shadow-2xl transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-2xl group-hover:bg-success/20 transition-colors" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Productos Activos</CardTitle>
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircle2 className="size-5 text-success" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-success">
                  {products.filter((p) => p.estado).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                  {products.length > 0 ? `${Math.round((products.filter((p) => p.estado).length / products.length) * 100)}%` : '0%'} del total | {products.filter((p) => !p.estado).length} inactivos
                </p>
              </CardContent>
            </Card>

            <Card className="border border-accent/20 shadow-xl bg-gradient-to-br from-card to-accent/5 overflow-hidden group hover:shadow-2xl transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-colors" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Categorías</CardTitle>
                <div className="p-2 bg-accent/10 rounded-lg">
                  <FileText className="size-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-accent">{categorias.length}</div>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">Grupos de clasificación</p>
              </CardContent>
            </Card>
          </div>

      {/* Gestión de productos */}
      <Card className="border-border shadow-md overflow-hidden bg-card">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-lg text-foreground">Catálogo de Productos</CardTitle>
          <CardDescription>Gestión completa del maestro de productos</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filtros */}
          <div className="p-4 border-b border-border bg-card flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por SKU o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-input border-border"
                />
              </div>
            </div>

            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[200px] border-border">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMarca} onValueChange={setFilterMarca}>
              <SelectTrigger className="w-[200px] border-border">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las marcas</SelectItem>
                {marcas.map((marca) => (
                  <SelectItem key={marca.id} value={marca.id.toString()}>
                    {marca.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[180px] border-border">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
              <p className="text-muted-foreground">Cargando productos...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-destructive">Error al cargar productos</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  <Button 
                    onClick={fetchProducts} 
                    size="sm" 
                    className="mt-3"
                  >
                    Reintentar
                  </Button>
                </div>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <Package2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground font-medium">
                {products.length === 0 
                  ? "No hay productos registrados" 
                  : "No hay productos que coincidan con los filtros"}
              </p>
              {products.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">Crea el primer producto haciendo clic en "Nuevo Producto"</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                    <TableHead className="font-semibold text-foreground">SKU</TableHead>
                    <TableHead className="font-semibold text-foreground">Nombre</TableHead>
                    <TableHead className="font-semibold text-foreground">Categoría</TableHead>
                    <TableHead className="font-semibold text-foreground">Marca</TableHead>
                    <TableHead className="font-semibold text-foreground">Unidad</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Stock Mín.</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Stock Máx.</TableHead>
                    <TableHead className="font-semibold text-foreground">Estado</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product, index) => (
                    <TableRow key={product.id} className={`group transition-colors hover:bg-muted/50 ${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                      <TableCell className="font-mono text-xs font-medium text-foreground bg-muted/30 rounded-md py-1 px-2 m-1 w-fit inline-block">
                          {product.sku}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{product.nombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.categoria?.nombre || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.marca?.nombre || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(product as any).unidad_medida?.nombre || "N/A"}
                      </TableCell>
                      <TableCell className="text-right text-foreground">{product.stock_min}</TableCell>
                      <TableCell className="text-right text-foreground">{product.stock_max}</TableCell>
                      <TableCell>
                        {product.estado ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-sm font-normal">
                            Activo
                          </Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground border-border shadow-sm font-normal">
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(product)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                            title="Desactivar producto (no se elimina, solo se oculta)"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && !error && (
            <div className="p-4 border-t border-border bg-card text-sm text-muted-foreground">
              Mostrando {filteredProducts.length} de {products.length} productos
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* ==================== TAB: CATEGORÍAS ==================== */}
        <TabsContent value="categorias" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-40 group-hover:opacity-70 transition duration-300" />
              <Button 
                onClick={() => {
                  setShowNewMaestro(true);
                  setMaestroType("categoria");
                  setNewMaestroName("");
                }}
                className="relative bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-xl"
              >
                <Plus className="size-4 mr-2" />
                Nueva Categoría
              </Button>
            </div>
          </div>

          {/* Métrica Categorías */}
          <Card className="border border-accent/20 shadow-xl bg-gradient-to-br from-card to-accent/5 overflow-hidden group hover:shadow-2xl transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Categorías</CardTitle>
              <div className="p-2 bg-accent/10 rounded-lg">
                <Grid3x3 className="size-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-accent">{categorias.length}</div>
              <p className="text-xs text-muted-foreground mt-1.5 font-medium">Grupos de clasificación</p>
            </CardContent>
          </Card>

          {/* Tabla Categorías */}
          <Card className="border-border shadow-md overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 border-b border-border">
              <CardTitle className="text-lg text-foreground">Categorías</CardTitle>
              <CardDescription>Gestión de categorías de productos</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Filtro Búsqueda */}
              <div className="p-4 border-b border-border bg-card">
                <div className="flex-1 max-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar categoría..."
                      value={searchCategorias}
                      onChange={(e) => setSearchCategorias(e.target.value)}
                      className="pl-9 bg-input border-border"
                    />
                  </div>
                </div>
              </div>

              {/* Tabla */}
              {categorias.length === 0 ? (
                <div className="p-8 text-center">
                  <Grid3x3 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground font-medium">No hay categorías registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                        <TableHead className="font-semibold text-foreground">Nombre</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Productos</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorias
                        .filter(cat => cat.nombre.toLowerCase().includes(searchCategorias.toLowerCase()))
                        .map((cat, idx) => (
                          <TableRow key={cat.id} className={`group transition-colors hover:bg-muted/50 ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                            <TableCell className="font-medium text-foreground">{cat.nombre}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {products.filter(p => p.categoria_id === cat.id).length}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCategoriaOpen(cat)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                >
                                  <Edit className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCategoria(cat.id)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                  title="Eliminar esta categoría permanentemente"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {categorias.length > 0 && (
                <div className="p-4 border-t border-border bg-card text-sm text-muted-foreground">
                  Mostrando {categorias.filter(c => c.nombre.toLowerCase().includes(searchCategorias.toLowerCase())).length} de {categorias.length} categorías
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB: MARCAS ==================== */}
        <TabsContent value="marcas" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-40 group-hover:opacity-70 transition duration-300" />
              <Button 
                onClick={() => {
                  setShowNewMaestro(true);
                  setMaestroType("marca");
                  setNewMaestroName("");
                }}
                className="relative bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-xl"
              >
                <Plus className="size-4 mr-2" />
                Nueva Marca
              </Button>
            </div>
          </div>

          {/* Métrica Marcas */}
          <Card className="border border-success/20 shadow-xl bg-gradient-to-br from-card to-success/5 overflow-hidden group hover:shadow-2xl transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-2xl group-hover:bg-success/20 transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Marcas</CardTitle>
              <div className="p-2 bg-success/10 rounded-lg">
                <Tag className="size-5 text-success" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-success">{marcas.length}</div>
              <p className="text-xs text-muted-foreground mt-1.5 font-medium">Proveedores/Fabricantes</p>
            </CardContent>
          </Card>

          {/* Tabla Marcas */}
          <Card className="border-border shadow-md overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 border-b border-border">
              <CardTitle className="text-lg text-foreground">Marcas</CardTitle>
              <CardDescription>Gestión de marcas y fabricantes</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Filtro Búsqueda */}
              <div className="p-4 border-b border-border bg-card">
                <div className="flex-1 max-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar marca..."
                      value={searchMarcas}
                      onChange={(e) => setSearchMarcas(e.target.value)}
                      className="pl-9 bg-input border-border"
                    />
                  </div>
                </div>
              </div>

              {/* Tabla */}
              {marcas.length === 0 ? (
                <div className="p-8 text-center">
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground font-medium">No hay marcas registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                        <TableHead className="font-semibold text-foreground">Nombre</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Productos</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marcas
                        .filter(marca => marca.nombre.toLowerCase().includes(searchMarcas.toLowerCase()))
                        .map((marca, idx) => (
                          <TableRow key={marca.id} className={`group transition-colors hover:bg-muted/50 ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                            <TableCell className="font-medium text-foreground">{marca.nombre}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {products.filter(p => p.marca_id === marca.id).length}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditMarcaOpen(marca)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                >
                                  <Edit className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteMarca(marca.id)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                  title="Eliminar esta marca permanentemente"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {marcas.length > 0 && (
                <div className="p-4 border-t border-border bg-card text-sm text-muted-foreground">
                  Mostrando {marcas.filter(m => m.nombre.toLowerCase().includes(searchMarcas.toLowerCase())).length} de {marcas.length} marcas
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Overlay */}
      {dialogOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setDialogOpen(false)}
        />
      )}

      {/* Slide-over Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-[500px] bg-card border-l border-border shadow-2xl z-50 transition-transform duration-300 overflow-y-auto ${
          dialogOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {editingProduct ? (
              <Edit className="size-5 text-primary" />
            ) : (
              <Package2 className="size-5 text-primary" />
            )}
            <h2 className="text-lg font-semibold text-foreground">
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Section 1: Info General */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                1
              </span>
              Información General
            </h3>
            
            <div className="space-y-3">
              <Label htmlFor="sku" className="text-sm font-semibold">SKU *</Label>
              <Input
                id="sku"
                placeholder="Ej: RACK-A001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="h-10 text-base border-border"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="nombre" className="text-sm font-semibold">Nombre del Producto *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Estantería Industrial"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="h-10 text-base border-border"
              />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Section 2: Clasificación */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                2
              </span>
              Clasificación
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="categoria_id" className="text-sm font-semibold">Categoría *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewMaestro(true);
                      setMaestroType("categoria");
                      setNewMaestroName("");
                    }}
                    className="h-6 w-6 p-0 text-sm hover:bg-primary/10 ml-1 text-primary"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <Select
                  value={formData.categoria_id?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, categoria_id: parseInt(value) })}
                >
                  <SelectTrigger className="h-10 text-base border-border">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="marca_id" className="text-sm font-semibold">Marca *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewMaestro(true);
                      setMaestroType("marca");
                      setNewMaestroName("");
                    }}
                    className="h-6 w-6 p-0 text-sm hover:bg-primary/10 ml-1 text-primary"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <Select
                  value={formData.marca_id?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, marca_id: parseInt(value) })}
                >
                  <SelectTrigger className="h-10 text-base border-border">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {marcas.map((marca) => (
                      <SelectItem key={marca.id} value={marca.id.toString()}>
                        {marca.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="unidad_medida_id" className="text-sm font-semibold">Unidad de Medida *</Label>
              <Select
                value={formData.unidad_medida_id?.toString() || ""}
                onValueChange={(value) => setFormData({ ...formData, unidad_medida_id: parseInt(value) })}
              >
                <SelectTrigger className="h-10 text-base border-border">
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  {unidades && unidades.length > 0 ? (
                    unidades.map((unidad) => (
                      <SelectItem key={unidad.id} value={unidad.id.toString()}>
                        {unidad.nombre}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">Sin unidades disp.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Section 3: Inventario */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                3
              </span>
              Control de Inventario
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="stock_min" className="text-sm font-semibold text-amber-500">Stock Mínimo (Global) *</Label>
                <Input
                  id="stock_min"
                  type="number"
                  value={formData.stock_min}
                  onChange={(e) => setFormData({ ...formData, stock_min: parseInt(e.target.value) || 0 })}
                  className="h-10 text-base border-border"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="stock_max" className="text-sm font-semibold text-emerald-500">Stock Máximo (Global) *</Label>
                <Input
                  id="stock_max"
                  type="number"
                  value={formData.stock_max}
                  onChange={(e) => setFormData({ ...formData, stock_max: parseInt(e.target.value) || 0 })}
                  className="h-10 text-base border-border"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label htmlFor="estado" className="text-sm font-semibold">Estado del Producto</Label>
              <Select
                value={formData.estado ? "activo" : "inactivo"}
                onValueChange={(value) => setFormData({ ...formData, estado: value === "activo" })}
              >
                <SelectTrigger className="h-10 text-base border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo (Visible)</SelectItem>
                  <SelectItem value="inactivo">Inactivo (Oculto)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border p-6 flex gap-3 z-10">
          <Button
            variant="outline"
            onClick={() => setDialogOpen(false)}
            className="flex-1 border-border"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-primary to-primary/90 text-white hover:from-primary/90 hover:to-primary shadow-lg font-semibold"
          >
            {editingProduct ? "Actualizar" : "Crear"} Producto
          </Button>
        </div>
      </div>

      {/* Modal para crear Categoría/Marca */}
      <Dialog open={showNewMaestro} onOpenChange={setShowNewMaestro}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Nueva {maestroType === "categoria" ? "Categoría" : "Marca"}
            </DialogTitle>
            <DialogDescription>
              Ingresa el nombre de la nueva {maestroType === "categoria" ? "categoría" : "marca"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="maestro_name">Nombre *</Label>
              <Input
                id="maestro_name"
                placeholder={maestroType === "categoria" ? "Ej: Electrónica, Herramientas" : "Ej: Samsung, Bosch, DeWalt"}
                value={newMaestroName}
                onChange={(e) => setNewMaestroName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (maestroType === "categoria" ? handleCreateCategoria() : handleCreateMarca())}
                disabled={creatingMaestro}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewMaestro(false)}
              disabled={creatingMaestro}
            >
              Cancelar
            </Button>
            <Button 
              onClick={maestroType === "categoria" ? handleCreateCategoria : handleCreateMarca}
              className="bg-primary text-white hover:bg-primary/90"
              disabled={creatingMaestro}
            >
              {creatingMaestro ? "Creando..." : `Crear ${maestroType === "categoria" ? "Categoría" : "Marca"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar Categoría/Marca */}
      <Dialog open={maestroEditModal} onOpenChange={setMaestroEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Editar {maestroType === "categoria" ? "Categoría" : "Marca"}
            </DialogTitle>
            <DialogDescription>
              Modifica el nombre de la {maestroType === "categoria" ? "categoría" : "marca"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="maestro_edit_name">Nombre *</Label>
              <Input
                id="maestro_edit_name"
                placeholder={maestroType === "categoria" ? "Ej: Electrónica, Herramientas" : "Ej: Samsung, Bosch, DeWalt"}
                value={maestroName}
                onChange={(e) => setMaestroName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (maestroType === "categoria" ? handleSaveCategoria() : handleSaveMarca())}
                disabled={savingMaestro}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setMaestroEditModal(false);
                setEditingCategoria(null);
                setEditingMarca(null);
                setMaestroName("");
              }}
              disabled={savingMaestro}
            >
              Cancelar
            </Button>
            <Button 
              onClick={maestroType === "categoria" ? handleSaveCategoria : handleSaveMarca}
              className="bg-primary text-white hover:bg-primary/90"
              disabled={savingMaestro}
            >
              {savingMaestro ? "Guardando..." : `Guardar ${maestroType === "categoria" ? "Categoría" : "Marca"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}