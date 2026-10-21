# Análisis del Módulo Interactivo — MapaAlmacen

> **Archivo analizado:** `organirack-frontend/src/app/pages/MapaAlmacen.tsx`  
> **Fecha:** 10/04/2026

---

## Visión General

La página `MapaAlmacen` es el corazón visual y operativo del sistema (WMS). Combina una vista dual: por un lado, es un explorador jerárquico del almacén (Visualización) y por otro, un creador/editor de la estructura física del mismo (Modo Constructor). Su lógica recae en una carga inicial pesada del árbol (Arreglo Anidado) y peticiones bajo demanda (Lazy-Loading) para el inventario de cada nodo u hoja final (Estante).

---

## Mapa de Datos: Frontend → Endpoint → Backend → DB

| Elemento/Acción | Método del Servicio | Endpoint | Controlador / Servicio | Tablas Afectadas |
|----------------|--------------------|---------|-----------------------|-------------------|
| 🌳 **Árbol Izquierdo** — Carga de Estructura | `getTree()` | `GET /api/ubicaciones/arbol` | `LocationController` → `LocationService::getLocationTree()` | `almacenes` ⋈ `pasillos` ⋈ `racks` ⋈ `estantes` |
| 📦 **Panel Derecho** — Ver Inventario | `getInventoryByEstante(id)` | `GET /api/ubicaciones/estantes/{id}/inventario` | `LocationController` → `LocationService::getInventoryByEstante()` | `inventarios` ⋈ `productos` |
| 🛠️ **Árbol Izquierdo** — Modo Constructor CRUD | `create{Entidad}(data)`<br>`delete{Entidad}(id)` | `POST /api/ubicaciones/crud/{entidad}`<br>`DELETE /api/ubicaciones/crud/{entidad}/{id}` | `LocationController` → `LocationService::create/delete` | La entidad especificada (`almacenes`, `pasillos`, etc.) |
| ➕ **Panel Derecho** — Ajuste Manual de Stock | `addManualStock(data)` | `POST /api/inventario/manual` | `InventoryController` → `InventoryService::addManualStock()` | `inventarios` (+ Log en `audits`) |

---

## Detalle por Sección Principal

---

### 1. 🌳 Panel Izquierdo — Árbol de Navegación

**¿Qué hace?**  
Renderiza la estructura jerárquica física (`Almacén` → `Pasillos` → `Racks` → `Estantes`). Utiliza un patrón de "Acordeón Anidado" donde los niveles se abren dinámicamente mediante estados de React unidos al ID de la entidad seleccionada.

**Frontend (`MapaAlmacen.tsx`):**
- **Estado de Navegación:** Variables booleanas `isExpanded` combinadas con identificadores de string como `pasilloExpandido` y `rackExpandido`.
- **Modo Constructor:** Controlado por el toggle `editMode`. Si es `true`, renderiza un array de botones flotantes (`[+]` y `[Basurero]`) que inyectan el *Payload* (tipo de entidad y ID del padre) al `ModalEstructura`.
- **Botón Raíz:** Un botón explícito `[+ Nuevo Almacén]` en el `<CardHeader>` permite iniciar un nuevo árbol logístico.

**Backend — Query SQL Equivalente (Eager Loading):**
```sql
-- Resuelto por Eloquent usando Eager Loading en LocationService::getLocationTree()
SELECT * FROM almacenes;
SELECT * FROM pasillos WHERE almacen_id IN (...);
SELECT * FROM racks WHERE pasillo_id IN (...);
SELECT * FROM estantes WHERE rack_id IN (...);
```
> En lugar de bucles gigantes (N+1), Laravel condensa el árbol a nivel backend generando colecciones de PHP incrustadas al enviar el JSON. Todo el árbol viaja en una sola petición.

---

### 2. 📦 Panel Derecho — Detalle del Estante

**¿Qué hace?**  
Muestra el "interior" del estante que hayas clicado en la hoja del árbol. Contiene métricas derivadas de su espacio físico y la tabla del inventario real.

**Frontend (`MapaAlmacen.tsx`):**
- Se "dispara" al invocar la función `seleccionarEstante(estante)`.
- Descarga una segunda solicitud de datos a `InventoryService` y los almacena en el estado `inventarioLocal`.
- Si el `editMode` está encendido, un botón gigante habilita el `ModalAjusteStock` para ingresar la cantidad directa de SKUs. Al terminar de inyectar, se re-gatilla la carga del inventario usando `fetchInventario(estanteSeleccionado.id)` para actualizar la vista.

**Backend — Query SQL Equivalente:**
```sql
SELECT 
  inventarios.*, 
  productos.nombre, productos.sku
FROM inventarios
JOIN productos ON inventarios.producto_id = productos.id
WHERE estante_id = ? AND cantidad > 0;
```
> *Nota Crítica:* En el API, el inventario siempre omite registros con `cantidad = 0` explícitamente (`where('cantidad', '>', 0)`). 

---

### 3. 🛡️ Capa Protectora — Modal Delete (Borrado en Cascada)

**¿Qué hace?**  
El `AlertDialog` detiene posibles descargas de pánico en la base de datos previniendo el borrado de elementos llenos. 

**Implementación Backend (`LocationService.php`):**
El UI confía enteramente en validaciones transaccionales del servidor.
Si el usuario intenta borrar un Almacén con Pasillos (o Estantes con un inventario existente), el método arrojará una excepción interceptada por el WMS que emitirá un Error 400 avisando en la consola de `sonner`:
```php
if (Pasillo::where('almacen_id', $id)->exists()) {
    throw new \Exception('No se puede eliminar el almacén porque contiene pasillos estructurales.');
}
```

---

## Flujo de Interacción y Renderizado

```text
[Montaje del componente: MapaAlmacen]
        │
        ▼
   useEffect() → GET /api/ubicaciones/arbol
        │
        ▼
[Se pliega el árbol interactivo]
        │
  (Usuario clickea un Nodo 'Pasillo') → togglePasillo(id)
        │
  (Usuario clickea un Nodo 'Rack') → toggleRack(id)
        │
  (Usuario clickea un Nodo FINAL 'Estante')
        │
        ▼
seleccionarEstante(estante)
        ├── 1. Abre Panel Derecho
        └── 2. GET /api/ubicaciones/estantes/{id}/inventario
                 │
                 ▼
          setInventarioLocal() → Renderiza Lista de Tarjetas SKU
```

---

## Decisiones de Diseño Destacables

| Concepto Visual | Lógica o Implementación de Arquitectura |
|-----------------|-----------------------------------------|
| **Lazy-Loading de Datos Reales** | En vez de cargar estantes **e** inventario pesado de un solo golpe `(arbol + inventarios)`, el WMS segmenta en dos rutas. El Frontend solicita el árbol de rutas *vacío*, y rellena los estantes "bajo demanda", reduciendo exponencialmente la carga RAM del navegador. |
| **Separación de Responsabilidades** | El CRUD estructural (`LocationService`) y el manejo de cantidades en SKU (`InventoryService`) corren en endpoints diferentes, respetando el Patrón Fachada por controlador. |
| **Pase Condicional (Modo Edición)** | React utiliza un State simple `editMode`. Todos los modales pesados, íconos de basurero y lógica de borrado no se adjuntan al DOM hasta que este es verdadero, lo que acelera el DOM-Painting del WMS cuando se usa como "Modo Lectura". |
| **Prevención de Relaciones N+1** | La jerarquía entera de almacenes que visualizas a la izquierda en Frontend la crea Laravel mediante `with(['pasillos.racks.estantes'])`, lo que requiere 1 ms del modelo en base de datos. |
