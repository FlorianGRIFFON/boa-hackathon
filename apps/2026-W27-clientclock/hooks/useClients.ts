import { useState, useCallback, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Client {
  id: string
  name: string
  hourlyRate: number | null
  // archived clients are hidden from the switcher but preserved in history
  archived: boolean
  color: string
}

const STORAGE_KEY = '@clientclock/clients'

// Warm teal accent — differentiates from the neutral default in shared-ui
const CLIENT_COLORS = [
  '#0F766E', // teal-700
  '#1D4ED8', // blue-700
  '#B45309', // amber-700
  '#7C3AED', // not primary accent; fine as a data color in a list
  '#047857', // emerald-700
  '#C2410C', // orange-700
  '#1E40AF', // blue-800
  '#6B21A8', // purple-800
]

function generateColor(index: number): string {
  return CLIENT_COLORS[index % CLIENT_COLORS.length]
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load persisted clients on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          const parsed = JSON.parse(raw) as Client[]
          setClients(parsed)
        }
      })
      .catch(() => {
        // Ignore storage errors — start with empty state
      })
      .finally(() => setIsLoaded(true))
  }, [])

  const persist = useCallback((updated: Client[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {
      // Silent fail — data is still in memory for this session
    })
    setClients(updated)
  }, [])

  const addClient = useCallback(
    (name: string, hourlyRate: number | null): Client => {
      const newClient: Client = {
        id: generateId(),
        name,
        hourlyRate,
        archived: false,
        color: generateColor(clients.length),
      }
      persist([...clients, newClient])
      return newClient
    },
    [clients, persist]
  )

  const updateClient = useCallback(
    (id: string, patch: Partial<Pick<Client, 'name' | 'hourlyRate'>>) => {
      const updated = clients.map(c => (c.id === id ? { ...c, ...patch } : c))
      persist(updated)
    },
    [clients, persist]
  )

  const archiveClient = useCallback(
    (id: string) => {
      const updated = clients.map(c =>
        c.id === id ? { ...c, archived: true } : c
      )
      persist(updated)
    },
    [clients, persist]
  )

  const activeClients = clients.filter(c => !c.archived)

  return { clients, activeClients, isLoaded, addClient, updateClient, archiveClient }
}
