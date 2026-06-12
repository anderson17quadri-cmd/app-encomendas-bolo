import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../constants/theme';

interface StatusChipProps {
  status: string;
  large?: boolean;
}

export function StatusChip({ status, large }: StatusChipProps) {
  const color = Colors.status?.[status ?? ''] ?? Colors.textSecondary;

  return (
    <View style={[
      styles.chip,
      { backgroundColor: color + '26' },
      large && styles.chipLarge,
    ]}>
      <Text style={[
        styles.text,
        { color },
        large && styles.textLarge,
      ]}>
        {status ?? 'Desconhecido'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  chipLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  textLarge: {
    fontSize: 16,
  },
});
