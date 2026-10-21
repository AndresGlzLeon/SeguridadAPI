import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import locationService from "../../../services/locationService";

export type EstructuraTipo = 'almacen' | 'pasillo' | 'rack' | 'estante';

interface ModalEstructuraProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: EstructuraTipo | null;
  parentId: number | null; 
  onSuccess: () => void;
}

export function ModalEstructura({ isOpen, onClose, tipo, parentId, onSuccess }: ModalEstructuraProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const titleMap = {
    almacen: "Nuevo Almacén",
    pasillo: "Nuevo Pasillo",
    rack: "Nuevo Rack",
    estante: "Nuevo Estante",
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      switch (tipo) {
        case 'almacen':
          if(!formData.nombre) throw new Error("Nombre es obligatorio");
          await locationService.createAlmacen(formData);
          break;
        case 'pasillo':
          if(!formData.nombre || !parentId) throw new Error("Nombre es obligatorio");
          await locationService.createPasillo({ ...formData, almacen_id: parentId });
          break;
        case 'rack':
          if(!formData.nombre_rack || !parentId) throw new Error("Nombre es obligatorio");
          await locationService.createRack({ ...formData, pasillo_id: parentId });
          break;
        case 'estante':
          if(!formData.nivel || !formData.codigo_etiqueta || !parentId) throw new Error("Nivel y código son obligatorios");
          await locationService.createEstante({ ...formData, rack_id: parentId, esta_lleno: false });
          break;
      }
      toast.success(`${titleMap[tipo!]} creado correctamente`);
      onSuccess();
      onClose();
      setFormData({});
    } catch (error: any) {
      toast.error(error.message || "Error al crear elemento");
    } finally {
      setLoading(false);
    }
  };

  if (!tipo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titleMap[tipo]}</DialogTitle>
          <DialogDescription>
            Rellena los detalles para configurar este nivel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {(tipo === 'almacen' || tipo === 'pasillo') && (
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input 
                placeholder={`Nombre del ${tipo}`}
                value={formData.nombre || ''}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
          )}
          {tipo === 'rack' && (
            <div className="space-y-2">
              <Label>Nombre del Rack</Label>
              <Input 
                placeholder="Ej. R-A1"
                value={formData.nombre_rack || ''}
                onChange={e => setFormData({ ...formData, nombre_rack: e.target.value })}
              />
            </div>
          )}
          {(tipo === 'almacen') && (
            <div className="space-y-2">
              <Label>Siglas {tipo === 'almacen' ? '(Opcional)' : ''}</Label>
              <Input 
                placeholder="Ej. NRT"
                value={formData.siglas || ''}
                onChange={e => setFormData({ ...formData, siglas: e.target.value })}
              />
            </div>
          )}
          {tipo === 'estante' && (
            <>
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Input 
                  placeholder="Ej. 1, 2, 3..."
                  value={formData.nivel || ''}
                  onChange={e => setFormData({ ...formData, nivel: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Código Único (Etiqueta)</Label>
                <Input 
                  placeholder="Ej. A-01-R1-N1"
                  value={formData.codigo_etiqueta || ''}
                  onChange={e => setFormData({ ...formData, codigo_etiqueta: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Zona (opcional)</Label>
                <Select onValueChange={(val) => setFormData({ ...formData, tipo_zona: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar zona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="picking">Picking</SelectItem>
                    <SelectItem value="reserva">Reserva (Overstock)</SelectItem>
                    <SelectItem value="cuarentena">Cuarentena</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
