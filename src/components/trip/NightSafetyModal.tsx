import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface NightSafetyModalProps {
  visible: boolean;
  autoShareAlreadyEnabled: boolean;
  onEnableAndContinue: () => void;
  onContinueWithoutChange: () => void;
}

export default function NightSafetyModal({
  visible, autoShareAlreadyEnabled, onEnableAndContinue, onContinueWithoutChange,
}: NightSafetyModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onContinueWithoutChange}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Ionicons name="moon" size={22} color={colors.ink} />
          </View>
          <Text style={styles.title}>Viagem noturna - protecao reforcada</Text>
          <Text style={styles.subtitle}>
            {autoShareAlreadyEnabled
              ? 'A partilha automatica ja esta ativa - o teu contacto de emergencia vai receber o percurso assim que a viagem comecar.'
              : 'Recomendamos ativar a partilha automatica da viagem para o teu contacto de emergencia acompanhar o percurso em tempo real.'}
          </Text>

          {!autoShareAlreadyEnabled ? (
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={onEnableAndContinue}>
              <Ionicons name="shield-checkmark" size={16} color={colors.textInverse} />
              <Text style={styles.primaryButtonText}>Ativar partilha automatica e continuar</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.75} onPress={onContinueWithoutChange}>
            <Text style={styles.secondaryButtonText}>{autoShareAlreadyEnabled ? 'Continuar' : 'Continuar sem alterar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(7,28,21,0.65)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center' },
  iconBadge: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2, marginBottom: spacing.xs },
  primaryButtonText: { ...typography.bodyMedium, color: colors.textInverse, marginLeft: spacing.xs },
  secondaryButton: { width: '100%', alignItems: 'center', paddingVertical: spacing.sm },
  secondaryButtonText: { ...typography.bodyMedium, color: colors.textSecondary },
});
