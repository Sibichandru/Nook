/// Service Worker for Nook Reminders
/// Handles notification click events only — all scheduling is done on the main thread.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification click — focus or open the reminders page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes('/dashboard/reminders'));
      if (existing) {
        return existing.focus();
      }
      return self.clients.openWindow('/dashboard/reminders');
    }),
  );
});
