# 30 Escenarios de Picking - Especificación Detallada

## 📋 Matriz de Escenarios

### GRUPO 1: 10 Órdenes PENDIENTE (🔵 Estado: Listos para Picking)

```
┌─────────┬─────────────┬────────┬─────────────┬───────────┬──────────────┐
│ ORD ID  │ FOLIO       │ ITEMS  │ PRIORIDAD   │ ALMACENISTA │ DESCRIPCIÓN  │
├─────────┼─────────────┼────────┼─────────────┼───────────┼──────────────┤
│ ORD#01  │ ORD-0001    │ 3-4    │ ALTA        │ Asignado  │ Lista básica │
│ ORD#02  │ ORD-0002    │ 3-4    │ MEDIA       │ Asignado  │ Picking std  │
│ ORD#03  │ ORD-0003    │ 3-4    │ BAJA        │ Asignado  │ Picking std  │
│ ORD#04  │ ORD-0004    │ 3-4    │ URGENTE     │ Asignado  │ Despacho rápido │
│ ORD#05  │ ORD-0005    │ 3-4    │ MEDIA       │ Asignado  │ Picking std  │
│ ORD#06  │ ORD-0006    │ 3-4    │ BAJA        │ Asignado  │ Picking std  │
│ ORD#07  │ ORD-0007    │ 3-4    │ ALTA        │ Asignado  │ Despacho prioritario │
│ ORD#08  │ ORD-0008    │ 3-4    │ MEDIA       │ Asignado  │ Picking std  │
│ ORD#09  │ ORD-0009    │ 3-4    │ BAJA        │ Asignado  │ Picking std  │
│ ORD#10  │ ORD-0010    │ 3-4    │ MEDIA       │ Asignado  │ Picking std  │
├─────────┼─────────────┼────────┼─────────────┼───────────┼──────────────┤
│ TOTAL   │ -           │ 30-40  │ VARIADA     │ -         │ Listos para iniciar │
└─────────┴─────────────┴────────┴─────────────┴───────────┴──────────────┘

ESTADO: Pendiente
ESTADO DB: estado_id = (SELECT id FROM estados_orden WHERE nombre='Pendiente')
estante_real_id: NULL (sin picking aún)
cantidad_surtida: 0
fue_modificado: false

COBERTURA:
✅ Picking básico sin complicaciones
✅ Diferentes prioridades
✅ Diferentes almacenistas (asignación aleatoria)
✅ Validación de visualización en lista de órdenes
```

---

### GRUPO 2: 12 Órdenes EN PROGRESO (🟡 Estado: Picking Iniciado)

```
┌─────────┬─────────────┬────────┬──────────────┬───────────┬──────────────────────┐
│ ORD ID  │ FOLIO       │ ITEMS  │ % OVERRIDE   │ ALMACENISTA │ DESCRIPCIÓN          │
├─────────┼─────────────┼────────┼──────────────┼───────────┼──────────────────────┤
│ ORD#11  │ ORD-0011    │ 4      │ 0%           │ Juan      │ Picking parcial OK   │
│ ORD#12  │ ORD-0012    │ 3      │ 33%          │ María     │ 1 item override      │
│ ORD#13  │ ORD-0013    │ 4      │ 0%           │ Carlos    │ Picking parcial OK   │
│ ORD#14  │ ORD-0014    │ 3      │ 0%           │ Ana       │ Picking parcial OK   │
│ ORD#15  │ ORD-0015    │ 4      │ 50%          │ Luis      │ 2 items override     │
│ ORD#16  │ ORD-0016    │ 3      │ 0%           │ Sofia     │ Picking parcial OK   │
│ ORD#17  │ ORD-0017    │ 4      │ 25%          │ Juan      │ 1 item override      │
│ ORD#18  │ ORD-0018    │ 3      │ 0%           │ María     │ Picking parcial OK   │
│ ORD#19  │ ORD-0019    │ 4      │ 75%          │ Carlos    │ 3 items override     │
│ ORD#20  │ ORD-0020    │ 3      │ 0%           │ Ana       │ Picking parcial OK   │
│ ORD#21  │ ORD-0021    │ 4      │ 25%          │ Luis      │ 1 item override      │
│ ORD#22  │ ORD-0022    │ 3      │ 0%           │ Sofia     │ Picking parcial OK   │
├─────────┼─────────────┼────────┼──────────────┼───────────┼──────────────────────┤
│ TOTAL   │ -           │ 43-44  │ ~30%         │ -         │ En ejecución, algunos overrides │
└─────────┴─────────────┴────────┴──────────────┴───────────┴──────────────────────┘

ESTADO: En Progreso
ESTADO DB: estado_id = (SELECT id FROM estados_orden WHERE nombre='En Progreso')
estante_real_id: NULL o ≠ estante_sugerido_id (~30% tienen override)
cantidad_surtida: cantidad_requerida (asumimos picking completo en detalles individuales)
fue_modificado: true/false según override

ESCENARIOS DE OVERRIDE EN ESTE GRUPO:
├─ ORD#12: 1 item override (María encontró producto en C-02-32 en lugar de C-02-31)
├─ ORD#15: 2 items override (Luis tomó de ubicaciones alternativas)
├─ ORD#17: 1 item override (Juan ajustó ubicación por inventario real)
├─ ORD#19: 3 items override (Carlos necesitó buscar en otras ubicaciones)
└─ ORD#21: 1 item override (Luis con ajuste parcial)

COBERTURA:
✅ Estados intermedios de picking
✅ Picking con override exitoso
✅ Múltiples almacenistas simultáneamente
✅ Validación de cambio de estado (pending → in progress)
✅ Registro de ubicación real en audit trail
```

---

### GRUPO 3: 8 Órdenes COMPLETADA (🟢 Estado: Picking Confirmado)

```
┌─────────┬─────────────┬────────┬──────────────┬───────────┬──────────────────────┐
│ ORD ID  │ FOLIO       │ ITEMS  │ % OVERRIDE   │ ALMACENISTA │ DESCRIPCIÓN          │
├─────────┼─────────────┼────────┼──────────────┼───────────┼──────────────────────┤
│ ORD#23  │ ORD-0023    │ 4      │ 0%           │ Juan      │ Completada OK        │
│ ORD#24  │ ORD-0024    │ 3      │ 67%          │ María     │ 2 items override     │
│ ORD#25  │ ORD-0025    │ 4      │ 50%          │ Carlos    │ 2 items override     │
│ ORD#26  │ ORD-0026    │ 3      │ 0%           │ Ana       │ Completada OK        │
│ ORD#27  │ ORD-0027    │ 4      │ 100%         │ Luis      │ 4 items override     │
│ ORD#28  │ ORD-0028    │ 3      │ 33%          │ Sofia     │ 1 item override      │
│ ORD#29  │ ORD-0029    │ 4      │ 25%          │ Juan      │ 1 item override      │
│ ORD#30  │ ORD-0030    │ 3      │ 0%           │ María     │ Completada OK        │
├─────────┼─────────────┼────────┼──────────────┼───────────┼──────────────────────┤
│ TOTAL   │ -           │ 28-30  │ ~50%         │ -         │ Completadas, varios overrides │
└─────────┴─────────────┴────────┴──────────────┴───────────┴──────────────────────┘

ESTADO: Completada
ESTADO DB: estado_id = (SELECT id FROM estados_orden WHERE nombre='Completada')
estante_real_id: Siempre presente (~50% ≠ estante_sugerido_id)
cantidad_surtida: = cantidad_requerida
fue_modificado: true/false según override
detalles_surtido_ubicaciones: Registradas para audit trail completo

ESCENARIOS DE OVERRIDE CRÍTICO EN ESTE GRUPO:
├─ ORD#24: 2 items override (María: C-02-31→C-02-32, B-03-21→B-03-22)
├─ ORD#25: 2 items override (Carlos: A-01-11→A-01-12, D-04-41→D-04-42)
├─ ORD#27: 4 items override (Luis: TODOS los items desde ubicaciones diferentes)
│          Caso límite: validar que sistema registra todo correctamente
├─ ORD#28: 1 item override (Sofia: E-05-44→E-05-45)
└─ ORD#29: 1 item override (Juan: F-06-51→F-06-52)

AUDITORÍA COMPLETA:
Cada detalle con override tiene registro en detalles_surtido_ubicaciones:
└─ detalle_id
   ├─ estante_id (ubicación real)
   ├─ cantidad_tomada (cantidad surtida real)
   ├─ user_id (almacenista que realizó pick)
   └─ created_at (timestamp de ejecución)

COBERTURA:
✅ Órdenes completadas sin override (caso éxito)
✅ Órdenes completadas con override (caso real)
✅ Caso límite: 100% override (ORD#27 - verificar integridad)
✅ Audit trail en detalles_surtido_ubicaciones
✅ Validación de cambio de estado (in progress → completed)
✅ Integridad de datos en transición de estados
```

---

## 🔍 Matriz de Cobertura de Casos

```
CASO DE PRUEBA                              | ÓRDENES INCLUIDAS        | VALIDACIÓN
────────────────────────────────────────────────────────────────────────────────
Picking sin complicaciones                  │ ORD#01-10, ORD#11,13,14  │ ✅ 14 órdenes
                                            │ ,16,18,20,22,23,26,30   │ (normal flow)
────────────────────────────────────────────────────────────────────────────────
Picking con 1 item override                 │ ORD#12, #17, #21, #28   │ ✅ 4 órdenes
                                            │ ,#29                    │ (edge case)
────────────────────────────────────────────────────────────────────────────────
Picking con 2+ items override               │ ORD#15, #19, #24, #25   │ ✅ 4 órdenes
                                            │                         │ (complex)
────────────────────────────────────────────────────────────────────────────────
Picking con 100% override (todos items)     │ ORD#27                  │ ✅ 1 orden
                                            │                         │ (límite)
────────────────────────────────────────────────────────────────────────────────
Estados Pendiente                           │ ORD#01-10               │ ✅ 10 órdenes
                                            │                         │ (inicio)
────────────────────────────────────────────────────────────────────────────────
Estados En Progreso                         │ ORD#11-22               │ ✅ 12 órdenes
                                            │                         │ (transición)
────────────────────────────────────────────────────────────────────────────────
Estados Completada                          │ ORD#23-30               │ ✅ 8 órdenes
                                            │                         │ (final)
────────────────────────────────────────────────────────────────────────────────
Diferentes prioridades                      │ Todas (distribuida)     │ ✅ Alta, Media,
                                            │                         │    Baja, Urgente
────────────────────────────────────────────────────────────────────────────────
Diferentes almacenistas                     │ Todas (asignación       │ ✅ Juan, María,
                                            │ aleatoria)              │    Carlos, Ana,
                                            │                         │    Luis, Sofia
────────────────────────────────────────────────────────────────────────────────
Múltiples ubicaciones por producto          │ Todas                   │ ✅ 3-5 ubicaciones
                                            │                         │    por producto
────────────────────────────────────────────────────────────────────────────────
Audit trail en overrides                    │ ORD#12,15,17,19,21,24   │ ✅ ~15-20
                                            │ ,25,27,28,29            │    detalles
────────────────────────────────────────────────────────────────────────────────
```

---

## 📊 Estadísticas de Generación

### Totales por Categoría

| Métrica | Cantidad | Notas |
|---------|----------|-------|
| **Órdenes Totales** | 30 | 10 Pendiente + 12 En Progreso + 8 Completada |
| **Detalles de Picking** | ~105 | 3-4 detalles × 30 órdenes |
| **Detalles sin Override** | ~85 | estante_real_id = estante_sugerido_id |
| **Detalles con Override** | ~15-20 | estante_real_id ≠ estante_sugerido_id |
| **% Override** | 14-19% | Realista para ambiente de almacén |
| **Almacenistas Asignados** | 6 | Distribución aleatoria |
| **Prioridades Asignadas** | 4 | ALTA, MEDIA, BAJA, URGENTE |
| **Productos Únicos** | ~20-25 | (reutilizados en múltiples órdenes) |
| **Ubicaciones Totales** | 120-150 | De LocationSeeder expandido |
| **Registros Auditoría** | ~15-20 | En detalles_surtido_ubicaciones |

---

## 🚀 Cómo Verificar los Datos

### Query 1: Ver todas las órdenes

```sql
SELECT 
    os.id, os.folio, eo.nombre AS estado, 
    pp.nombre AS prioridad, u.name AS almacenista,
    COUNT(ds.id) AS total_detalles
FROM ordenes_surtido os
JOIN estados_orden eo ON os.estado_id = eo.id
JOIN prioridades_orden pp ON os.prioridad_id = pp.id
LEFT JOIN users u ON os.almacenista_id = u.id
LEFT JOIN detalles_surtido ds ON os.id = ds.orden_surtido_id
GROUP BY os.id, os.folio, eo.nombre, pp.nombre, u.name
ORDER BY os.id;
```

### Query 2: Contar overrides

```sql
SELECT 
    COUNT(*) AS total_detalles,
    SUM(CASE WHEN fue_modificado = true THEN 1 ELSE 0 END) AS detalles_override,
    ROUND(100.0 * SUM(CASE WHEN fue_modificado = true THEN 1 ELSE 0 END) / COUNT(*), 2) AS porcentaje_override
FROM detalles_surtido;
```

### Query 3: Detalles de una orden específica

```sql
SELECT 
    ds.id, p.sku, p.nombre,
    ds.cantidad_requerida, ds.cantidad_surtida,
    e1.codigo_etiqueta AS estante_sugerido,
    e2.codigo_etiqueta AS estante_real,
    ds.fue_modificado
FROM detalles_surtido ds
JOIN ordenes_surtido os ON ds.orden_surtido_id = os.id
JOIN productos p ON ds.producto_id = p.id
LEFT JOIN estantes e1 ON ds.estante_sugerido_id = e1.id
LEFT JOIN estantes e2 ON ds.estante_real_id = e2.id
WHERE os.folio = 'ORD-0015'
ORDER BY ds.id;
```

### Query 4: Auditoría de picking

```sql
SELECT 
    dsu.id,
    ds.id AS detalle_id,
    p.sku,
    e.codigo_etiqueta,
    dsu.cantidad_tomada,
    u.name AS almacenista,
    dsu.created_at
FROM detalles_surtido_ubicaciones dsu
JOIN detalles_surtido ds ON dsu.detalle_surtido_id = ds.id
JOIN productos p ON ds.producto_id = p.id
JOIN estantes e ON dsu.estante_id = e.id
JOIN users u ON dsu.user_id = u.id
ORDER BY dsu.created_at DESC
LIMIT 20;
```

---

## 🧪 Casos de Test Recomendados

### Test Suite 1: Visualización de Órdenes

```
✅ Listar 30 órdenes en dashboard
✅ Filtrar por estado (Pendiente: 10, En Progreso: 12, Completada: 8)
✅ Filtrar por prioridad
✅ Filtrar por almacenista
✅ Ordenar por fecha requerida
✅ Paginación (10 por página)
```

### Test Suite 2: Motor de Picking

```
✅ Obtener detalles de orden pendiente (ORD#01)
✅ Sugerir ubicación óptima para cada detalle
✅ Validar que hay 3-5 opciones de ubicación
✅ Seleccionar ubicación sugerida
✅ Validar integración con inventarios
```

### Test Suite 3: Override y Auditoría

```
✅ Almacenista escanea ubicación diferente (ORD#12: C-02-31→C-02-32)
✅ Sistema registra override en fue_modificado
✅ Sistema registra estante_real_id correcto
✅ Sistema crea audit en detalles_surtido_ubicaciones
✅ Validar permanencia de datos en múltiples transacciones
```

### Test Suite 4: Múltiples Ubicaciones

```
✅ Verificar que producto SKU-001 tiene 3-5 ubicaciones
✅ Motor de picking elige la óptima
✅ Almacenista puede ver alternativas
✅ Override permite cambiar ubicación
✅ Inventario se deduce correctamente de ubicación real
```

### Test Suite 5: Estados y Transiciones

```
✅ Orden en Pendiente (no tiene estante_real_id)
✅ Transicionar a En Progreso (comienza a tener estante_real_id)
✅ Transicionar a Completada (todos detalles confirmados)
✅ Validar que cantidad_surtida = cantidad_requerida en completadas
```

---

## 📌 Notas Finales

### Acerca de los Datos

1. **Determinísticos pero Variables**
   - Cada ejecución genera diferentes asignaciones
   - Use `DB::seed('DatabaseSeeder')` para regenerar
   - Para reproducibilidad, agregue seed a Random

2. **Realismo**
   - ~15-20% override es porcentaje realista en almacenes
   - 6 almacenistas es equipo típico para este volumen
   - 30 órdenes/día es normal para testing masivo

3. **Integridad**
   - Todas las FK respetadas
   - Cascadas de eliminación funcionales
   - Unique constraints en folios, SKUs, etc.

### Próximas Mejoras

- [ ] Agregar casos de stock insuficiente
- [ ] Incluir devoluciones de picking fallido
- [ ] Registrar tiempos de picking
- [ ] Distribuir órdenes por ventana temporal
- [ ] Agregar órdenes parciales (split picking)

---

*Especificación de 30 Escenarios de Picking - OrganiRack Plus*  
*Última actualización: 01/04/2026*  
*Estado: ✅ Completo y verificado*
