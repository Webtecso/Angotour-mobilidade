import React, { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import ComingSoonNotice from '../../components/common/ComingSoonNotice';
import AnchorTabs from '../../components/common/AnchorTabs';
import ReceiptModal from '../../components/trip/ReceiptModal';
import { useTrip } from '../../contexts/TripContext';
import { tripHistory, vehicleCategories, TripHistoryEntry } from '../../services/mockData';
import { useTripHistory } from '../../hooks/useBackendData';
import { colors, radius, spacing, typography } from '../../constants/theme';

const HISTORY_ANCHORS = [
  { id: 'recentes', label: 'Recentes' },
  { id: 'mes', label: 'Este mes' },
  { id: 'antigas', label: 'Mais antigas' },
];

function bucketOf(dateIso: string): 'recentes' | 'mes' | 'antigas' {
  const date = new Date(dateIso);
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 7) return 'recentes';
  if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) return 'mes';
  return 'antigas';
}

function formatDate(dateIso: string) {
  const date = new Date(dateIso);
  return date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function TripHistoryScreen() {
  const { scheduledTrips, cancelScheduledTrip } = useTrip();
  const { data: history } = useTripHistory(tripHistory);
  const hasScheduled = scheduledTrips.length > 0;

  const anchors = hasScheduled ? [{ id: 'agendadas', label: 'Agendadas' }, ...HISTORY_ANCHORS] : HISTORY_ANCHORS;
  const [activeAnchor, setActiveAnchor] = useState(anchors[0].id);
  const [receiptTrip, setReceiptTrip] = useState<TripHistoryEntry | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});

  const handleAnchorPress = (id: string) => {
    setActiveAnchor(id);
    const y = offsets.current[id] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(y - 8, 0), animated: true });
  };

  const handleCancelScheduled = (tripId: string) => {
    Alert.alert('Cancelar viagem agendada?', 'Esta acao nao pode ser desfeita.', [
      { text: 'Nao', style: 'cancel' },
      { text: 'Sim, cancelar', style: 'destructive', onPress: () => cancelScheduledTrip(tripId) },
    ]);
  };

  const grouped = HISTORY_ANCHORS.map((anchor) => ({
    ...anchor,
    trips: history.filter((t) => bucketOf(t.dateIso) === anchor.id),
  }));

  if (history.length === 0 && !hasScheduled) {
    return (
      <ScreenContainer style={styles.container}>
        <Text style={styles.header}>Atividade</Text>
        <ComingSoonNotice
          icon="time-outline"
          title="O teu historico vai aparecer aqui"
          description="Assim que fizeres a tua primeira viagem, vais poder consultar datas, valores, motoristas e recibos."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.header}>Atividade</Text>
      <AnchorTabs anchors={anchors} activeId={activeAnchor} onPress={handleAnchorPress} />

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {hasScheduled ? (
          <View onLayout={(e) => { offsets.current['agendadas'] = e.nativeEvent.layout.y; }} style={styles.section}>
            <Text style={styles.sectionTitle}>Agendadas</Text>
            {scheduledTrips.map((trip) => {
              const category = vehicleCategories.find((c) => c.id === trip.categoryId);
              const scheduledDate = trip.scheduledFor ? new Date(trip.scheduledFor) : null;
              return (
                <View key={trip.id} style={styles.scheduledCard}>
                  <View style={styles.tripIconBadge}>
                    <MaterialCommunityIcons name={category?.icon ?? 'car-outline'} size={20} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tripRoute} numberOfLines={1}>{trip.origin.address} para {trip.destination.address}</Text>
                    <Text style={styles.tripMeta}>
                      {scheduledDate ? scheduledDate.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Data por confirmar'}
                      {' - '}{trip.priceKz.toLocaleString('pt-AO')} Kz
                    </Text>
                    {trip.requestedForSomeoneElse ? (
                      <Text style={styles.forSomeoneText}>Para {trip.requestedForSomeoneElse.name}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => handleCancelScheduled(trip.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={22} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : null}

        {grouped.map((group) =>
          group.trips.length === 0 ? null : (
            <View
              key={group.id}
              onLayout={(e) => { offsets.current[group.id] = e.nativeEvent.layout.y; }}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>{group.label}</Text>
              {group.trips.map((trip) => {
                const category = vehicleCategories.find((c) => c.id === trip.categoryId);
                const isCancelled = trip.status === 'cancelled';
                return (
                  <TouchableOpacity
                    key={trip.id}
                    style={styles.tripCard}
                    activeOpacity={isCancelled ? 1 : 0.75}
                    disabled={isCancelled}
                    onPress={() => setReceiptTrip(trip)}
                  >
                    <View style={styles.tripIconBadge}>
                      <MaterialCommunityIcons name={category?.icon ?? 'car-outline'} size={20} color={colors.ink} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tripRoute} numberOfLines={1}>{trip.originLabel} para {trip.destinationLabel}</Text>
                      <Text style={styles.tripMeta}>{formatDate(trip.dateIso)} - {trip.distanceKm.toFixed(1)} km - {trip.driverName}</Text>
                      {isCancelled ? (
                        <Text style={styles.cancelledTag}>Cancelada</Text>
                      ) : (
                        <View style={styles.ratingRow}>
                          {trip.rating ? (
                            <>
                              <Ionicons name="star" size={12} color={colors.amber} />
                              <Text style={styles.ratingText}>{trip.rating.toFixed(1)} - </Text>
                            </>
                          ) : null}
                          <Text style={styles.receiptLinkText}>Ver recibo</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.tripPrice, isCancelled && styles.tripPriceCancelled]}>
                      {isCancelled ? '-' : `${trip.priceKz.toLocaleString('pt-AO')} Kz`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )
        )}
      </ScrollView>

      <ReceiptModal visible={!!receiptTrip} onClose={() => setReceiptTrip(null)} trip={receiptTrip} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  scroll: { paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  tripCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.sm,
  },
  scheduledCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: radius.lg,
    padding: spacing.sm, marginBottom: spacing.sm,
  },
  tripIconBadge: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  tripRoute: { ...typography.bodyMedium, color: colors.textPrimary },
  tripMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  forSomeoneText: { ...typography.tiny, color: colors.primaryDark, marginTop: 2 },
  cancelledTag: { ...typography.tiny, color: colors.danger, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ratingText: { ...typography.tiny, color: colors.textSecondary, marginLeft: 3 },
  receiptLinkText: { ...typography.tiny, color: colors.primary, textDecorationLine: 'underline' },
  tripPrice: { ...typography.bodyMedium, color: colors.textPrimary, marginLeft: spacing.sm },
  tripPriceCancelled: { color: colors.textMuted },
});

