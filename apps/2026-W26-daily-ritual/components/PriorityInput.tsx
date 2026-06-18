import React from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { colors, spacing, radius, typography } from '@boa/shared-ui'

interface PriorityInputProps {
  index: number
  label: string
  estimatedMinutes: number
  onChangeLabel: (value: string) => void
  onChangeMinutes: (value: number) => void
}

const MINUTE_OPTIONS = [15, 30, 45, 60, 90, 120]

export function PriorityInput({
  index,
  label,
  estimatedMinutes,
  onChangeLabel,
  onChangeMinutes,
}: PriorityInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.index}>{index + 1}</Text>
      <View style={styles.fields}>
        <TextInput
          style={styles.textInput}
          value={label}
          onChangeText={onChangeLabel}
          placeholder="What's your priority?"
          placeholderTextColor={colors.gray400}
          returnKeyType="done"
          maxLength={80}
        />
        <View style={styles.minuteRow}>
          {MINUTE_OPTIONS.map(mins => (
            <TouchableOpacity
              key={mins}
              onPress={() => onChangeMinutes(mins)}
              style={[
                styles.minuteChip,
                estimatedMinutes === mins && styles.minuteChipSelected,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.minuteChipLabel,
                  estimatedMinutes === mins && styles.minuteChipLabelSelected,
                ]}
              >
                {mins < 60 ? `${mins}m` : `${mins / 60}h`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  index: {
    ...typography.h3,
    color: colors.primary,
    width: 24,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  fields: {
    flex: 1,
    gap: spacing.sm,
  },
  textInput: {
    ...typography.body,
    color: colors.gray900,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingVertical: spacing.xs,
  },
  minuteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  minuteChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  minuteChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  minuteChipLabel: {
    ...typography.caption,
    color: colors.gray600,
  },
  minuteChipLabelSelected: {
    color: colors.white,
  },
})
