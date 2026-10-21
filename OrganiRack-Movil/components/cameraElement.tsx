import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useRef } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type BarcodeType =
  | "qr"
  | "ean13"
  | "ean8"
  | "code128"
  | "code39"
  | "upc_a"
  | "upc_e"
  | "itf14"
  | "codabar";

interface CameraScannerProps {
  barcodeType: BarcodeType | BarcodeType[];
  onScanned: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

/**
 * Componente reutilizable para escanear códigos de barras/QR
 * Usa expo-camera para capturar y procesar códigos
 *
 * @param barcodeType - Tipo de código a escanear: 'qr', 'ean13', 'code128', etc
 * @param onScanned - Callback cuando se escanea un código
 * @param onClose - Callback para cerrar el scanner
 * @param isOpen - Controla si el scanner está visible
 */
export default function CameraScanner({
  barcodeType,
  onScanned,
  onClose,
  isOpen,
}: CameraScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  // Solicitar permisos de cámara
  useEffect(() => {
    if (isOpen && !permission?.granted) {
      requestPermission();
    }
  }, [isOpen, permission]);

  // Resetear el flag cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      scannedRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Si no hay permiso, mostrar mensaje
  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Se requiere permiso de cámara para escanear códigos
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => requestPermission()}
          >
            <Text style={styles.permissionButtonText}>Solicitar Permiso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            No se tiene permiso para acceder a la cámara
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBarcodeScanned = ({ type, data }: any) => {
    // Evitar múltiples escaneos rápidos
    if (scannedRef.current) return;
    scannedRef.current = true;

    // Normalizar tipos de código
    const barcodeTypes = Array.isArray(barcodeType)
      ? barcodeType
      : [barcodeType];
    const typeMap: Record<string, BarcodeType[]> = {
      qr: ["qr"],
      ean13: ["ean13"],
      ean8: ["ean8"],
      code128: ["code128"],
      code39: ["code39"],
      upc_a: ["upc_a"],
      upc_e: ["upc_e"],
      itf14: ["itf14"],
      codabar: ["codabar"],
    };

    // Validar tipo de código escaneado
    const isValidType = barcodeTypes.some((bt) => {
      const normalizedType = type.toLowerCase();
      return normalizedType === bt || normalizedType.includes(bt);
    });

    if (isValidType || barcodeTypes.includes("*" as any)) {
      // Éxito: pasar datos al callback
      onScanned(data);
      onClose();
    } else {
      // Tipo inválido
      Alert.alert(
        "Tipo de Código Inválido",
        `Se esperaba escanear: ${barcodeTypes.join(", ")}\nSe escaneó: ${type}`,
        [
          {
            text: "Intentar de Nuevo",
            onPress: () => {
              scannedRef.current = false;
            },
          },
          { text: "Cancelar", onPress: onClose },
        ],
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: Array.isArray(barcodeType)
            ? barcodeType
            : [barcodeType],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Overlay con guía de escaneo */}
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.guideText}>
          Alinea el código con el marco{"\n"}
          {Array.isArray(barcodeType)
            ? barcodeType.join(", ").toUpperCase()
            : barcodeType.toUpperCase()}
        </Text>
      </View>

      {/* Botón de cerrar */}
      <TouchableOpacity style={styles.closeButtonOverlay} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕ Cerrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  frame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: "#00FF00",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  guideText: {
    marginTop: 20,
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
    textShadowColor: "#000000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  permissionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: "center",
  },
  permissionText: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#1B6497",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButtonOverlay: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});
