import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label, error, helperText, leftIcon, rightIcon, style, onFocus, onBlur, ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused, !!error && styles.inputContainerError]}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
          {...rest}
        />
        {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.xxs },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: spacing.md,
  },
  inputContainerFocused: { borderColor: colors.primary },
  inputContainerError: { borderColor: colors.danger },
  icon: { marginRight: spacing.xs },
  input: { flex: 1, paddingVertical: spacing.sm + 2, ...typography.body, color: colors.textPrimary },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.xxs },
  helperText: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xxs },
});
