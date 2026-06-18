import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SubscriptionButton, colors, spacing, radius, typography } from '@boa/shared-ui'
import { useRitual } from '../hooks/useRitual'
import { PriorityInput } from '../components/PriorityInput'

const DEFAULT_MINUTES = 30

interface PriorityDraft {
  label: string
  estimatedMinutes: number
}

const EMPTY_PRIORITIES: PriorityDraft[] = [
  { label: '', estimatedMinutes: DEFAULT_MINUTES },
  { label: '', estimatedMinutes: DEFAULT_MINUTES },
  { label: '', estimatedMinutes: DEFAULT_MINUTES },
]

export default function MorningRitual() {
  const router = useRouter()
  const { saveMorning } = useRitual()
  const [priorities, setPriorities] = useState<PriorityDraft[]>(EMPTY_PRIORITIES)
  const [isSaving, setIsSaving] = useState(false)

  function updateLabel(index: number, value: string) {
    setPriorities(prev =>
      prev.map((p, i) => (i === index ? { ...p, label: value } : p))
    )
  }

  function updateMinutes(index: number, value: number) {
    setPriorities(prev =>
      prev.map((p, i) => (i === index ? { ...p, estimatedMinutes: value } : p))
    )
  }

  const allFilled = priorities.every(p => p.label.trim().length > 0)

  async function handleConfirm() {
    if (!allFilled || isSaving) return
    setIsSaving(true)
    try {
      await saveMorning(
        priorities.map(p => ({ label: p.label.trim(), estimatedMinutes: p.estimatedMinutes }))
      )
      router.replace('/home')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    // KeyboardAvoidingView behavior differs between iOS and Android:
    // iOS needs 'padding', Android needs 'height' — do not unify
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backLabel}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Morning Ritual</Text>
          <Text style={styles.subtitle}>What are your 3 priorities for today?</Text>
        </View>

        <View style={styles.priorityList}>
          {priorities.map((p, i) => (
            <PriorityInput
              key={i}
              index={i}
              label={p.label}
              estimatedMinutes={p.estimatedMinutes}
              onChangeLabel={val => updateLabel(i, val)}
              onChangeMinutes={val => updateMinutes(i, val)}
            />
          ))}
        </View>

        {!allFilled && (
          <Text style={styles.hint}>Fill in all 3 priorities to confirm</Text>
        )}

        <SubscriptionButton
          label="Confirm priorities"
          onPress={handleConfirm}
          disabled={!allFilled}
          isLoading={isSaving}
          style={styles.confirmButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  backLabel: {
    ...typography.body,
    color: colors.primary,
  },
  title: {
    ...typography.h1,
    color: colors.gray900,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray600,
  },
  priorityList: {
    gap: spacing.md,
  },
  hint: {
    ...typography.bodySmall,
    color: colors.gray400,
    textAlign: 'center',
  },
  confirmButton: {
    marginTop: spacing.sm,
  },
})
