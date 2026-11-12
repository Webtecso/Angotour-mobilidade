import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, Alert } from 'react-native';
import { walletRemote } from '../../services/backendApi';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface TopUpModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmed: () => void;
}

export default function TopUpModal({ visible, onClose, onConfirmed }: TopUpModalProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState('');
  const [topUpId, setTopUpId] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'pending' | 'confirmed'>('idle');

  const handleClose = () => {
    setAmount(null);
    setCustom('');
    setTopUpId(null);
    setReference(null);
    setStatus('idle');
    onClose();
  };

  const chosen = custom.trim() ? Number(custom) : 0;
  const valid = chosen >= 500 && chosen <= 500000;

  const handleStart = async () => {
    if (!valid) return;
    setAmount(chosen);
    setStatus('processing');
    try {
      const topUp = await walletRemote.startTopUp(chosen);
      setReference(topUp.reference);
      setTopUpId(topUp.id);
      setStatus('pending');
      onConfirmed();
    } catch (e) {
      setStatus('idle');
      Alert.alert('Nao foi possivel carregar', (e as Error).message);
    }
  };

  const handleDevConfirm = async () => {
    if (!topUpId) return;
    try {
      await walletRemote.devConfirmTopUp(topUpId);
      setStatus('confirmed');
      onConfirmed();
    } catch (e) {
      Alert.alert('Nao foi possivel confirmar', (e as Error).message);
    }
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
            <TextInput
              style={styles.input}
              value={custom}
              onChangeText={(t) => setCustom(t.replace(/\D/g, ''))}
              placeholder="Valor (500 a 500.000 Kz)"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity
              style={[styles.confirmButton, !valid && styles.confirmButtonDisabled]}
              activeOpacity={0.85}
              disabled={!valid}
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
                <Text style={styles.statusTitle}>A criar referencia...</Text>
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
            {status === 'pending' ? (
              <>
                <Text style={styles.statusTitle}>Paga a referencia para concluir</Text>
                {__DEV__ ? (
                  <TouchableOpacity style={styles.confirmButton} activeOpacity={0.85} onPress={handleDevConfirm}>
                    <Text style={styles.confirmButtonText}>Confirmar pagamento (dev)</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={{ marginTop: spacing.md }} onPress={handleClose}>
                  <Text style={styles.referenceLabel}>Fechar. O saldo atualiza quando o pagamento for confirmado.</Text>
                </TouchableOpacity>
              </>
            ) : null}
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
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, ...typography.body, color: colors.textPrimary, marginBottom: spacing.lg },
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
