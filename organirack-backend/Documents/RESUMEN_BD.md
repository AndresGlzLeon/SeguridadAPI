# 🚀 RESUMEN RÁPIDO - ESTRUCTURA BD ORGANIRACK PLUS

**Para compartir con otra IA sin discrepancias**

---

## 📊 METADATA RÁPIDA

| Propiedad | Valor |
|-----------|-------|
| **BD Name** | OrganiRack |
| **Engine** | MySQL 8.0+ |
| **Framework** | Laravel 11 |
| **Total Tablas** | 24 |
| **Packages Utilizados** | spatie/laravel-permission |
| **Fecha Esquema** | 16/03/2026 |

---

## 📋 TABLAS POR MÓDULO

### 🔧 Sistema (3 tablas auto-Laravel)
- `users` - Usuarios del sistema
- `password_reset_tokens` - Tokens para reset de password
- `sessions` - Gestión de sesiones HTTP

### 🔐 Permisos & Roles (5 tablas - Spatie)
- `permissions` - Permisos disponibles
- `roles` - Roles del sistema  
- `model_has_permissions` - N:N User-Permission
- `model_has_roles` - N:N User-Role
- `role_has_permissions` - N:N Role-Permission

### 🏢 Infraestructura Almacén (5 tablas)
- `edificios` - Nivel 1 (edificios)
- `almacenes` - Nivel 2 (almacenes dentro de edificios)
- `pasillos` - Nivel 3 (pasillos dentro de almacenes)
- `racks` - Nivel 4 (racks dentro de pasillos)
- `estantes` - Nivel 5 (estantes/niveles dentro de racks) ⭐ NODO FINAL

### 🏷️ Catálogos Productos (5 tablas)
- `categorias` - Clasificación de productos
- `unidades_medida` - Unidades de medición (pz, kg, m, etc)
- `marcas` - Marcas/Fabricantes
- `productos` - Catálogo maestro
- `estados_inventario` - Estados posibles (Disponible, Dañado, Cuarentena, etc)

### 📦 Inventario (1 tabla pivote)
- `inventarios` - PIVOTE: Producto + Estante + Estado = Cantidad

### 📋 Órdenes de Surtido (4 tablas)
- `estados_orden` - Estados de ordenes (Pendiente, En Proceso, Completada)
- `prioridades_orden` - Prioridades (Baja, Normal, Alta, Urgente)
- `ordenes_surtido` - Cabecera de ordenes
- `detalles_surtido` - Items de cada orden

### 🔍 Auditoría (1 tabla)
- `audit_logs` - Registro inmutable de todos los movimientos

---

## 🔗 RELACIONES CLAVE

```
🧑 users
  ├─→ ordenes_surtido (capturista, almacenista)
  └─→ audit_logs

🏢 edificios
  └─→ almacenes
       └─→ pasillos
            └─→ racks
                 └─→ estantes ⭐ (punto de picking)
                      ├─→ inventarios
                      ├─→ detalles_surtido
                      └─→ audit_logs

🏷️ productos
  ├─→ categoria, unidad_medida, marca
  └─→ inventarios (cantidad por estante/estado)

📋 ordenes_surtido
  └─→ detalles_surtido
       └─→ audit_logs
```

---

## ⚠️ DISCREPANCIAS VS ESQUEMA LEGACY

| Tabla | Campo | Estado SQL | Estado Migraciones | ⚠️ Acción |
|-------|-------|------------|-------------------|----------|
| users | email_verified_at | ✓ Sí | ✗ No | SQL obsoleto |
| users | last_login_at | ✗ No | ✓ Sí | SQL incompleto |
| almacenes | descripcion | ✓ Sí | ✗ No | ⚠️ FALTA EN MIGRACIONES |

**CONCLUSIÓN:** Uses SIEMPRE las **migraciones Laravel** como fuente de verdad, NO el SQL legacy.

---

## 🎯 PUNTOS CRÍTICOS

1. **Estantes es el nodo final:** Aquí se hace el picking. Identificador único: `codigo_etiqueta`
2. **Inventario normalizado:** Un mismo producto puede tener varios registros en un estante (diferentes estados)
3. **Auditoría atómica:** Cada movimiento queda registrado en `audit_logs` (inmutable)
4. **Spatie Permission:** Control granular de acceso a través de roles y permisos
5. **Cascadas limitadas:** Solo en relaciones detail-header (detalles → ordenes)

---

## 📐 TIPOS DE DATOS

- **IDs:** `bigint unsigned auto_increment` (Laravel estándar)
- **Decimales:** `decimal(10,2)` para cantidades
- **Textos largos:** `text` para descripciones
- **Booleanos:** `boolean` (almacenado como 0/1)
- **Timestamps:** `timestamp` con defaults

---

## 🔐 ESTRATEGIA DE INTEGRIDAD

| Eliminación | Estrategia | Ejemplo |
|-------------|-----------|---------|
| Master | RESTRICT | No puedes eliminar un edificio si tiene almacenes |
| Details | CASCADE | Si eliminas una orden, se eliminan sus detalles |
| Optional | SET NULL | Si eliminas una marca, el producto queda sin marca |

---

## 📢 AL COMUNICAR CON OTRA IA

**Usa este documento como referencia** y cita:
- "Según `ESTRUCTURA_BD_REAL.md`..."
- "Según migraciones Laravel en `database/migrations/`..."
- "NOTA: No uses `esquema_legacy_organirack.sql` - está desactualizado"

---

**Para detalles completos,** ver: `ESTRUCTURA_BD_REAL.md` (documento exhaustivo con todas las columnas, índices y restricciones)

**Query SQL exactado,** copiar desde: `database/drafts/ESQUEMA_REAL_BD.sql`
