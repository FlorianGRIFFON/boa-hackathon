import React, { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native'
import { colors, spacing, typography, radius } from '@boa/shared-ui'
import type { Client } from '../hooks/useClients'

interface ClientFormProps {
  visible: boolean
  existingClient?: Client
  onSave: (name: string, hourlyRate: number | null) => void
  onCancel: () => void
  onArchive?: () => void
}

export function ClientForm({
  visible,
  existingClient,
  onSave,
  onCancel,
  onArchive,
}: ClientFormProps) {
  const [name, setName] = useState(existingClient?.name ?? '')
  const [rateText, setRateText] = useState(
    existingClient?.hourlyRate != null ? String(existingClient.hourlyRate) : ''
  )

  // Reset local state when the form opens
  React.useEffect(() => {
    if (visible) {
      setName(existingClient?.name ?? '')
      setRateText(
        existingClient?.hourlyRate != null ? String(existingClient.hourlyRate) : ''
      )
    }
  }, [visible, existingClient])

  const canSave = name.trim().length > 0

  function handleSave() {
    if (!canSave) return
    const rate = rateText.trim() !== '' ? parseFloat(rateText) : null
    onSave(name.trim(), rate !== null && !isNaN(rate) ? rate : null)
  }

  const isEditing = existingClient !== undefined

  return (
    <Modal visible={visible} transparent animationType="slide">
      {/* KeyboardAvoidingView behavior differs between iOS and Android:
          iOS needs 'padding', Android needs 'height' — do not unify */}
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>{isEditing ? 'Edit client' : 'Add client'}</Text>

          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Client name"
            placeholderTextColor={colors.zinc400}
            autoFocus={!isEditing}
            returnKeyType="next"
          />

          <Text style={styles.fieldLabel}>Hourly rate (optional)</Text>
          <TextInput
            style={styles.input}
            value={rateText}
            onChangeText={setRateText}
            placeholder="e.g. 150"
            placeholderTextColor={colors.zinc400}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
              disabled={!canSave}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          {isEditing && onArchive ? (
            <TouchableOpacity onPress={onArchive} style={styles.archiveButton}>
              <Text style={styles.archiveText}>Archive client</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.zinc600,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.zinc200,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.zinc200,
  },
  cancelText: {
    ...typography.label,
    color: colors.zinc600,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: '#0F766E',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveText: {
    ...typography.label,
    color: colors.white,
  },
  archiveButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  archiveText: {
    ...typography.bodySmall,
    color: colors.error,
  },
})
