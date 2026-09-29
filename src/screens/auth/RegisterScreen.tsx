import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { PreferredLanguage } from '../../types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

function formatBirthDateInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) return day;
  if (digits.length <= 4) return day + '/' + month;
  return day + '/' + month + '/' + year;
}

export default function RegisterScreen({ navigation }: Props) {
  const { completeRegistration } = useAuth();
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [language, setLanguage] = useState<PreferredLanguage>('pt');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isValidDate = /^\d{2}\/\d{2}\/\d{4}$/.test(birthDate);
  const canSubmit = fullName.trim().length >= 3 && isValidDate;

  const handleBirthDateChange = (text: string) => {
    setBirthDate(formatBirthDateInput(text));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Confirma o teu nome completo e a data de nascimento (DD/MM/AAAA).');
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    try {
      const [day, month, year] = birthDate.split('/');
      await completeRegistration({ fullName: fullName.trim(), birthDate: `${year}-${month}-${day}`, preferredLanguage: language });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer style={styles.container} theme="dark">
      <Ionicons name="chevron-back" size={26} color={colors.textInverse} onPress={() => navigation.goBack()} />

      <View style={styles.headerArea}>
        <Text style={styles.title}>Falta pouco</Text>
        <Text style={styles.subtitle}>Cria o teu perfil AngoTour em menos de um minuto.</Text>
      </View>

      <Input label="Nome completo" placeholder="Ex: Maria da Conceicao" value={fullName} onChangeText={setFullName} autoCapitalize="words" />

      <Input
        label="Data de nascimento"
        placeholder="DD/MM/AAAA"
        value={birthDate}
        onChangeText={handleBirthDateChange}
        keyboardType="number-pad"
        maxLength={10}
        error={error}
      />

      <Text style={styles.label}>Idioma preferido</Text>
      <View style={styles.languageRow}>
        <LanguageOption label="Portugues" selected={language === 'pt'} onPress={() => setLanguage('pt')} />
        <LanguageOption label="English" selected={language === 'en'} onPress={() => setLanguage('en')} />
      </View>

      <Button label="Criar conta" onPress={handleSubmit} loading={isSubmitting} disabled={!canSubmit} style={styles.submitButton} />
    </ScreenContainer>
  );
}

function LanguageOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.languageOption, selected && styles.languageOptionSelected]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.languageText, selected && styles.languageTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerArea: { marginTop: spacing.lg, marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.textInverse, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: 'rgba(255,255,255,0.7)' },
  label: { ...typography.captionMedium, color: 'rgba(255,255,255,0.7)', marginBottom: spacing.xs },
  languageRow: { flexDirection: 'row', marginBottom: spacing.lg },
  languageOption: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', marginRight: spacing.sm },
  languageOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  languageText: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.7)' },
  languageTextSelected: { color: colors.primaryDark },
  submitButton: { marginTop: spacing.sm },
});
