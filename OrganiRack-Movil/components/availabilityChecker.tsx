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
 * AvailabilityChecker
 * Componente ÚNICAMENTE de UI para mostrar resultado de disponibilidad
 * La lógica está en hooks/useAvailabilityCheck.ts
 *
 * Props:
 * - productName: Nombre del producto
 * - requiredQuantity: Cantidad requerida
 * - location: Ubicación (ej: "A-01-03")
 * - result: Resultado de disponibilidad (de useAvailabilityCheck hook)
 * - isLoading: Estado de carga
 * - onCheck: Callback cuando usuario presiona botón
 */

interface AvailabilityCheckerProps {
  productName: string;
  requiredQuantity: number;
  location: string;
  result: {
    isAvailable: boolean;
    availableQuantity: number;
    message: string;
  } | null;
  isLoading: boolean;
  onCheck: () => Promise<void>;
}

export default function AvailabilityChecker({
  productName,
  requiredQuantity,
  location,
  result,
  isLoading,
  onCheck,
}: AvailabilityCheckerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = () => {
    if (!result) return "#94A3B8";
    return result.isAvailable ? "#22C55E" : "#EF4444";
  };

  const getStatusIcon = () => {
    if (!result) return FORM_ICONS.INFO_ICON;
    return result.isAvailable ? FORM_ICONS.SUCCESS_CHECK : FORM_ICONS.ERROR_CLOSE;
  };

  return (
    <View style={styles.container}>
      {/* Header - Ubicación */}
      <View style={styles.header}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>Ubicación</Text>
          <Text style={styles.locationValue}>{location}</Text>
        </View>
        <View
          style={[
            styles.statusIndicator,
            {
              borderColor: getStatusColor(),
              backgroundColor: getStatusColor() + "15",
            },
          ]}
        >
          <MaterialCommunityIcons
            name={getStatusIcon() as any}
            size={24}
            color={getStatusColor()}
          />
        </View>
      </View>

      {/* Mensaje de resultado */}
      {result && (
        <View
          style={[
            styles.resultContainer,
            {
              borderColor: getStatusColor(),
              backgroundColor: getStatusColor() + "10",
            },
          ]}
        >
          <Text style={[styles.resultMessage, { color: getStatusColor() }]}>
            {result.message}
          </Text>
        </View>
      )}

      {/* Botón principal */}
      <TouchableOpacity
        style={[
          styles.checkButton,
          isLoading && styles.checkButtonDisabled,
          result?.isAvailable && styles.checkButtonSuccess,
        ]}
        onPress={onCheck}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <View style={styles.buttonContent}>
            {result?.isAvailable && (
              <MaterialCommunityIcons
                name={FORM_ICONS.SUCCESS_CHECK_FILLED}
                size={18}
                color="#FFFFFF"
              />
            )}
            <Text style={styles.checkButtonText}>
              {result?.isAvailable ? "DISPONIBLE" : "VERIFICAR DISPONIBILIDAD"}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Información expandida */}
      {result && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.expandButtonContent}>
            <MaterialCommunityIcons
              name={isExpanded ? FORM_ICONS.NAV_CHEVRON_UP : FORM_ICONS.NAV_CHEVRON_RIGHT}
              size={16}
              color="#1B6497"
            />
            <Text style={styles.expandButtonText}>
              {isExpanded ? "OCULTAR DETALLES" : "VER DETALLES"}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {isExpanded && result && (
        <View style={styles.expandedContent}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Requerida:</Text>
            <Text style={styles.detailValue}>{requiredQuantity} un.</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Disponible:</Text>
            <Text
              style={[
                styles.detailValue,
                { color: result.isAvailable ? "#22C55E" : "#EF4444" },
              ]}
            >
              {result.availableQuantity} un.
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ubicación:</Text>
            <Text style={styles.detailValue}>{location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Producto:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {productName}
            </Text>
          </View>
        </View>
      )}

      {/* Nota de feedback */}
      {result && !result.isAvailable && (
        <View style={styles.warningBox}>
          <View style={styles.warningContent}>
            <MaterialCommunityIcons
              name={FORM_ICONS.INFO_LIGHTBULB}
              size={18}
              color={FORM_COLORS.info}
            />
            <Text style={styles.warningText}>
              Puedes usar el modo OVERRIDE para especificar otra ubicación
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
  },
  statusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  statusIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  resultContainer: {
    borderRadius: 10,
    borderWidth: 2,
    padding: 12,
    marginBottom: 12,
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  checkButton: {
    backgroundColor: "#1B6497",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#1B6497",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 10,
  },
  checkButtonDisabled: {
    opacity: 0.7,
  },
  checkButtonSuccess: {
    backgroundColor: "#22C55E",
  },
  checkButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  expandButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  expandButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  expandButtonText: {
    fontSize: 12,
    color: "#1B6497",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  warningBox: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFF7ED",
    borderLeftWidth: 4,
    borderLeftColor: "#F28C32",
    borderRadius: 8,
  },
  warningContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#92400E",
    fontWeight: "500",
    lineHeight: 18,
    flex: 1,
  },
});
