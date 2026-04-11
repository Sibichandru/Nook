'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type PermissionState = NotificationPermission | 'unsupported'

export function useNotifications() {
    // Always start with 'granted' to avoid hydration mismatch — the conditional
    // Alert won't flash on the server, and the real value is set in useEffect.
    const [permission, setPermission] = useState<PermissionState>('granted')
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
    const notificationsRef = useRef<Set<Notification>>(new Set())

    useEffect(() => {
        if (!('Notification' in window)) {
            setPermission('unsupported')
            return
        }

        const current = Notification.permission
        setPermission(current)

        if (current === 'default') {
            Notification.requestPermission().then(setPermission)
        }

        // Register the service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((reg) => {
                    registrationRef.current = reg
                })
                .catch((err) => {
                    console.warn('SW registration failed:', err)
                })
        }
    }, [])

    const sendNotification = useCallback(
        (title: string, body: string, icon?: string) => {
            if (permission !== 'granted') return null

            // Prefer service worker — works even when the tab is in the background
            const sw = registrationRef.current?.active
            if (sw) {
                sw.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    payload: { title, body, icon },
                })
                return null
            }

            // Fallback to in-page Notification API
            const notification = new Notification(title, { body, icon })
            notificationsRef.current.add(notification)
            notification.onclose = () => {
                notificationsRef.current.delete(notification)
            }
            return notification
        },
        [permission],
    )

    const closeAll = useCallback(() => {
        notificationsRef.current.forEach((n) => n.close())
        notificationsRef.current.clear()
    }, [])

    /** Post a raw message to the active service worker */
    const postToSW = useCallback(
        (message: { type: string; payload?: unknown }) => {
            const sw = registrationRef.current?.active
            if (sw) sw.postMessage(message)
        },
        [],
    )

    return { permission, sendNotification, closeAll, postToSW, registrationRef }
}
