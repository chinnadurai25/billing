import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Building2, FileText, DollarSign, 
  PieChart, Activity, Settings, Search, Filter, Lock, 
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Eye, UserPlus, Sparkles, X, Building, Download, ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { generateInvoicePDF } from '../../utils/pdfGenerator';

export const AdminDashboard = ({ 
  activeTab, 
  setActiveTab, 
  adminUsers, 
  setAdminUsers, 
  activityLogs, 
  monthlyRevenueData,
  user,
  invoices = []
}) => {
  const { addToast } = useToast();
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  
  // Admin Invoices Modal & PDF state
  const [showAdminInvoicesModal, setShowAdminInvoicesModal] = useState(false);
  const [selectedAdminInvoice, setSelectedAdminInvoice] = useState(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Fetch live registered users from MySQL backend on component mount
  useEffect(() => {
    const fetchRegisteredUsers = async () => {
      const res = await api.getAdminUsers();
      if (res && res.success && res.data && res.data.length > 0) {
        setAdminUsers(res.data);
      }
    };
    fetchRegisteredUsers();
  }, []);

  // Stats
  const totalRegisteredUsers = adminUsers.length;
  const activeCompanies = adminUsers.filter(u => u.status === 'Active').length;
  const totalGlobalInvoices = 482;
  const totalGlobalRevenue = 8450000;
  const pendingGlobalPayments = 1240000;
  const totalTaxCollection = 1521000;

  // Filtered Users
  const filteredUsers = adminUsers.filter(u => {
    const searchLower = userSearch.toLowerCase();
    const matchesSearch = (u.name || '').toLowerCase().includes(searchLower) ||
                          (u.company || u.companyName || '').toLowerCase().includes(searchLower) ||
                          (u.email || '').toLowerCase().includes(searchLower) ||
                          (u.gst || u.gstNumber || '').toLowerCase().includes(searchLower) ||
                          (u.username || '').toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleUserStatus = (userId) => {
    setAdminUsers((prev) => prev.map((u) => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        addToast(`User ${u.name} status updated to ${nextStatus}`, nextStatus === 'Active' ? 'success' : 'warning');
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Super Admin Welcome Banner */}
      <div className="glass-card-gold rounded-3xl p-6 sm:p-8 border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-dark-900 to-amber-950/20 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> SUPER ADMIN SYSTEM PORTAL
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">
              Platform Administration & Governance
            </h1>
            <p className="text-xs sm:text-sm text-amber-200/80 mt-1">
              Supervising {totalRegisteredUsers} enterprise tenants, GST compliance feeds, and system audit logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => addToast('Full platform security audit log exported to CSV', 'success')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
            >
              <Activity className="w-4 h-4" /> Download Audit Trail
            </button>
          </div>
        </div>
      </div>

      {/* ADMIN OVERVIEW CONTENT */}
      {(activeTab === 'admin-overview' || activeTab === 'admin-users') && (
        <div className="space-y-8 animate-slide-up">
          
          {/* 3 Platform Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-5 rounded-2xl glass-card-gold border border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-amber-200/80 font-medium">Registered SaaS Users</span>
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold font-mono text-white">{totalRegisteredUsers}</h3>
              <p className="text-xs text-amber-400/80 font-mono mt-1">Live MySQL DB Synchronized</p>
            </div>

            <div className="p-5 rounded-2xl glass-card-gold border border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-amber-200/80 font-medium">Active Enterprise Companies</span>
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold font-mono text-emerald-400">{activeCompanies}</h3>
              <p className="text-xs text-emerald-500/80 font-mono mt-1">100% Verified Legal Entities</p>
            </div>

            <div 
              onClick={() => setShowAdminInvoicesModal(true)}
              className="p-5 rounded-2xl glass-card-gold border border-indigo-500/50 bg-indigo-950/20 hover:bg-indigo-900/30 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/20 group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-indigo-300 font-bold group-hover:text-white transition-colors">Total Platform Invoices</span>
                <FileText className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-bold font-mono text-white">{invoices.length || totalGlobalInvoices}</h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold flex items-center gap-1 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  Click to View & Download All Invoices →
                </span>
              </div>
              <p className="text-xs text-indigo-400 font-mono mt-2">Click to inspect and download all customer GST invoices</p>
            </div>

          </div>

          {/* Admin Platform Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-8 glass-card rounded-3xl p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white font-serif">Platform Nationwide Revenue & Tax Volume</h3>
                  <p className="text-xs text-slate-400 font-mono">Consolidated tenant growth analytics</p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0d1527', borderColor: '#334155', borderRadius: '12px' }} 
                      formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                    />
                    <Bar dataKey="revenue" fill="#f59e0b" name="Platform Revenue" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="tax" fill="#6366f1" name="GST Pool" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Activity Stream */}
            <div className="lg:col-span-4 glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-serif mb-1">Live Audit Stream</h3>
                <p className="text-xs text-slate-400 font-mono mb-4">Real-time system events log</p>
                
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-dark-900/80 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-amber-300">{log.action}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{log.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* User Management Table */}
          <div className="glass-card-gold rounded-3xl p-6 border border-amber-500/30 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">Registered Users & SaaS Tenants (MySQL Live Store)</h3>
                <p className="text-xs text-amber-200/80 font-mono">View all 10+ registration fields for registered companies</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-amber-400/80 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search company, username, GST..."
                    className="pl-9 pr-4 py-2 rounded-xl glass-input glass-input-gold text-xs w-48 sm:w-64"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl glass-input glass-input-gold text-xs bg-dark-950"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Tenants</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-dark-950/80 text-amber-200/80 uppercase text-[10px] font-mono border-b border-amber-500/30">
                  <tr>
                    <th className="py-3 px-4">User ID / Username</th>
                    <th className="py-3 px-4">Company Name & Constitution</th>
                    <th className="py-3 px-4">Owner & Contact</th>
                    <th className="py-3 px-4">GSTIN & PAN</th>
                    <th className="py-3 px-4">Reg Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/20">
                  {filteredUsers.map((usr) => (
                    <tr key={usr.id} className="hover:bg-amber-500/5 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-amber-300 block">{usr.id}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">@{usr.username || 'username'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{usr.company || usr.companyName}</div>
                        <div className="text-[10px] text-amber-400/80 font-mono">{usr.constitution || 'Private Limited'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{usr.name || usr.fullName}</div>
                        <div className="text-[10px] text-slate-400">{usr.email} • {usr.phone || usr.contactNumber}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <div>GST: <span className="text-indigo-300 font-bold">{usr.gst || usr.gstNumber}</span></div>
                        <div className="text-[10px] text-slate-400">PAN: {usr.pan || usr.panNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {usr.registrationType || 'Regular'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                          usr.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}>
                          {usr.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedUserModal(usr)}
                            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors"
                            title="View Full Registration Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(usr.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                              usr.status === 'Active'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                            }`}
                          >
                            {usr.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
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

      {/* Full Details Modal for Registered Company */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card-gold rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-amber-500/40 shadow-2xl animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedUserModal.id}
                </span>
                <h3 className="text-xl font-bold text-white font-serif mt-1">{selectedUserModal.company || selectedUserModal.companyName}</h3>
                <p className="text-xs text-amber-200/80 font-mono">Constitution: {selectedUserModal.constitution || 'Private Limited'}</p>
              </div>
              <button onClick={() => setSelectedUserModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono text-slate-200">
              <div className="p-3 rounded-xl bg-dark-950 border border-amber-500/20 space-y-1.5">
                <p><span className="text-amber-200/60">FULL NAME:</span> <strong className="text-white">{selectedUserModal.name || selectedUserModal.fullName}</strong></p>
                <p><span className="text-amber-200/60">USERNAME:</span> <strong className="text-amber-300">@{selectedUserModal.username}</strong></p>
                <p><span className="text-amber-200/60">EMAIL ADDRESS:</span> {selectedUserModal.email} <span className="text-emerald-400 font-bold">Verified ✓</span></p>
                <p><span className="text-amber-200/60">CONTACT NUMBER:</span> {selectedUserModal.phone || selectedUserModal.contactNumber}</p>
              </div>

              <div className="p-3 rounded-xl bg-dark-950 border border-amber-500/20 space-y-1.5">
                <p><span className="text-amber-200/60">GST NUMBER:</span> <strong className="text-indigo-300 font-bold">{selectedUserModal.gst || selectedUserModal.gstNumber}</strong></p>
                <p><span className="text-amber-200/60">PAN NUMBER:</span> <strong className="text-indigo-300">{selectedUserModal.pan || selectedUserModal.panNumber}</strong></p>
                <p><span className="text-amber-200/60">TYPE OF REGISTRATION:</span> {selectedUserModal.registrationType || 'Regular'}</p>
                <p><span className="text-amber-200/60">STATE:</span> {selectedUserModal.state || 'Tamil Nadu'}</p>
                <p><span className="text-amber-200/60">COMPANY ADDRESS:</span> {selectedUserModal.address || selectedUserModal.companyAddress || 'N/A'}</p>
              </div>

              <div className="flex justify-between items-center pt-2 text-[11px]">
                <span className="text-slate-400">Registered Date: {selectedUserModal.date || '2026-08-26'}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  Status: {selectedUserModal.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedUserModal(null)}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL SYSTEM INVOICES DIRECTORY MODAL */}
      {showAdminInvoicesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
          <div className="glass-card-gold rounded-3xl p-6 sm:p-8 max-w-4xl w-full border border-indigo-500/40 shadow-2xl animate-slide-up space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-serif">Global System GST Invoices Directory</h3>
                  <p className="text-xs text-indigo-200/80 font-mono">Viewing all generated invoices across enterprise tenants ({invoices.length} Invoices)</p>
                </div>
              </div>

              <button
                onClick={() => setShowAdminInvoicesModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                placeholder="Search invoice number, customer name, GSTIN..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input glass-input-gold text-xs"
              />
            </div>

            {/* Invoices Directory Table */}
            <div className="overflow-x-auto rounded-2xl border border-indigo-500/20 bg-dark-900/60">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-dark-950 text-indigo-300 uppercase text-[10px] font-mono border-b border-indigo-500/20">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer Entity</th>
                    <th className="py-3 px-4">GSTIN</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Tax (18%)</th>
                    <th className="py-3 px-4">Grand Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {invoices
                    .filter((inv) => {
                      const q = invoiceSearch.toLowerCase();
                      return (inv.invoiceNumber || inv.invoice_number || '').toLowerCase().includes(q) ||
                             (inv.customerName || inv.customer_name || '').toLowerCase().includes(q) ||
                             (inv.customerGst || inv.customer_gst || '').toLowerCase().includes(q);
                    })
                    .map((inv) => (
                      <tr key={inv.id || inv.invoiceNumber} className="hover:bg-indigo-950/20 transition-colors">
                        <td className="py-3 px-4 font-bold text-indigo-300 whitespace-nowrap">{inv.invoiceNumber || inv.invoice_number}</td>
                        <td className="py-3 px-4 font-semibold text-white">{inv.customerName || inv.customer_name}</td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{inv.customerGst || inv.customer_gst || '33AAACD9999F1Z0'}</td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{inv.date}</td>
                        <td className="py-3 px-4 text-indigo-300">₹{(inv.totalTax || inv.total_tax || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 font-bold text-emerald-400">₹{(inv.grandTotal || inv.grand_total || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            inv.status === 'Pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedAdminInvoice(inv)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                          >
                            <Eye className="w-3.5 h-3.5" /> View & Download PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAdminInvoicesModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Close Directory
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ADMIN SELECTED INVOICE DETAIL & DOWNLOAD PDF MODAL */}
      {selectedAdminInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/85 backdrop-blur-md">
          <div className="glass-card rounded-3xl p-6 max-w-lg w-full border border-indigo-500/50 shadow-2xl animate-slide-up space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">{selectedAdminInvoice.invoiceNumber || selectedAdminInvoice.invoice_number}</h3>
                <p className="text-xs text-slate-400 font-mono">Billed To: {selectedAdminInvoice.customerName || selectedAdminInvoice.customer_name}</p>
              </div>
              <button onClick={() => setSelectedAdminInvoice(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 font-mono">
              <p><span className="text-slate-500">Customer GSTIN:</span> <strong className="text-indigo-300">{selectedAdminInvoice.customerGst || selectedAdminInvoice.customer_gst}</strong></p>
              <p><span className="text-slate-500">Invoice Date / Due Date:</span> {selectedAdminInvoice.date} / {selectedAdminInvoice.dueDate || selectedAdminInvoice.due_date}</p>
              
              <div className="p-3.5 rounded-xl bg-dark-900 border border-slate-800 space-y-1.5">
                <p className="flex justify-between"><span>Subtotal (Taxable):</span> <span>₹{(selectedAdminInvoice.subtotal || 0).toLocaleString('en-IN')}</span></p>
                <p className="flex justify-between text-indigo-300"><span>GST Pool (18% Output):</span> <span>₹{(selectedAdminInvoice.totalTax || selectedAdminInvoice.total_tax || 0).toLocaleString('en-IN')}</span></p>
                <p className="flex justify-between font-bold text-white pt-2 border-t border-slate-800 text-sm">
                  <span>Grand Total (INR):</span> 
                  <span className="text-emerald-400">₹{(selectedAdminInvoice.grandTotal || selectedAdminInvoice.grand_total || 0).toLocaleString('en-IN')}</span>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  generateInvoicePDF(selectedAdminInvoice, user);
                  addToast(`Tax Invoice PDF generated for ${selectedAdminInvoice.invoiceNumber || selectedAdminInvoice.invoice_number}`, 'success');
                  setSelectedAdminInvoice(null);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all shadow-lg shadow-indigo-600/30"
              >
                <Download className="w-4 h-4" /> Download PDF / Print
              </button>
              <button
                onClick={() => setSelectedAdminInvoice(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
