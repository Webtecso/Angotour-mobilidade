import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Logo from '../../components/common/Logo';
import VehicleTypeChip, { VehicleTypeId } from '../../components/home/VehicleTypeChip';
import PopularDestinationCard from '../../components/home/PopularDestinationCard';
import RoutineSuggestionCard from '../../components/trip/RoutineSuggestionCard';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { useTrip } from '../../contexts/TripContext';
import { haversineDistanceKm } from '../../utils/geo';
import { fetchPopularDestinations, PopularDestination } from '../../services/backendApi';
import { SavedPlace } from '../../types';
import { HomeStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

const VEHICLE_TYPES: { id: VehicleTypeId; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; image: number }[] = [
  { id: 'viagem', label: 'Viagem', icon: 'car-sport', image: require('../../../assets/images/car-conforto.png') },
  { id: 'moto', label: 'Moto', icon: 'bicycle', image: require('../../../assets/images/car-moto.png') },
  { id: 'taxi', label: 'Táxi', icon: 'car', image: require('../../../assets/images/car-taxi.png') },
  { id: 'van', label: 'Van', icon: 'bus', image: require('../../../assets/images/car-familia.png') },
];

// Carrossel de destinos populares (secao "Destinos populares" da Home). Alguns
// ja tem fotografia propria; os restantes usam gradiente ate termos a foto.
// isSponsored fica pronto para futuras entradas de publicidade/patrocinio.
type PopularDestinationItem = PopularDestination;

// Icone por tipo de local (o tipo vem do painel, pagina Destinos).
const POPULAR_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  airport: 'airplane-outline',
  place: 'location-outline',
  beach: 'water-outline',
  landmark: 'ribbon-outline',
  hotel: 'bed-outline',
  restaurant: 'restaurant-outline',
  culture: 'compass-outline',
};

// Fotos que ja existem na app; os restantes locais usam o gradiente da marca.
function popularPhoto(title: string): number | undefined {
  const t = title.toLowerCase();
  if (t.includes('aeroporto')) return require('../../../assets/images/dest-aeroporto.jpg');
  if (t.includes('talatona')) return require('../../../assets/images/dest-talatona.jpg');
  if (t.includes('maianga')) return require('../../../assets/images/dest-maianga.jpg');
  return undefined;
}

const AUTO_SCROLL_INTERVAL_MS = 3500;
const CARD_WIDTH_WITH_GAP = 130 + spacing.sm;

const DARK_BG = '#07231C';

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const heroVideoPlayer = useVideoPlayer(require('../../../assets/videos/hero-background.mp4'), (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });
  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const [vehicleType, setVehicleType] = useState<VehicleTypeId>('viagem');

  const { currentPlace, isLoading: isLocating, permissionDenied, refresh: refreshLocation } = useLocation();
  const { setOrigin, setDestination, selectCategory, activeTrip } = useTrip();

  const [popular, setPopular] = useState<PopularDestinationItem[]>([]);
  const popularCountRef = useRef(0);
  const destinationsListRef = useRef<FlatList<PopularDestinationItem>>(null);
  const destinationIndexRef = useRef(0);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoScroll = () => {
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  };

  const startAutoScroll = () => {
    stopAutoScroll();
    autoScrollTimerRef.current = setInterval(() => {
      if (popularCountRef.current < 2) return;
      const next = (destinationIndexRef.current + 1) % popularCountRef.current;
      destinationIndexRef.current = next;
      destinationsListRef.current?.scrollToIndex({ index: next, animated: true });
    }, AUTO_SCROLL_INTERVAL_MS);
  };

  useEffect(() => {
    startAutoScroll();
    return stopAutoScroll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Destinos populares: a mesma fonte do painel (pagina Destinos).
  useEffect(() => {
    let alive = true;
    fetchPopularDestinations()
      .then((list) => {
        if (!alive) return;
        setPopular(list);
        popularCountRef.current = list.length;
        destinationIndexRef.current = 0;
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // reserva ativada: quando uma viagem ganha motorista (ou a app reabre com viagem em curso), abre o ecra da viagem
  useEffect(() => {
    if (navigation.isFocused() && activeTrip?.driver && activeTrip.status !== 'completed') navigation.navigate('TripInProgress');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrip?.id, activeTrip?.driver?.id]);

  useEffect(() => {
    setOrigin(currentPlace);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlace.address]);

  const VEHICLE_TYPE_TO_CATEGORY = {
    viagem: 'ango_conforto',
    moto: 'ango_moto',
    taxi: 'ango_taxi',
    van: 'ango_family',
  } as const;

  const handleVehicleTypePress = (id: VehicleTypeId) => {
    setVehicleType(id);
    selectCategory(VEHICLE_TYPE_TO_CATEGORY[id]);
    navigation.navigate('SearchDestination');
  };

  const handleSearchPress = () => navigation.navigate('SearchDestination');

  const handleRoutinePress = (place: SavedPlace) => {
    const distanceKm = haversineDistanceKm(currentPlace.coordinates, place.coordinates);
    setDestination(place, distanceKm);
    navigation.navigate('ChooseCategory');
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <VideoView
          player={heroVideoPlayer}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
        <LinearGradient
          colors={['rgba(7,35,28,0.2)', 'rgba(7,35,28,0.7)', DARK_BG]}
          locations={[0, 0.55, 1]}
          style={styles.heroOverlay}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.brandRow}>
              <Logo size="sm" light />
              <TouchableOpacity style={styles.avatarButton} activeOpacity={0.8}>
                <Ionicons name="person" size={18} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <Text style={styles.greeting}>Olá{firstName ? `, ${firstName}` : ''} 👋</Text>
            <Text style={styles.subGreeting}>Para onde vamos hoje?</Text>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.searchTitle}>A minha localização</Text>
              <Text style={styles.searchSubtitle} numberOfLines={1}>
                {isLocating ? 'A localizar...' : permissionDenied ? 'Ativa a localização para continuar' : currentPlace.address}
              </Text>
            </View>
            <TouchableOpacity onPress={refreshLocation} disabled={isLocating} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="locate" size={18} color={isLocating ? colors.textMuted : colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchDivider} />
          <TouchableOpacity style={styles.searchRow} activeOpacity={0.75} onPress={handleSearchPress}>
            <View style={[styles.dot, { backgroundColor: colors.danger }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.searchTitle}>Para onde vai?</Text>
              <Text style={styles.searchSubtitle}>Ex.: Aeroporto 4 de Fevereiro</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <RoutineSuggestionCard onPress={handleRoutinePress} />

        <View style={styles.chipsRow}>
          {VEHICLE_TYPES.map((v) => (
            <VehicleTypeChip key={v.id} id={v.id} label={v.label} icon={v.icon} image={v.image} selected={vehicleType === v.id} onPress={handleVehicleTypePress} />
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('MonthlyRequest')}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.35)', borderRadius: 16, padding: 14, marginBottom: 16 }}
        >
          <Ionicons name="calendar" size={22} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Mobilidade mensal</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>Transporte recorrente com mensalidade fixa</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Destinos populares</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllDestinations')}>
            <Text style={styles.sectionLink}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={destinationsListRef}
          data={popular}
          keyExtractor={(d) => d.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: spacing.lg }}
          getItemLayout={(_, index) => ({ length: CARD_WIDTH_WITH_GAP, offset: CARD_WIDTH_WITH_GAP * index, index })}
          onScrollBeginDrag={stopAutoScroll}
          onMomentumScrollEnd={startAutoScroll}
          onScrollToIndexFailed={() => {}}
          renderItem={({ item }) => (
            <PopularDestinationCard
              title={item.title}
              distanceKm={haversineDistanceKm(currentPlace.coordinates, item.coordinates)}
              icon={POPULAR_ICONS[item.kind] ?? 'location-outline'}
              image={popularPhoto(item.title)}
              isSponsored={false}
              onPress={handleSearchPress}
            />
          )}
        />

        <TouchableOpacity style={styles.safetyBanner} activeOpacity={0.85}>
          <View style={styles.safetyIconBadge}>
            <Ionicons name="shield-checkmark" size={22} color={colors.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>Viagem segura, sempre.</Text>
            <Text style={styles.safetySubtitle}>Motoristas verificados e suporte 24/7.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textInverse} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK_BG },
  hero: { width: '100%', height: 340 },
  heroOverlay: { flex: 1, paddingHorizontal: spacing.lg },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  avatarButton: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  greeting: { ...typography.h2, color: colors.textInverse, marginTop: spacing.lg },
  subGreeting: { ...typography.body, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  body: { flex: 1, marginTop: -70 },
  bodyContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  searchCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  searchTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  searchSubtitle: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  searchDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs, marginLeft: 18 },
  chipsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionHeader: { ...typography.subtitle, color: colors.textInverse },
  sectionLink: { ...typography.captionMedium, color: colors.primary },
  safetyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg },
  safetyIconBadge: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  safetyTitle: { ...typography.bodyMedium, color: colors.textInverse },
  safetySubtitle: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
});






