import { useOverrideLocations } from "@hooks/usePicking/useOverrideLocations";
import { usePickingFlow } from "@hooks/usePicking/usePickingFlow";
import type { UbicacionSugerida } from "@models/orders";
import { validateAccumulativePickingAmount } from "@API/picking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FORM_ICONS, FORM_COLORS } from "@constants/icons";

export default function OverrideScreen() {
  const { orderId, detailId, allUbicaciones, cantidadFaltante, estanteCodigo } =
    useLocalSearchParams();
  const router = useRouter();

  // Convertir IDs de string a number
  const ordenId = Number(Array.isArray(orderId) ? orderId[0] : orderId || "0");
  const detalleId = Number(
    Array.isArray(detailId) ? detailId[0] : detailId || "0",
  );
  const faltante = Number(
    Array.isArray(cantidadFaltante)
      ? cantidadFaltante[0]
      : cantidadFaltante || "0",
  );

  // Parsear ubicaciones alternativas
  const parsedUbicaciones: UbicacionSugerida[] = allUbicaciones
    ? JSON.parse(
        Array.isArray(allUbicaciones) ? allUbicaciones[0] : allUbicaciones,
      )
    : [];

  // Hooks
  const flow = usePickingFlow(ordenId);
  const override = useOverrideLocations();
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: "",
    message: "",
  });

  // Inicializar ubicaciones cuando el screen monta
  // Evita loops infinitos usando dependencias mínimas
  useEffect(() => {
    override.initializeLocations(parsedUbicaciones);
  }, [ordenId, detalleId]);

  // Actualizar cantidad
  const handleQuantityChange = useCallback(
    (index: number, quantity: string) => {
      const num = parseInt(quantity) || 0;
      override.updateQuantity(index, num);
    },
    [override],
  );

  // Confirmar múltiples picks
  const handleConfirmMultiplePicks = useCallback(async () => {
    setIsConfirming(true);

    try {
      // Obtener selecciones activas
      const activeSelections = override.activeSelections();

      if (activeSelections.length === 0) {
        throw new Error("Debe seleccionar al menos una ubicación");
      }

      // Validar cantidad individual (cada ubicación no supere su máximo)
      for (const selection of activeSelections) {
        if (selection.cantidad_tomada > selection.cantidadMaxima) {
          throw new Error(
            `Ubicación ${selection.codigo_etiqueta} no puede superar ${selection.cantidadMaxima} unidades`,
          );
        }
      }

      // ✨ NUEVA VALIDACIÓN: Verificar suma acumulativa
      // No permitir que el total EXCEDA la cantidad requerida
      if (flow.currentDetail) {
        const validation = validateAccumulativePickingAmount(
          flow.currentDetail,
          activeSelections,
        );

        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }

      // Validar cantidad suficiente (original)
      const errorMsg = override.validateSelections(faltante);
      if (errorMsg) {
        throw new Error(errorMsg);
      }

      // Validar producto_id
      if (!flow.currentDetail?.producto_id) {
        throw new Error(
          "Error crítico: producto_id no definido. No se puede confirmar picks.",
        );
      }

      // ✅ TODAS LAS VALIDACIONES PASARON - Confirmar cada pick en secuencia
      for (let i = 0; i < activeSelections.length; i++) {
        const selection = activeSelections[i];

        await flow.handleOverridePickConfirm(
          selection.ubicacion_id,
          selection.cantidad_tomada,
        );
      }

      // Resetear estado de UI antes de navegar
      setIsConfirming(false);
      // Pequeña pausa para que el usuario vea la confirmación
      setTimeout(() => {
        // Pasar parámetro para forzar reload en scannerScreen
        router.push({
          pathname: "/(screens)/scannerScreen",
          params: {
            orderId: String(ordenId),
            refreshFromOverride: "true", // Indica que debe recargar
          },
        });
      }, 500);
    } catch (err) {
      setIsConfirming(false);

      // ✨ Mostrar error en modal personalizado
      const errorMsg =
        err instanceof Error ? err.message : "Error desconocido";

      // Determinar título según el tipo de error
      let errorTitle = "Error en Confirmación";
      if (
        errorMsg.includes("Límite") ||
        errorMsg.includes("exceso") ||
        errorMsg.includes("exceder")
      ) {
        errorTitle = "Límite de Cantidad";
      } else if (errorMsg.includes("seleccionar")) {
        errorTitle = "Selección Incompleta";
      } else if (errorMsg.includes("Stock") || errorMsg.includes("producto")) {
        errorTitle = "Problema con Stock";
      }

      setErrorModal({
        visible: true,
        title: errorTitle,
        message: errorMsg,
      });
    }
  }, [override, flow, faltante, ordenId, detalleId, router]);

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
          <Text style={styles.orderBadgeLabel}>ORDEN</Text>
          <Text style={styles.orderBadgeText}>{ordenId}</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Error Alert */}
        {flow.globalError && (
          <View style={styles.alertError}>
            <View style={styles.alertErrorContent}>
              <MaterialCommunityIcons
                name={FORM_ICONS.ERROR_CLOSE}
                size={18}
                color={FORM_COLORS.error}
              />
              <Text style={styles.alertErrorText}>{flow.globalError}</Text>
            </View>
          </View>
        )}

        {/* Required Quantity Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Cantidad Requerida</Text>
          </View>
          <View style={styles.quantityDisplay}>
            <Text style={styles.quantityValue}>{faltante}</Text>
            <Text style={styles.quantityLabel}>unidades</Text>
          </View>
        </View>

        {/* Producto Info */}
        {flow.currentDetail && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Producto</Text>
            </View>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Nombre</Text>
                <Text style={styles.value}>
                  {flow.currentDetail.producto?.nombre || "N/A"}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.label}>SKU</Text>
                <Text style={styles.value}>
                  {flow.currentDetail.producto?.sku || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Lista de Disponibilidad - Completa (Sugerida + Alternativas) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>
              Lista de Disponibilidad ({override.selections.length} ubicaciones)
            </Text>
          </View>

          {override.selections.length === 0 ? (
            <Text style={styles.noDataText}>
              No hay ubicaciones disponibles
            </Text>
          ) : (
            <View style={styles.locationsList}>
              {override.selections.map((selection, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.locationItem,
                    selection.es_sugerida && styles.locationItemSugerida,
                  ]}
                >
                  <View style={styles.locationInfo}>
                    <View style={styles.locationHeader}>
                      {selection.es_sugerida && (
                        <View style={styles.posicionBadge}>
                          <Text style={styles.posicionText}>Posición 1</Text>
                        </View>
                      )}
                      <Text style={styles.locationCode}>
                        {selection.codigo_etiqueta}
                      </Text>
                    </View>
                    <Text style={styles.locationSubtext}>
                      Disponible: {selection.cantidadMaxima} unidades
                    </Text>
                  </View>
                  <View style={styles.quantityInput}>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      keyboardType="numeric"
                      value={String(selection.cantidad_tomada)}
                      onChangeText={(text) => handleQuantityChange(idx, text)}
                      maxLength={4}
                    />
                    <Text style={styles.inputLabel}>
                      de {selection.cantidadMaxima}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Total Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Seleccionado:</Text>
            <Text
              style={[
                styles.summaryValue,
                {
                  color:
                    override.totalSelected() >= faltante
                      ? "#10B981"
                      : "#EF4444",
                },
              ]}
            >
              {override.totalSelected()} unidades
            </Text>
          </View>
          {override.totalSelected() < faltante && (
            <View style={styles.warningContent}>
              <MaterialCommunityIcons
                name={FORM_ICONS.WARNING_ALERT}
                size={16}
                color={FORM_COLORS.warning}
              />
              <Text style={styles.warningText}>
                Faltarían {faltante - override.totalSelected()} unidades
              </Text>
            </View>
          )}
          {override.totalSelected() >= faltante && (
            <View style={styles.successContent}>
              <MaterialCommunityIcons
                name={FORM_ICONS.SUCCESS_CHECK}
                size={16}
                color={FORM_COLORS.success}
              />
              <Text style={styles.successText}>Cantidad suficiente</Text>
            </View>
          )}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            {
              opacity:
                override.canConfirm(
                  faltante,
                  override.selections.reduce(
                    (s, sel) => s + sel.cantidadMaxima,
                    0,
                  ),
                ) && !isConfirming
                  ? 1
                  : 0.5,
            },
          ]}
          onPress={handleConfirmMultiplePicks}
          disabled={
            !override.canConfirm(
              faltante,
              override.selections.reduce((s, sel) => s + sel.cantidadMaxima, 0),
            ) || isConfirming
          }
          activeOpacity={0.8}
        >
          {isConfirming ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>
              CONFIRMAR PICKS ({override.totalSelected()}/{faltante})
            </Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Error Modal - Personalizado y Atractivo */}
      <Modal
        visible={errorModal.visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContent}>
            {/* Header con icono */}
            <View style={styles.errorModalHeader}>
              <View style={styles.errorModalIconContainer}>
                <MaterialCommunityIcons
                  name={FORM_ICONS.WARNING_ALERT}
                  size={32}
                  color={FORM_COLORS.warning}
                />
              </View>
            </View>

            {/* Título */}
            <Text style={styles.errorModalTitle}>{errorModal.title}</Text>

            {/* Mensaje */}
            <Text style={styles.errorModalMessage}>{errorModal.message}</Text>

            {/* Botón de cierre */}
            <TouchableOpacity
              style={styles.errorModalButton}
              onPress={() => setErrorModal({ ...errorModal, visible: false })}
              activeOpacity={0.8}
            >
              <Text style={styles.errorModalButtonText}>Entendido</Text>
            </TouchableOpacity>
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
  alertError: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  alertErrorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  alertErrorText: {
    color: "#991B1B",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  warningContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  successContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  quantityDisplay: {
    alignItems: "center",
    paddingVertical: 12,
  },
  quantityValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1B6497",
  },
  quantityLabel: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  noDataText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    paddingVertical: 16,
  },
  locationsList: {
    gap: 12,
  },
  locationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  locationItemSugerida: {
    backgroundColor: "#EFF6FF",
    borderColor: "#1B6497",
    borderWidth: 2,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  posicionBadge: {
    backgroundColor: "#1B6497",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  posicionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  locationInfo: {
    flex: 1,
  },
  locationCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B6497",
  },
  locationSubtext: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  quantityInput: {
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    width: 70,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: "#F0F9FF",
    borderColor: "#0EA5E9",
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  warningText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
    marginTop: 6,
  },
  successText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
    marginTop: 6,
  },
  confirmButton: {
    backgroundColor: "#1B6497",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#1B6497",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  // ✨ Estilos para Error Modal
  errorModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  errorModalHeader: {
    marginBottom: 20,
  },
  errorModalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FCA5A5",
  },
  errorModalIcon: {
    fontSize: 40,
  },
  errorModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
    textAlign: "center",
  },
  errorModalMessage: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  errorModalButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  errorModalButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
