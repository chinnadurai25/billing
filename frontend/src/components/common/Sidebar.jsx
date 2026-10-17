import React from 'react';
import {
  LayoutDashboard, FileText, Users, ShoppingBag, CreditCard,
  PieChart, ShieldCheck, Building2, Activity, Settings, X, PlusCircle,
  TrendingUp, Sparkles, HelpCircle, FileCheck, Package, Wrench
} from 'lucide-react';

export const Sidebar = ({
  mode = 'user', // 'user' or 'admin'
  activeTab,
  setActiveTab,
  onQuickCreateInvoice,
  isMobileOpen,
  closeMobileSidebar,
  invoicesCount
}) => {
  const userNavItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoice Hub', icon: FileText, badge: invoicesCount !== undefined ? String(invoicesCount) : undefined },
    { id: 'customers', label: 'Ledgers & Parties', icon: Users },
    { id: 'products', label: 'Products (Goods)', icon: Package },
    { id: 'services', label: 'Services Catalog', icon: Wrench },
    { id: 'payments', label: 'Payments & Receipts', icon: CreditCard },
    { id: 'tax-reports', label: 'GSTR & Tax Reports', icon: PieChart },
    { id: 'settings', label: 'Account & App Settings', icon: Settings },
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
    <div className="h-full flex flex-col justify-between p-4 bg-white">
      <div>
        {/* Mobile Header Title */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg text-slate-900">BillSon Menu</span>
          </div>
          <button
            onClick={closeMobileSidebar}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
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
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 hover:shadow-blue-700/30 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Quick Create Invoice
            </button>
          </div>
        )}

        {/* Admin Header Badge */}
        {mode === 'admin' && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-300">
            <div className="flex items-center gap-2 text-amber-800 mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold font-mono uppercase tracking-wider">Super Admin Console</span>
            </div>
            <p className="text-[11px] text-amber-700/80 font-medium">Full governance & user audit access</p>
          </div>
        )}

        {/* Section Header */}
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 font-mono">
          {mode === 'admin' ? 'System Management' : 'Core Navigation'}
        </p>

        {/* Nav Link Items */}
        <nav className="space-y-1">
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? mode === 'admin'
                      ? 'bg-amber-50 text-amber-900 border-l-4 border-l-amber-600 font-bold shadow-xs'
                      : 'bg-blue-50 text-blue-900 border-l-4 border-l-blue-700 font-bold shadow-xs'
                    : 'text-slate-700 hover:text-blue-900 hover:bg-slate-100 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${
                    isActive
                      ? mode === 'admin' ? 'text-amber-700' : 'text-blue-700'
                      : 'text-slate-500'
                  }`} />
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    mode === 'admin'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-slate-200 shadow-xs min-h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Slide-in */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={closeMobileSidebar}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />
          {/* Drawer Panel */}
          <div className="relative flex-1 max-w-xs w-full bg-white border-r border-slate-200 z-50 h-full overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
