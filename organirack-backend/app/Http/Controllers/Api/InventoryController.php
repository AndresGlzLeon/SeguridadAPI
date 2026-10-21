<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(private InventoryService $inventoryService) {}

    /**
     * POST /api/inventory/manual-adjust
     * Ajuste manual de inventario absoluto desde la UI del almacén digital
     */
    public function addManualStock(Request $request): JsonResponse
    {
        $data = $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'estante_id' => 'required|exists:estantes,id',
            'estado_id' => 'required|exists:estados_inventario,id',
            'cantidad' => 'required|numeric|min:0'
        ]);

        try {
            $result = $this->inventoryService->setManualStock(
                $data['producto_id'],
                $data['estante_id'],
                $data['estado_id'],
                (float) $data['cantidad'],
                $request->user()->id
            );

            return response()->json($result, 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al ajustar el inventario',
                'error' => $e->getMessage()
            ], 400);
        }
    }
}
