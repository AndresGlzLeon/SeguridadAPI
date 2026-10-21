create database OrganiRack;
use OrganiRack;

-- ============================================
-- GESTIÓN DE USUARIOS, ROLES Y PERMISOS
-- (Laravel + Spatie/laravel-permission)
-- ============================================

create table users (
    id int auto_increment primary key,
    name varchar(255) not null,
    email varchar(255) unique not null,
    username varchar(50) unique not null,
    email_verified_at timestamp null,
    password varchar(255) not null,
    is_active boolean default true,
    remember_token varchar(100),
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);

create table roles (
    id int auto_increment primary key,
    name varchar(125) unique not null,
    guard_name varchar(125) default 'web',
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);

create table permissions (
    id int auto_increment primary key,
    name varchar(125) unique not null,
    guard_name varchar(125) default 'web',
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);

create table model_has_roles (
    role_id int not null,
    model_type varchar(255) not null,
    model_id bigint not null,
    primary key (role_id, model_id, model_type),
    foreign key (role_id) references roles(id) on delete cascade,
    index(model_id, model_type)
);

create table model_has_permissions (
    permission_id int not null,
    model_type varchar(255) not null,
    model_id bigint not null,
    primary key (permission_id, model_id, model_type),
    foreign key (permission_id) references permissions(id) on delete cascade,
    index(model_id, model_type)
);

create table role_has_permissions (
    permission_id int not null,
    role_id int not null,
    primary key (permission_id, role_id),
    foreign key (permission_id) references permissions(id) on delete cascade,
    foreign key (role_id) references roles(id) on delete cascade
);

-- ============================================
-- ESTRUCTURA FÍSICA DEL ALMACÉN
-- Nota: "edificios" es la raíz máxima de la jerarquía
-- ============================================

create table edificios (
    id int auto_increment primary key,
    nombre varchar(100) not null,
    siglas varchar(10),
    descripcion text,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);

create table almacenes (
    id int auto_increment primary key,
    edificio_id int not null,
    nombre varchar(100) not null,
    siglas varchar(10),
    descripcion text,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp,
    foreign key (edificio_id) references edificios(id) on delete restrict
);

create table pasillos (
    id int auto_increment primary key,
    almacen_id int not null,
    nombre varchar(50) not null,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp,
    foreign key (almacen_id) references almacenes(id) on delete restrict
);

create table racks (
    id int auto_increment primary key,
    pasillo_id int not null,
    nombre_rack varchar(50) not null,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp,
    foreign key (pasillo_id) references pasillos(id) on delete restrict
);

-- FUSIÓN: estantes + ubicaciones
-- El "Estante/Nivel" es el nodo FINAL con codigo_etiqueta único
create table estantes (
    id int auto_increment primary key,
    rack_id int not null,
    nivel varchar(50) not null,
    codigo_etiqueta varchar(50) unique not null,
    tipo_zona varchar(50),
    esta_lleno boolean default false,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp,
    foreign key (rack_id) references racks(id) on delete restrict,
    index(codigo_etiqueta),
    index(rack_id)
);

-- ============================================
-- CATÁLOGOS DE PRODUCTOS
-- ============================================

create table categorias (
    id int auto_increment primary key,
    nombre varchar(100) unique not null,
    descripcion text,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);

create table unidades_medida (
    id int auto_increment primary key,
    nombre varchar(50) unique not null,
    abreviatura varchar(10),
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);

create table marcas (
    id int auto_increment primary key,
    nombre varchar(100) unique not null,
    sitio_web varchar(255),
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);

create table productos (
    id int auto_increment primary key,
    categoria_id int not null,
    unidad_medida_id int not null,
    marca_id int,
    nombre varchar(150) not null,
    sku varchar(50) unique not null,
    stock_min int default 0,
    stock_max int,
    estado boolean default true,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp,
    foreign key (categoria_id) references categorias(id) on delete restrict,
    foreign key (unidad_medida_id) references unidades_medida(id) on delete restrict,
    foreign key (marca_id) references marcas(id) on delete set null,
    index(sku),
    index(categoria_id)
);

-- ============================================
-- INVENTARIOS
-- Tabla pivote: Producto + Estante = Cantidad Real
-- ============================================

create table estados_inventario (
    id int auto_increment primary key,
    nombre varchar(50) unique not null,
    descripcion text,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);

create table inventarios (
    id int auto_increment primary key,
    producto_id int not null,
    estante_id int not null,
    estado_id int not null,
    cantidad decimal(10, 2) not null default 0,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp,
    foreign key (producto_id) references productos(id) on delete cascade,
    foreign key (estante_id) references estantes(id) on delete cascade,
    foreign key (estado_id) references estados_inventario(id) on delete restrict,
    unique(producto_id, estante_id, estado_id),
    index(estante_id)
);

-- ============================================
-- ÓRDENES DE SURTIDO Y PICKING
-- ============================================

create table estados_orden (
    id int auto_increment primary key,
    nombre varchar(50) unique not null,
    color_hex varchar(7) default '#808080',
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);

create table prioridades_orden (
    id int auto_increment primary key,
    nombre varchar(50) unique not null,
    nivel_ordenamiento int default 0,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);

create table ordenes_surtido (
    id int auto_increment primary key,
    folio varchar(20) unique not null,
    capturista_id int not null,
    almacenista_id int,
    referencia_destino varchar(150),
    estado_id int not null,
    prioridad_id int not null,
    fecha_requerida datetime,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp,
    foreign key (capturista_id) references users(id) on delete restrict,
    foreign key (almacenista_id) references users(id) on delete set null,
    foreign key (estado_id) references estados_orden(id) on delete restrict,
    foreign key (prioridad_id) references prioridades_orden(id) on delete restrict,
    index(folio),
    index(estado_id)
);

create table detalles_surtido (
    id int auto_increment primary key,
    orden_surtido_id int not null,
    producto_id int not null,
    cantidad_requerida decimal(10, 2) not null,
    cantidad_surtida decimal(10, 2) default 0,
    estante_sugerido_id int not null,
    estante_real_id int,
    fue_modificado boolean default false,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp,
    foreign key (orden_surtido_id) references ordenes_surtido(id) on delete cascade,
    foreign key (producto_id) references productos(id) on delete restrict,
    foreign key (estante_sugerido_id) references estantes(id) on delete restrict,
    foreign key (estante_real_id) references estantes(id) on delete set null,
    index(orden_surtido_id),
    index(producto_id)
);

-- ============================================
-- AUDITORÍA Y TRAZABILIDAD (FUSIONADO)
-- Una tabla atómica para auditar TODO
-- REQ-008: Registro inmutable de movimientos
-- ============================================

create table audit_logs (
    id int auto_increment primary key,
    detalle_surtido_id int not null,
    user_id int not null,
    estante_origen_id int not null,
    estante_destino_id int,
    tipo_movimiento varchar(50) not null, -- 'picking', 'reconteo', 'ajuste', etc.
    cantidad_anterior int not null,
    cantidad_nueva int not null,
    observaciones text,
    fecha_hora timestamp default current_timestamp,
    created_at timestamp default current_timestamp,
    foreign key (detalle_surtido_id) references detalles_surtido(id) on delete cascade,
    foreign key (user_id) references users(id) on delete restrict,
    foreign key (estante_origen_id) references estantes(id) on delete restrict,
    foreign key (estante_destino_id) references estantes(id) on delete set null,
    index(user_id),
    index(fecha_hora),
    index(tipo_movimiento)
);