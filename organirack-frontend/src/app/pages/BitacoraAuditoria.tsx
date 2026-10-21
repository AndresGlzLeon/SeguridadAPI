import { ChangeEvent, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import {
  Activity,
  ArrowRightLeft,
  Calendar,
  Eye,
  Filter,
  Package,
  Search,
  User,
  Warehouse,
} from 'lucide-react';
import { toast } from 'sonner';
import auditService, {
  AuditLog,
  AuditFilterOptions,
  AuditLogFilters,
} from '../../services/AuditService';

// ====== CONSTANTES ======
const INITIAL_FILTERS: AuditLogFilters = {
  search: '',
  date_from: '',
  date_to: '',
  per_page: 15,
  page: 1,
};

const DEBOUNCE_DELAY_MS = 400;

const INITIAL_PAGINATION = {
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
  from: 0,
  to: 0,
};

// ====== HELPERS LOCALES ======
function getMovementBadgeStyle(tipo: string): string {
  const styles: Record<string, string> = {
    override: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    ajuste_manual: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    vaciado_manual: 'bg-red-500/15 text-red-400 border-red-500/30',
    picking: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    reconteo: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  };
  return styles[tipo] ?? 'bg-muted text-muted-foreground border-border';
}

function getMovementIcon(tipo: string): string {
  const icons: Record<string, string> = {
    override: '🔄',
    ajuste_manual: '✏️',
    vaciado_manual: '🗑️',
    picking: '📦',
    reconteo: '🔢',
    entrada: '📥',
    salida: '📤',
  };
  return icons[tipo] ?? '📝';
}

function getMovementLabel(tipo: string): string {
  const labels: Record<string, string> = {
    override: 'Override',
    ajuste_manual: 'Ajuste Manual',
    vaciado_manual: 'Vaciado Manual',
    picking: 'Picking',
    reconteo: 'Reconteo',
    entrada: 'Entrada',
    salida: 'Salida',
  };
  return labels[tipo] ?? tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 7) return `hace ${diffDays}d`;
    return formatDateTime(dateString);
  } catch {
    return dateString;
  }
}

// ====== COMPONENTE PRINCIPAL ======
export function BitacoraAuditoria() {
  const [filters, setFilters] = useState<AuditLogFilters>(INITIAL_FILTERS);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterOptions, setFilterOptions] = useState<AuditFilterOptions>({
    users: [],
    movement_types: [],
  });
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);

  // ====== EFECTO: CARGAR AUDITORÍA CUANDO FILTROS CAMBIAN ======
  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await auditService.getAuditLogs(filters);

        setLogs(response.data ?? []);
        setFilterOptions(response.filters ?? { users: [], movement_types: [] });
        setPagination({
          current_page: response.pagination.current_page,
          per_page: response.pagination.per_page,
          total: response.pagination.total,
          last_page: response.pagination.last_page,
          from: response.pagination.from ?? 0,
          to: response.pagination.to ?? 0,
        });
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'No se pudo cargar la bitácora de auditoría';
        toast.error(typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : errorMsg);
        console.error('Error al cargar auditoría:', err);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [filters]);

  // ====== HANDLERS ======
  const handleFilterChange = (partial: Partial<AuditLogFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial, page: 1 }));
  };

  const handlePagination = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const hasActiveFilters =
    filters.search ||
    filters.causer_id ||
    filters.tipo_movimiento ||
    filters.date_from ||
    filters.date_to;

  return (
    <div className="space-y-6">
      {/* ====== HEADER ====== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-info to-accent bg-clip-text text-transparent">
            Bitácora de Auditoría
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Registro trazable de todos los movimientos logísticos del WMS
          </p>
        </div>
        <Badge className="bg-success/20 text-success border-success/30 gap-1.5 px-3 py-1.5">
          <Activity className="size-4" />
          {pagination.total} registro{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* ====== FILTROS ====== */}
      <Card className="border border-border shadow-xl overflow-hidden bg-card">
        <CardHeader className="bg-gradient-to-br from-muted/30 to-transparent border-b border-border py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="size-5 text-primary" />
            Filtros de Búsqueda
          </CardTitle>
          <CardDescription>
            Filtra por operador, tipo de movimiento, texto o rango de fechas.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Buscador de texto */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={filters.search ?? ''}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleFilterChange({ search: event.target.value })
                }
                placeholder="Buscar en observaciones, cantidades..."
                className="pl-10"
              />
            </div>

            {/* Filtro por operador */}
            <Select
              value={filters.causer_id ? String(filters.causer_id) : 'all'}
              onValueChange={(value: string) =>
                handleFilterChange({ causer_id: value === 'all' ? undefined : Number(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por operador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los operadores</SelectItem>
                {(filterOptions.users ?? []).map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por tipo de movimiento */}
            <Select
              value={filters.tipo_movimiento ?? 'all'}
              onValueChange={(value: string) =>
                handleFilterChange({ tipo_movimiento: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de movimiento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {(filterOptions.movement_types ?? []).map((mt) => (
                  <SelectItem key={mt.value} value={mt.value}>
                    {getMovementIcon(mt.value)} {mt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rango de fechas y botón limpiar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground font-medium shrink-0">Rango de fechas:</span>
              <div className="flex items-center gap-2">
                <label className="text-muted-foreground text-xs shrink-0">Desde</label>
                <Input
                  type="date"
                  value={filters.date_from ?? ''}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    handleFilterChange({ date_from: event.target.value || undefined })
                  }
                  className="w-[155px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-muted-foreground text-xs shrink-0">Hasta</label>
                <Input
                  type="date"
                  value={filters.date_to ?? ''}
                  min={filters.date_from ?? ''}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    handleFilterChange({ date_to: event.target.value || undefined })
                  }
                  className="w-[155px]"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="ml-auto shrink-0">
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ====== TABLA DE REGISTROS ====== */}
      <Card className="border border-border shadow-xl overflow-hidden bg-card">
        <CardHeader className="bg-gradient-to-br from-muted/20 to-transparent border-b border-border py-4">
          <CardTitle>Registros de Auditoría</CardTitle>
          <CardDescription>
            {loading
              ? 'Cargando...'
              : `Mostrando ${pagination.from} a ${pagination.to} de ${pagination.total}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Fecha y Hora</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Tipo de Movimiento</TableHead>
                  <TableHead className="text-center">Cant. Anterior</TableHead>
                  <TableHead className="text-center">Cant. Nueva</TableHead>
                  <TableHead>Observaciones</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
                        Cargando registros...
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!loading && logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      No se encontraron registros para los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">
                            {formatDateTime(log.fecha_hora)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getRelativeTime(log.fecha_hora)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="size-3.5 text-muted-foreground" />
                          <span className="text-sm">
                            {log.user?.name ?? `Usuario #${log.user_id}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`font-medium gap-1 ${getMovementBadgeStyle(log.tipo_movimiento)}`}
                        >
                          {getMovementIcon(log.tipo_movimiento)}{' '}
                          {getMovementLabel(log.tipo_movimiento)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-mono text-red-400">
                          {log.cantidad_anterior}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-mono text-emerald-400">
                          {log.cantidad_nueva}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={log.observaciones ?? ''}>
                        <span className="text-sm text-muted-foreground">
                          {log.observaciones ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="size-4 mr-1" />
                          Detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {pagination.current_page} de {pagination.last_page}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current_page <= 1}
                onClick={() => handlePagination(pagination.current_page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => handlePagination(pagination.current_page + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ====== MODAL DE DETALLE ====== */}
      <Dialog
        open={Boolean(selectedLog)}
        onOpenChange={(open: boolean) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Detalle del Registro #{selectedLog?.id}
            </DialogTitle>
            <DialogDescription>
              Información completa del movimiento logístico registrado.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 max-h-[65vh] overflow-auto pr-1">
              {/* Info general */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-muted/40 p-3 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Tipo de Movimiento</p>
                  <Badge
                    variant="outline"
                    className={`font-medium gap-1 ${getMovementBadgeStyle(selectedLog.tipo_movimiento)}`}
                  >
                    {getMovementIcon(selectedLog.tipo_movimiento)}{' '}
                    {getMovementLabel(selectedLog.tipo_movimiento)}
                  </Badge>
                </div>
                <div className="bg-muted/40 p-3 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Operador</p>
                  <p className="font-medium flex items-center gap-1.5">
                    <User className="size-3.5" />
                    {selectedLog.user?.name ?? `Usuario #${selectedLog.user_id}`}
                  </p>
                </div>
                <div className="bg-muted/40 p-3 rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Fecha y Hora</p>
                  <p className="font-medium flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    {formatDateTime(selectedLog.fecha_hora)}
                  </p>
                </div>
              </div>

              {/* Cantidades */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/40 px-4 py-2 text-sm font-semibold flex items-center gap-2">
                  <ArrowRightLeft className="size-4 text-primary" />
                  Cambio de Cantidades
                </div>
                <div className="grid grid-cols-3 text-center p-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Cantidad Anterior</p>
                    <p className="text-2xl font-bold text-red-400 font-mono">
                      {selectedLog.cantidad_anterior}
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRightLeft className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Cantidad Nueva</p>
                    <p className="text-2xl font-bold text-emerald-400 font-mono">
                      {selectedLog.cantidad_nueva}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ubicaciones */}
              {(selectedLog.estante_origen || selectedLog.estante_destino) && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/40 px-4 py-2 text-sm font-semibold flex items-center gap-2">
                    <Warehouse className="size-4 text-primary" />
                    Ubicaciones
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 text-sm">
                    {selectedLog.estante_origen && (
                      <div className="bg-muted/20 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Estante Origen</p>
                        <p className="font-mono font-medium">
                          {selectedLog.estante_origen.codigo_etiqueta}
                        </p>
                      </div>
                    )}
                    {selectedLog.estante_destino && (
                      <div className="bg-muted/20 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Estante Destino</p>
                        <p className="font-mono font-medium">
                          {selectedLog.estante_destino.codigo_etiqueta}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detalle de Surtido (Override) */}
              {selectedLog.detalle_surtido && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/40 px-4 py-2 text-sm font-semibold flex items-center gap-2">
                    <Package className="size-4 text-primary" />
                    Detalle de Surtido Asociado
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 text-sm">
                    {selectedLog.detalle_surtido.producto && (
                      <div className="bg-muted/20 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Producto</p>
                        <p className="font-medium">
                          {selectedLog.detalle_surtido.producto.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          SKU: {selectedLog.detalle_surtido.producto.sku}
                        </p>
                      </div>
                    )}
                    <div className="bg-muted/20 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">¿Fue Modificado?</p>
                      <Badge
                        variant="outline"
                        className={
                          selectedLog.detalle_surtido.fue_modificado
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }
                      >
                        {selectedLog.detalle_surtido.fue_modificado ? 'Sí (Override)' : 'No'}
                      </Badge>
                    </div>
                    {selectedLog.detalle_surtido.estante_sugerido && (
                      <div className="bg-muted/20 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Estante Sugerido</p>
                        <p className="font-mono font-medium">
                          {selectedLog.detalle_surtido.estante_sugerido.codigo_etiqueta}
                        </p>
                      </div>
                    )}
                    {selectedLog.detalle_surtido.estante_real && (
                      <div className="bg-muted/20 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Estante Real</p>
                        <p className="font-mono font-medium">
                          {selectedLog.detalle_surtido.estante_real.codigo_etiqueta}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {selectedLog.observaciones && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Observaciones</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.observaciones}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
