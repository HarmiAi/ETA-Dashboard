import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth, logout } from './store/authSlice';
import { notificationService } from './services/notificationService';

import Sidebar from './components/Sidebar';
import NotificationManager from './components/NotificationManager';
import LiquidBackground from './components/LiquidBackground';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TodayTasks from './pages/TodayTasks';
import FollowUps from './pages/FollowUps';
import CalendarView from './pages/CalendarView';
import Employees from './pages/Employees';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import SettingsPage from './pages/Settings';
import { Loader2, Bell, Search, Plus, Sun, Moon, Menu, ChevronDown, User, LogOut, Clock, AlertTriangle } from 'lucide-react';
import { openAssignModal, setSearchQuery, fetchTasks } from './store/taskSlice';

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { user, initialized } = useSelector((state) => state.auth);
  
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F6F4]">
        <Loader2 className="h-10 w-10 text-[#5EAD93] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Layout Wrapper to separate Login screen from main admin pages
function MainLayout() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const searchQuery = useSelector((state) => state.tasks.searchQuery);
  const tasks = useSelector((state) => state.tasks.list || []);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(notificationService.isEnabled());

  // Fetch tasks on mount or when user changes
  useEffect(() => {
    if (user) {
      dispatch(fetchTasks());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auto-close mobile sidebar drawer on page navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isLoginPage) {
    return <Routes><Route path="/" element={<Login />} /></Routes>;
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  const activeAlarms = tasks.filter(t => t.status === 'Overdue');
  const recentNotifications = tasks
    .filter(t => t.status === 'Overdue' || (t.status !== 'Completed' && new Date(t.eta) - new Date() < 30 * 60 * 1000 && new Date(t.eta) - new Date() > 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F1F6F4] dark:bg-[#0F1715] text-slate-800 dark:text-slate-100 flex relative overflow-hidden transition-colors duration-300">
      {/* Liquid Mesh Background */}
      <LiquidBackground />

      {/* Backdrop overlay for mobile menu drawer */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation Rail */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Panel Content Area (adjusted width offset for floating rail on mobile) */}
      <div className="flex-1 pl-4 md:pl-28 flex flex-col min-h-screen transition-all duration-300">
        {/* Top Header */}
        <header className="h-16 border-b border-[#D1DFDA]/40 dark:border-[#24332F]/40 bg-white/55 dark:bg-[#0F1715]/55 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 select-none shadow-md shadow-emerald-500/[0.01] dark:shadow-emerald-950/[0.03]">
          {/* Left: Mobile hamburger menu toggle & Greeting */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 bg-slate-100/50 hover:bg-slate-100/80 dark:bg-[#1D2C28]/50 dark:hover:bg-[#1D2C28]/80 border border-slate-200/50 dark:border-[#24332F]/50 text-slate-650 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white rounded-xl md:hidden active:scale-95 transition"
              title="Toggle Navigation Menu"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            <div className="flex flex-col text-left">
              <h2 className="text-xs md:text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-wide leading-tight">
                {greeting}, <span className="text-[#5EAD93] dark:text-[#6CD3B4]">{user?.username || 'Manager'}</span>
              </h2>
              <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase mt-1 flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#5EAD93] animate-pulse shrink-0" />
                {currentDate}
              </span>
            </div>
          </div>

          {/* Middle: Integrated Global Search Bar (Command Bar style) */}
          <div className="relative w-48 lg:w-80 hidden md:block group">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-[#5EAD93] transition-colors">
              <Search className="h-3.8 w-3.8 stroke-[2.5px]" />
            </span>
            <input
              type="text"
              placeholder="Search tasks, teams or workflows..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="w-full pl-10 pr-12 py-2 bg-slate-100/30 hover:bg-slate-100/60 dark:bg-[#1D2C28]/30 dark:hover:bg-[#1D2C28]/60 border border-slate-200/60 dark:border-[#24332F]/50 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#5EAD93] dark:focus:border-[#5EAD93] focus:ring-4 focus:ring-[#5EAD93]/10 transition-all duration-200"
            />
            {/* Command Shortcut indicator */}
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="h-5 px-1.5 rounded bg-slate-200/70 dark:bg-[#1D2C28]/80 text-[9px] font-sans font-bold text-slate-500 dark:text-slate-400 border border-slate-350/40 dark:border-[#24332F]/50 flex items-center justify-center shadow-xs">
                ⌘K
              </kbd>
            </span>
          </div>

          {/* Right: Quick Action, Alerts count, Profile Dropdown */}
          <div className="flex items-center gap-2 md:gap-3.5">
            {/* Quick Action: Assign Task button */}
            <button
              onClick={() => dispatch(openAssignModal())}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#5EAD93] to-[#4D967D] hover:from-[#4D967D] hover:to-[#3F8069] text-white font-extrabold rounded-xl text-[10px] md:text-xs transition-all duration-200 shadow-md shadow-emerald-500/15 hover:shadow-emerald-500/25 active:scale-95 active:shadow-inner"
            >
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 stroke-[2.5px]" />
              <span className="hidden sm:inline">Assign Task</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 bg-slate-100/50 hover:bg-slate-100/80 dark:bg-[#1D2C28]/50 dark:hover:bg-[#1D2C28]/80 border border-slate-200/50 dark:border-[#24332F]/50 hover:border-[#5EAD93] dark:hover:border-[#5EAD93] text-slate-500 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white rounded-xl cursor-pointer transition shadow-xs hover:scale-105 active:scale-95"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Notification center trigger */}
            <div className="relative">
              <div 
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setNotificationsDropdownOpen(!notificationsDropdownOpen);
                }}
                className="p-2 bg-slate-100/50 hover:bg-slate-100/80 dark:bg-[#1D2C28]/50 dark:hover:bg-[#1D2C28]/80 border border-slate-200/50 dark:border-[#24332F]/50 hover:border-[#5EAD93] dark:hover:border-[#5EAD93] text-slate-500 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white rounded-xl cursor-pointer transition shadow-xs hover:scale-105 active:scale-95 relative group/bell"
                title="Notifications & Alarms"
              >
                <Bell className="h-4 w-4 group-hover/bell:animate-[bounce_0.5s_ease-in-out_1]" />
                {activeAlarms.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white border-2 border-white dark:border-[#0F1715] animate-pulse" style={{padding: '3px'}}>
                    {activeAlarms.length}
                  </span>
                )}
              </div>

              {/* Notifications Dropdown Menu */}
              {notificationsDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotificationsDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white/95 dark:bg-[#182421]/95 backdrop-blur-md border border-[#D1DFDA] dark:border-[#24332F] shadow-xl p-3.5 z-40 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between border-b border-[#D1DFDA]/50 dark:border-[#24332F]/50 pb-2 mb-2.5">
                      <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 tracking-wider uppercase">Alarms & Alerts</span>
                      {activeAlarms.length > 0 && (
                        <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-200/30 font-black px-2 py-0.5 rounded-full">
                          {activeAlarms.length} Overdue
                        </span>
                      )}
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {recentNotifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-500">
                          <Bell className="h-7 w-7 mx-auto text-slate-300 mb-2.5" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">All Clear</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">No active alarms or approaching deadlines.</p>
                        </div>
                      ) : (
                        recentNotifications.map((task) => {
                          const isOverdue = task.status === 'Overdue';
                          const name = task.employeeId?.name || 'N/A';
                          return (
                            <div 
                              key={task._id} 
                              onClick={() => {
                                navigate('/');
                                setNotificationsDropdownOpen(false);
                              }}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-2.5 items-start ${
                                isOverdue 
                                  ? 'bg-red-50/30 dark:bg-red-950/5 border-red-100/40 dark:border-red-950/20 hover:bg-red-50/60' 
                                  : 'bg-amber-50/30 dark:bg-amber-950/5 border-amber-100/40 dark:border-amber-950/20 hover:bg-amber-50/60'
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                isOverdue ? 'bg-red-100 dark:bg-red-900/20 text-red-650' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-650'
                              }`}>
                                {isOverdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate">{task.title}</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                  {isOverdue 
                                    ? `Overdue alarm for ${name}` 
                                    : `Approaching deadline for ${name}`}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="h-px bg-[#D1DFDA]/50 dark:bg-[#24332F]/50 my-2.5" />

                    <button
                      onClick={() => {
                        navigate('/notifications');
                        setNotificationsDropdownOpen(false);
                      }}
                      className="w-full text-center py-2 rounded-xl text-[10px] font-black text-[#5EAD93] dark:text-[#6CD3B4] hover:bg-slate-50 dark:hover:bg-[#1D2C28] transition-colors uppercase tracking-widest border border-[#5EAD93]/20 hover:border-[#5EAD93]/40"
                    >
                      View Alarm Logs
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* User Profile display with Dropdown */}
            <div className="relative">
              <div 
                onClick={() => {
                  setNotificationsDropdownOpen(false);
                  setProfileDropdownOpen(!profileDropdownOpen);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100/40 dark:bg-[#1D2C28]/40 border border-slate-200/40 dark:border-[#24332F]/50 rounded-xl max-w-[130px] md:max-w-none hover:bg-slate-100/70 dark:hover:bg-[#1D2C28]/70 transition-colors cursor-pointer group/profile"
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-[#5EAD93] to-[#FFA5C0] flex items-center justify-center font-black text-[10px] text-white shrink-0 shadow-sm shadow-emerald-500/10">
                  {user?.username ? user.username[0].toUpperCase() : 'M'}
                </div>
                <span className="text-xs font-bold text-slate-650 dark:text-slate-300 truncate hidden sm:inline">{user?.username || 'Manager'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover/profile:text-slate-600 dark:group-hover/profile:text-slate-300 transition-colors hidden sm:inline shrink-0" />
              </div>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#182421] border border-[#D1DFDA] dark:border-[#24332F] shadow-xl p-2 z-40 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-[#1D2C28] transition-colors"
                    >
                      <User className="h-4 w-4 text-slate-450" />
                      Edit Profile & Settings
                    </button>
                    
                    <button
                      onClick={() => {
                        const nextState = !notificationsEnabled;
                        notificationService.setEnabled(nextState);
                        setNotificationsEnabled(nextState);
                        if (nextState) {
                          notificationService.requestPermission().then((perm) => {
                            alert(perm === 'granted' ? 'Alerts successfully enabled!' : 'Alerts permission: ' + perm);
                          });
                        } else {
                          alert('Alerts successfully disabled!');
                        }
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                        notificationsEnabled 
                          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' 
                          : 'text-[#5EAD93] dark:text-[#6CD3B4] hover:bg-slate-50 dark:hover:bg-[#1D2C28]'
                      }`}
                    >
                      <Bell className="h-4 w-4" />
                      {notificationsEnabled ? 'Disable Desktop Alerts' : 'Enable Desktop Alerts'}
                    </button>

                    <div className="h-px bg-[#D1DFDA] dark:bg-[#24332F] my-1" />

                    <button
                      onClick={() => {
                        dispatch(logout());
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
          {/* Notification alerts listener */}
          <NotificationManager />
          
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/today-tasks" element={<ProtectedRoute><TodayTasks /></ProtectedRoute>} />
            <Route path="/followups" element={<ProtectedRoute><FollowUps /></ProtectedRoute>} />
            <Route path="/timeline" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
}
