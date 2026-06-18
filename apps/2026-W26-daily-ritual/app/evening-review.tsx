import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { colors, spacing, radius, typography, Checkbox } from '@boa/shared-ui'
import { useRitual } from '../hooks/useRitual'
import type { PriorityStatus } from '../hooks/useRitual'
import { PriorityStatusRow } from '../components/PriorityStatusRow'
import { REFLECTION_PROMPT } from '../constants/ritual'

export default function EveningReview() {
  const router = useRouter()
  const { today, saveEvening } = useRitual()

  const priorities = today?.priorities ?? []

  const [statuses, setStatuses] = useState<PriorityStatus[]>(
    priorities.map(() => 'pending' as PriorityStatus)
  )
  const [carryOver, setCarryOver] = useState<boolean[]>(
    priorities.map(() => false)
  )
  const [reflection, setReflection] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function updateStatus(index: number, status: PriorityStatus) {
    setStatuses(prev => prev.map((s, i) => (i === index ? status : s)))
    // Auto-select carry-over for skipped and partial priorities
    if (status === 'skipped' || status === 'partial') {
      setCarryOver(prev => prev.map((c, i) => (i === index ? true : c)))
    } else if (status === 'done') {
      setCarryOver(prev => prev.map((c, i) => (i === index ? false : c)))
    }
  }

  function toggleCarryOver(index: number) {
    setCarryOver(prev => prev.map((c, i) => (i === index ? !c : c)))
  }

  const allStatusSet = statuses.every(s => s !== 'pending')

  async function handleCloseDay() {
    if (!allStatusSet || isSaving) return
    setIsSaving(true)
    try {
      await saveEvening(statuses, reflection.trim(), carryOver)
      router.replace('/home')
    } finally {
      setIsSaving(false)
    }
  }

  if (priorities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Complete your morning ritual first before starting the evening review.
        </Text>
        <TouchableOpacity onPress={() => router.replace('/home')} activeOpacity={0.7}>
          <Text style={styles.backLink}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    )
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
          <Text style={styles.title}>Evening Review</Text>
          <Text style={styles.subtitle}>How did your priorities go today?</Text>
        </View>

        {/* Priority status section — displays all 3 priority labels from morning ritual verbatim */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your priorities</Text>
          <View style={styles.priorityList}>
            {priorities.map((p, i) => (
              <PriorityStatusRow
                key={i}
                index={i}
                label={p.label}
                status={statuses[i] ?? 'pending'}
                onChangeStatus={status => updateStatus(i, status)}
              />
            ))}
          </View>
        </View>

        {/* Carry-over selector — only shown for non-done items */}
        {priorities.some((_, i) => statuses[i] !== 'done') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Carry over to tomorrow?</Text>
            <View style={styles.carryOverList}>
              {priorities.map((p, i) => {
                if (statuses[i] === 'done') return null
                return (
                  <Pressable
                    key={i}
                    onPress={() => toggleCarryOver(i)}
                    style={({ pressed }) => [
                      styles.carryOverRow,
                      carryOver[i] && styles.carryOverRowSelected,
                      pressed && styles.carryOverRowPressed,
                    ]}
                  >
                    <Checkbox checked={carryOver[i] ?? false} />
                    <Text style={styles.carryOverLabel} numberOfLines={2}>
                      {p.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )}

        {/* Fixed reflection prompt */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reflection</Text>
          <Text style={styles.reflectionPrompt}>{REFLECTION_PROMPT}</Text>
          <TextInput
            style={styles.reflectionInput}
            value={reflection}
            onChangeText={setReflection}
            placeholder="Type your answer here..."
            placeholderTextColor={colors.zinc400}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            returnKeyType="default"
          />
        </View>

        {!allStatusSet && (
          <Text style={styles.hint}>Mark each priority as done, partial, or skipped</Text>
        )}

        <TouchableOpacity
          style={[styles.closeButton, (!allStatusSet || isSaving) && styles.closeButtonDisabled]}
          onPress={handleCloseDay}
          disabled={!allStatusSet || isSaving}
          activeOpacity={0.8}
        >
          <Text style={styles.closeButtonText}>
            {isSaving ? 'Saving…' : 'Close the day'}
          </Text>
        </TouchableOpacity>
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.white,
  },
  emptyText: {
    ...typography.body,
    color: colors.zinc600,
    textAlign: 'center',
  },
  backLink: {
    ...typography.body,
    color: colors.primary,
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
    color: colors.zinc900,
  },
  subtitle: {
    ...typography.body,
    color: colors.zinc600,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.zinc400,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priorityList: {
    gap: spacing.md,
  },
  carryOverList: {
    gap: spacing.sm,
  },
  carryOverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.zinc50,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.zinc200,
  },
  carryOverRowSelected: {
    backgroundColor: colors.zinc100,
    borderColor: colors.primary,
  },
  carryOverRowPressed: {
    opacity: 0.85,
  },
  carryOverLabel: {
    ...typography.body,
    color: colors.zinc900,
    flex: 1,
  },
  reflectionPrompt: {
    ...typography.body,
    color: colors.zinc900,
    fontWeight: '600',
  },
  reflectionInput: {
    ...typography.body,
    color: colors.zinc900,
    backgroundColor: colors.zinc50,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.zinc200,
    minHeight: 80,
  },
  hint: {
    ...typography.bodySmall,
    color: colors.zinc400,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  closeButtonDisabled: {
    opacity: 0.4,
  },
  closeButtonText: {
    ...typography.label,
    color: colors.white,
    fontSize: 16,
  },
})
