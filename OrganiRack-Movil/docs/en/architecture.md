# Architecture and Design Decisions

System architecture overview and architectural patterns used throughout OrganiRack+ Mobile.

## System Architecture

### Layered Architecture

The application follows a classical three-tier architecture:

```
┌─────────────────────────────────────────┐
│   Presentation Layer (UI)               │
│   Screens: homeScreen, scannerScreen    │
│   Components: ProductDetail, Sections   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   Business Logic Layer                  │
│   Hooks: usePickingFlow, useAuth        │
│   Context: AuthContext                  │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   Data Access Layer                     │
│   API Services: auth.ts, picking.ts     │
│   HTTP Client: Axios with interceptors  │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   Backend Services (Laravel API)        │
│   Authentication, Order Management      │
└─────────────────────────────────────────┘
```

### Component Hierarchy

```
App (_layout.tsx)
├── AuthContext Provider
│   └── Navigation Controller
│       ├── (auth) Routes (unauthenticated)
│       │   └── loginScreen
│       └── (screens) Routes (authenticated)
│           ├── homeScreen (order list)
│           ├── scannerScreen (picking interface)
│           └── overrideScreen (location selection)
```

## Design Patterns

### 1. Separation of Concerns (SoC)

Business logic is isolated from presentation through custom hooks:

- **UI Components:** Render only, no API calls or complex state
- **Custom Hooks:** Encapsulate business logic with single responsibility
- **Context:** Manage global application state (authentication)
- **Services:** Handle HTTP communication with backend

**Benefit:** Changes to business logic do not require UI refactoring, and UI can be redesigned without touching business logic.

### 2. Custom Hooks Architecture

The picking system uses 8 specialized hooks, each handling one responsibility:

```typescript
usePickingFlow          // Orchestrates other hooks, main entry point
├── usePickingOrder    // Loads and manages current order
├── usePickingDetails  // Navigates between order items
├── useLocationInput   // Parses and validates location input
├── useAvailabilityCheck // Verifies product availability
├── usePickingConfirm  // Submits confirmation to API
├── useOverrideMode    // Manages alternative location selection
└── usePickingUIState  // UI state (modals, loading indicators)
```

Each hook:
- Has a single, clearly defined responsibility
- Returns a focused set of state and functions
- Can be tested independently
- Is reusable across different screens

**Example Hook Structure:**

```typescript
/**
 * Hook for managing picking order operations.
 * 
 * Handles fetching, storing, and providing access to the current order
 * being picked. Automatically loads next order when current is completed.
 * 
 * @returns {PickingOrderReturn} Order state and manipulation functions
 */
function usePickingOrder(): PickingOrderReturn {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const loadOrder = useCallback(async (orderId: string) => {
    // Implementation
  }, []);
  
  return { order, loading, error, loadOrder };
}
```

### 3. Context API for Global State

Authentication state is managed globally through React Context:

```typescript
// Provides auth state to entire app
<AuthContext.Provider value={{ user, token, logout }}>
  <NavigationController />
</AuthContext.Provider>

// Consumed in components
const { user, token } = useAuth();
```

**Advantages:**
- Avoids prop drilling
- Single source of truth for authentication
- Reduces re-renders compared to Redux
- Built-in to React (no external dependency)

### 4. HTTP Interceptor Pattern

Axios interceptors handle:

- Request: Attach authorization token
- Response: Handle errors, refresh expired tokens
- Automatic retry logic for failed requests

```typescript
client.interceptors.request.use((config) => {
  const token = SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, refresh and retry
      return refreshTokenAndRetry(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 5. File-Based Routing (Expo Router)

Routes are defined by file structure:

```
app/
├── (auth)/
│   ├── _layout.tsx      → Stack navigation for auth routes
│   └── loginScreen.tsx  → /auth/login
├── (screens)/
│   ├── _layout.tsx      → Tab navigation for main app
│   ├── homeScreen.tsx   → /screens/home
│   ├── scannerScreen.tsx → /screens/scanner
│   └── overrideScreen.tsx → /screens/override
└── _layout.tsx          → Root navigation with auth check
```

**Benefits:**
- Routes are self-documenting
- Automatic code splitting
- Reduced boilerplate compared to manual routing
- Visual folder structure matches app navigation

## State Management

### Order Picking State Flow

```
User Opens App
  ↓
Load Orders (API)
  ↓
Display Order List
  ↓
User Selects Order
  ↓
Load Order Details
  ↓
Enter Location
  ↓
Check Availability
  ↓
Confirm Pick
  ↓
Submit to Backend
  ↓
Update Local State
  ↓
Show Next Item or Order
```

### Data Flow Example: Confirming a Pick

```
scannerScreen Component
  ↓ calls handleConfirm()
  ↓
usePickingFlow Hook
  ↓ validates data
  ↓
usePickingConfirm Hook
  ↓ formats request
  ↓
API/picking.ts
  ↓ sends POST request
  ↓
Axios Client + Interceptors
  ↓ adds auth header
  ↓
Laravel Backend
  ↓ validates and saves
  ↓
Response returned
  ↓ callback in usePickingFlow
  ↓
usePickingOrder loads next item
  ↓
UI updates with new state
```

## Error Handling Strategy

### Three-Level Error Handling

**1. API Level:**
```typescript
// In client.ts interceptors
if (error.response?.status === 422) {
  // Validation error - show specific field errors
  return handleValidationError(error);
} else if (error.response?.status === 401) {
  // Unauthorized - refresh token
  return refreshToken();
}
```

**2. Hook Level:**
```typescript
// In usePickingConfirm
try {
  await confirmPickingAPI(data);
  // Handle success
} catch (error) {
  setError(error.message);
  // Hook maintains error state
}
```

**3. Component Level:**
```typescript
// In scannerScreen
if (error) {
  return <ErrorAlert message={error} onRetry={handleRetry} />;
}
```

## Authentication Flow

### Login Process

1. User enters credentials in loginScreen
2. `useAuth` hook calls `loginAPI()` 
3. Backend validates and returns JWT token
4. Token stored in encrypted device storage (expo-secure-store)
5. AuthContext state updated
6. Navigation redirects to main app
7. Token automatically attached to subsequent requests

### Session Management

- **Timeout:** 15 minutes of inactivity
- **Token Refresh:** Automatic before expiration (if backend supports)
- **Logout:** Clears token, context, and navigation resets

## Performance Considerations

### 1. Memo and useCallback

Prevent unnecessary re-renders:

```typescript
// Prevent recreation on every render
const handleConfirm = useCallback(() => {
  // Implementation
}, [dependencies]);

// Prevent child re-renders
const MemoizedComponent = React.memo(Component);
```

### 2. FlatList for Order Lists

Use FlatList instead of ScrollView for long lists:

```typescript
<FlatList
  data={orders}
  renderItem={({ item }) => <OrderCard order={item} />}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
/>
```

### 3. Lazy Loading

Load order details only when needed, not entire order upfront.

### 4. API Response Caching

Consider caching strategies for frequently accessed data:

- In-memory cache for current session
- Local storage for reference data (locations, product codes)

## Security Considerations

### Token Storage

- Tokens stored in `expo-secure-store` (OS-level encryption)
- Never logged or exposed in console
- Cleared on logout

### API Communication

- All API calls use HTTPS in production
- Certificate pinning recommended for sensitive operations
- API timeout prevents indefinite hanging

### Input Validation

- Location codes validated before API submission
- Product codes verified against backend data
- All user input treated as potentially untrusted

### Environment Variables

- Sensitive values (API endpoints, keys) in `.env`
- Public constants in configuration files
- Never commit `.env` file to repository

## Testing Strategy

### Unit Testing Hooks

```typescript
describe('usePickingFlow', () => {
  it('should load order and parse location', async () => {
    const { result } = renderHook(() => usePickingFlow());
    
    act(() => {
      result.current.loadOrder('ORDER123');
    });
    
    await waitFor(() => {
      expect(result.current.order).toBeDefined();
    });
  });
});
```

### Integration Testing

Test interaction between hooks and API:

```typescript
describe('Full picking flow', () => {
  it('should complete picking workflow', async () => {
    // Test full flow from order load to confirmation
  });
});
```

### E2E Testing

Test complete user workflows with actual backend.

## Scalability Patterns

### Adding New Features

1. Create specialized hook for feature logic
2. Create components that use the hook
3. Add routes in appropriate layout file
4. Extend API services as needed

### Database Queries

- Minimize API calls through batch operations
- Use pagination for large datasets
- Implement caching for reference data

### Code Organization

- One hook per file in `hooks/usePicking/`
- One component per file when possible
- Group related utilities in `utils/`

## Decision Log

### Why Hooks Over Redux?

- Simpler mental model
- Reduced boilerplate
- Built-in to React
- Sufficient for current application scope
- Migration to Redux possible if needed later

### Why Expo Router Over React Navigation?

- File-based routing familiar to web developers
- Automatic deep linking
- Built-in to Expo ecosystem
- Cleaner code organization

### Why Context API Over Redux for Auth?

- Authentication is global singleton
- Context avoids prop drilling
- Redux overkill for simple global state
- Easier testing without Redux setup

## Future Architectural Improvements

1. **Offline Synchronization:** Queue system for operations during connectivity loss
2. **Caching Layer:** Redux or Zustand for complex state if app scales
3. **Error Boundary:** Wrap major sections to catch rendering errors gracefully
4. **Analytics:** Track user interactions and performance metrics
5. **Feature Flags:** Enable/disable features remotely for A/B testing
6. **State Persistence:** Restore app state across sessions
