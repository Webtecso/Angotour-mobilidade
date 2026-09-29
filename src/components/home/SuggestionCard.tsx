import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { estimateTrip, SuggestedTrip } from '../../services/mockData';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface SuggestionCardProps {
  suggestion: SuggestedTrip;
  onPress: (suggestion: SuggestedTrip) => void;
}

export default function SuggestionCard({ suggestion, onPress }: SuggestionCardProps) {
  const { priceKz } = estimateTrip(suggestion.distanceKm, 'ango_taxi');
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(suggestion)}>
      <LinearGradient colors={[colors.ink, colors.inkSoft]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.iconBadge}>
          <Ionicons name="location" size={18} color={colors.textInverse} />
        </View>
        <View style={styles.textArea}>
          <Text style={styles.title}>{suggestion.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.75)" />
            <Text style={styles.metaText}>{suggestion.durationMinutes} min</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{priceKz.toLocaleString('pt-AO')} Kz</Text>
          </View>
        </View>
        <View style={styles.arrowBadge}>
          <Ionicons name="arrow-forward" size={16} color={colors.ink} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  iconBadge: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  textArea: { flex: 1 },
  title: { ...typography.bodyMedium, color: colors.textInverse },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  metaText: { ...typography.caption, color: 'rgba(255,255,255,0.8)', marginLeft: 4 },
  metaDot: { color: 'rgba(255,255,255,0.5)', marginHorizontal: 6 },
  arrowBadge: { width: 30, height: 30, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
