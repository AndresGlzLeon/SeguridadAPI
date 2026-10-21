1.- Análisis del Proyecto
Descripción de la Solución
OrganiRack+ es una solución de gestión logística híbrida (Web-Móvil) diseñada para
erradicar la brecha entre el inventario teórico y el físico. El sistema reemplaza las listas de
recolección estáticas por un flujo de Validación Dinámica en Tiempo Real.
A través de una aplicación móvil, el operario interactúa directamente con los "Nodos de
Inventario" (Producto + Ubicación exacta). La innovación radica en el mecanismo de
"Override de Ubicación": si el material no se encuentra en el rack sugerido, el sistema
permite al usuario validar la ubicación real mediante escaneo, activando una verificación
instantánea del API para asegurar que la salida de material afecte al nodo correcto. Esto
garantiza una fiabilidad del dato del 99% y optimiza los tiempos de surtido en entornos de
alta rotación.

Diagrama de Flujo del Proceso:

Requerimientos Funcionales Interfaz Web
3.1 Interfaz de Acceso (Login)
● RF1 (Gestión de Seguridad): El sistema debe validar credenciales mediante
Bcrypt y restringir menús según el rol (REQ-011, REQ-012); el Almacenista accede
a tareas y el Administrador al Dashboard.
● Objetivo del API (Auth): Emitir tokens de acceso vía Laravel Sanctum con hashing
SHA-256 y controlar la expiración forzada tras 15 minutos de inactividad (RNF-08,
RNF-09).
3.2 Panel de Control (Dashboard)
● RF2 (Monitoreo IRI): La interfaz debe calcular y mostrar el porcentaje de Exactitud
de Inventario (IRI) basándose en las validaciones exitosas vs. las discrepancias
reportadas (REQ-010).
● Objetivo del API (Analytics): Procesar agregaciones de datos en tiempo real para
que el Dashboard refleje cambios en el stock en un tiempo máximo de 2 segundos
sin recargar la página (REQ-007, RNF-03).
3.3 Gestión de Productos
● RF3 (Ubicaciones Dinámicas): El sistema debe permitir registrar un mismo SKU en
múltiples ubicaciones (estante, reserva, etc.) especificando la cantidad exacta en
cada nodo (REQ-002).
● Objetivo del API (Master Data): Gestionar el CRUD de productos asegurando que
la base de datos relacional esté normalizada para soportar el crecimiento
exponencial de registros (RNF-18).
3.4 Gestión de Surtidos
● RF4 (Control de Órdenes): El sistema debe administrar las órdenes de salida,
bloqueando transacciones si el código escaneado no coincide con la ubicación
asignada en la orden (REQ-004).
● Objetivo del API (Order Flow): Coordinar los estados de las órdenes
(Picking/Completado) asegurando que cualquier cambio se notifique al servidor con
una latencia menor a 750ms (RNF-01).
3.5 Picking Inteligente
● RF5 (Función Override): La interfaz móvil debe permitir la "Modificación de Origen"
cuando el operario detecte una realidad física distinta al sistema, emitiendo alertas
sensoriales ante errores (REQ-005, REQ-006).
● Objetivo del API (Override Logic): Resolver la verificación de existencias en
nuevas ubicaciones en menos de 500ms para no interrumpir el flujo operativo
(RNF-02).

3.6 Bitácora de Auditoría
● RF6 (Trazabilidad Inmutable): El sistema debe generar un Log automático de cada
movimiento que incluya ID de operario, timestamp, ubicación origen/destino y tipo de
movimiento (REQ-008).
● Objetivo del API (Kardex): Ejecutar todas las transacciones bajo propiedades
ACID, garantizando un rollback automático si la conexión falla a mitad del proceso
(RNF-04, RNF-05).
3.7 Mapa de Almacén
● RF7 (Gestión Espacial): La interfaz debe mostrar el estado de los racks y sugerir
ubicaciones vacías si el operario intenta asignar material a una zona con estatus
"Llena" (REQ-001, REQ-003).
● Objetivo del API (Spatial Mapping): Mapear la jerarquía física (Pasillo > Rack >
Nivel) para devolver el estatus de ocupación de cada coordenada en la
representación visual (RNF-11).
3.8 Gestión de Usuarios
● RF8 (Control de Perfiles y Roles): El sistema debe permitir gestionar las
credenciales del personal, asignando niveles de privilegio específicos (como
Almacenista o Admin ) y aplicando la inactivación lógica de cuentas en lugar del
borrado físico, para no corromper la trazabilidad en la Bitácora de Auditoría.
● Objetivo del API (Identity & RBAC): Orquestar el CRUD de cuentas garantizando
el cifrado seguro de las contraseñas antes de su persistencia en la base de datos, y
aplicar middlewares de autorización para bloquear cualquier intento de acceso a
endpoints administrativos por parte de roles operativos.

4.- Requerimientos No Funcionales (RNF)
RNF1 - Eficiencia General: El backend de la API debe estar optimizado para garantizar
tiempos de respuesta rápidos en todas las peticiones, evitando cuellos de botella y
asegurando una fluidez total en la operación.
RNF2 - Integridad y Rollback: Todas las transacciones deben ser atómicas y consistentes
(ACID). Si una operación falla, el sistema debe revertir los cambios automáticamente para
evitar la existencia de datos huérfanos o inconsistentes.
RNF3 - Seguridad de Nivel Industrial: Implementación de Bcrypt para el hashing de
contraseñas y tokens SHA-256 (Sanctum) para la comunicación móvil, asegurando que la
información sea inaccesible para terceros.
RNF4 - Disponibilidad Crítica: El sistema debe asegurar un alto porcentaje de actividad
(Uptime), estando disponible de manera ininterrumpida durante toda la jornada operativa
del almacén.
RNF5 - Diseño de Alta Claridad y Ergonomía (Light Mode): La interfaz emplea una
paleta de colores clara y profesional (estilo SaaS) con fondos blancos y grises técnicos.
Esta elección se justifica en:
● Legibilidad Universal: Máxima claridad de lectura en entornos de oficina con alta
iluminación natural o artificial, facilitando la interpretación rápida de SKUs y gráficas.
● Estética Corporativa: Un diseño "Clean" que proyecta profesionalismo y facilita la
organización visual de grandes volúmenes de información en el Dashboard.

4.- Modelado UML - Interfaces web
4.1 Login

4.2 Dashboard WEB

4.3 Gestión de Productos WEB

4.4 Gestión de Surtidos WEB

4.5 Picking Inteligente WEB

4.6 Bitácora Auditoría WEB

4.7 Mapa de almacén WEB

3.8 Gestión de Usuarios

4.8 Gestión de Usuarios WEB

5.- DIAGRAMA DE COMPONENTES

6.- Requerimientos Interfaz Móvil
6.1 Requerimientos Funcionales (RF) y Objetivos del API
● RF-01M (Interfaz 1 - Login): El sistema debe permitir la autenticación del
almacenista mediante el ingreso de un "ID-Empleado" alfanumérico y una
contraseña, validando las credenciales contra la base de datos central.
● RF-02M (Interfaz 2 - Cola de Picking): La aplicación debe mostrar una lista en
tiempo real de las órdenes asignadas al operario, detallando el ID de la orden, la
cantidad total de ítems y la prioridad (Alta, Media, Baja) asignada por el sistema.
● RF-03M (Interfaz 3 - Locación Objetivo): El sistema debe requerir que el operario
escanee un código de barras (o QR) en la ubicación física indicada (Ej. Rack A-12,
Nivel 3) para habilitar la recolección de la cantidad necesitada.
● RF-04M (Interfaz 4 - Override): El sistema debe permitir al operario introducir
manualmente o escanear las coordenadas de una ubicación alternativa y validar de
inmediato si existe inventario disponible del SKU requerido en dicha nueva
ubicación.
● Objetivos del API (Backend): * Proveer endpoints RESTful seguros mediante
tokens Sanctum.
○ Procesar validaciones de stock e inventario con una latencia estricta inferior a
500 milisegundos.
○ Garantizar transacciones de base de datos tipo ACID (Atomicidad,
Consistencia, Aislamiento, Durabilidad) para evitar descuentos de inventario
parciales ante micro-cortes de red.
6.2 Requerimientos No Funcionales (RNF)
● RNF-01M (Seguridad): La sesión del usuario en el dispositivo móvil debe expirar y
cerrarse automáticamente tras 15 minutos de inactividad continuada.
● RNF-02M (Usabilidad): Los botones principales de acción ("Ingresar", "Escanear
Ubicación") deben tener un área táctil mínima de 48x48 dp y colores de alto
contraste para facilitar su uso con guantes industriales.
● RNF-03M (Retroalimentación): La aplicación debe emitir una alerta háptica
(vibración) y visual (color rojo) en caso de que el código escaneado en la recolección
no coincida con el esperado o falle la validación de Override.
● RNF-04M (Confiabilidad): Ante una pérdida momentánea de conexión WiFi, la
aplicación debe retener el estado actual del escaneo y reintentar la comunicación
con el API sin perder la acción en curso.

UML Móvil
Pantalla de Login:

Pantalla de picking:

Pantalla de Ubicación Objetivo:

Pantalla de Override:

7.- DATOS
7.1 DICCIONARIO DE DATOS

USERS
Columna
Tipo de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Identificador único del usuario.

name

varchar(
255) - No - Nombre completo del usuario.

email

varchar(
255) - No - Correo electrónico (único).
role_id int FK No - Referencia al rol (Spatie Laravel)
usernam
e

varchar(
50) - No - Nombre de usuario para login (único).

email_ver
ified_at

timesta
mp - Sí null Fecha de verificación de correo.

password
varchar(
255) - No - Contraseña encriptada.

is_active boolean - Sí TRUE

Bandera lógica para activar/desactivar
acceso al sistema.

remembe
r_token

varchar(
100) - Sí null Token para mantener la sesión activa.

created_
at

timesta
mp - Sí

current_
timesta
mp Fecha de registro.

updated_
at

timesta
mp - Sí

current_
timesta
mp Fecha de última modificación.

ROLES
Columna
Tipo de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Identificador del rol (Spatie).

name

varchar(
125) - No -

Nombre del rol (ej. administrador,
operador).

guard_na
me

varchar(
125) - Sí web' Guard de autenticación de Laravel.

EDIFICIOS

Columna
Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Identificador del edificio (raíz física).

nombre
varch
ar(10
0) - No - Nombre completo del edificio.

siglas

varch
ar(10) - Sí null

Abreviatura para códigos de
barras/etiquetas.

descripcio
n text - Sí null Detalles adicionales del edificio.

ALMACENES

Columna

Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_incre
ment Identificador del almacén.

edificio_id int FK No - Edificio al que pertenece el almacén.
nombre

varcha
r(100) - No - Nombre del área de almacenaje.

siglas

varcha
r(10) - Sí null Abreviatura para ubicaciones.
descripcion text - Sí null Detalles adicionales.

PASILLOS

Columna
Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_increm
ent Identificador del pasillo.
almacen_id int FK No - Almacén al que pertenece.

nombre
varc
har(5
0) - No - Identificador o número del pasillo.

RACKS

Columna
Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement
Identificador del rack o estantería
principal.

pasillo_id int FK No - Pasillo donde se ubica el rack.
nombre_r
ack

varchar
(50) - No - Código o nombre del rack.

ESTANTES
Columna

Tipo de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Nodo final de la ubicación física.
rack_id int FK No - Rack al que pertenece este nivel/estante.
nivel

varchar(
50) - No - Nivel de altura en el rack.

codigo_etiqu
eta

varchar(
50) - No -

Código único final escaneable (ej.
ED1-A1-P2-R1-N3).

tipo_zona

varchar(
50) - Sí null

Clasificación (ej. refrigerado, secos,
peligrosos).

esta_lleno boolean - Sí FALSE

Bandera para optimizar rutas de
guardado.

CATEGORÍAS

Columna

Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Clasificación principal de productos.

nombre

varch
ar(10
0) - No - Nombre de la categoría (único).
descripcion text - Sí null Detalles de la categoría.

UNIDADES
MEDIDA

Columna

Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Catálogo de unidades.

nombre

varch
ar(50) - No - Nombre completo (ej. Pieza, Kilogramo).

abreviatura
varch
ar(10) - Sí null Abreviatura (ej. PZA, KG).

MARCAS

Columna
Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Fabricantes o marcas de los productos.

nombre

varcha
r(100) - No - Nombre comercial de la marca.

sitio_web
varcha
r(255) - Sí null URL de referencia del proveedor.

PRODUCTOS

Columna

Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Catálogo central de materiales.
categoria_id int FK No - Categoría a la que pertenece.
unidad_medid
a_id int FK No - Unidad en la que se cuenta o pesa.
marca_id int FK Sí null Marca del producto.

nombre

varch
ar(15
0) - No - Descripción comercial del material.

sku

varch
ar(50
) - No -

Código interno único del producto (Stock
Keeping Unit).

stock_min int - Sí 0 Alerta de reabastecimiento mínimo.
stock_max int - Sí null Límite de capacidad en almacén.
estado

boole
an - Sí TRUE

Si el producto está activo para ser
operado.

ESTADOS
INVENTARIO

Columna
Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Catálogo de condiciones de la mercancía.

nombre

varcha
r(50) - No -

Ej. Disponible, Cuarentena, Dañado,
Merma.

descripcion text - Sí null Explicación de cuándo usar este estado.

INVENTARIOS

Columna

Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Tabla pivote de stock físico real.
producto_id int FK No - Producto almacenado.
estante_id int FK No - Ubicación exacta donde se encuentra.
estado_id int FK No - Condición de esta cantidad específica.
cantidad

decima
l(10,2) - No 0 Cantidad física validada en esa ubicación.

ESTADO
ORDEN

Columna
Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Fases del flujo de surtido.

nombre

varcha
r(50) - No -

Ej. Pendiente, En Proceso, Surtida,
Cancelada.

color_hex
varcha
r(7) - Sí

#80808
0' Color para el dashboard web.

PRIORIDADES

ORDEN

Columna

Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Niveles de urgencia.

nombre

varc
har(5
0) - No - Ej. Normal, Urgente, AOG.

nivel_ordenami
ento int - Sí 0

Valor numérico para ordenar colas de
trabajo.

ÓRDENES
SURTIDO

Columna
Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Cabecera de la orden de trabajo.

folio

varch
ar(20) - No - Identificador humano único de la orden.

capturista_
id int FK No - Usuario que creó la orden en el sistema.
almacenist
a_id int FK Sí null Operador asignado a hacer el picking.
referencia_
destino

varch
ar(15
0) - Sí null A dónde va el material (cliente, área, etc.).

estado_id int FK No - Estatus actual de la orden.
prioridad_i
d int FK No - Urgencia asignada.
fecha_requ
erida

dateti
me - Sí null Fecha límite para entregar el material.

DETALLES
SURTIDO

Columna
Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Líneas específicas de la orden.

orden_surti
do_id int FK No - Orden a la que pertenece esta línea.
producto_id int FK No - Material solicitado.
cantidad_re
querida
deci
mal(1
0,2) - No - Lo que se pide teóricamente.

cantidad_s
urtida

deci
mal(1
0,2) - Sí 0 Lo que el operador realmente tomó.

estante_su
gerido_id int FK No -

Ubicación que el sistema recomendó
visitar.

estante_re
al_id int FK Sí null

Ubicación de donde realmente se tomó
(override).

fue_modific
ado

boole
an - Sí FALSE

Bandera si el usuario no siguió la
sugerencia.

AUDIT
LOGS

Columna
Tipo
de
Dato Llave Nulo Default Descripción / Regla de Negocio

id int PK No

auto_inc
rement Registro inmutable de todo movimiento.

detalle_s
urtido_id int FK No -

Línea de la orden que generó el
movimiento.

user_id int FK No -

Usuario que ejecutó el
escaneo/movimiento.

estante_
origen_id int FK No - De dónde salió el material.
estante_
destino_i
d int FK Sí null Hacia dónde fue (null si es salida final).
tipo_movi
miento

varchar
(50) - No - Naturaleza de la acción (picking, ajuste).

cantidad
_anterior int - No - Stock antes del escaneo.
cantidad
_nueva int - No - Stock después del escaneo.
observaci
ones text - Sí null Justificación de ajustes o overrides.
fecha_ho
ra

timesta
mp - Sí

current_
timesta
mp Momento exacto de la acción.

7.2 Diagrama relacional