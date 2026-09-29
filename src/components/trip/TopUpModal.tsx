import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { startTopUp, confirmTopUp } from '../../services/walletStore';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface TopUpModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmed: () => void;
}

const AMOUNTS_KZ = [2000, 5000, 10000, 20000, 50000];

export default function TopUpModal({ visible, onClose, onConfirmed }: TopUpModalProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'confirmed'>('idle');

  const handleClose = () => {
    setAmount(null);
    setReference(null);
    setStatus('idle');
    onClose();
  };

  const handleStart = async () => {
    if (!amount) return;
    setStatus('processing');
    const topUp = await startTopUp(amount);
    setReference(topUp.reference);
    setTimeout(async () => {
      await confirmTopUp(topUp.id);
      setStatus('confirmed');
      onConfirmed();
    }, 1800);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Carregar carteira</Text>
          <Ionicons name="close" size={24} color={colors.textMuted} onPress={handleClose} />
        </View>

        {status === 'idle' ? (
          <>
            <Text style={styles.sectionLabel}>Quanto queres carregar?</Text>
            <View style={styles.amountsGrid}>
              {AMOUNTS_KZ.map((value) => {
                const isSelected = amount === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.amountCard, isSelected && styles.amountCardSelected]}
                    activeOpacity={0.8}
                    onPress={() => setAmount(value)}
                  >
                    <Text style={[styles.amountText, isSelected && styles.amountTextSelected]}>{value.toLocaleString('pt-AO')} Kz</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.confirmButton, !amount && styles.confirmButtonDisabled]}
              activeOpacity={0.85}
              disabled={!amount}
              onPress={handleStart}
            >
              <Text style={styles.confirmButtonText}>Gerar referencia Multicaixa</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.statusCard}>
            {status === 'processing' ? (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.statusTitle}>A processar pagamento...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
                <Text style={styles.statusTitle}>Carregamento confirmado</Text>
              </>
            )}
            <View style={styles.referenceBox}>
              <Text style={styles.referenceLabel}>Entidade</Text>
              <Text style={styles.referenceValue}>AngoTour</Text>
              <Text style={styles.referenceLabel}>Referencia</Text>
              <Text style={styles.referenceValue}>{reference}</Text>
              <Text style={styles.referenceLabel}>Valor</Text>
              <Text style={styles.referenceValue}>{amount?.toLocaleString('pt-AO')} Kz</Text>
            </View>
            {status === 'confirmed' ? (
              <TouchableOpacity style={styles.confirmButton} activeOpacity={0.85} onPress={handleClose}>
                <Text style={styles.confirmButtonText}>Concluir</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary },
  sectionLabel: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.sm },
  amountsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  amountCard: { width: '31%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', marginRight: '3.5%', marginBottom: spacing.sm },
  amountCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  amountText: { ...typography.bodyMedium, color: colors.textPrimary },
  amountTextSelected: { color: colors.primaryDark },
  confirmButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmButtonText: { ...typography.bodyMedium, color: colors.textInverse },
  statusCard: { alignItems: 'center', marginTop: spacing.xl },
  statusTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.lg },
  referenceBox: { width: '100%', backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  referenceLabel: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.xs },
  referenceValue: { ...typography.bodyMedium, color: colors.textPrimary },
});
