/**
 * PickingProgressSection
 * Componente SOLO de presentación: Muestra progreso de picking
 * Props manejadas por padres, NO tiene lógica de negocio
 */

import { countPendingItems, getPickingProgress } from "@API/picking";
import { PICKING_SECTIONS } from "@constants/picking";
import { FORM_ICONS, FORM_COLORS } from "@constants/icons";
import { OrdenSurtido } from "@models/orders";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface PickingProgressSectionProps {
  orden: OrdenSurtido;
}

export default function PickingProgressSection({
  orden,
}: PickingProgressSectionProps) {
  const progress = getPickingProgress(orden);
  const pending = countPendingItems(orden);
  const total = orden.detalles.length;

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>{PICKING_SECTIONS.PROGRESS}</Text>
        <Text style={styles.progressValue}>{progress}%</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.progressStats}>
        <View style={styles.statContainer}>
          <MaterialCommunityIcons
            name={FORM_ICONS.SUCCESS_CHECK}
            size={16}
            color={FORM_COLORS.success}
          />
          <Text style={styles.statText}>
            {pending} de {total} items completados
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  progressValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1B6497",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22C55E",
    borderRadius: 4,
  },
  progressStats: {
    alignItems: "center",
  },
  statContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
});
