import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, spacing, radius, typography } from '@boa/shared-ui'
import type { PriorityStatus } from '../hooks/useRitual'

interface PriorityStatusRowProps {
  index: number
  label: string
  status: PriorityStatus
  onChangeStatus: (status: PriorityStatus) => void
}

const STATUS_OPTIONS: Array<{ value: PriorityStatus; label: string }> = [
  { value: 'done', label: 'Done' },
  { value: 'partial', label: 'Partial' },
  { value: 'skipped', label: 'Skip' },
]

export function PriorityStatusRow({
  index,
  label,
  status,
  onChangeStatus,
}: PriorityStatusRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.index}>{index + 1}</Text>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
      </View>
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map(option => {
          const isSelected = status === option.value

          return (
            <Pressable
              key={option.value}
              onPress={() => onChangeStatus(option.value)}
              style={({ pressed }) => [
                styles.statusChip,
                isSelected && styles.statusChipSelected,
                pressed && styles.statusChipPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.statusLabel,
                  isSelected && styles.statusLabelSelected,
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.zinc50,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  index: {
    ...typography.label,
    color: colors.primary,
    width: 20,
  },
  label: {
    ...typography.body,
    color: colors.zinc900,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusChip: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.zinc200,
    backgroundColor: colors.white,
  },
  statusChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipPressed: {
    opacity: 0.85,
  },
  statusLabel: {
    ...typography.caption,
    color: colors.zinc600,
    fontWeight: '500',
  },
  statusLabelSelected: {
    color: colors.white,
    fontWeight: '600',
  },
})
