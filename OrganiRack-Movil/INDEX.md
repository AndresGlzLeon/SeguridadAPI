# OrganiRack+ Mobile - Complete Documentation Index

Bilingual documentation navigation for OrganiRack+ Mobile.

---

## English Documentation

### Getting Started (15-20 min)

1. **[Installation Guide](docs/en/setup.md)** — Environment setup and first-time configuration
2. **[Architecture Overview](docs/en/architecture.md)** — System design and patterns

### For Developers

#### Understanding the System

- **[Architecture & Design](docs/en/architecture.md)**
  - System layers and component hierarchy
  - Design patterns and principles
  - State management strategy
  - Error handling approach
  - Performance considerations
  - Security considerations

- **[Hooks Reference](docs/en/hooks.md)**
  - 8 specialized hooks in picking system
  - Hook responsibilities and dependencies
  - Usage examples and patterns
  - Testing strategies
  - Best practices

#### Integration & APIs

- **[API Reference](docs/en/api.md)**
  - Authentication endpoints
  - Order management endpoints
  - Availability verification
  - Pick confirmation process
  - Error codes and handling
  - curl request examples

- **[Dependencies](docs/en/dependencies.md)**
  - Justification of production libraries
  - Development dependencies
  - Compatibility information
  - Vulnerability management
  - Update policy

#### Security & Policies

- **[Session Policy & Timeout](docs/en/session-policy.md)**
  - 15-minute session timeout configuration
  - Secure token storage
  - Authentication flow
  - Configuration and customization
  - Troubleshooting

### Troubleshooting & Support

- **[Known Issues & Solutions](docs/en/troubleshooting.md)**
  - Authentication problems
  - Picking system issues
  - UI and rendering problems
  - Network and API errors
  - Performance optimization
  - Device-specific solutions
  - Debug information collection

---

## Documentación en Español

### Comenzar (15-20 min)

1. **[Guía de Instalación](docs/es/guia-instalacion.md)** — Configuración de entorno e instalación
2. **[Descripción de Arquitectura](docs/es/arquitectura.md)** — Diseño y patrones del sistema

### Para Desarrolladores

#### Entender el Sistema

- **[Arquitectura y Diseño](docs/es/arquitectura.md)**
  - Capas del sistema y jerarquía de componentes
  - Patrones de diseño utilizados
  - Estrategia de gestión de estado
  - Enfoque de manejo de errores
  - Consideraciones de rendimiento
  - Consideraciones de seguridad

- **[Referencia de Hooks](docs/es/hooks-referencia.md)**
  - Los 8 hooks especializados del sistema de picking
  - Responsabilidades y dependencias de hooks
  - Ejemplos de uso y patrones
  - Estrategias de testing
  - Mejores prácticas

#### Integración y APIs

- **[Referencia de API](docs/es/api-referencia.md)**
  - Endpoints de autenticación
  - Endpoints de gestión de órdenes
  - Verificación de disponibilidad
  - Proceso de confirmación de picks
  - Códigos de error y manejo
  - Ejemplos de solicitud con curl

- **[Dependencias](docs/es/dependencias.md)**
  - Justificación de librerías de producción
  - Dependencias de desarrollo
  - Información de compatibilidad
  - Gestión de vulnerabilidades
  - Política de actualizaciones

#### Seguridad y Políticas

- **[Política de Sesión y Timeout](docs/es/politica-sesion.md)**
  - Configuración de timeout de 15 minutos
  - Almacenamiento seguro de tokens
  - Flujo de autenticación
  - Configuración y personalización
  - Solución de problemas

### Resolución de Problemas y Soporte

- **[Guía de Resolución de Problemas](docs/es/resolucion-problemas.md)**
  - Problemas de autenticación
  - Problemas del sistema de picking
  - Problemas de UI y rendering
  - Errores de red y API
  - Optimización de rendimiento
  - Soluciones específicas de dispositivo
  - Recopilación de información de depuración

---

## Quick Topic Navigation / Navegación por Temas

### Authentication / Autenticación

| English | Español |
|---------|---------|
| [Installation: Backend Config](docs/en/setup.md) | [Instalación: Configuración Backend](docs/es/guia-instalacion.md) |
| [API: Login Endpoint](docs/en/api.md) | [API: Endpoint de Login](docs/es/api-referencia.md) |
| [Architecture: Auth Flow](docs/en/architecture.md) | [Arquitectura: Flujo de Autenticación](docs/es/arquitectura.md) |
| [Session Policy](docs/en/session-policy.md) | [Política de Sesión](docs/es/politica-sesion.md) |
| [Troubleshooting: Auth](docs/en/troubleshooting.md) | [Resolución: Autenticación](docs/es/resolucion-problemas.md) |

### Picking System / Sistema de Picking

| English | Español |
|---------|---------|
| [Architecture: Hooks](docs/en/architecture.md) | [Arquitectura: Hooks](docs/es/arquitectura.md) |
| [Hooks Reference](docs/en/hooks.md) | [Referencia de Hooks](docs/es/hooks-referencia.md) |
| [API: Order Management](docs/en/api.md) | [API: Gestión de Órdenes](docs/es/api-referencia.md) |
| [Troubleshooting: Picking](docs/en/troubleshooting.md) | [Resolución: Picking](docs/es/resolucion-problemas.md) |

### Development / Desarrollo

| English | Español |
|---------|---------|
| [Installation: Dev Environment](docs/en/setup.md) | [Instalación: Entorno de Desarrollo](docs/es/guia-instalacion.md) |
| [Architecture: Patterns](docs/en/architecture.md) | [Arquitectura: Patrones](docs/es/arquitectura.md) |
| [Dependencies](docs/en/dependencies.md) | [Dependencias](docs/es/dependencias.md) |

---

## Documentation Structure / Estructura de Documentación

```
docs/
├── en/                          English Documentation
│   ├── setup.md                 Installation & configuration
│   ├── architecture.md          System design & patterns
│   ├── api.md                   API reference
│   ├── hooks.md                 Hooks documentation
│   ├── dependencies.md          Dependencies & versions
│   ├── session-policy.md        Session timeout & security
│   └── troubleshooting.md       Known issues & solutions
│
└── es/                          Spanish Documentation
    ├── guia-instalacion.md      Instalación y configuración
    ├── arquitectura.md          Diseño y patrones
    ├── api-referencia.md        Referencia de API
    ├── hooks-referencia.md      Documentación de hooks
    ├── dependencias.md          Dependencias y versiones
    ├── politica-sesion.md       Política de timeout y seguridad
    └── resolucion-problemas.md  Problemas conocidos y soluciones
```

---

## Key Concepts / Conceptos Clave

### Architectural Patterns / Patrones Arquitectónicos

1. **Separation of Concerns** — Business logic isolated from UI
2. **Custom Hooks** — Business logic encapsulated with single responsibility
3. **API Context** — Global authentication state
4. **HTTP Interceptors** — Centralized request/response handling
5. **File-based Routing** — Expo Router for navigation

### Main Technologies / Tecnologías Principales

- **Frontend:** React Native 0.81 + TypeScript 5.9
- **Framework:** Expo 54 with Expo Router
- **HTTP Client:** Axios with interceptor pattern
- **State Management:** React Hooks + API Context
- **Storage:** expo-secure-store for tokens
- **Navigation:** React Navigation via Expo Router

### Data Flow / Flujo de Datos

Order Retrieval → Product Selection → Location Input → Availability Check → Override Mode → Confirmation → Backend Sync → UI Update

---

## Version Information / Información de Versión

- **App Version:** 2.1.0
- **React:** 19.1.0
- **React Native:** 0.81.5
- **Expo:** 54.0.33
- **TypeScript:** 5.9.2
- **Documentation Updated:** 2026-04-16

---

## Contributing to Documentation / Contribuir a la Documentación

When updating documentation:

1. Maintain consistent formatting with existing documents
2. Remove emojis and keep language professional
3. Include code examples for technical concepts
4. Link to relevant sections using relative paths
5. Keep both English and Spanish versions in sync
6. Test all links for correctness

---

## Additional Resources / Recursos Adicionales

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Navigation Guide](https://reactnavigation.org/docs/getting-started)
- [Axios Documentation](https://axios-http.com/)

---

**Status:** Current and Maintained / Actual y Mantenida  
**Last Updated:** 2026-04-16
