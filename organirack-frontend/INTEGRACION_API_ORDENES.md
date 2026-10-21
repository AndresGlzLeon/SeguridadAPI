# 🔗 Guía de Integración: Frontend React ↔ Backend API Órdenes

**Objetivo**: Conectar el componente `GestionSurtidos.tsx` con la API REST de órdenes

---

## 📌 Resumen de Cambios Necesarios

| Componente | Cambio | Estado |
|-----------|--------|--------|
| `GestionSurtidos.tsx` | Reemplazar datos dummy con llamadas API | ⏳ Pendiente |
| `OrderService.ts` (nuevo) | Cliente HTTP para órdenes | ⏳ Pendiente |
| `.env` | Configurar `VITE_API_URL` | ⏳ Pendiente |

---

## 🔧 Paso 1: Cliente HTTP - `services/orderService.ts`

**Localización**: `organirack-frontend/src/services/orderService.ts`

```typescript
import axios, { AxiosInstance } from 'axios';

/**
 * Cliente HTTP para interactuar con la API de órdenes
 * Gestión completa de operaciones CRUD
 */
class OrderService {
  private api: AxiosInstance;
  private baseURL: string = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Interceptor para agregar token Sanctum
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para manejar errores
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado, redirigir a login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Obtiene lista de órdenes con filtros y paginación
   */
  async getOrders(params?: {
    estado_id?: number;
    prioridad_id?: number;
    search?: string;
    per_page?: number;
    page?: number;
  }) {
    try {
      const response = await this.api.get('/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      throw error;
    }
  }

  /**
   * Obtiene una orden específica
   */
  async getOrder(id: number) {
    try {
      const response = await this.api.get(`/orders/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error al obtener orden ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crea una nueva orden
   */
  async createOrder(data: {
    prioridad_id: number;
    referencia_destino?: string;
    fecha_requerida?: string;
    detalles: Array<{
      producto_id: number;
      cantidad_requerida: number;
      estante_sugerido_id?: number;
    }>;
  }) {
    try {
      const response = await this.api.post('/orders', data);
      return response.data.data;
    } catch (error) {
      console.error('Error al crear orden:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una orden
   */
  async updateOrderStatus(id: number, estadoId: number) {
    try {
      // Nota: Este endpoint necesita ser creado en el backend
      const response = await this.api.patch(`/orders/${id}/status`, {
        estado_id: estadoId,
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error al actualizar estado de orden ${id}:`, error);
      throw error;
    }
  }

  /**
   * Asigna un almacenista a una orden
   */
  async assignAlmacenista(id: number, almacenistaId: number) {
    try {
      // Nota: Este endpoint necesita ser creado en el backend
      const response = await this.api.patch(`/orders/${id}/almacenista`, {
        almacenista_id: almacenistaId,
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error al asignar almacenista a orden ${id}:`, error);
      throw error;
    }
  }
}

export default new OrderService();
```

---

## 🎨 Paso 2: Modificar `GestionSurtidos.tsx`

**Cambios principales**:
1. Reemplazar `initialSurtidos` con llamadas a la API
2. Usar `useEffect` para cargar datos
3. Reemplazar operaciones locales con llamadas API

### Diferencias clave:

```typescript
// ANTES (Dummy Data)
const [surtidos, setSurtidos] = useState<Surtido[]>(initialSurtidos);

// DESPUÉS (API)
const [surtidos, setSurtidos] = useState<Surtido[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  fetchOrdenes();
}, [filterEstado, filterPrioridad, searchTerm]);
```

### Mapeo de campos:

| Frontend (GestionSurtidos) | Backend (API) | Notas |
|---------------------------|---------------|-------|
| `folio` | `folio` | ✅ Igual |
| `cliente` | `referencia_destino` | ⚠️ Campo diferente |
| `productos` | `detalles.length` | 📊 Calcular |
| `unidades` | `SUM(detalles.cantidad_requerida)` | 📊 Calcular |
| `prioridad` | `prioridad.nombre` | ✅ Desde relación |
| `estado` | `estado.nombre` | ✅ Desde relación |
| `fechaCreacion` | `created_at` | ✅ Igual formato |
| `fechaRequerida` | `fecha_requerida` | ✅ Igual |
| `surtidor` | `almacenista.name` | ✅ Desde relación |
| `nodo` | No existe en API | ❌ Agregar? |

---

## 💾 Paso 3: Integración Completa - `GestionSurtidos.tsx`

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { /* ... imports ... */ } from "recharts";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import orderService from "../services/orderService"; // 🆕 Import del servicio

interface Surtido {
  id: number;
  folio: string;
  cliente: string;
  productos: number;
  unidades: number;
  prioridad: "alta" | "media" | "baja";
  estado: "pendiente" | "en_proceso" | "completado" | "cancelado";
  fechaCreacion: string;
  fechaRequerida: string;
  surtidor?: string;
  nodo: string;
  observaciones?: string;
}

export function GestionSurtidos() {
  const [surtidos, setSurtidos] = useState<Surtido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ... resto del state ...

  // 🆕 Cargar órdenes del backend
  const fetchOrdenes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getOrders({
        search: searchTerm,
        estado_id: filterEstado === 'todos' ? undefined : mapearEstadoAlId(filterEstado),
        prioridad_id: filterPrioridad === 'todas' ? undefined : mapearPrioridadAlId(filterPrioridad),
      });

      // Mapear datos de API al formato del componente
      const datosFormateados = response.data.map((orden: any) => ({
        id: orden.id,
        folio: orden.folio,
        cliente: orden.referencia_destino || 'Sin referencia',
        productos: orden.detalles?.length || 0,
        unidades: orden.detalles?.reduce(
          (sum: number, d: any) => sum + parseFloat(d.cantidad_requerida),
          0
        ) || 0,
        prioridad: mapearPrioridad(orden.prioridad?.nombre),
        estado: mapearEstado(orden.estado?.nombre),
        fechaCreacion: new Date(orden.created_at).toLocaleString(),
        fechaRequerida: orden.fecha_requerida 
          ? new Date(orden.fecha_requerida).toLocaleString()
          : 'No especificada',
        surtidor: orden.almacenista?.name,
        nodo: 'Almacén Principal', // Valor por defecto
        observaciones: '',
      }));

      setSurtidos(datosFormateados);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error al cargar órdenes');
      console.error('Error fetching órdenes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar órdenes al montar componente
  useEffect(() => {
    fetchOrdenes();
  }, [searchTerm, filterEstado, filterPrioridad]);

  // 🆕 Crear orden
  const handleSave = async () => {
    if (editingSurtido) {
      // TODO: Implementar edición (PUT endpoint no existe aún)
      toast.info('Edición aún no implementada');
    } else {
      try {
        // Validar campos
        if (!formData.cliente || !formData.productos || !formData.unidades || !formData.prioridad) {
          toast.error('Por favor completa todos los campos requeridos');
          return;
        }

        // Preparar datos para la API
        const ordenData = {
          prioridad_id: 1, // Mapear desde formData.prioridad
          referencia_destino: formData.cliente,
          fecha_requerida: formData.fechaRequerida,
          detalles: [
            // Necesitas un sub-formulario para agregar productos
            {
              producto_id: formData.productos, // ⚠️ Necesita cambio
              cantidad_requerida: formData.unidades,
            },
          ],
        };

        const nuevaOrden = await orderService.createOrder(ordenData);
        
        toast.success('Orden creada correctamente');
        setDialogOpen(false);
        fetchOrdenes(); // Recargar lista
      } catch (err: any) {
        toast.error('Error al crear orden');
        console.error('Error creating order:', err);
      }
    }
  };

  // 🆕 Cambiar estado
  const handleCambiarEstado = async (id: number, nuevoEstado: Surtido["estado"]) => {
    try {
      // Mapear estado a ID
      const estadoId = mapearEstadoAlId(nuevoEstado);
      
      // Actualizar en backend
      // await orderService.updateOrderStatus(id, estadoId);
      
      // Actualizar localmente mientras se implementa el endpoint
      setSurtidos(
        surtidos.map((s) =>
          s.id === id ? { ...s, estado: nuevoEstado } : s
        )
      );
      
      toast.success(`Estado actualizado a: ${nuevoEstado.replace("_", " ")}`);
    } catch (err: any) {
      toast.error('Error al actualizar estado');
      console.error('Error updating status:', err);
    }
  };

  // 🆕 Funciones ayudantes de mapeo
  const mapearPrioridad = (prioridad: string): Surtido["prioridad"] => {
    const map: Record<string, Surtido["prioridad"]> = {
      "Alta": "alta",
      "Media": "media",
      "Baja": "baja",
    };
    return map[prioridad] || "media";
  };

  const mapearEstado = (estado: string): Surtido["estado"] => {
    const map: Record<string, Surtido["estado"]> = {
      "Pendiente": "pendiente",
      "En Proceso": "en_proceso",
      "Completado": "completado",
      "Cancelado": "cancelado",
    };
    return map[estado] || "pendiente";
  };

  // ... resto del componente ...
}
```

---

## 🌍 Paso 4: Configuración de Variables de Entorno

**Archivo**: `organirack-frontend/.env`

```env
VITE_API_URL=http://localhost:8000/api
VITE_AUTH_TOKEN_KEY=auth_token
```

---

## 📊 Paso 5: Actualizar Estadísticas desde API

```typescript
// ANTES
const estadoData = [
  { name: "Pendiente", value: initialSurtidos.filter(s => s.estado === "pendiente").length },
  // ...
];

// DESPUÉS
useEffect(() => {
  const calcularEstadisticas = () => {
    const estados = surtidos.reduce((acc, surtido) => {
      acc[surtido.estado] = (acc[surtido.estado] || 0) + 1;
      return acc;
    }, {} as Record<Surtido["estado"], number>);

    const estadoData = [
      { name: "Pendiente", value: estados.pendiente || 0 },
      { name: "En Proceso", value: estados.en_proceso || 0 },
      { name: "Completado", value: estados.completado || 0 },
      { name: "Cancelado", value: estados.cancelado || 0 },
    ];

    // Actualizar estado...
  };

  calcularEstadisticas();
}, [surtidos]);
```

---

## 🚀 Paso 6: Testing Manual

### Test 1️⃣: Cargar lista de órdenes
```bash
curl -X GET http://localhost:8000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

### Test 2️⃣: Crear nueva orden desde formulario
1. Abrir formulario "Nuevo Surtido"
2. Llenar campos
3. Ver en console: `📦 Datos validados para crear orden`
4. Verificar que aparezca en lista

### Test 3️⃣: Cambiar estado
1. Hacer clic en "Iniciar" o "Completar"
2. Ver logs en backend: `Estado actualizado a: ...`
3. Actualizar lista automáticamente

---

## ⚠️ Pendientes en Backend

Estos endpoints aún necesitan ser implementados:

```php
// 1. Actualizar estado de orden
Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus'])
    ->name('orders.update-status');

// 2. Asignar almacenista
Route::patch('/orders/{order}/almacenista', [OrderController::class, 'assignAlmacenista'])
    ->name('orders.assign-almacenista');

// 3. Completar orden
Route::post('/orders/{order}/complete', [OrderController::class, 'complete'])
    ->name('orders.complete');
```

---

## 🔍 Debugging

### Habilitar logs en el servicio
```typescript
// Agregar al OrderService
private log(message: string, data?: any) {
  console.log(`🔗 OrderService: ${message}`, data);
}
```

### Ver requests en Network
1. Abrir DevTools (F12)
2. Tab "Network"
3. Filtrar por "orders"
4. Ver headers y payload

### Verificar token
```typescript
console.log('Token:', localStorage.getItem('auth_token'));
```

---

## 📋 Checklist de Integración

- [ ] Servicio HTTP creado en `services/orderService.ts`
- [ ] Componente `GestionSurtidos.tsx` actualizado
- [ ] Endpoints de formulario funcionando (POST)
- [ ] Lista actualiza automáticamente
- [ ] Filtros funcionan correctamente
- [ ] Cambio de estado se refleja en API
- [ ] Manejo de errores implementado
- [ ] Validaciones en formulario
- [ ] Pruebas end-to-end completadas

---

**Nota Final**: Este documento será actualizado conforme avance la integración.
