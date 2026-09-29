import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VehicleScore } from '../../types';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface VehicleScoreBadgeProps {
  score: VehicleScore;
}

const ROWS: { key: keyof VehicleScore; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'safety', label: 'Seguranca', icon: 'shield-checkmark-outline' },
  { key: 'comfort', label: 'Conforto', icon: 'car-outline' },
  { key: 'cleanliness', label: 'Limpeza', icon: 'sparkles-outline' },
];

/**
 * Vehicle Score (seccao 33 do documento): mostra ao passageiro as notas de
 * seguranca, conforto e limpeza do veiculo/motorista. Puramente informativo -
 * nao influencia o preco fixo da viagem.
 */
export default function VehicleScoreBadge({ score }: VehicleScoreBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Padrao do veiculo</Text>
      {ROWS.map((row) => {
        const value = score[row.key];
        return (
          <View key={row.key} style={styles.row}>
            <Ionicons name={row.icon} size={14} color={colors.textSecondary} />
            <Text style={styles.rowLabel}>{row.label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(value / 5) * 100}%` }]} />
            </View>
            <Text style={styles.rowValue}>{value.toFixed(1)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  title: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  rowLabel: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.xs, width: 70 },
  barTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.surfaceAlt, marginHorizontal: spacing.xs, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  rowValue: { ...typography.tiny, color: colors.textSecondary, width: 24, textAlign: 'right' },
});
