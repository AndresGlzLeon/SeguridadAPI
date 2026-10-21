# Referencia de API

Especificación completa de endpoints de API backend utilizados por OrganiRack+ Mobile.

## Configuración Base

Todas las solicitudes API pasan por un cliente Axios centralizado configurado en `API/client.ts`.

**Configuración de URL Base:**
```typescript
// De variable de entorno (establecida en .env)
const API_URL = process.env.EXPO_PUBLIC_API_URL;
// Ejemplo: http://192.168.1.100:8000/api

// Timeout de solicitud: 30 segundos
const TIMEOUT = process.env.EXPO_PUBLIC_API_TIMEOUT || 30000;
```

**Headers de Solicitud:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
Accept: application/json
```

## Endpoints de Autenticación

### Login

Autenticar usuario y obtener token JWT.

**Endpoint:** `POST /login`

**Body de Solicitud:**
```json
{
  "email": "picker@warehouse.local",
  "password": "contraseña_segura"
}
```

**Respuesta (200 OK):**
```json
{
  "user": {
    "id": 1,
    "name": "Juan Picker",
    "email": "picker@warehouse.local",
    "role": "picker"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400
}
```

**Respuesta (401 No Autorizado):**
```json
{
  "message": "Credenciales inválidas",
  "errors": null
}
```

**Respuesta (422 Entidad No Procesable):**
```json
{
  "message": "Los datos proporcionados no son válidos",
  "errors": {
    "email": ["El campo email es requerido"],
    "password": ["El campo password es requerido"]
  }
}
```

**Manejo de Errores:**
- 401: Credenciales inválidas, mostrar mensaje de error
- 422: Validación fallida, mostrar errores por campo
- 500: Error de servidor, mostrar mensaje genérico

### Logout

Limpiar sesión de autenticación en backend.

**Endpoint:** `POST /logout`

**Headers Requeridos:** Sí (token Bearer)

**Respuesta (204 Sin Contenido):** Éxito

**Respuesta (401 No Autorizado):** Token inválido o expirado

## Endpoints de Gestión de Órdenes

### Obtener Lista de Órdenes

Recuperar órdenes de picking asignadas al usuario actual.

**Endpoint:** `GET /mobile/picking/orders`

**Parámetros de Query:**
- `page` (opcional, default: 1) — Número de página
- `limit` (opcional, default: 20) — Resultados por página
- `status` (opcional) — Filtrar por estado

**Respuesta (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "order_number": "ORD-2026-001",
      "customer": "Nombre Cliente",
      "total_items": 5,
      "items_picked": 0,
      "status": "assigned",
      "priority": 3,
      "created_at": "2026-03-15T10:30:00Z",
      "due_date": "2026-03-16T18:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 47,
    "items_per_page": 20
  }
}
```

**Descripciones de Campo:**
- `priority` — Entero 1-5 (1=máxima, 5=mínima)
- `status` — assigned, in_progress, completed, cancelled
- `created_at`, `due_date` — Formato ISO 8601

### Obtener Detalles de Orden

Recuperar detalles completos de una orden específica incluyendo todos los items.

**Endpoint:** `GET /mobile/picking/{id}`

**Parámetros de Ruta:**
- `id` — ID de orden (requerido)

**Respuesta (200 OK):**
```json
{
  "id": 1,
  "order_number": "ORD-2026-001",
  "customer": "Nombre Cliente",
  "status": "in_progress",
  "items": [
    {
      "id": 1,
      "sku": "PROD-001",
      "name": "Nombre Producto",
      "quantity_ordered": 10,
      "quantity_picked": 3,
      "unit": "PCS",
      "location_suggested": "A-01-01",
      "locations_alternative": ["A-01-02", "B-02-03"]
    }
  ],
  "created_at": "2026-03-15T10:30:00Z"
}
```

**Respuesta (404 No Encontrado):**
```json
{
  "message": "Orden no encontrada"
}
```

### Verificar Disponibilidad

Verificar disponibilidad de producto en ubicación específica.

**Endpoint:** `GET /mobile/picking/{id}/availability`

**Parámetros de Query:**
- `location` — Código de ubicación de almacén (requerido)

**Respuesta (200 OK):**
```json
{
  "available": true,
  "quantity": 5,
  "location": "A-01-01",
  "item_id": 1,
  "last_count": "2026-03-15T08:00:00Z"
}
```

**Respuesta (200 OK - Sin Stock):**
```json
{
  "available": false,
  "quantity": 0,
  "location": "A-01-01",
  "message": "La ubicación está vacía"
}
```

### Confirmar Pick

Enviar confirmación de item recogido al backend.

**Endpoint:** `POST /mobile/picking/confirmar`

**Body de Solicitud:**
```json
{
  "order_id": 1,
  "item_id": 1,
  "location_picked": "A-01-01",
  "quantity_picked": 5,
  "estante_id": 1,
  "timestamp": "2026-03-15T14:23:45Z"
}
```

**Requisitos de Campo:**
- `order_id` — ID entero de orden (no order_number)
- `item_id` — ID entero de item de la orden
- `location_picked` — String en formato AISLE-SHELF-POSITION
- `quantity_picked` — Cantidad entera recogida
- `estante_id` — ID entero de estante/shelf (obtenido de validación de ubicación)
- `timestamp` — Timestamp ISO 8601

**Respuesta (200 OK):**
```json
{
  "success": true,
  "message": "Pick confirmado",
  "next_item": {
    "id": 2,
    "sku": "PROD-002",
    "name": "Próximo Producto",
    "quantity_ordered": 8,
    "location_suggested": "B-02-01"
  }
}
```

**Respuesta (422 Entidad No Procesable - Error de Inventario):**
```json
{
  "message": "Validación de inventario fallida",
  "errors": {
    "estante_id": "Debe ser tipo entero",
    "quantity": "La cantidad solicitada excede el stock disponible"
  }
}
```

## Códigos de Respuesta HTTP

| Código | Significado | Acción |
|--------|------------|--------|
| 200 | Éxito | Procesar datos de respuesta |
| 204 | Éxito (Sin Contenido) | Operación completada |
| 400 | Solicitud Incorrecta | Verificar formato de solicitud |
| 401 | No Autorizado | Token expirado, disparar actualización |
| 403 | Prohibido | Usuario sin permiso |
| 404 | No Encontrado | Recurso no existe |
| 422 | Validación Fallida | Mostrar errores de campo a usuario |
| 429 | Rate Limited | Implementar backoff exponencial |
| 500 | Error de Servidor | Mostrar error genérico, reintentar después |

## Manejo de Errores

### Formato Estándar de Respuesta de Error

```json
{
  "message": "Descripción de error legible",
  "errors": {
    "nombre_campo": "Error específico del campo"
  }
}
```

### Manejo de Error en Interceptor

El interceptor de Axios maneja:

```typescript
// Si token expirado
if (error.response?.status === 401) {
  // Intentar refrescar token
  const newToken = await refreshToken();
  error.config.headers.Authorization = `Bearer ${newToken}`;
  return client.request(error.config);
}

// Error de validación
if (error.response?.status === 422) {
  // Pasar al componente para mostrar errores
  return Promise.reject(error);
}

// Error de red
if (!error.response) {
  error.message = 'Error de red. Verifica tu conexión.';
}
```

## Problemas Conocidos Resueltos

### Error 422: estante_id debe ser entero

**Problema:** Backend rechaza `estante_id` como string, requiere integer.

**Solución:** Convertir ID de ubicación a entero antes de envío:

```typescript
const request = {
  order_id: order.id,        // integer
  item_id: item.id,          // integer
  location_picked: location, // string
  quantity_picked: quantity, // integer
  estante_id: Number(locationId), // ✓ Convertir a entero
  timestamp: new Date().toISOString()
};
```

## Rate Limiting

Backend implementa rate limiting por usuario:

- **Operaciones de Picking:** 100 solicitudes por minuto
- **Consultas de Órdenes:** 200 solicitudes por minuto
- **Intentos de Login:** 5 por minuto

Solicitudes excedidas retornan 429 con header retry-after.

## Compatibilidad de Versión

API actual compatible con Laravel 10.0+

Verificar disponibilidad del backend en endpoint `/api/health`.
