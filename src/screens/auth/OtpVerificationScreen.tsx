import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OtpVerificationScreen({ navigation }: Props) {
  const { pendingPhone, verifyOtp, requestOtp } = useAuth();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (code.length === CODE_LENGTH) handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleVerify = async () => {
    setError(undefined);
    setIsSubmitting(true);
    try {
      const { isNewUser } = await verifyOtp(code);
      if (isNewUser) navigation.navigate('Register');
    } catch (e) {
      setError('Código inválido. Tenta novamente.');
      setCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || !pendingPhone) return;
    setSecondsLeft(RESEND_SECONDS);
    setCode('');
    await requestOtp(pendingPhone);
  };

  const digits = Array.from({ length: CODE_LENGTH }).map((_, i) => code[i] ?? '');

  return (
    <ScreenContainer style={styles.container} theme="dark">
      <Ionicons name="chevron-back" size={26} color={colors.textInverse} onPress={() => navigation.goBack()} />

      <View style={styles.headerArea}>
        <Text style={styles.title}>Introduz o código</Text>
        <Text style={styles.subtitle}>
          Enviámos um SMS de 6 dígitos para <Text style={styles.phoneHighlight}>{pendingPhone}</Text>
        </Text>
      </View>

      <Pressable onPress={() => inputRef.current?.focus()} style={styles.boxesRow}>
        {digits.map((digit, i) => (
          <View key={i} style={[styles.box, digit ? styles.boxFilled : undefined, !!error && styles.boxError]}>
            <Text style={styles.boxText}>{digit}</Text>
          </View>
        ))}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH))}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        style={styles.hiddenInput}
        autoFocus
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.resendRow}>
        {secondsLeft > 0 ? (
          <Text style={styles.resendMuted}>Reenviar código em 0:{String(secondsLeft).padStart(2, '0')}</Text>
        ) : (
          <Text style={styles.resendActive} onPress={handleResend}>Reenviar código</Text>
        )}
      </View>

      <Button label="Confirmar" onPress={handleVerify} loading={isSubmitting} disabled={code.length !== CODE_LENGTH} style={styles.submitButton} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerArea: { marginTop: spacing.lg, marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.textInverse, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: 'rgba(255,255,255,0.7)' },
  phoneHighlight: { color: colors.textInverse, fontFamily: typography.bodyMedium.fontFamily },
  boxesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  box: { width: 46, height: 56, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  boxFilled: { borderColor: colors.primary },
  boxError: { borderColor: colors.danger },
  boxText: { ...typography.h3, color: colors.textPrimary },
  hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
  resendRow: { marginTop: spacing.md, alignItems: 'center' },
  resendMuted: { ...typography.captionMedium, color: 'rgba(255,255,255,0.5)' },
  resendActive: { ...typography.captionMedium, color: colors.primary },
  submitButton: { marginTop: spacing.xl },
});
