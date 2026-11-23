import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { identityDocumentsApi } from '../../services/api';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface IdentityVerificationModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'intro' | 'bi_front' | 'bi_back' | 'selfie' | 'processing' | 'done';

const STEP_INFO: Record<Exclude<Step, 'intro' | 'processing' | 'done'>, { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; text: string; camera: ImagePicker.CameraType }> = {
  bi_front: {
    icon: 'card-outline',
    title: 'Foto do documento (BI) - frente',
    text: 'Tira uma foto nitida da frente do teu Bilhete de Identidade, com todos os dados legiveis.',
    camera: ImagePicker.CameraType.back,
  },
  bi_back: {
    icon: 'card-outline',
    title: 'Foto do documento (BI) - verso',
    text: 'Agora o verso do teu Bilhete de Identidade.',
    camera: ImagePicker.CameraType.back,
  },
  selfie: {
    icon: 'happy-outline',
    title: 'Selfie de verificacao',
    text: 'Confirma que a pessoa que usa esta conta corresponde ao documento enviado.',
    camera: ImagePicker.CameraType.front,
  },
};

/**
 * Verificacao de Identidade (seccao 2.2 e 8-9 do documento): BI (frente/verso) + selfie,
 * enviados para o servidor. NUNCA se auto-aprova - fica "pending" ate um revisor confirmar
 * no Admin. Ao concluir, ativa o Selo "Utilizador Verificado AngoTour" (AuthContext).
 */
const DOC_NAMES: Record<string, string> = { bi_front: 'BI (frente)', bi_back: 'BI (verso)', selfie: 'Selfie' };
const DOC_ORDER: Array<'bi_front' | 'bi_back' | 'selfie'> = ['bi_front', 'bi_back', 'selfie'];

export default function IdentityVerificationModal({ visible, onClose }: IdentityVerificationModalProps) {
  const { user, submitIdentityVerification, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>('intro');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [docs, setDocs] = useState<Array<{ type: string; status: string; rejectionReason: string | null }>>([]);
  const [loaded, setLoaded] = useState(false);

  // Ao abrir, le o estado real no servidor: salta o que ja foi aprovado e mostra o que foi rejeitado.
  useEffect(() => {
    if (!visible) return;
    setLoaded(false);
    void refreshProfile();
    identityDocumentsApi
      .list()
      .then((d) => setDocs(d as any))
      .catch(() => {})
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const todo = DOC_ORDER.filter((t) => {
    const d = docs.find((x) => x.type === t);
    return !loaded || !d || d.status === 'not_submitted' || d.status === 'rejected';
  });
  const rejectedDocs = docs.filter((d) => d.status === 'rejected');
  const nextAfter = (type: (typeof DOC_ORDER)[number]): Step => {
    const i = todo.indexOf(type);
    return i >= 0 && i < todo.length - 1 ? todo[i + 1] : 'processing';
  };
  const startFlow = () => {
    setError('');
    if (todo.length === 0) {
      void handleFinalSubmit();
      return;
    }
    setStep(todo[0]);
  };

  const handleClose = () => {
    setStep('intro');
    setError('');
    onClose();
  };

  const captureAndUpload = async (type: Exclude<Step, 'intro' | 'processing' | 'done'>, next: Step) => {
    setError('');
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('Precisamos de acesso a camara para continuar.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: STEP_INFO[type].camera,
      base64: true,
      quality: 0.5,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;

    setUploading(true);
    try {
      await identityDocumentsApi.submit(type, result.assets[0].base64);
      if (next === 'processing') {
        await handleFinalSubmit();
      } else {
        setStep(next);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setStep('processing');
    try {
      await submitIdentityVerification();
      setStep('done');
    } catch (e) {
      // Sem confirmacao do servidor nao ha "em analise": volta ao passo da selfie com o motivo.
      setError((e as Error).message || 'Nao foi possivel submeter. Tenta outra vez.');
      setStep('intro');
    }
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
              Precisamos de uma foto da frente e do verso do teu documento de identificacao, e uma selfie rapida.
              Isto aumenta a confianca dos motoristas e reduz fraudes. As fotos sao revistas por uma pessoa da
              equipa AngoTour antes de o selo ficar ativo.
            </Text>
            {rejectedDocs.length > 0 ? (
              <View style={{ marginBottom: spacing.md, width: '100%' }}>
                {rejectedDocs.map((d) => (
                  <Text key={d.type} style={styles.errorText}>
                    {(DOC_NAMES[d.type] ?? d.type) + ' rejeitado: ' + (d.rejectionReason ?? 'envia outra foto.')}
                  </Text>
                ))}
              </View>
            ) : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={startFlow}>
              <Text style={styles.primaryButtonText}>{todo.length === 0 ? 'Submeter para analise' : rejectedDocs.length > 0 ? 'Reenviar documentos' : 'Comecar verificacao'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 'bi_front' || step === 'bi_back' || step === 'selfie' ? (
          <View style={styles.stepContent}>
            <View style={styles.iconBadge}>
              <Ionicons name={STEP_INFO[step].icon} size={28} color={colors.primary} />
            </View>
            <Text style={styles.stepTitle}>{STEP_INFO[step].title}</Text>
            <Text style={styles.stepText}>{STEP_INFO[step].text}</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity
              style={styles.mockPhotoBox}
              activeOpacity={0.8}
              disabled={uploading}
              onPress={() =>
                captureAndUpload(step, nextAfter(step))
              }
            >
              {uploading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
                  <Text style={styles.mockPhotoText}>Toca para tirar a foto</Text>
                </>
              )}
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
            <View style={[styles.iconBadge, { backgroundColor: colors.amberLight }]}>
              <Ionicons name="time-outline" size={32} color={colors.amber} />
            </View>
            <Text style={styles.stepTitle}>Documentos em analise</Text>
            <Text style={styles.stepText}>
              Recebemos os teus documentos. Um revisor vai confirmar a tua identidade em breve - avisamos-te assim
              que o selo ficar ativo.
            </Text>
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
  errorText: { ...typography.caption, color: colors.danger, textAlign: 'center', marginBottom: spacing.sm },
  primaryButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.xl, alignItems: 'center' },
  primaryButtonText: { ...typography.bodyMedium, color: colors.textInverse },
  mockPhotoBox: {
    width: '100%', height: 140, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
    backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  mockPhotoText: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
