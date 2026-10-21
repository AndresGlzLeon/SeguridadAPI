/**
 * AvailabilitySection
 * Muestra verificación de disponibilidad
 * Props: Datos + callbacks de eventos
 */

import { PICKING_SECTIONS } from "@constants/picking";
import React from "react";
import { StyleSheet, Text } from "react-native";
import AvailabilityChecker from "./availabilityChecker";

interface AvailabilitySectionProps {
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

export default function AvailabilitySection({
  productName,
  requiredQuantity,
  location,
  result,
  isLoading,
  onCheck,
}: AvailabilitySectionProps) {
  // Solo mostrar si hay ubicación especificada
  if (!location) return null;

  return (
    <>
      <Text style={styles.sectionTitle}>{PICKING_SECTIONS.AVAILABILITY}</Text>
      <AvailabilityChecker
        productName={productName}
        requiredQuantity={requiredQuantity}
        location={location}
        result={result}
        isLoading={isLoading}
        onCheck={onCheck}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1E293B",
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
