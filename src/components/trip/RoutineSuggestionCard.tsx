import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFavoritePlaces } from '../../services/favoritePlacesStore';
import { quickShortcuts } from '../../services/mockData';
import { SavedPlace } from '../../types';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface RoutineSuggestionCardProps {
  onPress: (place: SavedPlace) => void;
}

/**
 * Sugestao de rotina (seccao 4.3 do documento de produto). Por agora e uma
 * regra simples por hora do dia: de manha sugere o Trabalho, ao fim da tarde
 * sugere Casa. Usa os favoritos do utilizador; se nao existirem, usa os
 * atalhos de demonstracao. Quando houver historico real no backend, a regra
 * passa a basear-se nas viagens frequentes.
 */
function pickSuggestion(hour: number, places: SavedPlace[]): { place: SavedPlace; timeText: string } | null {
  const find = (kind: 'home' | 'work') =>
    places.find((p) => p.kind === kind) ?? quickShortcuts.find((s) => s.place?.kind === kind)?.place;

  if (hour >= 6 && hour < 10) {
    const place = find('work');
    return place ? { place, timeText: 'de manha' } : null;
  }
  if (hour >= 16 && hour < 20) {
    const place = find('home');
    return place ? { place, timeText: 'ao fim da tarde' } : null;
  }
  return null;
}

export default function RoutineSuggestionCard({ onPress }: RoutineSuggestionCardProps) {
  const [favorites, setFavorites] = useState<SavedPlace[]>([]);

  useEffect(() => {
    getFavoritePlaces().then(setFavorites);
  }, []);

  const suggestion = pickSuggestion(new Date().getHours(), favorites);
  if (!suggestion) return null;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => onPress(suggestion.place)}>
      <View style={styles.iconBadge}>
        <Ionicons name="time-outline" size={20} color={colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Normalmente vais para {suggestion.place.label} {suggestion.timeText}</Text>
        <Text style={styles.subtitle}>Toca para pedir agora</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, marginBottom: spacing.md },
  iconBadge: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  title: { ...typography.captionMedium, color: colors.textPrimary },
  subtitle: { ...typography.tiny, color: colors.textSecondary, marginTop: 2 },
});
