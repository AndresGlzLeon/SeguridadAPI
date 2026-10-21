# 📋 Guía de Prueba: Picking con Múltiples Ubicaciones

## 1. Preparación del Entorno

### 1.1 Ejecutar Migración

Aplica la nueva migración a la base de datos:

```bash
cd organirack-backend
php artisan migrate
```

**Esperado:** Se crea la tabla `detalles_surtido_ubicaciones` con las siguientes columnas:
- `id` (primary key)
- `detalle_surtido_id` (foreign key → detalles_surtido)
- `estante_id` (foreign key → estantes)
- `cantidad_tomada` (decimal)
- `user_id` (foreign key → users)
- `created_at` (timestamp)
- Índices sobre: (detalle_surtido_id, estante_id, user_id, created_at)

**Validación:**

```bash
# En MySQL:
SHOW COLUMNS FROM detalles_surtido_ubicaciones;
SHOW INDEXES FROM detalles_surtido_ubicaciones;
```

---

## 2. Pruebas Unitarias

### 2.1 Ejecutar Suite de Tests

```bash
php artisan test tests/Feature/PickingMultipleLocationsTest.php
```

**Esperado:** 6 tests PASSED ✅

### Tests Incluidos:

1. **test_multiple_picks_accumulate_quantity**
   - ✅ Primer pick: 350 unidades → cantidad_surtida = 350
   - ✅ Segundo pick: 400 unidades → cantidad_surtida = 750 (ACUMULADO)
   - ✅ Tercer pick: 250 unidades → cantidad_surtida = 1000 (COMPLETO)
   - ✅ Se registran 3 ubicaciones en tabla pivot

2. **test_order_is_completed_automatically**
   - ✅ Orden pasa a estado COMPLETADA automáticamente
   - ✅ Sin necesidad de llamar validación manual

3. **test_full_traceability_of_picks**
   - ✅ 3 registros en tabla pivot con datos completos
   - ✅ Usuario, estante, cantidad y timestamp correctos

4. **test_calculate_accumulated_quantity_from_pivot**
   - ✅ Método `calcularCantidadSurtidaDesdeUbicaciones()` retorna valor acumulado
   - ✅ Coincide con `cantidad_surtida` actual

5. **test_insufficient_stock_throws_exception**
   - ✅ Suma de picks no puede exceder stock actual

---

## 3. Prueba Manual Interactiva

### 3.1 Ejecutar Comando de Testing

```bash
php artisan test:picking-multiple-locations
```

**Salida esperada:**

```
🚀 Iniciando prueba de picking con múltiples ubicaciones...

✅ Usuario creado: user@example.com (ID: 1)
✅ Producto creado: Producto XYZ (ID: 1)
✅ Estantes creados: A-01-01, A-02-01, B-01-01
✅ Orden creada: ORD-2025001 (ID: 1)
✅ Detalle de orden creado (Cantidad requerida: 1000)
✅ Inventarios creados (350 + 400 + 250 = 1000 total)

📍 Iniciando picks...

Pick #1: 350 unidades de A-01-01...
  └─ Cantidad acumulada: 350/1000
  └─ ¿Está completo? ❌ NO
  └─ Ubicaciones recolectadas: A-01-01

Pick #2: 400 unidades de A-02-01...
  └─ Cantidad acumulada: 750/1000
  └─ ¿Está completo? ❌ NO
  └─ Ubicación 1: A-01-01 (350 unidades)
  └─ Ubicación 2: A-02-01 (400 unidades)

Pick #3: 250 unidades de B-01-01 (completa la orden)...
  └─ Cantidad acumulada: 1000/1000
  └─ ¿Está completo? ✅ SÍ
  └─ ¿Orden completada? ✅ SÍ
  └─ Ubicación 1: A-01-01 (350 unidades)
  └─ Ubicación 2: A-02-01 (400 unidades)
  └─ Ubicación 3: B-01-01 (250 unidades)

✨ Verificación de datos en tabla pivot...

| # | Estante | Cantidad | Usuario | Fecha/Hora |
|---|---------|----------|---------|-----------|
| 1 | A-01-01 | 350 | user@example.com | 2025-03-31 14:30:45 |
| 2 | A-02-01 | 400 | user@example.com | 2025-03-31 14:30:46 |
| 3 | B-01-01 | 250 | user@example.com | 2025-03-31 14:30:47 |

🎉 Prueba completada exitosamente!
```

---

## 4. Pruebas con API Real

### 4.1 Obtener Órdenes Pendientes

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/mobile/picking/orders
```

**Respuesta esperada (NUEVA ESTRUCTURA):**

```json
{
  "success": true,
  "data": {
    "total": 1,
    "ordenes": [
      {
        "id": 1,
        "folio": "ORD-2025001",
        "estado": "Pendiente",
        "detalles": [
          {
            "id": 1,
            "cantidad_requerida": 1000,
            "cantidad_surtida": 0,
            "ubicaciones_recolectadas": [],
            "ubicaciones": []
          }
        ]
      }
    ]
  }
}
```

### 4.2 Confirmar Primer Pick

```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "producto_id": 1,
    "estante_id_escaneado": 1,
    "cantidad_tomada": 350
  }' \
  http://localhost:8000/api/mobile/picking/1/confirmar
```

**Respuesta esperada:**

```json
{
  "success": true,
  "data": {
    "detalle": {
      "id": 1,
      "cantidad_surtida": 350,
      "es_completo": false,
      "ubicaciones_recolectadas": [
        {
          "estante_id": 1,
          "estante_codigo": "A-01-01",
          "cantidad_tomada": 350,
          "usuario": "user@example.com",
          "timestamp": "2025-03-31T14:30:45Z"
        }
      ],
      "orden_estado": {
        "completa": false,
        "items_completos": 0,
        "items_totales": 1
      }
    }
  }
}
```

### 4.3 Confirmar Segundo Pick

```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "producto_id": 1,
    "estante_id_escaneado": 2,
    "cantidad_tomada": 400
  }' \
  http://localhost:8000/api/mobile/picking/1/confirmar
```

**Validar:**
- ✅ `cantidad_surtida` es 750 (350 + 400)
- ✅ `ubicaciones_recolectadas` tiene 2 elementos
- ✅ `orden_estado.completa` sigue siendo false

### 4.4 Confirmar Tercer Pick (Completa)

```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "producto_id": 1,
    "estante_id_escaneado": 3,
    "cantidad_tomada": 250
  }' \
  http://localhost:8000/api/mobile/picking/1/confirmar
```

**Validar:**
- ✅ `cantidad_surtida` es 1000 (350 + 400 + 250)
- ✅ `es_completo` es true
- ✅ `orden_estado.completa` es true (orden COMPLETADA)
- ✅ `ubicaciones_recolectadas` tiene 3 elementos

### 4.5 Obtener Órdenes Nuevamente

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/mobile/picking/orders
```

**Validar en respuesta:**
- ✅ Orden no aparece (o aparece con estado COMPLETADA)
- ✅ Si aparece, mostrar todas las 3 ubicaciones con datos de usuario

---

## 5. Validación de Base de Datos

### 5.1 Verificar Tabla `detalles_surtido`

```sql
SELECT 
    id,
    folio,
    cantidad_requerida,
    cantidad_surtida,
    estante_real_id
FROM detalles_surtido
WHERE id = 1;
```

**Esperado:**
```
id | cantidad_requerida | cantidad_surtida | estante_real_id
1  | 1000               | 1000             | 3 (último escaneado)
```

### 5.2 Verificar Tabla Pivot `detalles_surtido_ubicaciones`

```sql
SELECT 
    id,
    detalle_surtido_id,
    estante_id,
    cantidad_tomada,
    user_id,
    created_at
FROM detalles_surtido_ubicaciones
WHERE detalle_surtido_id = 1
ORDER BY created_at ASC;
```

**Esperado:**
```
id | detalle_surtido_id | estante_id | cantidad_tomada | user_id | created_at
1  | 1                  | 1          | 350             | 1       | 2025-03-31 14:30:45
2  | 1                  | 2          | 400             | 1       | 2025-03-31 14:30:46
3  | 1                  | 3          | 250             | 1       | 2025-03-31 14:30:47
```

### 5.3 Verificar Estado de Orden

```sql
SELECT 
    id,
    folio,
    estado_id,
    e.nombre AS estado_nombre
FROM ordenes_surtido os
JOIN estados_orden e ON os.estado_id = e.id
WHERE os.id = 1;
```

**Esperado:**
```
id | folio | estado_id | estado_nombre
1  | ORD-2025001 | 3 | COMPLETADA
```

---

## 6. Checklist Final de Validación

### ✅ Requisitos Cumplidos

- [ ] Migración ejecutada correctamente
- [ ] Tabla `detalles_surtido_ubicaciones` creada con todas las columnas
- [ ] Indices funcionando (verificar con EXPLAIN QUERY)
- [ ] Todos los 6 tests unitarios PASSED
- [ ] Comando `test:picking-multiple-locations` ejecuta sin errores
- [ ] API retorna respuestas con nueva estructura
- [ ] Cantidad se acumula correctamente (350 + 400 + 250 = 1000)
- [ ] Tabla pivot registra todos los picks correctamente
- [ ] Orden se marca como COMPLETADA automáticamente
- [ ] Trazabilidad completa de usuario, ubicación y timestamp

### ✅ Backward Compatibility

- [ ] Campo `estante_real_id` sigue siendo actualizado (para clientes legacy)
- [ ] Órdenes antiguas siguen funcionando (sin múltiples ubicaciones)
- [ ] Métodos antiguos no están deprecados

---

## 7. Próximos Pasos

### Frontend (React Native / Expo)

1. **Actualizar TypeScript Interfaces en `types/orders.ts`:**
   ```typescript
   export interface UbicacionRecolectada {
     estante_id: number;
     estante_codigo: string;
     cantidad_tomada: number;
     usuario: string;
     timestamp: string;
   }

   export interface DetalleSurtidoExtendido extends DetalleSurtido {
     ubicaciones_recolectadas: UbicacionRecolectada[];
     es_completo: boolean;
   }
   ```

2. **Actualizar componentes:**
   - `PickingProgressSection.tsx`: Mostrar historial de picks
   - `ProductDetailSection.tsx`: Mostrar múltiples ubicaciones
   - `PickConfirmButton.tsx`: Permitir seleccionar cantidad parcial

3. **Actualizar hooks:**
   - `usePicking.ts`: Manejo de respuesta con `ubicaciones_recolectadas`
   - `usePickingOrders.ts`: Mostrar historial de ubicaciones

---

## 8. Troubleshooting

### Error: "Column 'detalles_surtido_ubicaciones' doesn't exist"

**Solución:** Ejecutar migración nuevamente
```bash
php artisan migrate --refresh
php artisan migrate
```

### Error: "SQLSTATE[HY000]: General error: 1364"

**Problema:** Campo required sin valor
**Solución:** Verificar que `user_id` esté siendo set correctamente (auth()->id())

### Tests fallan por "No query results found"

**Solución:** Asegurar que factories están creando registros con relaciones correctas
```bash
php artisan tinker
# Listar usuarios:
User::all();
```

---

## 9. Métricas de Rendimiento

### Queries Optimizadas

Con eager loading implementado, el número de queries debería ser:

**ANTES:**
- `SELECT * FROM ordenes_surtido` (1 query)
- `SELECT * FROM detalles_surtido WHERE orden_id = ?` (N queries)
- `SELECT * FROM estantes WHERE id = ?` (N queries per detail)
- **Total: 1 + N + N = 1 + 2N queries**

**DESPUÉS (con implementación):**
- `SELECT * FROM ordenes_surtido WITH detalles.ubicaciones.estante.usuario` (1 query)
- **Total: 1 query** ✨

### Índices Creados

```sql
-- Estos se crean automáticamente en la migración
CREATE INDEX idx_detalle_surtido_ubicaciones_detalle_id 
  ON detalles_surtido_ubicaciones(detalle_surtido_id);

CREATE INDEX idx_detalle_surtido_ubicaciones_estante_id 
  ON detalles_surtido_ubicaciones(estante_id);

CREATE INDEX idx_detalle_surtido_ubicaciones_user_id 
  ON detalles_surtido_ubicaciones(user_id);

CREATE INDEX idx_detalle_surtido_ubicaciones_created_at 
  ON detalles_surtido_ubicaciones(created_at);
```

---

## 10. Documentación de Cambios (CHANGELOG)

### Version 2.0.0 - Multiple Locations Picking

**NEW:**
- ✅ Tabla `detalles_surtido_ubicaciones` para trazabilidad completa
- ✅ Acumulación de cantidad_surtida desde múltiples ubicaciones
- ✅ Auto-completación de órdenes cuando todos los detalles están completos
- ✅ Endpoint mejorado con `ubicaciones_recolectadas` en respuesta
- ✅ Método `validateAndUpdateOrderCompletion()` en PickingService

**MODIFIED:**
- 🔄 PickingService.confirmPick() - ahora acumula cantidades
- 🔄 MobilePickingController eager loading mejorado
- 🔄 DetalleSurtido con relaciones y helpers nuevos

**BACKWARD COMPATIBLE:**
- ✅ Campo `estante_real_id` aún se actualiza (legacy support)
- ✅ Órdenes antiguas siguen funcionando sin cambios

---

**📅 Fecha de Implementación:** 31 de Marzo de 2025
**✍️ Autor:** Sistema de Picking OrganiRack Plus
**🔖 Versión:** 2.0.0-multiple-locations
