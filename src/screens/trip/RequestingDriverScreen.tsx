import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useTrip } from '../../contexts/TripContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getFavoriteDriver } from '../../services/favoriteDriverStore';
import { HomeStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'RequestingDriver'>;

const STEPS = [
  'Motoristas na sua area',
  'A analisar o melhor trajeto',
  'A confirmar motorista',
  'Quase pronto...',
];

function RadarRing({ delay }: { delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, { toValue: 1, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 3.4] });
  const opacity = progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] });

  return <Animated.View style={[styles.ring, { transform: [{ scale }], opacity }]} />;
}

export default function RequestingDriverScreen({ navigation }: Props) {
  const { assignDriver, cancelTrip, activeTrip } = useTrip();
  const { womenModeEnabled } = useSettings();
  const [stepIndex, setStepIndex] = useState(0);
  const [assignTriggered, setAssignTriggered] = useState(false);

  // Passo 1: corre a animacao e, no fim, pede a atribuicao do motorista.
  // Nao navega aqui - a navegacao fica a cargo do proximo useEffect, que
  // observa o activeTrip e so avanca quando o contexto estiver mesmo pronto.
  useEffect(() => {
    let cancelled = false;
    let favoriteDriverId: string | undefined;

    getFavoriteDriver().then((fav) => {
      if (!cancelled) favoriteDriverId = fav?.driverId;
    });

    const timers = STEPS.map((_, i) => setTimeout(() => setStepIndex(i + 1), (i + 1) * 700));
    const finalTimer = setTimeout(() => {
      if (cancelled) return;
      assignDriver(womenModeEnabled, favoriteDriverId);
      setAssignTriggered(true);
    }, STEPS.length * 700 + 400);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      clearTimeout(finalTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Passo 2: so navega depois de termos mesmo pedido a atribuicao (evita
  // disparar por causa de um activeTrip antigo) e assim que o contexto
  // confirmar que ja tem motorista.
  useEffect(() => {
    if (assignTriggered && activeTrip && activeTrip.driver) {
      navigation.replace('TripInProgress');
    }
  }, [assignTriggered, activeTrip, navigation]);

  const handleCancel = () => {
    cancelTrip();
    navigation.popToTop();
  };

  return (
    // theme="dark" e essencial aqui: sem isto, o ScreenContainer pinta um
    // fundo claro por cima do que seria um gradiente escuro, escondendo
    // texto branco atras de um fundo branco (bug corrigido nesta versao).
    <ScreenContainer style={styles.container} edges={['top', 'left', 'right', 'bottom']} theme="dark">
      <Ionicons name="chevron-back" size={26} color={colors.textInverse} onPress={handleCancel} />

      <View style={styles.radarArea}>
        <RadarRing delay={0} />
        <RadarRing delay={700} />
        <RadarRing delay={1400} />
        <View style={styles.radarCore}>
          <Ionicons name="navigate" size={30} color={colors.textInverse} />
        </View>
      </View>

      <Text style={styles.title}>Procurando um motorista</Text>
      <Text style={styles.subtitle}>Estamos a encontrar o melhor motorista para voce...</Text>

      <View style={styles.stepList}>
        {STEPS.map((step, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <View key={step} style={styles.stepRow}>
              {done ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              ) : (
                <View style={[styles.stepDot, active && styles.stepDotActive]} />
              )}
              <Text style={[styles.stepText, (done || active) && styles.stepTextActive]}>{step}</Text>
            </View>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: 'transparent' },
  radarArea: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl, height: 140 },
  ring: { position: 'absolute', width: 90, height: 90, borderRadius: radius.pill, backgroundColor: colors.primary },
  radarCore: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h2, color: colors.textInverse, textAlign: 'center' },
  subtitle: { ...typography.body, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl, paddingHorizontal: spacing.md },
  stepList: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  stepDot: { width: 20, height: 20, borderRadius: radius.pill, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  stepDotActive: { borderColor: colors.primary },
  stepText: { ...typography.body, color: 'rgba(255,255,255,0.5)', marginLeft: spacing.sm },
  stepTextActive: { color: colors.textInverse },
});
