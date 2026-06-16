// Service Worker for native OS desktop notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Intercept clicks on the native OS notification card
self.addEventListener('notificationclick', (event) => {
  const action = event.action; // 'complete', 'snooze', or '' (for default body click)
  const task = event.notification.data;
  
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find if any dashboard client window is already open
      const openClient = clientList.find(c => c.visibilityState === 'visible') || clientList[0];

      const actionType = action === 'complete' ? 'COMPLETE_TASK' : action === 'snooze' ? 'SNOOZE_TASK' : 'OPEN_TASK';
      const messagePayload = {
        type: 'NOTIFICATION_ACTION',
        action: actionType,
        taskId: task ? task._id : null,
        task: task
      };

      if (openClient) {
        // Focus the existing tab and post the notification action
        openClient.focus();
        openClient.postMessage(messagePayload);
      } else {
        // If browser is open but the dashboard tab was closed, launch a new client window
        return self.clients.openWindow(self.location.origin + '/').then((newClient) => {
          if (newClient) {
            // Wait briefly for React app to boot and register the message listener
            setTimeout(() => {
              newClient.postMessage(messagePayload);
            }, 1500);
          }
        });
      }
    })
  );
});
