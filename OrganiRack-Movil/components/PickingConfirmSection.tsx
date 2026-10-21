/**
 * PickingConfirmSection
 * Muestra botón de confirmación y coordina modal
 * Props: Datos + callbacks de confirmación
 */

import { PICKING_SECTIONS } from "@constants/picking";
import React from "react";
import { StyleSheet, Text } from "react-native";
import PickConfirmButton, { PickConfirmData } from "./pickConfirmButton";

interface PickingConfirmSectionProps {
  isAvailable: boolean | null;
  productId: number;
  ordenId: number;
  quantity: number;
  location: string;
  productName: string;
  isLoading: boolean;
  onConfirm: (data: PickConfirmData) => Promise<void>;
  onError: (error: string) => void;
  onOpenModal: () => void;
  onCloseModal: () => void;
}

export default function PickingConfirmSection({
  isAvailable,
  productId,
  ordenId,
  quantity,
  location,
  productName,
  isLoading,
  onConfirm,
  onError,
  onOpenModal,
  onCloseModal,
}: PickingConfirmSectionProps) {
  // Solo mostrar si disponibilidad fue confirmada
  if (!isAvailable) return null;

  return (
    <>
      <Text style={styles.sectionTitle}>{PICKING_SECTIONS.CONFIRM}</Text>
      <PickConfirmButton
        productId={productId}
        ordenId={ordenId}
        quantity={quantity}
        location={location}
        productName={productName}
        isLoading={isLoading}
        isDisabled={false}
        onConfirm={onConfirm}
        onError={onError}
        onOpenModal={onOpenModal}
        onCloseModal={onCloseModal}
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
