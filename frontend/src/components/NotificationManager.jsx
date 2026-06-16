import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  socketTaskUpdated, 
  socketTaskCreated, 
  socketTaskDeleted,
  completeTask,
  extendTask
} from '../store/taskSlice';
import { notificationService } from '../services/notificationService';
import { io } from 'socket.io-client';
import { getBackendUrl } from '../store/authSlice';

// Simple beep utility for in-app alert feedback
const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.6);
  } catch (e) {
    console.warn('Audio feedback blocked by browser policies:', e);
  }
};

export default function NotificationManager() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const tasks = useSelector((state) => state.tasks.list);
  const token = useSelector((state) => state.auth.token);
  
  const socketRef = useRef(null);
  const timersRef = useRef({});
  const lastAlertTimesRef = useRef({});
  const tasksRef = useRef([]);

  // Keep tasksRef up to date with latest tasks list
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Request notification permission automatically on login/mount if enabled at app level
  useEffect(() => {
    if (token && notificationService.isEnabled()) {
      notificationService.requestPermission();
    }
  }, [token]);

  // 1. Listen for background actions posted by the Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = async (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
        const { action, taskId, task } = event.data;
        console.log(`Received background action: ${action} for task ${taskId}`);

        if (action === 'COMPLETE_TASK') {
          playBeep();
          await dispatch(completeTask(taskId));
        } else if (action === 'SNOOZE_TASK') {
          playBeep();
          // Extend task ETA by 15 minutes
          const snoozeEta = new Date(Date.now() + 15 * 60 * 1000);
          await dispatch(extendTask({
            id: taskId,
            newEta: snoozeEta.toISOString(),
            reason: 'Snoozed alarm from native Windows notification'
          }));
        } else if (action === 'OPEN_TASK') {
          // Navigate to dashboard or details panel
          navigate(`/`);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [dispatch, navigate]);

  // 2A. Schedule high-precision timeouts for future ETAs (rescheduled/created in the future)
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    // Clear old active timeout timers
    Object.keys(timersRef.current).forEach((id) => {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    });

    const now = Date.now();

    tasks.forEach((task) => {
      if (task.status === 'Completed') return;

      const etaTime = new Date(task.eta).getTime();
      const delay = etaTime - now;

      // Case A: Task ETA is in the future. Schedule a high-precision timeout exactly at ETA.
      if (delay > 0) {
        timersRef.current[task._id] = setTimeout(() => {
          triggerTaskNotification(task);
          // Set task to Overdue state locally and trigger server update
          dispatch(socketTaskUpdated({ ...task, status: 'Overdue' }));
        }, delay);
      }
    });

    return () => {
      Object.keys(timersRef.current).forEach((id) => clearTimeout(timersRef.current[id]));
    };
  }, [tasks, dispatch]);

  // 2B. Persistent background monitoring loop for overdue tasks & 15-minute repetitions
  // Runs continuously every 5 seconds (not affected by state updates)
  useEffect(() => {
    const monitoringInterval = setInterval(() => {
      const currentTime = Date.now();
      const currentTasks = tasksRef.current || [];

      currentTasks.forEach((task) => {
        if (task.status === 'Completed') return;

        const etaTime = new Date(task.eta).getTime();

        // If task ETA has passed
        if (currentTime >= etaTime) {
          const lastAlertTime = lastAlertTimesRef.current[task._id] || 0;
          const timeSinceLastAlert = currentTime - lastAlertTime;

          // If never alerted, OR it's been more than 15 minutes since the last alert
          if (lastAlertTime === 0 || timeSinceLastAlert >= 15 * 60 * 1000) {
            triggerTaskNotification(task);
          }
        }
      });
    }, 5000); // Check every 5 seconds for high responsiveness

    return () => {
      clearInterval(monitoringInterval);
    };
  }, []);

  const triggerTaskNotification = (task) => {
    playBeep();
    lastAlertTimesRef.current[task._id] = Date.now();
    notificationService.showNotification(task);
  };

  // 3. Socket.io Event Handling
  useEffect(() => {
    if (!token) {
      console.log('[Socket] No auth token found, skipping socket setup.');
      return;
    }

    const backendUrl = getBackendUrl();
    console.log(`[Socket] Initializing connection to: ${backendUrl}`);

    socketRef.current = io(backendUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    socketRef.current.on('connect', () => {
      console.log(`[Socket] Connected successfully! Socket ID: ${socketRef.current.id}`);
      if (socketRef.current.io && socketRef.current.io.engine && socketRef.current.io.engine.transport) {
        console.log(`[Socket] Active transport protocol: ${socketRef.current.io.engine.transport.name}`);
        
        // Listen for transport upgrade (e.g. polling -> websocket)
        socketRef.current.io.engine.on('upgrade', (transport) => {
          console.log(`[Socket] Transport upgraded to: ${transport.name}`);
        });
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[Socket] Connection error observed:', error.message, error);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.warn(`[Socket] Disconnected from server. Reason: ${reason}`);
    });

    socketRef.current.on('reconnect_attempt', (attempt) => {
      console.log(`[Socket] Attempting reconnection #${attempt}...`);
    });

    socketRef.current.on('taskCreated', (task) => {
      console.log('[Socket] Event [taskCreated] received:', task);
      dispatch(socketTaskCreated(task));
    });

    socketRef.current.on('taskUpdated', (task) => {
      console.log('[Socket] Event [taskUpdated] received:', task);
      dispatch(socketTaskUpdated(task));
      if (task.status === 'Completed') {
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then((registration) => {
            console.log('[Service Worker] Closing active notification for completed task:', task._id);
            registration.getNotifications({ tag: task._id }).then((notifications) => {
              notifications.forEach((notification) => notification.close());
            });
          }).catch(err => {
            console.error('[Service Worker] Ready check failed during dismiss:', err);
          });
        }
      }
    });

    socketRef.current.on('taskDeleted', (taskId) => {
      console.log('[Socket] Event [taskDeleted] received for ID:', taskId);
      dispatch(socketTaskDeleted(taskId));
    });

    socketRef.current.on('etaReached', (task) => {
      console.log('[Socket] Event [etaReached] received:', task);
      dispatch(socketTaskUpdated(task));
      triggerTaskNotification(task);
    });

    // Diagnose Service Worker & permissions status upon socket initialization
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        console.log('[Service Worker] Ready. Active Scope:', reg.scope);
      }).catch(err => {
        console.error('[Service Worker] Failed to resolve ready state:', err);
      });
    } else {
      console.warn('[Service Worker] serviceWorker object is missing from navigator.');
    }
    console.log('[Notifications] Permission status:', Notification.permission);
    console.log('[Notifications] App-level toggle status:', notificationService.isEnabled());
    console.log('[Push Notification] Firebase/VAPID Push subscriptions are not used in this app. Notifications rely on live socket.io triggers.');

    return () => {
      if (socketRef.current) {
        console.log('[Socket] Cleaning up socket connection...');
        socketRef.current.disconnect();
      }
    };
  }, [token, dispatch]);

  return null; // Silent global scheduler manager
}

export const getAvatarColor = (name = 'E') => {
  const colors = [
    'bg-blue-500 text-white',
    'bg-purple-500 text-white',
    'bg-emerald-500 text-white',
    'bg-amber-500 text-white',
    'bg-rose-500 text-white',
    'bg-indigo-500 text-white'
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
};

export const getInitials = (name = '') => {
  if (!name) return 'E';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'E';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export { playBeep };
