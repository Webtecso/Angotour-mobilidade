import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usersApi } from '../../services/api';
import { User } from '../../types';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onSaved: (updated: Partial<User>) => void;
}

function toDisplayDate(v: string): string {
  const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[3] + '/' + m[2] + '/' + m[1] : v;
}

function toIsoDate(v: string): string | undefined {
  const t = v.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? m[3] + '-' + m[2] + '-' + m[1] : undefined;
}

export default function EditPersonalDataModal({ visible, onClose, user, onSaved }: Props) {
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [birthDate, setBirthDate] = useState(toDisplayDate(user?.birthDate ?? ''));
  const [language, setLanguage] = useState<'pt' | 'en'>(user?.preferredLanguage === 'en' ? 'en' : 'pt');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFullName(user?.fullName ?? '');
    setEmail(user?.email ?? '');
    setBirthDate(toDisplayDate(user?.birthDate ?? ''));
    setLanguage(user?.preferredLanguage === 'en' ? 'en' : 'pt');
  }, [visible, user]);

  const handleSave = async () => {
    if (fullName.trim().length < 3) {
      Alert.alert('Nome invalido', 'O nome completo tem de ter pelo menos 3 caracteres.');
      return;
    }
    const typed = birthDate.trim();
    const isoBirthDate = toIsoDate(typed);
    if (typed && !isoBirthDate) {
      Alert.alert('Data invalida', 'Usa o formato DD/MM/AAAA.');
      return;
    }
    setSaving(true);
    try {
      const updated = await usersApi.update({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        birthDate: isoBirthDate,
        preferredLanguage: language,
      });
      onSaved({ fullName: updated?.fullName ?? fullName.trim(), email: updated?.email ?? undefined, birthDate: isoBirthDate, preferredLanguage: language } as Partial<User>);
      onClose();
    } catch (e) {
      Alert.alert('Nao foi possivel guardar', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Editar dados pessoais</Text>
          <Ionicons name="close" size={24} color={colors.textMuted} onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Nome completo</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="O teu nome" placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="opcional" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Data de nascimento</Text>
          <TextInput style={styles.input} value={birthDate} onChangeText={setBirthDate} placeholder="DD/MM/AAAA" placeholderTextColor={colors.textMuted} keyboardType="numbers-and-punctuation" />

          <Text style={styles.label}>Idioma</Text>
          <View style={styles.langRow}>
            {(['pt', 'en'] as const).map((lng) => (
              <TouchableOpacity key={lng} style={[styles.langChip, language === lng && styles.langChipActive]} onPress={() => setLanguage(lng)}>
                <Text style={[styles.langChipText, language === lng && styles.langChipTextActive]}>{lng === 'pt' ? 'Portugues' : 'English'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.hint}>O telefone nao pode ser editado aqui porque e o identificador de acesso a conta.</Text>

          <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} activeOpacity={0.85} disabled={saving} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{saving ? 'A guardar...' : 'Guardar alteracoes'}</Text>
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
  label: { ...typography.captionMedium, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xxs },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, ...typography.body, color: colors.textPrimary },
  langRow: { flexDirection: 'row' },
  langChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm },
  langChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langChipText: { ...typography.captionMedium, color: colors.textSecondary },
  langChipTextActive: { color: colors.textInverse },
  hint: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.lg },
  saveButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.lg },
  saveButtonDisabled: { backgroundColor: colors.borderStrong },
  saveButtonText: { ...typography.bodyMedium, color: colors.textInverse },
});