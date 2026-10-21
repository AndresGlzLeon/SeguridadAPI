# 🏗️ ARQUITECTURA TÉCNICA: PICKING INTELIGENTE

**Documento:** Especificación técnica detallada  
**Fecha:** 29 de Marzo, 2026  
**Status:** 📋 Borrador para Implementación  

---

## 📊 Matriz de Decisión - Ubicación Sugerida

### Algoritmo de Selección (Prioridades)

```
INPUT: producto_id, cantidad_requerida, [pasillo_preferido]

PASO 1: FILTRAR CANDIDATOS
  ├─ WHERE producto_id = X
  ├─ WHERE estado_inventario = "Disponible"
  ├─ WHERE cantidad >= cantidad_requerida
  └─ WITH relaciones: estante.rack.pasillo.almacen.edificio

PASO 2: ORDENAR POR PRIORIDADES (Cascada)
  │
  ├─ PRIMARY: Pasillo preferido (si existe)
  │  └─ ORDER BY (pasillo_id = preferido) DESC
  │
  ├─ SECONDARY: Menos fragmentación (stock más alto)
  │  └─ ORDER BY cantidad DESC
  │
  ├─ TERTIARY: Cercanía (pasillo más bajo ID = más cercano)
  │  └─ ORDER BY pasillo_id ASC
  │
  └─ QUATERNARY: Estante más bajo (nivel)
     └─ ORDER BY nivel ASC

PASO 3: RETORNAR
  └─ first()  ← El mejor candidato
```

### Matriz de Validación en confirmPick()

```
┌─────────────────────────────────────────────────────────────┐
│  VALIDACIÓN DE PICK (confirmPick)                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INPUT: orden_id, producto_id, estante_id, cantidad        │
│                                                             │
│  ┌─ VALIDACIÓN #1: Parámetros
│  │  └─ IF producto_id IS NULL OR estante_id IS NULL
│  │     └─ RETURN ERROR 400: "Parámetros inválidos"
│  │
│  ├─ VALIDACIÓN #2: Inventario existe
│  │  └─ SELECT * FROM inventarios
│  │     WHERE producto_id = ? AND estante_id = ?
│  │     │
│  │     └─ IF NOT FOUND
│  │        └─ RETURN ERROR 400: "Producto no encontrado"
│  │
│  ├─ VALIDACIÓN #3: Stock suficiente
│  │  └─ IF inventario.cantidad < cantidad
│  │     └─ RETURN ERROR 400: "Stock insuficiente"
│  │
│  ├─ VALIDACIÓN #4: Estado válido
│  │  └─ IF estado != "Disponible"
│  │     └─ RETURN ERROR 400: "Inventario no disponible"
│  │
│  ├─ ✅ TODAS VÁLIDAS
│  │  │
│  │  └─ BEGIN TRANSACTION
│  │     │
│  │     ├─ UPDATE inventarios
│  │     │  SET cantidad = cantidad - tomada
│  │     │
│  │     ├─ UPDATE detalles_surtido
│  │     │  SET cantidad_surtida = cantidad_surtida + tomada,
│  │     │      estante_real_id = estante_escaneado,
│  │     │      fue_modificado = (estante_escaneado != estante_sugerido)
│  │     │
│  │     └─ COMMIT
│  │        RETURN SUCCESS + datos
│  │
│  └─ CATCH ERROR
│     └─ ROLLBACK + RETURN ERROR
│
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Diagrama Entidad-Relación Detallado

```
─────────────────────────────────────────────────────────────
                    WAREHOUSE HIERARCHY
─────────────────────────────────────────────────────────────

┌─────────────┐
│  EDIFICIOS  │
├─────────────┤
│ id (PK)     │
│ nombre      │
│ siglas      │
└────────┬────┘
         │ 1:M
         │
    ┌────▼────────────┐
    │    ALMACENES    │
    ├─────────────────┤
    │ id (PK)         │
    │ edificio_id (FK)│
    │ nombre          │
    └────┬────────────┘
         │ 1:M
         │
      ┌──▼───────────┐
      │   PASILLOS   │
      ├──────────────┤
      │ id (PK)      │
      │ almacen_id   │
      │ nombre       │
      └──┬───────────┘
         │ 1:M
         │
      ┌──▼──────────┐
      │    RACKS    │
      ├─────────────┤
      │ id (PK)     │
      │ pasillo_id  │
      │ nombre_rack │
      └──┬──────────┘
         │ 1:M
         │
      ┌──▼───────────────┐
      │   ESTANTES       │
      │ (Shelf/Nivel)    │
      ├───────────────────┤
      │ id (PK)           │
      │ rack_id (FK)      │
      │ nivel             │ ← "1", "2", "3"
      │ codigo_etiqueta   │ ← "A-01-01"
      │ tipo_zona         │ ← "frío", "general"
      │ esta_lleno        │
      └───────┬───────────┘
              │ 1:M
              │
  ┌───────────▼────────────────┐
  │     INVENTARIOS            │
  │  (Nodo de Cantidad)        │
  ├────────────────────────────┤
  │ id (PK)                    │
  │ producto_id (FK) ─────┐    │
  │ estante_id (FK) ──────┤───┐│
  │ estado_id (FK) ────┐  │   ││
  │ cantidad           │  │   ││
  │ created_at         │  │   ││
  │ updated_at         │  │   ││
  │                    │  │   ││
  │ UNIQUE:            │  │   ││
  │ (producto_id,      │  │   ││
  │  estante_id,       │  │   ││
  │  estado_id)        │  │   ││
  └────────────────────┼──┼───┘│
                       │  │    │
        ┌──────────────┘  │    └──────────────┐
        │                 │                    │
        M                 1                    1
  ┌─────▼──────────┐  ┌───▼─────────────┐    ┌┴────────────────┐
  │  PRODUCTOS     │  │ ESTADOS_INV     │    │ DETALLES_SURTIDO│
  ├────────────────┤  ├─────────────────┤    ├─────────────────┤
  │ id (PK)        │  │ id (PK)         │    │ id (PK)         │
  │ nombre         │  │ nombre          │    │ orden_id (FK)   │
  │ sku            │  │ descripcion     │    │ producto_id (FK)│
  │ categoria_id   │  │                 │    │ c_requerida     │
  │ marca_id       │  │ Valores:        │    │ c_surtida       │
  │ unidad_medida  │  │ ├─ "Disponible" │    │ est_suger (FK)  │
  │ ...            │  │ ├─ "Dañado"     │    │ est_real (FK)   │
  └────────────────┘  │ ├─ "Cuarentena" │    │ fue_modificado  │
                      │ └─ "Merma"      │    └─────────────────┘
                      └─────────────────┘            │ 1:M
                                                     │
                            ┌────────────────────────┘
                            │
            ┌───────────────┤
            │               │
            M               1
 ┌──────────▼──────────┐    └─────◄─ ORDENES_SURTIDO (relaciones)
 │  ORDENES_SURTIDO   │
 ├────────────────────┤
 │ id (PK)            │
 │ folio (UNIQUE)     │ ← "ORD-20260329-00001"
 │ capturista_id (FK) │ ← Usuario que creó
 │ almacenista_id(FK) │ ← Usuario que pickea (NULLABLE)
 │ referencia_destino │
 │ estado_id (FK)     │ ← Pendiente, En Proceso, Completa
 │ prioridad_id (FK)  │
 │ fecha_requerida    │
 │ created_at         │
 │ updated_at         │
 └────────────────────┘
         ▲
         │ 1:1
         │
    ┌────┴──────────────┐
    │  ESTADOS_ORDEN    │
    ├───────────────────┤
    │ id (PK)           │
    │ nombre (UNIQUE)   │
    │  ├─ "Pendiente"   │
    │  ├─ "En Proceso"  │
    │  ├─ "Completa"    │
    │  └─ "Cancelada"   │
    │ color_hex         │
    └───────────────────┘
```

---

## ⚙️ Flujo de Confirmación de Pick (Detallado)

```
┌──────────────────────────────────────────────────────────────────────┐
│  POST /api/mobile/picking/{ordenId}/confirmar                       │
│  MobilePickingController::confirmPick()                             │
└──────────────────────────────────────────────────────────────────────┘

REQUEST BODY:
{
  "producto_id": 5,
  "estante_id_escaneado": 1,
  "cantidad_tomada": 8
}

┌─ STEP 1: VALIDACIÓN INICIAL
│  ├─ $productoId = 5
│  ├─ $estanteId = 1
│  ├─ $cantidad = 8
│  └─ Assert: Todos > 0 y no NULL
│     └─ IF falso → Exception(400)
│
├─ STEP 2: VALIDACIÓN INVENTARIO (READ)
│  │
│  └─ $inventario = Inventario::where([
│     ['producto_id', '=', 5],
│     ['estante_id', '=', 1],
│     ])->first()
│
│  Query ejecuta: ~1-2ms (índice compuesto)
│
│  ├─ IF NO EXISTE
│  │  └─ Exception(400): "Producto no encontrado"
│  │
│  └─ IF EXISTE
│     ├─ cantidad_actual = 10
│     └─ Continue...
│
├─ STEP 3: VALIDACIÓN STOCK (READ)
│  │
│  └─ IF $inventario->cantidad (10) < $cantidad (8)
│     └─ Exception(400): "Stock insuficiente"
│  │
│  └─ ELSE ✅
│
├─ STEP 4: TRANSACCIÓN DB
│  │
│  ├─ BEGIN TRANSACTION (SERIALIZABLE isolation)
│  │
│  ├─ WRITE #1: UPDATE Inventario
│  │  └─ UPDATE inventarios
│  │     SET cantidad = 10 - 8 = 2,
│  │         updated_at = NOW()
│  │     WHERE id = {inventario.id}
│  │     │
│  │     ├─ Filas afectadas: 1
│  │     └─ Tiempo: ~2-3ms
│  │
│  ├─ WRITE #2: UPDATE DetalleSurtido
│  │  └─ UPDATE detalles_surtido
│  │     SET cantidad_surtida = 0 + 8 = 8,
│  │         estante_real_id = 1,
│  │         fue_modificado = (1 != 1) = FALSE,  ← Sin override
│  │         updated_at = NOW()
│  │     WHERE orden_surtido_id = 1 AND producto_id = 5
│  │     │
│  │     ├─ Filas afectadas: 1
│  │     └─ Tiempo: ~1-2ms
│  │
│  ├─ WRITE #3: LOGGING (Auditoría)
│  │  └─ INSERT INTO audit_logs (...)  [OPCIONAL]
│  │     └─ Registrar: Quién, Cuándo, Qué
│  │
│  └─ COMMIT TRANSACTION
│     └─ Tiempo total transacción: ~5-8ms
│
├─ STEP 5: REFRESH de datos
│  │
│  └─ $detalleActualizado = DetalleSurtido::find($id)->load([
│     'producto',
│     'estanteSugerido',
│     'estanteReal',
│     'ordenSurtido'
│     ])
│
├─ STEP 6: RESPUESTA AL CLIENTE
│  │
│  └─ return response()->json([
│     'success' => true,
│     'message' => 'Pick confirmado exitosamente',
│     'data' => [
│         'orden_id' => 1,
│         'producto_id' => 5,
│         'estante_id_escaneado' => 1,
│         'cantidad_tomada' => 8,
│         'inventario_anterior' => 10,
│         'inventario_nuevo' => 2,
│     ]
│     ], 200);
│
└─ TOTAL LATENCY: ~10-15ms ✅
```

---

## 🎯 Override Flow (Detallado)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ESCENARIO: Almacenista no encuentra producto en ubicación sugerida  │
└──────────────────────────────────────────────────────────────────────┘

MOBILE SCREEN:
1️⃣ Escanea código: "A-01-01" (sugerida)
   └─ Sistema no encuentra inventario

2️⃣ App muestra:
   ┌────────────────────────────┐
   │ ⚠️ UBICACIÓN INVÁLIDA       │
   │                            │
   │ Producto no encontrado en  │
   │ la ubicación escaneada     │
   │                            │
   │ [ Reintentar ] [ Override] │
   └────────────────────────────┘

3️⃣ Usuario toca [Override]
   └─ Navega a overrideScreen con:
      {
        detalleId: 1,
        orderId: 1,
        productoId: 5,
        cantidadRequerida: 8,
        estanteSugeridoId: 1,
        codeSugerido: "A-01-01"
      }

4️⃣ En overrideScreen:
   ┌─────────────────────────────────┐
   │ Información del Producto        │
   ├─────────────────────────────────┤
   │ Nombre: Pieza Fundamental XY2  │
   │ SKU: BRG-8822X                 │
   │ Ubicación Sugerida: A-01-01    │
   │ Cantidad: 8                    │
   │                                 │
   ├─────────────────────────────────┤
   │ [ESCANEAR UBICACIÓN] ← Cámara  │
   │ [INGRESO MANUAL] ← Teclado     │
   └─────────────────────────────────┘

5️⃣ Usuario escanea: "B-02-03"
   O ingresa: Rack "B", Nivel "02"

6️⃣ App hace:
   POST /api/picking/confirm-override
   {
     "detalle_id": 1,
     "estante_id_real": 5,        ← Nueva ubicación
     "cantidad_a_surtir": 8
   }

7️⃣ Backend: PickingService::confirmPick()
   │
   ├─ VALIDACIÓN: ¿Estante 5 tiene producto 5 con stock 8?
   │  └─ SELECT * FROM inventarios
   │     WHERE producto_id = 5 AND estante_id = 5
   │     └─ FOUND: cantidad = 15 ✅
   │
   ├─ VALIDACIÓN: ¿Stock suficiente (15 >= 8)?
   │  └─ SÍ ✅
   │
   ├─ TRANSACCIÓN:
   │  │
   │  ├─ UPDATE inventarios
   │  │  SET cantidad = 15 - 8 = 7
   │  │  WHERE producto_id = 5 AND estante_id = 5  ← REAL, no sugerida
   │  │
   │  ├─ UPDATE detalles_surtido
   │  │  SET cantidad_surtida = 0 + 8 = 8,
   │  │      estante_sugerido_id = 1,      ← Se mantiene original
   │  │      estante_real_id = 5,          ← NUEVO: OVERRIDE
   │  │      fue_modificado = TRUE,        ← 🔑 AUDITORÍA
   │  │      updated_at = NOW()
   │  │
   │  └─ COMMIT ✅
   │
   └─ RESPONSE:
      {
        success: true,
        message: "Override confirmado exitosamente",
        data: {
          orden_id: 1,
          producto_id: 5,
          estante_sugerido_id: 1,      ← Original
          estante_real_id: 5,          ← Override
          fue_modificado: true,        ← Flag
          cantidad_tomada: 8,
          inventario_anterior_real: 15,
          inventario_nuevo_real: 7
        }
      }

8️⃣ Mobile recibe y continúa con siguiente producto
```

---

## 📦 Tabla de Estados (Estados_Orden)

```sql
-- Valores iniciales
INSERT INTO estados_orden (nombre, color_hex, created_at) VALUES
('Pendiente',    '#FFA500', NOW()),     -- ID: 1 (Orange)
('En Proceso',   '#0066CC', NOW()),     -- ID: 2 (Blue)
('Completada',   '#00AA00', NOW()),     -- ID: 3 (Green)
('Cancelada',    '#FF0000', NOW());     -- ID: 4 (Red)

-- Flujo de transiciones permitidas:
Pendiente   ──► En Proceso  ──► Completada
    │                           ▲
    │                           │
    └──→ Cancelada ─────────────┘

-- ESTADOS_INVENTARIO
INSERT INTO estados_inventario (nombre, descripcion, created_at) VALUES
('Disponible',   'Listo para picking',                NOW()),  -- ID: 1
('Dañado',       'No apto para venta',                 NOW()),  -- ID: 2
('Cuarentena',   'En validación de calidad',          NOW()),  -- ID: 3
('Merma',        'Pérdida/Robo documentado',          NOW());   -- ID: 4
```

---

## 🔐 Índices Recomendados

```sql
-- CRÍTICO: Búsqueda rápida de inventario
ALTER TABLE inventarios ADD INDEX idx_prod_estante_estado 
  (producto_id, estante_id, estado_id);

-- CRÍTICO: Búsqueda de órdenes por almacenista
ALTER TABLE ordenes_surtido ADD INDEX idx_almacenista_estado 
  (almacenista_id, estado_id, created_at DESC);

-- Performance: Búsqueda de detalles por producto
ALTER TABLE detalles_surtido ADD INDEX idx_orden_producto 
  (orden_surtido_id, producto_id);

-- Performance: Auditoría de overrides
ALTER TABLE detalles_surtido ADD INDEX idx_fue_modificado 
  (fue_modificado, updated_at DESC);

-- Performance: Jerarquía warehouse
ALTER TABLE estantes ADD INDEX idx_rack_nivel 
  (rack_id, nivel);

ALTER TABLE racks ADD INDEX idx_pasillo_nombre 
  (pasillo_id, nombre_rack);
```

---

## 💾 Queries Críticas y Su Performance

### Query 1: Obtener ubicaciones sugeridas (getSuggestedPickingList)

```sql
-- ⚡ OPTIMIZADA
SELECT 
  inv.estante_id,
  est.codigo_etiqueta,
  inv.cantidad,
  ei.nombre as estado
FROM inventarios inv
INNER JOIN estantes est ON inv.estante_id = est.id
INNER JOIN racks r ON est.rack_id = r.id
INNER JOIN pasillos p ON r.pasillo_id = p.id
INNER JOIN estados_inventario ei ON inv.estado_id = ei.id
WHERE inv.producto_id = ?
  AND inv.cantidad > 0
  AND ei.nombre = 'Disponible'
ORDER BY inv.cantidad DESC
LIMIT 10;

-- EXPECTED PERFORMANCE: ~5-10ms (con índice)
-- ÍNDICES: (producto_id, estado_id, cantidad DESC)
```

### Query 2: Validar disponibilidad en scoring

```sql
-- ⚡ OPTIMIZADA (confirmPick)
SELECT inv.cantidad
FROM inventarios inv
WHERE inv.producto_id = ?
  AND inv.estante_id = ?
FOR UPDATE;  -- Row lock, prevenir race conditions

-- EXPECTED PERFORMANCE: ~1-2ms (direct lookup)
-- ÍNDICES: PRIMARY KEY + (producto_id, estante_id)
```

### Query 3: Buscar detalle de orden para update

```sql
-- ⚡ OPTIMIZADA
SELECT ds.* FROM detalles_surtido ds
WHERE ds.orden_surtido_id = ?
  AND ds.producto_id = ?;

-- EXPECTED PERFORMANCE: ~1ms (index lookup)
-- ÍNDICES: (orden_surtido_id, producto_id)
```

---

## 🛡️ Prevención de Race Conditions

### Problema: Dos almacenistas pickean simultáneamente

```
TIMELINE:
────────────────────────────────────────────

T0: Almacenista A lee inventario = 10
T1: Almacenista B lee inventario = 10
T2: Almacenista A confirma -8 → 2
T3: Almacenista B confirma -8 → 2
T4: BD tiene 2 unidades (ERROR: debería ser -6)

SOLUCIÓN: Pessimistic Locking
```

### Implementación

```php
// PickingService::confirmPick()
return DB::transaction(function () use (...) {
    // 🔐 LOCK ROW para este inventario
    $inventario = Inventario::where(...)
        ->lockForUpdate()      // ← SELECT ... FOR UPDATE
        ->first();

    // Ahora solo este thread puede leer/escribir
    // Otros threads ESPERAN aquí

    if ($inventario->cantidad < $cantidadTomada) {
        throw new Exception("Stock insuficiente", 400);
    }

    // Descontar
    $inventario->decrement('cantidad', $cantidadTomada);

    // COMMIT = liberar lock
    return ['success' => true];
});

// GARANTÍA: ACID + Serializable
```

---

## 📊 Matriz de Casos de Uso

```
┌────────────────────────┬──────────┬───────────┬──────────────┐
│ Caso de Uso            │ Actor    │ Endpoint  │ Status       │
├────────────────────────┼──────────┼───────────┼──────────────┤
│ Crear orden            │ Web      │ POST /... │ ✅ Actual    │
│ Asignar almacenista    │ Web      │ POST /... │ ✅ Actual    │
│ Obtener órdenes móvil  │ Móvil    │ GET /...  │ ✅ Actual    │
│ Obtener sugerencias    │ Móvil    │ GET /...  │ ✅ Actual    │
│ Validar ubicación      │ Móvil    │ POST /... │ 🆕 NUEVO     │
│ Confirmar pick         │ Móvil    │ POST /... │ ✅ Actual    │
│ Confirmar override     │ Móvil    │ POST /... │ 🆕 NUEVO     │
│ Reportes overrides     │ Web      │ GET /...  │ 🆕 NUEVO     │
│ Auditoría picking      │ Admin    │ GET /...  │ 🆕 NUEVO     │
└────────────────────────┴──────────┴───────────┴──────────────┘
```

---

## 🔄 Lifecycle de un Picking Completo

```
ESTADO INICIAL:
  orden_surtido.estado_id = 1 (Pendiente)
  detalles_surtido[0].cantidad_surtida = 0
  detalles_surtido[0].estante_real_id = NULL
  detalles_surtido[0].fue_modificado = FALSE
  inventarios.cantidad = 10

PICKING CONFIRMAR SIN OVERRIDE:
  detalle.cantidad_surtida = 0 + 8 = 8 ✅
  detalle.estante_real_id = 1 (sugerida)
  detalle.fue_modificado = FALSE
  inventarios.cantidad = 10 - 8 = 2
  
PICKING CONFIRMAR CON OVERRIDE:
  detalle.cantidad_surtida = 0 + 8 = 8 ✅
  detalle.estante_real_id = 5 (diferente sugerida)
  detalle.fue_modificado = TRUE ⚠️
  inventarios{estante:5}.cantidad = 15 - 8 = 7

LÓGICA AUDITORÍA:
  if (fue_modificado = TRUE) {
    log: "Almacenista: $user, Producto: $prod"
    log: "Sugerida: $est_original, Real: $est_real"
    log: "Motivo: Ubicación incorrecta (manual)"
  }

COMPLETACIÓN DE ORDEN:
  IF SUM(cantidad_surtida) >= SUM(cantidad_requerida)
    estado = 3 (Completada)
    UPDATE orden_surtido SET estado_id = 3
```

---

## 📈 Performance Targets

```
┌──────────────────────┬──────────┬──────────┬─────────┐
│ Operación            │ Current  │ Target   │ SLA %   │
├──────────────────────┼──────────┼──────────┼─────────┤
│ GET órdenes móvil    │ ~50ms    │ <100ms   │ 95%     │
│ GET sugerencias      │ ~30ms    │ <50ms    │ 95%     │
│ POST validación      │ ~5ms     │ <15ms    │ 99%     │
│ POST confirmar pick  │ ~10ms    │ <20ms    │ 99%     │
│ POST override        │ ~10ms    │ <20ms    │ 99%     │
│ UPDATE inventario    │ ~2ms     │ <5ms     │ 100%    │
│ Transaction commit   │ ~5ms     │ <10ms    │ 100%    │
└──────────────────────┴──────────┴──────────┴─────────┘
```

---

## 🧪 Test Coverage Recomendado

```
PICKING SERVICE
├─ calculateSuggestedLocation()
│  ├─ Test: Stock disponible
│  ├─ Test: Sin stock disponible
│  ├─ Test: Estado no disponible (dañado)
│  └─ Test: Pasillo preferido
│
├─ getSuggestedPickingList()
│  ├─ Test: Orden con 1 detalle
│  ├─ Test: Orden con múltiples detalles
│  ├─ Test: Sin ubicaciones disponibles
│  └─ Test: Relaciones cargadas correctamente
│
└─ confirmPick()
   ├─ Test: Pick sin override (ruta feliz)
   ├─ Test: Pick con override
   ├─ Test: Stock insuficiente
   ├─ Test: Producto no en ubicación
   ├─ Test: Concurrencia (2 almacenistas)
   ├─ Test: Race condition prevention
   ├─ Test: Transacción rollback
   └─ Test: ACID compliance

INTEGRATION TESTS
├─ Flujo completo: Crear → Asignar → Pickar
├─ Flujo override: Sugerida fallida → Alternative
├─ Flujo cancelación
└─ Flujo múltiples órdenes paralelas

PERFORMANCE TESTS
├─ 1000 órdenes/día
├─ 10 almacenistas simultáneos
├─ Queries bajo carga
└─ Memory leaks en loops
```

---

## 🚀 Deployment Checklist

- [ ] Migrations ejecutadas correctamente
- [ ] Índices creados y verificados
- [ ] Seeds ejecutados (estados, etc)
- [ ] Logs configurados para auditoría
- [ ] Backup pre-deploy
- [ ] Tests pasando 100%
- [ ] Performance tests < SLA
- [ ] Documentación actualizada
- [ ] Usuarios capacitados
- [ ] Rollback plan preparado
- [ ] Monitoring activo
- [ ] Alertas configuradas

---

**Autor:** Análisis Técnico  
**Fecha:** 29 Mar 2026  
**Version:** 1.0
