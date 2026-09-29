import React from 'react';
import { StatusBar, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
  edges?: Edge[];
  style?: ViewStyle;
  statusBarStyle?: 'light-content' | 'dark-content';
  theme?: 'light' | 'dark';
}

const DARK_GRADIENT = [colors.ink, colors.inkDeep] as const;

export default function ScreenContainer({
  children,
  backgroundColor,
  edges = ['top', 'left', 'right'],
  style,
  statusBarStyle,
  theme = 'light',
}: ScreenContainerProps) {
  const isDark = theme === 'dark';
  const resolvedBg = backgroundColor ?? (isDark ? colors.inkDeep : colors.background);
  const resolvedStatusBar = statusBarStyle ?? (isDark ? 'light-content' : 'dark-content');

  const content = (
    <SafeAreaView style={[styles.safeArea, !isDark && { backgroundColor: resolvedBg }]} edges={edges}>
      <StatusBar barStyle={resolvedStatusBar} backgroundColor={resolvedBg} />
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );

  if (!isDark) return content;

  return (
    <LinearGradient colors={DARK_GRADIENT} style={styles.safeArea}>
      {content}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1 },
});
