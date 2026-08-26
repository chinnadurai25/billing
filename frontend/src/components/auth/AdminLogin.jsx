import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Key, AlertTriangle, Eye, EyeOff, 
  ArrowRight, ShieldAlert, CheckCircle2, LockKeyhole
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AdminLogin = ({ onAdminLoginSuccess, setCurrentView }) => {
  const { addToast } = useToast();
  const [adminUser, setAdminUser] = useState('');
  const [password, setPassword] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (!adminUser.trim() || !password.trim()) {
      addToast('Please enter administrative credentials', 'error');
      return;
    }

    if (adminUser.trim() === 'admin@gmail.com' && password === 'admin123') {
      addToast('Admin privilege authenticated! Opening Super Admin Portal...', 'success', 'Security Authorized');
      onAdminLoginSuccess();
    } else {
      addToast('Invalid Admin Credentials. Check username and password.', 'error', 'Access Denied');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12 bg-dark-950 relative overflow-hidden bg-grid-pattern">
      
      {/* Metallic Gold Glow Background Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none animate-pulse-glow" />

      <div className="w-full max-w-md glass-card-gold rounded-3xl p-8 sm:p-10 border border-amber-500/30 shadow-2xl relative z-10">
        
        {/* Admin Header Badge */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 mx-auto mb-4 shadow-xl shadow-amber-500/20">
            <div className="w-full h-full bg-dark-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-widest border border-amber-500/30">
            <LockKeyhole className="w-3 h-3 text-amber-400" /> Restricted Access • Admin Console
          </span>

          <h2 className="text-2xl font-bold text-white font-serif mt-3">
            System Admin Login
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Authenticate to govern users, billing logs, and tax infrastructure.
          </p>
        </div>

        {/* Security Warning Banner */}
        <div className="mb-6 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Authorized audit access only. All actions are logged with IP sha-256 signatures.</span>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-amber-200 mb-1">Admin Username / Email</label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-amber-400/80 absolute left-3.5 top-3" />
              <input
                type="text"
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                placeholder="e.g. admin@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input glass-input-gold text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-200 mb-1">Admin Security Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-amber-400/80 absolute left-3.5 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input glass-input-gold text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-amber-400/80 hover:text-amber-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-200 mb-1">Admin Security Access Key (optional)</label>
            <div className="relative">
              <Key className="w-4 h-4 text-amber-400/80 absolute left-3.5 top-3" />
              <input
                type="text"
                value={securityKey}
                onChange={(e) => setSecurityKey(e.target.value)}
                placeholder="SEC-KEY"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input glass-input-gold text-xs font-mono uppercase"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-slate-900 border-amber-500/40 text-amber-500 focus:ring-amber-500"
              />
              <span>Remember Session</span>
            </label>
            <button
              type="button"
              onClick={() => addToast('Admin reset protocol requires security key or contacting IT Ops', 'warning')}
              className="text-amber-400 hover:underline"
            >
              Forgot Key?
            </button>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Authenticate Admin Portal <ArrowRight className="w-4 h-4" />
          </button>

        </form>

      </div>
    </div>
  );
};
