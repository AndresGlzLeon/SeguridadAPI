# Troubleshooting Guide

Solutions for common issues encountered during development and production deployment.

## Authentication Issues

### Issue: Login Fails with Invalid Credentials

**Symptoms:**
- 401 Unauthorized response on login attempt
- Error message: "Invalid credentials"
- Authentication state not updating

**Root Causes:**
1. Incorrect email or password
2. User account not active in backend
3. Backend API not running
4. Wrong API endpoint in `.env`

**Solutions:**

**Step 1: Verify Credentials**
- Confirm email and password are correct
- Backend user account exists and is enabled
- Check if user has picker role assigned

**Step 2: Test Backend Connectivity**
```bash
# From development machine
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"picker@warehouse.local","password":"password"}'

# From Android emulator (local backend)
# Use 10.0.2.2 instead of 127.0.0.1
curl -X POST http://10.0.2.2:8000/api/login ...
```

**Step 3: Check .env Configuration**
```properties
# Verify endpoint is correct
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api  # For local development
```

**Step 4: Clear Cached Token**
```bash
# On simulator, clear app data
# iOS: Settings > General > iPhone Storage > OrganiRack > Offload App
# Android: Settings > Apps > OrganiRack > Storage > Clear Cache/Storage
```

### Issue: Token Expires Too Quickly

**Symptoms:**
- Logged out after few minutes despite activity
- 401 errors mid-session
- Session timeout notification appears unexpectedly

**Root Causes:**
1. Session timeout set too aggressively (default: 15 minutes)
2. Token TTL in backend too short
3. Interceptor not refreshing token properly

**Solutions:**

**Check Configuration:**
```properties
# In .env - session timeout in milliseconds
EXPO_PUBLIC_SESSION_TIMEOUT=900000  # 15 minutes

# For testing, temporarily reduce to:
EXPO_PUBLIC_SESSION_TIMEOUT=60000   # 1 minute
```

**Verify Backend Token Expiration:**
```bash
# Check Laravel Sanctum configuration
# config/sanctum.php: expiration value (in minutes)
# Default is 525600 (1 year)
```

**Token Refresh Implementation:**
The interceptor automatically refreshes tokens before expiration. If tokens keep expiring:

1. Check backend logs for token refresh endpoint
2. Verify interceptor is properly attached to all requests
3. Ensure refresh token is stored if using dual-token strategy

### Issue: Logout Not Working

**Symptoms:**
- Logout button doesn't respond
- User remains logged in after logout
- Token still in storage after logout

**Root Causes:**
1. Logout API endpoint not implemented in backend
2. Token not cleared from secure storage
3. Navigation not resetting after logout
4. AuthContext not updating

**Solutions:**

**Verify Logout Implementation:**
```typescript
// In API/auth.ts
export async function logoutAPI() {
  try {
    await client.post('/logout');
  } finally {
    // Clear regardless of API response success
    await SecureStore.deleteItemAsync('auth_token');
  }
}
```

**Check Navigation Reset:**
```typescript
// After logout in AuthContext
navigation.reset({
  index: 0,
  routes: [{ name: 'Login' }]
});
```

**Clear Secure Storage Manually:**
```typescript
// Debug: Clear all stored data
import * as SecureStore from 'expo-secure-store';

SecureStore.deleteItemAsync('auth_token').then(() => {
  console.log('Token cleared');
});
```

## Picking System Issues

### Issue: Error 422 on Pick Confirmation

**Symptoms:**
- Confirmation fails with "Unprocessable Entity" error
- Backend returns field-specific validation errors
- Specific error: `estante_id must be integer`

**Root Cause: Type Mismatch**
The backend expects `estante_id` as integer, but app was sending string location code.

**Solution:**

**Required Conversion in usePickingFlow:**
```typescript
// BEFORE (incorrect) - sends location code as string
const confirmData = {
  order_id: order.id,
  item_id: item.id,
  location_picked: userLocation,      // "A-01-01"
  quantity_picked: quantity,
  estante_id: userLocation,            // ❌ WRONG: string instead of integer
  timestamp: new Date().toISOString()
};

// AFTER (correct) - convert location to integer ID
const confirmData = {
  order_id: order.id,
  item_id: item.id,
  location_picked: userLocation,      // "A-01-01"
  quantity_picked: quantity,
  estante_id: parseInt(locationIdMap[userLocation]), // ✓ Correct: integer
  timestamp: new Date().toISOString()
};
```

**Location ID Mapping:**
The location code must be converted to its integer ID from backend. This mapping is obtained from:
1. Initial availability check response
2. Order details response
3. Separate location list API call

**Verify in usePickingFlow:**
```typescript
const handlePickConfirm = async () => {
  if (!locationId) {
    setError('Location ID not available. Recheck availability.');
    return;
  }
  
  // Ensure all fields are correct type before submission
  const request = {
    order_id: Number(currentOrder.id),        // integer
    item_id: Number(currentItem.id),          // integer
    location_picked: userLocation,            // string
    quantity_picked: Number(pickedQuantity),  // integer
    estante_id: Number(locationId),           // integer, NOT string
    timestamp: new Date().toISOString()       // ISO string
  };
  
  await confirmPickingAPI(request);
};
```

### Issue: NaN Displayed in Override Screen

**Symptoms:**
- Alternative locations show "NaN" instead of quantities
- Override screen crashes when selecting location
- Navigation values undefined or invalid

**Root Cause: Location Data Normalization**
Alternative locations from API returned different structure than expected. Mapping failed, resulting in NaN values.

**Solution:**

**Helper Functions for Location Normalization:**
```typescript
// In utils/pickingHelpers.ts
function normalizeUbicacionesForOverride(
  locations: any[]
): Location[] {
  return locations.map(loc => ({
    codigo: loc.codigo || loc.location_code || '',
    cantidad: Number(loc.cantidad || loc.quantity || 0),
    disponible: Boolean(loc.disponible || loc.available),
    estante_id: Number(loc.estante_id || loc.location_id || 0)
  }));
}

function buildUbicacionesForOverride(item: OrderItem): Location[] {
  if (!item.locations_alternative) return [];
  
  return normalizeUbicacionesForOverride(item.locations_alternative);
}
```

**Update useOverrideLocations Hook:**
```typescript
function useOverrideLocations(currentItem: OrderItem | null) {
  const [locations, setLocations] = useState<Location[]>([]);
  
  useEffect(() => {
    if (currentItem?.locations_alternative) {
      const normalized = buildUbicacionesForOverride(currentItem);
      setLocations(normalized);
    }
  }, [currentItem?.id]); // Only re-run when item changes
  
  return { locations, selectLocation };
}
```

### Issue: Infinite Loop in Override Screen

**Symptoms:**
- Override screen freezes or becomes unresponsive
- CPU usage spikes
- useEffect runs repeatedly
- Navigation back fails

**Root Cause: useEffect Dependency Issue**
The useEffect was watching props that were recreated on every render, causing infinite loop.

**Solution:**

**Correct useEffect Dependencies:**
```typescript
// BEFORE (incorrect) - props recreated on every render
useEffect(() => {
  // Load locations
  setLocations(currentItem?.locations_alternative || []);
}, [currentItem?.locations_alternative]); // ❌ Array recreated each render

// AFTER (correct) - watch item ID instead
useEffect(() => {
  // Load locations
  const normalized = buildUbicacionesForOverride(currentItem);
  setLocations(normalized);
}, [currentItem?.id]); // ✓ Only changes when item actually changes
```

**Prevention:**
- Watch primitive values (strings, numbers, IDs) not objects/arrays
- Extract values before useEffect dependencies
- Use dependency analysis tools in IDE

### Issue: Override Screen Doesn't Update After Selection

**Symptoms:**
- Select alternative location but state doesn't update
- Return to picker screen, location doesn't change
- Previous state still displayed

**Root Cause: State Synchronization**
Override selection wasn't propagating back to main picker state.

**Solution:**

**Implement State Refresh Mechanism:**
```typescript
// In usePickingFlow
const handleSelectOverride = useCallback(async (selectedLocation: Location) => {
  setUserLocation(selectedLocation.codigo);
  
  // Force refresh from backend
  await loadOrder(currentOrder.id, { refreshFromOverride: true });
  
  // Navigate back with new location context
  navigation.navigate('scanner', { 
    location: selectedLocation.codigo,
    fromOverride: true 
  });
}, [currentOrder.id]);
```

**Pass Refresh Parameter to API:**
```typescript
// In usePickingOrder
const loadOrder = async (
  orderId: string,
  options?: { refreshFromOverride?: boolean }
) => {
  // Skip cache if coming from override
  if (options?.refreshFromOverride) {
    setCacheKey(orderId + Date.now());
  }
  
  const data = await getOrderDetailsAPI(orderId);
  setOrder(data);
};
```

## UI and Rendering Issues

### Issue: Components Not Re-rendering After State Update

**Symptoms:**
- Button click doesn't update UI
- New data from API not displayed
- State changes but view stays same

**Root Causes:**
1. State mutation instead of immutable update
2. Missing dependency in useEffect
3. Component wrapped in React.memo without proper prop comparison

**Solutions:**

**Ensure Immutable State Updates:**
```typescript
// WRONG: Mutating state directly
const [order, setOrder] = useState(null);
order.status = 'completed';  // ❌ Direct mutation

// CORRECT: Create new object
setOrder({
  ...order,
  status: 'completed'  // ✓ Creates new reference
});

// For arrays:
setItems([
  ...items,
  newItem  // ✓ Creates new array
]);
```

**Check useEffect Dependencies:**
```typescript
// WRONG: Missing dependency
useEffect(() => {
  loadOrder(orderId);
  // ❌ Missing [orderId] dependency - runs once only
}, []);

// CORRECT: Include dependencies
useEffect(() => {
  loadOrder(orderId);
}, [orderId]); // ✓ Runs when orderId changes
```

**Be Careful with React.memo:**
```typescript
// With default shallow comparison
const OrderCard = React.memo(({ order }) => (
  <Text>{order.status}</Text>
));

// Parent recreates order object on every render
function OrderList() {
  return <OrderCard order={{ ...order }} />; // ❌ New object each render
}

// CORRECT: Memoize object creation
const memoizedOrder = useMemo(() => order, [order]);
return <OrderCard order={memoizedOrder} />;
```

### Issue: Modal or Dialog Doesn't Appear

**Symptoms:**
- Button triggered but modal doesn't show
- Modal appears but empty
- Modal appears briefly then disappears

**Root Causes:**
1. State not properly initialized
2. Condition logic inverted
3. Modal closed immediately after opening

**Solutions:**

**Check Modal State Management:**
```typescript
// In usePickingUIState
const [showModal, setShowModal] = useState(false);

const openModal = useCallback(() => {
  setShowModal(true);
}, []);

const closeModal = useCallback(() => {
  setShowModal(false);
}, []);

// Verify in component
{showModal && <Modal ... />}
```

**Ensure Modal Has Content:**
```typescript
// WRONG: Empty modal
{showModal && <Modal><View /></Modal>}

// CORRECT: With content
{showModal && (
  <Modal
    visible={showModal}
    onDismiss={closeModal}
  >
    <View style={styles.content}>
      <Text>Modal Content</Text>
    </View>
  </Modal>
)}
```

## Network and API Issues

### Issue: "Network Error. Check Your Connection"

**Symptoms:**
- API requests fail immediately
- Error appears even with good internet
- Works in browser but not in app

**Root Causes:**
1. Wrong API endpoint in `.env`
2. Backend not running or not accessible
3. Firewall blocking connections
4. Certificate validation failing
5. DNS resolution issues

**Solutions:**

**Test API Connectivity:**
```bash
# From computer
ping backend.local
curl -I http://backend.local/api/health

# From Android emulator (if testing locally)
# Use 10.0.2.2 instead of 127.0.0.1
curl -I http://10.0.2.2:8000/api/health
```

**Update .env:**
```properties
# Local development
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api

# Remote server
EXPO_PUBLIC_API_URL=https://api.example.com/api
```

**Check Firewall:**
```bash
# Windows: Check Windows Defender Firewall
# macOS: System Preferences > Security & Privacy > Firewall
# Linux: Check iptables or ufw rules
```

**Verify Backend is Running:**
```bash
# Laravel backend check
curl -X GET http://localhost:8000/api/health

# Response should be 200 OK, not connection refused
```

### Issue: Requests Timeout

**Symptoms:**
- Requests fail after 30 seconds
- "Network timeout" error messages
- Slow operations (orders, confirmation) fail

**Root Causes:**
1. Backend processing taking too long
2. Network connectivity issues
3. Server overloaded
4. Database queries slow

**Solutions:**

**Check Backend Performance:**
```bash
# Test endpoint directly to measure response time
time curl -X GET http://localhost:8000/api/mobile/picking/orders

# If > 30 seconds, backend needs optimization
```

**Increase Timeout (If Necessary):**
```properties
# In .env - increase from default 30 seconds
EXPO_PUBLIC_API_TIMEOUT=60000  # 60 seconds
```

**Optimize Backend:**
1. Add database indexes
2. Implement query caching
3. Reduce payload size
4. Use pagination for large lists
5. Implement async processing for heavy operations

### Issue: CORS Errors (In Web Version)

**Symptoms:**
- Web version fails to connect to API
- Browser console shows CORS error
- Mobile version works but web doesn't

**Root Causes:**
- Backend not allowing requests from web origin
- Missing CORS headers
- Credentials not sent

**Solutions:**

**Configure CORS on Backend (Laravel):**
```php
// config/cors.php
'allowed_origins' => ['http://localhost:8081', 'https://app.example.com'],
'supports_credentials' => true,
```

**Or use CORS middleware:**
```php
use Fruitcake\Cors\HandleCors;

protected $middleware = [
    HandleCors::class,
];
```

## Performance Issues

### Issue: App Feels Slow or Laggy

**Symptoms:**
- Navigation between screens delayed
- Scrolling stutters
- Button presses not responsive
- Order list renders slowly

**Root Causes:**
1. Large order lists not using FlatList
2. Components re-rendering unnecessarily
3. Heavy computations in render
4. API calls not memoized
5. Too many event listeners

**Solutions:**

**Use FlatList for Long Lists:**
```typescript
// WRONG: ScrollView with many items
<ScrollView>
  {orders.map(order => <OrderCard key={order.id} order={order} />)}
</ScrollView>

// CORRECT: FlatList for performance
<FlatList
  data={orders}
  renderItem={({ item }) => <OrderCard order={item} />}
  keyExtractor={item => item.id.toString()}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
/>
```

**Memoize Expensive Operations:**
```typescript
const expensiveValue = useMemo(
  () => computeExpensiveValue(data),
  [data]
);

const handlePress = useCallback(
  () => doSomething(value),
  [value]
);
```

**Profile Performance:**
```bash
# Use React DevTools Profiler
# Use Redux DevTools if applicable
# Monitor with Android Studio Profiler or Xcode Instruments
```

## Device-Specific Issues

### Issue: App Crashes on Android

**Symptoms:**
- App force closes
- Android error dialog appears
- Specific screens cause crash
- Works on iOS but not Android

**Root Causes:**
1. Android-specific API usage
2. Memory leak or excessive memory usage
3. Incompatible native library
4. Missing permissions

**Solutions:**

**Check Android Logs:**
```bash
# View real-time logs
adb logcat | grep FATAL

# Filter for app-specific logs
adb logcat | grep OrganiRack
```

**Common Android Issues:**

**Issue:** Out of Memory  
**Solution:** Reduce image sizes, implement pagination

**Issue:** WebSocket connection fails  
**Solution:** Use appropriate network configuration for emulator

**Issue:** Camera permission denied  
**Solution:** Request permissions at runtime using expo-permissions

### Issue: Performance Issues on Older Devices

**Symptoms:**
- App slow on Android 10 or earlier
- High battery drain on older phones
- Memory usage exceeds device capabilities

**Solutions:**

**Optimize for Lower-End Devices:**
```typescript
// Reduce animation complexity
<Animated.View
  style={{ opacity: animatedValue }}
>
  {/* Content */}
</Animated.View>

// Use smaller images or thumbnails
<Image
  source={imageSource}
  style={{ width: 80, height: 80 }}
  cache="force-cache"
/>

// Implement progressive loading
useEffect(() => {
  // Load essential data first
  loadOrdersList();
  // Load details later
  setTimeout(() => loadOrderDetails(), 1000);
}, []);
```

## Getting Help

### Debug Information to Collect

When reporting issues, include:

1. **App Environment:**
   - OS and version (Android 12, iOS 16)
   - Device model
   - App version

2. **Error Details:**
   - Full error message and stack trace
   - Steps to reproduce
   - When error first appeared

3. **Network Information:**
   - API endpoint
   - Network type (WiFi, 4G, etc.)
   - Latency/speed if available

4. **Logs:**
   - Console logs from Expo
   - Android/iOS system logs
   - Backend API logs

### Resources

- [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)
- [Expo Help](https://docs.expo.dev/guides/)
- [Stack Overflow React Native Tag](https://stackoverflow.com/questions/tagged/react-native)
- Project GitHub Issues: https://github.com/Apoquellia/OrganiRackPlus/issues
