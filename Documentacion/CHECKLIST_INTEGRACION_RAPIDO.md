# ⚡ CHECKLIST RÁPIDO - INTEGRACIÓN FRONTEND/BACKEND

**Destinado a:** Andrés (Desarrollador Frontend)  
**Duración:** 15-20 minutos para configuración  
**Complejidad:** Media

---

## 🎯 OBJETIVO FINAL

Tener ambos servidores corriendo simultáneamente SIN conflictos:

```
Backend:  http://localhost:8000      (Laravel API)
Frontend: http://localhost:5173      (React/Vite)
```

---

## ✅ PASO 1: CLONE & SETUP DEL BACKEND (Lo hace José/Tech Lead)

```bash
# El backend ya debe estar configurado:
# ✓ routes/web.php limpio (sin vistas Blade)
# ✓ config/cors.php permite localhost:5173
# ✓ .env tiene FRONTEND_URL=http://localhost:5173
```

---

## ✅ PASO 2: LEVANTAR EL BACKEND

```bash
cd organirack-backend

# Verificar que .env está configurado
cat .env | grep -E "(APP_URL|FRONTEND_URL|DB_|SESSION_)"

# Limpiar caché
php artisan cache:clear && php artisan config:clear

# Iniciar servidor
php artisan serve

# Resultado esperado:
# INFO  Server running on [http://127.0.0.1:8000]
```

**Dejar esta terminal abierta.**

---

## ✅ PASO 3: VERIFICAR BACKEND (Test CORS)

En otra terminal:

```bash
# Test 1: Health check (Backend solo - sin CORS)
curl http://localhost:8000/

# Debe retornar:
# {"status":"ok","message":"OrganiRack+ API - Headless Backend",...}

# ⚠️ NOTA IMPORTANTE:
# - Este curl FUNCIONA porque curl NO respeta política CORS
# - Pero fetch() desde navegador FALLARÁ (CORS no habilita /)
# - Para probar desde navegador, debes usar un endpoint bajo /api/*
# - Ver PASO 7 para test desde navegador

# Test 2: CORS Preflight (Para apis bajo /api/*)
curl -X OPTIONS http://localhost:8000/api/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Debe incluir en headers:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Credentials: true
```

✅ Si ambos tests pasan → Backend está listo.

---

## ✅ PASO 4: CONFIGURAR FRONTEND

```bash
cd organirack-frontend

# Crear .env.local (copia del ejemplo)
cp .env.local.example .env.local

# Contenido de .env.local:
cat > .env.local << EOF
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=OrganiRack+
VITE_DEBUG=true
EOF

# Instalar dependencias
npm install
```

---

## ✅ PASO 5: CONFIGURAR AXIOS EN FRONTEND

**Archivo:** `src/axios.js`

```javascript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,  // 🔴 CRÍTICO para cookies SPA
});

// Interceptors para manejo de errores...
export default axiosInstance;
```

---

## ✅ PASO 6: LEVANTAR FRONTEND

```bash
cd organirack-frontend

npm run dev

# Resultado esperado:
# VITE v8.0.1  local:   http://localhost:5173/
```

**Dejar esta terminal abierta.**

---

## ✅ PASO 7: PRUEBA DESDE NAVEGADOR

1. Abre: `http://localhost:5173`
2. Abre DevTools (F12)
3. Pestaña: Console

Copia y pega:

```javascript
import axiosInstance from '@/axios';

axiosInstance.post('/login', {
  username: 'testuser',
  password: 'password123'
})
  .then(r => console.log('✅ Login exitoso:', r.data))
  .catch(e => console.error('❌ Error:', e.response?.data || e.message));
```

---

## ✅ PASO 8: VERIFICAR COOKIES (SPA)

En DevTools > Application > Cookies > http://localhost:5173

Deberías ver después de login:
- ✓ `XSRF-TOKEN`
- ✓ `laravel_session`

Ambas cookies deben tener:
- Domain: vacío (localhost)
- Path: /
- HttpOnly: ✓
- Secure: ✗ (en desarrollo)
- SameSite: Lax

---

## ❌ TROUBLESHOOTING RÁPIDO

### Error: "Access to XMLHttpRequest blocked by CORS"

```
Causa: FRONTEND_URL mal en .env del backend
Solución:
php artisan config:clear
php artisan serve
```

---

### Error: "Cookies no se envían en requests"

```
Causa: falta withCredentials: true en axios.js
Solución: Busca en axios.js y agrega:

withCredentials: true,  // Esta línea CRITICA
```

---

### Error: "401 Unauthorized en cada request"

```
Causa: La cookie no persiste
Solución: Verifica en DevTools > Application > Cookies
Deberías ver las cookies después de login
```

---

### Puerto 5173 ya está en uso

```bash
npm run dev -- --port 5174
```

---

### Puerto 8000 ya está en use

```bash
php artisan serve --port 8001
```

---

## 📋 CHECKLIST FINAL

Antes de empezar a programar, verifica:

- [ ] Backend levantado en `http://localhost:8000`
- [ ] Frontend levantado en `http://localhost:5173`
- [ ] CORS test retorna headers correctos
- [ ] `.env.local` actualizado en frontend
- [ ] `axios.js` tiene `withCredentials: true`
- [ ] Login test funciona desde consola del navegador
- [ ] Cookies visibles en DevTools después de login
- [ ] Console del navegador NO muestra errores CORS

---

## 🚀 LISTO PARA PROGRAMAR

Si todos los checkboxes están marcados, puedes empezar a:

1. ✅ Crear componentes React
2. ✅ Hacer llamadas a `/api/*`
3. ✅ Mostrar datos en la UI
4. ✅ Implementar flujos de autenticación

---

## 📖 DOCUMENTACIÓN COMPLETA

Para detalles técnicos profundos, lee: **INTEGRACION_FRONTEND_BACKEND.md**

Contiene:
- Arquitectura completa
- Estructura de respuestas JSON
- Códigos de error estándar
- Ejemplos completos
- Troubleshooting avanzado

---

## 💬 PREGUNTAS?

Contacta a Tech Lead o revisa la documentación completa.
