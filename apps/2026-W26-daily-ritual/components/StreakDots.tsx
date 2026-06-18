import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius, typography } from '@boa/shared-ui'

interface DayDot {
  date: string
  morningDone: boolean
  eveningDone: boolean
}

interface StreakDotsProps {
  days: DayDot[]
}

// Returns a 1-letter weekday label for a YYYY-MM-DD date string
function weekdayInitial(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00') // noon to avoid DST edge cases
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()]
}

export function StreakDots({ days }: StreakDotsProps) {
  return (
    <View style={styles.row}>
      {days.map(day => {
        const bothDone = day.morningDone && day.eveningDone
        const halfDone = day.morningDone && !day.eveningDone
        return (
          <View key={day.date} style={styles.dayColumn}>
            <View
              style={[
                styles.dot,
                bothDone && styles.dotFull,
                halfDone && styles.dotHalf,
              ]}
            />
            <Text style={styles.label}>{weekdayInitial(day.date)}</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  dayColumn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.gray200,
  },
  dotFull: {
    backgroundColor: colors.primary,
  },
  dotHalf: {
    // Morning only — show half-filled appearance via a warning color
    backgroundColor: colors.warning,
  },
  label: {
    ...typography.caption,
    color: colors.gray400,
  },
})
