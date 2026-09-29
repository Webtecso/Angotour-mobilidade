import React, { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { recordIncident } from '../../services/incidentStore';
import { tripHistory } from '../../services/mockData';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface LostItemModalProps {
  visible: boolean;
  onClose: () => void;
}

const ITEM_TYPES: { id: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'phone', label: 'Telemovel', icon: 'phone-portrait-outline' },
  { id: 'bag', label: 'Bolsa', icon: 'bag-handle-outline' },
  { id: 'backpack', label: 'Mochila', icon: 'briefcase-outline' },
  { id: 'card', label: 'Cartao', icon: 'card-outline' },
  { id: 'document', label: 'Documento', icon: 'document-text-outline' },
  { id: 'luggage', label: 'Mala', icon: 'file-tray-stacked-outline' },
  { id: 'other', label: 'Outro', icon: 'help-circle-outline' },
];

export default function LostItemModal({ visible, onClose }: LostItemModalProps) {
  const [tripId, setTripId] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setTripId(null);
    setItemId(null);
    setDescription('');
    setPhotoUri(null);
    setCaseNumber(null);
    onClose();
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!tripId || !itemId) return;
    setIsSubmitting(true);
    try {
      const item = ITEM_TYPES.find((i) => i.id === itemId)?.label ?? 'Outro';
      const record = await recordIncident(`Objeto perdido: ${item}`, description.trim(), tripId, photoUri ?? undefined);
      setCaseNumber(record.caseNumber);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{caseNumber ? 'Caso registado' : 'Objeto perdido'}</Text>
          <Ionicons name="close" size={24} color={colors.textMuted} onPress={handleClose} />
        </View>

        {caseNumber ? (
          <View style={styles.caseBadge}>
            <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
            <Text style={styles.caseNumber}>#{caseNumber}</Text>
            <Text style={styles.caseSubtitle}>Vamos identificar o motorista e tentar a recuperacao. Acompanha o estado em Suporte.</Text>
            <TouchableOpacity style={styles.doneButton} activeOpacity={0.85} onPress={handleClose}>
              <Text style={styles.doneButtonText}>Concluir</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.sectionLabel}>Em qual viagem?</Text>
            {tripHistory.map((trip) => {
              const isSelected = tripId === trip.id;
              return (
                <TouchableOpacity
                  key={trip.id}
                  style={[styles.tripRow, isSelected && styles.tripRowSelected]}
                  activeOpacity={0.75}
                  onPress={() => setTripId(trip.id)}
                >
                  <Ionicons name="car-outline" size={18} color={isSelected ? colors.primary : colors.ink} />
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.tripLabel}>{trip.destinationLabel}</Text>
                    <Text style={styles.tripMeta}>{trip.driverName} - {new Date(trip.dateIso).toLocaleDateString('pt-AO')}</Text>
                  </View>
                  {isSelected ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>O que esqueceste?</Text>
            <View style={styles.itemGrid}>
              {ITEM_TYPES.map((item) => {
                const isSelected = itemId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                    activeOpacity={0.75}
                    onPress={() => setItemId(item.id)}
                  >
                    <Ionicons name={item.icon} size={22} color={isSelected ? colors.primary : colors.ink} />
                    <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Foto do objeto (opcional)</Text>
            {photoUri ? (
              <View style={styles.photoPreviewRow}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <TouchableOpacity style={styles.photoRemoveButton} activeOpacity={0.8} onPress={() => setPhotoUri(null)}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  <Text style={styles.photoRemoveText}>Remover foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoButton} activeOpacity={0.8} onPress={handlePickPhoto}>
                <Ionicons name="camera-outline" size={18} color={colors.primary} />
                <Text style={styles.photoButtonText}>Anexar foto do objeto</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Detalhes adicionais (opcional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Ex: capa azul, autocolante na parte de tras..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <TouchableOpacity
              style={[styles.submitButton, (!tripId || !itemId) && styles.submitButtonDisabled]}
              activeOpacity={0.85}
              disabled={!tripId || !itemId || isSubmitting}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>{isSubmitting ? 'A enviar...' : 'Reportar objeto perdido'}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary },
  scroll: { paddingBottom: spacing.xxl },
  sectionLabel: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: spacing.sm },
  tripRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.xs },
  tripRowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  tripLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  tripMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  itemCard: { width: '31%', aspectRatio: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: '3.5%', marginBottom: spacing.xs },
  itemCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  itemLabel: { ...typography.tiny, color: colors.textSecondary, marginTop: spacing.xxs },
  itemLabelSelected: { color: colors.primaryDark },
  photoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: spacing.sm + 2, marginBottom: spacing.md },
  photoButtonText: { ...typography.captionMedium, color: colors.primary, marginLeft: spacing.xxs },
  photoPreviewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  photoPreview: { width: 56, height: 56, borderRadius: radius.md, marginRight: spacing.sm },
  photoRemoveButton: { flexDirection: 'row', alignItems: 'center' },
  photoRemoveText: { ...typography.caption, color: colors.danger, marginLeft: spacing.xxs },
  textArea: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm, minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.md, ...typography.body, color: colors.textPrimary,
  },
  submitButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { ...typography.bodyMedium, color: colors.textInverse },
  caseBadge: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.md },
  caseNumber: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.xs },
  caseSubtitle: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxs, marginBottom: spacing.md },
  doneButton: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, alignItems: 'center' },
  doneButtonText: { ...typography.bodyMedium, color: colors.textPrimary },
});
