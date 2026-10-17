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
    <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-slate-200 shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Left: Mobile Drawer Button & Back Button & Logo */}
          <div className="flex items-center gap-2 shrink-0">
            {(currentView === 'user-dashboard' || currentView === 'admin-dashboard') && (
              <button
                onClick={toggleMobileSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5 text-blue-700" />
              </button>
            )}

            {/* Compact Back Button */}
            {currentView !== 'landing' && (
              <button
                onClick={handleGlobalBack}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-800 text-xs font-semibold shrink-0 transition-all cursor-pointer"
                title="Go back step-by-step"
              >
                <ArrowLeft className="w-4 h-4 text-blue-700" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}

            {/* Logo */}
            <button 
              onClick={() => setCurrentView('landing')}
              className="flex items-center gap-2.5 group text-left focus:outline-none shrink-0 cursor-pointer"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 p-0.5 shadow-md group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-blue-700 rounded-[10px] flex items-center justify-center">
                  <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base sm:text-lg tracking-tight font-serif text-slate-900">BillSon</span>
                  <span className="hidden sm:inline-block text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">PRO</span>
                </div>
                <p className="hidden md:block text-[10px] text-slate-600 font-semibold tracking-wide uppercase">Tax & Invoicing SaaS</p>
              </div>
            </button>
          </div>

          {/* Middle Section: Company Name & GST Number (User Login) */}
          {currentView === 'user-dashboard' && user ? (
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
                </div>
                <span className="text-sm font-extrabold text-slate-900 font-serif tracking-wide truncate max-w-[260px] lg:max-w-[380px]">
                  {user.companyName || 'My Enterprise'}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-600 font-bold uppercase">GSTIN:</span>
                <span className="text-xs font-bold font-mono text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 uppercase tracking-wider">
                  {user.gstNumber || user.gst_number || 'N/A'}
                </span>
              </div>
            </div>
          ) : null}

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 shrink-0">
            {currentView === 'user-dashboard' && (
              <div className="flex items-center gap-2">
                {/* Notifications Popover */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-200 relative transition-all cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600"></span>
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-2xl p-4 shadow-xl z-50 border border-slate-200 animate-slide-up">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Bell className="w-4 h-4 text-blue-700" /> Notifications
                        </h4>
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">3 New</span>
                      </div>
                      <div className="space-y-2">
                        {notifications.map((item) => (
                          <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">
                            <p className="text-xs font-medium text-slate-800">{item.text}</p>
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
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 border border-slate-300 hover:border-blue-400 transition-all cursor-pointer"
                  >
                    {userAvatarSrc && !avatarError ? (
                      <img 
                        src={userAvatarSrc} 
                        alt={user?.companyName || user?.fullName || 'Avatar'} 
                        onError={() => setAvatarError(true)}
                        className="w-7 h-7 rounded-lg object-contain bg-white p-0.5 ring-1 ring-slate-300 shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0 font-mono">
                        {user?.fullName ? user.fullName.charAt(0).toUpperCase() : (user?.companyName ? user.companyName.charAt(0).toUpperCase() : 'U')}
                      </div>
                    )}
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-bold text-slate-900 leading-tight">{user?.fullName}</p>
                      <p className="text-[10px] text-slate-600 font-medium truncate max-w-[120px]">{user?.companyName}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl p-2.5 shadow-xl z-50 border border-slate-200 animate-slide-up">
                      <div className="p-3 border-b border-slate-200 mb-1 flex items-center gap-3 bg-slate-50 rounded-xl">
                        {userAvatarSrc && !avatarError ? (
                          <img 
                            src={userAvatarSrc} 
                            alt="Logo" 
                            onError={() => setAvatarError(true)}
                            className="w-9 h-9 rounded-xl object-contain bg-white p-1 border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 font-mono">
                            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : (user?.companyName ? user.companyName.charAt(0).toUpperCase() : 'U')}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName}</p>
                          <p className="text-[10px] text-slate-600 font-medium truncate">{user?.companyName}</p>
                          <span className="mt-1 inline-block text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-mono font-bold">
                            {user?.gstNumber || 'NO GSTIN'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setShowUserDropdown(false); onLogout(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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
                <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-[10px] sm:text-xs font-bold font-mono">SUPER ADMIN</span>
                </div>

                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-xs font-semibold text-slate-800 hover:text-rose-700 border border-slate-300 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Exit Admin</span>
                </button>
              </div>
            )}

            {(currentView === 'landing' || currentView === 'user-login' || currentView === 'user-register' || currentView === 'admin-login') && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('user-login')}
                  className="hidden sm:inline-block px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  User Login
                </button>
                <button
                  onClick={() => setCurrentView('user-register')}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 transition-all cursor-pointer"
                >
                  Create Account <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Mobile Menu Dropdown Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden p-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
                  aria-label="Mobile Navigation"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5 text-blue-700" /> : <Menu className="w-5 h-5 text-blue-700" />}
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (currentView === 'landing' || currentView === 'user-login' || currentView === 'user-register' || currentView === 'admin-login') && (
        <div className="sm:hidden border-t border-slate-200 bg-white p-4 space-y-3 shadow-lg animate-slide-up">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-200">
            <button
              onClick={() => { setCurrentView('user-login'); setMobileMenuOpen(false); }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 text-center"
            >
              User Login
            </button>
            <button
              onClick={() => { setCurrentView('admin-login'); setMobileMenuOpen(false); }}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-800 text-center"
            >
              Admin Portal
            </button>
          </div>

          <button
            onClick={() => { setCurrentView('user-register'); setMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/20"
          >
            Create Company Account <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
