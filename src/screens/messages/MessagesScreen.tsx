import React, { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import ComingSoonNotice from '../../components/common/ComingSoonNotice';
import AnchorTabs from '../../components/common/AnchorTabs';
import { conversations } from '../../services/mockData';
import { colors, radius, spacing, typography } from '../../constants/theme';

const ANCHORS = [
  { id: 'active', label: 'Em viagem' },
  { id: 'support', label: 'Suporte' },
  { id: 'past', label: 'Anteriores' },
];

function formatTime(dateIso: string) {
  const date = new Date(dateIso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? date.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
}

export default function MessagesScreen() {
  const [activeAnchor, setActiveAnchor] = useState(ANCHORS[0].id);
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});

  const handleAnchorPress = (id: string) => {
    setActiveAnchor(id);
    const y = offsets.current[id] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(y - 8, 0), animated: true });
  };

  const handleOpenConversation = (name: string) => {
    Alert.alert(name, 'O chat completo dentro da app ainda esta em desenvolvimento. Por agora podes ligar diretamente ao motorista a partir da viagem em curso.');
  };

  if (conversations.length === 0) {
    return (
      <ScreenContainer style={styles.container}>
        <Text style={styles.header}>Mensagens</Text>
        <ComingSoonNotice
          icon="chatbubble-ellipses-outline"
          title="Sem conversas por agora"
          description="As tuas conversas com o motorista aparecem aqui automaticamente assim que uma viagem comecar."
        />
      </ScreenContainer>
    );
  }

  const grouped = ANCHORS.map((anchor) => ({
    ...anchor,
    items: conversations.filter((c) => c.status === anchor.id),
  }));

  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.header}>Mensagens</Text>
      <AnchorTabs anchors={ANCHORS} activeId={activeAnchor} onPress={handleAnchorPress} />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {grouped.map((group) =>
          group.items.length === 0 ? null : (
            <View key={group.id} onLayout={(e) => { offsets.current[group.id] = e.nativeEvent.layout.y; }} style={styles.section}>
              <Text style={styles.sectionTitle}>{group.label}</Text>
              {group.items.map((conv) => (
                <TouchableOpacity key={conv.id} style={styles.row} activeOpacity={0.8} onPress={() => handleOpenConversation(conv.driverName)}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>{conv.driverName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <View style={styles.rowTop}>
                      <Text style={styles.name} numberOfLines={1}>{conv.driverName}</Text>
                      <Text style={styles.time}>{formatTime(conv.dateIso)}</Text>
                    </View>
                    <Text style={[styles.lastMessage, conv.unread && styles.lastMessageUnread]} numberOfLines={1}>
                      {conv.lastMessage}
                    </Text>
                  </View>
                  {conv.unread ? <View style={styles.unreadDot} /> : null}
                </TouchableOpacity>
              ))}
            </View>
          )
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  scroll: { paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { ...typography.bodyMedium, color: colors.textInverse },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1, marginRight: spacing.xs },
  time: { ...typography.tiny, color: colors.textMuted },
  lastMessage: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  lastMessageUnread: { color: colors.textPrimary, fontFamily: typography.captionMedium.fontFamily },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: spacing.xs },
});
