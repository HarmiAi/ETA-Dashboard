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
  clearTaskError,
  closeAssignModal
} from '../store/taskSlice';
import { fetchEmployees } from '../store/employeeSlice';
import Mascot from '../components/Mascot';
import EmployeeJourneyBar from '../components/EmployeeJourneyBar';
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

  // Search Query read from Redux
  const searchQuery = useSelector((state) => state.tasks.searchQuery);

  // Assign Task Modal
  const showAssignModal = useSelector((state) => state.tasks.isAssignModalOpen);
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

  // Preset modal values when modal is opened from global header
  useEffect(() => {
    if (showAssignModal) {
      dispatch(clearTaskError());
      const nowPlusHour = new Date(Date.now() + 60 * 60 * 1000);
      const tzoffset = nowPlusHour.getTimezoneOffset() * 60000;
      const localTime = (new Date(nowPlusHour.getTime() - tzoffset)).toISOString().slice(0, -8);
      setAssignEta(localTime);
    }
  }, [showAssignModal, dispatch]);

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
      dispatch(closeAssignModal());
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
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.employeeId?.name && task.employeeId.name.toLowerCase().includes(searchQuery.toLowerCase()))
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

  if (tasksLoading && tasks.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-8"
    >
      {/* Premium Employee Journeys Cutout Bar */}
      <EmployeeJourneyBar />


      {/* Metrics Row & Mascot Side-by-Side */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-4 gap-6"
      >
        {/* Metric cards grid */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Card: Total */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(130 117 247 / 0.08)" }}
            className="p-5 rounded-2xl bg-white flex items-center justify-between clay-card relative overflow-hidden"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Cumulative Tasks</span>
              <span className="text-3xl font-extrabold text-slate-800 mt-1.5 block">{totalTasks}</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1">Total assigned tasks in logs</span>
            </div>
            <div className="p-3 bg-[#E1F2FF] text-blue-600 border border-blue-200/50 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
          </motion.div>

          {/* Card: Completed */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="p-5 rounded-2xl bg-white flex items-center justify-between clay-card relative overflow-hidden"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Completed Tasks</span>
              <span className="text-3xl font-extrabold text-emerald-600 mt-1.5 block">{completedTasks}</span>
              <span className="text-[10px] text-emerald-500 font-semibold block mt-1">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% success completion rate
              </span>
            </div>
            <div className="p-3 bg-[#E2FFE9] text-emerald-600 border border-emerald-200 rounded-xl">
              <CheckCircle className="h-5 w-5" />
            </div>
          </motion.div>

          {/* Card: Pending */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="p-5 rounded-2xl bg-white flex items-center justify-between clay-card relative overflow-hidden"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pending Milestones</span>
              <span className="text-3xl font-extrabold text-[#5EAD93] mt-1.5 block">{pendingTasks}</span>
              <span className="text-[10px] text-slate-450 font-semibold block mt-1">Awaiting employee submission</span>
            </div>
            <div className="p-3 bg-[#E2ECE8] text-[#5EAD93] border border-[#D1DFDA] rounded-xl">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
          </motion.div>

          {/* Card: Overdue */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className={`p-5 rounded-2xl flex items-center justify-between clay-card relative overflow-hidden ${
              overdueTasks > 0 ? 'border-red-300 bg-red-50/10' : ''
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Overdue Alarms</span>
              <span className={`text-3xl font-extrabold mt-1.5 block ${overdueTasks > 0 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                {overdueTasks}
              </span>
              <span className={`text-[10px] font-bold block mt-1 ${overdueTasks > 0 ? 'text-red-400/80' : 'text-slate-400'}`}>
                {overdueTasks > 0 ? 'Requires follow-up extensions!' : 'No overdue records'}
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${
              overdueTasks > 0 
                ? 'bg-[#FFE2E2] text-red-500 border-red-200' 
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </motion.div>
        </div>

        {/* Mascot card */}
        <motion.div variants={itemVariants} className="lg:col-span-1 h-full">
          <Mascot tasks={tasks} />
        </motion.div>
      </motion.div>

      {/* Today's Journey Columns (SugarCRM inspiration) */}
      <div className="clay-card p-6 text-left bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#5EAD93]" />
            Today's Task Journey (Chronological ETA Stages)
          </h3>
          <span className="text-xs text-slate-500 font-bold">{todayTasks.length} Milestones Scheduled Today</span>
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
              <div className="flex items-center gap-2 border-b border-[#D1DFDA] pb-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Morning (Before 12 PM)</h4>
                <span className="text-[10px] text-slate-400 ml-auto font-bold">({morningTasks.length})</span>
              </div>
              <div className="space-y-3">
                {morningTasks.map(t => <TimelineCard key={t._id} task={t} />)}
                {morningTasks.length === 0 && <p className="text-[10px] text-slate-400 italic py-4 font-semibold">No tasks</p>}
              </div>
            </div>

            {/* Column 2: Afternoon (12:00 - 17:00) */}
            <div className="space-y-4 z-10 relative">
              <div className="flex items-center gap-2 border-b border-[#D1DFDA] pb-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5EAD93]" />
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Afternoon (12 PM - 5 PM)</h4>
                <span className="text-[10px] text-slate-400 ml-auto font-bold">({afternoonTasks.length})</span>
              </div>
              <div className="space-y-3">
                {afternoonTasks.map(t => <TimelineCard key={t._id} task={t} />)}
                {afternoonTasks.length === 0 && <p className="text-[10px] text-slate-400 italic py-4 font-semibold">No tasks</p>}
              </div>
            </div>

            {/* Column 3: Evening/Night (After 17:00) */}
            <div className="space-y-4 z-10 relative">
              <div className="flex items-center gap-2 border-b border-[#D1DFDA] pb-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Evening (After 5 PM)</h4>
                <span className="text-[10px] text-slate-400 ml-auto font-bold">({eveningTasks.length})</span>
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
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">Active Task Board</h3>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredTasks.map((task) => {
            const employeeName = task.employeeId?.name || 'N/A';
            const initials = employeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            
            return (
              <motion.div
                key={task._id}
                layoutId={task._id}
                variants={itemVariants}
                whileHover={{ y: -3 }}
                className={`clay-card p-5 bg-white relative flex flex-col justify-between ${
                  task.status === 'Overdue' ? 'border-red-300 bg-red-50/10' : ''
                }`}
              >
                {/* Top header block */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                      task.priority === 'High' ? 'bg-red-50 text-red-650 border-red-200' :
                      task.priority === 'Medium' ? 'bg-amber-50 text-amber-650 border-amber-200' :
                      'bg-emerald-50 text-emerald-650 border-emerald-200'
                    }`}>
                      {task.priority} Priority
                    </span>

                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                      task.status === 'Completed' ? 'bg-emerald-50 text-emerald-650 border-emerald-200' :
                      task.status === 'Overdue' ? 'bg-red-50 text-red-650 border-red-200 animate-pulse' :
                      task.status === 'In Progress' ? 'bg-blue-50 text-blue-650 border-blue-200' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {task.status}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-800 text-sm tracking-wide line-clamp-1">{task.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {task.description || 'No description provided.'}
                  </p>
                </div>

                {/* Avatar and Time Block */}
                <div className="border-t border-[#D1DFDA] pt-4 mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full overflow-hidden border border-[#D1DFDA] bg-slate-50 shrink-0 flex items-center justify-center">
                        {task.employeeId?.avatar ? (
                          <img src={task.employeeId.avatar} alt={employeeName} className="h-full w-full object-cover" />
                        ) : (
                          <div className={`h-full w-full flex items-center justify-center font-bold text-[9px] ${getAvatarColor(employeeName)}`}>
                            {initials}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[100px]">{employeeName}</span>
                    </div>

                    <span className="text-[11px] font-bold text-[#5EAD93] flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(task.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Actions footer block */}
                  <div className="flex gap-2 text-xs pt-1.5 border-t border-[#D1DFDA]/60">
                    {task.status !== 'Completed' ? (
                      <>
                        <button
                          onClick={() => dispatch(completeTask(task._id))}
                          className="flex-1 py-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-xl transition flex items-center justify-center gap-1 active:scale-95 clay-btn"
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
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl transition border border-[#D1DFDA] active:scale-95"
                        >
                          Extend
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => dispatch(markTaskNotStarted(task._id))}
                        className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl transition border border-[#D1DFDA] active:scale-95"
                      >
                        Reopen Task
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setDeleteTaskId(task._id);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>



      {/* Assign Modal Overlay */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white border border-[#E4E0F3] shadow-2xl overflow-hidden text-left">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-extrabold text-slate-800 tracking-wide">Assign Daily ETA Task</h3>
                <button
                  onClick={() => dispatch(closeAssignModal())}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Select Team Employee</label>
                  <select
                    required
                    value={assignEmployee}
                    onChange={(e) => setAssignEmployee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 text-xs focus:outline-none focus:border-[#5EAD93] transition"
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Code Review, Client Follow-Up"
                    value={assignTitle}
                    onChange={(e) => setAssignTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-[#5EAD93] transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Task Description</label>
                  <textarea
                    placeholder="Provide detailed instructions..."
                    value={assignDescription}
                    onChange={(e) => setAssignDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-[#5EAD93] transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">ETA Deadline</label>
                    <input
                      type="datetime-local"
                      required
                      value={assignEta}
                      onChange={(e) => setAssignEta(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 text-xs focus:outline-none focus:border-[#5EAD93] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Priority Level</label>
                    <select
                      value={assignPriority}
                      onChange={(e) => setAssignPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 text-xs focus:outline-none focus:border-[#5EAD93] transition"
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
                    onClick={() => dispatch(closeAssignModal())}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#5EAD93] hover:bg-[#4D967D] text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-500/15 clay-btn"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] bg-white border border-[#D1DFDA] shadow-2xl overflow-hidden text-left">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-extrabold text-slate-800">Extend Task Deadline</h3>
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
                    value={extendEta}
                    onChange={(e) => setExtendEta(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Reason for Extension</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Employee requested more time"
                    value={extendReason}
                    onChange={(e) => setExtendReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExtendModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl"
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
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] bg-white border border-[#D1DFDA] shadow-2xl p-6 text-left">
            <div className="flex items-center gap-2.5 text-red-500 mb-3">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-extrabold text-slate-800">Remove Task Assignment?</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              This will permanently delete this task record from system. This action is irreversible.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTaskId(null);
                }}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 bg-red-500 hover:bg-red-650 text-white font-bold rounded-xl clay-btn"
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
    <div className="p-3 bg-slate-50/50 rounded-xl border border-[#D1DFDA] flex items-center justify-between hover:border-[#5EAD93] transition">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="h-7 w-7 rounded-full overflow-hidden border border-[#D1DFDA] bg-slate-50 shrink-0 flex items-center justify-center">
          {task.employeeId?.avatar ? (
            <img src={task.employeeId.avatar} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className={`h-full w-full flex items-center justify-center font-bold text-[9px] shrink-0 ${getAvatarColor(name)}`}>
              {initials}
            </div>
          )}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-slate-800 truncate">{task.title}</p>
          <p className="text-[10px] text-slate-500 truncate">{name}</p>
        </div>
      </div>
      
      <div className="text-right shrink-0">
        <p className="text-[10px] font-bold text-[#5EAD93]">
          {new Date(task.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full border mt-0.5 inline-block ${
          task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-250' :
          task.status === 'Overdue' ? 'bg-red-50 text-red-650 border-red-200' :
          'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          {task.status}
        </span>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse text-left">
      {/* Metrics Row & Mascot Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between glass-card relative overflow-hidden h-[106px]">
              <div className="space-y-2.5 w-2/3">
                <div className="h-2.5 bg-slate-850 rounded w-1/2" />
                <div className="h-7 bg-slate-850 rounded w-1/3" />
                <div className="h-2.5 bg-slate-850 rounded w-3/4" />
              </div>
              <div className="h-11 w-11 bg-slate-850 rounded-xl" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-1 h-full">
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl h-full flex flex-col items-center justify-center space-y-4 min-h-[236px]">
            <div className="h-24 w-24 rounded-full bg-slate-850" />
            <div className="h-4 bg-slate-850 rounded w-2/3" />
            <div className="h-3 bg-slate-850 rounded w-3/4" />
          </div>
        </div>
      </div>

      {/* Today's Journey Columns Skeleton */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 glass-card">
        <div className="flex justify-between items-center mb-6">
          <div className="h-4 bg-slate-850 rounded w-1/3" />
          <div className="h-3.5 bg-slate-850 rounded w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, colIdx) => (
            <div key={colIdx} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-slate-850" />
                <div className="h-3 bg-slate-850 rounded w-1/2" />
              </div>
              <div className="space-y-3">
                {[...Array(2)].map((_, cardIdx) => (
                  <div key={cardIdx} className="p-3 bg-slate-950/55 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 w-2/3">
                      <div className="h-7 w-7 rounded-full bg-slate-850 shrink-0" />
                      <div className="space-y-1.5 w-full">
                        <div className="h-3 bg-slate-850 rounded w-3/4" />
                        <div className="h-2 bg-slate-850 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-1.5 items-end flex flex-col">
                      <div className="h-2.5 bg-slate-850 rounded w-10" />
                      <div className="h-3 bg-slate-850 rounded-full w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Task Board Skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-slate-850 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 glass-card flex flex-col justify-between h-[218px]">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="h-4 bg-slate-850 rounded-full w-20" />
                  <div className="h-4 bg-slate-850 rounded-full w-16" />
                </div>
                <div className="h-4.5 bg-slate-850 rounded w-3/4 mb-2" />
                <div className="space-y-1.5">
                  <div className="h-3 bg-slate-850 rounded w-full" />
                  <div className="h-3 bg-slate-850 rounded w-5/6" />
                </div>
              </div>
              <div className="border-t border-slate-800/60 pt-4 mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-slate-850" />
                    <div className="h-3 bg-slate-850 rounded w-20" />
                  </div>
                  <div className="h-3 bg-slate-850 rounded w-12" />
                </div>
                <div className="flex gap-2 pt-1 border-t border-slate-850">
                  <div className="flex-1 h-8 bg-slate-850 rounded-xl" />
                  <div className="h-8 bg-slate-850 rounded-xl w-16" />
                  <div className="h-8 bg-slate-850 rounded-xl w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
