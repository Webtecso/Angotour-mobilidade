import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { paymentMethods, CASH_NOTES_KZ, computeChangeKz } from '../../services/mockData';
import { PaymentMethodType } from '../../types';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface PaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
  priceKz: number;
  selectedType: PaymentMethodType;
  selectedCashNoteKz?: number;
  onConfirm: (type: PaymentMethodType, cashNoteKz?: number) => void;
}

const PAYMENT_ICONS: Record<PaymentMethodType, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  wallet: 'wallet-outline',
  multicaixa_express: 'credit-card-outline',
  unitel_money: 'cellphone',
  card: 'credit-card-outline',
  cash: 'cash',
};

export default function PaymentMethodModal({
  visible, onClose, priceKz, selectedType, selectedCashNoteKz, onConfirm,
}: PaymentMethodModalProps) {
  const [pendingType, setPendingType] = useState<PaymentMethodType>(selectedType);
  const [pendingNote, setPendingNote] = useState<number | undefined>(selectedCashNoteKz);

  const handleSelectType = (type: PaymentMethodType) => {
    setPendingType(type);
    if (type !== 'cash') setPendingNote(undefined);
  };

  const handleConfirm = () => {
    onConfirm(pendingType, pendingType === 'cash' ? pendingNote : undefined);
    onClose();
  };

  const canConfirm = pendingType !== 'cash' || !!pendingNote;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Como vais pagar?</Text>
          <Ionicons name="close" size={24} color={colors.textMuted} onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {paymentMethods.map((method) => {
            const isSelected = pendingType === method.type;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.methodRow, isSelected && styles.methodRowSelected]}
                activeOpacity={0.8}
                onPress={() => handleSelectType(method.type)}
              >
                <View style={styles.methodIconBadge}>
                  <MaterialCommunityIcons name={PAYMENT_ICONS[method.type]} size={20} color={colors.ink} />
                </View>
                <Text style={styles.methodLabel}>{method.label}</Text>
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={isSelected ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}

          {pendingType === 'cash' ? (
            <View style={styles.cashCard}>
              <Text style={styles.cashCardTitle}>Troco Inteligente</Text>
              <Text style={styles.cashCardSubtitle}>Com que nota vais pagar? O motorista ja vai saber quanto de troco precisa.</Text>
              <View style={styles.notesRow}>
                {CASH_NOTES_KZ.map((note) => {
                  const isValid = note >= priceKz;
                  const isSelected = pendingNote === note;
                  return (
                    <TouchableOpacity
                      key={note}
                      style={[styles.noteChip, isSelected && styles.noteChipSelected, !isValid && styles.noteChipDisabled]}
                      activeOpacity={0.8}
                      disabled={!isValid}
                      onPress={() => setPendingNote(note)}
                    >
                      <Text style={[styles.noteChipText, isSelected && styles.noteChipTextSelected]}>{note.toLocaleString('pt-AO')} Kz</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {pendingNote ? (
                <View style={styles.changeRow}>
                  <Ionicons name="cash-outline" size={16} color={colors.primaryDark} />
                  <Text style={styles.changeText}>
                    Troco necessario: {computeChangeKz(priceKz, pendingNote).toLocaleString('pt-AO')} Kz
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        <TouchableOpacity
          style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
          activeOpacity={0.85}
          disabled={!canConfirm}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary },
  scroll: { paddingBottom: spacing.lg },
  methodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.xs },
  methodRowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  methodIconBadge: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  methodLabel: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
  cashCard: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.sm },
  cashCardTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  cashCardSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },
  notesRow: { flexDirection: 'row', flexWrap: 'wrap' },
  noteChip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: spacing.sm, marginRight: spacing.xs, marginBottom: spacing.xs },
  noteChipSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  noteChipDisabled: { opacity: 0.35 },
  noteChipText: { ...typography.caption, color: colors.textPrimary },
  noteChipTextSelected: { color: colors.textInverse },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  changeText: { ...typography.captionMedium, color: colors.primaryDark, marginLeft: spacing.xxs },
  confirmButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center', marginBottom: spacing.md },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmButtonText: { ...typography.bodyMedium, color: colors.textInverse },
});
