# Arquitectura y Decisiones de Diseño

Descripción general de la arquitectura del sistema y patrones arquitectónicos utilizados en OrganiRack+ Mobile.

## Arquitectura del Sistema

### Arquitectura en Capas

La aplicación sigue una arquitectura clásica de tres niveles:

```
┌─────────────────────────────────────────┐
│   Capa de Presentación (UI)             │
│   Screens: homeScreen, scannerScreen    │
│   Componentes: ProductDetail, Sections  │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   Capa de Lógica Empresarial            │
│   Hooks: usePickingFlow, useAuth        │
│   Context: AuthContext                  │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   Capa de Acceso a Datos                │
│   Servicios API: auth.ts, picking.ts    │
│   Cliente HTTP: Axios con interceptores │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   Servicios Backend (API Laravel)       │
│   Autenticación, Gestión de Órdenes     │
└─────────────────────────────────────────┘
```

### Jerarquía de Componentes

```
App (_layout.tsx)
├── Proveedor AuthContext
│   └── Controlador de Navegación
│       ├── Rutas (auth) (no autenticadas)
│       │   └── pantallLogin
│       └── Rutas (screens) (autenticadas)
│           ├── pantallaPrincipal (lista de órdenes)
│           ├── pantallaScanner (interfaz de picking)
│           └── pantallaOverride (selección de ubicación)
```

## Patrones de Diseño

### 1. Separación de Responsabilidades (SoC)

La lógica empresarial se aísla de la presentación mediante hooks personalizados:

- **Componentes UI:** Solo renderizan, sin llamadas API ni estado complejo
- **Hooks Personalizados:** Encapsulan lógica empresarial con responsabilidad única
- **Context:** Gestiona estado global de aplicación (autenticación)
- **Servicios:** Manejan comunicación HTTP con backend

**Beneficio:** Los cambios en lógica empresarial no requieren refactorización de UI, y la UI puede rediseñarse sin tocar lógica empresarial.

### 2. Arquitectura de Hooks Personalizados

El sistema de picking usa 8 hooks especializados, cada uno manejando una responsabilidad:

```typescript
usePickingFlow          // Orquestador principal
├── usePickingOrder    // Carga y gestión de orden actual
├── usePickingDetails  // Navegación entre items
├── useLocationInput   // Parseo de entrada de ubicación
├── useAvailabilityCheck // Verificación de disponibilidad
├── usePickingConfirm  // Envío de confirmación a API
├── useOverrideMode    // Selección de ubicación alternativa
└── usePickingUIState  // Estado de UI (modales, cargando)
```

Cada hook:
- Tiene responsabilidad única y claramente definida
- Retorna conjunto enfocado de estado y funciones
- Puede testearse independientemente
- Es reutilizable en diferentes screens

### 3. Context API para Estado Global

El estado de autenticación se gestiona globalmente mediante React Context:

```typescript
// Provee estado auth a toda la app
<AuthContext.Provider value={{ user, token, logout }}>
  <NavigationController />
</AuthContext.Provider>

// Consumido en componentes
const { user, token } = useAuth();
```

**Ventajas:**
- Evita prop drilling
- Única fuente de verdad para autenticación
- Menos re-renderizados comparado con Redux
- Construido en React (sin dependencia externa)

### 4. Patrón de Interceptor HTTP

Los interceptores de Axios manejan:

- Request: Adjuntar token de autorización
- Response: Manejar errores, refrescar tokens expirados
- Lógica de reintento automático para solicitudes fallidas

### 5. Enrutamiento Basado en Archivos (Expo Router)

Las rutas se definen por estructura de archivos:

```
app/
├── (auth)/          → Navegación stack para rutas auth
│   └── loginScreen.tsx
├── (screens)/       → Navegación tab para app principal
│   ├── homeScreen.tsx
│   ├── scannerScreen.tsx
│   └── overrideScreen.tsx
└── _layout.tsx      → Navegación raíz con verificación auth
```

**Beneficios:**
- Rutas autodocumentadas
- Separación de código automática
- Boilerplate reducido
- Estructura de carpetas coincide con navegación

## Flujo de Datos

### Estado de Picking

```
Usuario Abre App
  ↓
Cargar Órdenes (API)
  ↓
Mostrar Lista de Órdenes
  ↓
Usuario Selecciona Orden
  ↓
Cargar Detalles de Orden
  ↓
Ingresar Ubicación
  ↓
Verificar Disponibilidad
  ↓
Confirmar Pick
  ↓
Enviar a Backend
  ↓
Actualizar Estado Local
  ↓
Mostrar Siguiente Item u Orden
```

## Manejo de Errores

### Estrategia de Tres Niveles

**1. Nivel API:**
```typescript
// En client.ts interceptores
if (error.response?.status === 422) {
  // Error de validación - mostrar errores de campo específicos
} else if (error.response?.status === 401) {
  // No autorizado - refrescar token
}
```

**2. Nivel Hook:**
```typescript
// En usePickingConfirm
try {
  await confirmPickingAPI(data);
} catch (error) {
  setError(error.message);
  // Hook mantiene estado de error
}
```

**3. Nivel Componente:**
```typescript
// En scannerScreen
if (error) {
  return <AlertaError message={error} onRetry={handleRetry} />;
}
```

## Flujo de Autenticación

### Proceso de Login

1. Usuario ingresa credenciales en pantallLogin
2. Hook `useAuth` llama a `loginAPI()`
3. Backend valida y retorna token JWT
4. Token se almacena en almacenamiento encriptado del dispositivo
5. Estado AuthContext se actualiza
6. Navegación redirige a app principal
7. Token se adjunta automáticamente a solicitudes posteriores

### Gestión de Sesión

- **Timeout:** 15 minutos de inactividad
- **Renovación de Token:** Automática antes de expiración
- **Logout:** Limpia token, context, y resetea navegación

## Decisiones Arquitectónicas Clave

### 1. Composición de Hooks (Sin Redux)

**Decisión:** Usar composición de hooks especializados orquestados por `usePickingFlow` en lugar de Redux o Context API global.

**Alternativas Consideradas:**
- Redux: Más boilerplate, excesivo para esta lógica
- Context API: Rendimiento degradado con actualizaciones frecuentes
- **Composición de Hooks: ✅ Elegida**

**Justificación:**
- Mejor granularidad: cada hook responsable de un concepto
- Mejor testing: hooks independientes y aislables
- Mejor performance: solo componentes necesarios se re-renderizan
- Más simple: menos abstracción que Redux

**Resultado:**
- Hooks reutilizables (usePickingConfirm usado en múltiples screens)
- Testing fácil de cada hook independientemente
- Bajo acoplamiento entre responsabilidades
- Alta cohesión dentro de cada responsabilidad

### 2. Parámetros de Navegación Como Fuente de Verdad

**Decisión:** Usar parámetros de navegación (`router.push({ params: {...} })`) para comunicación entre screens en lugar de estado global.

**Motivo:**
- Cada screen instancia sus propios hooks
- No hay estado compartido entre instancias
- Parámetros son el "contrato" explícito entre screens
- Traceable qué datos se transfieren
- Evita acoplamiento implícito

### 3. Política de Timeout: 15 Minutos

La aplicación implementa timeout automático de sesión para seguridad:

**Configuración:**
- Duración máxima de sesión: 15 minutos de inactividad
- Verificación periódica: Cada 60 segundos
- Almacenamiento: `session_timestamp` en `expo-secure-store`

**Flujo de Funcionamiento:**

```
Inicio Sesión
  ↓
Token + timestamp guardados en SecureStore
  ↓
Verificador periódico iniciado (cada 60 seg)
  ↓
Durante Sesión: Verifica si tiempo_actual - timestamp > 15 min
  ↓
Si expira: Limpia token, desconecta usuario
```

**Tiempos Configurables:**
```typescript
// En AuthContext.tsx
sessionTimeoutMinutes = 15;    // Cambiar para ajustar duración
setInterval(..., 60000);       // Cambiar para ajustar frecuencia
```

**Implementación Técnica:**
- Verificador ejecuta en background cada 60 segundos
- Se limpia interval al desmontar AuthProvider (evitar memory leaks)
- Expiración verificada también al iniciar la app
- Memory leak prevenido con useRef y cleanup en useEffect

## Consideraciones de Rendimiento

### 1. Memo y useCallback

Prevenir re-renderizados innecesarios:

```typescript
// Prevenir recreación en cada render
const handleConfirm = useCallback(() => {
  // Implementación
}, [dependencies]);

// Prevenir re-renderizado de hijos
const MemoizedComponent = React.memo(Component);
```

### 2. FlatList para Listas de Órdenes

Usar FlatList en lugar de ScrollView para listas largas:

```typescript
<FlatList
  data={orders}
  renderItem={({ item }) => <OrderCard order={item} />}
  keyExtractor={(item) => item.id}
/>
```

### 3. Carga Perezosa

Cargar detalles de orden solo cuando sea necesario, no toda la orden por adelantado.

## Consideraciones de Seguridad

### Almacenamiento de Token

- Tokens almacenados en `expo-secure-store` (encriptación a nivel SO)
- Nunca registrado o expuesto en consola
- Limpiado al logout

### Comunicación API

- Todas las llamadas API usan HTTPS en producción
- Timeout de API previene cuelgues indefinidos
- Validación de respuesta con TypeScript

### Validación de Entrada

- Códigos de ubicación validados antes de envío a API
- Códigos de producto verificados contra datos backend
- Toda entrada de usuario considerada potencialmente no confiable

## Decisiones Arquitectónicas Justificadas

### ¿Por Qué Hooks Personalizados en Lugar de Redux?

- Modelo mental más simple
- Boilerplate reducido
- Integrado en React
- Suficiente para alcance actual de aplicación
- Migración a Redux posible si es necesario después

### ¿Por Qué Expo Router en Lugar de React Navigation Manual?

- Enrutamiento basado en archivos familiar para desarrolladores web
- Deep linking automático
- Integrado en ecosistema Expo
- Menos boilerplate

### ¿Por Qué Context API en Lugar de Redux para Auth?

- Autenticación es singleton global
- Context evita prop drilling
- Redux excesivo para estado global simple
- Testing más fácil sin setup de Redux

## Mejoras Arquitectónicas Futuras

1. **Sincronización Offline:** Sistema de cola para operaciones durante pérdida de conexión
2. **Capa de Caché:** Redux o Zustand si la app escala
3. **Error Boundary:** Componentes para capturar errores de renderizado
4. **Analytics:** Seguimiento de interacciones y métricas
5. **Feature Flags:** Habilitar/deshabilitar características remotamente
6. **Persistencia de Estado:** Restaurar estado de app entre sesiones
