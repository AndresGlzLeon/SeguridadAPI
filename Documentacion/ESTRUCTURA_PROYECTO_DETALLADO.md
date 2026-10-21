# OrganiRackPlus - Análisis Detallado de Estructura del Proyecto

> **Última actualización:** 07/04/2026  
> Basado en análisis directo del repositorio. Puede haber pequeñas discrepancias en detalles de implementación interna.

---

## 🎯 Descripción General

Sistema integral de gestión de almacén compuesto por tres aplicaciones:

| Componente | Tecnología | Rol |
|-----------|-----------|-----|
| **API REST** (`organirack-backend`) | Laravel 11 / PHP | Toda la lógica de negocio y persistencia |
| **Dashboard Web** (`organirack-frontend`) | React 18 / TypeScript / Vite | Interfaz para administradores y capturistas |
| **App Móvil** (`OrganiRack-Movil`) | Expo (React Native) / TypeScript | Picking en almacén y escaneo de etiquetas |

---

## 📦 BACKEND (`organirack-backend`)

### Stack
- **Framework:** Laravel 11
- **Lenguaje:** PHP
- **BD:** MySQL 8.0+
- **Auth:** Laravel Sanctum (tokens de API)
- **Roles/Permisos:** spatie/laravel-permission
- **Log de actividad:** spatie/laravel-activitylog
- **Testing:** Pest

---

### Modelos (`app/Models/`)

| Modelo | Archivo | Descripción |
|--------|---------|-------------|
| `User` | `User.php` | Usuario del sistema con roles Spatie, login por `username` |
| `Almacen` | `Almacen.php` | Raíz de la jerarquía física (sin `Edificio`) |
| `Pasillo` | `Pasillo.php` | Pasillo dentro de un almacén |
| `Rack` | `Rack.php` | Rack dentro de un pasillo |
| `Estante` | `Estante.php` | Nodo terminal de ubicación para picking |
| `Categoria` | `Categoria.php` | Catálogo de categorías de productos |
| `UnidadMedida` | `UnidadMedida.php` | Catálogo de unidades de medida |
| `Marca` | `Marca.php` | Catálogo de marcas |
| `Producto` | `Producto.php` | Catálogo maestro de productos (SKU, stock_min, stock_max) |
| `EstadoInventario` | `EstadoInventario.php` | Catálogo de estados cualitativos del stock |
| `Inventario` | `Inventario.php` | Pivote: producto × estante × estado con cantidad |
| `EstadoOrden` | `EstadoOrden.php` | Catálogo de estados de órdenes (con color_hex) |
| `PrioridadOrden` | `PrioridadOrden.php` | Catálogo de prioridades (con nivel_ordenamiento) |
| `OrdenSurtido` | `OrdenSurtido.php` | Cabecera de órdenes de picking |
| `DetalleSurtido` | `DetalleSurtido.php` | Partidas de una orden (sugerido vs real) |
| `DetalleSurtidoUbicacion` | `DetalleSurtidoUbicacion.php` | Registro granular de cada pick individual (multi-pick) |
| `AuditLog` | `AuditLog.php` | Bitácora inmutable de movimientos de inventario |

> ⚠️ **Eliminado:** El modelo `Edificio` fue removido. `Almacen` es ahora la raíz de la jerarquía física.

---

### Controladores (`app/Http/Controllers/`)

#### API (`Controllers/Api/`)

| Controlador | Descripción |
|------------|-------------|
| `AuthController` | Login / logout de la API (devuelve token Sanctum) |
| `UserController` | CRUD completo de usuarios + asignación de roles |
| `ProductController` | CRUD de productos con validación via Form Requests |
| `CatalogController` | Gestión de catálogos: categorías, marcas, unidades de medida, estados de inventario |
| `LocationController` | Gestión de estructura física: almacenes, pasillos, racks, estantes |
| `InventoryController` | Ajuste de stock manual en inventarios |
| `InventoryDashboardController` | Datos agregados para el dashboard de inventario (gráficas, KPIs) |
| `OrderController` | CRUD de órdenes de surtido, asignación de almacenistas |
| `PickingController` | Endpoint de picking para la app web |
| `MobilePickingController` | Endpoints especializados para la app móvil (scanner, override) |
| `AuditController` | Consulta de la bitácora `audit_logs` con filtros |
| `AuditOverrideController` | Consulta de overrides: casos donde se tomó de un estante diferente al sugerido |
| `DashboardController` | Métricas generales del panel de control |
| `TestDashboardController` | Endpoints de prueba/desarrollo (no usar en producción) |

#### Auth (`Controllers/Auth/`)
Controladores del flujo de autenticación web de Laravel (scaffold):

| Controlador | Descripción |
|------------|-------------|
| `AuthenticatedSessionController` | Gestión de sesión web |
| `RegisteredUserController` | Registro de usuarios |
| `NewPasswordController` | Cambio de contraseña |
| `PasswordResetLinkController` | Envío de link de recuperación |
| `EmailVerificationNotificationController` | Reenvío de verificación de email |
| `VerifyEmailController` | Verificación de email |

---

### Form Requests (`app/Http/Requests/`)

| Request | Descripción |
|---------|-------------|
| `StoreOrderRequest` | Validación para crear una orden de surtido |
| `StoreProductRequest` | Validación para crear un producto |
| `UpdateProductRequest` | Validación para actualizar un producto |
| `ProcessOverrideRequest` | Validación para procesar un override de estante durante el picking |

---

### Middleware (`app/Http/Middleware/`)

| Middleware | Descripción |
|-----------|-------------|
| `HandleCorsRequests` | Gestión customizada de CORS (permite frontend y móvil) |
| `EnsureEmailIsVerified` | Verifica que el email del usuario esté confirmado |

---

### Servicios (`app/Services/`)

Capa de lógica de negocio desacoplada de los controladores:

| Servicio | Descripción |
|---------|-------------|
| `AuthService` | Lógica de login/logout y gestión de tokens Sanctum |
| `ProductService` | Operaciones CRUD sobre productos |
| `LocationService` | Creación y gestión de la jerarquía física del almacén |
| `InventoryService` | Ajuste manual de stock, validaciones de inventario |
| `OrderService` | Creación, actualización de estado y asignación de órdenes |
| `PickingService` | Lógica central del proceso de picking (multi-pick, overrides, descuento de inventario) |
| `AuditService` | Registro en `audit_logs`, consultas con filtros complejos |
| `DashboardService` | Agregaciones y KPIs del panel de control general |
| `InventoryDashboardService` | Datos agregados para gráficas de inventario por categoría, estante, etc. |

---

### Rutas (`routes/`)

| Archivo | Descripción |
|---------|-------------|
| `api.php` | Todos los endpoints REST protegidos por Sanctum (`/api/...`) |
| `auth.php` | Rutas del flujo de autenticación web de Laravel |
| `web.php` | Ruta raíz (mínima, redirige) |
| `console.php` | Comandos Artisan personalizados |

---

### Base de Datos (`database/`)

#### Migraciones (`migrations/`) — 14 archivos en orden de ejecución:

| Migración | Tablas creadas |
|-----------|---------------|
| `0001_01_01_000000` | `users`, `password_reset_tokens`, `sessions` |
| `0001_01_01_000001` | `cache`, `cache_locks` |
| `0001_01_01_000002` | `jobs`, `job_batches`, `failed_jobs` |
| `2026_03_01_013735` | `personal_access_tokens` (Sanctum) |
| `2026_03_01_025330` | `permissions`, `roles`, `model_has_permissions`, `model_has_roles`, `role_has_permissions` (Spatie) |
| `2026_03_07_120000` | `almacenes`, `pasillos`, `racks`, `estantes` |
| `2026_03_08_000003` | `categorias`, `unidades_medida`, `marcas`, `productos` |
| `2026_03_08_012609` | `estados_inventario`, `inventarios` |
| `2026_03_09_003748` | `estados_orden`, `prioridades_orden`, `ordenes_surtido`, `detalles_surtido` |
| `2026_03_10_000000` | `audit_logs` |
| `2026_03_31_150000` | `detalles_surtido_ubicaciones` |
| `2026_03_31_223638` | `activity_log` (Spatie ActivityLog — base) |
| `2026_03_31_223639` | `activity_log` — columna `event` |
| `2026_03_31_223640` | `activity_log` — columna `batch_uuid` |

#### Seeders (`database/seeders/`)

| Seeder | Datos que inserta |
|--------|------------------|
| `DatabaseSeeder` | Orquesta todos los seeders en orden |
| `RoleSeeder` | Roles base: `Administrador`, `Almacenista`, `Capturista` |
| `CatalogosSeeder` | Categorías, marcas, unidades de medida, estados de inventario |
| `AlmacenSeeder` | Almacenes de ejemplo |
| `LocationSeeder` | Pasillos, racks y estantes de ejemplo |
| `ProductoSeeder` | Productos de ejemplo con SKUs |
| `EstadosPrioridadesSeeder` | Estados y prioridades de órdenes con colores |
| `InventarioSeeder` | Stock inicial en estantes |
| `OrdenesSeeder` | Órdenes de surtido de ejemplo |

---

### Configuración Crítica (`config/`)

| Archivo | Propósito |
|---------|-----------|
| `database.php` | Conexión MySQL — nombre BD, charset, pool |
| `auth.php` | Guards de autenticación (web + sanctum) |
| `sanctum.php` | `SANCTUM_STATEFUL_DOMAINS` — dominios con cookie de sesión |
| `cors.php` | Orígenes permitidos (debe incluir URL del frontend y móvil) |
| `permission.php` | Config Spatie: tabla, guard por defecto, caché de permisos |
| `activitylog.php` | Config Spatie ActivityLog: tabla, driver de conexión |
| `mail.php` | Transporte de email para notificaciones |
| `queue.php` | Driver de colas (database) |

---

## 🎨 FRONTEND WEB (`organirack-frontend`)

### Stack
- **Framework:** React 18+
- **Lenguaje:** TypeScript
- **Build:** Vite
- **Estilos:** Tailwind CSS + shadcn/ui
- **HTTP:** Axios (instancia personalizada con interceptores)

---

### Páginas (`src/app/pages/`)

| Archivo | Descripción |
|---------|-------------|
| `Login.tsx` | Autenticación — ingreso por `username` y contraseña |
| `ForgotPassword.tsx` | Flujo de recuperación de contraseña por email |
| `PanelControl.tsx` | Dashboard principal con KPIs y métricas |
| `GestionProductos.tsx` | CRUD completo de productos, categorías y marcas |
| `GestionSurtidos.tsx` | Gestión de órdenes de surtido (crear, asignar, seguir estado) |
| `GestionUsuarios.tsx` | Administración de usuarios y asignación de roles |
| `InventarioGlobal.tsx` | Vista consolidada del stock con gráficas por categoría y estante |
| `MapaAlmacen.tsx` | Visualización jerárquica de la estructura física del almacén |
| `BitacoraAuditoria.tsx` | Consulta de `audit_logs` con filtros por operador, tipo, fecha |
| `AuditoriaOverrides.tsx` | Vista específica de casos donde el almacenista modificó el estante durante el picking |
| `ReporteDiscrepancias.tsx` | Reporte de diferencias entre stock del sistema y stock real |

> **Nuevo respecto al doc anterior:** `AuditoriaOverrides.tsx` — página completamente nueva no documentada anteriormente. `PickingInteligente.tsx` ya no existe como página independiente (la funcionalidad está embebida en `GestionSurtidos.tsx`).

---

### Componentes (`src/app/components/`)

| Archivo / Carpeta | Descripción |
|------------------|-------------|
| `RootLayout.tsx` | Layout raíz — navbar y sidebar principal |
| `DashboardLayout.tsx` | Layout del área protegida del dashboard |
| `ProtectedRoute.tsx` | HOC que redirige a login si no hay sesión activa |
| `almacen/ModalAjusteStock.tsx` | Modal para ajuste manual de stock en un estante |
| `almacen/ModalEstructura.tsx` | Modal para crear/editar elementos de la jerarquía (almacén, pasillo, rack, estante) |
| `figma/` | Componentes de diseño generados desde Figma |
| `ui/` | Biblioteca de componentes base (shadcn/ui — 50+ elementos) |

---

### Servicios (`src/services/`)

| Archivo | Endpoints que cubre |
|---------|-------------------|
| `AuditService.ts` | `/api/audit-logs` — consulta de bitácora con filtros |
| `AuditOverrideService.ts` | `/api/audit/overrides` — consulta de overrides de picking |
| `dashboardService.ts` | `/api/dashboard` — métricas del panel de control |
| `inventoryService.ts` | `/api/inventory`, `/api/inventory/dashboard` — stock y gráficas |
| `locationService.ts` | `/api/locations` — CRUD de estructura físicadel almacén |
| `orderService.ts` | `/api/orders` — CRUD y gestión de órdenes de surtido |
| `productService.ts` | `/api/products`, `/api/catalogs` — productos y catálogos |

---

### Capa de Infraestructura HTTP (`src/app/lib/`)

| Archivo | Descripción |
|---------|-------------|
| `axios.ts` | Instancia Axios con `baseURL`, interceptor de request (inyecta token Bearer) e interceptor de response (manejo de 401/403) |
| `apiServices.ts` | Funciones genéricas de petición sobre la instancia Axios |
| `auth.ts` | Helpers de sesión: `getToken()`, `setToken()`, `logout()`, verificación de roles |
| `AXIOS_GUIDE.md` | Documentación interna de uso de Axios para el equipo |

---

### Tipos TypeScript (`src/tipos/`)

| Archivo | Interfaces definidas |
|---------|---------------------|
| `ordenes.ts` | `OrdenSurtido`, `DetalleSurtido`, `EstadoOrden`, `PrioridadOrden` y tipos derivados |

---

### Hooks Personalizados (`src/hooks/`)

| Archivo | Descripción |
|---------|-------------|
| `useDebounce.ts` | Hook para debounce en inputs de búsqueda (evita requests excesivos) |

---

### Estilos (`src/styles/`)

| Archivo | Descripción |
|---------|-------------|
| `tailwind.css` | Importación de capas de Tailwind CSS |
| `theme.css` | Variables CSS personalizadas (paleta de colores, radii, etc.) |
| `fonts.css` | Importación y definición de tipografías |
| `index.css` | Estilos globales de resets y base |

---

### Rutas (`src/app/routes.tsx`)
Define la navegación completa con rutas públicas y privadas mediante `ProtectedRoute`.

---

## 📱 APP MÓVIL (`OrganiRack-Movil`)

### Stack
- **Framework:** Expo SDK (React Native)
- **Lenguaje:** TypeScript
- **Routing:** Expo Router (file-based, grupos de segmento)
- **HTTP:** Cliente personalizado sobre `fetch`
- **Scanner:** expo-camera / expo-barcode-scanner

---

### Pantallas (`app/`)

#### Grupo de autenticación `(auth)/`
| Archivo | Descripción |
|---------|-------------|
| `loginScreen.tsx` | Pantalla de login — ingreso por `username` y contraseña |

#### Grupo principal `(screens)/`
| Archivo | Descripción |
|---------|-------------|
| `homeScreen.tsx` | Lista de órdenes de surtido asignadas al almacenista. Punto de entrada al flujo de picking |
| `scannerScreen.tsx` | Scanner de QR / código de barras para identificar estantes (`codigo_etiqueta`). Guía al almacenista por cada partida de la orden |
| `overrideScreen.tsx` | Pantalla de override: cuando el estante esperado no tiene stock, permite seleccionar un estante alternativo y justificar el cambio |

---

### Capa de API (`API/`)

| Archivo | Descripción |
|---------|-------------|
| `client.ts` | Cliente HTTP base: `baseURL`, headers con token Bearer |
| `endpoints.ts` | Constantes de todas las URLs del backend |
| `auth.ts` | Funciones de login, logout, almacenamiento del token en SecureStore |
| `picking.ts` | Todas las operaciones de picking: obtener órdenes, confirmar picks, registrar overrides, completar órdenes |

---

### Componentes (`components/`)

| Archivo | Descripción |
|---------|-------------|
| `ordenContainer.tsx` | Card de resumen de una orden de surtido en la lista |
| `priorityIndicator.tsx` | Badge visual de prioridad (color + texto) |
| `availabilityChecker.tsx` | Verifica disponibilidad de stock en el estante antes de confirmar el pick |
| `cameraElement.tsx` | Wrapper del escáner de cámara con manejo de permisos |
| `inputUbicacion.tsx` | Input manual de código de etiqueta (alternativa al scanner) |
| `pickConfirmButton.tsx` | Botón de confirmación de pick con lógica de validación y feedback háptico |
| `productDetailItem.tsx` | Tarjeta de detalle de una partida (producto, cantidad, ubicación) |
| `AvailabilitySection.tsx` | Sección que muestra el resultado de verificar disponibilidad |
| `LocationInputSection.tsx` | Sección de entrada de ubicación (scanner + input manual) |
| `PickingConfirmSection.tsx` | Sección de confirmación del pick con cantidades |
| `PickingProgressSection.tsx` | Barra de progreso del picking de una orden |
| `ProductDetailSection.tsx` | Sección de detalle del producto actual en la pantalla de scanner |

---

### Estado Global (`context/`)

| Archivo | Descripción |
|---------|-------------|
| `AuthContext.tsx` | Contexto React con: user, token, `login()`, `logout()`, `isLoading`. Persiste token en SecureStore |

---

### Tipos TypeScript (`types/`)

| Archivo | Interfaces definidas |
|---------|---------------------|
| `auth.ts` | `User`, `AuthCredentials`, `AuthResponse` |
| `orders.ts` | `OrdenSurtido`, `DetalleSurtido`, `PickingPayload`, `OverridePayload` y tipos derivados |

---

### Utilidades (`utils/`)

| Archivo | Descripción |
|---------|-------------|
| `pickingHelpers.ts` | Funciones puras de picking: cálculo de progreso, validación de cantidades, formateo de datos |
| `haptics.ts` | Wrappers de feedback háptico (éxito, error, warning) usando `expo-haptics` |

---

### Constantes (`constants/`)
Constantes de configuración de la aplicación (colores, textos, etc.)

---

## 🔄 Flujos de Datos Principales

### 1. Autenticación
```
Usuario → Frontend/Móvil (username + password)
  → POST /api/login
  → Backend valida, retorna { token, user, roles }
  → Cliente almacena token (localStorage / SecureStore)
  → Todas las requests incluyen: Authorization: Bearer {token}
```

### 2. Flujo de Picking (App Móvil)
```
Almacenista → homeScreen (lista de órdenes asignadas)
  → Selecciona orden → scannerScreen
  → Escanea codigo_etiqueta del estante
  → availabilityChecker verifica stock en inventarios
  → Si OK: pickConfirmButton → POST /api/mobile/picking/confirm
  → Si NO hay stock: overrideScreen → selecciona estante alternativo
    → POST /api/mobile/picking/override
  → Repite por cada partida (detalle_surtido)
  → Al completar todas: PATCH /api/orders/{id}/complete
```

### 3. Sistema de Auditoría
```
Cualquier movimiento de inventario en el backend
  → AuditService registra fila en audit_logs
     (usuario, tipo_movimiento, estante_origen, cantidades, timestamp)
  → Si fue un override: también se registra con detalle en AuditOverrideController
  → Spatie ActivityLog registra cambios CRUD genéricos en activity_log
  → Visible en: BitacoraAuditoria.tsx (logs de inventario)
               AuditoriaOverrides.tsx (overrides de picking)
```

### 4. Dashboard
```
PanelControl.tsx  → dashboardService → GET /api/dashboard
InventarioGlobal.tsx → inventoryService → GET /api/inventory/dashboard
  ↓
DashboardService / InventoryDashboardService (backend)
  → Queries agregadas sobre inventarios, órdenes, audit_logs
  → Retorna KPIs, series de gráficas, rankings
```

---

## 📊 Modelo de Datos Real (Jerarquía de dependencias)

```
users
├── ordenes_surtido (capturista_id, almacenista_id)
├── detalles_surtido_ubicaciones (user_id)
└── audit_logs (user_id)

almacenes → pasillos → racks → estantes
                                 ├── inventarios (producto × estante × estado)
                                 ├── detalles_surtido (sugerido / real)
                                 ├── detalles_surtido_ubicaciones
                                 └── audit_logs (origen / destino)

categorias ─────┐
unidades_medida ┼── productos ── inventarios
marcas ─────────┘              └── detalles_surtido

estados_inventario ── inventarios

estados_orden ─────┐
prioridades_orden ─┼── ordenes_surtido ── detalles_surtido
                   ┘                          ├── detalles_surtido_ubicaciones
                                              └── audit_logs

roles / permissions (Spatie) ── users (via model_has_roles / model_has_permissions)
activity_log (Spatie) ── cualquier modelo Eloquent con LogsActivity
```

---

## 🛡️ Configuraciones Críticas

### CORS
- Configurado en `app/Http/Middleware/HandleCorsRequests.php` (middleware custom)
- También en `config/cors.php`
- Debe incluir las URLs del frontend web y del backend para Expo Go en desarrollo

### Autenticación
- **API:** Sanctum con tokens de larga duración (header `Authorization: Bearer`)
- **Web Laravel:** Sanctum con cookies de sesión stateful (para frontends en el mismo dominio)
- `SANCTUM_STATEFUL_DOMAINS` en `.env` — crítico para cookies cross-origin

### Roles disponibles (seedeados)
| Rol | Acceso |
|-----|--------|
| `Administrador` | Dashboard completo, gestión de usuarios, catálogos, reportes |
| `Capturista` | Crear y gestionar órdenes de surtido |
| `Almacenista` | App móvil — ejecutar picking de órdenes asignadas |

---

## 🔧 Tecnologías Transversales

| Aspecto | Tecnología |
|---------|-----------|
| **HTTP Client (frontend)** | Axios con interceptores |
| **HTTP Client (móvil)** | fetch nativo con wrapper custom |
| **Autenticación** | Laravel Sanctum (tokens API) |
| **Roles y permisos** | spatie/laravel-permission |
| **Log de actividad** | spatie/laravel-activitylog |
| **Estilos (web)** | Tailwind CSS + shadcn/ui |
| **BD** | MySQL 8.0+ |
| **Testing** | Pest (backend) |
| **Build (web)** | Vite |
| **Build (móvil)** | Expo EAS |
| **Control de versión** | Git |

---

## 📝 Archivos de Documentación del Proyecto

### En `Documentacion/` (carpeta principal del proyecto)
| Archivo | Contenido |
|---------|-----------|
| `INDICE_DOCUMENTACION.md` | Índice general de toda la documentación |
| `RESUMEN_EJECUTIVO.md` | Resumen ejecutivo de alto nivel |
| `ESTRUCTURA_PROYECTO.md` | Árbol de directorios simplificado |
| `ESTRUCTURA_PROYECTO_DETALLADO.md` | **Este archivo** |
| `ANALISIS_FLUJO_PICKING_COMPLETO.md` | Análisis detallado del flujo de picking |
| `ARQUITECTURA_PICKING_TECNICA.md` | Arquitectura técnica del módulo de picking |
| `IMPLEMENTACION_CODIGO_LISTO.md` | Código de referencia listo para implementar |
| `GUIA_SUPER_SEEDERS.md` | Guía para ejecutar seeders en producción |
| `RESUMEN_CAMBIOS_MAESTROS.md` | Historial de cambios arquitectónicos importantes |

### En `organirack-backend/database/drafts/`
| Archivo | Contenido |
|---------|-----------|
| `ESQUEMA_REAL_BD.sql` | ⭐ Esquema SQL real basado en migraciones (fuente de verdad) |
| `ESQUEMA_REAL_BD.md` | Documentación del esquema con tablas y comentarios |

---

## 📋 Checklist de Configuración

### Backend
- [ ] `.env` con `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- [ ] `.env` con `APP_KEY` (generada con `php artisan key:generate`)
- [ ] `APP_URL` apuntando al backend
- [ ] `SANCTUM_STATEFUL_DOMAINS` con el dominio del frontend web
- [ ] `CORS` configurado para frontend y móvil
- [ ] `MAIL_*` si se usan notificaciones por email
- [ ] `php artisan migrate` — ejecutar las 14 migraciones
- [ ] `php artisan db:seed` — datos iniciales (roles, catálogos, almacenes, órdenes de ejemplo)

### Frontend Web
- [ ] `.env.local` con `VITE_API_URL=http://...`
- [ ] `npm install && npm run dev`

### App Móvil
- [ ] `.env` con `EXPO_PUBLIC_API_URL=http://...`
- [ ] `npx expo start` para desarrollo local
- [ ] IP del backend accesible desde el dispositivo físico/emulador

---

## ⚠️ Diferencias vs. Documentación Anterior (25/03/2026)

| Aspecto | Doc. anterior | Estado actual |
|---------|--------------|---------------|
| Modelo `Edificio` | Documentado | **Eliminado** — `Almacen` es la raíz |
| Jerarquía física | `Edificio → Almacen → Pasillo → Rack → Estante` | `Almacen → Pasillo → Rack → Estante` |
| Página `PickingInteligente.tsx` | Documentada | **No existe** — funcionalidad en `GestionSurtidos.tsx` |
| Página `AuditoriaOverrides.tsx` | No documentada | **Nueva página** |
| Servicio `AuditOverrideService.ts` | No documentado | **Nuevo servicio** |
| Controlador `AuditOverrideController` | No documentado | **Nuevo controlador** |
| Tabla `detalles_surtido_ubicaciones` | No documentada | **Tabla añadida** (multi-pick granular) |
| Tabla `activity_log` | No documentada | **Tabla añadida** (Spatie ActivityLog) |
| Tablas `cache`, `jobs`, `failed_jobs`, etc. | No documentadas | **Añadidas** (infra Laravel) |
| Componentes móviles | 2 documentados | **12 componentes** actualmente |
| API móvil | 3 archivos | **4 archivos** (`picking.ts` añadido) |
| Tipos móviles | `auth.ts` | `auth.ts` + `orders.ts` |
| Utilidades móviles | No documentadas | `pickingHelpers.ts` + `haptics.ts` |
| Servicios backend | No detallados | **9 servicios** documentados |
| Form Requests | No documentados | **4 requests** documentados |
