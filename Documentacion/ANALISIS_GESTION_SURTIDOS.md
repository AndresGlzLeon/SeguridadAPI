# Análisis del Módulo de Salidas — Gestión de Surtidos (Outbound)

> **Archivo analizado:** `organirack-frontend/src/app/pages/GestionSurtidos.tsx`  
> **Fecha:** 10/04/2026

---

## Visión General

La página `GestionSurtidos` actúa como la torre de control de todo el *Outbound* (salida de mercancía) del WMS. Administra las Órdenes de Surtido mediante un tablero de control con gráficas visuales y listados detallados. Además, incorpora un mecanismo de creación rápida de órdenes utilizando un patrón de interfaz de tipo "Carrito de Compras" (Slide-Over Panel), e incluye funcionalidades avanzadas de administración, como la asignación directa a operarios (*Almacenistas*) y la descarga forense de PDF (Vales de Remisión).

---

## Mapa de Datos: Frontend → Endpoint → Backend → DB

| Elemento/Acción | Método del Servicio Frontend | Endpoint | Controlador / Servicio | Tablas Afectadas (Modelos) |
|----------------|------------------------------|---------|------------------------|---------------------------|
| 📊 **Tablero Principal (Órdenes y Catálogos)** | `getOrdenes()`, `getProducts()`, `getAlmacenistas()` | `GET /api/orders` <br> `GET /api/products` <br> `GET /api/users/almacenistas` | `OrderController` → `OrderService::getAllOrders()` y afines | `ordenes_surtido` ⋈ `estados_orden` ⋈ `prioridades_orden` ⋈ `users` |
| 🛒 **Creación Nueva Orden (Carrito)** | `crearOrden(payload)` | `POST /api/orders` | `OrderController` → `OrderService::createOrder()` | `ordenes_surtido` (Inset), `detalle_surtidos` (Genera Partidas) |
| 🧑‍🏭 **Asignación de Operador** | `asignarAlmacenista(id, user_id)` | `PUT /api/orders/{id}/assign` | `OrderController` → `OrderService::assignAlmacenista()` | `ordenes_surtido` (Actualiza FK `almacenista_id` y `estado_id`) |
| 📄 **Descarga Remisión (PDF)** | `downloadPdf(id)` | `GET /api/orders/{id}/pdf` | `OrderController` → Interno | Exportación en Blob binario |

> **Mecanismo de Exportación PDF:** A diferencia de las operaciones habituales que retornan texto estructurado (JSON), en este proceso el servidor compila la información incrustándola en una vista interna de diseño (Blade) y la empaca al vuelo como un archivo binario. El Frontend capta este documento y orquesta una descarga automatizada hacia el sistema operativo del usuario.

---

## Detalle por Sección Principal

---

### 1. 🛒 Creador de Órdenes (Slide-Over Panel)

**¿Qué hace?**  
Permite al supervisor construir una nueva orden de salida acumulando SKUs solicitados, definiendo la prioridad, y estableciendo las fechas requeridas. Usa el patrón UI de *Shopping Cart* para facilitar las capturas masivas sin perder de vista los datos generales de la orden.

**Frontend (`GestionSurtidos.tsx`):**
- El componente `CrearOrdenPanel` intercepta y retiene localmente un estado `carrito` del tipo `DetalleCarrito[]`. 
- No se toca el servidor hasta que el supervisor presiona *"Crear Orden"*. En ese momento, se "empaquetan" todos los SKUs y se envía un `payload` masivo utilizando la interfaz HTTP `CreateOrderPayload`.
- Utiliza limpieza de objetos. El `datetime-local` nativo de HTML5 produce el formato `YYYY-MM-DDTHH:mm`. El front intercepta (`.replace('T', ' ')`) para que Laravel no arroje un 422 HTTP Payload Error con MySQL.

**Backend — Transacción Atómica (`OrderService::createOrder()`):**
La orden nunca se genera de forma parcial. El servicio en el Backend encapsula el INSERT principal y los múltiples INSERTs del carrito dentro de una transacción estricta de Base de Datos:
```php
return DB::transaction(function () use ($data) {
    // 1. Crear el encabezado de Orden
    $orden = OrdenSurtido::create([...]);
    
    // 2. Iterar sobre el payload "Carrito" y crear detalles/partidas
    foreach ($data['detalles'] as $detalle) {
        DetalleSurtido::create([...]);
    }
    
    // Si falla cualquier paso, toda la orden se revierte (Rollback) 
});
```

---

### 2. 📊 Tablero de Supervisión y Gráficas

**¿Qué hace?**  
Da un estatus situacional inmediato para gerencia del almacén, ilustrando estatus urgentes mediante dos gráficas Recharts (PieChart para Estados y BarChart para Prioridades).

**Frontend (`GestionSurtidos.tsx`):**
- A diferencia de `InventarioGlobal.tsx` (que le pide los datos masticados al Backend), el Módulo de Surtidos genera la gráfica usando operaciones en memoria del navegador: 
  ```javascript
  const estadoData = estados.map(est => ({
    name: est.nombre,
    value: ordenes.filter(o => o.estado?.id === est.id).length,
  }));
  ```
- **Catálogos Reactivos:** El Frontend no quema los catálogos en el código. Lee las órdenes que vinieron de la base de datos, extrae los ID únicos de Estado/Prioridad (`estadosMap` y `prioridadesMap`) y los usa como opciones del Select de Filtrado.

---

### 3. 🧑‍🏭 Asignación Dinámica al Operador (Picking)

**¿Qué hace?**  
Envía una orden desde el escritorio del Gerente hasta la terminal celular del montacarguista o auxiliar de bodega.

**Backend — (`OrderService::assignAlmacenista()`):**
- La base de datos es inteligente. Al inyectar el ID del nuevo `almacenista_id`, el Backend evalúa autómaticamente la transición de Estado. 
- Si la Orden estaba durmiendo como `"Pendiente"`, Laravel la migra por debajo del agua a `"En Proceso"` para asegurar la correctitud lógica del Workflow y no tener operadores asignados a órdenes 'dormidas'.

---

### 4. 📄 Motor de Exportación a PDF (Remisión de Surtido)

**¿Qué hace?**  
Permite al supervisor descargar al instante un "Vale de Salida" u Orden Física para impresión, útil para el cumplimiento (*picking* fsico), firmas autorizadas y control de rampa.

**Frontend (`GestionSurtidos.tsx`):**
- **Inyección de Descarga (Phantom Click):** La petición es enviada por Axios (`orderService.downloadPdf()`) exigiendo un `responseType: 'blob'`, lo cual previene que el navegador lea el archivo binario como si fuera de texto provocando carácteres ilegibles. 
- Una vez recibido el código binario (`Blob`), el Frontend necesita engañar al navegador para descargar un archivo que nunca vino de una etiqueta `<a>`.
- Lo hace creando una "URL virtual en RAM" (`window.URL.createObjectURL(pdfBlob)`); luego instancia con JavaScript *puro* un enlace `<a href="...">` invisible con el atributo `download` personalizado (ej: `Remision_ORD-XXX_Fecha.pdf`), lo inyecta al final del Body, dispara un `.click()` automatizado, y finalmente destruye el link y libera la memoria en caché (`revokeObjectURL`).

**Backend (Endopoint `orders/{id}/pdf`):**
- El motor en servidor recibe la petición, extrae los componentes de la orden y compila al vuelo un archivo en Bytes estableciendo un `Content-Type: application/pdf`, saltándose por completo la estructura clásica de respuesta `response()->json()`.

---

## Decisiones de Arquitectura Destacables

| Concepto Técnico | Impacto Arquitectónico |
|------------------|------------------------|
| **Solución N+1 mediante Eager Loading** | La tabla de UI muestra al "Capturista", al "Almacenista" y hasta cuántas partidas tiene la orden y su "Prioridad". Esto cruza 6 tablas distintas de la base de datos (`ordenes_surtido`, `users x2`, `prioridades`, `estados`, `detalles`). Laravel lo resuelve ejecutando `OrdenSurtido::with([...])` generando una consulta maestra hiper-optimizada y blindando la API. |
| **Generación de Folios Backend** | El Frontend `GestionSurtidos.tsx` ignora por completo la creación de los códigos de las Órdenes. Esto se lo deja al método privado `generateFolio()` en Laravel, garantizando que dos máquinas haciendo una orden no colisionen y el contador `ORD-YYYYMMDD-XXXXX` sea perfecto e inmutable en MySQL. |
| **Descarga Binaria de PDFs (Blobs)** | El Frontend en Axios intercepta la respuesta de `downloadPdf` forzando el Response Type como `blob` (Binary Large Object). Esto salva al navegador de intentar *leer* el PDF como si fuera un JSON malformado, posibilitando la inyección nativa al sistema operativo emulando un click fantasma. |
