import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import Button from '../../components/common/Button';
import NetworkStatusBanner from '../../components/common/NetworkStatusBanner';
import { useTrip } from '../../contexts/TripContext';
import { useSettings } from '../../contexts/SettingsContext';
import LiveRouteMapView from '../../components/trip/LiveRideMapView';
import SosModal from '../../components/trip/SosModal';
import CancelTripModal from '../../components/trip/CancelTripModal';
import PriceChangeAlertModal from '../../components/trip/PriceChangeAlertModal';
import VehicleScoreBadge from '../../components/trip/VehicleScoreBadge';
import TripDetailsModal from '../../components/trip/TripDetailsModal';
import { recordTripEvent } from '../../services/tripEventStore';
import { useAuth } from '../../contexts/AuthContext';
import { ComfortPreferenceId, PaymentMethodType } from '../../types';
import { HomeStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripInProgress'>;

const COMFORT_LABELS: Record<ComfortPreferenceId, string> = {
  silent: 'Ambiente silencioso',
  no_music: 'Sem musica',
  luggage_help: 'Ajuda com bagagem',
};

const COMFORT_ICONS: Record<ComfortPreferenceId, React.ComponentProps<typeof Ionicons>['name']> = {
  silent: 'volume-mute-outline',
  no_music: 'musical-notes-outline',
  luggage_help: 'bag-outline',
};

// Comunicacao com Motorista (seccao 13 do documento): mensagens rapidas
// pre-definidas, sem precisar de escrever - registadas no Evidence Vault.
const QUICK_MESSAGES = ['Estou a chegar', 'Estou no portao', 'Um minuto, por favor', 'Pode buzinar'];

const PAYMENT_LABELS: Record<PaymentMethodType, string> = {
  wallet: 'Carteira AngoTour',
  multicaixa_express: 'Multicaixa Express',
  unitel_money: 'Unitel Money',
  card: 'Cartao',
  cash: 'Dinheiro',
};

const PAYMENT_ICONS: Record<PaymentMethodType, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  wallet: 'wallet-outline',
  multicaixa_express: 'credit-card-outline',
  unitel_money: 'cellphone',
  card: 'credit-card-outline',
  cash: 'cash',
};

export default function TripInProgressScreen({ navigation }: Props) {
  const { activeTrip, beginRide, completeTrip, cancelTrip, updateActiveTripPrice } = useTrip();
  const { emergencyContact, autoShareTripEnabled, womenModeEnabled } = useSettings();
  const { user } = useAuth();
  const [sosVisible, setSosVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [priceChangeVisible, setPriceChangeVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [proposedPrice, setProposedPrice] = useState(0);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  // Selo de Trajeto Limpo: distancia real da rota (OSRM) capturada assim que
  // o troco origem->destino fica pronto, para comparar com a estimativa.
  const [actualDistanceKm, setActualDistanceKm] = useState<number | null>(null);

  useEffect(() => {
    if (!activeTrip || !activeTrip.driver) {
      navigation.popToTop();
    }
  }, [activeTrip, navigation]);

  if (!activeTrip || !activeTrip.driver) {
    return null;
  }

  const { driver, boardingCode, status, destination, etaMinutes } = activeTrip;
  const isArriving = status === 'driver_assigned';
  const showWomenModeBanner = womenModeEnabled && driver.gender === 'female';

  const handleRouteReady = (distanceKm: number) => {
    if (!isArriving) setActualDistanceKm(distanceKm);
  };

  const handleConfirmCancel = async (reason: string) => {
    setCancelModalVisible(false);
    const risk = await cancelTrip(reason);
    navigation.popToTop();
    if (risk === 'suspeito') {
      Alert.alert(
        'Cancelamento registado',
        'Notamos varios cancelamentos recentes na tua conta. A tua prioridade de atribuicao pode ser reduzida temporariamente.'
      );
    } else if (risk === 'monitorizar') {
      Alert.alert('Cancelamento registado', 'A tua viagem foi cancelada. Estamos a monitorizar o padrao de cancelamentos da tua conta.');
    }
  };

  const handlePrimaryAction = () => {
    if (isArriving) {
      beginRide();
    } else {
      completeTrip(actualDistanceKm ?? undefined);
      navigation.replace('TripCompleted');
    }
  };

  const handleShare = () => {
    Alert.alert(
      'Viagem partilhada',
      autoShareTripEnabled
        ? `${emergencyContact?.name ?? 'O teu contacto de emergencia'} ja recebe automaticamente o percurso (partilha automatica ativa).`
        : 'Link da viagem copiado (simulacao). Ativa a partilha automatica em Perfil > Seguranca AngoTour.'
    );
  };

  const handleSimulatePriceChange = () => {
    const newProposed = Math.round((activeTrip.priceKz * 1.2) / 50) * 50;
    setProposedPrice(newProposed);
    recordTripEvent(activeTrip.id, 'price_change_proposed', { originalPriceKz: activeTrip.priceKz, proposedPriceKz: newProposed }).catch(() => {});
    setPriceChangeVisible(true);
  };

  const handleAcceptPriceChange = () => {
    updateActiveTripPrice(proposedPrice);
    recordTripEvent(activeTrip.id, 'price_change_accepted', { proposedPriceKz: proposedPrice }).catch(() => {});
    setPriceChangeVisible(false);
  };

  const handleReportPriceChange = () => {
    setPriceChangeVisible(false);
    recordTripEvent(activeTrip.id, 'price_change_reported', { proposedPriceKz: proposedPrice }).catch(() => {});
    Alert.alert('Problema reportado', 'Registamos a tentativa de alteracao de preco (simulacao). A nossa equipa de confianca vai analisar este motorista.');
  };

  const handleCancelProtected = async () => {
    setPriceChangeVisible(false);
    await cancelTrip();
    navigation.popToTop();
    Alert.alert('Viagem cancelada', 'Cancelaste com protecao - isto nao conta como cancelamento penalizavel.');
  };

  const handleSosSent = () => {
    recordTripEvent(activeTrip.id, 'sos_triggered', { driverId: driver.id, vehiclePlate: driver.vehiclePlate }).catch(() => {});
  };

  const handleQuickMessage = (message: string) => {
    setSentMessage(message);
    recordTripEvent(activeTrip.id, 'quick_message_sent', { message }).catch(() => {});
    Alert.alert('Mensagem enviada', message + ' foi enviado a ' + driver.fullName + ' (simulacao).');
  };

  return (
    <ScreenContainer style={styles.container}>
      <NetworkStatusBanner />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{isArriving ? 'Motorista encontrado!' : 'A caminho do destino'}</Text>
          <TouchableOpacity style={styles.sosButton} onPress={() => setSosVisible(true)}>
            <Ionicons name="shield" size={14} color={colors.textInverse} />
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </View>
        <LiveRouteMapView
          key={status}
          from={isArriving ? driver.coordinates : activeTrip.origin.coordinates}
          to={isArriving ? activeTrip.origin.coordinates : destination.coordinates}
          height={200}
          style={{ marginBottom: spacing.md }}
          onRouteReady={handleRouteReady}
          durationMs={Math.min(90000, Math.max(30000, (isArriving ? activeTrip.etaMinutes : activeTrip.durationMinutes) * 12000))}
        />

        <Text style={styles.headerSubtitle}>
          {isArriving ? `Chega em ${etaMinutes} min` : `${etaMinutes} min - ${destination.address}`}
        </Text>

        {showWomenModeBanner ? (
          <View style={styles.womenModeBanner}>
            <Ionicons name="female" size={16} color={colors.pinkDark} />
            <Text style={styles.womenModeBannerText}>Modo Mulher ativo - motorista mulher e monitorizacao reforcada nesta viagem.</Text>
          </View>
        ) : null}

        <View style={styles.driverCard}>
          <View style={styles.driverRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{driver.fullName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.driverName}>{driver.fullName}</Text>
              <Text style={styles.driverMeta}>{driver.rating.toFixed(1)} - {driver.vehicleModel} - {driver.vehiclePlate}</Text>
            </View>
          </View>

          <View style={styles.verifiedRow}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            <Text style={styles.verifiedText}>Identidade e matricula confirmadas</Text>
          </View>
          {user?.isVerified ? (
            <View style={styles.passengerVerifiedRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.textSecondary} />
              <Text style={styles.passengerVerifiedText}>Tu es um Passageiro Verificado</Text>
            </View>
          ) : null}
        </View>

        <VehicleScoreBadge score={driver.vehicleScore} />

        <Text style={styles.quickMessagesTitle}>Mensagens rapidas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickMessagesRow} contentContainerStyle={{ paddingRight: spacing.lg }}>
          {QUICK_MESSAGES.map((msg) => (
            <TouchableOpacity
              key={msg}
              style={[styles.quickMessageChip, sentMessage === msg && styles.quickMessageChipSent]}
              activeOpacity={0.8}
              onPress={() => handleQuickMessage(msg)}
            >
              <Text style={[styles.quickMessageChipText, sentMessage === msg && styles.quickMessageChipTextSent]}>{msg}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeTrip.comfortPreferences && activeTrip.comfortPreferences.length > 0 ? (
          <View style={styles.comfortCard}>
            <Text style={styles.comfortCardTitle}>Pedido especial para o motorista</Text>
            <View style={styles.comfortCardRow}>
              {activeTrip.comfortPreferences.map((pref) => (
                <View key={pref} style={styles.comfortTag}>
                  <Ionicons name={COMFORT_ICONS[pref]} size={12} color={colors.textSecondary} />
                  <Text style={styles.comfortTagText}>{COMFORT_LABELS[pref]}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {activeTrip.airportPickup ? (
          <View style={styles.airportCard}>
            <Ionicons name="airplane" size={16} color={colors.ink} />
            <Text style={styles.airportCardText}>
              {activeTrip.airportPickup.terminal} - {activeTrip.airportPickup.pickupPoint}
            </Text>
          </View>
        ) : null}

        <View style={styles.priceCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.priceLabel}>{activeTrip.splitCount && activeTrip.splitCount > 1 ? 'Valor total da viagem' : 'Valor da viagem'}</Text>
            <Text style={styles.priceValue}>{activeTrip.priceKz.toLocaleString('pt-AO')} Kz</Text>
            {activeTrip.splitCount && activeTrip.splitCount > 1 ? (
              <Text style={styles.splitHint}>
                {Math.ceil(activeTrip.priceKz / activeTrip.splitCount / 50) * 50} Kz por pessoa ({activeTrip.splitCount})
              </Text>
            ) : null}
          </View>
          <View style={styles.protectedBadge}>
            <Ionicons name="shield-checkmark" size={13} color={colors.primaryDark} />
            <Text style={styles.protectedBadgeText}>Protegido</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleSimulatePriceChange}>
          <Text style={styles.demoLink}>Simular alteracao de preco (teste)</Text>
        </TouchableOpacity>

        <View style={styles.paymentCard}>
          <View style={styles.paymentIconBadge}>
            <MaterialCommunityIcons name={PAYMENT_ICONS[activeTrip.paymentMethodType]} size={16} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentLabel}>{PAYMENT_LABELS[activeTrip.paymentMethodType]}</Text>
            {activeTrip.paymentMethodType === 'cash' && activeTrip.changeKz !== undefined ? (
              <Text style={styles.paymentSubtext}>Troco a preparar: {activeTrip.changeKz.toLocaleString('pt-AO')} Kz</Text>
            ) : null}
          </View>
        </View>

        {(activeTrip.destination.reference || activeTrip.destination.referencePhotoUri) ? (
          <View style={styles.referenceCard}>
            {activeTrip.destination.referencePhotoUri ? (
              <Image source={{ uri: activeTrip.destination.referencePhotoUri }} style={styles.referencePhoto} />
            ) : (
              <Ionicons name="chatbubble-ellipses" size={16} color={colors.ink} />
            )}
            <Text style={styles.referenceCardText}>{activeTrip.destination.reference || 'Foto de referencia anexada'}</Text>
          </View>
        ) : null}

        <View style={styles.boardingCard}>
          <Text style={styles.boardingLabel}>Codigo de embarque</Text>
          <Text style={styles.boardingCode}>{boardingCode}</Text>
          <Text style={styles.boardingHint}>Diz este numero ao motorista antes de entrares no veiculo.</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryAction} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryActionText}>Partilhar viagem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryAction, { marginRight: 0 }]} onPress={() => Linking.openURL(`tel:${driver.phone}`)}>
            <Ionicons name="call-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryActionText}>Contactar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.detailsLink} activeOpacity={0.75} onPress={() => setDetailsVisible(true)}>
          <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.detailsLinkText}>Ver detalhes da viagem</Text>
        </TouchableOpacity>

        <Button label={isArriving ? 'Confirmar embarque' : 'Concluir viagem'} onPress={handlePrimaryAction} style={{ marginTop: spacing.sm }} />
        <Button label="Cancelar viagem" variant="outline" onPress={() => setCancelModalVisible(true)} style={{ marginTop: spacing.sm }} />
      </ScrollView>

      <SosModal
        visible={sosVisible}
        onClose={() => setSosVisible(false)}
        driverName={driver.fullName}
        vehiclePlate={driver.vehiclePlate}
        tripId={activeTrip.id}
        emergencyContactName={emergencyContact?.name}
        emergencyContactPhone={emergencyContact?.phone}
        onSent={handleSosSent}
      />

      <CancelTripModal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        onConfirm={handleConfirmCancel}
      />

      <PriceChangeAlertModal
        visible={priceChangeVisible}
        onClose={() => setPriceChangeVisible(false)}
        originalPriceKz={activeTrip.priceKz}
        proposedPriceKz={proposedPrice}
        onAccept={handleAcceptPriceChange}
        onReport={handleReportPriceChange}
        onCancelProtected={handleCancelProtected}
      />

      <TripDetailsModal visible={detailsVisible} onClose={() => setDetailsVisible(false)} tripId={activeTrip.id} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  headerSubtitle: { ...typography.body, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md },
  sosButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.danger, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill },
  sosButtonText: { ...typography.captionMedium, color: colors.textInverse, marginLeft: 4 },
  womenModeBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.pinkLight, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md },
  womenModeBannerText: { ...typography.caption, color: colors.pinkDark, marginLeft: spacing.xs, flex: 1 },
  driverCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  driverRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: radius.pill, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { ...typography.h3, color: colors.textInverse },
  driverName: { ...typography.bodyMedium, color: colors.textPrimary },
  driverMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  verifiedText: { ...typography.caption, color: colors.primary, marginLeft: spacing.xxs },
  passengerVerifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xxs },
  passengerVerifiedText: { ...typography.tiny, color: colors.textSecondary, marginLeft: spacing.xxs },
  quickMessagesTitle: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.xs },
  quickMessagesRow: { marginBottom: spacing.md },
  quickMessageChip: { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: spacing.sm, marginRight: spacing.xs },
  quickMessageChipSent: { backgroundColor: colors.primaryLight },
  quickMessageChipText: { ...typography.caption, color: colors.textPrimary },
  quickMessageChipTextSent: { color: colors.primaryDark },
  comfortCard: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md },
  comfortCardTitle: { ...typography.captionMedium, color: colors.textPrimary, marginBottom: spacing.xxs },
  comfortCardRow: { flexDirection: 'row', flexWrap: 'wrap' },
  comfortTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm, marginRight: spacing.xs, marginBottom: spacing.xxs },
  comfortTagText: { ...typography.tiny, color: colors.textSecondary, marginLeft: 4 },
  airportCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.tealLight, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md },
  airportCardText: { ...typography.caption, color: colors.ink, marginLeft: spacing.xs, flex: 1 },
  priceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 4 },
  priceLabel: { ...typography.caption, color: colors.textSecondary },
  priceValue: { ...typography.h3, color: colors.textPrimary, marginTop: 2 },
  splitHint: { ...typography.tiny, color: colors.textSecondary, marginTop: 2 },
  protectedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  protectedBadgeText: { ...typography.tiny, color: colors.primaryDark, marginLeft: 4 },
  demoLink: { ...typography.tiny, color: colors.textMuted, textAlign: 'center', textDecorationLine: 'underline', marginBottom: spacing.md },
  paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md },
  paymentIconBadge: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  paymentLabel: { ...typography.captionMedium, color: colors.textPrimary },
  paymentSubtext: { ...typography.tiny, color: colors.textSecondary, marginTop: 1 },
  referenceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md },
  referencePhoto: { width: 28, height: 28, borderRadius: radius.sm },
  referenceCardText: { ...typography.caption, color: colors.textPrimary, marginLeft: spacing.xs, flex: 1 },
  boardingCard: { backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  boardingLabel: { ...typography.captionMedium, color: colors.primaryDark },
  boardingCode: { ...typography.h1, color: colors.primaryDark, letterSpacing: 6, marginVertical: 2 },
  boardingHint: { ...typography.caption, color: colors.primaryDark, textAlign: 'center' },
  actionsRow: { flexDirection: 'row' },
  secondaryAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, marginRight: spacing.sm },
  secondaryActionText: { ...typography.captionMedium, color: colors.textPrimary, marginLeft: 4 },
  detailsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, marginTop: spacing.xs },
  detailsLinkText: { ...typography.captionMedium, color: colors.textSecondary, marginLeft: spacing.xxs },
});






