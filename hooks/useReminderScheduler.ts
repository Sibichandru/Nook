'use client'

import { useEffect, useRef, useState } from 'react'
import { Reminder } from '@/types/Reminder'

const STORAGE_KEY = 'nook:reminder-scheduler'

interface SchedulerState {
    /** Epoch ms of last fire per reminder id */
    lastFired: Record<string, number>
    /** One-time reminders that have already fired */
    firedOneTime: string[]
}

function loadState(): SchedulerState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) return JSON.parse(raw)
    } catch { /* corrupted — start fresh */ }
    return { lastFired: {}, firedOneTime: [] }
}

function saveState(state: SchedulerState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch { /* storage full — best effort */ }
}

type SendNotification = (title: string, body: string) => void

/**
 * Schedules reminders using a 1-second main-thread tick.
 * Returns a map of reminder-id → remaining milliseconds for countdown UI.
 *
 * This replaces the previous SW-based setTimeout approach which was unreliable
 * in production because browsers terminate idle service workers aggressively.
 */
export function useReminderScheduler(
    reminders: Reminder[],
    sendNotification: SendNotification,
): Record<string, number> {
    const [countdowns, setCountdowns] = useState<Record<string, number>>({})
    const stateRef = useRef<SchedulerState>(loadState())
    const sendRef = useRef(sendNotification)

    useEffect(() => { sendRef.current = sendNotification }, [sendNotification])

    useEffect(() => {
        const state = stateRef.current
        const now = Date.now()

        // Initialise lastFired for newly-active recurring reminders
        for (const r of reminders) {
            if (r.is_active && r.type === 'recurring' && r.interval_minutes && !state.lastFired[r.id]) {
                state.lastFired[r.id] = now
            }
        }

        // Prune state for reminders that no longer exist or were deactivated
        const activeRecurringIds = new Set(
            reminders.filter((r) => r.is_active && r.type === 'recurring').map((r) => r.id),
        )
        for (const id of Object.keys(state.lastFired)) {
            if (!activeRecurringIds.has(id)) delete state.lastFired[id]
        }

        const allIds = new Set(reminders.map((r) => r.id))
        state.firedOneTime = state.firedOneTime.filter((id) => allIds.has(id))
        saveState(state)

        function tick() {
            const now = Date.now()
            const next: Record<string, number> = {}

            for (const r of reminders) {
                if (!r.is_active) continue

                if (r.type === 'recurring' && r.interval_minutes) {
                    const intervalMs = r.interval_minutes * 60_000
                    const lastFired = state.lastFired[r.id] ?? now
                    const remaining = intervalMs - (now - lastFired)

                    if (remaining <= 0) {
                        sendRef.current(r.title, `Time to ${r.title.toLowerCase()}!`)
                        state.lastFired[r.id] = now
                        saveState(state)
                        next[r.id] = intervalMs
                    } else {
                        next[r.id] = remaining
                    }
                } else if (r.type === 'one_time' && r.scheduled_at) {
                    if (state.firedOneTime.includes(r.id)) continue
                    const remaining = new Date(r.scheduled_at).getTime() - now

                    if (remaining <= 0) {
                        sendRef.current(r.title, `Reminder: ${r.title}`)
                        state.firedOneTime.push(r.id)
                        saveState(state)
                    } else {
                        next[r.id] = remaining
                    }
                }
            }

            setCountdowns(next)
        }

        tick()
        const interval = setInterval(tick, 1000)
        return () => clearInterval(interval)
    }, [reminders])

    return countdowns
}
