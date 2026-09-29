import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';

interface RouteDividerProps {
  color?: string;
  dotSize?: number;
  gap?: number;
  style?: ViewStyle;
  orientation?: 'horizontal' | 'vertical';
}

/** Elemento assinatura do AngoTour: linha pontilhada tipo rota de GPS. */
export default function RouteDivider({
  color = colors.border, dotSize = 4, gap = 6, style, orientation = 'horizontal',
}: RouteDividerProps) {
  const dotStyle = { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color };
  const dots = Array.from({ length: orientation === 'horizontal' ? 40 : 14 });

  return (
    <View style={[orientation === 'horizontal' ? styles.rowContainer : styles.colContainer, style]}>
      {dots.map((_, i) => (
        <View key={i} style={[dotStyle, orientation === 'horizontal' ? { marginRight: gap } : { marginBottom: gap }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: { flexDirection: 'row', overflow: 'hidden' },
  colContainer: { flexDirection: 'column', alignItems: 'center', overflow: 'hidden' },
});
