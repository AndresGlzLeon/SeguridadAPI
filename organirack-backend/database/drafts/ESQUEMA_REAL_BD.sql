-- ================================================
-- ESQUEMA REAL DE BASE DE DATOS - ORGANIRACK PLUS
-- ================================================
-- FUENTE DE VERDAD: Basado en las 14 migraciones Laravel actuales
-- FECHA: 07/04/2026
-- NOTA: Este esquema refleja la estructura REAL de la BD.
--       NO USES el esquema SQL borrador (esquema_legacy_organirack.sql)
-- ================================================

create database if not exists OrganiRack;
use OrganiRack;


-- ================================================
-- [1] TABLAS ESTÁNDAR DE LARAVEL
-- Generadas automáticamente por el framework.
-- No modificar manualmente.
-- ================================================

-- Tabla de usuarios (modificada respecto al scaffold por defecto de Laravel).
-- Se añadió: username para ingreso por ID, is_active para desactivar sin borrar
-- historial, y last_login_at para auditoría de acceso.
create table users (
    id              bigint unsigned auto_increment primary key,
    name            varchar(255)    not null,
    username        varchar(255)    not null unique,  -- Identificador de inicio de sesión
    email           varchar(255)    not null unique,
    password        varchar(255)    not null,
    is_active       boolean         not null default true,  -- Soft-disable: no borra historial
    last_login_at   timestamp       null,
    remember_token  varchar(100)    null,
    created_at      timestamp       null,
    updated_at      timestamp       null
);

-- Tokens temporales para el flujo de recuperación de contraseña por email.
-- Laravel los elimina automáticamente tras su uso o por expiración.
create table password_reset_tokens (
    email       varchar(255) not null primary key,
    token       varchar(255) not null,
    created_at  timestamp    null
);

-- Sesiones de usuario almacenadas en BD (driver: database).
-- Usada cuando SESSION_DRIVER=database en .env.
create table sessions (
    id            varchar(255) not null primary key,
    user_id       bigint unsigned null,
    ip_address    varchar(45)  null,
    user_agent    text         null,
    payload       longtext     not null,
    last_activity int          not null,
    index sessions_user_id_index (user_id),
    index sessions_last_activity_index (last_activity)
);


-- ================================================
-- [2] SISTEMA DE CACHÉ Y COLAS DE LARAVEL
-- Tablas internas del framework. No modificar.
-- ================================================

-- Cache del framework cuando CACHE_STORE=database.
-- Almacena pares clave-valor con fecha de expiración unix.
create table cache (
    `key`       varchar(255) not null primary key,
    value       mediumtext   not null,
    expiration  int          not null
);

-- Bloqueos atómicos de caché para operaciones concurrentes
-- (evita que dos procesos ejecuten el mismo job simultáneamente).
create table cache_locks (
    `key`       varchar(255) not null primary key,
    owner       varchar(255) not null,
    expiration  int          not null
);

-- Cola de trabajos pendientes de procesar (QUEUE_CONNECTION=database).
-- El worker de Laravel lee y ejecuta estas filas de forma asíncrona.
create table jobs (
    id           bigint unsigned auto_increment primary key,
    queue        varchar(255)      not null,
    payload      longtext          not null,
    attempts     tinyint unsigned  not null,
    reserved_at  int unsigned      null,
    available_at int unsigned      not null,
    created_at   int unsigned      not null,
    index jobs_queue_index (queue)
);

-- Lotes de trabajos (Bus::batch). Permite agrupar jobs y rastrear
-- su progreso colectivo (total, pendientes, fallidos).
create table job_batches (
    id            varchar(255) not null primary key,
    name          varchar(255) not null,
    total_jobs    int          not null,
    pending_jobs  int          not null,
    failed_jobs   int          not null,
    failed_job_ids longtext    not null,
    options       mediumtext   null,
    cancelled_at  int          null,
    created_at    int          not null,
    finished_at   int          null
);

-- Registro de jobs que fallaron tras agotar sus reintentos.
-- Permite diagnóstico y reintento manual con `php artisan queue:retry`.
create table failed_jobs (
    id          bigint unsigned auto_increment primary key,
    uuid        varchar(255) not null unique,
    connection  text         not null,
    queue       text         not null,
    payload     longtext     not null,
    exception   longtext     not null,
    failed_at   timestamp    not null default current_timestamp
);


-- ================================================
-- [3] LARAVEL SANCTUM — Autenticación API
-- Paquete: laravel/sanctum
-- Gestiona los tokens de acceso a la API REST.
-- Cada registro representa una sesión de API activa
-- de un modelo "tokenable" (normalmente User).
-- ================================================

create table personal_access_tokens (
    id              bigint unsigned auto_increment primary key,
    tokenable_type  varchar(255) not null,  -- Clase del modelo propietario (polimórfico)
    tokenable_id    bigint unsigned not null,
    name            text         not null,  -- Nombre descriptivo del token
    token           varchar(64)  not null unique,  -- Hash SHA-256 del token real
    abilities       text         null,  -- JSON: scopes/capacidades del token
    last_used_at    timestamp    null,
    expires_at      timestamp    null,
    created_at      timestamp    null,
    updated_at      timestamp    null,
    index personal_access_tokens_tokenable_type_tokenable_id_index (tokenable_type, tokenable_id),
    index personal_access_tokens_expires_at_index (expires_at)
);


-- ================================================
-- [4] SPATIE PERMISSION — Roles y Permisos (RBAC)
-- Paquete: spatie/laravel-permission
-- Implementa un sistema RBAC completo con soporte
-- polimórfico: cualquier modelo Eloquent puede tener
-- roles y/o permisos, no solo User.
-- Los permisos se cachean automáticamente para evitar
-- queries repetitivas en cada request.
-- ================================================

-- Permisos atómicos del sistema. Ej: 'ver-reportes', 'editar-producto'.
create table permissions (
    id          bigint unsigned auto_increment primary key,
    name        varchar(255) not null,
    guard_name  varchar(255) not null,
    created_at  timestamp    null,
    updated_at  timestamp    null,
    unique permissions_name_guard_name_unique (name, guard_name)
);

-- Roles de usuario. Ej: 'Administrador', 'Almacenista', 'Capturista'.
create table roles (
    id          bigint unsigned auto_increment primary key,
    name        varchar(255) not null,
    guard_name  varchar(255) not null,
    created_at  timestamp    null,
    updated_at  timestamp    null,
    unique roles_name_guard_name_unique (name, guard_name)
);

-- Pivot polimórfica: asigna permisos directamente a cualquier modelo.
create table model_has_permissions (
    permission_id  bigint unsigned not null,
    model_type     varchar(255)    not null,
    model_id       bigint unsigned not null,
    primary key (permission_id, model_id, model_type),
    foreign key (permission_id) references permissions(id) on delete cascade,
    index model_has_permissions_model_id_model_type_index (model_id, model_type)
);

-- Pivot polimórfica: asigna roles a cualquier modelo.
create table model_has_roles (
    role_id     bigint unsigned not null,
    model_type  varchar(255)    not null,
    model_id    bigint unsigned not null,
    primary key (role_id, model_id, model_type),
    foreign key (role_id) references roles(id) on delete cascade,
    index model_has_roles_model_id_model_type_index (model_id, model_type)
);

-- Pivot: asocia permisos a roles (muchos a muchos).
create table role_has_permissions (
    permission_id  bigint unsigned not null,
    role_id        bigint unsigned not null,
    primary key (permission_id, role_id),
    foreign key (permission_id) references permissions(id) on delete cascade,
    foreign key (role_id)        references roles(id)        on delete cascade
);


-- ================================================
-- [5] ESTRUCTURA FÍSICA DEL ALMACÉN
-- Jerarquía: almacenes → pasillos → racks → estantes
-- NOTA: La tabla 'edificios' fue eliminada del diseño
-- final. Los almacenes son ahora la raíz máxima.
-- ================================================

-- Raíz de la jerarquía física.
create table almacenes (
    id          bigint unsigned auto_increment primary key,
    nombre      varchar(100) not null,
    siglas      varchar(10)  null,
    created_at  timestamp    null,
    updated_at  timestamp    null
);

-- Pasillos dentro de un almacén.
create table pasillos (
    id          bigint unsigned auto_increment primary key,
    almacen_id  bigint unsigned not null,
    nombre      varchar(50)  not null,
    created_at  timestamp    null,
    updated_at  timestamp    null,
    foreign key (almacen_id) references almacenes(id) on delete restrict
);

-- Racks dentro de un pasillo.
create table racks (
    id          bigint unsigned auto_increment primary key,
    pasillo_id  bigint unsigned not null,
    nombre_rack varchar(50)  not null,
    created_at  timestamp    null,
    updated_at  timestamp    null,
    foreign key (pasillo_id) references pasillos(id) on delete restrict
);

-- Estantes / niveles. Nodo terminal de la jerarquía y unidad mínima de picking.
create table estantes (
    id              bigint unsigned auto_increment primary key,
    rack_id         bigint unsigned not null,
    nivel           varchar(50) not null,           -- Ej: A, B, C, 1, 2, 3
    codigo_etiqueta varchar(50) not null unique,    -- Código escaneable/imprimible
    tipo_zona       varchar(50) null,               -- Ej: Refrigeración, Frágil
    esta_lleno      boolean     not null default false,
    created_at      timestamp   null,
    updated_at      timestamp   null,
    foreign key (rack_id) references racks(id) on delete restrict,
    index estantes_codigo_etiqueta_index (codigo_etiqueta)
);


-- ================================================
-- [6] CATÁLOGOS DE PRODUCTOS
-- ================================================

create table categorias (
    id          bigint unsigned auto_increment primary key,
    nombre      varchar(100) not null unique,
    descripcion text         null,
    created_at  timestamp    null,
    updated_at  timestamp    null
);

create table unidades_medida (
    id           bigint unsigned auto_increment primary key,
    nombre       varchar(50) not null unique,
    abreviatura  varchar(10) null,
    created_at   timestamp   null,
    updated_at   timestamp   null
);

create table marcas (
    id          bigint unsigned auto_increment primary key,
    nombre      varchar(100) not null unique,
    sitio_web   varchar(255) null,
    created_at  timestamp    null,
    updated_at  timestamp    null
);

-- Catálogo maestro de productos.
-- NOTA: Las FK a catálogos son SET NULL (nullOnDelete):
-- si se elimina una categoría/marca/unidad, el campo queda NULL
-- pero el producto NO se elimina.
create table productos (
    id                bigint unsigned auto_increment primary key,
    sku               varchar(50)     not null unique,
    nombre            varchar(150)    not null,
    categoria_id      bigint unsigned null,  -- SET NULL si se elimina la categoría
    unidad_medida_id  bigint unsigned null,  -- SET NULL si se elimina la unidad
    marca_id          bigint unsigned null,  -- SET NULL si se elimina la marca
    stock_min         int             not null default 0,   -- Umbral mínimo de alerta
    stock_max         int             null,                 -- Umbral máximo de alerta
    estado            boolean         not null default true,
    created_at        timestamp       null,
    updated_at        timestamp       null,
    foreign key (categoria_id)     references categorias(id)     on delete set null,
    foreign key (unidad_medida_id) references unidades_medida(id) on delete set null,
    foreign key (marca_id)         references marcas(id)          on delete set null,
    index productos_sku_index (sku),
    index productos_categoria_id_index (categoria_id)
);


-- ================================================
-- [7] INVENTARIO
-- ================================================

-- Catálogo de estados cualitativos del stock.
-- Ejemplos: Disponible, Dañado, En Cuarentena, Merma.
create table estados_inventario (
    id          bigint unsigned auto_increment primary key,
    nombre      varchar(50) not null unique,
    descripcion text        null,
    created_at  timestamp   null,
    updated_at  timestamp   null
);

-- Tabla pivote tripartita: producto × estante × estado.
-- La constraint UNIQUE(producto_id, estante_id, estado_id) permite tener,
-- por ejemplo, 8 laptops "Disponibles" y 2 "Dañadas" en el mismo estante
-- como filas separadas sin violar la unicidad.
create table inventarios (
    id          bigint unsigned auto_increment primary key,
    producto_id bigint unsigned not null,
    estante_id  bigint unsigned not null,
    estado_id   bigint unsigned not null,
    cantidad    decimal(10, 2) not null default 0,
    created_at  timestamp      null,
    updated_at  timestamp      null,
    foreign key (producto_id) references productos(id)          on delete restrict,
    foreign key (estante_id)  references estantes(id)           on delete restrict,
    foreign key (estado_id)   references estados_inventario(id) on delete restrict,
    unique inventarios_producto_estante_estado_unique (producto_id, estante_id, estado_id)
);


-- ================================================
-- [8] ÓRDENES DE SURTIDO Y PICKING
-- ================================================

-- Catálogo de estados del ciclo de vida de una orden.
-- Ej: Pendiente, En Proceso, Completada, Cancelada.
create table estados_orden (
    id          bigint unsigned auto_increment primary key,
    nombre      varchar(50) not null unique,
    color_hex   varchar(7)  not null default '#808080',  -- Color para la UI
    created_at  timestamp   null,
    updated_at  timestamp   null
);

-- Catálogo de prioridades de órdenes.
-- Ej: Normal, Urgente, Crítico.
create table prioridades_orden (
    id                 bigint unsigned auto_increment primary key,
    nombre             varchar(50) not null unique,
    nivel_ordenamiento int         not null default 0,  -- Para ordenar listas en la UI
    created_at         timestamp   null,
    updated_at         timestamp   null
);

-- Cabecera de cada orden de surtido/picking.
-- Un capturista crea la orden; un almacenista la ejecuta.
create table ordenes_surtido (
    id                  bigint unsigned auto_increment primary key,
    folio               varchar(20)     not null unique,  -- Ej: ORD-2441
    capturista_id       bigint unsigned not null,
    almacenista_id      bigint unsigned null,             -- Asignado al ejecutar
    referencia_destino  varchar(150)    null,             -- Número de pedido, área, etc.
    estado_id           bigint unsigned not null,
    prioridad_id        bigint unsigned not null,
    fecha_requerida     datetime        null,             -- Fecha límite deseada
    created_at          timestamp       null,
    updated_at          timestamp       null,
    foreign key (capturista_id)  references users(id)           on delete restrict,
    foreign key (almacenista_id) references users(id)           on delete set null,
    foreign key (estado_id)      references estados_orden(id)   on delete restrict,
    foreign key (prioridad_id)   references prioridades_orden(id) on delete restrict,
    index ordenes_surtido_folio_index (folio),
    index ordenes_surtido_estado_id_index (estado_id)
);

-- Partidas de cada orden. Una fila por producto solicitado.
-- Registra la ubicación sugerida por el sistema y la ubicación real
-- si el almacenista tomó el producto de un estante diferente (override).
create table detalles_surtido (
    id                  bigint unsigned auto_increment primary key,
    orden_surtido_id    bigint unsigned not null,
    producto_id         bigint unsigned not null,
    cantidad_requerida  decimal(10, 2)  not null,
    cantidad_surtida    decimal(10, 2)  not null default 0,
    estante_sugerido_id bigint unsigned not null,  -- Sugerido por el sistema al crear la orden
    estante_real_id     bigint unsigned null,       -- Nulo hasta que el almacenista ejecute el pick
    fue_modificado      boolean         not null default false,  -- true si se usó un estante diferente
    created_at          timestamp       null,
    updated_at          timestamp       null,
    foreign key (orden_surtido_id)    references ordenes_surtido(id) on delete cascade,
    foreign key (producto_id)         references productos(id)        on delete restrict,
    foreign key (estante_sugerido_id) references estantes(id)         on delete restrict,
    foreign key (estante_real_id)     references estantes(id)         on delete restrict,
    index detalles_surtido_orden_surtido_id_index (orden_surtido_id),
    index detalles_surtido_producto_id_index (producto_id)
);

-- Registro granular de cada pick individual (multi-pick).
-- Una partida (detalle_surtido) puede generar N filas aquí si el producto
-- se recolectó de múltiples estantes. Permite trazabilidad completa:
-- quién tomó qué, cuándo y de dónde.
-- NOTA: No tiene updated_at por ser un registro inmutable de eventos.
create table detalles_surtido_ubicaciones (
    id                  bigint unsigned auto_increment primary key,
    detalle_surtido_id  bigint unsigned not null,
    estante_id          bigint unsigned not null,
    cantidad_tomada     decimal(10, 2)  not null,
    user_id             bigint unsigned not null,
    created_at          timestamp       not null default current_timestamp,
    foreign key (detalle_surtido_id) references detalles_surtido(id) on delete cascade,
    foreign key (estante_id)         references estantes(id)          on delete restrict,
    foreign key (user_id)            references users(id)             on delete restrict,
    index detalles_surtido_ubicaciones_detalle_id_index (detalle_surtido_id),
    index detalles_surtido_ubicaciones_estante_id_index (estante_id),
    index detalles_surtido_ubicaciones_user_id_index (user_id),
    index detalles_surtido_ubicaciones_created_at_index (created_at)
);


-- ================================================
-- [9] AUDITORÍA Y TRAZABILIDAD DE NEGOCIO
-- REQ-008: Registro inmutable de movimientos de inventario.
-- ================================================

-- Bitácora de movimientos de inventario con lógica de negocio específica.
-- Una fila por evento de movimiento (picking, ajuste, reconteo, etc.).
-- NOTAS DE DISEÑO:
--   · detalle_surtido_id es NULLABLE para soportar ajustes manuales sin orden formal.
--   · No incluye producto_id (se accede a él a través de detalle_surtido → producto).
--   · El multi-pick genera N filas para la misma orden desde estantes diferentes.
create table audit_logs (
    id                  bigint unsigned auto_increment primary key,
    detalle_surtido_id  bigint unsigned null,    -- NULL en ajustes manuales sin orden
    user_id             bigint unsigned not null,
    estante_origen_id   bigint unsigned not null,
    estante_destino_id  bigint unsigned null,    -- NULL si no hay destino (ej. mermas)
    tipo_movimiento     varchar(50)     not null,  -- 'picking', 'ajuste', 'reconteo', etc.
    cantidad_anterior   int             not null,
    cantidad_nueva      int             not null,
    observaciones       text            null,
    fecha_hora          timestamp       not null default current_timestamp,
    created_at          timestamp       null,
    updated_at          timestamp       null,
    foreign key (detalle_surtido_id)  references detalles_surtido(id) on delete cascade,
    foreign key (user_id)             references users(id)             on delete restrict,
    foreign key (estante_origen_id)   references estantes(id)          on delete restrict,
    foreign key (estante_destino_id)  references estantes(id)          on delete set null,
    index audit_logs_user_id_index (user_id),
    index audit_logs_fecha_hora_index (fecha_hora),
    index audit_logs_tipo_movimiento_index (tipo_movimiento)
);


-- ================================================
-- [10] SPATIE ACTIVITY LOG — Log genérico de modelos
-- Paquete: spatie/laravel-activitylog
-- A diferencia de audit_logs (que registra movimientos
-- de inventario con lógica de negocio propia), esta tabla
-- es un log genérico para cualquier modelo Eloquent que use
-- el trait LogsActivity. Captura automáticamente eventos
-- created/updated/deleted y almacena los atributos anteriores
-- y nuevos en JSON (columna properties).
-- Útil para auditar: cambios de configuración, gestión de
-- usuarios, modificación de catálogos, etc.
-- El nombre real de la tabla se configura en config/activitylog.php
-- (por defecto: 'activity_log').
-- ================================================

create table activity_log (
    id            bigint unsigned auto_increment primary key,
    log_name      varchar(255) null,             -- Canal/grupo del log (ej: 'default')
    description   text         not null,         -- Descripción legible del evento
    subject_type  varchar(255) null,             -- Clase del modelo afectado (polimórfico)
    subject_id    bigint unsigned null,           -- ID del modelo afectado
    event         varchar(255) null,             -- 'created', 'updated', 'deleted'
    causer_type   varchar(255) null,             -- Clase del modelo causante (ej: User)
    causer_id     bigint unsigned null,           -- ID del causante
    properties    json         null,             -- { "attributes": {...}, "old": {...} }
    batch_uuid    char(36)     null,             -- Agrupa eventos de una misma operación batch
    created_at    timestamp    null,
    updated_at    timestamp    null,
    index activity_log_log_name_index (log_name),
    index activity_log_subject_type_subject_id_index (subject_type, subject_id),
    index activity_log_causer_type_causer_id_index (causer_type, causer_id)
);
