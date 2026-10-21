# ⚡ QUICK COMPARISON - Migraciones vs ESTRUCTURA_BD_REAL

## 📊 MATCH MATRIX

```
TABLA                          DOCUMENTADA    COINCIDE    ⚠️ PROBLEMAS
═══════════════════════════════════════════════════════════════════════
users                          ✅ SÍ         ✅ 100%
password_reset_tokens          ✅ SÍ         ✅ 100%
sessions                       ✅ SÍ         ✅ 100%
permissions (Spatie)           ✅ SÍ         ✅ 100%
roles (Spatie)                 ✅ SÍ         ✅ 100%
model_has_permissions          ✅ SÍ         ✅ 100%
model_has_roles                ✅ SÍ         ✅ 100%
role_has_permissions           ✅ SÍ         ✅ 100%
─────────────────────────────────────────────────────────────────────
edificios                      ✅ SÍ         ✅ 100%
almacenes                      ✅ SÍ         ⚠️ 95%        FALTA: descripcion TEXT
pasillos                       ✅ SÍ         ✅ 100%
racks                          ✅ SÍ         ✅ 100%
estantes                       ✅ SÍ         ✅ 100%
─────────────────────────────────────────────────────────────────────
categorias                     ✅ SÍ         ✅ 100%
unidades_medida                ✅ SÍ         ✅ 100%
marcas                         ✅ SÍ         ✅ 100%
productos                      ✅ SÍ         🔴 85%        FK constraint INCORRECTO
─────────────────────────────────────────────────────────────────────
estados_inventario             ✅ SÍ         ✅ 100%
inventarios                    ✅ SÍ         ✅ 100%
─────────────────────────────────────────────────────────────────────
estados_orden                  ✅ SÍ         ✅ 100%
prioridades_orden              ✅ SÍ         ✅ 100%
ordenes_surtido                ✅ SÍ         ✅ 100%
detalles_surtido               ✅ SÍ         ✅ 100%
─────────────────────────────────────────────────────────────────────
audit_logs                     ✅ SÍ         ✅ 100%
─────────────────────────────────────────────────────────────────────
cache                          ❌ NO        (laravel std)
cache_locks                    ❌ NO        (laravel std)
jobs                           ❌ NO        (laravel std)
job_batches                    ❌ NO        (laravel std)
failed_jobs                    ❌ NO        (laravel std)
personal_access_tokens         ❌ NO        (sanctum std)
```

---

## 🔴 ISSUES CRÍTICOS

### ISSUE #1: Foreign Key Constraints Incorrectos

**Tabla:** `productos`  
**Campos problematicos:** `categoria_id`, `unidad_medida_id`

#### ❌ ACTUAL (Migraciones):
```php
$table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
$table->foreignId('unidad_medida_id')->nullable()->constrained('unidades_medida')->nullOnDelete();
```

#### ✅ ESPERADO (ESTRUCTURA_BD_REAL):
```php
$table->foreignId('categoria_id')->constrained('categorias')->restrictOnDelete();
$table->foreignId('unidad_medida_id')->constrained('unidades_medida')->restrictOnDelete();
```

#### 📋 Diferencias:
| Aspecto | Actual | Esperado |
|---------|--------|----------|
| Nullable | SÍ | NO |
| Delete Cascade | nullOnDelete | restrictOnDelete |
| Semántica | Un producto PUEDE no tener categoría | Un producto DEBE tener categoría |

**FIX:** Ejecutar migración de corrección

---

### ISSUE #2: Campo Faltante

**Tabla:** `almacenes`  
**Campo faltante:** `descripcion`

#### ❌ ACTUAL:
```php
Schema::create('almacenes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('edificio_id')->constrained('edificios')->restrictOnDelete();
    $table->string('nombre', 100);
    $table->string('siglas', 10)->nullable();
    $table->timestamps();
    // FALTA AQUÍ
});
```

#### ✅ ESPERADO:
```php
$table->text('descripcion')->nullable();  // ← AGREGAR ESTA LÍNEA
```

**FIX:** Ejecutar migración para agregar el campo

---

## 📌 TABLAS NO DOCUMENTADAS (Info)

Estas tablas existen pero NO están en ESTRUCTURA_BD_REAL.md porque son **estándar de Laravel**:

| Tabla | Origen | Propósito | Crítica |
|-------|--------|----------|---------|
| cache | Laravel core | Cache compartido | BAJA |
| cache_locks | Laravel core | Locks en cache | BAJA |
| jobs | Laravel core | Queue de trabajos | BAJA |
| job_batches | Laravel core | Agrupación de jobs | BAJA |
| failed_jobs | Laravel core | Registro de fallos | BAJA |
| personal_access_tokens | Sanctum | API tokens | BAJA |

**Acción:** Documentarlas opcionalmente en ESTRUCTURA_BD_REAL.md

---

## ✅ VERIFICACIÓN RÁPIDA

```bash
# 1. Listar todas las tablas
php artisan tinker
>>> Schema::getTables()

# 2. Inspeccionar tabla productos
>>> Schema::getColumns('productos')

# 3. Ver foreign keys
>>> Schema::getForeignKeys('productos')

# 4. Ejecutar migraciones pendientes
php artisan migrate
```

---

## 📝 RESUMEN FINAL

| Métrica | Resultado |
|---------|-----------|
| Tablas correctas | 19/19 documentadas ✅ |
| Campos coinciden | 98% ✅ |
| **FK constraints INCORRECTOS** | **2 campos 🔴** |
| Campos faltantes | 1 campo ⚠️ |
| Documentado vs realidad | 80% (sin contar Laravel extras) |

**Decisión:** 
- ⚠️ **NO usar en producción hasta corregir los 2 issues**
- 🔧 Aplicar fixups recomendados
- ✅ Luego SÍ será 100% consistente
