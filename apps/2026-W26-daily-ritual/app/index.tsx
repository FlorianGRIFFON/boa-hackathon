import React, { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '@boa/shared-ui'
import { useHasOnboarded } from '../hooks/useHasOnboarded'

// Entry point: redirect to onboarding on first launch, home thereafter.
export default function Index() {
  const router = useRouter()
  const { hasOnboarded, isLoading } = useHasOnboarded()

  useEffect(() => {
    if (isLoading) return

    if (hasOnboarded) {
      router.replace('/home')
    } else {
      router.replace('/onboarding')
    }
  }, [hasOnboarded, isLoading, router])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
})
