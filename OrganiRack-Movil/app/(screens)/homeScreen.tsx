import apiClient from "@API/client";
import { MOBILE_PICKING_ENDPOINTS } from "@API/endpoints";
import OrderCard from "@components/ordenContainer";
import {
  GetOrdersResponse,
  OrdenSurtido,
  OrderCardProps,
  transformOrderToCardProps,
} from "@models/orders";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const [ordersData, setOrdersData] = useState<OrderCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtiene órdenes del almacenista desde la API
   */
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<GetOrdersResponse>(
        MOBILE_PICKING_ENDPOINTS.getOrders,
      );

      if (response.data?.data && Array.isArray(response.data.data)) {
        // Transformar órdenes a OrderCardProps
        const transformedOrders: OrderCardProps[] = response.data.data.map(
          (orden: OrdenSurtido) => {
            const cardProps = transformOrderToCardProps(orden);
            return {
              ...cardProps,
              onPress: () => handleOrderPress(orden.id),
            };
          },
        );

        setOrdersData(transformedOrders);
      } else {
        setOrdersData([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al obtener órdenes";
      setError(errorMessage);
      console.error("Error fetching orders:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Ejecutar fetchOrders cuando la pantalla se enfoca
   */
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  const totalOrders = ordersData.length;
  const totalItems = ordersData.reduce((acc, curr) => acc + curr.itemCount, 0);

  const handleOrderPress = (orderId: number) => {
    router.push({
      pathname: "/(screens)/scannerScreen",
      params: { orderId: orderId.toString() },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topbar}>
        <View style={styles.headerTitleRow}>
          <Image
            source={require("@images/List.webp")}
            resizeMode="contain"
            style={styles.headerIcon}
          />
          <Text style={styles.title}>OrganiRack+</Text>
        </View>

        <Text style={styles.subtitle}>Cola de Picking Activa</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Órdenes</Text>
            <Text style={styles.statValue}>{totalOrders}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Items</Text>
            <Text style={styles.statValue}>{totalItems}</Text>
          </View>
        </View>
      </View>

      <View style={styles.main}>
        {isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#1B6497" />
            <Text style={styles.loadingText}>Cargando órdenes...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : ordersData.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>No hay órdenes asignadas</Text>
          </View>
        ) : (
          <FlatList
            data={ordersData}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <OrderCard
                id={item.id}
                folio={item.folio}
                itemCount={item.itemCount}
                priority={item.priority}
                onPress={item.onPress}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B6497",
  },
  topbar: {
    backgroundColor: "#1B6497",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    color: "#93C5FD",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#15507A",
    borderRadius: 12,
    paddingVertical: 12,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#1B6497",
  },
  statLabel: {
    color: "#93C5FD",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  main: {
    flex: 1,
    backgroundColor: "#F8FAFC", // rack-light
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    overflow: "hidden",
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    color: "#1B6497",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#1B6497",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "600",
  },
});
