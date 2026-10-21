# Session Policy and Timeout

Security and configuration information for OrganiRack+ Mobile session expiration.

## Session Timeout Policy (15 minutes)

Every authenticated session in the mobile application has a maximum duration of **15 minutes**. After this time, the session automatically becomes invalid and the user must log in again.

### Policy Rationale

This policy implements an important security control to:
- Protect warehouse-sensitive data in case of device loss
- Reduce risk of unauthorized access
- Comply with enterprise security policies

## How It Works

### 1. Login

```typescript
// User provides credentials on login screen
POST /api/login {email, password}

// System:
- Validates credentials with backend
- Receives JWT token
- Stores token in SecureStore (encrypted)
- Records current timestamp as session_timestamp
- Starts periodic verification timer
```

### 2. During Session

```typescript
// Every 60 seconds: automatic verification
setInterval(() => {
  const elapsed = Date.now() - sessionTimestamp
  if (elapsed > 15 * 60 * 1000) {
    // Session expired, perform cleanup
  }
}, 60000)
```

User can continue working normally while:
- Less than 15 minutes have passed since login
- Device has active network connection
- User hasn't manually closed the application

### 3. Session Expiration

When the system detects 15 minutes have passed:

```typescript
// Automatic cleanup
SecureStore.removeItem('auth_token')
SecureStore.removeItem('session_timestamp')

// User notification
Alert.alert('Session Expired', 'Your session has expired. Please log in again.')

// Redirect to login
router.push('/(auth)/login')
```

### 4. Verification on App Open

When user opens the application:

```typescript
if (tokenExists && sessionExpired) {
  // Token exists but session expired
  clearSecureStore()
  showAlert('Your session has expired')
  navigateToLogin()
} else if (tokenExists && sessionValid) {
  // Token exists and session is valid
  restoreSession()
  navigateToHome()
} else {
  // No token, show login
  navigateToLogin()
}
```

## Secure Storage

Session data is stored in **SecureStore** (OS-level encrypted storage):

| Field | Value | Purpose |
|-------|-------|---------|
| `auth_token` | JWT token | API authentication |
| `session_timestamp` | Milliseconds | Verify expiration |

Both are automatically encrypted and deleted when:
- Session expires
- User manually logs out
- App is uninstalled

## Configuration

### Current Parameters

```properties
# In API/auth.ts - Timeout configuration
SESSION_TIMEOUT_MINUTES = 15         # Maximum duration
CHECK_INTERVAL_SECONDS = 60          # Verification frequency
```

### Changing Configuration

To modify session timeout (example: change to 30 minutes):

**File:** `API/auth.ts`

```typescript
// Change from:
const SESSION_TIMEOUT_MINUTES = 15

// To:
const SESSION_TIMEOUT_MINUTES = 30
```

**File:** `context/AuthContext.tsx`

```typescript
// In startSessionCheck() function:
// Change from:
const sessionTimeoutMinutes = 15

// To:
const sessionTimeoutMinutes = 30
```

Can also be configured per environment in `.env`:

```properties
EXPO_PUBLIC_SESSION_TIMEOUT=1800000   # 30 minutes in milliseconds
```

## Technical Notes

### Memory Leak Prevention

```typescript
// In AuthContext.tsx - Cleanup on unmount
useEffect(() => {
  const intervalId = setInterval(checkSessionExpiration, 60000)
  
  return () => {
    clearInterval(intervalId)  // Cleans up interval
  }
}, [])
```

### Validation in Interceptors

Besides periodic verification, HTTP client also validates:

```typescript
// In API/client.ts - Response interceptor
responseInterceptor: {
  if (status === 401) {
    // Token expired or invalid
    clearSession()
    redirectToLogin()
  }
}
```

### Production Considerations

- Timeout applies **per device/session**, not globally
- If user logs in on 2 devices, each has its own timeout
- Logging out on one device doesn't affect others
- Network timeout doesn't affect session timeout

## Troubleshooting

### User Disconnects Too Quickly

**Check:**
1. Configuration in `.env`: `EXPO_PUBLIC_SESSION_TIMEOUT`
2. Timestamp is recorded correctly on login
3. Device clock is synchronized

**Solution:**
```bash
# For testing, temporarily reduce timeout to 1 minute
EXPO_PUBLIC_SESSION_TIMEOUT=60000

# Then check logs:
console.log('Session timestamp:', sessionTimestamp)
console.log('Current time:', Date.now())
console.log('Elapsed minutes:', (Date.now() - sessionTimestamp) / 1000 / 60)
```

### User Does NOT Disconnect When Expired

**Check:**
1. `startSessionCheck()` executed in AuthContext
2. No errors in console on AuthProvider startup
3. Interval wasn't cleaned up prematurely

**Solution:**
```bash
# Enable debug logs
// In context/AuthContext.tsx
useEffect(() => {
  console.log('[SessionCheck] Timer started')
  return () => console.log('[SessionCheck] Timer cleaned up')
}, [])
```

## Related References

- [Authentication](docs/en/architecture.md#authentication-flow)
- [Troubleshooting Authentication](docs/en/troubleshooting.md#authentication-problems)
- [Environment Configuration](docs/en/setup.md#environment-variables)

---

**Last Updated:** 2026-04-16  
**Version:** 2.1.0
