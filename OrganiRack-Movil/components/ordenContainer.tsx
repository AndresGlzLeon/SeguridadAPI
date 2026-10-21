import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PriorityIndicator from "./priorityIndicator";

interface OrderCardProps {
  id: number;
  folio: string;
  itemCount: number;
  priority: "high" | "medium" | "low";
  onPress: () => void;
}

export default function OrderCard({
  id,
  folio,
  itemCount,
  priority,
  onPress,
}: OrderCardProps) {
  const getStripColor = () => {
    switch (priority) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#F59E0B";
      case "low":
        return "#10B981";
      default:
        return "#94A3B8";
    }
  };

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[styles.priorityStrip, { backgroundColor: getStripColor() }]}
      />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Image
            source={require("@images/Container.webp")}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.orderLabel}>ORDEN</Text>
          <Text style={styles.orderId}>{folio}</Text>
        </View>

        <View style={styles.rightContainer}>
          <View style={styles.itemsContainer}>
            <Text style={styles.itemsText}>{itemCount} Items</Text>
          </View>

          <PriorityIndicator priority={priority} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priorityStrip: {
    width: 8,
    height: "100%",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  image: {
    width: 40,
    height: 40,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  orderLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "700",
    marginBottom: 2,
  },
  orderId: {
    fontSize: 18,
    color: "#1E293B",
    fontWeight: "900",
  },
  rightContainer: {
    alignItems: "flex-end",
    gap: 8,
  },
  itemsContainer: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  itemsText: {
    fontSize: 14,
    color: "#1B6497",
    fontWeight: "bold",
  },
});
