import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { AppShell, colors, spacing, typography, radius } from '@boa/shared-ui'
import { useSubscription } from '@boa/shared-hooks'
import { useClients } from '../hooks/useClients'
import { useTimeEntries, Gap } from '../hooks/useTimeEntries'

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

interface AssignGapModalProps {
  gap: Gap | null
  clients: ReturnType<typeof useClients>['activeClients']
  onAssign: (gap: Gap, clientId: string) => void
  onDismiss: () => void
}

function AssignGapModal({ gap, clients, onAssign, onDismiss }: AssignGapModalProps) {
  if (!gap) return null

  return (
    <Modal visible animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>Assign gap</Text>
          <Text style={modalStyles.subtitle}>
            {formatTime(gap.startedAt)} to {formatTime(gap.endedAt)} ({formatDuration(gap.durationMs)})
          </Text>
          {clients.map(c => (
            <TouchableOpacity
              key={c.id}
              style={modalStyles.clientRow}
              onPress={() => onAssign(gap, c.id)}
            >
              <View style={[modalStyles.dot, { backgroundColor: c.color }]} />
              <Text style={modalStyles.clientName}>{c.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={onDismiss} style={modalStyles.cancelButton}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const modalStyles = StyleSheet.create({
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.zinc600,
    marginBottom: spacing.lg,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  clientName: {
    ...typography.body,
    color: colors.ink,
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.label,
    color: colors.zinc600,
  },
})

export default function DayViewScreen() {
  const { isSubscribed, isTrialing } = useSubscription()
  const isPaid = isSubscribed || isTrialing

  const { activeClients } = useClients()
  const { entriesForDay, runningEntryForToday, gapsForDay, assignGap } = useTimeEntries()

  const [selectedGap, setSelectedGap] = useState<Gap | null>(null)

  // Paywall gate: non-subscribers land on the paywall automatically
  // The redirect happens on render so it feels immediate
  if (!isPaid) {
    return (
      <AppShell>
        <View style={styles.gateContainer}>
          <Text style={styles.gateTitle}>Today's timeline</Text>
          <Text style={styles.gateBody}>
            See every minute of your day — and which gaps went unbilled.
            Available on Pro.
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

  const now = Date.now()
  const dayEntries = entriesForDay(now)
  const runningToday = runningEntryForToday(now)
  const gaps = gapsForDay(now)

  // Build a unified timeline of entries + gaps, sorted chronologically
  type TimelineItem =
    | { kind: 'entry'; clientId: string; startedAt: number; endedAt: number }
    | { kind: 'running'; clientId: string; startedAt: number }
    | { kind: 'gap'; gap: Gap }

  const items: TimelineItem[] = [
    ...dayEntries.map(e => ({
      kind: 'entry' as const,
      clientId: e.clientId,
      startedAt: e.startedAt,
      endedAt: e.endedAt as number,
    })),
    ...(runningToday
      ? [{ kind: 'running' as const, clientId: runningToday.clientId, startedAt: runningToday.startedAt }]
      : []),
    ...gaps.map(g => ({ kind: 'gap' as const, gap: g })),
  ].sort((a, b) => {
    const aTs = a.kind === 'gap' ? a.gap.startedAt : a.startedAt
    const bTs = b.kind === 'gap' ? b.gap.startedAt : b.startedAt
    return aTs - bTs
  })

  const clientMap = Object.fromEntries(activeClients.map(c => [c.id, c]))

  return (
    <AppShell>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Today</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No entries yet today</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {items.map((item, i) => {
            if (item.kind === 'gap') {
              // Gap items are highlighted — tapping opens the assign modal
              return (
                <TouchableOpacity
                  key={`gap-${i}`}
                  style={styles.gapRow}
                  onPress={() => setSelectedGap(item.gap)}
                >
                  <View style={styles.gapBar} />
                  <View style={styles.gapContent}>
                    <Text style={styles.gapLabel}>Untracked gap</Text>
                    <Text style={styles.gapTime}>
                      {formatTime(item.gap.startedAt)} to {formatTime(item.gap.endedAt)}
                      {' · '}{formatDuration(item.gap.durationMs)}
                    </Text>
                  </View>
                  <Text style={styles.assignHint}>Assign</Text>
                </TouchableOpacity>
              )
            }

            const client = clientMap[item.clientId]
            const clientName = client?.name ?? 'Unknown'
            const clientColor = client?.color ?? colors.zinc400
            const endedAt = item.kind === 'running' ? null : item.endedAt
            const durationMs = endedAt ? endedAt - item.startedAt : Date.now() - item.startedAt

            return (
              <View key={`entry-${i}`} style={styles.entryRow}>
                <View style={[styles.entryBar, { backgroundColor: clientColor }]} />
                <View style={styles.entryContent}>
                  <Text style={styles.entryClient}>{clientName}</Text>
                  <Text style={styles.entryTime}>
                    {formatTime(item.startedAt)}
                    {endedAt ? ` to ${formatTime(endedAt)}` : ' (running)'}
                    {' · '}{formatDuration(durationMs)}
                  </Text>
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}

      <AssignGapModal
        gap={selectedGap}
        clients={activeClients}
        onAssign={(gap, clientId) => {
          assignGap(gap, clientId)
          setSelectedGap(null)
        }}
        onDismiss={() => setSelectedGap(null)}
      />
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
  entryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.zinc200,
  },
  entryBar: {
    width: 3,
    borderRadius: 2,
  },
  entryContent: {
    flex: 1,
  },
  entryClient: {
    ...typography.body,
    color: colors.ink,
    fontWeight: '600',
  },
  entryTime: {
    ...typography.caption,
    color: colors.zinc600,
    marginTop: 2,
  },
  gapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.zinc200,
    // Warm amber tint for untracked gaps — distinct from entry rows without being alarming
    backgroundColor: '#FFFBEB',
  },
  gapBar: {
    width: 3,
    borderRadius: 2,
    height: '100%',
    // Amber-600 to match the warning semantic color
    backgroundColor: '#D97706',
  },
  gapContent: {
    flex: 1,
  },
  gapLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: '#92400E',  // amber-800 — readable on the amber tint background
  },
  gapTime: {
    ...typography.caption,
    color: '#B45309',  // amber-700
    marginTop: 2,
  },
  assignHint: {
    ...typography.caption,
    color: '#D97706',
  },
})
