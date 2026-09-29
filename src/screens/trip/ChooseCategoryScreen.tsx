import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LeafletMapView from '../../components/trip/RideMapView';
import PriceBreakdownModal from '../../components/trip/PriceBreakdownModal';
import NightSafetyModal from '../../components/trip/NightSafetyModal';
import PaymentMethodModal from '../../components/trip/PaymentMethodModal';
import { useTrip } from '../../contexts/TripContext';
import { useSettings } from '../../contexts/SettingsContext';
import { estimateTrip, vehicleCategories, paymentMethods, computeChangeKz, CATEGORY_AC_GUARANTEED } from '../../services/mockData';
import { buildScheduledDate, formatDateInput, formatTimeInput, isValidDateInput, isValidTimeInput } from '../../utils/format';
import { ComfortPreferenceId, PaymentMethodType, VehicleCategory } from '../../types';
import { HomeStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'ChooseCategory'>;
type ScheduleMode = 'now' | 'later';

const CATEGORY_COLORS: Record<VehicleCategory['id'], string> = {
  ango_taxi: colors.primary,
  ango_conforto: colors.teal,
  ango_executivo: colors.amber,
  ango_family: colors.pink,
  ango_moto: colors.primaryDark,
  ango_grupo: colors.pinkDark,
  ango_aeroporto: colors.teal,
  ango_tour: colors.amber,
  ango_acessivel: colors.primary,
};

// Cards maiores, estilo Yango: icone maior, badge de ETA colorido a
// sobrepor o icone, preco em destaque.
const CARD_WIDTH = 208;
const CARD_GAP = spacing.sm;

// Carros reais por categoria. As categorias sem imagem usam o icone vetorial.
const CATEGORY_IMAGES: Partial<Record<VehicleCategory['id'], number>> = {
  ango_taxi: require('../../../assets/images/car-taxi.png'),
  ango_conforto: require('../../../assets/images/car-conforto.png'),
  ango_executivo: require('../../../assets/images/car-executivo.png'),
  ango_family: require('../../../assets/images/car-familia.png'),
  ango_moto: require('../../../assets/images/car-moto.png'),
  ango_grupo: require('../../../assets/images/car-grupo.png'),
  ango_aeroporto: require('../../../assets/images/car-aeroporto.png'),
  ango_tour: require('../../../assets/images/car-turismo.png'),
  ango_acessivel: require('../../../assets/images/car-acessivel.png'),
};

const COMFORT_OPTIONS: { id: ComfortPreferenceId; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'silent', label: 'Ambiente silencioso', icon: 'volume-mute-outline' },
  { id: 'no_music', label: 'Sem musica', icon: 'musical-notes-outline' },
  { id: 'luggage_help', label: 'Ajuda com bagagem', icon: 'bag-outline' },
];

// Metodos de pagamento (seccao 14 do documento): icones usados no cartao
// "Como vais pagar?" desta tela e no PaymentMethodModal.
const PAYMENT_ICONS: Record<PaymentMethodType, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  wallet: 'wallet-outline',
  multicaixa_express: 'credit-card-outline',
  unitel_money: 'cellphone',
  card: 'credit-card-outline',
  cash: 'cash',
};

const SPLIT_CATEGORY_IDS = new Set(['ango_grupo', 'ango_family']);

// Airport Mode (seccao 41 do documento): terminal e ponto de recolha oficiais,
// para reduzir a ambiguidade que o documento identifica como fonte de
// extorsao no Aeroporto 4 de Fevereiro.
const AIRPORT_TERMINALS = ['Terminal Nacional', 'Terminal Internacional'];
const AIRPORT_PICKUP_POINTS = ['Zona de Chegadas', 'Zona de Partidas', 'Parque P3'];

// Modo Noturno (secao 44 do documento): entre as 22h e as 5h a viagem imediata
// mostra um aviso de protecao reforcada antes de seguir para o motorista.
function isNightTime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 22 || hour < 5;
}

export default function ChooseCategoryScreen({ navigation }: Props) {
  const {
    tripDraft, selectCategory, setScheduledFor, scheduleTrip, resetTripDraft,
    toggleComfortPreference, setSplitCount, setAirportPickup, setPaymentMethod,
  } = useTrip();
  const { autoShareTripEnabled, setAutoShareTripEnabled, womenModeEnabled } = useSettings();
  const {
    origin, destination, distanceKm, selectedCategoryId, stops, requestedForSomeoneElse,
    comfortPreferences, splitCount, airportPickup, paymentMethodType, cashNoteKz,
  } = tripDraft;

  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('now');
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [nightModalVisible, setNightModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  if (!destination) {
    navigation.goBack();
    return null;
  }

  // O cartao da primeira categoria aparece visualmente selecionado por defeito
  // (linha do selectedCategory abaixo), mas isso nao gravava nada no tripDraft
  // ate o utilizador tocar num cartao. Se o utilizador confirmava sem tocar,
  // selectedCategoryId ficava null e a viagem nunca era criada. Isto sincroniza
  // o draft com a categoria mostrada assim que o ecra abre.
  useEffect(() => {
    if (!selectedCategoryId) {
      selectCategory(vehicleCategories[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAirportTrip = origin.kind === 'airport' || destination.kind === 'airport';
  const selectedCategory = vehicleCategories.find((c) => c.id === selectedCategoryId) ?? vehicleCategories[0];
  const selectedEstimate = estimateTrip(distanceKm, selectedCategory.id);
  const routeColor = CATEGORY_COLORS[selectedCategory.id] ?? colors.primary;
  const supportsSplit = SPLIT_CATEGORY_IDS.has(selectedCategory.id);
  const perPersonKz = supportsSplit ? Math.ceil(selectedEstimate.priceKz / splitCount / 50) * 50 : selectedEstimate.priceKz;

  const paymentMethodLabel = paymentMethods.find((m) => m.type === paymentMethodType)?.label ?? 'Carteira AngoTour';
  const paymentChangeKz = paymentMethodType === 'cash' && cashNoteKz ? computeChangeKz(selectedEstimate.priceKz, cashNoteKz) : null;

  const airportSelectionComplete = !isAirportTrip || (!!airportPickup?.terminal && !!airportPickup?.pickupPoint);
  const scheduleIsValid = (scheduleMode === 'now' || (isValidDateInput(dateInput) && isValidTimeInput(timeInput))) && airportSelectionComplete;
  const showSafePickupNotice = !isAirportTrip && scheduleMode === 'now' && isNightTime();

  const handleCategoryPress = (category: VehicleCategory) => selectCategory(category.id);

  const handleModeChange = (mode: ScheduleMode) => {
    setScheduleMode(mode);
    if (mode === 'now') {
      setDateInput('');
      setTimeInput('');
    }
  };

  const handleSelectTerminal = (terminal: string) => {
    setAirportPickup({ terminal, pickupPoint: airportPickup?.pickupPoint ?? '' });
  };

  const handleSelectPickupPoint = (pickupPoint: string) => {
    setAirportPickup({ terminal: airportPickup?.terminal ?? '', pickupPoint });
  };

  const handleConfirmPayment = (type: PaymentMethodType, note?: number) => {
    setPaymentMethod(type, note);
  };

  const proceedNow = () => {
    setScheduledFor(null);
    navigation.navigate('RequestingDriver');
  };

  const handleConfirm = () => {
    if (isAirportTrip && !airportSelectionComplete) {
      Alert.alert('Falta o ponto de recolha', 'Escolhe o terminal e a zona de recolha para a viagem do aeroporto.');
      return;
    }

    if (scheduleMode === 'now') {
      if (isNightTime()) {
        setNightModalVisible(true);
        return;
      }
      proceedNow();
      return;
    }

    const scheduled = buildScheduledDate(dateInput, timeInput);
    if (!scheduled || scheduled.getTime() <= Date.now()) {
      Alert.alert('Data invalida', 'Escolhe uma data e hora futuras para agendar a viagem.');
      return;
    }

    setScheduledFor(scheduled);
    const created = scheduleTrip();
    if (!created) {
      Alert.alert('Nao foi possivel agendar', 'Confirma o destino e a categoria escolhida.');
      return;
    }

    resetTripDraft();
    Alert.alert(
      'Viagem agendada',
      `A tua viagem foi agendada para ${scheduled.toLocaleDateString('pt-AO')} as ${scheduled.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}. Acompanha em Viagens > Agendadas.`,
      [{ text: 'Entendido', onPress: () => navigation.popToTop() }]
    );
  };

  const handleNightEnableAndContinue = () => {
    setAutoShareTripEnabled(true);
    setNightModalVisible(false);
    proceedNow();
  };

  const handleNightContinueWithoutChange = () => {
    setNightModalVisible(false);
    proceedNow();
  };

  return (
    <ScreenContainer style={styles.container} edges={['left', 'right']}>
      <View style={styles.mapArea}>
        <LeafletMapView
          origin={origin.coordinates}
          destination={destination.coordinates}
          routeColor={routeColor}
          height={9999}
          style={styles.map}
          zoom={13}
        />
        <View style={styles.mapTopBar}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} onPress={() => navigation.goBack()} style={styles.backButton} />
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceBadgeText}>{distanceKm.toFixed(1)} km</Text>
        </View>
        {womenModeEnabled ? (
          <View style={styles.womenModeBadge}>
            <Ionicons name="female" size={12} color={colors.textInverse} />
            <Text style={styles.womenModeBadgeText}>Modo Mulher ativo</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Escolhe a categoria</Text>

        {(stops.length > 0 || requestedForSomeoneElse) ? (
          <View style={styles.summaryRow}>
            {requestedForSomeoneElse ? (
              <View style={styles.summaryChip}>
                <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.summaryChipText}>Para {requestedForSomeoneElse.name}</Text>
              </View>
            ) : null}
            {stops.length > 0 ? (
              <View style={styles.summaryChip}>
                <Ionicons name="flag-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.summaryChipText}>{stops.length} {stops.length > 1 ? 'paragens' : 'paragem'}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <FlatList
          data={vehicleCategories}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          renderItem={({ item }) => {
            const { priceKz } = estimateTrip(distanceKm, item.id);
            const isSelected = item.id === selectedCategory.id;
            const cardColor = CATEGORY_COLORS[item.id] ?? colors.primary;
            return (
              <TouchableOpacity
                style={[styles.card, isSelected && { borderColor: cardColor, backgroundColor: colors.surface }]}
                activeOpacity={0.85}
                onPress={() => handleCategoryPress(item)}
              >
                <View style={styles.cardTopRow}>
                  <View style={[styles.cardIconBadge, { backgroundColor: CATEGORY_IMAGES[item.id] ? 'transparent' : isSelected ? cardColor : colors.surfaceAlt }]}>
                    {CATEGORY_IMAGES[item.id] ? <Image source={CATEGORY_IMAGES[item.id]} style={styles.cardCarImage} resizeMode="contain" /> : <MaterialCommunityIcons name={item.icon} size={30} color={isSelected ? colors.textInverse : colors.textSecondary} />}
                  </View>
                  <View style={[styles.etaPill, { backgroundColor: isSelected ? cardColor : colors.surfaceAlt }]}>
                    <Ionicons name="time-outline" size={11} color={isSelected ? colors.textInverse : colors.textSecondary} />
                    <Text style={[styles.etaPillText, isSelected && { color: colors.textInverse }]}>{item.etaMinutes} min</Text>
                  </View>
                </View>

                <View style={styles.cardNameRow}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {CATEGORY_AC_GUARANTEED[item.id] ? (
                    <Ionicons name="snow-outline" size={14} color={colors.teal} style={{ marginLeft: 4 }} />
                  ) : null}
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>

                <View style={styles.cardFooterRow}>
                  <Text style={styles.cardPrice}>{priceKz.toLocaleString('pt-AO')} Kz</Text>
                  {isSelected ? <Ionicons name="checkmark-circle" size={18} color={cardColor} /> : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {isAirportTrip ? (
          <View style={styles.airportCard}>
            <View style={styles.airportCardHeader}>
              <Ionicons name="airplane" size={16} color={colors.ink} />
              <Text style={styles.airportCardTitle}>Pickup oficial - Aeroporto</Text>
            </View>
            <Text style={styles.airportCardLabel}>Terminal</Text>
            <View style={styles.airportChipsRow}>
              {AIRPORT_TERMINALS.map((terminal) => {
                const isActive = airportPickup?.terminal === terminal;
                return (
                  <TouchableOpacity
                    key={terminal}
                    style={[styles.airportChip, isActive && styles.airportChipActive]}
                    activeOpacity={0.8}
                    onPress={() => handleSelectTerminal(terminal)}
                  >
                    <Text style={[styles.airportChipText, isActive && styles.airportChipTextActive]}>{terminal}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.airportCardLabel}>Ponto de recolha</Text>
            <View style={styles.airportChipsRow}>
              {AIRPORT_PICKUP_POINTS.map((point) => {
                const isActive = airportPickup?.pickupPoint === point;
                return (
                  <TouchableOpacity
                    key={point}
                    style={[styles.airportChip, isActive && styles.airportChipActive]}
                    activeOpacity={0.8}
                    onPress={() => handleSelectPickupPoint(point)}
                  >
                    <Text style={[styles.airportChipText, isActive && styles.airportChipTextActive]}>{point}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {showSafePickupNotice ? (
          <View style={styles.safePickupCard}>
            <Ionicons name="flashlight-outline" size={16} color={colors.ink} />
            <Text style={styles.safePickupText}>
              Viagem noturna: sempre que possivel, espera num local iluminado e movimentado proximo da tua localizacao para o embarque.
            </Text>
          </View>
        ) : null}

        {supportsSplit ? (
          <View style={styles.splitCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.splitTitle}>Dividir pagamento</Text>
              <Text style={styles.splitSubtitle}>{perPersonKz.toLocaleString('pt-AO')} Kz por pessoa</Text>
            </View>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperButton}
                activeOpacity={0.75}
                onPress={() => setSplitCount(Math.max(1, splitCount - 1))}
              >
                <Ionicons name="remove" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{splitCount}</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                activeOpacity={0.75}
                onPress={() => setSplitCount(Math.min(selectedCategory.capacity, splitCount + 1))}
              >
                <Ionicons name="add" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <Text style={styles.comfortLabel}>Preferencias para esta viagem (opcional)</Text>
        <View style={styles.comfortRow}>
          {COMFORT_OPTIONS.map((option) => {
            const isActive = comfortPreferences.includes(option.id);
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.comfortChip, isActive && styles.comfortChipActive]}
                activeOpacity={0.8}
                onPress={() => toggleComfortPreference(option.id)}
              >
                <Ionicons name={option.icon} size={14} color={isActive ? colors.textInverse : colors.textSecondary} />
                <Text style={[styles.comfortChipText, isActive && styles.comfortChipTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.paymentCard} activeOpacity={0.85} onPress={() => setPaymentModalVisible(true)}>
          <View style={styles.paymentIconBadge}>
            <MaterialCommunityIcons name={PAYMENT_ICONS[paymentMethodType]} size={18} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentTitle}>Como vais pagar?</Text>
            <Text style={styles.paymentSubtitle}>
              {paymentMethodLabel}{paymentChangeKz !== null ? ` - troco ${paymentChangeKz.toLocaleString('pt-AO')} Kz` : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.scheduleToggle}>
          <TouchableOpacity
            style={[styles.scheduleOption, scheduleMode === 'now' && styles.scheduleOptionActive]}
            onPress={() => handleModeChange('now')}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={14} color={scheduleMode === 'now' ? colors.textInverse : colors.textSecondary} />
            <Text style={[styles.scheduleOptionText, scheduleMode === 'now' && styles.scheduleOptionTextActive]}>Agora</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scheduleOption, scheduleMode === 'later' && styles.scheduleOptionActive]}
            onPress={() => handleModeChange('later')}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar" size={14} color={scheduleMode === 'later' ? colors.textInverse : colors.textSecondary} />
            <Text style={[styles.scheduleOptionText, scheduleMode === 'later' && styles.scheduleOptionTextActive]}>Agendar</Text>
          </TouchableOpacity>
        </View>

        {scheduleMode === 'later' ? (
          <View style={styles.scheduleInputsRow}>
            <View style={{ flex: 1, marginRight: spacing.xs }}>
              <Input placeholder="DD/MM/AAAA" value={dateInput} onChangeText={(t) => setDateInput(formatDateInput(t))} keyboardType="number-pad" maxLength={10} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.xs }}>
              <Input placeholder="HH:MM" value={timeInput} onChangeText={(t) => setTimeInput(formatTimeInput(t))} keyboardType="number-pad" maxLength={5} />
            </View>
          </View>
        ) : null}

        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerSummary}>
            <View style={{ flex: 1 }}>
              <Text style={styles.footerLabel}>{selectedCategory.name}</Text>
              <TouchableOpacity style={styles.priceInfoRow} activeOpacity={0.7} onPress={() => setPriceModalVisible(true)}>
                <Ionicons name="information-circle-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.priceInfoText}>Como calculamos este preco?</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.footerPrice}>{selectedEstimate.priceKz.toLocaleString('pt-AO')} Kz</Text>
          </View>
          <Button
            label={scheduleMode === 'later' ? 'Agendar viagem' : 'Confirmar viagem'}
            onPress={handleConfirm}
            disabled={!scheduleIsValid}
          />
        </View>
      </View>

      <PriceBreakdownModal
        visible={priceModalVisible}
        onClose={() => setPriceModalVisible(false)}
        categoryName={selectedCategory.name}
        breakdown={selectedEstimate.breakdown}
      />

      <NightSafetyModal
        visible={nightModalVisible}
        autoShareAlreadyEnabled={autoShareTripEnabled}
        onEnableAndContinue={handleNightEnableAndContinue}
        onContinueWithoutChange={handleNightContinueWithoutChange}
      />

      <PaymentMethodModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        priceKz={selectedEstimate.priceKz}
        selectedType={paymentMethodType}
        selectedCashNoteKz={cashNoteKz}
        onConfirm={handleConfirmPayment}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapArea: { flex: 0.36 },
  map: { borderRadius: 0, height: undefined, flex: 1 },
  mapTopBar: { position: 'absolute', top: spacing.sm, left: spacing.md },
  backButton: { backgroundColor: colors.surface, borderRadius: radius.pill, padding: spacing.xs, overflow: 'hidden' },
  distanceBadge: { position: 'absolute', top: spacing.sm, right: spacing.md, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  distanceBadgeText: { ...typography.captionMedium, color: colors.textPrimary },
  womenModeBadge: { position: 'absolute', bottom: spacing.sm, left: spacing.md, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.pinkDark, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  womenModeBadgeText: { ...typography.tiny, color: colors.textInverse, marginLeft: 4 },
  sheet: {
    flex: 0.64, backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    marginTop: -radius.xl, paddingTop: spacing.md,
  },
  sheetTitle: { ...typography.subtitle, color: colors.textPrimary, paddingHorizontal: spacing.lg, marginBottom: spacing.xs },
  summaryRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  summaryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm, marginRight: spacing.xs },
  summaryChipText: { ...typography.tiny, color: colors.textSecondary, marginLeft: 4 },
  carouselContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: CARD_GAP },
  card: {
    width: CARD_WIDTH, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg,
    padding: spacing.md, backgroundColor: colors.surfaceAlt,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  cardIconBadge: { width: 96, height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cardCarImage: { width: 92, height: 52 },
  etaPill: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 8 },
  etaPillText: { ...typography.tiny, color: colors.textSecondary, marginLeft: 3, fontWeight: '600' as const },
  cardNameRow: { flexDirection: 'row', alignItems: 'center' },
  cardName: { ...typography.bodyMedium, color: colors.textPrimary, fontSize: 16 },
  cardDescription: { ...typography.tiny, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm, minHeight: 30 },
  cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrice: { ...typography.subtitle, color: colors.textPrimary },
  airportCard: { backgroundColor: colors.tealLight, borderRadius: radius.md, marginHorizontal: spacing.lg, padding: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.xs },
  airportCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  airportCardTitle: { ...typography.captionMedium, color: colors.ink, marginLeft: spacing.xxs },
  airportCardLabel: { ...typography.tiny, color: colors.ink, marginBottom: 4, marginTop: 2 },
  airportChipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  airportChip: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.sm, marginRight: spacing.xs, marginBottom: spacing.xxs, borderWidth: 1, borderColor: colors.border },
  airportChipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  airportChipText: { ...typography.tiny, color: colors.textPrimary },
  airportChipTextActive: { color: colors.textInverse },
  safePickupCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, marginHorizontal: spacing.lg, padding: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.xs },
  safePickupText: { ...typography.tiny, color: colors.textSecondary, marginLeft: spacing.xs, flex: 1 },
  splitCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, marginHorizontal: spacing.lg, padding: spacing.sm, marginTop: spacing.xs, marginBottom: spacing.xs },
  splitTitle: { ...typography.captionMedium, color: colors.textPrimary },
  splitSubtitle: { ...typography.tiny, color: colors.textSecondary, marginTop: 1 },
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepperButton: { width: 28, height: 28, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { ...typography.bodyMedium, color: colors.textPrimary, marginHorizontal: spacing.sm, minWidth: 16, textAlign: 'center' },
  comfortLabel: { ...typography.tiny, color: colors.textMuted, paddingHorizontal: spacing.lg, marginBottom: spacing.xxs },
  comfortRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, marginBottom: spacing.xs },
  comfortChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.sm, marginRight: spacing.xs, marginBottom: spacing.xs },
  comfortChipActive: { backgroundColor: colors.ink },
  comfortChipText: { ...typography.tiny, color: colors.textSecondary, marginLeft: 4 },
  comfortChipTextActive: { color: colors.textInverse },
  paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, marginHorizontal: spacing.lg, padding: spacing.sm, marginBottom: spacing.xs },
  paymentIconBadge: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  paymentTitle: { ...typography.captionMedium, color: colors.textPrimary },
  paymentSubtitle: { ...typography.tiny, color: colors.textSecondary, marginTop: 1 },
  scheduleToggle: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4, marginHorizontal: spacing.lg, marginBottom: spacing.xs },
  scheduleOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs, borderRadius: radius.sm },
  scheduleOptionActive: { backgroundColor: colors.ink },
  scheduleOptionText: { ...typography.captionMedium, color: colors.textSecondary, marginLeft: 6 },
  scheduleOptionTextActive: { color: colors.textInverse },
  scheduleInputsRow: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.xs },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  footerSummary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  footerLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  priceInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  priceInfoText: { ...typography.tiny, color: colors.textSecondary, marginLeft: 4, textDecorationLine: 'underline' },
  footerPrice: { ...typography.subtitle, color: colors.textPrimary },
});






