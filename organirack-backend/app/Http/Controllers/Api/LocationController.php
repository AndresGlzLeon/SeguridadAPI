<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    /**
     * Inyecta el LocationService en el constructor.
     */
    public function __construct(private LocationService $locationService) {}

    /**
     * Obtiene la jerarquía completa de ubicaciones.
     * GET /api/ubicaciones/arbol
     *
     * @return JsonResponse
     */
    public function getTree(): JsonResponse
    {
        try {
            $tree = $this->locationService->getLocationTree();

            return response()->json([
                'message' => 'Jerarquía de ubicaciones obtenida correctamente',
                'data' => $tree,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener la jerarquía de ubicaciones',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene el inventario de un estante específico.
     * GET /api/ubicaciones/estantes/{id}/inventario
     *
     * @param int $estanteId
     * @return JsonResponse
     */
    public function getInventoryByEstante(int $estanteId): JsonResponse
    {
        try {
            $inventory = $this->locationService->getInventoryByEstante($estanteId);

            return response()->json([
                'message' => 'Inventario del estante obtenido correctamente',
                'data' => $inventory,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener el inventario del estante',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene la estructura completa de ubicaciones CON inventario incluido.
     * Una sola petición optimizada con eager loading.
     * GET /api/inventario/completo
     *
     * @return JsonResponse
     */
    public function getCompleteInventory(): JsonResponse
    {
        try {
            $inventory = $this->locationService->getCompleteInventoryWithLocations();

            return response()->json([
                'message' => 'Inventario completo obtenido correctamente',
                'data' => $inventory,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener el inventario completo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ==========================================
    // ENDPOINTS CRUD ESTRUCTURAL
    // ==========================================

    // --- Edificio ---
    // (Métodos de edificio eliminados)

    // --- Almacen ---
    public function storeAlmacen(Request $request): JsonResponse {
        $data = $request->validate([
            'nombre' => 'required|string|max:100',
            'siglas' => 'nullable|string|max:10'
        ]);
        return response()->json($this->locationService->createAlmacen($data), 201);
    }
    public function updateAlmacen(Request $request, int $id): JsonResponse {
        $data = $request->validate([
            'nombre' => 'sometimes|required|string|max:100',
            'siglas' => 'nullable|string|max:10'
        ]);
        return response()->json($this->locationService->updateAlmacen($id, $data));
    }
    public function destroyAlmacen(int $id): JsonResponse {
        try {
            $this->locationService->deleteAlmacen($id);
            return response()->json(['message' => 'Almacén eliminado correctamente']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    // --- Pasillo ---
    public function storePasillo(Request $request): JsonResponse {
        $data = $request->validate([
            'almacen_id' => 'required|exists:almacenes,id',
            'nombre' => 'required|string|max:50'
        ]);
        return response()->json($this->locationService->createPasillo($data), 201);
    }
    public function updatePasillo(Request $request, int $id): JsonResponse {
        $data = $request->validate([
            'almacen_id' => 'sometimes|required|exists:almacenes,id',
            'nombre' => 'sometimes|required|string|max:50'
        ]);
        return response()->json($this->locationService->updatePasillo($id, $data));
    }
    public function destroyPasillo(int $id): JsonResponse {
        try {
            $this->locationService->deletePasillo($id);
            return response()->json(['message' => 'Pasillo eliminado correctamente']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    // --- Rack ---
    public function storeRack(Request $request): JsonResponse {
        $data = $request->validate([
            'pasillo_id' => 'required|exists:pasillos,id',
            'nombre_rack' => 'required|string|max:50'
        ]);
        return response()->json($this->locationService->createRack($data), 201);
    }
    public function updateRack(Request $request, int $id): JsonResponse {
        $data = $request->validate([
            'pasillo_id' => 'sometimes|required|exists:pasillos,id',
            'nombre_rack' => 'sometimes|required|string|max:50'
        ]);
        return response()->json($this->locationService->updateRack($id, $data));
    }
    public function destroyRack(int $id): JsonResponse {
        try {
            $this->locationService->deleteRack($id);
            return response()->json(['message' => 'Rack eliminado correctamente']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    // --- Estante ---
    public function storeEstante(Request $request): JsonResponse {
        $data = $request->validate([
            'rack_id' => 'required|exists:racks,id',
            'nivel' => 'required|string|max:50',
            'codigo_etiqueta' => 'required|string|max:50|unique:estantes,codigo_etiqueta',
            'tipo_zona' => 'nullable|string|max:50',
            'esta_lleno' => 'boolean'
        ]);
        return response()->json($this->locationService->createEstante($data), 201);
    }
    public function updateEstante(Request $request, int $id): JsonResponse {
        $data = $request->validate([
            'rack_id' => 'sometimes|required|exists:racks,id',
            'nivel' => 'sometimes|required|string|max:50',
            'codigo_etiqueta' => 'sometimes|required|string|max:50|unique:estantes,codigo_etiqueta,' . $id,
            'tipo_zona' => 'nullable|string|max:50',
            'esta_lleno' => 'boolean'
        ]);
        return response()->json($this->locationService->updateEstante($id, $data));
    }
    public function destroyEstante(int $id): JsonResponse {
        try {
            $this->locationService->deleteEstante($id);
            return response()->json(['message' => 'Estante eliminado correctamente']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}