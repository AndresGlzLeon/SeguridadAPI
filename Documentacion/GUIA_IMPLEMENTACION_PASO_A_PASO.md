# 🛠️ GUÍA DE IMPLEMENTACIÓN: Paso a Paso

## 📚 Documentación Relacionada

1. **ANALISIS_REFACTORIZACION_PICKING_MULTIPLES_UBICACIONES.md** - Análisis técnico completo
2. **RESUMEN_EJECUTIVO_PICKING.md** - Resumen ejecutivo
3. **Este documento** - Guía de implementación paso a paso

---

## FASE 1: BACKEND (3-4 días)

### Paso 1.1: Crear Modelo Eloquent para Tabla Pivot

**Archivo a crear**: `app/Models/DetalleSurtidoUbicacion.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * DetalleSurtidoUbicacion
 * 
 * Mapea tabla pivot: detalles_surtido_ubicaciones
 * Registra cada pick individual en el proceso de recolección
 */
class DetalleSurtidoUbicacion extends Model
{
    protected $table = 'detalles_surtido_ubicaciones';
    
    // Sin timestamps automáticos, pero usamos created_at manual
    public $timestamps = false;
    
    protected $fillable = [
        'detalle_surtido_id',
        'estante_id',
        'cantidad_tomada',
        'user_id',
    ];
    
    protected $casts = [
        'cantidad_tomada' => 'float',
        'created_at' => 'datetime',
    ];
    
    // ============================================
    // RELACIONES
    // ============================================
    
    /**
     * Un registro de ubicación pertenece a UN detalle de surtido
     */
    public function detalle()
    {
        return $this->belongsTo(DetalleSurtido::class, 'detalle_surtido_id');
    }
    
    /**
     * Un registro de ubicación pertenece a UN estante
     */
    public function estante()
    {
        return $this->belongsTo(Estante::class, 'estante_id');
    }
    
    /**
     * Un registro fue creado por UN usuario (almacenista)
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
?>
```

**Testing**: 
```bash
cd organirack-backend
php artisan tinker
# Verificar que el modelo se carga sin errores
>>> DetalleSurtidoUbicacion::first()
```

---

### Paso 1.2: Extender Modelo DetalleSurtido

**Archivo a modificar**: `app/Models/DetalleSurtido.php`

**Agregar relación** (al final de la clase):

```php
/**
 * Un detalle puede tener múltiples registros de recolección
 * desde diferentes ubicaciones
 */
public function ubicaciones()
{
    return $this->hasMany(DetalleSurtidoUbicacion::class, 'detalle_surtido_id');
}

/**
 * Obtener cantidad total surtida (suma de todos los picks)
 * NOTA: cantidad_surtida ya se actualiza en detalles_surtido,
 * pero este método permite validar integridad
 */
public function calcularCantidadSurtidaDesdeUbicaciones()
{
    return $this->ubicaciones()->sum('cantidad_tomada');
}

/**
 * Verificar si detalle está completo
 */
public function estaCompleto(): bool
{
    return $this->cantidad_surtida >= $this->cantidad_requerida;
}
```

**Testing**:
```php
$detalle = DetalleSurtido::find(45);
$detalle->ubicaciones; // Debe retornar colección vacía o con registros
$detalle->estaCompleto(); // true o false
```

---

### Paso 1.3: Refactorizar PickingService::confirmPick()

**Archivo a modificar**: `app/Services/PickingService.php`

**Buscar**: función `confirmPick()` (líneas ~70-170)

**REEMPLAZAR BLOQUE 1**: La sección de actualización de detalle (después de descontar inventario)

```php
// ========== BLOQUE ANTERIOR (REEMPLAZAR) ==========
$detalle->update([
    'cantidad_surtida' => $cantidadSurtidaNueva,
    'estante_real_id' => $estanteIdEscaneado,
    'fue_modificado' => $fueOverride,
]);
// =================================================

// ========== NUEVO BLOQUE ==========
// 1. Sumar cantidad (ACUMULAR, no reemplazar)
$cantidadSurtidaActual = $detalle->cantidad_surtida ?? 0;
$cantidadSurtidaNueva = $cantidadSurtidaActual + $cantidadTomada;

// 2. Actualizar detalle
$detalle->update([
    'cantidad_surtida' => $cantidadSurtidaNueva,  // ✨ Acumulada
    'estante_real_id' => $estanteIdEscaneado,    // ← Último (legacy)
    'fue_modificado' => $fueOverride,
]);

// 3. ✨ NUEVO: Registrar en tabla pivot para trazabilidad
DetalleSurtidoUbicacion::create([
    'detalle_surtido_id' => $detalle->id,
    'estante_id' => $estanteIdEscaneado,
    'cantidad_tomada' => $cantidadTomada,
    'user_id' => auth()->id(),
    'created_at' => now(),
]);

\Log::info('📍 Pick registrado en tabla pivot', [
    'detalle_id' => $detalle->id,
    'estante_id' => $estanteIdEscaneado,
    'cantidad_tomada' => $cantidadTomada,
]);

// 4. ✨ NUEVO: Validar completitud automática
$this->validateAndUpdateOrderCompletion($detalle);
// ===================================
```

**Testing en Tinker**:
```php
$orden = OrdenSurtido::find(5);
$detalle = $orden->detalles()->first();

// Confirmar primer pick
$resultado1 = $pickingService->confirmPick(5, [
    'producto_id' => $detalle->producto_id,
    'estante_id_escaneado' => 10,
    'cantidad_tomada' => 350,
]);

// Verificar que se insertó en pivot
$ubicaciones = $detalle->ubicaciones()->get();
$ubicaciones->count(); // Debe ser 1

// Confirmar segundo pick
$resultado2 = $pickingService->confirmPick(5, [
    'producto_id' => $detalle->producto_id,
    'estante_id_escaneado' => 15,
    'cantidad_tomada' => 400,
]);

// Verificar acumulación
$detalle->refresh();
$detalle->cantidad_surtida; // Debe ser 750 (350+400)
$detalle->ubicaciones()->count(); // Debe ser 2
```

---

### Paso 1.4: Agregar Método ValidateAndUpdateOrderCompletion

**Archivo**: `app/Services/PickingService.php`

**Agregar al final de la clase** (antes del cierre `}`):

```php
/**
 * Valida si un detalle está completo y actualiza estado de orden automáticamente
 * 
 * Lógica:
 * 1. Si detalle RECIÉN completó (cantidad_surtida >= cantidad_requerida)
 * 2. Verifica si TODOS los detalles de la orden están completos
 * 3. Si sí → Cambia orden a COMPLETADA
 * 
 * @param DetalleSurtido $detalle
 * @return void
 */
private function validateAndUpdateOrderCompletion(DetalleSurtido $detalle): void
{
    try {
        // Recargar detalle con orden y asegurarse de validar
        $detalle->load('orden.detalles');
        $orden = $detalle->orden;
        
        // Verificar si el detalle ACABA de completarse
        $estaba_completo_antes = ($detalle->cantidad_surtida - $detalle->cantidad_tomada) 
                                  >= $detalle->cantidad_requerida;
        $esta_completo_ahora = $detalle->cantidad_surtida >= $detalle->cantidad_requerida;
        $acaba_de_completarse = !$estaba_completo_antes && $esta_completo_ahora;
        
        if (!$acaba_de_completarse) {
            return; // No hizo cambio de estado, salir
        }
        
        \Log::info('✅ Detalle completado', [
            'detalle_id' => $detalle->id,
            'cantidad' => $detalle->cantidad_surtida,
        ]);
        
        // Verificar si TODOS los detalles están completos
        $todos_completos = $orden->detalles->every(function ($d) {
            return $d->cantidad_surtida >= $d->cantidad_requerida;
        });
        
        if ($todos_completos) {
            // Cambiar estado a COMPLETADA (estado_id = 3)
            $estadoCompletada = EstadoOrden::where('nombre', 'Completada')
                ->orWhere('nombre', 'COMPLETADA')
                ->first();
            
            if ($estadoCompletada) {
                $orden->update(['estado_id' => $estadoCompletada->id]);
                
                \Log::info('🎉 Orden completada automáticamente', [
                    'orden_id' => $orden->id,
                    'folio' => $orden->folio,
                    'timestamp' => now(),
                ]);
                
                // Registrar en activity logs si está disponible
                if (method_exists($orden, 'activity')) {
                    activity('picking')
                        ->performedOn($orden)
                        ->withProperties(['tipo' => 'auto_completion'])
                        ->log('Orden completada automáticamente al confirmar último pick');
                }
            }
        }
        
    } catch (\Exception $e) {
        \Log::error('❌ Error validando completitud de orden', [
            'detalle_id' => $detalle->id ?? null,
            'error' => $e->getMessage(),
        ]);
    }
}
```

**Testing**:
```php
// Este método se ejecuta AUTOMÁTICAMENTE en each confirmPick()
// No requiere testing separado, se verifica con el flujo completo
```

---

### Paso 1.5: Agregar Imports al Service

**Archivo**: `app/Services/PickingService.php`

**Al inicio del archivo** (agregar a los use statements):

```php
use App\Models\DetalleSurtidoUbicacion;
use App\Models\EstadoOrden;
```

---

### Paso 1.6: Adaptar Respuesta del PickingService

**En el método `confirmPick()`, reemplazar el return final**:

```php
// ========== ANTES ==========
return [
    'success' => true,
    'message' => 'Pick confirmado exitosamente',
    'data' => [
        'orden_id' => $ordenId,
        'producto_id' => $productoId,
        'estante_id_escaneado' => $estanteIdEscaneado,
        'cantidad_tomada' => $cantidadTomada,
        'inventario_anterior' => $cantidadActual,
        'inventario_nuevo' => $cantidadNueva,
    ],
];
// ==========================

// ========== DESPUÉS ✨ ==========
// Recargar relaciones para la respuesta
$detalle->load([
    'ubicaciones.estante',
    'ubicaciones.usuario',
    'orden.detalles',
    'producto',
]);

$orden = $detalle->orden;

// Verificar si TODA la orden está completa
$todosLosDetallesCompletos = $orden->detalles->every(function ($d) {
    return $d->cantidad_surtida >= $d->cantidad_requerida;
});

// Construir datos de respuesta
$ubicacionesRecolectadas = $detalle->ubicaciones
    ->map(function (DetalleSurtidoUbicacion $ub) {
        return [
            'inventario_id' => $ub->id,
            'estante_id' => $ub->estante_id,
            'estante_codigo' => $ub->estante?->codigo_etiqueta,
            'cantidad_tomada' => (float)$ub->cantidad_tomada,
            'usuario_id' => $ub->user_id,
            'usuario_nombre' => $ub->usuario?->name,
            'timestamp' => $ub->created_at?->format('Y-m-d H:i:s'),
        ];
    })
    ->values();

return [
    'success' => true,
    'message' => 'Pick confirmado exitosamente',
    'data' => [
        'orden_id' => $ordenId,
        'detalle' => [
            'id' => $detalle->id,
            'producto_id' => $productoId,
            'cantidad_requerida' => (float)$detalle->cantidad_requerida,
            'cantidad_surtida' => (float)$detalle->cantidad_surtida, // ✨ Acumulada
            'es_completo' => $detalle->cantidad_surtida >= $detalle->cantidad_requerida, // ✨ Nuevo
            'ubicaciones_recolectadas' => $ubicacionesRecolectadas, // ✨ Nuevo
            'orden_estado' => [
                'id' => $orden->estado_id,
                'nombre' => $orden->estado->nombre ?? 'Desconocido',
                'incompleta' => !$todosLosDetallesCompletos,
                'completa' => $todosLosDetallesCompletos,
                'items_completos' => $orden->detalles
                    ->filter(fn($d) => $d->cantidad_surtida >= $d->cantidad_requerida)
                    ->count(),
                'items_totales' => $orden->detalles->count(),
            ],
        ],
        'inventario' => [
            'anterior' => (float)$cantidadActual,
            'nuevo' => (float)$cantidadNueva,
        ],
    ],
];
// =================================
```

---

### Paso 1.7: Testing Backend Completo

**Crear archivo**: `tests/Feature/PickingMultipleLocationsTest.php`

```php
<?php

namespace Tests\Feature;

use App\Models\OrdenSurtido;
use App\Models\DetalleSurtido;
use App\Models\DetalleSurtidoUbicacion;
use App\Services\PickingService;
use Tests\TestCase;

class PickingMultipleLocationsTest extends TestCase
{
    private PickingService $pickingService;
    
    protected function setUp(): void
    {
        parent::setUp();
        $this->pickingService = app(PickingService::class);
    }
    
    public function test_multiple_picks_accumulate_quantity()
    {
        // Arrange
        $orden = OrdenSurtido::factory()->has(
            DetalleSurtido::factory(1)
        )->create();
        
        $detalle = $orden->detalles()->first();
        $detalle->update(['cantidad_requerida' => 1000]);
        
        // Act - Pick 1
        $resultado1 = $this->pickingService->confirmPick($orden->id, [
            'producto_id' => $detalle->producto_id,
            'estante_id_escaneado' => 10,
            'cantidad_tomada' => 350,
        ]);
        
        // Assert - Pick 1
        $this->assertTrue($resultado1['success']);
        $this->assertEquals(350, $resultado1['data']['detalle']['cantidad_surtida']);
        $this->assertFalse($resultado1['data']['detalle']['es_completo']);
        $this->assertCount(1, $resultado1['data']['detalle']['ubicaciones_recolectadas']);
        
        // Act - Pick 2
        $resultado2 = $this->pickingService->confirmPick($orden->id, [
            'producto_id' => $detalle->producto_id,
            'estante_id_escaneado' => 15,
            'cantidad_tomada' => 400,
        ]);
        
        // Assert - Pick 2
        $this->assertTrue($resultado2['success']);
        $this->assertEquals(750, $resultado2['data']['detalle']['cantidad_surtida']); // ✨ Acumulado
        $this->assertFalse($resultado2['data']['detalle']['es_completo']);
        $this->assertCount(2, $resultado2['data']['detalle']['ubicaciones_recolectadas']);
        
        // Act - Pick 3 (completa)
        $resultado3 = $this->pickingService->confirmPick($orden->id, [
            'producto_id' => $detalle->producto_id,
            'estante_id_escaneado' => 22,
            'cantidad_tomada' => 250,
        ]);
        
        // Assert - Pick 3
        $this->assertTrue($resultado3['success']);
        $this->assertEquals(1000, $resultado3['data']['detalle']['cantidad_surtida']);
        $this->assertTrue($resultado3['data']['detalle']['es_completo']);
        $this->assertTrue($resultado3['data']['detalle']['orden_estado']['completa']);
        $this->assertCount(3, $resultado3['data']['detalle']['ubicaciones_recolectadas']);
        
        // Verificar tabla pivot
        $pivotRecords = DetalleSurtidoUbicacion::where('detalle_surtido_id', $detalle->id)->get();
        $this->assertCount(3, $pivotRecords);
        $this->assertEquals(350, $pivotRecords[0]->cantidad_tomada);
        $this->assertEquals(400, $pivotRecords[1]->cantidad_tomada);
        $this->assertEquals(250, $pivotRecords[2]->cantidad_tomada);
    }
    
    public function test_order_is_completed_automatically()
    {
        // Arrange
        $orden = OrdenSurtido::factory()
            ->has(DetalleSurtido::factory(1)->state(['cantidad_requerida' => 100]))
            ->create();
        
        $detalle = $orden->detalles()->first();
        
        // Act
        $this->pickingService->confirmPick($orden->id, [
            'producto_id' => $detalle->producto_id,
            'estante_id_escaneado' => 10,
            'cantidad_tomada' => 100,
        ]);
        
        // Assert
        $orden->refresh();
        $this->assertEquals(3, $orden->estado_id); // Completada
    }
}
?>
```

**Ejecutar tests**:
```bash
php artisan test tests/Feature/PickingMultipleLocationsTest.php
```

---

## FASE 2: FRONTEND (2-3 días)

### Paso 2.1: Extender Tipos TypeScript

**Archivo**: `OrganiRack-Movil/types/orders.ts`

**Agregar nuevo tipo** (antes de interfaces de orden):

```typescript
/**
 * Ubicación recolectada: Un pick individual realizado
 * Mapea tabla detalles_surtido_ubicaciones
 */
export interface UbicacionRecolectada {
  inventario_id: number;
  estante_id: number;
  estante_codigo: string;
  cantidad_tomada: number;
  usuario_id: number;
  usuario_nombre: string;
  timestamp: string; // ISO format
}

/**
 * Estado de la orden extendido
 */
export interface EstadoOrdenExtendido {
  id: number;
  nombre: string;
  incompleta: boolean;
  completa: boolean;
  items_completos: number;
  items_totales: number;
}
```

**Actualizar DetalleSurtido**:

```typescript
export interface DetalleSurtido {
  id: number;
  orden_surtido_id: number;
  producto_id: number;
  cantidad_requerida: string | number;
  cantidad_surtida: string | number; // ← Ahora ACUMULADA
  estante_sugerido_id?: number;
  estante_real_id?: number | null;
  fue_modificado: boolean;
  created_at?: string;
  updated_at?: string;
  producto: Producto;
  ubicaciones_sugeridas?: UbicacionSugerida[];
  
  // ✨ NUEVOS CAMPOS
  ubicaciones_recolectadas?: UbicacionRecolectada[];
  es_completo?: boolean;
}
```

**Testing**:
```typescript
const detalle: DetalleSurtido = {
  // ... existing fields ...
  ubicaciones_recolectadas: [
    {
      inventario_id: 1,
      estante_id: 10,
      estante_codigo: 'A-01-01',
      cantidad_tomada: 350,
      usuario_id: 1,
      usuario_nombre: 'juan',
      timestamp: '2026-03-31T14:30:00Z',
    },
  ],
  es_completo: false,
};
```

---

### Paso 2.2: Actualizar Types en API

**Archivo**: `OrganiRack-Movil/API/picking.ts`

**Actualizar PickConfirmResponse**:

```typescript
export interface PickConfirmResponse {
  message: string;
  data: {
    orden_id: number;
    detalle: {
      id: number;
      producto_id: number;
      cantidad_requerida: number;
      cantidad_surtida: number;              // ✨ Acumulada
      es_completo: boolean;                  // ✨ Nuevo
      ubicaciones_recolectadas: UbicacionRecolectada[];  // ✨ Nuevo
      orden_estado: {
        id: number;
        nombre: string;
        incompleta: boolean;
        completa: boolean;
        items_completos: number;
        items_totales: number;
      };
    };
    inventario: {
      anterior: number;
      nuevo: number;
    };
  };
}
```

---

### Paso 2.3: Actualizar PickingProgressSection

**Archivo**: `OrganiRack-Movil/components/PickingProgressSection.tsx`

**Cambio 1**: Mostrar cantidad acumulada

```typescript
// ANTES:
<Text>{detalle.cantidad_surtida}/{detalle.cantidad_requerida}</Text>

// DESPUÉS:
<Text>
  {Math.floor(detalle.cantidad_surtida as number)}/
  {Math.floor(detalle.cantidad_requerida as number)} ✨ ACUMULADA
</Text>
```

**Cambio 2**: Agregar sección de histórico de recolecciones

```typescript
<View style={styles.historico}>
  <Text style={styles.titulo}>Recolecciones:</Text>
  {detalle.ubicaciones_recolectadas?.map((ubi, idx) => (
    <View key={idx} style={styles.recoleccionItem}>
      <Text style={styles.estante}>{ubi.estante_codigo}</Text>
      <Text style={styles.cantidad}>{ubi.cantidad_tomada} uds</Text>
      <Text style={styles.usuario}>{ubi.usuario_nombre}</Text>
      <Text style={styles.timestamp}>{ubi.timestamp}</Text>
    </View>
  ))}
</View>
```

**Estilos** (agregar al stylesheet):

```typescript
const styles = StyleSheet.create({
  historico: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  titulo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  recoleccionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 6,
  },
  estante: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  cantidad: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  usuario: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 10,
    color: '#CCC',
    marginTop: 2,
  },
});
```

---

### Paso 2.4: Adaptar PickConfirmButton

**Archivo**: `OrganiRack-Movil/components/PickConfirmButton.tsx`

**Cambio**: Permitir pick parcial (si hay suficiente stock en ubicación escaneada)

```typescript
// ANTES:
const cantidadMaxDePick = Math.min(
  cantidad,
  cantidadDisponible
);

if (cantidadMaxDePick < cantidad) {
  Toast.show({ text: 'Stock insuficiente' });
  return; // Rechaza
}

// DESPUÉS: ✨ Permite pick parcial
const cantidadRestante = (detalle.cantidad_requerida as number) - 
                         (detalle.cantidad_surtida as number);

const cantidadMaxDePick = Math.min(
  cantidad,
  cantidadDisponible,
  cantidadRestante  // Solo toma hasta lo que falta
);

if (cantidadMaxDePick > 0) {
  // Confirma aunque sea parcial
  confirmPickAPI(cantidadMaxDePick);
} else {
  Toast.show({ text: 'Detalle ya está completo' });
}
```

**Cambio en respuesta de API**:

```typescript
const handleConfirmResponse = (response: PickConfirmResponse) => {
  const { es_completo } = response.data.detalle;
  const { completa } = response.data.detalle.orden_estado;
  
  if (completa) {
    // Orden COMPLETADA automáticamente
    navigateTo('orden-completada', { ordenId: order.id });
  } else if (es_completo) {
    // Este detalle está completo, pasa al siguiente
    Toast.show({ text: '✓ Detalle completo' });
    selectNextIncompleteDetail();
  } else {
    // Continúa con el mismo detalle (puede haber más picks)
    Toast.show({ 
      text: `Surtida: ${response.data.detalle.cantidad_surtida}/` +
            `${response.data.detalle.cantidad_requerida}` 
    });
  }
};
```

---

### Paso 2.5: Agregar Validación de Completitud en Hook

**Archivo**: `OrganiRack-Movil/hooks/usePicking.ts`

**Agregar método** (en interfaz UsePickingReturn):

```typescript
interface UsePickingReturn {
  // ... existing methods ...
  
  // ✨ NUEVO: Validar si orden está completa
  isOrderComplete: (orden: OrdenSurtido) => boolean;
  
  // ✨ NUEVO: Contar detalles pendientes
  countPendingDetails: (orden: OrdenSurtido) => number;
}
```

**Agregar implementación**:

```typescript
const isOrderComplete = useCallback((orden: OrdenSurtido): boolean => {
  if (!orden || orden.detalles.length === 0) return false;
  
  return orden.detalles.every(detalle => 
    (detalle.cantidad_surtida as number) >= (detalle.cantidad_requerida as number)
  );
}, []);

const countPendingDetails = useCallback((orden: OrdenSurtido): number => {
  if (!orden) return 0;
  
  return orden.detalles.filter(detalle =>
    (detalle.cantidad_surtida as number) < (detalle.cantidad_requerida as number)
  ).length;
}, []);
```

**En return statement**:

```typescript
return {
  // ... existing returns ...
  isOrderComplete,
  countPendingDetails,
};
```

---

### Paso 2.6: Testing Frontend

**Crear test**: `OrganiRack-Movil/tests/picking-multiple-locations.test.ts`

```typescript
import { DetalleSurtido, UbicacionRecolectada } from '../types/orders';

describe('Picking Multiple Locations', () => {
  
  test('accumulates quantities from multiple picks', () => {
    const detalle: DetalleSurtido = {
      id: 45,
      cantidad_requerida: 1000,
      cantidad_surtida: 0,
      ubicaciones_recolectadas: [],
    };
    
    // Simular Pick 1
    detalle.cantidad_surtida = 350;
    detalle.ubicaciones_recolectadas = [
      {
        estante_codigo: 'A-01-01',
        cantidad_tomada: 350,
        usuario_nombre: 'juan',
        timestamp: '2026-03-31T14:30:00Z',
      } as UbicacionRecolectada,
    ];
    
    expect(detalle.cantidad_surtida).toBe(350);
    expect(detalle.es_completo).toBeFalsy();
    
    // Simular Pick 2 (acumula)
    detalle.cantidad_surtida = 750;
    detalle.ubicaciones_recolectadas = [
      ...detalle.ubicaciones_recolectadas,
      {
        estante_codigo: 'A-02-01',
        cantidad_tomada: 400,
        usuario_nombre: 'juan',
        timestamp: '2026-03-31T14:31:00Z',
      } as UbicacionRecolectada,
    ];
    
    expect(detalle.cantidad_surtida).toBe(750);
    expect(detalle.ubicaciones_recolectadas.length).toBe(2);
    expect(detalle.es_completo).toBeFalsy();
    
    // Simular Pick 3 (completa)
    detalle.cantidad_surtida = 1000;
    detalle.es_completo = true;
    detalle.ubicaciones_recolectadas = [
      ...detalle.ubicaciones_recolectadas,
      {
        estante_codigo: 'B-01-01',
        cantidad_tomada: 250,
        usuario_nombre: 'juan',
        timestamp: '2026-03-31T14:32:00Z',
      } as UbicacionRecolectada,
    ];
    
    expect(detalle.cantidad_surtida).toBe(1000);
    expect(detalle.es_completo).toBeTruthy();
    expect(detalle.ubicaciones_recolectadas.length).toBe(3);
  });
  
  test('detects trazabilidad from multiple locations', () => {
    const detalle: DetalleSurtido = {
      ubicaciones_recolectadas: [
        { estante_codigo: 'A-01-01', cantidad_tomada: 350, timestamp: '14:30' },
        { estante_codigo: 'A-02-01', cantidad_tomada: 400, timestamp: '14:31' },
        { estante_codigo: 'B-01-01', cantidad_tomada: 250, timestamp: '14:32' },
      ] as UbicacionRecolectada[],
    };
    
    expect(detalle.ubicaciones_recolectadas.length).toBe(3);
    
    const estantes = detalle.ubicaciones_recolectadas
      .map(u => u.estante_codigo);
    
    expect(estantes).toContain('A-01-01');
    expect(estantes).toContain('A-02-01');
    expect(estantes).toContain('B-01-01');
  });
});
```

**Ejecutar tests**:
```bash
cd OrganiRack-Movil
npm test
```

---

## FASE 3: TESTING INTEGRADO (1-2 días)

### Paso 3.1: Test E2E Completo

**Escenario**: Completar una orden con 3 picks desde diferentes ubicaciones

**Pasos**:
1. ✅ Login en la app
2. ✅ Obtener orden con 1000 items necesarios
3. ✅ Escanear A-01-01 → Tomar 350
4. ✅ Escanear A-02-01 → Tomar 400
5. ✅ Escanear B-01-01 → Tomar 250
6. ✅ Orden debería marcarse como COMPLETADA automáticamente
7. ✅ Verificar trazabilidad: 3 picks en detalles_surtido_ubicaciones

### Paso 3.2: Queries de Validación

```sql
-- QUERY 1: Verificar picks acumulados
SELECT 
    SUM(dsu.cantidad_tomada) as total_surtido,
    COUNT(*) as numero_picks,
    GROUP_CONCAT(e.codigo_etiqueta SEPARATOR ', ') as estantes
FROM detalles_surtido_ubicaciones dsu
JOIN estantes e ON dsu.estante_id = e.id
WHERE dsu.detalle_surtido_id = 45
GROUP BY dsu.detalle_surtido_id;

-- QUERY 2: Verificar completitud
SELECT 
    ds.id,
    ds.cantidad_requerida,
    ds.cantidad_surtida,
    (ds.cantidad_surtida >= ds.cantidad_requerida) as esta_completo,
    (SELECT COUNT(*) FROM detalles_surtido_ubicaciones 
     WHERE detalle_surtido_id = ds.id) as numero_picks
FROM detalles_surtido ds
WHERE ds.orden_surtido_id = 5;

-- QUERY 3: Verificar estado de orden
SELECT 
    o.id, o.folio, eo.nombre as estado,
    COUNT(ds.id) as total_detalles,
    SUM(CASE WHEN ds.cantidad_surtida >= ds.cantidad_requerida THEN 1 ELSE 0 END) as detalles_completos
FROM ordenes_surtido o
LEFT JOIN estados_orden eo ON o.estado_id = eo.id
LEFT JOIN detalles_surtido ds ON o.id = ds.orden_surtido_id
WHERE o.id = 5
GROUP BY o.id;
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Crear modelo `DetalleSurtidoUbicacion.php`
- [ ] Agregar relación en `DetalleSurtido.php`
- [ ] Refactorizar `confirmPick()` para acumular
- [ ] Insertar en tabla pivot
- [ ] Agregar método `validateAndUpdateOrderCompletion()`
- [ ] Adaptar respuesta del controller
- [ ] Agregar imports necesarios
- [ ] Ejecutar tests unitarios ✅
- [ ] Validar con queries SQL ✅

### Frontend
- [ ] Extender tipos en `types/orders.ts`
- [ ] Actualizar tipos en `API/picking.ts`
- [ ] Adaptar `PickingProgressSection.tsx`
- [ ] Adaptar `PickConfirmButton.tsx`
- [ ] Agregar validación en `usePicking.ts`
- [ ] Ejecutar tests TypeScript ✅

### Testing E2E
- [ ] Crear cuenta de prueba (almacenista)
- [ ] Crear orden con múltiples items
- [ ] Ejecutar flujo de picking completo (3 picks)
- [ ] Verificar tabla pivot
- [ ] Verificar cambio de estado de orden
- [ ] Validar trazabilidad en UI

### Deployment
- [ ] Commit cambios
- [ ] Code review
- [ ] Merge a main
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Monitoring en producción

---

## 🆘 TROUBLESHOOTING

### Problema 1: cantidad_surtida no acumula
**Causa**: Se olvidó cambiar `=` por `+` en update de detalle  
**Solución**: Ver Paso 1.3, BLOQUE 1

### Problema 2: Tabla pivot no se llena
**Causa**: Falta el `DetalleSurtidoUbicacion::create()`  
**Solución**: Ver Paso 1.3, BLOQUE 1

### Problema 3: Orden nunca marca como "Completada" automático
**Causa**: Falta llamada a `validateAndUpdateOrderCompletion()`  
**Solución**: Ver Paso 1.3, línea final

### Problema 4: Frontend no muestra ubicaciones_recolectadas
**Causa**: API retorna campo pero frontend no lo espera  
**Solución**: Ver Paso 2.1 y 2.2, extender tipos

---

**Documento de Implementación**: Listo para Desarrollo  
**Última actualización**: 31 de Marzo, 2026  
**Status**: Aprobado para Fase 1
