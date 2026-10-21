/**
 * LocationInputSection
 * Maneja entrada y escaneo de código de estante
 * Props: Valores + callbacks de cambios
 */

import {
    PICKING_LABELS,
    PICKING_PLACEHOLDERS,
    PICKING_SECTIONS,
} from "@constants/picking";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import InputUbicacion from "./inputUbicacion";

interface LocationInputSectionProps {
  estanteCodigo: string;
  onLocationChange: (code: string) => void;
  onQRScan: () => void;
}

export default function LocationInputSection({
  estanteCodigo,
  onLocationChange,
  onQRScan,
}: LocationInputSectionProps) {
  return (
    <>
      <Text style={styles.sectionTitle}>{PICKING_SECTIONS.LOCATION}</Text>
      <View style={styles.card}>
        <View style={styles.locationGrid}>
          <InputUbicacion
            label="Código de Estante"
            placeholder={PICKING_PLACEHOLDERS.LOCATION_CODE}
            value={estanteCodigo}
            onChangeText={onLocationChange}
            onPress={onQRScan}
          />
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={onQRScan}
          activeOpacity={0.8}
        >
          <Text style={styles.scanButtonText}>{PICKING_LABELS.SCAN_QR}</Text>
        </TouchableOpacity>
      </View>
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  locationGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  scanButton: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scanButtonText: {
    color: "#1B6497",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
