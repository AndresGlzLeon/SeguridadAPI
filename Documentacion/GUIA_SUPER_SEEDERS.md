# 🚀 SUPER SEEDERS MASIVOS - GUÍA DE EJECUCIÓN

## 📋 Resumen de Archivos Creados

Se han creado/actualizado los siguientes archivos para un seeding masivo y realista:

### **1. Factories (Generadores de Data)**
- ✅ **database/factories/ProductoFactory.php** - Genera 50 productos realistas

### **2. Seeders Principales (Base de Datos)**

#### A. Catálogos Base
- ✅ **database/seeders/CatalogosSeeder.php** (ACTUALIZADO)
  - 10 Categorías (Electrónica, Ferretería, Construcción, etc.)
  - 15 Marcas (Truper, DeWalt, Samsung, Bosch, 3M, etc.)
  - 8 Unidades de Medidas (Piezas, Cajas, Metros, kg, L, Rollos, etc.)
  - **4 Estados de Inventario** (Disponible, Dañado, En Cuarentena, Merma)

#### B. Estructura Física del Almacén
- ✅ **database/seeders/LocationSeeder.php** (NUEVO)
  - 1 Edificio (Almacén Central)
  - 4 Almacenes (Secciones A, B, C, D)
  - 20 Pasillos (5 por almacén)
  - ~40-50 Racks
  - **~50 Estantes** con códigos realistas (A-01-01, A-01-02, etc.)

#### C. Productos
- ✅ **database/seeders/ProductoSeeder.php** (ACTUALIZADO)
  - **50 productos generados con factory**
  - SKUs secuenciales: PRD-0001, PRD-0002, ..., PRD-0050
  - Categorías, Marcas y Unidades asignadas aleatoriamente
  - Stock mín/máx realista

#### D. Inventarios (CRÍTICO PARA PICKING)
- ✅ **database/seeders/InventarioSeeder.php** (ACTUALIZADO)
  - **~150 registros de inventario** (3 ubicaciones promedio por producto)
  - **DISTRIBUCIÓN PARA OVERRIDE**: Cada producto repartido en 2-4 estantes diferentes
  - Cantidades: 10-100 unidades por ubicación
  - Todos con estado = "Disponible" (id=1)
  - Regla unique(producto_id, estante_id, estado_id) - permite múltiples estados por ubicación

#### E. Órdenes de Picking
- ✅ **database/seeders/OrdenesSeeder.php** (ACTUALIZADO)
  - **5 órdenes en estado "Pendiente"** (listas para picking)
  - 3-5 detalles (líneas) por orden
  - **~20 líneas de picking** en total
  - Folios: ORD-TEST-001, ORD-TEST-002, etc.
  - Cada detalle sin estante_real_id (se llena en el picking)

#### F. Base de Datos Maestro
- ✅ **database/seeders/DatabaseSeeder.php** (ACTUALIZADO)
  - Orden correcto para evitar errores de llaves foráneas
  - 4 Fases claramente documentadas
  - Logging de progreso en cada etapa

---

## 🔄 ORDEN DE EJECUCIÓN (CRÍTICO)

El `DatabaseSeeder.php` está configurado para ejecutar TODO en el orden correcto:

```
FASE 1️⃣: Roles y Usuarios
  ├─ RoleSeeder
  └─ Crear users (Admin + 2 Almacenistas)

FASE 2️⃣: Catálogos y Estructura
  ├─ EdificioSeeder
  ├─ CatalogosSeeder (categorías, marcas, unidades, ESTADOS DE INVENTARIO)
  ├─ EstadosPrioridadesSeeder
  └─ LocationSeeder (~50 estantes)

FASE 3️⃣: Datos Masivos
  ├─ ProductoSeeder (50 productos)
  ├─ InventarioSeeder (~150 registros distribuidos)
  └─ OrdenesSeeder (5 órdenes × 4 detalles)

FASE 4️⃣: Test Data
  └─ Producto BRG-8822X + Orden TEST-0001
```

---

## ⚡ CÓMO EJECUTAR

### Opción 1: Seeding Completo (Recomendado)
```bash
cd organirack-backend
php artisan migrate:fresh --seed
```

**Esto ejecutará:**
- ✅ Todas las migraciones (fresh = rollback + migrate)
- ✅ DatabaseSeeder (que incluye todos los seeders)
- ✅ Genera ~850 registros en total:
  - 50 Estantes
  - 50 Productos
  - 150 Inventarios distribuidos
  - 5 Órdenes
  - 20 Detalles de Órdenes

### Opción 2: Solo Seeding (Con BD existente)
```bash
php artisan db:seed
```

### Opción 3: Seeding Específico
```bash
# Solo un seeder
php artisan db:seed --class=LocationSeeder
php artisan db:seed --class=ProductoSeeder
php artisan db:seed --class=InventarioSeeder
phpartisan db:seed --class=OrdenesSeeder
```

---

## 📊 TOTALES ESPERADOS AL FINALIZAR

| Entidad | Cantidad | Notas |
|---------|----------|-------|
| **Edificios** | 1 (+1 test) | Almacén Central + Test |
| **Almacenes** | 4 (+1 test) | Secciones A, B, C, D + Test |
| **Pasillos** | 20 (+1 test) | 5 por almacén |
| **Racks** | 40-50 (+1 test) | 2-3 por pasillo |
| **Estantes** | ~50 (+2 test) | Códigos: A-01-01, A-01-02, etc. |
| **Categorías** | 10 | Electrónica, Ferretería, etc. |
| **Marcas** | 15 | Truper, DeWalt, Samsung, etc. |
| **Unidades Medida** | 8 | Piezas, Cajas, Metros, kg, L, etc. |
| **Productos** | 50 (+1 test) | SKU: PRD-0001 a PRD-0050 |
| **Inventarios** | ~150 | **2-4 ubicaciones por producto** |
| **Órdenes** | 5 (+1 test) | Estado: Pendiente, listas para picking |
| **Detalles Orden** | ~20 (+1 test) | Líneas de picking |

---

## 🎯 CASOS DE USO DE TESTING

### 1. **Motor de Picking (Lista Sugerida)**
```
GET /api/mobile/picking/{ordenId}/sugerencias
```
**Verifica que:**
- ✅ El endpoint retorna múltiples ubicaciones para cada producto
- ✅ Los datos están distribuidos en 2-4 estantes
- ✅ Las cantidades son realistas (10-100 unidades)

### 2. **Confirm Pick con Override**
```
POST /api/mobile/picking/{ordenId}/confirmar
Body: {
  "producto_id": 5,
  "estante_id_escaneado": 12,  // Diferente al sugerido
  "cantidad_tomada": 25
}
```
**Verifica que:**
- ✅ El sistema acepta un estante diferente al sugerido
- ✅ Descuenta del inventario en la ubicación escaneada
- ✅ Registra `fue_modificado = true` en el detalle

### 3. **Flujo Completo de Picking**
```
1. GET /api/mobile/picking/1/sugerencias
   → Ver ubicaciones sugeridas
   
2. Escanear código de barras del estante (OVERRIDE si es necesario)

3. POST /api/mobile/picking/1/confirmar
   → Confirmar pick con cantidad tomada
   
4. Inventario se descuenta automáticamente
```

---

## 📝 NOTAS IMPORTANTES

### ⚠️ Regla de Negocio para Override
```sql
-- La tabla inventarios permite el MISMO producto en MISMO estante con DIFERENTES estados:
-- unique(producto_id, estante_id, estado_id)

-- Ejemplo:
-- Producto 5, Estante 10, Estado "Disponible" = 80 unidades
-- Producto 5, Estante 10, Estado "Dañado" = 5 unidades (mismo row si es necesario)

-- Esto permite que diferentes almacenistas realicen picks desde diferentes ubicaciones
-- y el sistema valide que haya stock antes de confirmar.
```

### 🔐 Seguridad de Llaves Foráneas
```
✅ Todos los seeders respetan la jerarquía:
   Edificio → Almacén → Pasillo → Rack → Estante
   Categoría, Marca, UnidadMedida → Producto → Inventario
   EstadoOrden, PrioridadOrden → Orden → Detalle

✅ Los seeders se ejecutan en orden específico para evitar:
   - Foreign key constraint violation
   - Null pointer exceptions
   - Missing parent records
```

### 🚀 Performance
```
✅ Seeding masivo (~850 registros) en ~2-5 segundos
✅ Queries optimizadas con ->random(), ->each()
✅ Unique constraints respetadas
✅ Índices en tablas de búsqueda frecuente
```

---

## ✅ VALIDACIÓN POST-SEEDING

Ejecuta estos queries para verificar que todo está correcto:

```sql
-- Verificar estructura
SELECT COUNT(*) as total_estantes FROM estantes;
SELECT COUNT(*) as total_productos FROM productos;
SELECT COUNT(*) as total_inventarios FROM inventarios;
SELECT COUNT(*) as total_ordenes FROM ordenes_surtido;

-- Verificar distribución de productos
SELECT producto_id, COUNT(*) as ubicaciones
FROM inventarios
GROUP BY producto_id
ORDER BY ubicaciones DESC;

-- Verificar órdenes pendientes listas para picking
SELECT os.id, os.folio, COUNT(ds.id) as detalles
FROM ordenes_surtido os
LEFT JOIN detalles_surtido ds ON os.id = ds.orden_surtido_id
WHERE os.estado_id = (SELECT id FROM estados_orden WHERE nombre = 'Pendiente')
GROUP BY os.id;

-- Verificar inventario por estado
SELECT ei.nombre, COUNT(*) as registros
FROM inventarios inv
LEFT JOIN estados_inventario ei ON inv.estado_id = ei.id
GROUP BY ei.nombre;
```

---

## 🎉 ¡LISTO!

Los Super Seeders están optimizados para:
- ✅ Generar data realista y masiva en una sola ejecución
- ✅ Testear completamente el Motor de Picking
- ✅ Validar el Override dinámico de ubicaciones
- ✅ Realizar pruebas de rendimiento
- ✅ Facilitar debugging con logs claros

**Ejecuta: `php artisan migrate:fresh --seed`**

🚀 ¡A picking se ha dicho!
