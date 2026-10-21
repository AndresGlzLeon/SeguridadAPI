# Cliente HTTP Axios - Guía de Uso

## 📦 Estructura

```
src/app/lib/
├── axios.ts          ← Cliente HTTP configurado (instancia de axios)
├── auth.ts           ← Autenticación y login
└── apiServices.ts    ← Servicios de API (endpoints centralizados)
```

## 🔧 Características del Cliente Axios

- ✅ **BaseURL automática**: Lee de `VITE_API_BASE_URL` o usa `http://localhost:8000`
- ✅ **Token automático**: Agrega `Authorization: Bearer {token}` a cada request
- ✅ **Timeout**: 8 segundos para todas las peticiones
- ✅ **Manejo de 401**: Limpia la sesión automáticamente si expira el token
- ✅ **Headers predeterminados**: `Content-Type: application/json`

## 📝 Ejemplos de Uso

### 1. Login (sin autenticación previa)

```typescript
import { loginRequest, saveAuthSession } from '@/app/lib/auth';

try {
  const response = await loginRequest({
    username: 'admin',
    password: 'password123'
  });
  
  // Guardar token y usuario
  saveAuthSession(response.token, response.user);
  
  console.log('Logged in:', response.user.username);
} catch (error) {
  console.error('Login failed:', error);
}
```

### 2. Obtener Usuario Actual (requiere autenticación)

```typescript
import { getCurrentUser } from '@/app/lib/apiServices';

try {
  const user = await getCurrentUser();
  console.log('User:', user.name);
  // El token se agrega automáticamente gracias al interceptor
} catch (error) {
  console.error('Failed to fetch user:', error);
}
```

### 3. Obtener Datos del Dashboard

```typescript
import { 
  getOrdersByState, 
  getOrdersByPriority,
  getDashboardMetrics 
} from '@/app/lib/apiServices';

async function loadDashboard() {
  try {
    const [orders, priority, metrics] = await Promise.all([
      getOrdersByState(),
      getOrdersByPriority(),
      getDashboardMetrics()
    ]);
    
    console.log('Dashboard data loaded:', { orders, priority, metrics });
  } catch (error) {
    console.error('Dashboard error:', error);
  }
}
```

### 4. Hacer Petición Personalizada

Si necesitas un endpoint no listado en `apiServices.ts`, puedes usar el cliente directamente:

```typescript
import axiosInstance from '@/app/lib/axios';

// GET
const data = await axiosInstance.get('/some-endpoint');

// POST
const result = await axiosInstance.post('/some-endpoint', {
  key: 'value'
});

// PUT
await axiosInstance.put('/some-endpoint/123', { updated: 'data' });

// DELETE
await axiosInstance.delete('/some-endpoint/123');
```

## 🔐 Cómo Funciona la Autenticación

### Flujo Automático:

1. **Usuario realiza login** → Token se guarda en localStorage
2. **Usuario hace cualquier petición autenticada** → Interceptor agrega `Authorization: Bearer {token}`
3. **Si token expira (error 401)** → Interceptor limpia localStorage automáticamente
4. **Redirigir al login** (manejarlo en el componente que consume la API)

### Código del Interceptor (en axios.ts):

```typescript
axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;  // ← Se agrega automáticamente
  }
  
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession();  // ← Limpia el token si expira
    }
    return Promise.reject(error);
  }
);
```

## 🛠️ Integración en Componentes React

### Ejemplo: Componente de Dashboard

```typescript
import { useEffect, useState } from 'react';
import { getDashboardMetrics } from '@/app/lib/apiServices';

export function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(metrics, null, 2)}</pre>
    </div>
  );
}
```

## ⚙️ Variables de Entorno

### `.env.local.example`

```env
# Variable opcional para cambiar la URL del backend
VITE_API_BASE_URL=http://localhost:8000
```

Si no están definidas, axios usa `http://localhost:8000` por defecto.

## 🧪 Testing desde Consola del Navegador

Con el cliente axios configurado, puedes probar desde DevTools:

```javascript
// Importar el cliente
import axiosInstance from '@/app/lib/axios';
import { getCurrentUser, getDashboardMetrics } from '@/app/lib/apiServices';

// Probar endpoint autenticado
getCurrentUser().then(user => console.log('User:', user));

// Probar endpoint del dashboard
getDashboardMetrics().then(data => console.log('Metrics:', data));

// O usar axios directamente
axiosInstance.get('/dashboard/orders-by-state').then(res => console.log(res.data));
```

## 📊 Comparación: fetch() vs axios

| Característica | fetch() | axios |
|---|---|---|
| Token automático | ❌ Manual | ✅ Automático |
| Interceptores | ❌ No nativos | ✅ Nativos |
| Manejo de 401 | ❌ Manual | ✅ Automático |
| Código repetitivo | 😞 Alto | 😊 Bajo |
| Instalación | ✅ Nativa | ⚠️ npm install |

## 🚀 Next Steps

1. **Axios ya está instalado**:
   ```bash
   npm install axios  # Ya instalado
   ```

2. **Importar en componentes**:
   ```typescript
   import { getCurrentUser } from '@/app/lib/apiServices';
   ```

3. **Usar en useEffect y componentes**:
   ```typescript
   useEffect(() => {
     getCurrentUser().catch(err => console.error(err));
   }, []);
   ```

## 📞 Troubleshooting

**Problema: "axios is not defined"**
- Asegúrate de que axios está en `node_modules` (debería estar)
- Si no: `npm install axios`

**Problema: CORS error todavía**
- Verifica que el backend esté corriendo en `http://localhost:8000`
- Verifica que `config/cors.php` incluya `http://localhost:5173`

**Problema: Token no se envía**
- Verifica que `getAuthToken()` retorna un valor en localStorage
- Abre DevTools → Network → Headers → verifica `Authorization: Bearer ...`
