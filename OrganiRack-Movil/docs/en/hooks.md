# Hooks Reference

Complete reference for custom React hooks implementing picking system business logic.

## Overview

The picking system uses 8 specialized hooks, each handling a single responsibility. All hooks are located in `hooks/usePicking/` directory.

**Hook Organization:**

- `usePickingFlow` — Orchestrator coordinating all other hooks
- `usePickingOrder` — Order loading and management
- `usePickingDetails` — Navigation between order items
- `useLocationInput` — Location code parsing and validation
- `useAvailabilityCheck` — Product availability verification
- `usePickingConfirm` — Confirmation submission to backend
- `useOverrideMode` — Alternative location selection logic
- `usePickingUIState` — Modal and loading state management

## usePickingFlow

Main orchestrator hook combining functionality of all specialized hooks.

**Purpose:** Coordinates the complete picking workflow from order selection through pick confirmation.

**Import:**
```typescript
import { usePickingFlow } from '@hooks/usePicking';
```

**Return Type:**
```typescript
interface PickingFlowReturn {
  // Order state
  currentOrder: Order | null;
  currentItem: OrderItem | null;
  
  // UI state
  loading: boolean;
  confirming: boolean;
  error: string | null;
  
  // Operations
  loadOrder: (orderId: string) => Promise<void>;
  navigateToItem: (itemIndex: number) => void;
  setUserLocation: (location: string) => void;
  handlePickConfirm: () => Promise<void>;
  clearError: () => void;
  
  // Override mode
  overrideLocations: Location[];
  selectOverrideLocation: (location: Location) => void;
}
```

**Usage Example:**
```typescript
function scannerScreen() {
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
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  
  return (
    <>
      <ProductDetailSection item={currentItem} />
      <LocationInputSection 
        onLocationChange={setUserLocation}
        onConfirm={handlePickConfirm}
      />
    </>
  );
}
```

**Responsibilities:**
1. Initialize child hooks
2. Coordinate data flow between hooks
3. Handle state synchronization
4. Manage error propagation
5. Trigger API calls via specialized hooks

## usePickingOrder

Manages loading and state of current picking order.

**Purpose:** Fetch order data from backend and maintain order state throughout picking session.

**Return Type:**
```typescript
interface PickingOrderReturn {
  order: Order | null;
  loading: boolean;
  error: string | null;
  loadOrder: (orderId: string) => Promise<void>;
  updateOrderProgress: (itemsPicked: number) => void;
}
```

**Type Definition:**
```typescript
interface Order {
  id: number;
  order_number: string;
  customer: string;
  total_items: number;
  items_picked: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: number;
  items: OrderItem[];
  created_at: string;
  due_date: string;
}

interface OrderItem {
  id: number;
  sku: string;
  name: string;
  quantity_ordered: number;
  quantity_picked: number;
  unit: string;
  location_suggested: string;
  locations_alternative: string[];
}
```

**Implementation Details:**
```typescript
function usePickingOrder(): PickingOrderReturn {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadOrder = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderDetailsAPI(orderId);
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { order, loading, error, loadOrder, updateOrderProgress };
}
```

## usePickingDetails

Manages navigation between items within current order.

**Purpose:** Track current item index and provide navigation functions between items.

**Return Type:**
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

**Usage:**
```typescript
const details = usePickingDetails(order);

// Navigate to specific item
details.navigateToItem(2);

// Navigate between items
if (details.canNavigateNext) {
  details.navigateNext();
}
```

**State Management:**
- Maintains current item index in component state
- Returns current item by selecting from order.items array
- Prevents navigation beyond array bounds

## useLocationInput

Parses and validates location input from user.

**Purpose:** Process user location input (scanned or typed) and convert to standard format.

**Return Type:**
```typescript
interface LocationInputReturn {
  userInput: string;
  parsedLocation: Location | null;
  inputError: string | null;
  setUserInput: (input: string) => void;
  validateLocation: () => boolean;
}

interface Location {
  aisle: string;
  shelf: number;
  position: number;
  formatted: string; // 'A-01-01'
}
```

**Input Formats Accepted:**
- Structured: `A-01-01` (recommended)
- Compact: `A0101`
- QR Code: Encoded location format from barcode

**Parsing Logic:**
```typescript
function parseLocation(input: string): Location | null {
  // Remove extra whitespace and convert to uppercase
  const clean = input.trim().toUpperCase();
  
  // Try structured format: A-01-01
  if (/^[A-Z]-\d{2}-\d{2}$/.test(clean)) {
    const [aisle, shelf, pos] = clean.split('-');
    return {
      aisle,
      shelf: parseInt(shelf),
      position: parseInt(pos),
      formatted: clean
    };
  }
  
  // Try compact format: A0101
  if (/^[A-Z]\d{4}$/.test(clean)) {
    const aisle = clean[0];
    const shelf = parseInt(clean.substring(1, 3));
    const position = parseInt(clean.substring(3, 5));
    return {
      aisle,
      shelf,
      position,
      formatted: `${aisle}-${shelf.toString().padStart(2, '0')}-${position.toString().padStart(2, '0')}`
    };
  }
  
  return null;
}
```

**Error Cases:**
- Invalid format: `Invalid location format`
- Out of range: `Shelf/position out of valid range`
- Missing input: `Location required`

## useAvailabilityCheck

Verifies product availability at specified location.

**Purpose:** Query backend to confirm product is in stock at requested location.

**Return Type:**
```typescript
interface AvailabilityCheckReturn {
  available: boolean;
  quantity: number;
  checking: boolean;
  error: string | null;
  checkAvailability: (orderId: string, location: string) => Promise<boolean>;
}
```

**Usage:**
```typescript
const availability = useAvailabilityCheck();

const isAvailable = await availability.checkAvailability(
  currentOrder.id,
  userLocation
);

if (isAvailable && availability.quantity >= neededQuantity) {
  // Proceed to confirmation
} else {
  // Show error or suggest alternatives
}
```

**Implementation:**
```typescript
async function checkAvailability(
  orderId: string,
  location: string
): Promise<boolean> {
  setChecking(true);
  try {
    const result = await checkAvailabilityAPI(orderId, location);
    setAvailable(result.available);
    setQuantity(result.quantity);
    return result.available;
  } catch (err) {
    setError(err.message);
    return false;
  } finally {
    setChecking(false);
  }
}
```

## usePickingConfirm

Submits picking confirmation to backend.

**Purpose:** Handle API submission of confirmed picks and manage confirmation state.

**Return Type:**
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

**Usage:**
```typescript
const confirm = usePickingConfirm();

const handleConfirm = async () => {
  await confirm.submitConfirmation({
    order_id: order.id,
    item_id: currentItem.id,
    location_picked: userLocation,
    quantity_picked: quantityToPick,
    estante_id: estanteIdFromValidation,
    timestamp: new Date().toISOString()
  });
  
  if (!confirm.error) {
    navigateToNextItem();
  }
};
```

**Error Handling:**
- 422 Validation Error: Field-specific errors returned to component
- 401 Unauthorized: Automatic token refresh via interceptor
- Network Error: Retry logic with exponential backoff

## useOverrideMode

Manages alternative location selection when primary location unavailable.

**Purpose:** Handle override mode logic for selecting alternative locations from list.

**Return Type:**
```typescript
interface OverrideModeReturn {
  overrideLocations: Location[];
  selectedLocation: Location | null;
  selectLocation: (location: Location) => void;
  isOverrideActive: boolean;
  exitOverride: () => void;
}
```

**Usage:**
```typescript
const override = useOverrideMode(currentItem);

return (
  <OverrideLocationsList
    locations={override.overrideLocations}
    onSelect={override.selectLocation}
    selected={override.selectedLocation}
  />
);
```

**Features:**
- Filter and normalize alternative locations
- Prevent duplicate locations
- Validate selected location before submission
- Reset selection on order change

## usePickingUIState

Manages UI state for modals and loading indicators.

**Purpose:** Centralize UI state (loading, modals, dialogs) separate from business logic.

**Return Type:**
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

**Usage:**
```typescript
const ui = usePickingUIState();

return (
  <>
    {ui.showErrorAlert && (
      <ErrorAlert message={ui.errorMessage} onDismiss={ui.closeErrorAlert} />
    )}
    
    <Button onPress={ui.openConfirmDialog} />
    
    {ui.showConfirmDialog && (
      <ConfirmDialog
        onConfirm={() => {
          ui.setLoading(true);
          handleConfirm();
        }}
      />
    )}
  </>
);
```

## Testing Hooks

### Testing with renderHook

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePickingOrder } from '@hooks/usePicking';

describe('usePickingOrder', () => {
  it('should load order successfully', async () => {
    const { result } = renderHook(() => usePickingOrder());
    
    act(() => {
      result.current.loadOrder('ORDER123');
    });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.order).toBeDefined();
    });
  });
  
  it('should handle API errors', async () => {
    const { result } = renderHook(() => usePickingOrder());
    
    act(() => {
      result.current.loadOrder('INVALID');
    });
    
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });
});
```

## Best Practices

### 1. Always Handle Loading and Error States

```typescript
function Component() {
  const { loading, error, data } = usePickingOrder();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  return <Content data={data} />;
}
```

### 2. Use useCallback for Stable Function References

```typescript
// Prevents unnecessary hook re-initializations in child components
const handleConfirm = useCallback(async () => {
  // Implementation
}, [dependencies]);
```

### 3. Separate Concerns Between Hooks

Do not combine multiple responsibilities in single hook. Each hook should do one thing well.

### 4. Test Hooks in Isolation

Test each hook independently before testing integration with other hooks.

## Performance Optimization

### 1. Memoize Derived Values

```typescript
const availableLocations = useMemo(
  () => locations.filter(l => l.available),
  [locations]
);
```

### 2. Avoid Unnecessary Re-renders

```typescript
const handleLocationSelect = useCallback(
  (location) => selectLocation(location),
  [selectLocation]
);
```

### 3. Cancel Ongoing Requests on Unmount

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
