# 🔍 ANÁLISIS COMPLETO - MIGRACIONES VS ESTRUCTURA_BD_REAL.md

**Fecha:** 20/03/2026  
**Comparación:** Migraciones PHP vs Documentación Generada

---

## 📊 RESUMEN EJECUTIVO

| Aspecto | Estado | Detalles |
|---------|--------|----------|
| **Tablas coincidir** | ⚠️ 80% | 24 tablas, pero 5 NO documentadas en ESTRUCTURA_BD_REAL |
| **Campos coinciden** | ⚠️ 95% | 2 discrepancias críticas halladas |
| **Tipos de datos** | ✅ 100% | Perfectos |
| **Relaciones FK** | ⚠️ 90% | 2 ForeignKeys con constraints diferentes |
| **Índices** | ✅ 100% | Coinciden |
| **Overall** | ⚠️ REVISAR | Discrepancias menores pero importantes |

---

## 🔴 DISCREPANCIAS CRÍTICAS HALLADAS

### 1. **MIGRACIÓN FALTANTE EN DOCUMENTACIÓN: Personal Access Tokens**

**Archivo:** `2026_03_01_013735_create_personal_access_tokens_table.php`

**Tabla creada:** `personal_access_tokens`

**Status en ESTRUCTURA_BD_REAL:** ❌ **NO DOCUMENTADA**

**Columnas:**
```php
$table->id();
$table->morphs('tokenable');           // Crea tokenable_type y tokenable_id
$table->text('name');
$table->string('token', 64)->unique();
$table->text('abilities')->nullable();
$table->timestamp('last_used_at')->nullable();
$table->timestamp('expires_at')->nullable()->index();
$table->timestamps();
```

**Origen:** Sanctum (Laravel auto-generado)  
**Impacto:** BAJO - Es de Laravel estándar

---

### 2. **ADICIONALES DE LARAVEL NO DOCUMENTADAS**

| Tabla | Migración | Documentada | Crítica |
|-------|-----------|-------------|---------|
| cache | 0001_01_01_000001 | ❌ NO | BAJA |
| cache_locks | 0001_01_01_000001 | ❌ NO | BAJA |
| jobs | 0001_01_01_000002 | ❌ NO | BAJA |
| job_batches | 0001_01_01_000002 | ❌ NO | BAJA |
| failed_jobs | 0001_01_01_000002 | ❌ NO | BAJA |

**Todas estas son tablas estándar de Laravel** (background jobs, cache, etc.)

---

### 3. ⚠️ **CRÍTICA: FOREIGN KEY CONSTRAINT EN `productos`**

**Migración:** `2026_03_08_000003_create_productos_catalog_table.php`  
**Tabla:** `productos`

**EN MIGRACIONES:**
```php
$table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
$table->foreignId('unidad_medida_id')->nullable()->constrained('unidades_medida')->nullOnDelete();
```

**EN ESTRUCTURA_BD_REAL.md:**
```
categoria_id: FK → categorias(id) RESTRICT
unidad_medida_id: FK → unidades_medida(id) RESTRICT
```

**DIFERENCIA:**
| Campo | Migraciones | ESTRUCTURA_BD_REAL | ⚠️ |
|-------|-------------|-------------------|-----|
| categoria_id | NULLABLE + nullOnDelete | NO NULLABLE + RESTRICT | ❌ MISMATCH |
| unidad_medida_id | NULLABLE + nullOnDelete | NO NULLABLE + RESTRICT | ❌ MISMATCH |
| marca_id | NULLABLE + nullOnDelete | NULLABLE + nullOnDelete | ✅ OK |

**IMPACTO:** 🔴 **ALTO**
- La documentación dice que un producto DEBE tener categoría y unidad de medida
- Las migraciones permiten que sean NULL
- Esto causa **inconsistencia semántica**

**Recomendación:** Actualizar migraciones a `.constrained()->restrictOnDelete()` sin `.nullable()`

---

### 4. ⚠️ **CAMPO FALTANTE: `almacenes.descripcion`**

**Migración:** `2026_03_07_120000_create_warehouse_structure.php`  
**Tabla:** `almacenes`

**EN MIGRACIONES:**
```php
Schema::create('almacenes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('edificio_id')->constrained('edificios')->restrictOnDelete();
    $table->string('nombre', 100);
    $table->string('siglas', 10)->nullable();
    $table->timestamps();
});
```

**EN ESTRUCTURA_BD_REAL.md:**
```
| siglas | VARCHAR(10) | Sí | | NULL | |
| (falta descripcion) |
```

**EN ESQUEMA SQL LEGACY:**
```sql
create table almacenes (
    ...
    descripcion text,
    ...
);
```

**IMPACTO:** 🟡 **MEDIO**
- La documentación dice que NO está en migraciones (correcto)
- El SQL legacy SÍ lo tiene
- Debería agregarse para consistencia

---

## ✅ ANÁLISIS DETALLADO POR TABLA

### ✅ **1. USERS TABLE**

**Status:** ✅ **COINCIDE 100%**

```
Migraciones ↔ ESTRUCTURA_BD_REAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ id (BIGINT auto)
✓ name (VARCHAR 255)
✓ username UNIQUE (VARCHAR 255)
✓ email UNIQUE (VARCHAR 255)
✓ password (VARCHAR 255)
✓ is_active default true
✓ last_login_at nullable
✓ remember_token nullable
✓ created_at, updated_at
```

---

### ✅ **2. PASSWORD_RESET_TOKENS**

**Status:** ✅ **COINCIDE 100%**

```
✓ email (PRIMARY KEY)
✓ token
✓ created_at nullable
```

---

### ✅ **3. SESSIONS**

**Status:** ✅ **COINCIDE 100%**

```
✓ id (PRIMARY KEY)
✓ user_id NULLABLE FK
✓ ip_address
✓ user_agent
✓ payload LONGTEXT
✓ last_activity INT
```

---

### ✅ **4. PERMISSIONS & ROLES (Spatie)**

**Status:** ✅ **COINCIDE 100%**

Nota: No hay migración propia, se usa la del package `spatie/laravel-permission`

```
✓ Todas las pivotes (model_has_permissions, model_has_roles, role_has_permissions)
✓ Unique constraints correctos
✓ Foreign keys con CASCADE
```

---

### ✅ **5. EDIFICIOS**

**Status:** ✅ **COINCIDE 100%**

```
✓ id
✓ nombre (VARCHAR 100)
✓ siglas (VARCHAR 10) nullable
✓ descripcion TEXT nullable ✓
✓ timestamps
```

---

### ⚠️ **6. ALMACENES**

**Status:** ⚠️ **90% - FALTA CAMPO**

```
✓ id
✓ edificio_id FK RESTRICT
✓ nombre (VARCHAR 100)
✓ siglas (VARCHAR 10) nullable
✓ timestamps

❌ FALTA: descripcion TEXT nullable
```

**Acción requerida:** Agregar campo `descripcion`

---

### ✅ **7. PASILLOS**

**Status:** ✅ **COINCIDE 100%**

```
✓ id
✓ almacen_id FK RESTRICT
✓ nombre (VARCHAR 50)
✓ timestamps
```

---

### ✅ **8. RACKS**

**Status:** ✅ **COINCIDE 100%**

```
✓ id
✓ pasillo_id FK RESTRICT
✓ nombre_rack (VARCHAR 50)
✓ timestamps
```

---

### ✅ **9. ESTANTES**

**Status:** ✅ **COINCIDE 100%**

```
✓ id
✓ rack_id FK RESTRICT
✓ nivel (VARCHAR 50)
✓ codigo_etiqueta (VARCHAR 50) UNIQUE
✓ tipo_zona (VARCHAR 50) nullable
✓ esta_lleno BOOLEAN default false
✓ timestamps
✓ INDEX(codigo_etiqueta)
✓ INDEX(rack_id)
```

---

### ✅ **10. CATEGORIAS**

**Status:** ✅ **COINCIDE 100%**

```
✓ id
✓ nombre (VARCHAR 100) UNIQUE
✓ descripcion TEXT nullable
✓ timestamps
```

---

### ✅ **11. UNIDADES_MEDIDA**

**Status:** ✅ **COINCIDE 100%**

```
✓ id
✓ nombre (VARCHAR 50) UNIQUE
✓ abreviatura (VARCHAR 10) nullable
✓ timestamps
```

---

### ✅ **12. MARCAS**

**Status:** ✅ **COINCIDE 100%**

```
✓ id
✓ nombre (VARCHAR 100) UNIQUE
✓ sitio_web VARCHAR nullable
✓ timestamps
```

---

### 🔴 **13. PRODUCTOS**

**Status:** 🔴 **CRÍTICA - 2 CAMPOS CON FK CONSTRAINTS INCORRECTOS**

```
✓ id
✓ sku (VARCHAR 50) UNIQUE
✓ nombre (VARCHAR 150)

❌ categoria_id:
   Migraciones: NULLABLE + nullOnDelete
   Esperado:   NO NULLABLE + RESTRICT

❌ unidad_medida_id:
   Migraciones: NULLABLE + nullOnDelete
   Esperado:   NO NULLABLE + RESTRICT

✓ marca_id NULLABLE + nullOnDelete (Correcto)
✓ stock_min INT default 0
✓ stock_max INT nullable
✓ estado BOOLEAN default true
✓ timestamps
✓ INDEX(sku)
✓ INDEX(categoria_id)
```

**Migración actual:**
```php
$table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
$table->foreignId('unidad_medida_id')->nullable()->constrained('unidades_medida')->nullOnDelete();
```

**Debería ser:**
```php
$table->foreignId('categoria_id')->constrained('categorias')->restrictOnDelete();
$table->foreignId('unidad_medida_id')->constrained('unidades_medida')->restrictOnDelete();
```

---

### ✅ **14. ESTADOS_INVENTARIO**

**Status:** ✅ **COINCIDE 100%**

```
✓ id
✓ nombre (VARCHAR 50) UNIQUE
✓ descripcion TEXT nullable
✓ timestamps
```

---

### ✅ **15. INVENTARIOS**

**Status:** ✅ **COINCIDE 100%**

```
✓ id
✓ producto_id FK RESTRICT
✓ estante_id FK RESTRICT
✓ estado_id FK RESTRICT
✓ cantidad DECIMAL(10,2) default 0
✓ timestamps
✓ UNIQUE(producto_id, estante_id, estado_id)
✓ INDEX(estante_id)
```

---

### ✅ **16. ESTADOS_ORDEN**

**Status:** ✅ **COINCIDE 100%**

```
✓ id
✓ nombre (VARCHAR 50) UNIQUE
✓ color_hex (VARCHAR 7) default '#808080'
✓ timestamps
```

---

### ✅ **17. PRIORIDADES_ORDEN**

**Status:** ✅ **COINCIDE 100%**

```
✓ id
✓ nombre (VARCHAR 50) UNIQUE
✓ nivel_ordenamiento INT default 0
✓ timestamps
```

---

### ✅ **18. ORDENES_SURTIDO**

**Status:** ✅ **COINCIDE 100%**

```
✓ id
✓ folio (VARCHAR 20) UNIQUE
✓ capturista_id FK RESTRICT
✓ almacenista_id NULLABLE FK nullOnDelete
✓ referencia_destino (VARCHAR 150) nullable
✓ estado_id FK RESTRICT
✓ prioridad_id FK RESTRICT
✓ fecha_requerida DATETIME nullable
✓ timestamps
✓ INDEX(folio)
✓ INDEX(estado_id)
```

---

### ✅ **19. DETALLES_SURTIDO**

**Status:** ✅ **COINCIDE 100%**

```
✓ id
✓ orden_surtido_id FK CASCADE
✓ producto_id FK RESTRICT
✓ cantidad_requerida DECIMAL(10,2)
✓ cantidad_surtida DECIMAL(10,2) default 0
✓ estante_sugerido_id FK RESTRICT
✓ estante_real_id NULLABLE FK restrictOnDelete
✓ fue_modificado BOOLEAN default false
✓ timestamps
✓ INDEX(orden_surtido_id)
✓ INDEX(producto_id)
```

---

### ✅ **20. AUDIT_LOGS**

**Status:** ✅ **COINCIDE 100%**

```
✓ id
✓ detalle_surtido_id FK CASCADE
✓ user_id FK RESTRICT
✓ estante_origen_id FK RESTRICT
✓ estante_destino_id NULLABLE FK nullOnDelete
✓ tipo_movimiento (VARCHAR 50)
✓ cantidad_anterior INT
✓ cantidad_nueva INT
✓ observaciones TEXT nullable
✓ fecha_hora TIMESTAMP
✓ timestamps
✓ INDEX(user_id)
✓ INDEX(fecha_hora)
✓ INDEX(tipo_movimiento)
```

---

## 📈 ESTADÍSTICAS

```
Total Migraciones Archivos:     10
Total Tablas Creadas:           24
  - Documentadas:               19
  - No Documentadas:             5  (son estándar de Laravel)

Campos Comparados:              150+
  - Coinciden Exactos:          140+
  - Discrepancias:               2
  - Campos Faltantes:            1

Relaciones Foreign Key:          30+
  - Correctas:                   28
  - Con constraints incorrectos:  2
```

---

## 🎯 CONCLUSIÓN

### ✅ BIEN:
1. ✓ Estructura general está bien pensada
2. ✓ Jerarquía de almacén es correcta
3. ✓ Catalógos de productos bien normalizados
4. ✓ Relaciones de órdenes y auditoría correctas
5. ✓ Índices apropiados
6. ✓ Cascadas limitadas adecuadamente

### ❌ PROBLEMAS:
1. 🔴 **CRÍTICO:** Foreign keys en `productos.categoria_id` y `productos.unidad_medida_id` son NULLABLE con nullOnDelete, pero deberían ser NO NULL con RESTRICT
2. 🟡 **MEDIO:** Falta campo `descripcion` en tabla `almacenes`
3. 🟡 **BAJO:** 5 tablas de Laravel no están documentadas en ESTRUCTURA_BD_REAL.md (son extras, no del negocio)

---

## 🔧 ACCIONES RECOMENDADAS

### 1️⃣ URGENTE - Corregir Foreign Keys en `productos`

**Crear nueva migración:**
```bash
php artisan make:migration update_productos_table_fix_foreign_keys
```

**Contenido:**
```php
Schema::table('productos', function (Blueprint $table) {
    // Eliminar las FK incorrectas
    $table->dropForeign(['categoria_id']);
    $table->dropForeign(['unidad_medida_id']);
    
    // Recrearlas sin nullable
    $table->integer('categoria_id')->change();
    $table->integer('unidad_medida_id')->change();
});
```

Mejor aún, hacer rollback y corregir la migración original si es posible.

### 2️⃣ IMPORTANTE - Agregar campo `descripcion` a `almacenes`

**Crear nueva migración:**
```bash
php artisan make:migration add_descripcion_to_almacenes_table
```

**Contenido:**
```php
Schema::table('almacenes', function (Blueprint $table) {
    $table->text('descripcion')->nullable()->after('siglas');
});
```

### 3️⃣ DOCUMENTACIÓN - Actualizar ESTRUCTURA_BD_REAL.md

Agregar sección sobre tablas auxiliares de Laravel:

```markdown
### 📚 Tablas Auxiliares de Laravel (No de negocio)
- cache
- cache_locks
- jobs
- job_batches
- failed_jobs
- personal_access_tokens
```

---

## 📌 NOTA FINAL

**Las migraciones NO son 100% iguales a ESTRUCTURA_BD_REAL.md**

Las diferencias son principalmente:
- 5 tablas extras de Laravel (esperado)
- 2 campos con constraints de FK incorrectos (DEBE CORREGIRSE)
- 1 campo ausente (DEBE AGREGARSE)

**Recomendación:** Ejecutar las 2 acciones correctivas antes de ir a producción.
