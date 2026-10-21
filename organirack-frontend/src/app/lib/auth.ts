// Con el proxy de Vite configurado en vite.config.ts, las peticiones a /api/*
// se reenvían internamente a http://localhost:8000. Usar ruta relativa aquí
// permite que el proxy funcione tanto en desarrollo local como vía ngrok.
const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const AUTH_TOKEN_KEY = "authToken";
const AUTH_USER_KEY = "authUser";
const LOGIN_TIMEOUT_MS = 8000;

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  email: string;
  roles?: string[];
}

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("El login tardó demasiado. Intenta de nuevo.");
    }

    throw new Error("No se pudo conectar con el servidor.");
  }

  clearTimeout(timeout);

  let responseData: any = null;
  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    const errorMessage =
      responseData?.message ||
      responseData?.errors?.username?.[0] ||
      responseData?.errors?.password?.[0] ||
      "No se pudo iniciar sesion";

    throw new Error(errorMessage);
  }

  return responseData as LoginResponse;
}

export function saveAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  const rawUser = localStorage.getItem(AUTH_USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken());
}
