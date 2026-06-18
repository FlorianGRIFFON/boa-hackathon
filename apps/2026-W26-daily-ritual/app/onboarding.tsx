import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import {
  OnboardingStep,
  SubscriptionButton,
  colors,
  spacing,
  typography,
  type IconName,
} from '@boa/shared-ui'
import { useOnboarding } from '@boa/shared-hooks'
import { useHasOnboarded } from '../hooks/useHasOnboarded'

const STEPS: Array<{
  iconName: IconName
  title: string
  description: string
}> = [
  {
    iconName: 'sun',
    title: 'Build your daily ritual',
    description:
      'Each morning, pick your 3 most important priorities and estimate how long each will take. A 2-minute ritual that sets the tone for your whole day.',
  },
  {
    iconName: 'moon',
    title: 'Close the day intentionally',
    description:
      'Each evening, mark what got done, carry incomplete items forward, and answer one reflection prompt. No guilt, just honest closure.',
  },
  {
    iconName: 'zap',
    title: 'Build the habit with streaks',
    description:
      'Your streak grows only when you complete both the morning and evening ritual. Start your 7-day free trial and see how it changes your workday.',
  },
]

export default function Onboarding() {
  const router = useRouter()
  const { markOnboarded } = useHasOnboarded()

  const { currentStep, next, skip, isLastStep } = useOnboarding({
    totalSteps: STEPS.length,
    onComplete: async () => {
      await markOnboarded()
      router.replace('/home')
    },
  })

  const step = STEPS[currentStep]

  return (
    <View style={styles.screen}>
      {/* Skip is always visible — the user should never be trapped in onboarding */}
      <TouchableOpacity onPress={skip} style={styles.skipButton} activeOpacity={0.7}>
        <Text style={styles.skipLabel}>Skip</Text>
      </TouchableOpacity>

      <OnboardingStep
        iconName={step.iconName}
        title={step.title}
        description={step.description}
        currentStep={currentStep}
        totalSteps={STEPS.length}
      />

      <View style={styles.footer}>
        <SubscriptionButton
          label={isLastStep ? 'Start 7-day free trial' : 'Next'}
          onPress={next}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  skipButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.xl,
    zIndex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipLabel: {
    ...typography.body,
    color: colors.zinc400,
  },
  footer: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
})
