import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import Button from '../../components/common/Button';
import LeafletMapView from '../../components/trip/RideMapView';
import { useTrip } from '../../contexts/TripContext';
import { haversineDistanceKm } from '../../utils/geo';
import { Coordinates } from '../../types';
import { HomeStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'PickOnMap'>;

export default function PickOnMapScreen({ navigation, route }: Props) {
  const target = route.params?.target ?? 'destination';
  const { tripDraft, setDestination, setOrigin } = useTrip();
  const [center, setCenter] = useState<Coordinates>(
    target === 'origin' ? tripDraft.origin.coordinates : tripDraft.origin.coordinates
  );
  const [address, setAddress] = useState(
    target === 'origin' ? tripDraft.origin.address : 'Arrasta o mapa para escolher'
  );
  const [isResolving, setIsResolving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const resolveAddress = async (coords: Coordinates) => {
    setIsResolving(true);
    try {
      const [result] = await Location.reverseGeocodeAsync(coords);
      const line = result ? [result.street, result.district ?? result.city].filter(Boolean).join(', ') : null;
      setAddress(line || 'Local sem nome conhecido');
    } catch {
      setAddress('Nao foi possivel identificar este local');
    } finally {
      setIsResolving(false);
    }
  };

  const handleCenterChange = (coords: Coordinates) => {
    setCenter(coords);
    resolveAddress(coords);
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Permissao de localizacao negada');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const coords: Coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCenter(coords);
      await resolveAddress(coords);
    } catch {
      setAddress('Nao foi possivel obter a localizacao atual');
    } finally {
      setIsLocating(false);
    }
  };

  const handleConfirm = () => {
    const place = { id: `map-pick-${Date.now()}`, kind: 'custom' as const, label: address, address, coordinates: center };

    if (target === 'origin') {
      setOrigin(place);
      navigation.goBack();
      return;
    }

    const distanceKm = haversineDistanceKm(tripDraft.origin.coordinates, center);
    setDestination(place, distanceKm);
    navigation.navigate('ChooseCategory');
  };

  return (
    <ScreenContainer style={styles.container} edges={['left', 'right']}>
      <LeafletMapView
        origin={tripDraft.origin.coordinates}
        initialCenter={center}
        onCenterChange={handleCenterChange}
        height={9999}
        style={styles.map}
        zoom={16}
      />

      <View style={styles.pinFixed} pointerEvents="none">
        <Ionicons name="location" size={40} color={colors.danger} />
      </View>

      <View style={styles.topBar}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} style={styles.backButton} />
        <Text style={styles.topBarTitle}>{target === 'origin' ? 'Escolher partida' : 'Escolher destino'}</Text>
      </View>

      <View style={styles.gpsButtonWrapper}>
        <Button
          label={isLocating ? 'A localizar...' : 'Usar minha localizacao atual'}
          onPress={handleUseCurrentLocation}
          disabled={isLocating}
          variant="outline"
        />
      </View>

      <View style={styles.bottomCard}>
        <Text style={styles.hint}>Arrasta o mapa para mover o pin, ou escreve/usa o GPS acima</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          {isResolving ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: spacing.xs }} />
          ) : (
            <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
          )}
        </View>
        <Button label="Confirmar este local" onPress={handleConfirm} disabled={isResolving || isLocating} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, borderRadius: 0, height: undefined },
  pinFixed: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -40 },
  topBar: { position: 'absolute', top: spacing.md, left: spacing.md, flexDirection: 'row', alignItems: 'center' },
  backButton: { backgroundColor: colors.surface, borderRadius: radius.pill, padding: spacing.xs, overflow: 'hidden' },
  topBarTitle: { ...typography.bodyMedium, color: colors.textPrimary, backgroundColor: colors.surface, marginLeft: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.pill },
  gpsButtonWrapper: { position: 'absolute', bottom: 200, left: spacing.lg, right: spacing.lg },
  bottomCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg },
  hint: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.sm },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  addressText: { ...typography.bodyMedium, color: colors.textPrimary, marginLeft: spacing.xs, flex: 1 },
});

