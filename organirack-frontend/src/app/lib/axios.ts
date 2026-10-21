import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { clearAuthSession, getAuthToken } from './auth';

// ====== CONFIGURACIÓN ======
const isDev = (import.meta as any).env.DEV;
// Con el proxy de Vite activo, 20s es suficiente incluso por ngrok
const REQUEST_TIMEOUT = 20000;

/**
 * Cliente HTTP centralizado con axios
 * - Agrega automáticamente el token JWT a los headers
 * - Maneja reintentos en caso de errores 401
 * - Limpia la sesión si ocurren errores de autenticación
 * - URL base configurada para ngrok HTTPS y desarrollo local
 */

// Con el proxy de Vite, las peticiones van a /api/... relativas al mismo origen.
// Vite (corriendo en tu máquina) las reenvía internamente a http://localhost:8000.
// Así el backend NUNCA queda expuesto al visitante externo.
//
// Si VITE_API_BASE_URL está definida (p.ej. para producción), se usa como base.
const API_BASE_URL =
  ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ??
  '';

// Crear instancia de axios CON /api en baseURL
const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: REQUEST_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '69420'
  },
});

/**
 * Interceptor de request
 * Agrega token JWT automáticamente + logging en desarrollo
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Logging en desarrollo
    if (isDev) {
      console.debug('[HTTP-REQUEST]', {
        method: config.method?.toUpperCase(),
        url: config.url,
        timestamp: new Date().toISOString(),
      });
    }

    return config;
  },
  (error) => {
    if (isDev) {
      console.error('[HTTP-REQUEST-ERROR]', error);
    }
    return Promise.reject(error);
  }
);

/**
 * Interceptor de response
 * - Logging en desarrollo
 * - Manejo de errores 401 (sesión expirada)
 * - Logging de errores 5xx
 */
axiosInstance.interceptors.response.use(
  (response) => {
    if (isDev && response.status >= 200 && response.status < 300) {
      console.debug('[HTTP-RESPONSE]', {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        timestamp: new Date().toISOString(),
      });
    }
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;

    // Logging en desarrollo
    if (isDev) {
      console.error('[HTTP-ERROR]', {
        status,
        message: error.message,
        url: error.config?.url,
        data: error.response?.data,
        timestamp: new Date().toISOString(),
      });
    }

    // Si la respuesta es 401, limpiar sesión
    if (status === 401) {
      console.warn('[AUTH] Sesión expirada - 401 detectado');
      clearAuthSession();
    }

    // Logging para errores 5xx
    if (status && status >= 500) {
      console.error(`[SERVER-ERROR] ${status} ${error.message}`);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
