import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { AppShell, colors, spacing, typography } from '@boa/shared-ui'
import { useSubscription } from '@boa/shared-hooks'
import { useClients, Client } from '../hooks/useClients'
import { ClientForm } from '../components/ClientForm'

// Free tier allows at most 2 active clients
const FREE_TIER_CLIENT_LIMIT = 2

export default function ClientsScreen() {
  const { activeClients, addClient, updateClient, archiveClient } = useClients()
  const { isSubscribed, isTrialing } = useSubscription()
  const isPaid = isSubscribed || isTrialing

  const [formVisible, setFormVisible] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>()

  function handleAddPress() {
    // Gate: free users can't add a third client — show paywall
    if (!isPaid && activeClients.length >= FREE_TIER_CLIENT_LIMIT) {
      router.push('/paywall')
      return
    }
    setEditingClient(undefined)
    setFormVisible(true)
  }

  function handleEditPress(client: Client) {
    setEditingClient(client)
    setFormVisible(true)
  }

  function handleSave(name: string, hourlyRate: number | null) {
    if (editingClient) {
      updateClient(editingClient.id, { name, hourlyRate })
    } else {
      addClient(name, hourlyRate)
    }
    setFormVisible(false)
  }

  function handleArchive() {
    if (editingClient) {
      archiveClient(editingClient.id)
      setFormVisible(false)
    }
  }

  const canAddMore = isPaid || activeClients.length < FREE_TIER_CLIENT_LIMIT

  return (
    <AppShell>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Clients</Text>
        <TouchableOpacity onPress={handleAddPress} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {!isPaid && activeClients.length >= FREE_TIER_CLIENT_LIMIT && (
        <TouchableOpacity
          style={styles.limitBanner}
          onPress={() => router.push('/paywall')}
        >
          <Text style={styles.limitBannerText}>
            Free plan: 2 clients max. Upgrade for unlimited clients.
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {activeClients.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No clients yet</Text>
          </View>
        ) : (
          activeClients.map(client => (
            <TouchableOpacity
              key={client.id}
              style={styles.row}
              onPress={() => handleEditPress(client)}
              activeOpacity={0.6}
            >
              <View style={[styles.dot, { backgroundColor: client.color }]} />
              <View style={styles.rowContent}>
                <Text style={styles.clientName}>{client.name}</Text>
                {client.hourlyRate !== null ? (
                  <Text style={styles.clientRate}>${client.hourlyRate}/hr</Text>
                ) : (
                  <Text style={styles.clientRate}>No rate set</Text>
                )}
              </View>
              <Text style={styles.editHint}>Edit</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <ClientForm
        visible={formVisible}
        existingClient={editingClient}
        onSave={handleSave}
        onCancel={() => setFormVisible(false)}
        onArchive={editingClient ? handleArchive : undefined}
      />
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
  addButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    backgroundColor: '#0F766E',
  },
  addButtonText: {
    ...typography.label,
    fontSize: 13,
    color: colors.white,
  },
  limitBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#F0FDF9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  limitBannerText: {
    ...typography.bodySmall,
    color: '#0F766E',
  },
  list: {
    flex: 1,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.zinc400,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.zinc200,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowContent: {
    flex: 1,
  },
  clientName: {
    ...typography.body,
    color: colors.ink,
  },
  clientRate: {
    ...typography.caption,
    color: colors.zinc400,
    marginTop: 2,
  },
  editHint: {
    ...typography.caption,
    color: colors.zinc400,
  },
})
