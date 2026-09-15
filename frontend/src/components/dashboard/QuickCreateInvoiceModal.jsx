import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Plus, Trash2, Receipt, Calculator, CheckCircle2, 
  FileText, Building, ArrowRight, RefreshCw, Search, ChevronDown, Check, User, Package
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const generateNextInvoiceNumber = (invoices = [], user = null, documentType = 'Sales Invoice') => {
  let prefix = 'TP-2026-';
  if (documentType === 'Payment') prefix = 'PAY-2026-';
  else if (documentType === 'Purchase Invoice') prefix = 'PUR-2026-';
  else if (documentType === 'Estimate') prefix = 'EST-2026-';
  else if (documentType === 'Delivery Challan') prefix = 'DC-2026-';

  // Check if user has saved custom invoice prefix in settings
  if (user?.id && documentType === 'Sales Invoice') {
    try {
      const savedPrefs = localStorage.getItem(`billson_billing_prefs_${user.id}`) || localStorage.getItem(`taxpulse_billing_prefs_${user.id}`);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.invoicePrefix) {
          prefix = parsed.invoicePrefix;
        }
      }
    } catch (e) {}
  }

  // If default prefix is used but existing invoices have a prefix, extract prefix from most recent invoice
  if (prefix === 'TP-2026-' && invoices.length > 0) {
    const firstNum = invoices[0]?.invoiceNumber || invoices[0]?.invoice_number || '';
    const match = firstNum.match(/^(.*?)(\d+)$/);
    if (match && match[1]) {
      prefix = match[1];
    }
  }

  let maxNum = 0;
  let padLen = 3; // Default 3 digits padding (001, 002, 003...)

  invoices.forEach((inv) => {
    const invNum = String(inv.invoiceNumber || inv.invoice_number || '');
    const digitMatch = invNum.match(/\d+$/);
    if (digitMatch) {
      const numVal = parseInt(digitMatch[0], 10);
      if (!isNaN(numVal) && numVal > maxNum) {
        maxNum = numVal;
        padLen = Math.max(padLen, digitMatch[0].length);
      }
    }
  });

  const nextNum = maxNum + 1;
  const paddedNext = String(nextNum).padStart(padLen, '0');
  return `${prefix}${paddedNext}`;
};

// Searchable Customer Dropdown Component
const SearchableCustomerSelect = ({ customers = [], selectedName, onSelectCustomer, labelPlaceholder = "Select Customer Entity..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 300 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScrollOrResize = () => updateCoords();
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = customers.filter(c => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.gstNumber || c.gst_number || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    );
  });

  const selectedCust = customers.find(c => c.name === selectedName);

  return (
    <div className="relative" ref={triggerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-dark-900 flex items-center justify-between cursor-pointer border border-slate-700/70 hover:border-brand-500/50 transition-all"
      >
        <div className="flex items-center gap-2 truncate">
          <User className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="font-semibold text-white truncate">
            {selectedCust ? `${selectedCust.name}${selectedCust.city ? ` (${selectedCust.city})` : ''}` : (selectedName || labelPlaceholder)}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 999999
          }}
          className="glass-card rounded-2xl p-2.5 border border-slate-700 shadow-2xl bg-dark-900/98 backdrop-blur-xl max-h-64 overflow-y-auto space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="relative mb-1.5">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer name, GSTIN, city..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs font-mono text-white"
            />
          </div>

          {filtered.length > 0 ? (
            filtered.map((c) => (
              <div
                key={c.id || c.name}
                onClick={() => {
                  onSelectCustomer(c);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  selectedName === c.name ? 'bg-brand-600/30 text-white border border-brand-500/40 font-bold' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-200">{c.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{c.gstNumber || c.gst_number || 'No GSTIN'} • {c.city || 'TN'}</div>
                </div>
                {selectedName === c.name && <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-xs text-slate-400">No matching customers found</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

// Searchable Registered Bank Account Dropdown Component
const SearchableBankSelect = ({ bankAccounts = [], selectedMethod, onSelectBankMethod }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 300 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScrollOrResize = () => updateCoords();
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const defaultModes = [
    { id: 'mode-1', bankType: 'Bank Account', bankName: 'Bank Transfer (NEFT/RTGS)', accountName: 'Direct Bank Transfer', accountNumber: '' },
    { id: 'mode-2', bankType: 'UPI', bankName: 'UPI / GPay / PhonePe', accountName: 'Instant UPI', accountNumber: '' },
    { id: 'mode-3', bankType: 'Cash in Hand', bankName: 'Cash', accountName: 'Cash Payment', accountNumber: '' },
    { id: 'mode-4', bankType: 'Bank Account', bankName: 'Cheque', accountName: 'Cheque Payment', accountNumber: '' },
    { id: 'mode-5', bankType: 'Card', bankName: 'Credit / Debit Card', accountName: 'Card Payment', accountNumber: '' }
  ];

  const listToUse = (bankAccounts && bankAccounts.length > 0) ? bankAccounts : defaultModes;

  const filtered = listToUse.filter(b => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const name = (b.bankName || b.bank_name || '').toLowerCase();
    const accName = (b.accountName || b.account_name || '').toLowerCase();
    const accNum = (b.accountNumber || b.account_number || '').toLowerCase();
    const ifsc = (b.ifscCode || b.ifsc_code || '').toLowerCase();
    const type = (b.bankType || b.bank_type || '').toLowerCase();
    return name.includes(q) || accName.includes(q) || accNum.includes(q) || ifsc.includes(q) || type.includes(q);
  });

  const getBankLabel = (b) => {
    const name = b.bankName || b.bank_name || 'Bank';
    const accName = b.accountName || b.account_name;
    const accNum = b.accountNumber || b.account_number;
    if (accName && accNum) return `${name} - ${accName} (${accNum})`;
    if (accName) return `${name} - ${accName}`;
    if (accNum) return `${name} (${accNum})`;
    return name;
  };

  return (
    <div className="relative" ref={triggerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-dark-900 flex items-center justify-between cursor-pointer border border-slate-700/70 hover:border-cyan-500/50 transition-all"
      >
        <div className="flex items-center gap-2 truncate">
          <Building className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-semibold text-cyan-300 truncate">
            {selectedMethod || 'Search & Select Registered Bank Account...'}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 999999
          }}
          className="glass-card rounded-2xl p-2.5 border border-slate-700 shadow-2xl bg-dark-900/98 backdrop-blur-xl max-h-64 overflow-y-auto space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="relative mb-1.5">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bank name, A/C number, IFSC, ledger..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs font-mono text-white"
            />
          </div>

          {filtered.length > 0 ? (
            filtered.map((b, idx) => {
              const label = getBankLabel(b);
              const isSelected = selectedMethod === label || selectedMethod === (b.bankName || b.bank_name);
              return (
                <div
                  key={b.id || `bank-${idx}`}
                  onClick={() => {
                    onSelectBankMethod(label);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-cyan-600/30 text-white border border-cyan-500/40 font-bold' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-200">{b.bankName || b.bank_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {b.accountName || b.account_name ? `${b.accountName || b.account_name} ` : ''}
                      {b.accountNumber || b.account_number ? `• A/C: ${b.accountNumber || b.account_number} ` : ''}
                      {b.ifscCode && b.ifscCode !== 'N/A' ? `• IFSC: ${b.ifscCode}` : ''}
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center text-xs text-slate-400">No matching registered bank details found</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

// Searchable Catalog Product/Service Dropdown Component
const SearchableProductSelect = ({ products = [], selectedTitle, onSelectProduct, onChangeCustomText }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 300 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 300)
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScrollOrResize = () => updateCoords();
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = products.filter(p => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.hsnSac || p.hsn_sac || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  });

  const selectedProd = products.find(p => p.title === selectedTitle);

  return (
    <div className="relative" ref={triggerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-dark-900 flex items-center justify-between cursor-pointer border border-slate-700/70 hover:border-indigo-500/50 transition-all"
      >
        <div className="flex items-center gap-2 truncate">
          <Package className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold text-slate-200 truncate">
            {selectedProd ? `${selectedProd.title}${selectedProd.rate ? ` (₹${selectedProd.rate})` : ''}` : (selectedTitle || 'Search & Select Item / Service...')}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 999999
          }}
          className="glass-card rounded-2xl p-2.5 border border-slate-700 shadow-2xl bg-dark-900/98 backdrop-blur-xl max-h-64 overflow-y-auto space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="relative mb-1.5">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => {
                const val = e.target.value;
                setSearchTerm(val);
                if (onChangeCustomText) {
                  onChangeCustomText(val);
                }
              }}
              placeholder="Search item, HSN/SAC or type custom..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs font-mono text-white"
            />
          </div>

          {filtered.length > 0 ? (
            filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProduct(p);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  selectedTitle === p.title ? 'bg-indigo-600/30 text-white border border-indigo-500/40 font-bold' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-200">{p.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono">HSN: {p.hsnSac || p.hsn_sac || 'N/A'}{p.rate ? ` • Rate: ₹${p.rate}` : ''}</div>
                </div>
                {selectedTitle === p.title && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
              </div>
            ))
          ) : (
            <div className="p-2.5 text-center text-xs text-slate-400">
              No matching catalog item.
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    if (onChangeCustomText) onChangeCustomText(searchTerm);
                    setIsOpen(false);
                  }}
                  className="mt-1.5 block w-full text-center px-3 py-1.5 bg-indigo-600/30 border border-indigo-500/40 rounded-lg text-indigo-300 hover:bg-indigo-600/50 font-semibold text-xs cursor-pointer"
                >
                  Use "{searchTerm}" as custom item
                </button>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export const checkIsServiceItem = (item, products = []) => {
  if (!item) return false;
  // 1. Direct type property check
  if (item.type === 'service' || item.itemType === 'service' || item.isService === true) return true;
  
  // 2. Category / unit check
  const cat = String(item.category || '').toLowerCase();
  if (cat.includes('service') || cat.includes('consulting') || cat.includes('audit') || cat.includes('tariff')) return true;

  const unit = String(item.unit || '').toUpperCase();
  if (unit === 'N/A' || unit === 'SAC' || unit === 'SERVICE') return true;

  // 3. GST HSN/SAC code check (Services in GST start with 99 like 998222, 9983, etc.)
  const hsn = String(item.hsnSac || item.hsn_sac || '').trim();
  if (hsn.startsWith('99')) return true;

  // 4. Match against product catalog if item has description or productId
  if (products && products.length > 0) {
    const matched = products.find(p => 
      (item.productId && p.id === item.productId) || 
      (p.title && item.description && p.title.toLowerCase().trim() === item.description.toLowerCase().trim())
    );
    if (matched) {
      if (matched.type === 'service' || matched.itemType === 'service' || matched.isService === true) return true;
      const pCat = String(matched.category || '').toLowerCase();
      if (pCat.includes('service') || pCat.includes('consulting') || pCat.includes('audit') || pCat.includes('tariff')) return true;
      const pHsn = String(matched.hsnSac || matched.hsn_sac || '').trim();
      if (pHsn.startsWith('99')) return true;
    }
  }

  // 5. Description keywords check
  const desc = String(item.description || '').toLowerCase();
  if (desc.includes('service') || desc.includes('audit') || desc.includes('tax filing') || desc.includes('consulting') || desc.includes('advisory') || desc.includes('maintenance')) return true;

  return false;
};

const getDocThemeConfig = (docType) => {
  switch (docType) {
    case 'Sales Invoice':
      return {
        cardBg: 'bg-gradient-to-br from-emerald-950/90 via-dark-900/95 to-teal-950/70 border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.2)]',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        badgeText: 'GREEN THEME • SALES TAX INVOICE SCREEN',
        iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        submitBtn: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
      };
    case 'Purchase Invoice':
      return {
        cardBg: 'bg-gradient-to-br from-blue-950/90 via-dark-900/95 to-indigo-950/70 border-blue-500/40 shadow-[0_0_60px_rgba(59,130,246,0.2)]',
        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        badgeText: 'BLUE THEME • PURCHASE INVOICE SCREEN',
        iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        submitBtn: 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30'
      };
    case 'Estimate':
      return {
        cardBg: 'bg-gradient-to-br from-pink-950/90 via-dark-900/95 to-rose-950/70 border-pink-500/40 shadow-[0_0_60px_rgba(236,72,153,0.2)]',
        badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
        badgeText: 'PINK THEME • ESTIMATE / QUOTATION SCREEN',
        iconBg: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        submitBtn: 'from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 shadow-pink-600/30'
      };
    case 'Delivery Challan':
      return {
        cardBg: 'bg-gradient-to-br from-amber-950/90 via-dark-900/95 to-orange-950/70 border-orange-500/40 shadow-[0_0_60px_rgba(249,115,22,0.2)]',
        badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        badgeText: 'ORANGE THEME • DELIVERY CHALLAN SCREEN',
        iconBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        submitBtn: 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-orange-600/30'
      };
    case 'Payment':
      return {
        cardBg: 'bg-gradient-to-br from-cyan-950/90 via-dark-900/95 to-slate-950/70 border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.2)]',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        badgeText: 'CYAN THEME • PAYMENT VOUCHER SCREEN',
        iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        submitBtn: 'from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-600/30'
      };
    default:
      return {
        cardBg: 'bg-gradient-to-br from-indigo-950/90 via-dark-900/95 to-dark-950/70 border-indigo-500/40 shadow-2xl',
        badge: 'bg-brand-500/20 text-brand-300 border-brand-500/40',
        badgeText: 'TAX INVOICE SCREEN',
        iconBg: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
        submitBtn: 'from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-indigo-600/30'
      };
  }
};

export const INDIAN_STATES = [
  { code: '33', name: 'Tamil Nadu' },
  { code: '29', name: 'Karnataka' },
  { code: '27', name: 'Maharashtra' },
  { code: '07', name: 'Delhi' },
  { code: '32', name: 'Kerala' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '19', name: 'West Bengal' },
  { code: '08', name: 'Rajasthan' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '06', name: 'Haryana' },
  { code: '10', name: 'Bihar' },
  { code: '21', name: 'Odisha' },
  { code: '30', name: 'Goa' },
  { code: '34', name: 'Puducherry' },
  { code: '05', name: 'Uttarakhand' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '20', name: 'Jharkhand' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '18', name: 'Assam' }
];

export const detectStateFromGstOrName = (gst, stateName) => {
  if (gst && typeof gst === 'string') {
    const clean = gst.trim().toUpperCase();
    if (clean.length >= 2) {
      const code = clean.substring(0, 2);
      const foundByCode = INDIAN_STATES.find(s => s.code === code);
      if (foundByCode) return foundByCode;
    }
  }
  if (stateName && typeof stateName === 'string') {
    const sLower = stateName.toLowerCase().trim();
    const foundByName = INDIAN_STATES.find(s => s.name.toLowerCase() === sLower || sLower.includes(s.name.toLowerCase()));
    if (foundByName) return foundByName;
  }
  return { code: '33', name: 'Tamil Nadu' };
};

export const checkIsSameState = (user, customer, customerGstOverride = null) => {
  if (!customer && !customerGstOverride) return true;

  const clientState = (user?.state || '').trim().toLowerCase();
  const custState = (customer?.state || '').trim().toLowerCase();

  const clientGst = (user?.gstNumber || user?.gst_number || '').trim().toUpperCase();
  const custGst = (customerGstOverride || customer?.gstNumber || customer?.gst_number || '').trim().toUpperCase();

  // If both have 2-digit state code in GSTIN
  if (clientGst.length >= 2 && custGst.length >= 2 && /^\d{2}$/.test(clientGst.slice(0, 2)) && /^\d{2}$/.test(custGst.slice(0, 2))) {
    return clientGst.slice(0, 2) === custGst.slice(0, 2);
  }

  // If both have state name specified
  if (clientState && custState) {
    return clientState === custState;
  }

  // If customer GST has state code, compare with client code
  if (custGst.length >= 2 && /^\d{2}$/.test(custGst.slice(0, 2))) {
    const clientCode = detectStateFromGstOrName(clientGst, user?.state || 'Tamil Nadu').code;
    return custGst.slice(0, 2) === clientCode;
  }

  return true;
};

export const QuickCreateInvoiceModal = ({ 
  isOpen, 
  onClose, 
  customers = [], 
  products = [], 
  bankAccounts = [],
  invoices = [],
  user = null,
  editingInvoice = null,
  documentType = 'Sales Invoice',
  onSaveInvoice 
}) => {
  const { addToast } = useToast();
  const theme = getDocThemeConfig(documentType);

  const [customerName, setCustomerName] = useState('');
  const [customerGst, setCustomerGst] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [taxType, setTaxType] = useState('intrastate'); // 'intrastate' (CGST+SGST) or 'interstate' (IGST)
  const [status, setStatus] = useState('Pending');

  // Payment specific states
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer (NEFT/RTGS)');
  const [paidBy, setPaidBy] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [paymentPurpose, setPaymentPurpose] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  const [items, setItems] = useState([
    {
      description: '',
      itemNotes: '',
      hsnSac: '',
      quantity: '',
      unitPrice: '',
      taxPercent: 18,
      amount: 0
    }
  ]);

  // Synchronize customer & product selections whenever modal opens or master lists update
  useEffect(() => {
    if (isOpen) {
      if (editingInvoice) {
        setInvoiceNumber(editingInvoice.invoiceNumber || editingInvoice.invoice_number || '');
        setCustomerName(editingInvoice.customerName || editingInvoice.customer_name || '');
        const editGst = editingInvoice.customerGst || editingInvoice.customer_gst || '';
        setCustomerGst(editGst);
        setInvoiceDate(editingInvoice.date || new Date().toISOString().split('T')[0]);
        setStatus(editingInvoice.status || 'Pending');

        const isOtherState = (editingInvoice.igst || 0) > 0 || editingInvoice.taxType === 'interstate';
        setTaxType(isOtherState ? 'interstate' : 'intrastate');

        if (documentType === 'Payment') {
          setPaidBy('');
          setPaidTo(editingInvoice.paidTo || editingInvoice.customerName || editingInvoice.customer_name || '');
          setPaymentMethod(editingInvoice.paymentMethod || 'Bank Transfer (NEFT/RTGS)');
          setPaymentPurpose(editingInvoice.paymentPurpose || '');
          setPaymentAmount(editingInvoice.grandTotal || editingInvoice.grand_total || editingInvoice.subtotal || '');
        }
        
        if (editingInvoice.items && Array.isArray(editingInvoice.items) && editingInvoice.items.length > 0) {
          setItems(editingInvoice.items.map(i => ({
            ...i,
            itemNotes: i.itemNotes || i.item_notes || i.details || i.itemDescription || ''
          })));
        } else {
          setItems([{
            description: 'GSTR Monthly Tax Filing',
            itemNotes: '',
            hsnSac: '998222',
            quantity: 1,
            unitPrice: editingInvoice.grandTotal || editingInvoice.grand_total || 12500,
            taxPercent: 18,
            amount: editingInvoice.grandTotal || editingInvoice.grand_total || 12500
          }]);
        }
      } else {
        setInvoiceNumber(generateNextInvoiceNumber(invoices, user, documentType));
        setStatus('Pending');
        setInvoiceDate(new Date().toISOString().split('T')[0]);

        if (documentType === 'Payment') {
          setPaidBy('');
          if (customers && customers.length > 0) {
            setPaidTo(customers[0].name);
            setCustomerName(customers[0].name);
            setCustomerGst(customers[0].gstNumber || customers[0].gst_number || '');
          } else {
            setPaidTo('');
          }
          if (bankAccounts && bankAccounts.length > 0) {
            const b = bankAccounts[0];
            const name = b.bankName || b.bank_name || 'Bank';
            const accName = b.accountName || b.account_name;
            const accNum = b.accountNumber || b.account_number;
            let label = name;
            if (accName && accNum) label = `${name} - ${accName} (${accNum})`;
            else if (accName) label = `${name} - ${accName}`;
            else if (accNum) label = `${name} (${accNum})`;
            setPaymentMethod(label);
          } else {
            setPaymentMethod('Bank Transfer (NEFT/RTGS)');
          }
          setPaymentPurpose('');
          setPaymentAmount('');
        }

        if (customers && customers.length > 0) {
          const found = customers.find(c => c.name === customerName) || customers[0];
          setCustomerName(found.name);
          const gstVal = found.gstNumber || found.gst_number || '';
          setCustomerGst(gstVal);

          // 2 CONDITIONS AUTOMATIC APPLICATION:
          // If Client State === Customer State: Condition 1 (Same State: SGST + CGST)
          // If Client State !== Customer State: Condition 2 (Other State: IGST)
          const same = checkIsSameState(user, found, gstVal);
          setTaxType(same ? 'intrastate' : 'interstate');
        } else {
          setCustomerName('');
          setCustomerGst('');
          setTaxType('intrastate');
        }

        if (products && products.length > 0) {
          setItems([
            {
              description: '',
              itemNotes: '',
              hsnSac: '',
              quantity: '',
              unitPrice: '',
              taxPercent: 18,
              amount: 0
            }
          ]);
        } else {
          setItems([
            {
              description: '',
              itemNotes: '',
              hsnSac: '',
              quantity: '',
              unitPrice: '',
              taxPercent: 18,
              amount: 0
            }
          ]);
        }
      }
    }
  }, [isOpen, editingInvoice, customers, products, bankAccounts, documentType]);

  if (!isOpen) return null;

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Check if updated row is service
    const isServ = checkIsServiceItem(newItems[index], products);
    newItems[index].isService = isServ;

    if (field === 'quantity' || field === 'unitPrice' || field === 'hsnSac' || field === 'description') {
      const q = isServ ? 1 : (parseFloat(newItems[index].quantity) || 0);
      const u = parseFloat(newItems[index].unitPrice) || 0;
      newItems[index].amount = q * u;
    }

    setItems(newItems);
  };

  const handleSelectProduct = (index, productId) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      const isServ = checkIsServiceItem(prod, products);
      const newItems = [...items];
      newItems[index].productId = prod.id;
      newItems[index].description = prod.title;
      newItems[index].itemNotes = prod.description || prod.notes || newItems[index].itemNotes || '';
      newItems[index].hsnSac = prod.hsnSac || prod.hsn_sac || '';
      newItems[index].unitPrice = prod.rate || '';
      newItems[index].taxPercent = prod.taxPercent ?? prod.tax_percent ?? 18;
      newItems[index].isService = isServ;
      newItems[index].quantity = isServ ? 'N/A' : 1;
      newItems[index].amount = prod.rate || 0;
      setItems(newItems);
    }
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        description: '',
        itemNotes: '',
        hsnSac: '',
        quantity: '',
        unitPrice: '',
        taxPercent: 18,
        amount: 0,
        isService: false
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) {
      addToast('Document must contain at least one item', 'warning');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const clientGst = user?.gstNumber || user?.gst_number || '';
  const clientStateName = user?.state || 'Tamil Nadu';
  const clientStateObj = detectStateFromGstOrName(clientGst, clientStateName);

  const selectedCust = customers.find(c => c.name === customerName);
  const custStateName = selectedCust?.state || selectedCust?.city || '';
  const custStateObj = detectStateFromGstOrName(customerGst, custStateName);

  // 2 Conditions State Evaluation Handlers (Automated)
  const handleSelectCustomer = (c) => {
    setCustomerName(c.name);
    const gstVal = c.gstNumber || c.gst_number || '';
    setCustomerGst(gstVal);
    const isSame = checkIsSameState(user, c, gstVal);
    setTaxType(isSame ? 'intrastate' : 'interstate');
  };

  const handleCustGstChange = (val) => {
    const uppercaseVal = val.toUpperCase();
    setCustomerGst(uppercaseVal);
    const currentCust = customers.find(c => c.name === customerName);
    const isSame = checkIsSameState(user, currentCust, uppercaseVal);
    setTaxType(isSame ? 'intrastate' : 'interstate');
  };

  // Calculations: Calculate strictly based on quantity * unitPrice
  const subtotal = items.reduce((acc, item) => {
    const isServ = checkIsServiceItem(item, products);
    const q = isServ ? 1 : (parseFloat(item.quantity) || 0);
    const u = parseFloat(item.unitPrice) || 0;
    return acc + (q * u);
  }, 0);

  const totalTaxAmount = items.reduce((acc, item) => {
    const isServ = checkIsServiceItem(item, products);
    const q = isServ ? 1 : (parseFloat(item.quantity) || 0);
    const u = parseFloat(item.unitPrice) || 0;
    const itemAmount = q * u;
    const taxP = item.taxPercent === '' || item.taxPercent === undefined ? 18 : (parseFloat(item.taxPercent) || 0);
    return acc + (itemAmount * (taxP / 100));
  }, 0);

  const isIntrastate = taxType === 'intrastate';
  // 2 CONDITIONS LOGIC:
  // Condition 1 (Same State): SGST + CGST applicable (e.g., 18% => SGST 9% + CGST 9%)
  // Condition 2 (Other State): IGST applicable (e.g., 18% => IGST 18%)
  const cgst = isIntrastate ? (totalTaxAmount / 2) : 0;
  const sgst = isIntrastate ? (totalTaxAmount / 2) : 0;
  const igst = isIntrastate ? 0 : totalTaxAmount;
  const grandTotal = subtotal + totalTaxAmount;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (documentType === 'Payment') {
      const amt = parseFloat(paymentAmount) || 0;
      const finalInvNumber = invoiceNumber || generateNextInvoiceNumber(invoices, user, documentType);
      const savedInvoice = {
        id: editingInvoice ? editingInvoice.id : `PAY-${Date.now()}`,
        documentType: 'Payment',
        invoiceNumber: finalInvNumber,
        customerName: paidTo || customerName || 'Party',
        paidBy: paidBy,
        paidTo: paidTo,
        paymentMethod: paymentMethod,
        paymentPurpose: paymentPurpose,
        customerGst: customerGst || 'N/A',
        date: invoiceDate,
        subtotal: amt,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
        grandTotal: amt,
        status: 'Completed',
        items: [
          {
            description: paymentPurpose || 'Payment Entry',
            hsnSac: 'N/A',
            quantity: 1,
            unitPrice: amt,
            taxPercent: 0,
            amount: amt
          }
        ]
      };

      onSaveInvoice(savedInvoice);
      addToast(`Payment Receipt ${finalInvNumber} recorded successfully!`, 'success', 'Payment Entry Saved');
      onClose();
      return;
    }

    let effectiveCustName = customerName;
    let effectiveCustGst = customerGst;

    if (!effectiveCustName && customers && customers.length > 0) {
      effectiveCustName = customers[0].name;
      effectiveCustGst = customers[0].gstNumber || customers[0].gst_number || '';
    }

    if (!effectiveCustName) {
      addToast('Please select or register a customer first', 'error');
      return;
    }

    const finalInvNumber = invoiceNumber || generateNextInvoiceNumber(invoices, user, documentType);

    const processedItems = items.map((item) => {
      const isServ = checkIsServiceItem(item, products);
      const q = isServ ? 1 : (item.quantity === '' || item.quantity === undefined ? 1 : (parseFloat(item.quantity) || 1));
      const u = item.unitPrice === '' || item.unitPrice === undefined ? 0 : (parseFloat(item.unitPrice) || 0);
      return {
        ...item,
        description: item.description || 'Tax Advisory & Audit Service',
        itemNotes: item.itemNotes || '',
        hsnSac: item.hsnSac || '1185',
        quantity: isServ ? 'N/A' : q,
        unitPrice: u,
        amount: q * u,
        isService: isServ
      };
    });

    const effectiveSavedDocType = editingInvoice
      ? (editingInvoice.documentType || editingInvoice.document_type || documentType)
      : documentType;

    const foundCustomer = customers.find(c => c.name === effectiveCustName);
    const custAddress = foundCustomer?.address || '';
    const custCity = foundCustomer?.city || '';
    const custState = foundCustomer?.state || custStateObj.name || '';

    const savedInvoice = {
      id: editingInvoice ? editingInvoice.id : `${effectiveSavedDocType.substring(0, 3).toUpperCase()}-${Date.now()}`,
      documentType: effectiveSavedDocType,
      document_type: effectiveSavedDocType,
      invoiceNumber: finalInvNumber,
      customerName: effectiveCustName,
      customerGst: effectiveCustGst || '',
      customerAddress: custAddress,
      customerCity: custCity,
      customerState: custState,
      clientState: clientStateObj.name,
      placeOfSupply: custStateObj.name,
      taxType: isIntrastate ? 'intrastate' : 'interstate',
      date: invoiceDate,
      subtotal,
      cgst,
      sgst,
      igst,
      totalTax: totalTaxAmount,
      grandTotal,
      status,
      items: processedItems
    };

    onSaveInvoice(savedInvoice);
    addToast(`${documentType} ${finalInvNumber} ${editingInvoice ? 'updated' : 'generated'} successfully!`, 'success', `${documentType} Created`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-dark-950/85 backdrop-blur-md overflow-y-auto">
      <div className={`glass-card rounded-3xl p-6 sm:p-10 max-w-5xl w-full border backdrop-blur-2xl transition-all duration-500 animate-slide-up my-6 max-h-[92vh] overflow-y-auto ${theme.cardBg}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${theme.iconBg}`}>
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border uppercase tracking-wider ${theme.badge}`}>
                  {theme.badgeText}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white font-serif">
                {editingInvoice ? `Edit ${documentType}` : `Create New ${documentType}`}
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                {documentType === 'Payment' 
                  ? 'Record Payment receipt, payment method, payer/payee details & purpose'
                  : (editingInvoice ? `Modify details for ${editingInvoice.invoiceNumber || editingInvoice.invoice_number}` : 'Auto GST CGST/SGST/IGST calculation module')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {documentType === 'Payment' ? (
          /* PAYMENT ENTRY FORM */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method (Registered Bank Details) *</label>
                <SearchableBankSelect
                  bankAccounts={bankAccounts}
                  selectedMethod={paymentMethod}
                  onSelectBankMethod={(m) => setPaymentMethod(m)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Paid To (Registered Customer) *</label>
                <SearchableCustomerSelect
                  customers={customers}
                  selectedName={paidTo}
                  labelPlaceholder="Search & Select Registered Payee Customer..."
                  onSelectCustomer={(c) => {
                    setPaidTo(c.name);
                    setCustomerName(c.name);
                    setCustomerGst(c.gstNumber || c.gst_number || '');
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Purpose / Description *</label>
                <input
                  type="text"
                  value={paymentPurpose}
                  onChange={(e) => setPaymentPurpose(e.target.value)}
                  placeholder="e.g. Monthly Tax Audit Fees / Office Rent / Vendor Settlement"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Amount Paid (₹) *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="12500"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono font-bold text-emerald-400"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 font-mono">
                Payment Document Ref: <span className="text-cyan-400 font-bold">{invoiceNumber}</span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* STANDARD TAX DOCUMENT INVOICE FORM */
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Customer & State / Place of Supply Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Customer Entity *</label>
                <SearchableCustomerSelect 
                  customers={customers}
                  selectedName={customerName}
                  onSelectCustomer={handleSelectCustomer}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer GSTIN Number</label>
                <input
                  type="text"
                  value={customerGst}
                  onChange={(e) => handleCustGstChange(e.target.value)}
                  placeholder="29AABCA1234B1Z2"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono uppercase"
                />
              </div>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-indigo-300">{documentType} Number (Auto Sequential)</label>
                  <button
                    type="button"
                    onClick={() => setInvoiceNumber(generateNextInvoiceNumber(invoices, user, documentType))}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 cursor-pointer"
                    title="Auto-calculate next sequential document number"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto Sequence
                  </button>
                </div>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono font-bold text-indigo-300 border-indigo-500/40 bg-indigo-950/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Document Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono text-white"
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 font-serif">Line Items & Services</label>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono">
                      <th className="py-2 px-3">Description / Item</th>
                      <th className="py-2 px-3 w-24">HSN/SAC</th>
                      <th className="py-2 px-3 w-20">Qty</th>
                      <th className="py-2 px-3 w-24">Unit Price (₹)</th>
                      <th className="py-2 px-3 w-20">Tax %</th>
                      <th className="py-2 px-3 w-28 text-right">Amount (₹)</th>
                      <th className="py-2 px-3 w-32 text-right">GST Amount (₹)</th>
                      <th className="py-2 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {items.map((item, index) => {
                      const isServ = checkIsServiceItem(item, products);
                      const qNum = isServ ? 1 : (parseFloat(item.quantity) || 1);
                      const uNum = parseFloat(item.unitPrice) || 0;
                      const rowAmount = qNum * uNum;
                      const itemTaxPercent = item.taxPercent === '' || item.taxPercent === undefined ? 18 : (parseFloat(item.taxPercent) || 0);
                      const rowGstAmount = rowAmount * (itemTaxPercent / 100);

                      return (
                        <tr key={index} className="group">
                          <td className="py-2 px-3 relative z-30">
                            <div className="min-w-[220px]">
                              <SearchableProductSelect
                                products={products}
                                selectedTitle={item.description}
                                onSelectProduct={(p) => handleSelectProduct(index, p.id)}
                                onChangeCustomText={(text) => handleItemChange(index, 'description', text)}
                              />
                              <input
                                type="text"
                                value={item.itemNotes || ''}
                                onChange={(e) => handleItemChange(index, 'itemNotes', e.target.value)}
                                placeholder="Add item description / notes (shown on PDF)..."
                                className="w-full mt-1.5 px-2.5 py-1 rounded-lg glass-input text-[11px] font-sans text-slate-200 placeholder:text-slate-500 border-slate-700/60"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.hsnSac}
                              onChange={(e) => handleItemChange(index, 'hsnSac', e.target.value)}
                              placeholder="998222"
                              className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono"
                            />
                          </td>
                          <td className="py-2 px-3">
                            {isServ ? (
                              <div>
                                <input
                                  type="text"
                                  disabled
                                  readOnly
                                  value="N/A"
                                  className="w-full px-2 py-1.5 rounded-lg bg-dark-950 text-slate-500 border border-slate-800/80 text-xs font-mono text-center font-bold cursor-not-allowed opacity-70"
                                  title="Quantity is not applicable for Service catalog items"
                                />
                                <span className="text-[9px] text-slate-500 font-mono block text-center mt-0.5 font-medium">Service Qty N/A</span>
                              </div>
                            ) : (
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                placeholder="1"
                                className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono"
                              />
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2 py-1.5 rounded-lg glass-input text-xs font-mono"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono text-emerald-400 font-bold whitespace-nowrap">
                            <div>{itemTaxPercent}%</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {isIntrastate 
                                ? `(SGST ${(itemTaxPercent / 2)}% + CGST ${(itemTaxPercent / 2)}%)` 
                                : `(IGST ${itemTaxPercent}%)`}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-200">
                            ₹{rowAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                            <div>₹{rowGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="text-[10px] font-normal text-indigo-300">
                              {isIntrastate 
                                ? `₹${(rowGstAmount / 2).toFixed(2)} + ₹${(rowGstAmount / 2).toFixed(2)}` 
                                : `IGST ₹${rowGstAmount.toFixed(2)}`}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemRow(index)}
                              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Summary Card */}
            <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal (Excl. GST):</span>
                <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {isIntrastate ? (
                <>
                  <div className="flex justify-between text-indigo-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Central CGST (9%):
                    </span>
                    <span className="font-bold">₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-indigo-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> State SGST (9%):
                    </span>
                    <span className="font-bold">₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Integrated IGST (Same State):</span>
                    <span>₹0.00 <span className="text-[10px] text-slate-600">(Not Applicable)</span></span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-purple-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Integrated IGST (18%):
                    </span>
                    <span className="font-bold">₹{igst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Central CGST (Other State):</span>
                    <span>₹0.00 <span className="text-[10px] text-slate-600">(Not Applicable)</span></span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>State SGST (Other State):</span>
                    <span>₹0.00 <span className="text-[10px] text-slate-600">(Not Applicable)</span></span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-emerald-400 font-semibold pt-1 border-t border-slate-800">
                <span>Total GST Amount:</span>
                <span className="font-bold">₹{totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-emerald-400 pt-1 border-t border-slate-700">
                <span>Grand Total (Incl. GST):</span>
                <span className="text-base text-emerald-300">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Status:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-dark-900 text-xs font-semibold text-emerald-400 border border-slate-700"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl bg-gradient-to-r ${theme.submitBtn} text-white font-bold text-xs shadow-lg cursor-pointer transition-all`}
                >
                  {editingInvoice ? `Update ${documentType}` : `Create & Generate ${documentType}`}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
