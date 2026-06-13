import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchTasks } from '../store/taskSlice';
import { Bell, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { getAvatarColor } from '../components/NotificationManager';

export default function Notifications() {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.list);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  // Focus on overdue alarms or tasks that have a notified flag / completed after being overdue
  const alarmLogs = tasks.filter(t => t.status === 'Overdue' || t.history.some(h => h.status === 'Overdue'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-left"
    >
      <div>
        <h2 className="text-xl font-bold text-white">Alarm Notification History</h2>
        <p className="text-xs text-slate-400 mt-1">Audit log of system-generated deadline alerts and overrides</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 glass-card overflow-hidden">
        {alarmLogs.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <Bell className="h-10 w-10 mx-auto text-slate-700 mb-3" />
            <p className="font-semibold text-slate-400">All Clear</p>
            <p className="text-xs text-slate-650 mt-1">No deadline alarms have been triggered in logs yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-850">
            {alarmLogs.map((task) => {
              const name = task.employeeId?.name || 'N/A';
              const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              
              // Find when it became overdue
              const overdueLog = task.history.find(h => h.status === 'Overdue');
              const timeTriggered = overdueLog ? new Date(overdueLog.updatedAt).toLocaleString() : new Date(task.eta).toLocaleString();

              return (
                <div key={task._id} className="p-5 flex items-start gap-4 hover:bg-slate-900/25 transition">
                  <div className="p-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl shrink-0 mt-0.5">
                    <AlertTriangle className="h-4.5 w-4.5 animate-pulse" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-sm">ETA Deadline Alarm Triggered</h4>
                      <span className="text-[10px] text-slate-500 font-semibold">{timeTriggered}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Task <strong>"{task.title}"</strong> assigned to <strong>{name}</strong> crossed its deadline without completion.
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        task.status === 'Overdue' ? 'bg-red-500/25 text-red-400 border-red-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        Current Status: {task.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
