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

  // 2. Schedule alerts at the EXACT ETA and handle 15-minute overdue repetitions
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

    // Case B: Background monitoring loop to handle overdue tasks & 15-minute repetitions
    const monitoringInterval = setInterval(() => {
      const currentTime = Date.now();
      
      tasks.forEach((task) => {
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
    }, 30000); // Check every 30 seconds

    return () => {
      Object.keys(timersRef.current).forEach((id) => clearTimeout(timersRef.current[id]));
      clearInterval(monitoringInterval);
    };
  }, [tasks, dispatch]);

  const triggerTaskNotification = (task) => {
    playBeep();
    lastAlertTimesRef.current[task._id] = Date.now();
    notificationService.showNotification(task);
  };

  // 3. Socket.io Event Handling
  useEffect(() => {
    if (!token) return;

    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('taskCreated', (task) => {
      dispatch(socketTaskCreated(task));
    });

    socketRef.current.on('taskUpdated', (task) => {
      dispatch(socketTaskUpdated(task));
    });

    socketRef.current.on('taskDeleted', (taskId) => {
      dispatch(socketTaskDeleted(taskId));
    });

    socketRef.current.on('etaReached', (task) => {
      dispatch(socketTaskUpdated(task));
      triggerTaskNotification(task);
    });

    return () => {
      if (socketRef.current) {
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

export { playBeep };
