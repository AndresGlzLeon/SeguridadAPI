<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            'sku' => 'required|string|max:50|unique:productos,sku',
            'nombre' => 'required|string|max:150',
            'categoria_id' => 'required|integer|exists:categorias,id',
            'unidad_medida_id' => 'required|integer|exists:unidades_medida,id',
            'marca_id' => 'required|integer|exists:marcas,id',
            'stock_min' => 'required|integer|min:0',
            'stock_max' => 'required|integer|min:0',
            'estado' => 'required|boolean',
        ];
    }

    /**
     * Valida reglas de negocio adicionales.
     */
    protected function passedValidation(): void
    {
        // Validar que stock_max >= stock_min
        if ($this->input('stock_max') < $this->input('stock_min')) {
            $this->failedValidation(
                \Illuminate\Validation\ValidationException::withMessages([
                    'stock_max' => 'El stock máximo debe ser mayor o igual al stock mínimo.',
                ])
            );
        }
    }

    /**
     * Mensajes de validación personalizados.
     */
    public function messages(): array
    {
        return [
            'sku.required' => 'El SKU es obligatorio.',
            'sku.unique' => 'El SKU ya existe en el sistema.',
            'nombre.required' => 'El nombre del producto es obligatorio.',
            'categoria_id.required' => 'Debe seleccionar una categoría.',
            'categoria_id.exists' => 'La categoría seleccionada no existe.',
            'unidad_medida_id.required' => 'Debe seleccionar una unidad de medida.',
            'unidad_medida_id.exists' => 'La unidad de medida seleccionada no existe.',
            'marca_id.required' => 'Debe seleccionar una marca.',
            'marca_id.exists' => 'La marca seleccionada no existe.',
            'stock_min.required' => 'El stock mínimo es obligatorio.',
            'stock_max.required' => 'El stock máximo es obligatorio.',
            'estado.required' => 'El estado es obligatorio.',
        ];
    }

    /**
     * Obtiene los datos validados de la solicitud.
     */
    public function validated($key = null, $default = null)
    {
        $data = parent::validated($key, $default);
        if (is_array($data)) {
            $data['estado'] = filter_var($this->input('estado'), FILTER_VALIDATE_BOOLEAN);
        }
        return $data;
    }
}
