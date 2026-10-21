# 💻 IMPLEMENTACIÓN PRÁCTICA: Código Listo para Deploy

**Documento:** Snippets de código implementable  
**Fecha:** 29 de Marzo, 2026  
**Estado:** 📝 Listo para copiar/pegar (con ajustes)  

---

## 📋 ÍNDICE

1. [Backend - PHP/Laravel](#backend--phplaravella)
2. [Mobile - TypeScript/React Native](#mobile--typescriptreact-native)
3. [Tests](#tests)
4. [Migrations](#migrations)
5. [SQL Queries](#sql-queries)

---

# Backend - PHP/Laravel

## 🎯 PickingService.php (Mejorado)

**Ubicación:** `organirack-backend/app/Services/PickingService.php`

```php
<?php

namespace App\Services;

use App\Models\OrdenSurtido;
use App\Models\DetalleSurtido;
use App\Models\Inventario;
use App\Models\Estante;
use App\Models\EstadoInventario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class PickingService
{
    /**
     * Calcula la MEJOR ubicación sugerida basada en:
     * 1. Disponibilidad de stock (cantidad >= requerida)
     * 2. Estado del inventario (Disponible > otros)
     * 3. Stock más alto (para no fragmentar)
     * 4. Pasillo preferido (si existe)
     *
     * @param int $productoId ID del producto
     * @param float $cantidadRequerida Cantidad necesaria
     * @param ?int $pasilloPreferido ID del pasillo preferido (opcional)
     * @return Estante|null
     */
    public function calculateSuggestedLocation(
        int $productoId,
        float $cantidadRequerida,
        ?int $pasilloPreferido = null
    ): ?Estante {
        try {
            Log::info('📍 Calculando ubicación sugerida', [
                'producto_id' => $productoId,
                'cantidad_requerida' => $cantidadRequerida,
                'pasillo_preferido' => $pasilloPreferido,
            ]);

            // Query: Buscar inventarios con stock suficiente
            $query = Inventario::with([
                'estante.rack.pasillo.almacen.edificio',
                'estado'
            ])
            ->where('producto_id', $productoId)
            ->where('cantidad', '>=', $cantidadRequerida);

            // Filtrar por estado "Disponible"
            $query->whereHas('estado', function ($q) {
                $q->where('nombre', 'Disponible');
            });

            // PRIORIDAD 1: Pasillo preferido
            if ($pasilloPreferido) {
                $query->leftJoin('racks as r', 'estantes.rack_id', '=', 'r.id')
                    ->select('inventarios.*')
                    ->orderByRaw('CASE WHEN r.pasillo_id = ? THEN 0 ELSE 1 END', [$pasilloPreferido]);
            }

            // PRIORIDAD 2: Más stock disponible (evitar fragmentación)
            $query->orderBy('cantidad', 'desc');

            // PRIORIDAD 3: Estante más bajo (proximidad)
            $query->orderBy('estantes.id', 'asc');

            $ubicacion = $query->first();

            if ($ubicacion) {
                Log::info('✅ Ubicación sugerida encontrada', [
                    'estante_id' => $ubicacion->estante_id,
                    'codigo_etiqueta' => $ubicacion->estante?->codigo_etiqueta,
                    'cantidad_disponible' => $ubicacion->cantidad,
                    'estado' => $ubicacion->estado?->nombre,
                ]);

                return $ubicacion->estante;
            }

            Log::warning('⚠️ No se encontró ubicación sugerida', [
                'producto_id' => $productoId,
                'cantidad_requerida' => $cantidadRequerida,
            ]);

            return null;

        } catch (Exception $e) {
            Log::error('❌ Error calculando ubicación sugerida', [
                'producto_id' => $productoId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Obtiene la lista de recolección sugerida para una orden
     * 
     * @param int $ordenId ID de la orden
     * @return OrdenSurtido
     * @throws Exception Si la orden no existe
     */
    public function getSuggestedPickingList(int $ordenId): OrdenSurtido
    {
        $orden = OrdenSurtido::with([
            'estado',
            'prioridad',
            'capturista',
            'almacenista',
            'detalles.producto',
        ])->findOrFail($ordenId);

        Log::info('📦 Generando lista de picking sugerida', [
            'orden_id' => $ordenId,
            'folio' => $orden->folio,
            'detalles_count' => $orden->detalles->count(),
        ]);

        // Mapear detalles con ubicaciones sugeridas
        $orden->detalles->each(function (DetalleSurtido $detalle) {
            // Encontrar TODOS los estantes disponibles para este producto
            $ubicacionesSugeridas = Inventario::where('producto_id', $detalle->producto_id)
                ->where('cantidad', '>', 0)
                ->whereHas('estado', fn($q) => $q->where('nombre', 'Disponible'))
                ->with(['estante.rack.pasillo', 'estado'])
                ->orderBy('cantidad', 'desc')
                ->get()
                ->map(function (Inventario $inv) {
                    return [
                        'estante_id' => $inv->estante_id,
                        'estante_codigo' => $inv->estante?->codigo_etiqueta,
                        'pasillo_nombre' => $inv->estante?->rack?->pasillo?->nombre,
                        'cantidad_disponible' => (float)$inv->cantidad,
                        'estado' => $inv->estado?->nombre,
                    ];
                })
                ->values();

            $detalle->ubicaciones_sugeridas = $ubicacionesSugeridas;

            Log::debug('📍 Ubicaciones disponibles', [
                'producto_id' => $detalle->producto_id,
                'ubicaciones_count' => $ubicacionesSugeridas->count(),
            ]);
        });

        Log::info('✅ Lista de picking sugerida completada', [
            'orden_id' => $ordenId,
            'total_detalles' => $orden->detalles->count(),
        ]);

        return $orden;
    }

    /**
     * Confirma un pick (recolección) de un producto desde una ubicación
     * 
     * VALIDACIONES:
     * 1. Verifica que el estante escaneado tenga el producto
     * 2. Valida stock suficiente
     * 3. Descuenta del inventario REAL (no sugerido)
     * 4. Marca si fue override
     *
     * @param int $ordenId ID de la orden
     * @param array $pickData ['producto_id', 'estante_id_escaneado', 'cantidad_tomada']
     * @return array Confirmación con detalles
     * @throws Exception Si hay validación o inventario insuficiente
     */
    public function confirmPick(int $ordenId, array $pickData): array
    {
        $productoId = $pickData['producto_id'] ?? null;
        $estanteIdEscaneado = $pickData['estante_id_escaneado'] ?? null;
        $cantidadTomada = $pickData['cantidad_tomada'] ?? 0;

        // Validación básica
        if (!$productoId || !$estanteIdEscaneado || $cantidadTomada <= 0) {
            throw new Exception('Parámetros inválidos: producto_id, estante_id_escaneado y cantidad_tomada son requeridos.', 400);
        }

        Log::info('🔍 Iniciando confirmación de pick', [
            'orden_id' => $ordenId,
            'producto_id' => $productoId,
            'estante_id_escaneado' => $estanteIdEscaneado,
            'cantidad_tomada' => $cantidadTomada,
        ]);

        // VALIDACIÓN 1: Verificar que el inventario existe en ubicación escaneada
        $inventarioEscaneado = Inventario::where('producto_id', $productoId)
            ->where('estante_id', $estanteIdEscaneado)
            ->lockForUpdate()  // 🔐 Pessimistic lock para prevenir race conditions
            ->first();

        if (!$inventarioEscaneado) {
            Log::warning('❌ Producto no encontrado en ubicación escaneada', [
                'producto_id' => $productoId,
                'estante_id' => $estanteIdEscaneado,
            ]);
            throw new Exception('Producto no encontrado en la ubicación escaneada.', 400);
        }

        // VALIDACIÓN 2: Verificar stock suficiente
        if ($inventarioEscaneado->cantidad < $cantidadTomada) {
            Log::warning('❌ Stock insuficiente', [
                'producto_id' => $productoId,
                'estante_id' => $estanteIdEscaneado,
                'requerido' => $cantidadTomada,
                'disponible' => $inventarioEscaneado->cantidad,
            ]);
            throw new Exception(
                "Stock insuficiente en la ubicación escaneada. "
                . "Requerido: {$cantidadTomada}, Disponible: {$inventarioEscaneado->cantidad}",
                400
            );
        }

        // VALIDACIÓN 3: Verificar estado del inventario
        if ($inventarioEscaneado->estado?->nombre !== 'Disponible') {
            Log::warning('❌ Inventario no disponible', [
                'estado' => $inventarioEscaneado->estado?->nombre,
            ]);
            throw new Exception(
                "Inventario no disponible. Estado: {$inventarioEscaneado->estado?->nombre}",
                400
            );
        }

        // TRANSACCIÓN: Todo o nada
        return DB::transaction(function () use (
            $ordenId,
            $productoId,
            $estanteIdEscaneado,
            $cantidadTomada,
            $inventarioEscaneado
        ) {
            // PASO 1: Descuenta inventario
            $cantidadAnterior = $inventarioEscaneado->cantidad;
            $cantidadNueva = $cantidadAnterior - $cantidadTomada;

            $inventarioEscaneado->update([
                'cantidad' => $cantidadNueva,
            ]);

            Log::info('📉 Inventario descontado', [
                'producto_id' => $productoId,
                'estante_id' => $estanteIdEscaneado,
                'anterior' => $cantidadAnterior,
                'nuevo' => $cantidadNueva,
            ]);

            // PASO 2: Buscar y actualizar detalle de orden
            $detalle = DetalleSurtido::where('orden_surtido_id', $ordenId)
                ->where('producto_id', $productoId)
                ->first();

            if ($detalle) {
                $cantidadSurtidaAnterior = $detalle->cantidad_surtida ?? 0;
                $cantidadSurtidaNueva = $cantidadSurtidaAnterior + $cantidadTomada;

                // Determinar si fue override
                $fueModificado = $estanteIdEscaneado != ($detalle->estante_sugerido_id ?? null);

                $detalle->update([
                    'cantidad_surtida' => $cantidadSurtidaNueva,
                    'estante_real_id' => $estanteIdEscaneado,
                    'fue_modificado' => $fueModificado,
                ]);

                Log::info('✅ Detalle actualizado', [
                    'detalle_id' => $detalle->id,
                    'surtida_anterior' => $cantidadSurtidaAnterior,
                    'surtida_nueva' => $cantidadSurtidaNueva,
                    'fue_modificado' => $fueModificado,
                ]);

                // PASO 3: Verificar si orden está completa
                $orden = $detalle->ordenSurtido;
                $totalRequerido = $orden->detalles->sum('cantidad_requerida');
                $totalSurtido = $orden->detalles->sum('cantidad_surtida');

                if ($totalSurtido >= $totalRequerido) {
                    // Cambiar estado a Completada
                    $estadoCompletada = \App\Models\EstadoOrden::where('nombre', 'Completada')->first();
                    if ($estadoCompletada) {
                        $orden->update(['estado_id' => $estadoCompletada->id]);
                        Log::info('✅ Orden completada', ['orden_id' => $ordenId]);
                    }
                }
            }

            return [
                'success' => true,
                'message' => 'Pick confirmado exitosamente',
                'data' => [
                    'orden_id' => $ordenId,
                    'producto_id' => $productoId,
                    'estante_id_escaneado' => $estanteIdEscaneado,
                    'cantidad_tomada' => $cantidadTomada,
                    'inventario_anterior' => $cantidadAnterior,
                    'inventario_nuevo' => $cantidadNueva,
                    'fue_override' => $detalle->fue_modificado ?? false,
                ],
            ];
        });
    }
}
```

---

## 🎯 OrderService.php (Modificado con Ubicación Inteligente)

**Ubicación:** `organirack-backend/app/Services/OrderService.php` (Modificar método `createOrder()`)

```php
/**
 * Crea una nueva orden de surtido con ubicaciones sugeridas INTELIGENTES
 * CRÍTICO: Envuelto en DB::transaction() para mantener integridad ACID
 *
 * @param array $data Datos validados de CreateOrderRequest
 * @return OrdenSurtido La orden creada con todas sus relaciones
 * @throws Exception si ocurre un error durante la creación
 */
public function createOrder(array $data): OrdenSurtido
{
    return DB::transaction(function () use ($data) {
        // Obtener el estado por defecto: "Pendiente"
        $estadoPendiente = EstadoOrden::where('nombre', 'Pendiente')->first();
        if (!$estadoPendiente) {
            throw new \Exception('No se encontró el estado "Pendiente" en la base de datos.');
        }

        // Generar folio único
        $folio = $this->generateFolio();

        // 1. Crear la OrdenSurtido
        $orden = OrdenSurtido::create([
            'folio' => $folio,
            'capturista_id' => Auth::id() ?? 1,
            'almacenista_id' => null,
            'referencia_destino' => $data['referencia_destino'] ?? null,
            'estado_id' => $estadoPendiente->id,
            'prioridad_id' => $data['prioridad_id'],
            'fecha_requerida' => $data['fecha_requerida'] ?? null,
        ]);

        // 2. Inyectar PickingService para calcular ubicaciones inteligentes
        $pickingService = app(PickingService::class);

        // 3. Crear los detalles de la orden
        foreach ($data['detalles'] as $detalle) {
            // 🧠 CALCULAR UBICACIÓN SUGERIDA INTELIGENTEMENTE
            $ubicacionSugerida = $pickingService->calculateSuggestedLocation(
                $detalle['producto_id'],
                $detalle['cantidad_requerida']
            );

            // Si no hay ubicación disponible, usar fallback (primera)
            if (!$ubicacionSugerida) {
                $ubicacionSugerida = Estante::firstOrFail();
                Log::warning('⚠️ Usando ubicación por defecto (sin stock disponible)', [
                    'producto_id' => $detalle['producto_id'],
                    'estante_id' => $ubicacionSugerida->id,
                ]);
            }

            DetalleSurtido::create([
                'orden_surtido_id' => $orden->id,
                'producto_id' => $detalle['producto_id'],
                'cantidad_requerida' => $detalle['cantidad_requerida'],
                'cantidad_surtida' => 0,
                'estante_sugerido_id' => $ubicacionSugerida->id,  // 🔑 INTELIGENTE
                'estante_real_id' => null,
                'fue_modificado' => false,
            ]);

            Log::info('✅ Detalle creado con ubicación sugerida', [
                'orden_id' => $orden->id,
                'producto_id' => $detalle['producto_id'],
                'estante_sugerido_id' => $ubicacionSugerida->id,
                'codigo_etiqueta' => $ubicacionSugerida->codigo_etiqueta,
            ]);
        }

        // 4. Retornar la orden con todas las relaciones cargadas
        return $this->getOrderById($orden->id);
    });
}
```

---

## 🎯 PickingController.php (Nuevos Endpoints)

**Ubicación:** `organirack-backend/app/Http/Controllers/Api/PickingController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PickingService;
use App\Models\Inventario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PickingController extends Controller
{
    public function __construct(private PickingService $pickingService) {}

    /**
     * POST /api/picking/validate-location
     * Valida en tiempo real si una ubicación tiene el producto con stock suficiente
     */
    public function validateLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'producto_id' => 'required|integer|exists:productos,id',
            'estante_id' => 'required|integer|exists:estantes,id',
            'cantidad_requerida' => 'required|numeric|min:0.01',
        ], [
            'producto_id.required' => 'ID del producto es requerido',
            'producto_id.exists' => 'Producto no encontrado',
            'estante_id.required' => 'ID del estante es requerido',
            'estante_id.exists' => 'Estante no encontrado',
            'cantidad_requerida.required' => 'Cantidad requerida es requerida',
        ]);

        try {
            Log::info('🔍 Validando ubicación', [
                'producto_id' => $validated['producto_id'],
                'estante_id' => $validated['estante_id'],
                'cantidad_requerida' => $validated['cantidad_requerida'],
            ]);

            // Buscar inventario en ubicación especificada
            $inventario = Inventario::where('producto_id', $validated['producto_id'])
                ->where('estante_id', $validated['estante_id'])
                ->with(['estado', 'estante'])
                ->first();

            // Caso 1: Inventario no existe
            if (!$inventario) {
                Log::warning('⚠️ Inventario no encontrado', [
                    'producto_id' => $validated['producto_id'],
                    'estante_id' => $validated['estante_id'],
                ]);

                return response()->json([
                    'valid' => false,
                    'error' => 'Producto no encontrado en esta ubicación',
                    'cantidad_disponible' => 0,
                ], 400);
            }

            // Caso 2: Stock insuficiente
            if ($inventario->cantidad < $validated['cantidad_requerida']) {
                Log::warning('⚠️ Stock insuficiente', [
                    'producto_id' => $validated['producto_id'],
                    'estante_id' => $validated['estante_id'],
                    'requerido' => $validated['cantidad_requerida'],
                    'disponible' => $inventario->cantidad,
                ]);

                return response()->json([
                    'valid' => false,
                    'error' => "Stock insuficiente. Necesita {$validated['cantidad_requerida']}, disponible {$inventario->cantidad}",
                    'cantidad_disponible' => $inventario->cantidad,
                ], 400);
            }

            // Caso 3: Estado no disponible
            if ($inventario->estado?->nombre !== 'Disponible') {
                Log::warning('⚠️ Inventario no disponible', [
                    'estado' => $inventario->estado?->nombre,
                ]);

                return response()->json([
                    'valid' => false,
                    'error' => "Inventario no disponible. Estado: {$inventario->estado?->nombre}",
                    'cantidad_disponible' => $inventario->cantidad,
                ], 400);
            }

            // ✅ VÁLIDO
            Log::info('✅ Ubicación validada correctamente', [
                'producto_id' => $validated['producto_id'],
                'estante_id' => $validated['estante_id'],
                'cantidad_disponible' => $inventario->cantidad,
            ]);

            return response()->json([
                'valid' => true,
                'puede_proceder' => true,
                'producto_id' => $validated['producto_id'],
                'estante_id' => $validated['estante_id'],
                'cantidad_disponible' => $inventario->cantidad,
                'estado' => $inventario->estado?->nombre,
            ], 200);

        } catch (\Exception $e) {
            Log::error('❌ Error validando ubicación', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'valid' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/picking/confirm-override
     * Confirma un pick con override (ubicación diferente a la sugerida)
     */
    public function confirmOverride(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'detalle_id' => 'required|integer|exists:detalles_surtido,id',
            'estante_id_real' => 'required|integer|exists:estantes,id',
            'cantidad_a_surtir' => 'required|numeric|min:0.01',
        ], [
            'detalle_id.required' => 'ID del detalle es requerido',
            'estante_id_real.required' => 'Estante real es requerido',
            'cantidad_a_surtir.required' => 'Cantidad a surtir es requerida',
        ]);

        try {
            Log::info('🔄 Confirmando override de ubicación', [
                'detalle_id' => $validated['detalle_id'],
                'estante_id_real' => $validated['estante_id_real'],
                'cantidad_a_surtir' => $validated['cantidad_a_surtir'],
            ]);

            // Obtener detalle de la orden
            $detalle = \App\Models\DetalleSurtido::with([
                'producto',
                'ordenSurtido',
                'estanteSugerido',
            ])->findOrFail($validated['detalle_id']);

            // Confirmar pick con la ubicación REAL (override)
            $resultado = $this->pickingService->confirmPick(
                $detalle->orden_surtido_id,
                [
                    'producto_id' => $detalle->producto_id,
                    'estante_id_escaneado' => $validated['estante_id_real'],
                    'cantidad_tomada' => $validated['cantidad_a_surtir'],
                ]
            );

            Log::info('✅ Override confirmado exitosamente', [
                'detalle_id' => $validated['detalle_id'],
                'estante_sugerido' => $detalle->estanteSugerido?->codigo_etiqueta,
                'estante_real' => Estante::find($validated['estante_id_real'])?->codigo_etiqueta,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Override confirmado exitosamente',
                'data' => $detalle->fresh()->load([
                    'producto',
                    'estanteSugerido',
                    'estanteReal',
                    'ordenSurtido.estado',
                ]),
            ], 200);

        } catch (\Exception $e) {
            Log::error('❌ Error confirmando override', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }
}
```

---

# Mobile - TypeScript/React Native

## 📱 pickingService.ts (Nuevo)

**Ubicación:** `OrganiRack-Movil/API/pickingService.ts`

```typescript
import { apiClient } from './client';
import type { AxiosResponse } from 'axios';

export interface ValidateLocationRequest {
  producto_id: number;
  estante_id: number;
  cantidad_requerida: number;
}

export interface ValidateLocationResponse {
  valid: boolean;
  puede_proceder?: boolean;
  producto_id?: number;
  estante_id?: number;
  cantidad_disponible?: number;
  estado?: string;
  error?: string;
}

export interface ConfirmPickRequest {
  orden_id: number;
  producto_id: number;
  estante_id_escaneado: number;
  cantidad_tomada: number;
}

export interface ConfirmPickResponse {
  success: boolean;
  message: string;
  data?: {
    orden_id: number;
    producto_id: number;
    estante_id_escaneado: number;
    cantidad_tomada: number;
    inventario_anterior: number;
    inventario_nuevo: number;
    fue_override: boolean;
  };
}

export interface ConfirmOverrideRequest {
  detalle_id: number;
  estante_id_real: number;
  cantidad_a_surtir: number;
}

export const pickingService = {
  /**
   * Obtiene lista de sugerencias de picking para una orden
   */
  async getSuggestions(ordenId: number): Promise<AxiosResponse> {
    return await apiClient.get(
      `/mobile/picking/${ordenId}/sugerencias`
    );
  },

  /**
   * Valida disponibilidad de ubicación en TIEMPO REAL
   * ⚡ Latencia esperada: < 15ms
   */
  async validateLocation(
    data: ValidateLocationRequest
  ): Promise<AxiosResponse<ValidateLocationResponse>> {
    return await apiClient.post(
      '/picking/validate-location',
      data
    );
  },

  /**
   * Confirma un pick (recolección) estándar
   * ⚡ Latencia esperada: < 20ms
   */
  async confirmPick(
    data: ConfirmPickRequest
  ): Promise<AxiosResponse<ConfirmPickResponse>> {
    return await apiClient.post(
      `/mobile/picking/${data.orden_id}/confirmar`,
      data
    );
  },

  /**
   * Confirma un override (cambio de ubicación)
   * ⚡ Latencia esperada: < 20ms
   */
  async confirmOverride(
    data: ConfirmOverrideRequest
  ): Promise<AxiosResponse> {
    return await apiClient.post(
      '/picking/confirm-override',
      data
    );
  },

  /**
   * Obtiene órdenes asignadas al almacenista autenticado
   */
  async getOrdenes(): Promise<AxiosResponse> {
    return await apiClient.get('/mobile/picking/orders');
  },
};
```

---

## 📱 scannerScreen.tsx (Mejorado y Funcional)

**Ubicación:** `OrganiRack-Movil/app/screens/scannerScreen.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { pickingService } from '../API/pickingService';

interface Detalle {
  id: number;
  producto_id: number;
  producto: {
    nombre: string;
    sku: string;
  };
  cantidad_requerida: number;
  cantidad_surtida: number;
  estante_sugerido_id: number;
  estanteSugerido: {
    codigo_etiqueta: string;
  };
  ubicaciones_sugeridas: Array<{
    estante_id: number;
    estante_codigo: string;
    cantidad_disponible: number;
  }>;
}

interface Orden {
  id: number;
  folio: string;
  detalles: Detalle[];
}

export default function ScannerScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  // State
  const [orden, setOrden] = useState<Orden | null>(null);
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [detalleActualIndex, setDetalleActualIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const detalleActual = detalles[detalleActualIndex];

  // Cargar sugerencias al montar
  useEffect(() => {
    loadPickingSuggestions();
  }, [orderId]);

  // Pedir permisos de cámara
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const loadPickingSuggestions = async () => {
    try {
      if (!orderId) throw new Error('Orden ID no encontrada');

      const response = await pickingService.getSuggestions(parseInt(orderId));
      const ordenData = response.data.data as Orden;

      setOrden(ordenData);
      setDetalles(ordenData.detalles);
      setLoading(false);

      console.log('✅ Sugerencias cargadas:', ordenData.detalles.length);
    } catch (error) {
      console.error('❌ Error cargando sugerencias:', error);
      Alert.alert('Error', 'No se pudieron cargar las sugerencias de picking');
      setLoading(false);
    }
  };

  const handleBarcodeScanned = async (scannedCode: string) => {
    if (!detalleActual || scanning) return;

    setScanning(true);
    setCameraActive(false);

    try {
      // Resolver estante ID desde código escaneado
      // En tu app real, esto podría ser más sofisticado
      const estanteId = resolveEstanteIdFromBarcode(
        scannedCode,
        detalleActual.ubicaciones_sugeridas
      );

      if (!estanteId) {
        Alert.alert(
          '⚠️ Código no reconocido',
          `El código "${scannedCode}" no coincide con ninguna ubicación sugerida`
        );
        setScanning(false);
        setCameraActive(true);
        return;
      }

      // VALIDAR ubicación en tiempo real
      const validationResponse = await pickingService.validateLocation({
        producto_id: detalleActual.producto_id,
        estante_id: estanteId,
        cantidad_requerida: detalleActual.cantidad_requerida,
      });

      if (validationResponse.data.valid) {
        // ✅ VÁLIDO: Confirmar pick
        const confirmResponse = await pickingService.confirmPick({
          orden_id: parseInt(orderId!),
          producto_id: detalleActual.producto_id,
          estante_id_escaneado: estanteId,
          cantidad_tomada: detalleActual.cantidad_requerida,
        });

        if (confirmResponse.data.success) {
          Alert.alert(
            '✅ Pick Confirmado',
            `${detalleActual.producto.nombre}\n${detalleActual.cantidad_requerida} unidades`
          );

          // Pasar al siguiente producto
          const nextIndex = detalleActualIndex + 1;
          if (nextIndex < detalles.length) {
            setDetalleActualIndex(nextIndex);
            setCameraActive(true);
          } else {
            // Orden completada
            Alert.alert('✅ Orden Completada', 'Todos los productos han sido surtidos', [
              {
                text: 'Volver',
                onPress: () => router.back(),
              },
            ]);
          }
        }
      } else {
        // ❌ VALIDACIÓN FALLIDA: Ofrecer override
        Alert.alert(
          '⚠️ Ubicación Inválida',
          validationResponse.data.error ||
            'Producto no encontrado o stock insuficiente',
          [
            { text: 'Reintentar', onPress: () => {
              setScanning(false);
              setCameraActive(true);
            }},
            {
              text: 'Override',
              onPress: () => {
                router.push({
                  pathname: '/screens/overrideScreen',
                  params: {
                    detalleId: detalleActual.id.toString(),
                    orderId: orderId,
                    scannedCode,
                  },
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Error procesando código:', error);
      Alert.alert('Error', error.response?.data?.error || 'Error procesando picking');
      setScanning(false);
      setCameraActive(true);
    }
  };

  const handleManualInput = async () => {
    if (!manualInput.trim()) {
      Alert.alert('Error', 'Ingresa un código de ubicación');
      return;
    }

    await handleBarcodeScanned(manualInput);
    setManualInput('');
    setShowManualInput(false);
  };

  const resolveEstanteIdFromBarcode = (
    code: string,
    ubicaciones: Detalle['ubicaciones_sugeridas']
  ): number | null => {
    // Buscar en ubicaciones sugeridas
    const match = ubicaciones.find(
      (u) => u.estante_codigo.toLowerCase() === code.toLowerCase()
    );
    return match?.estante_id ?? null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1B6497" />
          <Text style={styles.loadingText}>Cargando orden...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!detalleActual) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>No hay detalles para esta orden</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progress = ((detalleActualIndex + 1) / detalles.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>ORDEN</Text>
          <Text style={styles.orderNumber}>{orden?.folio}</Text>
        </View>
        <Text style={styles.progressText}>
          {detalleActualIndex + 1}/{detalles.length}
        </Text>
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Contenido */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Info del producto actual */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Producto Actual</Text>
          <Text style={styles.productName}>{detalleActual.producto.nombre}</Text>
          <Text style={styles.sku}>SKU: {detalleActual.producto.sku}</Text>
          <View style={styles.quantityBox}>
            <Text style={styles.quantityLabel}>CANTIDAD REQUERIDA</Text>
            <Text style={styles.quantityValue}>
              {detalleActual.cantidad_requerida}
            </Text>
          </View>
        </View>

        {/* Ubicación sugerida */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ubicación Sugerida</Text>
          <View style={styles.locationDisplay}>
            <Text style={styles.locationCode}>
              {detalleActual.estanteSugerido?.codigo_etiqueta || 'N/A'}
            </Text>
          </View>
          <Text style={styles.hint}>Escanea esta ubicación o ingresa manualmente</Text>
        </View>

        {/* Opciones de escaneo */}
        {!cameraActive && (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                if (permission?.granted) {
                  setCameraActive(true);
                } else {
                  requestPermission();
                }
              }}
              disabled={scanning}
            >
              <Text style={styles.primaryButtonText}>
                {scanning ? '⏳ Procesando...' : '📸 ABRIR CÁMARA'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowManualInput(true)}
            >
              <Text style={styles.secondaryButtonText}>⌨️ INGRESO MANUAL</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Cámara */}
        {cameraActive && permission?.granted && (
          <View style={styles.cameraContainer}>
            <CameraView
              ratio="1:1"
              onBarcodeScanned={({ data }) => handleBarcodeScanned(data)}
              style={styles.camera}
            />
            <TouchableOpacity
              style={styles.closeCamera}
              onPress={() => setCameraActive(false)}
            >
              <Text style={styles.closeCameraText}>Cerrar Cámara</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ingreso manual */}
        {showManualInput && (
          <View style={styles.manualInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ej. A-01-01"
              value={manualInput}
              onChangeText={setManualInput}
              autoFocus
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleManualInput}
            >
              <Text style={styles.submitButtonText}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowManualInput(false);
                setManualInput('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ubicaciones alternativas */}
        {detalleActual.ubicaciones_sugeridas.length > 1 && (
          <View style={styles.alternativesCard}>
            <Text style={styles.cardTitle}>Ubicaciones Alternativas</Text>
            {detalleActual.ubicaciones_sugeridas.map((ubicacion) => (
              <TouchableOpacity
                key={ubicacion.estante_id}
                style={styles.alternativeItem}
                onPress={() =>
                  handleBarcodeScanned(ubicacion.estante_codigo)
                }
              >
                <Text style={styles.alternativeCode}>
                  {ubicacion.estante_codigo}
                </Text>
                <Text style={styles.alternativeQty}>
                  Disponible: {ubicacion.cantidad_disponible}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Botón override (como última opción) */}
        <TouchableOpacity
          style={styles.overrideButton}
          onPress={() =>
            router.push({
              pathname: '/screens/overrideScreen',
              params: {
                detalleId: detalleActual.id.toString(),
                orderId: orderId,
              },
            })
          }
        >
          <Text style={styles.overrideWarning}>⚠️ ¿PROBLEMAS?</Text>
          <Text style={styles.overrideText}>MODO OVERRIDE</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B6497',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1B6497',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderInfo: {
    alignItems: 'center',
  },
  orderLabel: {
    color: '#CCCCCC',
    fontSize: 10,
    fontWeight: '600',
  },
  orderNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00AA00',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  sku: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  quantityBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1B6497',
  },
  quantityLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B6497',
  },
  locationDisplay: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  locationCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B6497',
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#1B6497',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#1B6497',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cameraContainer: {
    height: 300,
    backgroundColor: '#000',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  closeCamera: {
    backgroundColor: '#FF0000',
    padding: 8,
    alignItems: 'center',
  },
  closeCameraText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  manualInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
   color: '#1E293B',
  },
  submitButton: {
    backgroundColor: '#00AA00',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: 'bold',
  },
  alternativesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  alternativeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  alternativeCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B6497',
  },
  alternativeQty: {
    fontSize: 12,
    color: '#64748B',
  },
  overrideButton: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F28C32',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  overrideWarning: {
    color: '#F28C32',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  overrideText: {
    color: '#C2410C',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
```

---

(Continuará en siguiente parte por límite de tokens...)
