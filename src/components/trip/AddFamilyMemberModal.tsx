import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../common/Input';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface AddFamilyMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, phone: string, relationship: string) => void;
}

const RELATIONSHIPS = ['Filho(a)', 'Conjuge', 'Pai/Mae', 'Outro familiar'];

export default function AddFamilyMemberModal({ visible, onClose, onAdd }: AddFamilyMemberModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState(RELATIONSHIPS[0]);

  const handleClose = () => {
    setName('');
    setPhone('');
    setRelationship(RELATIONSHIPS[0]);
    onClose();
  };

  const handleAdd = () => {
    if (!name.trim() || !phone.trim()) return;
    onAdd(name.trim(), phone.trim(), relationship);
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Adicionar familiar</Text>
            <Ionicons name="close" size={22} color={colors.textMuted} onPress={handleClose} />
          </View>

          <Input placeholder="Nome completo" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input placeholder="Telefone (ex: 923 456 789)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={styles.label}>Relacao</Text>
          <View style={styles.relRow}>
            {RELATIONSHIPS.map((rel) => {
              const isActive = relationship === rel;
              return (
                <TouchableOpacity
                  key={rel}
                  style={[styles.relChip, isActive && styles.relChipActive]}
                  activeOpacity={0.8}
                  onPress={() => setRelationship(rel)}
                >
                  <Text style={[styles.relChipText, isActive && styles.relChipTextActive]}>{rel}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, (!name.trim() || !phone.trim()) && styles.confirmButtonDisabled]}
            activeOpacity={0.85}
            disabled={!name.trim() || !phone.trim()}
            onPress={handleAdd}
          >
            <Text style={styles.confirmButtonText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(7,28,21,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary },
  label: { ...typography.captionMedium, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.sm },
  relRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  relChip: { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: spacing.sm, marginRight: spacing.xs, marginBottom: spacing.xs },
  relChipActive: { backgroundColor: colors.ink },
  relChipText: { ...typography.caption, color: colors.textSecondary },
  relChipTextActive: { color: colors.textInverse },
  confirmButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmButtonText: { ...typography.bodyMedium, color: colors.textInverse },
});
