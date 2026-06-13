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
  User
} from 'lucide-react';
import { logout } from '../store/authSlice';

export default function Sidebar({ isOpen, setIsOpen }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    setIsOpen && setIsOpen(false);
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
    <aside  style={{zIndex: 9999}} className={`w-20 bg-[#5EAD93] flex flex-col h-[calc(100vh-32px)] my-4 ml-4 rounded-[32px] fixed top-0 z-45 select-none items-center py-6 justify-between shadow-2xl shadow-emerald-500/15 border border-white/15 transition-all duration-300 ${
      isOpen ? 'left-0' : '-left-32 md:left-0'
    }`}>
      {/* Top Brand Logo */}
      <div className="flex flex-col items-center gap-6 w-full">
        <div 
          className="p-1.5 bg-white border border-white/20 rounded-2xl flex items-center justify-center cursor-pointer hover:scale-105 transition-all duration-200 shadow-md w-10 h-10" 
          onClick={() => { navigate('/'); setIsOpen && setIsOpen(false); }}
        >
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-full w-full object-contain rounded-lg invert dark:invert-0" 
          />
        </div>

        {/* Rail Items */}
        <nav className="flex flex-col gap-3 w-full px-3 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen && setIsOpen(false)}
                className={({ isActive }) =>
                  `group relative p-3 rounded-2xl transition-all duration-200 border flex items-center justify-center ${
                    isActive
                      ? 'bg-white text-[#5EAD93] border-white/25 shadow-lg shadow-black/5'
                      : 'text-white/75 hover:text-white border-transparent hover:bg-white/10'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-5 w-5 shrink-0" />
                    
                    {/* Visual spring active highlight */}
                    {isActive && (
                      <motion.div
                        layoutId="activeRailIndicator"
                        className="absolute left-0 w-1 h-6 rounded-r-full bg-white"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}

                    {/* Premium Hover Tooltip */}
                    <div className="absolute left-16 scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-150 origin-left z-40 bg-slate-900 border border-slate-850 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-2xl pointer-events-none whitespace-nowrap tracking-wide">
                      {item.name}
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile / Action */}
      <div className="flex flex-col gap-4 items-center w-full px-3">
        {user && (
          <div className="group relative p-2.5 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center cursor-default">
            <User className="h-4.5 w-4.5 text-white/90" />
            <div className="absolute left-16 scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-150 origin-left z-40 bg-slate-900 border border-slate-850 text-white text-[10px] p-2 rounded-xl shadow-2xl whitespace-nowrap text-left leading-normal">
              <p className="font-bold">{user.username}</p>
              <p className="text-slate-400 font-medium">{user.email}</p>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="group relative p-3 text-white/75 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-2xl transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <div className="absolute left-16 scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-150 origin-left z-40 bg-slate-900 border border-slate-850 text-red-300 text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap">
            Logout
          </div>
        </button>
      </div>
    </aside>
  );
}
