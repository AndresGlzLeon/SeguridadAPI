import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface InputUbicacionProps {
  label: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  editable?: boolean;
}

/**
 * Componente reutilizable para inputs de ubicación
 * Soporta entrada manual o presión para teclado/escaneo
 */
export default function InputUbicacion({
  label,
  placeholder = "Ej. A-1",
  value = "",
  onChangeText,
  onPress,
  editable = false,
}: InputUbicacionProps) {
  return (
    <View style={styles.inputBox}>
      <Text style={styles.label}>{label}</Text>
      {editable && onChangeText ? (
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
        />
      ) : (
        <TouchableOpacity
          style={styles.mockInput}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.mockInputText}>{value || placeholder}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputBox: {
    flex: 1,
  },
  label: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  mockInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 12,
  },
  mockInputText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "600",
  },
});
