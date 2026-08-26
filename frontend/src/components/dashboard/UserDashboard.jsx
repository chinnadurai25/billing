import React, { useState } from 'react';
import { 
  Receipt, DollarSign, FileText, PieChart, Users, ShoppingBag, 
  CreditCard, TrendingUp, Clock, CheckCircle2, AlertCircle, 
  Plus, Search, Filter, Download, ArrowUpRight, ChevronRight, Eye, ShieldCheck,
  Building, Landmark, Package, X, Check
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useToast } from '../../context/ToastContext';

export const UserDashboard = ({ 
  activeTab, 
  setActiveTab, 
  invoices, 
  setInvoices, 
  customers, 
  setCustomers, 
  products, 
  setProducts,
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
    email: ''
  });

  // 2. REGISTRATION ( BANK / CASH ) Form State & Accounts List
  const [bankAccounts, setBankAccounts] = useState([
    { id: 'BANK-001', bankType: 'Bank Account', accountName: 'Durai Tax Advisory Operating A/C', accountNumber: '50100234901234', bankName: 'HDFC Bank Ltd', ifscCode: 'HDFC0001234', address: 'Anna Salai, Chennai Branch', balance: 450000 },
    { id: 'BANK-002', bankType: 'Bank Account', accountName: 'Durai Tax Collection Reserve', accountNumber: '000405012345', bankName: 'ICICI Bank Ltd', ifscCode: 'ICIC0000004', address: 'Nungambakkam, Chennai Branch', balance: 280000 },
    { id: 'BANK-003', bankType: 'Cash in Hand', accountName: 'Main Petty Cash Ledger', accountNumber: 'CASH-LEDGER-01', bankName: 'Cash Chest', ifscCode: 'N/A', address: 'Office Safe', balance: 35000 }
  ]);

  const [bankForm, setBankForm] = useState({
    bankType: 'Bank Account',
    accountName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    address: ''
  });

  // 3. REGISTRATION ( SALES / SERVICES ) Form State
  const [itemForm, setItemForm] = useState({
    itemName: '',
    unit: 'Pices', // Pices / Number
    hsnCode: '',
    openingStock: '100'
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

  // 1. Submit Customer Registration
  const handleRegisterCustomer = (e) => {
    e.preventDefault();
    if (!custForm.name.trim() || !custForm.gstNo.trim()) {
      addToast('Customer NAME and GST NO are required', 'error');
      return;
    }

    const newCustomer = {
      id: `CUST-00${customers.length + 1}`,
      name: custForm.name,
      ledger: custForm.ledger,
      address: custForm.address,
      gstNumber: custForm.gstNo,
      panNumber: custForm.pan,
      phone: custForm.mobile || '+91 98765 43210',
      email: custForm.email || `${custForm.name.toLowerCase().replace(/\s+/g, '')}@demo.com`,
      city: 'Chennai',
      state: 'Tamil Nadu',
      totalBilled: 0,
      status: 'Active'
    };

    setCustomers([newCustomer, ...customers]);
    addToast(`REGISTRATION (CUSTOMER) complete for ${custForm.name}!`, 'success', 'Customer Registered');
    setShowCustomerModal(false);
    setCustForm({ name: '', ledger: 'SUNDRY DEBTORS', address: '', gstNo: '', pan: '', mobile: '', email: '' });
  };

  // 2. Submit Bank / Cash Registration
  const handleRegisterBankCash = (e) => {
    e.preventDefault();
    if (!bankForm.accountName.trim() || !bankForm.accountNumber.trim()) {
      addToast('NAME OF ACCOUNT and ACCOUNT NUMBER are required', 'error');
      return;
    }

    const newBank = {
      id: `BANK-00${bankAccounts.length + 1}`,
      bankType: bankForm.bankType,
      accountName: bankForm.accountName,
      accountNumber: bankForm.accountNumber,
      bankName: bankForm.bankName || 'Standard Chartered Bank',
      ifscCode: bankForm.ifscCode || 'SCBL0001122',
      address: bankForm.address || 'Chennai Central Branch',
      balance: 150000,
      status: 'Active'
    };

    setBankAccounts([newBank, ...bankAccounts]);
    addToast(`REGISTRATION (BANK / CASH) complete for ${bankForm.accountName}!`, 'success', 'Bank Account Registered');
    setShowBankModal(false);
    setBankForm({ bankType: 'Bank Account', accountName: '', accountNumber: '', bankName: '', ifscCode: '', address: '' });
  };

  // 3. Submit Sales / Services Registration
  const handleRegisterSalesService = (e) => {
    e.preventDefault();
    if (!itemForm.itemName.trim() || !itemForm.hsnCode.trim()) {
      addToast('NAME OF ITEM and HSN CODE are required', 'error');
      return;
    }

    const newItem = {
      id: `SRV-00${products.length + 1}`,
      title: itemForm.itemName,
      unit: itemForm.unit,
      hsnSac: itemForm.hsnCode,
      openingStock: parseInt(itemForm.openingStock) || 0,
      rate: 12500,
      taxPercent: 18,
      category: 'Sales / Service Item'
    };

    setProducts([newItem, ...products]);
    addToast(`REGISTRATION (SALES / SERVICES) complete for ${itemForm.itemName}!`, 'success', 'Item Registered');
    setShowItemModal(false);
    setItemForm({ itemName: '', unit: 'Pices', hsnCode: '', openingStock: '100' });
  };

  // Financial Stat calculations
  const totalInvoicesCount = invoices.length;
  const totalSales = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalTax = invoices.reduce((acc, inv) => acc + inv.totalTax, 0);
  
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending');
  const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');

  const paidAmount = paidInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const pendingAmount = pendingInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const outstandingAmount = overdueInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.customerGst.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleMarkAsPaid = (invId) => {
    setInvoices((prev) => prev.map((inv) => inv.id === invId ? { ...inv, status: 'Paid' } : inv));
    addToast('Invoice updated to Paid status!', 'success');
  };

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
              onClick={() => setShowCustomerModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" /> + Customer
            </button>
            <button
              onClick={() => setShowBankModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
            >
              <Landmark className="w-3.5 h-3.5 text-amber-400" /> + Bank / Cash
            </button>
            <button
              onClick={() => setShowItemModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" /> + Item / Service
            </button>

            <button
              onClick={onQuickCreateInvoice}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" /> Create Invoice
            </button>
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB CONTENT */}
      {(activeTab === 'overview' || activeTab === 'invoices') && (
        <div className="space-y-8 animate-slide-up">
          
          {/* 6 Key Financial Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            
            <div className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400 font-medium">Total Invoices</span>
                <FileText className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold font-mono text-white">{totalInvoicesCount}</h3>
              <p className="text-[10px] text-emerald-400 font-mono mt-1">100% Tax Filed</p>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400 font-medium">Total Sales</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold font-mono text-white">₹{totalSales.toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-1">Gross Revenue</p>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400 font-medium">Total Tax</span>
                <PieChart className="w-4 h-4 text-brand-accent" />
              </div>
              <h3 className="text-xl font-bold font-mono text-indigo-300">₹{totalTax.toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-indigo-400 font-mono mt-1">18% GST Split</p>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400 font-medium">Paid Amount</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold font-mono text-emerald-400">₹{paidAmount.toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-emerald-500/80 font-mono mt-1">{paidInvoices.length} Invoices Paid</p>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400 font-medium">Pending</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold font-mono text-amber-300">₹{pendingAmount.toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-amber-400/80 font-mono mt-1">{pendingInvoices.length} Invoices Pending</p>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400 font-medium">Outstanding</span>
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-xl font-bold font-mono text-red-400">₹{outstandingAmount.toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-red-400/80 font-mono mt-1">{overdueInvoices.length} Overdue</p>
            </div>

          </div>

          {/* Interactive Recharts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Monthly Revenue Area Chart */}
            <div className="lg:col-span-8 glass-card rounded-3xl p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white font-serif">Monthly Billed Revenue & Tax Trends</h3>
                  <p className="text-xs text-slate-400 font-mono">Financial Year 2026-27 Revenue Stream</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 font-mono border border-brand-500/20">
                  +18.4% MoM Growth
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0d1527', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} 
                      formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Billed Revenue" />
                    <Area type="monotone" dataKey="tax" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorTax)" name="GST Collected" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tax Category Pie Breakdown */}
            <div className="lg:col-span-4 glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-serif mb-1">Tax Component Split</h3>
                <p className="text-xs text-slate-400 font-mono mb-4">CGST / SGST / IGST Ratio</p>
                <div className="h-48 w-full">
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
                      <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#334155', borderRadius: '10px' }} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                {taxBreakdownData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300">{item.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Invoices Search & Directory Table */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">Recent Tax Invoices</h3>
                <p className="text-xs text-slate-400 font-mono">Manage client bills and track payment settlements</p>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search invoice or GSTIN..."
                    className="pl-9 pr-4 py-2 rounded-xl glass-input text-xs w-48 sm:w-64"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl glass-input text-xs bg-dark-900"
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid Only</option>
                  <option value="Pending">Pending Only</option>
                  <option value="Overdue">Overdue Only</option>
                </select>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-dark-900/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer Entity</th>
                    <th className="py-3 px-4">GSTIN</th>
                    <th className="py-3 px-4">Date / Due</th>
                    <th className="py-3 px-4">Tax (18%)</th>
                    <th className="py-3 px-4">Grand Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{inv.customerName}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{inv.customerGst}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        <div>{inv.date}</div>
                        <div className="text-[10px] text-slate-500">Due: {inv.dueDate}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-300">₹{inv.totalTax.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 font-mono font-bold text-white">₹{inv.grandTotal.toLocaleString('en-IN')}</td>
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="View Invoice Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {inv.status !== 'Paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(inv.id)}
                              className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* CUSTOMERS TAB CONTENT (REGISTRATION - CUSTOMER) */}
      {activeTab === 'customers' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white font-serif">REGISTRATION ( CUSTOMER )</h2>
              <p className="text-xs text-slate-400 font-mono">Customer Ledger (Sundry Debtors / Sundry Creditors) Directory</p>
            </div>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30"
            >
              <Plus className="w-4 h-4" /> Register New Customer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customers.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl glass-card border border-slate-800 space-y-3 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono border border-indigo-500/20">{c.id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold">
                    {c.ledger || 'SUNDRY DEBTORS'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{c.name}</h3>
                <div className="space-y-1 text-xs text-slate-300 font-mono">
                  <p><span className="text-slate-500">GST NO:</span> {c.gstNumber}</p>
                  <p><span className="text-slate-500">PAN:</span> {c.panNumber || 'AAACD1234F'}</p>
                  <p><span className="text-slate-500">MOBILE:</span> {c.phone}</p>
                  <p><span className="text-slate-500">EMAIL:</span> {c.email}</p>
                  <p><span className="text-slate-500">ADDRESS:</span> {c.address || `${c.city}, ${c.state}`}</p>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Billed:</span>
                  <span className="font-bold text-emerald-400 font-mono">₹{c.totalBilled.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BANK / CASH TAB CONTENT (REGISTRATION - BANK / CASH) */}
      {activeTab === 'payments' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white font-serif">REGISTRATION ( BANK / CASH )</h2>
              <p className="text-xs text-slate-400 font-mono">Registered Bank Accounts & Cash in Hand Ledgers</p>
            </div>
            <button
              onClick={() => setShowBankModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" /> Register Bank / Cash Account
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bankAccounts.map((b) => (
              <div key={b.id} className="p-5 rounded-2xl glass-card-gold border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">{b.bankType}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">{b.status}</span>
                </div>
                <h3 className="text-base font-bold text-white">{b.accountName}</h3>
                <div className="space-y-1 text-xs text-slate-300 font-mono">
                  <p><span className="text-amber-200/60">NAME OF BANK:</span> {b.bankName}</p>
                  <p><span className="text-amber-200/60">ACCOUNT NUMBER:</span> {b.accountNumber}</p>
                  <p><span className="text-amber-200/60">IFSC CODE:</span> {b.ifscCode}</p>
                  <p><span className="text-amber-200/60">ADDRESS:</span> {b.address}</p>
                </div>
                <div className="pt-3 border-t border-amber-500/20 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Ledger Balance:</span>
                  <span className="font-bold text-emerald-400 font-mono">₹{b.balance.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SERVICES CATALOG TAB CONTENT (REGISTRATION - SALES / SERVICES) */}
      {activeTab === 'services' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white font-serif">REGISTRATION ( SALES / SERVICES )</h2>
              <p className="text-xs text-slate-400 font-mono">Item & Service Master Catalog with HSN Codes & Opening Stock</p>
            </div>
            <button
              onClick={() => setShowItemModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
            >
              <Plus className="w-4 h-4" /> Register Sales / Service Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => (
              <div key={p.id} className="p-5 rounded-2xl glass-card border border-slate-800 flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono border border-brand-500/30">{p.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">QTY Unit: {p.unit || 'Pices / Number'}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{p.title}</h3>
                  <p className="text-xs text-slate-300 font-mono">HSN CODE: <strong className="text-indigo-300">{p.hsnSac}</strong> • Tax Rate: {p.taxPercent}% GST</p>
                  <p className="text-xs text-slate-400 font-mono">OPENING STOCK: <strong className="text-emerald-400">{p.openingStock || 100} Units</strong></p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-emerald-400 font-mono">₹{p.rate.toLocaleString('en-IN')}</span>
                  <p className="text-[10px] text-slate-500">Standard Tariff</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GSTR & TAX REPORTS TAB CONTENT */}
      {activeTab === 'tax-reports' && (
        <div className="space-y-6 animate-slide-up">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white font-serif">GSTR-1 & Tax Compliance Export</h2>
                <p className="text-xs text-slate-400 font-mono">Generate official GST return JSON & Excel files for August 2026</p>
              </div>
              <button
                onClick={() => addToast('GSTR-1 tax export file generated & downloaded!', 'success', 'Export Ready')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
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

      {/* MODAL 1: REGISTRATION ( CUSTOMER ) */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-700 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">REGISTRATION ( CUSTOMER )</h3>
                <p className="text-xs text-slate-400 font-mono">Create new customer ledger account</p>
              </div>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-white">
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
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30"
                >
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRATION ( BANK / CASH ) */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card-gold rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-amber-500/40 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-amber-500/20 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">REGISTRATION ( BANK / CASH )</h3>
                <p className="text-xs text-amber-200/80 font-mono">Create new Bank or Cash Account Ledger</p>
              </div>
              <button onClick={() => setShowBankModal(false)} className="text-slate-400 hover:text-white">
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
                  <label className="block text-xs font-semibold text-amber-200 mb-1">ADDRESS</label>
                  <input
                    type="text"
                    value={bankForm.address}
                    onChange={(e) => setBankForm({ ...bankForm, address: e.target.value })}
                    placeholder="Branch Address e.g. Anna Salai Chennai"
                    className="w-full px-3.5 py-2 rounded-xl glass-input glass-input-gold text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20"
                >
                  Register Bank / Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTRATION ( SALES / SERVICES ) */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-700 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">REGISTRATION ( SALES / SERVICES )</h3>
                <p className="text-xs text-slate-400 font-mono">Create new Item / Service catalog entry</p>
              </div>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSalesService} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">NAME OF THE ITEM *</label>
                <input
                  type="text"
                  value={itemForm.itemName}
                  onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })}
                  placeholder="e.g. GSTR-1 & GSTR-3B Monthly Audit Service"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
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

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
                >
                  Register Item / Service
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
                <h3 className="text-lg font-bold text-white font-serif">{selectedInvoice.invoiceNumber}</h3>
                <p className="text-xs text-slate-400 font-mono">Customer: {selectedInvoice.customerName}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 font-mono">
              <p><span className="text-slate-500">GSTIN:</span> {selectedInvoice.customerGst}</p>
              <p><span className="text-slate-500">Date / Due:</span> {selectedInvoice.date} / {selectedInvoice.dueDate}</p>
              <div className="p-3 rounded-xl bg-dark-900 border border-slate-800 space-y-1">
                <p className="flex justify-between"><span>Subtotal:</span> <span>₹{selectedInvoice.subtotal.toLocaleString('en-IN')}</span></p>
                <p className="flex justify-between text-indigo-300"><span>Tax (CGST+SGST/IGST):</span> <span>₹{selectedInvoice.totalTax.toLocaleString('en-IN')}</span></p>
                <p className="flex justify-between font-bold text-white pt-1 border-t border-slate-800"><span>Grand Total:</span> <span className="text-emerald-400">₹{selectedInvoice.grandTotal.toLocaleString('en-IN')}</span></p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  addToast(`PDF generated for ${selectedInvoice.invoiceNumber}`, 'info');
                  setSelectedInvoice(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
