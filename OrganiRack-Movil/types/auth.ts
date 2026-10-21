/**
 * Tipos y interfaces para autenticación
 */

/**
 * Datos del usuario autenticado
 */
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  roles: string[];
}

/**
 * Credenciales de login
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Respuesta exitosa del login
 */
export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

/**
 * Respuesta de error en autenticación
 */
export interface AuthError {
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Estado de autenticación
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: AuthError | null;
}
