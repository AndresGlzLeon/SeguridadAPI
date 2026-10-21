import AvailabilitySection from "@components/AvailabilitySection";
import CameraScanner from "@components/cameraElement";
import LocationInputSection from "@components/LocationInputSection";
import {
  PickConfirmationModal,
  type PickConfirmData,
} from "@components/pickConfirmButton";
import PickingConfirmSection from "@components/PickingConfirmSection";
import PickingProgressSection from "@components/PickingProgressSection";
import ProductDetailSection from "@components/ProductDetailSection";
import { PICKING_LABELS, PICKING_PLACEHOLDERS } from "@constants/picking";
import { usePickingFlow } from "@hooks/usePicking/usePickingFlow";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FORM_ICONS, FORM_COLORS } from "@constants/icons";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScannerScreen() {
  const { orderId, refreshFromOverride } = useLocalSearchParams();
  const router = useRouter();

  // Convertir orderId de string a number
  const ordenId = Number(Array.isArray(orderId) ? orderId[0] : orderId || "0");

  // TODO EL ESTADO Y LÓGICA AQUÍ
  const flow = usePickingFlow(ordenId);

  // ===== ESTADO LOCAL: Datos para modal de confirmación =====
  const [pendingModalData, setPendingModalData] =
    useState<PickConfirmData | null>(null);

  // Ref para evitar bucle infinito de reload
  // Solo ejecuta el reload la primera vez que ve refreshFromOverride=true
  const hasReloadedRef = useRef(false);

  React.useEffect(() => {
    if (refreshFromOverride === "true" && !hasReloadedRef.current) {
      hasReloadedRef.current = true;
      // Forzar recarga desde API cuando regresa de override
      flow.loadOrder(ordenId);
    }
  }, [refreshFromOverride, ordenId, flow]);

  // ===== FUNCIONES AUXILIARES =====

  /**
   * Abre el modal de confirmación con los datos actuales
   */
  const handleOpenConfirmationModal = useCallback(() => {
    if (flow.currentDetail) {
      const confirmData: PickConfirmData = {
        productId: flow.currentDetail.producto_id,
        ordenId,
        quantity: Number(flow.currentDetail.cantidad_requerida),
        location: flow.estanteCodigo,
        productName: flow.currentDetail.producto.nombre,
      };
      flow.openConfirmationModal(confirmData);
      setPendingModalData(confirmData);
    }
  }, [flow, ordenId]);

  /**
   * Maneja la confirmación del picking desde el modal
   */
  const handleConfirmFromModal = useCallback(async () => {
    if (!pendingModalData) return;

    try {
      await flow.handlePickConfirm(pendingModalData);
      flow.closeConfirmationModal();
      setPendingModalData(null);
    } catch (err) {
      // Error ya manejado dentro de handlePickConfirm
    }
  }, [flow, pendingModalData]);

  /**
   * Wrapper para PickingConfirmSection que espera data de confirmación
   */
  const handlePickConfirmFromSection = useCallback(
    async (data: PickConfirmData) => {
      setPendingModalData(data);
      await flow.handlePickConfirm(data);
      setPendingModalData(null);
    },
    [flow],
  );

  /**
   * Verifica si debe mostrar sección de disponibilidad
   */
  const shouldShowAvailability = useCallback(() => {
    return (
      flow.estanteCodigo &&
      flow.currentDetail &&
      !flow.isCheckingAvailability &&
      !flow.isConfirming
    );
  }, [
    flow.estanteCodigo,
    flow.currentDetail,
    flow.isCheckingAvailability,
    flow.isConfirming,
  ]);

  /**
   * Verifica si debe mostrar botón confirmar
   */
  const shouldShowConfirmButton = useCallback(() => {
    return flow.currentDetail && flow.availabilityResult?.isAvailable;
  }, [flow.currentDetail, flow.availabilityResult]);

  // ===== RENDER =====
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>{"< Volver"}</Text>
        </TouchableOpacity>
        <View style={styles.orderBadge}>
          <Text style={styles.orderBadgeLabel}>
            {PICKING_LABELS.ORDER_LABEL}
          </Text>
          <Text style={styles.orderBadgeText}>
            {flow.orden?.folio || "N/A"}
          </Text>
        </View>
      </View>

      {/* Loading State */}
      {flow.isLoadingOrder ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B6497" />
          <Text style={styles.loadingText}>{PICKING_PLACEHOLDERS.LOADING}</Text>
        </View>
      ) : flow.globalError ? (
        /* Error State */
        <View style={styles.errorContainer}>
          <View style={styles.errorHeader}>
            <MaterialCommunityIcons
              name={FORM_ICONS.WARNING_ALERT}
              size={28}
              color={FORM_COLORS.warning}
            />
            <Text style={styles.errorTitle}>Error</Text>
          </View>
          <Text style={styles.errorText}>{flow.globalError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => flow.loadOrder(ordenId)}
          >
            <Text style={styles.retryButtonText}>
              {PICKING_PLACEHOLDERS.RETRY}
            </Text>
          </TouchableOpacity>
        </View>
      ) : flow.orden && !flow.isOrderComplete ? (
        /* Main Content */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sección 1: Progreso */}
          <PickingProgressSection orden={flow.orden} />

          {/* Sección 2: Producto Actual */}
          {flow.currentDetail && (
            <ProductDetailSection detail={flow.currentDetail} />
          )}

          {/* Sección 3: Input de Ubicación */}
          <LocationInputSection
            estanteCodigo={flow.estanteCodigo}
            onLocationChange={(location) => {
              void flow.handleLocationScanned(location);
            }}
            onQRScan={flow.openCamera}
          />

          {/* Sección 4: Verificación de Disponibilidad */}
          {shouldShowAvailability() && (
            <AvailabilitySection
              productName={flow.currentDetail?.producto.nombre || ""}
              requiredQuantity={
                Number(flow.currentDetail?.cantidad_requerida) || 0
              }
              location={flow.estanteCodigo}
              result={flow.availabilityResult}
              isLoading={flow.isCheckingAvailability}
              onCheck={flow.handleAvailabilityCheck}
            />
          )}

          {/* Sección 5: Botón Confirmar */}
          {shouldShowConfirmButton() && !flow.needsOverride && (
            <PickingConfirmSection
              isAvailable={flow.availabilityResult?.isAvailable || false}
              productId={flow.currentDetail?.producto_id || 0}
              ordenId={ordenId}
              quantity={Number(flow.currentDetail?.cantidad_requerida) || 0}
              location={flow.estanteCodigo}
              productName={flow.currentDetail?.producto.nombre || ""}
              isLoading={flow.isConfirming}
              onConfirm={handlePickConfirmFromSection}
              onError={() => {
                // Los errores son manejados por flow.globalError
              }}
              onOpenModal={handleOpenConfirmationModal}
              onCloseModal={flow.closeConfirmationModal}
            />
          )}

          {/* Sección: Override Mode Suggestion */}
          {flow.needsOverride && flow.overrideMode.ubicacionesDisponibles && (
            <View style={styles.overrideModeSuggestion}>
              <View style={styles.overrideModeHeader}>
              <MaterialCommunityIcons
                name={FORM_ICONS.WARNING_ALERT}
                size={22}
                color={FORM_COLORS.warning}
              />
                <Text style={styles.overrideModeTitle}>
                  Stock Insuficiente
                </Text>
              </View>
              <View style={styles.overrideModeBody}>
                <Text style={styles.overrideModeText}>
                  No hay suficiente stock en la ubicación sugerida. Se
                  encontraron {flow.overrideMode.ubicacionesDisponibles.length}{" "}
                  ubicaciones alternativas con stock disponible.
                </Text>
                <Text style={styles.overrideModeSubtext}>
                  Cantidad faltante:{" "}
                  {flow.currentDetail &&
                    Number(flow.currentDetail.cantidad_requerida) -
                      Number(flow.currentDetail.cantidad_surtida)}{" "}
                  unidades
                </Text>
              </View>
              <TouchableOpacity
                style={styles.overrideModeButton}
                onPress={() => {
                  // Normalización delegada a OverrideScreen
                  // El hook useOverrideLocations maneja la preparación de datos
                  router.push({
                    pathname: "/(screens)/overrideScreen",
                    params: {
                      orderId: String(ordenId),
                      detailId: String(flow.currentDetail?.id),
                      estanteCodigo: flow.estanteCodigo,
                      // Pasar todas las ubicaciones sugeridas del backend
                      // El override screen filtrará según necesidades
                      allUbicaciones: JSON.stringify(
                        flow.currentDetail?.ubicaciones_sugeridas || [],
                      ),
                      cantidadFaltante: String(
                        Number(flow.currentDetail?.cantidad_requerida) -
                          Number(flow.currentDetail?.cantidad_surtida),
                      ),
                    },
                  });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.overrideModeButtonText}>
                  Seleccionar ubicaciones para completar
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{PICKING_PLACEHOLDERS.NO_DATA}</Text>
        </View>
      )}

      {/* Modal: Cámara */}
      {flow.isCameraOpen && (
        <CameraScanner
          barcodeType="qr"
          isOpen={flow.isCameraOpen}
          onScanned={flow.handleLocationScanned}
          onClose={flow.closeCamera}
        />
      )}

      {/* Modal: Confirmación de Picking */}
      {flow.showConfirmationModal && flow.modalConfirmData && (
        <PickConfirmationModal
          isOpen={flow.showConfirmationModal}
          isLoading={flow.isConfirming}
          productName={flow.modalConfirmData.productName}
          quantity={flow.modalConfirmData.quantity}
          location={flow.modalConfirmData.location}
          ordenId={flow.modalConfirmData.ordenId}
          onConfirm={handleConfirmFromModal}
          onCancel={flow.closeConfirmationModal}
        />
      )}

      {/* Modal: Orden Completada */}
      <Modal
        visible={flow.isOrderComplete}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalCheckmark}>
                <MaterialCommunityIcons
                  name={FORM_ICONS.SUCCESS_CHECK}
                  size={40}
                  color={FORM_COLORS.success}
                />
              </View>
            </View>

            {/* Body */}
            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>Orden Completada</Text>
              <Text style={styles.modalSubtitle}>
                {flow.orden?.folio || "Orden"}
              </Text>
              <Text style={styles.modalDescription}>
                La orden ha sido completada exitosamente. El almacén ha
                procesado todos los ítems.
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => router.replace("/(screens)/homeScreen")}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Volver a órdenes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B6497",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1B6497",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  orderBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderBadgeLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 8,
  },
  orderBadgeText: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "900",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#EF4444",
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#1B6497",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 30,
  },
  overrideButton: {
    backgroundColor: "#FFF7ED",
    borderColor: "#F28C32",
    borderWidth: 2.5,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: "center",
    borderStyle: "dashed",
    marginTop: 16,
  },
  overrideWarning: {
    color: "#F28C32",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  overrideText: {
    color: "#C2410C",
    fontSize: 16,
    fontWeight: "900",
  },
  // ===== MODAL: ORDEN COMPLETADA =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 32,
    maxWidth: 380,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 28,
  },
  modalCheckmark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  modalCheckmarkText: {
    fontSize: 40,
    color: "#FFFFFF",
    fontWeight: "bold",
    lineHeight: 40,
  },
  modalBody: {
    alignItems: "center",
    marginBottom: 28,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 16,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    textAlign: "center",
  },
  modalFooter: {
    alignItems: "center",
  },
  modalButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 250,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  // ===== OVERRIDE MODE SUGGESTION =====
  overrideModeSuggestion: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
    borderWidth: 2,
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 16,
  },
  overrideModeHeader: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  overrideModeTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  overrideModeBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  overrideModeText: {
    color: "#78350F",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 8,
  },
  overrideModeSubtext: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "500",
  },
  overrideModeButton: {
    backgroundColor: "#F59E0B",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  overrideModeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
