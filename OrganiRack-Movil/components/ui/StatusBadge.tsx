/**
 * COMPONENTE: StatusBadge
 * 
 * Propósito: Mostrar estados con ícono de forma formal (success, error, warning, info)
 * Uso: <StatusBadge status="success" label="Confirmado" />
 * 
 * Props:
 * - status: 'success' | 'error' | 'warning' | 'info'
 * - label: texto a mostrar
 * - size: 'sm' | 'md' | 'lg'
 * - style: estilos personalizados
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info';
  label: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const STATUS_CONFIG = {
  success: {
    icon: 'check-circle',
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  error: {
    icon: 'close-circle',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  warning: {
    icon: 'alert',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  info: {
    icon: 'information',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
};

const SIZE_MAP = {
  sm: 14,
  md: 16,
  lg: 18,
};

const FONT_SIZE_MAP = {
  sm: 12,
  md: 13,
  lg: 14,
};

export default function StatusBadge({
  status,
  label,
  size = 'md',
  style,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const iconSize = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={config.icon as any}
        size={iconSize}
        color={config.color}
      />
      <Text
        style={[
          styles.label,
          {
            color: config.color,
            fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  label: {
    fontWeight: '700',
  },
});
