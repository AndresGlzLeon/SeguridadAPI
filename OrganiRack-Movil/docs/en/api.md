# API Reference

Complete specification of backend API endpoints used by OrganiRack+ Mobile.

## Base Configuration

All API requests go through a centralized Axios client configured in `API/client.ts`.

**Base URL Configuration:**
```typescript
// From environment variable (set in .env)
const API_URL = process.env.EXPO_PUBLIC_API_URL;
// Example: http://192.168.1.100:8000/api

// Request timeout: 30 seconds
const TIMEOUT = process.env.EXPO_PUBLIC_API_TIMEOUT || 30000;
```

**Request Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
Accept: application/json
```

## Authentication Endpoints

### Login

Authenticate user and retrieve JWT token.

**Endpoint:** `POST /login`

**Request Body:**
```json
{
  "email": "picker@warehouse.local",
  "password": "secure_password"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "name": "John Picker",
    "email": "picker@warehouse.local",
    "role": "picker"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Invalid credentials",
  "errors": null
}
```

**Response (422 Unprocessable Entity):**
```json
{
  "message": "The given data was invalid",
  "errors": {
    "email": ["The email field is required"],
    "password": ["The password field is required"]
  }
}
```

**Implementation in Code:**
```typescript
// API/auth.ts
export async function loginAPI(email: string, password: string) {
  const response = await client.post('/login', { email, password });
  return response.data;
}

// Usage in hook
const { data } = await loginAPI(email, password);
const token = data.token;
await SecureStore.setItemAsync('auth_token', token);
```

**Error Handling:**
- 401: Credentials invalid, show error message
- 422: Validation failed, show field-specific errors
- 500: Server error, show generic message

### Logout

Clear authentication session on backend.

**Endpoint:** `POST /logout`

**Headers Required:** Yes (Bearer token)

**Response (204 No Content):** Success

**Response (401 Unauthorized):** Token invalid or expired

## Order Management Endpoints

### Get Orders List

Retrieve picking orders assigned to current user.

**Endpoint:** `GET /mobile/picking/orders`

**Query Parameters:**
- `page` (optional, default: 1) — Pagination page number
- `limit` (optional, default: 20) — Results per page
- `status` (optional) — Filter by status (assigned, in_progress, completed)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "order_number": "ORD-2026-001",
      "customer": "Customer Name",
      "total_items": 5,
      "items_picked": 0,
      "status": "assigned",
      "priority": 3,
      "created_at": "2026-03-15T10:30:00Z",
      "due_date": "2026-03-16T18:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 47,
    "items_per_page": 20
  }
}
```

**Field Descriptions:**
- `priority` — Integer 1-5 (1=highest, 5=lowest)
- `status` — assigned, in_progress, completed, cancelled
- `created_at`, `due_date` — ISO 8601 format

**Implementation:**
```typescript
// API/picking.ts
export async function getOrdersListAPI(page: number = 1) {
  const response = await client.get('/mobile/picking/orders', {
    params: { page, limit: 20 }
  });
  return response.data;
}
```

### Get Order Details

Retrieve full details for a specific order including all items.

**Endpoint:** `GET /mobile/picking/{id}`

**Path Parameters:**
- `id` — Order ID (required)

**Response (200 OK):**
```json
{
  "id": 1,
  "order_number": "ORD-2026-001",
  "customer": "Customer Name",
  "status": "in_progress",
  "items": [
    {
      "id": 1,
      "sku": "PROD-001",
      "name": "Product Name",
      "quantity_ordered": 10,
      "quantity_picked": 3,
      "unit": "PCS",
      "location_suggested": "A-01-01",
      "locations_alternative": ["A-01-02", "B-02-03"]
    }
  ],
  "created_at": "2026-03-15T10:30:00Z"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Order not found"
}
```

**Field Descriptions:**
- `location_suggested` — Recommended primary storage location
- `locations_alternative` — Fallback locations if primary unavailable
- All locations in format AISLE-SHELF-POSITION (e.g., A-01-01)

### Check Availability

Verify product availability at specific location.

**Endpoint:** `GET /mobile/picking/{id}/availability`

**Query Parameters:**
- `location` — Storage location code (required)

**Response (200 OK):**
```json
{
  "available": true,
  "quantity": 5,
  "location": "A-01-01",
  "item_id": 1,
  "last_count": "2026-03-15T08:00:00Z"
}
```

**Response (200 OK - No Stock):**
```json
{
  "available": false,
  "quantity": 0,
  "location": "A-01-01",
  "message": "Location is empty"
}
```

**Implementation:**
```typescript
// API/picking.ts
export async function checkAvailabilityAPI(
  orderId: string,
  location: string
) {
  const response = await client.get(
    `/mobile/picking/${orderId}/availability`,
    { params: { location } }
  );
  return response.data;
}

// Usage in hook
const availability = await checkAvailabilityAPI(orderId, location);
if (availability.available && availability.quantity >= needed) {
  // Proceed with picking
}
```

### Confirm Pick

Submit confirmation of picked item to backend.

**Endpoint:** `POST /mobile/picking/confirmar`

**Request Body:**
```json
{
  "order_id": 1,
  "item_id": 1,
  "location_picked": "A-01-01",
  "quantity_picked": 5,
  "estante_id": 1,
  "timestamp": "2026-03-15T14:23:45Z"
}
```

**Field Requirements:**
- `order_id` — Integer order ID (not order_number)
- `item_id` — Integer item ID from order
- `location_picked` — String in format AISLE-SHELF-POSITION
- `quantity_picked` — Integer quantity picked
- `estante_id` — Integer shelf/estante ID (obtained from location validation)
- `timestamp` — ISO 8601 timestamp

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Pick confirmed",
  "next_item": {
    "id": 2,
    "sku": "PROD-002",
    "name": "Next Product",
    "quantity_ordered": 8,
    "location_suggested": "B-02-01"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Invalid request",
  "errors": {
    "estante_id": "Must be integer type"
  }
}
```

**Response (422 Unprocessable Entity - Inventory Mismatch):**
```json
{
  "message": "Inventory validation failed",
  "errors": {
    "quantity": "Requested quantity exceeds available stock"
  }
}
```

**Common Error Cases:**

| Error | Cause | Resolution |
|-------|-------|-----------|
| `estante_id` must be integer | Sending location code instead of ID | Convert location to ID before submission |
| Quantity exceeds available | Stock changed since check | Re-verify availability and retry |
| Order not found | Order ID invalid or already completed | Reload order list |
| Unauthorized (401) | Token expired | Automatic refresh via interceptor |

**Implementation:**
```typescript
// API/picking.ts
export async function confirmPickingAPI(data: {
  order_id: number;
  item_id: number;
  location_picked: string;
  quantity_picked: number;
  estante_id: number;
  timestamp: string;
}) {
  const response = await client.post('/mobile/picking/confirmar', data);
  return response.data;
}

// In usePickingFlow hook - handle conversion
const handleConfirm = async () => {
  const request = {
    order_id: order.id,  // Not order_number
    item_id: currentItem.id,
    location_picked: userLocation,
    quantity_picked: pickedQuantity,
    estante_id: parseInt(estanteId), // Convert to integer
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await confirmPickingAPI(request);
    // Success handling
  } catch (error) {
    if (error.response?.status === 422) {
      // Handle validation error
      showError(error.response.data.errors);
    }
  }
};
```

## Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response data |
| 204 | Success (No Content) | Operation completed |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Token expired, trigger refresh |
| 403 | Forbidden | User lacks permission |
| 404 | Not Found | Resource doesn't exist |
| 422 | Validation Failed | Show field errors to user |
| 429 | Rate Limited | Implement exponential backoff |
| 500 | Server Error | Show generic error, retry later |
| 503 | Service Unavailable | Show maintenance message |

## Error Handling

### Standard Error Response Format

```json
{
  "message": "Human-readable error description",
  "errors": {
    "field_name": "Field-specific error"
  }
}
```

### Interceptor Error Handling

```typescript
// client.ts interceptor
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, attempt refresh
      const newToken = await refreshToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return client.request(error.config);
    }
    
    if (error.response?.status === 422) {
      // Validation error, pass through for component handling
      return Promise.reject(error);
    }
    
    // Network error or timeout
    if (!error.response) {
      error.message = 'Network error. Check your connection.';
    }
    
    return Promise.reject(error);
  }
);
```

## Request Examples with Curl

### Get Orders

```bash
curl -X GET \
  'http://localhost:8000/api/mobile/picking/orders?page=1' \
  -H 'Authorization: Bearer TOKEN_HERE' \
  -H 'Content-Type: application/json'
```

### Confirm Pick

```bash
curl -X POST \
  'http://localhost:8000/api/mobile/picking/confirmar' \
  -H 'Authorization: Bearer TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "order_id": 1,
    "item_id": 1,
    "location_picked": "A-01-01",
    "quantity_picked": 5,
    "estante_id": 1,
    "timestamp": "2026-03-15T14:23:45Z"
  }'
```

## Rate Limiting

Backend implements rate limiting per user:

- **Picking operations:** 100 requests per minute
- **Order queries:** 200 requests per minute
- **Login attempts:** 5 per minute

Exceeded requests return 429 with retry-after header.

**Retry Strategy:**
```typescript
// Exponential backoff for 429 errors
let delay = 1000;
let retries = 0;
const maxRetries = 3;

while (retries < maxRetries) {
  try {
    return await makeRequest();
  } catch (error) {
    if (error.response?.status === 429) {
      await sleep(delay);
      delay *= 2;
      retries++;
    } else {
      throw error;
    }
  }
}
```

## Backend Version Compatibility

Current API compatible with Laravel 10.0+

Check `/api/health` endpoint for backend availability and version.
