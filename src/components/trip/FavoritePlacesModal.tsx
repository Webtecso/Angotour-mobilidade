import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../common/Input';
import { useLocation } from '../../contexts/LocationContext';
import { getFavoritePlaces, removeFavoritePlace, saveFavoritePlace } from '../../services/favoritePlacesStore';
import { SavedPlace } from '../../types';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface FavoritePlacesModalProps {
  visible: boolean;
  onClose: () => void;
  onChanged?: (places: SavedPlace[]) => void;
}

const FIXED_SLOTS: { id: string; label: string; kind: 'home' | 'work'; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'fav-home', label: 'Casa', kind: 'home', icon: 'home-outline' },
  { id: 'fav-work', label: 'Trabalho', kind: 'work', icon: 'briefcase-outline' },
];

export default function FavoritePlacesModal({ visible, onClose, onChanged }: FavoritePlacesModalProps) {
  const { currentPlace, isLoading: isLocating, permissionDenied } = useLocation();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [customLabel, setCustomLabel] = useState('');

  useEffect(() => {
    if (visible) getFavoritePlaces().then(setPlaces);
  }, [visible]);

  const apply = (next: SavedPlace[]) => {
    setPlaces(next);
    onChanged?.(next);
  };

  const saveHere = async (id: string, label: string, kind: 'home' | 'work' | 'favorite') => {
    const next = await saveFavoritePlace(id, label, kind, currentPlace.address, currentPlace.coordinates);
    apply(next);
  };

  const handleSaveCustom = async () => {
    const label = customLabel.trim();
    if (!label) return;
    await saveHere(`fav-custom-${Date.now()}`, label, 'favorite');
    setCustomLabel('');
  };

  const handleRemove = async (id: string) => {
    apply(await removeFavoritePlace(id));
  };

  const customPlaces = places.filter((p) => p.id.startsWith('fav-custom-'));
  const canSave = !isLocating && !permissionDenied;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Locais favoritos</Text>
          <Ionicons name="close" size={24} color={colors.textMuted} onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.hint}>
            {permissionDenied
              ? 'Ativa a localizacao para guardar locais.'
              : `Local atual: ${isLocating ? 'a localizar...' : currentPlace.address}`}
          </Text>

          {FIXED_SLOTS.map((slot) => {
            const saved = places.find((p) => p.id === slot.id);
            return (
              <View key={slot.id} style={styles.row}>
                <View style={styles.iconBadge}>
                  <Ionicons name={slot.icon} size={18} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{slot.label}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>{saved ? saved.address : 'Ainda nao definido'}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.actionButton, !canSave && styles.actionButtonDisabled]}
                  disabled={!canSave}
                  activeOpacity={0.8}
                  onPress={() => saveHere(slot.id, slot.label, slot.kind)}
                >
                  <Text style={styles.actionButtonText}>{saved ? 'Atualizar aqui' : 'Definir aqui'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {customPlaces.map((place) => (
            <View key={place.id} style={styles.row}>
              <View style={styles.iconBadge}>
                <Ionicons name="star-outline" size={18} color={colors.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{place.label}</Text>
                <Text style={styles.rowMeta} numberOfLines={1}>{place.address}</Text>
              </View>
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} onPress={() => handleRemove(place.id)} />
            </View>
          ))}

          <Text style={styles.sectionLabel}>Novo favorito com a localizacao atual</Text>
          <Input placeholder="Ex: Casa da mae, Igreja, Escola" value={customLabel} onChangeText={setCustomLabel} />
          <TouchableOpacity
            style={[styles.saveButton, (!customLabel.trim() || !canSave) && styles.actionButtonDisabled]}
            disabled={!customLabel.trim() || !canSave}
            activeOpacity={0.85}
            onPress={handleSaveCustom}
          >
            <Text style={styles.saveButtonText}>Guardar favorito</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary },
  scroll: { paddingBottom: spacing.xxl },
  hint: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.xs },
  iconBadge: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  rowLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  rowMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  actionButton: { backgroundColor: colors.primaryLight, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.sm, marginLeft: spacing.xs },
  actionButtonDisabled: { opacity: 0.45 },
  actionButtonText: { ...typography.tiny, color: colors.primaryDark },
  sectionLabel: { ...typography.captionMedium, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs },
  saveButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  saveButtonText: { ...typography.bodyMedium, color: colors.textInverse },
});
