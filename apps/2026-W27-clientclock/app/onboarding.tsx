import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { AppShell, OnboardingStep, colors, spacing, typography, radius } from '@boa/shared-ui'
import { useOnboarding } from '@boa/shared-hooks'
import { useClients } from '../hooks/useClients'
import { useTimeEntries } from '../hooks/useTimeEntries'
import { useOnboardingComplete } from '../hooks/useOnboardingComplete'

// Onboarding completes in 3 steps as required by success_criteria:
// Step 0: Welcome — introduce the app
// Step 1: Add your first client — capture a name and optional rate
// Step 2: Start — start the timer for that client immediately

export default function OnboardingScreen() {
  const { currentStep, next, skip } = useOnboarding({ totalSteps: 3 })
  const { addClient } = useClients()
  const { switchClient } = useTimeEntries()
  const { markComplete } = useOnboardingComplete()

  const [clientName, setClientName] = useState('')
  const [rateText, setRateText] = useState('')

  function handleSkip() {
    markComplete()
    router.replace('/')
  }

  function handleNext() {
    if (currentStep === 2) {
      // Step 3: start the timer and go to Home
      if (clientName.trim()) {
        const rate = rateText.trim() !== '' ? parseFloat(rateText) : null
        const client = addClient(clientName.trim(), !isNaN(rate as number) && rate !== null ? rate : null)
        switchClient(client.id)
      }
      markComplete()
      router.replace('/')
      return
    }
    next()
  }

  const TEAL = '#0F766E'

  return (
    <AppShell>
      {/* KeyboardAvoidingView behavior differs between iOS and Android:
          iOS needs 'padding', Android needs 'height' — do not unify */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {currentStep === 0 && (
          <OnboardingStep
            title="Switch clients in one tap."
            description="The running timer is always on screen. Tap any client to switch billing instantly — no navigation, no confirmation."
            currentStep={0}
            totalSteps={3}
            style={styles.step}
          />
        )}

        {currentStep === 1 && (
          <View style={styles.inputStep}>
            <OnboardingStep
              title="Add your first client."
              description="Give them a name. Add an hourly rate if you want to see billable amounts — you can skip this now."
              currentStep={1}
              totalSteps={3}
              style={styles.stepNoFlex}
            />
            <View style={styles.fields}>
              <TextInput
                style={styles.input}
                value={clientName}
                onChangeText={setClientName}
                placeholder="Client name"
                placeholderTextColor={colors.zinc400}
                autoFocus
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                value={rateText}
                onChangeText={setRateText}
                placeholder="Hourly rate (optional)"
                placeholderTextColor={colors.zinc400}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
          </View>
        )}

        {currentStep === 2 && (
          <OnboardingStep
            title="Ready to bill."
            description={clientName.trim() ? `Tap below to start the clock on ${clientName.trim()}.` : 'Tap below to open the timer. Add clients anytime from the Clients tab.'}
            currentStep={2}
            totalSteps={3}
            style={styles.step}
          />
        )}

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.nextButton,
              { backgroundColor: TEAL },
              currentStep === 1 && !clientName.trim() && styles.nextButtonDisabled,
            ]}
            disabled={currentStep === 1 && !clientName.trim()}
          >
            <Text style={styles.nextText}>
              {currentStep === 2 ? 'Start timer' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AppShell>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  step: {
    flex: 1,
  },
  stepNoFlex: {},
  inputStep: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  fields: {
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.zinc200,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.ink,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  skipButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.zinc200,
  },
  skipText: {
    ...typography.label,
    color: colors.zinc600,
  },
  nextButton: {
    flex: 2,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextText: {
    ...typography.label,
    fontSize: 16,
    color: colors.white,
  },
})
