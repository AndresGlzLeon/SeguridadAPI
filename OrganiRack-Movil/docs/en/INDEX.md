# Documentation Index

Complete navigation guide for OrganiRack+ Mobile technical documentation.

## Getting Started

**New to the project?** Start here:

1. [README.md](../README.md) — Project overview and quick start
2. [Installation & Setup](setup.md) — Environment configuration (15 min read)
3. [Architecture & Design](architecture.md) — System overview (20 min read)

## For Developers

### Understanding the System

- [Architecture & Design](architecture.md)
  - System layers and component hierarchy
  - Design patterns used throughout
  - State management strategy
  - Error handling approach
  - Performance considerations
  - Security considerations

- [Hooks Reference](hooks.md)
  - All 8 picking system hooks
  - Hook responsibilities and dependencies
  - Usage examples and patterns
  - Testing strategies
  - Best practices

### Integration and APIs

- [API Reference](api.md)
  - Authentication endpoints
  - Order management endpoints
  - Availability checking
  - Pick confirmation process
  - Error codes and handling
  - Request examples with curl

- [Dependencies](dependencies.md)
  - Production library justification
  - Development dependencies
  - Compatibility information
  - Vulnerability management
  - Update policy

### Troubleshooting

- [Troubleshooting Guide](troubleshooting.md)
  - Authentication issues
  - Picking system problems
  - UI and rendering issues
  - Network and API errors
  - Performance optimization
  - Device-specific solutions
  - Debug information collection

## Documentation Structure

```
OrganiRack-Movil/
├── README.md                    Main entry point
├── docs/
│   ├── INDEX.md                 This file
│   ├── setup.md                 Installation and environment setup
│   ├── architecture.md          System design and patterns
│   ├── api.md                   Backend API reference
│   ├── hooks.md                 Custom hooks documentation
│   ├── dependencies.md          Library justification and versions
│   └── troubleshooting.md       Known issues and solutions
├── API/                         HTTP client and endpoints
├── app/                         Expo Router screens
├── components/                  Reusable UI components
├── context/                     React Context providers
├── hooks/                       Custom hooks
├── types/                       TypeScript definitions
├── utils/                       Helper functions
└── package.json                 Project dependencies
```

## Quick Navigation

### By Topic

**Authentication:**
- [Setup: Backend Configuration](setup.md#backend-api-configuration)
- [API: Login Endpoint](api.md#login)
- [Architecture: Authentication Flow](architecture.md#authentication-flow)
- [Troubleshooting: Auth Issues](troubleshooting.md#authentication-issues)

**Picking System:**
- [Architecture: Hooks Architecture](architecture.md#2-custom-hooks-architecture)
- [Hooks Reference: Complete Hook Guide](hooks.md)
- [API: Order Management](api.md#order-management-endpoints)
- [Troubleshooting: Picking Issues](troubleshooting.md#picking-system-issues)

**Development:**
- [Setup: Development Environment](setup.md#development-environment-setup)
- [Architecture: Design Patterns](architecture.md#design-patterns)
- [Dependencies: Versions and Security](dependencies.md)

**Deployment:**
- [Setup: Build Configuration](setup.md#build-configuration)
- [Dependencies: Compliance](dependencies.md#dependency-compliance)
- [API: Backend Integration](api.md)

### By Problem Type

**Setup Problems:**
→ [Installation & Setup](setup.md) → [Troubleshooting](troubleshooting.md#network-and-api-issues)

**API/Network Issues:**
→ [API Reference](api.md) → [Troubleshooting: Network Issues](troubleshooting.md#network-and-api-issues)

**Performance Issues:**
→ [Architecture: Performance](architecture.md#performance-considerations) → [Troubleshooting: Performance](troubleshooting.md#performance-issues)

**Specific Hook Problem:**
→ [Hooks Reference](hooks.md) → Find specific hook → Check implementation

## Key Concepts

### Architectural Patterns

1. **Separation of Concerns** — Business logic isolated from UI
2. **Custom Hooks** — Encapsulated business logic with single responsibility
3. **Context API** — Global authentication state
4. **HTTP Interceptors** — Centralized request/response handling
5. **File-Based Routing** — Expo Router for navigation

### Core Technologies

- **Frontend:** React Native 0.81 + TypeScript 5.9
- **Framework:** Expo 54 with Expo Router
- **HTTP Client:** Axios with interceptor pattern
- **State Management:** React Hooks + Context API
- **Storage:** expo-secure-store for tokens
- **Navigation:** React Navigation via Expo Router

### Data Flow

Order Retrieval → Product Selection → Location Input → Availability Check → Confirmation → Backend Sync → UI Update

## Type Definitions Reference

All TypeScript types defined in `types/`:

- `auth.ts` — User, LoginRequest, AuthResponse
- `orders.ts` — Order, OrderItem, Location

## Glossary

| Term | Definition |
|------|-----------|
| Hook | Custom React function encapsulating stateful logic |
| Picking | Process of selecting items from warehouse locations |
| Override | Alternative location selection when primary unavailable |
| Override Mode | UI screen for selecting alternative locations |
| Interceptor | Middleware for HTTP requests/responses |
| Context | React mechanism for global state without prop drilling |
| Secure Store | OS-level encrypted storage (expo-secure-store) |
| Expo Router | File-based routing system built on React Navigation |
| SoC | Separation of Concerns architectural principle |

## Version Information

- **App Version:** 2.1.0
- **React:** 19.1.0
- **React Native:** 0.81.5
- **Expo:** 54.0.33
- **TypeScript:** 5.9.2
- **Documentation Updated:** 2026-04-15

## Contributing to Documentation

When updating documentation:

1. Maintain consistent formatting (see standards in existing files)
2. Remove emojis and informal language
3. Include code examples for technical concepts
4. Link to relevant sections using relative paths
5. Update this INDEX.md if adding new documents
6. Test all links for correctness

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Navigation Guide](https://reactnavigation.org/docs/getting-started)
- [Axios Documentation](https://axios-http.com/)

## Document Maintenance

Last reviewed: 2026-04-15

| Document | Last Updated | Reviewer |
|----------|-------------|----------|
| README.md | 2026-04-15 | Technical Lead |
| setup.md | 2026-04-15 | Technical Lead |
| architecture.md | 2026-04-15 | Senior Developer |
| api.md | 2026-04-15 | Backend Liaison |
| hooks.md | 2026-04-15 | Frontend Lead |
| dependencies.md | 2026-04-15 | DevOps Lead |
| troubleshooting.md | 2026-04-15 | Technical Support |

## Getting Help

- **Development Questions:** Check Architecture and Hooks documentation first
- **Setup Issues:** Refer to Setup guide and Troubleshooting
- **API Questions:** Consult API Reference
- **Performance Issues:** See Architecture Performance section
- **Bug Reports:** Include information from Troubleshooting debug section

---

**Last Updated:** 2026-04-15  
**Status:** Current and Maintained
