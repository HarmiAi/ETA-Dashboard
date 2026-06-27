import React, { useEffect, useRef, useState } from 'react';
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
import { Bell, Clock } from 'lucide-react';

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

  // 2. Background and Missed Alerts State
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [showInAppModal, setShowInAppModal] = useState(false);

  const triggerTaskNotification = (task) => {
    playBeep();
    lastAlertTimesRef.current[task._id] = Date.now();
    notificationService.showNotification(task);

    // Queue in-app alert if tab is hidden
    if (document.hidden || document.visibilityState === 'hidden') {
      setPendingAlerts(prev => {
        if (prev.some(t => t._id === task._id)) return prev;
        return [...prev, task];
      });
    }
  };

  const checkOverdueTasks = React.useCallback(() => {
    const currentTime = Date.now();
    const currentTasks = tasksRef.current || [];

    currentTasks.forEach((task) => {
      if (task.status === 'Completed' || task.status === 'On Hold') return;

      const etaTime = new Date(task.eta).getTime();

      // If task ETA has passed
      if (currentTime >= etaTime) {
        const lastAlertTime = lastAlertTimesRef.current[task._id] || 0;
        const timeSinceLastAlert = currentTime - lastAlertTime;

        // If never alerted, OR it's been more than 15 minutes since the last alert
        if (lastAlertTime === 0 || timeSinceLastAlert >= 15 * 60 * 1000) {
          triggerTaskNotification(task);
          
          // Set task to Overdue locally if it's currently In Progress or Not Started
          if (task.status === 'In Progress' || task.status === 'Not Started') {
            dispatch(socketTaskUpdated({ ...task, status: 'Overdue' }));
          }
        }
      }
    });
  }, [dispatch]);

  // Background Web Worker to prevent browser tab timer throttling
  useEffect(() => {
    const workerCode = `
      let timer = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (timer) clearInterval(timer);
          timer = setInterval(() => {
            self.postMessage('tick');
          }, 5000);
        } else if (e.data === 'stop') {
          if (timer) clearInterval(timer);
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      if (e.data === 'tick') {
        checkOverdueTasks();
      }
    };

    worker.postMessage('start');

    return () => {
      worker.postMessage('stop');
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, [checkOverdueTasks]);

  // Listen for tab focus returns to open the missed reminders modal
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pendingAlerts.length > 0) {
        setShowInAppModal(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pendingAlerts]);

  const handleDismissAlert = (taskId) => {
    setPendingAlerts(prev => {
      const filtered = prev.filter(t => t._id !== taskId);
      if (filtered.length === 0) setShowInAppModal(false);
      return filtered;
    });
  };

  const handleDismissAll = () => {
    setPendingAlerts([]);
    setShowInAppModal(false);
  };

  const handleCompleteAlert = async (taskId) => {
    await dispatch(completeTask(taskId));
    handleDismissAlert(taskId);
  };

  const handleSnoozeAlert = async (task) => {
    const snoozeEta = new Date(Date.now() + 15 * 60 * 1000);
    await dispatch(extendTask({
      id: task._id,
      newEta: snoozeEta.toISOString(),
      reason: 'Snoozed alarm from in-app missed reminders popup'
    }));
    handleDismissAlert(task._id);
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

  if (!showInAppModal || pendingAlerts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm text-left select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-[24px] bg-white dark:bg-[#182421] border border-[#D1DFDA] dark:border-[#24332F] shadow-2xl p-6 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[#D1DFDA]/40 dark:border-[#24332F]/40">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-650 animate-bounce" />
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Missed Reminders
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
            {pendingAlerts.length} Missed
          </span>
        </div>

        {/* Scrollable list of notifications */}
        <div className="max-h-[280px] overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
          {pendingAlerts.map((task) => {
            const employeeName = task.employeeId?.name || 'Employee';
            return (
              <div 
                key={task._id} 
                className="p-3.5 bg-slate-50/50 dark:bg-[#1D2C28]/20 border border-[#D1DFDA] dark:border-[#24332F] rounded-xl flex flex-col space-y-2.5"
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-extrabold uppercase text-[#5EAD93] dark:text-[#6CD3B4] tracking-wider">
                      {employeeName}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      ETA: {new Date(task.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                    {task.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    onClick={() => handleCompleteAlert(task._id)}
                    className="flex-1 py-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-lg transition active:scale-95 flex items-center justify-center gap-1 shadow-sm shadow-emerald-500/10"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleSnoozeAlert(task)}
                    className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-bold rounded-lg transition border border-purple-200 dark:border-purple-800 active:scale-95"
                  >
                    Snooze
                  </button>
                  <button
                    onClick={() => handleDismissAlert(task._id)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-lg transition active:scale-95"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-1.5 text-xs">
          <button
            onClick={handleDismissAll}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold rounded-xl transition text-center active:scale-95"
          >
            Dismiss All Reminders
          </button>
        </div>
      </div>
    </div>
  );
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
