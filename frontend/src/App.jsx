import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { LandingPage } from './components/landing/LandingPage';
import { UserLogin } from './components/auth/UserLogin';
import { UserRegister } from './components/auth/UserRegister';
import { AdminLogin } from './components/auth/AdminLogin';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { QuickCreateInvoiceModal } from './components/dashboard/QuickCreateInvoiceModal';

import { 
  initialUserData, 
  initialCustomers, 
  initialProductsServices, 
  initialInvoices, 
  initialAdminUsers, 
  monthlyRevenueData, 
  taxBreakdownData, 
  adminActivityLogs 
} from './data/mockData';

function AppContent() {
  const [currentView, setCurrentViewInternal] = useState('landing');
  
  // Dashboard Sub-tabs
  const [userActiveTab, setUserActiveTab] = useState('overview');
  const [adminActiveTab, setAdminActiveTab] = useState('admin-overview');

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Quick Create Invoice Modal state
  const [isQuickInvoiceOpen, setIsQuickInvoiceOpen] = useState(false);

  // App Master Data States
  const [userData, setUserData] = useState(initialUserData);
  const [customers, setCustomers] = useState(initialCustomers);
  const [products, setProducts] = useState(initialProductsServices);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [adminUsers, setAdminUsers] = useState(initialAdminUsers);

  // Synchronized view setter with browser history pushState
  const setCurrentView = useCallback((newView, isBackAction = false) => {
    if (!isBackAction) {
      window.history.pushState({ view: newView }, '', `#${newView}`);
    }
    setCurrentViewInternal(newView);
  }, []);

  // Initialize history state and popstate listener
  useEffect(() => {
    window.history.replaceState({ view: 'landing' }, '', '#landing');

    const handlePopState = (e) => {
      if (e.state && e.state.view) {
        setCurrentViewInternal(e.state.view);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Registration success handler
  const handleRegisterSuccess = (newRegistration) => {
    setUserData((prev) => ({
      ...prev,
      ...newRegistration,
      companyName: newRegistration.companyName || prev.companyName,
      gstNumber: newRegistration.gstNumber || prev.gstNumber,
      panNumber: newRegistration.panNumber || prev.panNumber,
    }));
    setCurrentView('user-dashboard');
  };

  // Save Quick Invoice handler
  const handleSaveInvoice = (newInvoice) => {
    setInvoices([newInvoice, ...invoices]);
  };

  const handleLogout = () => {
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      
      {/* Top Main Navigation Header */}
      <Header 
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={userData}
        onLogout={handleLogout}
        toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex w-full">
        
        {/* User Dashboard View with Sidebar */}
        {currentView === 'user-dashboard' && (
          <>
            <Sidebar 
              mode="user"
              activeTab={userActiveTab}
              setActiveTab={setUserActiveTab}
              onQuickCreateInvoice={() => setIsQuickInvoiceOpen(true)}
              isMobileOpen={isMobileSidebarOpen}
              closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
            />
            <main className="flex-1 min-w-0 bg-dark-950 overflow-y-auto">
              <UserDashboard 
                activeTab={userActiveTab}
                setActiveTab={setUserActiveTab}
                invoices={invoices}
                setInvoices={setInvoices}
                customers={customers}
                setCustomers={setCustomers}
                products={products}
                setProducts={setProducts}
                monthlyRevenueData={monthlyRevenueData}
                taxBreakdownData={taxBreakdownData}
                onQuickCreateInvoice={() => setIsQuickInvoiceOpen(true)}
                user={userData}
              />
            </main>
          </>
        )}

        {/* Admin Dashboard View with Gold Sidebar */}
        {currentView === 'admin-dashboard' && (
          <>
            <Sidebar 
              mode="admin"
              activeTab={adminActiveTab}
              setActiveTab={setAdminActiveTab}
              isMobileOpen={isMobileSidebarOpen}
              closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
            />
            <main className="flex-1 min-w-0 bg-dark-950 overflow-y-auto">
              <AdminDashboard 
                activeTab={adminActiveTab}
                setActiveTab={setAdminActiveTab}
                adminUsers={adminUsers}
                setAdminUsers={setAdminUsers}
                activityLogs={adminActivityLogs}
                monthlyRevenueData={monthlyRevenueData}
                user={userData}
              />
            </main>
          </>
        )}

        {/* Full-width Auth & Landing Screens */}
        {currentView === 'landing' && (
          <main className="flex-1 w-full">
            <LandingPage setCurrentView={setCurrentView} />
          </main>
        )}

        {currentView === 'user-login' && (
          <main className="flex-1 w-full">
            <UserLogin 
              onLoginSuccess={() => setCurrentView('user-dashboard')}
              setCurrentView={setCurrentView}
            />
          </main>
        )}

        {currentView === 'user-register' && (
          <main className="flex-1 w-full">
            <UserRegister 
              onRegisterSuccess={handleRegisterSuccess}
              setCurrentView={setCurrentView}
            />
          </main>
        )}

        {currentView === 'admin-login' && (
          <main className="flex-1 w-full">
            <AdminLogin 
              onAdminLoginSuccess={() => setCurrentView('admin-dashboard')}
              setCurrentView={setCurrentView}
            />
          </main>
        )}

      </div>

      {/* Global Invoice Creator Modal */}
      <QuickCreateInvoiceModal 
        isOpen={isQuickInvoiceOpen}
        onClose={() => setIsQuickInvoiceOpen(false)}
        customers={customers}
        products={products}
        onSaveInvoice={handleSaveInvoice}
      />

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
