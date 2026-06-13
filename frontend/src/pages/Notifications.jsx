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
        <h2 className="text-xl font-bold text-slate-800">Alarm Notification History</h2>
        <p className="text-xs text-slate-500 font-bold mt-1">Audit log of system-generated deadline alerts and overrides</p>
      </div>

      <div className="rounded-3xl border border-[#E4E0F3] bg-white clay-card overflow-hidden">
        {alarmLogs.length === 0 ? (
          <div className="py-20 text-center text-slate-550">
            <Bell className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">All Clear</p>
            <p className="text-xs text-slate-500 mt-1">No deadline alarms have been triggered in logs yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E0F3]">
            {alarmLogs.map((task) => {
              const name = task.employeeId?.name || 'N/A';
              const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              
              // Find when it became overdue
              const overdueLog = task.history.find(h => h.status === 'Overdue');
              const timeTriggered = overdueLog ? new Date(overdueLog.updatedAt).toLocaleString() : new Date(task.eta).toLocaleString();

              return (
                <div key={task._id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition">
                  <div className="p-2.5 bg-red-50 text-red-650 border border-red-250 rounded-xl shrink-0 mt-0.5">
                    <AlertTriangle className="h-4.5 w-4.5 animate-pulse" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-800 text-sm">ETA Deadline Alarm Triggered</h4>
                      <span className="text-[10px] text-slate-500 font-bold">{timeTriggered}</span>
                    </div>
                    <p className="text-xs text-slate-650 mt-1 leading-relaxed font-medium">
                      Task <strong className="text-slate-800">"{task.title}"</strong> assigned to <strong className="text-slate-850">{name}</strong> crossed its deadline without completion.
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        task.status === 'Completed' ? 'bg-emerald-55 text-emerald-650 border-emerald-200' :
                        task.status === 'Overdue' ? 'bg-red-50 text-red-650 border-red-200 animate-pulse' :
                        'bg-slate-100 text-slate-500 border-slate-200'
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
