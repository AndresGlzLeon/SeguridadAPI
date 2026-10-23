<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Verifica las credenciales del usuario.
     *
     * @param string $username
     * @param string $password
     * @param array|string $rolesExpected
     * @return User
     * @throws ValidationException
     */
    public function verifyCredentials(string $identifier, string $password, array|string $rolesExpected): User
    {
        $identifier = trim($identifier);

        // Buscar usuario por username o email para soportar ambos formatos en la API
        $user = User::where('username', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        // Validar que el usuario existe
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => 'Credenciales incorrectas o rol no autorizado.',
            ]);
        }

        // Validar que la contraseña es correcta
        if (!Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => 'Credenciales incorrectas o rol no autorizado.',
            ]);
        }

        // Validar que el usuario esté activo
        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => 'Tu cuenta ha sido desactivada. Contacta al administrador.',
            ]);
        }

        // Convertir a array si es string
        $roles = is_array($rolesExpected) ? $rolesExpected : [$rolesExpected];

        // Validar que el usuario tiene al menos uno de los roles esperados
        if (!$user->hasAnyRole($roles)) {
            throw ValidationException::withMessages([
                'email' => 'Credenciales incorrectas o rol no autorizado.',
            ]);
        }

        return $user;
    }
}
