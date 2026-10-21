<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * @param AuthService $authService
     */
    public function __construct(private AuthService $authService) {}

    /**
     * Muestra el formulario de login.
     *
     * @return \Illuminate\View\View
     */
    public function showLoginForm()
    {
        return view('auth.login');
    }

    /**
     * Procesa el login del usuario (basado en sesiones).
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function login(Request $request)
    {
        // Validar campos del formulario
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        try {
            // Verificar credenciales - Asumimos rol 'web_user' para la web
            $user = $this->authService->verifyCredentials(
                $validated['username'],
                $validated['password'],
                'web_user' // Rol esperado
            );

            // Iniciar sesión del usuario
            Auth::login($user);

            // Regenerar sesión para evitar session fixation
            $request->session()->regenerate();

            // Redirigir al dashboard con mensaje de éxito
            return redirect()->intended('/dashboard')
                ->with('success', 'Sesión iniciada correctamente.');

        } catch (ValidationException $e) {
            // Retornar al formulario con errores
            return back()
                ->withErrors($e->errors())
                ->withInput($request->only('username'));
        }
    }

    /**
     * Procesa el logout del usuario.
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')
            ->with('success', 'Sesión cerrada correctamente.');
    }
}
