<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta solicitud.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Obtiene las reglas de validación que aplican a la solicitud.
     *
     * La estructura esperada es:
     * {
     *   "prioridad_id": 1,
     *   "referencia_destino": "Bodega Principal",
     *   "fecha_requerida": "2026-03-15 18:00",
     *   "detalles": [
     *     {"producto_id": 1, "cantidad_requerida": 100},
     *     {"producto_id": 2, "cantidad_requerida": 50}
     *   ]
     * }
     */
    public function rules(): array
    {
        return [
            'prioridad_id' => 'required|integer|exists:prioridades_orden,id',
            'referencia_destino' => 'nullable|string|max:150',
            'fecha_requerida' => 'nullable|date_format:Y-m-d H:i',
            'detalles' => 'required|array|min:1',
            'detalles.*.producto_id' => 'required|integer|exists:productos,id',
            'detalles.*.cantidad_requerida' => 'required|numeric|min:0.01',
            'detalles.*.estante_sugerido_id' => 'nullable|integer|exists:estantes,id',
        ];
    }

    /**
     * Mensajes de validación personalizados.
     */
    public function messages(): array
    {
        return [
            'prioridad_id.required' => 'La prioridad es obligatoria.',
            'prioridad_id.exists' => 'La prioridad seleccionada no existe.',
            'fecha_requerida.date_format' => 'El formato de fecha requerida debe ser YYYY-MM-DD HH:MM.',
            'detalles.required' => 'Debe proporcionar al menos un detalle (producto).',
            'detalles.min' => 'Debe proporcionar al menos un detalle (producto).',
            'detalles.*.producto_id.required' => 'El ID del producto es obligatorio en cada detalle.',
            'detalles.*.producto_id.exists' => 'El producto seleccionado no existe.',
            'detalles.*.cantidad_requerida.required' => 'La cantidad requerida es obligatoria en cada detalle.',
            'detalles.*.cantidad_requerida.numeric' => 'La cantidad debe ser un número.',
            'detalles.*.cantidad_requerida.min' => 'La cantidad debe ser mayor a 0.',
            'detalles.*.estante_sugerido_id.exists' => 'El estante sugerido no existe.',
        ];
    }
}
