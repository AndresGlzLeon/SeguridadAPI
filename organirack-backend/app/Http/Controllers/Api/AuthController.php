<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * @param AuthService $authService
     */
    public function __construct(private AuthService $authService) {}

    /**
     * Endpoint de login para la aplicación móvil.
     * Retorna un token Sanctum.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        // Validar campos requeridos
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        try {
            // Verificar credenciales - Permite todos los roles del sistema
            $user = $this->authService->verifyCredentials(
                $validated['username'],
                $validated['password'],
                ['Almacenista', 'Jefe de Almacen', 'Gerencia de Operaciones', 'Capturista'] // Roles permitidos
            );

            // Generar token
            $token = $user->createToken('MobileApp')->plainTextToken;

            // Retornar respuesta con token y datos del usuario
            return response()->json([
                'message' => 'Login exitoso',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                ],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Error de autenticación',
                'errors' => $e->errors(),
            ], 401);
        }
    }
}
