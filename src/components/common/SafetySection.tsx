import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../../contexts/SettingsContext';
import { colors, radius, spacing, typography } from '../../constants/theme';

export default function SafetySection() {
  const { womenModeEnabled, setWomenModeEnabled, autoShareTripEnabled, setAutoShareTripEnabled, emergencyContact, setEmergencyContact } = useSettings();
  const [contactName, setContactName] = useState(emergencyContact?.name ?? '');
  const [contactPhone, setContactPhone] = useState(emergencyContact?.phone ?? '');

  const handleSaveContact = () => {
    if (contactName.trim().length < 2 || contactPhone.trim().length < 9) return;
    setEmergencyContact({ name: contactName.trim(), phone: contactPhone.trim() });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerIconBadge}>
          <Ionicons name="shield-checkmark" size={18} color={colors.pinkDark} />
        </View>
        <Text style={styles.headerTitle}>Seguranca AngoTour</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.rowTextArea}>
          <Text style={styles.rowTitle}>Modo Mulher</Text>
          <Text style={styles.rowSubtitle}>Prioridade para motorista mulher e partilha automatica da viagem.</Text>
        </View>
        <Switch
          value={womenModeEnabled}
          onValueChange={setWomenModeEnabled}
          trackColor={{ true: colors.pinkDark, false: colors.borderStrong }}
          thumbColor={colors.surface}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.rowTextArea}>
          <Text style={styles.rowTitle}>Partilhar viagem automaticamente</Text>
          <Text style={styles.rowSubtitle}>Envia o percurso ao teu contacto de emergencia assim que a viagem comeca.</Text>
        </View>
        <Switch
          value={autoShareTripEnabled}
          onValueChange={setAutoShareTripEnabled}
          trackColor={{ true: colors.primary, false: colors.borderStrong }}
          thumbColor={colors.surface}
        />
      </View>

      <View style={styles.divider} />

      <Text style={styles.rowTitle}>Contacto de emergencia</Text>
      <Text style={[styles.rowSubtitle, { marginBottom: spacing.sm }]}>
        Quem deve receber um alerta se ativares o botao SOS.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nome do contacto"
        placeholderTextColor={colors.textMuted}
        value={contactName}
        onChangeText={setContactName}
        onBlur={handleSaveContact}
      />
      <TextInput
        style={styles.input}
        placeholder="Numero de telefone"
        placeholderTextColor={colors.textMuted}
        value={contactPhone}
        onChangeText={setContactPhone}
        onBlur={handleSaveContact}
        keyboardType="phone-pad"
      />

      {emergencyContact ? (
        <View style={styles.savedBadge}>
          <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
          <Text style={styles.savedText}>Contacto guardado: {emergencyContact.name}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  headerIconBadge: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.pinkLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  headerTitle: { ...typography.subtitle, color: colors.textPrimary },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  rowTextArea: { flex: 1, marginRight: spacing.sm },
  rowTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  rowSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  input: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm - 2, marginBottom: spacing.xs,
    ...typography.body, color: colors.textPrimary,
  },
  savedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xxs },
  savedText: { ...typography.caption, color: colors.primary, marginLeft: spacing.xxs },
});
