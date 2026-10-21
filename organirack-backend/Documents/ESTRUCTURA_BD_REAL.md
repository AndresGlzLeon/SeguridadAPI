# 📊 ESTRUCTURA REAL DE BASE DE DATOS - OrganiRack Plus

**Documento de Verdad (Single Source of Truth)**  
*Generado: 16/03/2026*  
*Basado en: Migraciones Laravel actuales*

---

## ⚠️ ADVERTENCIA IMPORTANTE

Este documento refleja la estructura **ACTUAL** definida en las migraciones Laravel.  
**NO es igual al esquema SQL borrador** - hay diferencias clave que se detallan abajo.

---

## 📋 INDICE DE TABLAS

### Sistema Laravel (Automático)
1. [users](#users)
2. [password_reset_tokens](#password_reset_tokens)
3. [sessions](#sessions)

### Spatie (Gestión de Permisos)
4. [permissions](#permissions)
5. [roles](#roles)
6. [model_has_permissions](#model_has_permissions)
7. [model_has_roles](#model_has_roles)
8. [role_has_permissions](#role_has_permissions)

### Estructura Física del Almacén
9. [edificios](#edificios)
10. [almacenes](#almacenes)
11. [pasillos](#pasillos)
12. [racks](#racks)
13. [estantes](#estantes)

### Catálogo de Productos
14. [categorias](#categorias)
15. [unidades_medida](#unidades_medida)
16. [marcas](#marcas)
17. [productos](#productos)

### Inventarios
18. [estados_inventario](#estados_inventario)
19. [inventarios](#inventarios)

### Órdenes de Surtido
20. [estados_orden](#estados_orden)
21. [prioridades_orden](#prioridades_orden)
22. [ordenes_surtido](#ordenes_surtido)
23. [detalles_surtido](#detalles_surtido)

### Auditoría
24. [audit_logs](#audit_logs)

---

## 📐 DETALLE DE TABLAS

### **users**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| name | VARCHAR(255) | No | | | |
| username | VARCHAR(255) | No | ✓ | | Ingreso por username |
| email | VARCHAR(255) | No | ✓ | | |
| password | VARCHAR(255) | No | | | |
| is_active | BOOLEAN | No | | true | Soft delete logic |
| last_login_at | TIMESTAMP | Sí | | NULL | ⚠️ NO está en esquema SQL |
| remember_token | VARCHAR(100) | Sí | | NULL | |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

**⚠️ DIFERENCIA CON SQL:** SQL tiene `email_verified_at`, migraciones tienen `last_login_at`

---

### **password_reset_tokens**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| email | VARCHAR(255) | No | ✓ | | PK |
| token | VARCHAR(255) | No | | | |
| created_at | TIMESTAMP | Sí | | NULL | |

---

### **sessions**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | VARCHAR(255) | No | ✓ | | PK |
| user_id | BIGINT | Sí | | NULL | FK → users(id) |
| ip_address | VARCHAR(45) | Sí | | NULL | |
| user_agent | TEXT | Sí | | NULL | |
| payload | LONGTEXT | No | | | |
| last_activity | INT | No | | | INDEX |

---

### **permissions** (Spatie)
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| name | VARCHAR(125) | No | | | UNIQUE(name, guard_name) |
| guard_name | VARCHAR(125) | No | | 'web' | |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

---

### **roles** (Spatie)
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| name | VARCHAR(125) | No | | | UNIQUE(name, guard_name) |
| guard_name | VARCHAR(125) | No | | 'web' | |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

---

### **model_has_permissions** (Spatie Pivote)
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| permission_id | BIGINT | No | | | PK(1), FK → permissions(id) CASCADE |
| model_type | VARCHAR(255) | No | | | PK(2) |
| model_id | BIGINT | No | | | PK(3), INDEX |

---

### **model_has_roles** (Spatie Pivote)
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| role_id | BIGINT | No | | | PK(1), FK → roles(id) CASCADE |
| model_type | VARCHAR(255) | No | | | PK(2) |
| model_id | BIGINT | No | | | PK(3), INDEX |

---

### **role_has_permissions** (Spatie Pivote)
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| permission_id | BIGINT | No | | | PK(1), FK → permissions(id) CASCADE |
| role_id | BIGINT | No | | | PK(2), FK → roles(id) CASCADE |

---

## 🏢 ESTRUCTURA FÍSICA DEL ALMACÉN

### **edificios**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| nombre | VARCHAR(100) | No | | | |
| siglas | VARCHAR(10) | Sí | | NULL | |
| descripcion | TEXT | Sí | | NULL | |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

---

### **almacenes**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| edificio_id | BIGINT | No | | | FK → edificios(id) RESTRICT |
| nombre | VARCHAR(100) | No | | | |
| siglas | VARCHAR(10) | Sí | | NULL | |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

**⚠️ DIFERENCIA CON SQL:** SQL tiene `descripcion text`, migraciones NO

---

### **pasillos**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| almacen_id | BIGINT | No | | | FK → almacenes(id) RESTRICT |
| nombre | VARCHAR(50) | No | | | |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

---

### **racks**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| pasillo_id | BIGINT | No | | | FK → pasillos(id) RESTRICT |
| nombre_rack | VARCHAR(50) | No | | | |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

---

### **estantes**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| rack_id | BIGINT | No | | | FK → racks(id) RESTRICT |
| nivel | VARCHAR(50) | No | | | |
| codigo_etiqueta | VARCHAR(50) | No | ✓ | | Identificador único del estante |
| tipo_zona | VARCHAR(50) | Sí | | NULL | |
| esta_lleno | BOOLEAN | No | | false | |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

**Índices:** codigo_etiqueta (UNIQUE), rack_id

---

## 🏷️ CATÁLOGO DE PRODUCTOS

### **categorias**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| nombre | VARCHAR(100) | No | ✓ | | |
| descripcion | TEXT | Sí | | NULL | |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

---

### **unidades_medida**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| nombre | VARCHAR(50) | No | ✓ | | Ej: piezas, metros, kg |
| abreviatura | VARCHAR(10) | Sí | | NULL | Ej: pz, m, kg |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

---

### **marcas**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| nombre | VARCHAR(100) | No | ✓ | | |
| sitio_web | VARCHAR(255) | Sí | | NULL | |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

---

### **productos**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| sku | VARCHAR(50) | No | ✓ | | Código único del producto |
| nombre | VARCHAR(150) | No | | | |
| categoria_id | BIGINT | No | | | FK → categorias(id) RESTRICT |
| unidad_medida_id | BIGINT | No | | | FK → unidades_medida(id) RESTRICT |
| marca_id | BIGINT | Sí | | NULL | FK → marcas(id) NULL ON DELETE |
| stock_min | INT | No | | 0 | Mínimo recomendado |
| stock_max | INT | Sí | | NULL | Máximo permitido |
| estado | BOOLEAN | No | | true | Activo/Inactivo |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

**Índices:** sku (UNIQUE), categoria_id

---

## 📦 INVENTARIOS

### **estados_inventario**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| nombre | VARCHAR(50) | No | ✓ | | Ej: Disponible, Dañado, Cuarentena |
| descripcion | TEXT | Sí | | NULL | |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

---

### **inventarios**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| producto_id | BIGINT | No | | | FK → productos(id) RESTRICT |
| estante_id | BIGINT | No | | | FK → estantes(id) RESTRICT |
| estado_id | BIGINT | No | | | FK → estados_inventario(id) RESTRICT |
| cantidad | DECIMAL(10,2) | No | | 0 | Cantidad en el estante con ese estado |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

**Constraint:** UNIQUE(producto_id, estante_id, estado_id) - Permite varios estados del mismo producto

---

## 📋 ÓRDENES DE SURTIDO

### **estados_orden**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| nombre | VARCHAR(50) | No | ✓ | | Ej: Pendiente, En Proceso, Completada |
| color_hex | VARCHAR(7) | No | | '#808080' | Para UI/reportes |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

---

### **prioridades_orden**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| nombre | VARCHAR(50) | No | ✓ | | Ej: Baja, Normal, Alta, Urgente |
| nivel_ordenamiento | INT | No | | 0 | Para sorting (menor = más prioritario) |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

---

### **ordenes_surtido**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| folio | VARCHAR(20) | No | ✓ | | Ej: ORD-2441, ORD-2442 |
| capturista_id | BIGINT | No | | | FK → users(id) RESTRICT - Quién crea |
| almacenista_id | BIGINT | Sí | | NULL | FK → users(id) NULL ON DELETE - Quién ejecuta |
| referencia_destino | VARCHAR(150) | Sí | | NULL | Cliente, departamento, destino |
| estado_id | BIGINT | No | | | FK → estados_orden(id) RESTRICT |
| prioridad_id | BIGINT | No | | | FK → prioridades_orden(id) RESTRICT |
| fecha_requerida | DATETIME | Sí | | NULL | Fecha límite de entrega |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

**Índices:** folio (UNIQUE), estado_id

---

### **detalles_surtido**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| orden_surtido_id | BIGINT | No | | | FK → ordenes_surtido(id) CASCADE |
| producto_id | BIGINT | No | | | FK → productos(id) RESTRICT |
| cantidad_requerida | DECIMAL(10,2) | No | | | Cantidad a surtir |
| cantidad_surtida | DECIMAL(10,2) | No | | 0 | Cantidad ya surtida |
| estante_sugerido_id | BIGINT | No | | | FK → estantes(id) RESTRICT - Pick location |
| estante_real_id | BIGINT | Sí | | NULL | FK → estantes(id) NULL ON DELETE - Actual |
| fue_modificado | BOOLEAN | No | | false | Si se cambió el estante sugerido |
| created_at | TIMESTAMP | No | | CURRENT | |
| updated_at | TIMESTAMP | No | | CURRENT | |

**Índices:** orden_surtido_id, producto_id

---

## 🔐 AUDITORÍA Y TRAZABILIDAD

### **audit_logs**
| Campo | Tipo | Null | Unique | Default | Notas |
|-------|------|------|--------|---------|-------|
| id | BIGINT | No | ✓ | auto | PK |
| detalle_surtido_id | BIGINT | No | | | FK → detalles_surtido(id) CASCADE |
| user_id | BIGINT | No | | | FK → users(id) RESTRICT - Quién hace el cambio |
| estante_origen_id | BIGINT | No | | | FK → estantes(id) RESTRICT |
| estante_destino_id | BIGINT | Sí | | NULL | FK → estantes(id) NULL ON DELETE |
| tipo_movimiento | VARCHAR(50) | No | | | 'picking', 'reconteo', 'ajuste', 'transferencia' |
| cantidad_anterior | INT | No | | | Estado previo |
| cantidad_nueva | INT | No | | | Estado actual |
| observaciones | TEXT | Sí | | NULL | Notas del movimiento |
| fecha_hora | TIMESTAMP | No | | CURRENT | Momento exacto del movimiento |
| created_at | TIMESTAMP | No | | CURRENT | Timestamp de auditoría |

**Índices:** user_id, fecha_hora, tipo_movimiento

---

## 🔗 DIAGRAMA DE RELACIONES

```
users
  ├─ 1:N → sessions (user_id)
  ├─ 1:N → ordenes_surtido (capturista_id)
  ├─ 1:N → ordenes_surtido (almacenista_id)
  ├─ 1:N → audit_logs (user_id)
  └─ N:N → roles (model_has_roles)
       └─ N:N → permissions (role_has_permissions)

edificios
  └─ 1:N → almacenes (edificio_id)
       └─ 1:N → pasillos (almacen_id)
            └─ 1:N → racks (pasillo_id)
                 └─ 1:N → estantes (rack_id)
                      ├─ 1:N → inventarios (estante_id)
                      ├─ 1:N → detalles_surtido (estante_sugerido_id)
                      ├─ 1:N → detalles_surtido (estante_real_id)
                      ├─ 1:N → audit_logs (estante_origen_id)
                      └─ 1:N → audit_logs (estante_destino_id)

categorias
  └─ 1:N → productos (categoria_id)

unidades_medida
  └─ 1:N → productos (unidad_medida_id)

marcas
  └─ 1:N → productos (marca_id, nullable)

productos
  ├─ 1:N → inventarios (producto_id)
  └─ 1:N → detalles_surtido (producto_id)

estados_inventario
  └─ 1:N → inventarios (estado_id)

ordenes_surtido
  ├─ 1:N → detalles_surtido (orden_surtido_id)
  └─ references users (capturista_id, almacenista_id)

estados_orden
  └─ 1:N → ordenes_surtido (estado_id)

prioridades_orden
  └─ 1:N → ordenes_surtido (prioridad_id)

detalles_surtido
  ├─ 1:N → audit_logs (detalle_surtido_id)
  └─ references estantes (sugerido y real)

permissions, roles, model_has_permissions, model_has_roles, role_has_permissions
  └─ Spatie Permission Package (gestión de acceso)
```

---

## ⚠️ DIFERENCIAS CRÍTICAS CON ESQUEMA SQL

### 1. **Campo `last_login_at` en users**
- **Migraciones actual:** ✓ Presente (nullable)
- **SQL borrador:** ✗ No incluido
- **Acción:** El SQL borrador está DESACTUALIZADO

### 2. **Campo `descripcion` en almacenes**
- **Migraciones actual:** ✗ NO incluido
- **SQL borrador:** ✓ Presente (text)
- **Acción:** Falta adicionarlo a migraciones

### 3. **Tablas auxiliares de Laravel**
- **Migraciones:** ✓ Incluye `password_reset_tokens`, `sessions`
- **SQL borrador:** ✗ No las incluye
- **Acción:** Son estándar de Laravel, pueden ignorarse en documentación de negocio

### 4. **Constrain en `detalles_surtido`**
- **Migraciones:** `cantidad_anterior`, `cantidad_nueva` son INT
- **SQL borrador:** También INT en `audit_logs`
- **Estado:** ✓ Alineados

---

## 🎯 RESUMEN EJECUTIVO

**Total de tablas:** 24  
**Relaciones N:N:** 4 (Spatie Permission)  
**Jerarquía almacén:** 5 niveles (edificio → almacén → pasillo → rack → estante)  
**Catálogos principales:** 5 (categorías, marcas, unidades, estados de inventario, estados de orden)  

### Estado Actual:
- ✅ **Estructura principal:** Alineada entre migraciones y SQL
- ⚠️ **Discrepancias:** 2 campos (last_login_at presence, descripcion absence en almacenes)
- 🔴 **Nota:** **Usa SIEMPRE las migraciones como fuente de verdad**, no el SQL borrador

---

## 📝 NOTAS DE IMPLEMENTACIÓN

1. **Triggers de auditoría:** Los `audit_logs` son grabados manualmente por código, no por triggers
2. **Soft deletes:** No se usan `deleted_at`, se usa `is_active` para users
3. **Enum-like:** `tipo_movimiento`, `estado` son VARCHAR, no ENUM (para flexibilidad)
4. **Cascadas:** Limitadas a relaciones detail-header (detalles_surtido → ordenes_surtido)
5. **Restricciones:** Usadas en relaciones master-detail para integridad referencial

---

**Versión del documento:** 1.0  
**Última actualización:** 16/03/2026  
**Fuente autorizada:** database/migrations/
