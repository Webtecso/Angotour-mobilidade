import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { summarizeTrust } from '../../services/trustProfileStore';
import { useTripHistory } from '../../hooks/useBackendData';
import { colors, radius, spacing, typography } from '../../constants/theme';

export default function TrustProfileCard() {
  const { data, isRemote } = useTripHistory([]);
  const summary = summarizeTrust(data);
  const dash = '-';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>O teu perfil de confianca</Text>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{isRemote ? summary.completedTrips : dash}</Text>
          <Text style={styles.statLabel}>Viagens concluidas</Text>
        </View>
        <View style={styles.stat}>
          <View style={styles.ratingRow}>
            <Ionicons name="navigate-outline" size={16} color={colors.primary} />
            <Text style={styles.statValue}>{isRemote ? Math.round(summary.totalKm) + ' km' : dash}</Text>
          </View>
          <Text style={styles.statLabel}>Percorridos</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{isRemote ? Math.round(summary.cancellationRate * 100) + '%' : dash}</Text>
          <Text style={styles.statLabel}>Taxa de cancelamento</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  title: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  statValue: { ...typography.h3, color: colors.textPrimary, marginLeft: 2 },
  statLabel: { ...typography.tiny, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
});