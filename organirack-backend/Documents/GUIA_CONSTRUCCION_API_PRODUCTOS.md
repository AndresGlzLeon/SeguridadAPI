# GUÍA RÁPIDA: Construcción de la API de Productos

---

## ✅ Archivos Creados

### 1. **FormRequests** (Validación)
```
app/Http/Requests/
├── StoreProductRequest.php      (Validación para crear)
└── UpdateProductRequest.php     (Validación para actualizar)
```

**Características:**
- ✅ Validación de campos obligatorios
- ✅ Validación de existencia en tablas (`exists:categorias,id`, etc.)
- ✅ Validación de unicidad de SKU (excepto al actualizar)
- ✅ Validación personalizada: `stock_max >= stock_min`
- ✅ Mensajes de error en español

---

### 2. **Service Layer** (Lógica de Negocio)
```
app/Services/
└── ProductService.php
```

**Métodos principales:**

| Método | Descripción |
|--------|-------------|
| `getAllProducts(array $filters)` | Retorna productos paginados con Eager Loading |
| `getProductById(int $id)` | Obtiene un producto con relaciones |
| `createProduct(array $data)` | Crea nuevo producto |
| `updateProduct(int $id, array $data)` | Actualiza producto existente |
| `toggleProductState(int $id)` | Cambia estado activo/inactivo (Borrado Lógico) |
| `deleteProduct(int $id)` | Desactiva un producto (alias de toggle) |

**Características Importantes:**
- ✅ **Eager Loading**: Siempre carga `categoria`, `unidadMedida`, `marca`
- ✅ Búsqueda por `sku` o `nombre`
- ✅ Filtros por estado y categoría
- ✅ Paginación configurable

---

### 3. **Controller** (Endpoints)
```
app/Http/Controllers/Api/
└── ProductController.php
```

**Endpoints implementados:**
- `index()` → GET `/api/products` (Lista con paginación)
- `store()` → POST `/api/products` (Crear)
- `show()` → GET `/api/products/{id}` (Obtener uno)
- `update()` → PUT `/api/products/{id}` (Actualizar)
- `destroy()` → DELETE `/api/products/{id}` (Desactivar)

**Características:**
- ✅ Respuestas JSON estandarizadas
- ✅ Manejo de excepciones
- ✅ HTTP Status Codes correctos (200, 201, 404, 422, 500)

---

### 4. **Rutas** (API Resource)
```
routes/api.php
```

**Líneas agregadas:**
```php
// Importación
use App\Http\Controllers\Api\ProductController;

// Rutas
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('products', ProductController::class)
        ->names([
            'index' => 'products.index',
            'store' => 'products.store',
            'show' => 'products.show',
            'update' => 'products.update',
            'destroy' => 'products.destroy',
        ]);
});
```

**Rutas generadas automáticamente:**
- GET `/api/products` → index
- POST `/api/products` → store
- GET `/api/products/{product}` → show
- PUT `/api/products/{product}` → update
- DELETE `/api/products/{product}` → destroy

---

### 5. **Frontend** (React Component - Actualizado)
```
organirack-frontend/src/app/pages/
└── GestionProductos.tsx
```

**Cambios realizados:**
- ✅ Actualizado interfaz `Product` para coincidir con backend
- ✅ Agregadas interfaces para `Categoria`, `UnidadMedida`, `Marca`
- ✅ Removidos campos inexistentes: `descripcion`, `stockActual`
- ✅ Renombrados campos: `stockMinimo` → `stock_min`, etc.
- ✅ Agregado estado para catálogos: `categorias`, `unidades`, `marcas`
- ✅ Actualizado formulario con selects para relaciones
- ✅ Actualizadas columnas de tabla
- ✅ Actualizada lógica de filtrados

---

## 🔄 Flujo de Datos

### 1. **Creación de Producto**
```
Frontend (Formulario)
    ↓
GestionProductos.tsx (handleSave)
    ↓
API: POST /api/products
    ↓
StoreProductRequest (Validación)
    ↓
ProductService.createProduct()
    ↓
Modelo Producto (save)
    ↓
Response con Eager Loading
    ↓
Frontend actualiza estado
```

### 2. **Lectura de Productos**
```
Frontend (useEffect)
    ↓
API: GET /api/products?filters
    ↓
ProductService.getAllProducts()
    ↓
Query con with(['categoria', 'unidadMedida', 'marca'])
    ↓
Paginación aplicada
    ↓
Response con datos completos
    ↓
Frontend renderiza tabla
```

### 3. **Actualización de Producto**
```
Frontend (Edit button)
    ↓
Dialog abre con datos
    ↓
API: PUT /api/products/{id}
    ↓
UpdateProductRequest (Validación)
    ↓
ProductService.updateProduct()
    ↓
Response con datos actualizados
    ↓
Frontend actualiza tabla
```

### 4. **Eliminación Lógica**
```
Frontend (Delete button)
    ↓
Confirmación del usuario
    ↓
API: DELETE /api/products/{id}
    ↓
ProductService.toggleProductState()
    ↓
Cambio: estado = !estado
    ↓
Response con producto (inactivo)
    ↓
Frontend actualiza visualmente
```

---

## 🧪 Testing Manual

### Test 1: Obtener lista de productos
```bash
curl -X GET "http://localhost:8000/api/products?per_page=5" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

**Esperar:**
- ✅ Status 200
- ✅ Array de productos con relaciones
- ✅ Objeto `pagination`

---

### Test 2: Crear producto
```bash
curl -X POST "http://localhost:8000/api/products" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "TEST-123",
    "nombre": "Producto Test",
    "categoria_id": 1,
    "unidad_medida_id": 1,
    "marca_id": 1,
    "stock_min": 10,
    "stock_max": 100,
    "estado": true
  }'
```

**Esperar:**
- ✅ Status 201
- ✅ Producto creado con ID
- ✅ Relaciones incluidas

---

### Test 3: Validación fallida
```bash
curl -X POST "http://localhost:8000/api/products" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "TEST-123",  # SKU duplicado
    "nombre": "Producto Test",
    "categoria_id": 999,  # No existe
    "unidad_medida_id": 1,
    "marca_id": 1,
    "stock_min": 100,
    "stock_max": 50,  # Mayor a min!
    "estado": true
  }'
```

**Esperar:**
- ✅ Status 422
- ✅ Mensajes de error detallados

---

### Test 4: Actualizar producto
```bash
curl -X PUT "http://localhost:8000/api/products/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "RACK-A001",
    "nombre": "Nombre Actualizado",
    "categoria_id": 1,
    "unidad_medida_id": 1,
    "marca_id": 1,
    "stock_min": 5,
    "stock_max": 200,
    "estado": true
  }'
```

**Esperar:**
- ✅ Status 200
- ✅ Datos actualizados

---

### Test 5: Desactivar producto
```bash
curl -X DELETE "http://localhost:8000/api/products/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Esperar:**
- ✅ Status 200
- ✅ Campo `estado` = false
- ✅ `updated_at` modificado

---

## 🔍 Verificación de Implementación

### Backend Checklist
- ✅ Archivos creados en directorios correctos
- ✅ Namespaces importados correctamente
- ✅ Rutas en `api.php` con middleware `auth:sanctum`
- ✅ Service inyectado en Controller
- ✅ FormRequests validando correctamente
- ✅ Eager Loading implementado en ProductService
- ✅ Borrado lógico (no delete físico)

### Frontend Checklist
- ✅ Interfaces actualizadas
- ✅ Selects dinámicos para relaciones
- ✅ Tabla muestra nombres (no IDs)
- ✅ Filtros funcionan con IDs
- ✅ Toast messages español
- ✅ Dialog form con campos correctos

---

## 🚀 Pasos Siguientes

### Próxima Fase: Integración Real
1. **Backend**: Ejecutar `php artisan migrate` (si no se ejecutó)
2. **Backend**: Seeders para poblar categorías, marcas, unidades
3. **Frontend**: Cambiar de datos mock a llamadas reales a API
4. **Frontend**: Agregar loading spinner durante requests
5. **Frontend**: Implementar error handling global

### Ejemplo de Integración en React
```tsx
// Hook para obtener productos
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProducts(data.data);
    } catch (error) {
      toast.error("Error cargando productos");
    } finally {
      setLoading(false);
    }
  };
  
  fetchProducts();
}, []);
```

---

## 📚 Estructura de Directorios Final

```
organirack-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── ProductController.php ✨ NEW
│   │   └── Requests/
│   │       ├── StoreProductRequest.php ✨ NEW
│   │       └── UpdateProductRequest.php ✨ NEW
│   ├── Models/
│   │   └── Producto.php (ya existe)
│   └── Services/
│       └── ProductService.php ✨ NEW
├── routes/
│   └── api.php (MODIFICADO)
└── DOCUMENTACION_API_PRODUCTOS.md ✨ NEW

organirack-frontend/
└── src/app/pages/
    └── GestionProductos.tsx (ACTUALIZADO)
```

---

## ⚠️ Consideraciones Importantes

1. **Autenticación**: Todos los endpoints requieren token Sanctum
2. **CORS**: Asegúrate que CORS esté configurado en backend
3. **Validaciones**: El backend es la fuente de verdad para validaciones
4. **Timestamps**: Los campos `created_at` y `updated_at` son automáticos
5. **Relaciones**: Siempre se retornan con los datos (Eager Loading)

---

**Estado:** ✅ Completado y listo para integración  
**Última actualización:** 23 de Marzo de 2026
