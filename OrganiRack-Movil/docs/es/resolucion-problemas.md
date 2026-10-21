# Guía de Resolución de Problemas

Soluciones para problemas comunes encontrados durante desarrollo y deployment de producción.

## Problemas de Autenticación

### Problema: Login Falla con Credenciales Inválidas

**Síntomas:**
- Respuesta 401 No Autorizado en intento de login
- Mensaje de error: "Credenciales inválidas"
- Estado de autenticación no se actualiza

**Causas Raíz:**
1. Email o contraseña incorrectos
2. Cuenta de usuario no activa en backend
3. API backend no corriendo
4. Endpoint de API incorrecto en `.env`

**Soluciones:**

**Paso 1: Verificar Credenciales**
- Confirmar email y contraseña son correctos
- Cuenta de usuario existe en backend y está habilitada
- Verificar que el usuario tiene rol de picker asignado

**Paso 2: Testear Conectividad Backend**
```bash
# Desde máquina de desarrollo
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"picker@warehouse.local","password":"password"}'

# Desde emulador Android (backend local)
# Usar 10.0.2.2 en lugar de 127.0.0.1
curl -X POST http://10.0.2.2:8000/api/login ...
```

**Paso 3: Verificar Configuración de `.env`**
```properties
# Verificar que endpoint es correcto
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api  # Para desarrollo local
```

### Problema: Token Expira Muy Rápido

**Síntomas:**
- Desconexión después de pocos minutos a pesar de actividad
- Errores 401 a mitad de sesión
- Notificación de timeout de sesión aparece inesperadamente

**Causas Raíz:**
1. Timeout de sesión configurado agresivamente (default: 15 minutos)
2. TTL de token en backend demasiado corto
3. Interceptor no está refrescando token correctamente

**Soluciones:**

**Verificar Configuración:**
```properties
# En .env - timeout de sesión en milisegundos
EXPO_PUBLIC_SESSION_TIMEOUT=900000  # 15 minutos

# Para testing, reducir temporalmente a:
EXPO_PUBLIC_SESSION_TIMEOUT=60000   # 1 minuto
```

**Verificar Token en Backend:**
```bash
# Revisar configuración de Laravel Sanctum
# config/sanctum.php: valor de expiración (en minutos)
# Default es 525600 (1 año)
```

### Problema: Logout No Funciona

**Síntomas:**
- Botón de logout no responde
- Usuario permanece logueado después de logout
- Token aún en almacenamiento después de logout

**Soluciones:**

**Verificar Implementación de Logout:**
```typescript
// En API/auth.ts
export async function logoutAPI() {
  try {
    await client.post('/logout');
  } finally {
    // Limpiar de todas formas
    await SecureStore.deleteItemAsync('auth_token');
  }
}
```

**Verificar Reset de Navegación:**
```typescript
// Después de logout en AuthContext
navigation.reset({
  index: 0,
  routes: [{ name: 'Login' }]
});
```

## Problemas del Sistema de Picking

### Problema: Error 422 en Confirmación de Pick

**Síntomas:**
- Confirmación falla con error "Entidad No Procesable"
- Backend retorna errores de validación específicos por campo
- Error específico: `estante_id debe ser entero`

**Causa Raíz:** Type Mismatch
El backend espera `estante_id` como entero, pero la app estaba enviando código de ubicación como string.

**Solución:**

**Conversión Requerida en usePickingFlow:**
```typescript
// ANTES (incorrecto) - envía código de ubicación como string
const confirmData = {
  order_id: order.id,
  item_id: item.id,
  location_picked: userLocation,      // "A-01-01"
  quantity_picked: quantity,
  estante_id: userLocation,            // ❌ INCORRECTO: string en lugar de entero
  timestamp: new Date().toISOString()
};

// DESPUÉS (correcto) - convierte ubicación a ID entero
const confirmData = {
  order_id: order.id,
  item_id: item.id,
  location_picked: userLocation,      // "A-01-01"
  quantity_picked: quantity,
  estante_id: parseInt(locationIdMap[userLocation]), // ✓ Correcto: entero
  timestamp: new Date().toISOString()
};
```

**Mapeo de ID de Ubicación:**
El código de ubicación debe convertirse a su ID entero del backend. Este mapeo se obtiene de:
1. Respuesta de verificación de disponibilidad inicial
2. Respuesta de detalles de orden
3. Llamada API separada de lista de ubicaciones

### Problema: NaN Mostrado en Pantalla Override

**Síntomas:**
- Ubicaciones alternativas muestran "NaN" en lugar de cantidades
- Pantalla de override se congela al seleccionar ubicación
- Valores de navegación indefinidos o inválidos

**Causa Raíz:** Normalización de Datos de Ubicación
Las ubicaciones alternativas de la API retornaron estructura diferente a la esperada. El mapeo falló resultando en valores NaN.

**Solución:**

**Funciones Helper para Normalización:**
```typescript
// En utils/pickingHelpers.ts
function normalizeUbicacionesForOverride(
  locations: any[]
): Location[] {
  return locations.map(loc => ({
    codigo: loc.codigo || loc.location_code || '',
    cantidad: Number(loc.cantidad || loc.quantity || 0),
    disponible: Boolean(loc.disponible || loc.available),
    estante_id: Number(loc.estante_id || loc.location_id || 0)
  }));
}
```

**Actualizar Hook useOverrideLocations:**
```typescript
useEffect(() => {
  if (currentItem?.locations_alternative) {
    const normalized = buildUbicacionesForOverride(currentItem);
    setLocations(normalized);
  }
}, [currentItem?.id]); // Solo re-ejecutar cuando el item cambia
```

### Problema: Bucle Infinito en Pantalla Override

**Síntomas:**
- Pantalla de override se congela o se vuelve no responsiva
- Uso de CPU se dispara
- useEffect se ejecuta repetidamente
- Navegación hacia atrás falla

**Causa Raíz:** Problema de Dependencias en useEffect
El useEffect vigilaba props que se recreaban en cada render, causando bucle infinito.

**Solución:**

**Dependencias Correctas de useEffect:**
```typescript
// ANTES (incorrecto) - prop recreada en cada render
useEffect(() => {
  setLocations(currentItem?.locations_alternative || []);
}, [currentItem?.locations_alternative]); // ❌ Array recreado cada render

// DESPUÉS (correcto) - vigilar ID del item
useEffect(() => {
  const normalized = buildUbicacionesForOverride(currentItem);
  setLocations(normalized);
}, [currentItem?.id]); // ✓ Solo cambia cuando el item actual cambia
```

## Problemas de UI y Rendering

### Problema: Componentes No Se Re-renderizan Después de Actualización de Estado

**Síntomas:**
- Click en botón no actualiza UI
- Datos nuevos de API no se muestran
- Estado cambia pero vista permanece igual

**Causas Raíz:**
1. Mutación de estado en lugar de actualización inmutable
2. Dependencia faltante en useEffect
3. Componente envuelto en React.memo sin comparación de props adecuada

**Soluciones:**

**Asegurar Actualizaciones Inmutables:**
```typescript
// INCORRECTO: Mutación de estado directa
const [order, setOrder] = useState(null);
order.status = 'completed';  // ❌ Mutación directa

// CORRECTO: Crear nuevo objeto
setOrder({
  ...order,
  status: 'completed'  // ✓ Crea nueva referencia
});

// Para arrays:
setItems([
  ...items,
  newItem  // ✓ Crea nuevo array
]);
```

**Verificar Dependencias de useEffect:**
```typescript
// INCORRECTO: Falta dependencia
useEffect(() => {
  loadOrder(orderId);
  // ❌ Sin dependencia - se ejecuta una sola vez
}, []);

// CORRECTO: Incluir dependencias
useEffect(() => {
  loadOrder(orderId);
}, [orderId]); // ✓ Se ejecuta cuando orderId cambia
```

## Problemas de Red y API

### Problema: "Error de Red. Verifica Tu Conexión"

**Síntomas:**
- Solicitudes API fallan inmediatamente
- Error aparece incluso con buena conexión a internet
- Funciona en navegador pero no en app

**Causas Raíz:**
1. Endpoint de API incorrecto en `.env`
2. Backend no está corriendo o no accesible
3. Firewall bloqueando conexiones
4. Error en validación de certificado
5. Problemas de resolución DNS

**Soluciones:**

**Testear Conectividad de API:**
```bash
# Desde computadora
ping backend.local
curl -I http://backend.local/api/health

# Desde emulador Android (si testing local)
# Usar 10.0.2.2 en lugar de 127.0.0.1
curl -I http://10.0.2.2:8000/api/health
```

**Actualizar `.env`:**
```properties
# Desarrollo local
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api

# Servidor remoto
EXPO_PUBLIC_API_URL=https://api.ejemplo.com/api
```

**Verificar Backend está Corriendo:**
```bash
# Verificación backend Laravel
curl -X GET http://localhost:8000/api/health

# Respuesta debe ser 200 OK, no "connection refused"
```

### Problema: Solicitudes Timeout

**Síntomas:**
- Solicitudes fallan después de 30 segundos
- Mensajes de error "Network timeout"
- Operaciones lentas (órdenes, confirmación) fallan

**Causas Raíz:**
1. Backend procesando demasiado lentamente
2. Problemas de conectividad de red
3. Servidor sobrecargado
4. Queries de base de datos lentas

**Soluciones:**

**Verificar Rendimiento del Backend:**
```bash
# Testear endpoint directamente para medir tiempo de respuesta
time curl -X GET http://localhost:8000/api/mobile/picking/orders

# Si > 30 segundos, backend necesita optimización
```

**Aumentar Timeout (Si es Necesario):**
```properties
# En .env - aumentar desde default 30 segundos
EXPO_PUBLIC_API_TIMEOUT=60000  # 60 segundos
```

## Problemas de Rendimiento

### Problema: La App se Siente Lenta o Lagueada

**Síntomas:**
- Navegación entre pantallas tiene retraso
- Scrolling se entrecorta
- Clicks en botones no responsivos
- Lista de órdenes se renderiza lentamente

**Causas Raíz:**
1. Listas grandes sin usar FlatList
2. Componentes re-renderizándose innecesariamente
3. Computaciones pesadas en render
4. Llamadas API no memoizadas
5. Demasiados listeners de eventos

**Soluciones:**

**Usar FlatList para Listas Largas:**
```typescript
// INCORRECTO: ScrollView con muchos items
<ScrollView>
  {orders.map(order => <TarjetaOrden key={order.id} order={order} />)}
</ScrollView>

// CORRECTO: FlatList para rendimiento
<FlatList
  data={orders}
  renderItem={({ item }) => <TarjetaOrden order={item} />}
  keyExtractor={item => item.id.toString()}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
/>
```

**Memoizar Operaciones Costosas:**
```typescript
const valorCostoso = useMemo(
  () => computarValorCostoso(data),
  [data]
);

const handlePress = useCallback(
  () => hacerAlgo(valor),
  [valor]
);
```

## Problemas Específicos del Dispositivo

### Problema: App Se Congela en Android

**Síntomas:**
- App force close
- Diálogo de error Android aparece
- Screens específicas causan congelo
- Funciona en iOS pero no en Android

**Soluciones:**

**Revisar Logs de Android:**
```bash
# Ver logs en tiempo real
adb logcat | grep FATAL

# Filtrar logs específicos de app
adb logcat | grep OrganiRack
```

**Problemas Comunes de Android:**

| Problema | Solución |
|---------|---------|
| Falta de Memoria | Reducir tamaño de imágenes, implementar paginación |
| Error de WebSocket | Usar configuración de red apropiada para emulador |
| Permiso de Cámara Denegado | Solicitar permisos en runtime usando expo-permissions |

## Obtener Ayuda

### Información de Depuración a Recopilar

Cuando reportes problemas, incluye:

1. **Entorno de App:**
   - SO y versión (Android 12, iOS 16)
   - Modelo de dispositivo
   - Versión de app

2. **Detalles de Error:**
   - Mensaje de error completo y stack trace
   - Pasos para reproducir
   - Cuándo comenzó el error

3. **Información de Red:**
   - Endpoint de API
   - Tipo de red (WiFi, 4G, etc.)
   - Latencia/velocidad si está disponible

4. **Logs:**
   - Logs de consola desde Expo
   - Logs de sistema Android/iOS
   - Logs de API backend

### Recursos

- [Resolución de Problemas React Native](https://reactnative.dev/docs/troubleshooting)
- [Ayuda de Expo](https://docs.expo.dev/guides/)
- [Stack Overflow React Native](https://stackoverflow.com/questions/tagged/react-native)
- Problemas del Proyecto GitHub: https://github.com/Apoquellia/OrganiRackPlus/issues
