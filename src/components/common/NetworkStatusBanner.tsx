import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/theme';

/**
 * Low Network Mode (seccao 21-22 do documento): quando a rede esta fraca ou
 * ausente, avisa o passageiro que a app esta a usar a ultima localizacao
 * conhecida, em vez de deixar o mapa falhar silenciosamente (em branco) ou
 * mostrar um ETA que ja nao e fiavel.
 */
export default function NetworkStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false || state.isInternetReachable === false);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={13} color={colors.textInverse} />
      <Text style={styles.text}>Sem ligacao - a usar a ultima localizacao conhecida</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink, paddingVertical: 6, paddingHorizontal: spacing.sm },
  text: { ...typography.tiny, color: colors.textInverse, marginLeft: spacing.xxs },
});
