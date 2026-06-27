import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
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

  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredRect, setHoveredRect] = useState(null);

  const handleMouseEnter = (e, item) => {
    if (isOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Cache coordinates
    setHoveredRect({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
    setHoveredItem(item);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
    setHoveredRect(null);
  };

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
    <>
      <aside  style={{zIndex: 9999}} className={`w-20 bg-[#5EAD93] flex flex-col h-[calc(100vh-32px)] my-4 ml-4 rounded-[32px] fixed top-0 z-45 select-none items-center py-6 justify-between shadow-2xl shadow-emerald-500/15 border border-white/15 transition-all duration-300 overflow-y-auto scrollbar-none ${
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
                  onMouseEnter={(e) => handleMouseEnter(e, item)}
                  onMouseLeave={handleMouseLeave}
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
            <div 
              onMouseEnter={(e) => handleMouseEnter(e, { ...user, isProfile: true })}
              onMouseLeave={handleMouseLeave}
              className="group relative p-2.5 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center cursor-default"
            >
              <User className="h-4.5 w-4.5 text-white/90" />
            </div>
          )}
          
          <button
            onClick={handleLogout}
            onMouseEnter={(e) => handleMouseEnter(e, { name: 'Logout', isLogout: true })}
            onMouseLeave={handleMouseLeave}
            className="group relative p-3 text-white/75 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-2xl transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Floating Tooltip Portal/Container outside the scrollable aside */}
      <AnimatePresence>
        {hoveredItem && hoveredRect && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -8 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            style={{
              position: 'fixed',
              left: `${hoveredRect.left + hoveredRect.width + 12}px`,
              top: `${hoveredRect.top + hoveredRect.height / 2}px`,
              transform: 'translateY(-50%)',
              zIndex: 99999
            }}
            className="bg-slate-900 border border-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-2xl pointer-events-none whitespace-nowrap tracking-wide origin-left"
          >
            {hoveredItem.isProfile ? (
              <div className="text-[10px] text-left leading-normal">
                <p className="font-bold">{hoveredItem.username}</p>
                <p className="text-slate-400 font-medium">{hoveredItem.email}</p>
              </div>
            ) : hoveredItem.isLogout ? (
              <span className="text-red-300">{hoveredItem.name}</span>
            ) : (
              <span>{hoveredItem.name}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
