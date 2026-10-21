/**
 * Servicios de autenticación
 * Gestiona todas las operaciones relacionadas con login, logout y gestión de tokens
 */

import * as SecureStore from "expo-secure-store";
import type { AuthError, LoginCredentials, LoginResponse } from "../types/auth";
import apiClient from "./client";

/**
 * Realiza el login con las credenciales del usuario
 * @param credentials - Usuarios y contraseña
 * @returns Promesa con la respuesta del login (token y datos del usuario)
 * @throws Error si las credenciales son inválidas o hay error de conexión
 */
export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  try {
    const response = await apiClient.post("/login", credentials);

    const data: LoginResponse = response.data;

    // Guardar token en almacenamiento seguro
    if (data.token) {
      await SecureStore.setItemAsync("auth_token", data.token);
      await setSessionTimestamp();
    }

    return data;
  } catch (error: any) {
    const authError: AuthError = {
      message:
        error.response?.data?.message ||
        error.message ||
        "Error de autenticación",
      errors: error.response?.data?.errors,
    };
    throw authError;
  }
}

/**
 * Logout del usuario actual
 * Limpia el token de autenticación
 */
export async function logout(): Promise<void> {
  try {
    // Limpiar token del almacenamiento seguro
    await SecureStore.deleteItemAsync("auth_token");
  } catch (error) {
    console.error("Error durante logout:", error);
  }
}

/**
 * Obtiene el token de autenticación almacenado
 * @returns El token de autenticación o null si no existe
 */
export async function getStoredToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync("auth_token");
    return token;
  } catch (error) {
    console.error("Error obteniendo token almacenado:", error);
    return null;
  }
}

/**
 * Verifica si el usuario está autenticado
 * @returns true si hay un token válido almacenado
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getStoredToken();
  return token !== null && token !== undefined;
}

/**
 * Actualiza el token de autenticación
 * @param token - Nuevo token a almacenar
 */
export async function setAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync("auth_token", token);
  } catch (error) {
    console.error("Error estableciendo token:", error);
  }
}

/**
 * Limpia el token de autenticación
 */
export async function clearAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync("auth_token");
    await SecureStore.deleteItemAsync("session_timestamp");
  } catch (error) {
    console.error("Error limpiando token:", error);
  }
}

/**
 * Guarda el timestamp de inicio de sesión
 * Utilizado para validar el timeout de 15 minutos
 */
export async function setSessionTimestamp(): Promise<void> {
  try {
    const timestamp = new Date().getTime().toString();
    await SecureStore.setItemAsync("session_timestamp", timestamp);
  } catch (error) {
    console.error("Error estableciendo timestamp de sesión:", error);
  }
}

/**
 * Obtiene el timestamp de inicio de sesión
 * @returns Timestamp en milisegundos o null si no existe
 */
export async function getSessionTimestamp(): Promise<number | null> {
  try {
    const timestamp = await SecureStore.getItemAsync("session_timestamp");
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error("Error obteniendo timestamp de sesión:", error);
    return null;
  }
}

/**
 * Verifica si la sesión ha expirado (más de 5 minutos)
 * @returns true si la sesión ha expirado, false si sigue válida
 */
export async function isSessionExpired(): Promise<boolean> {
  try {
    const sessionTimestamp = await getSessionTimestamp();
    if (!sessionTimestamp) {
      return false;
    }

    const currentTime = new Date().getTime();
    const elapsedMinutes = (currentTime - sessionTimestamp) / (1000 * 60);
    const sessionTimeoutMinutes = 5;

    return elapsedMinutes > sessionTimeoutMinutes;
  } catch (error) {
    console.error("Error verificando expiración de sesión:", error);
    return false;
  }
}
