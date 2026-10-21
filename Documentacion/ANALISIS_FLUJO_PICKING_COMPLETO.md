# 📊 ANÁLISIS COMPLETO: FLUJO DE PICKING MOBIL ↔ WEB

**Fecha:** 29 de Marzo, 2026  
**Versión:** 1.0 - Análisis Arquitectónico  
**Alcance:** Picking inteligente con validación dinámica de ubicaciones y override  

---

## 📑 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Flujo Actual de Picking](#flujo-actual-de-picking)
3. [Estructura de Base de Datos](#estructura-de-base-de-datos)
4. [Análisis de Puntos de Integración](#análisis-de-puntos-de-integración)
5. [Propuesta de Solución: Sistema Completo](#propuesta-de-solución)
6. [Diagramas de Flujo](#diagramas-de-flujo)
7. [Recomendaciones y Mejoras](#recomendaciones-y-mejoras)

---

## 🎯 Resumen Ejecutivo

El sistema OrganiRack actualmente opera en **DOS CAPAS**:

| Aspecto | Estado Actual | Problema |
|--------|--------------|----------|
| **Ubicación Sugerida** | Se asigna por defecto (1er estante disponible) | ❌ No es inteligente |
| **Picking Móvil** | Parcialmente implementado (UI + lógica básica) | ⚠️ Falta integración completa |
| **Override** | Existe en BD (`estante_real_id`) | ⚠️ No implementado en móvil |
| **Validación Inventario** | Existe en backend | ✅ Funcional |
| **Actualización Nodo** | Por ubicación real | ✅ Funcional |

### 🔴 Brecha Detectada

El sistema tiene **la infraestructura completa** pero le faltan:
- ✗ Cálculo inteligente de ubicación sugerida
- ✗ Picking móvil completamente integrado
- ✗ UI para override en móvil
- ✗ Validación en tiempo real de disponibilidad

---

## 🔄 Flujo Actual de Picking

### **FASE 1: CREACIÓN DE ORDEN (WEB - GestionSurtidos.tsx)**

```
┌─────────────────────────────────────────┐
│  1. CAPTURISTA CREA ORDEN EN WEB        │
└─────────────────────────────────────────┘
        │
        ├─ Selecciona Prioridad
        ├─ Agrega Productos + Cantidades (carrito)
        ├─ Especifica fecha requerida
        └─ Envía: CreateOrderPayload
            {
              prioridad_id: 1,
              referencia_destino: "Almacén A",
              fecha_requerida: "2026-03-29 14:30",
              detalles: [
                { producto_id: 5, cantidad_requerida: 8 },
                { producto_id: 12, cantidad_requerida: 3 }
              ]
            }
        │
        ↓
┌─────────────────────────────────────────┐
│  2. BACKEND: OrderService.createOrder() │
└─────────────────────────────────────────┘
        │
        ├─ Crea OrdenSurtido ✅
        │     └─ Genera folio (ORD-20260329-00001)
        │     └─ capturista_id = usuario autenticado
        │     └─ estado_id = Pendiente (ID = 1)
        │
        ├─ Crea DetalleSurtido por cada producto ⚠️
        │     └─ estante_sugerido_id = HARDCODED (Estante::first())
        │     └─ No hay inteligencia distributiva
        │     └─ estante_real_id = NULL
        │     └─ fue_modificado = FALSE
        │
        └─ Retorna orden con relaciones
            {
              id: 1,
              folio: "ORD-20260329-00001",
              estado_id: 1,
              prioridad_id: 1,
              capturista_id: 1,
              almacenista_id: null,
              referencia_destino: "Almacén A",
              fecha_requerida: "2026-03-29 14:30:00",
              detalles: [
                {
                  id: 1,
                  producto_id: 5,
                  cantidad_requerida: 8,
                  cantidad_surtida: 0,
                  estante_sugerido_id: 1,  ← 🔴 SIEMPRE ES EL MISMO
                  estante_real_id: null,
                  fue_modificado: false
                }
              ]
            }
```

### **FASE 2: ASIGNACIÓN A ALMACENISTA (WEB - Modal)**

```
┌─────────────────────────────────────────┐
│  3. OPERARIO WEB ASIGNA ALMACENISTA     │
└─────────────────────────────────────────┘
        │
        ├─ Selecciona almacenista de dropdown
        ├─ Llama: orderService.asignarAlmacenista(ordenId, almacenistaId)
        │
        ↓
┌──────────────────────────────────────────┐
│  4. BACKEND: OrderService.assignAlmacenista() │
└──────────────────────────────────────────┘
        │
        ├─ Actualiza: almacenista_id = ID del usuario
        ├─ Cambia estado: Pendiente → En Proceso
        └─ Retorna orden actualizada

        ✅ AHORA LA ORDEN ESTÁ ASIGNADA Y LISTA PARA PICKING
```

### **FASE 3: PICKING MÓVIL (APP - scannerScreen.tsx)**

```
┌─────────────────────────────────────────┐
│  5. ALMACENISTA ABRE APP MÓVIL          │
└─────────────────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────┐
│  GET /api/mobile/picking/orders         │
│  (MobilePickingController.getOrders())   │
└──────────────────────────────────────────┘
        │
        ├─ Obtiene todas las órdenes donde almacenista_id = auth()->id()
        ├─ Carga relaciones:
        │     ├─ estado
        │     ├─ prioridad
        │     ├─ capturista
        │     ├─ almacenista
        │     ├─ detalles.producto
        │     └─ detalles.estanteSugerido
        │
        └─ Retorna JSON con lista de órdenes
            {
              message: "Órdenes obtenidas correctamente",
              data: [
                {
                  id: 1,
                  folio: "ORD-20260329-00001",
                  estado: { id: 2, nombre: "En Proceso" },
                  prioridad: { id: 1, nombre: "Urgente" },
                  detalles: [
                    {
                      id: 1,
                      producto_id: 5,
                      producto: { id: 5, nombre: "Pieza XY2" },
                      cantidad_requerida: 8,
                      cantidad_surtida: 0,
                      estanteSugerido: { 
                        id: 1,
                        codigo_etiqueta: "A-01-01"
                      }
                    }
                  ]
                }
              ]
            }
        │
        ↓
┌──────────────────────────────────────────┐
│  6. ALMACENISTA SELECCIONA ORDEN        │
│  (scannerScreen.tsx - UI)                │
└──────────────────────────────────────────┘
        │
        ├─ Ve listado de órdenes asignadas
        ├─ Toca orden específica
        ├─ Navega a scanner screen con { orderId }
        │
        ↓
┌──────────────────────────────────────────┐
│  GET /api/mobile/picking/{ordenId}/sugerencias │
│  (MobilePickingController.getSuggestions()) │
└──────────────────────────────────────────┘
        │
        ├─ Llama: PickingService.getSuggestedPickingList(ordenId)
        │
        └─ LÓGICA: Por CADA detalle de la orden
              ├─ Buscar TODOS los estantes con el producto
              ├─ Stock > 0
              ├─ Agregar ubicaciones_sugeridas[]
              │
              └─ Retorna:
                {
                  message: "Lista de picking sugerida obtenida",
                  data: {
                    id: 1,
                    folio: "ORD-20260329-00001",
                    detalles: [
                      {
                        id: 1,
                        producto: { id: 5, nombre: "Pieza XY2" },
                        cantidad_requerida: 8,
                        ubicaciones_sugeridas: [
                          {
                            estante_id: 1,
                            estante_codigo: "A-01-01",
                            cantidad_disponible: 10,
                            estado: "Disponible"
                          },
                          {
                            estante_id: 5,
                            estante_codigo: "B-02-03",
                            cantidad_disponible: 15,
                            estado: "Disponible"
                          }
                        ]
                      }
                    ]
                  }
                }
```

### **FASE 4: CONFIRMACIÓN DE PICK MÓVIL (APP)**

#### Escenario A: SIN OVERRIDE (ubicación sugerida es correcta)

```
┌─────────────────────────────────────────┐
│  7. ALMACENISTA ESCANEA UBICACIÓN       │
│     (scannerScreen - escaneo código)    │
└─────────────────────────────────────────┘
        │
        ├─ Abre cámara
        ├─ Escanea código de barras de estante: "A-01-01"
        └─ Sistema resuelve: estante_id = 1
        │
        ↓
┌──────────────────────────────────────────┐
│  POST /api/mobile/picking/{ordenId}/confirmar │
│  (MobilePickingController.confirmPick()) │
└──────────────────────────────────────────┘
        │
        ├─ Payload:
        │  {
        │    producto_id: 5,
        │    estante_id_escaneado: 1,      ← Ubicación física confirmada
        │    cantidad_tomada: 8
        │  }
        │
        ↓
┌──────────────────────────────────────────┐
│  PickingService.confirmPick()            │
│  VALIDACIONES CRÍTICAS:                  │
└──────────────────────────────────────────┘
        │
        ├─ 1️⃣ VALIDACIÓN: ¿Producto existe en ubicación escaneada?
        │     └─ SELECT * FROM inventarios 
        │          WHERE producto_id = 5 
        │          AND estante_id = 1
        │          └─ SI NO EXISTE: ❌ EXCEPTION (HTTP 400)
        │
        ├─ 2️⃣ VALIDACIÓN: ¿Stock suficiente?
        │     └─ IF inventario.cantidad (10) < cantidad_tomada (8)
        │          └─ SI: ❌ EXCEPTION (HTTP 400)
        │     └─ EN ESTE CASO: 10 >= 8 ✅ VÁLIDO
        │
        ├─ 3️⃣ TRANSACCIÓN DB:
        │     │
        │     ├─ A. Descuenta inventario
        │     │  UPDATE inventarios
        │     │  SET cantidad = 10 - 8 = 2
        │     │  WHERE producto_id = 5 AND estante_id = 1
        │     │
        │     ├─ B. Actualiza DetalleSurtido
        │     │  UPDATE detalles_surtido
        │     │  SET cantidad_surtida = 0 + 8 = 8,
        │     │      estante_real_id = 1,     ← 🔑 UBICACIÓN REAL CONFIRMADA
        │     │      fue_modificado = FALSE   ← No fue override (fue sugerida)
        │     │  WHERE orden_surtido_id = 1 AND producto_id = 5
        │     │
        │     └─ COMMIT ✅
        │
        └─ Retorna:
            {
              success: true,
              message: "Pick confirmado exitosamente",
              data: {
                orden_id: 1,
                producto_id: 5,
                estante_id_escaneado: 1,
                cantidad_tomada: 8,
                inventario_anterior: 10,
                inventario_nuevo: 2
              }
            }
```

#### Escenario B: CON OVERRIDE (ubicación sugerida incorrecta)

```
┌─────────────────────────────────────────┐
│  7B. ALMACENISTA DESCUBRE PROBLEMA      │
│     (scannerScreen.tsx)                 │
└─────────────────────────────────────────┘
        │
        ├─ Vuelve a ubicación sugerida: A-01-01
        ├─ Pero NO ENCUENTRA el producto o hay otra cantidad
        ├─ Toca: "¿Problemas con la ubicación?"
        ├─ Navega a: overrideScreen con { orderId }
        │
        ↓
┌──────────────────────────────────────────┐
│  overrideScreen.tsx (OVERRIDE UI)       │
│  Modo: Confirmación Manual               │
└──────────────────────────────────────────┘
        │
        ├─ Muestra información actual:
        │  ├─ Producto: "Pieza Fundamental XY2"
        │  ├─ SKU: "BRG-8822X"
        │  ├─ Ubicación SUGERIDA: "A-12 / Nivel 3"
        │  ├─ Cantidad REQUERIDA: 8
        │
        ├─ Opciones del almacenista:
        │  ├─ [ESCANEAR UBICACIÓN] → Abre cámara para nuevo código
        │  └─ [INICIAR OVERRIDE] → Ingreso manual
        │
        └─ En este caso: Escaneó "B-02-03"
            │
            ↓
        ┌────────────────────────────────────┐
        │ POST /api/mobile/picking/override  │
        │ (Para confirmar nueva ubicación)   │
        └────────────────────────────────────┘
               │
               ├─ Payload:
               │  {
               │    producto_id: 5,
               │    orden_id: 1,
               │    estante_id_escaneado: 5,  ← ⚠️ DIFERENTE DE SUGERIDO (1)
               │    cantidad_tomada: 8
               │  }
               │
               ↓
        ┌────────────────────────────────────────────────┐
        │ BACKEND: PickingService.confirmPick()         │
        │ (misma lógica, pero ubicación distinta)       │
        └────────────────────────────────────────────────┘
               │
               ├─ 1️⃣ VALIDACIÓN: ¿Producto en B-02-03?
               │    └─ SELECT * FROM inventarios
               │         WHERE producto_id = 5 AND estante_id = 5
               │    └─ SI EXISTE (cantidad 15) ✅
               │
               ├─ 2️⃣ VALIDACIÓN: ¿Stock suficiente (15 >= 8)?
               │    └─ SI ✅
               │
               ├─ 3️⃣ TRANSACCIÓN:
               │    │
               │    ├─ A. Descuenta de UBICACIÓN REAL (no sugerida)
               │    │   UPDATE inventarios
               │    │   SET cantidad = 15 - 8 = 7
               │    │   WHERE producto_id = 5 AND estante_id = 5
               │    │
               │    ├─ B. Actualiza DetailSurtido
               │    │   UPDATE detalles_surtido
               │    │   SET cantidad_surtida = 0 + 8 = 8,
               │    │       estante_sugerido_id = 1,   ← Se mantiene original
               │    │       estante_real_id = 5,        ← 🔑 NUEVA ubicación real
               │    │       fue_modificado = TRUE       ← ⚠️ OVERRIDE FLAG
               │    │   WHERE orden_surtido_id = 1 AND producto_id = 5
               │    │
               │    └─ COMMIT ✅
               │
               └─ Retorna:
                {
                  success: true,
                  message: "Pick confirmado exitosamente (Override)",
                  data: {
                    orden_id: 1,
                    producto_id: 5,
                    estante_id_escaneado: 5,      ← OVERRIDE
                    cantidad_tomada: 8,
                    inventario_anterior: 15,      ← Del estante REAL
                    inventario_nuevo: 7
                  }
                }
```

### **FASE 5: VISUALIZACIÓN WEB (GestionSurtidos.tsx)**

```
┌─────────────────────────────────────────┐
│  8. OPERARIO WEB MONITOREA PROGRESO     │
└─────────────────────────────────────────┘
        │
        ├─ Tabla muestra estados en TIEMPO REAL:
        │
        │  Folio           │ Estado      │ Almacenista │ Surtida │ Requerida │ Progreso
        │  ─────────────────┴─────────────┴─────────────┴─────────┴───────────┴──────────
        │  ORD-2603-00001   │ En Proceso  │ Pedro       │ 8       │ 8         │ 100% ✅
        │  ORD-2603-00002   │ En Proceso  │ María       │ 5       │ 12        │ 41%  🔄
        │  ORD-2603-00003   │ Pendiente   │ ─           │ 0       │ 15        │ 0%   ⏳
        │
        └─ Al completar orden en móvil se refleja INMEDIATAMENTE
            (si frontend hace polling o websocket)
```

---

## 🗄️ Estructura de Base de Datos

### **1. JERARQUÍA WAREHOUSE (Almacén Físico)**

```sql
-- Nivel 0: CONTENEDOR
edificios
├── id (PK)
├── nombre: "Almacén Central"
├── siglas: "AC"
└── created_at

-- Nivel 1: SECCIÓN POR EDIFICIO
almacenes (belongs_to: edificios)
├── id (PK)
├── edificio_id (FK)
├── nombre: "Almacén General"
├── siglas: "AG"
└── created_at

-- Nivel 2: SECCIÓN LINEAL
pasillos (belongs_to: almacenes)
├── id (PK)
├── almacen_id (FK)
├── nombre: "Pasillo A"
└── created_at

-- Nivel 3: ESTRUCTURA VERTICAL
racks (belongs_to: pasillos)
├── id (PK)
├── pasillo_id (FK)
├── nombre_rack: "Rack-01"
└── created_at

-- Nivel 4: NODO FINAL (El "punto" donde existe el picking)
estantes (belongs_to: racks)
├── id (PK)
├── rack_id (FK)
├── nivel: "1" / "2" / "3"
├── codigo_etiqueta: "A-01-01"  ← Escaneado en picking
├── tipo_zona: "refrigerado" / "general" / "peligroso"
├── esta_lleno: boolean
└── created_at

EJEMPLO DE PATH COMPLETO:
Edificios[1] → Almacenes[1] → Pasillos[1] → Racks[1] → Estantes[1]
    "AC"              "AG"           "A"         "Rack-01"    "Nivel 1" (A-01-01)
```

### **2. TABLA INVENTARIOS (El "nodo" de cantidad)**

```sql
inventarios
├── id (PK)
├── producto_id (FK → productos)
├── estante_id (FK → estantes)
│   ↑
│   └─ 🔑 CLAVE: La cantidad está ASOCIADA A UN ESTANTE ESPECÍFICO
│
├── estado_id (FK → estados_inventario)
│   │   Estados posibles:
│   ├─ "Disponible"
│   ├─ "Dañado"
│   ├─ "En Cuarentena"
│   └─ "Merma"
│
├── cantidad: 10.00
│
└── unique(producto_id, estante_id, estado_id)
    └─ Permite: 8 laptops "Disponibles" + 2 "Dañadas" en MISMO estante

EJEMPLO:
┌─────────────┬─────────────┬────────────┬──────────┐
│ producto_id │ estante_id  │ estado_id  │ cantidad │
├─────────────┼─────────────┼────────────┼──────────┤
│ 5 (Pieza)   │ 1 (A-01-01) │ 1 (Disp)   │ 10       │  ← Disponible
│ 5 (Pieza)   │ 1 (A-01-01) │ 2 (Daño)   │ 2        │  ← Dañada
│ 5 (Pieza)   │ 5 (B-02-03) │ 1 (Disp)   │ 15       │  ← Otra ubicación
│ 12 (Otra)   │ 1 (A-01-01) │ 1 (Disp)   │ 50       │  ← Otro producto
└─────────────┴─────────────┴────────────┴──────────┘
```

### **3. TABLAS DE ÓRDENES (La "transacción" de picking)**

```sql
-- CABECERA DE ORDEN
ordenes_surtido
├── id (PK)
├── folio: "ORD-20260329-00001"
├── capturista_id (FK → users)     ← Quién creó la orden
├── almacenista_id (FK → users)    ← Quién pockea (NULL hasta asignar)
├── referencia_destino: "Almacén A" ← Metadata
├── estado_id (FK → estados_orden)
│   ├─ "Pendiente" (creada, no asignada)
│   ├─ "En Proceso" (asignada a almacenista)
│   ├─ "Completada" (picking terminado)
│   └─ "Cancelada"
├── prioridad_id (FK → prioridades_orden)
├── fecha_requerida: datetime      ← Fecha límite
└── timestamps

-- TABLA DE DETALLES (1 fila POR PRODUCTO)
detalles_surtido
├── id (PK)
├── orden_surtido_id (FK)
├── producto_id (FK)
├── cantidad_requerida: 8          ← Cuánto se DEBE surtir
├── cantidad_surtida: 0            ← Cuánto YA se surtió
│
│ 🔑 CAMPOS CRÍTICOS PARA PICKING:
├── estante_sugerido_id (FK → estantes)  ← Ubicación inicial sugerida
├── estante_real_id (FK → estantes)      ← Ubicación CONFIRMADA (NULL si no se ha pickeda)
│
├── fue_modificado: boolean       ← TRUE si estante_real_id ≠ estante_sugerido_id
└── timestamps

EJEMPLO DE ORDEN COMPLETADA:
┌────┬──────────┬────────┬──────────┬──────────────┬────────────┬───────────────┐
│ id │ orden_id │ prod_id│ requerida│ surtida │ estante_sugerido │ estante_real │ modificado │
├────┼──────────┼────────┼──────────┼──────────┼──────────────┼────────────┼───────────────┤
│ 1  │ 1        │ 5      │ 8        │ 8        │ 1 (A-01-01)  │ 5 (B-02-03) │ TRUE  ⚠️     │
│ 2  │ 1        │ 12     │ 3        │ 3        │ 1 (A-01-01)  │ 1 (A-01-01) │ FALSE ✅     │
└────┴──────────┴────────┴──────────┴──────────┴──────────────┴────────────┴───────────────┘

ESTADO: cantidad_surtida (8+3) == cantidad_requerida (8+3) ✅ ORDEN COMPLETADA
```

### **4. DIAGRAMA RELACIONAL COMPLETO**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           ESTRUCTURA INVENTARIO                          │
├───────────────┐                          ┌────────────────┐             │
│  edificios    │ 1──────────────M         │    almacenes   │             │
│  (Contenedor) │◄────────────────────┐    │   (Sección)    │             │
└───────────────┘                     │    └────────────────┘             │
                               edificio_id                                 │
                                        └──────────────┐                   │
                                             1   M     │                   │
                                    ┌────────────────────────┐             │
                                    │     pasillos          │             │
                                    │   (Pasillo lineal)    │             │
                                    └────────────────────────┘             │
                                           pasillo_id (FK)               │
                                                     │                     │
                                            1        │       M            │
                              ┌─────────────────────────────┐             │
                              │       racks                │             │
                              │   (Estructura vertical)     │             │
                              └─────────────────────────────┘             │
                                      rack_id (FK)                        │
                                               │                           │
                                      1        │       M                  │
                          ┌──────────────────────────────┐               │
                          │     estantes                │               │
                          │  (Nodo final de ubicación)  │               │
                          └──────────────────────────────┘               │
                                  estante_id (FK)                        │
                                       │                                  │
                    ┌──────────────────┴──────────────────┐              │
                    │                                     │              │
                    M                                     1              │
        ┌───────────────────┐            ┌─────────────────────┐       │
        │   inventarios     │            │  estados_inventario │       │
        │ (Cantidad/Estado) │            │   (Disponible,etc)  │       │
        └───────────────────┘            └─────────────────────┘       │
               │ M                       estado_id (FK)                 │
               │                                                        │
               M (producto_id)                                          │
        ┌──────────────────────┐                                        │
        │      productos       │                                        │
        │   (Catálogo)         │                                        │
        └──────────────────────┘                                        │
               │ M                                                       │
               │                                                        │
               └────────────────────────────┬────────────────────────┘ │
                                            │                           │
                                            M                           │
                           ┌────────────────────────────┐              │
                           │  detalles_surtido          │              │
                           │ (Partida de orden)        │              │
                           └────────────────────────────┘              │
                                  1 │                                   │
                                    │ orden_surtido_id                  │
                                    │                                   │
                        ┌───────────────────────┐                       │
                        │  ordenes_surtido     │                       │
                        │  (Cabecera orden)    │                       │
                        └───────────────────────┘                       │
                                 │                                       │
                        capturista_id │ almacenista_id (FK → users)    │
                        prioridad_id  │ estado_id (FK → estados_orden)  │
                                      │ estante_sugerido_id (FK)        │
                                      │ estante_real_id (FK)            │
                                      M                                  │
                           ┌──────────────────┐                         │
                           │      users       │                         │
                           │   (Operarios)    │                         │
                           └──────────────────┘                         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Análisis de Puntos de Integración

### **PUNTO 1: Cálculo de Ubicación Sugerida (BRECHA CRÍTICA)**

#### Estado Actual

```php
// organirack-backend/app/Services/OrderService.php (línea 112)
public function createOrder(array $data): OrdenSurtido
{
    return DB::transaction(function () use ($data) {
        // ...
        $estanteDefault = Estante::first();  // 🔴 PROBLEMA: Siempre el primero
        // ...
        foreach ($data['detalles'] as $detalle) {
            DetalleSurtido::create([
                // ...
                'estante_sugerido_id' => $detalle['estante_sugerido_id'] ?? $estanteDefault->id,
                // ... 🔴 Sin lógica inteligente
            ]);
        }
    });
}
```

#### Problema

- ❌ Usa `Estante::first()` (siempre el primer estante de BD)
- ❌ No valida si el estante tiene stock del producto
- ❌ No prioriza por ubicación más cercana/disponible
- ❌ No respeta FIFO (First In, First Out)

#### Solución Propuesta

```php
/**
 * Calcula la ubicación sugerida MÁS INTELIGENTE para un producto
 * Prioridades (en orden):
 * 1. Ubicación con stock disponible (cantidad > 0)
 * 2. Preferir estado "Disponible"
 * 3. Priorizar por proximidad (pasillo más cercano)
 * 4. Priorizar por stock más alto (menos viajes)
 */
private function calculateSuggestedLocation(int $productoId, float $cantidadRequerida): ?Estante
{
    // Buscar ubicación con stock suficiente, disponible, más cercana
    $ubicacion = Inventario::with(['estante.rack.pasillo', 'estado'])
        ->where('producto_id', $productoId)
        ->where('cantidad', '>=', $cantidadRequerida)
        ->whereHas('estado', function ($q) {
            $q->where('nombre', 'Disponible');  // Solo disponible
        })
        ->orderBy('cantidad', 'desc')  // Más stock disponible primero
        ->first();

    return $ubicacion?->estante;
}
```

---

### **PUNTO 2: Picking Móvil - Validación en Tiempo Real**

#### API Endpoints Actuales

| Endpoint | Método | Implementado | Funcional |
|----------|--------|-------------|-----------|
| `/api/mobile/picking/orders` | GET | ✅ | ✅ |
| `/api/mobile/picking/{ordenId}/sugerencias` | GET | ✅ | ✅ |
| `/api/mobile/picking/{ordenId}/confirmar` | POST | ✅ | ✅ |

#### Flujo de Validación en `confirmPick()`

```php
// organirack-backend/app/Services/PickingService.php (línea 69)
public function confirmPick(int $ordenId, array $pickData): array
{
    // VALIDACIÓN 1️⃣: Datos básicos
    if (!$productoId || !$estanteIdEscaneado || $cantidadTomada <= 0) {
        throw new Exception('Parámetros inválidos', 400);
    }

    // VALIDACIÓN 2️⃣: Producto existe en ubicación escaneada
    $inventarioEscaneado = Inventario::where('producto_id', $productoId)
        ->where('estante_id', $estanteIdEscaneado)
        ->first();

    if (!$inventarioEscaneado) {
        throw new Exception('Producto no encontrado en la ubicación escaneada', 400);
    }

    // VALIDACIÓN 3️⃣: Stock suficiente
    if ($inventarioEscaneado->cantidad < $cantidadTomada) {
        throw new Exception(
            "Stock insuficiente. Requerido: {$cantidadTomada}, Disponible: {$inventarioEscaneado->cantidad}",
            400
        );
    }

    // TRANSACCIÓN: Descontar inventario
    return DB::transaction(function () use (...) {
        // Descuenta del inventario
        $inventarioEscaneado->update([
            'cantidad' => $inventarioEscaneado->cantidad - $cantidadTomada,
        ]);

        // Actualiza detalles_surtido
        $detalle->update([
            'cantidad_surtida' => $detalle->cantidad_surtida + $cantidadTomada,
            'estante_real_id' => $estanteIdEscaneado,  // 🔑 Ubicación confirmada
            'fue_modificado' => $estanteIdEscaneado != $detalle->estante_sugerido_id,
        ]);

        return ['success' => true, ...];
    });
}
```

#### ✅ Funcional Correctamente

1. ✅ Valida existencia de producto en ubicación
2. ✅ Verifica stock suficiente en MILISEGUNDOS (índice en BD)
3. ✅ Descuenta del inventario real (no sugerido)
4. ✅ Marca si fue override
5. ✅ Transacción ACID para integridad

---

### **PUNTO 3: Override (Cambio de Ubicación) - PARCIALMENTE IMPLEMENTADO**

#### Estado Actual

```php
// organirack-backend/database/migrations/2026_03_09_003748_create_assortment_orders_tables.php
Schema::create('detalles_surtido', function (Blueprint $table) {
    // ...
    $table->foreignId('estante_sugerido_id')->constrained('estantes');  ✅
    $table->foreignId('estante_real_id')->nullable()->constrained('estantes');  ✅
    $table->boolean('fue_modificado')->default(false);  ✅
    // ...
});
```

#### Funcionalidad en Backend

✅ **BD Soporta Override:**
- `estante_sugerido_id` = Ubicación original
- `estante_real_id` = Ubicación confirmada (puede ser distinta)
- `fue_modificado` = Flag para auditoría

✅ **PickingService.confirmPick() Detecta Override:**
```php
$detalle->update([
    'fue_modificado' => $estanteIdEscaneado != $detalle->estante_sugerido_id,
    'estante_real_id' => $estanteIdEscaneado,
]);
```

#### ❌ **Falta en MÓVIL:**
- No hay UI para override
- scannerScreen.tsx tiene botón "¿Problemas con la ubicación?" pero NO FUNCIONA
- overrideScreen.tsx es UI mock, sin lógica de backend

---

## 📋 Propuesta de Solución: Sistema Completo

### **FASE I: Backend Mejoradο (Semana 1)**

#### 1. Implementar Cálculo Inteligente de Ubicación Sugerida

**Archivo:** `organirack-backend/app/Services/PickingService.php`

```php
/**
 * Calcula la MEJOR ubicación sugerida para picking basada en:
 * 1. Stock disponible (cantidad >= requerida)
 * 2. Estado del inventario (Disponible > Cuarentena > Dañado)
 * 3. Proximidad (pasillo más cercano)
 * 4. Cantidad disponible (preferir no fragmentar)
 */
public function calculateSuggestedLocation(
    int $productoId,
    float $cantidadRequerida,
    ?int $pasilloPreferido = null
): ?Estante {
    $query = Inventario::with([
        'estante.rack.pasillo.almacen.edificio',
        'estado'
    ])
    ->where('producto_id', $productoId)
    ->where('cantidad', '>=', $cantidadRequerida);

    // Priorizar estado "Disponible"
    $query->whereHas('estado', fn($q) => $q->where('nombre', 'Disponible'));

    // Priorizar pasillo preferido si existe
    if ($pasilloPreferido) {
        $query->orderByRaw(
            'CASE WHEN estantes.pasillo_id = ? THEN 0 ELSE 1 END',
            [$pasilloPreferido]
        );
    }

    // Ordenar por cantidad disponible (mayor primero, para no fragmentar)
    $query->orderBy('cantidad', 'desc');

    $inventario = $query->first();

    \Log::info('📍 Ubicación sugerida calculada:', [
        'producto_id' => $productoId,
        'cantidad_requerida' => $cantidadRequerida,
        'ubicacion_sugerida' => $inventario?->estante?->codigo_etiqueta,
        'cantidad_disponible' => $inventario?->cantidad,
    ]);

    return $inventario?->estante;
}
```

**Integración en OrderService.createOrder():**

```php
public function createOrder(array $data): OrdenSurtido
{
    return DB::transaction(function () use ($data) {
        // ... crear orden ...

        // Inyectar PickingService
        $pickingService = app(PickingService::class);

        foreach ($data['detalles'] as $detalle) {
            // Calcular ubicación sugerida INTELIGENTEMENTE
            $ubicacionSugerida = $pickingService->calculateSuggestedLocation(
                $detalle['producto_id'],
                $detalle['cantidad_requerida']
            );

            DetalleSurtido::create([
                'orden_surtido_id' => $orden->id,
                'producto_id' => $detalle['producto_id'],
                'cantidad_requerida' => $detalle['cantidad_requerida'],
                'cantidad_surtida' => 0,
                'estante_sugerido_id' => $ubicacionSugerida?->id
                    ?? Estante::whereHas(...)->firstOrFail()->id,
                'estante_real_id' => null,
                'fue_modificado' => false,
            ]);
        }

        return $this->getOrderById($orden->id);
    });
}
```

#### 2. API Endpoint para Validación Dinámica de Ubicación

**Nuevo Endpoint:** `POST /api/picking/validate-location`

```php
// organirack-backend/app/Http/Controllers/Api/PickingController.php
public function validateLocation(Request $request): JsonResponse
{
    $validated = $request->validate([
        'producto_id' => 'required|integer|exists:productos,id',
        'estante_id' => 'required|integer|exists:estantes,id',
        'cantidad_requerida' => 'required|numeric|min:0.01',
    ]);

    try {
        // Verificar inventario en ubicación
        $inventario = Inventario::where('producto_id', $validated['producto_id'])
            ->where('estante_id', $validated['estante_id'])
            ->where('cantidad', '>=', $validated['cantidad_requerida'])
            ->first();

        if (!$inventario) {
            return response()->json([
                'valid' => false,
                'error' => 'Stock insuficiente o no disponible',
                'cantidad_disponible' => Inventario::where(...)
                    ->value('cantidad') ?? 0,
            ], 400);
        }

        return response()->json([
            'valid' => true,
            'producto_id' => $validated['producto_id'],
            'estante_id' => $validated['estante_id'],
            'cantidad_disponible' => $inventario->cantidad,
            'puede_proceder' => $inventario->cantidad >= $validated['cantidad_requerida'],
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'valid' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}
```

#### 3. API Endpoint Mejorado para Override

**Nuevo Endpoint:** `POST /api/picking/confirm-override`

```php
public function confirmOverride(Request $request): JsonResponse
{
    $validated = $request->validate([
        'detalle_id' => 'required|integer|exists:detalles_surtido,id',
        'estante_id_real' => 'required|integer|exists:estantes,id',
        'cantidad_a_surtir' => 'required|numeric|min:0.01',
    ]);

    try {
        $detalle = DetalleSurtido::findOrFail($validated['detalle_id']);

        $this->pickingService->confirmPick(
            $detalle->orden_surtido_id,
            [
                'producto_id' => $detalle->producto_id,
                'estante_id_escaneado' => $validated['estante_id_real'],
                'cantidad_tomada' => $validated['cantidad_a_surtir'],
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Override confirmado exitosamente',
            'data' => $detalle->fresh()->load([
                'producto',
                'estanteSugerido',
                'estanteReal',
            ]),
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], $e->getCode() ?: 500);
    }
}
```

---

### **FASE II: Frontend Mobile Completo (Semana 2)**

#### 1. Integrar API Call en scannerScreen.tsx

```typescript
// OrganiRack-Movil/app/screens/scannerScreen.tsx
import { useEffect, useState } from 'react';
import { CameraView } from 'expo-camera';
import { pickaService } from '../API/client'; // Implementar servicio

export default function ScannerScreen() {
    const { orderId } = useLocalSearchParams();
    const router = useRouter();
    
    const [orden, setOrden] = useState(null);
    const [detalles, setDetalles] = useState([]);
    const [detalleActual, setDetalleActual] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [cantidadTomada, setCantidadTomada] = useState(0);

    // Cargar sugerencias de picking
    useEffect(() => {
        loadPickingSuggestions();
    }, [orderId]);

    const loadPickingSuggestions = async () => {
        try {
            const response = await pickaService.getSuggestions(orderId);
            setOrden(response.data);
            setDetalles(response.data.detalles);
            setDetalleActual(response.data.detalles[0]); // Primer producto
            setLoading(false);
        } catch (error) {
            console.error('Error cargando sugerencias:', error);
            setLoading(false);
        }
    };

    const handleBarcodeScanned = async (scannedCode: string) => {
        if (!detalleActual) return;
        
        setScanning(true);
        try {
            // Validar ubicación en tiempo real
            const validationResponse = await pickaService.validateLocation({
                producto_id: detalleActual.producto_id,
                estante_id: resolveEstanteIdFromBarcode(scannedCode),
                cantidad_requerida: detalleActual.cantidad_requerida,
            });

            if (validationResponse.valid) {
                // Confirmar pick
                const confirmResponse = await pickaService.confirmPick({
                    orden_id: orderId,
                    producto_id: detalleActual.producto_id,
                    estante_id_escaneado: validationResponse.estante_id,
                    cantidad_tomada: detalleActual.cantidad_requerida,
                });

                // Mostrar éxito
                Alert.alert('✅ Pick Confirmado', 
                    `${detalleActual.producto.nombre}: ${detalleActual.cantidad_requerida} unidades`
                );

                // Pasar al siguiente
                const nextIndex = detalles.indexOf(detalleActual) + 1;
                if (nextIndex < detalles.length) {
                    setDetalleActual(detalles[nextIndex]);
                } else {
                    // Orden completada
                    Alert.alert('✅ Orden Completada', 'Todos los productos han sido surtidos', [
                        { text: 'Volver', onPress: () => router.back() }
                    ]);
                }
            } else {
                // Stock insuficiente - ofrecer override
                Alert.alert('⚠️ Ubicación Inválida',
                    `${validationResponse.error}\nCantidad disponible: ${validationResponse.cantidad_disponible}`,
                    [
                        { text: 'Cancelar', onPress: () => {} },
                        { 
                            text: 'Override', 
                            onPress: () => router.push({
                                pathname: '/screens/overrideScreen',
                                params: { 
                                    detalleId: detalleActual.id,
                                    orderId: orderId,
                                    scannedCode: scannedCode
                                }
                            })
                        }
                    ]
                );
            }
        } finally {
            setScanning(false);
        }
    };

    // ... UI code ...
}
```

#### 2. Implementar Override Screen Funcional

```typescript
// OrganiRack-Movil/app/screens/overrideScreen.tsx
import { useState } from 'react';
import { View, Alert, TextInput } from 'react-native';
import { pickingService } from '../API/client';

export default function OverrideScreen() {
    const { detalleId, orderId, scannedCode } = useLocalSearchParams();
    const router = useRouter();
    
    const [manualRack, setManualRack] = useState('');
    const [manualNivel, setManualNivel] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleOverride = async () => {
        try {
            setIsProcessing(true);

            // Convertir entrada manual a estante_id
            const estanteId = await resolveEstanteFromManualInput(
                manualRack,
                manualNivel
            );

            // Confirmar override
            const response = await pickingService.confirmOverride({
                detalle_id: parseInt(detalleId),
                estante_id_real: estanteId,
                cantidad_a_surtir: parseFloat(cantidad),
            });

            Alert.alert('✅ Override Confirmado', 
                `Producto surtido desde ubicación ${manualRack}-${manualNivel}`
            );

            router.back(); // Volver con datos actualizados

        } catch (error) {
            Alert.alert('❌ Error', error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header con info del producto */}
            {/* Campos de entrada */}
            <TextInput
                placeholder="Ej. A"
                value={manualRack}
                onChangeText={setManualRack}
                style={styles.input}
            />
            <TextInput
                placeholder="Ej. 3"
                value={manualNivel}
                onChangeText={setManualNivel}
                style={styles.input}
            />
            <TextInput
                placeholder="Cantidad"
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="decimal-pad"
                style={styles.input}
            />

            {/* Botón confirmar */}
            <TouchableOpacity
                onPress={handleOverride}
                disabled={isProcessing}
                style={styles.confirmButton}
            >
                <Text style={styles.confirmButtonText}>
                    {isProcessing ? 'Procesando...' : 'CONFIRMAR OVERRIDE'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}
```

#### 3. Crear Servicio de Picking Centralizado

```typescript
// OrganiRack-Movil/API/pickingService.ts
import { apiClient } from './client';

export const pickingService = {
    /**
     * Obtiene lista de sugerencias para una orden
     */
    async getSuggestions(ordenId: number) {
        return await apiClient.get(
            `/mobile/picking/${ordenId}/sugerencias`
        );
    },

    /**
     * Valida disponibilidad de ubicación en TIEMPO REAL
     */
    async validateLocation(data: {
        producto_id: number;
        estante_id: number;
        cantidad_requerida: number;
    }) {
        return await apiClient.post('/picking/validate-location', data);
    },

    /**
     * Confirma un pick (recolección)
     */
    async confirmPick(data: {
        orden_id: number;
        producto_id: number;
        estante_id_escaneado: number;
        cantidad_tomada: number;
    }) {
        return await apiClient.post(
            `/mobile/picking/${data.orden_id}/confirmar`,
            data
        );
    },

    /**
     * Confirma override (cambio de ubicación)
     */
    async confirmOverride(data: {
        detalle_id: number;
        estante_id_real: number;
        cantidad_a_surtir: number;
    }) {
        return await apiClient.post('/picking/confirm-override', data);
    },

    /**
     * Obtiene órdenes asignadas al almacenista
     */
    async getOrdenes() {
        return await apiClient.get('/mobile/picking/orders');
    }
};
```

---

### **FASE III: Validaciones de Integridad (Semana 2)**

#### 1. Validación de Ubicación en Tiempo Real

**Latencia Aceptable:** < 500ms (índice en BD)

```php
// En confirmPick(): Validar en milisegundos
DB::statement('SET SESSION sql_mode=""');  // Performance hint
$inventario = Inventario::where([
    ['producto_id', '=', $productoId],
    ['estante_id', '=', $estanteId],
])
->where('cantidad', '>=', $cantidadRequerida)
->first();  // Index lookup: ~1-2ms
```

#### 2. Prevención de Over-picking

```php
// En confirmPick(): Validar cantidad
if ($cantidadTomada > $inventarioEscaneado->cantidad) {
    throw new Exception('Stock insuficiente', 400);
}
```

#### 3. Prevención de Duplicados

```php
// En confirmPick(): Verificar que no se ha pickado dos veces
$yaPickeado = Inventario::where([
    ['detalle_id', '=', $detalleId],
    ['estado_id', '=', StatusPickedo],
])->exists();

if ($yaPickeado) {
    throw new Exception('Este pendiente ya fue pickead', 409);
}
```

---

## 📊 Diagramas de Flujo

### **Diagrama 1: Flujo de Creación de Orden con Ubicación Inteligente**

```
START
  │
  ├─ CAPTURISTA INGRESA ORDEN (WEB)
  │  ├─ Selecciona productos
  │  └─ Especifica cantidades
  │
  ├─ POST /api/orders (CreateOrderPayload)
  │
  ├─ OrderService.createOrder()
  │  │
  │  ├─ Crear OrdenSurtido
  │  │
  │  ├─ PARA CADA DETALLE:
  │  │  │
  │  │  ├─ PickingService.calculateSuggestedLocation()
  │  │  │  │
  │  │  │  ├─ BUSCAR inventarios con:
  │  │  │  │  ├─ producto_id = detalle.producto_id
  │  │  │  │  ├─ cantidad >= cantidad_requerida
  │  │  │  │  └─ estado_id = "Disponible"
  │  │  │  │
  │  │  │  ├─ PRIORIZAR POR:
  │  │  │  │  ├─ 1️⃣ Pasillo preferido (si existe)
  │  │  │  │  ├─ 2️⃣ Cantidad disponible (mayor primero)
  │  │  │  │  └─ 3️⃣ Estante más cercano
  │  │  │  │
  │  │  │  └─ RETORNAR estanteSugerido
  │  │  │
  │  │  ├─ Crear DetalleSurtido con:
  │  │  │  ├─ estante_sugerido_id = calculado
  │  │  │  ├─ estante_real_id = NULL
  │  │  │  └─ fue_modificado = FALSE
  │  │  │
  │  │  └─ LOGGING + Auditoría
  │  │
  │  └─ Retornar OrdenSurtido completa
  │
  ├─ OPERARIO ASIGNA ALMACENISTA
  │  ├─ almacenista_id = ID usuario
  │  └─ estado = "En Proceso"
  │
  └─ ✅ ORDEN LISTA PARA PICKING
```

### **Diagrama 2: Flujo de Picking Móvil (Sin y Con Override)**

```
START (Almacenista abre app)
  │
  ├─ GET /api/mobile/picking/orders
  │  └─ Muestra órdenes asignadas
  │
  ├─ ALMACENISTA TOCA ORDEN
  │
  ├─ GET /api/mobile/picking/{ordenId}/sugerencias
  │  └─ Carga lista de productos con ubicaciones_sugeridas[]
  │
  ├─ MUESTRA SCANNER SCREEN
  │
  ├─ FLUJO SCANNING
  │  │
  │  ├─ ESCANEA CÓDIGO DE BARRAS
  │  │  └─ Resuelve: estante_id
  │  │
  │  ├─ POST /api/picking/validate-location
  │  │  │
  │  │  └─ BACKEND VALIDA:
  │  │     ├─ ¿Producto en estante?
  │  │     ├─ ¿Stock suficiente?
  │  │     └─ ¿Estado disponible?
  │  │
  │  ├─ RESULTADO VALIDACIÓN
  │  │  │
  │  │  └─ BIFURCACIÓN 1: ✅ VÁLIDO
  │  │     │
  │  │     ├─ POST /api/mobile/picking/{ordenId}/confirmar
  │  │     │  └─ PickingService.confirmPick()
  │  │     │     │
  │  │     │     ├─ DB TRANSACTION:
  │  │     │     │  ├─ UPDATE inventarios: cantidad -= tomada
  │  │     │     │  ├─ UPDATE detalles_surtido:
  │  │     │     │  │  ├─ cantidad_surtida += tomada
  │  │     │     │  │  ├─ estante_real_id = escaneado
  │  │     │     │  │  └─ fue_modificado = (escaneado != sugerido)
  │  │     │     │  └─ COMMIT
  │  │     │     │
  │  │     │     └─ Retornar éxito
  │  │     │
  │  │     ├─ MOSTRAR "✅ Pick Confirmado"
  │  │     │
  │  │     └─ PASAR AL SIGUIENTE PRODUCTO
  │  │        └─ O "✅ ORDEN COMPLETADA"
  │  │
  │  └─ BIFURCACIÓN 2: ❌ INVÁLIDO
  │     │
  │     ├─ MOSTRAR ERROR:
  │     │  ├─ "Producto no encontrado"
  │     │  ├─ "Stock insuficiente: necesita X, disponible Y"
  │     │  └─ "Ubicación no disponible"
  │     │
  │     ├─ OFRECER OPCIONES:
  │     │  ├─ "Reintentar escaneo"
  │     │  └─ "¿Problemas? → OVERRIDE"
  │     │
  │     └─ SI TOCA OVERRIDE
  │        │
  │        ├─ NAVEGA A overrideScreen
  │        │
  │        ├─ MUESTRA INFO ACTUAL:
  │        │  ├─ Producto: "Pieza XY2"
  │        │  ├─ Ubicación sugerida: "A-01-01"
  │        │  └─ Cantidad necesaria: 8
  │        │
  │        ├─ OPCIONES:
  │        │  ├─ [ESCANEAR NUEVA UBICACIÓN]
  │        │  └─ [INGRESO MANUAL: Rack + Nivel]
  │        │
  │        ├─ INGRESA NUEVA UBICACIÓN
  │        │  ├─ Manual: "B" + "02" → "B-02-03"
  │        │  O Escanea: "B-02-03"
  │        │
  │        ├─ POST /api/picking/confirm-override
  │        │  │
  │        │  └─ BACKEND VALIDA:
  │        │     ├─ ¿Producto en NUEVA ubicación?
  │        │     ├─ ¿Stock suficiente en NUEVA ubicación?
  │        │     └─ SI VÁLIDO → Confirmar desde NUEVA
  │        │
  │        ├─ UPDATE detalles_surtido:
  │        │  ├─ estante_sugerido_id = ORIGINAL (A-01-01)
  │        │  ├─ estante_real_id = NUEVA (B-02-03)  ← 🔑 OVERRIDE
  │        │  └─ fue_modificado = TRUE  ← AUDITORÍA
  │        │
  │        └─ ✅ VOLVER AL SIGUIENTE PRODUCTO
  │
  └─ FINALIZAR ORDEN O CONTINUAR
```

### **Diagrama 3: Validación en Tiempo Real - Pseudocódigo**

```
VALIDAR_UBICACION(producto_id, estante_id, cantidad_requerida):
    │
    ├─ START_TIME = current_time_ms()
    │
    ├─ QUERY #1: Buscar inventario (1ms)
    │  │
    │  SELECT * FROM inventarios
    │  WHERE producto_id = $pid
    │  AND estante_id = $eid
    │  AND cantidad >= $qty
    │  │
    │  ├─ NOT FOUND?
    │  │  └─ RETURN { valid: false, error: "No encontrado" } ❌
    │  │
    │  └─ FOUND
    │     │
    │     ├─ Check estado_inventario
    │     │  ├─ "Dañado"?    → RETURN { valid: false, error: "Dañado" }
    │     │  ├─ "Cuarentena"?→ RETURN { valid: false, error: "Cuarentena" }
    │     │  └─ "Disponible"? → Continue
    │     │
    │     └─ RETURN { 
    │        valid: true, 
    │        cantidad_disponible: inventario.cantidad,
    │        puede_proceder: true
    │        }
    │
    ├─ ELAPSED_TIME = current_time_ms() - START_TIME
    │
    ├─ ASSERT elapsed_time < 500ms  ← SLA
    │
    └─ END
```

---

## 💡 Recomendaciones y Mejoras

### **CORTO PLAZO (Implementar Inmediatamente)**

| Item | Prioridad | Esfuerzo | Impacto |
|------|-----------|---------|---------|
| Calcular ubicación sugerida inteligentemente | 🔴 CRÍTICA | 4h | 🟢 Alto |
| Completar scanning screen móvil | 🔴 CRÍTICA | 8h | 🟢 Alto |
| Implementar override screen funcional | 🔴 CRÍTICA | 6h | 🟢 Alto |
| API de validación en tiempo real | 🟡 ALTA | 3h | 🟡 Medio |

**Total:** ~21 horas = ~2.5 días (1 dev)

### **MEDIANO PLAZO (Semanas 2-3)**

- [ ] Implementar caching de ubicaciones para performance
- [ ] Agregar metrics de picking (tiempo promedio, eficiencia)
- [ ] Notificaciones push de órdenes nuevas
- [ ] Historial de picks (auditoría completa)
- [ ] Reportes de overrides (¿por qué falló la sugerencia?)

### **LARGO PLAZO (Mejoras Futuras)**

- [ ] **Machine Learning**: Predecir ubicaciones sugeridas basado en histórico
- [ ] **Barcode Mapping**: Tabla de equivalencias (QR → estante_id)
- [ ] **FIFO Inteligente**: Rotación automática de stock
- [ ] **Recomendaciones de Reubicación**: "Este producto debería estar en X"
- [ ] **Integración con Contador de Ciclos**: Validación física
- [ ] **Geolocalización Móvil**: GPS dentro del almacén

---

## 🔍 Checklist de Implementación

### **Backend**

- [ ] Modificar `OrderService.createOrder()` para calcular ubicación inteligente
- [ ] Implementar `PickingService.calculateSuggestedLocation()`
- [ ] Crear endpoints:
  - [ ] `POST /api/picking/validate-location`
  - [ ] `POST /api/picking/confirm-override`
- [ ] Tests unitarios para validaciones
- [ ] Logging para auditoría de overrides

### **Mobile Frontend**

- [ ] Integrar API en `scannerScreen.tsx`
- [ ] Implementar `pickingService.ts`
- [ ] Crear funcionalidad completa de `overrideScreen.tsx`
- [ ] Testing entre escaneo y confirmación
- [ ] Manejo de errores y reintentos

### **Web Frontend**

- [ ] Mostrar `fue_modificado` en tabla de órdenes (badge "Override")
- [ ] Filtros por "Órdenes con Override"
- [ ] Reportes de overrides (análisis de causas)

### **Base de Datos**

- [ ] Verificar índices:
  - [ ] `INDEX (producto_id, estante_id, estado_id)` en inventarios
  - [ ] `INDEX (orden_surtido_id, producto_id)` en detalles_surtido
- [ ] Audit logs para tracking de cambios

### **Testing**

- [ ] Test: Picking sin override (feliz ruta)
- [ ] Test: Picking con override (ubicación correcta)
- [ ] Test: Validación rechaza stock insuficiente
- [ ] Test: Validación rechaza producto no encontrado
- [ ] Test: Concurrencia (2 almacenistas pickean simultáneamente)
- [ ] Test: ACID de transacciones

---

## 📈 Métricas de Éxito

| Métrica | Actual | Objetivo | Fecha |
|---------|--------|----------|-------|
| **Tiempo promedio picking** | N/A | < 5min/orden | Apr 15 |
| **Accuracy de ubicación sugerida** | 80% | > 95% | Apr 15 |
| **Overrides detectados** | 0 | Registrados | Apr 10 |
| **Queries DB < 500ms** | ✅ | 95% cumplimiento | Apr 20 |
| **Disponibilidad API picking** | N/A | 99.9% | May 1 |

---

## 📝 Conclusión

El sistema OrganiRack **ya tiene los cimientos correctos**:
- ✅ BD bien diseñada (jerarquía warehouse + ubicación sugerida/real)
- ✅ Backend con lógica de picking y validaciones
- ✅ API REST lista para móvil

**Lo que falta es puente funcional:**
- 🔧 Cálculo inteligente de ubicación sugerida
- 🔧 Integración completa móvil ↔ scanner
- 🔧 UI/UX para override

Con la solución propuesta, tendrán:
1. ✅ Validación dinámica de ubicación (< 500ms)
2. ✅ Modificación de origen (override) rastreada
3. ✅ Validación de existencias en real-time
4. ✅ Actualización de inventario por nodo exacta

**Estimado:** 2-3 days to MVP, 1-2 weeks para producción.

---

**Generado:** 29 de Marzo, 2026  
**Versión:** 1.0
