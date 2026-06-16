import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTasks, completeTask, extendTask } from '../store/taskSlice';
import { getAvatarColor, getInitials } from '../components/NotificationManager';
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
    { name: 'Overdue Alarms', list: overdue, color: 'text-red-600', border: 'border-red-200/80', bg: 'bg-[#FFF8F8]', icon: AlertTriangle },
    { name: 'Due Today', list: today, color: 'text-[#5EAD93]', border: 'border-[#D1DFDA]', bg: 'bg-white', icon: Clock },
    { name: 'Due Tomorrow', list: tomorrow, color: 'text-blue-600', border: 'border-blue-200/80', bg: 'bg-white', icon: Clock },
    { name: 'Due Next 7 Days', list: thisWeek, color: 'text-emerald-600', border: 'border-emerald-200/80', bg: 'bg-white', icon: Calendar },
    { name: 'Due Later', list: future, color: 'text-slate-500', border: 'border-slate-200', bg: 'bg-white', icon: Calendar },
    { name: 'Completed History', list: completed, color: 'text-emerald-600', border: 'border-emerald-250', bg: 'bg-white', icon: CheckCircle },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-left"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-800">ETA Timeline Schedule</h2>
        <p className="text-xs text-slate-500 mt-1 font-bold">Review chronological deadlines and logs</p>
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
                        className={`p-4 rounded-2xl border ${cat.border} ${cat.bg} hover:border-[#5EAD93] transition cursor-pointer relative overflow-hidden group shadow-sm`}
                      >
                        {/* Indicator strip */}
                        <div className={`absolute left-0 top-0 w-1 h-full ${
                          task.priority === 'High' ? 'bg-red-500' :
                          task.priority === 'Medium' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`} />

                        <div className="flex justify-between items-start pl-2">
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-slate-850 group-hover:text-[#5EAD93] transition truncate text-sm">{task.title}</h4>
                            <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1.5 font-bold">
                              <User className="h-3 w-3 text-slate-400" />
                              <span className="truncate">{name}</span>
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#5EAD93] transition shrink-0 ml-2" />
                        </div>

                        <div className="mt-4 flex justify-between items-center pl-2 text-[10px]">
                          <span className="text-[#5EAD93] font-bold flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(task.eta).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full border font-bold ${
                            task.status === 'Completed' ? 'bg-emerald-50 text-emerald-650 border-emerald-200' :
                            task.status === 'Overdue' ? 'bg-red-50 text-red-650 border-red-200 animate-pulse' :
                            'bg-slate-100 text-slate-500 border-slate-200'
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
        <div className="rounded-[28px] bg-white clay-card p-6 h-fit text-left">
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
                <div className="flex justify-between items-start border-b border-[#E4E0F3] pb-4">
                  <div>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border mb-2 inline-block ${
                      selectedTask.priority === 'High' ? 'bg-red-50 text-red-650 border-red-200' :
                      selectedTask.priority === 'Medium' ? 'bg-amber-50 text-amber-650 border-amber-200' :
                      'bg-emerald-50 text-emerald-650 border-emerald-200'
                    }`}>
                      {selectedTask.priority} Priority
                    </span>
                    <h3 className="text-base font-bold text-slate-800 leading-tight">{selectedTask.title}</h3>
                  </div>
                  <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Description */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Description</span>
                  <p className="text-xs text-slate-650 mt-1 whitespace-pre-line leading-relaxed">
                    {selectedTask.description || 'No description provided.'}
                  </p>
                </div>

                {/* Employee Row card */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Assigned Staff</span>
                  <div className="mt-2 flex items-center gap-3 bg-slate-50 border border-[#E4E0F3] p-3 rounded-2xl shadow-sm">
                    <div className="h-8 w-8 rounded-full overflow-hidden border border-[#E4E0F3] bg-slate-50 shrink-0 flex items-center justify-center">
                      {selectedTask.employeeId?.avatar ? (
                        <img src={selectedTask.employeeId.avatar} alt={selectedTask.employeeId.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className={`h-full w-full flex items-center justify-center font-bold text-xs ${getAvatarColor(selectedTask.employeeId?.name)}`}>
                          {getInitials(selectedTask.employeeId?.name)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{selectedTask.employeeId?.name || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{selectedTask.employeeId?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Status metrics details */}
                <div className="grid grid-cols-2 gap-4 border-t border-[#D1DFDA] pt-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">ETA Deadline</span>
                    <span className="text-xs font-bold text-[#5EAD93] block mt-1">
                      {new Date(selectedTask.eta).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Status</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 border ${
                      selectedTask.status === 'Completed' ? 'bg-emerald-50 text-emerald-650 border-emerald-200' :
                      selectedTask.status === 'Overdue' ? 'bg-red-50 text-red-650 border-red-200 animate-pulse' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {selectedTask.status}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {selectedTask.status !== 'Completed' && !showExtendForm && (
                  <div className="flex gap-2 pt-2 border-t border-[#D1DFDA]">
                    <button
                      onClick={() => handleCompleteTask(selectedTask._id)}
                      className="flex-grow py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/10 active:scale-95 clay-btn"
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
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition border border-[#D1DFDA]"
                    >
                      Extend
                    </button>
                  </div>
                )}

                {/* Inline Extend Form */}
                {showExtendForm && (
                  <form onSubmit={handleExtendSubmit} className="space-y-3 border-t border-[#D1DFDA] pt-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Extend ETA</h4>
                      <button type="button" onClick={() => setShowExtendForm(false)} className="text-slate-400 text-xs hover:text-slate-700">Cancel</button>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-1">New Date/Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={extendEta}
                        onChange={(e) => setExtendEta(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-[#D1DFDA] text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-1">Reason</label>
                      <input
                        type="text"
                        required
                        placeholder="Reason..."
                        value={extendReason}
                        onChange={(e) => setExtendReason(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-[#D1DFDA] text-slate-800 text-xs"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-[#5EAD93] hover:bg-[#4D967D] text-white text-xs font-bold rounded-lg transition clay-btn">Submit</button>
                  </form>
                )}

                {/* Audit Logs */}
                <div className="border-t border-[#D1DFDA] pt-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-[#5EAD93]" />
                    <span>Audit Trail Logs</span>
                  </span>
                  
                  {selectedTask.history && selectedTask.history.length > 0 ? (
                    <div className="pl-3.5 border-l border-[#D1DFDA] space-y-3.5">
                      {selectedTask.history.map((hist, index) => (
                        <div key={index} className="relative text-xs">
                          {/* Indicator dot */}
                          <div className="absolute -left-[19.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-[#5EAD93] border border-white" />
                          <div className="flex justify-between items-center text-slate-550 font-bold text-[10px]">
                            <span>{hist.status}</span>
                            <span>{new Date(hist.updatedAt).toLocaleDateString()}</span>
                          </div>
                          {hist.reason && (
                            <p className="text-slate-600 mt-1 text-[10px] leading-relaxed bg-slate-50 p-1.5 rounded border border-[#D1DFDA] font-medium">
                              {hist.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">No history logged.</p>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="py-24 text-center text-slate-450 text-xs">
                <Calendar className="h-8 w-8 mx-auto text-slate-350 mb-2" />
                <p className="font-semibold text-slate-500">No Task Selected</p>
                <p className="text-[10px] text-slate-450 mt-1">Select a task card in the timeline list to review audit history.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
