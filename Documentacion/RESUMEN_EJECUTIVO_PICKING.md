# 📊 RESUMEN EJECUTIVO: Refactorización Picking - Múltiples Ubicaciones

## 🎯 Objetivo
Permitir que un producto en una orden pueda completarse combinando stock de **múltiples ubicaciones** cuando hay insuficiencia en una sola.

---

## 📌 HALLAZGO CRÍTICO

✅ **La tabla `detalles_surtido_ubicaciones` YA EXISTE en el esquema de BD**

Esta tabla fue diseñada exactamente para esto, pero **NO se está usando** en el código actual.

```
┌─────────────────────────────────────────┐
│ detalles_surtido_ubicaciones (PIVOT)    │
├─────────────────────────────────────────┤
│ • id (PK)                               │
│ • detalle_surtido_id (FK)      ← Link   │
│ • estante_id (FK)              ← Dónde  │
│ • cantidad_tomada (DECIMAL)    ← Cuánto │
│ • user_id (FK)                 ← Quién  │
│ • created_at (TIMESTAMP)       ← Cuándo │
│                                         │
│ Soporta: N registros por detalle ✨    │
└─────────────────────────────────────────┘
```

---

## 🔴 LIMITACIONES ACTUALES

| # | Limitación | Impacto | Ejemplo |
|---|---|---|---|
| 1️⃣ | **Una sola ubicación real** por detalle | Pierde trazabilidad de picks anteriores | Usuario hace Pick 1 de 350, Pick 2 de 400 → Solo guarda "último estante escaneado" |
| 2️⃣ | **Sin soporte FIFO/Rotación** | Orden aleatorio en sugerencias | Busca ubicaciones sin criterio de antigüedad |
| 3️⃣ | **Confirmación atómica** de UN estante | Requiere múltiples solicitudes API | Un detalle con falta necesita N posts separados |
| 4️⃣ | **No acumula cantidad_surtida** | Sobrescribe valores anteriores | cantidad_surtida se reemplaza en vez de sumar |
| 5️⃣ | **Sin validación de completitud** | Orden nunca se marca automáticamente como completa | Manual recounting required |

---

## ✅ SOLUCIÓN PROPUESTA

### Cambio Conceptual

**ANTES**: 
```python
PUT detalles_surtido
  cantidad_surtida = valor_unico  # Único número
  estante_real_id = id_unico       # Un solo estante
```

**DESPUÉS**:
```python
PUT detalles_surtido
  cantidad_surtida = SUMA(picks)   # Acumula múltiples picks
  estante_real_id = ultimo_estante # Para compatibilidad
  
INSERT detalles_surtido_ubicaciones
  # Cada pick registra su trazabilidad completa
  - estante_id
  - cantidad_tomada
  - user_id  
  - created_at
```

### Cambios Mínimos Requeridos

#### Backend (Laravel)

✏️ **PickingService::confirmPick()** - Modificar método existente

**Líneas cambiadas**: ~50 líneas

```php
// 1. Cambiar: cantidad_surtida ACUMULA
$cantidadSurtidaNueva = $detalle->cantidad_surtida + $cantidadTomada;
                                      ↑ ANTES era =, AHORA es +

// 2. Nuevo: Insertar en tabla pivot
DetalleSurtidoUbicacion::create([
    'detalle_surtido_id' => $detalle->id,
    'estante_id' => $estanteIdEscaneado,
    'cantidad_tomada' => $cantidadTomada,
    'user_id' => auth()->id(),
]);

// 3. Nuevo: Validar completitud automática
if ($cantidadSurtidaNueva >= $detalle->cantidad_requerida) {
    // Marcar detalle como completo
    // Verificar si TODA la orden está completa
    // Cambiar estado de orden a COMPLETADA (auto)
}
```

✏️ **MobilePickingController** - Adaptar respuesta

**Líneas cambiadas**: ~30 líneas

```php
// Retornar información de trazabilidad
'ubicaciones_recolectadas' => $detalle->ubicaciones()
    ->with('estante', 'usuario')
    ->get()
    ->map(fn($u) => [...])
```

✏️ **Crear modelo**: `app/Models/DetalleSurtidoUbicacion.php`

**Líneas nuevas**: ~40 líneas

```php
class DetalleSurtidoUbicacion extends Model {
    protected $table = 'detalles_surtido_ubicaciones';
    protected $fillable = ['detalle_surtido_id', 'estante_id', 'cantidad_tomada', 'user_id'];
    public function detalle() { return $this->belongsTo(DetalleSurtido::class); }
    public function estante() { return $this->belongsTo(Estante::class); }
    public function usuario() { return $this->belongsTo(User::class, 'user_id'); }
}
```

**Total Backend**: ~120 líneas de código

#### Frontend (React Native)

✏️ **types/orders.ts** - Extender interfaces

**Líneas cambiadas**: ~20 líneas

```typescript
export interface UbicacionRecolectada {
  estante_id: number;
  estante_codigo: string;
  cantidad_tomada: number;
  usuario_nombre: string;
  timestamp: string;
}

export interface DetalleSurtido {
  // ... fields existentes ...
  ubicaciones_recolectadas?: UbicacionRecolectada[];  // ✨ NUEVO
  es_completo?: boolean;                              // ✨ NUEVO
}
```

✏️ **API/picking.ts** - Actualizar respuesta

**Líneas cambiadas**: ~15 líneas

```typescript
export interface PickConfirmResponse {
  data: {
    detalle: {
      cantidad_surtida: number;                    // Acumulada
      es_completo: boolean;                        // ✨
      ubicaciones_recolectadas: UbicacionRecolectada[]; // ✨
      orden_estado: {
        completa: boolean;
      };
    };
  };
}
```

✏️ **PickingProgressSection.tsx** - Mostrar múltiples ubicaciones

**Líneas cambiadas**: ~30 líneas

```typescript
{detalle.ubicaciones_recolectadas?.map(ub => (
  <View>
    <Text>{ub.estante_codigo}</Text>
    <Text>{ub.cantidad_tomada} uds</Text>
    <Text>{ub.timestamp}</Text>
  </View>
))}
```

**Total Frontend**: ~65 líneas de código

---

## 📈 IMPACTO

### Antes vs Después

```
┌─── ANTES ──────────────────────┐  ┌─── DESPUÉS ────────────────────┐
│ Orden: Tornillo M8 × 1000      │  │ Orden: Tornillo M8 × 1000      │
├────────────────────────────────┤  ├────────────────────────────────┤
│ Pick 1: 350 → surtida=350      │  │ Pick 1: 350 → surtida=350 ✓    │
│           ✓ detalles_surtido   │  │           ✓ detalles_surtido   │
│           ✓ inventarios        │  │           ✓ inventarios        │
│           ❌ NO se guarda      │  │           ✓ pivot table        │
│                                │  │                                │
│ Pick 2: 400 → surtida=400 ❌   │  │ Pick 2: 400 → surtida=750 ✓    │
│           (sobrescribe 350)     │  │           (suma: 350+400)       │
│           ✓ detalles_surtido   │  │           ✓ detalles_surtido   │
│           ✓ inventarios        │  │           ✓ inventarios        │
│           ❌ NO se guarda      │  │           ✓ pivot table        │
│                                │  │                                │
│ Pick 3: 250 → surtida=250 ❌   │  │ Pick 3: 250 → surtida=1000 ✓   │
│           (sobrescribe 400)     │  │           (suma: 750+250)       │
│           ✓ detalles_surtido   │  │           ✓ detalles_surtido   │
│           ✓ inventarios        │  │           ❌ NO se guarda      │  
│           ❌ NO se guarda      │  │           ✓ pivot table        │
│                                │  │           ✓ Valida completitud │
│ RESULTADO: 250/1000 ❌         │  │           ✓ Marca orden DONE    │
│ TRAZABILIDAD: Perdida ❌       │  │                                │
│ ORDEN: INCOMPLETA (manual)     │  │ RESULTADO: 1000/1000 ✓         │
│                                │  │ TRAZABILIDAD: Completa ✓       │
│                                │  │ ORDEN: COMPLETADA (auto) ✓     │
└────────────────────────────────┘  └────────────────────────────────┘
```

---

## 🎁 NUEVAS CAPACIDADES

### 1. Trazabilidad Completa de Picks

```sql
SELECT 
  dsu.cantidad_tomada,
  e.codigo_etiqueta,
  u.name,
  dsu.created_at
FROM detalles_surtido_ubicaciones dsu
JOIN estantes e ON dsu.estante_id = e.id
JOIN users u ON dsu.user_id = u.id
WHERE dsu.detalle_surtido_id = 45
ORDER BY dsu.created_at ASC;

RESULTADO:
cantidad_tomada | codigo  | usuario   | timestamp
━━━━━━━━━━━━━━━━+━━━━━━━━+━━━━━━━━━━+━━━━━━━━━━━
350              | A-01-01 | juan      | 14:30:00
400              | A-02-01 | juan      | 14:31:00 ✓ MÚLTIPLES
250              | B-01-01 | juan      | 14:32:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 1000     (Trazabilidad completa)
```

### 2. Validación Automática de Completitud

```
Cuando cantidad_surtida >= cantidad_requerida:
  1. Detalle marcado ✓ COMPLETO
  2. Sistema verifica: ¿Todos los detalles completos?
  3. Si SÍ → Orden marcada ✓ COMPLETADA (sin intervención manual)
```

### 3. Reportes de Recolección

```
PICKING REPORT - Orden ORD-20260331-00001
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Detalle: Tornillo M8
├─ Requerido: 1000
├─ Recolectado: 1000 ✓
├─ Recolecciones:
│  ├─ A-01-01: 350 (14:30 - juan)
│  ├─ A-02-01: 400 (14:31 - juan)
│  └─ B-01-01: 250 (14:32 - juan)
└─ Estado: COMPLETO

Detalle: Arandela
├─ Requerido: 500
├─ Recolectado: 500 ✓
├─ Recolecciones:
│  └─ A-01-02: 500 (14:35 - juan)
└─ Estado: COMPLETO

ORDEN: ✅ COMPLETADA
```

---

## 📦 ENTREGABLES

### Base de Datos
- **Cambios**: Ninguno (tabla YA existe)
- **Índices**: Agregar índice compuesto (opcional)

### Backend
- `app/Services/PickingService.php` - Refactorizar confirmPick()
- `app/Http/Controllers/Api/MobilePickingController.php` - Adaptar respuesta
- `app/Models/DetalleSurtidoUbicacion.php` - Crear modelo

### Frontend
- `types/orders.ts` - Extender interfaces
- `API/picking.ts` - Actualizar tipos response
- `components/PickingProgressSection.tsx` - Mostrar múltiples ubicaciones
- `components/PickConfirmButton.tsx` - Permitir pick parcial

---

## 🚀 IMPLEMENTACIÓN

### Fases

**Fase 1 (3-4 días)**: MVP Backend
- Refactorizar PickingService
- Testing API

**Fase 2 (2-3 días)**: Frontend
- Adaptar tipos y componentes
- Testing integración

**Fase 3 (1-2 días)**: Optimización
- Índices BD
- Performance testing

**Total**: 1-1.5 semanas

---

## 💾 COMPATIBILIDAD

✅ **Backward Compatible**
- Campo `estante_real_id` se mantiene (último estante escaneado)
- Apps antiguas siguen funcionando
- Nueva lógica es incremental

---

## 🎯 CONCLUSIÓN

La refactorización es **viable, de bajo riesgo y alto valor**:

✅ Tabla pivot YA existe (diseño profesional previo)  
✅ Cambios ~185 LOC total (muy manejable)  
✅ Tiempo: 1-1.5 semanas  
✅ Backward compatible  
✅ Habilita reportes y trazabilidad completa  

**Recomendación**: PROCEDER con implementación segmentada (Backend → Frontend).

---

**Documento**: Resumen Ejecutivo  
**Fecha**: 31 de Marzo, 2026  
**Estado**: Listo para desarrollo  
**Review**: Técnico - Aprobado ✓
