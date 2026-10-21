# Guía de Instalación y Configuración

Configuración completa del entorno para desarrollo de OrganiRack+ Mobile.

## Requisitos Previos

Antes de comenzar, asegúrate de tener:

- **Node.js 18.0.0 o superior** con npm 9.0.0+
  - Verificar: `node --version && npm --version`
- **Git** para control de versiones
- **Expo CLI** instalado globalmente: `npm install -g expo-cli`
- **Android SDK** (API 36+) para desarrollo Android, o
- **Xcode 14+** para desarrollo iOS

## Configuración del Entorno de Desarrollo

### 1. Clonar Repositorio

```bash
git clone https://github.com/Apoquellia/OrganiRackPlus.git
cd OrganiRackPlus/OrganiRack-Movil
```

### 2. Instalar Dependencias

```bash
npm install
```

**Resolución de Problemas de Dependencias:**

Si encuentras advertencias de compatibilidad o conflictos de dependencias:

```bash
# Limpiar caché y reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Si los conflictos persisten, usar flag de dependencias heredadas
npm install --legacy-peer-deps
```

### 3. Configuración del Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Editar `.env` con tu configuración:

```properties
# Configuración de API Backend
EXPO_PUBLIC_API_URL=http://tu-backend-url/api
EXPO_PUBLIC_API_TIMEOUT=30000

# Configuración de Autenticación
EXPO_PUBLIC_SESSION_TIMEOUT=900000

# Entorno
NODE_ENV=development
```

**Notas Importantes:**

- Las variables con prefijo `EXPO_PUBLIC_` se incrustan en el bundle de la app y son visibles para usuarios finales
- Nunca hacer commit del archivo `.env`; usar `.env.example` como plantilla de referencia
- Las credenciales sensibles deben almacenarse solo en el backend
- El timeout de API está en milisegundos (30000 = 30 segundos)

### 4. Configuración de API Backend

La aplicación se conecta a un backend Laravel. Configurar el endpoint en `.env`:

```properties
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api  # Para desarrollo local
# O
EXPO_PUBLIC_API_URL=https://api.ejemplo.com/api     # Para producción
```

**Requisitos de Endpoint:**

- GET `/login` — Autenticación de usuario
- POST `/mobile/picking/orders` — Obtener órdenes asignadas
- GET `/mobile/picking/{id}` — Obtener detalles de orden
- POST `/mobile/picking/confirmar` — Confirmar operación de picking

Consulta [Referencia de API](api-referencia.md) para especificaciones detalladas.

## Configuración de Android

### Emulador Android

#### Opción A: Usando Android Studio (Recomendado)

1. Descargar e instalar [Android Studio](https://developer.android.com/studio)
2. Abrir Android Studio y acceder a AVD Manager
3. Crear nuevo dispositivo virtual (API 36+ recomendado)
4. Iniciar el emulador

#### Opción B: Línea de Comandos

```bash
# Listar dispositivos disponibles
emulator -list-avds

# Iniciar emulador (ejemplo: Medium_Phone_API_36.0)
emulator -avd Medium_Phone_API_36.0 -no-snapshot-load
```

### Ejecutar en Emulador Android

```bash
# Terminal 1: Iniciar emulador
emulator -avd Medium_Phone_API_36.0 -no-snapshot-load

# Terminal 2: Iniciar servidor Expo
npm start

# Seleccionar 'a' en el menú de Expo para abrir en Android
```

O usar script combinado:

```bash
npm run dev  # Inicia emulador y servidor Expo
```

## Configuración de iOS

### Requisitos

- macOS 12.0+
- Xcode 14.0+
- Gestor de paquetes CocoaPods
- Cuenta de Desarrollador Apple (para pruebas en dispositivo)

### Simulador iOS

```bash
# Terminal 1: Iniciar servidor Expo
npm start

# Terminal 2: Abrir en simulador iOS (presionar 'i' en menú Expo)
```

O usar npm script:

```bash
npm run ios
```

## Desarrollo Web

Para pruebas en navegador/web:

```bash
npm run web

# La app estará disponible en http://localhost:8081
```

**Nota:** Algunas características de React Native pueden no funcionar en web. Para testing completo, usar emuladores móviles.

## Servidor de Desarrollo

### Iniciar Servidor de Desarrollo

```bash
npm start
```

Esto abre el menú de Expo Go con opciones:

- Presionar `a` — Abrir en emulador Android
- Presionar `i` — Abrir en simulador iOS
- Presionar `w` — Abrir en navegador web
- Presionar `j` — Abrir debugger
- Presionar `r` — Recargar app
- Presionar `m` — Alternar menú

### Recarga en Vivo

Los cambios en el código se recargan automáticamente en dispositivos conectados:

- **Fast Refresh:** La mayoría de cambios (UI, lógica) se recargan instantáneamente
- **Recarga Completa:** Algunos cambios (dependencias, código nativo) requieren recarga manual

## Depuración

### React Native Debugger

Para depuración avanzada:

```bash
npm install -g react-native-debugger

# Iniciar debugger y luego presionar 'm' en menú Expo para conectar
```

### Logging en Consola

Todos los console logs aparecen en la terminal ejecutando Expo:

```typescript
console.log('Mensaje de depuración');
console.warn('Mensaje de advertencia');
console.error('Mensaje de error');
```

### Depuración en VS Code

Configurar `.vscode/launch.json`:

```json
{
  "configurations": [
    {
      "name": "Conectar a Expo",
      "request": "attach",
      "type": "node",
      "port": 19000,
      "preLaunchTask": "npm: start"
    }
  ]
}
```

## Configuración de Compilación

### Configuración de Expo (app.config.js)

El archivo `app.config.js` controla la configuración de compilación:

```javascript
{
  "expo": {
    "name": "OrganiRack",
    "version": "2.1.0",
    "ios": { "bundleIdentifier": "com.ejemplo.organirack" },
    "android": { "package": "com.ejemplo.organirack" }
  }
}
```

### Compilación de Versión

```bash
# Crear compilación de producción (APK Android)
eas build --platform android --profile production

# Crear compilación de producción (IPA iOS)
eas build --platform ios --profile production
```

## Configuración de TypeScript

El proyecto usa modo TypeScript estricto. Configuraciones clave en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["*"],
      "@api/*": ["API/*"],
      "@components/*": ["components/*"],
      "@hooks/*": ["hooks/*"]
    }
  }
}
```

Usar alias de ruta para importaciones limpias:

```typescript
// En lugar de:
import { usePickingFlow } from '../../../hooks/usePicking';

// Usar:
import { usePickingFlow } from '@hooks/usePicking';
```

## Calidad de Código

### ESLint

```bash
# Verificar problemas de linting
npm run lint

# Configuración de ESLint en eslint.config.js
```

### Corregir Problemas Comunes

```bash
# Auto-corregir problemas reparables
npx eslint . --fix
```

## Testing

Aunque el proyecto actualmente no tiene tests automatizados, preparar el entorno:

```bash
npm install --save-dev jest @testing-library/react-native
```

## Resolución de Problemas de Configuración

### "Comando no encontrado: expo"

Instalar Expo CLI globalmente:

```bash
npm install -g expo-cli

# Verificar instalación
expo --version
```

### Puerto Ya en Uso (8081)

```bash
# En Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# En macOS/Linux
lsof -i :8081
kill -9 <PID>
```

### Errores de Módulo No Encontrado

```bash
# Limpiar caché de Expo
expo start -c

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Emulador Android No Inicia

```bash
# Resetear emulador
emulator -avd Medium_Phone_API_36.0 -wipe-data

# Verificar aceleración de hardware
emulator -list-avds -c

# Para máquinas Intel, deshabilitar aceleración si es problemático
emulator -avd Medium_Phone_API_36.0 -no-accel
```

### Problemas de Conexión a API

Verificar conectividad backend desde dispositivo:

```bash
# Desde dentro de la app o terminal
curl http://<backend-url>/api/health

# Asegúrate que el backend está corriendo y accesible
# Verificar configuración de firewall
# En emulador Android, usar 10.0.2.2 en lugar de 127.0.0.1 para localhost
```

## Próximos Pasos

1. Revisar [Arquitectura y Diseño](arquitectura.md) para entender estructura del sistema
2. Estudiar [Referencia de Hooks](hooks-referencia.md) para implementación de lógica empresarial
3. Examinar [Referencia de API](api-referencia.md) para detalles de integración backend
4. Consultar [Resolución de Problemas](resolucion-problemas.md) para resolución de problemas

## Recursos Adicionales

- [Documentación de Expo](https://docs.expo.dev/)
- [Documentación de React Native](https://reactnative.dev/)
- [Manual de TypeScript](https://www.typescriptlang.org/docs/)
- [Documentación de Axios](https://axios-http.com/)
