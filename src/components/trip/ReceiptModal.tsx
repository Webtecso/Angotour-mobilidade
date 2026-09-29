import React from 'react';
import { Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TripHistoryEntry, vehicleCategories } from '../../services/mockData';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  trip: TripHistoryEntry | null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ReceiptModal({ visible, onClose, trip }: ReceiptModalProps) {
  if (!trip) return null;

  const category = vehicleCategories.find((c) => c.id === trip.categoryId);
  const date = new Date(trip.dateIso);
  const dateText = `${date.toLocaleDateString('pt-AO')} ${date.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}`;
  const receiptNumber = `AT-R-${trip.id.toUpperCase()}`;
  const isCancelled = trip.status === 'cancelled';
  const priceText = isCancelled ? '0 Kz' : `${trip.priceKz.toLocaleString('pt-AO')} Kz`;

  const handleShare = () => {
    Share.share({
      message:
        `Recibo AngoTour ${receiptNumber}\n` +
        `${dateText}\n` +
        `${trip.originLabel} -> ${trip.destinationLabel}\n` +
        `${trip.distanceKm.toFixed(1)} km - ${category?.name ?? ''}\n` +
        `Motorista: ${trip.driverName}\n` +
        `Total: ${priceText}`,
    }).catch(() => {});
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Recibo</Text>
          <Ionicons name="close" size={24} color={colors.textMuted} onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.receiptNumber}>{receiptNumber}</Text>
            <Text style={styles.receiptDate}>{dateText}</Text>

            <View style={styles.divider} />
            <Row label="Origem" value={trip.originLabel} />
            <Row label="Destino" value={trip.destinationLabel} />
            <Row label="Distancia" value={`${trip.distanceKm.toFixed(1)} km`} />
            <Row label="Categoria" value={category?.name ?? '-'} />
            <Row label="Motorista" value={trip.driverName} />
            <Row label="Estado" value={isCancelled ? 'Cancelada' : 'Concluida'} />

            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{priceText}</Text>
            </View>
            {!isCancelled ? (
              <View style={styles.protectedRow}>
                <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                <Text style={styles.protectedText}>Preco protegido - igual ao confirmado no inicio</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity style={styles.shareButton} activeOpacity={0.85} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={16} color={colors.textInverse} />
            <Text style={styles.shareButtonText}>Partilhar recibo</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary },
  scroll: { paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  receiptNumber: { ...typography.bodyMedium, color: colors.textPrimary },
  receiptDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { ...typography.caption, color: colors.textSecondary, marginRight: spacing.sm },
  rowValue: { ...typography.captionMedium, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...typography.subtitle, color: colors.textPrimary },
  totalValue: { ...typography.h3, color: colors.textPrimary },
  protectedRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  protectedText: { ...typography.tiny, color: colors.textSecondary, marginLeft: 4 },
  shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2 },
  shareButtonText: { ...typography.bodyMedium, color: colors.textInverse, marginLeft: spacing.xs },
});
