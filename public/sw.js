/// Service Worker for Nook Reminders
/// Manages notification timers so they fire even when the tab is in the background.

const timers = new Map();

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SCHEDULE_REMINDER':
      scheduleReminder(payload);
      break;
    case 'CANCEL_REMINDER':
      cancelReminder(payload.id);
      break;
    case 'CANCEL_ALL':
      cancelAll();
      break;
    case 'SHOW_NOTIFICATION':
      showNotification(payload);
      break;
  }
});

function scheduleReminder(payload) {
  const { id, title, body, delay, recurring, intervalMs } = payload;

  // Clear any existing timer for this id
  cancelReminder(id);

  const timerId = setTimeout(() => {
    showNotification({ title, body });

    // Notify clients so they can update localStorage state
    notifyClients({ type: 'REMINDER_FIRED', payload: { id } });

    // Self-reschedule for recurring reminders
    if (recurring && intervalMs > 0) {
      scheduleReminder({ id, title, body, delay: intervalMs, recurring: true, intervalMs });
    } else {
      timers.delete(id);
    }
  }, delay);

  timers.set(id, timerId);
}

function cancelReminder(id) {
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
  }
}

function cancelAll() {
  timers.forEach((timerId) => clearTimeout(timerId));
  timers.clear();
}

function showNotification({ title, body, icon }) {
  self.registration.showNotification(title, {
    body: body || '',
    icon: icon || '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    tag: `nook-${Date.now()}`,
  });
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((client) => client.postMessage(message));
}

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
