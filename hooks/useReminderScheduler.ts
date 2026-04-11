'use client'

import { useEffect, useRef } from 'react'
import { Reminder } from '@/types/Reminder'

const STORAGE_KEY = 'nook:reminder-scheduler'

type SendNotification = (title: string, body: string, icon?: string) => Notification | null
type PostToSW = (message: { type: string; payload?: unknown }) => void

interface SchedulerState {
    /** last fire time per reminder id (epoch ms) */
    lastFired: Record<string, number>
    /** one-time reminders that have already fired */
    firedOneTime: string[]
}

function loadState(): SchedulerState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) return JSON.parse(raw)
    } catch { /* corrupted or missing — start fresh */ }
    return { lastFired: {}, firedOneTime: [] }
}

function saveState(state: SchedulerState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch { /* storage full — best effort */ }
}

export function useReminderScheduler(
    reminders: Reminder[],
    sendNotification: SendNotification,
    postToSW?: PostToSW,
) {
    const stateRef = useRef<SchedulerState>(loadState())
    const fallbackTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    // Keep callbacks current without re-running the effect
    const sendRef = useRef(sendNotification)
    const postRef = useRef(postToSW)

    useEffect(() => {
        sendRef.current = sendNotification
        postRef.current = postToSW
    }, [sendNotification, postToSW])

    // Listen for REMINDER_FIRED messages from the SW to persist state
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

        function onMessage(event: MessageEvent) {
            const { type, payload } = event.data || {}
            if (type === 'REMINDER_FIRED' && payload?.id) {
                const state = stateRef.current
                state.lastFired[payload.id] = Date.now()

                // Check if it's a one-time reminder
                const reminder = reminders.find((r) => r.id === payload.id)
                if (reminder?.type === 'one_time' && !state.firedOneTime.includes(payload.id)) {
                    state.firedOneTime.push(payload.id)
                }
                saveState(state)
            }
        }

        navigator.serviceWorker.addEventListener('message', onMessage)
        return () => navigator.serviceWorker.removeEventListener('message', onMessage)
    }, [reminders])

    useEffect(() => {
        const state = stateRef.current
        const hasSW = !!postRef.current

        function clearFallbackTimers() {
            fallbackTimersRef.current.forEach((timer) => clearTimeout(timer))
            fallbackTimersRef.current.clear()
        }

        // Tell SW to drop all existing timers before re-scheduling
        if (hasSW) {
            postRef.current!({ type: 'CANCEL_ALL' })
        }
        clearFallbackTimers()

        function fireFallback(reminder: Reminder) {
            sendRef.current(reminder.title, `Reminder: ${reminder.title}`)
            state.lastFired[reminder.id] = Date.now()
            saveState(state)
        }

        function scheduleRecurring(reminder: Reminder) {
            if (!reminder.interval_minutes) return

            const intervalMs = reminder.interval_minutes * 60_000
            const lastFired = state.lastFired[reminder.id] ?? 0
            const elapsed = Date.now() - lastFired

            // Missed execution — fire immediately
            if (lastFired > 0 && elapsed >= intervalMs) {
                if (hasSW) {
                    postRef.current!({
                        type: 'SHOW_NOTIFICATION',
                        payload: { title: reminder.title, body: `Reminder: ${reminder.title}` },
                    })
                } else {
                    fireFallback(reminder)
                }
                state.lastFired[reminder.id] = Date.now()
                saveState(state)
            }

            const remaining = lastFired > 0
                ? intervalMs - (Date.now() - state.lastFired[reminder.id]!) % intervalMs
                : intervalMs

            if (hasSW) {
                postRef.current!({
                    type: 'SCHEDULE_REMINDER',
                    payload: {
                        id: reminder.id,
                        title: reminder.title,
                        body: `Reminder: ${reminder.title}`,
                        delay: remaining,
                        recurring: true,
                        intervalMs,
                    },
                })
            } else {
                // Fallback: in-page setTimeout chain
                function tick() {
                    fireFallback(reminder)
                    const timer = setTimeout(tick, intervalMs)
                    fallbackTimersRef.current.set(reminder.id, timer)
                }
                const timer = setTimeout(tick, remaining)
                fallbackTimersRef.current.set(reminder.id, timer)
            }
        }

        function scheduleOneTime(reminder: Reminder) {
            if (!reminder.scheduled_at) return
            if (state.firedOneTime.includes(reminder.id)) return

            const scheduledMs = new Date(reminder.scheduled_at).getTime()
            const delay = scheduledMs - Date.now()

            if (delay <= 0) {
                // Missed — fire immediately
                if (hasSW) {
                    postRef.current!({
                        type: 'SHOW_NOTIFICATION',
                        payload: { title: reminder.title, body: `Reminder: ${reminder.title}` },
                    })
                } else {
                    fireFallback(reminder)
                }
                state.firedOneTime.push(reminder.id)
                saveState(state)
                return
            }

            if (hasSW) {
                postRef.current!({
                    type: 'SCHEDULE_REMINDER',
                    payload: {
                        id: reminder.id,
                        title: reminder.title,
                        body: `Reminder: ${reminder.title}`,
                        delay,
                        recurring: false,
                        intervalMs: 0,
                    },
                })
            } else {
                const timer = setTimeout(() => {
                    fireFallback(reminder)
                    state.firedOneTime.push(reminder.id)
                    saveState(state)
                    fallbackTimersRef.current.delete(reminder.id)
                }, delay)
                fallbackTimersRef.current.set(reminder.id, timer)
            }
        }

        const active = reminders.filter((r) => r.is_active)
        for (const reminder of active) {
            if (reminder.type === 'recurring') {
                scheduleRecurring(reminder)
            } else {
                scheduleOneTime(reminder)
            }
        }

        // Prune stale one-time entries
        const activeIds = new Set(active.map((r) => r.id))
        state.firedOneTime = state.firedOneTime.filter((id) => activeIds.has(id))
        saveState(state)

        return () => {
            if (hasSW) {
                postRef.current!({ type: 'CANCEL_ALL' })
            }
            clearFallbackTimers()
        }
    }, [reminders])
}
