import React from 'react'
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { colors, spacing, typography } from '@boa/shared-ui'
import type { Client } from '../hooks/useClients'

interface ClientRowProps {
  client: Client
  isActive: boolean
  onPress: (client: Client) => void
}

export function ClientRow({ client, isActive, onPress }: ClientRowProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(client)}
      activeOpacity={0.6}
      style={[styles.row, isActive && styles.rowActive]}
      // accessibilityLabel tells screen readers which client this row represents
      accessibilityLabel={`Switch to ${client.name}`}
      accessibilityRole="button"
    >
      <View style={[styles.dot, { backgroundColor: client.color }]} />
      <View style={styles.nameBlock}>
        <Text style={[styles.name, isActive && styles.nameActive]} numberOfLines={1}>
          {client.name}
        </Text>
        {client.hourlyRate !== null ? (
          <Text style={styles.rate}>${client.hourlyRate}/hr</Text>
        ) : null}
      </View>
      {isActive ? <Text style={styles.activeTag}>Running</Text> : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.zinc200,
  },
  rowActive: {
    backgroundColor: colors.zinc50,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    ...typography.body,
    color: colors.ink,
  },
  nameActive: {
    fontWeight: '600',
  },
  rate: {
    ...typography.caption,
    color: colors.zinc400,
    marginTop: 2,
  },
  activeTag: {
    ...typography.label,
    fontSize: 12,
    color: '#0F766E',  // app teal accent — communicates "active billing"
  },
})
