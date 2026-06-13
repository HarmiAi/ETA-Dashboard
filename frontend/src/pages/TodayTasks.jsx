import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchTasks, completeTask } from '../store/taskSlice';
import { Clock, CheckCircle, AlertCircle, User, ArrowRight } from 'lucide-react';
import { getAvatarColor } from '../components/NotificationManager';

export default function TodayTasks() {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.list);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  // Filter today's tasks
  const getTodayTasks = () => {
    const start = new Date();
    start.setHours(0,0,0,0);
    const end = new Date();
    end.setHours(23,59,59,999);
    return tasks.filter((t) => {
      const eta = new Date(t.eta);
      return eta >= start && eta <= end;
    }).sort((a,b) => new Date(a.eta) - new Date(b.eta));
  };

  const todayTasks = getTodayTasks();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-left"
    >
      <div>
        <h2 className="text-xl font-bold text-white">Today's Milestone Queue</h2>
        <p className="text-xs text-slate-400 mt-1">Review and manage task deadlines arriving today</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 glass-card overflow-hidden">
        {todayTasks.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <Clock className="h-10 w-10 mx-auto text-slate-700 mb-3" />
            <p className="font-semibold text-slate-400">All Clear!</p>
            <p className="text-xs text-slate-650 mt-1">No employee task ETAs scheduled for today.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-850">
            {todayTasks.map((task) => {
              const name = task.employeeId?.name || 'N/A';
              const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

              return (
                <div key={task._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/25 transition">
                  <div className="flex items-start gap-4">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${getAvatarColor(name)}`}>
                      {initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{task.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{task.description || 'No description'}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-slate-500 font-semibold items-center">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {name}
                        </span>
                        <span>•</span>
                        <span className="text-purple-400 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Due {new Date(task.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span className={`px-2 py-0.2 rounded-full border ${
                          task.priority === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {task.priority} Priority
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mr-2 ${
                      task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      task.status === 'Overdue' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {task.status}
                    </span>

                    {task.status !== 'Completed' && (
                      <button
                        onClick={() => dispatch(completeTask(task._id))}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-lg shadow-emerald-500/15"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark Complete
                      </button>
                    )}
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
