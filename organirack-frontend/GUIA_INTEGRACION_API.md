# 🚀 Guía: Integración Frontend con API Backend

**Estado:** ✅ Componente actualizado para consumir datos REALES

---

## 📋 Cambios Realizados

### 1. **Importaciones Agregadas**
```tsx
import axios from "axios";
```

### 2. **Nuevos Estados**
```tsx
const [loading, setLoading] = useState(true);      // Estado de carga
const [error, setError] = useState<string | null>(null);  // Error handling
```

### 3. **Funciones de API**

#### `getAuthToken()`
- Obtiene el token de Sanctum desde localStorage o sessionStorage
- El token se guarda durante el login

#### `fetchProducts()`
- Hace GET a `http://localhost:8000/api/products`
- Envía headers con autenticación Sanctum
- Con respaldo a mock data si hay error de conexión

#### `handleSave()` (Actualizado)
- Hace POST (crear) o PUT (actualizar)
- Sincroniza con API antes de actualizar UI
- Manejo de errores con validaciones

#### `handleDelete()` (Actualizado)
- Hace DELETE a `/api/products/{id}`
- Borrado lógico (cambia estado)
- Confirmación del usuario

### 4. **UI Mejorada**
- Loading spinner mientras carga
- Mensaje de error con opción de Reintentar
- Mensaje "No hay productos" cuando está vacío
- Indicadores visuales de estado

---

## ⚙️ REQUISITOS PREVIOS

### 1. Backend Laravel CORRIENDO
```bash
cd organirack-backend
php artisan serve
# http://localhost:8000
```

### 2. Frontend CORRIENDO
```bash
cd organirack-frontend
npm run dev
# http://localhost:5173
```

### 3. Base de datos POBLADA
```bash
cd organirack-backend
php artisan migrate
php artisan db:seed  # Ejecuta todos los seeders
```

---

## 🔐 AUTENTICACIÓN

### Flujo de Login

1. **Usuario inicia sesión** en la aplicación
2. **Backend retorna token Sanctum**
3. **Frontend guarda token** en localStorage
4. **Cada petición a API** incluye el token en el header

### Guardar Token (Ejemplo en AuthLogin.tsx)

```tsx
// Cuando recibes el token del API
const response = await axios.post('/api/login', credentials);

if (response.data.token) {
  // Guardar en localStorage
  localStorage.setItem('token', response.data.token);
  
  // O en sessionStorage (se borra al cerrar navegador)
  sessionStorage.setItem('token', response.data.token);
}
```

### Clave de Almacenamiento

```
localStorage.setItem('token', tokenValue)  ← Persiste en navegador
sessionStorage.setItem('token', tokenValue) ← Se borra al cerrar
```

---

## 🧪 TESTING

### Test 1: Sin Token (Error 401)
```
1. Limpiar localStorage
2. Abrir GestionProductos.tsx
3. Esperado: Error "No autorizado"
```

### Test 2: Con Token (Success)
```
1. Iniciar sesión (guardará token)
2. Navegar a GestionProductos.tsx
3. Esperado: Tabla con 15 productos cargados
```

### Test 3: Sin Servidor (Error Network)
```
1. Detener Laravel: CTRL+C
2. Abrir GestionProductos.tsx
3. Esperado: Error "Error de conexión" + cargará mock data
```

### Test 4: Crear Producto
```
1. Click en "Nuevo Producto"
2. Complete el formulario
3. Click "Crear Producto"
4. Esperado: Toast de éxito + tabla actualiza
```

### Test 5: Actualizar Producto
```
1. Click en Edit (lápiz)
2. Modifique datos
3. Click "Actualizar Producto"
4. Esperado: Cambios reflejados en tabla
```

### Test 6: Desactivar Producto
```
1. Click en Delete (basura)
2. Confirmar en popup
3. Esperado: Estado cambia a "Inactivo"
```

---

## 🌐 URLs Configuradas

```
Backend API:   http://localhost:8000/api/products
Frontend:      http://localhost:5173
```

### Si usas puertos diferentes:

Edita en `GestionProductos.tsx`:
```tsx
const response = await axios.get('http://localhost:8000/api/products', {
//                                ^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                Cambia aquí si el puerto es diferente
```

---

## 📊 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    GESTION PRODUCTOS                        │
└─────────────────────────────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
          [useEffect]            [handleSave]
          Carga inicial          Crear/Actualizar
                │                         │
                ▼                         ▼
        fetchProducts()          axios.post/put
                │                         │
                ▼                         ▼
        GET /api/products        POST /api/products
                │                   PUT /api/products/{id}
                │                         │
                ▼                         ▼
        [Procesar respuesta]    [Refetch + UI]
                │                         │
                ├────────────┬───────────┤
                ▼            ▼           ▼
              Éxito      Error         Error
                │          │             │
        [setState]   [Toast]        [Toast]
                │          │             │
                ▼          ▼             ▼
          [Renderizar]  [Retry btn]   [Fallback]
```

---

## 🚨 TROUBLESHOOTING

### Error: "No autorizado"
**Problema:** Token expirado o no guardado
**Solución:**
1. Cierra sesión y vuelve a iniciar
2. Asegúrate que el token se guarda en localStorage

### Error: "Error de conexión"
**Problema:** Servidor Laravel no está corriendo
**Solución:**
```bash
cd organirack-backend
php artisan serve
```

### Error: "Endpoint de API no encontrado"
**Problema:** Rutas no registradas
**Solución:**
```bash
cd organirack-backend
php artisan route:list  # Verifica que /api/products existe
```

### Productos no se actualizan
**Problema:** Validación fallando en backend
**Solución:**
1. Revisa el error en la consola del navegador
2. Valida los datos antes de enviar
3. Revisa que las relaciones (categoria_id, etc.) sean válidas

---

## 💾 DATOS REALES EN BD

**15 productos** de 4 categorías, 3 marcas, 3 unidades:

```
ELECTRÓNICA:
- Monitor LED 24" (Samsung)
- Cable HDMI (Samsung)
- Adaptador USB-C (Samsung)
- Batería 18V (DeWalt)
- Cargador Rápido (DeWalt)

HERRAMIENTAS:
- Taladro Percutor (Bosch)
- Juego de Puntas (Bosch)
- Martillo (Bosch)
- Destornillador (Samsung)

HARDWARE:
- Tornillo 3x25mm (DeWalt)
- Tuerca M10 (DeWalt)
- Arandela (DeWalt)
- Clavo 2" (Bosch)

MATERIALES:
- Cemento Portland (Bosch)
- Arena (Bosch)
```

---

## ✨ CARACTERÍSTICAS IMPLEMENTADAS

✅ Fetch de datos REALES de la API  
✅ Envío automático del token Sanctum  
✅ Crear productos  
✅ Actualizar productos  
✅ Desactivar productos (borrado lógico)  
✅ Búsqueda y filtros  
✅ Loading spinner  
✅ Error handling avanzado  
✅ Fallback a mock data  
✅ Reintentar en caso de error  
✅ Toast notifications  
✅ Validaciones en tiempo real  

---

## 🔄 Próximos Pasos

1. **Logout:** Limpiar token de localStorage
2. **Paginación:** Implementar si hay > 100 productos
3. **Caching:** Guardar categorías en memory
4. **Optimización:** Lazy load de imágenes si existen

---

**Última actualización:** 23 de Marzo de 2026  
**Versión:** 2.0 - Con integración API Real
