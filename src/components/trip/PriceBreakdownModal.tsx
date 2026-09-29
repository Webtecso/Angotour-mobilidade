import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PriceBreakdown } from '../../types';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface PriceBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
  categoryName: string;
  breakdown: PriceBreakdown;
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, muted && styles.rowLabelMuted]}>{label}</Text>
      <Text style={[styles.rowValue, muted && styles.rowLabelMuted]}>{value}</Text>
    </View>
  );
}

export default function PriceBreakdownModal({ visible, onClose, categoryName, breakdown }: PriceBreakdownModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>Como calculamos este preco</Text>
            <Ionicons name="close" size={22} color={colors.textMuted} onPress={onClose} />
          </View>
          <Text style={styles.subtitle}>{categoryName}</Text>

          <View style={styles.card}>
            <Row label="Tarifa base" value={`${breakdown.tarifaBaseKz.toLocaleString('pt-AO')} Kz`} />
            <Row
              label={`Distancia (${breakdown.distanceKm.toFixed(1)} km)`}
              value={`${breakdown.distanceCostKz.toLocaleString('pt-AO')} Kz`}
            />
            <Row
              label={`Tempo estimado (${breakdown.durationMinutes} min)`}
              value={`${breakdown.durationCostKz.toLocaleString('pt-AO')} Kz`}
            />
            <View style={styles.divider} />
            <Row label="Subtotal" value={`${breakdown.subtotalKz.toLocaleString('pt-AO')} Kz`} muted />
            {breakdown.tarifaMinimaAplicada ? (
              <Row label="Tarifa minima aplicada" value={`${breakdown.tarifaMinimaKz.toLocaleString('pt-AO')} Kz`} muted />
            ) : null}
            <View style={styles.divider} />
            <Row label="Total" value={`${breakdown.finalPriceKz.toLocaleString('pt-AO')} Kz`} />
          </View>

          <View style={styles.protectedBox}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <Text style={styles.protectedText}>
              Preco protegido: uma vez confirmada a viagem, pagas sempre este valor - mesmo que o transito demore mais.
              Nunca aplicamos sobretaxas por hora de ponta ou procura.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(7,28,21,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xl },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.h3, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md },
  card: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { ...typography.body, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  rowLabelMuted: { color: colors.textSecondary },
  rowValue: { ...typography.bodyMedium, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  protectedBox: { flexDirection: 'row', backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.sm },
  protectedText: { ...typography.caption, color: colors.primaryDark, flex: 1, marginLeft: spacing.xs },
});
