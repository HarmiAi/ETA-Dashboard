import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  X, 
  BellOff, 
  Play, 
  AlertTriangle,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { 
  socketTaskUpdated, 
  socketTaskCreated, 
  socketTaskDeleted,
  completeTask,
  extendTask,
  markTaskNotStarted
} from '../store/taskSlice';

const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.8);
  } catch (e) {
    console.error('Audio beep blocked:', e);
  }
};
// Helper to get random colored avatar based on employee name
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

export default function NotificationManager() {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.list);
  const token = useSelector((state) => state.auth.token);
  
  // List of active live desktop-style notifications (can display multiple overlay toasts stacked!)
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  
  const socketRef = useRef(null);
  const timersRef = useRef({});

  // Request browser notification permissions
  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  // Trigger HTML5 native OS notification
  const triggerNativeNotification = (task) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const employeeName = task.employeeId?.name || 'Employee';
      const notification = new Notification(`ETA Reached: ${task.title}`, {
        body: `Assigned to ${employeeName}. ETA is now due! Click to manage.`,
        tag: task._id,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        handleOpenToast(task);
        notification.close();
      };
    }
  };

  const handleOpenToast = (task) => {
    // Check if task is already in notifications list
    setActiveNotifications((prev) => {
      if (prev.some((n) => n._id === task._id)) return prev;
      return [...prev, task];
    });
    playBeep();
  };

  // Socket.io initialization
  useEffect(() => {
    if (!token) return;

    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('taskCreated', (task) => {
      dispatch(socketTaskCreated(task));
    });

    socketRef.current.on('taskUpdated', (task) => {
      dispatch(socketTaskUpdated(task));
      // Remove from active notification list if completed
      if (task.status === 'Completed') {
        setActiveNotifications((prev) => prev.filter((n) => n._id !== task._id));
      }
    });

    socketRef.current.on('taskDeleted', (taskId) => {
      dispatch(socketTaskDeleted(taskId));
      setActiveNotifications((prev) => prev.filter((n) => n._id !== taskId));
    });

    socketRef.current.on('etaReached', (task) => {
      dispatch(socketTaskUpdated(task));
      handleOpenToast(task);
      triggerNativeNotification(task);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, dispatch]);

  // Client-side Scheduler for high-precision timeouts
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const now = new Date().getTime();

    // Clear old active timers
    Object.keys(timersRef.current).forEach((taskId) => {
      clearTimeout(timersRef.current[taskId]);
      delete timersRef.current[taskId];
    });

    // Schedule new timers
    tasks.forEach((task) => {
      if (task.status === 'Completed' || task.status === 'Overdue') return;

      const etaTime = new Date(task.eta).getTime();
      const delay = etaTime - now;

      // If due within 2 hours, set timer
      if (delay > 0 && delay < 7200000) {
        timersRef.current[task._id] = setTimeout(() => {
          handleOpenToast(task);
          dispatch(socketTaskUpdated({ ...task, status: 'Overdue' }));
          triggerNativeNotification(task);
        }, delay);
      }
    });

    return () => {
      Object.keys(timersRef.current).forEach((taskId) => {
        clearTimeout(timersRef.current[taskId]);
      });
    };
  }, [tasks, dispatch]);

  // Toast actions
  const handleQuickComplete = async (taskId) => {
    await dispatch(completeTask(taskId));
    setActiveNotifications((prev) => prev.filter((n) => n._id !== taskId));
  };

  const handleSnooze = async (task) => {
    // Extend ETA automatically by 15 minutes as standard snooze logic
    const snoozeTime = new Date(Date.now() + 15 * 60 * 1000);
    await dispatch(extendTask({ 
      id: task._id, 
      newEta: snoozeTime.toISOString(), 
      reason: 'Snoozed alarm from dashboard' 
    }));
    setActiveNotifications((prev) => prev.filter((n) => n._id !== task._id));
  };

  const handleDismissToast = (taskId) => {
    setActiveNotifications((prev) => prev.filter((n) => n._id !== taskId));
  };

  return (
    <>
      {/* Desktop permission banner */}
      {permission === 'default' && token && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600/10 border border-blue-500/25 px-4 py-3 rounded-2xl flex items-center justify-between mb-6 glass-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <Bell className="h-4 w-4 animate-bounce" />
            </div>
            <p className="text-xs font-semibold text-slate-300">
              Enable desktop alerts to track daily milestones exactly when employee ETAs arrive.
            </p>
          </div>
          <button
            onClick={requestPermission}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/20"
          >
            Enable Alerts
          </button>
        </motion.div>
      )}

      {/* Stacked Premium Dashboard Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {activeNotifications.map((task, index) => {
            const employeeName = task.employeeId?.name || 'N/A';
            const initials = employeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            
            return (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, x: 100, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.25 } }}
                layout
                className="rounded-2xl border border-red-500/30 bg-[#111827] shadow-2xl p-5 relative overflow-hidden pulse-alarm glass-card text-left"
              >
                {/* Close Button */}
                <button
                  onClick={() => handleDismissToast(task._id)}
                  className="absolute top-4 right-4 p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Alarm Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-500/10 text-red-400 rounded-xl">
                    <Clock className="h-4.5 w-4.5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">ETA Milestone Alarm</span>
                    <span className="text-xs text-slate-500 font-semibold">{new Date(task.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Employee / Task Info Row */}
                <div className="flex gap-3 bg-slate-950/45 p-3 rounded-xl border border-slate-900 mb-4">
                  {/* Initials Avatar */}
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(employeeName)}`}>
                    {initials}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{employeeName}</p>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{task.title}</p>
                  </div>
                </div>

                {/* Quick actions for Manager follow-up */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleQuickComplete(task._id)}
                    className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Complete
                  </button>
                  <button
                    onClick={() => handleSnooze(task)}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <BellOff className="h-4 w-4" />
                    Snooze 15m
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
