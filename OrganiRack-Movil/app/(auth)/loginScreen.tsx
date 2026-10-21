import { useAuth } from "@context/AuthContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
	ActivityIndicator,
	Image,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleLogin = async () => {
    // Validar campos
    if (username === "" || password === "") {
      setLocalError("Por favor, completa todos los campos.");
      return;
    }

    clearError();
    setLocalError("");

    try {
      // Realizar login usando la API
      await login({ username, password });
      // La navegación se manejará automáticamente en el root layout
    } catch (err: any) {
      setLocalError(err?.message || "Error de autenticación");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={[styles.subcontainer, { flex: 2.7 }]}>
            <Image
              source={require("@images/Logo.webp")}
              resizeMode="contain"
              style={styles.logo}
            />
          </View>
          <View style={[styles.subcontainer, { paddingBottom: "5%" }]}>
            <Text style={styles.title}>OrganiRack+</Text>
            <Text style={styles.subtitle}>
              Gestión Profesional de Inventarios
            </Text>
          </View>
        </View>

        <View style={styles.main}>
          <Text style={styles.mainTitle}>Inicio De Sesión</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu usuario"
              placeholderTextColor="#94A3B8"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
              <Text style={styles.buttonText}>Ingresar</Text>
            )}
          </TouchableOpacity>

          {(localError || error) && (
            <View style={[styles.feedbackContainer, styles.feedbackError]}>
              <Text style={styles.feedbackText}>
                {localError || error?.message}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.copyright}>OrganiRack+ Móvil ©</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flex: 2.5,
    flexDirection: "column",
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  subcontainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: "2%",
  },
  logo: {
    aspectRatio: 1,
    height: "100%",
    marginTop: "5%",
  },
  title: {
    fontWeight: "900",
    fontSize: 28,
    color: "#1B6497",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: 4,
  },
  main: {
    flex: 6,
    width: "100%",
    paddingHorizontal: "8%",
    paddingTop: "5%",
    alignItems: "flex-start",
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 24,
    textTransform: "uppercase",
    alignSelf: "center",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 20,
  },
  inputLabel: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: "#1E293B",
  },
  button: {
    backgroundColor: "#F28C32",
    width: "100%",
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#F28C32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: "#D4A574",
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  feedbackContainer: {
    marginTop: 24,
    padding: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  feedbackError: {
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 6,
    borderColor: "#EF4444",
  },
  feedbackSuccess: {
    backgroundColor: "#F0FDF4",
    borderLeftWidth: 6,
    borderColor: "#22C55E",
  },
  feedbackInfo: {
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 6,
    borderColor: "#3B82F6",
  },
  feedbackText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  footer: {
    height: 50,
    width: "100%",
    backgroundColor: "#1B6497",
    justifyContent: "center",
    alignItems: "center",
  },
  copyright: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
