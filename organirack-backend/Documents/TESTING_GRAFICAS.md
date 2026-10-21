# 🧪 GUÍA DE TESTING RÁPIDO - GRÁFICAS DEL DASHBOARD

## ⚡ Opción 1: HTML Estático (MÁS RÁPIDA - 5 minutos)

### Paso 1: Asegúrate que el servidor Laravel está corriendo
```bash
php artisan serve
# Debería estar en http://localhost:8000
```

### Paso 2: Obtener un token Sanctum
```bash
# Request POST
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "password":"password"
  }'

# Respuesta esperada:
# {
#   "token": "1|AberG8...",
#   "user": { ... }
# }
```

### Paso 3: Abrir la página HTML de test
1. Copia el token de la respuesta anterior
2. Abre en tu navegador: `http://localhost:8000/dashboard-test.html`
3. Pega el token en el input
4. Haz clic en "Cargar Dashboard"
5. ¡Las gráficas deberían aparecer! 🎉

**Ventajas:**
- No requiere npm, webpack, vite
- Funciona instantáneamente
- Perfecto para validar que los endpoints están funcionando
- Puede usarse offline

---

## 📦 Opción 2: Con Vite + Vue 3 (Recomendado para Desarrollo)

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Crear archivo .env
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=OrganiRackPlus Dashboard
```

### Paso 3: Ejecutar servidor Vite
```bash
npm run dev
# Abrirá en http://localhost:5173
```

### Paso 4: Configurar Router (si usas Vue Router)
En tu `src/router.js` o `src/main.js`:

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/DashboardView.vue'

const routes = [
  {
    path: '/dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

### Paso 5: Verificar que funciona
- Navega a `http://localhost:5173/dashboard`
- Las gráficas deberían cargar automáticamente

---

## ⚛️ Opción 3: Con React (Si lo prefieres)

### Paso 1: Copiar componente
Copia el contenido de `resources/components/DashboardReact.jsx` a tu proyecto React.

### Paso 2: Instalar dependencias
```bash
npm install chart.js
```

### Paso 3: Integrar en tu aplicación
```jsx
import DashboardReact from './components/DashboardReact'

function App() {
  const token = localStorage.getItem('sanctum_token')
  
  return (
    <div>
      <DashboardReact token={token} />
    </div>
  )
}

export default App
```

### Paso 4: Ejecutar
```bash
npm run dev
```

---

## 🔍 VERIFICAR ENDPOINTS INDIVIDUALES

Si quieres probar cada endpoint por separado:

```bash
# 1. Estado de Órdenes
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:8000/api/dashboard/orders-by-state | jq

# 2. Órdenes por Prioridad
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:8000/api/dashboard/orders-by-priority | jq

# 3. Inventario por Categoría
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:8000/api/dashboard/inventory-by-category | jq

# 4. Ocupación de Almacenes
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:8000/api/dashboard/warehouse-occupancy | jq

# 5. Stock Crítico
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:8000/api/dashboard/critical-stock | jq

# 6. Todas las métricas (más eficiente)
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:8000/api/dashboard/metrics | jq
```

**Nota:** Si no tienes `jq` instalado, omite el `| jq` para ver JSON sin formato.

---

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] El servidor Laravel está corriendo en puerto 8000
- [ ] Puedes hacer login y obtener un token
- [ ] Abres `dashboard-test.html` sin errores
- [ ] Las 3 gráficas principales aparecen
- [ ] La tabla de almacenes muestra datos
- [ ] La tabla de stock crítico muestra productos
- [ ] Los colores de las gráficas se ven bien
- [ ] No hay errores en la consola del navegador (F12)

---

## 🚨 TROUBLESHOOTING

### Error: "Network error" en la consola
**Causas posibles:**
1. Laravel no está corriendo
2. El CORS no está configurado correctamente

**Solución:**
```bash
# Verifica config/cors.php
php artisan serve

# Si aún falla, asegúrate que .env tiene:
APP_URL=http://localhost:8000
```

### Error: "401 Unauthorized"
**Causa:** El token es inválido o expirado

**Solución:**
```bash
# Obtén un nuevo token
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### Las gráficas aparecen en blanco
**Causa:** No hay datos en la base de datos

**Solución:**
1. Ejecuta migraciones: `php artisan migrate`
2. Crea datos de prueba: `php artisan db:seed`
3. O ingresa datos manualmente en la BD

### Error: "Cannot find module @vitejs/plugin-vue"
**Solución:**
```bash
npm install @vitejs/plugin-vue --save-dev
```

---

## 📝 SECUENCIA DE TESTING RECOMENDADA

### Primera vez:
1. **Verificar migraciones:**
   ```bash
   php artisan migrate
   ```

2. **Crear datos de prueba:**
   - Ejecutar seeders o insertar manualmente

3. **Testear endpoints con curl:**
   - Verificar que retornan datos correctos

4. **Probar con HTML estático:**
   - Rápido y sin dependencias

5. **Integrar en frontend Vue/React:**
   - Una vez que esté validado

### Después de cambios:
1. Tomar caché si es necesario: `php artisan cache:clear`
2. Reiniciar servidor Laravel
3. Refrescar página del navegador (Ctrl+F5)

---

## 💡 TIPS

- **Cachear resultados en producción:**
  ```php
  // En DashboardService.php
  return Cache::remember('dashboard_metrics', 3600, function() {
      // Tu lógica
  });
  ```

- **Agregar paginación a stock crítico:**
  ```php
  public function getCriticalStockProducts(int $limit = 15, int $page = 1)
  {
      return Producto::paginate($limit);
  }
  ```

- **Actualizar datos en tiempo real (WebSockets):**
  ```javascript
  // En DashboardView.vue
  Echo.channel('dashboard')
      .listen('DashboardUpdated', (data) => {
          refreshCharts();
      });
  ```

---

**¡Listo! Ahora tienes 3 maneras diferentes de testear tus gráficas.** 🚀
