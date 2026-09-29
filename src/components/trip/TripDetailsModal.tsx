import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTripEvents, TripEvent, TripEventType } from '../../services/tripEventStore';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface TripDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
}

const EVENT_LABELS: Record<TripEventType, string> = {
  trip_created: 'Viagem criada',
  driver_assigned: 'Motorista atribuido',
  ride_started: 'Viagem iniciada',
  price_change_proposed: 'Motorista propos novo preco',
  price_change_accepted: 'Alteracao de preco aceite',
  price_change_reported: 'Alteracao de preco reportada',
  sos_triggered: 'SOS ativado',
  quick_message_sent: 'Mensagem rapida enviada',
  cancelled: 'Viagem cancelada',
  completed: 'Viagem concluida',
};

const EVENT_ICONS: Record<TripEventType, React.ComponentProps<typeof Ionicons>['name']> = {
  trip_created: 'add-circle-outline',
  driver_assigned: 'person-outline',
  ride_started: 'navigate-outline',
  price_change_proposed: 'alert-circle-outline',
  price_change_accepted: 'checkmark-circle-outline',
  price_change_reported: 'flag-outline',
  sos_triggered: 'shield-outline',
  quick_message_sent: 'chatbubble-outline',
  cancelled: 'close-circle-outline',
  completed: 'flag-outline',
};

/**
 * Evidence Vault viewer (seccao 6 e 50 do documento): mostra a timeline de
 * eventos gravados desta viagem. Nao serve para o app "decidir" quem tem
 * razao numa disputa - apenas apresenta os factos registados.
 */
export default function TripDetailsModal({ visible, onClose, tripId }: TripDetailsModalProps) {
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setIsLoading(true);
    getTripEvents(tripId).then((data) => {
      if (alive) {
        setEvents(data);
        setIsLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [visible, tripId]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Detalhes da viagem</Text>
          <Ionicons name="close" size={24} color={colors.textMuted} onPress={onClose} />
        </View>
        <Text style={styles.subtitle}>
          Registo completo dos eventos desta viagem - guardado para consulta em caso de duvida.
        </Text>

        <ScrollView contentContainerStyle={styles.scroll}>
          {isLoading ? (
            <Text style={styles.emptyText}>A carregar...</Text>
          ) : events.length === 0 ? (
            <Text style={styles.emptyText}>Ainda nao existem eventos registados para esta viagem.</Text>
          ) : (
            events.map((event, index) => (
              <View key={`${event.type}-${event.dateIso}-${index}`} style={styles.eventRow}>
                <View style={styles.eventIconBadge}>
                  <Ionicons name={EVENT_ICONS[event.type]} size={16} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventLabel}>{EVENT_LABELS[event.type]}</Text>
                  <Text style={styles.eventDate}>
                    {new Date(event.dateIso).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))
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
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
  scroll: { paddingBottom: spacing.xxl },
  emptyText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  eventIconBadge: { width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  eventLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  eventDate: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
});


