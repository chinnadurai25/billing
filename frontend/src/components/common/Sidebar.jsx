import React from 'react';
import { 
  LayoutDashboard, FileText, Users, ShoppingBag, CreditCard, 
  PieChart, ShieldCheck, Building2, Activity, Settings, X, PlusCircle,
  TrendingUp, Sparkles, HelpCircle, FileCheck
} from 'lucide-react';

export const Sidebar = ({ 
  mode = 'user', // 'user' or 'admin'
  activeTab, 
  setActiveTab, 
  onQuickCreateInvoice,
  isMobileOpen,
  closeMobileSidebar
}) => {
  const userNavItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoice Hub', icon: FileText, badge: '5' },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'services', label: 'Services & Products', icon: ShoppingBag },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'tax-reports', label: 'GSTR & Tax Reports', icon: PieChart },
  ];

  const adminNavItems = [
    { id: 'admin-overview', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'admin-users', label: 'User Directory', icon: Users, badge: 'Active' },
    { id: 'admin-companies', label: 'Registered Companies', icon: Building2 },
    { id: 'admin-invoices', label: 'Global Invoices', icon: FileText },
    { id: 'admin-tax', label: 'Tax Collections', icon: PieChart },
    { id: 'admin-logs', label: 'Audit & Activity Logs', icon: Activity },
    { id: 'admin-settings', label: 'System Settings', icon: Settings },
  ];

  const navItems = mode === 'admin' ? adminNavItems : userNavItems;

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4">
      <div>
        {/* Mobile Header Title */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg text-white">TaxPulse Menu</span>
          </div>
          <button
            onClick={closeMobileSidebar}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Quick CTA Button */}
        {mode === 'user' && (
          <div className="mb-6">
            <button
              onClick={() => {
                onQuickCreateInvoice();
                if (closeMobileSidebar) closeMobileSidebar();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-accent hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" /> Quick Create Invoice
            </button>
          </div>
        )}

        {/* Admin Header Badge */}
        {mode === 'admin' && (
          <div className="mb-6 p-3.5 rounded-xl glass-card-gold border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold font-mono uppercase tracking-wider">Super Admin Console</span>
            </div>
            <p className="text-[11px] text-amber-200/70">Full governance & user audit access</p>
          </div>
        )}

        {/* Section Header */}
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 font-mono">
          {mode === 'admin' ? 'System Management' : 'Core Navigation'}
        </p>

        {/* Nav Link Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (closeMobileSidebar) closeMobileSidebar();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? mode === 'admin'
                      ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border border-amber-500/40 font-semibold'
                      : 'bg-gradient-to-r from-brand-600/20 to-indigo-600/10 text-indigo-300 border border-brand-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${
                    isActive 
                      ? mode === 'admin' ? 'text-amber-400' : 'text-indigo-400'
                      : 'text-slate-400'
                  }`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                    mode === 'admin'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Pro Card */}
      <div className="mt-8">
        {mode === 'user' ? (
          <div className="p-3.5 rounded-2xl glass-card border border-indigo-500/20 bg-indigo-950/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-xs font-bold text-white">GST Filing Ready</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Auto-generate GSTR-1 JSON & Excel sheets compliant with August 2026 GSTN rules.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl glass-card-gold border border-amber-500/30 bg-amber-950/10 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1.5">
              <FileCheck className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">Compliance Sync</span>
            </div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              Audit trails encrypted with SHA-256 signatures & real-time webhook sync.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 glass-card border-r border-slate-800/80 bg-dark-900/40 min-h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Slide-in */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            onClick={closeMobileSidebar}
            className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm transition-opacity"
          />
          {/* Drawer Panel */}
          <div className="relative flex-1 max-w-xs w-full bg-dark-900 glass-card border-r border-slate-800 z-50 h-full overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
