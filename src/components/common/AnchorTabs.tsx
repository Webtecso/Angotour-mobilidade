import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

export interface AnchorItem {
  id: string;
  label: string;
}

interface AnchorTabsProps {
  anchors: AnchorItem[];
  activeId: string;
  onPress: (id: string) => void;
}

const TABS_HEIGHT = 44;

export default function AnchorTabs({ anchors, activeId, onPress }: AnchorTabsProps) {
  return (
    // Altura fixa + flexShrink 0: impede que o layout do ecra (cabecalho +
    // ScrollView vertical) esmague as abas ate ficarem cortadas ao meio.
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {anchors.map((anchor) => {
          const isActive = anchor.id === activeId;
          return (
            <TouchableOpacity
              key={anchor.id}
              style={[styles.chip, isActive && styles.chipActive]}
              activeOpacity={0.8}
              onPress={() => onPress(anchor.id)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]} numberOfLines={1}>
                {anchor.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { height: TABS_HEIGHT, flexGrow: 0, flexShrink: 0, marginBottom: spacing.sm },
  scroll: { flexGrow: 0, height: TABS_HEIGHT },
  row: { flexDirection: 'row', alignItems: 'center', height: TABS_HEIGHT, paddingRight: spacing.lg },
  chip: {
    flexShrink: 0,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.xs,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.captionMedium, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
});
