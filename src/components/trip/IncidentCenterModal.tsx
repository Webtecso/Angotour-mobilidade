import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { recordIncident } from '../../services/incidentStore';
import { tripHistory } from '../../services/mockData';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface IncidentCenterModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: { id: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'cobranca', label: 'Cobranca incorreta', icon: 'cash-outline' },
  { id: 'cancelou', label: 'Motorista cancelou', icon: 'close-circle-outline' },
  { id: 'seguranca', label: 'Problema de seguranca', icon: 'shield-outline' },
  { id: 'veiculo', label: 'Veiculo diferente', icon: 'car-outline' },
  { id: 'outro', label: 'Outro problema', icon: 'help-circle-outline' },
];

const STATUS_STEPS = ['Recebido', 'Analise automatica', 'Em investigacao', 'Decisao', 'Resolvido'];

export default function IncidentCenterModal({ visible, onClose }: IncidentCenterModalProps) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [caseNumber, setCaseNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setCategoryId(null);
    setTripId(null);
    setDescription('');
    setCaseNumber(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!categoryId) return;
    setIsSubmitting(true);
    try {
      const category = CATEGORIES.find((c) => c.id === categoryId)?.label ?? 'Outro problema';
      const record = await recordIncident(category, description.trim(), tripId ?? undefined);
      setCaseNumber(record.caseNumber);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{caseNumber ? 'Caso registado' : 'Reportar um problema'}</Text>
          <Ionicons name="close" size={24} color={colors.textMuted} onPress={handleClose} />
        </View>

        {caseNumber ? (
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.caseBadge}>
              <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
              <Text style={styles.caseNumber}>#{caseNumber}</Text>
              <Text style={styles.caseSubtitle}>Vamos analisar o teu caso e manter-te informado aqui.</Text>
            </View>
            <View style={styles.stepList}>
              {STATUS_STEPS.map((step, i) => (
                <View key={step} style={styles.stepRow}>
                  <View style={[styles.stepDot, i === 0 && styles.stepDotActive]} />
                  <Text style={[styles.stepText, i === 0 && styles.stepTextActive]}>{step}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.doneButton} activeOpacity={0.85} onPress={handleClose}>
              <Text style={styles.doneButtonText}>Concluir</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.sectionLabel}>Categoria</Text>
            {CATEGORIES.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryRow, isSelected && styles.categoryRowSelected]}
                  activeOpacity={0.75}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Ionicons name={cat.icon} size={18} color={isSelected ? colors.primary : colors.ink} />
                  <Text style={styles.categoryText}>{cat.label}</Text>
                  {isSelected ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Viagem relacionada (opcional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
              {tripHistory.map((trip) => {
                const isSelected = tripId === trip.id;
                return (
                  <TouchableOpacity
                    key={trip.id}
                    style={[styles.tripChip, isSelected && styles.tripChipSelected]}
                    activeOpacity={0.75}
                    onPress={() => setTripId(isSelected ? null : trip.id)}
                  >
                    <Text style={[styles.tripChipText, isSelected && styles.tripChipTextSelected]} numberOfLines={1}>
                      {trip.destinationLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionLabel}>Descreve o que aconteceu</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Conta-nos os detalhes..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <TouchableOpacity
              style={[styles.submitButton, !categoryId && styles.submitButtonDisabled]}
              activeOpacity={0.85}
              disabled={!categoryId || isSubmitting}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>{isSubmitting ? 'A enviar...' : 'Enviar reporte'}</Text>
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
  categoryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.xs },
  categoryRowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  categoryText: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1, marginLeft: spacing.sm },
  tripChip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.sm, marginRight: spacing.xs, maxWidth: 160 },
  tripChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  tripChipText: { ...typography.caption, color: colors.textPrimary },
  tripChipTextSelected: { color: colors.primaryDark },
  textArea: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm, minHeight: 90, textAlignVertical: 'top', marginBottom: spacing.md, ...typography.body, color: colors.textPrimary,
  },
  submitButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { ...typography.bodyMedium, color: colors.textInverse },
  caseBadge: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  caseNumber: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.xs },
  caseSubtitle: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxs },
  stepList: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  stepDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.borderStrong, marginRight: spacing.sm },
  stepDotActive: { backgroundColor: colors.primary },
  stepText: { ...typography.body, color: colors.textMuted },
  stepTextActive: { color: colors.textPrimary },
  doneButton: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  doneButtonText: { ...typography.bodyMedium, color: colors.textPrimary },
});
