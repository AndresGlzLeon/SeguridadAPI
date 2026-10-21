# Dependencias

Justificación de librerías externas y notas de seguridad para OrganiRack+ Mobile.

## Dependencias de Producción

### Dependencias de Runtime

| Paquete | Versión | Propósito | Justificación | Notas de Seguridad |
|---------|---------|----------|--------------|-------------------|
| react | 19.1.0 | Librería de UI | Última versión estable para React Native | Se actualiza regularmente por parches de seguridad |
| react-native | 0.81.5 | Framework móvil | Compatible con Expo 54 | Usar solo paquetes oficiales de React Native |
| expo | 54.0.33 | Build y deployment | Servicio administrado oficial | Asegura aplicación automática de actualizaciones de seguridad |
| expo-router | 6.0.23 | Enrutamiento basado en archivos | Reduce boilerplate, mejora mantenibilidad | Construido sobre React Navigation |
| react-navigation | 7.1.28 | Implementación de navegación | Dependencia principal para enrutamiento | Seguridad: Validar deep linking |
| axios | 1.13.6 | Cliente HTTP | Librería madura y ampliamente usada | Usar con interceptores para gestión de tokens |
| expo-secure-store | 15.0.8 | Almacenamiento encriptado | Encriptación a nivel SO para tokens | Preferido sobre AsyncStorage para datos sensibles |
| expo-camera | 17.0.10 | Acceso a cámara | Funcionalidad de cámara nativa | Requiere permisos de runtime |
| expo-haptics | 15.0.8 | Retroalimentación háptica | Retroalimentación al usuario en confirmaciones | Mejora opcional |

### Paquetes del Framework

| Paquete | Propósito |
|---------|----------|
| @react-navigation/native-stack | Navegación stack |
| @react-navigation/bottom-tabs | Navegación basada en tabs |
| @react-navigation/elements | Utilidades de navegación |
| expo-font | Carga de fuentes |
| expo-status-bar | Gestión de barra de estado |

### Iconos Vector

```typescript
import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
```

Todos los iconos servidos desde @expo/vector-icons (fuentes de iconos incluidas en Expo).

## Dependencias de Desarrollo

| Paquete | Propósito | Nota |
|---------|----------|------|
| typescript | Type checking | Modo estricto habilitado, recomendado para desarrollo en equipo |
| @types/react | Definiciones de tipos | Necesario para soporte de TypeScript |
| eslint | Linting de código | Aplica calidad de código y consistencia |
| eslint-config-expo | Configuración de ESLint | Configuración oficial de Expo |

## Estrategia de Gestión de Dependencias

### Fijación de Versiones

Las dependencias de producción se fijan a versiones específicas en `package-lock.json` para garantizar compilaciones reproducibles entre entornos. Nunca confiar en rangos de caret (^) o tilde (~) para deployments de producción.

### Política de Actualizaciones

- **Actualizaciones Críticas de Seguridad:** Aplicar en 24 horas
- **Actualizaciones Menores:** Revisar y aplicar dentro de 1 sprint
- **Actualizaciones Mayores:** Planificar y testear completamente antes de aplicar
- **Advertencias de Deprecación:** Abordar dentro del sprint actual

### Escaneo de Vulnerabilidades

```bash
# Verificar vulnerabilidades conocidas
npm audit

# Corregir vulnerabilidades automáticamente reparables
npm audit fix

# Listar vulnerabilidades con detalles
npm audit --detailed

# Omitir audit en instalación (no recomendado)
npm install --prefer-offline --no-audit
```

## Problemas de Compatibilidad Conocidos

### React Native 0.81 + TypeScript 5.9

Las definiciones de tipos pueden requerir `skipLibCheck: true` en `tsconfig.json` debido a incompatibilidades en paquetes @types. Esto es aceptable para proyectos administrados por Expo.

### Networking en Emulador Android

Para testing de backend local en emulador Android, usar `10.0.2.2` en lugar de `127.0.0.1` o `localhost`. Configurar en `.env`:

```properties
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
```

## Por Qué Ciertas Librerías NO Se Usan

### Por Qué NO Redux

- **Complejidad:** Innecesaria para alcance actual de app
- **Curva de Aprendizaje:** Context API es suficiente para autenticación
- **Tamaño de Bundle:** Añade 40KB+ al bundle
- **Ruta de Migración:** Se puede añadir Redux/Zustand después si es necesario

### Por Qué NO React Query

- **Necesidad Actual:** Llamadas API simples manejadas por hooks personalizados
- **Alternativa:** Considerar para requisitos complejos de caché
- **Impacto de Bundle:** Añade 30KB+

## Consideraciones de Seguridad

### Comunicación de API

Toda comunicación de API pasa a través del cliente Axios con:
- HTTPS forzado en producción
- Timeout de solicitud (30 segundos) previene conexiones colgadas
- Token adjuntado automáticamente vía interceptores
- Validación de respuesta antes de procesamiento

### Gestión de Tokens

Tokens JWT son:
- Almacenados en `expo-secure-store` (encriptación a nivel SO)
- Nunca registrados o expuestos en consola
- Renovados automáticamente cuando expiran
- Limpiados al logout

### Validación de Entrada de Usuario

Toda entrada de usuario validada antes de envío:
- Códigos de ubicación verificados por formato
- Cantidad validada como entero positivo
- Respuestas de API validadas con TypeScript

### Variables de Entorno

Configuración sensible en `.env`:
- Nunca hacer commit al repositorio
- Prefijo `EXPO_PUBLIC_` indica que se incrustan en bundle
- Valores no públicos deben usar otro método de configuración

## Conformidad de Dependencias

### Licencias

Todas las dependencias usan licencias open-source compatibles:
- MIT (mayoría de paquetes)
- Apache 2.0
- ISC
- BSD

Consultar licencias individuales del paquete para detalles.

### Resolución Forzada de Dependencias

La sección `overrides` en `package.json` fuerza versiones específicas para resolver conflictos:

```json
{
  "overrides": {
    "minimatch": "^10.1.2",
    "glob": "^10.4.5"
  }
}
```

Esto asegura versiones consistentes entre dependencias anidadas.

## Actualizar Dependencias

### Proceso Seguro de Actualización

1. Crear nueva rama de git
2. Actualizar dependencia individual: `npm update package-name`
3. Correr tests y testear en emulador
4. Commit con mensaje claro: "Update package-name to X.Y.Z"
5. Crear pull request con resumen de cambios

### Actualizaciones de Versión Mayor

Para actualizaciones de versión mayor (cambios breaking):

1. Leer changelog y guía de migración
2. Actualizar en rama de desarrollo
3. Correr suite de tests completa
4. Testear en dispositivo físico si es posible
5. Documentar cambios de API requeridos
