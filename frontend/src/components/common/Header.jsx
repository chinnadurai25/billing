import React, { useState } from 'react';
import { 
  Receipt, ShieldCheck, User, LogOut, Bell, LayoutDashboard, 
  Sparkles, CheckCircle2, ChevronDown, Menu, X, ArrowRight, ArrowLeft, Building2
} from 'lucide-react';

export const Header = ({ 
  currentView, 
  setCurrentView, 
  user, 
  adminUser, 
  onLogout,
  toggleMobileSidebar
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const userAvatarSrc = user?.companyLogo || user?.company_logo || user?.avatarUrl;

  React.useEffect(() => {
    setAvatarError(false);
  }, [userAvatarSrc]);

  const handleGlobalBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      if (currentView === 'user-register') setCurrentView('user-login');
      else if (currentView === 'user-login' || currentView === 'admin-login') setCurrentView('landing');
      else if (currentView === 'user-dashboard' || currentView === 'admin-dashboard') setCurrentView('landing');
    }
  };

  const notifications = [
    { id: 1, text: "GSTR-1 filing deadline in 4 days (Aug 30)", time: "10m ago" },
    { id: 2, text: "Invoice TP-2026-089 paid by Acme Global", time: "1h ago" },
    { id: 3, text: "GSTIN auto-validated: 33AAACD1234F1Z5", time: "3h ago" }
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-slate-800/80 bg-dark-950/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Left: Mobile Drawer Button & Back Button & Logo */}
          <div className="flex items-center gap-2 shrink-0">
            {(currentView === 'user-dashboard' || currentView === 'admin-dashboard') && (
              <button
                onClick={toggleMobileSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5 text-indigo-400" />
              </button>
            )}

            {/* Compact Back Button */}
            {currentView !== 'landing' && (
              <button
                onClick={handleGlobalBack}
                className="flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold shrink-0 transition-all"
                title="Go back step-by-step"
              >
                <ArrowLeft className="w-4 h-4 text-brand-400" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}

            {/* Logo */}
            <button 
              onClick={() => setCurrentView('landing')}
              className="flex items-center gap-2 group text-left focus:outline-none shrink-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-brand-accent p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-dark-900 rounded-[10px] flex items-center justify-center">
                  <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-base sm:text-lg tracking-tight font-serif text-white">BillSon</span>
                  <span className="hidden sm:inline-block text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30">PRO</span>
                </div>
                <p className="hidden md:block text-[10px] text-slate-400 tracking-wide font-mono uppercase">Tax SaaS & Invoicing</p>
              </div>
            </button>
          </div>

          {/* Middle Section: Company Name & GST Number (User Login) OR Nav Pills (Public) */}
          {currentView === 'user-dashboard' && user ? (
            <div className="hidden md:flex items-center gap-3.5 px-4 py-2 rounded-2xl glass-card border border-indigo-500/40 bg-gradient-to-r from-dark-900 via-indigo-950/60 to-dark-900 shadow-lg shadow-indigo-950/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  <Building2 className="w-5 h-5 text-indigo-400 shrink-0" />
                </div>
                <span className="text-sm sm:text-base font-extrabold text-white font-serif tracking-wide truncate max-w-[260px] lg:max-w-[380px] drop-shadow-sm">
                  {user.companyName || 'My Enterprise'}
                </span>
              </div>
              <div className="h-5 w-px bg-slate-700/60" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono font-semibold">GSTIN:</span>
                <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 uppercase tracking-wider">
                  {user.gstNumber || user.gst_number || 'N/A'}
                </span>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1 bg-dark-900/60 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setCurrentView('landing')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentView === 'landing' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setCurrentView('user-login')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentView === 'user-login' || currentView === 'user-register' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                User Portal
              </button>
              <button
                onClick={() => setCurrentView('admin-login')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  currentView === 'admin-login' 
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30' 
                    : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Portal
              </button>
            </div>
          )}

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 shrink-0">
            {currentView === 'user-dashboard' && (
              <div className="flex items-center gap-2">
                {/* Notifications Popover */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-600 relative transition-all"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500 animate-ping"></span>
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500"></span>
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-72 sm:w-80 glass-card rounded-2xl p-4 shadow-2xl z-50 border border-slate-700/80 animate-slide-up">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                          <Bell className="w-4 h-4 text-indigo-400" /> Notifications
                        </h4>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono">3 New</span>
                      </div>
                      <div className="space-y-2.5">
                        {notifications.map((item) => (
                          <div key={item.id} className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 transition-colors">
                            <p className="text-xs text-slate-200">{item.text}</p>
                            <span className="text-[10px] text-slate-500 font-mono mt-1 block">{item.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all"
                  >
                    {userAvatarSrc && !avatarError ? (
                      <img 
                        src={userAvatarSrc} 
                        alt={user?.companyName || user?.fullName || 'Avatar'} 
                        onError={() => setAvatarError(true)}
                        className="w-7 h-7 rounded-lg object-contain bg-white/10 p-0.5 ring-2 ring-indigo-500/30 shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 via-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-md border border-indigo-400/30 shrink-0 font-mono">
                        {user?.fullName ? user.fullName.charAt(0).toUpperCase() : (user?.companyName ? user.companyName.charAt(0).toUpperCase() : 'U')}
                      </div>
                    )}
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold text-white leading-tight">{user?.fullName}</p>
                      <p className="text-[10px] text-indigo-400 font-mono">{user?.companyName?.substring(0, 16)}...</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-60 glass-card rounded-2xl p-2.5 shadow-2xl z-50 border border-slate-700/80 animate-slide-up">
                      <div className="p-2.5 border-b border-slate-800 mb-1 flex items-center gap-3 bg-dark-900/60 rounded-xl">
                        {userAvatarSrc && !avatarError ? (
                          <img 
                            src={userAvatarSrc} 
                            alt="Logo" 
                            onError={() => setAvatarError(true)}
                            className="w-9 h-9 rounded-xl object-contain bg-white/10 p-1 border border-indigo-500/30 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md border border-indigo-400/30 shrink-0 font-mono">
                            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : (user?.companyName ? user.companyName.charAt(0).toUpperCase() : 'U')}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{user?.fullName}</p>
                          <p className="text-[10px] text-indigo-300 font-mono truncate">{user?.companyName}</p>
                          <span className="mt-1 inline-block text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                            {user?.gstNumber}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setShowUserDropdown(false); onLogout(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentView === 'admin-dashboard' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] sm:text-xs font-bold font-mono">ADMIN</span>
                </div>

                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-red-950/40 text-xs font-medium text-slate-300 hover:text-red-400 border border-slate-800 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Exit Admin</span>
                </button>
              </div>
            )}

            {(currentView === 'landing' || currentView === 'user-login' || currentView === 'user-register' || currentView === 'admin-login') && (
              <div className="flex items-center gap-1.5">
                {/* Desktop Buttons */}
                <button
                  onClick={() => setCurrentView('user-login')}
                  className="hidden sm:inline-block px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  User Login
                </button>
                <button
                  onClick={() => setCurrentView('user-register')}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Create Account <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Mobile Menu Dropdown Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white transition-all"
                  aria-label="Mobile Navigation"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5 text-indigo-400" />}
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Mobile Glassmorphic Dropdown Navigation Menu */}
      {mobileMenuOpen && (currentView === 'landing' || currentView === 'user-login' || currentView === 'user-register' || currentView === 'admin-login') && (
        <div className="sm:hidden border-t border-slate-800/80 bg-dark-950/95 backdrop-blur-2xl p-4 space-y-3 animate-slide-up">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-800">
            <button
              onClick={() => { setCurrentView('user-login'); setMobileMenuOpen(false); }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 text-center"
            >
              User Login
            </button>
            <button
              onClick={() => { setCurrentView('admin-login'); setMobileMenuOpen(false); }}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 text-center"
            >
              Admin Portal
            </button>
          </div>

          <button
            onClick={() => { setCurrentView('user-register'); setMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            Create Company Account <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
