import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const FEATURES = [
  'Preco garantido',
  'Motoristas verificados',
  'Seguranca 24/7',
  'Acompanhamento em tempo real',
  'Varias opcoes de pagamento',
];

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <ImageBackground
      source={require('../../../assets/images/hero-background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(7,28,21,0.75)', 'rgba(7,28,21,0.96)']}
        locations={[0, 0.45, 0.7, 1]}
        style={styles.overlay}
      >
        <View style={styles.spacer} />

        <View style={styles.featureList}>
          {FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.featureCheck}>
                <Ionicons name="checkmark" size={13} color={colors.textInverse} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Button label="Continuar com telefone" onPress={() => navigation.navigate('Login')} />
          <Text style={styles.legal}>
            Ao continuar, aceitas os Termos de Utilizacao e a Politica de Privacidade do AngoTour.
          </Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  spacer: { flex: 1 },
  featureList: { marginBottom: spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm + 2 },
  featureCheck: { width: 22, height: 22, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  featureText: { ...typography.bodyMedium, color: colors.textInverse },
  actions: { paddingBottom: spacing.sm },
  legal: { ...typography.tiny, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.md },
});
