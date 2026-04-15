'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type PermissionState = NotificationPermission | 'unsupported'

export function useNotifications() {
    // Start with 'granted' to avoid hydration mismatch — real value set in useEffect.
    const [permission, setPermission] = useState<PermissionState>('granted')
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null)

    useEffect(() => {
        async function init() {
            if (!('Notification' in window)) {
                setPermission('unsupported')
                return
            }

            let perm = Notification.permission
            if (perm === 'default') {
                perm = await Notification.requestPermission()
            }
            setPermission(perm)

            if ('serviceWorker' in navigator) {
                try {
                    const reg = await navigator.serviceWorker.register('/sw.js')
                    registrationRef.current = reg
                } catch (err) {
                    console.warn('SW registration failed:', err)
                }
            }
        }
        init()
    }, [])

    /**
     * Show a notification via ServiceWorkerRegistration.showNotification().
     * This works even when the SW is terminated — the browser handles it.
     * Falls back to the in-page Notification API if no registration exists.
     */
    const sendNotification = useCallback(
        (title: string, body: string) => {
            if (permission !== 'granted') return

            const reg = registrationRef.current
            if (reg) {
                reg.showNotification(title, {
                    body,
                    icon: '/assets/icon-192.png',
                    badge: '/assets/icon-192.png',
                    tag: `nook-${Date.now()}`,
                })
                return
            }

            // Fallback: in-page Notification API
            new Notification(title, { body })
        },
        [permission],
    )

    return { permission, sendNotification }
}
