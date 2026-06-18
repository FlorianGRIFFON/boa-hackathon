import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { AppShell, PaywallScreen, colors, spacing, typography } from '@boa/shared-ui'
import { useSubscription } from '@boa/shared-hooks'

// Features written as outcomes (not feature names), per ui-design rules
const FEATURES = [
  { label: 'Track time for as many clients as you have, with no cap' },
  { label: 'See exactly which gaps in your day went unbilled — and fix them' },
  { label: 'Get a ready-to-paste weekly summary for any client invoice or email' },
]

export default function PaywallPage() {
  const { subscribe, restore, isLoading } = useSubscription()

  async function handleSubscribe() {
    await subscribe('com.boa.clientclock.pro_monthly')
    // After successful subscription, go back to wherever the user came from
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/')
    }
  }

  async function handleRestore() {
    await restore()
    if (router.canGoBack()) {
      router.back()
    }
  }

  return (
    <AppShell>
      <View style={styles.closeRow}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
      <PaywallScreen
        appName="ClientClock"
        tagline="Stop losing billable hours to switching friction"
        features={FEATURES}
        price="$6.99"
        billingPeriod="month"
        trialDays={14}
        onSubscribe={handleSubscribe}
        onRestore={handleRestore}
        isLoading={isLoading}
      />
    </AppShell>
  )
}

const styles = StyleSheet.create({
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  closeText: {
    ...typography.label,
    color: colors.zinc600,
  },
})
