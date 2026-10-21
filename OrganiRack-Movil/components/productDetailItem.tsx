import React from "react";
import { StyleSheet, Text, View } from "react-native";

/**
 * ProductDetailItem
 * Componente reutilizable para mostrar detalles de un producto en la orden
 *
 * Props:
 * - productName: Nombre del producto
 * - sku: Código SKU del producto
 * - requiredQuantity: Cantidad requerida
 * - pickedQuantity: Cantidad ya recolectada (opcional)
 * - status: Estado del item ('pending' | 'picked' | 'partial')
 * - isExpanded: Si se muestra información adicional
 */

interface ProductDetailItemProps {
  productName: string;
  sku: string;
  requiredQuantity: number;
  pickedQuantity?: number;
  status?: "pending" | "picked" | "partial";
  isExpanded?: boolean;
}

export default function ProductDetailItem({
  productName,
  sku,
  requiredQuantity,
  pickedQuantity = 0,
  status = "pending",
  isExpanded = false,
}: ProductDetailItemProps) {
  const isPending = status === "pending" && pickedQuantity === 0;
  const isPartial =
    status === "partial" &&
    pickedQuantity > 0 &&
    pickedQuantity < requiredQuantity;
  const isPicked = status === "picked" && pickedQuantity >= requiredQuantity;

  const getStatusColor = () => {
    if (isPicked) return "#22C55E"; // green
    if (isPartial) return "#F59E0B"; // amber
    return "#EF4444"; // red
  };

  const getStatusLabel = () => {
    if (isPicked) return "✓ COMPLETADO";
    if (isPartial) return "◐ PARCIAL";
    return "○ PENDIENTE";
  };

  const remainingQuantity = requiredQuantity - pickedQuantity;
  const progressPercent = (pickedQuantity / requiredQuantity) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {productName}
          </Text>
          <Text style={styles.sku}>{sku}</Text>
        </View>

        <View style={[styles.statusBadge, { borderColor: getStatusColor() }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusLabel()}
          </Text>
        </View>
      </View>

      <View style={styles.quantitySection}>
        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>
            <Text style={styles.labelBold}>Requerida:</Text> {requiredQuantity}{" "}
            un.
          </Text>
          <Text style={[styles.quantityLabel, { color: getStatusColor() }]}>
            <Text style={styles.labelBold}>Recogida:</Text> {pickedQuantity} un.
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progressPercent, 100)}%`,
                backgroundColor: getStatusColor(),
              },
            ]}
          />
        </View>

        {isPartial && (
          <Text style={styles.pendingQuantity}>
            Falta:{" "}
            <Text style={styles.pendingBold}>{remainingQuantity} un.</Text>
          </Text>
        )}
      </View>

      {isExpanded && (
        <View style={styles.expandedInfo}>
          <Text style={styles.infoText}>📍 SKU: {sku}</Text>
          <Text style={styles.infoText}>📦 Estado: {getStatusLabel()}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 20,
  },
  sku: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
    fontWeight: "500",
  },
  statusBadge: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 100,
    alignItems: "center",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quantitySection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
  },
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  quantityLabel: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  labelBold: {
    fontWeight: "700",
    color: "#1E293B",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  pendingQuantity: {
    fontSize: 12,
    color: "#F59E0B",
    fontWeight: "500",
    marginTop: 4,
  },
  pendingBold: {
    fontWeight: "700",
    color: "#D97706",
  },
  expandedInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  infoText: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 6,
    fontWeight: "500",
  },
});
