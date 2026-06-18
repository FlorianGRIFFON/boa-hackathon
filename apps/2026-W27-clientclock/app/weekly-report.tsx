import React, { useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { AppShell, colors, spacing, typography, radius } from '@boa/shared-ui'
import { useSubscription } from '@boa/shared-hooks'
import { useClients } from '../hooks/useClients'
import { useTimeEntries } from '../hooks/useTimeEntries'

function msToHours(ms: number): number {
  return ms / 3_600_000
}

function formatHours(ms: number): string {
  const hours = msToHours(ms)
  if (hours < 0.1) return '0.1h'
  // Round to one decimal — clean enough for invoice copy-paste
  return `${Math.round(hours * 10) / 10}h`
}

function getISOWeekStart(date: Date): Date {
  // ISO week starts on Monday
  const d = new Date(date)
  const day = d.getDay()
  // getDay returns 0 for Sunday; we treat 0 as 7 to find Monday
  const diff = d.getDate() - (day === 0 ? 6 : day - 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const startStr = weekStart.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const endStr = weekEnd.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return `${startStr} to ${endStr}`
}

function buildReportText(
  weekRange: string,
  rows: { name: string; totalMs: number; rate: number | null }[]
): string {
  const lines = [`Time summary — ${weekRange}`, '']
  rows.forEach(r => {
    const hours = formatHours(r.totalMs)
    if (r.rate !== null) {
      const billable = (msToHours(r.totalMs) * r.rate).toFixed(2)
      lines.push(`${r.name}: ${hours} @ $${r.rate}/hr = $${billable}`)
    } else {
      lines.push(`${r.name}: ${hours}`)
    }
  })
  return lines.join('\n')
}

export default function WeeklyReportScreen() {
  const { isSubscribed, isTrialing } = useSubscription()
  const isPaid = isSubscribed || isTrialing

  const { activeClients, clients } = useClients()
  const { weeklyTotals } = useTimeEntries()

  // The text block is selectable via long-press — per success_criteria
  const reportTextRef = useRef<Text>(null)

  if (!isPaid) {
    return (
      <AppShell>
        <View style={styles.gateContainer}>
          <Text style={styles.gateTitle}>Weekly summary</Text>
          <Text style={styles.gateBody}>
            Get a ready-to-paste weekly breakdown with total hours and billable
            amounts per client. Available on Pro.
          </Text>
          <TouchableOpacity
            style={styles.gateButton}
            onPress={() => router.push('/paywall')}
          >
            <Text style={styles.gateButtonText}>Unlock Pro</Text>
          </TouchableOpacity>
        </View>
      </AppShell>
    )
  }

  const today = new Date()
  const weekStart = getISOWeekStart(today)
  const totals = weeklyTotals(weekStart.getTime())

  // All clients (including archived) may appear in this week's entries
  const allClients = clients
  const clientMap = Object.fromEntries(allClients.map(c => [c.id, c]))

  const rows = Object.entries(totals)
    .map(([clientId, totalMs]) => {
      const client = clientMap[clientId]
      return {
        clientId,
        name: client?.name ?? 'Unknown',
        totalMs,
        rate: client?.hourlyRate ?? null,
        color: client?.color ?? colors.zinc400,
      }
    })
    .filter(r => r.totalMs > 0)
    .sort((a, b) => b.totalMs - a.totalMs)

  const weekRange = formatWeekRange(weekStart)
  const reportText = buildReportText(weekRange, rows)

  return (
    <AppShell>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Week</Text>
        <Text style={styles.weekRange}>{weekRange}</Text>
      </View>

      {rows.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No time logged this week</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {rows.map(row => (
            <View key={row.clientId} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: row.color }]} />
              <View style={styles.rowContent}>
                <Text style={styles.clientName}>{row.name}</Text>
                {row.rate !== null ? (
                  <Text style={styles.clientRate}>${row.rate}/hr</Text>
                ) : null}
              </View>
              <View style={styles.totalBlock}>
                <Text style={styles.totalHours}>{formatHours(row.totalMs)}</Text>
                {row.rate !== null ? (
                  <Text style={styles.totalBillable}>
                    ${(msToHours(row.totalMs) * row.rate).toFixed(0)}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}

          {/* Plain text block — long-press selects all for copy-paste into invoices */}
          <View style={styles.copyBlock}>
            <Text style={styles.copyLabel}>Copy-paste summary</Text>
            {/* selectable={true} enables single long-press text selection per success_criteria */}
            <Text
              ref={reportTextRef}
              selectable
              style={styles.copyText}
            >
              {reportText}
            </Text>
          </View>
        </ScrollView>
      )}
    </AppShell>
  )
}

const styles = StyleSheet.create({
  gateContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  gateTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  gateBody: {
    ...typography.body,
    color: colors.zinc600,
    lineHeight: 26,
  },
  gateButton: {
    backgroundColor: '#0F766E',
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  gateButtonText: {
    ...typography.label,
    fontSize: 16,
    color: colors.white,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  screenTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  weekRange: {
    ...typography.bodySmall,
    color: colors.zinc600,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.zinc400,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.zinc200,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowContent: {
    flex: 1,
  },
  clientName: {
    ...typography.body,
    color: colors.ink,
  },
  clientRate: {
    ...typography.caption,
    color: colors.zinc400,
    marginTop: 2,
  },
  totalBlock: {
    alignItems: 'flex-end',
  },
  totalHours: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
  },
  totalBillable: {
    ...typography.caption,
    color: colors.zinc600,
    marginTop: 2,
  },
  copyBlock: {
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.zinc50,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.zinc200,
  },
  copyLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.zinc400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  copyText: {
    // System monospaced — preserves column alignment for invoice copy-paste
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    color: colors.ink,
    lineHeight: 22,
  },
})
