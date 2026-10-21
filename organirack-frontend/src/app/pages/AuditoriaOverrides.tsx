import { ChangeEvent, useEffect, useMemo, useState } from 'react';
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
import { Badge } from '../components/ui/badge';
import {
  AlertTriangle,
  Calendar,
  Download,
  FileText,
  Package,
  Search,
  TrendingDown,
  TrendingUp,
  User,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import auditOverrideService, {
  AuditOverride,
  AuditOverrideFilterOptions,
  AuditOverrideFilters,
  AuditOverrideKPIs,
  AuditOverridePagination,
} from '../../services/AuditOverrideService';

// ====== CONSTANTES ======
const INITIAL_FILTERS: AuditOverrideFilters = {
  user_id: undefined,
  date_from: '',
  date_to: '',
  sku: '',
  page: 1,
  per_page: 15,
};

// ====== COMPONENTE ======
export default function AuditoriaOverrides() {
  // Estados
  const [overrides, setOverrides] = useState<AuditOverride[]>([]);
  const [pagination, setPagination] = useState<AuditOverridePagination | null>(null);
  const [kpis, setKpis] = useState<AuditOverrideKPIs | null>(null);
  const [filters, setFilters] = useState<AuditOverrideFilters>(INITIAL_FILTERS);
  const [filterOptions, setFilterOptions] = useState<AuditOverrideFilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos
  const loadOverrides = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await auditOverrideService.getAuditOverrides(filters);

      setOverrides(response.data);
      setPagination(response.pagination);
      setKpis(response.kpis);
      setFilterOptions(response.filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error('Error al cargar overrides', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadOverrides();
  }, [filters.page]);

  // Handlers de filtros
  const handleFilterChange = (key: keyof AuditOverrideFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Resetear página al cambiar filtros
    }));
  };

  const handleApplyFilters = () => {
    loadOverrides();
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
    loadOverrides();
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Determinar si la cantidad cambió (para resaltar)
  const getCantidadBadgeVariant = (anterior: number, nueva: number) => {
    if (nueva < anterior) return 'destructive';
    if (nueva > anterior) return 'default';
    return 'secondary';
  };

  // Exportar a Excel (placeholder)
  const handleExportExcel = () => {
    toast.info('Funcionalidad de exportación próximamente disponible');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            Auditoría de Overrides
          </h1>
          <p className="text-muted-foreground">
            Monitoreo de discrepancias forzadas en el sistema de picking
          </p>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Overrides (Mes Actual)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.total_overrides_mes_actual}</div>
              <p className="text-xs text-muted-foreground">
                Discrepancias forzadas este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Producto con Más Overrides
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpis.producto_mas_overrides ? (
                <>
                  <div className="text-2xl font-bold">
                    {kpis.producto_mas_overrides.total_overrides}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {kpis.producto_mas_overrides.nombre} ({kpis.producto_mas_overrides.sku})
                  </p>
                </>
              ) : (
                <div className="text-2xl font-bold">N/A</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Panel de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
          <CardDescription>
            Filtra los overrides por usuario, rango de fechas o SKU del producto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Usuario */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuario</label>
              <Select
                value={filters.user_id?.toString() || ''}
                onValueChange={(value) =>
                  handleFilterChange('user_id', value ? parseInt(value) : undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los usuarios</SelectItem>
                  {filterOptions?.usuarios.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha Desde */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Desde</label>
              <Input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>

            {/* Fecha Hasta */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Hasta</label>
              <Input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU del Producto</label>
              <Input
                placeholder="Buscar por SKU..."
                value={filters.sku || ''}
                onChange={(e) => handleFilterChange('sku', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={handleClearFilters} disabled={loading}>
              Limpiar Filtros
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Overrides */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Overrides</CardTitle>
          <CardDescription>
            Lista de todas las discrepancias forzadas detectadas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo Movimiento</TableHead>
                    <TableHead>Cantidad Anterior</TableHead>
                    <TableHead>Cantidad Nueva</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overrides.map((override) => (
                    <TableRow key={override.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(override.fecha_hora)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {override.user.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{override.detalleSurtido.producto.nombre}</div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {override.detalleSurtido.producto.sku}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{override.tipo_movimiento}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {override.cantidad_anterior}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getCantidadBadgeVariant(override.cantidad_anterior, override.cantidad_nueva)}>
                          {override.cantidad_nueva}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {override.observaciones || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {overrides.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron overrides con los filtros aplicados
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {pagination.from}-{pagination.to} de {pagination.total} resultados
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={pagination.current_page === 1 || loading}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page || loading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}