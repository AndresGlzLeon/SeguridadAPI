import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PriorityIndicator = ({ priority = 'high' }) => {
  const getBackgroundColor = () => {
    switch (priority) {
      case 'low':
        return '#10B981'; // green
      case 'medium':
        return '#F59E0B'; // orange
      case 'high':
      default:
        return '#EF4444'; // red
    }
  };

  const getText = () => {
    switch (priority) {
      case 'low':
        return 'PRIORIDAD \n BAJA';
      case 'medium':
        return 'PRIORIDAD \n MEDIA';
      case 'high':
      default:
        return 'PRIORIDAD \n ALTA';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <Text style={styles.text}>{getText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 8,
    minWidth: 47,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
  },
});

export default PriorityIndicator;