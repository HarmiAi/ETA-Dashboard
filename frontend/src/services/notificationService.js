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
    const taskId = task._id;
    const taskTitle = task.title;
    console.log(`[NotificationService] Attempting to trigger notification popup for task [ID: ${taskId}, Title: "${taskTitle}"]`);

    // Check app-level toggle first
    if (!notificationService.isEnabled()) {
      console.log('[NotificationService] Skipped: Notifications are disabled in the app settings (app_notifications_enabled is false).');
      return;
    }

    // Check browser-level permission
    if (!notificationService.isGranted()) {
      console.warn(`[NotificationService] Skipped: Browser notification permission is NOT granted. Current permission: ${Notification.permission}`);
      return;
    }

    const notifiedMap = getNotifiedTasks();
    const taskEtaTime = new Date(task.eta).getTime();

    // Prevent duplicate alerts for the exact same task ETA unless the ETA changes (rescheduled/snoozed)
    if (notifiedMap[taskId] === taskEtaTime) {
      console.log(`[NotificationService] Skipped: A notification for task ${taskId} at ETA ${task.eta} was already shown to the user.`);
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

    console.log('[NotificationService] Dispatching notification parameters:', { title, options });

    // Show native desktop notification
    try {
      if ('serviceWorker' in navigator) {
        console.log('[NotificationService] Checking Service Worker registration...');
        // Race Service Worker ready with a 1-second timeout
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => setTimeout(() => reject(new Error('SW timeout')), 1000))
        ]);
        console.log('[NotificationService] Service Worker is active. Triggering showNotification...');
        await registration.showNotification(title, options);
        console.log(`[NotificationService] Notification displayed successfully via Service Worker for task: ${taskId}`);
      } else {
        console.log('[NotificationService] Service worker not present in navigator. Falling back to standard Notification API...');
        new Notification(title, {
          body: options.body,
          icon: options.icon,
          tag: options.tag,
          requireInteraction: options.requireInteraction
        });
        console.log(`[NotificationService] Notification displayed successfully via standard API for task: ${taskId}`);
      }
    } catch (e) {
      console.warn('[NotificationService] SW registration check timed out or failed. Attempting standard Notification fallback...', e);
      try {
        new Notification(title, {
          body: options.body,
          icon: options.icon,
          tag: options.tag,
          requireInteraction: options.requireInteraction
        });
        console.log(`[NotificationService] Fallback notification triggered successfully for task: ${taskId}`);
      } catch (err) {
        console.error('[NotificationService] Critical: All notification rendering strategies failed!', err);
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
