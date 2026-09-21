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

const resolveViewFromPath = (pathOrHash) => {
  const raw = (pathOrHash || '').replace(/^\/+/, '').replace('#', '');
  if (raw === 'admin' || raw === 'admin-login') return 'admin-login';
  if (raw === 'admin-dashboard' || raw === 'admindashboard') return 'admin-dashboard';
  if (raw === 'login' || raw === 'user-login') return 'user-login';
  if (raw === 'register' || raw === 'user-register') return 'user-register';
  if (raw === 'dashboard' || raw === 'user-dashboard') return 'user-dashboard';
  if (raw === 'landing' || raw === '') return '';
  return raw;
};

const getViewPath = (view) => {
  if (view === 'landing' || !view) return '/';
  if (view === 'admin-login') return '/admin';
  return `/${view}`;
};

// Global helper functions to safely read and persist entity data across browser reloads
const loadCachedItems = (entityKey, activeUserId, defaultFallback = []) => {
  try {
    const keysToTry = [];
    if (activeUserId) {
      keysToTry.push(`billson_${entityKey}_${activeUserId}`);
      keysToTry.push(`taxpulse_${entityKey}_${activeUserId}`);
    }
    keysToTry.push(`billson_${entityKey}_global`);
    keysToTry.push(`billson_${entityKey}`);
    keysToTry.push(`taxpulse_${entityKey}_global`);
    keysToTry.push(`taxpulse_${entityKey}`);

    for (const key of keysToTry) {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (activeUserId) {
            const userFiltered = parsed.filter(item => {
              const uId = item.userId || item.user_id;
              return !uId || uId === activeUserId;
            });
            if (userFiltered.length > 0) return userFiltered;
          } else {
            return parsed;
          }
        }
      }
    }
  } catch (e) {
    console.warn(`Error loading cached ${entityKey}:`, e);
  }
  return activeUserId ? [] : defaultFallback;
};

const saveCachedItems = (entityKey, activeUserId, items) => {
  try {
    const list = Array.isArray(items) ? items : [];
    if (activeUserId) {
      localStorage.setItem(`billson_${entityKey}_${activeUserId}`, JSON.stringify(list));
    }
    localStorage.setItem(`billson_${entityKey}_global`, JSON.stringify(list));
    localStorage.setItem(`billson_${entityKey}`, JSON.stringify(list));
  } catch (e) {
    console.warn(`Error saving cached ${entityKey}:`, e);
  }
};

function AppContent() {
  // Restore logged-in user from localStorage on refresh
  const [savedUser] = useState(() => {
    try {
      const stored = localStorage.getItem('billson_active_user') || localStorage.getItem('taxpulse_active_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && !parsed.companyLogo && !parsed.company_logo) {
          const logo = (parsed.id ? localStorage.getItem(`billson_user_logo_${parsed.id}`) : null) ||
                       (parsed.email ? localStorage.getItem(`billson_user_logo_${parsed.email.toLowerCase()}`) : null);
          if (logo) parsed.companyLogo = logo;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentViewInternal] = useState(() => {
    const fromPath = resolveViewFromPath(window.location.pathname);
    if (fromPath) return fromPath;
    const fromHash = resolveViewFromPath(window.location.hash);
    if (fromHash) return fromHash;
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
  const [quickInvoiceType, setQuickInvoiceType] = useState('Sales Invoice');

  const handleOpenQuickInvoice = (invToEdit = null, docType = null) => {
    setEditingInvoice(invToEdit || null);
    
    let effectiveType = docType;
    if (invToEdit) {
      effectiveType = invToEdit.documentType || invToEdit.document_type || (
        invToEdit.id?.startsWith('PUR') ? 'Purchase Invoice' :
        invToEdit.id?.startsWith('EST') ? 'Estimate' :
        invToEdit.id?.startsWith('DC') ? 'Delivery Challan' :
        invToEdit.id?.startsWith('PAY') ? 'Payment' : (docType || 'Sales Invoice')
      );
    }
    if (!effectiveType) effectiveType = 'Sales Invoice';

    setQuickInvoiceType(effectiveType);
    setIsQuickInvoiceOpen(true);
  };

  // App Master Data States - start with cached data strictly isolated to active user
  const [userData, setUserData] = useState(() => savedUser || initialUserData);
  const [customers, setCustomersState] = useState(() => loadCachedItems('customers', savedUser?.id, initialCustomers));
  const [products, setProductsState] = useState(() => loadCachedItems('products', savedUser?.id, initialProductsServices));
  const [invoices, setInvoicesState] = useState(() => loadCachedItems('invoices', savedUser?.id, initialInvoices));
  const [adminUsers, setAdminUsers] = useState(initialAdminUsers);
  const [bankAccounts, setBankAccountsState] = useState(() => loadCachedItems('bank_accounts', savedUser?.id, [
    { id: 'BANK-001', userId: 'USR-901', bankType: 'Bank Account', accountName: 'Durai Tax Advisory Operating A/C', accountNumber: '50100234901234', bankName: 'HDFC Bank Ltd', ifscCode: 'HDFC0001234', address: 'Anna Salai, Chennai Branch', balance: 450000, status: 'Active' },
    { id: 'BANK-002', userId: 'USR-901', bankType: 'Bank Account', accountName: 'Durai Tax Collection Reserve', accountNumber: '000405012345', bankName: 'ICICI Bank Ltd', ifscCode: 'ICIC0000004', address: 'Nungambakkam, Chennai Branch', balance: 280000, status: 'Active' },
    { id: 'BANK-003', userId: 'USR-901', bankType: 'Cash in Hand', accountName: 'Main Petty Cash Ledger', accountNumber: 'CASH-LEDGER-01', bankName: 'Cash Chest', ifscCode: 'N/A', address: 'Office Safe', balance: 35000, status: 'Active' }
  ]));

  // Auto-persisting state setters
  const setCustomers = useCallback((valOrFn) => {
    setCustomersState((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      saveCachedItems('customers', userData?.id, next);
      return next;
    });
  }, [userData?.id]);

  const setProducts = useCallback((valOrFn) => {
    setProductsState((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      saveCachedItems('products', userData?.id, next);
      return next;
    });
  }, [userData?.id]);

  const setInvoices = useCallback((valOrFn) => {
    setInvoicesState((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      saveCachedItems('invoices', userData?.id, next);
      return next;
    });
  }, [userData?.id]);

  const setBankAccounts = useCallback((valOrFn) => {
    setBankAccountsState((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      saveCachedItems('bank_accounts', userData?.id, next);
      return next;
    });
  }, [userData?.id]);

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
    city: c.city || '',
    state: c.state || '',
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
    openingStock: parseInt(p.opening_stock ?? p.openingStock ?? 0),
    rate: parseFloat(p.rate ?? 0),
    date: p.date || (p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
    taxPercent: parseFloat(p.tax_percent ?? p.taxPercent ?? 18),
    category: p.category || 'Sales / Service Item',
  });

  const normaliseInvoice = (inv) => ({
    id: inv.id,
    userId: inv.user_id || inv.userId,
    documentType: inv.documentType || inv.document_type || (inv.id?.startsWith('PUR') ? 'Purchase Invoice' : inv.id?.startsWith('EST') ? 'Estimate' : inv.id?.startsWith('DC') ? 'Delivery Challan' : inv.id?.startsWith('PAY') ? 'Payment' : 'Sales Invoice'),
    invoiceNumber: inv.invoice_number || inv.invoiceNumber || '',
    customerName: inv.customer_name || inv.customerName || '',
    customerGst: inv.customer_gst || inv.customerGst || '',
    paidBy: inv.paidBy || inv.paid_by || '',
    paidTo: inv.paidTo || inv.paid_to || '',
    paymentMethod: inv.paymentMethod || inv.payment_method || '',
    paymentPurpose: inv.paymentPurpose || inv.payment_purpose || '',
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
      setCustomersState([]);
      setBankAccountsState([]);
      setProductsState([]);
      setInvoicesState([]);
      return;
    }

    try {
      const [custRes, bankRes, prodRes, invRes] = await Promise.all([
        api.getCustomers(activeUserId),
        api.getBankAccounts(activeUserId),
        api.getProducts(activeUserId),
        api.getInvoices(activeUserId)
      ]);

      // 1. CUSTOMERS
      const cachedCust = loadCachedItems('customers', activeUserId, initialCustomers);
      if (custRes?.success && Array.isArray(custRes.data) && custRes.data.length > 0) {
        const norm = custRes.data.map(normaliseCustomer);
        const cleanNorm = norm.filter(c => !c.userId || c.userId === activeUserId);
        const mergedMap = new Map();
        cleanNorm.forEach(c => mergedMap.set(c.id, c));
        cachedCust.forEach(c => {
          if (!mergedMap.has(c.id)) mergedMap.set(c.id, c);
        });
        const finalCust = Array.from(mergedMap.values());
        setCustomersState(finalCust);
        saveCachedItems('customers', activeUserId, finalCust);
      } else {
        if (cachedCust.length > 0) {
          setCustomersState(cachedCust);
          saveCachedItems('customers', activeUserId, cachedCust);
        }
      }

      // 2. BANK ACCOUNTS
      const cachedBanks = loadCachedItems('bank_accounts', activeUserId, []);
      if (bankRes?.success && Array.isArray(bankRes.data) && bankRes.data.length > 0) {
        const norm = bankRes.data.map(normaliseBank);
        const cleanBanks = norm.filter(b => !b.userId || b.userId === activeUserId);
        const mergedMap = new Map();
        cleanBanks.forEach(b => mergedMap.set(b.id, b));
        cachedBanks.forEach(b => {
          if (!mergedMap.has(b.id)) mergedMap.set(b.id, b);
        });
        const finalBanks = Array.from(mergedMap.values());
        setBankAccountsState(finalBanks);
        saveCachedItems('bank_accounts', activeUserId, finalBanks);
      } else {
        if (cachedBanks.length > 0) {
          setBankAccountsState(cachedBanks);
          saveCachedItems('bank_accounts', activeUserId, cachedBanks);
        }
      }

      // 3. PRODUCTS
      const cachedProds = loadCachedItems('products', activeUserId, initialProductsServices);
      if (prodRes?.success && Array.isArray(prodRes.data) && prodRes.data.length > 0) {
        const norm = prodRes.data.map(normaliseProduct);
        const cleanProds = norm.filter(p => !p.userId || p.userId === activeUserId);
        const mergedMap = new Map();
        cleanProds.forEach(p => mergedMap.set(p.id, p));
        cachedProds.forEach(p => {
          if (!mergedMap.has(p.id)) mergedMap.set(p.id, p);
        });
        const finalProds = Array.from(mergedMap.values());
        setProductsState(finalProds);
        saveCachedItems('products', activeUserId, finalProds);
      } else {
        if (cachedProds.length > 0) {
          setProductsState(cachedProds);
          saveCachedItems('products', activeUserId, cachedProds);
        }
      }

      // 4. INVOICES / PAYMENTS / ESTIMATES / DELIVERY CHALLANS
      const cachedInvs = loadCachedItems('invoices', activeUserId, initialInvoices);
      if (invRes?.success && Array.isArray(invRes.data) && invRes.data.length > 0) {
        const norm = invRes.data.map(normaliseInvoice);
        const cleanInvs = norm.filter(i => !i.userId || i.userId === activeUserId);
        const mergedMap = new Map();
        cleanInvs.forEach(i => mergedMap.set(i.id, i));
        cachedInvs.forEach(i => {
          if (!mergedMap.has(i.id)) mergedMap.set(i.id, i);
        });
        const finalInvs = Array.from(mergedMap.values());
        setInvoicesState(finalInvs);
        saveCachedItems('invoices', activeUserId, finalInvs);
      } else {
        if (cachedInvs.length > 0) {
          setInvoicesState(cachedInvs);
          saveCachedItems('invoices', activeUserId, cachedInvs);
        }
      }

      // Background sync: send local cached records to MySQL server if needed
      const syncCust = loadCachedItems('customers', activeUserId);
      const syncInvs = loadCachedItems('invoices', activeUserId);
      if (syncCust.length > 0 || syncInvs.length > 0) {
        api.syncAll({
          userId: activeUserId,
          customers: syncCust,
          invoices: syncInvs
        }).catch(() => {});
      }

    } catch (err) {
      console.warn('Backend connection note:', err.message);
      const cCust = loadCachedItems('customers', activeUserId);
      if (cCust.length > 0) setCustomersState(cCust);
      const cBanks = loadCachedItems('bank_accounts', activeUserId);
      if (cBanks.length > 0) setBankAccountsState(cBanks);
      const cProds = loadCachedItems('products', activeUserId);
      if (cProds.length > 0) setProductsState(cProds);
      const cInvs = loadCachedItems('invoices', activeUserId);
      if (cInvs.length > 0) setInvoicesState(cInvs);
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
      window.history.pushState({ view: newView }, '', getViewPath(newView));
    }
    setCurrentViewInternal(newView);
  }, []);

  // Initialize history state and popstate listener
  useEffect(() => {
    const getInitialView = () => {
      const fromPath = resolveViewFromPath(window.location.pathname);
      if (fromPath) return fromPath;
      const fromHash = resolveViewFromPath(window.location.hash);
      if (fromHash) return fromHash;
      return savedUser ? 'user-dashboard' : 'landing';
    };
    const initialV = getInitialView();
    window.history.replaceState({ view: initialV }, '', getViewPath(initialV));

    const handlePopState = (e) => {
      if (e.state && e.state.view) {
        setCurrentViewInternal(e.state.view);
      } else {
        const fromPath = resolveViewFromPath(window.location.pathname);
        setCurrentViewInternal(fromPath || (savedUser ? 'user-dashboard' : 'landing'));
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

      const userLogo = loggedInUser.companyLogo || loggedInUser.company_logo ||
                       (loggedInUser.id ? localStorage.getItem(`billson_user_logo_${loggedInUser.id}`) : null) ||
                       (loggedInUser.email ? localStorage.getItem(`billson_user_logo_${loggedInUser.email.toLowerCase()}`) : null);

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
        companyLogo: userLogo || null
      };

      try {
        localStorage.setItem('billson_active_user', JSON.stringify(completeUser));
        if (completeUser.id && completeUser.companyLogo) {
          localStorage.setItem(`billson_user_logo_${completeUser.id}`, completeUser.companyLogo);
        }
        if (completeUser.email && completeUser.companyLogo) {
          localStorage.setItem(`billson_user_logo_${completeUser.email.toLowerCase()}`, completeUser.companyLogo);
        }
      } catch (e) {}

      setUserData(completeUser);
      fetchUserData(completeUser.id);
    }
    setCurrentView('user-dashboard');
  };

  // Save / Update Quick Invoice handler
  const handleSaveInvoice = async (savedInvoice) => {
    const activeUserId = userData?.id || 'USR-901';
    const invoiceWithUser = {
      ...savedInvoice,
      userId: activeUserId
    };

    setInvoices((prev) => {
      const exists = prev.some(i => i.id === savedInvoice.id);
      const updated = exists
        ? prev.map(inv => inv.id === savedInvoice.id ? invoiceWithUser : inv)
        : [invoiceWithUser, ...prev.filter(inv => inv.id !== invoiceWithUser.id)];
      
      try {
        localStorage.setItem(`billson_invoices_${activeUserId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const exists = invoices.some(i => i.id === savedInvoice.id);
      if (exists) {
        await api.updateInvoice(savedInvoice.id, invoiceWithUser);
      } else {
        await api.createInvoice(invoiceWithUser);
      }
    } catch (err) {
      console.warn('Could not persist invoice to backend:', err);
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
        bankAccounts={bankAccounts}
        invoices={invoices}
        user={userData}
        editingInvoice={editingInvoice}
        documentType={quickInvoiceType}
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
