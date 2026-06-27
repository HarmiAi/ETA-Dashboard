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
  closeAssignModal,
  holdTask,
  resumeTask,
  openAssignModal
} from '../store/taskSlice';
import { fetchEmployees } from '../store/employeeSlice';
import Mascot from '../components/Mascot';
import EmployeeJourneyBar from '../components/EmployeeJourneyBar';
import { getAvatarColor, getInitials } from '../components/NotificationManager';
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  Play, 
  Pause,
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
  Check,
  ChevronRight
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

  // Hold Modal
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdTaskId, setHoldTaskId] = useState(null);
  const [holdReason, setHoldReason] = useState('');

  // Delete Confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);

  // Advanced Filter States
  const [boardSearch, setBoardSearch] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDueDate, setFilterDueDate] = useState('All');

  // Expanded Employee Accordion State
  const [expandedEmployeeId, setExpandedEmployeeId] = useState(null);

  // Selected Date Filter State (defaults to Today)
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Date comparison helpers
  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getRelativeDateLabel = (date) => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';
    if (isSameDay(date, tomorrow)) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Sync Redux searchQuery with local boardSearch
  useEffect(() => {
    setBoardSearch(searchQuery || '');
  }, [searchQuery]);

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

  // 1. Group tasks by employee with advanced filtering
  const groupedTasksByEmployee = React.useMemo(() => {
    const groups = {};
    
    // Apply filters
    const result = tasks.filter(task => {
      // Search Query (Title or Employee Name)
      const matchesSearch = boardSearch 
        ? (task.title.toLowerCase().includes(boardSearch.toLowerCase()) || 
           (task.employeeId?.name && task.employeeId.name.toLowerCase().includes(boardSearch.toLowerCase())))
        : true;
      
      // Employee Filter
      const matchesEmployee = filterEmployee === 'All' 
        ? true 
        : (task.employeeId?._id === filterEmployee);
        
      // Department Filter
      const matchesDepartment = filterDepartment === 'All'
        ? true
        : (task.employeeId?.department === filterDepartment);
        
      // Priority Filter
      const matchesPriority = filterPriority === 'All'
        ? true
        : (task.priority === filterPriority);
        
      // Status Filter
      const matchesStatus = filterStatus === 'All'
        ? true
        : (task.status === filterStatus);
        
      // Due Date Filter
      let matchesDueDate = true;
      if (filterDueDate !== 'All') {
        const eta = new Date(task.eta);
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        const todayEnd = new Date();
        todayEnd.setHours(23,59,59,999);
        
        const tomorrowStart = new Date(todayStart.getTime() + 24*60*60*1000);
        const tomorrowEnd = new Date(todayEnd.getTime() + 24*60*60*1000);
        
        const weekEnd = new Date(todayEnd.getTime() + 7*24*60*60*1000);
        
        if (filterDueDate === 'Overdue') {
          matchesDueDate = eta < new Date() && task.status !== 'Completed';
        } else if (filterDueDate === 'Today') {
          matchesDueDate = eta >= todayStart && eta <= todayEnd;
        } else if (filterDueDate === 'Tomorrow') {
          matchesDueDate = eta >= tomorrowStart && eta <= tomorrowEnd;
        } else if (filterDueDate === 'This Week') {
          matchesDueDate = eta >= todayStart && eta <= weekEnd;
        }
      }

      // Date Filter (ETA must match selectedDate day)
      const matchesDate = isSameDay(new Date(task.eta), selectedDate);
      
      return matchesSearch && matchesEmployee && matchesDepartment && matchesPriority && matchesStatus && matchesDueDate && matchesDate;
    });
    
    // Group tasks
    result.forEach(task => {
      const empId = task.employeeId?._id || 'unassigned';
      if (!groups[empId]) {
        groups[empId] = {
          employee: task.employeeId || { _id: 'unassigned', name: 'Unassigned', department: 'N/A' },
          tasks: []
        };
      }
      groups[empId].tasks.push(task);
    });
    
    return Object.values(groups).sort((a, b) => a.employee.name.localeCompare(b.employee.name));
  }, [tasks, boardSearch, filterEmployee, filterDepartment, filterPriority, filterStatus, filterDueDate, selectedDate]);

  // 2. Summary stats for active, priority, due, overdue, and completed today
  const boardStats = React.useMemo(() => {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);

    let active = 0;
    let highPriority = 0;
    let dueToday = 0;
    let overdue = 0;
    let completedToday = 0;

    tasks.forEach(task => {
      const isCompleted = task.status === 'Completed';
      const eta = new Date(task.eta);

      if (!isCompleted) {
        active++;
        if (task.priority === 'High') {
          highPriority++;
        }
        if (eta >= todayStart && eta <= todayEnd) {
          dueToday++;
        }
        if (task.status === 'Overdue' || (eta < now && task.status !== 'Completed' && task.status !== 'On Hold')) {
          overdue++;
        }
      } else {
        // Check if completed today
        const lastHistory = task.history && task.history[task.history.length - 1];
        const dateToCheck = lastHistory ? new Date(lastHistory.updatedAt) : new Date(task.updatedAt || task.createdAt);
        if (dateToCheck >= todayStart && dateToCheck <= todayEnd) {
          completedToday++;
        }
      }
    });

    return { active, highPriority, dueToday, overdue, completedToday };
  }, [tasks]);

  // Calculate summary stats for the selected date only, respecting the active filters
  const selectedDateStats = React.useMemo(() => {
    let total = 0;
    let completed = 0;
    let pending = 0;
    let overdue = 0;

    tasks.forEach(task => {
      // Must be on the selected date
      const etaDate = new Date(task.eta);
      if (!isSameDay(etaDate, selectedDate)) return;

      // Check if it matches other active filters
      const matchesSearch = boardSearch 
        ? (task.title.toLowerCase().includes(boardSearch.toLowerCase()) || 
           (task.employeeId?.name && task.employeeId.name.toLowerCase().includes(boardSearch.toLowerCase())))
        : true;
      
      const matchesEmployee = filterEmployee === 'All' 
        ? true 
        : (task.employeeId?._id === filterEmployee);
        
      const matchesDepartment = filterDepartment === 'All'
        ? true
        : (task.employeeId?.department === filterDepartment);
        
      const matchesPriority = filterPriority === 'All'
        ? true
        : (task.priority === filterPriority);
        
      const matchesStatus = filterStatus === 'All'
        ? true
        : (task.status === filterStatus);

      let matchesDueDate = true;
      if (filterDueDate !== 'All') {
        const eta = new Date(task.eta);
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        const todayEnd = new Date();
        todayEnd.setHours(23,59,59,999);
        const tomorrowStart = new Date(todayStart.getTime() + 24*60*60*1000);
        const tomorrowEnd = new Date(todayEnd.getTime() + 24*60*60*1000);
        const weekEnd = new Date(todayEnd.getTime() + 7*24*60*60*1000);
        
        if (filterDueDate === 'Overdue') {
          matchesDueDate = eta < new Date() && task.status !== 'Completed';
        } else if (filterDueDate === 'Today') {
          matchesDueDate = eta >= todayStart && eta <= todayEnd;
        } else if (filterDueDate === 'Tomorrow') {
          matchesDueDate = eta >= tomorrowStart && eta <= tomorrowEnd;
        } else if (filterDueDate === 'This Week') {
          matchesDueDate = eta >= todayStart && eta <= weekEnd;
        }
      }

      if (matchesSearch && matchesEmployee && matchesDepartment && matchesPriority && matchesStatus && matchesDueDate) {
        total++;
        if (task.status === 'Completed') {
          completed++;
        } else {
          pending++;
          if (task.status === 'Overdue' || (new Date(task.eta) < new Date() && task.status !== 'On Hold')) {
            overdue++;
          }
        }
      }
    });

    return { total, completed, pending, overdue };
  }, [tasks, selectedDate, boardSearch, filterEmployee, filterDepartment, filterPriority, filterStatus, filterDueDate]);

  // Check if there are ANY tasks scheduled on the selected date at all
  const hasAnyTasksOnSelectedDate = React.useMemo(() => {
    return tasks.some(task => isSameDay(new Date(task.eta), selectedDate));
  }, [tasks, selectedDate]);

  // Auto-expand first employee group if nothing is expanded
  useEffect(() => {
    if (groupedTasksByEmployee.length > 0) {
      const exists = groupedTasksByEmployee.some(g => (g.employee._id || 'unassigned') === expandedEmployeeId);
      if (!exists) {
        setExpandedEmployeeId(groupedTasksByEmployee[0].employee._id || 'unassigned');
      }
    } else {
      setExpandedEmployeeId(null);
    }
  }, [groupedTasksByEmployee]);

  // Derived metadata (Estimated Time, Dynamic Tags)
  const getTaskMetadata = React.useCallback((task) => {
    const estHours = task.priority === 'High' ? '8h' : task.priority === 'Medium' ? '4h' : '2h';
    const tags = [];
    const titleLower = task.title.toLowerCase();
    
    if (titleLower.includes('code') || titleLower.includes('bug') || titleLower.includes('review') || titleLower.includes('fix') || titleLower.includes('api')) {
      tags.push('Engineering');
    } else if (titleLower.includes('design') || titleLower.includes('ui') || titleLower.includes('ux') || titleLower.includes('figma')) {
      tags.push('Design');
    } else if (titleLower.includes('client') || titleLower.includes('call') || titleLower.includes('meeting') || titleLower.includes('demo')) {
      tags.push('Client');
    } else if (titleLower.includes('report') || titleLower.includes('marketing') || titleLower.includes('sale') || titleLower.includes('seo')) {
      tags.push('Marketing');
    } else {
      tags.push('Operations');
    }
    
    tags.push(task.priority);
    return { estHours, tags };
  }, []);

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
      <div className="clay-card p-6 text-left bg-white">
        {/* Header and Stats Grid */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-650" />
              Active Task Board
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-bold">Organize, track, and monitor active employee deadlines</p>
          </div>
          
          {/* Top Board Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0 w-full xl:w-auto">
            {/* Stat: Active */}
            <div className="p-3 bg-slate-50/50 border border-[#D1DFDA] rounded-xl flex items-center gap-3 min-w-0 w-full">
              <div className="p-2 bg-[#E1F2FF] text-blue-600 border border-blue-200/50 rounded-lg shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block truncate">Active</span>
                <span className="text-base font-extrabold text-slate-800 block mt-0.5 truncate">{boardStats.active}</span>
              </div>
            </div>

            {/* Stat: High Priority */}
            <div className="p-3 bg-slate-50/50 border border-[#D1DFDA] rounded-xl flex items-center gap-3 min-w-0 w-full">
              <div className="p-2 bg-amber-50 text-amber-600 border border-amber-200/50 rounded-lg shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block truncate">High Pri</span>
                <span className="text-base font-extrabold text-amber-650 block mt-0.5 truncate">{boardStats.highPriority}</span>
              </div>
            </div>

            {/* Stat: Due Today */}
            <div className="p-3 bg-slate-50/50 border border-[#D1DFDA] rounded-xl flex items-center gap-3 min-w-0 w-full">
              <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-200/50 rounded-lg shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block truncate">Due Today</span>
                <span className="text-base font-extrabold text-emerald-600 block mt-0.5 truncate">{boardStats.dueToday}</span>
              </div>
            </div>

            {/* Stat: Overdue */}
            <div className="p-3 bg-slate-50/50 border border-[#D1DFDA] rounded-xl flex items-center gap-3 min-w-0 w-full">
              <div className="p-2 bg-red-50 text-red-650 border border-red-200/50 rounded-lg shrink-0">
                <AlertTriangle className="h-4 w-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block truncate">Overdue</span>
                <span className="text-base font-extrabold text-red-600 block mt-0.5 truncate">{boardStats.overdue}</span>
              </div>
            </div>

            {/* Stat: Completed Today */}
            <div className="p-3 bg-slate-50/50 border border-[#D1DFDA] rounded-xl flex items-center gap-3 min-w-0 w-full">
              <div className="p-2 bg-purple-50 text-purple-750 border border-purple-200/50 rounded-lg shrink-0">
                <Check className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block truncate">Completed</span>
                <span className="text-base font-extrabold text-purple-700 block mt-0.5 truncate">{boardStats.completedToday}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Sticky Panel */}
        <div className="bg-slate-50/50 border border-[#D1DFDA] p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 shadow-sm">
          {/* Search Task */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={boardSearch}
              onChange={(e) => setBoardSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-[#D1DFDA] rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:border-[#5EAD93] transition"
            />
          </div>

          {/* Employee Filter */}
          <div>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#D1DFDA] rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:border-[#5EAD93] transition"
            >
              <option value="All">All Employees</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#D1DFDA] rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:border-[#5EAD93] transition"
            >
              <option value="All">All Departments</option>
              {Array.from(new Set(employees.map(e => e.department).filter(Boolean))).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#D1DFDA] rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:border-[#5EAD93] transition"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#D1DFDA] rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:border-[#5EAD93] transition"
            >
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* Due Date Filter */}
          <div>
            <select
              value={filterDueDate}
              onChange={(e) => setFilterDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-[#D1DFDA] rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:border-[#5EAD93] transition"
            >
              <option value="All">All Due Dates</option>
              <option value="Overdue">Overdue</option>
              <option value="Today">Due Today</option>
              <option value="Tomorrow">Due Tomorrow</option>
              <option value="This Week">Due This Week</option>
            </select>
          </div>
        </div>

        {/* Date Filter & Summary Stats Bar */}
        <div className="clay-card p-4 bg-white/65 dark:bg-[#182421]/60 backdrop-blur-lg border border-[#D1DFDA]/85 dark:border-[#24332F]/85 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md shadow-emerald-500/[0.01]">
          {/* Left Side: Date Selection Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-[#1D2C28]/50 p-1 rounded-xl border border-slate-200/50 dark:border-[#24332F]/50">
              {/* Prev Day */}
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() - 1);
                  setSelectedDate(newDate);
                }}
                className="p-1.5 hover:bg-white dark:hover:bg-[#24332F] rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition active:scale-95 shadow-xs"
                title="Previous Day"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>

              {/* Quick Pills */}
              {['Yesterday', 'Today', 'Tomorrow'].map((preset) => {
                const today = new Date();
                let targetDate = new Date();
                if (preset === 'Yesterday') targetDate.setDate(today.getDate() - 1);
                if (preset === 'Tomorrow') targetDate.setDate(today.getDate() + 1);

                const isActive = isSameDay(selectedDate, targetDate);

                return (
                  <button
                    key={preset}
                    onClick={() => setSelectedDate(targetDate)}
                    className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-[#5EAD93] text-white shadow-sm'
                        : 'text-slate-650 dark:text-slate-350 hover:bg-white/60 dark:hover:bg-[#24332F]/60'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}

              {/* Next Day */}
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() + 1);
                  setSelectedDate(newDate);
                }}
                className="p-1.5 hover:bg-white dark:hover:bg-[#24332F] rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition active:scale-95 shadow-xs"
                title="Next Day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Custom Date Picker */}
            <div className="relative flex items-center bg-slate-100/50 dark:bg-[#1D2C28]/50 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-[#24332F]/50 group hover:border-[#5EAD93]/40 dark:hover:border-[#5EAD93]/40 transition">
              <Calendar className="h-3.5 w-3.5 text-[#5EAD93] mr-2 shrink-0" />
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    setSelectedDate(new Date(year, month - 1, day));
                  }
                }}
                className="bg-transparent border-none text-[11px] font-extrabold text-slate-750 dark:text-slate-205 focus:outline-none cursor-pointer w-24 tracking-wide"
              />
            </div>
            
            {/* Selected Date Label */}
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-wider hidden sm:inline">
              ({getRelativeDateLabel(selectedDate)})
            </span>
          </div>

          {/* Right Side: Selected Date Summary Metrics */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest mr-1.5 hidden lg:inline">Selected Date Stats:</span>
            
            {/* Stat Tag: Total */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50/70 dark:bg-blue-950/10 border border-blue-100/35 dark:border-blue-900/20 text-blue-650 dark:text-blue-400 rounded-lg text-[10px] font-bold shadow-xs">
              <span>Total:</span>
              <span className="px-1.5 py-0.2 bg-blue-100/60 dark:bg-blue-900/30 rounded-md font-extrabold">{selectedDateStats.total}</span>
            </div>

            {/* Stat Tag: Completed */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50/70 dark:bg-emerald-950/10 border border-emerald-100/35 dark:border-emerald-900/20 text-emerald-650 dark:text-emerald-400 rounded-lg text-[10px] font-bold shadow-xs">
              <span>Completed:</span>
              <span className="px-1.5 py-0.2 bg-emerald-100/60 dark:bg-emerald-900/30 rounded-md font-extrabold">{selectedDateStats.completed}</span>
            </div>

            {/* Stat Tag: Pending */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50/70 dark:bg-amber-950/10 border border-amber-100/35 dark:border-amber-900/20 text-amber-650 dark:text-amber-450 rounded-lg text-[10px] font-bold shadow-xs">
              <span>Pending:</span>
              <span className="px-1.5 py-0.2 bg-amber-100/60 dark:bg-amber-900/30 rounded-md font-extrabold">{selectedDateStats.pending}</span>
            </div>

            {/* Stat Tag: Overdue (Only if > 0) */}
            {selectedDateStats.overdue > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50/80 dark:bg-red-950/10 border border-red-100/35 dark:border-red-900/20 text-red-650 dark:text-red-400 rounded-lg text-[10px] font-bold shadow-xs animate-pulse">
                <span>Overdue:</span>
                <span className="px-1.5 py-0.2 bg-red-100/60 dark:bg-red-900/30 rounded-md font-extrabold">{selectedDateStats.overdue}</span>
              </div>
            )}
          </div>
        </div>

        {/* Grouped Accordion List Container */}
        <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-200">
          {groupedTasksByEmployee.length === 0 ? (
            !hasAnyTasksOnSelectedDate ? (
              /* Premium Empty State: No tasks scheduled at all for this date */
              <div className="py-20 text-center bg-slate-50/20 border border-[#D1DFDA] dark:border-[#24332F] rounded-2xl shadow-sm">
                <Calendar className="h-12 w-12 mx-auto text-slate-350 dark:text-slate-650 mb-3" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                  No Tasks Scheduled for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 max-w-sm mx-auto font-semibold">
                  Enjoy the clear day! Or assign a new task to get started on this date.
                </p>
                <button 
                  onClick={() => dispatch(openAssignModal())}
                  className="mt-4 px-4 py-2 bg-[#5EAD93] hover:bg-[#4D967D] text-white text-xs font-bold rounded-xl transition active:scale-95 shadow-sm"
                >
                  Assign New Task
                </button>
              </div>
            ) : (
              /* Premium Empty State: Tasks exist but filtered out */
              <div className="py-20 text-center bg-slate-50/20 border border-[#D1DFDA] dark:border-[#24332F] rounded-2xl shadow-sm">
                <Filter className="h-12 w-12 mx-auto text-slate-350 dark:text-slate-650 mb-3" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No tasks matched your active filters</p>
                <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 max-w-sm mx-auto font-semibold">
                  Try widening your filters or search terms for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
                </p>
                <button 
                  onClick={() => {
                    setBoardSearch('');
                    setFilterEmployee('All');
                    setFilterDepartment('All');
                    setFilterPriority('All');
                    setFilterStatus('All');
                    setFilterDueDate('All');
                  }}
                  className="mt-4 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 transition active:scale-95 shadow-sm"
                >
                  Clear Active Filters
                </button>
              </div>
            )
          ) : (
            groupedTasksByEmployee.map((group) => {
              const empId = group.employee._id || 'unassigned';
              const name = group.employee.name || 'Unassigned';
              const initials = getInitials(name);
              const activeCount = group.tasks.filter(t => t.status !== 'Completed').length;
              const hasOverdue = group.tasks.some(t => t.status === 'Overdue');
              const isExpanded = expandedEmployeeId === empId;

              return (
                <div 
                  key={empId}
                  className={`clay-card overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'ring-1 ring-purple-100/50' : 'hover:border-[#5EAD93]'
                  }`}
                >
                  {/* Sticky Accordion Header */}
                  <div 
                    onClick={() => setExpandedEmployeeId(isExpanded ? null : empId)}
                    className={`sticky top-0 z-10 px-4 md:px-6 py-3.5 flex items-center justify-between cursor-pointer transition select-none ${
                      isExpanded 
                        ? 'bg-[#E2ECE8]/30 dark:bg-[#1D2C28]/40 border-b border-[#D1DFDA]/45 dark:border-[#24332F]/40' 
                        : 'bg-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Avatar */}
                      <div className={`h-9 w-9 rounded-full overflow-hidden border border-[#D1DFDA] bg-slate-50 flex items-center justify-center shrink-0 ${
                        hasOverdue && !isExpanded ? 'ring-2 ring-red-400 ring-offset-2' : ''
                      }`}>
                        {group.employee.avatar ? (
                          <img src={group.employee.avatar} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          <div className={`h-full w-full flex items-center justify-center font-bold text-xs ${getAvatarColor(name)}`}>
                            {initials}
                          </div>
                        )}
                      </div>
                      
                      {/* Employee Name & Dept */}
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-800 text-sm block truncate">{name}</span>
                        <span className="text-[10px] text-slate-400 font-extrabold tracking-wide block truncate uppercase mt-0.5">
                          {group.employee.department || 'No Department'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Alert indicators and counts */}
                      <div className="flex items-center gap-2">
                        {hasOverdue && (
                          <span className="flex h-2 w-2 relative shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                          activeCount > 0 
                            ? 'bg-purple-50 text-purple-700 font-bold' 
                            : 'bg-slate-100 text-slate-500 font-bold'
                        }`}>
                          {activeCount} Active {activeCount === 1 ? 'Task' : 'Tasks'}
                        </span>
                      </div>

                      {/* Chevron Indicator */}
                      <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
                        isExpanded ? 'rotate-90 text-purple-600' : ''
                      }`} />
                    </div>
                  </div>

                  {/* Collapsible Expanded Task Cards Grid */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 md:p-6 bg-slate-50/10 border-t border-[#D1DFDA]/40">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {group.tasks.map((task) => {
                              const { estHours, tags } = getTaskMetadata(task);
                              
                              return (
                                <motion.div
                                  key={task._id}
                                  layoutId={task._id}
                                  whileHover={{ y: -3 }}
                                  className={`clay-card p-5 relative flex flex-col justify-between transition-all duration-300 border ${
                                    task.status === 'Overdue' ? 'border-red-300 dark:border-red-500/50 bg-red-50/10 dark:bg-red-500/5' :
                                    task.status === 'On Hold' ? 'border-purple-300 dark:border-purple-500/50 bg-purple-50/10 dark:bg-purple-500/5' : 'border-[#D1DFDA]/70 hover:border-[#5EAD93]'
                                  }`}
                                >
                                  {/* Top header block */}
                                  <div className="pl-0">
                                    <div className="flex justify-between items-start mb-3 gap-2">
                                      {/* Tags list */}
                                      <div className="flex flex-wrap gap-1">
                                        {tags.slice(0, 2).map((t, idx) => (
                                          <span 
                                            key={idx} 
                                            className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                                              t === 'High' ? 'bg-red-50 text-red-650 border border-red-200' :
                                              t === 'Medium' ? 'bg-amber-50 text-amber-655 border border-amber-200' :
                                              t === 'Low' ? 'bg-emerald-50 text-emerald-655 border border-emerald-200' :
                                              'bg-slate-100 text-slate-550 border border-slate-200/50'
                                            }`}
                                          >
                                            {t}
                                          </span>
                                        ))}
                                      </div>

                                      {/* Status Badge */}
                                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                                        task.status === 'Completed' ? 'bg-emerald-50 text-emerald-650 border-emerald-250' :
                                        task.status === 'Overdue' ? 'bg-red-50 text-red-655 border-red-205 animate-pulse' :
                                        task.status === 'In Progress' ? 'bg-blue-50 text-blue-650 border-blue-200' :
                                        task.status === 'On Hold' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        'bg-slate-100 text-slate-550 border-slate-200'
                                      }`}>
                                        {task.status}
                                      </span>
                                    </div>

                                    <h4 className="font-extrabold text-slate-800 text-sm tracking-wide line-clamp-1 mt-1">{task.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                                      {task.description || 'No description provided.'}
                                    </p>
                                  </div>

                                  {/* Time Block & Actions */}
                                  <div className="border-t border-[#D1DFDA]/40 pt-4 mt-4 space-y-3.5 pl-0">
                                    <div className="flex items-center justify-between text-[11px]">
                                      {/* Due Date & Est Duration */}
                                      <div className="flex items-center gap-3">
                                        <span className="text-slate-400 font-bold flex items-center gap-1">
                                          <Clock className="h-3.5 w-3.5" />
                                          {new Date(task.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-slate-400 font-bold block bg-slate-50 border border-[#D1DFDA]/35 px-2 py-0.5 rounded-lg">
                                          {estHours}
                                        </span>
                                      </div>

                                      {/* Date Label */}
                                      <span className="text-slate-550 font-extrabold tracking-wide uppercase text-[9px] bg-slate-50 px-2 py-0.5 rounded-lg border border-[#D1DFDA]/50">
                                        {new Date(task.eta).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                      </span>
                                    </div>

                                    {/* Actions footer block */}
                                    <div className="flex gap-2 text-xs pt-1 border-t border-[#D1DFDA]/30">
                                      {task.status === 'Completed' ? (
                                        <button
                                          onClick={() => dispatch(markTaskNotStarted(task._id))}
                                          className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-655 font-semibold rounded-xl transition border border-[#D1DFDA] active:scale-95"
                                        >
                                          Reopen Task
                                        </button>
                                      ) : task.status === 'On Hold' ? (
                                        <>
                                          <button
                                            onClick={() => dispatch(resumeTask({ id: task._id }))}
                                            className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1 active:scale-95 clay-btn"
                                          >
                                            <Play className="h-3.5 w-3.5" />
                                            Resume
                                          </button>
                                          <button
                                            onClick={() => {
                                              setExtendTaskId(task._id);
                                              const tzoffset = (new Date(task.eta)).getTimezoneOffset() * 60000;
                                              const formatted = (new Date(new Date(task.eta).getTime() - tzoffset)).toISOString().slice(0, -8);
                                              setExtendEta(formatted);
                                              setShowExtendModal(true);
                                            }}
                                            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-655 font-semibold rounded-xl transition border border-[#D1DFDA] active:scale-95"
                                          >
                                            Extend
                                          </button>
                                        </>
                                      ) : (
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
                                              setHoldTaskId(task._id);
                                              setHoldReason('');
                                              setShowHoldModal(true);
                                            }}
                                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl transition border border-purple-200 active:scale-95 flex items-center justify-center gap-1.5 shadow-sm shadow-purple-500/5"
                                            title="Put Task On Hold"
                                          >
                                            <Pause className="h-3.5 w-3.5" />
                                            Hold
                                          </button>
                                          <button
                                            onClick={() => {
                                              setExtendTaskId(task._id);
                                              const tzoffset = (new Date(task.eta)).getTimezoneOffset() * 60000;
                                              const formatted = (new Date(new Date(task.eta).getTime() - tzoffset)).toISOString().slice(0, -8);
                                              setExtendEta(formatted);
                                              setShowExtendModal(true);
                                            }}
                                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-655 font-semibold rounded-xl transition border border-[#D1DFDA] active:scale-95"
                                          >
                                            Extend
                                          </button>
                                        </>
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
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
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
  const initials = getInitials(name);

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
          task.status === 'On Hold' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
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
      <div className="space-y-6">
        {/* Stats Grid and Title Placeholder */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2.5 w-1/4">
            <div className="h-4 bg-slate-200 rounded w-2/3" />
            <div className="h-3 bg-slate-200 rounded w-3/4" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full xl:w-auto shrink-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-3 min-w-[120px] h-[58px]">
                <div className="h-8 w-8 bg-slate-200 rounded-xl" />
                <div className="space-y-1.5 w-1/2">
                  <div className="h-2 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Bar placeholder */}
        <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-3xl grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 h-[66px]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 bg-white border border-slate-200 rounded-xl" />
          ))}
        </div>

        {/* Employee Group rows */}
        <div className="space-y-4">
          {/* Expanded Employee Accordion */}
          <div className="border border-slate-200 bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between bg-slate-50 border-b border-slate-100 h-[68px]">
              <div className="flex items-center gap-3.5 w-1/3">
                <div className="h-9 w-9 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-2 w-full">
                  <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                  <div className="h-2 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
              <div className="h-6 bg-slate-200 rounded-full w-20" />
            </div>
            <div className="p-6 bg-slate-50/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between h-[180px]">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <div className="h-3 bg-slate-200 rounded w-16" />
                        <div className="h-4 bg-slate-200 rounded-full w-12" />
                      </div>
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-full" />
                    </div>
                    <div className="border-t border-slate-100 pt-4 flex gap-2">
                      <div className="flex-1 h-8 bg-slate-200 rounded-xl" />
                      <div className="h-8 bg-slate-200 rounded-xl w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Collapsed Employee Accordions */}
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border border-slate-200 bg-white rounded-3xl p-4 flex items-center justify-between h-[68px]">
              <div className="flex items-center gap-3.5 w-1/4">
                <div className="h-9 w-9 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-2 w-full">
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                  <div className="h-2 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
              <div className="h-6 bg-slate-200 rounded-full w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
