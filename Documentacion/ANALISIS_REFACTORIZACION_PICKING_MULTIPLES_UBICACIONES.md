# 📦 ANÁLISIS DE REFACTORIZACIÓN: SISTEMA DE PICKING CON SOPORTE A MÚLTIPLES UBICACIONES

## Documento de Análisis Técnico
**Fecha**: 31 de Marzo, 2026  
**Objetivo**: Permitir que un producto con stock insuficiente en una ubicación pueda completarse con stock de múltiples ubicaciones de procedencia.

---

## 📋 ÍNDICE
1. [Estado Actual del Sistema](#1-estado-actual-del-sistema)
2. [Análisis del Proceso de Sugerencia de Ubicaciones](#2-análisis-del-proceso-de-sugerencia)
3. [Limitaciones Identificadas](#3-limitaciones-identificadas)
4. [Análisis de la Base de Datos](#4-análisis-de-la-base-de-datos)
5. [Propuesta de Refactorización](#5-propuesta-de-refactorización)
6. [Cambios Requeridos](#6-cambios-requeridos)
7. [Impacto en Componentes](#7-impacto-en-componentes)

---

## 1. ESTADO ACTUAL DEL SISTEMA

### 1.1 Arquitectura del Picking Actual

El sistema está organizado en tres capas:

```
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND MÓVIL (React Native)              │
│  • OrderCard → PickingScreen → PickConfirmButton           │
│  • Hooks: usePicking, usePickingOrders, useAvailabilityCheck│
│  • API: picking.ts con confirmPick()                        │
└────────────────────┬────────────────────────────────────────┘
                     │
              API REST (Sanctum Auth)
                     │
┌────────────────────▼────────────────────────────────────────┐
│              BACKEND LARAVEL (Controllers)                  │
│  • MobilePickingController                                  │
│  • Endpoints: getOrders, getSuggestions, confirmPick       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│           SERVICES (Lógica de Negocio)                     │
│  • PickingService: getSuggestedPickingList, confirmPick    │
│  • OrderService: CRUD de órdenes                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│           DATABASE (MySQL/Eloquent ORM)                    │
│  • ordenes_surtido, detalles_surtido                       │
│  • inventarios, estantes                                   │
│  • detalles_surtido_ubicaciones (tabla pivot)              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Flujo Actual de Picking

```
PASO 1: Usuario obtiene orden
  └─→ GET /api/mobile/picking/orders
      └─→ MobilePickingController::getOrders()
          └─→ Retorna OrdenSurtido[] con detalles

PASO 2: Usuario visualiza sugerencias
  └─→ GET /api/mobile/picking/{ordenId}/sugerencias
      └─→ MobilePickingController::getSuggestions()
          └─→ PickingService::getSuggestedPickingList()
              └─→ Para cada detalle, busca ubicaciones con stock > 0
              └─→ Retorna lista de UbicacionSugerida[]

PASO 3: Usuario escanea ubicación y confirma pick
  └─→ POST /api/mobile/picking/{ordenId}/confirmar
      Body: {
        "producto_id": 5,
        "estante_id_escaneado": 12,
        "cantidad_tomada": 25
      }
      └─→ MobilePickingController::confirmPick()
          └─→ PickingService::confirmPick()
              1. Valida stock en estante_id_escaneado
              2. Descuenta inventario
              3. Actualiza detalles_surtido.cantidad_surtida
              4. Registra en detalles_surtido_ubicaciones
              5. Retorna confirmación
```

---

## 2. ANÁLISIS DEL PROCESO DE SUGERENCIA DE UBICACIONES

### 2.1 Método: `PickingService::getSuggestedPickingList()`

**Objetivo**: Generar lista de recolección sugerida para una orden  
**Ubicación**: `app/Services/PickingService.php` líneas 30-68

#### Código Actual
```php
public function getSuggestedPickingList(int $ordenId): OrdenSurtido
{
    $orden = OrdenSurtido::with([
        'estado', 'prioridad', 'capturista', 'almacenista',
        'detalles.producto',
    ])->findOrFail($ordenId);

    // Para cada detalle, buscar ubicaciones con stock
    $orden->detalles->each(function (DetalleSurtido $detalle) {
        // CONSULTA CRIT: Buscar todo inventario con cantidad > 0
        $ubicacionesSugeridas = Inventario::where('producto_id', $detalle->producto_id)
            ->where('cantidad', '>', 0)
            ->with('estante')
            ->get()
            ->map(function (Inventario $inv) {
                return [
                    'estante_id' => $inv->estante_id,
                    'estante_codigo' => $inv->estante?->codigo_etiqueta,
                    'cantidad_disponible' => (float)$inv->cantidad,
                    'estado' => $inv->estado?->nombre,
                ];
            })
            ->values();

        $detalle->ubicaciones_sugeridas = $ubicacionesSugeridas;
    });

    return $orden;
}
```

#### Lógica Analizada

| Aspecto | Comportamiento | Limitación |
|---------|---|---|
| **Búsqueda de ubicaciones** | Busca TODAS las ubicaciones con stock del producto | ✅ Completa |
| **Criterio de selección** | `cantidad > 0` directamente del inventario | ✅ Correcto |
| **Ordenamiento** | Sin ordenamiento específico (por ID de estante) | ⚠️ No optimizado |
| **FIFO / Rotación** | NO implementado | ⚠️ Falta |
| **Relación con BD** | Usa tabla `inventarios`, no `detalles_surtido_ubicaciones` | ✅ Correcto |
| **Cantidad acumulada** | Solo muestra cantidad en cada ubicación aislada | ⚠️ No suma totales |

#### Flujo de Datos

```
Orden Surtido (ID=5)
  ├─ Detalle 1 (Producto: Tornillo M8)
  │  ├─ Cantidad Requerida: 1000
  │  ├─ Cantidad Surtida: 0
  │  └─ Ubicaciones Sugeridas: [
  │      { estante_id: 10, codigo: "A-01-01", disponible: 350 },
  │      { estante_id: 15, codigo: "A-02-01", disponible: 720 },
  │      { estante_id: 22, codigo: "B-01-01", disponible: 450 }
  │    ]
  └─ Detalle 2 (Producto: Arandela)
     ├─ Cantidad Requerida: 500
     ├─ Cantidad Surtida: 0
     └─ Ubicaciones Sugeridas: [
         { estante_id: 8, codigo: "A-01-02", disponible: 600 }
       ]
```

### 2.2 ¿Cómo el Frontend Procesa las Sugerencias?

**En `API/picking.ts`:**
```typescript
export function checkLocationAvailability(
  orden: OrdenSurtido,
  detalleId: number,
  ubicacion: string,
): LocationAvailability {
  const detalle = orden.detalles.find((d) => d.id === detalleId);
  
  // Busca en ubicaciones_sugeridas
  const ubicacionSugerida = detalle.ubicaciones_sugeridas.find(
    (ub) => ub.estante_codigo === ubicacion
  );
  
  // Si encontró: retorna disponibilidad
  // Si NO encontró: retorna cantidad = 0 (ubicación alternativa)
  return {
    estante_codigo: ubicacion,
    cantidad_disponible: ubicacionSugerida?.cantidad_disponible ?? 0,
    es_sugestion: !!ubicacionSugerida,
  };
}
```

**En UI (`PickingConfirmSection.tsx` aproximado):**
- Usuario escanea código de estante
- Se busca en `ubicaciones_sugeridas` del detalle actual
- Si existe: muestra cantidad disponible ✅
- Si NO existe: permite override dinámico ⚠️

### 2.3 Patrón Actual: Una Ubicación por Pick

El sistema asume que **cada pick es de UN solo estante**:

```
┌─────────────────────────────────────────────────────────────┐
│ Orden: ORD-20260331-00001                                   │
│ Producto: Tornillo M8 - Cantidad Requerida: 1000           │
│                                                              │
│ Ubicaciones Disponibles:                                    │
│  • A-01-01: 350 uds                                        │
│  • A-02-01: 720 uds  ← Usuario escanea                     │
│  • B-01-01: 450 uds                                        │
│                                                              │
│ [FLUJO ACTUAL]                                             │
│ 1. Usuario escanea A-02-01                                 │
│ 2. Sistema valida: ✓ Existe, cantidad=720                 │
│ 3. Usuario toma 720 (cantidad sugerida del estante)       │
│ 4. Sistema confirma:                                       │
│    - Detalle actualizado: surtida=720, real_id=A-02-01    │
│    - Falta: 280 (1000-720)                                │
│ 5. Sistema marca detalle como INCOMPLETO                   │
│                                                              │
│ ❌ PROBLEMA: Usuario debe hacer OTRO pick COMPLETO       │
│    desde A-01-01 o B-01-01, pero no puede acumular en el  │
│    mismo detalle. Solo guarda la última ubicación.        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. LIMITACIONES IDENTIFICADAS

### Limitación 1: Una Sola Ubicación Real por Detalle

**Problema**: Campo `detalles_surtido.estante_real_id` es un ÚNICO foreign key

```sql
-- ESTRUCTURA ACTUAL (problematica)
CREATE TABLE detalles_surtido (
    id BIGINT,
    ...
    estante_real_id BIGINT NULL,  -- ⚠️ Solo UNA ubicación
    FOREIGN KEY(estante_real_id) REFERENCES estantes(id)
);
```

**Impacto**: 
- Si un producto requiere 1000 unidades pero hay 350 en A-01-01 y 720 en A-02-01
- El usuario debe hacer DOS operaciones de picking
- Cada una SOBRESCRIBE la anterior en `estante_real_id`
- Se pierde traza de dónde vino cada unidad

### Limitación 2: Sin Soporte FIFO / Rotación

**Problema**: Las sugerencias se retornan sin criterio de orden ni antigüedad

```php
$ubicacionesSugeridas = Inventario::where('producto_id', $detalle->producto_id)
    ->where('cantidad', '>', 0)
    ->with('estante')
    ->get()  // ⚠️ Sin orderBy()
    ->map(...);
```

**Impacto**: El orden de ubicaciones es aleatorio (por ID de BBDD)

### Limitación 3: Confirmación Atómica de Un Solo Estante

**Problema**: `PickingService::confirmPick()` acepta SOLO un estante por llamada

```php
public function confirmPick(int $ordenId, array $pickData): array
{
    $estanteIdEscaneado = $pickData['estante_id_escaneado'] ?? null;  // ⚠️ Solo uno
    $cantidad = $pickData['cantidad_tomada'] ?? 0;
    
    // Valida stock SOLO en ese estante
    $inventarioEscaneado = Inventario::where('producto_id', $productoId)
        ->where('estante_id', $estanteIdEscaneado)  // ⚠️ Filtro rígido
        ->first();
}
```

### Limitación 4: Sin Validación de Cumplimiento Parcial

**Problema**: No hay lógica para verificar si un detalle puede satisfacerse parcialmente

```php
// Detalle: Cantidad requerida = 1000, cantidad_surtida = 0
// Usuario toma 350 de A-01-01

// Actualiza:
$detalle->update([
    'cantidad_surtida' => 350,  // ✓ Parcial, correcto
    'estante_real_id' => 10,    // ❌ Pero solo guarda ÚLTIMO estante
]);
```

---

## 4. ANÁLISIS DE LA BASE DE DATOS

### 4.1 Estructura Actual de Tablas

#### Tabla: `detalles_surtido`
```sql
CREATE TABLE detalles_surtido (
    id BIGINT PRIMARY KEY,
    orden_surtido_id BIGINT,
    producto_id BIGINT,
    cantidad_requerida DECIMAL(10,2),
    cantidad_surtida DECIMAL(10,2) DEFAULT 0,
    estante_sugerido_id BIGINT,      -- ✓ Sugerencia original
    estante_real_id BIGINT NULL,     -- ⚠️ LIMITACIÓN: Solo 1 real
    fue_modificado BOOLEAN DEFAULT FALSE,
);
```

#### Tabla: `detalles_surtido_ubicaciones` (Pivot Table)
```sql
CREATE TABLE detalles_surtido_ubicaciones (
    id BIGINT PRIMARY KEY,
    detalle_surtido_id BIGINT,  -- ✓ FK a detalles_surtido
    estante_id BIGINT,          -- ✓ FK a estantes
    cantidad_tomada DECIMAL(10,2),  -- ✓ Cantidad de ESTE pick
    user_id BIGINT,             -- ✓ Quién hizo el pick
    created_at TIMESTAMP,       -- ✓ Cuándo
    
    FOREIGN KEY(detalle_surtido_id) REFERENCES detalles_surtido(id),
    FOREIGN KEY(estante_id) REFERENCES estantes(id),
    FOREIGN KEY(user_id) REFERENCES users(id),
);
```

### 4.2 Hallazgo Crítico: El Diseño YA Soporta Múltiples Ubicaciones

✅ **La tabla `detalles_surtido_ubicaciones` YA EXISTE y fue diseñada para EXACTAMENTE ESTO**

**Por qué fue creada:**
- Permite N registros por detalle_surtido
- Cada registro = UN pick de UN estante
- Trazabilidad completa: quién, cuándo, cuánto de dónde

**Por qué NO se está usando:**
- El backend NO inserta en ella los picks confirmados
- El código solo usa `estante_real_id` como referencia única
- El frontend desconoce que exista esta tabla

### 4.3 Relaciones Actuales

```
ordenes_surtido (1)
    ├─ (1:N) detalles_surtido
    │         ├─ producto_id → productos
    │         ├─ estante_sugerido_id → estantes
    │         ├─ estante_real_id → estantes (⚠️ ÚNICA)
    │         └─ (1:N) detalles_surtido_ubicaciones ← NO USADO
    │                   ├─ estante_id → estantes
    │                   └─ user_id → users
    │  
    ├─ capturista_id → users
    └─ almacenista_id → users
```

### 4.4 Oportunidad de Refactorización

**Opción 1: Usa tabla existente (RECOMENDADA)**
- Insertar en `detalles_surtido_ubicaciones` en cada confirmación
- Guardar `estante_real_id` como NULL o como "último estante escaneado"
- Lógica de validación: sumar cantidades en tabla pivot para completitud

**Opción 2: Extender `detalles_surtido`**
- Agregar campo `array_estantes` (JSON)
- Replicar información
- Más complicado

---

## 5. PROPUESTA DE REFACTORIZACIÓN

### 5.1 Nuevas Reglas de Negocio

#### Regla 1: Soporte de Múltiples Ubicaciones

```
Si Cantidad_Requerida > Stock_En_Una_Ubicación:
    Sistema permite registrar picks de MÚLTIPLES ubicaciones
    
Ejemplo:
    - Requerido: 1000
    - Pick 1: 350 de A-01-01 → surtida = 350 ✓ Parcial
    - Pick 2: 400 de A-02-01 → surtida = 750 ✓ Parcial
    - Pick 3: 250 de B-01-01 → surtida = 1000 ✓ COMPLETO
```

#### Regla 2: Validación de Cumplimiento

```
Detalle completo = cantidad_surtida >= cantidad_requerida
Orden completa = TODOS los detalles están completos

Se usa tabla detalles_surtido_ubicaciones para la trazabilidad
```

#### Regla 3: Trazabilidad Completa

```
Para cada pick registrado:
    author: user_id (quién lo hizo)
    when: created_at (cuándo)
    from: estante_id (de dónde)
    quantity: cantidad_tomada (cuánto)
    detail: detalle_surtido_id (a qué detalle pertenece)
```

### 5.2 Cambios en la Base de Datos

#### OPCIÓN A - SIN MIGRACIÓN (Reutilizar tabla existente)

NO necesita cambios. Solo cambiar la lógica de negocio para usar la tabla pivot.

```sql
-- YA EXISTE: detalles_surtido_ubicaciones
-- CAMBIO: Backend comenzará a usarla
```

#### OPCIÓN B - CON MEJORA (Recomendada)

Agregar índice compuesto para optimizar consultas de completitud:

```sql
-- Agregar índice para validar rapidamente si detalle está completo
ALTER TABLE detalles_surtido_ubicaciones 
ADD INDEX idx_detalle_cantidad (detalle_surtido_id, cantidad_tomada);
```

### 5.3 Cambios en Backend

#### Cambio 1: `PickingService::confirmPick()` - Nueva Lógica

**Antes**:
```php
$detalle->update([
    'cantidad_surtida' => $cantidadSurtidaNueva,
    'estante_real_id' => $estanteIdEscaneado,  // Unique
    'fue_modificado' => $fueOverride,
]);
```

**Después**:
```php
// 1. Descontar inventario (same as before)
$inventarioEscaneado->update([
    'cantidad' => $cantidadNueva,
]);

// 2. Sumar cantidad_surtida
$cantidadSurtidaActual = $detalle->cantidad_surtida ?? 0;
$cantidadSurtidaNueva = $cantidadSurtidaActual + $cantidadTomada;

$detalle->update([
    'cantidad_surtida' => $cantidadSurtidaNueva,
    'estante_real_id' => $estanteIdEscaneado,  // Último estante (para compatibilidad)
    'fue_modificado' => $fueOverride,
]);

// 3. ✨ NUEVO: Registrar en tabla pivot (trazabilidad)
DetalleSurtidoUbicacion::create([
    'detalle_surtido_id' => $detalle->id,
    'estante_id' => $estanteIdEscaneado,
    'cantidad_tomada' => $cantidadTomada,
    'user_id' => auth()->id(),
]);

// 4. Retornar información aumentada
return [
    'success' => true,
    'detalle_surtido' => [
        'id' => $detalle->id,
        'cantidad_requerida' => $detalle->cantidad_requerida,
        'cantidad_surtida' => $cantidadSurtidaNueva,
        'es_completo' => $cantidadSurtidaNueva >= $detalle->cantidad_requerida,
        'ubicaciones' => DetalleSurtidoUbicacion::where(
            'detalle_surtido_id', 
            $detalle->id
        )->get(),  // ✨ NUEVO: Mostrar todas las ubicaciones
    ],
];
```

#### Cambio 2: Nueva Validación de Cumplimiento

```php
/**
 * Verifica si un detalle está completo y actualiza orden si es necesario
 */
private function validateAndUpdateOrderCompletion(int $detalleId): void
{
    $detalle = DetalleSurtido::with('orden.detalles')->findOrFail($detalleId);
    $orden = $detalle->orden;
    
    // Si detalle acaba de completarse
    if ($detalle->cantidad_surtida >= $detalle->cantidad_requerida) {
        $todosCompletados = $orden->detalles->every(
            fn($d) => $d->cantidad_surtida >= $d->cantidad_requerida
        );
        
        if ($todosCompletados && $orden->estado_id != 3) {
            $orden->update(['estado_id' => 3]); // Completada
            \Log::info('✅ Orden completada automáticamente', [
                'orden_id' => $orden->id,
            ]);
        }
    }
}
```

### 5.4 Cambios en API / DTOs

#### Cambio 3: Respuesta Extendida de `confirmPick()`

**Nuevo Response:**
```php
return response()->json([
    'message' => 'Pick confirmado exitosamente',
    'data' => [
        'orden_id' => $ordenId,
        'detalle' => [
            'id' => $detalleId,
            'producto_id' => $productoId,
            'cantidad_requerida' => $cantidadRequerida,
            'cantidad_surtida' => $cantidadSurtidaNueva,  // ACUMULADA
            'es_completo' => $cantidadSurtidaNueva >= $cantidadRequerida,
            'ubicaciones_recolectadas' => [  // ✨ NUEVO
                [
                    'estante_id' => 10,
                    'estante_codigo' => 'A-01-01',
                    'cantidad' => 350,
                    'usuario' => 'almacenista_1',
                    'timestamp' => '2026-03-31 14:30:00',
                ],
                [
                    'estante_id' => 15,
                    'estante_codigo' => 'A-02-01',
                    'cantidad' => 400,
                    'usuario' => 'almacenista_1',
                    'timestamp' => '2026-03-31 14:31:00',
                ],
            ],
            'orden_estado' => [  // ✨ NUEVO
                'incompleta': false,
                'completa': true,
                'items_restantes': 0,
            ],
        ],
    ],
], 200);
```

---

## 6. CAMBIOS REQUERIDOS

### 6.1 BACKEND - Cambios en Archivos

#### Archivo 1: `app/Services/PickingService.php`

**Cambios**:
1. Importar modelo `DetalleSurtidoUbicacion`
2. Refactorizar `confirmPick()` para:
   - ✅ Insertar en tabla pivot
   - ✅ Sumar cantidad_surtida (no reemplazar)
   - ✅ Validar completitud
3. Agregar método nuevo: `validatePickCompletion()`

#### Archivo 2: `app/Http/Controllers/Api/MobilePickingController.php`

**Cambios**:
1. Adaptarel endpoint `confirmPick()` para retornar trazabilidad
2. Agregar field de completitud en respuesta
3. Mantener compatibilidad hacia atrás

#### Archivo 3: `app/Models/DetalleSurtido.php` (Model)

**Cambios agr** (si existe):
```php
class DetalleSurtido extends Model {
    // ✨ Agregar relación:
    public function ubicaciones() {
        return $this->hasMany(DetalleSurtidoUbicacion::class, 
            'detalle_surtido_id');
    }
}
```

#### Archivo 4: `app/Models/DetalleSurtidoUbicacion.php` (Crear modelo)

**Crear nuevo archivo**:
```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetalleSurtidoUbicacion extends Model
{
    protected $table = 'detalles_surtido_ubicaciones';
    public $timestamps = false;
    
    protected $fillable = [
        'detalle_surtido_id',
        'estante_id',
        'cantidad_tomada',
        'user_id',
    ];
    
    protected $casts = [
        'cantidad_tomada' => 'float',
        'created_at' => 'datetime',
    ];
    
    public function detalle() {
        return $this->belongsTo(DetalleSurtido::class, 
            'detalle_surtido_id');
    }
    
    public function estante() {
        return $this->belongsTo(Estante::class, 'estante_id');
    }
    
    public function usuario() {
        return $this->belongsTo(User::class, 'user_id');
    }
}
?>
```

### 6.2 FRONTEND - Cambios en Tipos TypeScript

#### Archivo 1: `OrganiRack-Movil/types/orders.ts`

**Cambios**:

```typescript
// NUEVO: Tipo para registro de ubicación recolectada
export interface UbicacionRecolectada {
  detalle_surtido_ubicacion_id: number;
  estante_id: number;
  estante_codigo: string;
  cantidad_tomada: number;
  usuario_id: number;
  usuario_nombre: string;
  timestamp: string;
}

// EXTENDER: DetalleSurtido
export interface DetalleSurtido {
  id: number;
  orden_surtido_id: number;
  producto_id: number;
  cantidad_requerida: string | number;
  cantidad_surtida: string | number; // ← Ahora es ACUMULADA
  estante_sugerido_id?: number;
  estante_real_id?: number | null; // ← Último estante (legacy)
  fue_modificado: boolean;
  created_at?: string;
  updated_at?: string;
  producto: Producto;
  ubicaciones_sugeridas?: UbicacionSugerida[];
  
  // ✨ NUEVO: Trazabilidad de picks múltiples
  ubicaciones_recolectadas?: UbicacionRecolectada[];
  es_completo?: boolean;  // ← cantidad_surtida >= cantidad_requerida
}
```

#### Archivo 2: `OrganiRack-Movil/API/picking.ts`

**Cambios**:

```typescript
export interface PickConfirmResponse {
  message: string;
  data: {
    orden_id: number;
    detalle: {
      id: number;
      producto_id: number;
      cantidad_requerida: number;
      cantidad_surtida: number;        // ← Acumulada ahora
      es_completo: boolean;            // ← ✨ NUEVO
      ubicaciones_recolectadas: UbicacionRecolectada[];  // ← ✨ NUEVO
      orden_estado: {
        incompleta: boolean;
        completa: boolean;
        items_restantes: number;
      };
    };
  };
}
```

### 6.3 FRONTEND - Cambios en UI

#### Cambio 1: Component `PickingProgressSection.tsx`

**Mostrar múltiples ubicaciones**:
```typescript
// ANTES: Solo mostraba última ubicación
const ubicacion_real = detalle.estante_real_id;

// DESPUÉS: Mostrar histórico de recolecciones
const ubicaciones = detalle.ubicaciones_recolectadas?.map(ub => (
  <Text>{ub.estante_codigo}: {ub.cantidad_tomada} uds</Text>
));
```

#### Cambio 2: Component `PickConfirmButton.tsx`

**Ajustar lógica de confirmación**:
```typescript
// ANTES: Requería cantidad exacta del estante
const cantidadDisponible = ubicacionSugerida.cantidad_disponible;
if (cantidadTomada > cantidadDisponible) {
  Error: "Cantidad insuficiente";
}

// DESPUÉS: Permite acumular picks
const cantidadRestante = cantidad_requerida - cantidad_surtida;
const cantidadMaxDePick = min(
  cantidadTomada,
  cantidadRestante,
  cantidadDisponible
);
if (cantidadMaxDePick > 0) {
  ConfirmPick(cantidadMaxDePick);  // Permite pick parcial
}
```

---

## 7. IMPACTO EN COMPONENTES

### Matriz de Cambios

| Componente | Cambio | Complexidad | Prioridad |
|---|---|---|---|
| **Backend** | | | |
| `PickingService` | Refactorizar `confirmPick()` | 🟡 Media | 🔴 Alta |
| `MobilePickingController` | Adaptar respuestas | 🟡 Media | 🔴 Alta |
| `DetalleSurtidoUbicacion` Model | Crear modelo Eloquent | 🟢 Baja | 🟡 Media |
| **Frontend** | | | |
| `types/orders.ts` | Extender interfaces | 🟢 Baja | 🔴 Alta |
| `API/picking.ts` | Actualizar tipos response | 🟢 Baja | 🔴 Alta |
| `PickingProgressSection` | Mostrar múltiples ubicaciones | 🟡 Media | 🟡 Media |
| `PickConfirmButton` | Soporte pick parcial | 🟡 Media | 🟡 Media |
| **Database** | | | |
| Schema | Agregar índice (opcional) | 🟢 Baja | 🟢 Baja |

### Línea de Tiempo Estimada

```
Semana 1:
  └─ Backend: Refactorizar PickingService (2-3 días)
  └─ Backend: Adaptar MobilePickingController (1 día)
  └─ Testing: Validar endpoints (1 día)

Semana 2:
  └─ Frontend: Actualizar tipos TypeScript (1 día)
  └─ Frontend: Adaptar componentes de UI (2 días)
  └─ Frontend: Testing integración E2E (1 día)

Semana 3:
  └─ QA: Testing funcional completo (2-3 días)
  └─ Deployment: Preparar release (1-2 días)
```

---

## 8. CASOS DE USO NUEVOS

### Caso 1: Recolección de Stock Distribuido

```
ESCENARIO:
Almacenista necesita surtir: 1000 tornillos M8

FLUJO ACTUAL (❌ Deficiente):
1. Escanea A-01-01: 350 → Pick 1 confirmado
2. Sistema retorna: Cantidad surtida = 350 (ultima ubicacion = A-01-01)
3. Escanea A-02-01: 400 → Pick 2 confirmado
4. Sistema retorna: Cantidad surtida = 400 (última ubicacion = A-02-01) ← Perdió Pick 1!
5. Le faltan 600 still

FLUJO NUEVO (✅ Mejorado):
1. Escanea A-01-01: 350 → Pick 1 = 350
2. Sistema retorna: cantidad_surtida = 350, es_completo = FALSE
   ubicaciones = [{A-01-01, 350}]
3. Escanea A-02-01: 400 → Pick 2 = 400
4. Sistema retorna: cantidad_surtida = 750, es_completo = FALSE
   ubicaciones = [{A-01-01, 350}, {A-02-01, 400}]
5. Escanea B-01-01: 250 → Pick 3 = 250
6. Sistema retorna: cantidad_surtida = 1000, es_completo = TRUE ✓
   ubicaciones = [{A-01-01, 350}, {A-02-01, 400}, {B-01-01, 250}]
```

### Caso 2: Validación de Cumplimiento Automática

```
ANTES:
- Sistema NO valida automáticamente si orden está completa
- Requiere intervención manual de supervisor

DESPUÉS:
- Cada pick valida: ¿cantidad_surtida >= cantidad_requerida?
- Si todos los detalles están completos → Orden = COMPLETADA (auto)
- Se registra en audit_logs / activity logs
```

### Caso 3: Reporte de Trazabilidad

```
Nuevo reporte disponible:

PICKING_DETAIL:
  Detalle ID 45
  Producto: Tornillo M8
  Requerido: 1000
  Recolectado:
    08:30 - Usuario: juan_almacenista - A-01-01 - 350
    08:35 - Usuario: juan_almacenista - A-02-01 - 400
    08:40 - Usuario: juan_almacenista - B-01-01 - 250
  Total: 1000 ✓
  Estado: COMPLETADO
```

---

## 9. RIESGOS Y MITIGACIÓN

| Riesgo | Impacto | Mitigation |
|---|---|---|
| **Compatibilidad hacia atrás** | Apps móviles antiguas fallan | Mantener campos legacy (`estante_real_id`) |
| **Performance con muchos picks** | Lentitud en búsquedas | Crear índices en tabla pivot |
| **Inconsistencia de datos** | Cantidad_surtida incorrecta | Transacciones ACID en confirmPick() |
| **Overflow de ubicaciones** | UI congestionada | Limitar histórico a últimos 10 picks |

---

## 10. RESUMEN Y RECOMENDACIONES

### ✅ Conclusiones

1. **La estructura de BD YA SOPORTA múltiples ubicaciones** 
   - Tabla `detalles_surtido_ubicaciones` existe y está diseñada para esto
   - Solo falta implementar la lógica de negocio en backend

2. **La refactorización es "plug & play"**
   - No requiere cambios destructivos de migración
   - Compatible hacia atrás con `estante_real_id`
   
3. **Impacto es MEDIANO (no alto)**
   - ~300-400 líneas de código de backend
   - ~200-300 líneas de frontend
   - Puede hacerse incremental

### 🎯 Recomendaciones de Implementación

**Fase 1 - MVP (1 semana)**:
- Refactorizar `PickingService::confirmPick()`
- Insertar en tabla pivot
- Actualizar tipos TypeScript
- Testing manual

**Fase 2 - Mejoras (1 semana)**:
- Adaptar UI para mostrar múltiples ubicaciones
- Agregar validación de completitud automática
- Testing E2E

**Fase 3 - Optimización (1 semana)**:
- Crear índices en tabla pivot
- Agregar reportes de trazabilidad
- Performance testing

**NO hacer**:
- ❌ Cambiar `estante_real_id` (mantener para compatibilidad)
- ❌ Crear nueva tabla `ubicaciones_picking` (usar tabla existente)
- ❌ Eliminar endpoint `/confirmar` (extender, no reemplazar)

---

## 11. APÉNDICE: QUERIES ÚTILES

### Query: Obtener histórico completo de un detalle

```sql
SELECT 
    dsu.id,
    dsu.cantidad_tomada,
    e.codigo_etiqueta,
    u.name as usuario,
    dsu.created_at
FROM detalles_surtido_ubicaciones dsu
JOIN estantes e ON dsu.estante_id = e.id
JOIN users u ON dsu.user_id = u.id
WHERE dsu.detalle_surtido_id = 45
ORDER BY dsu.created_at ASC;
```

### Query: Validar completitud de orden

```sql
SELECT 
    os.folio,
    COUNT(ds.id) as total_detalles,
    SUM(CASE WHEN ds.cantidad_surtida >= ds.cantidad_requerida THEN 1 ELSE 0 END) as detalles_completos,
    ROUND(
        SUM(CASE WHEN ds.cantidad_surtida >= ds.cantidad_requerida THEN 1 ELSE 0 END) / 
        COUNT(ds.id) * 100,
        0
    ) as porcentaje_completitud
FROM ordenes_surtido os
JOIN detalles_surtido ds ON os.id = ds.orden_surtido_id
WHERE os.id = 5
GROUP BY os.id;
```

### Query: Detectar picks múltiples del mismo usuario

```sql
SELECT 
    dsu.detalle_surtido_id,
    COUNT(*) as total_picks,
    SUM(dsu.cantidad_tomada) as total_cantidad,
    GROUP_CONCAT(e.codigo_etiqueta SEPARATOR ',') as estantes,
    dsu.user_id
FROM detalles_surtido_ubicaciones dsu
JOIN estantes e ON dsu.estante_id = e.id
GROUP BY dsu.detalle_surtido_id
HAVING COUNT(*) > 1
ORDER BY dsu.created_at DESC;
```

---

**Documento preparado**: 31 de Marzo, 2026  
**Versión**: 1.0  
**Estado**: Listo para implementación
