# 🔐 Guía de Autenticación - Frontend

## Problema Actual
**Error 401 (Unauthorized)**: El frontend está recibiendo 401 al intentar acceder a `/api/products` y `/api/orders` porque falta el token de autenticación.

## Solución: Obtener Token Sanctum

### Opción 1: Autenticación Manual (Testing)

Ejecuta en la consola del navegador (DevTools → Console):

```javascript
// 1. Obtener token del backend
fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@example.com',        // Cambia según tu usuario
    password: '12345678'                // Cambia según tu contraseña
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Autenticación exitosa:', data);
  // Guardar token en localStorage
  localStorage.setItem('auth_token', data.data.token || data.token);
  console.log('🔑 Token guardado en localStorage');
})
.catch(err => console.error('❌ Error de autenticación:', err));
```

### Opción 2: Autenticación Integrada en Frontend

Si existe una ruta `/login` o página de autenticación, tras login exitoso debe hacer:

```typescript
// En tu componente de login o servicio de autenticación:
localStorage.setItem('auth_token', tokenDeLaRespuesta);
```

## Verificar Token en localStorage

En la consola del navegador:

```javascript
// Ver el token guardado
console.log(localStorage.getItem('auth_token'));

// Limpiar token (si es necesario)
localStorage.removeItem('auth_token');
```

## Debugging: Chequear logs del interceptor

1. Abre DevTools (`F12`)
2. Ve a **Console**
3. Busca logs como:
   - `🔑 Token en localStorage: ✅ Presente` → Token está OK
   - `🔑 Token en localStorage: ❌ No encontrado` → Falta token
   - `✅ Header Authorization añadido` → Header se envió correctamente

## Backend: Endpoints de Autenticación Comunes

```bash
# Login (obtener token)
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "12345678"
}

# Respuesta esperada:
{
  "token": "1|xxxxxxxxxxxx...",
  "user": { ... }
}
```

## Checklist

- [ ] Backend (PHP) está corriendo en `http://localhost:8000`
- [ ] He obtenido un token válido desde `/api/auth/login`
- [ ] He guardado el token en localStorage con clave `auth_token`
- [ ] Los logs muestran `✅ Token en localStorage: ✅ Presente`
- [ ] Los endpoints ahora devuelven datos en lugar de 401

## Próximos Pasos

1. **Obtén el token** (ver Opción 1 o 2 arriba)
2. **Recarga la página** del frontend
3. **Abre DevTools → Console**
4. **Busca los logs** del interceptor
5. **Verifica que las peticiones ahora sí funcionan** (status 200 en lugar de 401)

---

**Nota**: En producción, esto debería estar integrado en un componente de login adecuado. Esta guía es solo para testing local.
