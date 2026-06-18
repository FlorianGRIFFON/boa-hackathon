import { useState, useCallback, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type PriorityStatus = 'done' | 'partial' | 'skipped' | 'pending'

export interface Priority {
  label: string
  estimatedMinutes: number
  status: PriorityStatus
}

export interface DayRecord {
  date: string // ISO date string YYYY-MM-DD
  priorities: Priority[]
  morningComplete: boolean
  eveningComplete: boolean
  reflectionAnswer: string
  carryOver: boolean[] // true if priority index is carried over to next day
}

interface UseRitualResult {
  today: DayRecord | null
  isLoading: boolean
  streak: number
  last7Days: Array<{ date: string; morningDone: boolean; eveningDone: boolean }>
  saveMorning: (priorities: Array<{ label: string; estimatedMinutes: number }>) => Promise<void>
  saveEvening: (statuses: PriorityStatus[], reflectionAnswer: string, carryOver: boolean[]) => Promise<void>
}

const STORAGE_KEY = 'dayritual_records'

function getTodayString(): string {
  const now = new Date()
  // Format as YYYY-MM-DD in local time so the date matches the user's calendar
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function loadRecords(): Promise<Record<string, DayRecord>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, DayRecord>
  } catch {
    return {}
  }
}

async function saveRecords(records: Record<string, DayRecord>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function computeStreak(records: Record<string, DayRecord>, todayStr: string): number {
  let streak = 0
  let cursor = new Date(todayStr)

  // Walk backwards from today counting days where both rituals are complete
  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10)
    const record = records[dateStr]
    if (!record || !record.morningComplete || !record.eveningComplete) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function getLast7Days(
  records: Record<string, DayRecord>,
  todayStr: string
): Array<{ date: string; morningDone: boolean; eveningDone: boolean }> {
  const result: Array<{ date: string; morningDone: boolean; eveningDone: boolean }> = []
  const cursor = new Date(todayStr)

  for (let i = 0; i < 7; i++) {
    const dateStr = cursor.toISOString().slice(0, 10)
    const record = records[dateStr]
    result.unshift({
      date: dateStr,
      morningDone: record?.morningComplete ?? false,
      eveningDone: record?.eveningComplete ?? false,
    })
    cursor.setDate(cursor.getDate() - 1)
  }

  return result
}

export function useRitual(): UseRitualResult {
  const [records, setRecords] = useState<Record<string, DayRecord>>({})
  const [isLoading, setIsLoading] = useState(true)

  const todayStr = getTodayString()

  useEffect(() => {
    loadRecords().then(r => {
      setRecords(r)
      setIsLoading(false)
    })
  }, [])

  const today = records[todayStr] ?? null

  const saveMorning = useCallback(
    async (priorities: Array<{ label: string; estimatedMinutes: number }>) => {
      const updated = { ...records }
      const existing = updated[todayStr]

      updated[todayStr] = {
        date: todayStr,
        priorities: priorities.map(p => ({
          label: p.label,
          estimatedMinutes: p.estimatedMinutes,
          status: 'pending' as PriorityStatus,
        })),
        morningComplete: true,
        // Preserve evening state if it already exists (shouldn't happen in normal flow)
        eveningComplete: existing?.eveningComplete ?? false,
        reflectionAnswer: existing?.reflectionAnswer ?? '',
        carryOver: existing?.carryOver ?? priorities.map(() => false),
      }

      await saveRecords(updated)
      setRecords(updated)
    },
    [records, todayStr]
  )

  const saveEvening = useCallback(
    async (statuses: PriorityStatus[], reflectionAnswer: string, carryOver: boolean[]) => {
      const updated = { ...records }
      const existing = updated[todayStr]
      if (!existing) return

      updated[todayStr] = {
        ...existing,
        priorities: existing.priorities.map((p, i) => ({
          ...p,
          status: statuses[i] ?? 'pending',
        })),
        eveningComplete: true,
        reflectionAnswer,
        carryOver,
      }

      await saveRecords(updated)
      setRecords(updated)
    },
    [records, todayStr]
  )

  return {
    today,
    isLoading,
    streak: computeStreak(records, todayStr),
    last7Days: getLast7Days(records, todayStr),
    saveMorning,
    saveEvening,
  }
}
