import { useState, useCallback, useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface TimeEntry {
  id: string
  clientId: string
  startedAt: number   // Unix ms
  endedAt: number | null  // null means currently running
}

export interface Gap {
  startedAt: number
  endedAt: number
  durationMs: number
}

const STORAGE_KEY = '@clientclock/entries'
// 5 minutes in ms — gaps shorter than this are not highlighted per spec
const GAP_THRESHOLD_MS = 5 * 60 * 1000

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function useTimeEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  // Ref used to read entries synchronously inside switchClient without stale closure
  const entriesRef = useRef<TimeEntry[]>([])

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          const parsed = JSON.parse(raw) as TimeEntry[]
          setEntries(parsed)
          entriesRef.current = parsed
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true))
  }, [])

  const persist = useCallback((updated: TimeEntry[]) => {
    entriesRef.current = updated
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {})
    setEntries(updated)
  }, [])

  // Returns the currently running entry or null
  const runningEntry = entries.find(e => e.endedAt === null) ?? null

  // Start timer for a client — stops any running timer first.
  // Returns the exact timestamp used so callers can verify the 200ms window.
  const switchClient = useCallback(
    (clientId: string): number => {
      const now = Date.now()
      const current = entriesRef.current

      const updated = current.map(e =>
        e.endedAt === null ? { ...e, endedAt: now } : e
      )

      const newEntry: TimeEntry = {
        id: generateId(),
        clientId,
        startedAt: now,
        endedAt: null,
      }

      persist([...updated, newEntry])
      return now
    },
    [persist]
  )

  const stopCurrent = useCallback(() => {
    const now = Date.now()
    const updated = entriesRef.current.map(e =>
      e.endedAt === null ? { ...e, endedAt: now } : e
    )
    persist(updated)
  }, [persist])

  // All completed entries for a given calendar day (local time)
  const entriesForDay = useCallback(
    (dayTs: number): TimeEntry[] => {
      const dayStart = startOfDay(dayTs)
      const dayEnd = dayStart + 86_400_000
      return entries.filter(
        e =>
          e.startedAt >= dayStart &&
          e.startedAt < dayEnd &&
          e.endedAt !== null
      )
    },
    [entries]
  )

  // Running entry if it started today — included in Day View
  const runningEntryForToday = useCallback(
    (dayTs: number): TimeEntry | null => {
      const dayStart = startOfDay(dayTs)
      const dayEnd = dayStart + 86_400_000
      const running = entries.find(e => e.endedAt === null)
      if (running && running.startedAt >= dayStart && running.startedAt < dayEnd) {
        return running
      }
      return null
    },
    [entries]
  )

  // Gaps of >= 5 minutes between consecutive entries within a day
  const gapsForDay = useCallback(
    (dayTs: number): Gap[] => {
      const dayStart = startOfDay(dayTs)
      const dayEnd = dayStart + 86_400_000

      // Include running entry (treat its end as now) for gap detection
      const dayEntries = entries
        .filter(e => e.startedAt >= dayStart && e.startedAt < dayEnd)
        .map(e => ({ start: e.startedAt, end: e.endedAt ?? Date.now() }))
        .sort((a, b) => a.start - b.start)

      if (dayEntries.length === 0) return []

      const gaps: Gap[] = []

      // Gap at the start of the workday is out of scope — we only track gaps
      // between existing entries, not before the first one.
      for (let i = 0; i < dayEntries.length - 1; i++) {
        const gapStart = dayEntries[i].end
        const gapEnd = dayEntries[i + 1].start
        const durationMs = gapEnd - gapStart
        if (durationMs >= GAP_THRESHOLD_MS) {
          gaps.push({ startedAt: gapStart, endedAt: gapEnd, durationMs })
        }
      }

      return gaps
    },
    [entries]
  )

  // Per-client totals for the current ISO week (Mon–Sun)
  const weeklyTotals = useCallback(
    (weekStart: number): Record<string, number> => {
      const weekEnd = weekStart + 7 * 86_400_000
      const totals: Record<string, number> = {}

      entries.forEach(e => {
        if (e.startedAt < weekStart || e.startedAt >= weekEnd) return
        const end = e.endedAt ?? Date.now()
        const ms = end - e.startedAt
        totals[e.clientId] = (totals[e.clientId] ?? 0) + ms
      })

      return totals
    },
    [entries]
  )

  // Assign a gap to a client — creates a new completed entry covering the gap
  const assignGap = useCallback(
    (gap: Gap, clientId: string) => {
      const newEntry: TimeEntry = {
        id: generateId(),
        clientId,
        startedAt: gap.startedAt,
        endedAt: gap.endedAt,
      }
      persist([...entriesRef.current, newEntry])
    },
    [persist]
  )

  return {
    entries,
    runningEntry,
    isLoaded,
    switchClient,
    stopCurrent,
    entriesForDay,
    runningEntryForToday,
    gapsForDay,
    weeklyTotals,
    assignGap,
  }
}
