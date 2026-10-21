# Análisis del Módulo de Trazabilidad — Bitácora de Auditoría

> **Archivo analizado:** `organirack-frontend/src/app/pages/BitacoraAuditoria.tsx`  
> **Fecha:** 10/04/2026

---

## Visión General

La página `BitacoraAuditoria` es el registro inmutable y forense del sistema WMS. Su objetivo principal es proveer trazabilidad total sobre cada movimiento de inventario, identificando el **qué, cuándo, cómo y quién**. Para lograr un rendimiento óptimo con miles de registros históricos, este componente confía plenamente en el **Server-Side Pagination** (paginación y filtrado en el backend de Laravel) a diferencia de otras pantallas que lo hacen en memoria.

---

## Mapa de Datos: Frontend → Endpoint → Backend → DB

| Elemento/Acción | Método del Servicio Frontend | Endpoint | Controlador / Servicio | Tablas Afectadas (Modelos) |
|----------------|------------------------------|---------|------------------------|---------------------------|
| 📜 **Carga Inicial y Paginación** | `getAuditLogs(filters)` | `GET /api/audit-logs` | `AuditController` → `AuditService::getAuditLogs()` | `audit_logs` ⋈ `users` ⋈ `detalle_surtidos` ⋈ `productos` |
| 🔍 **Filtros Dinámicos** (Fechas, Operador, Texto) | `getAuditLogs(filters)` | `GET /api/audit-logs?search=x&date_from=y...` | `AuditController` → `AuditService::getAuditLogs()` | Múltiples condiciones `WHERE` dinámicas en Eloquent |
| 🗃️ **Llenado de Comboboxes** (Opciones Filtro) | *Incluido en la misma respuesta del Endpoint* | `GET /api/audit-logs` | `AuditController` → `AuditService::getFilterOptions()` | `audit_logs` (extracción de IDs únicos), `users` |
| 👁️ **Modal de Detalles** (Hover/Click) | *Ninguno (Datos precargados)* | *N/A (Se maneja en memoria)* | *N/A* | Eager Loading previo de Laravel |

---

## Detalle por Sección Principal

---

### 1. 🔍 Cabecera y Caja de Filtros de Búsqueda

**¿Qué hace?**  
Una robusta interfaz de filtrado conformada por: Input de texto, dos selects dinámicos (Operador y Tipo de Movimiento), y selectores de rangos de fecha nativos.

**Frontend (`BitacoraAuditoria.tsx`):**
- **Estado Integrado:** Todos los filtros se consolidan en un único estado `filters` de tipo `AuditLogFilters`.
- **Debounce de 400ms:** Al tipear texto en el buscador, no se dispara una petición API por cada letra. Un bloque `setTimeout` encapsula la llamada, esperando 400 milisegundos tras la última tecla para enviar el request al backend.
- **Auto-Reset:** Cambiar cualquier filtro o escribir en el buscador fuerza el reseteo a la "Página 1" (`handleFilterChange`), previniendo errores de estado (ej: buscar algo mientras estás en la página 15, cuando los resultados caben en solo 1 página).

**Backend — Query SQL Equivalente (Filtro Dinámico):**
El servicio backend `AuditService.php` anida cláusulas base (`->where(...)`) dependiendo de qué parámetros lleguen en la URL. 
```sql
-- Ejemplo si el usuario busca la palabra "Caja" filtando por "Picking"
SELECT * FROM audit_logs 
WHERE tipo_movimiento = 'picking'
AND (observaciones LIKE '%Caja%' OR cantidad_nueva LIKE '%Caja%');
```

---

### 2. 📜 Tabla de Registros Paginada por Servidor (Server-Side)

**¿Qué hace?**  
Muestra un extracto rápido de los logs de auditoría (el *Quién*, el *Qué* y el *Cuándo*). 

**Frontend (`BitacoraAuditoria.tsx`):**
- A diferencia de `InventarioGlobal.tsx` (que hace `.slice()` en arreglos locales), aquí los botones de "Siguiente" y "Anterior" re-asignan la variable `page` dentro de los `filters`, obligando al `useEffect` a ejecutar un nuevo `axiosInstance.get`.
- Utiliza **Helpers Locales** para traducir visualmente la Data cruda (`getMovementBadgeStyle`, `getMovementIcon`, `getRelativeTime`). Ésto ahorra espacio y lógica dentro de los Tags JSX.

**Backend — Query y Paginación:**
El controlador recaba la Metadata estructurada (`filterOptions`), los datos (`transformedData` modificados sutilmente) y las métricas de paginación (`paginate()->currentPage()`). Todo esto se consolida en un **gran objeto maestro de respuesta** para el Front.

---

### 3. 👁️ Modal de Inspección Profunda (Detalle Forense)

**¿Qué hace?**  
Un slide-over / dialog que muestra la relación relacional del log (¿De dónde venía el paquete?, ¿A dónde iba?, ¿Quién era el operador de este Picking?). Se usa mucho en las "Sobreescrituras" (Overrides) por si un operador forzó una recolección en estantes no sugeridos.

**Frontend (`BitacoraAuditoria.tsx`):**
- El Dialog no dispara ninguna consulta al Backend. Cuando el usuario hace click en "Detalle", React asigna ese objeto específico al estado `selectedLog`. 
- El renderizado utiliza verificaciones lógicas (ej: `selectedLog.detalle_surtido.fue_modificado`) para pintar dinámicamente alertas rojas o verdes alertando al auditor del "Override".

**Backend — Eager Loading Múltiple (`AuditService.php`):**
El origen de todos los datos cruzados sin hacer mil consultas y saturar la DB se logra mediante Eager Loading múltiple en Eloquent a la hora de descargar la tabla principal:
```php
$query = AuditLog::query()
    ->with([
        'user:id,name,username',
        'detalleSurtido.producto:id,sku,nombre',
        'detalleSurtido.estanteSugerido:id,codigo_etiqueta',
        'estanteOrigen:id,codigo_etiqueta'
        // ...
    ]);
```

---

## Decisiones de Arquitectura Destacables

| Concepto Técnico | Impacto Arquitectónico |
|------------------|------------------------|
| **Delegación del Payload de Paginación** | El Frontend es "tonto" respecto al cálculo aritmético de páginas. React simplemente inyecta las variables `pagination.last_page` y `pagination.total` devueltas por el Backend (Laravel's `paginate()`) para habilitar o deshabilitar la UI. |
| **Generación Reactiva de Opciones** | Los tipos de movimiento y usuarios que aparecen en el UI Combobox `<Select>` no están harcodeados en el componente de TypeScript. Se leen desde la base de datos con un `distinct()` a través de `getFilterOptions()` asegurando que siempre existirán filtros actualizados sin recompilar el código TS. |
| **Transformación (Map) en API Resource** | En `AuditController.php`, los datos brutos de Eloquent sufren una re-estructuración mediante `map()`. Esto asegura que el Frontend siempre reciba un modelo JSON estrictamente delineado (limpiando nulos y relaciones extrañas) impidiendo roturas de tipo de dato (Type Safety). |
