import React, { useState, useEffect } from 'react';
import {
  Receipt, DollarSign, FileText, PieChart, Users, ShoppingBag,
  CreditCard, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Plus, Search, Filter, Download, ArrowUpRight, ChevronRight, Eye, ShieldCheck,
  Building, Landmark, Package, Wrench, Ban, X, Check, Pencil, Trash2, Edit3, AlertTriangle,
  Calculator, Truck, RefreshCw, XCircle, FileCheck, Sliders, Layers
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { processGSTRData, downloadGSTRExcelReport } from '../../utils/gstrExcelGenerator';
import { UserSettings } from './UserSettings';
import SearchableDropdown from '../common/SearchableDropdown';
import { INDIAN_STATES, INDIA_STATES_CITIES, GST_STATE_CODES } from '../../data/indiaData';
import { decodeGstinDetails } from '../../utils/gstDecoder';

export const UserDashboard = ({
  activeTab,
  setActiveTab,
  invoices,
  setInvoices,
  customers,
  setCustomers,
  products,
  setProducts,
  bankAccounts,
  setBankAccounts,
  monthlyRevenueData,
  taxBreakdownData,
  onQuickCreateInvoice,
  user,
  setUserData
}) => {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [gstrSelectedMonthYear, setGstrSelectedMonthYear] = useState(() => new Date().toISOString().slice(0, 7));
  const [gstrReportSubTab, setGstrReportSubTab] = useState('b2b'); // 'b2b' or 'b2c'

  // Modal State Triggers
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  // Edit states
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingBank, setEditingBank] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [docSubTab, setDocSubTab] = useState('All'); // 'All', 'Sales Invoice', 'Purchase Invoice', 'Estimate', 'Delivery Challan', 'Payment'

  // Delete & Action Confirmation Modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    message: '',
    confirmText: '',
    cancelText: '',
    confirmColor: '',
    iconType: '',
    onConfirm: null
  });

  // View Detail Modals state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [selectedBankDetail, setSelectedBankDetail] = useState(null);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState(null);

  // Dynamic Ledgers Directory State
  const [ledgersList, setLedgersList] = useState(() => {
    try {
      const saved = localStorage.getItem(`billson_custom_ledgers_${user?.id}`) || localStorage.getItem('billson_custom_ledgers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { id: 'LEDGER-DEBTORS', name: 'SUNDRY DEBTORS', label: 'SUNDRY DEBTORS (Customers)', type: 'Customers / Debtors', description: 'Receivables from trade clients and direct buyers', isDefault: true },
      { id: 'LEDGER-CREDITORS', name: 'SUNDRY CREDITORS', label: 'SUNDRY CREDITORS (Suppliers)', type: 'Suppliers / Creditors', description: 'Payables to trade vendors, raw material suppliers and contractors', isDefault: false }
    ];
  });
  const [settingsSubTab, setSettingsSubTab] = useState('profile');

  const getDefaultLedgerName = () => {
    const defaultObj = ledgersList.find(l => l.isDefault) || ledgersList[0];
    return defaultObj?.name || 'SUNDRY DEBTORS';
  };

  // 1. REGISTRATION ( CUSTOMER ) Form State
  const [custForm, setCustForm] = useState({
    name: '',
    ledger: (ledgersList.find(l => l.isDefault)?.name) || 'SUNDRY DEBTORS',
    address: '',
    gstNo: '',
    pan: '',
    mobile: '',
    email: '',
    city: '',
    state: ''
  });

  // Bank / Cash Registration state inside Customer Registration Modal
  const [includeBankReg, setIncludeBankReg] = useState(false);
  const [custBankForm, setCustBankForm] = useState({
    bankType: 'Bank Account',
    accountName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    balance: '0'
  });

  // 2. REGISTRATION ( BANK / CASH ) Form State
  // bankAccounts & setBankAccounts come from App.jsx props (MySQL-sourced)
  const [bankForm, setBankForm] = useState({
    bankType: 'Bank Account',
    accountName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    address: '',
    balance: 150000,
    date: new Date().toISOString().split('T')[0]
  });

  // Helper to distinguish Service vs Product Item
  const isServiceItem = (item) => {
    if (!item) return false;
    const cat = (item.category || '').toLowerCase();
    const unit = (item.unit || '').toLowerCase();
    const hsn = String(item.hsnSac || item.hsn_sac || '');
    return cat.includes('service') || unit.includes('service') || hsn.startsWith('99') || (item.entryType || '').toLowerCase() === 'service';
  };

  // 3a. PRODUCT REGISTRATION ( GOODS ) Form State
  const [productForm, setProductForm] = useState({
    itemName: '',
    unit: 'Pices', // Pices / Number / Box / Kg / Liter / Meter
    hsnCode: '',
    openingStock: '100',
    date: new Date().toISOString().split('T')[0],
    taxPercent: '18',
    category: 'Sales Item'
  });

  // 3b. SERVICE REGISTRATION Form State
  const [serviceForm, setServiceForm] = useState({
    serviceName: '',
    hsnCode: '',
    date: new Date().toISOString().split('T')[0],
    taxPercent: '18',
    category: 'Service Item'
  });

  // Legacy itemForm compatibility
  const [itemForm, setItemForm] = useState({
    entryType: 'Item',
    itemName: '',
    unit: 'Pices',
    hsnCode: '',
    openingStock: '100',
    date: new Date().toISOString().split('T')[0],
    taxPercent: '18',
    category: 'Sales Item'
  });

  // Auto-fill PAN & State when GSTIN is typed in Customer Form & Fetch Live Details
  const [isFetchingGst, setIsFetchingGst] = useState(false);

  const handleFetchGstDetails = async (gstinOverride = null) => {
    const targetGst = (gstinOverride || custForm?.gstNo || '').trim().toUpperCase();
    if (!targetGst || targetGst.length !== 15) {
      addToast('Please enter a valid 15-digit GSTIN number first', 'warning');
      return;
    }

    setIsFetchingGst(true);
    let d = null;
    try {
      const res = await api.lookupGst(targetGst);
      if (res && res.success && res.data) {
        d = res.data;
      }
    } catch (e) {
      console.warn('Backend GST Lookup Notice:', e?.message || e);
    }

    const fallbackDecoded = decodeGstinDetails(targetGst) || {};
    const finalData = { ...fallbackDecoded, ...(d || {}) };

    const fetchedName = (typeof finalData.name === 'string' && finalData.name.trim()) ? finalData.name.trim() : (finalData.companyName || finalData.legalName || finalData.tradeName || 'GST Registered Enterprise');
    const fetchedLedger = (typeof finalData.ledger === 'string' && finalData.ledger.trim()) ? finalData.ledger.trim() : getDefaultLedgerName();
    const fetchedPan = (typeof finalData.pan === 'string' && finalData.pan.trim()) ? finalData.pan.trim() : (finalData.panNumber || targetGst.substring(2, 12));
    const fetchedMobile = (typeof finalData.mobile === 'string' && finalData.mobile.trim()) ? finalData.mobile.trim() : '';
    const fetchedEmail = (typeof finalData.email === 'string' && finalData.email.trim()) ? finalData.email.trim() : '';
    const fetchedState = (typeof finalData.state === 'string' && finalData.state.trim()) ? finalData.state.trim() : 'Tamil Nadu';
    const fetchedCity = (typeof finalData.city === 'string' && finalData.city.trim()) ? finalData.city.trim() : 'Chennai';
    const fetchedAddress = (typeof finalData.address === 'string' && finalData.address.trim()) ? finalData.address.trim() : '';

    let matchedState = fetchedState;
    if (fetchedState && Array.isArray(INDIAN_STATES)) {
      const found = INDIAN_STATES.find((s) => typeof s === 'string' && s.toLowerCase() === fetchedState.toLowerCase());
      if (found) matchedState = found;
    }

    let matchedCity = fetchedCity;
    if (matchedState && INDIA_STATES_CITIES[matchedState] && Array.isArray(INDIA_STATES_CITIES[matchedState])) {
      const cityList = INDIA_STATES_CITIES[matchedState];
      const foundCity = cityList.find((c) => c.toLowerCase() === fetchedCity.toLowerCase());
      matchedCity = foundCity || cityList[0] || fetchedCity;
    }

    setCustForm((prev) => ({
      ...prev,
      gstNo: targetGst,
      name: fetchedName,
      ledger: fetchedLedger,
      pan: fetchedPan,
      mobile: fetchedMobile || prev?.mobile || '',
      email: fetchedEmail || prev?.email || '',
      state: matchedState,
      city: matchedCity,
      address: fetchedAddress
    }));

    const currentAccName = typeof custBankForm?.accountName === 'string' ? custBankForm.accountName : '';
    if (includeBankReg && (!currentAccName || currentAccName.endsWith(' - Account'))) {
      const effectiveName = fetchedName || custForm?.name || 'Customer';
      setCustBankForm((b) => ({ ...b, accountName: `${effectiveName} - Account` }));
    }

    setIsFetchingGst(false);
    addToast(`GST Auto-Fill Complete for ${fetchedName}!`, 'success', 'All Customer Details Filled');
  };

  const handleCustGstChange = (val) => {
    const rawVal = (val || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCustForm((prev) => {
      let updatedPan = prev?.pan || '';
      let updatedState = prev?.state || '';
      if (rawVal.length >= 2) {
        const code = rawVal.substring(0, 2);
        if (GST_STATE_CODES[code]) {
          updatedState = GST_STATE_CODES[code];
        }
      }
      if (rawVal.length >= 12) {
        const extracted = rawVal.substring(2, 12);
        if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(extracted)) {
          updatedPan = extracted;
        }
      }
      return {
        ...prev,
        gstNo: rawVal,
        pan: updatedPan,
        state: updatedState,
        city: prev?.state !== updatedState ? '' : (prev?.city || '')
      };
    });
  };

  const [hasCustGst, setHasCustGst] = useState('Yes'); // 'Yes' or 'No'

  // ----------------------------------------------------
  // 1. CUSTOMER HANDLERS (Create, Edit, Update, Delete)
  // ----------------------------------------------------
  const handleOpenNewCustomer = () => {
    setEditingCustomer(null);
    setHasCustGst('Yes');
    setCustForm({
      name: '',
      ledger: getDefaultLedgerName(),
      address: '',
      gstNo: '',
      pan: '',
      mobile: '',
      email: '',
      city: '',
      state: ''
    });
    setIncludeBankReg(false);
    setCustBankForm({
      bankType: 'Bank Account',
      accountName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      balance: '0'
    });
    setShowCustomerModal(true);
  };

  const handleOpenEditCustomer = (customer) => {
    setEditingCustomer(customer);
    const existingGst = customer.gstNumber || customer.gst_number || '';
    setHasCustGst(existingGst && existingGst !== 'URP' && existingGst !== 'N/A' ? 'Yes' : 'No');
    setCustForm({
      name: customer.name || '',
      ledger: customer.ledger || getDefaultLedgerName(),
      address: customer.address || '',
      gstNo: customer.gstNumber || customer.gst_number || '',
      pan: customer.panNumber || customer.pan_number || '',
      mobile: customer.phone || customer.mobile || '',
      email: customer.email || '',
      city: customer.city || '',
      state: customer.state || ''
    });
    setIncludeBankReg(false);
    setCustBankForm({
      bankType: 'Bank Account',
      accountName: customer.name ? `${customer.name} - Account` : '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      balance: '0'
    });
    setShowCustomerModal(true);
  };

  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    if (!custForm.name.trim()) {
      addToast('Customer NAME is required', 'error');
      return;
    }

    if (editingCustomer) {
      // UPDATE existing customer
      const updatedCustomer = {
        ...editingCustomer,
        name: custForm.name,
        ledger: custForm.ledger,
        address: custForm.address,
        gstNumber: custForm.gstNo,
        panNumber: custForm.pan,
        phone: custForm.mobile,
        email: custForm.email,
        city: custForm.city || editingCustomer.city || '',
        state: custForm.state || editingCustomer.state || ''
      };

      setCustomers((prev) => prev.map((c) => c.id === editingCustomer.id ? updatedCustomer : c));
      api.updateCustomer(editingCustomer.id, {
        name: custForm.name,
        ledger: custForm.ledger,
        address: custForm.address,
        gstNumber: custForm.gstNo,
        panNumber: custForm.pan,
        mobile: custForm.mobile,
        email: custForm.email,
        city: custForm.city,
        state: custForm.state
      });

      addToast(`Customer ${custForm.name} updated successfully!`, 'success', 'Customer Updated');
    } else {
      // CREATE new customer
      const custId = `CUST-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const newCustomer = {
        id: custId,
        userId: user?.id || 'USR-901',
        name: custForm.name,
        ledger: custForm.ledger,
        address: custForm.address,
        gstNumber: custForm.gstNo,
        panNumber: custForm.pan,
        phone: custForm.mobile || '',
        email: custForm.email || '',
        city: custForm.city || '',
        state: custForm.state || '',
        totalBilled: 0,
        status: 'Active'
      };

      setCustomers((prev) => {
        const updated = [newCustomer, ...prev];
        try {
          if (user?.id) {
            localStorage.setItem(`billson_customers_${user.id}`, JSON.stringify(updated));
          } else {
            localStorage.setItem('billson_customers_global', JSON.stringify(updated));
          }
        } catch (e) { }
        return updated;
      });

      try {
        const res = await api.registerCustomer({
          id: custId,
          name: custForm.name,
          ledger: custForm.ledger,
          address: custForm.address,
          gstNumber: custForm.gstNo,
          panNumber: custForm.pan,
          mobile: custForm.mobile,
          email: custForm.email,
          city: custForm.city,
          state: custForm.state,
          userId: user?.id || 'USR-901'
        });

        if (res && res.customer) {
          const norm = {
            id: res.customer.id || custId,
            userId: res.customer.user_id || res.customer.userId || user?.id || 'USR-901',
            name: res.customer.name || custForm.name,
            ledger: res.customer.ledger || custForm.ledger,
            address: res.customer.address || custForm.address,
            gstNumber: res.customer.gst_number || res.customer.gstNumber || custForm.gstNo,
            panNumber: res.customer.pan_number || res.customer.panNumber || custForm.pan,
            phone: res.customer.mobile || res.customer.phone || custForm.mobile,
            email: res.customer.email || custForm.email,
            city: res.customer.city || custForm.city,
            state: res.customer.state || custForm.state,
            totalBilled: parseFloat(res.customer.total_billed || 0),
            status: res.customer.status || 'Active'
          };

          setCustomers((prev) => {
            const updated = prev.map((c) => (c.id === custId ? norm : c));
            try {
              if (user?.id) {
                localStorage.setItem(`billson_customers_${user.id}`, JSON.stringify(updated));
              } else {
                localStorage.setItem('billson_customers_global', JSON.stringify(updated));
              }
            } catch (e) { }
            return updated;
          });
        }
      } catch (err) {
        console.error('Error saving customer to backend:', err);
      }

      addToast(`REGISTRATION (CUSTOMER) complete for ${custForm.name}!`, 'success', 'Customer Registered');
    }

    // Optionally Register Bank / Cash Account if toggle enabled
    if (includeBankReg && custBankForm.accountName.trim()) {
      const isCash = custBankForm.bankType === 'Cash in Hand' || custBankForm.bankType === 'Petty Cash';
      const bankId = `BANK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const effectiveAccNo = custBankForm.accountNumber.trim() || (isCash ? `CASH-${Date.now().toString().slice(-6)}` : 'N/A');
      const effectiveBankName = isCash ? custBankForm.bankType : (custBankForm.bankName.trim() || custBankForm.accountName.trim() || 'Standard Bank');
      const effectiveIfsc = isCash ? 'N/A' : (custBankForm.ifscCode.trim() || 'N/A');
      const effectiveUserId = user?.id || 'USR-901';

      const newBank = {
        id: bankId,
        user_id: effectiveUserId,
        userId: effectiveUserId,
        bankType: custBankForm.bankType,
        accountName: custBankForm.accountName.trim(),
        accountNumber: effectiveAccNo,
        bankName: effectiveBankName,
        ifscCode: effectiveIfsc,
        address: custForm.address ? `Linked to ${custForm.name}` : (isCash ? 'Office Safe' : 'Main Branch'),
        balance: parseFloat(custBankForm.balance) || 0,
        date: new Date().toISOString().split('T')[0],
        status: 'Active'
      };

      setBankAccounts((prev) => {
        const updated = [newBank, ...prev];
        try {
          if (user?.id) {
            localStorage.setItem(`billson_bank_accounts_${user.id}`, JSON.stringify(updated));
          } else {
            localStorage.setItem('billson_bank_accounts', JSON.stringify(updated));
          }
        } catch (e) { }
        return updated;
      });

      try {
        const res = await api.registerBankCash({
          id: bankId,
          bankType: custBankForm.bankType,
          accountName: custBankForm.accountName.trim(),
          accountNumber: effectiveAccNo,
          bankName: effectiveBankName,
          ifscCode: effectiveIfsc,
          address: custForm.address ? `Linked to ${custForm.name}` : (isCash ? 'Office Safe' : 'Main Branch'),
          balance: parseFloat(custBankForm.balance) || 0,
          date: new Date().toISOString().split('T')[0],
          userId: effectiveUserId
        });

        if (res && res.bankAccount) {
          const normBank = {
            id: res.bankAccount.id || bankId,
            userId: res.bankAccount.user_id || res.bankAccount.userId || effectiveUserId,
            user_id: res.bankAccount.user_id || res.bankAccount.userId || effectiveUserId,
            bankType: res.bankAccount.bank_type || res.bankAccount.bankType || custBankForm.bankType,
            accountName: res.bankAccount.account_name || res.bankAccount.accountName || custBankForm.accountName.trim(),
            accountNumber: res.bankAccount.account_number || res.bankAccount.accountNumber || effectiveAccNo,
            bankName: res.bankAccount.bank_name || res.bankAccount.bankName || effectiveBankName,
            ifscCode: res.bankAccount.ifsc_code || res.bankAccount.ifscCode || effectiveIfsc,
            address: res.bankAccount.address || (custForm.address ? `Linked to ${custForm.name}` : 'Main Branch'),
            balance: parseFloat(res.bankAccount.balance || custBankForm.balance || 0),
            date: res.bankAccount.date || new Date().toISOString().split('T')[0],
            status: res.bankAccount.status || 'Active'
          };
          setBankAccounts((prev) => prev.map((b) => (b.id === bankId ? normBank : b)));
        }
      } catch (err) {
        console.error('Error saving bank account during customer registration:', err);
      }

      addToast(`Bank/Cash Account "${custBankForm.accountName}" registered successfully!`, 'success', 'Account Registered');
    }

    setShowCustomerModal(false);
    setEditingCustomer(null);
    setCustForm({ name: '', ledger: getDefaultLedgerName(), address: '', gstNo: '', pan: '', mobile: '', email: '', city: '', state: '' });
    setIncludeBankReg(false);
    setCustBankForm({ bankType: 'Bank Account', accountName: '', accountNumber: '', bankName: '', ifscCode: '', balance: '0' });
  };

  const handleDeleteCustomer = (customer) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Customer Ledger',
      message: `Are you sure you want to delete "${customer.name}" (${customer.id})? All associated records will be removed.`,
      onConfirm: async () => {
        setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
        try {
          await api.deleteCustomer(customer.id);
        } catch (e) { }
        addToast(`Customer "${customer.name}" deleted successfully.`, 'info', 'Customer Deleted');
      }
    });
  };

  // ----------------------------------------------------
  // 2. BANK / CASH HANDLERS (Create, Edit, Update, Delete)
  // ----------------------------------------------------
  const handleOpenNewBank = () => {
    setEditingBank(null);
    setBankForm({
      bankType: 'Bank Account',
      accountName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      address: '',
      balance: 150000,
      date: new Date().toISOString().split('T')[0]
    });
    setShowBankModal(true);
  };

  const handleOpenEditBank = (bank) => {
    setEditingBank(bank);
    setBankForm({
      bankType: bank.bankType || bank.bank_type || 'Bank Account',
      accountName: bank.accountName || bank.account_name || '',
      accountNumber: bank.accountNumber || bank.account_number || '',
      bankName: bank.bankName || bank.bank_name || '',
      ifscCode: bank.ifscCode || bank.ifsc_code || '',
      address: bank.address || '',
      balance: bank.balance !== undefined ? bank.balance : 150000,
      date: bank.date || (bank.created_at ? new Date(bank.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
    });
    setShowBankModal(true);
  };

  const handleRegisterBankCash = async (e) => {
    e.preventDefault();
    const isCashAccount = bankForm.bankType === 'Cash in Hand' || bankForm.bankType === 'Petty Cash';

    if (!bankForm.accountName.trim()) {
      addToast('ACCOUNT NAME is required', 'error');
      return;
    }
    if (!isCashAccount && !bankForm.accountNumber.trim()) {
      addToast('ACCOUNT NUMBER is required for Bank Accounts', 'error');
      return;
    }

    const effectiveAccNumber = bankForm.accountNumber.trim() || (isCashAccount ? (editingBank?.accountNumber || `CASH-${Date.now().toString().slice(-6)}`) : 'N/A');
    const effectiveBankName = isCashAccount ? bankForm.bankType : (bankForm.bankName.trim() || bankForm.accountName.trim() || 'Standard Bank');
    const effectiveIfsc = isCashAccount ? 'N/A' : (bankForm.ifscCode.trim() || 'N/A');

    if (editingBank) {
      // UPDATE existing bank/cash ledger
      const updatedBank = {
        ...editingBank,
        bankType: bankForm.bankType,
        accountName: bankForm.accountName,
        accountNumber: effectiveAccNumber,
        bankName: effectiveBankName,
        ifscCode: effectiveIfsc,
        address: bankForm.address || (isCashAccount ? 'Office Safe' : 'Main Branch'),
        balance: parseFloat(bankForm.balance) || 0,
        date: bankForm.date
      };

      setBankAccounts((prev) => prev.map((b) => b.id === editingBank.id ? updatedBank : b));
      api.updateBankAccount(editingBank.id, {
        bankType: bankForm.bankType,
        accountName: bankForm.accountName,
        accountNumber: effectiveAccNumber,
        bankName: effectiveBankName,
        ifscCode: effectiveIfsc,
        address: bankForm.address,
        balance: parseFloat(bankForm.balance) || 0,
        date: bankForm.date
      });

      addToast(`Account "${bankForm.accountName}" updated successfully!`, 'success', 'Account Updated');
    } else {
      // CREATE new bank/cash ledger
      const bankId = `BANK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const newBank = {
        id: bankId,
        bankType: bankForm.bankType,
        accountName: bankForm.accountName,
        accountNumber: effectiveAccNumber,
        bankName: effectiveBankName,
        ifscCode: effectiveIfsc,
        address: bankForm.address || (isCashAccount ? 'Office Safe' : 'Main Branch'),
        balance: parseFloat(bankForm.balance) || 35000,
        date: bankForm.date,
        status: 'Active'
      };

      setBankAccounts((prev) => {
        const updated = [newBank, ...prev];
        try {
          if (user?.id) {
            localStorage.setItem(`billson_bank_accounts_${user.id}`, JSON.stringify(updated));
          }
        } catch (e) { }
        return updated;
      });
      try {
        const res = await api.registerBankCash({
          id: bankId,
          bankType: bankForm.bankType,
          accountName: bankForm.accountName,
          accountNumber: effectiveAccNumber,
          bankName: effectiveBankName,
          ifscCode: effectiveIfsc,
          address: bankForm.address,
          balance: parseFloat(bankForm.balance) || 35000,
          date: bankForm.date,
          userId: user?.id || 'USR-901'
        });
        if (res && res.bankAccount && res.bankAccount.id && res.bankAccount.id !== bankId) {
          setBankAccounts((prev) => {
            const updated = prev.map((b) => b.id === bankId ? { ...b, id: res.bankAccount.id } : b);
            try {
              localStorage.setItem('billson_bank_accounts', JSON.stringify(updated));
            } catch (e) { }
            return updated;
          });
        }
      } catch (err) {
        console.error('Error saving bank account to backend:', err);
      }

      addToast(`REGISTRATION complete for ${bankForm.accountName}!`, 'success', 'Account Registered');
    }

    setShowBankModal(false);
    setEditingBank(null);
    setBankForm({ bankType: 'Bank Account', accountName: '', accountNumber: '', bankName: '', ifscCode: '', address: '', balance: 150000, date: new Date().toISOString().split('T')[0] });
  };

  const handleDeleteBank = (bank) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Bank / Cash Account',
      message: `Are you sure you want to delete "${bank.accountName}" (${bank.accountNumber})? This ledger will no longer be available for payments.`,
      onConfirm: async () => {
        setBankAccounts((prev) => prev.filter((b) => b.id !== bank.id));
        try {
          await api.deleteBankAccount(bank.id);
        } catch (e) { }
        addToast(`Account "${bank.accountName}" deleted successfully.`, 'info', 'Account Deleted');
      }
    });
  };

  // ----------------------------------------------------
  // 3a. PRODUCT (GOODS) HANDLERS (Create, Edit, Update, Delete)
  // ----------------------------------------------------
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      itemName: '',
      unit: 'Pices',
      hsnCode: '',
      openingStock: '100',
      date: new Date().toISOString().split('T')[0],
      taxPercent: '18',
      category: 'Sales Item'
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (item) => {
    setEditingProduct(item);
    setProductForm({
      itemName: item.title || '',
      unit: item.unit || 'Pices',
      hsnCode: item.hsnSac || item.hsn_sac || '',
      openingStock: item.openingStock !== undefined ? String(item.openingStock) : (item.opening_stock !== undefined ? String(item.opening_stock) : '100'),
      date: item.date || (item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      taxPercent: item.taxPercent !== undefined ? String(item.taxPercent) : (item.tax_percent !== undefined ? String(item.tax_percent) : '18'),
      category: item.category || 'Sales Item'
    });
    setShowProductModal(true);
  };

  const handleRegisterProduct = async (e) => {
    e.preventDefault();
    if (!productForm.itemName.trim()) {
      addToast('NAME OF THE PRODUCT is required', 'error');
      return;
    }
    if (!productForm.hsnCode.trim()) {
      addToast('HSN CODE is required for Goods / Product', 'error');
      return;
    }

    const finalUnit = productForm.unit;
    const finalCategory = productForm.category || 'Sales Item';
    const finalHsn = productForm.hsnCode.trim() || '847130';
    const finalStock = parseInt(productForm.openingStock) || 0;
    const finalDate = productForm.date;

    if (editingProduct) {
      const updatedItem = {
        ...editingProduct,
        title: productForm.itemName,
        unit: finalUnit,
        hsnSac: finalHsn,
        openingStock: finalStock,
        date: finalDate,
        taxPercent: parseFloat(productForm.taxPercent) || 18,
        category: finalCategory
      };

      setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? updatedItem : p));
      api.updateProduct(editingProduct.id, {
        title: productForm.itemName,
        unit: finalUnit,
        hsnSac: finalHsn,
        openingStock: finalStock,
        date: finalDate,
        taxPercent: parseFloat(productForm.taxPercent) || 18,
        category: finalCategory
      });

      addToast(`Product "${productForm.itemName}" updated successfully!`, 'success', 'Product Updated');
    } else {
      const prodId = `PRD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const newItem = {
        id: prodId,
        title: productForm.itemName,
        unit: finalUnit,
        hsnSac: finalHsn,
        openingStock: finalStock,
        date: finalDate,
        taxPercent: parseFloat(productForm.taxPercent) || 18,
        category: finalCategory
      };

      setProducts([newItem, ...products]);
      try {
        const res = await api.registerSalesService({
          id: prodId,
          title: productForm.itemName,
          unit: finalUnit,
          hsnSac: finalHsn,
          openingStock: finalStock,
          date: finalDate,
          taxPercent: parseFloat(productForm.taxPercent) || 18,
          category: finalCategory,
          userId: user?.id || 'USR-901'
        });
        if (res && res.product && res.product.id && res.product.id !== prodId) {
          setProducts((prev) => prev.map((p) => p.id === prodId ? { ...p, id: res.product.id } : p));
        }
      } catch (err) {
        console.error('Error saving product to backend:', err);
      }

      addToast(`Product "${productForm.itemName}" registered successfully!`, 'success', 'Product Registered');
    }

    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm({ itemName: '', unit: 'Pices', hsnCode: '', openingStock: '100', date: new Date().toISOString().split('T')[0], taxPercent: '18', category: 'Sales Item' });
  };

  // ----------------------------------------------------
  // 3b. SERVICE HANDLERS (Create, Edit, Update, Delete)
  // ----------------------------------------------------
  const handleOpenNewService = () => {
    setEditingService(null);
    setServiceForm({
      serviceName: '',
      hsnCode: '',
      date: new Date().toISOString().split('T')[0],
      taxPercent: '18',
      category: 'Service Item'
    });
    setShowServiceModal(true);
  };

  const handleOpenEditService = (item) => {
    setEditingService(item);
    setServiceForm({
      serviceName: item.title || '',
      hsnCode: item.hsnSac || item.hsn_sac || '',
      date: item.date || (item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      taxPercent: item.taxPercent !== undefined ? String(item.taxPercent) : (item.tax_percent !== undefined ? String(item.tax_percent) : '18'),
      category: item.category || 'Service Item'
    });
    setShowServiceModal(true);
  };

  const handleRegisterService = async (e) => {
    e.preventDefault();
    if (!serviceForm.serviceName.trim()) {
      addToast('NAME OF THE SERVICE is required', 'error');
      return;
    }

    const finalUnit = 'Service';
    const finalCategory = serviceForm.category || 'Service Item';
    const finalHsn = serviceForm.hsnCode.trim() || '998222';
    const finalDate = serviceForm.date || new Date().toISOString().split('T')[0];

    if (editingService) {
      const updatedItem = {
        ...editingService,
        title: serviceForm.serviceName,
        unit: finalUnit,
        hsnSac: finalHsn,
        openingStock: 0,
        date: finalDate,
        taxPercent: parseFloat(serviceForm.taxPercent) || 18,
        category: finalCategory
      };

      setProducts((prev) => prev.map((p) => p.id === editingService.id ? updatedItem : p));
      api.updateProduct(editingService.id, {
        title: serviceForm.serviceName,
        unit: finalUnit,
        hsnSac: finalHsn,
        openingStock: 0,
        date: finalDate,
        taxPercent: parseFloat(serviceForm.taxPercent) || 18,
        category: finalCategory
      });

      addToast(`Service "${serviceForm.serviceName}" updated successfully!`, 'success', 'Service Updated');
    } else {
      const srvId = `SRV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const newItem = {
        id: srvId,
        title: serviceForm.serviceName,
        unit: finalUnit,
        hsnSac: finalHsn,
        openingStock: 0,
        date: finalDate,
        taxPercent: parseFloat(serviceForm.taxPercent) || 18,
        category: finalCategory
      };

      setProducts([newItem, ...products]);
      try {
        const res = await api.registerSalesService({
          id: srvId,
          title: serviceForm.serviceName,
          unit: finalUnit,
          hsnSac: finalHsn,
          openingStock: 0,
          date: finalDate,
          taxPercent: parseFloat(serviceForm.taxPercent) || 18,
          category: finalCategory,
          userId: user?.id || 'USR-901'
        });
        if (res && res.product && res.product.id && res.product.id !== srvId) {
          setProducts((prev) => prev.map((p) => p.id === srvId ? { ...p, id: res.product.id } : p));
        }
      } catch (err) {
        console.error('Error saving service to backend:', err);
      }

      addToast(`Service "${serviceForm.serviceName}" registered successfully!`, 'success', 'Service Registered');
    }

    setShowServiceModal(false);
    setEditingService(null);
    setServiceForm({ serviceName: '', hsnCode: '', date: new Date().toISOString().split('T')[0], taxPercent: '18', category: 'Service Item' });
  };

  // Legacy item handlers compatibility
  const handleOpenNewItem = () => handleOpenNewProduct();
  const handleOpenEditItem = (item) => isServiceItem(item) ? handleOpenEditService(item) : handleOpenEditProduct(item);
  const handleRegisterSalesService = (e) => handleRegisterProduct(e);

  const handleDeleteItem = (item) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Item / Service',
      message: `Are you sure you want to delete "${item.title}" (${item.id})? It will be removed from item catalogs.`,
      onConfirm: async () => {
        setProducts((prev) => prev.filter((p) => p.id !== item.id));
        try {
          await api.deleteProduct(item.id);
        } catch (e) { }
        addToast(`Item "${item.title}" deleted successfully.`, 'info', 'Item Deleted');
      }
    });
  };

  // ----------------------------------------------------
  // 4. INVOICES HANDLERS (Mark Paid, Delete, Cancel)
  // ----------------------------------------------------
  const updateLocalInvoices = (newInvoices) => {
    try {
      const activeId = user?.id || 'USR-901';
      localStorage.setItem(`billson_invoices_${activeId}`, JSON.stringify(newInvoices));
    } catch (e) { }
  };

  const handleDeleteInvoice = (inv) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Tax Invoice',
      message: `Are you sure you want to delete Tax Invoice "${inv.invoiceNumber || inv.invoice_number}" for ${inv.customerName || inv.customer_name}?`,
      onConfirm: async () => {
        const targetId = inv.id || inv.invoiceNumber || inv.invoice_number;
        setInvoices((prev) => {
          const updated = prev.filter((i) => i.id !== inv.id && i.invoiceNumber !== inv.invoiceNumber && i.invoice_number !== inv.invoice_number);
          updateLocalInvoices(updated);
          return updated;
        });
        try {
          await api.deleteInvoice(targetId);
        } catch (e) { }
        addToast(`Invoice ${inv.invoiceNumber || inv.invoice_number || targetId} deleted successfully.`, 'info', 'Invoice Deleted');
      }
    });
  };

  const handleMarkAsPaid = (invId) => {
    setInvoices((prev) => {
      const updated = prev.map((inv) => inv.id === invId ? { ...inv, status: 'Paid' } : inv);
      updateLocalInvoices(updated);
      return updated;
    });
    api.updateInvoice(invId, { status: 'Paid' });
    addToast('Invoice updated to Paid status!', 'success');
  };

  const handleCancelInvoice = (inv) => {
    const invNum = inv.invoiceNumber || inv.invoice_number || inv.id || '';
    const custName = inv.customerName || inv.customer_name || 'Customer';
    const targetId = inv.id || inv.invoiceNumber || inv.invoice_number;
    setDeleteModal({
      isOpen: true,
      title: 'Cancel / Void Tax Invoice',
      subtitle: 'Status will be updated to Cancelled',
      confirmText: 'Cancel Invoice',
      cancelText: 'Keep Invoice',
      confirmColor: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30',
      iconType: 'cancel',
      message: `Are you sure you want to cancel Tax Invoice "${invNum}" for ${custName}? Its status will be marked as Cancelled and counted under Cancelled in the GSTR Tax Report.`,
      onConfirm: async () => {
        setInvoices((prev) => {
          const updated = prev.map((i) =>
            (i.id === inv.id || (invNum && (i.invoiceNumber === invNum || i.invoice_number === invNum)))
              ? { ...i, status: 'Cancelled' }
              : i
          );
          updateLocalInvoices(updated);
          return updated;
        });
        try {
          await api.updateInvoice(targetId, { status: 'Cancelled' });
        } catch (e) { }
        addToast(`Invoice ${invNum} has been cancelled & recorded in Tax Report.`, 'info', 'Invoice Cancelled');
      }
    });
  };

  const handleRestoreInvoice = (inv) => {
    const invNum = inv.invoiceNumber || inv.invoice_number || inv.id || '';
    const custName = inv.customerName || inv.customer_name || 'Customer';
    const targetId = inv.id || inv.invoiceNumber || inv.invoice_number;
    setDeleteModal({
      isOpen: true,
      title: 'Restore Cancelled Invoice',
      subtitle: 'Status will return to Pending',
      confirmText: 'Restore Invoice',
      cancelText: 'Keep Cancelled',
      confirmColor: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30',
      iconType: 'restore',
      message: `Do you want to restore Invoice "${invNum}" for ${custName}? Its status will be changed back to Pending and reinstated in active turnover.`,
      onConfirm: async () => {
        setInvoices((prev) => {
          const updated = prev.map((i) =>
            (i.id === inv.id || (invNum && (i.invoiceNumber === invNum || i.invoice_number === invNum)))
              ? { ...i, status: 'Pending' }
              : i
          );
          updateLocalInvoices(updated);
          return updated;
        });
        try {
          await api.updateInvoice(targetId, { status: 'Pending' });
        } catch (e) { }
        addToast(`Invoice ${invNum} restored to Pending status.`, 'success', 'Invoice Restored');
      }
    });
  };

  // Financial Stat calculations (Excluding cancelled invoices from active billed turnover)
  const totalInvoicesCount = invoices.length;
  const activeFinancialInvoices = invoices.filter(inv => (inv.status || '').toLowerCase() !== 'cancelled');
  const totalSales = activeFinancialInvoices.reduce((acc, inv) => acc + (inv.grandTotal || inv.grand_total || 0), 0);
  const totalTax = activeFinancialInvoices.reduce((acc, inv) => acc + (inv.totalTax || inv.total_tax || 0), 0);

  const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending');
  const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');
  const cancelledInvoices = invoices.filter(inv => (inv.status || '').toLowerCase() === 'cancelled');

  const paidAmount = paidInvoices.reduce((acc, inv) => acc + (inv.grandTotal || inv.grand_total || 0), 0);
  const pendingAmount = pendingInvoices.reduce((acc, inv) => acc + (inv.grandTotal || inv.grand_total || 0), 0);
  const outstandingAmount = overdueInvoices.reduce((acc, inv) => acc + (inv.grandTotal || inv.grand_total || 0), 0);

  // Filtered Invoices & Documents - strictly isolated to active tenant
  const displayInvoices = invoices.filter((inv) => {
    const invOwner = inv.userId || inv.user_id;
    if (user?.id && invOwner && invOwner !== user.id) return false;

    if (activeTab === 'payments') return inv.documentType === 'Payment';
    if (docSubTab === 'All') return true;
    if (docSubTab === 'Sales Invoice') return !inv.documentType || inv.documentType === 'Sales Invoice';
    return inv.documentType === docSubTab;
  });

  const filteredInvoices = displayInvoices.filter((inv) => {
    const q = searchQuery.toLowerCase().trim();
    const invNum = (inv.invoiceNumber || inv.invoice_number || '').toLowerCase();
    const custName = (inv.customerName || inv.customer_name || '').toLowerCase();
    const custGst = (inv.customerGst || inv.customer_gst || '').toLowerCase();
    const paidBy = (inv.paidBy || '').toLowerCase();
    const paidTo = (inv.paidTo || '').toLowerCase();
    const purpose = (inv.paymentPurpose || '').toLowerCase();

    const matchesSearch = !q || invNum.includes(q) || custName.includes(q) || custGst.includes(q) || paidBy.includes(q) || paidTo.includes(q) || purpose.includes(q);
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.gstNumber || c.gst_number || '').toLowerCase().includes(q) ||
      (c.panNumber || c.pan_number || '').toLowerCase().includes(q) ||
      (c.phone || c.mobile || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.ledger || '').toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q)
    );
  });

  // Filtered Bank & Cash Accounts
  const filteredBankAccounts = bankAccounts.filter((b) => {
    const q = bankSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (b.accountName || b.account_name || '').toLowerCase().includes(q) ||
      (b.bankName || b.bank_name || '').toLowerCase().includes(q) ||
      (b.accountNumber || b.account_number || '').toLowerCase().includes(q) ||
      (b.ifscCode || b.ifsc_code || '').toLowerCase().includes(q) ||
      (b.bankType || b.bank_type || '').toLowerCase().includes(q) ||
      (b.address || '').toLowerCase().includes(q) ||
      (b.id || '').toLowerCase().includes(q)
    );
  });

  // Separate Products vs Services
  const onlyProducts = products.filter((p) => !isServiceItem(p));
  const onlyServices = products.filter((p) => isServiceItem(p));

  // Filtered Products (Goods)
  const filteredOnlyProducts = onlyProducts.filter((p) => {
    const q = productSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.hsnSac || p.hsn_sac || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.unit || '').toLowerCase().includes(q) ||
      (p.id || '').toLowerCase().includes(q)
    );
  });

  // Filtered Services
  const filteredOnlyServices = onlyServices.filter((p) => {
    const q = serviceSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.hsnSac || p.hsn_sac || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.id || '').toLowerCase().includes(q)
    );
  });

  // Legacy filteredProducts for fallback
  const filteredProducts = products.filter((p) => {
    const q = serviceSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.hsnSac || p.hsn_sac || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.unit || '').toLowerCase().includes(q) ||
      (p.id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">

      {/* Quick Action Document Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-indigo-500/20 bg-gradient-to-r from-brand-900/40 via-dark-900 to-indigo-950/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">

          {/* Document Creation Buttons (Replacing Welcome Text area) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Sales Invoice Button */}
            <button
              onClick={() => onQuickCreateInvoice(null, 'Sales Invoice')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer border border-emerald-400/30"
            >
              <FileText className="w-4 h-4 text-white" /> + Sales Invoice
            </button>

            {/* 2. Purchase Invoice Button */}
            <button
              onClick={() => onQuickCreateInvoice(null, 'Purchase Invoice')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer border border-blue-400/30"
            >
              <ShoppingBag className="w-4 h-4 text-white" /> + Purchase Invoice
            </button>

            {/* 3. Estimate Button */}
            <button
              onClick={() => onQuickCreateInvoice(null, 'Estimate')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer border border-purple-400/30"
            >
              <Calculator className="w-4 h-4 text-white" /> + Estimate
            </button>

            {/* 4. Delivery Challan Button */}
            <button
              onClick={() => onQuickCreateInvoice(null, 'Delivery Challan')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer border border-amber-400/30"
            >
              <Truck className="w-4 h-4 text-white" /> + Delivery Challan
            </button>

            {/* 5. Payment Button */}
            <button
              onClick={() => onQuickCreateInvoice(null, 'Payment')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer border border-cyan-400/30"
            >
              <CreditCard className="w-4 h-4 text-white" /> + Payment
            </button>

            {/* 6. Receipt Button */}
            <button
              onClick={() => onQuickCreateInvoice(null, 'Receipt')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer border border-purple-400/30"
            >
              <FileCheck className="w-4 h-4 text-white" /> + Receipt
            </button>
          </div>

          {/* Quick Registration Master Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800 shrink-0">
            <button
              onClick={handleOpenNewCustomer}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" /> + Ledger
            </button>
            <button
              onClick={handleOpenNewBank}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              <Landmark className="w-3.5 h-3.5 text-amber-400" /> + Bank / Cash
            </button>
            <button
              onClick={handleOpenNewProduct}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" /> + Product
            </button>
            <button
              onClick={handleOpenNewService}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-400" /> + Service
            </button>
          </div>

        </div>
      </div>

      {/* OVERVIEW TAB CONTENT (EXECUTIVE BUSINESS DASHBOARD) */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-slide-up">

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Billed Revenue</p>
                <h3 className="text-2xl font-bold font-mono text-white mt-1">₹{totalSales.toLocaleString('en-IN')}</h3>
                <p className="text-[11px] text-emerald-400 font-mono mt-1">↑ 14.2% from last month</p>
              </div>
              <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Tax Collected (GST)</p>
                <h3 className="text-2xl font-bold font-mono text-indigo-300 mt-1">₹{totalTax.toLocaleString('en-IN')}</h3>
                <p className="text-[11px] text-indigo-400 font-mono mt-1">18% Compliant ITC</p>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Receipt className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Settled / Paid</p>
                <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">₹{paidAmount.toLocaleString('en-IN')}</h3>
                <p className="text-[11px] text-emerald-400 font-mono mt-1">{paidInvoices.length} invoices cleared</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Outstanding Due</p>
                <h3 className="text-2xl font-bold font-mono text-amber-300 mt-1">₹{(pendingAmount + outstandingAmount).toLocaleString('en-IN')}</h3>
                <p className="text-[11px] text-amber-400 font-mono mt-1">{pendingInvoices.length + overdueInvoices.length} pending invoices</p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Graphical Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Revenue Trend Area Chart */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-serif">Revenue & GST Trend (2026)</h3>
                  <p className="text-xs text-slate-400 font-mono">Monthly turnover with verified GST returns</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1 text-brand-400"><div className="w-2 h-2 rounded-full bg-brand-500"></div> Revenue</span>
                  <span className="flex items-center gap-1 text-indigo-400"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> GST</span>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, '']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="tax" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorTax)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GST Split Doughnut Chart */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-serif">GST Tax Distribution</h3>
                <p className="text-xs text-slate-400 font-mono">Output tax split by CGST, SGST & IGST</p>
              </div>
              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={taxBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {taxBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                {taxBreakdownData.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-mono">{item.name.split(' ')[0]}</p>
                    <p className="text-xs font-bold font-mono" style={{ color: item.color }}>{item.value}%</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Overview Dashboard Bottom Section: Recent Activity & Quick Master Directory */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Recent Invoices Activity log (Left 2 cols) */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-serif">Recent Invoice Transactions</h3>
                  <p className="text-xs text-slate-400 font-mono">Latest GST tax invoices generated</p>
                </div>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-white font-semibold cursor-pointer transition-colors"
                >
                  View All Invoices <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono whitespace-nowrap">
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Grand Total</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {invoices.slice(0, 4).map((inv) => {
                      const invNumber = inv.invoiceNumber || inv.invoice_number;
                      const custName = inv.customerName || inv.customer_name;
                      const grandTotalVal = inv.grandTotal || inv.grand_total || 0;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">{invNumber}</td>
                          <td className="py-3 px-3 font-medium text-slate-200 whitespace-nowrap">{custName}</td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">₹{grandTotalVal.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${inv.status === 'Paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : inv.status === 'Pending'
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                  : (inv.status || '').toLowerCase() === 'cancelled'
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 line-through'
                                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                              }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                generateInvoicePDF(inv, user);
                                addToast(`Downloading Tax Invoice ${inv.invoiceNumber || inv.invoice_number}...`, 'success');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-all text-xs font-semibold cursor-pointer border border-indigo-500/30"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" /> Download
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Master Directory Summary (Right 1 col) */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white font-serif">Quick Directory Shortcuts</h3>
              <p className="text-xs text-slate-400 font-mono">Overview of registered master records</p>

              <div className="space-y-3 pt-1">
                <div
                  onClick={() => setActiveTab('customers')}
                  className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex items-center justify-between hover:border-indigo-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">Customers Directory</h4>
                      <p className="text-xs text-slate-400 font-mono">{customers.length} Registered Debtors</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>

                <div
                  onClick={() => setActiveTab('payments')}
                  className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex items-center justify-between hover:border-amber-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">Bank / Cash Accounts</h4>
                      <p className="text-xs text-slate-400 font-mono">{bankAccounts.length} Active Accounts</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>

                <div
                  onClick={() => setActiveTab('products')}
                  className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex items-center justify-between hover:border-emerald-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Products (Goods)</h4>
                      <p className="text-xs text-slate-400 font-mono">{onlyProducts.length} Goods Registered</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>

                <div
                  onClick={() => setActiveTab('services')}
                  className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex items-center justify-between hover:border-cyan-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">Services Catalog</h4>
                      <p className="text-xs text-slate-400 font-mono">{onlyServices.length} Services Registered</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* INVOICE & BILLING HUB TAB CONTENT (DEDICATED INVOICE / DOCUMENT DIRECTORY) */}
      {(activeTab === 'invoices' || activeTab === 'payments') && (
        <div className="space-y-6 animate-slide-up">

          {/* Dynamic Header for Document Directory matching Registration Customer format */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/60 via-dark-900/80 to-purple-950/40 p-6 rounded-3xl border border-indigo-500/20 shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono font-bold border border-brand-500/30">
                  {docSubTab === 'All' ? 'ALL INVOICES & DOCUMENTS DIRECTORY' : `${docSubTab.toUpperCase()} REGISTER`}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-wider font-serif uppercase">
                REGISTRATION ( {docSubTab === 'All' ? 'INVOICES & DOCUMENTS' : docSubTab} )
              </h2>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                {docSubTab === 'Payment'
                  ? 'Payment Vouchers, Cash/Bank Received & Paid Out Ledger Directory'
                  : docSubTab === 'Sales Invoice'
                    ? 'Official Sales Tax Invoices & Customer Billing Directory'
                    : docSubTab === 'Purchase Invoice'
                      ? 'Vendor Purchases, Goods Received & Bills Directory'
                      : docSubTab === 'Estimate'
                        ? 'Quotations, Proforma Bills & Price Estimates Directory'
                        : docSubTab === 'Delivery Challan'
                          ? 'Goods Delivery Notes & Dispatch Challans Directory'
                          : 'Complete Master Directory for all Sales, Purchases, Estimates, Delivery Challans & Payments'}
              </p>
            </div>

            <button
              onClick={() => onQuickCreateInvoice(null, docSubTab === 'All' ? 'Sales Invoice' : docSubTab)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer w-fit"
            >
              <Plus className="w-4 h-4" /> + Create New {docSubTab === 'All' ? 'Document' : docSubTab}
            </button>
          </div>

          {/* Sub Navigation Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
            {[
              { id: 'All', label: 'All Documents', color: 'from-indigo-500 to-brand-500' },
              { id: 'Sales Invoice', label: 'Sales Invoices', color: 'from-emerald-500 to-teal-600' },
              { id: 'Purchase Invoice', label: 'Purchase Invoices', color: 'from-blue-500 to-indigo-600' },
              { id: 'Estimate', label: 'Estimates', color: 'from-pink-500 to-rose-600' },
              { id: 'Delivery Challan', label: 'Delivery Challans', color: 'from-amber-500 to-orange-600' },
              { id: 'Payment', label: 'Payments', color: 'from-cyan-500 to-blue-600' },
              { id: 'Receipt', label: 'Receipts', color: 'from-purple-500 to-indigo-600' },
            ].map((tab) => {
              const count = tab.id === 'All'
                ? invoices.length
                : invoices.filter((i) => (i.documentType || 'Sales Invoice') === tab.id).length;
              const isActive = docSubTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setDocSubTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${isActive
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-indigo-500/20`
                      : 'bg-dark-800/80 hover:bg-dark-700 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Invoice Specific KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400 font-mono">Total {docSubTab} Records</p>
              <h3 className="text-2xl font-bold font-mono text-white mt-1">{filteredInvoices.length}</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-1">Filtered count</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400 font-mono">Total Billed Volume</p>
              <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                ₹{filteredInvoices.filter(i => (i.status || '').toLowerCase() !== 'cancelled').reduce((sum, inv) => sum + Number(inv.grandTotal || inv.grand_total || inv.amountPaid || 0), 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-emerald-400 font-mono mt-1">Active (Excl. Cancelled)</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400 font-mono">Cleared / Settled</p>
              <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {filteredInvoices.filter((i) => i.status === 'Paid').length}
              </h3>
              <p className="text-[11px] text-emerald-400 font-mono mt-1">Completed records</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400 font-mono">Pending / Active</p>
              <h3 className="text-2xl font-bold font-mono text-amber-300 mt-1">
                {filteredInvoices.filter((i) => i.status !== 'Paid' && (i.status || '').toLowerCase() !== 'cancelled').length}
              </h3>
              <p className="text-[11px] text-amber-400 font-mono mt-1">Requires attention</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-rose-900/40 bg-rose-950/15">
              <p className="text-xs text-rose-300 font-mono">Cancelled / Void</p>
              <h3 className="text-2xl font-bold font-mono text-rose-400 mt-1">
                {filteredInvoices.filter((i) => (i.status || '').toLowerCase() === 'cancelled').length}
              </h3>
              <p className="text-[11px] text-rose-400/80 font-mono mt-1">In Table 13 Tax Report</p>
            </div>
          </div>

          {/* Full Invoices Master Table */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif uppercase">
                  {docSubTab === 'All' ? 'ALL DOCUMENTS MASTER LIST' : `${docSubTab} DIRECTORY`}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Showing <span className="text-emerald-400 font-bold">{filteredInvoices.length}</span> of {invoices.length} total entries
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ID, customer, GSTIN, payment details..."
                    className="pl-8 pr-3 py-2 rounded-xl glass-input text-xs w-64 font-mono"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl glass-input text-xs bg-dark-900 font-semibold cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {filteredInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono whitespace-nowrap">
                      <th className="py-3 px-4">Doc Type & ID</th>
                      <th className="py-3 px-4">Customer / Party</th>
                      <th className="py-3 px-4">GSTIN & Details</th>
                      <th className="py-3 px-4">Date / Payment Method</th>
                      <th className="py-3 px-4">Tax / Purpose</th>
                      <th className="py-3 px-4">Grand Total</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredInvoices.map((inv) => {
                      const docType = inv.documentType || 'Sales Invoice';
                      const invNumber = inv.invoiceNumber || inv.invoice_number;
                      const custName = inv.customerName || inv.customer_name || inv.paidBy || 'N/A';
                      const custGst = inv.customerGst || inv.customer_gst || (inv.paidTo ? `To: ${inv.paidTo}` : 'N/A');
                      const totalTaxVal = inv.totalTax || inv.total_tax || 0;
                      const grandTotalVal = inv.grandTotal || inv.grand_total || inv.amountPaid || 0;
                      const dueDateVal = inv.dueDate || inv.due_date;
                      const paymentMethod = inv.paymentMethod || 'N/A';
                      const paymentPurpose = inv.paymentPurpose || '';

                      const isCancelled = (inv.status || '').toLowerCase() === 'cancelled';

                      return (
                        <tr key={inv.id} className={`hover:bg-slate-800/40 transition-colors ${isCancelled ? 'bg-rose-950/10 opacity-80' : ''}`}>
                          <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-brand-300 font-sans font-semibold uppercase">{docType}</span>
                              <span className={`text-xs ${isCancelled ? 'line-through text-slate-400' : ''}`}>{invNumber}</span>
                            </div>
                          </td>
                          <td className={`py-3.5 px-4 font-medium whitespace-nowrap ${isCancelled ? 'text-slate-400' : 'text-slate-200'}`}>{custName}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">{custGst}</td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono whitespace-nowrap">
                            <div>{inv.date}</div>
                            {docType === 'Payment' || docType === 'Receipt' ? (
                              <div className="text-[10px] text-cyan-400 font-bold">Via: {paymentMethod}</div>
                            ) : (
                              dueDateVal && <div className="text-[10px] text-slate-500">Due: {dueDateVal}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-indigo-300 whitespace-nowrap">
                            {docType === 'Payment' || docType === 'Receipt' ? (
                              <span className="text-[11px] text-slate-400">{paymentPurpose || (docType === 'Receipt' ? 'Receipt Entry' : 'Payment Entry')}</span>
                            ) : (
                              `₹${totalTaxVal.toLocaleString('en-IN')}`
                            )}
                          </td>
                          <td className={`py-3.5 px-4 font-mono font-bold whitespace-nowrap ${isCancelled ? 'line-through text-slate-500' : 'text-emerald-400'}`}>
                            ₹{grandTotalVal.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${isCancelled
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 line-through'
                                : inv.status === 'Paid'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : inv.status === 'Pending'
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                              }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* VIEW Button */}
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-semibold transition-all cursor-pointer"
                                title="View Record Details"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>

                              <button
                                onClick={() => {
                                  generateInvoicePDF(inv, user);
                                  addToast(`${docType} PDF generated for ${invNumber}`, 'success', 'PDF Ready');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                                title="Download PDF"
                              >
                                <Download className="w-3 h-3" /> PDF
                              </button>

                              {/* EDIT Button */}
                              <button
                                onClick={() => {
                                  const effectiveDocType = inv.documentType || inv.document_type || docType || (
                                    inv.id?.startsWith('PUR') ? 'Purchase Invoice' :
                                      inv.id?.startsWith('EST') ? 'Estimate' :
                                        inv.id?.startsWith('DC') ? 'Delivery Challan' :
                                          inv.id?.startsWith('PAY') ? 'Payment' :
                                            inv.id?.startsWith('REC') ? 'Receipt' : 'Sales Invoice'
                                  );
                                  onQuickCreateInvoice(inv, effectiveDocType);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[11px] font-semibold transition-all cursor-pointer"
                                title="Edit / Update Record"
                              >
                                <Pencil className="w-3 h-3" /> Edit
                              </button>

                              {/* CANCEL / RESTORE Button */}
                              {isCancelled ? (
                                <button
                                  onClick={() => handleRestoreInvoice(inv)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-[11px] font-semibold transition-all cursor-pointer"
                                  title="Restore Cancelled Invoice"
                                >
                                  <RefreshCw className="w-3 h-3" /> Restore
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCancelInvoice(inv)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-[11px] font-semibold transition-all cursor-pointer"
                                  title="Cancel / Void Invoice"
                                >
                                  <Ban className="w-3 h-3" /> Cancel
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteInvoice(inv)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white transition-all border border-red-500/30 text-[11px] font-semibold cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <Receipt className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">No matching {docSubTab} records found</h4>
                <p className="text-xs text-slate-500">Try adjusting your category tabs, status filter, or search query.</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs text-indigo-400 hover:text-white font-medium inline-block transition-colors cursor-pointer"
                  >
                    Clear Search Query
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* CUSTOMERS TAB CONTENT (REGISTRATION - CUSTOMER) */}
      {activeTab === 'customers' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white font-serif">REGISTRATION ( Ledger )</h2>
              <p className="text-xs text-slate-400 font-mono">Customer Ledger (Sundry Debtors / Sundry Creditors) Directory</p>
            </div>
            <button
              onClick={handleOpenNewCustomer}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 cursor-pointer w-fit"
            >
              <Plus className="w-4 h-4" /> Register New Customer
            </button>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            {/* Customer Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-dark-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Search customers by name, GSTIN, PAN, mobile, email or city..."
                  className="w-full pl-10 pr-10 py-2 rounded-xl glass-input text-xs"
                />
                {customerSearchQuery && (
                  <button
                    onClick={() => setCustomerSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono shrink-0">
                Showing <span className="text-emerald-400 font-bold">{filteredCustomers.length}</span> of {customers.length} customers
              </div>
            </div>

            {/* Customers Row / Table Layout */}
            {filteredCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono whitespace-nowrap">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Ledger Type</th>
                      <th className="py-3 px-4">GSTIN & PAN</th>
                      <th className="py-3 px-4">Contact Details</th>
                      <th className="py-3 px-4">Address / City</th>
                      <th className="py-3 px-4">Total Billed</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredCustomers.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCustomerDetail(c)}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-mono font-semibold text-brand-300 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-300 border border-brand-500/30 whitespace-nowrap inline-block font-mono text-[11px] font-bold">{c.id}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                          <div>{c.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Status: {c.status || 'Active'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 whitespace-nowrap inline-block text-[10px]">
                            {c.ledger || 'SUNDRY DEBTORS'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                          <div><span className="text-slate-500">GST:</span> {c.gstNumber || c.gst_number || 'N/A'}</div>
                          <div className="text-[11px] text-slate-400"><span className="text-slate-500">PAN:</span> {c.panNumber || c.pan_number || 'N/A'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                          <div>{c.phone || c.mobile || 'N/A'}</div>
                          <div className="text-[11px] text-slate-400">{c.email || 'N/A'}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <div className="max-w-xs truncate">{c.address || `${c.city || 'Chennai'}, ${c.state || 'Tamil Nadu'}`}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                          ₹{(c.totalBilled || c.total_billed || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedCustomerDetail(c)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all border border-emerald-500/20 text-[11px] font-semibold cursor-pointer"
                              title="View Customer Details"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                            <button
                              onClick={() => handleOpenEditCustomer(c)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-all border border-indigo-500/30 text-[11px] font-semibold cursor-pointer"
                              title="Edit Customer"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(c)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white transition-all border border-red-500/30 text-[11px] font-semibold cursor-pointer"
                              title="Delete Customer"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">No matching customers found</h4>
                <p className="text-xs text-slate-500">Try adjusting your search query or register a new customer.</p>
                {customerSearchQuery && (
                  <button
                    onClick={() => setCustomerSearchQuery('')}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs text-indigo-400 hover:text-white font-medium inline-block transition-colors cursor-pointer"
                  >
                    Clear Search Query
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BANK / CASH TAB CONTENT (REGISTRATION - BANK / CASH) */}
      {activeTab === 'payments' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white font-serif">REGISTRATION ( BANK / CASH )</h2>
              <p className="text-xs text-slate-400 font-mono">Registered Bank Accounts & Cash in Hand Ledgers</p>
            </div>
            <button
              onClick={handleOpenNewBank}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer w-fit"
            >
              <Plus className="w-4 h-4" /> Register Bank / Cash Account
            </button>
          </div>

          <div className="glass-card-gold rounded-3xl p-6 border border-amber-500/30 space-y-4">
            {/* Bank / Cash Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-dark-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={bankSearchQuery}
                  onChange={(e) => setBankSearchQuery(e.target.value)}
                  placeholder="Search bank or cash accounts by account name, bank, account number, IFSC..."
                  className="w-full pl-10 pr-10 py-2 rounded-xl glass-input text-xs"
                />
                {bankSearchQuery && (
                  <button
                    onClick={() => setBankSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono shrink-0">
                Showing <span className="text-amber-400 font-bold">{filteredBankAccounts.length}</span> of {bankAccounts.length} accounts
              </div>
            </div>

            {/* Bank Accounts Row / Table Layout */}
            {filteredBankAccounts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-amber-500/20 text-amber-200/70 font-mono whitespace-nowrap">
                      <th className="py-3 px-4">Account ID</th>
                      <th className="py-3 px-4">Account Name</th>
                      <th className="py-3 px-4">Account Type</th>
                      <th className="py-3 px-4">Bank Name</th>
                      <th className="py-3 px-4">A/C Number & IFSC</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Branch / Address</th>
                      <th className="py-3 px-4">Ledger Balance</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10">
                    {filteredBankAccounts.map((b) => (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedBankDetail(b)}
                        className="hover:bg-amber-500/10 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-mono font-semibold text-amber-400 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap inline-block font-mono text-[11px] font-bold">{b.id}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                          <div>{b.accountName || b.account_name}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 whitespace-nowrap inline-block text-[10px]">
                            {b.bankType || b.bank_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-200 font-medium whitespace-nowrap">
                          {b.bankName || b.bank_name || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                          <div>{b.accountNumber || b.account_number}</div>
                          <div className="text-[11px] text-amber-300/80"><span className="text-slate-500">IFSC:</span> {b.ifscCode || b.ifsc_code || 'N/A'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-amber-200/90 whitespace-nowrap">
                          {b.date || (b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : '2026-09-08')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                          {b.address || 'Chennai Central'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                          ₹{(b.balance || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedBankDetail(b)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition-all border border-amber-500/30 text-[11px] font-semibold cursor-pointer"
                              title="View Account Details"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                            <button
                              onClick={() => handleOpenEditBank(b)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition-all border border-amber-500/40 text-[11px] font-semibold cursor-pointer"
                              title="Edit Bank Account"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBank(b)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white transition-all border border-red-500/30 text-[11px] font-semibold cursor-pointer"
                              title="Delete Bank Account"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <Landmark className="w-10 h-10 text-amber-400/50 mx-auto" />
                <h4 className="text-sm font-bold text-amber-200">No matching bank or cash accounts found</h4>
                <p className="text-xs text-slate-400">Try adjusting your search query or register a new bank account.</p>
                {bankSearchQuery && (
                  <button
                    onClick={() => setBankSearchQuery('')}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs text-amber-300 hover:text-white font-medium inline-block transition-colors cursor-pointer"
                  >
                    Clear Search Query
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCTS CATALOG TAB CONTENT (REGISTRATION - PRODUCTS / GOODS) */}
      {activeTab === 'products' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white font-serif">REGISTRATION ( PRODUCTS / GOODS )</h2>
              <p className="text-xs text-slate-400 font-mono">Product & Goods Master Catalog with HSN Codes & Opening Stock</p>
            </div>
            <button
              onClick={handleOpenNewProduct}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer w-fit"
            >
              <Plus className="w-4 h-4" /> Register New Product
            </button>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            {/* Product Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-dark-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Search products by item title, HSN code, category..."
                  className="w-full pl-10 pr-10 py-2 rounded-xl glass-input text-xs"
                />
                {productSearchQuery && (
                  <button
                    onClick={() => setProductSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono shrink-0">
                Showing <span className="text-emerald-400 font-bold">{filteredOnlyProducts.length}</span> of {onlyProducts.length} products
              </div>
            </div>

            {/* Products Row / Table Layout */}
            {filteredOnlyProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono whitespace-nowrap">
                      <th className="py-3 px-4">Product ID</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">HSN Code</th>
                      <th className="py-3 px-4">GST Rate</th>
                      <th className="py-3 px-4">QTY Unit</th>
                      <th className="py-3 px-4">Opening Stock</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredOnlyProducts.map((p) => {
                      const itemTitle = p.title;
                      const hsn = p.hsnSac || p.hsn_sac;
                      const taxPct = p.taxPercent || p.tax_percent || 18;
                      const opStock = p.openingStock !== undefined ? p.openingStock : (p.opening_stock !== undefined ? p.opening_stock : 100);
                      const itemDate = p.date || (p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedServiceDetail(p)}
                          className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4 font-mono font-semibold text-emerald-300 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap inline-block font-mono text-[11px] font-bold">{p.id}</span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                            <div>{itemTitle}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 whitespace-nowrap inline-block text-[10px]">
                              {p.category || 'Sales Item'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-300 whitespace-nowrap">
                            {hsn}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold whitespace-nowrap">
                            {taxPct}% GST
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                            {p.unit || 'Pices'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300 font-semibold whitespace-nowrap">
                            {`${opStock} Units`}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {itemDate}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedServiceDetail(p)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all border border-emerald-500/20 text-[11px] font-semibold cursor-pointer"
                                title="View Product Details"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-all border border-emerald-500/30 text-[11px] font-semibold cursor-pointer"
                                title="Edit Product"
                              >
                                <Pencil className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(p)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white transition-all border border-red-500/30 text-[11px] font-semibold cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <Package className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">No matching products found</h4>
                <p className="text-xs text-slate-500">Try adjusting your search query or register a new product item.</p>
                {productSearchQuery && (
                  <button
                    onClick={() => setProductSearchQuery('')}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs text-emerald-400 hover:text-white font-medium inline-block transition-colors cursor-pointer"
                  >
                    Clear Search Query
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SERVICES CATALOG TAB CONTENT (REGISTRATION - SERVICES) */}
      {activeTab === 'services' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white font-serif">REGISTRATION ( SERVICES )</h2>
              <p className="text-xs text-slate-400 font-mono">Service Master Catalog with SAC / HSN Codes</p>
            </div>
            <button
              onClick={handleOpenNewService}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 cursor-pointer w-fit"
            >
              <Plus className="w-4 h-4" /> Register New Service
            </button>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            {/* Service Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-dark-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={serviceSearchQuery}
                  onChange={(e) => setServiceSearchQuery(e.target.value)}
                  placeholder="Search services by service title, SAC/HSN code, category..."
                  className="w-full pl-10 pr-10 py-2 rounded-xl glass-input text-xs"
                />
                {serviceSearchQuery && (
                  <button
                    onClick={() => setServiceSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono shrink-0">
                Showing <span className="text-cyan-400 font-bold">{filteredOnlyServices.length}</span> of {onlyServices.length} services
              </div>
            </div>

            {/* Services Row / Table Layout */}
            {filteredOnlyServices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono whitespace-nowrap">
                      <th className="py-3 px-4">Service ID</th>
                      <th className="py-3 px-4">Service Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">SAC / HSN Code</th>
                      <th className="py-3 px-4">GST Rate</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredOnlyServices.map((p) => {
                      const itemTitle = p.title;
                      const hsn = p.hsnSac || p.hsn_sac;
                      const taxPct = p.taxPercent || p.tax_percent || 18;
                      const itemDate = p.date || (p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedServiceDetail(p)}
                          className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4 font-mono font-semibold text-cyan-300 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 whitespace-nowrap inline-block font-mono text-[11px] font-bold">{p.id}</span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                            <div>{itemTitle}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 whitespace-nowrap inline-block text-[10px]">
                              {p.category || 'Service Item'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-cyan-300 whitespace-nowrap">
                            {hsn}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold whitespace-nowrap">
                            {taxPct}% GST
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                            {itemDate}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedServiceDetail(p)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-600 text-cyan-400 hover:text-white transition-all border border-cyan-500/20 text-[11px] font-semibold cursor-pointer"
                                title="View Service Details"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>
                              <button
                                onClick={() => handleOpenEditService(p)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white transition-all border border-cyan-500/30 text-[11px] font-semibold cursor-pointer"
                                title="Edit Service"
                              >
                                <Pencil className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(p)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white transition-all border border-red-500/30 text-[11px] font-semibold cursor-pointer"
                                title="Delete Service"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <Wrench className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">No matching services found</h4>
                <p className="text-xs text-slate-500">Try adjusting your search query or register a new service.</p>
                {serviceSearchQuery && (
                  <button
                    onClick={() => setServiceSearchQuery('')}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs text-cyan-400 hover:text-white font-medium inline-block transition-colors cursor-pointer"
                  >
                    Clear Search Query
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GSTR & TAX REPORTS TAB CONTENT */}
      {activeTab === 'tax-reports' && (() => {
        const companyName = user?.companyName || user?.company_name || user?.fullName || 'MY COMPANY';

        const getMonthYearLabel = (mVal) => {
          if (!mVal || mVal === 'all') return 'ALL MONTHS 2026';
          const [yr, mo] = mVal.split('-');
          const monthNames = [
            'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
          ];
          const mIdx = parseInt(mo, 10) - 1;
          return `${monthNames[mIdx] || 'AUGUST'} ${yr}`;
        };

        const dynamicMonthOptions = (() => {
          const monthSet = new Set();
          const currentYM = new Date().toISOString().slice(0, 7);
          monthSet.add(currentYM);
          monthSet.add('2026-08');

          (invoices || []).forEach((inv) => {
            const dStr = (inv.date || '').toString().trim();
            if (dStr && dStr.length >= 7) {
              const ym = dStr.slice(0, 7);
              if (/^\d{4}-\d{2}$/.test(ym)) {
                monthSet.add(ym);
              }
            }
          });

          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];

          return Array.from(monthSet).sort().reverse().map((ym) => {
            const [y, m] = ym.split('-');
            const mIdx = parseInt(m, 10) - 1;
            const label = `${monthNames[mIdx] || m} ${y}`;
            return { value: ym, label };
          });
        })();

        const periodLabel = getMonthYearLabel(gstrSelectedMonthYear);

        const { 
          b2bRows, 
          b2cRows, 
          hsnSummaryRows, 
          hsnSummaryWithGstRows = [], 
          hsnSummaryWithoutGstRows = [], 
          docIssuedRows, 
          filteredInvoices 
        } = processGSTRData(
          invoices,
          customers,
          user?.state || 'Tamil Nadu',
          gstrSelectedMonthYear,
          products
        );

        const b2bTotals = b2bRows.reduce((acc, r) => ({
          taxable: acc.taxable + r.taxableValue,
          igst: acc.igst + r.igst,
          cgst: acc.cgst + r.cgst,
          sgst: acc.sgst + r.sgst
        }), { taxable: 0, igst: 0, cgst: 0, sgst: 0 });

        const b2cTotals = b2cRows.reduce((acc, r) => ({
          taxable: acc.taxable + r.taxableValue,
          igst: acc.igst + r.igst,
          cgst: acc.cgst + r.cgst,
          sgst: acc.sgst + r.sgst
        }), { taxable: 0, igst: 0, cgst: 0, sgst: 0 });

        const hsnTotals = hsnSummaryRows.reduce((acc, r) => ({
          qty: acc.qty + r.totalQty,
          taxable: acc.taxable + r.taxableValue,
          igst: acc.igst + r.igst,
          cgst: acc.cgst + r.cgst,
          sgst: acc.sgst + r.sgst
        }), { qty: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0 });

        const hsnWithGstTotals = hsnSummaryWithGstRows.reduce((acc, r) => ({
          qty: acc.qty + r.totalQty,
          taxable: acc.taxable + r.taxableValue,
          igst: acc.igst + r.igst,
          cgst: acc.cgst + r.cgst,
          sgst: acc.sgst + r.sgst
        }), { qty: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0 });

        const hsnWithoutGstTotals = hsnSummaryWithoutGstRows.reduce((acc, r) => ({
          qty: acc.qty + r.totalQty,
          taxable: acc.taxable + r.taxableValue,
          igst: acc.igst + r.igst,
          cgst: acc.cgst + r.cgst,
          sgst: acc.sgst + r.sgst
        }), { qty: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0 });

        const handleDownloadExcel = () => {
          downloadGSTRExcelReport({
            companyName,
            monthYearLabel: periodLabel,
            b2bRows,
            b2cRows,
            hsnSummaryRows,
            hsnSummaryWithGstRows,
            hsnSummaryWithoutGstRows,
            docIssuedRows
          });
          addToast(`GSTR-1 Excel report (.xlsx) downloaded with 'b2b', 'b2c', 'HSN summary (With GST)', 'HSN summary (Without GST)', 'HSN summary' and 'document issued' sheets for ${periodLabel}!`, 'success', 'Excel Generated');
        };

        return (
          <div className="space-y-6 animate-slide-up">
            {/* Header & Controls Bar */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    GSTR-1 Tax Return Excel Report Generator
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Select month to view, preview B2B (Sheet 1), B2C (Sheet 2) & HSN Summary (With & Without GST), and download multi-sheet Excel file (.xlsx).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Month Selection Dropdown */}
                  <div className="flex items-center gap-2 bg-dark-900 px-3.5 py-2 rounded-xl border border-slate-700">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-300">Month / Period:</span>
                    <select
                      value={gstrSelectedMonthYear}
                      onChange={(e) => setGstrSelectedMonthYear(e.target.value)}
                      className="bg-transparent text-xs font-bold font-mono text-emerald-400 focus:outline-none cursor-pointer"
                    >
                      <option value="all" className="bg-dark-950 text-white">All Months (FY 2026)</option>
                      {dynamicMonthOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-dark-950 text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Download Excel Button */}
                  <button
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download GSTR Excel (.xlsx)
                  </button>
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">Period Selected</p>
                  <h4 className="text-sm font-bold text-emerald-400 font-mono mt-1">{periodLabel}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">{filteredInvoices.length} total invoices in cycle</p>
                </div>
                <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">B2B Supplies (Sheet 1)</p>
                  <h4 className="text-xl font-bold text-white font-mono mt-1">₹{b2bTotals.taxable.toLocaleString('en-IN')}</h4>
                  <p className="text-[10px] text-indigo-400 mt-1">{b2bRows.length} GST Registered Client Records</p>
                </div>
                <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">B2C Supplies (Sheet 2)</p>
                  <h4 className="text-xl font-bold text-amber-300 font-mono mt-1">₹{b2cTotals.taxable.toLocaleString('en-IN')}</h4>
                  <p className="text-[10px] text-amber-400/80 mt-1">{b2cRows.length} State/Rate Tax Summaries</p>
                </div>
                <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">HSN (With GST - B2B)</p>
                  <h4 className="text-xl font-bold text-teal-300 font-mono mt-1">₹{hsnWithGstTotals.taxable.toLocaleString('en-IN')}</h4>
                  <p className="text-[10px] text-teal-400 mt-1">{hsnSummaryWithGstRows.length} Categories (Registered)</p>
                </div>
                <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800">
                  <p className="text-xs text-slate-400 font-medium">HSN (Without GST - B2C)</p>
                  <h4 className="text-xl font-bold text-cyan-300 font-mono mt-1">₹{hsnWithoutGstTotals.taxable.toLocaleString('en-IN')}</h4>
                  <p className="text-[10px] text-cyan-400 mt-1">{hsnSummaryWithoutGstRows.length} Categories (Unregistered)</p>
                </div>
              </div>
            </div>

            {/* Excel Sheet Tabs & Table Preview Container */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
                <div className="flex items-center gap-2 bg-dark-900 p-1.5 rounded-2xl border border-slate-800 w-fit flex-wrap">
                  <button
                    onClick={() => setGstrReportSubTab('b2b')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${gstrReportSubTab === 'b2b'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Sheet 1: b2b (With GST) ({b2bRows.length})
                  </button>
                  <button
                    onClick={() => setGstrReportSubTab('b2c')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${gstrReportSubTab === 'b2c'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Sheet 2: b2c (Without GST) ({b2cRows.length})
                  </button>
                  <button
                    onClick={() => setGstrReportSubTab('hsn_with_gst')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${gstrReportSubTab === 'hsn_with_gst'
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Sheet 3: HSN (With GST) ({hsnSummaryWithGstRows.length})
                  </button>
                  <button
                    onClick={() => setGstrReportSubTab('hsn_without_gst')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${gstrReportSubTab === 'hsn_without_gst'
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Sheet 4: HSN (Without GST) ({hsnSummaryWithoutGstRows.length})
                  </button>
                  <button
                    onClick={() => setGstrReportSubTab('hsn')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${gstrReportSubTab === 'hsn' || gstrReportSubTab === 'hsn_all'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Sheet 5: HSN (Total All) ({hsnSummaryRows.length})
                  </button>
                  <button
                    onClick={() => setGstrReportSubTab('doc')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${gstrReportSubTab === 'doc'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Sheet 6: document issued ({docIssuedRows.reduce((sum, d) => sum + (d.cancelled || 0), 0)} Cancelled)
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {companyName.toUpperCase()} — {periodLabel}
                  </span>
                </div>
              </div>

              {/* SHEET 1: B2B TABLE PREVIEW */}
              {gstrReportSubTab === 'b2b' && (
                <div className="space-y-3">
                  <div className="text-center py-2 bg-dark-950/80 border border-slate-800 rounded-xl text-xs font-bold font-mono tracking-wide text-emerald-300">
                    {companyName.toUpperCase()} {periodLabel} — B2B (WITH GST)
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-dark-900 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-3">SL NO</th>
                          <th className="py-3 px-3">Invoice No</th>
                          <th className="py-3 px-3">customer Name</th>
                          <th className="py-3 px-3">GST Number</th>
                          <th className="py-3 px-3">Invoice Date</th>
                          <th className="py-3 px-3 text-center">Tax of Rate</th>
                          <th className="py-3 px-3 text-right">Taxable Value</th>
                          <th className="py-3 px-3 text-right">IGST</th>
                          <th className="py-3 px-3 text-right">CGST</th>
                          <th className="py-3 px-3 text-right">SGST</th>
                          <th className="py-3 px-3">state of Supply</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                        {b2bRows.length > 0 ? (
                          b2bRows.map((r) => (
                            <tr key={r.slNo} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-2.5 px-3 text-slate-400">{r.slNo}</td>
                              <td className="py-2.5 px-3 font-bold text-white">{r.invoiceNo}</td>
                              <td className="py-2.5 px-3 font-sans text-slate-200">{r.customerName}</td>
                              <td className="py-2.5 px-3 text-emerald-400 font-bold">{r.gstNumber}</td>
                              <td className="py-2.5 px-3 text-slate-400">{r.invoiceDate}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-indigo-300">{r.taxRate}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-white">₹{r.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-right text-purple-300">₹{r.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-right text-indigo-300">₹{r.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-right text-indigo-300">₹{r.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 font-sans text-slate-300">{r.stateOfSupply}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="11" className="text-center py-8 text-slate-500 font-sans">
                              No B2B (GST registered customer) invoices found for {periodLabel}.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {b2bRows.length > 0 && (
                        <tfoot className="bg-dark-900/90 font-mono text-xs font-bold border-t border-slate-700 text-white">
                          <tr>
                            <td colSpan="6" className="py-3 px-3 text-emerald-400">TOTAL B2B SUMMARY</td>
                            <td className="py-3 px-3 text-right text-white">₹{b2bTotals.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-3 text-right text-purple-300">₹{b2bTotals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-3 text-right text-indigo-300">₹{b2bTotals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-3 text-right text-indigo-300">₹{b2bTotals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-3"></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* SHEET 2: B2C TABLE PREVIEW */}
              {gstrReportSubTab === 'b2c' && (
                <div className="space-y-3">
                  <div className="text-center py-2 bg-dark-950/80 border border-slate-800 rounded-xl text-xs font-bold font-mono tracking-wide text-amber-300">
                    {companyName.toUpperCase()} {periodLabel} — B2C (WITHOUT GST)
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-dark-900 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-3">SL NO</th>
                          <th className="py-3 px-3">Invoice No</th>
                          <th className="py-3 px-3">customer Name</th>
                          <th className="py-3 px-3">Invoice Date</th>
                          <th className="py-3 px-3 text-center">Tax Rate</th>
                          <th className="py-3 px-3 text-right">Taxable Value</th>
                          <th className="py-3 px-3 text-right">IGST</th>
                          <th className="py-3 px-3 text-right">CGST</th>
                          <th className="py-3 px-3 text-right">SGST</th>
                          <th className="py-3 px-3">State of Supply</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                        {b2cRows.length > 0 ? (
                          b2cRows.map((r) => (
                            <tr key={r.slNo} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-2.5 px-3 text-slate-400">{r.slNo}</td>
                              <td className="py-2.5 px-3 font-bold text-white">{r.invoiceNo}</td>
                              <td className="py-2.5 px-3 font-sans text-slate-200">{r.customerName}</td>
                              <td className="py-2.5 px-3 text-slate-400">{r.invoiceDate}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-amber-300">{r.taxRate}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-white">₹{r.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-right text-purple-300">₹{r.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-right text-indigo-300">₹{r.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-right text-indigo-300">₹{r.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 font-sans text-slate-300">{r.stateOfSupply}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center py-8 text-slate-500 font-sans">
                              No B2C (unregistered client) invoices found for {periodLabel}.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {b2cRows.length > 0 && (
                        <tfoot className="bg-dark-900/90 font-mono text-xs font-bold border-t border-slate-700 text-white">
                          <tr>
                            <td colSpan="5" className="py-3 px-3 text-amber-400">TOTAL B2C SUMMARY</td>
                            <td className="py-3 px-3 text-right text-white">₹{b2cTotals.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-3 text-right text-purple-300">₹{b2cTotals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-3 text-right text-indigo-300">₹{b2cTotals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-3 text-right text-indigo-300">₹{b2cTotals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-3"></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* SHEET 3/4/5: HSN SUMMARY TABLE PREVIEW (WITH GST, WITHOUT GST & ALL) */}
              {(gstrReportSubTab === 'hsn' || gstrReportSubTab === 'hsn_with_gst' || gstrReportSubTab === 'hsn_without_gst' || gstrReportSubTab === 'hsn_all') && (() => {
                const isWithGst = gstrReportSubTab === 'hsn_with_gst';
                const isWithoutGst = gstrReportSubTab === 'hsn_without_gst';
                const isAll = gstrReportSubTab === 'hsn' || gstrReportSubTab === 'hsn_all';

                const curRows = isWithGst ? hsnSummaryWithGstRows : isWithoutGst ? hsnSummaryWithoutGstRows : hsnSummaryRows;
                const curTotals = isWithGst ? hsnWithGstTotals : isWithoutGst ? hsnWithoutGstTotals : hsnTotals;
                const curTitle = isWithGst 
                  ? `${companyName.toUpperCase()} ${periodLabel} — HSN SUMMARY (WITH GST - B2B REGISTERED)`
                  : isWithoutGst
                    ? `${companyName.toUpperCase()} ${periodLabel} — HSN SUMMARY (WITHOUT GST - B2C UNREGISTERED)`
                    : `${companyName.toUpperCase()} ${periodLabel} — PRODUCT & SERVICE HSN SUMMARY (TOTAL ALL)`;

                return (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-dark-950/80 border border-slate-800 rounded-2xl">
                      <div className="text-xs font-bold font-mono tracking-wide text-cyan-300 px-2">
                        {curTitle}
                      </div>

                      {/* Filter Switcher Pill Controls */}
                      <div className="flex items-center gap-1.5 p-1 bg-dark-900 rounded-xl border border-slate-800 text-xs flex-wrap">
                        <button
                          type="button"
                          onClick={() => setGstrReportSubTab('hsn_with_gst')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            isWithGst
                              ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          With GST ({hsnSummaryWithGstRows.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setGstrReportSubTab('hsn_without_gst')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            isWithoutGst
                              ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Without GST ({hsnSummaryWithoutGstRows.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setGstrReportSubTab('hsn')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            isAll
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          All Combined ({hsnSummaryRows.length})
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-dark-900 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-3 px-3">Service & product name</th>
                            <th className="py-3 px-3">HSN</th>
                            <th className="py-3 px-3">Unit of Measurement</th>
                            <th className="py-3 px-3 text-right">Total Qty</th>
                            <th className="py-3 px-3 text-center">Tax Rate</th>
                            <th className="py-3 px-3 text-right">Total Taxable Value</th>
                            <th className="py-3 px-3 text-right">IGST</th>
                            <th className="py-3 px-3 text-right">CGST</th>
                            <th className="py-3 px-3 text-right">SGST</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                          {curRows.length > 0 ? (
                            curRows.map((r, i) => (
                              <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                <td className="py-2.5 px-3 font-sans font-medium text-white">{r.productName}</td>
                                <td className="py-2.5 px-3 font-bold text-cyan-400">{r.hsn}</td>
                                <td className="py-2.5 px-3 font-sans text-slate-400">{r.uom}</td>
                                <td className="py-2.5 px-3 text-right text-emerald-300">{r.totalQty}</td>
                                <td className="py-2.5 px-3 text-center font-bold text-cyan-300">{r.taxRate}</td>
                                <td className="py-2.5 px-3 text-right font-bold text-white">₹{r.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="py-2.5 px-3 text-right text-purple-300">₹{r.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="py-2.5 px-3 text-right text-indigo-300">₹{r.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="py-2.5 px-3 text-right text-indigo-300">₹{r.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="9" className="text-center py-8 text-slate-500 font-sans">
                                No product & service line items found for {periodLabel} ({isWithGst ? 'With GST' : isWithoutGst ? 'Without GST' : 'All'}).
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {curRows.length > 0 && (
                          <tfoot className="bg-dark-900/90 font-mono text-xs font-bold border-t border-slate-700 text-white">
                            <tr>
                              <td className="py-3 px-3 text-cyan-400">TOTAL</td>
                              <td colSpan="2" className="py-3 px-3 text-slate-400 font-sans text-[11px]">( will come total details to validate individual )</td>
                              <td className="py-3 px-3 text-right text-emerald-300">{Math.round(curTotals.qty * 100) / 100}</td>
                              <td className="py-3 px-3"></td>
                              <td className="py-3 px-3 text-right text-white">₹{curTotals.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3 px-3 text-right text-purple-300">₹{curTotals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3 px-3 text-right text-indigo-300">₹{curTotals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3 px-3 text-right text-indigo-300">₹{curTotals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* SHEET 4: DOCUMENT ISSUED TABLE PREVIEW */}
              {gstrReportSubTab === 'doc' && (
                <div className="space-y-4">
                  <div className="text-center py-2 bg-dark-950/80 border border-slate-800 rounded-xl text-xs font-bold font-mono tracking-wide text-purple-300">
                    {companyName.toUpperCase()} {periodLabel} — DOCUMENTS ISSUED (TABLE 13)
                  </div>

                  <div className="space-y-4">
                    {docIssuedRows.map((doc, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="text-xs font-bold text-slate-300 capitalize font-mono px-1">
                          {doc.docCategory}
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-slate-800">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-dark-900 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                              <tr>
                                <th className="py-3 px-3">Nature of Document</th>
                                <th className="py-3 px-3">sl No From</th>
                                <th className="py-3 px-3">Sl No To</th>
                                <th className="py-3 px-3 text-right">Total Count</th>
                                <th className="py-3 px-3 text-right">Cancelled</th>
                                <th className="py-3 px-3 text-right">Net issued</th>
                              </tr>
                            </thead>
                            <tbody className="font-mono text-slate-300">
                              <tr className="hover:bg-slate-800/30 transition-colors">
                                <td className="py-2.5 px-3 font-sans font-medium text-white">{doc.docName}</td>
                                <td className="py-2.5 px-3 font-bold text-emerald-400">{doc.slNoFrom}</td>
                                <td className="py-2.5 px-3 font-bold text-emerald-400">{doc.slNoTo}</td>
                                <td className="py-2.5 px-3 text-right font-bold text-white">{doc.totalCount}</td>
                                <td className="py-2.5 px-3 text-right text-rose-400">{doc.cancelled}</td>
                                <td className="py-2.5 px-3 text-right font-bold text-emerald-300">{doc.netIssued}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* SETTINGS TAB CONTENT */}
      {activeTab === 'settings' && (
        <UserSettings
          user={user}
          setUserData={setUserData}
          bankAccounts={bankAccounts}
          setBankAccounts={setBankAccounts}
          invoices={invoices}
          customers={customers}
          setCustomers={setCustomers}
          products={products}
          initialTab={settingsSubTab}
          ledgersList={ledgersList}
          setLedgersList={setLedgersList}
        />
      )}

      {/* MODAL 1: REGISTRATION ( CUSTOMER ) - Supports Add & Edit/Update */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-700 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">
                  {editingCustomer ? 'EDIT REGISTRATION ( Ledger )' : 'REGISTRATION ( Ledger )'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {editingCustomer ? `Update ledger details for ${editingCustomer.id}` : 'Create new customer ledger account'}
                </p>
              </div>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">NAME *</label>
                <input
                  type="text"
                  value={custForm.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setCustForm({ ...custForm, name: newName });
                    if (includeBankReg && (!custBankForm.accountName || custBankForm.accountName.endsWith(' - Account'))) {
                      setCustBankForm((prev) => ({
                        ...prev,
                        accountName: newName ? `${newName} - Account` : ''
                      }));
                    }
                  }}
                  placeholder="e.g. Apex Global Tech Pvt Ltd"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                  required
                />
              </div>

              {/* Do you have GST Number Toggle */}
              <div className="bg-dark-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-200">
                  Do you have GST Number? <span className="text-indigo-400 font-bold">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHasCustGst('Yes');
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${hasCustGst === 'Yes'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                        : 'bg-dark-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasCustGst === 'Yes' ? 'text-white' : 'text-slate-500'}`} />
                    YES (Registered)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasCustGst('No');
                      setCustForm(prev => ({ ...prev, gstNo: '' }));
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${hasCustGst === 'No'
                        ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-500 shadow-md shadow-rose-500/20'
                        : 'bg-dark-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                  >
                    <XCircle className={`w-3.5 h-3.5 ${hasCustGst === 'No' ? 'text-white' : 'text-slate-500'}`} />
                    NO (Unregistered / Exempt)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-200">Ledger *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomerModal(false);
                        setSettingsSubTab('ledgers');
                        setActiveTab('settings');
                      }}
                      className="text-[10px] text-brand-300 hover:text-white font-bold flex items-center gap-1 bg-brand-500/10 hover:bg-brand-500/20 px-2 py-0.5 rounded border border-brand-500/30 cursor-pointer transition-all"
                      title="Add, Edit, and Manage Ledgers in Settings"
                    >
                      <Sliders className="w-3 h-3 text-brand-400" /> Manage in Settings
                    </button>
                  </div>
                  <select
                    value={custForm.ledger}
                    onChange={(e) => setCustForm({ ...custForm, ledger: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-dark-900 font-semibold text-white"
                  >
                    {!ledgersList.some(l => l.name === custForm.ledger) && custForm.ledger && (
                      <option value={custForm.ledger}>{custForm.ledger}</option>
                    )}
                    {ledgersList.map((l) => (
                      <option key={l.id || l.name} value={l.name}>
                        {l.label || l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  {hasCustGst === 'Yes' ? (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-200">GST NO <span className="text-slate-500 font-normal">(15 digits)</span></label>
                        {custForm.gstNo?.length === 15 && (
                          <button
                            type="button"
                            onClick={() => handleFetchGstDetails()}
                            disabled={isFetchingGst}
                            className="text-[10px] text-brand-300 hover:text-white font-bold flex items-center gap-1 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/30 cursor-pointer transition-all"
                          >
                            {isFetchingGst ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                            {isFetchingGst ? 'Fetching...' : 'Fetch Details'}
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        maxLength="15"
                        value={custForm.gstNo}
                        onChange={(e) => handleCustGstChange(e.target.value)}
                        placeholder="33AAACD1234F1Z5"
                        className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono uppercase"
                      />
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">GST Status</label>
                      <div className="flex items-center h-[38px] px-3 rounded-xl bg-dark-900/50 border border-slate-800 text-slate-400 text-xs">
                        <span className="font-semibold text-amber-300 flex items-center gap-1.5 text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-amber-400" /> Unregistered Party (URP)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">PAN</label>
                  <input
                    type="text"
                    maxLength="10"
                    value={custForm.pan}
                    onChange={(e) => setCustForm({ ...custForm, pan: e.target.value.toUpperCase() })}
                    placeholder="AAACD1234F"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">MOBILE</label>
                  <input
                    type="text"
                    value={custForm.mobile}
                    onChange={(e) => setCustForm({ ...custForm, mobile: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">EMAIL</label>
                  <input
                    type="email"
                    value={custForm.email}
                    onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                    placeholder="billing@customer.com"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">STATE</label>
                  <SearchableDropdown
                    value={custForm.state}
                    onChange={(selectedState) => {
                      setCustForm((prev) => ({
                        ...prev,
                        state: selectedState,
                        city: prev.state !== selectedState ? '' : prev.city
                      }));
                    }}
                    options={INDIAN_STATES}
                    placeholder="Select State"
                    searchPlaceholder="Search Indian State..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">CITY</label>
                  <SearchableDropdown
                    value={custForm.city}
                    onChange={(selectedCity) => {
                      setCustForm((prev) => ({ ...prev, city: selectedCity }));
                    }}
                    options={custForm.state ? (INDIA_STATES_CITIES[custForm.state] || []) : []}
                    placeholder={custForm.state ? "Select City" : "Select State First"}
                    searchPlaceholder="Search City..."
                    disabled={!custForm.state}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">ADDRESS</label>
                <textarea
                  value={custForm.address}
                  onChange={(e) => setCustForm({ ...custForm, address: e.target.value })}
                  rows="2"
                  placeholder="Plot 42, Inner Ring Road, Chennai"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              {/* BANK / CASH REGISTRATION AT THE BOTTOM OF CUSTOMER FORM */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between bg-dark-900/60 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Register Bank / Cash Account</h4>
                      <p className="text-[11px] text-slate-400">Optionally create Bank/Cash ledger for this customer</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeBankReg}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIncludeBankReg(checked);
                        if (checked && !custBankForm.accountName && custForm.name) {
                          setCustBankForm((prev) => ({
                            ...prev,
                            accountName: `${custForm.name} - Account`
                          }));
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {includeBankReg && (
                  <div className="mt-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold font-mono text-emerald-400 uppercase tracking-wider">
                        New Bank / Cash Account Registration
                      </span>
                      <span className="text-[10px] text-slate-400">Will be saved to Bank / Cash Master</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Account Type *</label>
                        <select
                          value={custBankForm.bankType}
                          onChange={(e) => setCustBankForm({ ...custBankForm, bankType: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl glass-input text-xs bg-dark-950 font-semibold text-white"
                        >
                          <option value="Bank Account">🏦 Bank Account</option>
                          <option value="Cash in Hand">💵 Cash in Hand</option>
                          <option value="Petty Cash">🪙 Petty Cash</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Account / Ledger Name *</label>
                        <input
                          type="text"
                          value={custBankForm.accountName}
                          onChange={(e) => setCustBankForm({ ...custBankForm, accountName: e.target.value })}
                          placeholder="e.g. Customer Bank / Cash Account"
                          className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                          required={includeBankReg}
                        />
                      </div>
                    </div>

                    {custBankForm.bankType === 'Bank Account' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Bank Name</label>
                          <input
                            type="text"
                            value={custBankForm.bankName}
                            onChange={(e) => setCustBankForm({ ...custBankForm, bankName: e.target.value })}
                            placeholder="e.g. HDFC / SBI"
                            className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Account Number</label>
                          <input
                            type="text"
                            value={custBankForm.accountNumber}
                            onChange={(e) => setCustBankForm({ ...custBankForm, accountNumber: e.target.value })}
                            placeholder="987654321012"
                            className="w-full px-3 py-1.5 rounded-xl glass-input text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">IFSC Code</label>
                          <input
                            type="text"
                            value={custBankForm.ifscCode}
                            onChange={(e) => setCustBankForm({ ...custBankForm, ifscCode: e.target.value.toUpperCase() })}
                            placeholder="HDFC0001234"
                            className="w-full px-3 py-1.5 rounded-xl glass-input text-xs font-mono uppercase"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Opening Balance / Initial Deposit (₹)</label>
                      <input
                        type="number"
                        step="any"
                        value={custBankForm.balance}
                        onChange={(e) => setCustBankForm({ ...custBankForm, balance: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-3 py-1.5 rounded-xl glass-input text-xs font-mono font-bold text-emerald-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 cursor-pointer"
                >
                  {editingCustomer ? 'Update Customer' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRATION ( BANK / CASH ) - Supports Add & Edit/Update */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card-gold rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-amber-500/40 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-amber-500/20 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">
                  {editingBank ? 'EDIT REGISTRATION ( BANK / CASH )' : 'REGISTRATION ( BANK / CASH )'}
                </h3>
                <p className="text-xs text-amber-200/80 font-mono">
                  {editingBank ? `Update account ledger details for ${editingBank.id}` : 'Create new Bank or Cash Account Ledger'}
                </p>
              </div>
              <button onClick={() => setShowBankModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const isCashAcc = bankForm.bankType === 'Cash in Hand' || bankForm.bankType === 'Petty Cash';
              return (
                <form onSubmit={handleRegisterBankCash} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1">ACCOUNT CATEGORY *</label>
                    <select
                      value={bankForm.bankType}
                      onChange={(e) => setBankForm({ ...bankForm, bankType: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl glass-input glass-input-gold text-xs bg-dark-950 font-semibold"
                    >
                      <option value="Bank Account">Bank Account</option>
                      <option value="Cash in Hand">Cash in Hand</option>
                      <option value="Petty Cash">Petty Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1">
                      {isCashAcc ? 'NAME OF THE CASH ACCOUNT *' : 'NAME OF THE BANK *'}
                    </label>
                    <input
                      type="text"
                      value={bankForm.accountName}
                      onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                      placeholder={isCashAcc ? 'e.g. Main Cash Drawer / Petty Cash Ledger' : 'e.g. Durai Tax Advisory Operating A/C'}
                      className="w-full px-3.5 py-2 rounded-xl glass-input glass-input-gold text-xs"
                      required
                    />
                  </div>

                  {!isCashAcc && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-amber-200 mb-1">ACCOUNT NUMBER *</label>
                        <input
                          type="text"
                          value={bankForm.accountNumber}
                          onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                          placeholder="50100234901234"
                          className="w-full px-3.5 py-2 rounded-xl glass-input glass-input-gold text-xs font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-amber-200 mb-1">IFSC CODE</label>
                        <input
                          type="text"
                          value={bankForm.ifscCode}
                          onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                          placeholder="HDFC0001234"
                          className="w-full px-3.5 py-2 rounded-xl glass-input glass-input-gold text-xs font-mono uppercase"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1">OPENING LEDGER BALANCE (₹)</label>
                    <input
                      type="number"
                      value={bankForm.balance}
                      onChange={(e) => setBankForm({ ...bankForm, balance: e.target.value })}
                      placeholder="150000"
                      className="w-full px-3.5 py-2 rounded-xl glass-input glass-input-gold text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1">
                      {isCashAcc ? 'LOCATION / STORAGE ADDRESS' : 'BRANCH ADDRESS'}
                    </label>
                    <input
                      type="text"
                      value={bankForm.address}
                      onChange={(e) => setBankForm({ ...bankForm, address: e.target.value })}
                      placeholder={isCashAcc ? 'e.g. Office Safe / Petty Cash Box' : 'Branch Address e.g. Anna Salai Chennai'}
                      className="w-full px-3.5 py-2 rounded-xl glass-input glass-input-gold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1">DATE</label>
                    <input
                      type="date"
                      value={bankForm.date}
                      onChange={(e) => setBankForm({ ...bankForm, date: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl glass-input glass-input-gold text-xs font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowBankModal(false)}
                      className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                    >
                      {editingBank ? 'Update Account' : 'Register Account'}
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 3a: REGISTRATION ( PRODUCTS / GOODS ) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-700 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">
                  {editingProduct ? 'EDIT REGISTRATION ( PRODUCT / GOODS )' : 'REGISTRATION ( PRODUCT / GOODS )'}
                </h3>
                <p className="text-xs text-emerald-400 font-mono">
                  Configure goods master details with HSN Code & Opening Stock
                </p>
              </div>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  NAME OF THE PRODUCT *
                </label>
                <input
                  type="text"
                  value={productForm.itemName}
                  onChange={(e) => setProductForm({ ...productForm, itemName: e.target.value })}
                  placeholder="e.g. Dell XPS 15 Laptop"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">QTY Unit *</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-dark-900 font-semibold text-emerald-400"
                  >
                    <option value="Pices">Pices</option>
                    <option value="Number">Number</option>
                    <option value="Box">Box</option>
                    <option value="Kg">Kg</option>
                    <option value="Liter">Liter</option>
                    <option value="Meter">Meter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">HSN CODE *</label>
                  <input
                    type="text"
                    value={productForm.hsnCode}
                    onChange={(e) => setProductForm({ ...productForm, hsnCode: e.target.value })}
                    placeholder="847130"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">OPENING STOCK</label>
                  <input
                    type="number"
                    value={productForm.openingStock}
                    onChange={(e) => setProductForm({ ...productForm, openingStock: e.target.value })}
                    placeholder="100"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">DATE *</label>
                  <input
                    type="date"
                    value={productForm.date}
                    onChange={(e) => setProductForm({ ...productForm, date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">GST TAX PERCENT (%)</label>
                  <select
                    value={productForm.taxPercent}
                    onChange={(e) => setProductForm({ ...productForm, taxPercent: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-dark-900 font-semibold"
                  >
                    {(() => {
                      let rates = ['0', '5', '12', '18', '28'];
                      try {
                        const saved = localStorage.getItem(`billson_custom_tax_rates_${user?.id}`) || localStorage.getItem(`taxpulse_custom_tax_rates_${user?.id}`);
                        if (saved) {
                          const parsed = JSON.parse(saved);
                          if (Array.isArray(parsed) && parsed.length > 0) rates = parsed;
                        }
                      } catch (e) { }
                      const currentStr = String(productForm.taxPercent || '18');
                      if (currentStr && !rates.includes(currentStr)) {
                        rates = [...rates, currentStr].sort((a, b) => parseFloat(a) - parseFloat(b));
                      }
                      return rates.map((r) => (
                        <option key={r} value={r}>
                          {r}% GST {r === '18' ? '(Standard)' : r === '0' ? '(Exempted)' : ''}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  {editingProduct ? 'Update Product' : 'Register Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3b: REGISTRATION ( SERVICES ) */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-700 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">
                  {editingService ? 'EDIT REGISTRATION ( SERVICE )' : 'REGISTRATION ( SERVICE )'}
                </h3>
                <p className="text-xs text-cyan-400 font-mono">
                  Configure service master details with SAC / HSN Code
                </p>
              </div>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterService} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  NAME OF THE SERVICE *
                </label>
                <input
                  type="text"
                  value={serviceForm.serviceName}
                  onChange={(e) => setServiceForm({ ...serviceForm, serviceName: e.target.value })}
                  placeholder="e.g. Monthly GST Audit Service"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">SAC / HSN CODE</label>
                <input
                  type="text"
                  value={serviceForm.hsnCode}
                  onChange={(e) => setServiceForm({ ...serviceForm, hsnCode: e.target.value })}
                  placeholder="998222"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">DATE *</label>
                  <input
                    type="date"
                    value={serviceForm.date}
                    onChange={(e) => setServiceForm({ ...serviceForm, date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">GST TAX PERCENT (%)</label>
                  <select
                    value={serviceForm.taxPercent}
                    onChange={(e) => setServiceForm({ ...serviceForm, taxPercent: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-dark-900 font-semibold"
                  >
                    {(() => {
                      let rates = ['0', '5', '12', '18', '28'];
                      try {
                        const saved = localStorage.getItem(`billson_custom_tax_rates_${user?.id}`) || localStorage.getItem(`taxpulse_custom_tax_rates_${user?.id}`);
                        if (saved) {
                          const parsed = JSON.parse(saved);
                          if (Array.isArray(parsed) && parsed.length > 0) rates = parsed;
                        }
                      } catch (e) { }
                      const currentStr = String(serviceForm.taxPercent || '18');
                      if (currentStr && !rates.includes(currentStr)) {
                        rates = [...rates, currentStr].sort((a, b) => parseFloat(a) - parseFloat(b));
                      }
                      return rates.map((r) => (
                        <option key={r} value={r}>
                          {r}% GST {r === '18' ? '(Standard)' : r === '0' ? '(Exempted)' : ''}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 cursor-pointer"
                >
                  {editingService ? 'Update Service' : 'Register Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail View Modal */}
      {selectedCustomerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-700 shadow-2xl animate-slide-up space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Users className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono border border-brand-500/30 whitespace-nowrap">{selectedCustomerDetail.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold whitespace-nowrap">
                      {selectedCustomerDetail.ledger || 'SUNDRY DEBTORS'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-serif mt-1">{selectedCustomerDetail.name}</h3>
                </div>
              </div>
              <button onClick={() => setSelectedCustomerDetail(null)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-dark-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">GSTIN NUMBER</span>
                <span className="text-indigo-300 font-bold">{selectedCustomerDetail.gstNumber || selectedCustomerDetail.gst_number || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">PAN NUMBER</span>
                <span className="text-white font-bold">{selectedCustomerDetail.panNumber || selectedCustomerDetail.pan_number || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">MOBILE NUMBER</span>
                <span className="text-white font-bold">{selectedCustomerDetail.phone || selectedCustomerDetail.mobile || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">EMAIL ADDRESS</span>
                <span className="text-white font-bold truncate block">{selectedCustomerDetail.email || 'N/A'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-dark-900 border border-slate-800 text-xs font-mono space-y-1">
              <span className="text-slate-500 block text-[10px]">REGISTERED ADDRESS</span>
              <p className="text-slate-200">{selectedCustomerDetail.address || `${selectedCustomerDetail.city || 'Chennai'}, ${selectedCustomerDetail.state || 'Tamil Nadu'}`}</p>
            </div>

            {(() => {
              const linkedBank = bankAccounts.find((b) => {
                const accName = (b.accountName || b.account_name || '').toLowerCase();
                const custName = (selectedCustomerDetail?.name || '').toLowerCase();
                const bAddr = (b.address || '').toLowerCase();
                return (
                  (custName && accName.includes(custName)) ||
                  (custName && bAddr.includes(custName)) ||
                  (custName && bAddr.includes('linked to'))
                );
              });

              if (!linkedBank) return null;

              return (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5 text-amber-400" /> LINKED BANK / CASH ACCOUNT
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      {linkedBank.bankType || linkedBank.bank_type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="text-xs font-bold text-white">{linkedBank.accountName || linkedBank.account_name}</div>
                      <div className="text-[11px] text-slate-400">
                        A/C: {linkedBank.accountNumber || linkedBank.account_number} • {linkedBank.bankName || linkedBank.bank_name || 'Cash'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Balance</span>
                      <span className="text-xs font-bold text-emerald-400">₹{(linkedBank.balance || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono">Total Billed Revenue</span>
                <h4 className="text-xl font-bold font-mono text-emerald-400">₹{(selectedCustomerDetail.totalBilled || selectedCustomerDetail.total_billed || 0).toLocaleString('en-IN')}</h4>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-semibold border border-emerald-500/30">Active Customer</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const cust = selectedCustomerDetail;
                  setSelectedCustomerDetail(null);
                  handleOpenEditCustomer(cust);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all"
              >
                <Pencil className="w-4 h-4" /> Edit Customer
              </button>
              <button
                onClick={() => setSelectedCustomerDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Account Detail View Modal */}
      {selectedBankDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card-gold rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-amber-500/30 shadow-2xl animate-slide-up space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Landmark className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30 whitespace-nowrap">{selectedBankDetail.id}</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30 whitespace-nowrap">
                      {selectedBankDetail.bankType || selectedBankDetail.bank_type}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-serif mt-1">{selectedBankDetail.accountName || selectedBankDetail.account_name}</h3>
                </div>
              </div>
              <button onClick={() => setSelectedBankDetail(null)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-dark-900 border border-amber-500/20">
                <span className="text-amber-200/60 block text-[10px]">NAME OF BANK</span>
                <span className="text-white font-bold truncate block">{selectedBankDetail.bankName || selectedBankDetail.bank_name || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-amber-500/20">
                <span className="text-amber-200/60 block text-[10px]">ACCOUNT NUMBER</span>
                <span className="text-amber-300 font-bold truncate block">{selectedBankDetail.accountNumber || selectedBankDetail.account_number}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-amber-500/20">
                <span className="text-amber-200/60 block text-[10px]">IFSC CODE</span>
                <span className="text-white font-bold">{selectedBankDetail.ifscCode || selectedBankDetail.ifsc_code || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-amber-500/20">
                <span className="text-amber-200/60 block text-[10px]">DATE</span>
                <span className="text-amber-300 font-bold">{selectedBankDetail.date || (selectedBankDetail.created_at ? new Date(selectedBankDetail.created_at).toISOString().split('T')[0] : '2026-09-08')}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-amber-500/20">
                <span className="text-amber-200/60 block text-[10px]">STATUS</span>
                <span className="text-emerald-400 font-bold">{selectedBankDetail.status || 'Active'}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-amber-500/20">
                <span className="text-amber-200/60 block text-[10px]">ACCOUNT TYPE</span>
                <span className="text-amber-300 font-bold truncate block">{selectedBankDetail.bankType || selectedBankDetail.bank_type || 'Bank Account'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-dark-900 border border-amber-500/20 text-xs font-mono space-y-1">
              <span className="text-amber-200/60 block text-[10px]">BRANCH / ADDRESS</span>
              <p className="text-slate-200">{selectedBankDetail.address || 'Chennai Central'}</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono">Current Ledger Balance</span>
                <h4 className="text-xl font-bold font-mono text-emerald-400">₹{(selectedBankDetail.balance || 0).toLocaleString('en-IN')}</h4>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-semibold border border-emerald-500/30">Operational</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const bank = selectedBankDetail;
                  setSelectedBankDetail(null);
                  handleOpenEditBank(bank);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition-all"
              >
                <Pencil className="w-4 h-4" /> Edit Account
              </button>
              <button
                onClick={() => setSelectedBankDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product / Service Detail View Modal */}
      {selectedServiceDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-700 shadow-2xl animate-slide-up space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Package className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono border border-brand-500/30 whitespace-nowrap">{selectedServiceDetail.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono whitespace-nowrap">
                      Unit: {selectedServiceDetail.unit || 'Pices'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-serif mt-1">{selectedServiceDetail.title}</h3>
                </div>
              </div>
              <button onClick={() => setSelectedServiceDetail(null)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const isService = (selectedServiceDetail.category || '').toLowerCase().includes('service') || (selectedServiceDetail.unit || '').toLowerCase().includes('service') || String(selectedServiceDetail.hsnSac || selectedServiceDetail.hsn_sac || '').startsWith('99');
              const itemDate = selectedServiceDetail.date || (selectedServiceDetail.created_at ? new Date(selectedServiceDetail.created_at).toISOString().split('T')[0] : '2026-09-07');
              return (
                <>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-dark-900 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">HSN / SAC CODE</span>
                      <span className="text-indigo-300 font-bold">{selectedServiceDetail.hsnSac || selectedServiceDetail.hsn_sac || 'N/A'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-dark-900 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">GST TAX RATE</span>
                      <span className="text-emerald-400 font-bold">{selectedServiceDetail.taxPercent || selectedServiceDetail.tax_percent || 18}% GST</span>
                    </div>
                    <div className="p-3 rounded-xl bg-dark-900 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">CATEGORY</span>
                      <span className="text-white font-bold">{selectedServiceDetail.category || 'Sales / Service Item'}</span>
                    </div>
                    {!isService && (
                      <div className="p-3 rounded-xl bg-dark-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">OPENING STOCK</span>
                        <span className="text-emerald-400 font-bold">{selectedServiceDetail.openingStock !== undefined ? selectedServiceDetail.openingStock : (selectedServiceDetail.opening_stock !== undefined ? selectedServiceDetail.opening_stock : 100)} Units</span>
                      </div>
                    )}
                  </div>

                  {!isService && (
                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 font-mono">Date</span>
                        <h4 className="text-base font-bold font-mono text-emerald-400">{itemDate}</h4>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-semibold border border-emerald-500/30">Active Item</span>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const item = selectedServiceDetail;
                  setSelectedServiceDetail(null);
                  handleOpenEditItem(item);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-all"
              >
                <Pencil className="w-4 h-4" /> Edit Item
              </button>
              <button
                onClick={() => setSelectedServiceDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl p-6 max-w-lg w-full border border-slate-700 shadow-2xl animate-slide-up">
            {(() => {
              const invNum = selectedInvoice.invoiceNumber || selectedInvoice.invoice_number || '';
              const docType = selectedInvoice.documentType || selectedInvoice.document_type || (
                invNum.startsWith('PUR') ? 'Purchase Invoice' :
                  invNum.startsWith('EST') ? 'Estimate' :
                    invNum.startsWith('DC') ? 'Delivery Challan' :
                      invNum.startsWith('PAY') ? 'Payment Voucher' :
                        invNum.startsWith('REC') ? 'Receipt Voucher' : 'Tax Invoice'
              );

              let badgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
              let displayTitle = 'TAX INVOICE';
              if (docType.toLowerCase().includes('estimate') || invNum.startsWith('EST')) {
                badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                displayTitle = 'ESTIMATE';
              } else if (docType.toLowerCase().includes('purchase') || invNum.startsWith('PUR')) {
                badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                displayTitle = 'PURCHASE INVOICE';
              } else if (docType.toLowerCase().includes('challan') || invNum.startsWith('DC')) {
                badgeColor = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
                displayTitle = 'DELIVERY CHALLAN';
              } else if (docType.toLowerCase().includes('payment') || invNum.startsWith('PAY')) {
                badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
                displayTitle = 'PAYMENT VOUCHER';
              } else if (docType.toLowerCase().includes('receipt') || invNum.startsWith('REC')) {
                badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
                displayTitle = 'RECEIPT VOUCHER';
              }

              return (
                <>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                          {displayTitle}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white font-serif">{invNum}</h3>
                      <p className="text-xs text-slate-400 font-mono">Party: {selectedInvoice.customerName || selectedInvoice.customer_name || selectedInvoice.paidTo || 'Valued Party'}</p>
                    </div>
                    <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-white cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs text-slate-300 font-mono">
                    <p><span className="text-slate-500">GSTIN:</span> {selectedInvoice.customerGst || selectedInvoice.customer_gst || 'N/A'}</p>
                    <p><span className="text-slate-500">Date / Due:</span> {selectedInvoice.date} / {selectedInvoice.dueDate || selectedInvoice.due_date || selectedInvoice.date}</p>
                    <div className="p-3 rounded-xl bg-dark-900 border border-slate-800 space-y-1">
                      <p className="flex justify-between"><span>Subtotal:</span> <span>₹{(selectedInvoice.subtotal || 0).toLocaleString('en-IN')}</span></p>
                      {parseFloat(selectedInvoice.igst || 0) > 0 || selectedInvoice.taxType === 'interstate' ? (
                        <p className="flex justify-between text-indigo-300">
                          <span>Integrated IGST (18%):</span>
                          <span>₹{(selectedInvoice.igst || selectedInvoice.totalTax || 0).toLocaleString('en-IN')}</span>
                        </p>
                      ) : (
                        <>
                          <p className="flex justify-between text-indigo-300">
                            <span>Central CGST (9%):</span>
                            <span>₹{(selectedInvoice.cgst !== undefined ? selectedInvoice.cgst : (selectedInvoice.totalTax || 0) / 2).toLocaleString('en-IN')}</span>
                          </p>
                          <p className="flex justify-between text-indigo-300">
                            <span>State SGST (9%):</span>
                            <span>₹{(selectedInvoice.sgst !== undefined ? selectedInvoice.sgst : (selectedInvoice.totalTax || 0) / 2).toLocaleString('en-IN')}</span>
                          </p>
                        </>
                      )}
                      <p className="flex justify-between text-emerald-400"><span>Total Tax:</span> <span>₹{(selectedInvoice.totalTax || selectedInvoice.total_tax || 0).toLocaleString('en-IN')}</span></p>
                      <p className="flex justify-between font-bold text-white pt-1 border-t border-slate-800"><span>Grand Total:</span> <span className="text-emerald-400">₹{(selectedInvoice.grandTotal || selectedInvoice.grand_total || 0).toLocaleString('en-IN')}</span></p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 mt-6">
                    {(selectedInvoice.status || '').toLowerCase() === 'cancelled' ? (
                      <button
                        onClick={() => {
                          handleRestoreInvoice(selectedInvoice);
                          setSelectedInvoice(null);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-bold cursor-pointer transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Restore Invoice
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleCancelInvoice(selectedInvoice);
                          setSelectedInvoice(null);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold cursor-pointer transition-all"
                      >
                        <Ban className="w-3.5 h-3.5" /> Cancel Invoice
                      </button>
                    )}

                    <button
                      onClick={() => {
                        generateInvoicePDF(selectedInvoice, user);
                        addToast(`${displayTitle} PDF generated for ${invNum}`, 'success');
                        setSelectedInvoice(null);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all shadow-lg shadow-indigo-600/30"
                    >
                      <Download className="w-4 h-4" /> Download {displayTitle} PDF / Print
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Global Glassmorphic Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className={`glass-card rounded-3xl p-6 max-w-md w-full border shadow-2xl animate-slide-up ${deleteModal.iconType === 'restore'
              ? 'border-emerald-500/30'
              : deleteModal.iconType === 'cancel'
                ? 'border-rose-500/30'
                : 'border-red-500/30'
            }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl border ${deleteModal.iconType === 'restore'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : deleteModal.iconType === 'cancel'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                {deleteModal.iconType === 'restore' ? (
                  <RefreshCw className="w-6 h-6 text-emerald-400" />
                ) : deleteModal.iconType === 'cancel' ? (
                  <Ban className="w-6 h-6 text-rose-400" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{deleteModal.title || 'Confirm Action'}</h3>
                <p className="text-xs text-slate-400 font-mono">{deleteModal.subtitle || 'This action is permanent'}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              {deleteModal.message}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, title: '', message: '', onConfirm: null })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                {deleteModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = deleteModal.onConfirm;
                  setDeleteModal({ isOpen: false, title: '', message: '', onConfirm: null });
                  if (typeof action === 'function') {
                    try {
                      action();
                    } catch (err) {
                      console.error('Error executing modal action:', err);
                    }
                  }
                }}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer shadow-lg ${deleteModal.confirmColor || 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                  }`}
              >
                {deleteModal.confirmText || 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
