<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcessOverrideRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Aquí validas si el usuario tiene permiso para hacer overrides
        // Por ahora retorna true, pero deberías validar permisos
        return true;
    }

    public function rules(): array
    {
        return [
            'sku' => 'required|string|max:50|exists:productos,sku',
            'codigo_estante' => 'required|string|max:50|exists:estantes,codigo_etiqueta',
            'cantidad' => 'required|integer|min:1',
            'detalle_surtido_id' => 'required|integer|exists:detalles_surtido,id',
        ];
    }

    public function messages(): array
    {
        return [
            'sku.required' => 'El SKU del producto es obligatorio.',
            'sku.exists' => 'El SKU proporcionado no existe en el catálogo.',
            'codigo_estante.required' => 'El código del estante es obligatorio.',
            'codigo_estante.exists' => 'El código de estante proporcionado no existe.',
            'cantidad.required' => 'La cantidad es obligatoria.',
            'cantidad.min' => 'La cantidad debe ser mayor a 0.',
            'detalle_surtido_id.required' => 'El ID del detalle de surtido es obligatorio.',
            'detalle_surtido_id.exists' => 'El detalle de surtido proporcionado no existe.',
        ];
    }
}
