import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { requestOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isValidPhone = /^9\d{8}$/.test(phone.replace(/\s/g, ''));

  const handleContinue = async () => {
    if (!isValidPhone) {
      setError('Introduz um número angolano válido, ex: 923 456 789');
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    try {
      await requestOtp(`+244${phone.replace(/\s/g, '')}`);
      navigation.navigate('OtpVerification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer style={styles.container} theme="dark">
      <Ionicons name="chevron-back" size={26} color={colors.textInverse} onPress={() => navigation.goBack()} />

      <View style={styles.headerArea}>
        <Text style={styles.title}>Qual é o teu número?</Text>
        <Text style={styles.subtitle}>Vamos enviar-te um código por SMS para confirmar que és tu.</Text>
      </View>

      <Input
        label="Número de telefone"
        keyboardType="phone-pad"
        placeholder="923 456 789"
        value={phone}
        onChangeText={(t) => setPhone(t)}
        maxLength={9}
        error={error}
        leftIcon={<Text style={styles.prefix}>+244</Text>}
        autoFocus
      />

      <Button label="Receber código" onPress={handleContinue} loading={isSubmitting} disabled={phone.length === 0} style={styles.submitButton} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerArea: { marginTop: spacing.lg, marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.textInverse, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: 'rgba(255,255,255,0.7)' },
  prefix: { ...typography.bodyMedium, color: colors.textSecondary },
  submitButton: { marginTop: spacing.sm },
});
