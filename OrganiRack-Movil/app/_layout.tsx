import { AuthProvider, useAuth } from "@context/AuthContext";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * Componente que maneja la navegación condicional basada en el estado de autenticación
 */
function RootLayoutNav() {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#F28C32" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        <Stack.Screen name="(screens)" options={{ animation: 'none' }} />
      ) : (
        <Stack.Screen name="(auth)" options={{ animation: 'none' }} />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
