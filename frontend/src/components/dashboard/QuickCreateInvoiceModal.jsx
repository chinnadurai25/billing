import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Plus, Trash2, Receipt, Calculator, CheckCircle2, 
  FileText, Building, ArrowRight, RefreshCw, Search, ChevronDown, Check, User, Package
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const generateNextInvoiceNumber = (invoices = [], user = null) => {
  let prefix = 'TP-2026-';

  // Check if user has saved custom invoice prefix in settings
  if (user?.id) {
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
const SearchableCustomerSelect = ({ customers = [], selectedName, onSelectCustomer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
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
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-dark-900 flex items-center justify-between cursor-pointer border border-slate-700/70 hover:border-brand-500/50 transition-all"
      >
        <div className="flex items-center gap-2 truncate">
          <User className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="font-semibold text-white truncate">
            {selectedCust ? `${selectedCust.name} (${selectedCust.city || 'TN'})` : (selectedName || 'Select Customer Entity...')}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 glass-card rounded-2xl p-2 border border-slate-700 shadow-2xl bg-dark-900/95 backdrop-blur-xl max-h-60 overflow-y-auto space-y-1">
          <div className="relative mb-1">
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
                key={c.id}
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
                  <div className="text-[10px] text-slate-400 font-mono">{c.gstNumber || c.gst_number || 'No GSTIN'} • {c.city}</div>
                </div>
                {selectedName === c.name && <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-xs text-slate-400">No matching customers found</div>
          )}
        </div>
      )}
    </div>
  );
};

// Searchable Catalog Product/Service Dropdown Component
const SearchableProductSelect = ({ products = [], selectedTitle, onSelectProduct }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
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
    <div className="relative mb-1" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs bg-dark-950 flex items-center justify-between cursor-pointer border border-slate-800 hover:border-indigo-500/50 transition-all"
      >
        <div className="flex items-center gap-1.5 truncate">
          <Package className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold text-slate-200 truncate">
            {selectedProd ? `${selectedProd.title} (₹${selectedProd.rate || 0})` : (selectedTitle || 'Search & Select Catalog Service...')}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 glass-card rounded-2xl p-2 border border-slate-700 shadow-2xl bg-dark-900/95 backdrop-blur-xl max-h-56 overflow-y-auto space-y-1 min-w-[260px]">
          <div className="relative mb-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search catalog service, HSN/SAC..."
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
                className={`px-3 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  selectedTitle === p.title ? 'bg-indigo-600/30 text-white border border-indigo-500/40 font-bold' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div>
                  <div className="font-medium text-slate-200">{p.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono">HSN: {p.hsnSac || p.hsn_sac || 'N/A'} • Rate: ₹{p.rate || 0}</div>
                </div>
                {selectedTitle === p.title && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-xs text-slate-400">No catalog items match search</div>
          )}
        </div>
      )}
    </div>
  );
};

export const QuickCreateInvoiceModal = ({ 
  isOpen, 
  onClose, 
  customers = [], 
  products = [], 
  invoices = [],
  user = null,
  editingInvoice = null,
  onSaveInvoice 
}) => {
  const { addToast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerGst, setCustomerGst] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('2026-08-26');
  const [taxType, setTaxType] = useState('intrastate'); // 'intrastate' (CGST+SGST) or 'interstate' (IGST)
  const [status, setStatus] = useState('Pending');

  const [items, setItems] = useState([
    {
      description: '',
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
        setCustomerGst(editingInvoice.customerGst || editingInvoice.customer_gst || '');
        setInvoiceDate(editingInvoice.date || new Date().toISOString().split('T')[0]);
        setStatus(editingInvoice.status || 'Pending');
        setTaxType((editingInvoice.igst || 0) > 0 ? 'interstate' : 'intrastate');
        
        if (editingInvoice.items && Array.isArray(editingInvoice.items) && editingInvoice.items.length > 0) {
          setItems(editingInvoice.items);
        } else {
          setItems([{
            description: 'GSTR Monthly Tax Filing',
            hsnSac: '998222',
            quantity: 1,
            unitPrice: editingInvoice.grandTotal || editingInvoice.grand_total || 12500,
            taxPercent: 18,
            amount: editingInvoice.grandTotal || editingInvoice.grand_total || 12500
          }]);
        }
      } else {
        setInvoiceNumber(generateNextInvoiceNumber(invoices, user));
        setStatus('Pending');

        if (customers && customers.length > 0) {
          const found = customers.find(c => c.name === customerName);
          if (!found) {
            setCustomerName(customers[0].name);
            setCustomerGst(customers[0].gstNumber || customers[0].gst_number || '');
          } else {
            setCustomerGst(found.gstNumber || found.gst_number || '');
          }
        } else {
          setCustomerName('');
          setCustomerGst('');
        }

        if (products && products.length > 0) {
          setItems([
            {
              description: products[0].title,
              hsnSac: '',
              quantity: '',
              unitPrice: '',
              taxPercent: products[0].taxPercent || products[0].tax_percent || 18,
              amount: 0
            }
          ]);
        } else {
          setItems([
            {
              description: '',
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
  }, [isOpen, editingInvoice, customers, products]);

  if (!isOpen) return null;

  const handleCustomerChange = (e) => {
    const selectedName = e.target.value;
    setCustomerName(selectedName);
    const found = customers.find(c => c.name === selectedName);
    if (found) {
      setCustomerGst(found.gstNumber || found.gst_number || '');
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === 'quantity' || field === 'unitPrice') {
      const q = parseFloat(newItems[index].quantity) || 0;
      const u = parseFloat(newItems[index].unitPrice) || 0;
      newItems[index].amount = q * u;
    }

    setItems(newItems);
  };

  const handleSelectProduct = (index, productId) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      const newItems = [...items];
      newItems[index].description = prod.title;
      newItems[index].hsnSac = prod.hsnSac || prod.hsn_sac;
      newItems[index].unitPrice = prod.rate;
      newItems[index].amount = newItems[index].quantity * prod.rate;
      setItems(newItems);
    }
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        description: '',
        hsnSac: '',
        quantity: '',
        unitPrice: '',
        taxPercent: 18,
        amount: 0
      }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) {
      addToast('Invoice must contain at least one item', 'warning');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => {
    const q = item.quantity === '' || item.quantity === undefined ? 1 : (parseFloat(item.quantity) || 0);
    const u = item.unitPrice === '' || item.unitPrice === undefined ? 12500 : (parseFloat(item.unitPrice) || 0);
    const itemAmount = (item.quantity !== '' && item.unitPrice !== '' && item.amount) ? item.amount : (q * u);
    return acc + itemAmount;
  }, 0);
  const totalTaxAmount = subtotal * 0.18;
  const cgst = taxType === 'intrastate' ? totalTaxAmount / 2 : 0;
  const sgst = taxType === 'intrastate' ? totalTaxAmount / 2 : 0;
  const igst = taxType === 'interstate' ? totalTaxAmount : 0;
  const grandTotal = subtotal + totalTaxAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
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

    const finalInvNumber = invoiceNumber || generateNextInvoiceNumber(invoices, user);

    const processedItems = items.map((item) => {
      const q = item.quantity === '' || item.quantity === undefined ? 1 : (parseFloat(item.quantity) || 1);
      const u = item.unitPrice === '' || item.unitPrice === undefined ? 12500 : (parseFloat(item.unitPrice) || 12500);
      return {
        ...item,
        description: item.description || 'Tax Advisory & Audit Service',
        hsnSac: item.hsnSac || '1185',
        quantity: q,
        unitPrice: u,
        amount: q * u
      };
    });

    const savedInvoice = {
      id: editingInvoice ? editingInvoice.id : `INV-${Date.now()}`,
      invoiceNumber: finalInvNumber,
      customerName: effectiveCustName,
      customerGst: effectiveCustGst || '33AAACD9999F1Z0',
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
    addToast(`Invoice ${finalInvNumber} ${editingInvoice ? 'updated' : 'generated'} successfully!`, 'success', editingInvoice ? 'Tax Invoice Updated' : 'Tax Invoice Created');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-dark-950/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-card rounded-3xl p-6 sm:p-10 max-w-5xl w-full border border-slate-700 shadow-2xl animate-slide-up my-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-serif">
                {editingInvoice ? 'Edit & Update Tax Invoice' : 'Quick Create Tax Invoice'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {editingInvoice ? `Modify details for ${editingInvoice.invoiceNumber || editingInvoice.invoice_number}` : 'Auto GST CGST/SGST/IGST calculation module'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Customer & Tax Type Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Customer Entity *</label>
              <SearchableCustomerSelect 
                customers={customers}
                selectedName={customerName}
                onSelectCustomer={(c) => {
                  setCustomerName(c.name);
                  setCustomerGst(c.gstNumber || c.gst_number || '');
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Customer GSTIN Number</label>
              <input
                type="text"
                value={customerGst}
                onChange={(e) => setCustomerGst(e.target.value)}
                placeholder="29AABCA1234B1Z2"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-indigo-300">Invoice Number (Auto Sequential)</label>
                <button
                  type="button"
                  onClick={() => setInvoiceNumber(generateNextInvoiceNumber(invoices, user))}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 cursor-pointer"
                  title="Auto-calculate next sequential invoice number"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tax Scheme Type</label>
              <select
                value={taxType}
                onChange={(e) => setTaxType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-dark-900"
              >
                <option value="intrastate">Intrastate (CGST 9% + SGST 9%)</option>
                <option value="interstate">Interstate (IGST 18%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono">Invoice Line Items</h4>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-dark-900/80 border border-slate-800 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] text-slate-400 mb-1">Select Catalog Service / Item</label>
                      <SearchableProductSelect 
                        products={products}
                        selectedTitle={item.description}
                        onSelectProduct={(p) => {
                          const newItems = [...items];
                          newItems[idx].description = p.title;
                          newItems[idx].hsnSac = p.hsnSac || p.hsn_sac || '998222';
                          newItems[idx].unitPrice = p.rate || 0;
                          newItems[idx].amount = (newItems[idx].quantity || 1) * (p.rate || 0);
                          setItems(newItems);
                        }}
                      />
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400">HSN/SAC</label>
                      <input
                        type="text"
                        value={item.hsnSac}
                        onChange={(e) => handleItemChange(idx, 'hsnSac', e.target.value)}
                        placeholder="1185"
                        className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        placeholder="1"
                        className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400">Rate (₹)</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        placeholder="12500"
                        className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-1 flex items-center justify-end pt-3 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Summary Calculation Card */}
          <div className="p-4 rounded-2xl bg-dark-900/90 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Subtotal Amount:</span>
              <span className="font-mono text-white">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {taxType === 'intrastate' ? (
              <>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>CGST (9%):</span>
                  <span className="font-mono text-indigo-300">₹{cgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>SGST (9%):</span>
                  <span className="font-mono text-indigo-300">₹{sgst.toLocaleString('en-IN')}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-xs text-slate-400">
                <span>IGST (18%):</span>
                <span className="font-mono text-brand-accent">₹{igst.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
              <span>Grand Total (Incl. GST):</span>
              <span className="font-mono text-emerald-400 text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Status Pick & Save */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Set Initial Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg glass-input text-xs bg-dark-900"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> {editingInvoice ? 'Update Invoice' : 'Issue Invoice'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
