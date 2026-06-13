import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchTasks, 
  createTask, 
  completeTask, 
  extendTask, 
  markTaskNotStarted, 
  deleteTask, 
  clearTaskError 
} from '../store/taskSlice';
import { fetchEmployees } from '../store/employeeSlice';
import Mascot from '../components/Mascot';
import { getAvatarColor } from '../components/NotificationManager';
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  Play, 
  Calendar, 
  AlertTriangle, 
  Trash2, 
  Edit2, 
  Search, 
  Filter, 
  X, 
  TrendingUp,
  Activity,
  ArrowRight,
  User,
  PlusCircle,
  Loader2,
  Check
} from 'lucide-react';

export default function Dashboard() {
  const dispatch = useDispatch();
  
  // Redux states
  const tasks = useSelector((state) => state.tasks.list);
  const tasksLoading = useSelector((state) => state.tasks.loading);
  const tasksError = useSelector((state) => state.tasks.error);
  const employees = useSelector((state) => state.employees.list);

  // Search and global search bar
  const [searchTerm, setSearchTerm] = useState('');

  // Assign Task Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignEmployee, setAssignEmployee] = useState('');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDescription, setAssignDescription] = useState('');
  const [assignEta, setAssignEta] = useState('');
  const [assignPriority, setAssignPriority] = useState('Medium');

  // Follow-Up Actions Modals
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendTaskId, setExtendTaskId] = useState(null);
  const [extendEta, setExtendEta] = useState('');
  const [extendReason, setExtendReason] = useState('');

  // Delete Confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchEmployees());
  }, [dispatch]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignEmployee || !assignTitle || !assignEta) return;

    const result = await dispatch(createTask({
      employeeId: assignEmployee,
      title: assignTitle,
      description: assignDescription,
      eta: assignEta,
      priority: assignPriority,
    }));

    if (!result.error) {
      setShowAssignModal(false);
      setAssignEmployee('');
      setAssignTitle('');
      setAssignDescription('');
      setAssignEta('');
      setAssignPriority('Medium');
    }
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!extendTaskId || !extendEta || !extendReason) return;

    const result = await dispatch(extendTask({ 
      id: extendTaskId, 
      newEta: extendEta, 
      reason: extendReason 
    }));

    if (!result.error) {
      setShowExtendModal(false);
      setExtendTaskId(null);
      setExtendEta('');
      setExtendReason('');
    }
  };

  const handleDeleteTask = async () => {
    if (deleteTaskId) {
      const result = await dispatch(deleteTask(deleteTaskId));
      if (!result.error) {
        setShowDeleteConfirm(false);
        setDeleteTaskId(null);
      }
    }
  };

  // Metrics Count
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'Not Started' || t.status === 'In Progress').length;
  const overdueTasks = tasks.filter((t) => t.status === 'Overdue').length;

  // Filter today's tasks chronologically for Journey columns
  const getTodayTasks = () => {
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);

    return tasks.filter(t => {
      const eta = new Date(t.eta);
      return eta >= todayStart && eta <= todayEnd;
    }).sort((a,b) => new Date(a.eta) - new Date(b.eta));
  };

  const todayTasks = getTodayTasks();

  // Distribute today's tasks into columns
  const morningTasks = todayTasks.filter(t => new Date(t.eta).getHours() < 12);
  const afternoonTasks = todayTasks.filter(t => {
    const hours = new Date(t.eta).getHours();
    return hours >= 12 && hours < 17;
  });
  const eveningTasks = todayTasks.filter(t => new Date(t.eta).getHours() >= 17);

  // Search Filter local check
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.employeeId?.name && task.employeeId.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Stagger Animations variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-8"
    >
      {/* Top Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
            <span>{greeting}, Manager</span>
            <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }} className="inline-block">👋</motion.span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Global search input */}
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search tasks or employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition"
            />
          </div>

          <button
            onClick={() => {
              dispatch(clearTaskError());
              const nowPlusHour = new Date(Date.now() + 60 * 60 * 1000);
              const tzoffset = nowPlusHour.getTimezoneOffset() * 60000;
              const localTime = (new Date(nowPlusHour.getTime() - tzoffset)).toISOString().slice(0, -8);
              setAssignEta(localTime);
              setShowAssignModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-500/10 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Assign Task
          </button>
        </div>
      </div>

      {/* Metrics Row & Mascot Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Metric cards grid */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Card: Total */}
          <motion.div 
            whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
            className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between glass-card relative overflow-hidden"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Cumulative Tasks</span>
              <span className="text-3xl font-extrabold text-white mt-1.5 block">{totalTasks}</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">Total assigned tasks in logs</span>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
          </motion.div>

          {/* Card: Completed */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between glass-card relative overflow-hidden"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Completed Tasks</span>
              <span className="text-3xl font-extrabold text-emerald-400 mt-1.5 block">{completedTasks}</span>
              <span className="text-[10px] text-emerald-500/80 font-bold block mt-1">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% success completion rate
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <CheckCircle className="h-5 w-5" />
            </div>
          </motion.div>

          {/* Card: Pending */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between glass-card relative overflow-hidden"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pending Milestones</span>
              <span className="text-3xl font-extrabold text-blue-400 mt-1.5 block">{pendingTasks}</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">Awaiting employee submission</span>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
          </motion.div>

          {/* Card: Overdue */}
          <motion.div 
            whileHover={{ y: -4 }}
            className={`p-5 rounded-2xl border flex items-center justify-between glass-card relative overflow-hidden ${
              overdueTasks > 0 ? 'border-red-500/30 bg-red-950/5' : 'border-slate-800/80 bg-slate-900/40'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Overdue Alarms</span>
              <span className={`text-3xl font-extrabold mt-1.5 block ${overdueTasks > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {overdueTasks}
              </span>
              <span className={`text-[10px] font-bold block mt-1 ${overdueTasks > 0 ? 'text-red-400/80' : 'text-slate-500'}`}>
                {overdueTasks > 0 ? 'Requires follow-up extensions!' : 'No overdue records'}
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${
              overdueTasks > 0 
                ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                : 'bg-slate-850 text-slate-500 border-slate-800'
            }`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </motion.div>
        </div>

        {/* Mascot card */}
        <div className="lg:col-span-1 h-full">
          <Mascot tasks={tasks} />
        </div>
      </div>

      {/* Today's Journey Columns (SugarCRM inspiration) */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 glass-card text-left">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-400" />
            Today's Task Journey (Chronological ETA Stages)
          </h3>
          <span className="text-xs text-slate-500 font-semibold">{todayTasks.length} Milestones Scheduled Today</span>
        </div>

        {todayTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs italic">
            No milestones scheduled for today. Create some tasks to view the connected journey timeline.
          </div>
        ) : (
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 pb-4">
            {/* SVG Connector path overlay - Runs across columns for md and larger screens */}
            <div className="hidden md:block absolute inset-0 pointer-events-none z-0">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Curve 1: Morning to Afternoon */}
                {morningTasks.length > 0 && afternoonTasks.length > 0 && (
                  <path 
                    d="M 230,120 Q 300,100 370,120" 
                    fill="none" 
                    stroke="rgba(59, 130, 246, 0.15)" 
                    strokeWidth="2" 
                    strokeDasharray="4,4" 
                  />
                )}
                {/* Curve 2: Afternoon to Evening */}
                {afternoonTasks.length > 0 && eveningTasks.length > 0 && (
                  <path 
                    d="M 580,120 Q 650,100 720,120" 
                    fill="none" 
                    stroke="rgba(139, 92, 246, 0.15)" 
                    strokeWidth="2" 
                    strokeDasharray="4,4" 
                  />
                )}
              </svg>
            </div>

            {/* Column 1: Morning (09:00 - 12:00) */}
            <div className="space-y-4 z-10 relative">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Morning (Before 12 PM)</h4>
                <span className="text-[10px] text-slate-500 ml-auto font-bold">({morningTasks.length})</span>
              </div>
              <div className="space-y-3">
                {morningTasks.map(t => <TimelineCard key={t._id} task={t} />)}
                {morningTasks.length === 0 && <p className="text-[10px] text-slate-600 italic py-4">No tasks</p>}
              </div>
            </div>

            {/* Column 2: Afternoon (12:00 - 17:00) */}
            <div className="space-y-4 z-10 relative">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Afternoon (12 PM - 5 PM)</h4>
                <span className="text-[10px] text-slate-500 ml-auto font-bold">({afternoonTasks.length})</span>
              </div>
              <div className="space-y-3">
                {afternoonTasks.map(t => <TimelineCard key={t._id} task={t} />)}
                {afternoonTasks.length === 0 && <p className="text-[10px] text-slate-600 italic py-4">No tasks</p>}
              </div>
            </div>

            {/* Column 3: Evening/Night (After 17:00) */}
            <div className="space-y-4 z-10 relative">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Evening (After 5 PM)</h4>
                <span className="text-[10px] text-slate-500 ml-auto font-bold">({eveningTasks.length})</span>
              </div>
              <div className="space-y-3">
                {eveningTasks.map(t => <TimelineCard key={t._id} task={t} />)}
                {eveningTasks.length === 0 && <p className="text-[10px] text-slate-600 italic py-4">No tasks</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Employee Task Board */}
      <div className="space-y-4 text-left">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Active Task Board</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => {
            const employeeName = task.employeeId?.name || 'N/A';
            const initials = employeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            
            return (
              <motion.div
                key={task._id}
                layoutId={task._id}
                whileHover={{ y: -3 }}
                className={`p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 glass-card relative flex flex-col justify-between ${
                  task.status === 'Overdue' ? 'border-red-500/25 bg-red-950/5' : ''
                }`}
              >
                {/* Top header block */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                      task.priority === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {task.priority} Priority
                    </span>

                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                      task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      task.status === 'Overdue' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      task.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {task.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm tracking-wide line-clamp-1">{task.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {task.description || 'No description provided.'}
                  </p>
                </div>

                {/* Avatar and Time Block */}
                <div className="border-t border-slate-800/60 pt-4 mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] ${getAvatarColor(employeeName)}`}>
                        {initials}
                      </div>
                      <span className="text-xs font-bold text-slate-300 truncate max-w-[100px]">{employeeName}</span>
                    </div>

                    <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(task.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Actions footer block */}
                  <div className="flex gap-2 text-xs pt-1 border-t border-slate-850">
                    {task.status !== 'Completed' ? (
                      <>
                        <button
                          onClick={() => dispatch(completeTask(task._id))}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1 active:scale-95"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Complete
                        </button>
                        <button
                          onClick={() => {
                            setExtendTaskId(task._id);
                            const tzoffset = (new Date(task.eta)).getTimezoneOffset() * 60000;
                            const formatted = (new Date(new Date(task.eta).getTime() - tzoffset)).toISOString().slice(0, -8);
                            setExtendEta(formatted);
                            setShowExtendModal(true);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition border border-slate-700 active:scale-95"
                        >
                          Extend
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => dispatch(markTaskNotStarted(task._id))}
                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition border border-slate-700 active:scale-95"
                      >
                        Reopen Task
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setDeleteTaskId(task._id);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-2 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>



      {/* Assign Modal Overlay */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-left">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-bold text-white tracking-wide">Assign Daily ETA Task</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-1 hover:bg-slate-850 rounded-lg text-slate-500 hover:text-white transition"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Select Team Employee</label>
                  <select
                    required
                    value={assignEmployee}
                    onChange={(e) => setAssignEmployee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Code Review, Client Follow-Up"
                    value={assignTitle}
                    onChange={(e) => setAssignTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-700 text-xs focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Task Description</label>
                  <textarea
                    placeholder="Provide detailed instructions..."
                    value={assignDescription}
                    onChange={(e) => setAssignDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-700 text-xs focus:outline-none focus:border-blue-500 transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">ETA Deadline</label>
                    <input
                      type="datetime-local"
                      required
                      value={assignEta}
                      onChange={(e) => setAssignEta(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Priority Level</label>
                    <select
                      value={assignPriority}
                      onChange={(e) => setAssignPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-500/10"
                  >
                    Assign Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Extend ETA Modal Overlay */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-left">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Extend Task Deadline</h3>
                <button onClick={() => setShowExtendModal(false)} className="text-slate-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleExtendSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">New ETA Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={extendEta}
                    onChange={(e) => setExtendEta(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Reason for Extension</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Employee requested more time"
                    value={extendReason}
                    onChange={(e) => setExtendReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExtendModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-350 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
                  >
                    Confirm Extension
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-left">
            <div className="flex items-center gap-2.5 text-red-400 mb-3">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-white">Remove Task Assignment?</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              This will permanently delete this task record from system. This action is irreversible.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTaskId(null);
                }}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 bg-red-650 hover:bg-red-650 text-white font-bold rounded-xl"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Sub-Timeline Card helper
function TimelineCard({ task }) {
  const name = task.employeeId?.name || 'N/A';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="p-3 bg-slate-950/55 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${getAvatarColor(name)}`}>
          {initials}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-white truncate">{task.title}</p>
          <p className="text-[10px] text-slate-500 truncate">{name}</p>
        </div>
      </div>
      
      <div className="text-right shrink-0">
        <p className="text-[10px] font-bold text-purple-300">
          {new Date(task.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full border mt-0.5 inline-block ${
          task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
          task.status === 'Overdue' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
          'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          {task.status}
        </span>
      </div>
    </div>
  );
}
