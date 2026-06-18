import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius, typography } from '@boa/shared-ui'
import type { DayRecord, PriorityStatus } from '../hooks/useRitual'
import { REFLECTION_PROMPT } from '../constants/ritual'

interface TodayRitualSummaryProps {
  today: DayRecord
}

function statusLabel(status: PriorityStatus): string {
  if (status === 'done') return 'Done'
  if (status === 'partial') return 'Partial'
  if (status === 'skipped') return 'Skipped'
  return ''
}

function statusColor(status: PriorityStatus): string {
  if (status === 'done') return colors.success
  if (status === 'partial') return colors.warning
  if (status === 'skipped') return colors.zinc400
  return colors.zinc600
}

export function TodayRitualSummary({ today }: TodayRitualSummaryProps) {
  const { priorities, morningComplete, eveningComplete, reflectionAnswer, carryOver } = today

  if (!morningComplete || priorities.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {eveningComplete ? "Today's review" : "Today's priorities"}
      </Text>

      <View style={styles.priorityList}>
        {priorities.map((priority, index) => (
          <View key={index} style={styles.priorityRow}>
            <Text style={styles.priorityIndex}>{index + 1}</Text>
            <View style={styles.priorityBody}>
              <Text style={styles.priorityLabel}>{priority.label}</Text>
              <View style={styles.priorityMeta}>
                <Text style={styles.priorityMinutes}>
                  {priority.estimatedMinutes} min
                </Text>
                {eveningComplete && priority.status !== 'pending' ? (
                  <Text
                    style={[
                      styles.priorityStatus,
                      { color: statusColor(priority.status) },
                    ]}
                  >
                    {statusLabel(priority.status)}
                    {carryOver[index] && priority.status !== 'done'
                      ? ' · carrying over'
                      : ''}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </View>

      {eveningComplete ? (
        <View style={styles.reflectionBlock}>
          <Text style={styles.reflectionTitle}>Reflection</Text>
          <Text style={styles.reflectionPrompt}>{REFLECTION_PROMPT}</Text>
          <Text style={styles.reflectionAnswer}>
            {reflectionAnswer.trim().length > 0
              ? reflectionAnswer.trim()
              : 'No answer recorded'}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    backgroundColor: colors.zinc50,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.zinc200,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.zinc400,
    textTransform: 'uppercase',
  },
  priorityList: {
    gap: spacing.sm,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  priorityIndex: {
    ...typography.label,
    color: colors.primary,
    width: 20,
    marginTop: 2,
  },
  priorityBody: {
    flex: 1,
    gap: spacing.xs,
  },
  priorityLabel: {
    ...typography.body,
    color: colors.zinc900,
  },
  priorityMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  priorityMinutes: {
    ...typography.caption,
    color: colors.zinc600,
  },
  priorityStatus: {
    ...typography.caption,
    fontWeight: '600',
  },
  reflectionBlock: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.zinc200,
  },
  reflectionTitle: {
    ...typography.label,
    color: colors.zinc400,
    textTransform: 'uppercase',
  },
  reflectionPrompt: {
    ...typography.bodySmall,
    color: colors.zinc600,
  },
  reflectionAnswer: {
    ...typography.body,
    color: colors.zinc900,
  },
})
