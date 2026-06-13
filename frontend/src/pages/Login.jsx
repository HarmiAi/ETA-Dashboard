import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginManager, registerManager, clearError } from '../store/authSlice';
import { Clock, Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [isRegister, dispatch]);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegister) {
      dispatch(registerManager({ username, email, password }));
    } else {
      dispatch(loginManager({ email, password }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F6F4] p-4 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#5EAD93]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-[32px] bg-white clay-card relative z-10 border border-[#D1DFDA] text-left">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-2 bg-white dark:bg-[#1D2C28] border border-[#D1DFDA] dark:border-[#24332F] rounded-2xl flex items-center justify-center mb-3 w-14 h-14 shadow-sm">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-full w-full object-contain rounded-lg invert dark:invert-0" 
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-wide">ETA Follow-Up System</h2>
          <p className="text-sm text-slate-500 font-bold mt-1">
            {isRegister ? 'Create manager account' : 'Sign in to manage team ETAs'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-655 rounded-xl flex items-center gap-3 text-xs font-bold">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="ManagerName"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-[#5EAD93] transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                placeholder="manager@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-[#5EAD93] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-[#5EAD93] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#5EAD93] hover:bg-[#4D967D] disabled:bg-[#5EAD93]/50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 mt-6 shadow-md shadow-emerald-500/15 clay-btn"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRegister ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-8 text-center text-xs font-bold text-slate-500">
          <span>
            {isRegister ? 'Already have an account? ' : "Don't have a manager account? "}
          </span>
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-[#5EAD93] hover:underline"
          >
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
