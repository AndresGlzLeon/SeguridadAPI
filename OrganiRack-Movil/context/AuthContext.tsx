import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as authService from "../API/auth";
import type { AuthError, LoginCredentials, User } from "../types/auth";

/**
 * Interfaz del contexto de autenticación
 */
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSignedIn: boolean;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

/**
 * Crear contexto con valor inicial
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Proveedor de autenticación
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const sessionCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  /**
   * Verificar si hay un token almacenado al montar el componente
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Verificar si la sesión anterior ha expirado
        const sessionExpired = await authService.isSessionExpired();
        const storedToken = await authService.getStoredToken();

        if (storedToken && !sessionExpired) {
          setToken(storedToken);
        } else if (storedToken && sessionExpired) {
          // Sesión expirada, limpiar y mostrar error
          await authService.clearAuthToken();
          setError({
            message:
              "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.",
          });
        }
      } catch (err) {
        console.error("Error inicializando autenticación:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Función para hacer login
   */
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      setToken(response.token);
      setUser(response.user);
      // Iniciar verificador de expiración de sesión
      startSessionCheck();
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Inicia el verificador periódico de expiración de sesión
   */
  const startSessionCheck = () => {
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }
    // Verificar cada minuto si la sesión ha expirado
    sessionCheckIntervalRef.current = setInterval(async () => {
      const sessionExpired = await authService.isSessionExpired();
      if (sessionExpired) {
        handleSessionExpired();
      }
    }, 60000); // Verificar cada 60 segundos
  };

  /**
   * Maneja la expiración de sesión
   */
  const handleSessionExpired = async () => {
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }
    await logout();
    setError({
      message: "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.",
    });
  };

  /**
   * Función para hacer logout
   */
  const logout = async () => {
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
      setError(null);
    } catch (err) {
      console.error("Error durante logout:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Limpiar error
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Limpiar el verificador de sesión al desmontar el componente
   */
  useEffect(() => {
    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isSignedIn: token !== null,
    error,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para usar el contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
