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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12 bg-[#f8fafc] relative overflow-hidden bg-grid-pattern">
      
      {/* Metallic Gold Soft Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-amber-100/50 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-xl relative z-10">
        
        {/* Admin Header Badge */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white p-0.5 mx-auto mb-4 shadow-md flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-widest border border-amber-200">
            <LockKeyhole className="w-3 h-3 text-amber-700" /> Restricted Access • Admin Console
          </span>

          <h2 className="text-2xl font-bold text-slate-900 font-serif mt-3">
            System Admin Login
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Authenticate to govern users, billing logs, and tax infrastructure.
          </p>
        </div>

        {/* Security Warning Banner */}
        <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Authorized audit access only. All actions are logged with IP sha-256 signatures.</span>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Admin Username / Email</label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                placeholder="admin@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-medium focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Admin Security Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-medium focus:border-amber-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Admin Security Access Key (optional)</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={securityKey}
                onChange={(e) => setSecurityKey(e.target.value)}
                placeholder="SEC-KEY"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-mono uppercase focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span>Remember Session</span>
            </label>
            <button
              type="button"
              onClick={() => addToast('Admin reset protocol requires security key or contacting IT Ops', 'warning')}
              className="text-amber-700 font-bold hover:underline cursor-pointer"
            >
              Forgot Key?
            </button>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
          >
            Authenticate Admin Portal <ArrowRight className="w-4 h-4" />
          </button>

        </form>

      </div>
    </div>
  );
};
