import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VehicleCategory } from '../../types';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface CategoryGridItemProps {
  category: VehicleCategory;
  onPress: (category: VehicleCategory) => void;
}

export default function CategoryGridItem({ category, onPress }: CategoryGridItemProps) {
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.75} onPress={() => onPress(category)}>
      <View style={styles.iconBadge}>
        <MaterialCommunityIcons name={category.icon} size={24} color={colors.ink} />
      </View>
      <Text style={styles.label} numberOfLines={1}>{category.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: { width: '25%', alignItems: 'center', marginBottom: spacing.md },
  iconBadge: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxs },
  label: { ...typography.tiny, color: colors.textSecondary, textAlign: 'center' },
});
