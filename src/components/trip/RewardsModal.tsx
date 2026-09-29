import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { RewardItem, rewardsCatalog } from '../../services/mockData';
import { RedeemedReward, getRedeemedRewards, saveRedeemedReward } from '../../services/rewardsStore';
import { KZ_PER_ANGOPOINT } from '../../constants/loyalty';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface RewardsModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<RewardItem['category'], React.ComponentProps<typeof Ionicons>['name']> = {
  hotel: 'bed-outline',
  restaurante: 'restaurant-outline',
  experiencia: 'compass-outline',
  desconto: 'pricetag-outline',
};

export default function RewardsModal({ visible, onClose }: RewardsModalProps) {
  const { user, spendAngoPoints } = useAuth();
  const [redeemed, setRedeemed] = useState<RedeemedReward[]>([]);
  const [lastVoucher, setLastVoucher] = useState<RedeemedReward | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const points = user?.angoPoints ?? 0;

  useEffect(() => {
    if (!visible) return;
    setLastVoucher(null);
    getRedeemedRewards().then(setRedeemed);
  }, [visible]);

  const handleRedeem = async (reward: RewardItem) => {
    setBusyId(reward.id);
    try {
      const ok = await spendAngoPoints(reward.costPoints);
      if (!ok) return;
      const record = await saveRedeemedReward(reward);
      setRedeemed((prev) => [record, ...prev]);
      setLastVoucher(record);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Recompensas</Text>
          <Ionicons name="close" size={24} color={colors.textMuted} onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.balanceCard}>
            <Ionicons name="gift" size={20} color={colors.primaryDark} />
            <Text style={styles.balanceValue}>{points} pontos</Text>
            <Text style={styles.balanceHint}>
              Ganhas 1 ponto por cada {KZ_PER_ANGOPOINT} Kz em viagens concluidas.
            </Text>
          </View>

          <Text style={styles.demoNote}>Catalogo de demonstracao: parceiros e valores de exemplo.</Text>

          {lastVoucher ? (
            <View style={styles.voucherCard}>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              <Text style={styles.voucherTitle}>{lastVoucher.title}</Text>
              <Text style={styles.voucherCode}>{lastVoucher.code}</Text>
              <Text style={styles.voucherHint}>Voucher guardado nos teus resgates.</Text>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Disponiveis</Text>
          {rewardsCatalog.map((reward) => {
            const canAfford = points >= reward.costPoints;
            return (
              <View key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardIconBadge}>
                  <Ionicons name={CATEGORY_ICONS[reward.category]} size={20} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardTitle}>{reward.title}</Text>
                  <Text style={styles.rewardDescription}>{reward.description}</Text>
                  <Text style={styles.rewardCost}>{reward.costPoints} pontos</Text>
                </View>
                <TouchableOpacity
                  style={[styles.redeemButton, (!canAfford || busyId !== null) && styles.redeemButtonDisabled]}
                  activeOpacity={0.85}
                  disabled={!canAfford || busyId !== null}
                  onPress={() => handleRedeem(reward)}
                >
                  <Text style={styles.redeemButtonText}>{canAfford ? 'Resgatar' : 'Faltam ' + (reward.costPoints - points)}</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {redeemed.length > 0 ? (
            <>
              <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Os teus vouchers</Text>
              {redeemed.map((item) => (
                <View key={item.id} style={styles.redeemedRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardTitle}>{item.title}</Text>
                    <Text style={styles.rewardDescription}>
                      {new Date(item.dateIso).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })} - {item.costPoints} pontos
                    </Text>
                  </View>
                  <Text style={styles.redeemedCode}>{item.code}</Text>
                </View>
              ))}
            </>
          ) : null}
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
  balanceCard: { backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', marginBottom: spacing.xs },
  balanceValue: { ...typography.h2, color: colors.primaryDark, marginTop: spacing.xxs },
  balanceHint: { ...typography.caption, color: colors.primaryDark, textAlign: 'center', marginTop: spacing.xxs },
  demoNote: { ...typography.tiny, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  voucherCard: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  voucherTitle: { ...typography.bodyMedium, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.xs },
  voucherCode: { ...typography.h2, color: colors.primaryDark, letterSpacing: 3, marginVertical: spacing.xxs },
  voucherHint: { ...typography.caption, color: colors.textSecondary },
  sectionLabel: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  rewardCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.sm },
  rewardIconBadge: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  rewardTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  rewardDescription: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  rewardCost: { ...typography.captionMedium, color: colors.primary, marginTop: 2 },
  redeemButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.sm, marginLeft: spacing.xs },
  redeemButtonDisabled: { backgroundColor: colors.borderStrong },
  redeemButtonText: { ...typography.captionMedium, color: colors.textInverse },
  redeemedRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.xs },
  redeemedCode: { ...typography.captionMedium, color: colors.primaryDark, letterSpacing: 1.5, marginLeft: spacing.sm },
});
