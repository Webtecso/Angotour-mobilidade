import React from 'react';
import {
  ActivityIndicator, GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View, ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary, text: colors.textInverse },
  secondary: { bg: colors.ink, text: colors.textInverse },
  outline: { bg: colors.transparent, text: colors.ink, border: colors.borderStrong },
  ghost: { bg: colors.transparent, text: colors.primary },
  danger: { bg: colors.danger, text: colors.textInverse },
};

export default function Button({
  label, onPress, variant = 'primary', size = 'lg', disabled = false, loading = false,
  leftIcon, rightIcon, fullWidth = true, style, testID,
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        {
          backgroundColor: variantStyle.bg,
          borderColor: variantStyle.border ?? 'transparent',
          borderWidth: variantStyle.border ? 1.5 : 0,
          width: fullWidth ? '100%' : undefined,
          opacity: isDisabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <Text style={[styles.label, { color: variantStyle.text }]} numberOfLines={1}>{label}</Text>
          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  md: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginHorizontal: spacing.xs },
  label: { ...typography.subtitle },
});
