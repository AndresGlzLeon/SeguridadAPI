/**
 * COMPONENTE: FormattedText
 * 
 * Propósito: Mostrar texto con ícono inline (para reemplazar emojis en strings)
 * Uso: <FormattedText icon="check" text="Confirmado" type="success" />
 * 
 * Props:
 * - icon: nombre del ícono de MaterialCommunityIcons (opcional)
 * - text: contenido de texto
 * - type: 'success' | 'error' | 'warning' | 'info' | 'default'
 * - size: tamaño de fuente
 * - style: estilos personalizados
 * - ...props: props estándar de Text
 */

import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FormattedTextProps extends TextProps {
  icon?: string;
  text: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'default';
  size?: number;
}

const COLOR_MAP = {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  default: '#1B6497',
};

/**
 * Renderiza texto con ícono integrado inline
 * Mantiene compatibilidad con Props de Text estándar
 */
export default function FormattedText({
  icon,
  text,
  type = 'default',
  size = 14,
  style,
  ...props
}: FormattedTextProps) {
  const color = COLOR_MAP[type];

  // Si no hay ícono, solo mostrar texto
  if (!icon) {
    return (
      <Text
        style={[
          styles.text,
          {
            color,
            fontSize: size,
          },
          style as any,
        ]}
        {...props}
      >
        {text}
      </Text>
    );
  }

  // Con ícono: mostrar inline
  return (
    <Text
      style={[
        styles.text,
        {
          color,
          fontSize: size,
        },
        style as any,
      ]}
      {...props}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={size}
        color={color}
        style={styles.icon}
      />
      {' ' + text}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '700',
  },
  icon: {
    marginRight: 4,
  },
});
