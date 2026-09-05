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
import { api } from './services/api';

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
  // Restore logged-in user from localStorage on refresh
  const [savedUser] = useState(() => {
    try {
      const stored = localStorage.getItem('billson_active_user') || localStorage.getItem('taxpulse_active_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentViewInternal] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    return savedUser ? 'user-dashboard' : 'landing';
  });
  
  // Dashboard Sub-tabs
  const [userActiveTab, setUserActiveTab] = useState('overview');
  const [adminActiveTab, setAdminActiveTab] = useState('admin-overview');

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Quick Create Invoice Modal state
  const [isQuickInvoiceOpen, setIsQuickInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const handleOpenQuickInvoice = (invToEdit = null) => {
    setEditingInvoice(invToEdit || null);
    setIsQuickInvoiceOpen(true);
  };

  // App Master Data States - start clean and empty for new authenticated users
  const [userData, setUserData] = useState(() => savedUser || initialUserData);
  const [customers, setCustomers] = useState(() => savedUser ? [] : initialCustomers);
  const [products, setProducts] = useState(() => savedUser ? [] : initialProductsServices);
  const [invoices, setInvoices] = useState(() => savedUser ? [] : initialInvoices);
  const [adminUsers, setAdminUsers] = useState(initialAdminUsers);
  const [bankAccounts, setBankAccounts] = useState(() => savedUser ? [] : [
    { id: 'BANK-001', bankType: 'Bank Account', accountName: 'Durai Tax Advisory Operating A/C', accountNumber: '50100234901234', bankName: 'HDFC Bank Ltd', ifscCode: 'HDFC0001234', address: 'Anna Salai, Chennai Branch', balance: 450000, status: 'Active' },
    { id: 'BANK-002', bankType: 'Bank Account', accountName: 'Durai Tax Collection Reserve', accountNumber: '000405012345', bankName: 'ICICI Bank Ltd', ifscCode: 'ICIC0000004', address: 'Nungambakkam, Chennai Branch', balance: 280000, status: 'Active' },
    { id: 'BANK-003', bankType: 'Cash in Hand', accountName: 'Main Petty Cash Ledger', accountNumber: 'CASH-LEDGER-01', bankName: 'Cash Chest', ifscCode: 'N/A', address: 'Office Safe', balance: 35000, status: 'Active' }
  ]);

  // ─── Normalise helpers (MySQL snake_case → camelCase) ─────────────────────
  const normaliseCustomer = (c) => ({
    id: c.id,
    userId: c.user_id || c.userId,
    name: c.name,
    ledger: c.ledger || 'SUNDRY DEBTORS',
    address: c.address || '',
    gstNumber: c.gst_number || c.gstNumber || '',
    panNumber: c.pan_number || c.panNumber || '',
    phone: c.mobile || c.phone || '',
    email: c.email || '',
    city: c.city || 'Chennai',
    state: c.state || 'Tamil Nadu',
    totalBilled: parseFloat(c.total_billed ?? c.totalBilled ?? 0),
    status: c.status || 'Active',
  });

  const normaliseBank = (b) => ({
    id: b.id,
    userId: b.user_id || b.userId,
    bankType: b.bank_type || b.bankType || 'Bank Account',
    accountName: b.account_name || b.accountName || '',
    accountNumber: b.account_number || b.accountNumber || '',
    bankName: b.bank_name || b.bankName || '',
    ifscCode: b.ifsc_code || b.ifscCode || '',
    address: b.address || '',
    balance: parseFloat(b.balance ?? 0),
    status: b.status || 'Active',
  });

  const normaliseProduct = (p) => ({
    id: p.id,
    userId: p.user_id || p.userId,
    title: p.title,
    unit: p.unit || 'Pices',
    hsnSac: p.hsn_sac || p.hsnSac || '',
    openingStock: parseInt(p.opening_stock ?? p.openingStock ?? 100),
    rate: parseFloat(p.rate ?? 0),
    taxPercent: parseFloat(p.tax_percent ?? p.taxPercent ?? 18),
    category: p.category || 'Sales / Service Item',
  });

  const normaliseInvoice = (inv) => ({
    id: inv.id,
    userId: inv.user_id || inv.userId,
    invoiceNumber: inv.invoice_number || inv.invoiceNumber || '',
    customerName: inv.customer_name || inv.customerName || '',
    customerGst: inv.customer_gst || inv.customerGst || '',
    date: inv.date || '',
    dueDate: inv.due_date || inv.dueDate || '',
    subtotal: parseFloat(inv.subtotal ?? 0),
    cgst: parseFloat(inv.cgst ?? 0),
    sgst: parseFloat(inv.sgst ?? 0),
    igst: parseFloat(inv.igst ?? 0),
    totalTax: parseFloat(inv.total_tax ?? inv.totalTax ?? 0),
    grandTotal: parseFloat(inv.grand_total ?? inv.grandTotal ?? 0),
    status: inv.status || 'Pending',
    items: inv.items || [],
  });

  // ─── Fetch live data from MySQL for the active user ───────────────────────
  const fetchUserData = useCallback(async (activeUserId) => {
    if (!activeUserId) {
      setCustomers([]);
      setBankAccounts([]);
      setProducts([]);
      setInvoices([]);
      return;
    }

    try {
      const [custRes, bankRes, prodRes, invRes] = await Promise.all([
        api.getCustomers(activeUserId),
        api.getBankAccounts(activeUserId),
        api.getProducts(activeUserId),
        api.getInvoices(activeUserId)
      ]);

      setCustomers(custRes?.success && custRes.data ? custRes.data.map(normaliseCustomer) : []);
      setBankAccounts(bankRes?.success && bankRes.data ? bankRes.data.map(normaliseBank) : []);
      setProducts(prodRes?.success && prodRes.data ? prodRes.data.map(normaliseProduct) : []);
      setInvoices(invRes?.success && invRes.data ? invRes.data.map(normaliseInvoice) : []);
    } catch (err) {
      console.warn('Backend connection note:', err.message);
    }
  }, []);

  // Fetch on mount or user change
  useEffect(() => {
    if (userData?.id) {
      fetchUserData(userData.id);
    } else {
      setCustomers([]);
      setBankAccounts([]);
      setProducts([]);
      setInvoices([]);
    }
  }, [userData?.id, fetchUserData]);

  // Synchronized view setter with browser history pushState
  const setCurrentView = useCallback((newView, isBackAction = false) => {
    if (!isBackAction) {
      window.history.pushState({ view: newView }, '', `#${newView}`);
    }
    setCurrentViewInternal(newView);
  }, []);

  // Initialize history state and popstate listener
  useEffect(() => {
    const initialV = savedUser ? 'user-dashboard' : 'landing';
    window.history.replaceState({ view: initialV }, '', `#${initialV}`);

    const handlePopState = (e) => {
      if (e.state && e.state.view) {
        setCurrentViewInternal(e.state.view);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [savedUser]);

  // Auth success handlers (Login / Registration)
  const handleAuthSuccess = (loggedInUser) => {
    if (loggedInUser) {
      // Clear any prior session data immediately
      setCustomers([]);
      setBankAccounts([]);
      setProducts([]);
      setInvoices([]);

      const completeUser = {
        id: loggedInUser.id || `USR-${Date.now()}`,
        fullName: loggedInUser.fullName || loggedInUser.full_name || 'Business User',
        companyName: loggedInUser.companyName || loggedInUser.company_name || 'My Enterprise',
        gstNumber: loggedInUser.gstNumber || loggedInUser.gst_number || '',
        panNumber: loggedInUser.panNumber || loggedInUser.pan_number || '',
        email: loggedInUser.email || '',
        contactNumber: loggedInUser.contactNumber || loggedInUser.contact_number || '',
        companyAddress: loggedInUser.companyAddress || loggedInUser.company_address || '',
        state: loggedInUser.state || 'Tamil Nadu',
        constitution: loggedInUser.constitution || 'Private Limited',
        companyLogo: loggedInUser.companyLogo || loggedInUser.company_logo || null
      };

      try {
        localStorage.setItem('billson_active_user', JSON.stringify(completeUser));
      } catch (e) {}

      setUserData(completeUser);
      fetchUserData(completeUser.id);
    }
    setCurrentView('user-dashboard');
  };

  // Save / Update Quick Invoice handler
  const handleSaveInvoice = async (savedInvoice) => {
    const invoiceWithUser = {
      ...savedInvoice,
      userId: userData?.id || 'USR-901'
    };

    const exists = invoices.some(i => i.id === savedInvoice.id);

    if (exists) {
      setInvoices(prev => prev.map(inv => inv.id === savedInvoice.id ? invoiceWithUser : inv));
      try {
        await api.updateInvoice(savedInvoice.id, invoiceWithUser);
      } catch (err) {
        console.warn('Could not update invoice on backend:', err);
      }
    } else {
      setInvoices(prev => [invoiceWithUser, ...prev.filter(inv => inv.id !== invoiceWithUser.id)]);
      try {
        await api.createInvoice(invoiceWithUser);
      } catch (err) {
        console.warn('Could not persist invoice to backend:', err);
      }
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('billson_active_user');
      localStorage.removeItem('billson_token');
      localStorage.removeItem('taxpulse_active_user');
      localStorage.removeItem('taxpulse_token');
    } catch (e) {}
    setUserData(null);
    setCustomers([]);
    setBankAccounts([]);
    setProducts([]);
    setInvoices([]);
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
              onQuickCreateInvoice={handleOpenQuickInvoice}
              isMobileOpen={isMobileSidebarOpen}
              closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
              invoicesCount={invoices.length}
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
                bankAccounts={bankAccounts}
                setBankAccounts={setBankAccounts}
                monthlyRevenueData={monthlyRevenueData}
                taxBreakdownData={taxBreakdownData}
                onQuickCreateInvoice={handleOpenQuickInvoice}
                user={userData}
                setUserData={setUserData}
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
              onLoginSuccess={handleAuthSuccess}
              setCurrentView={setCurrentView}
            />
          </main>
        )}

        {currentView === 'user-register' && (
          <main className="flex-1 w-full">
            <UserRegister 
              onRegisterSuccess={handleAuthSuccess}
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
        onClose={() => {
          setIsQuickInvoiceOpen(false);
          setEditingInvoice(null);
        }}
        customers={customers}
        products={products}
        invoices={invoices}
        user={userData}
        editingInvoice={editingInvoice}
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
