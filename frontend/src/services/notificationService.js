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
    if (!notificationService.isGranted()) return;

    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      console.warn('Service Worker is not ready to trigger notification');
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
    await registration.showNotification(title, options);

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
