import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface PopularDestinationCardProps {
  title: string;
  minutes: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  image?: number;
  // Espaco reservado para publicidade/patrocinios no carrossel da Home.
  isSponsored?: boolean;
  onPress: () => void;
}

export default function PopularDestinationCard({ title, minutes, icon, image, isSponsored, onPress }: PopularDestinationCardProps) {
  const content = (
    <>
      <View style={styles.overlay} />
      {isSponsored ? (
        <View style={styles.sponsoredBadge}>
          <Text style={styles.sponsoredText}>Patrocinado</Text>
        </View>
      ) : null}
      <View style={styles.textArea}>
        <View style={styles.titleRow}>
          <Ionicons name={icon} size={13} color={colors.primary} />
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.85)" />
          <Text style={styles.timeText}>{minutes} min</Text>
        </View>
      </View>
    </>
  );

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      {image ? (
        <ImageBackground source={image} style={styles.image} imageStyle={styles.imageRadius}>
          {content}
        </ImageBackground>
      ) : (
        // Sem foto ainda disponivel para este destino - gradiente de marca em vez de imagem quebrada.
        <LinearGradient colors={[colors.primaryDark, colors.ink]} style={[styles.image, styles.imageRadius]}>
          {content}
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: 130, height: 100, marginRight: spacing.sm },
  image: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  imageRadius: { borderRadius: radius.lg },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: radius.lg },
  sponsoredBadge: { position: 'absolute', top: spacing.xxs, right: spacing.xxs, backgroundColor: colors.amber, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 2 },
  sponsoredText: { fontSize: 9, fontFamily: typography.tiny.fontFamily, color: colors.ink },
  textArea: { padding: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { ...typography.captionMedium, color: colors.textInverse, marginLeft: 4, flexShrink: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  timeText: { ...typography.tiny, color: 'rgba(255,255,255,0.85)', marginLeft: 4 },
});
