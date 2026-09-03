import React, { useState, useEffect } from 'react';
import { 
  Receipt, DollarSign, FileText, PieChart, Users, ShoppingBag, 
  CreditCard, TrendingUp, Clock, CheckCircle2, AlertCircle, 
  Plus, Search, Filter, Download, ArrowUpRight, ChevronRight, Eye, ShieldCheck,
  Building, Landmark, Package, X, Check, Pencil, Trash2, Edit3, AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

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
  user
}) => {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State Triggers
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  // Edit states
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingBank, setEditingBank] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Delete Confirmation Modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // View Invoice Detail Modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // 1. REGISTRATION ( CUSTOMER ) Form State
  const [custForm, setCustForm] = useState({
    name: '',
    ledger: 'SUNDRY DEBTORS', // SUNDRY CREDITORS / SUNDRY DEBTORS
    address: '',
    gstNo: '',
    pan: '',
    mobile: '',
    email: '',
    city: 'Chennai',
    state: 'Tamil Nadu'
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
    balance: 150000
  });

  // 3. REGISTRATION ( SALES / SERVICES ) Form State
  const [itemForm, setItemForm] = useState({
    itemName: '',
    unit: 'Pices', // Pices / Number / Hours / Months
    hsnCode: '',
    openingStock: '100',
    rate: '12500',
    taxPercent: '18',
    category: 'Sales / Service Item'
  });

  // Auto-fill PAN when GSTIN is typed in Customer Form
  const handleCustGstChange = (val) => {
    const uppercaseVal = val.toUpperCase();
    setCustForm((prev) => {
      let updatedPan = prev.pan;
      if (uppercaseVal.length === 15) {
        const extracted = uppercaseVal.substring(2, 12);
        if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(extracted)) {
          updatedPan = extracted;
        }
      }
      return { ...prev, gstNo: uppercaseVal, pan: updatedPan };
    });
  };

  // ----------------------------------------------------
  // 1. CUSTOMER HANDLERS (Create, Edit, Update, Delete)
  // ----------------------------------------------------
  const handleOpenNewCustomer = () => {
    setEditingCustomer(null);
    setCustForm({
      name: '',
      ledger: 'SUNDRY DEBTORS',
      address: '',
      gstNo: '',
      pan: '',
      mobile: '',
      email: '',
      city: 'Chennai',
      state: 'Tamil Nadu'
    });
    setShowCustomerModal(true);
  };

  const handleOpenEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setCustForm({
      name: customer.name || '',
      ledger: customer.ledger || 'SUNDRY DEBTORS',
      address: customer.address || '',
      gstNo: customer.gstNumber || customer.gst_number || '',
      pan: customer.panNumber || customer.pan_number || '',
      mobile: customer.phone || customer.mobile || '',
      email: customer.email || '',
      city: customer.city || 'Chennai',
      state: customer.state || 'Tamil Nadu'
    });
    setShowCustomerModal(true);
  };

  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    if (!custForm.name.trim() || !custForm.gstNo.trim()) {
      addToast('Customer NAME and GST NO are required', 'error');
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
        city: custForm.city || editingCustomer.city || 'Chennai',
        state: custForm.state || editingCustomer.state || 'Tamil Nadu'
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
      const custId = `CUST-00${customers.length + 1}`;
      const newCustomer = {
        id: custId,
        name: custForm.name,
        ledger: custForm.ledger,
        address: custForm.address,
        gstNumber: custForm.gstNo,
        panNumber: custForm.pan,
        phone: custForm.mobile || '+91 98765 43210',
        email: custForm.email || `${custForm.name.toLowerCase().replace(/\s+/g, '')}@demo.com`,
        city: custForm.city || 'Chennai',
        state: custForm.state || 'Tamil Nadu',
        totalBilled: 0,
        status: 'Active'
      };

      setCustomers([newCustomer, ...customers]);
      api.registerCustomer({
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

      addToast(`REGISTRATION (CUSTOMER) complete for ${custForm.name}!`, 'success', 'Customer Registered');
    }

    setShowCustomerModal(false);
    setEditingCustomer(null);
    setCustForm({ name: '', ledger: 'SUNDRY DEBTORS', address: '', gstNo: '', pan: '', mobile: '', email: '', city: 'Chennai', state: 'Tamil Nadu' });
  };

  const handleDeleteCustomer = (customer) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Customer Ledger',
      message: `Are you sure you want to delete "${customer.name}" (${customer.id})? All associated records will be removed.`,
      onConfirm: () => {
        setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
        api.deleteCustomer(customer.id);
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
      balance: 150000
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
      balance: bank.balance !== undefined ? bank.balance : 150000
    });
    setShowBankModal(true);
  };

  const handleRegisterBankCash = async (e) => {
    e.preventDefault();
    if (!bankForm.accountName.trim() || !bankForm.accountNumber.trim()) {
      addToast('NAME OF ACCOUNT and ACCOUNT NUMBER are required', 'error');
      return;
    }

    if (editingBank) {
      // UPDATE existing bank
      const updatedBank = {
        ...editingBank,
        bankType: bankForm.bankType,
        accountName: bankForm.accountName,
        accountNumber: bankForm.accountNumber,
        bankName: bankForm.bankName || 'Standard Chartered Bank',
        ifscCode: bankForm.ifscCode || 'SCBL0001122',
        address: bankForm.address || 'Chennai Central Branch',
        balance: parseFloat(bankForm.balance) || editingBank.balance || 0
      };

      setBankAccounts((prev) => prev.map((b) => b.id === editingBank.id ? updatedBank : b));
      api.updateBankAccount(editingBank.id, {
        bankType: bankForm.bankType,
        accountName: bankForm.accountName,
        accountNumber: bankForm.accountNumber,
        bankName: bankForm.bankName,
        ifscCode: bankForm.ifscCode,
        address: bankForm.address,
        balance: parseFloat(bankForm.balance)
      });

      addToast(`Bank / Cash Account "${bankForm.accountName}" updated successfully!`, 'success', 'Account Updated');
    } else {
      // CREATE new bank
      const bankId = `BANK-00${bankAccounts.length + 1}`;
      const newBank = {
        id: bankId,
        bankType: bankForm.bankType,
        accountName: bankForm.accountName,
        accountNumber: bankForm.accountNumber,
        bankName: bankForm.bankName || 'Standard Chartered Bank',
        ifscCode: bankForm.ifscCode || 'SCBL0001122',
        address: bankForm.address || 'Chennai Central Branch',
        balance: parseFloat(bankForm.balance) || 150000,
        status: 'Active'
      };

      setBankAccounts([newBank, ...bankAccounts]);
      api.registerBankCash({
        bankType: bankForm.bankType,
        accountName: bankForm.accountName,
        accountNumber: bankForm.accountNumber,
        bankName: bankForm.bankName,
        ifscCode: bankForm.ifscCode,
        address: bankForm.address
      });

      addToast(`REGISTRATION (BANK / CASH) complete for ${bankForm.accountName}!`, 'success', 'Bank Account Registered');
    }

    setShowBankModal(false);
    setEditingBank(null);
    setBankForm({ bankType: 'Bank Account', accountName: '', accountNumber: '', bankName: '', ifscCode: '', address: '', balance: 150000 });
  };

  const handleDeleteBank = (bank) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Bank / Cash Account',
      message: `Are you sure you want to delete "${bank.accountName}" (${bank.accountNumber})? This ledger will no longer be available for payments.`,
      onConfirm: () => {
        setBankAccounts((prev) => prev.filter((b) => b.id !== bank.id));
        api.deleteBankAccount(bank.id);
        addToast(`Account "${bank.accountName}" deleted successfully.`, 'info', 'Account Deleted');
      }
    });
  };

  // ----------------------------------------------------
  // 3. SALES / SERVICES HANDLERS (Create, Edit, Update, Delete)
  // ----------------------------------------------------
  const handleOpenNewItem = () => {
    setEditingItem(null);
    setItemForm({
      itemName: '',
      unit: 'Pices',
      hsnCode: '',
      openingStock: '100',
      rate: '12500',
      taxPercent: '18',
      category: 'Sales / Service Item'
    });
    setShowItemModal(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      itemName: item.title || '',
      unit: item.unit || 'Pices',
      hsnCode: item.hsnSac || item.hsn_sac || '',
      openingStock: item.openingStock !== undefined ? String(item.openingStock) : (item.opening_stock !== undefined ? String(item.opening_stock) : '100'),
      rate: item.rate !== undefined ? String(item.rate) : '12500',
      taxPercent: item.taxPercent !== undefined ? String(item.taxPercent) : (item.tax_percent !== undefined ? String(item.tax_percent) : '18'),
      category: item.category || 'Sales / Service Item'
    });
    setShowItemModal(true);
  };

  const handleRegisterSalesService = async (e) => {
    e.preventDefault();
    if (!itemForm.itemName.trim() || !itemForm.hsnCode.trim()) {
      addToast('NAME OF ITEM and HSN CODE are required', 'error');
      return;
    }

    if (editingItem) {
      // UPDATE existing item
      const updatedItem = {
        ...editingItem,
        title: itemForm.itemName,
        unit: itemForm.unit,
        hsnSac: itemForm.hsnCode,
        openingStock: parseInt(itemForm.openingStock) || 0,
        rate: parseFloat(itemForm.rate) || 12500,
        taxPercent: parseFloat(itemForm.taxPercent) || 18,
        category: itemForm.category || editingItem.category || 'Sales / Service Item'
      };

      setProducts((prev) => prev.map((p) => p.id === editingItem.id ? updatedItem : p));
      api.updateProduct(editingItem.id, {
        title: itemForm.itemName,
        unit: itemForm.unit,
        hsnSac: itemForm.hsnCode,
        openingStock: parseInt(itemForm.openingStock) || 0,
        rate: parseFloat(itemForm.rate) || 12500,
        taxPercent: parseFloat(itemForm.taxPercent) || 18,
        category: itemForm.category
      });

      addToast(`Item / Service "${itemForm.itemName}" updated successfully!`, 'success', 'Item Updated');
    } else {
      // CREATE new item
      const itemId = `SRV-00${products.length + 1}`;
      const newItem = {
        id: itemId,
        title: itemForm.itemName,
        unit: itemForm.unit,
        hsnSac: itemForm.hsnCode,
        openingStock: parseInt(itemForm.openingStock) || 0,
        rate: parseFloat(itemForm.rate) || 12500,
        taxPercent: parseFloat(itemForm.taxPercent) || 18,
        category: itemForm.category || 'Sales / Service Item'
      };

      setProducts([newItem, ...products]);
      api.registerSalesService({
        title: itemForm.itemName,
        unit: itemForm.unit,
        hsnSac: itemForm.hsnCode,
        openingStock: parseInt(itemForm.openingStock) || 0,
        rate: parseFloat(itemForm.rate) || 12500,
        taxPercent: parseFloat(itemForm.taxPercent) || 18,
        category: itemForm.category
      });

      addToast(`REGISTRATION (SALES / SERVICES) complete for ${itemForm.itemName}!`, 'success', 'Item Registered');
    }

    setShowItemModal(false);
    setEditingItem(null);
    setItemForm({ itemName: '', unit: 'Pices', hsnCode: '', openingStock: '100', rate: '12500', taxPercent: '18', category: 'Sales / Service Item' });
  };

  const handleDeleteItem = (item) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Item / Service',
      message: `Are you sure you want to delete "${item.title}" (${item.id})? It will be removed from item catalogs.`,
      onConfirm: () => {
        setProducts((prev) => prev.filter((p) => p.id !== item.id));
        api.deleteProduct(item.id);
        addToast(`Item "${item.title}" deleted successfully.`, 'info', 'Item Deleted');
      }
    });
  };

  // ----------------------------------------------------
  // 4. INVOICES HANDLERS (Mark Paid, Delete)
  // ----------------------------------------------------
  const handleDeleteInvoice = (inv) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Tax Invoice',
      message: `Are you sure you want to delete Tax Invoice "${inv.invoiceNumber}" for ${inv.customerName}?`,
      onConfirm: () => {
        setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
        api.deleteInvoice(inv.id);
        addToast(`Invoice ${inv.invoiceNumber} deleted successfully.`, 'info', 'Invoice Deleted');
      }
    });
  };

  const handleMarkAsPaid = (invId) => {
    setInvoices((prev) => prev.map((inv) => inv.id === invId ? { ...inv, status: 'Paid' } : inv));
    api.updateInvoice(invId, { status: 'Paid' });
    addToast('Invoice updated to Paid status!', 'success');
  };

  // Financial Stat calculations
  const totalInvoicesCount = invoices.length;
  const totalSales = invoices.reduce((acc, inv) => acc + (inv.grandTotal || inv.grand_total || 0), 0);
  const totalTax = invoices.reduce((acc, inv) => acc + (inv.totalTax || inv.total_tax || 0), 0);
  
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending');
  const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');

  const paidAmount = paidInvoices.reduce((acc, inv) => acc + (inv.grandTotal || inv.grand_total || 0), 0);
  const pendingAmount = pendingInvoices.reduce((acc, inv) => acc + (inv.grandTotal || inv.grand_total || 0), 0);
  const outstandingAmount = overdueInvoices.reduce((acc, inv) => acc + (inv.grandTotal || inv.grand_total || 0), 0);

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const invNum = inv.invoiceNumber || inv.invoice_number || '';
    const custName = inv.customerName || inv.customer_name || '';
    const custGst = inv.customerGst || inv.customer_gst || '';
    const matchesSearch = invNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          custGst.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-indigo-500/20 bg-gradient-to-r from-brand-900/40 via-dark-900 to-indigo-950/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                GSTIN Verified • {user.gstNumber}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">
              Welcome Back, {user.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {user.companyName} ({user.businessType} • {user.city}, {user.state})
            </p>
          </div>

          {/* Quick Registration Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenNewCustomer}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" /> + Customer
            </button>
            <button
              onClick={handleOpenNewBank}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              <Landmark className="w-3.5 h-3.5 text-amber-400" /> + Bank / Cash
            </button>
            <button
              onClick={handleOpenNewItem}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" /> + Item / Service
            </button>

            <button
              onClick={onQuickCreateInvoice}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Invoice
            </button>
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB CONTENT */}
      {(activeTab === 'overview' || activeTab === 'invoices') && (
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
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
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

          {/* Invoices Table Section */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">Invoices & Billing Directory</h3>
                <p className="text-xs text-slate-400 font-mono">Recent GST tax invoices generated for customers</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search invoices..."
                    className="pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs w-48 font-mono"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl glass-input text-xs bg-dark-900 font-semibold"
                >
                  <option value="All">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">GSTIN</th>
                    <th className="py-3 px-4">Date / Due</th>
                    <th className="py-3 px-4">Tax (₹)</th>
                    <th className="py-3 px-4">Grand Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInvoices.map((inv) => {
                    const invNumber = inv.invoiceNumber || inv.invoice_number;
                    const custName = inv.customerName || inv.customer_name;
                    const custGst = inv.customerGst || inv.customer_gst;
                    const totalTaxVal = inv.totalTax || inv.total_tax || 0;
                    const grandTotalVal = inv.grandTotal || inv.grand_total || 0;
                    const dueDateVal = inv.dueDate || inv.due_date;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-white">{invNumber}</td>
                        <td className="py-3 px-4 font-medium text-slate-200">{custName}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{custGst}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          <div>{inv.date}</div>
                          <div className="text-[10px] text-slate-500">Due: {dueDateVal}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-indigo-300">₹{totalTaxVal.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white">₹{grandTotalVal.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                            inv.status === 'Paid' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : inv.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="View Invoice Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {inv.status !== 'Paid' && (
                              <button
                                onClick={() => handleMarkAsPaid(inv.id)}
                                className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition-colors cursor-pointer"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteInvoice(inv)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white transition-colors cursor-pointer"
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* CUSTOMERS TAB CONTENT (REGISTRATION - CUSTOMER) */}
      {activeTab === 'customers' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white font-serif">REGISTRATION ( CUSTOMER )</h2>
              <p className="text-xs text-slate-400 font-mono">Customer Ledger (Sundry Debtors / Sundry Creditors) Directory</p>
            </div>
            <button
              onClick={handleOpenNewCustomer}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 cursor-pointer w-fit"
            >
              <Plus className="w-4 h-4" /> Register New Customer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customers.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl glass-card border border-slate-800 space-y-3 hover:border-indigo-500/30 transition-all flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono border border-indigo-500/20">{c.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold">
                      {c.ledger || 'SUNDRY DEBTORS'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{c.name}</h3>
                  <div className="space-y-1 text-xs text-slate-300 font-mono">
                    <p><span className="text-slate-500">GST NO:</span> {c.gstNumber || c.gst_number}</p>
                    <p><span className="text-slate-500">PAN:</span> {c.panNumber || c.pan_number || 'AAACD1234F'}</p>
                    <p><span className="text-slate-500">MOBILE:</span> {c.phone || c.mobile || 'N/A'}</p>
                    <p><span className="text-slate-500">EMAIL:</span> {c.email || 'N/A'}</p>
                    <p><span className="text-slate-500">ADDRESS:</span> {c.address || `${c.city || 'Chennai'}, ${c.state || 'Tamil Nadu'}`}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Total Billed: </span>
                    <span className="font-bold text-emerald-400 font-mono">₹{(c.totalBilled || c.total_billed || 0).toLocaleString('en-IN')}</span>
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
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
                </div>
              </div>
            ))}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bankAccounts.map((b) => (
              <div key={b.id} className="p-5 rounded-2xl glass-card-gold border border-amber-500/30 space-y-3 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">{b.bankType || b.bank_type}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">{b.status || 'Active'}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{b.accountName || b.account_name}</h3>
                  <div className="space-y-1 text-xs text-slate-300 font-mono">
                    <p><span className="text-amber-200/60">NAME OF BANK:</span> {b.bankName || b.bank_name}</p>
                    <p><span className="text-amber-200/60">ACCOUNT NUMBER:</span> {b.accountNumber || b.account_number}</p>
                    <p><span className="text-amber-200/60">IFSC CODE:</span> {b.ifscCode || b.ifsc_code}</p>
                    <p><span className="text-amber-200/60">ADDRESS:</span> {b.address || 'Chennai Central'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-amber-500/20 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Ledger Balance: </span>
                    <span className="font-bold text-emerald-400 font-mono">₹{(b.balance || 0).toLocaleString('en-IN')}</span>
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SERVICES CATALOG TAB CONTENT (REGISTRATION - SALES / SERVICES) */}
      {activeTab === 'services' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white font-serif">REGISTRATION ( SALES / SERVICES )</h2>
              <p className="text-xs text-slate-400 font-mono">Item & Service Master Catalog with HSN Codes & Opening Stock</p>
            </div>
            <button
              onClick={handleOpenNewItem}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer w-fit"
            >
              <Plus className="w-4 h-4" /> Register Sales / Service Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => {
              const itemTitle = p.title;
              const hsn = p.hsnSac || p.hsn_sac;
              const rateVal = p.rate || 0;
              const taxPct = p.taxPercent || p.tax_percent || 18;
              const opStock = p.openingStock !== undefined ? p.openingStock : (p.opening_stock !== undefined ? p.opening_stock : 100);

              return (
                <div key={p.id} className="p-5 rounded-2xl glass-card border border-slate-800 flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono border border-brand-500/30">{p.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">QTY Unit: {p.unit || 'Pices'}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{itemTitle}</h3>
                      <p className="text-xs text-slate-300 font-mono">HSN CODE: <strong className="text-indigo-300">{hsn}</strong> • Tax Rate: {taxPct}% GST</p>
                      <p className="text-xs text-slate-400 font-mono">OPENING STOCK: <strong className="text-emerald-400">{opStock} Units</strong></p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-400 font-mono">₹{rateVal.toLocaleString('en-IN')}</span>
                      <p className="text-[10px] text-slate-500">Standard Tariff</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-end items-center gap-2">
                    <button
                      onClick={() => handleOpenEditItem(p)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-all border border-emerald-500/30 text-[11px] font-semibold cursor-pointer"
                      title="Edit Item"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(p)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white transition-all border border-red-500/30 text-[11px] font-semibold cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GSTR & TAX REPORTS TAB CONTENT */}
      {activeTab === 'tax-reports' && (
        <div className="space-y-6 animate-slide-up">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <h2 className="text-xl font-bold text-white font-serif">GSTR-1 & Tax Compliance Export</h2>
                <p className="text-xs text-slate-400 font-mono">Generate official GST return JSON & Excel files for August 2026</p>
              </div>
              <button
                onClick={() => addToast('GSTR-1 tax export file generated & downloaded!', 'success', 'Export Ready')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer w-fit"
              >
                <Download className="w-4 h-4" /> Export GSTR-1 CSV
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800">
                <p className="text-xs text-slate-400 font-medium">Outward Supplies (B2B)</p>
                <h4 className="text-xl font-bold text-white font-mono mt-1">₹{totalSales.toLocaleString('en-IN')}</h4>
                <p className="text-[10px] text-slate-400 mt-1">Eligible for ITC Credit</p>
              </div>
              <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800">
                <p className="text-xs text-slate-400 font-medium">Output CGST + SGST</p>
                <h4 className="text-xl font-bold text-indigo-300 font-mono mt-1">₹{(totalTax * 0.84).toLocaleString('en-IN')}</h4>
                <p className="text-[10px] text-indigo-400 mt-1">State & Central Treasury</p>
              </div>
              <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800">
                <p className="text-xs text-slate-400 font-medium">Integrated IGST</p>
                <h4 className="text-xl font-bold text-brand-accent font-mono mt-1">₹{(totalTax * 0.16).toLocaleString('en-IN')}</h4>
                <p className="text-[10px] text-purple-400 mt-1">Interstate Transfer</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTRATION ( CUSTOMER ) - Supports Add & Edit/Update */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-700 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">
                  {editingCustomer ? 'EDIT REGISTRATION ( CUSTOMER )' : 'REGISTRATION ( CUSTOMER )'}
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
                  onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                  placeholder="e.g. Apex Global Tech Pvt Ltd"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">Ledger *</label>
                  <select
                    value={custForm.ledger}
                    onChange={(e) => setCustForm({ ...custForm, ledger: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-dark-900 font-semibold"
                  >
                    <option value="SUNDRY DEBTORS">SUNDRY DEBTORS (Customers)</option>
                    <option value="SUNDRY CREDITORS">SUNDRY CREDITORS (Suppliers)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">GST NO *</label>
                  <input
                    type="text"
                    maxLength="15"
                    value={custForm.gstNo}
                    onChange={(e) => handleCustGstChange(e.target.value)}
                    placeholder="33AAACD1234F1Z5"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono uppercase"
                    required
                  />
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
                  <label className="block text-xs font-semibold text-slate-200 mb-1">CITY</label>
                  <input
                    type="text"
                    value={custForm.city}
                    onChange={(e) => setCustForm({ ...custForm, city: e.target.value })}
                    placeholder="Chennai"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">STATE</label>
                  <input
                    type="text"
                    value={custForm.state}
                    onChange={(e) => setCustForm({ ...custForm, state: e.target.value })}
                    placeholder="Tamil Nadu"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
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

            <form onSubmit={handleRegisterBankCash} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-amber-200 mb-1">BANK Category *</label>
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
                <label className="block text-xs font-semibold text-amber-200 mb-1">NAME OF THE ACCOUNT *</label>
                <input
                  type="text"
                  value={bankForm.accountName}
                  onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                  placeholder="e.g. Durai Tax Advisory Operating A/C"
                  className="w-full px-3.5 py-2 rounded-xl glass-input glass-input-gold text-xs"
                  required
                />
              </div>

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
                  <label className="block text-xs font-semibold text-amber-200 mb-1">NAME OF THE BANK</label>
                  <input
                    type="text"
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank Ltd"
                    className="w-full px-3.5 py-2 rounded-xl glass-input glass-input-gold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">LEDGER BALANCE (₹)</label>
                  <input
                    type="number"
                    value={bankForm.balance}
                    onChange={(e) => setBankForm({ ...bankForm, balance: e.target.value })}
                    placeholder="150000"
                    className="w-full px-3.5 py-2 rounded-xl glass-input glass-input-gold text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-200 mb-1">ADDRESS</label>
                <input
                  type="text"
                  value={bankForm.address}
                  onChange={(e) => setBankForm({ ...bankForm, address: e.target.value })}
                  placeholder="Branch Address e.g. Anna Salai Chennai"
                  className="w-full px-3.5 py-2 rounded-xl glass-input glass-input-gold text-xs"
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
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {editingBank ? 'Update Account' : 'Register Bank / Cash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTRATION ( SALES / SERVICES ) - Supports Add & Edit/Update */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-700 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">
                  {editingItem ? 'EDIT REGISTRATION ( SALES / SERVICES )' : 'REGISTRATION ( SALES / SERVICES )'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {editingItem ? `Update catalog details for ${editingItem.id}` : 'Create new Item / Service catalog entry'}
                </p>
              </div>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSalesService} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">NAME OF THE ITEM / SERVICE *</label>
                <input
                  type="text"
                  value={itemForm.itemName}
                  onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })}
                  placeholder="e.g. GSTR-1 & GSTR-3B Monthly Audit Service"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">QTY Unit *</label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-dark-900 font-semibold"
                  >
                    <option value="Pices">Pices</option>
                    <option value="Number">Number</option>
                    <option value="Hours">Hours</option>
                    <option value="Months">Months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">HSN CODE *</label>
                  <input
                    type="text"
                    value={itemForm.hsnCode}
                    onChange={(e) => setItemForm({ ...itemForm, hsnCode: e.target.value })}
                    placeholder="998222"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">OPENING STOCK</label>
                  <input
                    type="number"
                    value={itemForm.openingStock}
                    onChange={(e) => setItemForm({ ...itemForm, openingStock: e.target.value })}
                    placeholder="100"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">STANDARD TARIFF / RATE (₹)</label>
                  <input
                    type="number"
                    value={itemForm.rate}
                    onChange={(e) => setItemForm({ ...itemForm, rate: e.target.value })}
                    placeholder="12500"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">GST TAX PERCENT (%)</label>
                  <select
                    value={itemForm.taxPercent}
                    onChange={(e) => setItemForm({ ...itemForm, taxPercent: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-dark-900 font-semibold"
                  >
                    <option value="18">18% GST (Standard)</option>
                    <option value="12">12% GST</option>
                    <option value="5">5% GST</option>
                    <option value="28">28% GST</option>
                    <option value="0">0% (Exempted)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  {editingItem ? 'Update Item' : 'Register Item / Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Detail View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl p-6 max-w-lg w-full border border-slate-700 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">{selectedInvoice.invoiceNumber || selectedInvoice.invoice_number}</h3>
                <p className="text-xs text-slate-400 font-mono">Customer: {selectedInvoice.customerName || selectedInvoice.customer_name}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 font-mono">
              <p><span className="text-slate-500">GSTIN:</span> {selectedInvoice.customerGst || selectedInvoice.customer_gst}</p>
              <p><span className="text-slate-500">Date / Due:</span> {selectedInvoice.date} / {selectedInvoice.dueDate || selectedInvoice.due_date}</p>
              <div className="p-3 rounded-xl bg-dark-900 border border-slate-800 space-y-1">
                <p className="flex justify-between"><span>Subtotal:</span> <span>₹{(selectedInvoice.subtotal || 0).toLocaleString('en-IN')}</span></p>
                <p className="flex justify-between text-indigo-300"><span>Tax (CGST+SGST/IGST):</span> <span>₹{(selectedInvoice.totalTax || selectedInvoice.total_tax || 0).toLocaleString('en-IN')}</span></p>
                <p className="flex justify-between font-bold text-white pt-1 border-t border-slate-800"><span>Grand Total:</span> <span className="text-emerald-400">₹{(selectedInvoice.grandTotal || selectedInvoice.grand_total || 0).toLocaleString('en-IN')}</span></p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  addToast(`PDF generated for ${selectedInvoice.invoiceNumber || selectedInvoice.invoice_number}`, 'info');
                  setSelectedInvoice(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Glassmorphic Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{deleteModal.title || 'Confirm Deletion'}</h3>
                <p className="text-xs text-slate-400 font-mono">This action is permanent</p>
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
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteModal.onConfirm) deleteModal.onConfirm();
                  setDeleteModal({ isOpen: false, title: '', message: '', onConfirm: null });
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
