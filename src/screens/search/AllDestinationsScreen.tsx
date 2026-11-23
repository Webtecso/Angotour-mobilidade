import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useTrip } from '../../contexts/TripContext';
import { fetchPopularDestinations, PopularDestination } from '../../services/backendApi';
import { haversineDistanceKm } from '../../utils/geo';
import { HomeStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'AllDestinations'>;

const DEST_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  airport: 'airplane-outline',
  place: 'location-outline',
  beach: 'water-outline',
  landmark: 'ribbon-outline',
  hotel: 'bed-outline',
  restaurant: 'restaurant-outline',
  culture: 'compass-outline',
  talatona: 'ribbon-outline',
  maianga: 'location-outline',
  ilha: 'water-outline',
  kilamba: 'business-outline',
  viana: 'trail-sign-outline',
};

export default function AllDestinationsScreen({ navigation }: Props) {
  const { tripDraft, setDestination } = useTrip();
  const [items, setItems] = useState<PopularDestination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchPopularDestinations()
      .then((list) => { if (alive) setItems(list); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const handleSelect = (dest: PopularDestination) => {
    const distanceKm = haversineDistanceKm(tripDraft.origin.coordinates, dest.coordinates);
    setDestination(
      { id: `popular-${dest.id}`, kind: 'custom', label: dest.title, address: dest.address, coordinates: dest.coordinates },
      distanceKm
    );
    navigation.navigate('ChooseCategory');
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} />
        <Text style={styles.header}>Destinos populares</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={items}
        ListEmptyComponent={<Text style={styles.cardMeta}>{loading ? 'A carregar...' : 'Sem destinos disponiveis de momento.'}</Text>}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.sm }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => handleSelect(item)}>
            <View style={styles.iconBadge}>
              <Ionicons name={DEST_ICONS[item.kind] ?? 'location-outline'} size={22} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.address}</Text>
            <View style={styles.timeRow}>
              <Ionicons name="navigate-outline" size={12} color={colors.textMuted} />
              <Text style={styles.timeText}>{haversineDistanceKm(tripDraft.origin.coordinates, item.coordinates).toFixed(1)} km</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  header: { ...typography.h3, color: colors.textPrimary },
  list: { paddingBottom: spacing.xxl, gap: spacing.sm },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  iconBadge: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  cardTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  cardMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  timeText: { ...typography.tiny, color: colors.textMuted, marginLeft: 4 },
});
