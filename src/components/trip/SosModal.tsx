import React, { useEffect, useRef, useState } from 'react';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface SosModalProps {
  visible: boolean;
  onClose: () => void;
  driverName: string;
  vehiclePlate: string;
  tripId: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  onSent?: () => void;
}

const COUNTDOWN_SECONDS = 5;

export default function SosModal({
  visible, onClose, driverName, vehiclePlate, tripId, emergencyContactName, emergencyContactPhone, onSent,
}: SosModalProps) {
  const [phase, setPhase] = useState<'countdown' | 'sent'>('countdown');
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) return;
    setPhase('countdown');
    setSecondsLeft(COUNTDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('sent');
          onSent?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };

  const handleNotifyContact = () => {
    if (!emergencyContactPhone) return;
    const message = `Alerta AngoTour: ativei o SOS numa viagem com ${driverName} (${vehiclePlate}). Viagem ${tripId.slice(-6).toUpperCase()}.`;
    Linking.openURL(`sms:${emergencyContactPhone}?body=${encodeURIComponent(message)}`);
  };

  const sentAt = new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={handleCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {phase === 'countdown' ? (
            <>
              <View style={styles.iconBadgeDanger}>
                <Ionicons name="shield" size={28} color={colors.textInverse} />
              </View>
              <Text style={styles.title}>A enviar alerta SOS em {secondsLeft}s</Text>
              <Text style={styles.subtitle}>
                Vamos enviar a tua localizacao, os dados do motorista ({driverName}, {vehiclePlate}) e o percurso
                {emergencyContactName ? ` a ${emergencyContactName}` : ' aos contactos de emergencia'}.
              </Text>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.85}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.iconBadgeSuccess}>
                <Ionicons name="checkmark" size={28} color={colors.textInverse} />
              </View>
              <Text style={styles.title}>Alerta SOS enviado</Text>
              <Text style={styles.subtitle}>
                Enviado as {sentAt} (simulacao). Numa proxima fase isto liga a um backend real de emergencia e as autoridades locais.
              </Text>

              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={14} color={colors.danger} />
                  <Text style={styles.detailText}>Localizacao atual partilhada</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="car" size={14} color={colors.danger} />
                  <Text style={styles.detailText}>{driverName} - {vehiclePlate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="document-text" size={14} color={colors.danger} />
                  <Text style={styles.detailText}>Viagem {tripId.slice(-6).toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="eye" size={14} color={colors.danger} />
                  <Text style={styles.detailText}>Monitorizacao continua ativa ate ao fim da viagem</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.callButton} activeOpacity={0.85} onPress={() => Linking.openURL('tel:112')}>
                <Ionicons name="call" size={16} color={colors.textInverse} />
                <Text style={styles.callButtonText}>Ligar 112</Text>
              </TouchableOpacity>

              {emergencyContactPhone ? (
                <TouchableOpacity style={styles.smsButton} activeOpacity={0.85} onPress={handleNotifyContact}>
                  <Ionicons name="chatbubble-ellipses" size={16} color={colors.danger} />
                  <Text style={styles.smsButtonText}>Enviar SMS a {emergencyContactName ?? 'contacto de emergencia'}</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(7,28,21,0.75)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center' },
  iconBadgeDanger: { width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  iconBadgeSuccess: { width: 56, height: 56, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md },
  cancelButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  cancelButtonText: { ...typography.bodyMedium, color: colors.textPrimary },
  detailsBox: { width: '100%', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  detailText: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.xs },
  callButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger, borderRadius: radius.md, paddingVertical: spacing.sm, width: '100%', marginBottom: spacing.xs },
  callButtonText: { ...typography.bodyMedium, color: colors.textInverse, marginLeft: spacing.xs },
  smsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, paddingVertical: spacing.sm, width: '100%', marginBottom: spacing.xs, borderWidth: 1.5, borderColor: colors.danger },
  smsButtonText: { ...typography.captionMedium, color: colors.danger, marginLeft: spacing.xs },
  closeButton: { paddingVertical: spacing.sm },
  closeButtonText: { ...typography.captionMedium, color: colors.textSecondary },
});
