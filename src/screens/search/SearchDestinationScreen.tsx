import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LeafletMapView from '../../components/trip/RideMapView';
import { useTrip } from '../../contexts/TripContext';
import { recentPlaces } from '../../services/mockData';
import { useNearbyDrivers } from '../../hooks/useBackendData';
import { getFavoritePlaces, toggleFavoritePlace } from '../../services/favoritePlacesStore';
import { haversineDistanceKm } from '../../utils/geo';
import { Coordinates, SavedPlace } from '../../types';
import { HomeStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'SearchDestination'>;
type ForMode = 'me' | 'other';
type PickerMode = 'destination' | 'stop';

function buildDecorativeCars(center: Coordinates): Coordinates[] {
  const offsets = [
    { dLat: 0.004, dLng: 0.003 },
    { dLat: -0.003, dLng: 0.005 },
    { dLat: 0.002, dLng: -0.004 },
  ];
  return offsets.map((o) => ({ latitude: center.latitude + o.dLat, longitude: center.longitude + o.dLng }));
}

export default function SearchDestinationScreen({ navigation }: Props) {
  const { tripDraft, setDestination, addStop, removeStop, setRequestedForSomeoneElse } = useTrip();
  const [query, setQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<SavedPlace | null>(null);
  const [selectedDistanceKm, setSelectedDistanceKm] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>('destination');
  const [forMode, setForMode] = useState<ForMode>(tripDraft.requestedForSomeoneElse ? 'other' : 'me');
  const [otherName, setOtherName] = useState(tripDraft.requestedForSomeoneElse?.name ?? '');
  const [otherPhone, setOtherPhone] = useState(tripDraft.requestedForSomeoneElse?.phone ?? '');
  const [reference, setReference] = useState('');
  const [referenceVisible, setReferenceVisible] = useState(false);
  const [favorites, setFavorites] = useState<SavedPlace[]>([]);

  const stops = tripDraft.stops;

  useEffect(() => {
    getFavoritePlaces().then(setFavorites);
  }, []);

  const favoriteIds = new Set(favorites.map((f) => f.id));

  const displayedPlaces = query
    ? recentPlaces.filter((place) => place.label.toLowerCase().includes(query.trim().toLowerCase()))
    : [...favorites, ...recentPlaces.filter((p) => !favoriteIds.has(p.id))];

  const decorativeCars = buildDecorativeCars(tripDraft.origin.coordinates);
  const nearbyCars = useNearbyDrivers(tripDraft.origin.coordinates);
  const mapCars = nearbyCars.length > 0 ? nearbyCars : decorativeCars;

  const handlePreviewPlace = (place: SavedPlace) => {
    const distanceKm = haversineDistanceKm(tripDraft.origin.coordinates, place.coordinates);
    setSelectedPlace(place);
    setSelectedDistanceKm(distanceKm);
    setReference('');
    setReferenceVisible(false);
  };

  const handleSelectFromList = (place: SavedPlace) => {
    if (pickerMode === 'stop') {
      addStop(place);
      setPickerMode('destination');
      setQuery('');
      return;
    }
    handlePreviewPlace(place);
  };

  const handleToggleFavorite = async (place: SavedPlace) => {
    const updated = await toggleFavoritePlace(place);
    setFavorites(updated);
  };

  const handleSubmitSearch = async () => {
    const term = query.trim();
    if (!term) return;

    const localMatch = recentPlaces.find((p) => p.label.toLowerCase() === term.toLowerCase());
    if (localMatch) {
      handleSelectFromList(localMatch);
      return;
    }

    setIsSearching(true);
    try {
      const searchTerm = /angola/i.test(term) ? term : `${term}, Angola`;
      const results = await Location.geocodeAsync(searchTerm);
      // Bounding box generoso de Angola (inclui Cabinda) - descarta resultados
      // fora do pais, mesmo que o geocoder ignore o ", Angola" da query.
      const withinAngola = results.filter(
        (r) => r.latitude >= -18.5 && r.latitude <= -4.2 && r.longitude >= 11.4 && r.longitude <= 24.1
      );
      const best = withinAngola[0] ?? results[0];
      if (best) {
        const { latitude, longitude } = best;
        handleSelectFromList({
          id: 'search-' + Date.now(),
          kind: 'custom',
          label: term,
          address: term,
          coordinates: { latitude, longitude },
        });
      }
    } catch {
      // geocodificacao falhou (sem rede ou termo nao encontrado) - silenciosamente ignora
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedPlace) return;
    const destinationWithReference: SavedPlace = reference.trim()
      ? { ...selectedPlace, reference: reference.trim() }
      : selectedPlace;
    setDestination(destinationWithReference, selectedDistanceKm);
    navigation.navigate('ChooseCategory');
  };

  const handleEditOrigin = () => navigation.navigate('PickOnMap', { target: 'origin' });

  const syncOther = (name: string, phone: string) => {
    setRequestedForSomeoneElse(name.trim() && phone.trim() ? { name: name.trim(), phone: phone.trim() } : null);
  };

  const handleForModeChange = (mode: ForMode) => {
    setForMode(mode);
    if (mode === 'me') {
      setRequestedForSomeoneElse(null);
    } else {
      syncOther(otherName, otherPhone);
    }
  };

  const handleOtherNameChange = (text: string) => {
    setOtherName(text);
    if (forMode === 'other') syncOther(text, otherPhone);
  };

  const handleOtherPhoneChange = (text: string) => {
    setOtherPhone(text);
    if (forMode === 'other') syncOther(otherName, text);
  };

  const sectionHeaderText = isSearching
    ? 'A procurar...'
    : pickerMode === 'stop'
    ? 'Escolhe o local da paragem'
    : query
    ? 'Resultados'
    : 'Favoritos e locais recentes';

  return (
    <ScreenContainer style={styles.container} edges={['left', 'right']}>
      <View style={styles.mapArea}>
        <LeafletMapView
          origin={tripDraft.origin.coordinates}
          destination={selectedPlace?.coordinates ?? null}
          carMarkers={selectedPlace ? [] : mapCars}
          height={9999}
          style={styles.map}
          zoom={16}
        />
        <View style={styles.mapTopBar}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} style={styles.backButton} />
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.forRow}>
          <TouchableOpacity
            style={[styles.forChip, forMode === 'me' && styles.forChipActive]}
            onPress={() => handleForModeChange('me')}
            activeOpacity={0.8}
          >
            <Text style={[styles.forChipText, forMode === 'me' && styles.forChipTextActive]}>Para mim</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.forChip, forMode === 'other' && styles.forChipActive]}
            onPress={() => handleForModeChange('other')}
            activeOpacity={0.8}
          >
            <Ionicons name="people-outline" size={14} color={forMode === 'other' ? colors.textInverse : colors.textSecondary} />
            <Text style={[styles.forChipText, forMode === 'other' && styles.forChipTextActive, { marginLeft: 4 }]}>Para outra pessoa</Text>
          </TouchableOpacity>
        </View>

        {forMode === 'other' ? (
          <View style={styles.otherPersonCard}>
            <Input placeholder="Nome da pessoa" value={otherName} onChangeText={handleOtherNameChange} />
            <Input placeholder="Telefone (ex: 923 456 789)" value={otherPhone} onChangeText={handleOtherPhoneChange} keyboardType="phone-pad" />
          </View>
        ) : null}

        <View style={styles.locationsCard}>
          <TouchableOpacity style={styles.locationRow} activeOpacity={0.75} onPress={handleEditOrigin}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={styles.locationText} numberOfLines={1}>{tripDraft.origin.address}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.locationRow}>
            <View style={[styles.dot, { backgroundColor: colors.danger }]} />
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Digite o destino, bairro ou referencia"
                value={query}
                onChangeText={(t) => { setQuery(t); if (pickerMode === 'destination') setSelectedPlace(null); }}
                onSubmitEditing={handleSubmitSearch}
                returnKeyType="search"
              />
            </View>
          </View>
        </View>

        {stops.length > 0 ? (
          <View style={styles.stopsRow}>
            {stops.map((s) => (
              <View key={s.id} style={styles.stopChip}>
                <Ionicons name="ellipse" size={7} color={colors.amber} />
                <Text style={styles.stopChipText} numberOfLines={1}>{s.label}</Text>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} onPress={() => removeStop(s.id)} />
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.addStopButton}
          activeOpacity={0.8}
          onPress={() => { setPickerMode(pickerMode === 'stop' ? 'destination' : 'stop'); setQuery(''); }}
        >
          <Ionicons name={pickerMode === 'stop' ? 'close-circle-outline' : 'add-circle-outline'} size={16} color={colors.textSecondary} />
          <Text style={styles.addStopText}>{pickerMode === 'stop' ? 'Cancelar paragem' : 'Adicionar paragem'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mapPickButton} activeOpacity={0.8} onPress={() => navigation.navigate('PickOnMap', { target: 'destination' })}>
          <Ionicons name="map" size={16} color={colors.primary} />
          <Text style={styles.mapPickText}>Escolher com precisao no mapa</Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>{sectionHeaderText}</Text>

        <FlatList
          data={displayedPlaces}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum local encontrado. Tenta uma referencia conhecida, ex: "portao azul perto da escola".</Text>
          }
          renderItem={({ item }) => {
            const isSelected = pickerMode === 'destination' && selectedPlace?.id === item.id;
            const isFavorite = favoriteIds.has(item.id);
            return (
              <TouchableOpacity
                style={[styles.placeRow, isSelected && styles.placeRowSelected]}
                activeOpacity={0.8}
                onPress={() => handleSelectFromList(item)}
              >
                <View style={styles.placeIconBadge}>
                  <Ionicons name={isFavorite ? 'star' : 'location-outline'} size={18} color={isFavorite ? colors.amber : colors.ink} />
                </View>
                <View style={styles.placeTextArea}>
                  <Text style={styles.placeLabel}>{item.label}</Text>
                  <Text style={styles.placeAddress} numberOfLines={1}>{item.address}</Text>
                </View>
                <Ionicons
                  name={isFavorite ? 'star' : 'star-outline'}
                  size={18}
                  color={isFavorite ? colors.amber : colors.textMuted}
                  onPress={() => handleToggleFavorite(item)}
                  style={{ padding: 4, marginRight: isSelected ? spacing.xs : 0 }}
                />
                {isSelected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
              </TouchableOpacity>
            );
          }}
        />

        {selectedPlace && pickerMode === 'destination' ? (
          <View style={styles.confirmBar}>
            <View style={styles.confirmTopRow}>
              <View style={styles.confirmInfo}>
                <Text style={styles.confirmLabel}>{selectedPlace.label}</Text>
                <Text style={styles.confirmDistance}>{selectedDistanceKm.toFixed(1)} km de distancia</Text>
              </View>
              <Button label="Continuar" onPress={handleConfirm} fullWidth={false} style={styles.confirmButton} />
            </View>
            <TouchableOpacity style={styles.referenceToggle} activeOpacity={0.75} onPress={() => setReferenceVisible((v) => !v)}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.primary} />
              <Text style={styles.referenceToggleText} numberOfLines={1}>
                {reference ? `Referencia: ${reference}` : 'Adicionar ponto de referencia (opcional)'}
              </Text>
            </TouchableOpacity>
            {referenceVisible ? (
              <View style={{ marginTop: spacing.xxs }}>
                <Input
                  placeholder="Ex: portao azul ao lado da escola"
                  value={reference}
                  onChangeText={setReference}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapArea: { flex: 0.5 },
  map: { borderRadius: 0, height: undefined, flex: 1 },
  mapTopBar: { position: 'absolute', top: spacing.sm, left: spacing.md },
  backButton: { backgroundColor: colors.surface, borderRadius: radius.pill, padding: spacing.xs, overflow: 'hidden' },
  sheet: {
    flex: 0.5, backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    marginTop: -radius.xl, paddingHorizontal: spacing.lg, paddingTop: spacing.md,
  },
  forRow: { flexDirection: 'row', marginBottom: spacing.sm },
  forChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxs, paddingHorizontal: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, marginRight: spacing.xs },
  forChipActive: { backgroundColor: colors.ink },
  forChipText: { ...typography.captionMedium, color: colors.textSecondary },
  forChipTextActive: { color: colors.textInverse },
  otherPersonCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.sm },
  locationsCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs, marginLeft: 17 },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: spacing.sm },
  locationText: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
  stopsRow: { marginBottom: spacing.xs },
  stopChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.sm, marginBottom: 6 },
  stopChipText: { ...typography.caption, color: colors.textPrimary, flex: 1, marginLeft: spacing.xxs, marginRight: spacing.xs },
  addStopButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs, marginBottom: spacing.xs },
  addStopText: { ...typography.captionMedium, color: colors.textSecondary, marginLeft: spacing.xxs },
  mapPickButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs, marginBottom: spacing.sm },
  mapPickText: { ...typography.captionMedium, color: colors.primary, marginLeft: spacing.xxs },
  sectionHeader: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.sm },
  list: { paddingBottom: spacing.xxl },
  placeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, paddingHorizontal: spacing.xs },
  placeRowSelected: { backgroundColor: colors.primaryLight },
  placeIconBadge: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  placeTextArea: { flex: 1 },
  placeLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  placeAddress: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  emptyText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.md },
  confirmBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  confirmTopRow: { flexDirection: 'row', alignItems: 'center' },
  confirmInfo: { flex: 1 },
  confirmLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  confirmDistance: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  confirmButton: { paddingHorizontal: spacing.lg },
  referenceToggle: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  referenceToggleText: { ...typography.caption, color: colors.primary, marginLeft: spacing.xxs, flex: 1 },
});




