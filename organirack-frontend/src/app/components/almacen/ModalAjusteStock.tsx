import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import inventoryService from "../../../services/inventoryService";
import productService, { Producto } from "../../../services/productService";

const ESTADOS_INVENTARIO = [
  { id: 1, nombre: 'Disponible' },
  { id: 2, nombre: 'Dañado' },
  { id: 3, nombre: 'En Cuarentena' },
  { id: 4, nombre: 'Merma' }
];

interface ModalAjusteStockProps {
  isOpen: boolean;
  onClose: () => void;
  estanteId: number | null;
  onSuccess: () => void;
}

export function ModalAjusteStock({ isOpen, onClose, estanteId, onSuccess }: ModalAjusteStockProps) {
  const [loading, setLoading] = useState(false);
  const [loadingProds, setLoadingProds] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  
  const [productoId, setProductoId] = useState<string>("");
  const [estadoId, setEstadoId] = useState<string>("1"); // Default: Disponible
  const [cantidad, setCantidad] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setCantidad(0);
      setProductoId("");
      setEstadoId("1");
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoadingProds(true);
    try {
      const res = await productService.getProducts({ estado: true });
      // Manejar la estructura de response según productService
      if (res.data) {
        setProductos(res.data);
      }
    } catch (error) {
      toast.error("No se pudieron cargar los productos");
    } finally {
      setLoadingProds(false);
    }
  };

  const handleAdjust = async () => {
    if (!estanteId || !productoId) return;
    setLoading(true);
    try {
      await inventoryService.addManualStock(
        parseInt(productoId),
        estanteId,
        parseInt(estadoId),
        cantidad
      );
      toast.success("Stock ajustado correctamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Error al ajustar stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajuste Manual de Inventario</DialogTitle>
          <DialogDescription>
            Modifica la cantidad exacta de un producto en este estante.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Producto</Label>
            <Select onValueChange={setProductoId} value={productoId} disabled={loadingProds}>
              <SelectTrigger>
                <SelectValue placeholder={loadingProds ? "Cargando..." : "Seleccionar producto..."} />
              </SelectTrigger>
              <SelectContent>
                {productos.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.sku} - {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
             <Label>Estado del Inventario</Label>
             <Select onValueChange={setEstadoId} value={estadoId}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {ESTADOS_INVENTARIO.map(e => (
                   <SelectItem key={e.id} value={e.id.toString()}>
                     {e.nombre}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>

          <div className="space-y-2">
            <Label>Cantidad Final Absoluta</Label>
            <Input 
              type="number"
              min="0"
              value={cantidad}
              onChange={e => setCantidad(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Esta cantidad reemplazará la actual y generará una bitácora auditada.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleAdjust} disabled={loading || !productoId}>
            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
