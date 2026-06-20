import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchTasks, completeTask, holdTask, resumeTask } from '../store/taskSlice';
import { Clock, CheckCircle, AlertCircle, User, ArrowRight, Play, Pause, X } from 'lucide-react';
import { getAvatarColor, getInitials } from '../components/NotificationManager';

export default function TodayTasks() {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.list);

  // Hold Modal
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdTaskId, setHoldTaskId] = useState(null);
  const [holdReason, setHoldReason] = useState('');

  const handleHoldSubmit = async (e) => {
    e.preventDefault();
    if (!holdTaskId || !holdReason) return;

    const result = await dispatch(holdTask({ 
      id: holdTaskId, 
      reason: holdReason 
    }));

    if (!result.error) {
      setShowHoldModal(false);
      setHoldTaskId(null);
      setHoldReason('');
    }
  };

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
        <h2 className="text-xl font-bold text-slate-800">Today's Milestone Queue</h2>
        <p className="text-xs text-slate-500 mt-1 font-bold">Review and manage task deadlines arriving today</p>
      </div>

      <div className="clay-card bg-white overflow-hidden text-left">
        {todayTasks.length === 0 ? (
          <div className="py-20 text-center text-slate-550">
            <Clock className="h-10 w-10 mx-auto text-slate-400 mb-3" />
            <p className="font-semibold text-slate-700">All Clear!</p>
            <p className="text-xs text-slate-500 mt-1">No employee task ETAs scheduled for today.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#D1DFDA]">
            {todayTasks.map((task) => {
              const name = task.employeeId?.name || 'N/A';
              const initials = getInitials(name);

              return (
                <div key={task._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-start gap-4">
                    <div className="h-9 w-9 rounded-full overflow-hidden border border-[#D1DFDA] bg-slate-50 shrink-0 flex items-center justify-center">
                      {task.employeeId?.avatar ? (
                        <img src={task.employeeId.avatar} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        <div className={`h-full w-full flex items-center justify-center font-bold text-xs ${getAvatarColor(name)}`}>
                          {initials}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{task.title}</h4>
                      <p className="text-xs text-slate-650 mt-1">{task.description || 'No description'}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-slate-500 font-bold items-center">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {name}
                        </span>
                        <span>•</span>
                        <span className="text-[#5EAD93] flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Due {new Date(task.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span className={`px-2 py-0.2 rounded-full border ${
                          task.priority === 'High' ? 'bg-red-50 text-red-650 border-red-200' :
                          task.priority === 'Medium' ? 'bg-amber-50 text-amber-650 border-amber-200' :
                          'bg-emerald-50 text-emerald-650 border-emerald-200'
                        }`}>
                          {task.priority} Priority
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mr-2 ${
                      task.status === 'Completed' ? 'bg-emerald-50 text-emerald-650 border-emerald-200' :
                      task.status === 'Overdue' ? 'bg-red-50 text-red-650 border-red-200 animate-pulse' :
                      task.status === 'On Hold' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {task.status}
                    </span>

                    {task.status === 'Completed' ? null : task.status === 'On Hold' ? (
                      <button
                        onClick={() => dispatch(resumeTask({ id: task._id }))}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-lg shadow-purple-500/15 clay-btn"
                      >
                        <Play className="h-4 w-4" />
                        Resume Task
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => dispatch(completeTask(task._id))}
                          className="px-3.5 py-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-lg shadow-emerald-500/15 clay-btn"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark Complete
                        </button>
                        <button
                          onClick={() => {
                            setHoldTaskId(task._id);
                            setHoldReason('');
                            setShowHoldModal(true);
                          }}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition border border-purple-200 flex items-center gap-1.5 active:scale-95 shadow-sm shadow-purple-500/5"
                          title="Put Task On Hold"
                        >
                          <Pause className="h-3.5 w-3.5" />
                          Hold
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hold Task Modal Overlay */}
      {showHoldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] bg-white border border-[#D1DFDA] shadow-2xl overflow-hidden text-left">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-extrabold text-slate-800">Put Task On Hold</h3>
                <button onClick={() => setShowHoldModal(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleHoldSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1">Reason for Hold</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Waiting for client feedback"
                    value={holdReason}
                    onChange={(e) => setHoldReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setShowHoldModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl clay-btn transition active:scale-95 shadow-md shadow-purple-500/10"
                  >
                    Confirm Hold
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
