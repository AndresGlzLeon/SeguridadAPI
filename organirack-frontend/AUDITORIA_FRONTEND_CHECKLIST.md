# 🔍 GUÍA DE AUDITORÍA FRONTEND - ARQUITECTURA HEADLESS

**Para:** Andrés (Desarrollador Frontend)  
**Objetivo:** Verificar que el frontend cumple con estándar Headless + SPA  
**Tiempo:** 20 minutos

---

## ✅ FASE 1: CONFIGURACIÓN INICIAL (5 min)

### 1. .env.local Existe y está Configurado

```bash
cd organirack-frontend

# Verificar que existe
ls -la .env.local

# Ver contenido
cat .env.local
```

**Debe tener:**
```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=OrganiRack+
VITE_DEBUG=true
```

✅ **Checklist:**
- [ ] Archivo `.env.local` existe
- [ ] `VITE_API_URL` apunta a `http://localhost:8000/api`
- [ ] `VITE_API_URL` NO está hardcodeado en código
- [ ] Archivo está en `.gitignore`

---

### 2. Verificar .gitignore

```bash
# Debe excluir .env.local
grep ".env.local" .gitignore

# Resultado esperado:
# .env.local
# .env.local.*
```

✅ **Checklist:**
- [ ] `.env.local` está en `.gitignore`
- [ ] Otros archivos sensibles también excluidos

---

### 3. npm/yarn Packages Instalados

```bash
# Verificar que axios está instalado
npm list axios
# o
yarn why axios

# Resultado esperado:
# axios@1.13.6 (o similar)
```

✅ **Checklist:**
- [ ] `axios` instalado
- [ ] `pinia` instalado (state management)
- [ ] `vue-router` instalado (routing)
- [ ] `vite` instalado

---

## ✅ FASE 2: CONFIGURACIÓN AXIOS (5 min)

### 1. axios.js Tiene `withCredentials: true`

```bash
# Buscamos withCredentials
grep -n "withCredentials" src/axios.js

# Resultado esperado:
# withCredentials: true,
```

✅ **Si NO aparece:** ❌ CRÍTICO - Agregar inmediatamente

---

### 2. axios.js Usa Variable de Entorno

```bash
# Verifica que usa import.meta.env.VITE_API_URL
grep "VITE_API_URL" src/axios.js

# Resultado esperado:
# baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
```

✅ **Checklist:**
- [ ] No hay URL hardcodeada
- [ ] Usa `import.meta.env.VITE_API_URL`
- [ ] Tiene fallback a localhost:8000/api

---

### 3. axios.js Tiene Interceptores

```bash
# Busca interceptores
grep -n "interceptors" src/axios.js

# Resultado esperado:
# axiosInstance.interceptors.request.use(...)
# axiosInstance.interceptors.response.use(...)
```

✅ **Checklist:**
- [ ] Request interceptor existe
- [ ] Response interceptor existe
- [ ] Maneja errores 401, 403, 422

---

## ✅ FASE 3: TESTEO CONECTIVIDAD (5 min)

### 1. Backend está levantado

```bash
# En otra terminal, verificar backend
curl http://localhost:8000/

# Resultado esperado: JSON health check
```

✅ Si retorna JSON → backend OK

---

### 2. Frontend levantado

```bash
# En terminal de frontend
npm run dev

# Resultado esperado:
# VITE v8.0.1  local:   http://localhost:5173/
```

✅ Accede a http://localhost:5173 en navegador

---

### 3. Console Test - Verificar Axios

En DevTools Console (F12 en http://localhost:5173):

```javascript
// Verifica conectividad con un endpoint bajo /api/* (CORS habilitado)
// Nota: La ruta / NO tiene CORS habilitado, por eso usamos /api/user
fetch('http://localhost:8000/api/user', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',  // ← Envía cookies
})
  .then(r => {
    console.log('Status:', r.status);
    // 401 = esperado sin estar autenticado
    // 200 = si ya has hecho login en esta sesión
    if (r.status === 401 || r.status === 200) {
      console.log('✅ CORS funciona correctamente');
      console.log('Response:', r);
    }
    return r.json();
  })
  .then(data => console.log('Data:', data))
  .catch(e => console.error('❌ Error CORS:', e.message));
```

✅ En console deberías ver: `✅ CORS funciona correctamente` (status 200 o 401 es normal)

---

### 4. Test CORS

En DevTools Console:

```javascript
fetch('http://localhost:8000/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',  // ← Importante: include cookies
  body: JSON.stringify({
    username: 'testuser',
    password: 'wrongpass'
  })
})
  .then(r => {
    console.log('Status:', r.status);
    console.log('Headers:', {
      'access-control-allow-origin': r.headers.get('access-control-allow-origin'),
      'access-control-allow-credentials': r.headers.get('access-control-allow-credentials'),
    });
    return r.json();
  })
  .then(data => console.log('Response:', data))
  .catch(e => console.error('Error:', e.message));
```

✅ Deberías ver:
- Status: 401 o 200
- `'access-control-allow-origin': 'http://localhost:5173'`
- `'access-control-allow-credentials': 'true'`

---

## ✅ FASE 4: VERIFICACIÓN DE CÓDIGO (5 min)

### 1. No hay URLs Hardcodeadas

```bash
# Buscar URLs hardcodeadas en código
grep -r "localhost:8000" src/ --exclude-dir=node_modules

# Debe retornar SOLO:
# - .env.local (configuración)
# - axios.js (como fallback)
```

✅ **Checklist:**
- [ ] URLs hardcodeadas = 0 (excepto en axios.js como fallback)
- [ ] Componentes usan importar servicios, no URLs directas

---

### 2. Vias No Retornan Vistas Blade

```bash
# Confirmar que NO hay imports Blade
grep -r "blade\|Blade\|BLADE" src/

# Resultado esperado: (nada)
```

✅ Si no hay resultados → ✅ OK

---

### 3. Componentes Usan Axios Correctamente

**Buscar ejemplos:**
```bash
grep -r "axiosInstance" src/components/ | head -3

# Resultado esperado:
# src/components/LoginForm.vue:import axiosInstance from '@/axios';
# src/components/Dashboard.vue:import axiosInstance from '@/axios';
```

✅ **Checklist:**
- [ ] Componentes importan axiosInstance
- [ ] NO crean nuevas instancias de axios
- [ ] Usan await/async correctamente

---

### 4. Manejo de Errores Presente

```bash
# Buscar manejo de error 401
grep -r "status === 401\|response?.status === 401" src/

# Debe haber manejo en:
# - axios interceptor
# - O en componentes individuales
```

✅ **Checklist:**
- [ ] Hay manejo de 401 (redirect a login)
- [ ] Hay manejo de 422 (validación)
- [ ] Há manejo de 500 (error general)

---

## 🔍 DEVTOOLS VERIFICATION

### 1. Network Tab - Verificar Cookies se Envían

1. Abre DevTools (F12)
2. Pestaña: Network
3. Haz un request a `/api/login`
4. Busca en Request Headers:
   ```
   Cookie: XSRF-TOKEN=...; laravel_session=...
   ```

✅ Si ves las cookies → ✅ withCredentials: true funciona

---

### 2. Application Tab - Verificar Cookies se Guardan

1. DevTools > Application > Cookies > http://localhost:5173
2. Después de login, deberías ver:
   ```
   XSRF-TOKEN      | ... | / | ...
   laravel_session | ... | / | ...
   ```

✅ Ambas deben estar HttpOnly ✅

---

### 3. Console Tab - Verificar Logs

```javascript
// En console, verifica que axios está configured
console.log('Axios baseURL:', (await import('@/axios')).default.defaults.baseURL);
console.log('WithCredentials:', (await import('@/axios')).default.defaults.withCredentials);

// Resultado esperado:
// Axios baseURL: http://localhost:8000/api
// WithCredentials: true
```

✅ Si ves los valores correctos → ✅ OK

---

## ⚠️ PROBLEMAS COMUNES (Troubleshooting)

### Problema: "CORS blocked"
```
Error: Access to XMLHttpRequest blocked by CORS policy
Causa: Backend no permite localhost:5173
```

**Solución:**
1. Verifica que backend `.env` tiene `FRONTEND_URL=http://localhost:5173`
2. Verifica que `config/cors.php` permite esa URL
3. Reinicia Laravel: `php artisan config:clear && php artisan serve`

---

### Problema: "Cookies not sending"
```
Síntoma: Requests sin cookies en Network tab
Causa: withCredentials: false
```

**Solución:**
```javascript
// src/axios.js debe tener:
const axiosInstance = axios.create({
  withCredentials: true,  // ← Agregalo
});
```

---

### Problema: "401 en cada request"
```
Síntoma: Login funciona, pero siguiente GET devuelve 401
Causa: Cookies no se guardan
```

**Verificar:**
1. DevTools > Application > Cookies - ¿Están las cookies?
2. Si NO están → Problema con SESSION_SECURE o SESSION_SAME_SITE
3. Si SÍ están → Problema con request (no está enviándolas)

---

### Problema: "Network error: connect ECONNREFUSED"
```
Causa: Backend no está levantado
```

**Solución:**
```bash
# En terminal backend
php artisan serve

# Debe mostrar:
# INFO  Server running on [http://127.0.0.1:8000]
```

---

### Problema: "Cannot find module '@/axios'"
```
Causa: Path alias no configurado
```

**Solución:** Verifica `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // ← Asegurate que existe
    },
  },
})
```

---

## 📊 CHECKLIST FINAL

Completar antes de comunicar "Frontend Listo":

```
Configuración:
  [ ] .env.local existe y tiene VITE_API_URL correcto
  [ ] .env.local está en .gitignore
  [ ] npm install completado
  
Axios:
  [ ] src/axios.js existe
  [ ] withCredentials: true presente
  [ ] Usa import.meta.env.VITE_API_URL
  [ ] Request interceptor presente
  [ ] Response interceptor presente
  
Servidor:
  [ ] npm run dev levanta en http://localhost:5173
  [ ] Backend está levantado en http://localhost:8000
  [ ] CURL a backend retorna JSON

Conectividad:
  [ ] DevTools Network muestra cookies en requests
  [ ] DevTools Application muestra cookies guardadas
  [ ] Console log muestra Axios configurado correctamente
  [ ] Test de login en console funciona
  
Código:
  [ ] No hay URLs hardcodeadas (excepto fallback en axios.js)
  [ ] No hay imports de Blade
  [ ] Componentes usan axiosInstance
  [ ] Manejo de errores 401/422/500 presente
  [ ] Imports correctos de servicios
```

---

## ✅ SIGN-OFF FINAL

Cuando TODO está verde:

```bash
# Comunicar a José:
# "Frontend está listo - He verificado conectividad con backend"

# Últimas acciones:
npm run build  # Verificar que build funciona

# Luego:
npm run dev    # Para desarrollo
```

---

## 📞 SI HAY PROBLEMAS

1. **Configuración:** CHECKLIST_INTEGRACION_RAPIDO.md
2. **Técnico:** INTEGRACION_FRONTEND_BACKEND.md (sección frontend)
3. **Ejemplos:** EJEMPLOS_INTEGRACION_CODIGO.md
4. **Contacta:** Tech Lead o José (backend)

---

## 🎯 PRUEBA DE INTEGRACIÓN COMPLETA

Una vez todo pase:

```javascript
// En DevTools Console de http://localhost:5173

import axiosInstance from '@/axios';

// 1. Test login
const loginRes = await axiosInstance.post('/login', {
  username: 'testuser',
  password: 'password123'
});
console.log('Login:', loginRes.data);

// 2. Test obtener usuario
const userRes = await axiosInstance.get('/user');
console.log('User:', userRes.data);

// 3. Test obtener datos
const dashRes = await axiosInstance.get('/dashboard/metrics');
console.log('Metrics:', dashRes.data);

// Si los 3 retornan datos → ✅ INTEGRACIÓN COMPLETA FUNCIONA
```

✅ Si todos los 3 calls funcionan sin errores → Frontend está 100% listo

---

**Documento de verificación oficial. Completarlo antes de comunicar "Frontend Listo" a backend.**
