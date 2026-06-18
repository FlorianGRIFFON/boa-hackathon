import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const ONBOARDING_KEY = 'dayritual_onboarding_complete'

interface UseHasOnboardedResult {
  hasOnboarded: boolean
  isLoading: boolean
  markOnboarded: () => Promise<void>
}

export function useHasOnboarded(): UseHasOnboardedResult {
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setHasOnboarded(val === 'true')
      setIsLoading(false)
    })
  }, [])

  const markOnboarded = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    setHasOnboarded(true)
  }, [])

  return { hasOnboarded, isLoading, markOnboarded }
}
