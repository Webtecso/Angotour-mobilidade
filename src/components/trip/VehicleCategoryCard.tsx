import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VehicleCategory } from '../../types';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface VehicleCategoryCardProps {
  category: VehicleCategory;
  selected?: boolean;
  priceKz?: number;
  onPress: (category: VehicleCategory) => void;
}

export default function VehicleCategoryCard({ category, selected = false, priceKz, onPress }: VehicleCategoryCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(category)} style={[styles.card, selected && styles.cardSelected]}>
      <View style={[styles.iconBadge, selected && styles.iconBadgeSelected]}>
        <MaterialCommunityIcons name={category.icon} size={26} color={selected ? colors.textInverse : colors.ink} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{category.name}</Text>
        <Text style={styles.description} numberOfLines={1}>{category.description}</Text>
        <Text style={styles.meta}>{category.etaMinutes} min · até {category.capacity} pessoas</Text>
      </View>
      {priceKz !== undefined ? <Text style={styles.price}>{priceKz.toLocaleString('pt-AO')} Kz</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.sm,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  iconBadge: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  iconBadgeSelected: { backgroundColor: colors.primary },
  info: { flex: 1 },
  name: { ...typography.subtitle, color: colors.textPrimary },
  description: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  meta: { ...typography.tiny, color: colors.textMuted, marginTop: 3 },
  price: { ...typography.subtitle, color: colors.textPrimary, marginLeft: spacing.xs },
});
