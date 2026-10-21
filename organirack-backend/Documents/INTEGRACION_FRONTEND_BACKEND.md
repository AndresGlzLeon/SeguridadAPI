# INTEGRACIÓN FRONTEND-BACKEND: ARQUITECTURA HEADLESS

**Versión:** 1.0  
**Fecha:** Marzo 2026  
**Autor:** Arquitecto Senior  
**Objetivo:** Guía completa para la integración sin fricciones entre Laravel API (Backend) y React/Vite (Frontend)

---

## 📋 TABLA DE CONTENIDOS

1. [Arquitectura General](#arquitectura-general)
2. [Configuración de CORS](#configuración-de-cors)
3. [Autenticación: SPA vs API](#autenticación-spa-vs-api)
4. [Configuración del Cliente HTTP (Axios)](#configuración-del-cliente-http-axios)
5. [Estructura Estándar de Respuestas JSON](#estructura-estándar-de-respuestas-json)
6. [Manejo de Errores](#manejo-de-errores)
7. [Checklist de Despliegue Local](#checklist-de-despliegue-local)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ ARQUITECTURA GENERAL

### Diagrama de Comunicación

```
┌─────────────────────────────────────────┐
│                                         │
│  FRONTEND (React/Vite)                  │
│  http://localhost:5173                  │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  Componentes Vue / React           │ │
│  │  ├── axios.js (Cliente HTTP)       │ │
│  │  ├── Stores (Pinia)                │ │
│  │  └── Services (API calls)          │ │
│  └────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
              │
              │ HTTP Requests (CORS)
              │ ↓
┌─────────────────────────────────────────┐
│                                         │
│  BACKEND (Laravel API - Headless)       │
│  http://localhost:8000                  │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  API Routes (routes/api.php)       │ │
│  │  ├── POST   /api/login             │ │
│  │  ├── GET    /api/user              │ │
│  │  ├── GET    /api/dashboard/*       │ │
│  │  └── POST   /api/picking/*         │ │
│  │                                    │ │
│  │  Controllers (JSON responses)      │ │
│  │  └── return response()->json(...)  │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │  Middleware                        │ │
│  │  ├── CORS (Sanctum)                │ │
│  │  ├── auth:sanctum                  │ │
│  │  └── Validaciones                  │ │
│  └────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
              │
              │ JSON Responses
              └──────────────────────────→
```

### Puntos Clave

- **Backend es 100% API:** No renderiza vistas HTML. Solo retorna JSON.
- **Frontend es una SPA:** React/Vite maneja toda la UI independientemente.
- **Autenticación Symmetrique:** Sanitum para tokens (móvil) y Cookies CSRF (web).
- **Comunicación Stateless:** Cada request es independiente con token o cookie.

---

## 🔐 CONFIGURACIÓN DE CORS

### ¿Por qué CORS?

Cuando el frontend está en `localhost:5173` y el backend en `localhost:8000`, el navegador aplica políticas CORS. Sin configuración correcta, obtendrás errores como:

```
Access to XMLHttpRequest at 'http://localhost:8000/api/login' from origin 
'http://localhost:5173' has been blocked by CORS policy
```

### Configuración en `config/cors.php`

**Estado Actual (CORRECTO):**

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    
    'allowed_methods' => ['*'],
    
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',        // Móvil simulada
        'http://127.0.0.1:3000',
    ],
    
    'allowed_origins_patterns' => [],
    
    'allowed_headers' => ['*'],
    
    'exposed_headers' => ['Authorization'],
    
    'max_age' => 3600,
    
    'supports_credentials' => true,  // CRÍTICO para cookies y CORS
];
```

### Detalles Importantes

### Detalles Importantes

| Propiedad | Valor | Razón |
|-----------|-------|-------|
| `paths` | `['api/*', 'sanctum/csrf-cookie']` | **CRÍTICO:** Solo estas rutas tienen CORS. Por eso `/` NO funciona desde navegador |
| `allowed_methods` | `['*']` | Permite GET, POST, PUT, DELETE, PATCH |
| `allowed_origins` | `http://localhost:5173` | El frontend de Vite |
| `supports_credentials` | `true` | Sin esto, las cookies NO se envían en cross-origin |
| `allowed_headers` | `['*']` | Acepta cualquier header (Authorization, Content-Type, etc.) |
| `exposed_headers` | `['Authorization']` | El frontend puede leer el header Authorization |

⚠️ **IMPACTO CORS:**

```
✅ Estos endpoints FUNCIONAN desde navegador (CORS habilitado):
   GET  /api/user
   POST /api/login
   GET  /api/dashboard/*
   POST /api/picking/*

❌ Estos endpoints NO funcionan desde navegador (CORS no habilitado):
   GET  /                    (root)
   GET  /index.html
   Otros endpoints fuera de /api/*

✅ PERO SÍ funcionan con curl (curl no respeta CORS):
   curl http://localhost:8000/
   curl http://localhost:8000/index.html
```

### Variables de Entorno (`.env`)

```dotenv
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173   # ← Apunta a Vite

SESSION_DRIVER=database              # Para cookies
SESSION_DOMAIN=null                  # null = mismo dominio
SESSION_PATH=/                       # Todas las rutas
SESSION_SECURE=false                 # true en producción (HTTPS)
SESSION_HTTP_ONLY=true               # No accesible desde JS
```

---

## 🔒 AUTENTICACIÓN: SPA vs API

### Escenario 1: WEB (SPA - React/Vite)

**Tipo de Autenticación:** Sanctum + Cookies + CSRF

**Flujo:**

```
1. Frontend enviá credenciales POST /api/login
2. Backend valida y crea una sesión en BD
3. Backend retorna cookie HttpOnly (automático)
4. Frontend guarda cookie en navegador (automático)
5. Siguientes requests incluyen cookie automáticamente
6. Backend valida sesión vs cookie
```

**Ventajas:**
- Cookie se envía automáticamente (no necesitas guardarla)
- HttpOnly previene XSS (JavaScript no puede leerla)
- Mejor para browsers

**Configuración Backend:**

```php
// routes/api.php
Route::post('/login', [AuthController::class, 'login']);  // Sin auth

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    // Todas tus rutas protegidas aquí
});
```

**Response del Login (Web):**

```json
{
    "status": "success",
    "message": "Login exitoso",
    "user": {
        "id": 1,
        "name": "Juan Pérez",
        "username": "jperez",
        "email": "juan@example.com",
        "roles": ["Administrador"]
    }
}
```

⚠️ **NO incluyas token en la respuesta para SPA** — La cookie es suficiente.

---

### Escenario 2: MÓVIL (React Native)

**Tipo de Autenticación:** Sanctum + Bearer Token

**Flujo:**

```
1. App móvil enviá credenciales POST /api/login
2. Backend crea token y lo retorna
3. App lo guarda en AsyncStorage o SecureStorage
4. Siguientes requests incluyen: Authorization: Bearer <token>
5. Backend valida token
```

**Ventajas:**
- No depende de cookies
- Stateless (ideal para APIs)
- Funciona detrás de proxies

**Response del Login (Móvil):**

```json
{
    "status": "success",
    "message": "Login exitoso",
    "token": "1|abcdef123456...",
    "user": {
        "id": 1,
        "name": "Juan Pérez",
        "username": "jperez",
        "email": "juan@example.com",
        "roles": ["Almacenista"]
    }
}
```

---

### Diferencias Clave

| Aspecto | WEB (SPA) | MÓVIL |
|--------|-----------|-------|
| Token | Almacenado en Cookie HttpOnly | Bearer en Authorization header |
| Envío | Automático (navegador) | Manual en cada request |
| Seguridad | XSS protegido con HttpOnly | Guardado en SecureStorage |
| CSRF | Requerido (header X-CSRF-TOKEN) | No aplica (stateless) |
| Duración | SESSION_LIFETIME (config/session.php) | Token permanente hasta revocación |

---

## 🚀 CONFIGURACIÓN DEL CLIENTE HTTP (AXIOS)

### 📱 PARA FRONTEND WEB (React/Vite)

**Archivo:** `src/axios.js` or `src/services/api.js`

```javascript
import axios from 'axios';

// Crear instancia de Axios configurada para SPA
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // CRÍTICO: Permitir envío de cookies en cross-origin
  withCredentials: true,
});

// Interceptor: Inyectar CSRF token en headers (si es necesario)
axiosInstance.interceptors.request.use((config) => {
  // Laravel Sanctum maneja CSRF automáticamente para SPA
  // Pero si necesitas token explícito:
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  if (csrfToken) {
    config.headers['X-CSRF-TOKEN'] = csrfToken;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor: Manejar respuestas de error
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized - Sesión expirada
    if (error.response?.status === 401) {
      // Redirigir a login
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 403 Forbidden - Permisos insuficientes
    if (error.response?.status === 403) {
      // Mostrar mensaje de acceso denegado
      console.error('Acceso denegado:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

**Archivo `.env.local` del Frontend:**

```dotenv
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME="OrganiRack+"
```

**Uso en Componentes:**

```javascript
import axiosInstance from '@/axios';

export default {
  data() {
    return {
      user: null,
      loading: false,
    };
  },
  async mounted() {
    try {
      // Obtener usuario actual (cookie automática)
      const response = await axiosInstance.get('/user');
      this.user = response.data.user;
    } catch (error) {
      console.error('Error fetcheando usuario:', error);
    }
  },
  methods: {
    async login(username, password) {
      this.loading = true;
      try {
        // POST sin token - La cookie viene automática
        const response = await axiosInstance.post('/login', {
          username,
          password,
        });
        this.user = response.data.user;
        // Redirect a dashboard
        this.$router.push('/dashboard');
      } catch (error) {
        this.error = error.response?.data?.message || 'Error en login';
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      try {
        await axiosInstance.post('/logout');
        this.user = null;
        this.$router.push('/login');
      } catch (error) {
        console.error('Error en logout:', error);
      }
    },
  },
};
```

---

### 📱 PARA APP MÓVIL (React Native)

**Archivo:** `src/services/api.js` o `src/utils/axios.js`

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api',  // Cambiar en producción
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // No necesita withCredentials (no usamos cookies)
});

// Interceptor: Inyectar Bearer token
axiosInstance.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('mobile_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error obteniendo token:', error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor: Manejar respuestas
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401 - Token expirado
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('mobile_token');
      // Redirigir a login
      // navigation.navigate('Login');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

**Uso en Componentes React Native:**

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';

export const handleLogin = async (username, password) => {
  try {
    const response = await api.post('/login', {
      username,
      password,
    });
    
    // Guardar token
    await AsyncStorage.setItem('mobile_token', response.data.token);
    
    // Guardar usuario
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error en login' };
  }
};
```

---

## 📦 ESTRUCTURA ESTÁNDAR DE RESPUESTAS JSON

### ✅ Respuesta Exitosa (200 OK)

```json
{
  "status": "success",
  "message": "Operación completada exitosamente",
  "data": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com"
  },
  "timestamp": "2026-03-20T14:30:00Z"
}
```

**En Controlador Laravel:**

```php
public function show($id)
{
    $user = User::find($id);
    
    return response()->json([
        'status' => 'success',
        'message' => 'Usuario obtenido',
        'data' => $user,
        'timestamp' => now(),
    ], 200);
}
```

---

### 📋 Respuesta de Listado (Paginado)

```json
{
  "status": "success",
  "message": "Órdenes obtenidas",
  "data": [
    {
      "id": 1,
      "order_number": "ORD-001",
      "status": "pending"
    },
    {
      "id": 2,
      "order_number": "ORD-002",
      "status": "completed"
    }
  ],
  "pagination": {
    "total": 150,
    "per_page": 15,
    "current_page": 1,
    "last_page": 10,
    "next_page_url": "/api/orders?page=2"
  },
  "timestamp": "2026-03-20T14:30:00Z"
}
```

**En Controlador:**

```php
public function index()
{
    $orders = Order::paginate(15);
    
    return response()->json([
        'status' => 'success',
        'message' => 'Órdenes obtenidas',
        'data' => $orders->items(),
        'pagination' => [
            'total' => $orders->total(),
            'per_page' => $orders->perPage(),
            'current_page' => $orders->currentPage(),
            'last_page' => $orders->lastPage(),
            'next_page_url' => $orders->nextPageUrl(),
        ],
        'timestamp' => now(),
    ], 200);
}
```

---

## ⚠️ MANEJO DE ERRORES

### ❌ Validación Fallida (422 Unprocessable Entity)

```json
{
  "status": "error",
  "message": "Validación fallida",
  "errors": {
    "username": [
      "El campo username es requerido",
      "El usuario ya existe"
    ],
    "email": [
      "El email debe ser válido"
    ]
  },
  "timestamp": "2026-03-20T14:30:00Z"
}
```

**En Controlador:**

```php
public function store(Request $request)
{
    $validated = $request->validate([
        'username' => 'required|unique:users',
        'email' => 'required|email',
        'password' => 'required|min:8',
    ]);

    // Si falla, Laravel automáticamente retorna 422 con errores
    // Pero podemos customizarlo:

    return response()->json([
        'status' => 'error',
        'message' => 'Validación fallida',
        'errors' => $validated, // Los errores
        'timestamp' => now(),
    ], 422);
}
```

**Manejarlo en Frontend:**

```javascript
try {
  const response = await axiosInstance.post('/users', formData);
  console.log('Usuario creado:', response.data);
} catch (error) {
  if (error.response?.status === 422) {
    // Errores de validación
    const errors = error.response.data.errors;
    console.error('Errores de validación:', errors);
    // Mostrar en formulario:
    // username: errors.username[0]
    // email: errors.email[0]
  }
}
```

---

### 🔒 No Autorizado (401 Unauthorized)

```json
{
  "status": "error",
  "message": "No autenticado",
  "errors": null,
  "timestamp": "2026-03-20T14:30:00Z"
}
```

*Causas:*
- Cookie expirada (SPA)
- Token no incluido o inválido (Móvil)
- Sesión destruida

**Respuesta en Controlador:**

```php
public function show($id)
{
    // Si no está autenticado, Laravel automáticamente retorna 401
    // Pero podemos customizar:

    if (!auth('sanctum')->check()) {
        return response()->json([
            'status' => 'error',
            'message' => 'No autenticado. Por favor, inicia sesión.',
            'timestamp' => now(),
        ], 401);
    }

    // Si llegamos aquí, está autenticado
    $user = auth('sanctum')->user();
    return response()->json([...], 200);
}
```

---

### 🚫 Acceso Denegado (403 Forbidden)

```json
{
  "status": "error",
  "message": "No tienes permisos para esta acción",
  "errors": null,
  "timestamp": "2026-03-20T14:30:00Z"
}
```

*Causas:*
- Usuario no tiene el rol requerido
- Usuario no es propietario del recurso

**En Controlador (con Spatie Permissions):**

```php
public function destroy($id)
{
    $order = Order::find($id);

    // Verificar permisos
    if (!auth('sanctum')->user()->can('delete orders')) {
        return response()->json([
            'status' => 'error',
            'message' => 'No tienes permisos para eliminar órdenes',
            'timestamp' => now(),
        ], 403);
    }

    $order->delete();
    return response()->json([
        'status' => 'success',
        'message' => 'Orden eliminada',
    ], 200);
}
```

---

### 💥 Error del Servidor (500 Internal Server Error)

```json
{
  "status": "error",
  "message": "Error interno del servidor",
  "debug": {
    "exception": "DivisionByZeroError",
    "file": "app/Http/Controllers/Api/DashboardController.php",
    "line": 45
  },
  "timestamp": "2026-03-20T14:30:00Z"
}
```

⚠️ En producción, NO mostrar `debug`. Solo enviarlo en desarrollo (`APP_DEBUG=true`).

---

## ✅ CHECKLIST DE DESPLIEGUE LOCAL

### ✓ Paso 1: Configuración Inicial

```bash
# Backend - En la carpeta organirack-backend/
cd organirack-backend

# Instalar dependencias
composer install

# Copiar .env
cp .env.example .env

# Generar key
php artisan key:generate

# Configurar CORS (ya hecho)
# Asegurate que config/cors.php tiene:
# - 'allowed_origins' => ['http://localhost:5173']
# - 'supports_credentials' => true

# Verificar .env
# FRONTEND_URL=http://localhost:5173
# SESSION_DRIVER=database
```

---

### ✓ Paso 2: Base de Datos

```bash
# Backend
# Asegurar que DB_* está configurado en .env

# Crear base de datos (en MySQL)
mysql -u root -p
> CREATE DATABASE organirackplusdb;
> EXIT;

# Ejecutar migraciones
php artisan migrate

# Ejecutar seeders (si existen)
php artisan db:seed
```

---

### ✓ Paso 3: Levantar Backend

```bash
# Terminal 1 - Backend
cd organirack-backend

# Limpiar caché
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Iniciar servidor Laravel
php artisan serve

# Output esperado:
# Laravel development server started: http://127.0.0.1:8000
```

**Verificar que funciona:**

```bash
curl http://localhost:8000/

# Response esperada:
# {"status":"ok","message":"OrganiRack+ API - Headless Backend","version":"11.x","timestamp":"2026-03-20T14:30:00Z"}
```

---

### ✓ Paso 4: Configuración Frontend

```bash
# Frontend
cd organirack-frontend

# Crear .env.local
cat > .env.local << EOF
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME="OrganiRack+"
EOF

# Instalar dependencias
npm install

# O con Yarn
yarn install
```

**Archivo:** `src/axios.js` (ya debe estar configurado)

```javascript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,  // CRÍTICO para SPA
});

export default axiosInstance;
```

---

### ✓ Paso 5: Levantar Frontend

```bash
# Terminal 2 - Frontend
cd organirack-frontend

npm run dev

# Output esperado:
# VITE v8.0.1  local:   http://localhost:5173/
```

---

### ✓ Paso 6: Prueba de Conectividad

**Test 1: CORS Preflight**

```bash
curl -X OPTIONS http://localhost:8000/api/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Response esperada:**

```
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: http://localhost:5173
< Access-Control-Allow-Credentials: true
< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

**Test 2: Login desde Frontend**

En la consola del navegador (http://localhost:5173):

```javascript
import axiosInstance from '@/axios';

// Test login
await axiosInstance.post('/login', {
  username: 'testuser',
  password: 'password123'
});
```

**Response esperada:**

```json
{
  "status": "success",
  "message": "Login exitoso",
  "user": {...}
}
```

---

### ✓ Paso 7: Verificación de Cookies (SPA)

En las DevTools del navegador (Pestaña Network):

1. Haz un request a `/api/login`
2. En la pestaña "Response Headers" deberías ver:
   ```
   set-cookie: XSRF-TOKEN=...; Path=/; Domain=; HttpOnly
   set-cookie: laravel_session=...; Path=/; Domain=; HttpOnly; SameSite=...
   ```
3. En siguientes requests, en "Request Headers" verás las cookies automáticamente.

---

## 🔧 TROUBLESHOOTING

### ❌ Error: "curl funciona pero fetch falla con CORS"

**Causa:** CORS solo se ha configurado para rutas `/api/*` y `/sanctum/csrf-cookie`

**Explicación:**

```
✅ curl http://localhost:8000/                      → FUNCIONA
   Razón: curl NO respeta políticas CORS

❌ fetch('http://localhost:8000/', {...})          → FALLA CORS
   Razón: fetch SÍ respeta políticas CORS
   Error: Access to fetch blocked by CORS policy
   
✅ fetch('http://localhost:8000/api/user', ...)    → FUNCIONA
   Razón: /api/* está en config/cors.php 'paths'
```

**Solución:** Para probar desde navegador, siempre usa endpoints bajo `/api/*`:

```javascript
// ❌ Mal - No tiene CORS
fetch('http://localhost:8000/')

// ✅ Bien - Tiene CORS habilitado
fetch('http://localhost:8000/api/user', {
  credentials: 'include',  // Envía cookies
})
```

**Rutas con CORS Habilitado:**
```
POST   /api/login
GET    /api/user
GET    /api/dashboard/*
POST   /api/picking/*
POST   /sanctum/csrf-cookie
```

---

### ❌ Error: "Access to XMLHttpRequest blocked by CORS"

**Causa:** Origen no permitido en CORS

**Solución:**

```php
// config/cors.php
'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost:5173'),
    'http://localhost:5173',  // ← Asegurate que esté aquí
],
```

```bash
# Luego
php artisan config:clear
php artisan serve
```

---

### ❌ Error: "401 Unauthorized en cada request"

**Causa:** Cookie no se envía o sesión expirada

**Solución:**

```javascript
// axios.js - Verifica que está:
withCredentials: true,  // ← CRÍTICO

// Y en navegador DevTools > Application > Cookies
// Deberías ver: XSRF-TOKEN y laravel_session
```

---

### ❌ Error: "Cookie set to SameSite=Strict, but origin is different"

**Causa:** SameSite demasiado restrictivo

**Solución (en .env backend):**

```dotenv
SESSION_SAME_SITE=lax  # En lugar de strict
```

---

### ❌ Error: "Token not found in Authorization header"

**Causa:** Bearer token no se está enviando (móvil)

**Solución (React Native):**

```javascript
// Verifica que el token se guarda:
const token = await AsyncStorage.getItem('mobile_token');
console.log('Token guardado:', token);

// Y que se envía en requests:
const token = await AsyncStorage.getItem('mobile_token');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

---

### ❌ Error: "CSRF token mismatch"

**Causa:** Token CSRF no se incluye (solo SPA)

**Solución:**

```javascript
// axios.js para SPA
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
if (csrfToken) {
  config.headers['X-CSRF-TOKEN'] = csrfToken;
}
```

O en el HTML (index.html):

```html
<meta name="csrf-token" content="">
```

Nota: Si usas `withCredentials: true`, Sanctum maneja CSRF automáticamente.

---

## 📚 REFERENCIAS ÚTILES

- [Laravel Sanctum Docs](https://laravel.com/docs/11.x/sanctum)
- [Axios Docs](https://axios-http.com/)
- [CORS MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Vite Docs](https://vitejs.dev/)

---

## 👤 CONTACTO Y SOPORTE

- **Arquitecto Senior:** División Technical
- **Fecha Última Actualización:** Marzo 20, 2026
- **Versión Documento:** 1.0

---

**Nota Final:** Este documento es vinculante para toda integración Frontend-Backend. Cualquier desviación debe ser aprobada por el Arquitecto de Software Senior.
