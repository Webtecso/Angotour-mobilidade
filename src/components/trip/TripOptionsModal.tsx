import React from 'react';
import { Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComfortPreferenceId } from '../../types';
import { COMFORT_OPTIONS } from '../../constants/comfort';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface TripOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  comfortPreferences: ComfortPreferenceId[];
  onToggleComfort: (id: ComfortPreferenceId) => void;
  showSplit: boolean;
  splitCount: number;
  onChangeSplit: (count: number) => void;
  priceKz: number;
}

const MAX_SPLIT = 8;

export default function TripOptionsModal({
  visible, onClose, comfortPreferences, onToggleComfort, showSplit, splitCount, onChangeSplit, priceKz,
}: TripOptionsModalProps) {
  const perPerson = Math.ceil(priceKz / Math.max(splitCount, 1));

  const handleShareSplit = async () => {
    const message =
      'AngoTour: a tua parte da viagem e de ' + perPerson.toLocaleString('pt-AO') + ' Kz (total de ' +
      priceKz.toLocaleString('pt-AO') + ' Kz dividido por ' + splitCount + ' pessoas).';
    try {
      await Share.share({ message });
    } catch {
      // partilha cancelada ou indisponivel
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Preferencias da viagem</Text>
          <Ionicons name="close" size={24} color={colors.textMuted} onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionLabel}>Conforto</Text>
          <Text style={styles.sectionHint}>Aparecem como pedido especial na tua viagem.</Text>
          {COMFORT_OPTIONS.map((option) => {
            const isSelected = comfortPreferences.includes(option.id);
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                activeOpacity={0.8}
                onPress={() => onToggleComfort(option.id)}
              >
                <Ionicons name={option.icon} size={18} color={isSelected ? colors.primary : colors.ink} />
                <Text style={styles.optionText}>{option.label}</Text>
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={isSelected ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}

          {showSplit ? (
            <View style={styles.splitSection}>
              <Text style={styles.sectionLabel}>Dividir pagamento</Text>
              <Text style={styles.sectionHint}>
                O preco total da viagem nao muda. Partilha o valor de cada pessoa por mensagem.
              </Text>

              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepperButton, splitCount <= 1 && styles.stepperButtonDisabled]}
                  disabled={splitCount <= 1}
                  onPress={() => onChangeSplit(splitCount - 1)}
                >
                  <Ionicons name="remove" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.stepperValueBox}>
                  <Text style={styles.stepperValue}>{splitCount}</Text>
                  <Text style={styles.stepperLabel}>{splitCount === 1 ? 'pessoa' : 'pessoas'}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.stepperButton, splitCount >= MAX_SPLIT && styles.stepperButtonDisabled]}
                  disabled={splitCount >= MAX_SPLIT}
                  onPress={() => onChangeSplit(splitCount + 1)}
                >
                  <Ionicons name="add" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {splitCount > 1 ? (
                <View style={styles.splitResult}>
                  <Text style={styles.splitResultLabel}>Cada pessoa paga (arredondado)</Text>
                  <Text style={styles.splitResultValue}>{perPerson.toLocaleString('pt-AO')} Kz</Text>
                  <TouchableOpacity style={styles.shareButton} activeOpacity={0.85} onPress={handleShareSplit}>
                    <Ionicons name="share-social-outline" size={16} color={colors.primary} />
                    <Text style={styles.shareButtonText}>Partilhar valor por pessoa</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ) : null}

          <TouchableOpacity style={styles.doneButton} activeOpacity={0.85} onPress={onClose}>
            <Text style={styles.doneButtonText}>Concluir</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary },
  scroll: { paddingBottom: spacing.xxl },
  sectionLabel: { ...typography.subtitle, color: colors.textPrimary },
  sectionHint: { ...typography.caption, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm + 2, marginBottom: spacing.xs },
  optionRowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optionText: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1, marginLeft: spacing.sm },
  splitSection: { marginTop: spacing.lg },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  stepperButton: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  stepperButtonDisabled: { opacity: 0.4 },
  stepperValueBox: { minWidth: 90, alignItems: 'center', marginHorizontal: spacing.md },
  stepperValue: { ...typography.h2, color: colors.textPrimary },
  stepperLabel: { ...typography.caption, color: colors.textSecondary },
  splitResult: { backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  splitResultLabel: { ...typography.caption, color: colors.primaryDark },
  splitResultValue: { ...typography.h2, color: colors.primaryDark, marginVertical: spacing.xxs },
  shareButton: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  shareButtonText: { ...typography.captionMedium, color: colors.primary, marginLeft: spacing.xxs },
  doneButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center', marginTop: spacing.lg },
  doneButtonText: { ...typography.bodyMedium, color: colors.textInverse },
});
