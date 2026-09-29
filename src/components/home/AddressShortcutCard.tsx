import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QuickShortcut } from '../../types';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface AddressShortcutCardProps {
  shortcut: QuickShortcut;
  onPress: (shortcut: QuickShortcut) => void;
}

export default function AddressShortcutCard({ shortcut, onPress }: AddressShortcutCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.75} onPress={() => onPress(shortcut)}>
      <View style={styles.iconBadge}>
        <Ionicons name={shortcut.icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.label} numberOfLines={1}>{shortcut.label}</Text>
      <Text style={styles.action}>Adicionar</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm, alignItems: 'center' },
  iconBadge: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxs },
  label: { ...typography.captionMedium, color: colors.textPrimary },
  action: { ...typography.tiny, color: colors.primary, marginTop: 1 },
});
