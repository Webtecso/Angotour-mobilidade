import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import Button from '../../components/common/Button';
import RouteDivider from '../../components/common/RouteDivider';
import SafetySection from '../../components/common/SafetySection';
import AnchorTabs from '../../components/common/AnchorTabs';
import IncidentCenterModal from '../../components/trip/IncidentCenterModal';
import LostItemModal from '../../components/trip/LostItemModal';
import IdentityVerificationModal from '../../components/trip/IdentityVerificationModal';
import TrustProfileCard from '../../components/trip/TrustProfileCard';
import AddFamilyMemberModal from '../../components/trip/AddFamilyMemberModal';
import FavoritePlacesModal from '../../components/trip/FavoritePlacesModal';
import { useAuth } from '../../contexts/AuthContext';
import { getFamilyMembers, addFamilyMember, removeFamilyMember, FamilyMember } from '../../services/familyStore';
import { getFavoritePlaces } from '../../services/favoritePlacesStore';
import { SavedPlace } from '../../types';
import { colors, radius, spacing, typography } from '../../constants/theme';

const ANCHORS = [
  { id: 'pessoal', label: 'Dados pessoais' },
  { id: 'confianca', label: 'Confianca' },
  { id: 'seguranca', label: 'Seguranca' },
  { id: 'favoritos', label: 'Favoritos' },
  { id: 'pagamento', label: 'Pagamento' },
  { id: 'familia', label: 'Familia' },
  { id: 'pontos', label: 'AngoPoints' },
  { id: 'suporte', label: 'Suporte' },
];

const SUPPORT_ITEMS: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
  { icon: 'help-circle-outline', label: 'Central de ajuda' },
  { icon: 'alert-circle-outline', label: 'Reportar um problema' },
  { icon: 'briefcase-outline', label: 'Objetos perdidos' },
  { icon: 'document-text-outline', label: 'Termos e privacidade' },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const [activeAnchor, setActiveAnchor] = useState(ANCHORS[0].id);
  const [incidentVisible, setIncidentVisible] = useState(false);
  const [lostItemVisible, setLostItemVisible] = useState(false);
  const [verificationVisible, setVerificationVisible] = useState(false);
  const [addFamilyVisible, setAddFamilyVisible] = useState(false);
  const [favoritesVisible, setFavoritesVisible] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [favorites, setFavorites] = useState<SavedPlace[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});

  useEffect(() => {
    getFamilyMembers().then(setFamilyMembers);
    getFavoritePlaces().then(setFavorites);
  }, []);

  const handleAnchorPress = (id: string) => {
    setActiveAnchor(id);
    const y = offsets.current[id] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(y - 8, 0), animated: true });
  };

  const handleSupportItemPress = (label: string) => {
    if (label === 'Reportar um problema') setIncidentVisible(true);
    else if (label === 'Objetos perdidos') setLostItemVisible(true);
  };

  const handleAddFamilyMember = async (name: string, phone: string, relationship: string) => {
    const updated = await addFamilyMember(name, phone, relationship);
    setFamilyMembers(updated);
  };

  const handleRemoveFamilyMember = async (id: string) => {
    const updated = await removeFamilyMember(id);
    setFamilyMembers(updated);
  };

  const isVerified = !!user?.isVerified;

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{(user?.fullName ?? '?').trim().charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.fullName ?? 'Utilizador AngoTour'}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>

        <TouchableOpacity
          style={[styles.verifiedBadge, isVerified && styles.verifiedBadgeOk]}
          activeOpacity={isVerified ? 1 : 0.75}
          disabled={isVerified}
          onPress={() => setVerificationVisible(true)}
        >
          <Ionicons name={isVerified ? 'shield-checkmark' : 'shield-outline'} size={16} color={isVerified ? colors.primaryDark : colors.textSecondary} />
          <Text style={[styles.verifiedText, { color: isVerified ? colors.primaryDark : colors.textSecondary }]}>
            {isVerified ? 'Utilizador Verificado' : 'Toca para verificar identidade'}
          </Text>
        </TouchableOpacity>
      </View>

      <AnchorTabs anchors={ANCHORS} activeId={activeAnchor} onPress={handleAnchorPress} />

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View onLayout={(e) => { offsets.current['pessoal'] = e.nativeEvent.layout.y; }} style={styles.section}>
          <Text style={styles.sectionHeader}>Dados pessoais</Text>
          <View style={styles.card}>
            <InfoRow label="Nome completo" value={user?.fullName || '-'} />
            <InfoRow label="Telefone" value={user?.phone || '-'} />
            <InfoRow label="Email" value={user?.email || 'Nao definido'} />
            <InfoRow label="Data de nascimento" value={user?.birthDate || 'Nao definida'} />
            <InfoRow label="Idioma" value={user?.preferredLanguage === 'en' ? 'English' : 'Portugues'} />
          </View>
          <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editButtonText}>Editar dados pessoais</Text>
          </TouchableOpacity>
        </View>

        <RouteDivider style={{ marginVertical: spacing.md }} />

        <View onLayout={(e) => { offsets.current['confianca'] = e.nativeEvent.layout.y; }} style={styles.section}>
          <Text style={styles.sectionHeader}>Confianca AngoTour</Text>
          <TrustProfileCard />
        </View>

        <View onLayout={(e) => { offsets.current['seguranca'] = e.nativeEvent.layout.y; }} style={styles.section}>
          <Text style={styles.sectionHeader}>Seguranca AngoTour</Text>
          <SafetySection />
        </View>

        <View onLayout={(e) => { offsets.current['favoritos'] = e.nativeEvent.layout.y; }} style={styles.section}>
          <Text style={styles.sectionHeader}>Locais favoritos</Text>
          {favorites.length === 0 ? (
            <View style={styles.familyCard}>
              <Ionicons name="star" size={22} color={colors.primary} />
              <Text style={styles.familyTitle}>Guarda Casa, Trabalho e outros locais</Text>
              <Text style={styles.familyText}>Pede viagens mais depressa e recebe sugestoes na tua rotina.</Text>
            </View>
          ) : (
            <View style={styles.menu}>
              {favorites.map((place, index) => (
                <View key={place.id} style={[styles.menuItem, index === favorites.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.menuIconBadge}>
                    <Ionicons
                      name={place.kind === 'home' ? 'home-outline' : place.kind === 'work' ? 'briefcase-outline' : 'star-outline'}
                      size={18}
                      color={colors.ink}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>{place.label}</Text>
                    <Text style={styles.familyMemberMeta} numberOfLines={1}>{place.address}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.editButton} activeOpacity={0.8} onPress={() => setFavoritesVisible(true)}>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editButtonText}>Gerir locais favoritos</Text>
          </TouchableOpacity>
        </View>

        <View onLayout={(e) => { offsets.current['pagamento'] = e.nativeEvent.layout.y; }} style={styles.section}>
          <Text style={styles.sectionHeader}>Pagamento</Text>
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.75} onPress={() => navigation.navigate('WalletTab')}>
              <View style={styles.menuIconBadge}>
                <Ionicons name="card-outline" size={18} color={colors.ink} />
              </View>
              <Text style={styles.menuLabel}>Gerir formas de pagamento</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} activeOpacity={0.75} onPress={() => navigation.navigate('TripsTab')}>
              <View style={styles.menuIconBadge}>
                <Ionicons name="receipt-outline" size={18} color={colors.ink} />
              </View>
              <Text style={styles.menuLabel}>Historico de recibos</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View onLayout={(e) => { offsets.current['familia'] = e.nativeEvent.layout.y; }} style={styles.section}>
          <Text style={styles.sectionHeader}>Conta familia</Text>

          {familyMembers.length === 0 ? (
            <View style={styles.familyCard}>
              <Ionicons name="people" size={22} color={colors.primary} />
              <Text style={styles.familyTitle}>Acompanha e protege quem mais gostas</Text>
              <Text style={styles.familyText}>Adiciona familiares para acompanhar as viagens deles e gerir pagamentos em conjunto.</Text>
              <Button label="Adicionar familiar" variant="outline" size="md" style={{ marginTop: spacing.sm }} onPress={() => setAddFamilyVisible(true)} />
            </View>
          ) : (
            <>
              <View style={styles.menu}>
                {familyMembers.map((member, index) => (
                  <View key={member.id} style={[styles.menuItem, index === familyMembers.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.menuIconBadge}>
                      <Ionicons name="person-outline" size={18} color={colors.ink} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuLabel}>{member.name}</Text>
                      <Text style={styles.familyMemberMeta}>{member.relationship} - {member.phone}</Text>
                    </View>
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} onPress={() => handleRemoveFamilyMember(member.id)} />
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.editButton} activeOpacity={0.8} onPress={() => setAddFamilyVisible(true)}>
                <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.editButtonText}>Adicionar outro familiar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View onLayout={(e) => { offsets.current['pontos'] = e.nativeEvent.layout.y; }} style={styles.section}>
          <Text style={styles.sectionHeader}>AngoPoints</Text>
          <View style={styles.pointsCard}>
            <Ionicons name="gift" size={22} color={colors.primaryDark} />
            <Text style={styles.pointsValue}>{user?.angoPoints ?? 0} pontos</Text>
            <Text style={styles.pointsText}>Ganha pontos em cada viagem e troca por descontos em hoteis, restaurantes e experiencias turisticas.</Text>
          </View>
        </View>

        <View onLayout={(e) => { offsets.current['suporte'] = e.nativeEvent.layout.y; }} style={styles.section}>
          <Text style={styles.sectionHeader}>Suporte e reclamacoes</Text>
          <View style={styles.menu}>
            {SUPPORT_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, index === SUPPORT_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
                activeOpacity={0.75}
                onPress={() => handleSupportItemPress(item.label)}
              >
                <View style={styles.menuIconBadge}>
                  <Ionicons name={item.icon} size={18} color={colors.ink} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button label="Terminar sessao" variant="outline" onPress={() => signOut()} style={{ marginTop: spacing.lg, marginBottom: spacing.xxl }} />
      </ScrollView>

      <IncidentCenterModal visible={incidentVisible} onClose={() => setIncidentVisible(false)} />
      <LostItemModal visible={lostItemVisible} onClose={() => setLostItemVisible(false)} />
      <IdentityVerificationModal visible={verificationVisible} onClose={() => setVerificationVisible(false)} />
      <AddFamilyMemberModal visible={addFamilyVisible} onClose={() => setAddFamilyVisible(false)} onAdd={handleAddFamilyMember} />
      <FavoritePlacesModal visible={favoritesVisible} onClose={() => setFavoritesVisible(false)} onChanged={setFavorites} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  // flexShrink 0: o cabecalho nao pode ser esmagado pelo ScrollView (era isto que cortava o selo)
  header: { alignItems: 'center', marginBottom: spacing.sm, flexShrink: 0 },
  avatar: { width: 84, height: 84, borderRadius: radius.pill, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarInitial: { ...typography.h1, color: colors.textInverse },
  name: { ...typography.h3, color: colors.textPrimary },
  phone: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, minHeight: 34, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderStrong, paddingVertical: 8, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  verifiedBadgeOk: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  verifiedText: { ...typography.captionMedium, marginLeft: spacing.xxs },
  scroll: { paddingBottom: spacing.xxl },
  section: { marginTop: spacing.md },
  sectionHeader: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { ...typography.caption, color: colors.textSecondary },
  infoValue: { ...typography.bodyMedium, color: colors.textPrimary },
  editButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
  editButtonText: { ...typography.captionMedium, color: colors.primary, marginLeft: spacing.xxs },
  menu: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIconBadge: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  menuLabel: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
  familyMemberMeta: { ...typography.tiny, color: colors.textSecondary, marginTop: 1 },
  familyCard: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  familyTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: spacing.xs, textAlign: 'center' },
  familyText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxs },
  pointsCard: { backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  pointsValue: { ...typography.h3, color: colors.primaryDark, marginTop: spacing.xs },
  pointsText: { ...typography.caption, color: colors.primaryDark, textAlign: 'center', marginTop: spacing.xxs },
});
