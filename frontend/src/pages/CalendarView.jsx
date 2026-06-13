import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTasks, completeTask, extendTask } from '../store/taskSlice';
import { getAvatarColor } from '../components/NotificationManager';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  ChevronRight, 
  Activity, 
  CornerDownRight,
  X
} from 'lucide-react';

export default function CalendarView() {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.list);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Extension inside details panel
  const [showExtendForm, setShowExtendForm] = useState(false);
  const [extendEta, setExtendEta] = useState('');
  const [extendReason, setExtendReason] = useState('');

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask || !extendEta || !extendReason) return;
    
    const result = await dispatch(extendTask({ id: selectedTask._id, newEta: extendEta, reason: extendReason }));
    if (!result.error) {
      setSelectedTask(result.payload);
      setShowExtendForm(false);
      setExtendEta('');
      setExtendReason('');
    }
  };

  const handleCompleteTask = async (id) => {
    const result = await dispatch(completeTask(id));
    if (!result.error) {
      setSelectedTask(result.payload);
    }
  };

  // Time groupings
  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  const endOfToday = new Date();
  endOfToday.setHours(23,59,59,999);

  const startOfTomorrow = new Date(startOfToday.getTime() + 24*60*60*1000);
  const endOfTomorrow = new Date(endOfToday.getTime() + 24*60*60*1000);

  const endOfWeek = new Date(endOfToday.getTime() + 7*24*60*60*1000);

  const overdue = [];
  const today = [];
  const tomorrow = [];
  const thisWeek = [];
  const future = [];
  const completed = [];

  tasks.forEach(task => {
    if (task.status === 'Completed') {
      completed.push(task);
      return;
    }

    const eta = new Date(task.eta);
    if (eta < now) {
      overdue.push(task);
    } else if (eta >= startOfToday && eta <= endOfToday) {
      today.push(task);
    } else if (eta >= startOfTomorrow && eta <= endOfTomorrow) {
      tomorrow.push(task);
    } else if (eta > endOfTomorrow && eta <= endOfWeek) {
      thisWeek.push(task);
    } else {
      future.push(task);
    }
  });

  const categories = [
    { name: 'Overdue Alarms', list: overdue, color: 'text-red-400', border: 'border-red-500/25', bg: 'bg-red-500/5', icon: AlertTriangle },
    { name: 'Due Today', list: today, color: 'text-purple-400', border: 'border-purple-500/25', bg: 'bg-purple-500/5', icon: Clock },
    { name: 'Due Tomorrow', list: tomorrow, color: 'text-blue-400', border: 'border-blue-500/25', bg: 'bg-blue-500/5', icon: Clock },
    { name: 'Due Next 7 Days', list: thisWeek, color: 'text-emerald-400', border: 'border-emerald-500/25', bg: 'bg-emerald-500/5', icon: Calendar },
    { name: 'Due Later', list: future, color: 'text-slate-400', border: 'border-slate-800/80', bg: 'bg-slate-900/10', icon: Calendar },
    { name: 'Completed History', list: completed, color: 'text-emerald-500', border: 'border-emerald-950/40', bg: 'bg-emerald-950/5', icon: CheckCircle },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-left"
    >
      <div>
        <h2 className="text-xl font-bold text-white">ETA Timeline Schedule</h2>
        <p className="text-xs text-slate-400 mt-1">Review chronological deadlines and logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Listings */}
        <div className="lg:col-span-2 space-y-6 max-h-[75vh] overflow-y-auto pr-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            if (cat.list.length === 0) return null;

            return (
              <div key={cat.name} className="space-y-3">
                <h3 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${cat.color}`}>
                  <Icon className="h-4 w-4" />
                  <span>{cat.name} ({cat.list.length})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cat.list.map((task) => {
                    const name = task.employeeId?.name || 'N/A';
                    return (
                      <motion.div
                        key={task._id}
                        layoutId={`cal-${task._id}`}
                        whileHover={{ y: -3 }}
                        onClick={() => {
                          setSelectedTask(task);
                          setShowExtendForm(false);
                        }}
                        className={`p-4 rounded-2xl border ${cat.border} ${cat.bg} hover:border-slate-700 transition cursor-pointer relative overflow-hidden group`}
                      >
                        {/* Indicator strip */}
                        <div className={`absolute left-0 top-0 w-1 h-full ${
                          task.priority === 'High' ? 'bg-red-500' :
                          task.priority === 'Medium' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`} />

                        <div className="flex justify-between items-start pl-2">
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-white group-hover:text-blue-400 transition truncate text-sm">{task.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5 font-medium">
                              <User className="h-3 w-3" />
                              <span className="truncate">{name}</span>
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition shrink-0 ml-2" />
                        </div>

                        <div className="mt-4 flex justify-between items-center pl-2 text-[10px]">
                          <span className="text-purple-300 font-semibold flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(task.eta).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full border font-bold ${
                            task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            task.status === 'Overdue' ? 'bg-red-500/20 text-red-400 border-red-500/20 animate-pulse' :
                            'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Details Sidebar Panel */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 glass-card p-6 h-fit text-left">
          <AnimatePresence mode="wait">
            {selectedTask ? (
              <motion.div
                key={selectedTask._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Header details */}
                <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                  <div>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border mb-2 inline-block ${
                      selectedTask.priority === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      selectedTask.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {selectedTask.priority} Priority
                    </span>
                    <h3 className="text-base font-bold text-white leading-tight">{selectedTask.title}</h3>
                  </div>
                  <button onClick={() => setSelectedTask(null)} className="text-slate-500 hover:text-white">
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Description */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Description</span>
                  <p className="text-xs text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                    {selectedTask.description || 'No description provided.'}
                  </p>
                </div>

                {/* Employee Row card */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Assigned Staff</span>
                  <div className="mt-2 flex items-center gap-3 bg-slate-950/40 border border-slate-900 p-3 rounded-xl">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarColor(selectedTask.employeeId?.name)}`}>
                      {selectedTask.employeeId?.name ? selectedTask.employeeId.name[0].toUpperCase() : 'E'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{selectedTask.employeeId?.name || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500">{selectedTask.employeeId?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Status metrics details */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">ETA Deadline</span>
                    <span className="text-xs font-bold text-purple-300 block mt-1">
                      {new Date(selectedTask.eta).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Status</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 border ${
                      selectedTask.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      selectedTask.status === 'Overdue' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {selectedTask.status}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {selectedTask.status !== 'Completed' && !showExtendForm && (
                  <div className="flex gap-2 pt-2 border-t border-slate-850">
                    <button
                      onClick={() => handleCompleteTask(selectedTask._id)}
                      className="flex-grow py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/10 active:scale-95"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => {
                        const tzoffset = (new Date(selectedTask.eta)).getTimezoneOffset() * 60000;
                        const formatted = (new Date(new Date(selectedTask.eta).getTime() - tzoffset)).toISOString().slice(0, -8);
                        setExtendEta(formatted);
                        setShowExtendForm(true);
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 text-xs font-bold rounded-xl transition border border-slate-700"
                    >
                      Extend
                    </button>
                  </div>
                )}

                {/* Inline Extend Form */}
                {showExtendForm && (
                  <form onSubmit={handleExtendSubmit} className="space-y-3 border-t border-slate-850 pt-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Extend ETA</h4>
                      <button type="button" onClick={() => setShowExtendForm(false)} className="text-slate-500 text-xs hover:text-white">Cancel</button>
                    </div>
                    <div>
                      <label className="block text-[9px] font-medium text-slate-500 mb-1">New Date/Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={extendEta}
                        onChange={(e) => setExtendEta(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-medium text-slate-500 mb-1">Reason</label>
                      <input
                        type="text"
                        required
                        placeholder="Reason..."
                        value={extendReason}
                        onChange={(e) => setExtendReason(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-white text-xs"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition">Submit</button>
                  </form>
                )}

                {/* Audit Logs */}
                <div className="border-t border-slate-850 pt-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    <span>Audit Trail Logs</span>
                  </span>
                  
                  {selectedTask.history && selectedTask.history.length > 0 ? (
                    <div className="pl-3.5 border-l border-slate-850 space-y-3.5">
                      {selectedTask.history.map((hist, index) => (
                        <div key={index} className="relative text-xs">
                          {/* Indicator dot */}
                          <div className="absolute -left-[18.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-950" />
                          <div className="flex justify-between items-center text-slate-500 font-semibold text-[10px]">
                            <span>{hist.status}</span>
                            <span>{new Date(hist.updatedAt).toLocaleDateString()}</span>
                          </div>
                          {hist.reason && (
                            <p className="text-slate-400 mt-1 text-[10px] leading-relaxed bg-slate-950/20 p-1.5 rounded border border-slate-850">
                              {hist.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-600 italic">No history logged.</p>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="py-24 text-center text-slate-500 text-xs">
                <Calendar className="h-8 w-8 mx-auto text-slate-700 mb-2" />
                <p className="font-semibold text-slate-400">No Task Selected</p>
                <p className="text-[10px] text-slate-600 mt-1">Select a task card in the timeline list to review audit history.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
