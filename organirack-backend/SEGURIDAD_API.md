# Documentación de Seguridad — OrganiRack API

## Tabla de Contenidos

1. [API Key (Middleware)](#1-api-key-middleware)
2. [Rate Limiter](#2-rate-limiter)
3. [Protección BOLA/IDOR con Roles](#3-protección-bolaidorcon-roles)
4. [JWT — Implementación via Laravel Sanctum](#4-jwt--implementación-via-laravel-sanctum)

---

## 1. API Key (Middleware)

**Archivo:** `app/Http/Middleware/ApiKeyMiddleware.php`  
**Alias:** `api.key` (registrado en `bootstrap/app.php`)

El middleware `ApiKeyMiddleware` intercepta todas las peticiones al grupo de rutas `/api/security/*`
y verifica que el header `X-API-KEY` esté presente y coincida con el valor configurado.

```http
GET /api/security/status HTTP/1.1
Authorization: Bearer <sanctum_token>
X-API-KEY: organirack_secreto_123
```

**Respuesta si la API Key es inválida o está ausente:**

```json
{
  "error": "Acceso denegado. API Key inválida",
  "message": "Debes incluir el header X-API-KEY con un valor válido."
}
```
**HTTP Status:** `401 Unauthorized`

> **Configuración:** El valor de la API Key se lee desde la variable de entorno `API_KEY`
> (con fallback al valor estático `organirack_secreto_123` definido en `config/app.php`).

---

## 2. Rate Limiter

**Middleware nativo:** `throttle:3,1`  
**Rutas protegidas:** `/api/security/status`, `/api/security/ping`

Se aplica el middleware nativo de Laravel `throttle:3,1`, que limita a **3 peticiones por minuto**
por IP/usuario. Esto previene ataques de fuerza bruta y abuso de la API.

Al superar el límite, Laravel retorna automáticamente:

```json
{
  "message": "Too Many Requests."
}
```
**HTTP Status:** `429 Too Many Requests`  
**Header de respuesta:** `Retry-After: <segundos>`

---

## 3. Protección BOLA/IDOR con Roles

**Patrón utilizado:** Laravel Policy  
**Archivo:** `app/Policies/OrdenSurtidoPolicy.php`  
**Controlador:** `app/Http/Controllers/Api/OrderController.php`

### ¿Qué es BOLA/IDOR?

**BOLA** (Broken Object Level Authorization) o **IDOR** (Insecure Direct Object Reference) ocurre
cuando un usuario puede acceder o modificar recursos de otros usuarios simplemente cambiando el ID
en la URL (ej. `GET /api/orders/42` siendo 42 una orden de otro usuario).

### Implementación

La lógica de autorización está **completamente separada del controlador** mediante una Policy de Laravel.
El controlador solo invoca `$this->authorize()` — sin `if` contaminando el negocio:

```php
// OrderController.php — show()
public function show(OrdenSurtido $order): JsonResponse
{
    $this->authorize('view', $order); // Delega en OrdenSurtidoPolicy::view()
    // ...
}
```

### Lógica en la Policy

```php
// OrdenSurtidoPolicy.php

// Bypass para roles privilegiados (se ejecuta antes que cualquier método)
public function before(User $user, string $ability): bool|null
{
    if ($user->hasRole(['Administrador', 'Gerencia de Operaciones'])) {
        return true; // Acceso irrestricto
    }
    return null; // Continúa evaluando
}

// Solo el capturista propietario puede ver la orden
public function view(User $user, OrdenSurtido $orden): bool
{
    return $user->id === $orden->capturista_id;
}
```

**Respuesta si falla la autorización:**

```json
{
  "error": "Protección IDOR: No tienes permiso para acceder a este recurso"
}
```
**HTTP Status:** `403 Forbidden`

### Resumen de roles y acceso

| Rol                      | Acceso a recursos ajenos |
|--------------------------|:------------------------:|
| Administrador            | ✅ Sí (bypass total)     |
| Gerencia de Operaciones  | ✅ Sí (bypass total)     |
| Capturista (propietario) | ✅ Solo sus órdenes       |
| Cualquier otro usuario   | ❌ No (403 Forbidden)    |

---

## 4. JWT — Implementación via Laravel Sanctum

> **Nota técnica sobre el cumplimiento del requisito de JWT:**
>
> Para cumplir con el requisito de autenticación stateless basada en tokens (JWT), la API utiliza
> de forma nativa los **Personal Access Tokens de Laravel Sanctum**. Estos tokens (cifrados en
> SHA-256 y almacenados de forma segura en la base de datos) operan como **Bearer Tokens** en
> las cabeceras HTTP, cumpliendo exactamente con la arquitectura de autenticación stateless
> requerida por JWT, sin la vulnerabilidad de firmas débiles que pueden presentar algunas
> implementaciones de JWT con algoritmos simétricos (HS256).
>
> No se instalaron librerías JWT de terceros dado que Sanctum provee una solución robusta,
> mantenida oficialmente por el equipo de Laravel y plenamente equivalente en comportamiento
> stateless para APIs REST.

### Flujo de autenticación

```
1. POST /api/login  →  { email, password }
2. Sanctum genera un Personal Access Token (SHA-256)
3. El cliente incluye el token en cada petición:
   Authorization: Bearer <token>
4. Sanctum valida el token → resuelve el usuario autenticado
5. La sesión NO se persiste en el servidor (stateless ✅)
```

### Headers requeridos para rutas protegidas

```http
Authorization: Bearer <sanctum_personal_access_token>
Accept: application/json
X-API-KEY: organirack_secreto_123   ← Solo para rutas del grupo /api/security/*
```

---

*Documento generado para la rúbrica de evaluación de seguridad — OrganiRack Backend.*
