import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';

export type VehicleTypeId = 'viagem' | 'moto' | 'taxi' | 'van';

interface VehicleTypeChipProps {
  id: VehicleTypeId;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  image?: number;
  selected: boolean;
  onPress: (id: VehicleTypeId) => void;
}

export default function VehicleTypeChip({ id, label, icon, image, selected, onPress }: VehicleTypeChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      activeOpacity={0.8}
      onPress={() => onPress(id)}
    >
      {image ? (
        // Moldura branca: os PNGs tem fundo branco, por isso ficam dentro
        // de um "cartao" arredondado que esconde a diferenca de fundo.
        <View style={styles.imageFrame}>
          <Image source={image} style={styles.image} resizeMode="contain" />
        </View>
      ) : (
        <Ionicons name={icon} size={20} color={selected ? colors.textInverse : 'rgba(255,255,255,0.75)'} />
      )}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginRight: spacing.sm,
  },
  chipSelected: { backgroundColor: 'rgba(15,169,104,0.25)', borderColor: colors.primary },
  imageFrame: {
    width: '100%',
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '90%', height: '90%' },
  label: { ...typography.captionMedium, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  labelSelected: { color: colors.textInverse },
});
