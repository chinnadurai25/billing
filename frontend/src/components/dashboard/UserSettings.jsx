import React, { useState } from 'react';
import { 
  Building2, User, Mail, Phone, MapPin, Shield, FileText, Landmark, 
  KeyRound, Bell, Download, Save, CheckCircle2, AlertCircle, Camera, Trash2, Plus, X, 
  Globe, Percent, RefreshCw, Layers, ShieldCheck, Cpu, Sliders, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export const UserSettings = ({ 
  user, 
  setUserData, 
  bankAccounts = [],
  invoices = [],
  customers = [],
  products = []
}) => {
  const { addToast } = useToast();
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [logoErr, setLogoErr] = useState(false);

  // 1. Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || user?.full_name || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || user?.contact_number || '',
    companyName: user?.companyName || user?.company_name || '',
    constitution: user?.constitution || 'Private Limited',
    companyAddress: user?.companyAddress || user?.company_address || '',
    state: user?.state || 'Tamil Nadu',
    gstNumber: user?.gstNumber || user?.gst_number || '',
    registrationType: user?.registrationType || user?.registration_type || 'Regular',
    panNumber: user?.panNumber || user?.pan_number || '',
    companyLogo: user?.companyLogo || user?.company_logo || null
  });

  // 2. Billing & Invoice Preferences State
  const [billingPrefs, setBillingPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(`billson_billing_prefs_${user?.id}`);
      return saved ? JSON.parse(saved) : {
        invoicePrefix: 'INV-2026-',
        defaultPaymentTerms: 'Net 15',
        defaultTaxRate: '18',
        defaultBankAccountId: bankAccounts[0]?.id || '',
        invoiceFooterTerms: 'Payment due within 15 days of invoice date. Interest @ 18% p.a. charged on delayed payments.'
      };
    } catch {
      return {
        invoicePrefix: 'INV-2026-',
        defaultPaymentTerms: 'Net 15',
        defaultTaxRate: '18',
        defaultBankAccountId: '',
        invoiceFooterTerms: 'Payment due within 15 days of invoice date. Interest @ 18% p.a. charged on delayed payments.'
      };
    }
  });

  // Custom GST Tax Rates State
  const [taxRatesList, setTaxRatesList] = useState(() => {
    try {
      const saved = localStorage.getItem(`billson_custom_tax_rates_${user?.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return ['0', '5', '12', '18', '28'];
    } catch {
      return ['0', '5', '12', '18', '28'];
    }
  });
  const [newTaxRateInput, setNewTaxRateInput] = useState('');

  const handleAddTaxRate = (e) => {
    if (e) e.preventDefault();
    const val = newTaxRateInput.trim();
    if (!val || isNaN(val) || parseFloat(val) < 0 || parseFloat(val) > 100) {
      addToast('Please enter a valid GST Tax Rate percentage (0 to 100)', 'error');
      return;
    }
    const formatted = String(parseFloat(val));
    if (taxRatesList.includes(formatted)) {
      addToast(`GST Tax Rate ${formatted}% already exists`, 'warning');
      return;
    }
    const updated = [...taxRatesList, formatted].sort((a, b) => parseFloat(a) - parseFloat(b));
    setTaxRatesList(updated);
    setNewTaxRateInput('');
    localStorage.setItem(`billson_custom_tax_rates_${user?.id}`, JSON.stringify(updated));
    addToast(`New GST Tax Rate (${formatted}%) added successfully!`, 'success', 'Tax Rate Added');
  };

  const handleRemoveTaxRate = (rateToRemove) => {
    if (taxRatesList.length <= 1) {
      addToast('At least one GST tax rate must remain configured', 'warning');
      return;
    }
    const updated = taxRatesList.filter(r => r !== rateToRemove);
    setTaxRatesList(updated);
    localStorage.setItem(`billson_custom_tax_rates_${user?.id}`, JSON.stringify(updated));
    if (billingPrefs.defaultTaxRate === rateToRemove) {
      setBillingPrefs(prev => ({ ...prev, defaultTaxRate: updated[0] || '18' }));
    }
    addToast(`Tax Rate ${rateToRemove}% removed`, 'info');
  };

  // 3. GST Governance & Tax Settings State
  const [gstSettings, setGstSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(`billson_gst_settings_${user?.id}`);
      return saved ? JSON.parse(saved) : {
        placeOfSupplyState: user?.state || 'Tamil Nadu (33)',
        enableRcmDefault: false,
        ewayBillThreshold: '50000',
        einvoiceSandboxMode: true,
        financialYearPeriod: 'Apr 2026 - Mar 2027'
      };
    } catch {
      return {
        placeOfSupplyState: 'Tamil Nadu (33)',
        enableRcmDefault: false,
        ewayBillThreshold: '50000',
        einvoiceSandboxMode: true,
        financialYearPeriod: 'Apr 2026 - Mar 2027'
      };
    }
  });

  // 4. Security & Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // 5. Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(`billson_notif_prefs_${user?.id}`);
      return saved ? JSON.parse(saved) : {
        autoEmailPdfInvoice: true,
        overduePaymentReminders: true,
        gstFilingAlerts: true,
        monthlyTurnoverReport: false
      };
    } catch {
      return {
        autoEmailPdfInvoice: true,
        overduePaymentReminders: true,
        gstFilingAlerts: true,
        monthlyTurnoverReport: false
      };
    }
  });

  // Auto extract PAN when GSTIN is typed in settings
  const handleGstNumberChange = (val) => {
    const uppercaseVal = val.toUpperCase();
    setProfileForm(prev => {
      let updatedPan = prev.panNumber;
      if (uppercaseVal.length === 15) {
        const extracted = uppercaseVal.substring(2, 12);
        if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(extracted)) {
          updatedPan = extracted;
        }
      }
      return { ...prev, gstNumber: uppercaseVal, panNumber: updatedPan };
    });
  };

  // Logo file upload handler
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast('Company logo image size must be under 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setLogoErr(false);
      setProfileForm(prev => ({ ...prev, companyLogo: uploadEvent.target.result }));
      addToast('Logo preview updated. Remember to save changes.', 'info');
    };
    reader.readAsDataURL(file);
  };

  // Save Business Profile handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName.trim() || !profileForm.companyName.trim() || !profileForm.gstNumber.trim()) {
      addToast('Full Name, Company Name and GSTIN are required fields', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = {
        ...user,
        fullName: profileForm.fullName,
        email: profileForm.email,
        contactNumber: profileForm.contactNumber,
        companyName: profileForm.companyName,
        constitution: profileForm.constitution,
        companyAddress: profileForm.companyAddress,
        state: profileForm.state,
        gstNumber: profileForm.gstNumber,
        registrationType: profileForm.registrationType,
        panNumber: profileForm.panNumber,
        companyLogo: profileForm.companyLogo
      };

      // Persist to backend
      if (user?.id) {
        await api.updateUserProfile(user.id, profileForm);
      }

      // Update local storage and app state
      localStorage.setItem('billson_active_user', JSON.stringify(updatedUser));
      if (typeof setUserData === 'function') {
        setUserData(updatedUser);
      }

      addToast('Company Business Profile updated successfully!', 'success', 'Profile Saved');
    } catch (err) {
      addToast(err.message || 'Error updating profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Billing Preferences handler
  const handleSaveBillingPrefs = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(`billson_billing_prefs_${user?.id}`, JSON.stringify(billingPrefs));
      localStorage.setItem(`billson_custom_tax_rates_${user?.id}`, JSON.stringify(taxRatesList));
      addToast('Invoice & Billing preferences saved successfully!', 'success', 'Preferences Saved');
    } catch (err) {
      addToast('Failed to save preferences', 'error');
    }
  };

  // Save GST Settings handler
  const handleSaveGstSettings = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(`billson_gst_settings_${user?.id}`, JSON.stringify(gstSettings));
      addToast('GST Governance & Tax settings updated!', 'success', 'GST Settings Saved');
    } catch (err) {
      addToast('Failed to save GST settings', 'error');
    }
  };

  // Password Change handler
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      addToast('Current password and new password are required', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      addToast('New password must be at least 6 characters long', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('New password and confirm password do not match', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.changeUserPassword(user?.id || 'USR-901', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (res && res.success) {
        addToast('Account password changed successfully!', 'success', 'Password Changed');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        addToast(res?.message || 'Failed to change password', 'error');
      }
    } catch (err) {
      addToast('Error communicating with auth server', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Notification Preferences handler
  const handleSaveNotifications = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(`billson_notif_prefs_${user?.id}`, JSON.stringify(notifPrefs));
      addToast('Notification & email alerts updated!', 'success', 'Notifications Saved');
    } catch (err) {
      addToast('Failed to save notification settings', 'error');
    }
  };

  // Export Application Master Data as Word Document (.doc) or JSON
  const handleExportAllData = (format = 'doc') => {
    const company = user?.companyName || user?.company_name || 'BillSon Enterprise';
    const gstin = user?.gstNumber || user?.gst_number || '33AAACD9999F1Z0';
    const owner = user?.fullName || user?.full_name || 'Chinna Durai';
    const phone = user?.contactNumber || user?.contact_number || 'N/A';
    const email = user?.email || 'N/A';
    const exportDate = new Date().toLocaleString('en-IN');

    const totalSales = invoices.reduce((acc, i) => acc + (i.grandTotal || i.grand_total || 0), 0);
    const totalTax = invoices.reduce((acc, i) => acc + (i.totalTax || i.total_tax || 0), 0);

    if (format === 'doc') {
      const docHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>BillSon Data Backup Report - ${company}</title>
          <style>
            body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5; margin: 20px; }
            h1 { color: #0284c7; font-size: 20pt; margin-bottom: 2px; text-transform: uppercase; }
            h2 { color: #0f172a; font-size: 13pt; border-bottom: 2px solid #0284c7; padding-bottom: 4px; margin-top: 25px; }
            p { margin: 4px 0; }
            .meta-table { width: 100%; margin-bottom: 20px; font-size: 10pt; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
            table.data-table th { background-color: #0f172a; color: #ffffff; padding: 8px; text-align: left; border: 1px solid #334155; }
            table.data-table td { padding: 7px; border: 1px solid #cbd5e1; }
            table.data-table tr:nth-child(even) { background-color: #f1f5f9; }
            .badge { font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 9pt; }
            .paid { background-color: #dcfce7; color: #15803d; }
            .pending { background-color: #fef3c7; color: #b45309; }
            .cancelled { background-color: #f1f5f9; color: #64748b; text-decoration: line-through; }
            .footer { margin-top: 40px; text-align: center; font-size: 9pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>${company}</h1>
          <p><b>GSTIN:</b> ${gstin} | <b>AUTHORIZED OWNER:</b> ${owner}</p>
          <p><b>CONTACT:</b> ${phone} | <b>EMAIL:</b> ${email}</p>
          <p><b>BACKUP GENERATED DATE:</b> ${exportDate}</p>
          <hr/>

          <h2>1. EXECUTIVE BUSINESS SUMMARY</h2>
          <table class="meta-table">
            <tr><td><b>Total Issued Tax Invoices:</b> ${invoices.length} Invoices</td><td><b>Total Cumulative Billed Sales:</b> ₹${totalSales.toLocaleString('en-IN')}</td></tr>
            <tr><td><b>Total GST Tax Collected:</b> ₹${totalTax.toLocaleString('en-IN')}</td><td><b>Total Customer Ledgers:</b> ${customers.length} Debtors</td></tr>
            <tr><td><b>Total Bank & Cash Ledgers:</b> ${bankAccounts.length} Accounts</td><td><b>Catalog Products / Services:</b> ${products.length} Items</td></tr>
          </table>

          <h2>2. GST TAX INVOICES DIRECTORY</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer Name</th>
                <th>Customer GSTIN</th>
                <th>Date</th>
                <th>Tax (₹)</th>
                <th>Grand Total (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.length > 0 ? invoices.map(inv => `
                <tr>
                  <td><b>${inv.invoiceNumber || inv.invoice_number || 'N/A'}</b></td>
                  <td>${inv.customerName || inv.customer_name || 'N/A'}</td>
                  <td>${inv.customerGst || inv.customer_gst || 'N/A'}</td>
                  <td>${inv.date || 'N/A'}</td>
                  <td>₹${(inv.totalTax || inv.total_tax || 0).toLocaleString('en-IN')}</td>
                  <td><b>₹${(inv.grandTotal || inv.grand_total || 0).toLocaleString('en-IN')}</b></td>
                  <td><span class="badge ${inv.status === 'Paid' ? 'paid' : inv.status === 'Cancelled' ? 'cancelled' : 'pending'}">${inv.status || 'Pending'}</span></td>
                </tr>
              `).join('') : '<tr><td colspan="7" style="text-align:center;">No Invoices Recorded</td></tr>'}
            </tbody>
          </table>

          <h2>3. REGISTERED CUSTOMERS LEDGER</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>GSTIN</th>
                <th>Ledger Type</th>
                <th>City / State</th>
                <th>Mobile</th>
              </tr>
            </thead>
            <tbody>
              ${customers.length > 0 ? customers.map(c => `
                <tr>
                  <td><b>${c.id}</b></td>
                  <td>${c.name}</td>
                  <td>${c.gstNumber || c.gst_number || 'N/A'}</td>
                  <td>${c.ledger || 'SUNDRY DEBTORS'}</td>
                  <td>${c.city || ''}, ${c.state || ''}</td>
                  <td>${c.phone || c.mobile || 'N/A'}</td>
                </tr>
              `).join('') : '<tr><td colspan="6" style="text-align:center;">No Customer Records</td></tr>'}
            </tbody>
          </table>

          <h2>4. BANK & CASH ACCOUNTS LEDGER</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Account ID</th>
                <th>Account / Ledger Name</th>
                <th>Bank Name</th>
                <th>Account Number</th>
                <th>IFSC Code</th>
                <th>Ledger Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${bankAccounts.length > 0 ? bankAccounts.map(b => `
                <tr>
                  <td><b>${b.id}</b></td>
                  <td>${b.accountName || b.account_name}</td>
                  <td>${b.bankName || b.bank_name || 'Cash'}</td>
                  <td>${b.accountNumber || b.account_number}</td>
                  <td>${b.ifscCode || b.ifsc_code || 'N/A'}</td>
                  <td><b>₹${(b.balance || 0).toLocaleString('en-IN')}</b></td>
                </tr>
              `).join('') : '<tr><td colspan="6" style="text-align:center;">No Bank Accounts</td></tr>'}
            </tbody>
          </table>

          <h2>5. PRODUCTS & SERVICES CATALOG</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Name of Item / Service</th>
                <th>Unit</th>
                <th>HSN/SAC Code</th>
                <th>Opening Stock</th>
                <th>Standard Rate (₹)</th>
                <th>GST Rate (%)</th>
              </tr>
            </thead>
            <tbody>
              ${products.length > 0 ? products.map(p => `
                <tr>
                  <td><b>${p.id}</b></td>
                  <td>${p.title}</td>
                  <td>${p.unit || 'Service'}</td>
                  <td>${p.hsnSac || p.hsn_sac || 'N/A'}</td>
                  <td>${p.openingStock || p.opening_stock || 0}</td>
                  <td>₹${(p.rate || 0).toLocaleString('en-IN')}</td>
                  <td>${p.taxPercent || p.tax_percent || 18}%</td>
                </tr>
              `).join('') : '<tr><td colspan="7" style="text-align:center;">No Catalog Items</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated automatically by BillSon GST Billing Software • ${company}</p>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanCompany = (company || 'Report').replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_');
      link.download = `BillSon_Backup_${cleanCompany}_${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('Complete database backup exported as Word Document (.doc)!', 'success', 'Word Backup Downloaded');
    } else {
      const exportData = {
        exportTimestamp: new Date().toISOString(),
        userProfile: user,
        invoices,
        customers,
        bankAccounts,
        products
      };
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BillSon_Backup_${user?.companyName?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('Full application data backup exported as JSON!', 'success');
    }
  };

  const navTabs = [
    { id: 'profile', label: 'Company Profile', icon: Building2 },
    { id: 'billing', label: 'Billing Preferences', icon: FileText },
    { id: 'gst', label: 'GST Governance', icon: ShieldCheck },
    { id: 'security', label: 'Security & Password', icon: KeyRound },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'Data Backup & Export', icon: Cpu }
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-dark-900 via-indigo-950/60 to-dark-900 p-6 rounded-3xl border border-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono font-bold border border-brand-500/30">
              ACCOUNT & SYSTEM SETTINGS
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white font-serif">Manage App Settings & Details</h2>
          <p className="text-xs text-slate-300 font-mono mt-0.5">Edit company details, tax rules, invoice defaults, security, and export data</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExportAllData('json')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Export Backup
          </button>
        </div>
      </div>

      {/* Main Settings Tabbed Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sub-Tab Navigation */}
        <div className="glass-card rounded-3xl p-4 border border-slate-800 h-fit space-y-1">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 font-mono">
            Settings Category
          </p>
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600/30 to-indigo-600/20 text-indigo-300 border border-brand-500/40 font-bold shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Active Panel Content */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: BUSINESS & COMPANY PROFILE */}
          {activeSettingsTab === 'profile' && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" /> Company Business Profile
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Edit official business details that appear on printed GST invoices</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                
                {/* Logo Upload Section */}
                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0">
                    {profileForm.companyLogo && !logoErr ? (
                      <img src={profileForm.companyLogo} alt="Company Logo" onError={() => setLogoErr(true)} className="w-full h-full object-contain p-2" />
                    ) : (
                      <Building2 className="w-10 h-10 text-slate-600" />
                    )}
                  </div>
                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <h4 className="text-xs font-bold text-white">Company Brand Logo</h4>
                    <p className="text-[11px] text-slate-400">PNG, JPG or WebP (Max 2MB). Printed at top header of tax invoices.</p>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer transition-all">
                        <Camera className="w-3.5 h-3.5" /> Upload Logo
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      {profileForm.companyLogo && (
                        <button
                          type="button"
                          onClick={() => setProfileForm(prev => ({ ...prev, companyLogo: null }))}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Registered Company Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.companyName}
                      onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                      placeholder="e.g. Durai Advisory Services Ltd"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Authorized Full Name / Owner *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      placeholder="e.g. Chinna Durai"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">GSTIN Number (15 Digits) *</label>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={profileForm.gstNumber}
                      onChange={(e) => handleGstNumberChange(e.target.value)}
                      placeholder="33AAACD1234F1Z5"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold text-indigo-300 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">PAN Number (Auto-extracted)</label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={profileForm.panNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, panNumber: e.target.value.toUpperCase() })}
                      placeholder="AAACD1234F"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold text-emerald-400 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Constitution of Business</label>
                    <select
                      value={profileForm.constitution}
                      onChange={(e) => setProfileForm({ ...profileForm, constitution: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-dark-900"
                    >
                      <option value="Private Limited">Private Limited</option>
                      <option value="Proprietorship">Proprietorship</option>
                      <option value="Partnership Firm">Partnership Firm</option>
                      <option value="LLP">Limited Liability Partnership (LLP)</option>
                      <option value="One Person Company">One Person Company (OPC)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">GST Registration Type</label>
                    <select
                      value={profileForm.registrationType}
                      onChange={(e) => setProfileForm({ ...profileForm, registrationType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-dark-900"
                    >
                      <option value="Regular">Regular Taxable Person</option>
                      <option value="Composition">Composition Tax Scheme</option>
                      <option value="SEZ Developer">SEZ Developer / Unit</option>
                      <option value="Export">Export / Overseas Entity</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="contact@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Mobile / Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.contactNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold">Official Registered Address *</label>
                    <textarea
                      required
                      rows={2}
                      value={profileForm.companyAddress}
                      onChange={(e) => setProfileForm({ ...profileForm, companyAddress: e.target.value })}
                      placeholder="Door / Suite #, Building, Street Address, Area..."
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">State Jurisdiction</label>
                    <input
                      type="text"
                      value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                      placeholder="Tamil Nadu"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> {isSaving ? 'Saving Changes...' : 'Save Business Profile'}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* TAB 2: INVOICE & BILLING PREFERENCES */}
          {activeSettingsTab === 'billing' && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" /> Invoice & Billing Preferences
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Configure automatic invoice numbering defaults, terms, and payment destination</p>
              </div>

              <form onSubmit={handleSaveBillingPrefs} className="space-y-6 text-xs font-mono">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Default Invoice Prefix</label>
                    <input
                      type="text"
                      value={billingPrefs.invoicePrefix}
                      onChange={(e) => setBillingPrefs({ ...billingPrefs, invoicePrefix: e.target.value })}
                      placeholder="INV-2026-"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold text-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">e.g. INV-2026-001, TP-2026-002</p>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Default Payment Terms</label>
                    <select
                      value={billingPrefs.defaultPaymentTerms}
                      onChange={(e) => setBillingPrefs({ ...billingPrefs, defaultPaymentTerms: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-dark-900"
                    >
                      <option value="Immediate">Due Immediately on Receipt</option>
                      <option value="Net 7">Net 7 Days</option>
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 60">Net 60 Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Default GST Tax Rate (%)</label>
                    <select
                      value={billingPrefs.defaultTaxRate}
                      onChange={(e) => setBillingPrefs({ ...billingPrefs, defaultTaxRate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-dark-900 font-bold text-emerald-400"
                    >
                      {taxRatesList.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}% GST {rate === '18' ? '(Standard)' : rate === '0' ? '(Exempted)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Manual Add New Tax Rate Section */}
                  <div className="sm:col-span-2 p-4 rounded-2xl bg-dark-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-slate-200 font-semibold flex items-center gap-1.5 text-xs">
                          <Percent className="w-4 h-4 text-emerald-400" /> Manage & Add Custom GST Tax Rates (%)
                        </label>
                        <p className="text-[10px] text-slate-400">Add custom GST rates (e.g., 3%, 6%, 14%, 40%) to use across item registration & invoices</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={newTaxRateInput}
                          onChange={(e) => setNewTaxRateInput(e.target.value)}
                          placeholder="e.g. 3 or 14 or 0.25"
                          className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono text-white"
                        />
                        <span className="absolute right-3 top-2 text-slate-400 text-xs font-bold">%</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddTaxRate}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-600/30 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" /> Add Tax Rate
                      </button>
                    </div>

                    {/* Active Tax Rates Chips */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-1.5 font-semibold">Configured Active Tax Rates:</span>
                      <div className="flex flex-wrap gap-2">
                        {taxRatesList.map((rate) => {
                          const isDefault = billingPrefs.defaultTaxRate === rate;
                          return (
                            <span
                              key={rate}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all ${
                                isDefault
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {rate}% GST {isDefault && <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-full font-sans font-bold">DEFAULT</span>}
                              <button
                                type="button"
                                onClick={() => handleRemoveTaxRate(rate)}
                                className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                                title={`Remove ${rate}% Tax Rate`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Default Payout Bank Account</label>
                    <select
                      value={billingPrefs.defaultBankAccountId}
                      onChange={(e) => setBillingPrefs({ ...billingPrefs, defaultBankAccountId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-dark-900"
                    >
                      <option value="">Select Default Bank Ledger</option>
                      {bankAccounts.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.accountName || b.account_name} ({b.bankName || b.bank_name || 'Bank'})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-amber-400 mt-1">Details will be printed at bottom of PDF invoices</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold">Standard Invoice Footer Terms & Conditions</label>
                    <textarea
                      rows={3}
                      value={billingPrefs.invoiceFooterTerms}
                      onChange={(e) => setBillingPrefs({ ...billingPrefs, invoiceFooterTerms: e.target.value })}
                      placeholder="Enter terms and payment instructions..."
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Billing Preferences
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* TAB 3: GST GOVERNANCE & TAX SETTINGS */}
          {activeSettingsTab === 'gst' && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> GST Governance & Tax Settings
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Configure place of supply, reverse charge, and e-way bill threshold limits</p>
              </div>

              <form onSubmit={handleSaveGstSettings} className="space-y-6 text-xs font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Place of Supply (Primary State & Code)</label>
                    <input
                      type="text"
                      value={gstSettings.placeOfSupplyState}
                      onChange={(e) => setGstSettings({ ...gstSettings, placeOfSupplyState: e.target.value })}
                      placeholder="Tamil Nadu (33)"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Financial Year Period</label>
                    <input
                      type="text"
                      value={gstSettings.financialYearPeriod}
                      onChange={(e) => setGstSettings({ ...gstSettings, financialYearPeriod: e.target.value })}
                      placeholder="Apr 2026 - Mar 2027"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">E-Way Bill Mandatory Threshold (₹)</label>
                    <input
                      type="number"
                      value={gstSettings.ewayBillThreshold}
                      onChange={(e) => setGstSettings({ ...gstSettings, ewayBillThreshold: e.target.value })}
                      placeholder="50000"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold text-amber-300"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Standard limit: ₹50,000 for consignment inter-state</p>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Reverse Charge Mechanism (RCM)</label>
                    <button
                      type="button"
                      onClick={() => setGstSettings(prev => ({ ...prev, enableRcmDefault: !prev.enableRcmDefault }))}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                        gstSettings.enableRcmDefault 
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                          : 'bg-dark-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      <span>Enable RCM Tax Default</span>
                      {gstSettings.enableRcmDefault ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-slate-500" />}
                    </button>
                  </div>

                  <div className="sm:col-span-2 p-4 rounded-2xl bg-dark-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">NIC E-Invoice Sandbox API Connector</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Automated IRN generation for turnover exceeding ₹5 Cr.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGstSettings(prev => ({ ...prev, einvoiceSandboxMode: !prev.einvoiceSandboxMode }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer ${
                        gstSettings.einvoiceSandboxMode
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {gstSettings.einvoiceSandboxMode ? 'Sandbox Testing' : 'Production Live'}
                    </button>
                  </div>

                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save GST Governance Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SECURITY & PASSWORD */}
          {activeSettingsTab === 'security' && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" /> Security & Account Credentials
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Update login password, manage 2FA OTP verification, and review login sessions</p>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-6 text-xs font-mono">
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Current Account Password *</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">New Password (Min 6 Characters) *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Confirm New Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" /> {isSaving ? 'Updating Password...' : 'Update Account Password'}
                  </button>
                </div>
              </form>

              {/* 2FA & Session Status */}
              <div className="pt-6 border-t border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white font-serif">Security Features & Active Session</h4>
                
                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">Email OTP Two-Factor Authentication (2FA)</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Requires 6-digit OTP code sent via Nodemailer on fresh login.</p>
                  </div>
                  <button
                    onClick={() => {
                      setTwoFactorEnabled(!twoFactorEnabled);
                      addToast(twoFactorEnabled ? '2FA disabled' : '2FA enabled successfully', 'info');
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer ${
                      twoFactorEnabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {twoFactorEnabled ? '2FA Active' : 'Enable 2FA'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">Active Device Session</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Logged in from: {window.navigator.userAgent.substring(0, 45)}...</p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                    Current Session
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS */}
          {activeSettingsTab === 'notifications' && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-400" /> Email & System Notification Preferences
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Control automated invoice dispatch, due date alerts, and tax reminders</p>
              </div>

              <form onSubmit={handleSaveNotifications} className="space-y-4">
                
                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Auto-Email PDF Invoice to Customer</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Automatically dispatches GST invoice attachment upon invoice creation.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifPrefs(prev => ({ ...prev, autoEmailPdfInvoice: !prev.autoEmailPdfInvoice }))}
                    className="cursor-pointer"
                  >
                    {notifPrefs.autoEmailPdfInvoice ? <ToggleRight className="w-7 h-7 text-indigo-400" /> : <ToggleLeft className="w-7 h-7 text-slate-600" />}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Overdue Payment Reminders</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Sends automated email reminders to debtors when invoices pass due date.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifPrefs(prev => ({ ...prev, overduePaymentReminders: !prev.overduePaymentReminders }))}
                    className="cursor-pointer"
                  >
                    {notifPrefs.overduePaymentReminders ? <ToggleRight className="w-7 h-7 text-indigo-400" /> : <ToggleLeft className="w-7 h-7 text-slate-600" />}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">GSTR-1 & GSTR-3B Filing Deadline Alerts</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Receive email alerts on 10th and 19th of every month for GST return deadlines.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifPrefs(prev => ({ ...prev, gstFilingAlerts: !prev.gstFilingAlerts }))}
                    className="cursor-pointer"
                  >
                    {notifPrefs.gstFilingAlerts ? <ToggleRight className="w-7 h-7 text-indigo-400" /> : <ToggleLeft className="w-7 h-7 text-slate-600" />}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Monthly Sales & Tax Summary Digest</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Receive an executive monthly PDF summary of billed revenue and tax collected.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifPrefs(prev => ({ ...prev, monthlyTurnoverReport: !prev.monthlyTurnoverReport }))}
                    className="cursor-pointer"
                  >
                    {notifPrefs.monthlyTurnoverReport ? <ToggleRight className="w-7 h-7 text-indigo-400" /> : <ToggleLeft className="w-7 h-7 text-slate-600" />}
                  </button>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Notification Preferences
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: DATA BACKUP & EXPORT */}
          {activeSettingsTab === 'system' && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-400" /> Data Backup & System Utilities
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Export full system database backups and review storage stats</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">TOTAL INVOICES</span>
                  <span className="text-xl font-bold text-white">{invoices.length} Records</span>
                </div>

                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">REGISTERED CUSTOMERS</span>
                  <span className="text-xl font-bold text-white">{customers.length} Debtors</span>
                </div>

                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">BANK & ITEM MASTERS</span>
                  <span className="text-xl font-bold text-white">{bankAccounts.length + products.length} Items</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-dark-900 to-dark-900 border border-emerald-500/30 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-serif">Export Complete Database Backup (.doc / Word Document)</h4>
                    <p className="text-xs text-slate-300">Download a formatted Word Document (.doc) report containing company profile details, invoice ledgers, registered customers, bank accounts, and catalog products.</p>
                  </div>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                  <button
                    onClick={() => handleExportAllData('json')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
                  >
                    Download JSON Format
                  </button>
                  <button
                    onClick={() => handleExportAllData('doc')}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download Complete Word Document (.doc) Backup
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
