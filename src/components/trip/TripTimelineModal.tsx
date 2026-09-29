import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TripEvent, TripEventType, getTripEvents } from '../../services/tripEventStore';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface TripTimelineModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
}

// Evidence Vault (seccao 50 do documento): mostra ao passageiro o registo
// cronologico da viagem, guardado neste telemovel.
const EVENT_LABELS: Record<TripEventType, string> = {
  trip_created: 'Viagem criada',
  driver_assigned: 'Motorista atribuido',
  ride_started: 'Viagem iniciada',
  price_change_proposed: 'Alteracao de preco proposta',
  price_change_accepted: 'Alteracao de preco aceite',
  price_change_reported: 'Alteracao de preco reportada',
  sos_triggered: 'Alerta SOS enviado',
  cancelled: 'Viagem cancelada',
  completed: 'Viagem concluida',
  quick_message_sent: 'Mensagem rapida enviada',
};

function describe(event: TripEvent): string | null {
  const meta = event.meta;
  if (!meta) return null;
  const parts: string[] = [];
  if (typeof meta.priceKz === 'number') parts.push('Valor: ' + meta.priceKz.toLocaleString('pt-AO') + ' Kz');
  if (typeof meta.originalPriceKz === 'number') parts.push('Original: ' + meta.originalPriceKz.toLocaleString('pt-AO') + ' Kz');
  if (typeof meta.proposedPriceKz === 'number') parts.push('Proposto: ' + meta.proposedPriceKz.toLocaleString('pt-AO') + ' Kz');
  if (typeof meta.reason === 'string') parts.push('Motivo: ' + meta.reason);
  if (typeof meta.vehiclePlate === 'string') parts.push('Matricula: ' + meta.vehiclePlate);
  return parts.length > 0 ? parts.join(' - ') : null;
}

export default function TripTimelineModal({ visible, onClose, tripId }: TripTimelineModalProps) {
  const [events, setEvents] = useState<TripEvent[]>([]);

  useEffect(() => {
    if (!visible) return;
    getTripEvents(tripId).then(setEvents);
  }, [visible, tripId]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Registo da viagem</Text>
          <Ionicons name="close" size={24} color={colors.textMuted} onPress={onClose} />
        </View>
        <Text style={styles.subtitle}>Cada passo fica registado, para ajudar a esclarecer qualquer problema.</Text>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {events.length === 0 ? (
            <Text style={styles.empty}>Ainda nao ha eventos registados nesta viagem.</Text>
          ) : (
            events.map((event, index) => {
              const detail = describe(event);
              const isLast = index === events.length - 1;
              return (
                <View key={event.type + event.dateIso + index} style={styles.row}>
                  <View style={styles.rail}>
                    <View style={styles.dot} />
                    {!isLast ? <View style={styles.line} /> : null}
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{EVENT_LABELS[event.type]}</Text>
                    <Text style={styles.rowTime}>
                      {new Date(event.dateIso).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </Text>
                    {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.h3, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs, marginBottom: spacing.md },
  scroll: { paddingBottom: spacing.xxl },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  row: { flexDirection: 'row' },
  rail: { width: 20, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.primary, marginTop: 5 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2 },
  rowBody: { flex: 1, paddingBottom: spacing.md, marginLeft: spacing.xs },
  rowTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  rowTime: { ...typography.tiny, color: colors.textMuted, marginTop: 1 },
  rowDetail: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});

