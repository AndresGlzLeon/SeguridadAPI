<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Obtiene todos los usuarios con el rol 'almacenista'.
     * GET /api/users/almacenistas
     * 
     * Retorna un array con id y name para usar en selects
     *
     * @return JsonResponse
     */
    public function getAlmacenistas(): JsonResponse
    {
        try {
            $almacenistas = User::role('Almacenista')
                ->where('is_active', true)
                ->get(['id', 'name']);

            return response()->json([
                'message' => 'Almacenistas obtenidos correctamente',
                'data' => $almacenistas,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('❌ Error al obtener almacenistas:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Error al obtener almacenistas',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene todos los usuarios con el rol 'capturista'.
     * GET /api/users/capturistas
     *
     * @return JsonResponse
     */
    public function getCapturistas(): JsonResponse
    {
        try {
            $capturistas = User::role('Capturista')
                ->where('is_active', true)
                ->get(['id', 'name']);

            return response()->json([
                'message' => 'Capturistas obtenidos correctamente',
                'data' => $capturistas,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('❌ Error al obtener capturistas:', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Error al obtener capturistas',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene todos los usuarios con el rol 'administrador'.
     * GET /api/users/administradores
     *
     * @return JsonResponse
     */
    public function getAdministradores(): JsonResponse
    {
        try {
            $administradores = User::role('Administrador')
                ->where('is_active', true)
                ->get(['id', 'name']);

            return response()->json([
                'message' => 'Administradores obtenidos correctamente',
                'data' => $administradores,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('❌ Error al obtener administradores:', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Error al obtener administradores',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene todos los usuarios con el rol 'gerente'.
     * GET /api/users/gerentes
     *
     * @return JsonResponse
     */
    public function getGerentes(): JsonResponse
    {
        try {
            $gerentes = User::role('Gerente')
                ->where('is_active', true)
                ->get(['id', 'name']);

            return response()->json([
                'message' => 'Gerentes obtenidos correctamente',
                'data' => $gerentes,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('❌ Error al obtener gerentes:', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Error al obtener gerentes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene todos los usuarios con información completa.
     * GET /api/users
     * 
     * Retorna un array con id, name, email, username, is_active, last_login_at
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $users = User::with('roles')->get();

            return response()->json([
                'message' => 'Usuarios obtenidos correctamente',
                'data' => $users,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('❌ Error al obtener usuarios:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Error al obtener usuarios',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crea un nuevo usuario.
     * POST /api/users
     *
     * @return JsonResponse
     */
    public function store(): JsonResponse
    {
        try {
            $validated = request()->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'username' => 'required|string|unique:users,username',
                'password' => 'required|string|min:8',
                'role' => 'required|string|in:Jefe de Almacen,Gerencia de Operaciones,Almacenista,Capturista',
                'is_active' => 'boolean|nullable',
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'username' => $validated['username'],
                'password' => $validated['password'],
                'is_active' => $validated['is_active'] ?? true,
            ]);

            // Asignar rol
            $user->assignRole($validated['role']);

            \Log::info('✅ Usuario creado:', ['user_id' => $user->id, 'name' => $user->name]);

            return response()->json([
                'message' => 'Usuario creado correctamente',
                'data' => $user->load('roles'),
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validación fallida',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            \Log::error('❌ Error al crear usuario:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Error al crear usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene un usuario específico.
     * GET /api/users/{id}
     *
     * @param $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        try {
            $user = User::with('roles')->findOrFail($id);

            return response()->json([
                'message' => 'Usuario obtenido correctamente',
                'data' => $user,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Usuario no encontrado',
            ], 404);

        } catch (\Exception $e) {
            \Log::error('❌ Error al obtener usuario:', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Error al obtener usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualiza un usuario existente.
     * PUT /api/users/{id}
     *
     * @param $id
     * @return JsonResponse
     */
    public function update($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            $validated = request()->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $id,
                'username' => 'sometimes|string|unique:users,username,' . $id,
                'password' => 'sometimes|string|min:8',
                'role' => 'sometimes|string|in:Jefe de Almacen,Gerencia de Operaciones,Almacenista,Capturista',
                'is_active' => 'sometimes|boolean',
            ]);

            $user->update($validated);

            // Actualizar rol si se proporciona
            if (isset($validated['role'])) {
                $user->syncRoles($validated['role']);
            }

            \Log::info('✅ Usuario actualizado:', ['user_id' => $user->id]);

            return response()->json([
                'message' => 'Usuario actualizado correctamente',
                'data' => $user->load('roles'),
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Usuario no encontrado',
            ], 404);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validación fallida',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            \Log::error('❌ Error al actualizar usuario:', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Error al actualizar usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Elimina un usuario.
     * DELETE /api/users/{id}
     *
     * @param $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Evitar eliminar al usuario actual
            if ($user->id === auth()->id()) {
                return response()->json([
                    'message' => 'No puedes eliminar tu propia cuenta',
                ], 403);
            }

            $user->delete();

            \Log::info('✅ Usuario eliminado:', ['user_id' => $id]);

            return response()->json([
                'message' => 'Usuario eliminado correctamente',
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Usuario no encontrado',
            ], 404);

        } catch (\Exception $e) {
            \Log::error('❌ Error al eliminar usuario:', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Error al eliminar usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cambia el estado activo/inactivo de un usuario.
     * PATCH /api/users/{id}/toggle-status
     *
     * @param $id
     * @return JsonResponse
     */
    public function toggleStatus($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Evitar desactivar al usuario actual
            if ($user->id === auth()->id() && $user->is_active) {
                return response()->json([
                    'message' => 'No puedes desactivar tu propia cuenta',
                ], 403);
            }

            $user->update(['is_active' => !$user->is_active]);

            \Log::info('✅ Estado de usuario cambiado:', [
                'user_id' => $id,
                'is_active' => $user->is_active,
            ]);

            return response()->json([
                'message' => 'Estado del usuario actualizado correctamente',
                'data' => $user->load('roles'),
                'is_active' => $user->is_active,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Usuario no encontrado',
            ], 404);

        } catch (\Exception $e) {
            \Log::error('❌ Error al cambiar estado de usuario:', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Error al cambiar estado del usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
