import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface ComingSoonNoticeProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
}

export default function ComingSoonNotice({ icon = 'construct-outline', title, description }: ComingSoonNoticeProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBadge}>
        <Ionicons name={icon} size={28} color={colors.ink} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  iconBadge: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs, textAlign: 'center' },
  description: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
