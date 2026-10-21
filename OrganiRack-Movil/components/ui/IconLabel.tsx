/**
 * COMPONENTE: IconLabel
 * 
 * Propósito: Reemplazar emojis de manera formal
 * Uso: <IconLabel icon="check-circle" label="Confirmado" type="success" />
 * 
 * Props:
 * - icon: nombre del ícono de MaterialCommunityIcons
 * - label: texto a mostrar
 * - type: 'success' | 'error' | 'warning' | 'info' | 'default'
 * - size: 'xs' | 'sm' | 'md' | 'lg'
 * - inline: mostrar en layout horizontal
 * - style: estilos personalizados del contenedor
 * - textStyle: estilos personalizados del texto
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface IconLabelProps {
  icon: string;
  label: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'default';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  inline?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const COLOR_MAP = {
  success: '#10B981',    // Verde
  error: '#EF4444',      // Rojo
  warning: '#F59E0B',    // Naranja
  info: '#3B82F6',       // Azul
  default: '#1B6497',    // Azul corporativo
};

const SIZE_MAP = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 24,
};

export default function IconLabel({
  icon,
  label,
  type = 'default',
  size = 'md',
  inline = false,
  style,
  textStyle,
}: IconLabelProps) {
  const color = COLOR_MAP[type];
  const iconSize = SIZE_MAP[size];

  return (
    <View
      style={[
        inline ? styles.rowContainer : styles.colContainer,
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={iconSize}
        color={color}
      />
      <Text
        style={[
          styles.label,
          {
            color,
            marginLeft: inline ? 8 : 0,
            marginTop: inline ? 0 : 6,
          },
          textStyle,
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  colContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    fontSize: 14,
  },
});
