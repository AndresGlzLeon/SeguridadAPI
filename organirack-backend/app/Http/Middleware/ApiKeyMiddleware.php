<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware: ApiKeyMiddleware
 *
 * Verifica que la petición incluya el header X-API-KEY con el valor
 * configurado en .env (API_KEY). Si no coincide, deniega el acceso con 401.
 *
 * Uso: aplicar el alias 'api.key' a rutas o grupos de rutas.
 */
class ApiKeyMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expectedKey = config('app.api_key', 'organirack_secreto_123');
        $providedKey = $request->header('X-API-KEY');

        if (empty($providedKey) || $providedKey !== $expectedKey) {
            return response()->json([
                'error'   => 'Acceso denegado. API Key inválida',
                'message' => 'Debes incluir el header X-API-KEY con un valor válido.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $next($request);
    }
}
