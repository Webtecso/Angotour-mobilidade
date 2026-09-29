import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QuickShortcut } from '../../types';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface QuickShortcutChipProps {
  shortcut: QuickShortcut;
  onPress: (shortcut: QuickShortcut) => void;
}

export default function QuickShortcutChip({ shortcut, onPress }: QuickShortcutChipProps) {
  return (
    <TouchableOpacity style={styles.chip} activeOpacity={0.75} onPress={() => onPress(shortcut)}>
      <Ionicons name={shortcut.icon} size={18} color={colors.ink} style={styles.icon} />
      <Text style={styles.label}>{shortcut.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginRight: spacing.sm,
  },
  icon: { marginRight: spacing.xxs },
  label: { ...typography.captionMedium, color: colors.textPrimary },
});
