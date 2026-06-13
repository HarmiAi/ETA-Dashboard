import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './store/authSlice';

import Sidebar from './components/Sidebar';
import NotificationManager from './components/NotificationManager';
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
import { Loader2, Bell, Search } from 'lucide-react';

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { user, initialized } = useSelector((state) => state.auth);
  
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
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
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <Routes><Route path="/" element={<Login />} /></Routes>;
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
          {/* Left: Current Date */}
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Manager Panel &bull; {currentDate}
            </h2>
          </div>

          {/* Right: Notification Trigger & profile info */}
          <div className="flex items-center gap-4">
            {/* Mock Bell trigger */}
            <div className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl cursor-pointer transition relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-950" />
            </div>

            {/* Profile tag */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl select-none">
              <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[10px] text-white">
                {user?.username ? user.username[0].toUpperCase() : 'M'}
              </div>
              <span className="text-xs font-semibold text-slate-300">{user?.username || 'Manager'}</span>
            </div>
          </div>
        </header>

        <main className="flex-grow p-8 max-w-7xl mx-auto w-full">
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
