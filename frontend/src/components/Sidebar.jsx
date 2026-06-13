import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Clock, 
  RefreshCw, 
  Calendar, 
  Users, 
  FileText, 
  BarChart3, 
  Bell, 
  Settings, 
  LogOut, 
  Activity,
  User
} from 'lucide-react';
import { logout } from '../store/authSlice';

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: "Today's Tasks", path: '/today-tasks', icon: Clock },
    { name: 'Follow-Ups', path: '/followups', icon: RefreshCw },
    { name: 'Timeline', path: '/timeline', icon: Calendar },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0B0F19]/90 backdrop-blur-md flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
          <Activity className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-white tracking-wider uppercase">ETA Tracker</h1>
          <span className="text-[9px] text-blue-400 font-bold tracking-widest uppercase">Linear Edition</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 border relative ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border-blue-500/35'
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-4.5 w-4.5 transition-colors duration-200 ${
                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`} />
                  <span>{item.name}</span>
                  
                  {/* Active accent pill indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile & Session actions */}
      <div className="p-4 border-t border-slate-800/80 space-y-4 bg-slate-950/20">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/40 border border-slate-800/30 rounded-xl">
            <div className="p-1.5 bg-slate-850 text-slate-400 rounded-lg flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.username}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 border border-transparent hover:border-red-500/10"
        >
          <LogOut className="h-4.5 w-4.5" />
          Logout Manager
        </button>
      </div>
    </aside>
  );
}
