# 📦 OrganiRack Plus - Contexto Completo del Proyecto y Propuesta Arquitectónica

**Fecha**: Marzo 14, 2026  
**Objetivo**: Evaluar la viabilidad de implementar una arquitectura de Servicios vs Controladores grandes  
**Estado Actual**: En desarrollo inicial; base de datos diseñada, sin lógica de negocio implementada

---

## 📋 1. DESCRIPCIÓN GENERAL DEL PROYECTO

### Nombre
**OrganiRackPlus** - Sistema de Gestión de Almacenes de Surtido (Warehouse Picking Management)

### Propósito
Plataforma integral para optimizar el proceso de surtido (picking) en almacenes grandes, con:
- Gestión jerárquica de ubicaciones (Edificios → Almacenes → Pasillos → Racks → Estantes)
- Órdenes de surtido con algoritmos de sugerencia de ubicación
- Trazabilidad e inmutabilidad de movimientos (auditoría)
- Control de inventarios en tiempo real

### Stack Tecnológico Actual
```
Backend:    Laravel 12 (PHP 8.2+)
Auth:       Laravel Sanctum (API tokens)
Testing:    Pest PHP 3.8+
Database:   SQL (Estructura definida, sin ORM mappings aún)
Frontend:   FASE 1: Blade (por tiempo) → FASE 2: Vite + Vue/React (arquitectura lista ahora)
Permisos:   Spatie Laravel Permission 6.24
```

**NOTA IMPORTANTE**: Se implementará Blade inicialmente, pero la arquitectura de Servicios está diseñada para facilitar la migración a Vite SIN refactorización de la lógica de negocio.

---

## 🗄️ 2. ARQUITECTURA DE BASE DE DATOS

### 2.1 Módulo: ESTRUCTURA FÍSICA DEL ALMACÉN
```
edificios
├── id (PK)
├── nombre, siglas, descripcion
└── timestamps
    │
    ├─→ almacenes (FK: edificio_id)
        ├── id (PK)
        ├── nombre, siglas
        └── timestamps
            │
            ├─→ pasillos (FK: almacen_id)
                ├── id (PK)
                ├── nombre
                └── timestamps
                    │
                    ├─→ racks (FK: pasillo_id)
                        ├── id (PK)
                        ├── nombre_rack
                        └── timestamps
                            │
                            ├─→ estantes (FK: rack_id)
                                ├── id (PK)
                                ├── nivel
                                ├── codigo_etiqueta (UNIQUE)
                                ├── tipo_zona (nullable)
                                ├── esta_lleno (boolean)
                                └── timestamps
```

**Patrón**: Jerarquía estricta con restricción en cascada. Cada nivel elimina sus hijos.

---

### 2.2 Módulo: CATÁLOGO DE PRODUCTOS
```
categorias
├── id, nombre (UNIQUE), descripcion
└── timestamps

unidades_medida
├── id, nombre (UNIQUE), abreviatura
└── timestamps

marcas
├── id, nombre (UNIQUE), sitio_web
└── timestamps

productos
├── id
├── sku (UNIQUE)
├── nombre
├── categoria_id (FK → categorias)
├── unidad_medida_id (FK → unidades_medida)
├── marca_id (FK → marcas, nullable)
├── stock_min, stock_max
├── estado (boolean)
├── índices: [sku, categoria_id]
└── timestamps
```

**Característica**: Catálogos base independientes; productos los vinculan.

---

### 2.3 Módulo: ÓRDENES DE SURTIDO (CORE DEL NEGOCIO)
```
estados_orden (Catálogo)
├── id, nombre (UNIQUE), color_hex
└── timestamps

prioridades_orden (Catálogo)
├── id, nombre (UNIQUE), nivel_ordenamiento
└── timestamps

ordenes_surtido (Cabecera)
├── id
├── folio (UNIQUE, ej: ORD-2441)
├── capturista_id (FK → users)
├── almacenista_id (FK → users, nullable)
├── referencia_destino (ej: Cliente, Departamento)
├── estado_id (FK → estados_orden)
├── prioridad_id (FK → prioridades_orden)
├── fecha_requerida (nullable)
└── timestamps

detalles_surtido (Detalle/Partidas)
├── id
├── orden_surtido_id (FK → ordenes_surtido, CASCADE)
├── producto_id (FK → productos)
├── cantidad_requerida, cantidad_surtida
├── estante_sugerido_id (FK → estantes) [IA sugiere]
├── estante_real_id (FK → estantes, nullable) [Usuario override]
├── fue_modificado (boolean)
└── timestamps
```

**Lógica Implícita**:
- Sistema sugiere `estante_sugerido_id` basado en algoritmo de picking
- Usuario puede sobrescribir con `estante_real_id`
- Flag `fue_modificado` registra override

---

### 2.4 Módulo: AUDITORÍA (REQ-008: Inmutabilidad)
```
audit_logs
├── id
├── detalle_surtido_id (FK → detalles_surtido, CASCADE)
├── user_id (FK → users)
├── estante_origen_id (FK → estantes)
├── estante_destino_id (FK → estantes, nullable)
├── tipo_movimiento (string: 'picking', 'reconteo', 'ajuste', ...)
├── cantidad_anterior → cantidad_nueva
├── observaciones (text, nullable)
├── fecha_hora (timestamp, actual por defecto)
├── índices: [user_id, fecha_hora, tipo_movimiento]
└── timestamps
```

**Característica**: Registro inmutable de TODOS los movimientos.

---

### 2.5 Autenticación
```
users
├── id
├── name, username (ID acceso), email
├── password (hashed)
├── is_active (boolean)
├── last_login_at (timestamp, nullable)
├── email_verified_at (timestamp, nullable)
└── timestamps

personal_access_tokens (Sanctum)
├── Manejo automático de tokens para API

roles_permissions (Spatie Laravel Permission)
├── Mapeo de roles a usuarios y permisos
```

---

## 📊 3. ESTADO ACTUAL DEL CÓDIGO

### 3.1 Estructura Existente
```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/              [Controlador Auth, vacío]
│   │   └── Controller.php      [BaseController vacío]
│   ├── Middleware/            [Vacío]
│   ├── Requests/              [Vacío, necesario para validación]
│   └── ├── Auth/
│
├── Models/
│   └── User.php               [Preparado con HasRoles, Sanctum, Notifiable]
│
├── Providers/
│   └── AppServiceProvider.php [Estándar]
```

### 3.2 Rutas Actuales
```php
// routes/api.php - MÍNIMo
Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

// routes/web.php - Landing
Route::get('/', fn() => ['Laravel' => app()->version()]);

// routes/auth.php - [Por revisar]
```

### 3.3 Configuración
- **Sanctum**: Configurado para tokenización API
- **Permission**: Spatie habilitado
- **Testing**: Pest con plugin Laravel listo
- **Queue/Jobs**: Configurado pero sin listeners
- **Logging/Monitoring**: Estándar Laravel

---

## 🎯 4. ANÁLISIS DEL PROBLEMA

### 4.1 Complejidad de la Lógica de Negocio
El sistema requiere operaciones complejas que NO caben en un controlador:

#### Crear una Orden de Surtido
1. Validar que todos los productos solicitados existan
2. Verificar stock disponible en almacén
3. Consultar historial de movimientos para sugerir ubicaciones óptimas
4. Aplicar algoritmo de picking (minimizar distancia/movimientos)
5. Crear registros de orden y detalles
6. Generar entrada de auditoría inicial
7. Disparar evento para notificaciones a almacenistas
8. Optativo: Integración con sistemas externos (WMS, ERP)

#### Completar un Picking
1. Validar que la orden existe y estado es "en_progreso"
2. Decrementar inventario en estante origen
3. Incrementar en estante destino
4. Verificar si todas las partidas están completas
5. Actualizar estado de la orden
6. Generar auditoría del movimiento
7. Notificar al capturista de finalización

### 4.2 Problemas de Controladores Grandes
❌ Un `OrderController` de 400+ líneas sería:
- Difícil de testear (toda lógica acoplada)
- Imposible reutilizar (código duplicado en scripts/commands)
- Pesadilla de mantenimiento (cambios multiplicados)
- Violación de SOLID (Single Responsibility)

---

## 💡 5. PROPUESTA ARQUITECTÓNICA: CAPAS DE SERVICIOS

### 5.1 Flujo Propuesto
```
┌─────────────────────────────────────────────────────────────┐
│  Cliente Frontend (Vite + Vue/React)                        │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP/JSON
┌────────────────▼────────────────────────────────────────────┐
│  routes/api.php - Rutas definidas                           │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Http/Controllers/Api/* (10-20 líneas c/u)                 │
│  Responsabilidades:                                          │
│  - Parsear Request                                           │
│  - Delegar a Servicio                                        │
│  - Transformar respuesta (Resource)                          │
│  - Retornar 200/422/404                                     │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Services/* (50-150 líneas c/u)                             │
│  - OrderService::createOrder()                              │
│  - PickingService::suggestLocations()                       │
│  - InventoryService::decrementStock()                       │
│  - AuditService::logMovement()                              │
│  Inyectan dependencias entre sí                             │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Repositories/* (opcional pero útil)                        │
│  - WarehouseRepository::findAvailableShelf()               │
│  - OrderRepository::getByFolio()                            │
│  Abstracción de queries complejas                           │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Models/* - Eloquent ORM                                    │
│  - User, Order, OrderDetail, AuditLog, Product, ...        │
│  Relaciones y scopes solamente                              │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│  Database - SQL                                             │
└─────────────────────────────────────────────────────────────┘

SIDE EFFECTS:
├─ Events/* → Listeners/* (Auditoría automática, notificaciones)
├─ Exceptions/* (Manejo de errores de negocio)
├─ Actions/* (Re-usar lógica en comandos CLI)
└─ Jobs/* (Procesos asíncronos si fuera necesario)
```

### 5.2 Servicios Propuestos

#### a) **OrderService**
```php
namespace App\Services;

class OrderService {
    public function __construct(
        private PickingService $pickingService,
        private InventoryService $inventoryService,
        private AuditService $auditService
    ) {}

    // Validar, crear, asignar ubicaciones, auditar
    public function createOrder(array $data): Order { }
    
    // Cambiar estado (pendiente → en_progreso → completado)
    public function updateStatus(Order $order, string $newStatus): void { }
    
    // Cancelar orden y revertir cambios
    public function cancelOrder(Order $order, string $reason): void { }
}
```

**Responsabilidad**: Orquestación de la creación/modificación de órdenes.

---

#### b) **PickingService**
```php
namespace App\Services;

class PickingService {
    public function __construct(
        private WarehouseRepository $warehouse,
        private InventoryRepository $inventory
    ) {}

    // Algoritmo de sugerencia de ubicaciones
    public function suggestLocations(array $items): array { }
    
    // Marcar detalle como completado
    public function completeDetail(OrderDetail $detail, Shelf $actualShelf): void { }
    
    // Optimización de ruta (próxima mejora)
    public function optimizeRoute(Order $order): array { }
}
```

**Responsabilidad**: Lógica pura de picking y sugerencias.

---

#### c) **InventoryService**
```php
namespace App\Services;

class InventoryService {
    public function __construct(
        private InventoryRepository $inventory
    ) {}

    // Verificar disponibilidad total
    public function validateStock(array $items): bool { }
    
    // Decrementar stock (después de picking)
    public function decrementStock(Product $product, int $qty, Shelf $shelf): void { }
    
    // Get cantidad disponible en ubicación
    public function getAvailableQuantity(Product $product, Shelf $shelf): int { }
    
    // Transferencias entre estantes
    public function transferBetweenShelves(
        Product $product,
        int $qty,
        Shelf $from,
        Shelf $to
    ): void { }
}
```

**Responsabilidad**: Lógica de inventario e stock.

---

#### d) **AuditService**
```php
namespace App\Services;

class AuditService {
    // Registrar movimiento (picking, reconteo, ajuste)
    public function logMovement(
        OrderDetail $detail,
        User $user,
        Shelf $from,
        ?Shelf $to,
        string $type,
        int $qtyBefore,
        int $qtyAfter,
        ?string $notes
    ): AuditLog { }
    
    // Generar reporte de trazabilidad
    public function getTraceability(OrderDetail $detail): Collection { }
}
```

**Responsabilidad**: Auditoría inmutable (solo escritura, sin updates).

---

#### e) **WarehouseService**
```php
class WarehouseService {
    // Obtener estructura completa de un almacén
    public function getStructure(Warehouse $warehouse): array { }
    
    // Búsqueda jerárquica
    public function findShelfByCode(string $codigo): ?Shelf { }
    
    // Reportes de ocupación
    public function getOccupancyReport(Warehouse $warehouse): array { }
}
```

**Responsabilidad**: Operaciones sobre la jerarquía de almacén.

---

### 5.3 Estructura de Directorios Propuesta
```
app/
├── Http/
│   ├── Controllers/Api/
│   │   ├── OrderController.php          (store, show, update, cancel)
│   │   ├── PickingController.php        (complete, suggest)
│   │   ├── InventoryController.php      (transfer, adjust)
│   │   ├── WarehouseController.php      (list, structure)
│   │   └── AuditController.php          (logs, traceability)
│   │
│   ├── Requests/
│   │   ├── StoreOrderRequest.php
│   │   ├── UpdateOrderRequest.php
│   │   ├── CompletePickingRequest.php
│   │   └── TransferInventoryRequest.php
│   │
│   └── Resources/
│       ├── OrderResource.php
│       ├── OrderDetailResource.php
│       ├── PickingResource.php
│       ├── WarehouseStructureResource.php
│       └── AuditLogResource.php
│
├── Services/                            ⭐ NUEVA CARPETA
│   ├── OrderService.php
│   ├── PickingService.php
│   ├── InventoryService.php
│   ├── WarehouseService.php
│   ├── AuditService.php
│   └── Contracts/
│       ├── OrderServiceInterface.php
│       ├── PickingServiceInterface.php
│       └── ... (opcional, para testing)
│
├── Repositories/                        (Opcional, recomendado)
│   ├── WarehouseRepository.php
│   ├── OrderRepository.php
│   ├── InventoryRepository.php
│   ├── Contracts/
│   │   └── WarehouseRepositoryInterface.php
│   └── ...
│
├── Actions/                             (Reutilizables en CLI/Jobs)
│   ├── CreateOrderAction.php
│   ├── CompletePickingAction.php
│   └── GenerateAuditReportAction.php
│
├── Events/
│   ├── OrderCreated.php
│   ├── PickingCompleted.php
│   ├── OrderCancelled.php
│   └── InventoryAdjusted.php
│
├── Listeners/
│   ├── CreateInitialAuditLog.php
│   ├── NotifyAlmacenistaWhenOrderCreated.php
│   └── NotifyCapturistaWhenCompleted.php
│
├── Exceptions/
│   ├── InsufficientStockException.php
│   ├── InvalidOrderStateException.php
│   ├── WarehouseLocationException.php
│   ├── PickingConflictException.php
│   └── AuditLogException.php
│
├── Models/
│   ├── User.php
│   ├── Edificio.php
│   ├── Almacen.php
│   ├── Pasillo.php
│   ├── Rack.php
│   ├── Estante.php
│   ├── Producto.php
│   ├── Categoria.php
│   ├── UnidadMedida.php
│   ├── Marca.php
│   ├── OrdenSurtido.php
│   ├── DetalleSurtido.php
│   ├── AuditLog.php
│   ├── EstadoOrden.php
│   └── PrioridadOrden.php
│
└── Providers/
    ├── AppServiceProvider.php
    └── EventServiceProvider.php        (Registrar eventos/listeners)
```

---

## 5.4 ESTRATEGIA: BLADE AHORA, VITE MAÑANA

### Fase 1 (Actual): Blade + Servicios
La arquitectura de servicios **sigue funcionando perfectamente** con Blade:

```php
// Controllers retornan VISTAS (no JSON)
class OrderController extends Controller {
    public function __construct(private OrderService $orderService) {}

    public function create() {
        // Renderizar formulario vacío
        return view('orders.create');
    }

    public function store(StoreOrderRequest $request) {
        try {
            $order = $this->orderService->createOrder($request->validated());
            
            // Redirigir a detalle con éxito
            return redirect()->route('orders.show', $order)
                ->with('success', 'Orden creada exitosamente');
        } catch (InsufficientStockException $e) {
            return back()->withErrors(['stock' => $e->getMessage()]);
        }
    }

    public function show(Order $order) {
        return view('orders.show', [
            'order' => $order->load('details'),
            'audit' => $this->auditService->getTraceability($order->details->first()),
        ]);
    }
}
```

**Ventaja**: La lógica (`OrderService`) está completamente independiente de:
- Cómo se renderiza (Blade, JSON, XML)
- Cómo se devuelve (vistas, API, controlador)
- El framework de frontend

---

### Fase 2 (Futuro): Migración a Vite sin refactorizar servicios

Cuando decidas cambiar a Vite + Vue/React, **los servicios no cambian**:

```php
// Controllers retornan JSON (único cambio)
class OrderController extends Controller {
    public function __construct(private OrderService $orderService) {}

    // POST /api/orders
    public function store(StoreOrderRequest $request) {
        try {
            $order = $this->orderService->createOrder($request->validated());
            
            // Mismo servicio, diferente formato de respuesta
            return new OrderResource($order); // JSON automáticamente
        } catch (InsufficientStockException $e) {
            return response()->json(
                ['error' => $e->getMessage()],
                422
            );
        }
    }

    // GET /api/orders/{order}
    public function show(Order $order) {
        return new OrderResource($order->load('details'));
    }
}
```

**Cambios requeridos**:
- ✅ Controllers: cambiar `view()` por `new Resource()`
- ✅ Routes: mover a `routes/api.php`
- ❌ Servicios: **sin cambios**
- ❌ Modelos: **sin cambios**
- ❌ Lógica de negocio: **sin cambios**
- ✅ Frontend: crear proyecto Vite separado

**Esfuerzo**: 1-2 días vs refactorer todo si hubieras usado controladores grandes (+2 semanas).

---

### Tabla Comparativa: Blade vs Vite (MISMO Backend)

| Aspecto | Blade (Ahora) | Vite (Futuro) |
|--------|-------------|-------------|
| **Controllers** | Retornan `view()` | Retornan `new Resource()` |
| **Routes** | `routes/web.php` | `routes/api.php` |
| **Servicios** | Exactamente iguales | Exactamente iguales |
| **Modelos** | Exactamente iguales | Exactamente iguales |
| **Eventos/Listeners** | Exactamente iguales | Exactamente iguales |
| **Testing de servicios** | ✅ Idéntico | ✅ Idéntico |
| **Frontend** | PHP/Blade en servidor | Node.js en navegador |
| **Tiempo de cambio** | - | 1-2 días |

---

### Detalles Técnicos: Cómo Funciona Hoy con Blade

```
Cliente (Browser)
    ↓
GET /orders/create
    ↓
OrderController::create()
    ↓
return view('orders.create')
    ↓
Blade → HTML con formulario
    ↓
User submits form (POST /orders)
    ↓
OrderController::store(StoreOrderRequest $request)
    ↓
OrderService::createOrder()  ← LÓGICA AQUÍ (reutilizable)
    ↓
Evento: OrderCreated → Listener → AuditLog
    ↓
return redirect()->route('orders.show', $order)
    ↓
Blade → HTML con detalles de orden
```

---

### Detalles Técnicos: Cómo Funcionará Luego con Vite

```
Cliente (Node.js: Vite + Vue)
    ↓
Petición XHR: GET /api/orders/create
    ↓
OrderController::create() [devuelve empty JSON]
    ↓
return response()->json([...])
    ↓
Frontend renderiza formulario con Vue
    ↓
User submits form (POST /api/orders JSON)
    ↓
OrderController::store(StoreOrderRequest $request)
    ↓
OrderService::createOrder()  ← LÓGICA AQUÍ (REUTILIZADA)
    ↓
Evento: OrderCreated → Listener → AuditLog
    ↓
return new OrderResource($order)
    ↓
JSON response
    ↓
Frontend renderiza resultado con Vue
```

**Punto clave**: `OrderService::createOrder()` es idéntico en ambos casos.

---

## 5.5 Estructura De Directorios Con Blade

Para Blade, la estructura sigue siendo la misma, pero agregas `resources/views`:

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── OrderController.php          (retorna view() por ahora)
│   │   ├── WarehouseController.php
│   │   └── DashboardController.php
│   ├── Requests/
│   │   ├── StoreOrderRequest.php
│   │   └── ...
│   └── Middleware/
│
├── Services/                            ⭐ (Reutilizable más tarde)
│   ├── OrderService.php
│   ├── PickingService.php
│   ├── InventoryService.php
│   └── ...
│
├── Models/
│   ├── Order.php
│   ├── Product.php
│   └── ...
│
├── Events/ + Listeners/
│   ├── OrderCreated.php
│   └── CreateInitialAuditLog.php
│
└── Exceptions/

resources/
├── views/
│   ├── layout.blade.php
│   ├── orders/
│   │   ├── index.blade.php
│   │   ├── create.blade.php
│   │   └── show.blade.php
│   ├── warehouse/
│   │   └── structure.blade.php
│   └── ...
│
└── css/ + js/

routes/
├── web.php                              (Blade routes)
└── api.php                              (Reservado para Vite futuro)
```

---



## 🧪 6. BENEFICIOS Y VALIDACIONES (Blade + Servicios)

### 6.0 Validación Principal: Funciona Con Blade
La arquitectura de servicios **NO requiere Vite ni API JSON**. Funciona perfectamente con:
- ✅ Blade (templates tradicionales)
- ✅ AJAX con jQuery (si lo necesitas)
- ✅ Hotwire/Turbo (componentes dinámicos en Blade)
- ✅ JSON API (cuando transiciones a Vite)

**Conclusión**: Implementa servicios ahora, usa Blade sin problemas, migra a Vite sin refactorizar.

---

### 6.1 Testabilidad
```php
// tests/Unit/Services/OrderServiceTest.php
class OrderServiceTest extends TestCase {
    public function test_create_order_validates_stock() {
        $mockInventory = Mockery::mock(InventoryService::class);
        $mockInventory->shouldReceive('validateStock')->andThrow(InsufficientStockException::class);
        
        $service = new OrderService($mockInventory, ...);
        
        $this->expectException(InsufficientStockException::class);
        $service->createOrder(['items' => [...]]);
    }
}
```
✅ Con servicios: fácil de mocksear  
❌ Controladores grandes: imposible aislar lógica

---

### 6.2 Reutilización
```php
// Console command para generación de reporte
php artisan order:generate-report --warehouse=ALM001 --date=2026-03-14

// App\Console\Commands\GenerateOrderReport.php
class GenerateOrderReport extends Command {
    public function __construct(private OrderService $service) {}
    
    public function handle() {
        $orders = $this->service->getOrdersByDate(...);
        // Usar la misma lógica que API
    }
}
```
✅ Servicios: reutilizables en comandos, jobs, eventos  
❌ Controladores: requieren duplicación de código

---

### 6.3 Escalabilidad y Monolito a Microservicios
Estructura actual permite futura extracción:
```
# Hoy: Monolito
OrderService en app/Services/

# Mañana: Microservicio
// Extraer a carpeta separada o repositorio
composer require organirack/order-service
```

---

### 6.4 Blade Ahora, Vite Mañana (sin refactorización)
El diseño con servicios permite transición limpia:

**FASE 1 (Ahora: 3-4 meses):**
- ✅ Blade para renderizar vistas
- ✅ Controllers con lógica delegada a Servicios
- ✅ Usuarios actualizando órdenes, viendo reportes
- ✅ Servicios 100% testeados

**FASE 2 (Futura: 6+ meses):**
- ✅ Crear proyecto Vite + Vue/React (separado)
- ✅ Cambiar Controllers para retornar JSON
- ✅ Consumir API desde frontend Vite
- ✅ Servicios sin cambios (REUTILIZADOS)
- ✅ BD sin cambios
- ✅ Tests sin cambios
- ⏱️ Refactorización: 1-2 semanas

**Lo que NO cambia**:
```
- Servicios: 100% iguales
- Modelos: 100% iguales  
- Lógica de negocio: 100% igual
- Eventos/Listeners: 100% igual
- Tests: 100% igual
```

---

## 📋 7. PLAN DE IMPLEMENTACIÓN RECOMENDADO (BLADE + SERVICIOS)

### Fase 1: Setup (1-2 días)
- [ ] Crear carpeta `app/Services` y `app/Exceptions`
- [ ] Crear interfaces en `app/Services/Contracts`
- [ ] Configurar `AppServiceProvider` para registrar servicios
- [ ] Setup de testing con Pest

### Fase 2: Modelos Eloquent (2-3 días)
- [ ] Crear todos los modelos (Edificio, Almacen, Pasillo, Rack, Estante)
- [ ] Crear modelos de producto (Producto, Categoria, Marca, UnidadMedida)
- [ ] Crear modelos de órdenes (OrdenSurtido, DetalleSurtido, etc)
- [ ] Seeders para datos de prueba
- [ ] ✅ Migrations ya existen

### Fase 3: Servicios Core (3-5 días)
- [ ] Implementar `InventoryService` (base)
- [ ] Implementar `PickingService` (sugerencias)
- [ ] Implementar `OrderService` (orquestación)
- [ ] Tests unitarios para cada servicio (Pest)

### Fase 4: Controllers + Requests + Blade Views (3-4 días)
- [ ] `OrderController` (create, store, show, index con servicios)
- [ ] `WarehouseController` (vistas jerárquicas)
- [ ] `StoreOrderRequest` con validaciones
- [ ] Blade templates: `resources/views/orders/*`
- [ ] Blade templates: `resources/views/warehouse/*`
- [ ] Routes en `routes/web.php`

### Fase 5: Auditoría + Eventos (1-2 días)
- [ ] `AuditService` + `AuditLog` model
- [ ] Events: `OrderCreated`, `PickingCompleted`
- [ ] Listeners: `CreateInitialAuditLog`
- [ ] Tests de cadena evento

### Fase 6: Reportes y Dashboards Blade (2-3 días)
- [ ] `DashboardController` con estadísticas
- [ ] Vistas de reportes de picking
- [ ] Vistas de trazabilidad
- [ ] Gráficos de ocupación de almacén

### Fase 7 (Optativo): Repositories (1-2 días)
- [ ] Si descubres queries muy complejas
- [ ] Ej: `WarehouseRepository::findOptimalShelves()`
- [ ] Abstrae queries futura-proof

---

**Tiempo total estimado**: 2-3 semanas para MVP funcional con Blade

---

## ❓ 8. VARIACIONES Y TRADE-OFFS

### ¿Usar Repositories?
**SÍ si:**
- Queries muy complejas (subqueries, agregaciones)
- Necesitas cambiar BD (SQL → NoSQL futura)

**NO si:**
- Eloquent es suficientemente expresivo
- No quieres otra capa

**Recomendación**: Empezar SIN repositorio; agregar si se necesita.

---

### ¿Usar Actions?
**SÍ si:**
- Lógica se reutiliza en múltiples lugares (cron + API + CLI)
- Ej: `CreateOrderAction::execute()` en controller y command

**NO si:**
- Solo controller la llama

**Recomendación**: Sí para `CreateOrder` (es crítico en múltiples contextos).

---

### ¿Usar Domain Events?
**SÍ si:**
- Quieres desacoplamiento (auditoría automática sin que servicio sepa)
- Notificaciones asíncronas (email al almacenista)

**NO si:**
- Todo requiere ser síncrono y acoplado

**Recomendación**: SÍ. Es fácil de agregar y muy útil.

---

## 🎬 9. RESUMEN EJECUTIVO

| Aspecto | Controladores Grandes | Servicios |
|--------|---------------------|----------|
| **Líneas por archivo** | 300-500 | 50-150 |
| **Testabilidad** | ❌ Difícil | ✅ Fácil |
| **Reutilización** | ❌ Código duplicado | ✅ DRY |
| **Mantenibilidad** | ❌ Pesadilla | ✅ Legible |
| **Escalabilidad** | ❌ Sin límite | ✅ Modular |
| **Cambios en lógica** | ❌ Afecta todo | ✅ Localizado |
| **Curva aprendizaje** | ✅ Simple | 🟡 Intermedia |
| **Setup inicial** | ✅ Rápido | 🟡 Más código |

---

## 📚 10. REFERENCIAS Y PATTERNS

### Inspiración
- **Laravel Best Practices**: Service Layer (recomendado oficial)
- **Domain-Driven Design**: Servicios reflean casos de uso del negocio
- **Clean Code**: SOLID principles (especialmente SRP)
- **Atomic Design**: Acciones reutilizables

### Librerías Útiles (Opcionales)
- `spatie/laravel-data`: DTOs para validar/transformar
- `spatie/laravel-event-sourcing`: Event sourcing avanzado
- `cerbero/dto`: LightWeight DTOs en servicios

---

## ✅ CONCLUSIÓN

**Recomendación Final**: Implementar **Servicios + Controllers delgados + Eventos + Blade** 

**Fase 1 (Sprint actual)**: 
- ✅ Usar Blade para vistas (acelera desarrollo)
- ✅ Servicios que encapsulan lógica de negocio
- ✅ Controllers delgados que delegan a servicios
- ✅ Tests en servicios (no en controladores)

**Fase 2 (6+ meses)**:
- 🔄 Crear Vite + Vue/React (proyecto separado)
- 🔄 Controllers retornan JSON en vez de vistas
- ✅ Servicios sin cambios (reutilizados al 100%)
- ✅ Tests sin cambios
- ✅ Modelos sin cambios
- ⏱️ Refactorización: 1-2 semanas

Justificación:
1. **Problema complejo** (almacenes, picking, auditoría) requiere separación de concerns
2. **Servicios = Seguro**: Funcionan igual con Blade, JSON API o cualquier frontend
3. **Auditoría crítica** es mejor en eventos desacoplados (REQ-008)
4. **Testing** (Pest) enfocado en servicios, no controladores
5. **Escalabilidad** sin refactorizar lógica cuando cambies a Vite
6. **No hay deuda técnica** entre Blade y Vite

---

**Autor**: José Luis (análisis inicial, refinado para Blade)  
**Estado**: Listo para implementación  
**Próximo paso**: Iniciar Fase 1 (Setup + Modelos + Servicios)

### 🎯 PUNTOS CLAVE

1. **Usa Blade AHORA sin culpa**: El servicio layer NO tiene opinión sobre cómo se renderizan vistas
2. **Tests en servicios, NO en controladores**: Eso es lo que refactorizarás si cambias frontend
3. **Servicios reutilizables**: Mismos servicios para Blade, JSON API, CLI, Jobs, etc
4. **Cambio trivial en el futuro**: Solo tus controllers necesitan cambiar (2 horas de trabajo)
5. **Modelos sin cambios**: BD y lógica Eloquent siguen funcionando igual
6. **No es ingeniería prematura**: Es arquitectura defensiva lógica para un proyecto mediano/grande

**La pregunta correcta no es "¿Debo usar Vite o Blade?"**
**La pregunta correcta es "¿Dónde pongo mi lógica de negocio?"**
**Respuesta: En servicios, no en controladores. El frontend es irrelevante.**

---

---

## 🚀 11. ESTRATEGIA SMART: BLADE AHORA, VITE MAÑANA (SIN MIGRAR SERVICIOS)

### El Problema
- "Necesito Blade ahora por falta de tiempo"
- "Pero quiero poder cambiar a Vite después"
- "Sin refactorizar todo el código"

### La Solución: Arquitectura de Servicios

La clave es simple: **NUNCA pongas lógica de negocio en controladores**

**MAL** (servicios + logica en controller):
```php
// ❌ Si haces esto con Blade, dolerá cambiar a Vite
class OrderController {
    public function store(Request $request) {
        // 50+ líneas de lógica aquí
        // Validar stock
        // Crear orden
        // Sugerir ubicaciones
        // Auditar
        
        return view('orders.show', $order);  // Hoy
        // Mañana tendrías que extraer TODO esto
    }
}
```

**BIEN** (servicios limpios, controlador delgado):
```php
// ✅ Funciona perfecto con Blade HOY
class OrderController {
    public function __construct(private OrderService $service) {}
    
    public function store(StoreOrderRequest $request) {
        $order = $this->service->createOrder($request->validated());
        
        return view('orders.show', ['order' => $order]);  // Blade HOY
    }
}

// ✅ El mismo controller, retornando JSON MAÑANA (sin tocar servicio)
class OrderController {
    public function __construct(private OrderService $service) {}
    
    public function store(StoreOrderRequest $request) {
        $order = $this->service->createOrder($request->validated());
        
        return new OrderResource($order);  // JSON DESPUÉS (2 líneas cambiadas)
    }
}
```

---

### Comparación Lado a Lado

```
OPCIÓN A: Controladores Grandes + Blade
├─ HOY: Fácil empezar, rápido escribir
├─ MAÑANA con Vite: Pesadilla de refactorización (2-3 semanas)
└─ Riesgo: Regresiones, bugs nuevos

OPCIÓN B: Servicios + Blade (RECOMENDADO)
├─ HOY: Más estructura, pero limpio (0 overhead)
├─ MAÑANA con Vite: Cambiotrival (2 horas por controller = 4-6 horas total)
└─ Beneficio: Tests ya hechos, cero regressions
```

---

### Implementación Real: Ejemplo Completo

**AHORA (con Blade)**:

```php
// app/Http/Controllers/OrderController.php
class OrderController extends Controller {
    public function __construct(private OrderService $service) {}

    public function create() {
        return view('orders.create', [
            'states' => EstadoOrden::all(),
            'priorities' => PrioridadOrden::all(),
        ]);
    }

    public function store(StoreOrderRequest $request) {
        try {
            $order = $this->service->createOrder($request->validated());
            
            return redirect()->route('orders.show', $order)
                ->with('success', 'Orden creada');
        } catch (InsufficientStockException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function show(Order $order) {
        return view('orders.show', [
            'order' => $order->load('details'),
        ]);
    }
}

// app/Services/OrderService.php - ESTA PARTE NUNCA CAMBIA
class OrderService {
    public function createOrder(array $data): Order {
        // Validar
        // Crear
        // Sugerir ubicaciones
        // Auditar
        // Disparar evento
        
        return $order;
    }
}

// resources/views/orders/create.blade.php
<form action="{{ route('orders.store') }}" method="POST">
    @csrf
    <input name="referencia_destino" />
    <!-- ... más campos ... -->
    <button>Crear Orden</button>
</form>
```

**MAÑANA (con Vite, cambio trivial)**:

```php
// app/Http/Controllers/Api/OrderController.php - SOLO ESTO CAMBIA
class OrderController extends Controller {
    public function __construct(private OrderService $service) {}

    // Ya no necesitas create(), el frontend lo hace
    
    public function store(StoreOrderRequest $request) {
        try {
            $order = $this->service->createOrder($request->validated());
            
            return new OrderResource($order);  // ← ÚNICO CAMBIO
        } catch (InsufficientStockException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function show(Order $order) {
        return new OrderResource($order->load('details'));  // ← ÚNICO CAMBIO
    }
}

// app/Services/OrderService.php - 100% IGUAL
class OrderService {
    public function createOrder(array $data): Order {
        // ... código exactamente igual ...
        return $order;
    }
}

// frontend/src/components/OrderForm.vue - NUEVO (no en Laravel)
<template>
    <form @submit="submitOrder">
        <input v-model="referencia_destino" />
        <button>Crear Orden</button>
    </form>
</template>

<script>
import { api } from '@/services/api'
export default {
    methods: {
        async submitOrder() {
            const response = await api.post('/api/orders', this.formData)
            // Renderear respuesta
        }
    }
}
</script>
```

---

### Resumen de Cambios Blade → Vite

**En Laboris**: 
- Controllers: cambiar `view()` → `new Resource()`
- Routes: mover a `routes/api.php`

**En Servicios**:
- 🎯 **Cero cambios**

**En Modelos**:
- 🎯 **Cero cambios**

**En Tests**:
- 🎯 **Cero cambios**

**Nuevo código**:
- Proyecto Vite separado (node_modules, webpack, etc)

---

### Timeline Realista

**Blade (HOY - Semanas 1-4)**:
- Setup estructura: 1 día
- Modelos + migraciones: 2 días
- Servicios: 4 días
- Controllers + Blade views: 3 días
- Tests: 2 días
- **Total: ~2-3 semanas**

**Migración a Vite (FUTURO - Semana X+6meses)**:
- Crear proyecto Vite: 1 día
- Cambiar controllers: 4-6 horas
- Crear componentes Vue/React: 3-5 días
- Tests de frontend: 2-3 días
- **Total: ~1-2 semanas** (vs 3-4 si tenías lógica en controladores)

---

### Ventaja Competitiva

Si cambias a Vite en 6 meses:
- **Con servicios ahora**: Refactorización de 1-2 semanas
- **Sin servicios**: Refactorización de 2-3 meses + riesgo alto de bugs

**Eso equivale a**: 2 developers por 2-3 meses = $15,000-20,000 de salarios ahorrados.

Invertir 1-2 horas extra AHORA en estructura = Ahorrar semanas de refactorización MAÑANA. 

**ROI: Infinito**

---
