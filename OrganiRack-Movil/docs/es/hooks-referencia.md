# Referencia de Hooks Personalizados

Referencia completa de hooks React personalizados que implementan la lógica del sistema de picking.

## Descripción General

El sistema de picking usa 8 hooks especializados, cada uno manejando una responsabilidad única. Todos los hooks están ubicados en directorio `hooks/usePicking/`.

**Organización de Hooks:**

- `usePickingFlow` — Orquestador coordinando todos los demás hooks
- `usePickingOrder` — Carga y gestión de órdenes
- `usePickingDetails` — Navegación entre items de la orden
- `useLocationInput` — Parseo y validación de entrada de ubicación
- `useAvailabilityCheck` — Verificación de disponibilidad de producto
- `usePickingConfirm` — Envío de confirmación a backend
- `useOverrideMode` — Lógica de selección de ubicaciones alternativas
- `usePickingUIState` — Gestión de estado de UI

## usePickingFlow

Hook orquestador principal que combina funcionalidad de todos los hooks especializados.

**Propósito:** Coordinar el flujo completo de picking desde selección de orden hasta confirmación.

**Import:**
```typescript
import { usePickingFlow } from '@hooks/usePicking';
```

**Tipo de Retorno:**
```typescript
interface PickingFlowReturn {
  // Estado de orden
  currentOrder: Order | null;
  currentItem: OrderItem | null;
  
  // Estado de UI
  loading: boolean;
  confirming: boolean;
  error: string | null;
  
  // Operaciones
  loadOrder: (orderId: string) => Promise<void>;
  navigateToItem: (itemIndex: number) => void;
  setUserLocation: (location: string) => void;
  handlePickConfirm: () => Promise<void>;
  clearError: () => void;
}
```

**Ejemplo de Uso:**
```typescript
function pantallaScanner() {
  const {
    currentOrder,
    currentItem,
    loading,
    error,
    loadOrder,
    handlePickConfirm,
    setUserLocation
  } = usePickingFlow();
  
  useEffect(() => {
    loadOrder('ORDER123');
  }, []);
  
  if (loading) return <CargadorEspera />;
  if (error) return <AlertaError message={error} />;
  
  return (
    <>
      <SeccionDetalle item={currentItem} />
      <SeccionUbicacion 
        onLocationChange={setUserLocation}
        onConfirm={handlePickConfirm}
      />
    </>
  );
}
```

## usePickingOrder

Gestiona carga y estado de la orden actual de picking.

**Propósito:** Obtener datos de orden del backend y mantener estado de orden durante sesión de picking.

**Tipo de Retorno:**
```typescript
interface PickingOrderReturn {
  order: Order | null;
  loading: boolean;
  error: string | null;
  loadOrder: (orderId: string) => Promise<void>;
  updateOrderProgress: (itemsPicked: number) => void;
}
```

## usePickingDetails

Gestiona navegación entre items dentro de la orden actual.

**Propósito:** Rastrear índice de item actual y proporcionar funciones de navegación entre items.

**Tipo de Retorno:**
```typescript
interface PickingDetailsReturn {
  currentItemIndex: number;
  currentItem: OrderItem | null;
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
  navigateToItem: (index: number) => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
}
```

## useLocationInput

Parsea y valida entrada de ubicación del usuario.

**Propósito:** Procesar entrada de ubicación del usuario (escaneada o ingresada) y convertir a formato estándar.

**Tipo de Retorno:**
```typescript
interface LocationInputReturn {
  userInput: string;
  parsedLocation: Location | null;
  inputError: string | null;
  setUserInput: (input: string) => void;
  validateLocation: () => boolean;
}
```

**Formatos de Entrada Aceptados:**
- Estructurado: `A-01-01` (recomendado)
- Compacto: `A0101`
- Código QR: Formato de ubicación codificado en código de barras

## useAvailabilityCheck

Verifica disponibilidad de producto en ubicación especificada.

**Propósito:** Consultar backend para confirmar que el producto está en stock en la ubicación solicitada.

**Tipo de Retorno:**
```typescript
interface AvailabilityCheckReturn {
  available: boolean;
  quantity: number;
  checking: boolean;
  error: string | null;
  checkAvailability: (orderId: string, location: string) => Promise<boolean>;
}
```

**Ejemplo de Uso:**
```typescript
const availability = useAvailabilityCheck();

const isAvailable = await availability.checkAvailability(
  currentOrder.id,
  userLocation
);

if (isAvailable && availability.quantity >= neededQuantity) {
  // Proceder a confirmación
} else {
  // Mostrar error o sugerir alternativas
}
```

## usePickingConfirm

Envía confirmación de picking al backend.

**Propósito:** Manejar envío de API de picks confirmados y gestionar estado de confirmación.

**Tipo de Retorno:**
```typescript
interface PickingConfirmReturn {
  confirming: boolean;
  error: string | null;
  success: boolean;
  submitConfirmation: (data: ConfirmationData) => Promise<void>;
}

interface ConfirmationData {
  order_id: number;
  item_id: number;
  location_picked: string;
  quantity_picked: number;
  estante_id: number;
  timestamp: string;
}
```

## useOverrideMode

Gestiona lógica de selección de ubicaciones alternativas cuando ubicación primaria no está disponible.

**Propósito:** Manejar lógica de modo override para seleccionar ubicaciones alternativas de lista.

**Tipo de Retorno:**
```typescript
interface OverrideModeReturn {
  overrideLocations: Location[];
  selectedLocation: Location | null;
  selectLocation: (location: Location) => void;
  isOverrideActive: boolean;
  exitOverride: () => void;
}
```

## usePickingUIState

Gestiona estado de UI para modales e indicadores de cargando.

**Propósito:** Centralizar estado de UI (cargando, modales, diálogos) separado de lógica empresarial.

**Tipo de Retorno:**
```typescript
interface PickingUIStateReturn {
  showLocationModal: boolean;
  showConfirmDialog: boolean;
  showErrorAlert: boolean;
  isLoading: boolean;
  
  openLocationModal: () => void;
  closeLocationModal: () => void;
  openConfirmDialog: () => void;
  closeConfirmDialog: () => void;
  openErrorAlert: (message: string) => void;
  closeErrorAlert: () => void;
  setLoading: (value: boolean) => void;
}
```

## Mejores Prácticas

### 1. Siempre Manejar Estados de Cargando y Error

```typescript
function Componente() {
  const { loading, error, data } = usePickingOrder();
  
  if (loading) return <CargadorEspera />;
  if (error) return <MensajeError error={error} />;
  return <Contenido data={data} />;
}
```

### 2. Usar useCallback para Referencias Estables

```typescript
// Previene re-inicializaciones de hooks en componentes hijos
const handleConfirm = useCallback(async () => {
  // Implementación
}, [dependencies]);
```

### 3. Separar Responsabilidades Entre Hooks

No combinar múltiples responsabilidades en un solo hook. Cada hook debe hacer una cosa bien.

### 4. Testear Hooks Aisladamente

Testear cada hook independientemente antes de testear integración con otros hooks.

## Optimización de Rendimiento

### 1. Memoizar Valores Derivados

```typescript
const ubicacionesDisponibles = useMemo(
  () => ubicaciones.filter(l => l.available),
  [ubicaciones]
);
```

### 2. Evitar Re-renderizados Innecesarios

```typescript
const handleLocationSelect = useCallback(
  (location) => selectLocation(location),
  [selectLocation]
);
```

### 3. Cancelar Solicitudes en Curso al Desmontar

```typescript
useEffect(() => {
  let isMounted = true;
  
  loadOrder(orderId).then(() => {
    if (isMounted) {
      setOrder(data);
    }
  });
  
  return () => { isMounted = false; };
}, [orderId]);
```
