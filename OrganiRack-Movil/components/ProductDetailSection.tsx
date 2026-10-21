/**
 * ProductDetailSection
 * Muestra el producto actual que se está recogiendo
 * Props: Solo datos, NO tiene lógica
 */

import { PICKING_SECTIONS } from "@constants/picking";
import { DetalleSurtido } from "@models/orders";
import React from "react";
import { StyleSheet, Text } from "react-native";
import ProductDetailItem from "./productDetailItem";

interface ProductDetailSectionProps {
  detail: DetalleSurtido | null;
}

export default function ProductDetailSection({
  detail,
}: ProductDetailSectionProps) {
  if (!detail) return null;

  const isPicked =
    Number(detail.cantidad_surtida) >= Number(detail.cantidad_requerida);
  const isPartial =
    Number(detail.cantidad_surtida) > 0 &&
    Number(detail.cantidad_surtida) < Number(detail.cantidad_requerida);

  const status = isPicked ? "picked" : isPartial ? "partial" : "pending";

  return (
    <>
      <Text style={styles.sectionTitle}>{PICKING_SECTIONS.PRODUCT}</Text>
      <ProductDetailItem
        productName={detail.producto.nombre}
        sku={detail.producto.sku}
        requiredQuantity={Number(detail.cantidad_requerida)}
        pickedQuantity={Number(detail.cantidad_surtida)}
        status={status}
        isExpanded
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
