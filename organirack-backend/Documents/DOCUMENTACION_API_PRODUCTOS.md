# API REST - Gestión de Productos (Catálogo)
**OrganiRack+ - Backend API Documentation**

---

## 📋 Índice
1. [Endpoints](#endpoints)
2. [Modelos de Datos](#modelos-de-datos)
3. [Validaciones](#validaciones)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Autenticación](#autenticación)
6. [Notas de Negocio](#notas-de-negocio)

---

## 🔌 Endpoints

### Base URL
```
http://localhost:8000/api
```

### 1. Obtener Lista de Productos
**GET** `/api/products`

**Descripción:** Retorna todos los productos con paginación y filtros opcionales.

**Query Parameters:**
- `search` (string, opcional): Busca por SKU o nombre
- `estado` (boolean, opcional): Filtra por estado (true/false)
- `categoria_id` (integer, opcional): Filtra por categoría
- `per_page` (integer, opcional): Productos por página (default: 15)

**Headers Requeridos:**
```
Authorization: Bearer {TOKEN_SANCTUM}
Accept: application/json
```

**Response (200 OK):**
```json
{
  "message": "Productos obtenidos correctamente",
  "data": [
    {
      "id": 1,
      "sku": "RACK-A001",
      "nombre": "Estantería Industrial 2m",
      "categoria_id": 1,
      "unidad_medida_id": 1,
      "marca_id": 1,
      "stock_min": 10,
      "stock_max": 100,
      "estado": true,
      "created_at": "2026-03-23T10:30:00Z",
      "updated_at": "2026-03-23T10:30:00Z",
      "categoria": {
        "id": 1,
        "nombre": "Racks Pesados"
      },
      "unidadMedida": {
        "id": 1,
        "nombre": "Unidades",
        "abreviatura": "un"
      },
      "marca": {
        "id": 1,
        "nombre": "Industrial Brand"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 15,
    "total": 50,
    "last_page": 4,
    "from": 1,
    "to": 15
  }
}
```

**Ejemplos de Query:**
```
GET /api/products?search=RACK&per_page=20
GET /api/products?estado=true&categoria_id=1
GET /api/products?search=Industrial&estado=true
```

---

### 2. Obtener Producto Específico
**GET** `/api/products/{id}`

**Descripción:** Retorna los detalles de un producto específico.

**Path Parameters:**
- `id` (integer): ID del producto

**Headers Requeridos:**
```
Authorization: Bearer {TOKEN_SANCTUM}
Accept: application/json
```

**Response (200 OK):**
```json
{
  "message": "Producto obtenido correctamente",
  "data": {
    "id": 1,
    "sku": "RACK-A001",
    "nombre": "Estantería Industrial 2m",
    "categoria_id": 1,
    "unidad_medida_id": 1,
    "marca_id": 1,
    "stock_min": 10,
    "stock_max": 100,
    "estado": true,
    "created_at": "2026-03-23T10:30:00Z",
    "updated_at": "2026-03-23T10:30:00Z",
    "categoria": { "id": 1, "nombre": "Racks Pesados" },
    "unidadMedida": { "id": 1, "nombre": "Unidades", "abreviatura": "un" },
    "marca": { "id": 1, "nombre": "Industrial Brand" }
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Producto no encontrado"
}
```

---

### 3. Crear Nuevo Producto
**POST** `/api/products`

**Descripción:** Crea un nuevo producto en el catálogo.

**Headers Requeridos:**
```
Authorization: Bearer {TOKEN_SANCTUM}
Content-Type: application/json
Accept: application/json
```

**Request Body:**
```json
{
  "sku": "RACK-F089",
  "nombre": "Estante de Almacenaje Premium",
  "categoria_id": 1,
  "unidad_medida_id": 1,
  "marca_id": 2,
  "stock_min": 15,
  "stock_max": 200,
  "estado": true
}
```

**Response (201 Created):**
```json
{
  "message": "Producto creado correctamente",
  "data": {
    "id": 6,
    "sku": "RACK-F089",
    "nombre": "Estante de Almacenaje Premium",
    "categoria_id": 1,
    "unidad_medida_id": 1,
    "marca_id": 2,
    "stock_min": 15,
    "stock_max": 200,
    "estado": true,
    "created_at": "2026-03-23T11:45:00Z",
    "updated_at": "2026-03-23T11:45:00Z",
    "categoria": { "id": 1, "nombre": "Racks Pesados" },
    "unidadMedida": { "id": 1, "nombre": "Unidades", "abreviatura": "un" },
    "marca": { "id": 2, "nombre": "Premium Brand" }
  }
}
```

**Response (422 Unprocessable Entity):**
```json
{
  "message": "Error de validación",
  "errors": {
    "sku": ["El SKU ya existe en el sistema."],
    "stock_max": ["El stock máximo debe ser mayor o igual al stock mínimo."]
  }
}
```

---

### 4. Actualizar Producto
**PUT** `/api/products/{id}`

**Descripción:** Actualiza los datos de un producto existente.

**Path Parameters:**
- `id` (integer): ID del producto

**Headers Requeridos:**
```
Authorization: Bearer {TOKEN_SANCTUM}
Content-Type: application/json
Accept: application/json
```

**Request Body:**
```json
{
  "sku": "RACK-A001",
  "nombre": "Estantería Industrial 2m - Actualizada",
  "categoria_id": 1,
  "unidad_medida_id": 1,
  "marca_id": 1,
  "stock_min": 5,
  "stock_max": 150,
  "estado": true
}
```

**Response (200 OK):**
```json
{
  "message": "Producto actualizado correctamente",
  "data": {
    "id": 1,
    "sku": "RACK-A001",
    "nombre": "Estantería Industrial 2m - Actualizada",
    "categoria_id": 1,
    "unidad_medida_id": 1,
    "marca_id": 1,
    "stock_min": 5,
    "stock_max": 150,
    "estado": true,
    "created_at": "2026-03-23T10:30:00Z",
    "updated_at": "2026-03-23T12:00:00Z",
    "categoria": { "id": 1, "nombre": "Racks Pesados" },
    "unidadMedida": { "id": 1, "nombre": "Unidades", "abreviatura": "un" },
    "marca": { "id": 1, "nombre": "Industrial Brand" }
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Producto no encontrado"
}
```

---

### 5. Eliminar/Desactivar Producto
**DELETE** `/api/products/{id}`

**Descripción:** Desactiva un producto (borrado lógico). Cambia `estado` a `false`.

**Path Parameters:**
- `id` (integer): ID del producto

**Headers Requeridos:**
```
Authorization: Bearer {TOKEN_SANCTUM}
Accept: application/json
```

**Response (200 OK):**
```json
{
  "message": "Producto eliminado/desactivado correctamente",
  "data": {
    "id": 1,
    "sku": "RACK-A001",
    "nombre": "Estantería Industrial 2m",
    "categoria_id": 1,
    "unidad_medida_id": 1,
    "marca_id": 1,
    "stock_min": 10,
    "stock_max": 100,
    "estado": false,
    "created_at": "2026-03-23T10:30:00Z",
    "updated_at": "2026-03-23T12:05:00Z",
    "categoria": { "id": 1, "nombre": "Racks Pesados" },
    "unidadMedida": { "id": 1, "nombre": "Unidades", "abreviatura": "un" },
    "marca": { "id": 1, "nombre": "Industrial Brand" }
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Producto no encontrado"
}
```

---

## 📊 Modelos de Datos

### Producto
| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| id | integer | ID único (auto-generado) | - |
| sku | string(50) | Código único del producto | ✅ |
| nombre | string(150) | Nombre del producto | ✅ |
| categoria_id | integer | FK a Categoría | ✅ |
| unidad_medida_id | integer | FK a Unidad de Medida | ✅ |
| marca_id | integer | FK a Marca | ✅ |
| stock_min | integer | Stock mínimo recomendado | ✅ |
| stock_max | integer | Stock máximo permitido | ✅ |
| estado | boolean | true = activo, false = inactivo | ✅ |
| created_at | timestamp | Fecha de creación | - |
| updated_at | timestamp | Fecha de última actualización | - |

### Categoría (Relación)
| Campo | Tipo |
|-------|------|
| id | integer |
| nombre | string(100) |
| descripcion | text |

### Unidad de Medida (Relación)
| Campo | Tipo |
|-------|------|
| id | integer |
| nombre | string(50) |
| abreviatura | string(10) |

### Marca (Relación)
| Campo | Tipo |
|-------|------|
| id | integer |
| nombre | string(100) |
| sitio_web | string |

---

## ✅ Validaciones

### Reglas de Validación

#### StoreProductRequest (Crear)
```php
'sku' => 'required|string|max:50|unique:productos,sku',
'nombre' => 'required|string|max:150',
'categoria_id' => 'required|integer|exists:categorias,id',
'unidad_medida_id' => 'required|integer|exists:unidades_medida,id',
'marca_id' => 'required|integer|exists:marcas,id',
'stock_min' => 'required|integer|min:0',
'stock_max' => 'required|integer|min:0',
'estado' => 'required|boolean',
// Regla personalizada: stock_max >= stock_min
```

#### UpdateProductRequest (Actualizar)
```php
// Igual a StoreProductRequest, BUT
'sku' => 'required|string|max:50|unique:productos,sku,{id}',
// El SKU permite el mismo valor para el mismo producto
```

### Mensajes de Error

```json
{
  "message": "Error de validación",
  "errors": {
    "sku": [
      "El SKU es obligatorio.",
      "El SKU ya existe en el sistema."
    ],
    "nombre": ["El nombre del producto es obligatorio."],
    "categoria_id": [
      "Debe seleccionar una categoría.",
      "La categoría seleccionada no existe."
    ],
    "stock_max": ["El stock máximo debe ser mayor o igual al stock mínimo."]
  }
}
```

---

## 🔐 Autenticación

### Obtener Token
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "almacenista",
    "password": "password"
  }'
```

**Response:**
```json
{
  "message": "Login exitoso",
  "token": "1|aBcDeFgHiJkLmNoPqRsT...",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "username": "almacenista",
    "email": "juan@example.com",
    "roles": ["Almacenista"]
  }
}
```

### Usar Token
```bash
curl -X GET http://localhost:8000/api/products \
  -H "Authorization: Bearer 1|aBcDeFgHiJkLmNoPqRsT..."
```

---

## 📝 Ejemplos de Uso

### 1. Buscar productos por SKU
```bash
curl -X GET "http://localhost:8000/api/products?search=RACK-A" \
  -H "Authorization: Bearer {TOKEN}"
```

### 2. Filtrar por categoría (Solo activos)
```bash
curl -X GET "http://localhost:8000/api/products?categoria_id=1&estado=true" \
  -H "Authorization: Bearer {TOKEN}"
```

### 3. Paginar resultados
```bash
curl -X GET "http://localhost:8000/api/products?per_page=30&page=2" \
  -H "Authorization: Bearer {TOKEN}"
```

### 4. Crear nuevo producto
```bash
curl -X POST http://localhost:8000/api/products \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "NEW-001",
    "nombre": "Nuevo Producto",
    "categoria_id": 1,
    "unidad_medida_id": 1,
    "marca_id": 1,
    "stock_min": 10,
    "stock_max": 100,
    "estado": true
  }'
```

### 5. Actualizar producto
```bash
curl -X PUT http://localhost:8000/api/products/1 \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "RACK-A001",
    "nombre": "Estantería Actualizada",
    "categoria_id": 1,
    "unidad_medida_id": 1,
    "marca_id": 1,
    "stock_min": 5,
    "stock_max": 150,
    "estado": true
  }'
```

### 6. Desactivar producto
```bash
curl -X DELETE http://localhost:8000/api/products/1 \
  -H "Authorization: Bearer {TOKEN}"
```

---

## 💼 Notas de Negocio

### Borrado Lógico
- **NO se eliminan físicamente** los productos de la base de datos
- El campo `estado` controla si el producto está activo (true) o inactivo (false)
- Al hacer DELETE, simplemente se cambia `estado` a false
- Los datos históricos se preservan para auditoría

### Eager Loading
- Los endpoints retornan **siempre** los datos relacionados:
  - `categoria` (nombre, id)
  - `unidadMedida` (nombre, abreviatura, id)
  - `marca` (nombre, id)
- Esto evita consultas N+1 en el frontend
- El frontend recibe **nombres legibles**, no solo IDs

### Timestamps Ocultos
- Los campos `created_at` y `updated_at` se incluyen en la respuesta
- Pero **NO se muestran en la UI del frontend** (opcionales para auditoría)
- Se pueden usar para timestamps de auditoría si se requiere

### Stock Management
- `stock_min`: Nivel mínimo de reorden (cuando comprar más)
- `stock_max`: Nivel máximo de almacenamiento
- **Validación**: `stock_max` SIEMPRE debe ser `>= stock_min`
- No existe campo de "stock actual" en este catálogo (está en Inventario)

### Categoría, Marca y Unidad
- Son **maestros** que deben existir antes de crear un producto
- Si intentas usar un ID que no existe, recibirás error 422
- Los endpoints retornan los **nombres completos** para UI legible

---

## 🚀 Próximos Pasos

1. **Integración Frontend**: Llamar a estos endpoints desde React
2. **Manejo de Errores**: Implementar error handlers globales
3. **Cache**: Cachear categorías, marcas y unidades (varían poco)
4. **Permisos**: Configurar roles para limitar acceso si se requiere
5. **Auditoría**: Registrar quién creo/actualizó cada producto

---

**Última actualización:** 23 de Marzo de 2026  
**Versión API:** 1.0.0  
**Estado:** ✅ Producción-Ready
