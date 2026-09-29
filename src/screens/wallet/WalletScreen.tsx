import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import RouteDivider from '../../components/common/RouteDivider';
import AnchorTabs from '../../components/common/AnchorTabs';
import TopUpModal from '../../components/trip/TopUpModal';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../hooks/useBackendData';
import { paymentMethods, walletTransactions } from '../../services/mockData';
import { getConfirmedBalanceAdjustment, getTopUps, INITIAL_BALANCE_KZ, WalletTopUp } from '../../services/walletStore';
import { PaymentMethod } from '../../types';
import { colors, radius, spacing, typography } from '../../constants/theme';

const PAYMENT_ICONS: Record<PaymentMethod['type'], React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  wallet: 'wallet-outline',
  multicaixa_express: 'credit-card-outline',
  unitel_money: 'cellphone',
  card: 'credit-card-outline',
  cash: 'cash',
};

const TRANSACTION_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  trip: 'car-outline',
  topup: 'add-circle-outline',
  refund: 'arrow-undo-outline',
  points: 'gift-outline',
};

const ANCHORS = [
  { id: 'saldo', label: 'Saldo' },
  { id: 'pagamento', label: 'Pagamento' },
  { id: 'transacoes', label: 'Transacoes' },
  { id: 'pontos', label: 'AngoPoints' },
];

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
}

function statusSuffix(status: WalletTopUp['status']) {
  if (status === 'processing') return ' (a confirmar)';
  if (status === 'failed') return ' (falhou)';
  return '';
}

export default function WalletScreen() {
  const { user } = useAuth();
  const { wallet, refresh: refreshServerWallet } = useWallet();
  const [selectedId, setSelectedId] = useState(paymentMethods.find((m) => m.isDefault)?.id ?? paymentMethods[0].id);
  const [activeAnchor, setActiveAnchor] = useState(ANCHORS[0].id);
  const [localBalanceKz, setLocalBalanceKz] = useState(INITIAL_BALANCE_KZ);
  const [localTopUps, setLocalTopUps] = useState<WalletTopUp[]>([]);
  const [topUpModalVisible, setTopUpModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});

  // O servidor e a fonte de verdade. Os dados locais so aparecem se o servidor nao responder.
  const isServer = wallet !== null;
  const balanceKz = isServer ? wallet.balanceKz : localBalanceKz;
  const topUps: WalletTopUp[] = isServer
    ? wallet.topups.map((t) => ({ id: t.id, dateIso: t.createdAt, amountKz: t.amountKz, reference: t.reference, status: t.status }))
    : localTopUps;

  const refreshWallet = async () => {
    await refreshServerWallet();
    const [adjustment, allTopUps] = await Promise.all([getConfirmedBalanceAdjustment(), getTopUps()]);
    setLocalBalanceKz(INITIAL_BALANCE_KZ + adjustment);
    setLocalTopUps(allTopUps);
  };

  useEffect(() => {
    refreshWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnchorPress = (id: string) => {
    setActiveAnchor(id);
    const y = offsets.current[id] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(y - 8, 0), animated: true });
  };

  const pendingTopUps = topUps.filter((t) => t.status === 'processing');
  const demoTransactions = isServer ? [] : walletTransactions;

  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.header}>Carteira</Text>
      <AnchorTabs anchors={ANCHORS} activeId={activeAnchor} onPress={handleAnchorPress} />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View onLayout={(e) => { offsets.current['saldo'] = e.nativeEvent.layout.y; }}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Saldo disponivel</Text>
            <Text style={styles.balanceValue}>{balanceKz.toLocaleString('pt-AO')} Kz</Text>
            <RouteDivider color="rgba(255,255,255,0.35)" style={{ marginVertical: spacing.sm }} />
            <View style={styles.pointsRow}>
              <Ionicons name="gift-outline" size={16} color={colors.textInverse} />
              <Text style={styles.pointsText}>{user?.angoPoints ?? 0} AngoPoints</Text>
            </View>
          </View>
          <Text style={styles.syncNote}>
            {isServer ? 'Saldo sincronizado com o servidor' : 'Sem ligacao ao servidor - a mostrar dados locais'}
          </Text>

          {pendingTopUps.length > 0 ? (
            <View style={styles.pendingBanner}>
              <Ionicons name="time-outline" size={14} color={colors.amber} />
              <Text style={styles.pendingBannerText}>
                Carregamento de {pendingTopUps[0].amountKz.toLocaleString('pt-AO')} Kz a ser confirmado...
              </Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.topUpButton} activeOpacity={0.85} onPress={() => setTopUpModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.topUpText}>Carregar carteira</Text>
          </TouchableOpacity>
        </View>

        <View onLayout={(e) => { offsets.current['pagamento'] = e.nativeEvent.layout.y; }} style={styles.section}>
          <Text style={styles.sectionHeader}>Formas de pagamento</Text>
          <View style={styles.methodsList}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[styles.methodRow, selectedId === method.id && styles.methodRowSelected]}
                activeOpacity={0.8}
                onPress={() => setSelectedId(method.id)}
              >
                <View style={styles.methodIconBadge}>
                  <MaterialCommunityIcons name={PAYMENT_ICONS[method.type]} size={20} color={colors.ink} />
                </View>
                <Text style={styles.methodLabel}>{method.label}</Text>
                {method.isDefault ? <Text style={styles.defaultTag}>Padrao</Text> : null}
                <Ionicons
                  name={selectedId === method.id ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedId === method.id ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View onLayout={(e) => { offsets.current['transacoes'] = e.nativeEvent.layout.y; }} style={styles.section}>
          <Text style={styles.sectionHeader}>Ultimas transacoes</Text>
          {demoTransactions.length === 0 && topUps.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Ionicons name="receipt-outline" size={22} color={colors.textMuted} />
              <Text style={styles.emptyTransactionsText}>As tuas transacoes vao aparecer aqui assim que fizeres o primeiro carregamento.</Text>
            </View>
          ) : (
            <View style={styles.methodsList}>
              {topUps.map((topUp) => (
                <View key={topUp.id} style={styles.methodRow}>
                  <View style={styles.methodIconBadge}>
                    <Ionicons name="add-circle-outline" size={18} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodLabel}>Carregamento{statusSuffix(topUp.status)}</Text>
                    <Text style={styles.txDate}>{formatDate(topUp.dateIso)} - Ref. {topUp.reference}</Text>
                  </View>
                  <Text style={[styles.txAmount, topUp.status === 'confirmed' && styles.txAmountPositive]}>
                    +{topUp.amountKz.toLocaleString('pt-AO')} Kz
                  </Text>
                </View>
              ))}
              {demoTransactions.map((tx) => (
                <View key={tx.id} style={styles.methodRow}>
                  <View style={styles.methodIconBadge}>
                    <Ionicons name={TRANSACTION_ICONS[tx.type]} size={18} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodLabel}>{tx.label}</Text>
                    <Text style={styles.txDate}>{formatDate(tx.dateIso)}</Text>
                  </View>
                  <Text style={[styles.txAmount, tx.amountKz > 0 && styles.txAmountPositive]}>
                    {tx.amountKz > 0 ? '+' : ''}{tx.amountKz.toLocaleString('pt-AO')} Kz
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View onLayout={(e) => { offsets.current['pontos'] = e.nativeEvent.layout.y; }} style={styles.section}>
          <Text style={styles.sectionHeader}>AngoPoints</Text>
          <View style={styles.pointsCard}>
            <Ionicons name="gift" size={22} color={colors.primary} />
            <Text style={styles.pointsCardTitle}>{user?.angoPoints ?? 0} pontos acumulados</Text>
            <Text style={styles.pointsCardText}>Troca os teus pontos por descontos em viagens, hoteis, restaurantes e experiencias turisticas.</Text>
          </View>
        </View>
      </ScrollView>

      <TopUpModal
        visible={topUpModalVisible}
        onClose={() => setTopUpModalVisible(false)}
        onConfirmed={refreshWallet}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  scroll: { paddingBottom: spacing.xxl },
  section: { marginTop: spacing.lg },
  balanceCard: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xs },
  balanceLabel: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
  balanceValue: { ...typography.h1, color: colors.textInverse, marginTop: spacing.xxs },
  syncNote: { ...typography.tiny, color: colors.textMuted, marginBottom: spacing.sm, marginLeft: spacing.xxs },
  pointsRow: { flexDirection: 'row', alignItems: 'center' },
  pointsText: { ...typography.captionMedium, color: colors.textInverse, marginLeft: spacing.xxs },
  pendingBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
  pendingBannerText: { ...typography.caption, color: colors.textSecondary, marginLeft: spacing.xxs, flex: 1 },
  topUpButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm },
  topUpText: { ...typography.bodyMedium, color: colors.primary, marginLeft: spacing.xxs },
  sectionHeader: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  methodsList: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.sm },
  methodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  methodRowSelected: { backgroundColor: colors.primaryLight },
  methodIconBadge: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  methodLabel: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
  defaultTag: { ...typography.tiny, color: colors.primary, marginRight: spacing.sm },
  emptyTransactions: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.lg },
  emptyTransactionsText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  txDate: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  txAmount: { ...typography.bodyMedium, color: colors.textPrimary, marginLeft: spacing.sm },
  txAmountPositive: { color: colors.primary },
  pointsCard: { backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  pointsCardTitle: { ...typography.h3, color: colors.primaryDark, marginTop: spacing.xs },
  pointsCardText: { ...typography.caption, color: colors.primaryDark, textAlign: 'center', marginTop: spacing.xs },
});
