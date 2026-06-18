import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, typography } from '@boa/shared-ui'
import { useElapsedTime } from '../hooks/useElapsedTime'

// App accent — warm teal, domain-appropriate for a time/billing tool
const ACCENT = '#0F766E'

interface TimerDisplayProps {
  clientName: string
  clientColor: string
  startedAt: number
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  return `${hh}:${mm}:${ss}`
}

export function TimerDisplay({ clientName, clientColor, startedAt }: TimerDisplayProps) {
  const elapsed = useElapsedTime(startedAt)

  return (
    <View style={styles.container}>
      <View style={[styles.colorBar, { backgroundColor: clientColor }]} />
      <View style={styles.content}>
        <Text style={styles.label}>Billing</Text>
        <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
        <Text style={styles.elapsed}>{formatElapsed(elapsed)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.zinc50,
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    // Single shadow level per ui-design rules — only this one element earns a shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.zinc400,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  clientName: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  elapsed: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.ink,
    // Monospaced numeric width prevents layout shift each second
    fontVariant: ['tabular-nums'],
    lineHeight: 40,
  },
})
