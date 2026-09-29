import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import Button from '../../components/common/Button';
import RewardsModal from '../../components/trip/RewardsModal';
import { useTrip } from '../../contexts/TripContext';
import { awardPointsForTrip } from '../../services/pointsStore';
import { setFavoriteDriver } from '../../services/favoriteDriverStore';
import { ratingsRemote } from '../../services/extrasApi';
import { syncQuiet } from '../../services/remoteSync';
import { PaymentState } from '../../types';
import { HomeStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripCompleted'>;

const PAYMENT_LABELS: Record<PaymentState, string> = {
  processing: 'A processar pagamento...',
  confirmed: 'Pagamento confirmado',
  failed: 'Falha no pagamento - tenta outro metodo',
};

export default function TripCompletedScreen({ navigation }: Props) {
  const { activeTrip, clearActiveTrip } = useTrip();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [rewardsVisible, setRewardsVisible] = useState(false);
  const [favoriteSaved, setFavoriteSaved] = useState(false);
  // Estado real do pagamento (seccao 29 do documento): nunca assumimos
  // confirmacao instantanea - simulamos "a processar" antes de confirmar.
  const [paymentState, setPaymentState] = useState<PaymentState>('processing');

  useEffect(() => {
    if (!activeTrip) return;
    let alive = true;
    awardPointsForTrip(activeTrip.id, activeTrip.priceKz).then((points) => {
      if (alive) setPointsEarned(points);
    });
    const timer = setTimeout(() => {
      if (alive) setPaymentState('confirmed');
    }, 1800);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [activeTrip]);

  useEffect(() => {
    if (!activeTrip || !activeTrip.driver) {
      navigation.popToTop();
    }
  }, [activeTrip, navigation]);

  if (!activeTrip || !activeTrip.driver) {
    return null;
  }

  // Selo de Trajeto Limpo: compara a distancia estimada com a distancia real
  // percorrida (rota OSRM). Diferencas grandes podem indicar desvio de rota.
  const hasCleanRoute =
    activeTrip.actualDistanceKm !== undefined &&
    Math.abs(activeTrip.actualDistanceKm - activeTrip.distanceKm) <= activeTrip.distanceKm * 0.15;

  const handleFinish = () => {
    if (activeTrip.driver) {
      syncQuiet(() => ratingsRemote.rate({
        tripRef: activeTrip.id,
        driverId: activeTrip.driver!.id,
        stars: rating,
        comment: comment.trim() || undefined,
      }));
    }
    clearActiveTrip();
    navigation.popToTop();
  };

  const handleMarkFavorite = async () => {
    if (!activeTrip.driver) return;
    await setFavoriteDriver(activeTrip.driver.id, activeTrip.driver.fullName);
    setFavoriteSaved(true);
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.checkBadge}>
        <Ionicons name="checkmark" size={36} color={colors.textInverse} />
      </View>
      <Text style={styles.title}>Viagem concluida!</Text>
      <Text style={styles.subtitle}>Obrigado por viajar com o AngoTour.</Text>

      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>Total da viagem</Text>
        <Text style={styles.priceValue}>{activeTrip.priceKz.toLocaleString('pt-AO')} Kz</Text>
        <View style={styles.protectedRow}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={styles.protectedText}>Preco protegido - sem alteracoes desde a confirmacao</Text>
        </View>

        <View style={styles.paymentRow}>
          {paymentState === 'processing' ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Ionicons
              name={paymentState === 'confirmed' ? 'checkmark-circle' : 'alert-circle'}
              size={14}
              color={paymentState === 'confirmed' ? colors.primary : colors.danger}
            />
          )}
          <Text style={[styles.paymentText, paymentState === 'failed' && { color: colors.danger }]}>
            {PAYMENT_LABELS[paymentState]}
          </Text>
        </View>

        {hasCleanRoute ? (
          <View style={styles.cleanRouteRow}>
            <Ionicons name="ribbon-outline" size={14} color={colors.teal} />
            <Text style={styles.cleanRouteText}>Trajeto Limpo - percurso seguiu a rota esperada</Text>
          </View>
        ) : null}
      </View>

      {pointsEarned !== null && pointsEarned > 0 ? (
        <TouchableOpacity style={styles.pointsCard} activeOpacity={0.85} onPress={() => setRewardsVisible(true)}>
          <Ionicons name="star" size={20} color={colors.primaryDark} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.pointsTitle}>+{pointsEarned} AngoPoints ganhos</Text>
            <Text style={styles.pointsSubtitle}>Toca para ver o catalogo de recompensas</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
        </TouchableOpacity>
      ) : null}

      <Text style={styles.sectionTitle}>Avalie a sua viagem</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={colors.amber}
              style={{ marginHorizontal: 4 }}
            />
          </TouchableOpacity>
        ))}
      </View>

      {rating === 5 && !favoriteSaved ? (
        <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.85} onPress={handleMarkFavorite}>
          <Ionicons name="heart-outline" size={16} color={colors.primary} />
          <Text style={styles.favoriteButtonText}>Marcar {activeTrip.driver.fullName.split(' ')[0]} como motorista preferido</Text>
        </TouchableOpacity>
      ) : null}
      {favoriteSaved ? (
        <View style={styles.favoriteConfirmed}>
          <Ionicons name="heart" size={14} color={colors.primary} />
          <Text style={styles.favoriteConfirmedText}>Motorista preferido guardado - vamos tenta-lo atribuir em proximas viagens.</Text>
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Deixe um comentario (opcional)"
        placeholderTextColor={colors.textMuted}
        value={comment}
        onChangeText={setComment}
        multiline
      />

      <Button label="Concluir" onPress={handleFinish} style={{ marginTop: spacing.lg }} />

      <RewardsModal visible={rewardsVisible} onClose={() => setRewardsVisible(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, alignItems: 'center' },
  checkBadge: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  priceCard: { width: '100%', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  priceLabel: { ...typography.caption, color: colors.textSecondary },
  priceValue: { ...typography.h2, color: colors.textPrimary, marginTop: 2 },
  protectedRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  protectedText: { ...typography.tiny, color: colors.textSecondary, marginLeft: 4 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xxs },
  paymentText: { ...typography.tiny, color: colors.textSecondary, marginLeft: 4 },
  cleanRouteRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xxs },
  cleanRouteText: { ...typography.tiny, color: colors.teal, marginLeft: 4 },
  pointsCard: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  pointsTitle: { ...typography.bodyMedium, color: colors.primaryDark },
  pointsSubtitle: { ...typography.caption, color: colors.primaryDark, marginTop: 1 },
  sectionTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.sm },
  starsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  favoriteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: colors.primaryLight, borderRadius: radius.md, paddingVertical: spacing.sm, marginBottom: spacing.md },
  favoriteButtonText: { ...typography.captionMedium, color: colors.primaryDark, marginLeft: spacing.xxs, textAlign: 'center' },
  favoriteConfirmed: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: spacing.md, paddingHorizontal: spacing.xs },
  favoriteConfirmedText: { ...typography.tiny, color: colors.textSecondary, marginLeft: spacing.xxs, flex: 1 },
  input: {
    width: '100%', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm, minHeight: 70, textAlignVertical: 'top', ...typography.body, color: colors.textPrimary,
  },
});



