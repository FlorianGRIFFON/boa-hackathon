import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@clientclock/onboarding_complete'

// Persists whether the user has finished the onboarding flow.
// Separate from useOnboarding (which is session-only) so the flag survives restarts.
export function useOnboardingComplete() {
  const [isComplete, setIsComplete] = useState<boolean | null>(null) // null = loading

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(val => setIsComplete(val === 'true'))
      .catch(() => setIsComplete(false))
  }, [])

  const markComplete = useCallback(() => {
    AsyncStorage.setItem(STORAGE_KEY, 'true').catch(() => {})
    setIsComplete(true)
  }, [])

  return { isOnboardingComplete: isComplete, markComplete }
}
