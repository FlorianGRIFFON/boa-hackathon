import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { colors, spacing, radius, typography, Icon } from '@boa/shared-ui'
import { useRitual } from '../hooks/useRitual'
import { StreakDots } from '../components/StreakDots'
import { TodayRitualSummary } from '../components/TodayRitualSummary'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function Home() {
  const router = useRouter()
  const { today, isLoading, streak, last7Days } = useRitual()

  const todayStr = last7Days[last7Days.length - 1]?.date ?? ''

  const morningDone = today?.morningComplete ?? false
  const eveningDone = today?.eveningComplete ?? false

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  function handleEveningPress() {
    router.push('/evening-review')
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Date header */}
      <Text style={styles.dateHeader}>{formatDate(todayStr)}</Text>

      {/* Streak counter */}
      <View style={styles.streakCard}>
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>day streak</Text>
        <Text style={styles.streakHint}>
          {streak === 0
            ? 'Complete both rituals today to start your streak'
            : 'Keep it going — complete both rituals today'}
        </Text>
      </View>

      {/* 7-day completion dots */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Last 7 days</Text>
        <StreakDots days={last7Days} />
        <View style={styles.dotLegend}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendLabel}>Both complete</Text>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendLabel}>Morning only</Text>
          <View style={[styles.legendDot, { backgroundColor: colors.zinc200 }]} />
          <Text style={styles.legendLabel}>Incomplete</Text>
        </View>
      </View>

      {/* Today's ritual status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>

        <TouchableOpacity
          style={[styles.ritualCard, morningDone && styles.ritualCardDone]}
          onPress={() => {
            if (!morningDone) router.push('/morning-ritual')
          }}
          activeOpacity={morningDone ? 1 : 0.7}
        >
          <Icon
            name={morningDone ? 'check-circle' : 'sun'}
            size={24}
            color={morningDone ? colors.success : colors.zinc400}
          />
          <View style={styles.ritualInfo}>
            <Text style={styles.ritualTitle}>Morning Ritual</Text>
            <Text style={styles.ritualSubtitle}>
              {morningDone ? 'Completed' : 'Pick your 3 priorities'}
            </Text>
          </View>
          {!morningDone && (
            <View style={styles.ritualCta}>
              <Text style={styles.ritualCtaText}>Start</Text>
              <Icon name="chevron-right" size={16} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.ritualCard,
            eveningDone && styles.ritualCardDone,
            !morningDone && styles.ritualCardDisabled,
          ]}
          onPress={() => {
            if (morningDone && !eveningDone) handleEveningPress()
          }}
          activeOpacity={morningDone && !eveningDone ? 0.7 : 1}
        >
          <Icon
            name={eveningDone ? 'check-circle' : 'moon'}
            size={24}
            color={eveningDone ? colors.success : colors.zinc400}
          />
          <View style={styles.ritualInfo}>
            <Text style={styles.ritualTitle}>Evening Review</Text>
            <Text style={styles.ritualSubtitle}>
              {eveningDone
                ? 'Completed'
                : morningDone
                ? 'Review your day'
                : 'Complete morning first'}
            </Text>
          </View>
          {morningDone && !eveningDone && (
            <View style={styles.ritualCta}>
              <Text style={styles.ritualCtaText}>Start</Text>
              <Icon name="chevron-right" size={16} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>

        {today ? <TodayRitualSummary today={today} /> : null}
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  dateHeader: {
    ...typography.h3,
    color: colors.zinc600,
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.primary,
    lineHeight: 72,
  },
  streakLabel: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  streakHint: {
    ...typography.bodySmall,
    color: colors.zinc600,
    textAlign: 'center',
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
  dotLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.zinc400,
    marginRight: spacing.sm,
  },
  ritualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.zinc50,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.zinc200,
  },
  ritualCardDone: {
    borderColor: colors.success,
    backgroundColor: '#F0FDF4',
  },
  ritualCardDisabled: {
    opacity: 0.5,
  },
  ritualInfo: {
    flex: 1,
  },
  ritualTitle: {
    ...typography.h3,
    color: colors.zinc900,
  },
  ritualSubtitle: {
    ...typography.bodySmall,
    color: colors.zinc600,
  },
  ritualCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ritualCtaText: {
    ...typography.label,
    color: colors.primary,
  },
})
