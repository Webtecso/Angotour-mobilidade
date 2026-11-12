import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../../components/common/ScreenContainer';
import ComingSoonNotice from '../../components/common/ComingSoonNotice';
import TripChat from '../../components/chat/TripChat';
import { chatApi, tripsApi } from '../../services/api';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface Conversation {
  id: string;
  driverName: string;
  vehiclePlate: string;
  lastMessage: string;
  dateIso: string;
  active: boolean;
}

const ACTIVE_STATUSES = ['driver_assigned', 'driver_arriving', 'in_progress'];

function formatTime(dateIso: string) {
  const date = new Date(dateIso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? date.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
}

export default function MessagesScreen() {
  const [items, setItems] = useState<Conversation[] | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<Conversation | null>(null);

  const load = useCallback(async () => {
    try {
      const trips = (await tripsApi.mine()) as any[];
      const eligible = trips
        .filter((t) => t.driver && (ACTIVE_STATUSES.includes(t.status) || t.status === 'completed'))
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        .slice(0, 15);
      const rows: Conversation[] = await Promise.all(
        eligible.map(async (t) => {
          let lastMessage = 'Sem mensagens';
          let dateIso: string = t.completedAt ?? t.startedAt ?? t.createdAt ?? new Date().toISOString();
          try {
            const thread = await chatApi.list(t.id);
            const m = thread.messages[thread.messages.length - 1];
            if (m) {
              lastMessage = (m.fromMe ? 'Tu: ' : '') + m.body;
              dateIso = m.createdAt;
            }
          } catch {
            // sem acesso a este chat: mostra a viagem sem ultima mensagem
          }
          return {
            id: t.id,
            driverName: t.driver?.fullName ?? 'Motorista',
            vehiclePlate: t.vehicle?.plate ?? '',
            lastMessage,
            dateIso,
            active: ACTIVE_STATUSES.includes(t.status),
          };
        }),
      );
      setItems(rows);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (items === null) {
    return (
      <ScreenContainer style={styles.container}>
        <Text style={styles.header}>Mensagens</Text>
        {error ? (
          <TouchableOpacity onPress={load}>
            <Text style={styles.errorText}>{error + ' - toca para tentar outra vez'}</Text>
          </TouchableOpacity>
        ) : (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        )}
      </ScreenContainer>
    );
  }

  if (items.length === 0) {
    return (
      <ScreenContainer style={styles.container}>
        <Text style={styles.header}>Mensagens</Text>
        <ComingSoonNotice
          icon="chatbubble-ellipses-outline"
          title="Sem conversas por agora"
          description="As tuas conversas com o motorista aparecem aqui assim que uma viagem tiver motorista."
        />
      </ScreenContainer>
    );
  }

  const groups = [
    { id: 'active', label: 'Em viagem', list: items.filter((c) => c.active) },
    { id: 'past', label: 'Anteriores', list: items.filter((c) => !c.active) },
  ];

  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.header}>Mensagens</Text>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {groups.map((group) =>
          group.list.length === 0 ? null : (
            <View key={group.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{group.label}</Text>
              {group.list.map((conv) => (
                <TouchableOpacity key={conv.id} style={styles.row} activeOpacity={0.8} onPress={() => setOpen(conv)}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>{conv.driverName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <View style={styles.rowTop}>
                      <Text style={styles.name} numberOfLines={1}>{conv.driverName}{conv.vehiclePlate ? ' - ' + conv.vehiclePlate : ''}</Text>
                      <Text style={styles.time}>{formatTime(conv.dateIso)}</Text>
                    </View>
                    <Text style={styles.lastMessage} numberOfLines={1}>{conv.lastMessage}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ),
        )}
      </ScrollView>
      {open ? (
        <TripChat visible onClose={() => { setOpen(null); load(); }} tripId={open.id} driverName={open.driverName} />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  scroll: { paddingBottom: spacing.xxl },
  errorText: { ...typography.body, color: colors.danger, marginTop: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { ...typography.bodyMedium, color: colors.textInverse },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1, marginRight: spacing.xs },
  time: { ...typography.tiny, color: colors.textMuted },
  lastMessage: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});