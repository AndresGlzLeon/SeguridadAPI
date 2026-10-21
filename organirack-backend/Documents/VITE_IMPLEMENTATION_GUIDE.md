# 🚀 Guía de Implementación: Vite en OrganiRackPlus

**Fecha**: Marzo 19, 2026  
**Enfoque**: Arquitectura Monorepo con Vite + React 18 + Laravel 12 API  
**Estado**: Propuesta de implementación (Conforme a REQ-005)  
**Requisito**: REQ-005 - Frontend web administrativo con React

---

## 📊 Análisis de tu Proyecto Actual

### Stack Tecnológico
```
✅ Backend:       Laravel 12 (PHP 8.2+)
✅ API:           Laravel Sanctum + REST JSON
✅ BD:            SQL bien estructurada
✅ Servicios:     InventoryService, AuthService (agnósticos del frontend)
✅ Testing:       Pest PHP 3.8+
✅ Permisos:      Spatie Laravel Permission
🆕 Frontend:      React 18 + Vite (REQ-005 Compliance)
🆕 Assets:        Vite bundler + JSX transpilación
```

### Por Qué tu Proyecto es Perfecto para Vite + React

1. **API Backend Existe**: Tu `routes/api.php` ya está preparado
2. **Servicios Desacoplados**: No necesitas refactorizar lógica para Vite
3. **CORS Configurado**: Laravel ya tiene `config/cors.php`
4. **Sanctum Integrado**: Autenticación via tokens listos
5. **Monorepo Natural**: Backend y Frontend pueden coexistir fácilmente
6. **React Agnóstico**: React no requiere servidor específico, perfectamente compatible con Vite

---

## 🏗️ Estructura Monorepo Propuesta

Esta es la **opción recomendada** para tu proyecto (REQ-005 Compliant):

```
organirack/                           ← Raíz del monorepo
│
├── organirack-backend/               ← Backend Laravel (API)
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   ├── Middleware/
│   │   │   └── Requests/
│   │   ├── Models/
│   │   │   ├── Almacen.php
│   │   │   ├── Edificio.php
│   │   │   ├── Estante.php
│   │   │   ├── OrdenSurtido.php
│   │   │   └── Producto.php
│   │   └── Services/
│   │       ├── AuthService.php       ← Reutilizable en React
│   │       └── InventoryService.php  ← Reutilizable en React
│   ├── routes/
│   │   ├── api.php                   ← Endpoints JSON
│   │   ├── web.php
│   │   └── auth.php
│   ├── config/cors.php               ← Importante para React
│   ├── database/
│   ├── tests/
│   ├── composer.json                 ← Backend deps
│   ├── .env
│   └── artisan
│
├── organirack-frontend/              ← Frontend Vite + React 18 (NUEVO - REQ-005)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Edificios/
│   │   │   │   ├── EdificioList.jsx
│   │   │   │   └── EdificioForm.jsx
│   │   │   ├── Almacenes/
│   │   │   ├── OrdenesDeVenta/
│   │   │   └── Shared/
│   │   │       ├── NavBar.jsx
│   │   │       └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Almacenes.jsx
│   │   │   ├── OrdenesDeVenta.jsx
│   │   │   └── Login.jsx
│   │   ├── services/
│   │   │   ├── api.js               ← Cliente HTTP (Axios)
│   │   │   ├── almacenService.js    ← Llama a backend
│   │   │   ├── ordenService.js
│   │   │   └── authService.js
│   │   ├── store/
│   │   │   ├── authStore.js         ← Zustand store
│   │   │   └── almacenStore.js      ← Zustand store
│   │   ├── App.jsx
│   │   ├── main.jsx                 ← Entry point Vite
│   │   └── index.css
│   ├── public/
│   ├── vite.config.js               ← Config de Vite
│   ├── package.json                 ← Deps de Node
│   └── index.html                   ← Template principal
│
├── .gitignore                        ← Cubre ambos
├── VITE_IMPLEMENTATION_GUIDE.md      ← Este archivo (REQ-005)
└── README.md                         ← Instrucciones de inicio
```

---

## 🔀 Ventajas de la Arquitectura Monorepo

| Aspecto | Beneficio |
|--------|-----------|
| **Mismo Repositorio** | Git único, historial unificado |
| **Desarrollo Paralelo** | Dev backend y frontend (React) simultáneamente |
| **Componentes React Reutilizables** | Compartir UI kit entre secciones |
| **CORS Simplificado** | Localhost:8000 ↔ Localhost:5173 |
| **Despliegue Cohesivo** | CI/CD único para backend + frontend |
| **Testing End-to-End** | Pruebas contra API real en dev |
| **Sin Refactorización** | Los servicios Laravel no cambian |
| **REQ-005 Compliance** | React Stack según requerimientos |

---

## 📦 Configuración Paso a Paso

### PASO 1: Crear la Estructura del Frontend

```bash
# En la raíz del monorepo (no dentro de organirack-backend)
mkdir organirack-frontend
cd organirack-frontend
npm create vite@latest . -- --template react

# O si quieres crear desde cero:
npm init -y
npm install react react-dom react-router-dom axios zustand
npm install -D vite @vitejs/plugin-react
```

### PASO 2: `package.json` del Frontend

```json
{
  "name": "organirack-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --fix",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.5",
    "eslint": "^8.53.0",
    "eslint-plugin-react": "^7.33.2"
  }
}
```

### PASO 3: `vite.config.js` del Frontend

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
```

### PASO 4: `index.html` (Entry Point)

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OrganiRack Plus - Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### PASO 5: `src/main.jsx`

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
)
```

### PASO 6: `src/App.jsx`

```jsx
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/Shared/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Almacenes from '@/pages/Almacenes'
import OrdenesDeVenta from '@/pages/OrdenesDeVenta'

export default function App() {
  const { token } = useAuthStore()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {token ? (
        <Route
          path="/"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/almacenes" element={<Almacenes />} />
                <Route path="/ordenes" element={<OrdenesDeVenta />} />
              </Routes>
            </Layout>
          }
        />
      ) : (
        <Route path="*" element={<Login />} />
      )}
    </Routes>
  )
}
```

### PASO 7: API Client `src/services/api.js`

```javascript
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Interceptor: Agregar token Sanctum
client.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor: Manejo de errores
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState()
      logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
```

### PASO 8: Servicio de Almacenes `src/services/almacenService.js`

```javascript
import api from './api'

export const almacenService = {
  async getEdificios() {
    const response = await api.get('/edificios')
    return response.data
  },

  async getEdificio(id) {
    const response = await api.get(`/edificios/${id}`)
    return response.data
  },

  async getAlmacenesByEdificio(edificioId) {
    const response = await api.get(`/almacenes/by-edificio/${edificioId}`)
    return response.data
  },

  async getAlmacen(id) {
    const response = await api.get(`/almacenes/${id}`)
    return response.data
  },

  async createEdificio(data) {
    const response = await api.post('/edificios', data)
    return response.data
  },

  async updateEdificio(id, data) {
    const response = await api.put(`/edificios/${id}`, data)
    return response.data
  },

  async deleteEdificio(id) {
    await api.delete(`/edificios/${id}`)
  },
}
```

### PASO 9: Store Zustand `src/store/almacenStore.js`

```javascript
import { create } from 'zustand'
import { almacenService } from '@/services/almacenService'

export const useAlmacenStore = create((set) => ({
  edificios: [],
  currentEdificio: null,
  almacenes: [],
  loading: false,
  error: null,

  fetchEdificios: async () => {
    set({ loading: true, error: null })
    try {
      const edificios = await almacenService.getEdificios()
      set({ edificios })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchAlmacenesByEdificio: async (edificioId) => {
    set({ loading: true, error: null })
    try {
      const almacenes = await almacenService.getAlmacenesByEdificio(edificioId)
      set({ almacenes, currentEdificio: edificioId })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  setCurrentEdificio: (edificioId) => set({ currentEdificio: edificioId }),

  reset: () => set({
    edificios: [],
    currentEdificio: null,
    almacenes: [],
    loading: false,
    error: null,
  }),
}))
```

### PASO 10: Auth Store Zustand `src/store/authStore.js`

```javascript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/authService'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { user, token } = await authService.login(email, password)
          set({ user, token })
        } catch (err) {
          set({ error: err.message })
          throw err
        } finally {
          set({ loading: false })
        }
      },

      logout: () => {
        set({ user: null, token: null })
      },

      setToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
```

---

## 🔗 Integración Backend - Frontend

### Router React `src/router.jsx`

```jsx
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import PrivateRoute from '@/components/PrivateRoute'
import Layout from '@/components/Shared/Layout'
import Dashboard from '@/pages/Dashboard'
import Almacenes from '@/pages/Almacenes'
import OrdenesDeVenta from '@/pages/OrdenesDeVenta'
import Login from '@/pages/Login'

export default function Router() {
  const { token } = useAuthStore()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/almacenes" element={<Almacenes />} />
                <Route path="/ordenes" element={<OrdenesDeVenta />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to={token ? '/' : '/login'} />} />
    </Routes>
  )
}
```

### Componente PrivateRoute `src/components/PrivateRoute.jsx`

```jsx
import { useAuthStore } from '@/store/authStore'
import { Navigate } from 'react-router-dom'

export default function PrivateRoute({ children }) {
  const { token } = useAuthStore()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}
```

### Configurar CORS en Laravel

**Archivo**: `config/cors.php`

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['http://localhost:5173', 'http://localhost:3000'],
'allowed_origins_patterns' => ['*'],
'allowed_headers' => ['*'],
'exposed_headers' => ['*'],
'max_age' => 0,
'supports_credentials' => true,
```

### Rutas API en Laravel

**Archivo**: `routes/api.php`

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\EdificioController;
use App\Http\Controllers\Api\AlmacenController;
use App\Http\Controllers\Api\AuthController;

// Auth
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Rutas protegidas
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('edificios', EdificioController::class);
    Route::get('/almacenes/by-edificio/{edificioId}', [AlmacenController::class, 'byEdificio']);
    Route::apiResource('almacenes', AlmacenController::class);
    // ... más rutas
});
```

---

## 🎯 Flujo de Desarrollo

### Durante el Desarrollo

```bash
# Terminal 1: Backend Laravel
cd organirack-backend
php artisan serve

# Terminal 2: Frontend React + Vite
cd organirack-frontend
npm run dev

# Acceso:
# - Backend API:  http://localhost:8000/api
# - Frontend:     http://localhost:5173
# - Frontend desarrolla contra http://localhost:8000 vía proxy
```

### Con Concurrently (Opcional - Monorepo unificado)

**Archivo**: `package.json` en raíz

```json
{
  "scripts": {
    "dev": "concurrently \"cd organirack-backend && php artisan serve\" \"cd organirack-frontend && npm run dev\"",
    "build": "cd organirack-frontend && npm run build"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

Entonces simplemente: `npm run dev` en la raíz.

### Ejemplo: Componente React consumiendo API

`src/components/Edificios/EdificioList.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { useAlmacenStore } from '@/store/almacenStore'
import Loading from '@/components/Shared/Loading'
import Alert from '@/components/Shared/Alert'

export default function EdificioList() {
  const { edificios, loading, error, fetchEdificios } = useAlmacenStore()

  useEffect(() => {
    fetchEdificios()
  }, [])

  if (loading) return <Loading />
  if (error) return <Alert type="error" message={error} />

  return (
    <div className="edificio-list">
      <h2>Edificios</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Siglas</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {edificios.map((edificio) => (
            <tr key={edificio.id}>
              <td>{edificio.nombre}</td>
              <td>{edificio.siglas}</td>
              <td>{edificio.descripcion}</td>
              <td>
                <button onClick={() => handleEdit(edificio.id)}>Editar</button>
                <button onClick={() => handleDelete(edificio.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## 📦 Build para Producción

### Frontend Build

```bash
cd organirack-frontend
npm run build
```

Genera `dist/` con assets optimizados (minificados, versionados, tree-shaking para React).

### Deployment Options

#### Opción A: Frontend Servido por Laravel

```bash
# Copiar dist/ a public/
cp -r organirack-frontend/dist/* organirack-backend/public/

# Laravel sirve todo (frontend + API)
php artisan serve
```

#### Opción B: Frontend en CDN (Recomendado para escala)

```bash
# Subir organirack-frontend/dist/ a:
# - AWS S3 + CloudFront
# - Vercel
# - Netlify
# - Cloudflare Pages

# Backend solo API en organirack-backend/
# (configurar CORS para dominio de CDN)
```

#### Opción C: Docker Monorepo

```dockerfile
# Dockerfile para ambos
FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY organirack-frontend .
RUN npm install && npm run build

FROM php:8.2-fpm
WORKDIR /app
COPY organirack-backend .
COPY --from=frontend-build /app/frontend/dist ./public/web
RUN composer install --no-dev
RUN php artisan config:cache
```

---

---

## 🧪 Testing

### Backend (Pest PHP)

```bash
cd organirack-backend
php artisan test

# Con file specific
php artisan test tests/Feature/Api/EdificioControllerTest.php
```

### Frontend (Vitest + React Testing Library)

```bash
cd organirack-frontend
npm run test

# Watch mode
npm run test -- --watch

# Coverage
npm run test -- --coverage
```

### Ejemplo: Test de Componente React

`src/components/__tests__/EdificioList.test.jsx`:

```jsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import EdificioList from '../Edificios/EdificioList'
import { useAlmacenStore } from '@/store/almacenStore'

vi.mock('@/store/almacenStore')

describe('EdificioList', () => {
  beforeEach(() => {
    useAlmacenStore.mockReturnValue({
      edificios: [
        { id: 1, nombre: 'Edificio A', siglas: 'EA', descripcion: 'Test' },
      ],
      loading: false,
      error: null,
      fetchEdificios: vi.fn(),
    })
  })

  it('renders buildings list', async () => {
    render(<EdificioList />)
    await waitFor(() => {
      expect(screen.getByText('Edificio A')).toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    useAlmacenStore.mockReturnValue({
      edificios: [],
      loading: true,
      error: null,
    })
    render(<EdificioList />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
```

### E2E (Cypress/Playwright)

```bash
npm install -D cypress
npx cypress open
```

---

## 📋 Checklist de Implementación (REQ-005)

### Fase 1: Setup Base (Semana 1)

- [ ] Crear estructura de carpetas `organirack-frontend/`
- [ ] `npm init` con dependencias React/Vite
- [ ] `vite.config.js` configurado (plugin @vitejs/plugin-react)
- [ ] `index.html` + `src/main.jsx`
- [ ] API client (`axios` + interceptors)
- [ ] Zustand store básico (authStore)
- [ ] Primer componente (EdificioList.jsx)

### Fase 2: Autenticación (Semana 1)

- [ ] Página Login.jsx con formulario
- [ ] Integración con Sanctum
- [ ] Token storage en Zustand (persist middleware)
- [ ] React Router ProtectedRoute
- [ ] Logout functionality

### Fase 3: Componentes CRUD (Semana 2-3)

- [ ] Componentes CRUD: Edificios, Almacenes, Racks, Estantes (JSX)
- [ ] Formularios validados (React Hook Form opcional)
- [ ] Estados de carga/error globales
- [ ] Modales reutilizables
- [ ] Notificaciones/Alerts

### Fase 4: UI/UX Polish (Semana 4)

- [ ] Responsive design (CSS Grid/Flexbox)
- [ ] Temas (dark/light) con Context API
- [ ] Performance optimization (React.memo, code-splitting)
- [ ] Accesibilidad (ARIA labels, keyboard nav)
- [ ] Documentación de componentes---

## 🎓 Estructura de Carpetas Detallada (Frontend React)

```
organirack-frontend/
├── src/
│   ├── components/              ← Componentes reutilizables
│   │   ├── Almacenes/
│   │   │   ├── AlmacenForm.jsx
│   │   │   └── AlmacenList.jsx
│   │   ├── Edificios/
│   │   │   ├── EdificioForm.jsx
│   │   │   ├── EdificioList.jsx
│   │   │   └── EdificioDetails.jsx
│   │   ├── OrdenesDeVenta/
│   │   │   ├── OrdenForm.jsx
│   │   │   ├── OrdenList.jsx
│   │   │   └── OrdenDetails.jsx
│   │   ├── Shared/
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── NavBar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Alert.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── Pagination.jsx
│   │   │   └── Layout.jsx
│   │   ├── PrivateRoute.jsx
│   │   └── __tests__/           ← Tests de componentes
│   │       ├── Button.test.jsx
│   │       └── EdificioList.test.jsx
│   │
│   ├── pages/                   ← Páginas/Vistas (React Router)
│   │   ├── Dashboard.jsx
│   │   ├── Almacenes.jsx
│   │   ├── OrdenesDeVenta.jsx
│   │   ├── Reportes.jsx
│   │   ├── Admin/
│   │   │   ├── Usuarios.jsx
│   │   │   └── Permisos.jsx
│   │   ├── Login.jsx
│   │   └── NotFound.jsx
│   │
│   ├── services/                ← Clientes HTTP (Axios)
│   │   ├── api.js               (Configuración axios + interceptors)
│   │   ├── almacenService.js
│   │   ├── ordenService.js
│   │   ├── productoService.js
│   │   ├── authService.js
│   │   └── reporteService.js
│   │
│   ├── store/                   ← Zustand stores (estado global)
│   │   ├── authStore.js
│   │   ├── almacenStore.js
│   │   ├── ordenStore.js
│   │   └── uiStore.js
│   │
│   ├── utils/                   ← Utilidades
│   │   ├── formatters.js        (Fechas, números, etc)
│   │   ├── validators.js
│   │   └── constants.js
│   │
│   ├── App.jsx                  ← Componente raíz
│   ├── main.jsx                 ← Entry point
│   └── index.css                ← Estilos globales
│
├── public/                      ← Assets estáticos
│   ├── favicon.ico
│   └── logo.svg
│
├── tests/                       ← Tests integración
│   ├── unit/
│   │   └── stores.test.js
│   ├── components/
│   │   └── forms.test.jsx
│   └── integration/
│       └── api.test.js
│
├── .env                         ← Variables env local
├── .env.example                 ← Template
├── .env.production              ← Prod vars
├── .gitignore
├── vite.config.js               ← Config Vite
├── vitest.config.js             ← Config tests
├── package.json
└── index.html                   ← HTML template
```

---

## 🚀 Componente Ejemplo: Login.jsx

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const { setToken } = useAuthStore()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { token } = await authService.login(
        formData.email,
        formData.password
      )
      setToken(token)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Error en autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>OrganiRack Plus</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

## 🚨 Consideraciones Importantes (REQ-005)

### CORS y Seguridad

```javascript
// ✅ CORRECTO: React contacta a API con credenciales
const config = {
  withCredentials: true,
  headers: { 'Authorization': `Bearer ${token}` }
}
```

### Variables de Entorno

**Frontend**: `organirack-frontend/.env`

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_TITLE=OrganiRack Plus Admin
VITE_MAX_FILE_SIZE=5242880
```

**Frontend Production**: `organirack-frontend/.env.production`

```
VITE_API_BASE_URL=https://api.organirack.com/api
VITE_APP_TITLE=OrganiRack Plus Admin
```

**Backend**: `organirack-backend/.env`

```
FRONTEND_URL=http://localhost:5173
APP_ENV=local
APP_DEBUG=true
```

### HMR (Hot Module Replacement)

Vite + React proporciona refresco instantáneo. Para deshabilitar si hay problemas:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    hmr: false,
  }
})
```

### Performance: Code Splitting en React

Vite automáticamente realiza code splitting para componentes lazy en React:

```jsx
import { lazy, Suspense } from 'react'
import Loading from '@/components/Shared/Loading'

const OrdenesDeVenta = lazy(() => import('@/pages/OrdenesDeVenta'))

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <OrdenesDeVenta />
    </Suspense>
  )
}
```

### Zustand vs Redux: Por qué Zustand

| Aspecto | Zustand | Redux |
|--------|---------|-------|
| **Bundle Size** | 2KB | ~40KB |
| **Boilerplate** | Mínimo | Mucho |
| **Curva Aprendizaje** | Suave | Pronunciada |
| **Devtools** | Opcional | Integrado |
| **Para OrganiRack** | ✅ Perfecto | Overkill |

---

## 🎯 Conclusión: REQ-005 Compliance ✅

Con esta arquitectura de **Monorepo Vite + React 18 + Laravel 12 API** (conforme a REQ-005):

✅ **React 18** como framework UI (REQ-005 Obligatorio)  
✅ **Vite** como bundler (configuración de desarrollo ágil)  
✅ **Zustand** para estado global (simple y eficiente)  
✅ **React Router** para navegación entre páginas  
✅ **Axios** + Interceptors para comunicación con API  
✅ Backend Laravel **sin cambios** (agnóstico del frontend)  
✅ Desarrollo paralelo **sin conflictos**  
✅ HMR **instantáneo** durante desarrollo  
✅ Build **optimizado** para producción  
✅ Escalabilidad **sin refactorización**  
✅ Testing **robusto** en ambas capas  
✅ CORS **configurado** correctamente  
✅ Cumplimiento total de **REQ-005**  

**Estado de referencia**: Marzo 19, 2026  
**Documento**: VITE_IMPLEMENTATION_GUIDE.md (React Stack)  
**Compliance**: REQ-005 ✅

---

**Próximos pasos ejecutables**:

1. Crear carpeta `organirack-frontend/`
2. `npm create vite@latest . -- --template react`
3. Instalar dependencias: `npm install react-router-dom axios zustand`
4. Copiar estructura de carpetas (`components/`, `pages/`, `services/`, `store/`)
5. Configurar `vite.config.js` con alias `@/`
6. Implementar primer componente: `Login.jsx`
7. Conectar a endpoints Laravel

¿Comenzamos con la implementación? 🚀
