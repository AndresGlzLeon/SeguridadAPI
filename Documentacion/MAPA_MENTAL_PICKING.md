# 🗺️ MAPA MENTAL: Picking con Múltiples Ubicaciones

## 📍 ESTADO ACTUAL DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│ PROBLEMA IDENTIFICADO                                       │
└─────────────────────────────────────────────────────────────┘

Si un producto necesita 1000 unidades pero:
  • Ubicación A-01-01 tiene 350
  • Ubicación A-02-01 tiene 400  
  • Ubicación B-01-01 tiene 250

ACTUAL: ❌ Sistema NO SOPORTA recolectar de VARIAS ubicaciones
        User debe hacer 3 picks separados
        Pero cada pick SOBRESCRIBE el anterior
        Se pierden los datos de recolección

DESEADO: ✅ Acumular picks de múltiples ubicaciones
         ✅ Mantener trazabilidad completa
         ✅ Marcar orden como completada automáticamente
```

---

## 🔍 ANÁLISIS PROFUNDO

### Arquitectura Actual (3 capas)

```
MOBILE APP (React Native/Expo)
    ↓↑ REST API (Sanctum)
CONTROLLER (MobilePickingController)
    ↓↑ 
SERVICE (PickingService) ← AQUÍ ESTÁ EL PROBLEMA
    ↓↑
DATABASE (MySQL) ← Tabla pivot EXISTE pero no se usa
```

### El Flujo Problemático

```
Usuario escanea ubicación
    ↓
PickingService::confirmPick(orden, {producto, estante, cantidad})
    ↓
Valida stock ✓
    ↓
Descuenta inventario ✓
    ↓
Actualiza detalle: 
  • cantidad_surtida = NUEVO VALOR (sobrescribe)  ❌
  • estante_real_id = ÚLTIMO ESTANTE            ❌
    ↓
NO inserta en tabla pivot                         ❌
    ↓
RESULTADO: Pierde datos de recolecciones anteriores
```

---

## 🎯 SOLUCIÓN

### Cambio Conceptual Clave

```
CANTIDAD_SURTIDA:
  ANTES: 1000 (valor)
  DESPUÉS: 350 + 400 + 250 = 1000 (ACUMULADA de múltiples picks)

TABLA_PIVOT:
  ANTES: Existe pero no se usa
  DESPUÉS: ✨ Cada pick se registra aquí
           • estante_id
           • cantidad_tomada
           • user_id
           • created_at
```

### Cambio de Lógica

```
confirmPick(orden, {producto, estante, cantidad}) {
  
  // 1. Validar stock
  if (inventario.cantidad < cantidad) ERROR;
  
  // 2. Descontar inventario ✓ (same)
  inventario.cantidad -= cantidad;
  
  // 3. CAMBIO: Acumular en vez de reemplazar
  detalle.cantidad_surtida += cantidad;             // ← ANTES era =
  
  // 4. ✨ NUEVO: Registrar en tabla pivot
  detalles_surtido_ubicaciones.create({
    detalle_surtido_id: detalle.id,
    estante_id: estante.id,
    cantidad_tomada: cantidad,
    user_id: auth.id,
    created_at: now()
  });
  
  // 5. ✨ NUEVO: Validar completitud
  if (detalle.cantidad_surtida >= detalle.cantidad_requerida) {
    if (orden.todos_detalles_completos) {
      orden.estado = COMPLETADA;  // Auto ✨
    }
  }
  
  return {
    cantidad_surtida_acumulada: detalle.cantidad_surtida,
    es_completo: detalle.cantidad_surtida >= detalle.cantidad_requerida,
    ubicaciones_recolectadas: [
      {estante: 'A-01-01', cantidad: 350, hora: '14:30'},
      {estante: 'A-02-01', cantidad: 400, hora: '14:31'},
      {estante: 'B-01-01', cantidad: 250, hora: '14:32'},
    ]
  };
}
```

---

## 📊 IMPACTO POR COMPONENTE

```
┌─────────────────────────────────────────────────────────────┐
│ BACKEND                                                     │
├─────────────────────────────────────────────────────────────┤
│ PickingService::confirmPick()        ← REFACTOR (crítico)   │
│ MobilePickingController              ← Adaptar response      │
│ DetalleSurtidoUbicacion (MODEL)      ← CREAR NUEVO         │
│ DetalleSurtido (MODEL)               ← Agregar relación     │
│                                                              │
│ Total: ~120 LOC                                             │
│ Tiempo: 3-4 días                                            │
│ Complejidad: MEDIA                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FRONTEND                                                    │
├─────────────────────────────────────────────────────────────┤
│ types/orders.ts                      ← Extender tipos       │
│ API/picking.ts                       ← Response types       │
│ PickingProgressSection.tsx            ← Mostrar múltiples UB │
│ PickConfirmButton.tsx                 ← Pick parcial         │
│ usePicking.ts                         ← Validación           │
│                                                              │
│ Total: ~65 LOC                                              │
│ Tiempo: 2-3 días                                            │
│ Complejidad: BAJA                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DATABASE                                                    │
├─────────────────────────────────────────────────────────────┤
│ detalles_surtido_ubicaciones          ← YA EXISTE           │
│ (ningún cambio de estructura requerido)                     │
│                                                              │
│ Total: 0 cambios en migración                               │
│ Índice opcional: idx_detalle_cantidad                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 COMPARACIÓN ANTES/DESPUÉS

```
ESCENARIO: Recolectar 1000 tornillos desde 3 ubicaciones

═══════════════════════════════════════════════════════════════

❌ ANTES (Problematico):

  Pick 1: 350 de A-01-01  →  cantidad_surtida = 350
  Pick 2: 400 de A-02-01  →  cantidad_surtida = 400 (pierde 350)
  Pick 3: 250 de B-01-01  →  cantidad_surtida = 250 (pierde 400)
  
  RESULTADO: 250/1000 ❌
  TRAZABILIDAD: Perdida ❌
  ORDEN: Incompleta (manual) ❌

═══════════════════════════════════════════════════════════════

✅ DESPUÉS (Mejorado):

  Pick 1: 350 de A-01-01  →  cantidad_surtida = 350     ✓
                             ubicaciones = [A-01-01:350]
                             
  Pick 2: 400 de A-02-01  →  cantidad_surtida = 750     ✓✓ ACUMULA
                             ubicaciones = [A-01-01:350, A-02-01:400]
                             
  Pick 3: 250 de B-01-01  →  cantidad_surtida = 1000    ✓✓✓ COMPLETO
                             ubicaciones = [A-01-01:350, A-02-01:400, B-01-01:250]
                             ORDEN = COMPLETADA (AUTO)
  
  RESULTADO: 1000/1000 ✓
  TRAZABILIDAD: Completa ✓
  ORDEN: Completada automática ✓

═══════════════════════════════════════════════════════════════
```

---

## 🔄 FLUJO DE DATOS

```
USUARIO (App Móvil)
    │
    ├─→ GET /api/mobile/picking/orders
    │   └─→ Obtiene órdenes asignadas
    │       └─→ [OrdenSurtido con detalles]
    │
    ├─→ GET /api/mobile/picking/{id}/sugerencias
    │   └─→ Obtiene ubicaciones con stock
    │       └─→ Retorna detalles.ubicaciones_sugeridas[]
    │
    ├─→ POST /api/mobile/picking/{id}/confirmar (Pick 1)
    │   Body: {producto_id, estante_id, cantidad: 350}
    │   │
    │   └─→ Backend:
    │       1. Valida stock ✓
    │       2. Descuenta inventario → cantidad = 0
    │       3. Actualiza detalle → cantidad_surtida = 350
    │       4. ✨ Inserta en pivot → {estante:10, qty:350, user:1}
    │       5. Verifica completitud → 350 < 1000, NO completo
    │       └─→ Response: {es_completo: false, ubicaciones: [{A-01-01:350}]}
    │
    ├─→ POST /api/mobile/picking/{id}/confirmar (Pick 2)
    │   Body: {producto_id, estante_id, cantidad: 400}
    │   │
    │   └─→ Backend:
    │       1. Valida stock ✓
    │       2. Descuenta inventario → cantidad = 0
    │       3. Actualiza detalle → cantidad_surtida = 750 ✨ ACUMULA
    │       4. ✨ Inserta en pivot → {estante:15, qty:400, user:1}
    │       5. Verifica completitud → 750 < 1000, NO completo
    │       └─→ Response: {es_completo: false, ubicaciones: [{A-01-01:350},{A-02-01:400}]}
    │
    ├─→ POST /api/mobile/picking/{id}/confirmar (Pick 3)
    │   Body: {producto_id, estante_id, cantidad: 250}
    │   │
    │   └─→ Backend:
    │       1. Valida stock ✓
    │       2. Descuenta inventario → cantidad = 0
    │       3. Actualiza detalle → cantidad_surtida = 1000 ✨ ACUMULA
    │       4. ✨ Inserta en pivot → {estante:22, qty:250, user:1}
    │       5. Verifica completitud → 1000 >= 1000, ✅ COMPLETO
    │       6. Verifica orden → TODOS los detalles completos, ✅ ORDEN COMPLETA
    │       7. UPDATE orden.estado = COMPLETADA (AUTO)
    │       └─→ Response: {es_completo: true, orden_completa: true, ubicaciones: [...]}
    │
    └─→ UI actualiza:
        - Muestra 3 ubicaciones recolectadas
        - cantidad_surtida: 1000 ✓
        - Orden marcada COMPLETADA
        - Habilita botón "Siguiente Orden"
```

---

## 🏗️ ARQUITECTURA DE DATOS

```
TABLA: detalles_surtido (Cabecera de detalle)
┌─────────────────────────────────────────┐
│ id: 45                                  │
│ cantidad_requerida: 1000              │
│ cantidad_surtida: 1000 ← ACUMULADA   │
│ estante_real_id: 22 ← ÚLTIMO (legacy) │
└─────────────────────────────────────────┘
                    ↓↑ (1:N)
TABLA: detalles_surtido_ubicaciones (Trazabilidad)
┌──────────────────────────────────────┬─────────┐
│ detalle_surtido_id │ estante_id │ qty │ user_id |
├────────────────────┼────────────┼─────┼─────────┤
│ 45                 │ 10         │ 350 │ 1       │
│ 45                 │ 15         │ 400 │ 1       │
│ 45                 │ 22         │ 250 │ 1       │
└────────────────────┴────────────┴─────┴─────────┘
         (3 picks registrados = TRAZABILIDAD COMPLETA)
```

---

## 📋 CHECKLIST RÁPIDO

### Antes de Implementar
- [ ] ¿BD tiene tabla `detalles_surtido_ubicaciones`? → Sí ✓
- [ ] ¿Se ha leído análisis completo? → Recomendado
- [ ] ¿Hay testing plan? → Ver guía de implementación
- [ ] ¿Hay rollback plan? → Campo legacy se mantiene

### Implementación Backend
- [ ] Modelo DetalleSurtidoUbicacion.php
- [ ] Relaciones en DetalleSurtido.php
- [ ] Refactorizar confirmPick() (CRÍTICO)
- [ ] Método validateAndUpdateOrderCompletion()
- [ ] Adaptar response del controller
- [ ] Ejecutar tests unitarios
- [ ] Ejecutar queries de validación

### Implementación Frontend
- [ ] Tipos: UbicacionRecolectada
- [ ] Tipos: DetalleSurtido extendido
- [ ] Response: PickConfirmResponse
- [ ] UI: PickingProgressSection
- [ ] UI: PickConfirmButton
- [ ] Hook: usePicking validaciones
- [ ] Tests TypeScript

### Testing
- [ ] Test E2E completo (3 picks → orden completada)
- [ ] Verificar tabla pivot
- [ ] Verificar estado de orden
- [ ] Verificar trazabilidad en UI
- [ ] Performance testing

### Deployment
- [ ] Code review aprobado
- [ ] Merge a main
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Monitoring en producción

---

## 🎓 REFERENCIAS RÁPIDAS

### Archivos Críticos
- Backend: `app/Services/PickingService.php` → `confirmPick()`
- Frontend: `API/picking.ts` → `confirmPick()`
- UI: `components/PickingProgressSection.tsx`
- DB: `detalles_surtido_ubicaciones` (tabla pivot)

### Queries Útiles
```sql
-- Verificar picks acumulados
SELECT SUM(cantidad_tomada) 
FROM detalles_surtido_ubicaciones 
WHERE detalle_surtido_id = 45;

-- Verificar trazabilidad
SELECT * FROM detalles_surtido_ubicaciones 
WHERE detalle_surtido_id = 45 
ORDER BY created_at ASC;

-- Verificar completitud de orden
SELECT COUNT(*) as total, 
       SUM(CASE WHEN cantidad_surtida >= cantidad_requerida THEN 1 ELSE 0) as completos
FROM detalles_surtido 
WHERE orden_surtido_id = 5;
```

### Documentación Adicional
- 📄 ANALISIS_REFACTORIZACION_PICKING_MULTIPLES_UBICACIONES.md (Completo)
- 📄 RESUMEN_EJECUTIVO_PICKING.md (Alto nivel)
- 📄 GUIA_IMPLEMENTACION_PASO_A_PASO.md (Detallado)
- 📄 README_ANALISIS_PICKING.md (Índice)

---

## ⏱️ ESTIMACIÓN RÁPIDA

```
Backend:         3-4 días
Frontend:        2-3 días
Testing:         1-2 días
TOTAL:           6-9 días (1-1.5 semanas)

Código escribir: ~185 LOC (manageable)
BD cambios:      0 (tabla ya existe)
Risk nivel:      BAJO (backward compatible)
```

---

**Mapa Mental** | Referencia Rápida  
**Fecha**: 31 de Marzo, 2026  
**Para**: Desarrollo rápido y consulta durante implementación
