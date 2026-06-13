import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Settings, Shield, Bell, User, Cpu } from 'lucide-react';

export default function SettingsPage() {
  const user = useSelector((state) => state.auth.user);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-left"
    >
      <div>
        <h2 className="text-xl font-bold text-white">System Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Configure manager profile credentials and default alerts snooze behaviors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Details */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 glass-card space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="h-4 w-4 text-purple-400" />
            Manager Profile
          </h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block mb-1">Username</span>
              <span className="text-slate-300 font-semibold">{user?.username || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block mb-1">Email Address</span>
              <span className="text-slate-300 font-semibold">{user?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block mb-1">Assigned Role</span>
              <span className="text-blue-400 font-semibold uppercase tracking-wider">Manager Mode</span>
            </div>
          </div>
        </div>

        {/* Notifications setup */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 glass-card space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Bell className="h-4 w-4 text-purple-400" />
            Alert Configuration
          </h3>
          
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-300">Desktop Push Notifications</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Prompt OS native dialog alerts</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-slate-800 bg-slate-950 text-blue-500 focus:ring-blue-500 h-4 w-4" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-300">Synthetic Web Audio Beeps</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Play buzzer on milestone ETA</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-slate-800 bg-slate-950 text-blue-500 focus:ring-blue-500 h-4 w-4" />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase">Default Snooze Interval</label>
              <select className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs">
                <option>15 Minutes</option>
                <option>30 Minutes</option>
                <option>1 Hour</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Specs */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 glass-card space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="h-4 w-4 text-purple-400" />
            Infrastructure Specs
          </h3>
          
          <div className="space-y-3 text-xs text-slate-400">
            <p>Database: <strong>MongoDB 8.0</strong></p>
            <p>Socket Node Channel: <strong>Socket.io 4.7</strong></p>
            <p>Framework client: <strong>React 19 (Vite)</strong></p>
            <p>UI Styles: <strong>Tailwind CSS v3</strong></p>
            <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-850">
              System is currently connected to active local database instances.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
