import { useState, useEffect } from 'react'

// Ticks every second while a startedAt timestamp is provided.
// Returns elapsed milliseconds since that timestamp.
export function useElapsedTime(startedAt: number | null): number {
  const [elapsed, setElapsed] = useState<number>(
    startedAt !== null ? Date.now() - startedAt : 0
  )

  useEffect(() => {
    if (startedAt === null) {
      setElapsed(0)
      return
    }

    // Sync immediately on mount / when startedAt changes
    setElapsed(Date.now() - startedAt)

    const id = setInterval(() => {
      setElapsed(Date.now() - startedAt)
    }, 1000)

    return () => clearInterval(id)
  }, [startedAt])

  return elapsed
}
