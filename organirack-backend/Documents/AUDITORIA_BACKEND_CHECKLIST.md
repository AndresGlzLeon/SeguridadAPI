# 🔍 GUÍA DE AUDITORÍA BACKEND - ARQUITECTURA HEADLESS

**Para:** José (Desarrollador Backend)  
**Objetivo:** Verificar que el backend cumple con estándar Headless  
**Tiempo:** 30 minutos

---

## ✅ FASE 1: VERIFICACIÓN INICIAL (5 min)

### 1. Routes/Web.php Limpio
```bash
cd organirack-backend

# Ver contenido
cat routes/web.php
```

**Debe tener SOLO:**
```php
<?php
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'OrganiRack+ API - Headless Backend',
        'version' => app()->version(),
        'timestamp' => now(),
    ], 200);
});
```

**Debe NO tener:**
- ❌ `Route::get('/login', ...)`
- ❌ `Route::post('/login', ...)`
- ❌ `Route::post('/logout', ...)`
- ❌ `require __DIR__.'/auth.php'`
- ❌ `[AuthController::class, 'showLoginForm']`
- ❌ `.name('login')`
- ❌ `.middleware('auth')`

✅ **Checklist:**
- [ ] No hay rutas Blade
- [ ] No hay redirecciones a vistas
- [ ] Solo health check en GET /

---

### 2. Configuración .env
```bash
# Ver valores críticos
grep -E '^(APP_URL|FRONTEND_URL|SESSION_|DB_)' .env
```

**Debe tener:**
```dotenv
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173           # ← CRÍTICO

SESSION_DRIVER=database                      # ← CRÍTICO
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null
SESSION_SECURE=false                         # En producción: true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
```

✅ **Checklist:**
- [ ] FRONTEND_URL apunta a localhost:5173 (Vite)
- [ ] SESSION_DRIVER=database
- [ ] SESSION_HTTP_ONLY=true
- [ ] DB_* está configurado

---

### 3. Configuración CORS
```bash
# Ver config
cat config/cors.php | head -30
```

**Debe tener:**
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost:5173'),
],
'supports_credentials' => true,  // ← CRÍTICO
```

✅ **Checklist:**
- [ ] `allowed_origins` incluye `http://localhost:5173`
- [ ] `supports_credentials = true`
- [ ] `paths = ['api/*', 'sanctum/csrf-cookie']`

---

## ✅ FASE 2: AUDITORÍA DE CONTROLADORES (10 min)

### 1. Verificar que todos retornan JSON

```bash
# Buscar vistas (Blade) en controladores
grep -r "view(" app/Http/Controllers/Api/

# Resultado esperado: (ninguno)
```

✅ **Si hay resultados:** ❌ ERROR - Remover vistas Blade

---

### 2. Verificar Estructura de Respuestas

**Auth Controller:**
```bash
grep -A 10 "return response" app/Http/Controllers/Api/AuthController.php
```

**Debe ver:**
```php
return response()->json([
    'status' => 'success',
    'message' => 'Login exitoso',
    'user' => [...],
], 200);
```

✅ **Checklist:**
- [ ] Retorna `response()->json(...)`
- [ ] Incluye `'status'` field
- [ ] Incluye `'message'` o `'data'`
- [ ] Status code correcto (200, 201, 401, 422, etc.)

---

### 3. Verificar Autenticación Sanctum

```bash
# Buscar middleware auth:sanctum
grep -r "auth:sanctum" routes/

# Debe retornar múltiples usos
grep -r "middleware('auth:sanctum')" routes/api.php
```

✅ **Checklist:**
- [ ] POST /login - SIN auth:sanctum (público)
- [ ] GET /user - CON auth:sanctum
- [ ] GET /dashboard/* - CON auth:sanctum
- [ ] POST /orders/* - CON auth:sanctum

---

### 4. Verificar Validación en Backend

**Buscar validaciones:**
```bash
grep -r "validate(" app/Http/Controllers/Api/ | head -5
```

**Debe retornar ejemplos como:**
```php
$request->validate([
    'username' => 'required|string',
    'password' => 'required|string',
]);
```

✅ **Checklist:**
- [ ] Todos los POST/PUT tienen validación
- [ ] Validación usa `$request->validate()`
- [ ] Retorna errores 422 con estructura estándar

---

## ✅ FASE 3: TESTING ENDPOINTS (10 min)

### 1. Health Check
```bash
# Debe retornar JSON
curl http://localhost:8000/

# Resultado esperado:
# {"status":"ok","message":"OrganiRack+ API - Headless Backend",...}
```

✅ Si retorna JSON → ✅ OK

---

### 2. CORS Preflight
```bash
curl -X OPTIONS http://localhost:8000/api/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep "Access-Control-Allow"

# Resultado esperado:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
# Access-Control-Allow-Credentials: true
```

✅ Si ves los 3 headers → ✅ CORS OK

---

### 3. Login Endpoint
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }' \
  -i  # Para ver headers
```

**Esperado:**
```
HTTP/1.1 200 OK
Set-Cookie: XSRF-TOKEN=...; Path=/; HttpOnly
Set-Cookie: laravel_session=...; Path=/; HttpOnly
Content-Type: application/json

{"status":"success","user":{...}}
```

✅ **Checklist:**
- [ ] status 200 (o 401 si credenciales inválidas)
- [ ] Retorna JSON
- [ ] Si 200: incluye `"user"` field
- [ ] Set-Cookie headers presentes
- [ ] Sin HTML ni Blade

---

### 4. Acceso sin Autenticación
```bash
curl -X GET http://localhost:8000/api/user \
  -H "Content-Type: application/json"

# Resultado esperado: 401
# {"status":"error","message":"..."}
```

✅ **Checklist:**
- [ ] Retorna 401 (no 200)
- [ ] Retorna JSON
- [ ] Sin HTML

---

## ✅ FASE 4: REVISIÓN DE CÓDIGO (5 min)

### Checklist General

```
Controllers (app/Http/Controllers/Api/):
  [ ] Solo retorna response()->json(...)
  [ ] Usa auth:sanctum donde sea apropiado
  [ ] Validación en cada POST/PUT
  [ ] Errores con estructura estándar
  [ ] Sin importes de vistas o Blade
  
Routes (routes/api.php):
  [ ] Namespaced bajo api/*
  [ ] Métodos HTTP correctos (GET/POST/PUT/DELETE)
  [ ] Rutas públicas sin middleware auth:sanctum
  [ ] Rutas privadas con middleware auth:sanctum
  [ ] Convencion REST respetada
  
Modelos (app/Models/):
  [ ] Casteos correctos ($casts)
  [ ] Fillable properties ($fillable)
  [ ] Hidden fields ($hidden) para contraseñas
  
Servicios (app/Services/):
  [ ] Lógica de negocio encapsulada
  [ ] Retorna datos normales (no JSON)
  [ ] Controllers usan servicios
```

---

## ⚠️ PROBLEMAS COMUNES (Troubleshooting)

### Problema: "View [login] not found"
**Causa:** Controller trata de retornar vista Blade  
**Solución:** Cambiar a `response()->json(...)`

```php
// ❌ Antes
return view('login');

// ✅ Después
return response()->json([
    'status' => 'error',
    'message' => 'No autenticado'
], 401);
```

---

### Problema: "CORS blocked error"
**Causa:** FRONTEND_URL no es localhost:5173  
**Solución:**
```bash
# Verificar .env
grep FRONTEND_URL .env

# Debe ser:
FRONTEND_URL=http://localhost:5173

# Luego:
php artisan config:clear
php artisan serve
```

---

### Problema: "Cookies not persisting"
**Causa:** SESSION_DRIVER o supports_credentials mal  
**Solución:**
```bash
# .env
SESSION_DRIVER=database  # ← database, no redis/file
SESSION_SECURE=false     # ← false en desarrollo

# config/cors.php
'supports_credentials' => true,  # ← TIENE que ser true
```

---

### Problema: "status 200 pero retorna HTML"
**Causa:** Controller retorna redirect o view  
**Solución:** Buscar `redirect()` o `view()` en controladores

```bash
grep -r "redirect\|view(" app/Http/Controllers/Api/

# Si hay resultados → cambiar a response()->json()
```

---

## 🔒 SEGURIDAD - REVISIÓN RÁPIDA

```
[ ] Contraseñas hasheadas (Bcrypt)
[ ] CSRF token para SPA (Sanctum maneja automáticamente)
[ ] Sin exponer datos sensibles en JSON
[ ] Validación de permisos (Spatie)
[ ] Rate limiting en endpoints sensibles
[ ] Logging de acciones críticas
[ ] Sin SQL injection (usar Eloquent)
[ ] HTTPS en producción
```

---

## 📊 REPORTE FINAL

**Usa esta plantilla para reportar estado:**

```markdown
# Auditoría Backend - OrganiRack+ Headless

**Fecha:** [Tu fecha]
**Auditor:** José

## Estado General
- [ ] ✅ PASA
- [ ] ⚠️ CON OBSERVACIONES
- [ ] ❌ FALLA

## Resultados

### Routes
- [x] web.php limpia
- [x] api.php REST
- [x] auth:sanctum aplicado

### Controllers
- [x] Retornan JSON
- [x] Validación presente
- [x] Sin vistas Blade

### Configuración
- [x] .env correcto
- [x] CORS habilitado
- [x] Sessions correctas

### Testing
- [x] Health check ✅
- [x] CORS preflight ✅
- [x] Login funciona ✅
- [x] 401 sin auth ✅

## Observaciones
(Aquí listar issues encontrados)

## Próximos Pasos
- [ ] Resolver issues
- [ ] Re-auditar
- [ ] Aprobation para frontend
```

---

## ✅ SIGN-OFF FINAL

Cuando TODO está verde:

```bash
# Limpiar caché
php artisan cache:clear
php artisan config:clear

# Iniciar servidor
php artisan serve

# Comunicar a Andrés:
# "Backend está listo - Puedes conectarte desde frontend"
```

---

## 📞 SI HAY PROBLEMAS

1. **Consulta:** POLITICAS_INTEGRACION.md
2. **Referencia:** INTEGRACION_FRONTEND_BACKEND.md (sección backend)
3. **Contacta:** Tech Lead o Arquitecto Senior

---

**Documento de verificación oficial. Completarlo antes de comunicar "Backend Listo" a frontend.**
