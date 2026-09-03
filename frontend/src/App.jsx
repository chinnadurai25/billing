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

  // App Master Data States (start with mock data; replaced by MySQL data on fetch)
  const [userData, setUserData] = useState(initialUserData);
  const [customers, setCustomers] = useState(initialCustomers);
  const [products, setProducts] = useState(initialProductsServices);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [adminUsers, setAdminUsers] = useState(initialAdminUsers);

  // Bank accounts lifted to App level so MySQL data is fetched centrally
  const [bankAccounts, setBankAccounts] = useState([
    { id: 'BANK-001', bankType: 'Bank Account', accountName: 'Durai Tax Advisory Operating A/C', accountNumber: '50100234901234', bankName: 'HDFC Bank Ltd', ifscCode: 'HDFC0001234', address: 'Anna Salai, Chennai Branch', balance: 450000, status: 'Active' },
    { id: 'BANK-002', bankType: 'Bank Account', accountName: 'Durai Tax Collection Reserve', accountNumber: '000405012345', bankName: 'ICICI Bank Ltd', ifscCode: 'ICIC0000004', address: 'Nungambakkam, Chennai Branch', balance: 280000, status: 'Active' },
    { id: 'BANK-003', bankType: 'Cash in Hand', accountName: 'Main Petty Cash Ledger', accountNumber: 'CASH-LEDGER-01', bankName: 'Cash Chest', ifscCode: 'N/A', address: 'Office Safe', balance: 35000, status: 'Active' }
  ]);

  // ─── Normalise helpers (MySQL snake_case → camelCase) ─────────────────────
  const normaliseCustomer = (c) => ({
    id: c.id,
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

  // ─── Fetch live data from MySQL on mount ───────────────────────────────────
  useEffect(() => {
    const API = 'http://localhost:5000/api';

    const fetchAll = async () => {
      try {
        const [custRes, bankRes, prodRes, invRes] = await Promise.all([
          fetch(`${API}/customers`).then(r => r.json()).catch(() => null),
          fetch(`${API}/bank-accounts`).then(r => r.json()).catch(() => null),
          fetch(`${API}/products`).then(r => r.json()).catch(() => null),
          fetch(`${API}/invoices`).then(r => r.json()).catch(() => null),
        ]);

        if (custRes?.success && custRes.data?.length > 0) {
          setCustomers(custRes.data.map(normaliseCustomer));
        }
        if (bankRes?.success && bankRes.data?.length > 0) {
          setBankAccounts(bankRes.data.map(normaliseBank));
        }
        if (prodRes?.success && prodRes.data?.length > 0) {
          setProducts(prodRes.data.map(normaliseProduct));
        }
        if (invRes?.success && invRes.data?.length > 0) {
          setInvoices(invRes.data.map(normaliseInvoice));
        }
      } catch (err) {
        // Backend not reachable – keep mock data shown
        console.warn('Backend not reachable, using mock data:', err.message);
      }
    };

    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Auth success handlers
  const handleAuthSuccess = (loggedInUser) => {
    if (loggedInUser) {
      setUserData((prev) => ({
        ...prev,
        ...loggedInUser,
        fullName: loggedInUser.fullName || loggedInUser.full_name || prev.fullName,
        companyName: loggedInUser.companyName || loggedInUser.company_name || prev.companyName,
        gstNumber: loggedInUser.gstNumber || loggedInUser.gst_number || prev.gstNumber,
        panNumber: loggedInUser.panNumber || loggedInUser.pan_number || prev.panNumber,
        email: loggedInUser.email || prev.email,
        contactNumber: loggedInUser.contactNumber || loggedInUser.contact_number || prev.contactNumber,
        companyLogo: loggedInUser.companyLogo || loggedInUser.company_logo || prev.companyLogo || null
      }));
    }
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
                bankAccounts={bankAccounts}
                setBankAccounts={setBankAccounts}
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
                invoices={invoices}
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
