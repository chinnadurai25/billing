import React, { useState } from 'react';
import { 
  X, Plus, Trash2, Receipt, Calculator, CheckCircle2, 
  FileText, Building, ArrowRight
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const QuickCreateInvoiceModal = ({ 
  isOpen, 
  onClose, 
  customers, 
  products, 
  onSaveInvoice 
}) => {
  const { addToast } = useToast();

  const [customerName, setCustomerName] = useState(customers[0]?.name || '');
  const [customerGst, setCustomerGst] = useState(customers[0]?.gstNumber || '');
  const [invoiceDate, setInvoiceDate] = useState('2026-08-26');
  const [dueDate, setDueDate] = useState('2026-09-09');
  const [taxType, setTaxType] = useState('intrastate'); // 'intrastate' (CGST+SGST) or 'interstate' (IGST)
  const [status, setStatus] = useState('Pending');

  const [items, setItems] = useState([
    {
      description: products[0]?.title || 'GSTR Monthly Tax Filing',
      hsnSac: products[0]?.hsnSac || '998222',
      quantity: 1,
      unitPrice: products[0]?.rate || 12500,
      taxPercent: 18,
      amount: products[0]?.rate || 12500
    }
  ]);

  if (!isOpen) return null;

  const handleCustomerChange = (e) => {
    const selectedName = e.target.value;
    setCustomerName(selectedName);
    const found = customers.find(c => c.name === selectedName);
    if (found) {
      setCustomerGst(found.gstNumber);
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
      newItems[index].hsnSac = prod.hsnSac;
      newItems[index].unitPrice = prod.rate;
      newItems[index].amount = newItems[index].quantity * prod.rate;
      setItems(newItems);
    }
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        description: 'Tax Advisory & Compliance',
        hsnSac: '998212',
        quantity: 1,
        unitPrice: 10000,
        taxPercent: 18,
        amount: 10000
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
  const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
  const totalTaxAmount = subtotal * 0.18;
  const cgst = taxType === 'intrastate' ? totalTaxAmount / 2 : 0;
  const sgst = taxType === 'intrastate' ? totalTaxAmount / 2 : 0;
  const igst = taxType === 'interstate' ? totalTaxAmount : 0;
  const grandTotal = subtotal + totalTaxAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName) {
      addToast('Please select or enter customer name', 'error');
      return;
    }

    const newInvNumber = `TP-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newInvoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: newInvNumber,
      customerName,
      customerGst: customerGst || '33AAACD9999F1Z0',
      date: invoiceDate,
      dueDate,
      subtotal,
      cgst,
      sgst,
      igst,
      totalTax: totalTaxAmount,
      grandTotal,
      status,
      items
    };

    onSaveInvoice(newInvoice);
    addToast(`Invoice ${newInvNumber} generated successfully!`, 'success', 'Tax Invoice Created');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-700 shadow-2xl animate-slide-up my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-serif">Quick Create Tax Invoice</h3>
              <p className="text-xs text-slate-400 font-mono">Auto GST CGST/SGST/IGST calculation module</p>
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
              <select
                value={customerName}
                onChange={handleCustomerChange}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs bg-dark-900"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>{c.name} ({c.city})</option>
                ))}
              </select>
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
                      <label className="block text-[10px] text-slate-400">Select Catalog Service</label>
                      <select
                        onChange={(e) => handleSelectProduct(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs bg-dark-950 mb-1"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
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
                        className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400">Rate (₹)</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
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
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Issue Invoice
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
