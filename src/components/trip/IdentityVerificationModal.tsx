import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface IdentityVerificationModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'intro' | 'id_photo' | 'selfie' | 'processing' | 'done';

/**
 * Verificacao de Identidade (seccao 2.2 e 8-9 do documento): simula o envio
 * do BI + selfie de verificacao. Ao concluir, ativa o Selo "Utilizador
 * Verificado AngoTour" atraves de submitIdentityVerification (AuthContext).
 */
export default function IdentityVerificationModal({ visible, onClose }: IdentityVerificationModalProps) {
  const { submitIdentityVerification } = useAuth();
  const [step, setStep] = useState<Step>('intro');

  const handleClose = () => {
    setStep('intro');
    onClose();
  };

  const handleSubmit = async () => {
    setStep('processing');
    await submitIdentityVerification();
    setStep('done');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Verificacao de identidade</Text>
          <Ionicons name="close" size={24} color={colors.textMuted} onPress={handleClose} />
        </View>

        {step === 'intro' ? (
          <View style={styles.stepContent}>
            <View style={styles.iconBadge}>
              <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
            </View>
            <Text style={styles.stepTitle}>Torna-te um Utilizador Verificado</Text>
            <Text style={styles.stepText}>
              Precisamos de uma foto do teu documento de identificacao e uma selfie rapida.
              Isto aumenta a confianca dos motoristas e reduz fraudes.
            </Text>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={() => setStep('id_photo')}>
              <Text style={styles.primaryButtonText}>Comecar verificacao</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 'id_photo' ? (
          <View style={styles.stepContent}>
            <View style={styles.iconBadge}>
              <Ionicons name="card-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.stepTitle}>Foto do documento (BI)</Text>
            <Text style={styles.stepText}>Tira uma foto nitida do teu Bilhete de Identidade, com todos os dados legiveis.</Text>
            <TouchableOpacity style={styles.mockPhotoBox} activeOpacity={0.8} onPress={() => setStep('selfie')}>
              <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
              <Text style={styles.mockPhotoText}>Toca para simular a foto</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 'selfie' ? (
          <View style={styles.stepContent}>
            <View style={styles.iconBadge}>
              <Ionicons name="happy-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.stepTitle}>Selfie de verificacao</Text>
            <Text style={styles.stepText}>Confirma que a pessoa que usa esta conta corresponde ao documento enviado.</Text>
            <TouchableOpacity style={styles.mockPhotoBox} activeOpacity={0.8} onPress={handleSubmit}>
              <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
              <Text style={styles.mockPhotoText}>Toca para simular a selfie</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 'processing' ? (
          <View style={styles.stepContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.stepTitle, { marginTop: spacing.md }]}>A analisar os teus documentos...</Text>
          </View>
        ) : null}

        {step === 'done' ? (
          <View style={styles.stepContent}>
            <View style={[styles.iconBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
            </View>
            <Text style={styles.stepTitle}>Verificado com sucesso!</Text>
            <Text style={styles.stepText}>Ja es um Utilizador Verificado AngoTour. O teu selo vai aparecer no perfil e durante as viagens.</Text>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleClose}>
              <Text style={styles.primaryButtonText}>Concluir</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { ...typography.h3, color: colors.textPrimary },
  stepContent: { alignItems: 'center', marginTop: spacing.xl },
  iconBadge: { width: 60, height: 60, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  stepTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  stepText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg, paddingHorizontal: spacing.sm },
  primaryButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.xl, alignItems: 'center' },
  primaryButtonText: { ...typography.bodyMedium, color: colors.textInverse },
  mockPhotoBox: {
    width: '100%', height: 140, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
    backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  mockPhotoText: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
