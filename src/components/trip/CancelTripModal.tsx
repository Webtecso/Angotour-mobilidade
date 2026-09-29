import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface CancelTripModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const REASONS = [
  'Motorista demora muito',
  'Mudei de planos',
  'Encontrei outro transporte',
  'Preco ou forma de pagamento',
  'Preocupacao de seguranca',
  'Outro motivo',
];

export default function CancelTripModal({ visible, onClose, onConfirm }: CancelTripModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');

  const handleConfirm = () => {
    if (!selected) return;
    const reason = selected === 'Outro motivo' && otherText.trim() ? otherText.trim() : selected;
    onConfirm(reason);
    setSelected(null);
    setOtherText('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Porque queres cancelar?</Text>
            <Ionicons name="close" size={22} color={colors.textMuted} onPress={onClose} />
          </View>
          <Text style={styles.subtitle}>Ajuda-nos a perceber o motivo - isto nao afeta viagens legitimas.</Text>

          {REASONS.map((reason) => {
            const isSelected = selected === reason;
            return (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonRow, isSelected && styles.reasonRowSelected]}
                activeOpacity={0.75}
                onPress={() => setSelected(reason)}
              >
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            );
          })}

          {selected === 'Outro motivo' ? (
            <TextInput
              style={styles.input}
              placeholder="Descreve rapidamente o motivo"
              placeholderTextColor={colors.textMuted}
              value={otherText}
              onChangeText={setOtherText}
            />
          ) : null}

          <TouchableOpacity
            style={[styles.confirmButton, !selected && styles.confirmButtonDisabled]}
            activeOpacity={0.85}
            disabled={!selected}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>Confirmar cancelamento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keepButton} activeOpacity={0.75} onPress={onClose}>
            <Text style={styles.keepButtonText}>Nao cancelar</Text>
          </TouchableOpacity>
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
  reasonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, paddingHorizontal: spacing.xs },
  reasonRowSelected: { backgroundColor: colors.primaryLight },
  radio: { width: 20, height: 20, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.primary },
  reasonText: { ...typography.body, color: colors.textPrimary },
  input: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.sm, ...typography.body, color: colors.textPrimary,
  },
  confirmButton: { backgroundColor: colors.danger, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center', marginTop: spacing.md },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmButtonText: { ...typography.bodyMedium, color: colors.textInverse },
  keepButton: { alignItems: 'center', paddingVertical: spacing.sm },
  keepButtonText: { ...typography.bodyMedium, color: colors.textSecondary },
});
