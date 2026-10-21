<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleCorsRequests
{
    /**
     * Middleware para manejar CORS correctamente
     */
    public function handle(Request $request, Closure $next): Response
    {
        $allowedOrigins = array_filter(
            array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')))
        );

        $origin = $request->header('Origin');

        // Responder a preflight requests (OPTIONS)
        if ($request->isMethod('OPTIONS')) {
            if (in_array($origin, $allowedOrigins)) {
                return response()
                    ->noContent()
                    ->header('Access-Control-Allow-Origin', $origin)
                    ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With, X-CSRF-Token')
                    ->header('Access-Control-Expose-Headers', 'Authorization, Content-Length, X-JSON-Response-Code')
                    ->header('Access-Control-Allow-Credentials', 'true')
                    ->header('Access-Control-Max-Age', '86400');
            }
            return response()->noContent(204);
        }

        // Procesar la request normalmente
        $response = $next($request);

        // Agregar headers CORS a la respuesta
        if (in_array($origin, $allowedOrigins)) {
            $response->header('Access-Control-Allow-Origin', $origin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With, X-CSRF-Token')
                ->header('Access-Control-Expose-Headers', 'Authorization, Content-Length, X-JSON-Response-Code')
                ->header('Access-Control-Allow-Credentials', 'true');
        }

        return $response;
    }
}
