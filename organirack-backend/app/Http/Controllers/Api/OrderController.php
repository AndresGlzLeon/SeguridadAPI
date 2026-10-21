<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Services\OrderService;
use App\Models\OrdenSurtido;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class OrderController extends Controller
{
    /**
     * Inyecta el OrderService en el constructor.
     */
    public function __construct(private OrderService $orderService) {}

    /**
     * Obtiene la lista de órdenes de surtido con paginación y filtros.
     * GET /api/orders
     *
     * Query Parameters:
     * - estado_id: Filtrar por estado
     * - prioridad_id: Filtrar por prioridad
     * - search: Buscar por folio o referencia
     * - per_page: Cantidad de registros por página (default: 15)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'estado_id' => $request->query('estado_id'),
                'prioridad_id' => $request->query('prioridad_id'),
                'search' => $request->query('search', ''),
                'per_page' => $request->query('per_page', 15),
            ];

            $ordenes = $this->orderService->getAllOrders($filters);

            return response()->json([
                'message' => 'Órdenes de surtido obtenidas correctamente',
                'data' => $ordenes->items(),
                'pagination' => [
                    'current_page' => $ordenes->currentPage(),
                    'per_page' => $ordenes->perPage(),
                    'total' => $ordenes->total(),
                    'last_page' => $ordenes->lastPage(),
                    'from' => $ordenes->firstItem(),
                    'to' => $ordenes->lastItem(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener órdenes de surtido',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crea una nueva orden de surtido con sus detalles.
     * POST /api/orders
     *
     * Body (JSON):
     * {
     *   "prioridad_id": 1,
     *   "referencia_destino": "Bodega Principal",
     *   "fecha_requerida": "2026-03-15 18:00",
     *   "detalles": [
     *     {"producto_id": 1, "cantidad_requerida": 100, "estante_sugerido_id": 5},
     *     {"producto_id": 2, "cantidad_requerida": 50}
     *   ]
     * }
     *
     * @param StoreOrderRequest $request
     * @return JsonResponse
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        try {
            \Log::info('📦 Datos validados para crear orden:', $request->validated());

            $orden = $this->orderService->createOrder($request->validated());

            return response()->json([
                'message' => 'Orden de surtido creada correctamente',
                'data' => $orden,
            ], 201);

        } catch (\Exception $e) {
            \Log::error('❌ Error al crear orden de surtido:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Error al crear la orden de surtido',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene una orden de surtido específica con todos sus detalles.
     * GET /api/orders/{order}
     *
     * @param int $order ID de la orden
     * @return JsonResponse
     */
    public function show(int $order): JsonResponse
    {
        try {
            $orden = $this->orderService->getOrderById($order);

            if (!$orden) {
                return response()->json([
                    'message' => 'Orden de surtido no encontrada',
                ], 404);
            }

            return response()->json([
                'message' => 'Orden de surtido obtenida correctamente',
                'data' => $orden,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener la orden de surtido',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Asigna un almacenista a una orden de surtido.
     * PUT /api/orders/{id}/assign
     *
     * Body (JSON):
     * {
     *   "almacenista_id": 5
     * }
     *
     * @param int $id ID de la orden
     * @param Request $request
     * @return JsonResponse
     */
    public function assign(int $id, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'almacenista_id' => 'required|integer|exists:users,id',
            ], [
                'almacenista_id.required' => 'El ID del almacenista es requerido.',
                'almacenista_id.exists' => 'El almacenista seleccionado no existe.',
            ]);

            \Log::info('👤 Asignando almacenista a orden:', [
                'orden_id' => $id,
                'almacenista_id' => $validated['almacenista_id'],
            ]);

            $orden = $this->orderService->assignAlmacenista($id, $validated['almacenista_id']);

            return response()->json([
                'message' => 'Almacenista asignado correctamente',
                'data' => $orden,
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Datos de validación inválidos',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Orden de surtido no encontrada',
            ], 404);

        } catch (\Exception $e) {
            \Log::error('❌ Error al asignar almacenista:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Error al asignar almacenista a la orden',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Genera un PDF con el Vale de Salida / Remisión de Surtido
     * GET /api/orders/{id}/pdf
     *
     * Cargas EAGER LOADING para evitar problema N+1:
     * - capturista (usuario que creó la orden)
     * - almacenista (usuario asignado al surtido)
     * - estado (estado actual)
     * - prioridad (prioridad de la orden)
     * - detalles (relación con DetalleSurtido):
     *   - producto (SKU, nombre, descripción)
     *   - estanteReal (ubicación real donde se tomó el producto)
     *
     * @param int $id ID de la orden
     * @return \Illuminate\Http\Response PDF file download
     */
    public function generatePdf(int $id): \Illuminate\Http\Response
    {
        try {
            \Log::info('📄 Generando PDF para orden:', ['orden_id' => $id]);

            // EAGER LOADING: Cargar todas las relaciones necesarias de una sola vez
            // Evita el problema N+1 de múltiples queries
            $orden = OrdenSurtido::with([
                'capturista',           // Usuario que capturó la orden
                'almacenista',          // Usuario que surte
                'estado',               // Estado de la orden
                'prioridad',            // Prioridad de la orden
                'detalles' => function ($query) {
                    $query->with([
                        'producto',         // Datos del producto (SKU, nombre)
                        'estanteReal',      // Ubicación real donde se tomó el producto
                    ]);
                },
            ])->find($id);

            if (!$orden) {
                \Log::warning('⚠️ Orden no encontrada para PDF:', ['orden_id' => $id]);
                return response()->json([
                    'message' => 'Orden de surtido no encontrada',
                ], 404);
            }

            \Log::info('✅ Orden cargada con todas las relaciones:', [
                'orden_id' => $orden->id,
                'folio' => $orden->folio,
                'detalles' => count($orden->detalles),
            ]);

            // Generar PDF usando la vista Blade
            $pdf = Pdf::loadView('pdf.remision-surtido', [
                'orden' => $orden,
            ]);

            // Configurar opciones del PDF
            $pdf->setPaper('letter', 'portrait');
            $pdf->setOption('isHtml5ParserEnabled', true);
            $pdf->setOption('isRemoteEnabled', false);

            $fileName = "Remision_{$orden->folio}_" . now()->format('Y-m-d_His') . ".pdf";

            \Log::info('📥 PDF generado exitosamente:', [
                'orden_id' => $id,
                'folio' => $orden->folio,
                'file_name' => $fileName,
            ]);

            // Retornar PDF como descarga
            return $pdf->download($fileName);

        } catch (\Exception $e) {
            \Log::error('❌ Error al generar PDF:', [
                'orden_id' => $id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Error al generar el PDF',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
