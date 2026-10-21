# Política de Sesión y Timeout

Información de seguridad y configuración de expiración de sesiones en OrganiRack+ Mobile.

## Política de Timeout (15 minutos)

Toda sesión autenticada en la aplicación móvil tiene una duración máxima de **15 minutos**. Pasado este tiempo, la sesión se invalida automáticamente y el usuario debe iniciar sesión nuevamente.

### Razón de la Política

Esta política implementa un control de seguridad importante para:
- Proteger datos sensibles del almacén en caso de dispositivo perdido
- Reducir riesgo de acceso no autorizado
- Cumplir con políticas de seguridad empresarial

## Flujo de Funcionamiento

### 1. Inicio de Sesión

```typescript
// Usuario proporciona credenciales en pantalla de login
POST /api/login {email, password}

// Sistema:
- Valida credenciales en backend
- Recibe token JWT
- Guarda token en SecureStore (cifrado)
- Registra timestamp actual como session_timestamp
- Inicia verificador periódico
```

### 2. Durante la Sesión

```typescript
// Cada 60 segundos: verificación automática
setInterval(() => {
  const elapsed = Date.now() - sessionTimestamp
  if (elapsed > 15 * 60 * 1000) {
    // Sesión expirada, ejecutar limpieza
  }
}, 60000)
```

El usuario puede continuar trabajando normalmente mientras:
- No hayan pasado 15 minutos desde el login
- El dispositivo tenga conexión de red activa
- No cierre manualmente la aplicación

### 3. Expiración de Sesión

Cuando se detecta que han pasado 15 minutos:

```typescript
// Limpieza automática
SecureStore.removeItem('auth_token')
SecureStore.removeItem('session_timestamp')

// Notificación al usuario
Alert.alert('Sesión Expirada', 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.')

// Redirección a login
router.push('/(auth)/login')
```

### 4. Verificación al Abrir la App

Cuando el usuario abre la aplicación:

```typescript
if (tokenExists && sessionExpired) {
  // Token existe pero sesión caducó
  clearSecureStore()
  showAlert('Tu sesión ha expirado')
  navigateToLogin()
} else if (tokenExists && sessionValid) {
  // Token existe y sesión válida
  restoreSession()
  navigateToHome()
} else {
  // Sin token, mostrar login
  navigateToLogin()
}
```

## Almacenamiento Seguro

Los datos de sesión se almacenan en **SecureStore** (almacenamiento encriptado a nivel del SO):

| Campo | Valor | Propósito |
|-------|-------|----------|
| `auth_token` | JWT token | Autenticación en API |
| `session_timestamp` | Milisegundos | Verificar expiración |

Ambos se cifran automáticamente y se eliminan cuando:
- La sesión expira
- El usuario hace logout manualmente
- El app se desinstala

## Configuración

### Parámetros Actuales

```properties
# En API/auth.ts - Configuración de timeout
SESSION_TIMEOUT_MINUTES = 15         // Duración máxima
CHECK_INTERVAL_SECONDS = 60          // Frecuencia de verificación
```

### Cambiar Configuración

Para modificar el timeout de sesión (ejemplo: cambiar a 30 minutos):

**Archivo:** `API/auth.ts`

```typescript
// Cambiar de:
const SESSION_TIMEOUT_MINUTES = 15

// A:
const SESSION_TIMEOUT_MINUTES = 30
```

**Archivo:** `context/AuthContext.tsx`

```typescript
// En la función startSessionCheck():
// Cambiar de:
const sessionTimeoutMinutes = 15

// A:
const sessionTimeoutMinutes = 30
```

También se puede configurar por ambiente en `.env`:

```properties
EXPO_PUBLIC_SESSION_TIMEOUT=1800000   # 30 minutos en milisegundos
```

## Notas Técnicas

### Prevención de Memory Leaks

```typescript
// En AuthContext.tsx - Limpieza al desmontar
useEffect(() => {
  const intervalId = setInterval(checkSessionExpiration, 60000)
  
  return () => {
    clearInterval(intervalId)  // Limpia intervalo
  }
}, [])
```

### Validación en Interceptores

Además de la verificación periódica, el cliente HTTP también valida:

```typescript
// En API/client.ts - Interceptor de response
responseInterceptor: {
  if (status === 401) {
    // Token expirado o inválido
    clearSession()
    redirectToLogin()
  }
}
```

### Consideraciones de Producción

- El timeout se aplica **por dispositivo/sesión**, no globalmente
- Si el usuario inicia sesión en 2 dispositivos, cada uno tiene su propio timeout
- El cierre de sesión en un dispositivo no afecta otros
- El network timeout no afecta el session timeout

## Solución de Problemas

### Usuario Se Desconecta Demasiado Rápido

**Verificar:**
1. Configuración en `.env`: `EXPO_PUBLIC_SESSION_TIMEOUT`
2. Timestamp se registra correctamente al login
3. Reloj del dispositivo está sincronizado

**Solución:**
```bash
# Para testing, reducir temporalmente timeout a 1 minuto
EXPO_PUBLIC_SESSION_TIMEOUT=60000

# Luego verificar logs:
console.log('Session timestamp:', sessionTimestamp)
console.log('Current time:', Date.now())
console.log('Elapsed minutes:', (Date.now() - sessionTimestamp) / 1000 / 60)
```

### Usuario NO Se Desconecta al Expirar

**Verificar:**
1. `startSessionCheck()` se ejecutó en AuthContext
2. No hay errores en consola al iniciar AuthProvider
3. El interval no fue limpiado prematuramente

**Solución:**
```bash
# Habilitar logs de debug
// En context/AuthContext.tsx
useEffect(() => {
  console.log('[SessionCheck] Timer started')
  return () => console.log('[SessionCheck] Timer cleaned up')
}, [])
```

## Referencias Relacionadas

- [Autenticación](docs/es/arquitectura.md#flujo-de-autenticación)
- [Resolución de Problemas de Autenticación](docs/es/resolucion-problemas.md#problemas-de-autenticación)
- [Configuración de Entorno](docs/es/guia-instalacion.md#variables-de-entorno)

---

**Última Actualización:** 2026-04-16  
**Versión:** 2.1.0
