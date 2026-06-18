import React, { useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { AppShell, colors, spacing, typography } from '@boa/shared-ui'
import { useSubscription } from '@boa/shared-hooks'
import { useClients } from '../hooks/useClients'
import { useTimeEntries } from '../hooks/useTimeEntries'
import { useOnboardingComplete } from '../hooks/useOnboardingComplete'
import { TimerDisplay } from '../components/TimerDisplay'
import { ClientRow } from '../components/ClientRow'

// Free tier: max 2 active clients before paywall appears
const FREE_TIER_CLIENT_LIMIT = 2

export default function HomeScreen() {
  const { isOnboardingComplete } = useOnboardingComplete()
  const { activeClients } = useClients()
  const { runningEntry, switchClient, stopCurrent } = useTimeEntries()
  const { isSubscribed, isTrialing } = useSubscription()

  const isPaid = isSubscribed || isTrialing

  // Redirect to onboarding on first launch (null = loading, false = not done)
  useEffect(() => {
    if (isOnboardingComplete === false) {
      router.replace('/onboarding')
    }
  }, [isOnboardingComplete])

  const activeClient = activeClients.find(c => c.id === runningEntry?.clientId)

  // The single-tap switcher: stops current timer and starts one for the tapped client.
  // The spec requires this within 200ms of the tap — no async work is done before
  // calling switchClient, so the only latency is the React state update + AsyncStorage
  // write (which is non-blocking and happens after the state update).
  function handleClientTap(clientId: string) {
    if (runningEntry?.clientId === clientId) {
      // Tapping the active client stops the timer (no switch needed)
      stopCurrent()
      return
    }
    switchClient(clientId)
  }

  // Only show clients up to the free tier limit for non-subscribers
  const visibleClients = isPaid
    ? activeClients
    : activeClients.slice(0, FREE_TIER_CLIENT_LIMIT)

  const hiddenCount = activeClients.length - visibleClients.length

  return (
    <AppShell>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>ClientClock</Text>
        <TouchableOpacity
          onPress={() => router.push('/paywall')}
          style={styles.upgradeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {!isPaid ? <Text style={styles.upgradeText}>Upgrade</Text> : null}
        </TouchableOpacity>
      </View>

      {runningEntry && activeClient ? (
        <TimerDisplay
          clientName={activeClient.name}
          clientColor={activeClient.color}
          startedAt={runningEntry.startedAt}
        />
      ) : (
        <View style={styles.idleState}>
          <Text style={styles.idleText}>No timer running</Text>
          <Text style={styles.idleSubtext}>Tap a client below to start billing</Text>
        </View>
      )}

      <Text style={styles.sectionLabel}>
        {activeClients.length === 0 ? 'No clients yet' : 'Tap to switch'}
      </Text>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {visibleClients.map(client => (
          <ClientRow
            key={client.id}
            client={client}
            isActive={runningEntry?.clientId === client.id}
            onPress={c => handleClientTap(c.id)}
          />
        ))}

        {hiddenCount > 0 && (
          // Free tier limit reached — nudge to upgrade rather than hiding silently
          <TouchableOpacity
            style={styles.limitRow}
            onPress={() => router.push('/paywall')}
          >
            <Text style={styles.limitText}>
              {hiddenCount} more client{hiddenCount !== 1 ? 's' : ''} — unlock with Pro
            </Text>
          </TouchableOpacity>
        )}

        {activeClients.length === 0 && (
          <TouchableOpacity
            style={styles.addFirstClient}
            onPress={() => router.push('/clients')}
          >
            <Text style={styles.addFirstClientText}>Add your first client</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </AppShell>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  screenTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  upgradeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0F766E',
  },
  upgradeText: {
    ...typography.label,
    fontSize: 13,
    color: '#0F766E',
  },
  idleState: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.zinc50,
    borderRadius: 6,
  },
  idleText: {
    ...typography.h3,
    color: colors.zinc600,
    marginBottom: spacing.xs,
  },
  idleSubtext: {
    ...typography.bodySmall,
    color: colors.zinc400,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.zinc400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: {
    flex: 1,
  },
  limitRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.zinc200,
  },
  limitText: {
    ...typography.bodySmall,
    color: '#0F766E',
    fontWeight: '600',
  },
  addFirstClient: {
    margin: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.zinc200,
    borderRadius: 6,
    borderStyle: 'dashed',
  },
  addFirstClientText: {
    ...typography.label,
    color: colors.zinc600,
  },
})
