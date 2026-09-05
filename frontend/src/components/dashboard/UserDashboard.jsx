import React, { useState, useEffect } from 'react';
import {
  Receipt, DollarSign, FileText, PieChart, Users, ShoppingBag,
  CreditCard, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Plus, Search, Filter, Download, ArrowUpRight, ChevronRight, Eye, ShieldCheck,
  Building, Landmark, Package, Wrench, Ban, X, Check, Pencil, Trash2, Edit3, AlertTriangle
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { UserSettings } from './UserSettings';

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
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
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

  // View Detail Modals state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [selectedBankDetail, setSelectedBankDetail] = useState(null);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState(null);

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
    entryType: 'Item', // 'Item' or 'Service'
    itemName: '',
    unit: 'Pices', // Pices / Number / Hours / Months / Box / Kg
    hsnCode: '',
    openingStock: '100',
    rate: '12500',
    taxPercent: '18',
    category: 'Sales Item'
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
        if (res && res.customer && res.customer.id && res.customer.id !== custId) {
          setCustomers((prev) => prev.map((c) => c.id === custId ? { ...c, id: res.customer.id } : c));
        }
      } catch (err) {
        console.error('Error saving customer to backend:', err);
      }

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
    const effectiveBankName = isCashAccount ? bankForm.bankType : (bankForm.bankName.trim() || 'Standard Bank');
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
        balance: parseFloat(bankForm.balance) || 0
      };

      setBankAccounts((prev) => prev.map((b) => b.id === editingBank.id ? updatedBank : b));
      api.updateBankAccount(editingBank.id, {
        bankType: bankForm.bankType,
        accountName: bankForm.accountName,
        accountNumber: effectiveAccNumber,
        bankName: effectiveBankName,
        ifscCode: effectiveIfsc,
        address: bankForm.address,
        balance: parseFloat(bankForm.balance) || 0
      });

      addToast(`Account "${bankForm.accountName}" updated successfully!`, 'success', 'Account Updated');
    } else {
      // CREATE new bank/cash ledger
      const bankId = `BANK-00${bankAccounts.length + 1}`;
      const newBank = {
        id: bankId,
        bankType: bankForm.bankType,
        accountName: bankForm.accountName,
        accountNumber: effectiveAccNumber,
        bankName: effectiveBankName,
        ifscCode: effectiveIfsc,
        address: bankForm.address || (isCashAccount ? 'Office Safe' : 'Main Branch'),
        balance: parseFloat(bankForm.balance) || 35000,
        status: 'Active'
      };

      setBankAccounts([newBank, ...bankAccounts]);
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
          userId: user?.id || 'USR-901'
        });
        if (res && res.bankAccount && res.bankAccount.id && res.bankAccount.id !== bankId) {
          setBankAccounts((prev) => prev.map((b) => b.id === bankId ? { ...b, id: res.bankAccount.id } : b));
        }
      } catch (err) {
        console.error('Error saving bank account to backend:', err);
      }

      addToast(`REGISTRATION complete for ${bankForm.accountName}!`, 'success', 'Account Registered');
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
      entryType: 'Item',
      itemName: '',
      unit: 'Pices',
      hsnCode: '',
      openingStock: '100',
      rate: '12500',
      taxPercent: '18',
      category: 'Sales Item'
    });
    setShowItemModal(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    const isSrv = (item.category || '').toLowerCase().includes('service') || (item.unit || '').toLowerCase().includes('service') || String(item.hsnSac || item.hsn_sac || '').startsWith('99');
    setItemForm({
      entryType: isSrv ? 'Service' : 'Item',
      itemName: item.title || '',
      unit: item.unit || (isSrv ? 'Service' : 'Pices'),
      hsnCode: item.hsnSac || item.hsn_sac || '',
      openingStock: item.openingStock !== undefined ? String(item.openingStock) : (item.opening_stock !== undefined ? String(item.opening_stock) : '100'),
      rate: item.rate !== undefined ? String(item.rate) : '12500',
      taxPercent: item.taxPercent !== undefined ? String(item.taxPercent) : (item.tax_percent !== undefined ? String(item.tax_percent) : '18'),
      category: item.category || (isSrv ? 'Service Item' : 'Sales Item')
    });
    setShowItemModal(true);
  };

  const handleRegisterSalesService = async (e) => {
    e.preventDefault();
    if (!itemForm.itemName.trim()) {
      addToast(`NAME OF ${itemForm.entryType === 'Service' ? 'SERVICE' : 'ITEM'} is required`, 'error');
      return;
    }
    if (itemForm.entryType === 'Item' && !itemForm.hsnCode.trim()) {
      addToast('HSN CODE is required for Goods / Item', 'error');
      return;
    }

    const finalUnit = itemForm.entryType === 'Service' ? 'Service' : itemForm.unit;
    const finalCategory = itemForm.entryType === 'Service' ? 'Service Item' : (itemForm.category || 'Sales Item');
    const finalHsn = itemForm.hsnCode.trim() || (itemForm.entryType === 'Service' ? '998222' : '847130');

    if (editingItem) {
      // UPDATE existing item
      const updatedItem = {
        ...editingItem,
        title: itemForm.itemName,
        unit: finalUnit,
        hsnSac: finalHsn,
        openingStock: parseInt(itemForm.openingStock) || 0,
        rate: parseFloat(itemForm.rate) || 0,
        taxPercent: parseFloat(itemForm.taxPercent) || 18,
        category: finalCategory
      };

      setProducts((prev) => prev.map((p) => p.id === editingItem.id ? updatedItem : p));
      api.updateProduct(editingItem.id, {
        title: itemForm.itemName,
        unit: finalUnit,
        hsnSac: finalHsn,
        openingStock: parseInt(itemForm.openingStock) || 0,
        rate: parseFloat(itemForm.rate) || 0,
        taxPercent: parseFloat(itemForm.taxPercent) || 18,
        category: finalCategory
      });

      addToast(`${itemForm.entryType} "${itemForm.itemName}" updated successfully!`, 'success', `${itemForm.entryType} Updated`);
    } else {
      // CREATE new item
      const itemId = `SRV-00${products.length + 1}`;
      const newItem = {
        id: itemId,
        title: itemForm.itemName,
        unit: finalUnit,
        hsnSac: finalHsn,
        openingStock: parseInt(itemForm.openingStock) || 0,
        rate: parseFloat(itemForm.rate) || 0,
        taxPercent: parseFloat(itemForm.taxPercent) || 18,
        category: finalCategory
      };

      setProducts([newItem, ...products]);
      try {
        const res = await api.registerSalesService({
          id: itemId,
          title: itemForm.itemName,
          unit: finalUnit,
          hsnSac: finalHsn,
          openingStock: parseInt(itemForm.openingStock) || 0,
          rate: parseFloat(itemForm.rate) || 0,
          taxPercent: parseFloat(itemForm.taxPercent) || 18,
          category: finalCategory,
          userId: user?.id || 'USR-901'
        });
        if (res && res.product && res.product.id && res.product.id !== itemId) {
          setProducts((prev) => prev.map((p) => p.id === itemId ? { ...p, id: res.product.id } : p));
        }
      } catch (err) {
        console.error('Error saving item to backend:', err);
      }

      addToast(`REGISTRATION (${itemForm.entryType.toUpperCase()}) complete for ${itemForm.itemName}!`, 'success', `${itemForm.entryType} Registered`);
    }

    setShowItemModal(false);
    setEditingItem(null);
    setItemForm({ entryType: 'Item', itemName: '', unit: 'Pices', hsnCode: '', openingStock: '100', rate: '12500', taxPercent: '18', category: 'Sales Item' });
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

  const handleCancelInvoice = (inv) => {
    const invNum = inv.invoiceNumber || inv.invoice_number || '';
    const custName = inv.customerName || inv.customer_name || '';
    setDeleteModal({
      isOpen: true,
      title: 'Cancel / Void Tax Invoice',
      message: `Are you sure you want to cancel Tax Invoice "${invNum}" for ${custName}? Its status will be marked as Cancelled.`,
      onConfirm: () => {
        setInvoices((prev) => prev.map((i) => i.id === inv.id ? { ...i, status: 'Cancelled' } : i));
        api.updateInvoice(inv.id, { status: 'Cancelled' });
        addToast(`Invoice ${invNum} has been cancelled.`, 'info', 'Invoice Cancelled');
      }
    });
  };

  // Financial Stat calculations
  const totalInvoicesCount = invoices.length;
  const totalSales = invoices.reduce((acc, inv) => acc + (inv.grandTotal || inv.grand_total || 0), 0);
  const totalTax = invoices.reduce((acc, inv) => acc + (inv.totalTax || inv.total_tax || 0), 0);

  const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending');
  const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');
  const cancelledInvoices = invoices.filter(inv => inv.status === 'Cancelled');

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

  // Filtered Products & Services
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
                  onClick={() => setActiveTab('services')}
                  className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex items-center justify-between hover:border-emerald-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Services & Products</h4>
                      <p className="text-xs text-slate-400 font-mono">{products.length} Master Items</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* INVOICE & BILLING HUB TAB CONTENT (DEDICATED INVOICE MANAGEMENT) */}
      {activeTab === 'invoices' && (
        <div className="space-y-6 animate-slide-up">

          {/* Dedicated Header for Invoices Hub */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/60 to-dark-900/60 p-6 rounded-3xl border border-indigo-500/20">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono font-bold border border-brand-500/30">
                  GST BILLING HUB
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white font-serif">Invoices & Billing Hub</h2>
              <p className="text-xs text-slate-300 font-mono mt-0.5">Manage, track status, filter, export, and create official GST invoices</p>
            </div>

            <button
              onClick={onQuickCreateInvoice}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer w-fit"
            >
              <Plus className="w-4 h-4" /> + Create New Tax Invoice
            </button>
          </div>

          {/* Invoice Specific KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400 font-mono">Total Invoices</p>
              <h3 className="text-2xl font-bold font-mono text-white mt-1">{invoices.length}</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-1">Generated all-time</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400 font-mono">Total Billing Amount</p>
              <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">₹{totalSales.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-emerald-400 font-mono mt-1">Inclusive of GST</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400 font-mono">Paid Cleared Invoices</p>
              <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">{paidInvoices.length}</h3>
              <p className="text-[11px] text-emerald-400 font-mono mt-1">₹{paidAmount.toLocaleString('en-IN')} settled</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400 font-mono">Pending / Overdue</p>
              <h3 className="text-2xl font-bold font-mono text-amber-300 mt-1">{pendingInvoices.length + overdueInvoices.length}</h3>
              <p className="text-[11px] text-amber-400 font-mono mt-1">₹{(pendingAmount + outstandingAmount).toLocaleString('en-IN')} pending</p>
            </div>
          </div>

          {/* Full Invoices Master Table */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">GST Invoice Directory</h3>
                <p className="text-xs text-slate-400 font-mono">Showing {filteredInvoices.length} of {invoices.length} total tax invoices</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search invoice number, customer, GSTIN..."
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
                  <option value="All">All Status ({invoices.length})</option>
                  <option value="Paid">Paid ({paidInvoices.length})</option>
                  <option value="Pending">Pending ({pendingInvoices.length})</option>
                  <option value="Overdue">Overdue ({overdueInvoices.length})</option>
                  <option value="Cancelled">Cancelled ({cancelledInvoices.length})</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {filteredInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono whitespace-nowrap">
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
                          <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">{invNumber}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-200 whitespace-nowrap">{custName}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">{custGst}</td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono whitespace-nowrap">
                            <div>{inv.date}</div>
                            <div className="text-[10px] text-slate-500">Due: {dueDateVal}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-indigo-300 whitespace-nowrap">₹{totalTaxVal.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">₹{grandTotalVal.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : inv.status === 'Pending'
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                  : inv.status === 'Cancelled'
                                    ? 'bg-slate-800 text-slate-400 border-slate-700 line-through'
                                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                              }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  generateInvoicePDF(inv, user);
                                  addToast(`Tax Invoice PDF downloaded for ${inv.invoiceNumber || inv.invoice_number}`, 'success', 'PDF Generated');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                                title="Download Tax Invoice PDF"
                              >
                                <Download className="w-3 h-3" /> Download
                              </button>
                              
                              {/* EDIT Button */}
                              <button
                                onClick={() => onQuickCreateInvoice(inv)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[11px] font-semibold transition-all cursor-pointer"
                                title="Edit / Update Invoice"
                              >
                                <Pencil className="w-3 h-3" /> Edit
                              </button>

                              {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleMarkAsPaid(inv.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[11px] font-semibold border border-emerald-500/30 transition-colors cursor-pointer"
                                >
                                  Mark Paid
                                </button>
                              )}

                              {/* CANCEL Button */}
                              {inv.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleCancelInvoice(inv)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-[11px] font-semibold transition-all cursor-pointer"
                                  title="Cancel Invoice"
                                >
                                  <Ban className="w-3 h-3" /> Cancel
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteInvoice(inv)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white transition-all border border-red-500/30 text-[11px] font-semibold cursor-pointer"
                                title="Delete Invoice"
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
                <h4 className="text-sm font-bold text-slate-300">No matching invoices found</h4>
                <p className="text-xs text-slate-500">Try adjusting your status filter or search query.</p>
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

          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            {/* Service / Product Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-dark-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={serviceSearchQuery}
                  onChange={(e) => setServiceSearchQuery(e.target.value)}
                  placeholder="Search products or services by item title, HSN/SAC code, category..."
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
                Showing <span className="text-emerald-400 font-bold">{filteredProducts.length}</span> of {products.length} items
              </div>
            </div>

            {/* Products & Services Row / Table Layout */}
            {filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono whitespace-nowrap">
                      <th className="py-3 px-4">Item ID</th>
                      <th className="py-3 px-4">Item / Service Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">HSN / SAC</th>
                      <th className="py-3 px-4">GST Rate</th>
                      <th className="py-3 px-4">QTY Unit</th>
                      <th className="py-3 px-4">Opening Stock</th>
                      <th className="py-3 px-4">Rate (₹)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredProducts.map((p) => {
                      const itemTitle = p.title;
                      const hsn = p.hsnSac || p.hsn_sac;
                      const rateVal = p.rate || 0;
                      const taxPct = p.taxPercent || p.tax_percent || 18;
                      const opStock = p.openingStock !== undefined ? p.openingStock : (p.opening_stock !== undefined ? p.opening_stock : 100);

                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedServiceDetail(p)}
                          className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4 font-mono font-semibold text-brand-300 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30 whitespace-nowrap inline-block font-mono text-[11px] font-bold">{p.id}</span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                            <div>{itemTitle}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 whitespace-nowrap inline-block text-[10px]">
                              {p.category || 'Sales / Service Item'}
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
                            {opStock} Units
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                            ₹{rateVal.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedServiceDetail(p)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all border border-emerald-500/20 text-[11px] font-semibold cursor-pointer"
                                title="View Item Details"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>
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
                <h4 className="text-sm font-bold text-slate-300">No matching products or services found</h4>
                <p className="text-xs text-slate-500">Try adjusting your search query or register a new service item.</p>
                {serviceSearchQuery && (
                  <button
                    onClick={() => setServiceSearchQuery('')}
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

      {/* SETTINGS TAB CONTENT */}
      {activeTab === 'settings' && (
        <UserSettings
          user={user}
          setUserData={setUserData}
          bankAccounts={bankAccounts}
          invoices={invoices}
          customers={customers}
          products={products}
        />
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
                      {isCashAcc ? 'NAME OF THE CASH ACCOUNT *' : 'NAME OF THE BANK / ACCOUNT *'}
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
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {!isCashAcc && (
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
                    )}

                    <div className={isCashAcc ? "col-span-2 sm:col-span-1" : ""}>
                      <label className="block text-xs font-semibold text-amber-200 mb-1">OPENING LEDGER BALANCE (₹)</label>
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

      {/* MODAL 3: REGISTRATION ( SALES / SERVICES ) - Supports Item (Goods) vs Service Selection */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-700 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">
                  {editingItem ? 'EDIT REGISTRATION ( SALES / SERVICES )' : 'REGISTRATION ( SALES / SERVICES )'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Select Item or Service to configure required details
                </p>
              </div>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ITEM vs SERVICE Toggle */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-2">TYPE OF REGISTRATION *</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-dark-900/90 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setItemForm({ ...itemForm, entryType: 'Item' })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    itemForm.entryType === 'Item'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Package className="w-4 h-4" /> Item (Goods)
                </button>
                <button
                  type="button"
                  onClick={() => setItemForm({ ...itemForm, entryType: 'Service', unit: 'Service' })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    itemForm.entryType === 'Service'
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Wrench className="w-4 h-4" /> Service
                </button>
              </div>
            </div>

            <form onSubmit={handleRegisterSalesService} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  {itemForm.entryType === 'Service' ? 'NAME OF THE SERVICE *' : 'NAME OF THE ITEM *'}
                </label>
                <input
                  type="text"
                  value={itemForm.itemName}
                  onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })}
                  placeholder={itemForm.entryType === 'Service' ? "e.g. Monthly GST Audit Service" : "e.g. Dell XPS 15 Laptop"}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                  required
                />
              </div>

              {itemForm.entryType === 'Item' ? (
                /* ITEM specific fields: QTY Unit, HSN CODE, OPENING STOCK */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">QTY Unit *</label>
                    <select
                      value={itemForm.unit}
                      onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
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
                      value={itemForm.hsnCode}
                      onChange={(e) => setItemForm({ ...itemForm, hsnCode: e.target.value })}
                      placeholder="847130"
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
              ) : (
                /* SERVICE specific fields: OPENING STOCK (and optional SAC Code) */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">OPENING STOCK</label>
                    <input
                      type="number"
                      value={itemForm.openingStock}
                      onChange={(e) => setItemForm({ ...itemForm, openingStock: e.target.value })}
                      placeholder="0"
                      className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">SAC / HSN CODE</label>
                    <input
                      type="text"
                      value={itemForm.hsnCode}
                      onChange={(e) => setItemForm({ ...itemForm, hsnCode: e.target.value })}
                      placeholder="998222"
                      className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono"
                    />
                  </div>
                </div>
              )}

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
                    {(() => {
                      let rates = ['0', '5', '12', '18', '28'];
                      try {
                        const saved = localStorage.getItem(`billson_custom_tax_rates_${user?.id}`) || localStorage.getItem(`taxpulse_custom_tax_rates_${user?.id}`);
                        if (saved) {
                          const parsed = JSON.parse(saved);
                          if (Array.isArray(parsed) && parsed.length > 0) rates = parsed;
                        }
                      } catch (e) {}
                      const currentStr = String(itemForm.taxPercent || '18');
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
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 rounded-xl text-white text-xs font-bold shadow-lg cursor-pointer ${
                    itemForm.entryType === 'Service'
                      ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  }`}
                >
                  {editingItem 
                    ? (itemForm.entryType === 'Service' ? 'Update Service' : 'Update Item')
                    : (itemForm.entryType === 'Service' ? 'Register Service' : 'Register Item')
                  }
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

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-dark-900 border border-amber-500/20">
                <span className="text-amber-200/60 block text-[10px]">NAME OF BANK</span>
                <span className="text-white font-bold">{selectedBankDetail.bankName || selectedBankDetail.bank_name || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-amber-500/20">
                <span className="text-amber-200/60 block text-[10px]">ACCOUNT NUMBER</span>
                <span className="text-amber-300 font-bold">{selectedBankDetail.accountNumber || selectedBankDetail.account_number}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-amber-500/20">
                <span className="text-amber-200/60 block text-[10px]">IFSC CODE</span>
                <span className="text-white font-bold">{selectedBankDetail.ifscCode || selectedBankDetail.ifsc_code || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-amber-500/20">
                <span className="text-amber-200/60 block text-[10px]">STATUS</span>
                <span className="text-emerald-400 font-bold">{selectedBankDetail.status || 'Active'}</span>
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
              <div className="p-3 rounded-xl bg-dark-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">OPENING STOCK</span>
                <span className="text-emerald-400 font-bold">{selectedServiceDetail.openingStock !== undefined ? selectedServiceDetail.openingStock : (selectedServiceDetail.opening_stock !== undefined ? selectedServiceDetail.opening_stock : 100)} Units</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono">Standard Tariff Rate</span>
                <h4 className="text-xl font-bold font-mono text-emerald-400">₹{(selectedServiceDetail.rate || 0).toLocaleString('en-IN')}</h4>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-semibold border border-emerald-500/30">Active Item</span>
            </div>

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
                  generateInvoicePDF(selectedInvoice, user);
                  addToast(`Tax Invoice PDF generated for ${selectedInvoice.invoiceNumber || selectedInvoice.invoice_number}`, 'success');
                  setSelectedInvoice(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all shadow-lg shadow-indigo-600/30"
              >
                <Download className="w-4 h-4" /> Download PDF / Print
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
                  const action = deleteModal.onConfirm;
                  setDeleteModal({ isOpen: false, title: '', message: '', onConfirm: null });
                  if (typeof action === 'function') {
                    try {
                      action();
                    } catch (err) {
                      console.error('Error executing delete action:', err);
                    }
                  }
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
