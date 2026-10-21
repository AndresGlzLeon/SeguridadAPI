<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProcessOverrideRequest;
use App\Services\InventoryService;
use Exception;
use Illuminate\Http\JsonResponse;

class PickingController extends Controller
{
    public function __construct(
        private InventoryService $inventoryService
    ) {
    }

    /**
     * Procesa un override de ubicación para picking.
     *
     * Recibe los datos del frontend móvil, los valida, y delega
     * la lógica de negocio al InventoryService.
     *
     * @param ProcessOverrideRequest $request Datos del override validados
     *
     * @return JsonResponse Respuesta JSON con status 200 o 400
     */
    public function overrideLocation(ProcessOverrideRequest $request): JsonResponse
    {
        try {
            // Los datos vienen validados por ProcessOverrideRequest
            $sku = $request->input('sku');
            $codigoEstante = $request->input('codigo_estante');
            $cantidad = $request->input('cantidad');
            $detalleSurtidoId = $request->input('detalle_surtido_id');
            $usuarioId = $request->user()?->id ?? 1; // Usa el usuario autenticado

            // Delegar al servicio
            $resultado = $this->inventoryService->processOverride(
                $sku,
                $codigoEstante,
                $cantidad,
                $usuarioId,
                $detalleSurtidoId
            );

            return response()->json(
                data: $resultado,
                status: 200
            );
        } catch (Exception $e) {
            return response()->json(
                data: [
                    'success' => false,
                    'error' => $e->getMessage(),
                ],
                status: 400
            );
        }
    }
}
