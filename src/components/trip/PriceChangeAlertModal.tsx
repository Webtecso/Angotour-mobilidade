import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface PriceChangeAlertModalProps {
  visible: boolean;
  onClose: () => void;
  originalPriceKz: number;
  proposedPriceKz: number;
  onAccept: () => void;
  onReport: () => void;
  onCancelProtected: () => void;
}

export default function PriceChangeAlertModal({
  visible, onClose, originalPriceKz, proposedPriceKz, onAccept, onReport, onCancelProtected,
}: PriceChangeAlertModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Ionicons name="warning" size={22} color={colors.danger} />
          </View>
          <Text style={styles.title}>O motorista esta a solicitar um valor diferente</Text>
          <Text style={styles.subtitle}>
            Isto nao deveria acontecer - o teu preco ficou protegido na confirmacao. Escolhe como queres proceder.
          </Text>

          <View style={styles.priceRow}>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Preco confirmado</Text>
              <Text style={styles.priceValueOk}>{originalPriceKz.toLocaleString('pt-AO')} Kz</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Valor pedido</Text>
              <Text style={styles.priceValueBad}>{proposedPriceKz.toLocaleString('pt-AO')} Kz</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.acceptButton} activeOpacity={0.85} onPress={onAccept}>
            <Text style={styles.acceptButtonText}>Aceitar alteracao</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reportButton} activeOpacity={0.85} onPress={onReport}>
            <Text style={styles.reportButtonText}>Reportar problema</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.85} onPress={onCancelProtected}>
            <Text style={styles.cancelButtonText}>Cancelar com protecao</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(7,28,21,0.65)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center' },
  iconBadge: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.dangerLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: spacing.lg },
  priceBox: { flex: 1, alignItems: 'center' },
  priceLabel: { ...typography.tiny, color: colors.textSecondary },
  priceValueOk: { ...typography.bodyMedium, color: colors.primary, marginTop: 2 },
  priceValueBad: { ...typography.bodyMedium, color: colors.danger, marginTop: 2 },
  acceptButton: { width: '100%', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center', marginBottom: spacing.xs },
  acceptButtonText: { ...typography.bodyMedium, color: colors.textPrimary },
  reportButton: { width: '100%', backgroundColor: colors.amberLight, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center', marginBottom: spacing.xs },
  reportButtonText: { ...typography.bodyMedium, color: '#8A5A00' },
  cancelButton: { width: '100%', backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  cancelButtonText: { ...typography.bodyMedium, color: colors.textInverse },
});
