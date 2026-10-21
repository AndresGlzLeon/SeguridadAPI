# Estructura OrganiRackPlus

## Carpetas Principales

### 📁 `organirack-backend/`
**Tecnología:** Laravel + PHP
**Propósito:** API REST principal del proyecto
**Elementos clave:**
- `app/` - Controladores, modelos, servicios y lógica de negocio
- `config/` - Configuración (DB, Auth, CORS, Mail, etc.)
- `database/` - Migraciones y seeders de datos
- `routes/` - Define endpoints (api.php, web.php, auth.php)
- `tests/` - Tests unitarios y feature (Pest)

### 📁 `organirack-frontend/`
**Tecnología:** React + TypeScript + Vite
**Propósito:** Dashboard web principal (interfaz de usuario)
**Elementos clave:**
- `src/app/` - Componentes React, rutas (App.tsx, routes.tsx)
- `src/app/pages/` - Páginas (Login, GestionProductos, etc.)
- `src/app/components/ui/` - Componentes UI reutilizables (shadcn/ui)
- `src/lib/` - Servicios HTTP (axios, auth)
- `vite.config.js/ts` - Configuración del build

### 📁 `OrganiRack-Movil/`
**Tecnología:** Expo (React Native)
**Propósito:** Aplicación móvil multiplataforma (iOS/Android)
**Elementos clave:**
- `app/` - Pantallas y navegación principal
- `components/` - Componentes React reutilizables
- `context/` - Estado global (Context API)
- `API/` - Cliente HTTP para backend
- `types/` - Definiciones TypeScript

### 📁 `Documentacion/`
**Propósito:** Documentación técnica y guías de integración
**Contiene:** Análisis de BD, guías de API, checklists, notas de configuración

---

## Flujo General

```
OrganiRack-Movil  ──┐ 
                    ├──→ organirack-backend (API)
organirack-frontend ┘
```

Cliente móvil y web consumen la misma **API REST** del backend.

## Stack Técnico
- **Backend:** Laravel 11, PHP, MySQL
- **Frontend Web:** React, TypeScript, Vite, Tailwind CSS (shadcn/ui)
- **Móvil:** React Native (Expo), TypeScript
- **Testing:** Pest (backend), Jest/Vitest (frontend)
