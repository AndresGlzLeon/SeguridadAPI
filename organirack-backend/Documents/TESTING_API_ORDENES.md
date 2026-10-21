# 🧪 Testing & Ejemplos Prácticos - API Órdenes

**Última Actualización**: 23 de Marzo, 2026

---

## 📱 Ejemplos de Peticiones (Postman/Insomnia/cURL)

### 1️⃣ Autenticación Sanctum (Prerequisito)

Primero obten un token autenticándote:

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

**Respuesta**:
```json
{
  "message": "Login exitoso",
  "token": "1|abc123def456...",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "user@example.com"
  }
}
```

Guardar el token en variable: `TOKEN=1|abc123def456...`

---

### 2️⃣ **GET** - Listar Todas las Órdenes

```bash
curl -X GET "http://localhost:8000/api/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json"
```

**Respuesta** (200 OK):
```json
{
  "message": "Órdenes de surtido obtenidas correctamente",
  "data": [
    {
      "id": 1,
      "folio": "ORD-20260323-00001",
      "referencia_destino": "Bodega Principal",
      "estado": {
        "id": 1,
        "nombre": "Pendiente",
        "color_hex": "#f59e0b"
      },
      "prioridad": {
        "id": 1,
        "nombre": "Alta",
        "nivel_ordenamiento": 1
      },
      "capturista": {
        "id": 1,
        "name": "Juan Pérez",
        "email": "juan@example.com"
      },
      "almacenista": null,
      "fecha_requerida": "2026-03-15T18:00:00",
      "detalles": [
        {
          "id": 1,
          "orden_surtido_id": 1,
          "producto_id": 1,
          "cantidad_requerida": "100.00",
          "cantidad_surtida": "0.00",
          "fue_modificado": false,
          "estante_sugerido_id": 5,
          "estante_real_id": null,
          "producto": {
            "id": 1,
            "sku": "SKU-001",
            "nombre": "Monitor LG 24 pulgadas",
            "categoria_id": 3,
            "unidad_medida_id": 1,
            "marca_id": 2,
            "stock_min": 10,
            "stock_max": 100,
            "estado": true
          },
          "estante_sugerido": {
            "id": 5,
            "pasillo_id": 2,
            "posicion": "A-01-01",
            "capacidad": 500,
            "ocupacion_actual": 250
          },
          "estante_real": null
        }
      ],
      "created_at": "2026-03-23T10:30:45",
      "updated_at": "2026-03-23T10:30:45"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 15,
    "total": 1,
    "last_page": 1,
    "from": 1,
    "to": 1
  }
}
```

---

### 3️⃣ **GET** - Listar con Filtros

```bash
# Filtrar por estado pendiente
curl -X GET "http://localhost:8000/api/orders?estado_id=1" \
  -H "Authorization: Bearer $TOKEN"

# Filtrar por prioridad alta
curl -X GET "http://localhost:8000/api/orders?prioridad_id=1" \
  -H "Authorization: Bearer $TOKEN"

# Buscar por folio
curl -X GET "http://localhost:8000/api/orders?search=ORD-20260323" \
  -H "Authorization: Bearer $TOKEN"

# Combinado: pendiente + alta prioridad + página 2
curl -X GET "http://localhost:8000/api/orders?estado_id=1&prioridad_id=1&per_page=10&page=2" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4️⃣ **POST** - Crear Nueva Orden ⭐

```bash
curl -X POST "http://localhost:8000/api/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prioridad_id": 1,
    "referencia_destino": "Bodega Principal - Sección A",
    "fecha_requerida": "2026-03-25 14:30",
    "detalles": [
      {
        "producto_id": 1,
        "cantidad_requerida": 100,
        "estante_sugerido_id": 5
      },
      {
        "producto_id": 2,
        "cantidad_requerida": 50.50,
        "estante_sugerido_id": 8
      },
      {
        "producto_id": 3,
        "cantidad_requerida": 25
      }
    ]
  }'
```

**Respuesta** (201 Created):
```json
{
  "message": "Orden de surtido creada correctamente",
  "data": {
    "id": 1,
    "folio": "ORD-20260323-00001",
    "referencia_destino": "Bodega Principal - Sección A",
    "capturista_id": 1,
    "almacenista_id": null,
    "estado_id": 1,
    "prioridad_id": 1,
    "fecha_requerida": "2026-03-25T14:30:00",
    "estado": {
      "id": 1,
      "nombre": "Pendiente",
      "color_hex": "#f59e0b"
    },
    "prioridad": {
      "id": 1,
      "nombre": "Alta",
      "nivel_ordenamiento": 1
    },
    "capturista": {
      "id": 1,
      "name": "Juan Pérez"
    },
    "almacenista": null,
    "detalles": [
      {
        "id": 1,
        "orden_surtido_id": 1,
        "producto_id": 1,
        "cantidad_requerida": "100.00",
        "cantidad_surtida": "0.00",
        "fue_modificado": false,
        "estante_sugerido_id": 5,
        "estante_real_id": null,
        "producto": {
          "id": 1,
          "sku": "SKU-001",
          "nombre": "Monitor LG"
        }
      },
      {
        "id": 2,
        "orden_surtido_id": 1,
        "producto_id": 2,
        "cantidad_requerida": "50.50",
        "cantidad_surtida": "0.00",
        "fue_modificado": false,
        "estante_sugerido_id": 8,
        "estante_real_id": null,
        "producto": {
          "id": 2,
          "sku": "SKU-002",
          "nombre": "Teclado Mecánico"
        }
      }
    ],
    "created_at": "2026-03-23T10:35:12",
    "updated_at": "2026-03-23T10:35:12"
  }
}
```

---

### 5️⃣ **GET** - Obtener Orden Específica

```bash
curl -X GET "http://localhost:8000/api/orders/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Respuesta** (200 OK):
```json
{
  "message": "Orden de surtido obtenida correctamente",
  "data": {
    "id": 1,
    "folio": "ORD-20260323-00001",
    // ... mismo formato que arriba
  }
}
```

---

## ❌ Escenarios de Error

### Error 1️⃣: Validación Fallida

**Request**:
```bash
curl -X POST "http://localhost:8000/api/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prioridad_id": 999,
    "detalles": []
  }'
```

**Respuesta** (422 Unprocessable Entity):
```json
{
  "message": "Unprocessable Content",
  "errors": {
    "prioridad_id": [
      "The selected prioridad_id is invalid."
    ],
    "detalles": [
      "The detalles field is required to have at least 1 items."
    ]
  }
}
```

---

### Error 2️⃣: Token Expirado

**Request sin token o token inválido**:
```bash
curl -X GET "http://localhost:8000/api/orders" \
  -H "Authorization: Bearer INVALID_TOKEN"
```

**Respuesta** (401 Unauthorized):
```json
{
  "message": "Unauthenticated."
}
```

**Solución**: Volver a autenticarse y obtener nuevo token

---

### Error 3️⃣: Orden No Encontrada

**Request**:
```bash
curl -X GET "http://localhost:8000/api/orders/9999" \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta** (404 Not Found):
```json
{
  "message": "Orden de surtido no encontrada"
}
```

---

### Error 4️⃣: Producto No Existe

**Request**:
```bash
curl -X POST "http://localhost:8000/api/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prioridad_id": 1,
    "detalles": [
      {
        "producto_id": 99999,
        "cantidad_requerida": 100
      }
    ]
  }'
```

**Respuesta** (422):
```json
{
  "message": "Unprocessable Content",
  "errors": {
    "detalles.0.producto_id": [
      "The selected detalles.0.producto_id is invalid."
    ]
  }
}
```

---

## 🧪 Casos de Prueba Clave

### Test 1: Transacción - Verificar Integridad

**Objetivo**: Verificar que si falla un detalle, toda la orden se revierte

```bash
# Crear orden con producto invalido en el segundo detalle
curl -X POST "http://localhost:8000/api/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prioridad_id": 1,
    "detalles": [
      {"producto_id": 1, "cantidad_requerida": 100},
      {"producto_id": 99999, "cantidad_requerida": 50}
    ]
  }'
```

**Resultado Esperado**:
- ❌ Falla la validación
- ✅ No se crea la orden
- ✅ No se crean detalles
- ✅ Base de datos sin cambios (rollback automático)

---

### Test 2: Folio Único

```bash
# Crear 2 órdenes en la misma fecha
for i in {1..2}; do
  curl -X POST "http://localhost:8000/api/orders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "prioridad_id": 1,
      "detalles": [{"producto_id": 1, "cantidad_requerida": 10}]
    }'
  sleep 1
done
```

**Resultado Esperado**:
- Orden 1: `ORD-20260323-00001`
- Orden 2: `ORD-20260323-00002`
- ✅ Folios diferentes (contador incremental)

---

### Test 3: Eager Loading (Sin N+1)

```bash
# Verificar que una sola query obtiene todo
curl -X GET "http://localhost:8000/api/orders" \
  -H "Authorization: Bearer $TOKEN"
```

**Análisis en logs**:
```
✅ Queries ejecutadas: ~3-5 (no incrementa con cantidad de órdenes)
❌ Queries ejecutadas: 1 + (N * relaciones) (problema N+1)
```

---

## 🔍 Debugging & Logs

### Ver logs en tiempo real

```bash
# Terminal 1: Ver logs
tail -f organirack-backend/storage/logs/laravel.log

# Terminal 2: Hacer request
curl -X GET "http://localhost:8000/api/orders" \
  -H "Authorization: Bearer $TOKEN"
```

**Logs esperados**:
```
[2026-03-23 10:30:45] local.DEBUG: Órdenes obtenidas correctamente
[2026-03-23 10:30:45] local.INFO: OrderService: getAllOrders ejecutado
```

---

### Verificar estado de BD

```bash
php artisan tinker

# Dentro de tinker:
> \App\Models\OrdenSurtido::count()
2

> \App\Models\DetalleSurtido::count()  
5

> \App\Models\OrdenSurtido::with('detalles')->first()
=> App\Models\OrdenSurtido {#1234}

> \App\Models\OrdenSurtido::find(1)->detalles->count()
3
```

---

## 📊 Performance - Benchmarking

### Medir tiempo de respuesta

```bash
# Crear 100 órdenes y medir tiempo
time for i in {1..100}; do
  curl -s -X POST "http://localhost:8000/api/orders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "prioridad_id": 1,
      "detalles": [{"producto_id": 1, "cantidad_requerida": 10}]
    }'
done
```

**Benchmarks esperados**:
- Crear orden: ~200-500ms
- Listar 15 órdenes: ~300-600ms
- Obtener orden específica: ~100-300ms

---

## 🚨 Troubleshooting

### Problema 1️⃣: "No se encontró el estado Pendiente"

**Error en respuesta**:
```json
{
  "message": "Error al crear la orden de surtido",
  "error": "No se encontró el estado \"Pendiente\" en la base de datos."
}
```

**Solución**:
```bash
php artisan tinker

> \App\Models\EstadoOrden::create(['nombre' => 'Pendiente', 'color_hex' => '#f59e0b'])
```

---

### Problema 2️⃣: Token almacenado no funciona

**Síntoma**: Siempre devuelve 401

**Solución**:
```bash
# Verificar que el token esté bien guardado en headers
curl -v -X GET "http://localhost:8000/api/orders" \
  -H "Authorization: Bearer $TOKEN"

# Buscar "Authorization: Bearer" en los headers
```

---

### Problema 3️⃣: CORS - Frontend no puede conectar

**Error en navegador**:
```
Cross-Origin Request Blocked
```

**Verificar en backend** (`config/cors.php`):
```php
'allowed_origins' => ['http://localhost:5173', 'http://localhost:3000'],
```

---

### Problema 4️⃣: Relaciones no se cargan

**Síntoma**: `detalles` viene vacío o null

**Verificar** en `OrderService::getOrderById()`:
```php
return OrdenSurtido::with([
    'detalles.producto',  // ✅ Debe estar aquí
    'estado',
    'prioridad',
])->find($id);
```

---

## 📈 Monitoreo en Producción

### Queries lentas

Habilitar en `config/database.php`:
```php
'log_query_time' => 100, // Log queries > 100ms
```

### Rutas lentas

Habilitar en `routes/api.php`:
```php
Route::middleware(['throttle:60,1'])->group(function () {
    // Limita a 60 requests por minuto
});
```

---

## ✅ Checklist Final

- [ ] Token Sanctum generado correctamente
- [ ] GET /api/orders funciona
- [ ] POST /api/orders con detalles válidos funciona
- [ ] GET /api/orders/{id} retorna orden completa
- [ ] Validación rechaza datos inválidos
- [ ] Folio se genera automáticamente único
- [ ] Transacción revierte en error
- [ ] Eager loading evita N+1
- [ ] Logs se generan correctamente
- [ ] Performance dentro de límites

---

**Fecha de revisión**: 23 de Marzo, 2026  
**Status**: ✅ Documentación Completa
