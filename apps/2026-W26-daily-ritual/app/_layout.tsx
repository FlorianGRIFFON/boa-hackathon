import React from 'react'
import { Stack } from 'expo-router'
import { AppShell } from '@boa/shared-ui'

export default function RootLayout() {
  return (
    <AppShell>
      <Stack screenOptions={{ headerShown: false }} />
    </AppShell>
  )
}
