# ⚠️ NOTA CRÍTICA: CORS - Diferencia entre curl y fetch

**Importancia:** 🔴 CRÍTICO  
**Aplica a:** Todo el equipo  
**Evita:** Confusión en testing local

---

## 🎯 PROBLEMA

Cuando testeas conectividad, encontrarás esta situación confusa:

```bash
# Terminal 1: Backend está levantado en http://localhost:8000

# Esto FUNCIONA:
curl http://localhost:8000/
# {"status":"ok","message":"OrganiRack+ API - Headless Backend",...}

# Pero esto FALLA:
# En DevTools Console (http://localhost:5173):
fetch('http://localhost:8000/')
# Error: Access to fetch at 'http://localhost:8000/' from origin 
# 'http://localhost:5173' has been blocked by CORS policy
```

**¿Por qué sucede?** 🤔

---

## 🔍 EXPLICACIÓN

### curl (sin CORS)

```
│ Terminal / Script │
│                  │
│ curl http://... │
└────────┬─────────┘
         │
         └─→ [Backend]
              (sin validar origen)
              
✅ FUNCIONA - curl no envía header Origin
```

**curl NO respeta CORS** porque:
- Es una herramienta de línea de comandos
- No es navegador
- No implementa políticas de seguridad CORS

---

### fetch (con CORS)

```
│ Navegador http://localhost:5173 │
│                                 │
│ fetch('http://localhost:8000')  │
└────────┬────────────────────────┘
         │ Origin: http://localhost:5173 (header automático)
         │
         └─→ [Backend]
              ¿Es localhost:5173 permitido?
              
              ❌ NO: bloqueado (error CORS)
              ✅ SÍ: permitido (respuesta OK)
```

**fetch SÍ respeta CORS** porque:
- Viene desde un navegador
- El navegador implementa políticas CORS
- Envía automáticamente header `Origin`
- Backend valida el origen

---

## 📋 CONFIGURACIÓN EN BACKEND

```php
// config/cors.php

'paths' => ['api/*', 'sanctum/csrf-cookie'],
//         ^^^^^^^ Solo estas rutas tienen CORS

'allowed_origins' => [
    'http://localhost:5173',
],
```

**Esto significa:**

```
✅ FUNCIONAN desde navegador (CORS OK):
   - fetch('http://localhost:8000/api/login')
   - fetch('http://localhost:8000/api/user')
   - fetch('http://localhost:8000/api/dashboard/metrics')
   
❌ NO funcionan desde navegador (CORS bloqueado):
   - fetch('http://localhost:8000/')          ← raíz NO está en paths
   - fetch('http://localhost:8000/index.html') ← raíz NO está en paths
   
✅ SÍ funcionan desde curl (no respeta CORS):
   - curl http://localhost:8000/
   - curl http://localhost:8000/index.html
```

---

## ✅ SOLUCIÓN: Cómo testear correctamente

### Opción 1: Usar endpoints bajo /api/* (RECOMENDADO)

**Test desde Navegador:**
```javascript
// DevTools Console en http://localhost:5173

// ✅ CORRECTO
fetch('http://localhost:8000/api/user', {
  credentials: 'include',  // Envía cookies
})
  .then(r => {
    console.log('Status:', r.status);
    console.log('✅ CORS funciona');
    return r.json();
  })
  .catch(e => console.error('❌ Error:', e.message));
```

**Resultado esperado:**
- Status: 200 (si autenticado) o 401 (si no autenticado)
- ✅ Mensaje en console

---

### Opción 2: Usar curl (solo backend)

**Test desde Terminal:**
```bash
# Esto SIEMPRE funciona (curl no respeta CORS)
curl http://localhost:8000/

# Resultado:
{"status":"ok","message":"OrganiRack+ API - Headless Backend",...}
```

---

## 🎓 RESUMEN PRÁCTICO

| Situación | curl | fetch() | Funciona? | Razón |
|-----------|------|---------|-----------|-------|
| curl GET / | ✅ | ❌ | curl sí | curl ignora CORS |
| fetch GET / | - | ❌ | No | / no en CORS paths |
| fetch GET /api/user | - | ✅ | Sí | /api/* en CORS paths |
| curl GET /api/user | ✅ | ✅ | Ambos | curl + CORS OK |

---

## 🚀 TESTING WORKFLOW

### 1. Verifica Backend (solo curl)
```bash
curl http://localhost:8000/
# ✅ retorna JSON
```

### 2. Verifica CORS desde Navegador
```javascript
// En DevTools Console (http://localhost:5173)
fetch('http://localhost:8000/api/user', {
  credentials: 'include',
})
  .then(r => console.log('Status:', r.status))
// ✅ status 200 o 401 (normal)
// ❌ CORS error (backend config problem)
```

### 3. Verifica Autenticación
```javascript
// En DevTools Console después de login
fetch('http://localhost:8000/api/user', {
  credentials: 'include',
})
  .then(r => r.json())
// ✅ retorna { user: {...} }
```

---

## ⚠️ REGLA DE ORO

```
curl → Para testing backend (ignora CORS)
fetch → Para testing frontend (respeta CORS)

Siempre que uses fetch desde navegador:
├── Asegurate que la ruta está en config/cors.php 'paths'
├── Usa credentials: 'include' para cookies
└── Espera status 200, 401, 422 (nunca CORS error si config OK)
```

---

## 📖 EN CASO DE DUDA

**"Estoy viendo error CORS en DevTools pero curl funciona":**
→ Revisa [INTEGRACION_FRONTEND_BACKEND.md](organirack-backend/INTEGRACION_FRONTEND_BACKEND.md) - Sección "CORS"
→ Asegurate que usas endpoint bajo `/api/*`

**"Necesito testear desde línea de comandos":**
→ Usa curl (no respeta CORS, siempre funciona)

**"Necesito testear desde navegador":**
→ Usa fetch a endpoints bajo `/api/*`

---

**Nota:** Este es un detalle de seguridad importante. CORS protege navegadores de ataques. curl está fuera de este modelo de seguridad.
