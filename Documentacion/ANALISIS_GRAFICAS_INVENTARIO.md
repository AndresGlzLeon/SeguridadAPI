# Análisis de Gráficas Dinámicas — InventarioGlobal

> **Archivo analizado:** `organirack-frontend/src/app/pages/InventarioGlobal.tsx`  
> **Fecha:** 07/04/2026

---

## Visión General

La página `InventarioGlobal` carga **4 fuentes de datos en paralelo** al montarse (`Promise.all`), cada una alimentando un elemento visual distinto. Todo el procesamiento de agregación ocurre en el **backend** — el frontend solo formatea colores y aplica filtros locales en memoria.

---

## Mapa de Datos: Frontend → Endpoint → Backend → DB

| Elemento Visual | Método del Servicio | Endpoint | Controlador / Servicio | Tablas consultadas |
|----------------|--------------------|---------|-----------------------|-------------------|
| 🍩 **PieChart** — Distribución por Estado | `getInventoryDistributionByState()` | `GET /api/dashboard/inventory/distribution-by-state` | `InventoryDashboardController` → `InventoryDashboardService::getInventoryDistributionByState()` | `inventarios` ⋈ `estados_inventario` |
| 📊 **BarChart** — Top 5 Estantes | `getTopShelvesByQuantity()` | `GET /api/dashboard/inventory/top-shelves` | `InventoryDashboardController` → `InventoryDashboardService::getTopShelvesByQuantity()` | `inventarios` ⋈ `estantes` |
| 📊 **BarChart** — Inventario por Categoría | `getInventoryDistributionByCategory()` | `GET /api/dashboard/inventory/distribution-by-category` | `InventoryDashboardController` → `InventoryDashboardService::getInventoryDistributionByCategory()` | `inventarios` ⋈ `productos` ⋈ `categorias` |
| 📋 **Tabla** — Control de Existencias | `getInventoryTable()` | `GET /api/dashboard/inventory/table` | `InventoryDashboardController` → `InventoryDashboardService::getInventoryTable()` | `inventarios` ⋈ `productos` ⋈ `estantes` ⋈ `estados_inventario` |

---

## Detalle por Gráfica

---

### 1. 🍩 PieChart — Distribución por Estado

**¿Qué muestra?** Porcentaje de unidades en stock clasificadas por estado cualitativo
(Disponible, Dañado, En Cuarentena, Merma).

**Frontend (`InventarioGlobal.tsx`):**
- Librería: **Recharts** `PieChart` + `Pie` + `Cell`
- `dataKey="cantidad_total"` — segmento proporcional por unidades
- Paleta de colores asignada en `useMemo` (`chartData`): verde, ámbar, rojo, violeta, azul
- Tooltip muestra valor en unidades; label en sector muestra `estado_nombre: porcentaje%`
- Panel lateral: lista resumen nombre + cantidad por estado

**Servicio (`inventoryService.ts`):**
```
GET /api/dashboard/inventory/distribution-by-state
→ response.data.data.data  (array de StateDistributionItem)
```

**Backend — query SQL equivalente:**
```sql
SELECT
  estado_id,
  estados_inventario.nombre AS estado_nombre,
  SUM(inventarios.cantidad) AS cantidad_total,
  ROUND(SUM(cantidad) / total_global * 100, 2) AS porcentaje
FROM inventarios
JOIN estados_inventario ON inventarios.estado_id = estados_inventario.id
GROUP BY estado_id
ORDER BY cantidad_total DESC
```
> El porcentaje se calcula en PHP tras obtener el total de la colección; **no** en SQL.

---

### 2. 📊 BarChart — Top 5 Estantes por Cantidad

**¿Qué muestra?** Los 5 estantes físicos con mayor acumulación de unidades en inventario.

**Frontend:**
- Librería: **Recharts** `BarChart` + `Bar` + `XAxis` + `YAxis`
- `dataKey="total_cantidad"`, eje X = `estante_codigo` (código de etiqueta)
- Barras con bordes redondeados (`radius={[8,8,0,0]}`) en azul `#3b82f6`
- Tooltip: `${value} unidades`
- Debajo del chart: 5 mini-cards con `estante_codigo`, `estante_nivel`, `total_cantidad` y `cantidad_productos`

**Backend — query SQL equivalente:**
```sql
SELECT
  estante_id,
  estantes.codigo_etiqueta AS estante_codigo,
  estantes.nivel           AS estante_nivel,
  SUM(inventarios.cantidad)          AS total_cantidad,
  COUNT(DISTINCT inventarios.producto_id) AS cantidad_productos
FROM inventarios
JOIN estantes ON inventarios.estante_id = estantes.id
GROUP BY estante_id
ORDER BY total_cantidad DESC
LIMIT 5
```

---

### 3. 📊 BarChart — Inventario por Categoría

**¿Qué muestra?** Unidades totales en stock agrupadas por categoría de producto.

**Frontend:**
- Misma configuración `BarChart` pero con `Cell` por barra para colores distintos (paleta de 7 colores)
- `dataKey="cantidad_total"`, eje X = `categoria_nombre`
- Tooltip incluye el porcentaje: `${value} unidades (${porcentaje}%)`

**Backend — query SQL equivalente:**
```sql
SELECT
  categorias.id   AS categoria_id,
  categorias.nombre AS categoria_nombre,
  SUM(inventarios.cantidad) AS total_cantidad
FROM inventarios
JOIN productos   ON inventarios.producto_id = productos.id
LEFT JOIN categorias ON productos.categoria_id = categorias.id
WHERE productos.estado = 1
GROUP BY categorias.id, categorias.nombre
ORDER BY total_cantidad DESC
```
> `LEFT JOIN` a `categorias` para incluir productos sin categoría asignada (`NULL → 'Sin Categoría'`).

---

### 4. 📋 Tabla — Control de Existencias

**¿Qué muestra?** Lista plana de todos los registros `inventarios` con SKU, nombre, ubicación, cantidad y estado.

**Frontend:**
- Componente `InventoryTableRow` con `memo()` — evita re-renders de filas individuales
- **Filtros locales** (no generan nuevas requests):
  - Búsqueda por texto (`useMemo` sobre `inventoryData`) — debounce de 150ms
  - Dropdown de estado (IDs hardcodeados 1–4: Disponible, Dañado, En Cuarentena, Merma)
- Paginación en memoria: 25 ítems/página, calculado con `useMemo`
- Botón `→` en cada fila navega a `MapaAlmacen` pasando `estante_id` y `ubicacion` por query string

**Backend:**
```sql
SELECT
  inventarios.id, producto_id, estante_id, estado_id,
  productos.sku, productos.nombre AS producto_nombre,
  estantes.codigo_etiqueta AS ubicacion,
  inventarios.cantidad,
  estados_inventario.nombre AS estado_nombre
FROM inventarios
JOIN productos         ON inventarios.producto_id = productos.id
JOIN estantes          ON inventarios.estante_id  = estantes.id
JOIN estados_inventario ON inventarios.estado_id  = estados_inventario.id
ORDER BY producto_id, estante_id
```
> Usa Eloquent `with(['producto:id,sku,nombre', 'estante:id,codigo_etiqueta,nivel', 'estado:id,nombre'])` — **Eager Loading** con columnas seleccionadas explícitamente para evitar over-fetching.

---

## KPI Cards (calculadas en el frontend)

Las 3 tarjetas de métricas **no generan peticiones propias**. Se derivan de `inventoryData` (el array completo de la tabla) mediante un solo `useMemo`:

| KPI | Cálculo |
|-----|---------|
| **Cantidad Total** | `inventoryData.reduce((sum, item) => sum + item.cantidad, 0)` |
| **Ubicaciones activas** | `new Set(inventoryData.map(i => i.estante_id)).size` |
| **Productos únicos** | `new Set(inventoryData.map(i => i.producto_id)).size` |

---

## Flujo de Carga Completo

```
[Montaje del componente]
        │
        ▼
Promise.all([4 peticiones en paralelo])
  ├── GET /api/dashboard/inventory/table               → setInventoryData()
  ├── GET /api/dashboard/inventory/distribution-by-state → setDistributionData()
  ├── GET /api/dashboard/inventory/top-shelves          → setTopShelvesData()
  └── GET /api/dashboard/inventory/distribution-by-category → setCategoryData()
        │
        ▼
[Todos los datos recibidos]
  ├── useMemo: chartData       → PieChart (con colores)
  ├── useMemo: categoryChartData → BarChart categorías (con colores)
  ├── topShelvesData           → BarChart top 5 (sin transformación)
  ├── useMemo: filteredData    → Tabla (búsqueda + filtro estado)
  ├── useMemo: paginatedData   → Tabla (slice de página actual)
  └── useMemo: metrics         → KPI Cards (calculado en cliente)
```

---

## Decisiones de Diseño Destacables

| Decisión | Implementación |
|----------|---------------|
| Toda la agregación en backend | `SUM`, `GROUP BY`, `ORDER BY` en SQL — el frontend no recalcula totales |
| Filtros de tabla 100% en cliente | `useMemo` sobre array ya cargado — sin requests adicionales por filtro |
| Porcentajes calculados en PHP | Loop `array_map` sobre la colección, no en SQL — más legible |
| Memoización agresiva | `useMemo` en 6 valores derivados, `useCallback` en handlers, `memo()` en filas |
| Carga paralela | `Promise.all` — los 4 endpoints se ejecutan simultáneamente |
| Estados hardcodeados en filtro | IDs 1–4 fijos, no dependen de una petición extra a `/api/catalogs` |
