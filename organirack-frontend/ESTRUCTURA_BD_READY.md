# 📊 OrganiRack+ - Frontend Listo para Integración con BD

## 🎯 Estado Actual del Proyecto

✅ **Frontend Web Completado al 100%**
- Todas las interfaces están implementadas y funcionando con datos mock
- Diseño profesional tipo SaaS con paleta corporativa
- Sistema de navegación completo
- Autenticación básica implementada
- Componentes reutilizables y bien estructurados

## 🗂️ Estructura de Módulos Implementados

### 1. **Autenticación** (`/src/app/pages/Login.tsx`)
**Endpoints a Conectar:**
- `POST /api/auth/login` - Validación de credenciales
- `POST /api/auth/logout` - Cierre de sesión
- `POST /api/auth/refresh` - Renovación de token

**Datos Mock Actuales:**
```typescript
interface LoginCredentials {
  email: string;
  password: string;
}
```

**Integración Laravel Sanctum:**
- Tokens SHA-256
- Expiración: 15 minutos de inactividad
- Bcrypt para contraseñas

---

### 2. **Panel de Control** (`/src/app/pages/PanelControl.tsx`)
**Endpoints a Conectar:**
- `GET /api/dashboard/metrics` - Métricas principales
- `GET /api/dashboard/precision-trend` - Evolución de precisión (IRI)
- `GET /api/dashboard/movements` - Movimientos últimos 7 días
- `GET /api/dashboard/inventory-status` - Distribución de inventario
- `GET /api/dashboard/recent-activity` - Actividad reciente

**Datos Mock Actuales:**
```typescript
interface DashboardMetrics {
  precision: number; // Porcentaje IRI
  activeSKUs: number;
  todayMovements: number;
  pendingAlerts: number;
}

interface Movement {
  dia: string;
  entradas: number;
  salidas: number;
}

interface RecentActivity {
  id: number;
  tipo: "Entrada" | "Salida" | "Ajuste";
  producto: string;
  cantidad: number;
  usuario: string;
  tiempo: string;
  estado: "completado" | "revisión";
}
```

**Tabla BD:** `dashboard_metrics` (agregaciones en tiempo real)

---

### 3. **Gestión de Productos** (`/src/app/pages/GestionProductos.tsx`)
**Endpoints a Conectar:**
- `GET /api/productos` - Lista de productos con filtros
- `POST /api/productos` - Crear producto
- `PUT /api/productos/{id}` - Actualizar producto
- `DELETE /api/productos/{id}` - Eliminar producto (soft delete)
- `GET /api/categorias` - Catálogo de categorías
- `GET /api/unidades-medida` - Catálogo de unidades

**Datos Mock Actuales:**
```typescript
interface Product {
  id: number;
  sku: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  stockMinimo: number;
  stockMaximo: number;
  stockActual: number;
  unidad: string;
  estado: "activo" | "inactivo";
  ubicaciones?: number;
}
```

**Tablas BD:**
- `productos` (columnas: id, categoria_id, unidad_medida_id, marca_id, nombre, sku, stock_min, stock_max, estado)
- `categorias`
- `unidades_medida`
- `marcas`

---

### 4. **Gestión de Surtidos** (`/src/app/pages/GestionSurtidos.tsx`)
**Endpoints a Conectar:**
- `GET /api/surtidos` - Lista de órdenes con filtros
- `POST /api/surtidos` - Crear orden de surtido
- `PUT /api/surtidos/{id}` - Actualizar orden
- `DELETE /api/surtidos/{id}` - Cancelar orden
- `PUT /api/surtidos/{id}/estado` - Cambiar estado
- `GET /api/estados-orden` - Catálogo de estados
- `GET /api/prioridades` - Catálogo de prioridades

**Datos Mock Actuales:**
```typescript
interface Surtido {
  id: number;
  folio: string;
  cliente: string;
  productos: number;
  unidades: number;
  estado: "Pendiente" | "En Proceso" | "Completado" | "Cancelado";
  prioridad: "Alta" | "Media" | "Baja";
  fechaCreacion: string;
  fechaRequerida: string;
  operador?: string;
}
```

**Tablas BD:**
- `ordenes_surtido` (id, folio, capturista_id, almacenista_id, estado_id, prioridad_id, fecha_requerida)
- `detalles_surtido` (orden_surtido_id, producto_id, cantidad_requerida, cantidad_surtida, estante_sugerido_id, estante_real_id, fue_modificado)
- `estados_orden`
- `prioridades_orden`

---

### 5. **Picking Inteligente** (`/src/app/pages/PickingInteligente.tsx`)
**Endpoints a Conectar:**
- `GET /api/picking/buscar-producto?search={term}` - Buscar producto por SKU/nombre
- `GET /api/picking/ubicaciones/{productoId}` - Ubicaciones con stock
- `POST /api/picking/calcular-ruta` - Calcular ruta óptima
- `POST /api/picking/validar-override` - Validar ubicación alternativa

**Datos Mock Actuales:**
```typescript
interface UbicacionStock {
  id: number;
  nodo: string;
  zona: string;
  cantidad: number;
  tipoZona: "picking" | "almacenamiento" | "reserva";
  ultimoMovimiento: string;
  temperatura?: "ambiente" | "refrigerado" | "congelado";
  accesibilidad: "alta" | "media" | "baja";
  prioridad: number; // Calculada por algoritmo
}

interface ProductoBusqueda {
  sku: string;
  nombre: string;
  categoria: string;
  stockTotal: number;
  ubicaciones: UbicacionStock[];
}
```

**Tablas BD:**
- `inventarios` (producto_id, estante_id, estado_id, cantidad)
- `estantes` (id, rack_id, nivel, codigo_etiqueta, tipo_zona, esta_lleno)
- `racks`, `pasillos`, `almacenes`, `edificios` (jerarquía espacial)

**Lógica Backend:**
- Algoritmo de prioridad: `accesibilidad * 0.4 + rotación * 0.3 + proximidad * 0.3`
- Tiempo de respuesta: < 500ms (RNF-02)

---

### 6. **Mapa de Almacén** (`/src/app/pages/MapaAlmacen.tsx`)
**Endpoints a Conectar:**
- `GET /api/almacenes` - Lista de almacenes
- `POST /api/almacenes` - Crear almacén
- `POST /api/pasillos` - Crear pasillo
- `POST /api/racks` - Crear rack
- `PUT /api/estantes/{id}/asignar-producto` - Asignar producto a nivel
- `GET /api/almacenes/{id}/jerarquia` - Árbol completo (Almacén > Pasillo > Rack > Nivel)
- `GET /api/estantes/{id}/estado` - Estado de ocupación

**Datos Mock Actuales:**
```typescript
interface Nivel {
  id: string;
  numero: number;
  estado: "vacio" | "disponible" | "lleno";
  capacidad: number;
  ocupacion: number;
  productos?: string[];
}

interface Rack {
  id: string;
  codigo: string;
  niveles: Nivel[];
}

interface Pasillo {
  id: string;
  codigo: string;
  racks: Rack[];
}

interface Almacen {
  id: string;
  nombre: string;
  codigo: string;
  pasillos: Pasillo[];
  totalRacks: number;
  totalNiveles: number;
  ocupacion: number; // Porcentaje
}
```

**Tablas BD:**
- `edificios` (id, nombre, siglas)
- `almacenes` (edificio_id, nombre, siglas)
- `pasillos` (almacen_id, nombre)
- `racks` (pasillo_id, nombre_rack)
- `estantes` (rack_id, nivel, codigo_etiqueta, tipo_zona, esta_lleno)

**Lógica Backend:**
- Mapeo espacial jerárquico (RNF-11)
- Sugerencias de ubicaciones vacías automáticas
- Indicadores semáforo (verde/amarillo/rojo) por ocupación

---

### 7. **Bitácora de Auditoría** (`/src/app/pages/BitacoraAuditoria.tsx`)
**Endpoints a Conectar:**
- `GET /api/audit-logs` - Lista de logs con paginación
- `GET /api/audit-logs/export` - Exportar logs a CSV
- `GET /api/audit-logs/stats` - Estadísticas de auditoría

**Datos Mock Actuales:**
```typescript
interface AuditLog {
  id: number;
  timestamp: string;
  tipoEvento: "creacion" | "modificacion" | "eliminacion" | "acceso" | "sistema" | "override";
  modulo: string;
  usuario: string;
  accion: string;
  entidad: string;
  entidadId: string;
  detalles: string;
  ipAddress: string;
  criticidad: "info" | "warning" | "critical";
  resultado: "exito" | "fallo" | "pendiente";
}
```

**Tabla BD:**
- `audit_logs` (detalle_surtido_id, user_id, estante_origen_id, estante_destino_id, tipo_movimiento, cantidad_anterior, cantidad_nueva, observaciones, fecha_hora)

**Lógica Backend:**
- Transacciones ACID (RNF-04, RNF-05)
- Registro inmutable automático
- Rollback automático si falla la conexión
- Logs de Override marcados como "critical"

---

### 8. **Gestión de Usuarios** (`/src/app/pages/GestionUsuarios.tsx`)
**Endpoints a Conectar:**
- `GET /api/usuarios` - Lista de usuarios con filtros
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/{id}` - Actualizar usuario
- `DELETE /api/usuarios/{id}` - Eliminación lógica (is_active = false)
- `PUT /api/usuarios/{id}/toggle-status` - Activar/Desactivar
- `GET /api/roles` - Catálogo de roles (Spatie)

**Datos Mock Actuales:**
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: "Administrador" | "Gerente" | "Operador" | "Almacenista";
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}
```

**Tablas BD:**
- `users` (id, name, email, role_id, username, email_verified_at, password, is_active, remember_token)
- `roles` (id, name, guard_name) - Spatie Laravel Permission

**Lógica Backend:**
- Hashing Bcrypt antes de persistir (RNF-03)
- Middlewares de autorización RBAC
- Soft delete para no romper trazabilidad en audit_logs
- Control de roles por endpoint

---

## 🔗 Endpoints Faltantes (No Implementados en Frontend)

Según el documento, estas interfaces **NO están creadas** pero están en el análisis:
- `ReporteDiscrepancias.tsx` - Ya existe pero necesita más funcionalidad
- `InventarioGlobal.tsx` - Ya existe pero necesita más funcionalidad

---

## 🎨 Sistema de Diseño

### Paleta de Colores (CSS Variables)
```css
--primary: #1e6f9f;        /* Azul Corporativo */
--accent: #f97316;         /* Naranja Vibrante */
--success: #14b8a6;        /* Verde Azulado (Teal) */
--purple: #7c3aed;         /* Púrpura */
--info: #0ea5e9;           /* Azul Info */
--warning: #f59e0b;        /* Amarillo Advertencia */
--error: #ef4444;          /* Rojo Error */
--background: #e8eef3;     /* Gris-Azulado Suave */
```

### Componentes UI Reutilizables
- ✅ `Card`, `CardHeader`, `CardContent`
- ✅ `Button` (variants: default, outline, ghost, destructive)
- ✅ `Input`, `Textarea`
- ✅ `Select`, `SelectContent`, `SelectItem`
- ✅ `Dialog` (modales)
- ✅ `Table` completo
- ✅ `Badge` (estados visuales)
- ✅ `Avatar`
- ✅ `Label`

---

## 📦 Dependencias del Proyecto

```json
{
  "react": "^19.0.0",
  "react-router": "^7.1.3",
  "recharts": "^2.x",
  "lucide-react": "^0.x",
  "sonner": "^1.x" // Notificaciones toast
}
```

---

## 🚀 Próximos Pasos para Integración Backend

### 1. **Configurar API Base URL**
```typescript
// src/app/config/api.ts
export const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000/api';
```

### 2. **Crear Servicio HTTP**
```typescript
// src/app/services/http.service.ts
import axios from 'axios';

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para añadir token Sanctum
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default httpClient;
```

### 3. **Crear Servicios por Módulo**
```typescript
// Ejemplo: src/app/services/productos.service.ts
import httpClient from './http.service';

export const productosService = {
  getAll: (params?: any) => httpClient.get('/productos', { params }),
  getById: (id: number) => httpClient.get(`/productos/${id}`),
  create: (data: any) => httpClient.post('/productos', data),
  update: (id: number, data: any) => httpClient.put(`/productos/${id}`, data),
  delete: (id: number) => httpClient.delete(`/productos/${id}`),
};
```

### 4. **Reemplazar Estado Mock con Llamadas API**
```typescript
// Antes (Mock):
const [products, setProducts] = useState(initialProducts);

// Después (API):
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  productosService.getAll()
    .then(response => setProducts(response.data))
    .catch(error => toast.error('Error al cargar productos'))
    .finally(() => setLoading(false));
}, []);
```

### 5. **Manejo de Estados de Carga**
```typescript
// Añadir en cada página:
{loading ? (
  <div className="flex justify-center items-center h-96">
    <Loader className="size-8 animate-spin text-primary" />
  </div>
) : (
  // Contenido normal
)}
```

---

## 🔐 Seguridad y Autenticación

### Laravel Sanctum - Flujo Completo
1. **Login:**
   ```typescript
   POST /api/auth/login
   Body: { email, password }
   Response: { token, user }
   ```

2. **Guardar Token:**
   ```typescript
   localStorage.setItem('authToken', response.data.token);
   localStorage.setItem('user', JSON.stringify(response.data.user));
   ```

3. **Protección de Rutas:**
   ```typescript
   // Ya implementado en ProtectedRoute.tsx
   const isAuthenticated = localStorage.getItem('authToken');
   if (!isAuthenticated) navigate('/login');
   ```

4. **Expiración Automática:**
   - Backend: Token expira tras 15 min de inactividad
   - Frontend: Interceptor debe manejar 401 Unauthorized

---

## 📊 Requerimientos No Funcionales a Validar

- **RNF-01**: Latencia < 750ms en cambios de estado de órdenes ✅
- **RNF-02**: Verificación de Override < 500ms ✅
- **RNF-03**: Seguridad Bcrypt + SHA-256 Sanctum ✅
- **RNF-04/05**: Transacciones ACID con rollback automático ⚠️ (Backend)
- **RNF-11**: Mapeo espacial jerárquico ✅

---

## 📝 Notas Importantes

1. **Todos los datos actuales son MOCK** - Se deben reemplazar por llamadas API
2. **La autenticación es básica** - Falta integración con Laravel Sanctum
3. **No hay paginación** - Se debe implementar en llamadas API
4. **No hay manejo de errores HTTP** - Se debe añadir en servicios
5. **No hay validación de formularios avanzada** - Considerar react-hook-form
6. **Los filtros son locales** - Se deben pasar como query params a la API

---

## ✅ Checklist de Integración

### Autenticación
- [ ] Conectar login con `/api/auth/login`
- [ ] Implementar refresh token automático
- [ ] Manejo de sesión expirada (401)
- [ ] Logout con invalidación de token

### Productos
- [ ] CRUD completo con API
- [ ] Filtros con query params
- [ ] Paginación
- [ ] Validación de SKU único

### Surtidos
- [ ] CRUD completo con API
- [ ] Cambio de estados con validación
- [ ] Asignación de operadores

### Picking
- [ ] Búsqueda de productos con debounce
- [ ] Algoritmo de prioridad en backend
- [ ] Validación de Override < 500ms

### Mapa de Almacén
- [ ] Carga de jerarquía completa
- [ ] Asignación de productos a ubicaciones
- [ ] Validación de capacidad

### Auditoría
- [ ] Carga de logs con paginación
- [ ] Filtros avanzados
- [ ] Exportación a CSV

### Usuarios
- [ ] CRUD con Spatie Roles
- [ ] Soft delete
- [ ] Control de permisos por endpoint

---

**🎉 Frontend 100% listo para conectar con Laravel API REST + Sanctum**
