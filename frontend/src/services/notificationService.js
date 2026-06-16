// Service to coordinate native OS desktop notifications

const NOTIFIED_TASKS_KEY = 'eta_notified_tasks';

// Get set of notified task IDs from localStorage
const getNotifiedTasks = () => {
  try {
    const data = localStorage.getItem(NOTIFIED_TASKS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

// Save notified task IDs to localStorage
const saveNotifiedTasks = (notifiedMap) => {
  try {
    localStorage.setItem(NOTIFIED_TASKS_KEY, JSON.stringify(notifiedMap));
  } catch (e) {}
};

export const notificationService = {
  // Check if notifications are enabled at the app level
  isEnabled: () => {
    const val = localStorage.getItem('app_notifications_enabled');
    return val === null ? true : val === 'true';
  },

  // Set notifications enabled state at the app level
  setEnabled: (enabled) => {
    localStorage.setItem('app_notifications_enabled', enabled ? 'true' : 'false');
  },

  // Request notification permission
  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return 'denied';
    }
    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  },

  // Check if permission is currently granted
  isGranted: () => {
    return 'Notification' in window && Notification.permission === 'granted';
  },

  // Trigger a native OS notification backed by the Service Worker
  showNotification: async (task) => {
    // Check app-level toggle first
    if (!notificationService.isEnabled()) {
      console.log('Notifications are disabled at the app level.');
      return;
    }

    if (!notificationService.isGranted()) {
      console.log('Browser notification permission is not granted.');
      return;
    }

    const notifiedMap = getNotifiedTasks();
    const taskId = task._id;
    const taskEtaTime = new Date(task.eta).getTime();

    // Prevent duplicate alerts for the exact same task ETA unless the ETA changes (rescheduled/snoozed)
    if (notifiedMap[taskId] === taskEtaTime) {
      console.log(`Notification for task ${taskId} at ${task.eta} was already triggered.`);
      return;
    }

    const employeeName = task.employeeId?.name || 'Employee';
    const formattedEta = new Date(task.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const title = `ETA Reminder`;
    const options = {
      body: `Follow up with ${employeeName} regarding ${task.title}.\nETA: ${formattedEta}`,
      icon: '/favicon.png',
      tag: taskId, // Group notifications by task ID (replaces duplicate alerts)
      requireInteraction: true,
      data: task, // Pass data to service worker click handler
      actions: [
        { action: 'complete', title: 'Mark Completed' },
        { action: 'snooze', title: 'Snooze Reminder' }
      ]
    };

    // Show native desktop notification
    try {
      if ('serviceWorker' in navigator) {
        // Race Service Worker ready with a 1-second timeout
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => setTimeout(() => reject(new Error('SW timeout')), 1000))
        ]);
        await registration.showNotification(title, options);
      } else {
        new Notification(title, {
          body: options.body,
          icon: options.icon,
          tag: options.tag,
          requireInteraction: options.requireInteraction
        });
      }
    } catch (e) {
      console.warn('Service Worker alert failed or timed out, falling back to standard Notification:', e);
      try {
        new Notification(title, {
          body: options.body,
          icon: options.icon,
          tag: options.tag,
          requireInteraction: options.requireInteraction
        });
      } catch (err) {
        console.error('All notification methods failed:', err);
      }
    }

    // Save status to avoid repeated alerts for this specific ETA
    notifiedMap[taskId] = taskEtaTime;
    saveNotifiedTasks(notifiedMap);
  },

  // Reset notification tracking status for a task (e.g. on task update or new assignment)
  resetTaskStatus: (taskId) => {
    const notifiedMap = getNotifiedTasks();
    delete notifiedMap[taskId];
    saveNotifiedTasks(notifiedMap);
  }
};
