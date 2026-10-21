import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FORM_ICONS, FORM_COLORS } from "@constants/icons";

/**
 * PickConfirmButton
 * Componente para confirmar la recolección de un producto
 *
 * Características:
 * - Botón principal para confirmar pick
 * - Feedback háptico en éxito/error
 * - Estado visual de carga
 * - Validación de disponibilidad
 * - Integración modular
 *
 * Props:
 * - onConfirm: Callback al confirmar (recibe ordenId, productoId, cantidad)
 * - onError: Callback en caso de error
 * - isDisabled: Botón deshabilitado si no hay disponibilidad
 * - isLoading: Estado de carga externo
 * - productId: ID del producto
 * - ordenId: ID de la orden
 * - quantity: Cantidad a recoger
 * - location: Ubicación donde se encontró
 */

interface PickConfirmButtonProps {
  onConfirm: (data: PickConfirmData) => Promise<void>;
  onError: (error: string) => void;
  onOpenModal?: () => void;
  onCloseModal?: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  productId: number;
  ordenId: number;
  quantity: number;
  location: string;
  productName?: string;
}

export interface PickConfirmData {
  ordenId: number;
  productId: number;
  quantity: number;
  location: string;
  productName: string;
  timestamp?: Date;
}

export interface PickConfirmState {
  isOpen: boolean;
  isLoading: boolean;
  status: "idle" | "loading" | "success" | "error";
  productId: number;
  ordenId: number;
  quantity: number;
  location: string;
  productName: string;
}

type ConfirmStatus = "idle" | "loading" | "success" | "error";

export default function PickConfirmButton({
  onConfirm,
  onError,
  onOpenModal,
  onCloseModal,
  isDisabled = false,
  isLoading: externalLoading = false,
  productId,
  ordenId,
  quantity,
  location,
  productName = "Producto",
}: PickConfirmButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [status, setStatus] = useState<ConfirmStatus>("idle");

  const isLoading = internalLoading || externalLoading;
  const isButtonDisabled = isDisabled || isLoading;

  /**
   * Primera etapa: mostrar diálogo de confirmación
   */
  const handlePressButton = () => {
    if (isButtonDisabled) return;
    onOpenModal?.();
  };

  /**
   * Segunda etapa: confirmar y enviar al backend
   * (Llamada desde el modal en ScannerScreen)
   */
  const handleConfirmPick = async () => {
    try {
      setInternalLoading(true);
      setStatus("loading");

      const data: PickConfirmData = {
        ordenId,
        productId,
        quantity,
        location,
        productName: productName || "Producto",
      };

      // Llamar al callback (que debe manejar la API)
      await onConfirm(data);

      // Vibración de éxito
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setStatus("success");
      onCloseModal?.();

      // Resetear después de 1.5s
      setTimeout(() => {
        setStatus("idle");
      }, 1500);
    } catch (error) {
      // Vibración de error
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const errorMessage =
        error instanceof Error ? error.message : "Error al confirmar pick";

      setStatus("error");
      onError(errorMessage);

      // Resetear después de 2s
      setTimeout(() => {
        setStatus("idle");
      }, 2000);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCancel = () => {
    onCloseModal?.();
  };

  // Estado visual del botón según status
  const getButtonStyle = () => {
    if (status === "success") return { backgroundColor: "#22C55E" };
    if (status === "error") return { backgroundColor: "#EF4444" };
    if (isDisabled) return { backgroundColor: "#94A3B8", opacity: 0.5 };
    return { backgroundColor: "#059669" };
  };

  const getButtonText = () => {
    if (status === "success") return "CONFIRMADO";
    if (status === "error") return "ERROR";
    if (isLoading) return "";
    return "CONFIRMAR RECOLECCIÓN";
  };

  const getButtonIcon = () => {
    if (status === "success") return FORM_ICONS.SUCCESS_CHECK;
    if (status === "error") return FORM_ICONS.ERROR_CLOSE;
    return null;
  };

  const getButtonIconColor = () => {
    if (status === "success") return FORM_COLORS.success;
    if (status === "error") return FORM_COLORS.error;
    return "#FFFFFF";
  };

  // Exportar funciones para que ScannerScreen pueda llamarlas
  (handleConfirmPick as any).__confirmPick = handleConfirmPick;
  (handleCancel as any).__cancel = handleCancel;

  return (
    <View style={styles.container}>
      {/* Botón Principal */}
      <TouchableOpacity
        style={[styles.confirmButton, getButtonStyle()]}
        onPress={handlePressButton}
        disabled={isButtonDisabled}
        activeOpacity={0.8}
      >
      {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : getButtonIcon() ? (
          <View style={styles.buttonContent}>
            <MaterialCommunityIcons
              name={getButtonIcon()}
              size={18}
              color={getButtonIconColor()}
            />
            <Text style={styles.confirmButtonText}>{getButtonText()}</Text>
          </View>
        ) : (
          <Text style={styles.confirmButtonText}>{getButtonText()}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

/**
 * Componente modal separado para mejor control
 */
export function PickConfirmationModal({
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
  productName,
  quantity,
  location,
  ordenId,
}: {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  productName: string;
  quantity: number;
  location: string;
  ordenId: number;
}) {
  if (!isOpen) return null;

  return (
    <View style={styles.confirmationOverlay}>
      <View style={styles.confirmationDialog}>
        <Text style={styles.confirmationTitle}>Confirmar Recolección</Text>

        <View style={styles.confirmationDetails}>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Producto:</Text>
            <Text style={styles.confirmValue} numberOfLines={2}>
              {productName}
            </Text>
          </View>

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Cantidad:</Text>
            <Text style={styles.confirmValue}>{quantity} un.</Text>
          </View>

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Ubicación:</Text>
            <Text style={styles.confirmValue}>{location}</Text>
          </View>

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Orden ID:</Text>
            <Text style={styles.confirmValue}>{ordenId}</Text>
          </View>
        </View>

        <Text style={styles.confirmationWarning}>
          Verifica los datos antes de confirmar
        </Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.dialogButton, styles.cancelButton]}
            onPress={onCancel}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>CANCELAR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dialogButton, styles.acceptButton]}
            onPress={onConfirm}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.acceptButtonText}>SÍ, CONFIRMAR</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  confirmButton: {
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    minHeight: 56,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  confirmationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  confirmationDialog: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    width: "85%",
    maxWidth: 380,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 16,
    textAlign: "center",
    textTransform: "uppercase",
  },
  confirmationDetails: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  confirmLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    flex: 1,
  },
  confirmValue: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "700",
    flex: 1.2,
    textAlign: "right",
  },
  confirmationWarning: {
    fontSize: 13,
    color: "#F28C32",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
    backgroundColor: "#FFF7ED",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#F28C32",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 10,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#E2E8F0",
  },
  cancelButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  acceptButton: {
    backgroundColor: "#059669",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
