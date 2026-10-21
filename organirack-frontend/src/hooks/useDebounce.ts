/**
 * hooks/useDebounce.ts
 * Hook personalizado para debounce de valores y callbacks
 */

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Hook que debounce un valor después de un delay especificado
 * Útil para búsquedas, filtros, redimensionamiento, etc.
 *
 * @param value - Valor a debounce
 * @param delayMs - Delay en milisegundos (default: 300)
 * @returns Valor debouncado
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * useEffect(() => {
 *   // Solo se ejecuta cuando debouncedSearch cambia
 *   performSearch(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Hook que debounce un callback en lugar de un valor
 * Evita recrear funciones innecesariamente
 *
 * @param callback - Función a ejecutar
 * @param delayMs - Delay en milisegundos
 * @param deps - Dependencias (como en useEffect)
 * @returns Función debouncida
 *
 * @example
 * const debouncedSearch = useDebouncedCallback(
 *   (query) => fetchResults(query),
 *   300,
 *   []
 * );
 *
 * <Input onChange={(e) => debouncedSearch(e.target.value)} />
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delayMs: number = 300,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delayMs);
    },
    [callback, delayMs]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback as T;
}

/**
 * Hook para throttle de funciones (ejecuta máximo 1 vez cada delayMs)
 *
 * @param callback - Función a ejecutar
 * @param delayMs - Delay mínimo entre ejecuciones
 * @returns Función throttled
 *
 * @example
 * const handleScroll = useThrottledCallback(
 *   () => checkIfNeedsPagination(),
 *   200
 * );
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delayMs: number = 300
): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delayMs) {
        callback(...args);
        lastRunRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRunRef.current = Date.now();
        }, delayMs - timeSinceLastRun);
      }
    },
    [callback, delayMs]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback as T;
}
