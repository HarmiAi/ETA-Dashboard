import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchTasks, completeTask, extendTask } from '../store/taskSlice';
import { AlertTriangle, Clock, Check, Calendar, ArrowRight, CornerDownRight, X } from 'lucide-react';
import { getAvatarColor, getInitials } from '../components/NotificationManager';

export default function FollowUps() {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.list);
  const overdueTasks = tasks.filter((t) => t.status === 'Overdue');

  // Follow-up actions
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newEta, setNewEta] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTaskId || !newEta || !reason) return;

    const result = await dispatch(extendTask({ id: selectedTaskId, newEta, reason }));
    if (!result.error) {
      setShowExtendModal(false);
      setSelectedTaskId(null);
      setNewEta('');
      setReason('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-left"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-800">Active Follow-Up Board</h2>
        <p className="text-xs text-slate-500 mt-1 font-bold">Review overdue task alarms and execute actions (snooze, extend, resolve)</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {overdueTasks.length === 0 ? (
          <div className="py-20 text-center bg-white border border-[#D1DFDA] rounded-[28px] clay-card">
            <Check className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
            <p className="font-semibold text-slate-700">All Alarms Resolved!</p>
            <p className="text-xs text-slate-500 mt-1">No pending milestones are currently past their ETA deadlines.</p>
          </div>
        ) : (
          overdueTasks.map((task) => {
            const name = task.employeeId?.name || 'N/A';
            const initials = getInitials(name);

            return (
              <div 
                key={task._id}
                className="p-6 rounded-[28px] bg-[#FFF8F8] border border-red-200/60 shadow-sm relative overflow-hidden flex flex-col lg:flex-row justify-between gap-5 text-left"
              >
                {/* Red status strip */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />

                <div className="space-y-4 pl-2 flex-1">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full overflow-hidden border border-red-200/50 bg-slate-50 shrink-0 flex items-center justify-center">
                      {task.employeeId?.avatar ? (
                        <img src={task.employeeId.avatar} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        <div className={`h-full w-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColor(name)}`}>
                          {initials}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{task.title}</h3>
                      <p className="text-xs text-slate-600 mt-1">{task.description || 'No description'}</p>
                      
                      <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-550 font-bold uppercase tracking-wider items-center">
                        <span className="text-slate-700">{name}</span>
                        <span>•</span>
                        <span className="text-red-650 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                          Missed ETA: {new Date(task.eta).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Audit History Timeline snippet */}
                  {task.history && task.history.length > 0 && (
                    <div className="bg-white/80 border border-red-100 p-4 rounded-2xl space-y-2.5 max-w-2xl shadow-sm">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Audit Trail Logs</span>
                      {task.history.slice(-2).map((hist, i) => (
                        <div key={i} className="flex gap-2 text-xs text-slate-600 items-start">
                          <CornerDownRight className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-700">{hist.status}</span>
                            {hist.reason && <span className="text-slate-500 ml-1.5">({hist.reason})</span>}
                            <span className="text-slate-400 text-[10px] ml-2 font-semibold">{new Date(hist.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Follow-up controls */}
                <div className="flex items-center gap-2 lg:self-center shrink-0 pl-2 lg:pl-0">
                  <button
                    onClick={() => dispatch(completeTask(task._id))}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 active:scale-95 clay-btn"
                  >
                    <Check className="h-4 w-4" />
                    Mark Completed
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTaskId(task._id);
                      const tzoffset = (new Date(task.eta)).getTimezoneOffset() * 60000;
                      const formatted = (new Date(new Date(task.eta).getTime() - tzoffset)).toISOString().slice(0, -8);
                      setNewEta(formatted);
                      setShowExtendModal(true);
                    }}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-[#D1DFDA] text-xs font-bold rounded-xl transition active:scale-95 shadow-sm"
                  >
                    Extend ETA
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Extend Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] bg-white border border-[#D1DFDA] shadow-2xl p-6 text-left">
            <div className="flex justify-between items-center mb-4 border-b border-[#D1DFDA] pb-2">
              <h3 className="text-sm font-extrabold text-slate-800">Extend Task ETA</h3>
              <button onClick={() => setShowExtendModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleExtendSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">New ETA Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newEta}
                  onChange={(e) => setNewEta(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 text-xs focus:outline-none focus:border-[#5EAD93] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Extension Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server failure, request delayed"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-850 placeholder-slate-400 text-xs focus:outline-none focus:border-[#5EAD93] transition"
                />
              </div>

              <div className="flex justify-end gap-2 text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-655 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5EAD93] hover:bg-[#4D967D] text-white font-bold rounded-xl clay-btn"
                >
                  Confirm Extension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
