/**
 * Professional GST Tax Invoice PDF & Print Generator
 * Renders high-quality Tax Invoice with Company Logo, Customer Details, GST Breakdown & Print/Save capabilities.
 */

export const generateInvoicePDF = (invoice, user) => {
  if (!invoice) return;

  const logoSrc = user?.companyLogo || user?.company_logo || null;
  const companyName = user?.companyName || user?.company_name || 'TaxPulse Billing Solutions';
  const companyAddress = user?.companyAddress || user?.company_address || 'Suite 402, Quantum Tech Tower, Chennai, Tamil Nadu';
  const companyGst = user?.gstNumber || user?.gst_number || '33AAACD1234F1Z5';
  const companyPan = user?.panNumber || user?.pan_number || 'AAACD1234F';
  const companyContact = user?.contactNumber || user?.phone || '+91 98765 43210';
  const companyEmail = user?.email || 'billing@taxpulse.io';

  const invNumber = invoice.invoiceNumber || invoice.invoice_number || 'TP-2026-101';
  const invDate = invoice.date || '2026-08-26';
  const dueDate = invoice.dueDate || invoice.due_date || '2026-09-09';
  const status = invoice.status || 'Pending';

  const custName = invoice.customerName || invoice.customer_name || 'Valued Customer';
  const custGst = invoice.customerGst || invoice.customer_gst || 'N/A';

  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
    {
      description: 'GSTR-1 & GSTR-3B Monthly Tax Filing & Compliance Services',
      hsnSac: '998222',
      quantity: 1,
      unitPrice: invoice.subtotal || invoice.grandTotal || 12500,
      taxPercent: 18,
      amount: invoice.subtotal || invoice.grandTotal || 12500
    }
  ];

  const subtotal = invoice.subtotal || items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
  const totalTax = invoice.totalTax || invoice.total_tax || (subtotal * 0.18);
  const cgst = invoice.cgst !== undefined ? invoice.cgst : totalTax / 2;
  const sgst = invoice.sgst !== undefined ? invoice.sgst : totalTax / 2;
  const igst = invoice.igst !== undefined ? invoice.igst : 0;
  const grandTotal = invoice.grandTotal || invoice.grand_total || (subtotal + totalTax);

  // Generate Print HTML Document Window
  const printWindow = window.open('', '_blank');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Tax Invoice - ${invNumber}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        body { background: #ffffff; color: #1e293b; padding: 40px; font-size: 13px; line-height: 1.5; }
        .invoice-box { max-width: 850px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px; }
        
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-b: 2px solid #6366f1; margin-bottom: 25px; }
        .company-brand { display: flex; align-items: center; gap: 16px; }
        .company-logo { max-height: 70px; max-width: 180px; object-fit: contain; border-radius: 6px; }
        .company-details h1 { font-size: 20px; color: #0f172a; font-weight: 800; margin-bottom: 4px; }
        .company-details p { font-size: 11px; color: #64748b; line-height: 1.4; }
        
        .invoice-title-block { text-align: right; }
        .invoice-title-block h2 { font-size: 24px; font-weight: 900; color: #4f46e5; letter-spacing: 1px; }
        .inv-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-top: 6px; }
        .badge-paid { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
        .badge-pending { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .badge-overdue { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

        .meta-grid { display: flex; justify-content: space-between; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #f1f5f9; margin-bottom: 25px; }
        .meta-col { flex: 1; }
        .meta-col h3 { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .meta-col p { font-size: 12px; font-weight: 600; color: #1e293b; }

        .bill-to-section { display: flex; justify-content: space-between; margin-bottom: 25px; gap: 20px; }
        .bill-card { flex: 1; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; }
        .bill-card h3 { font-size: 11px; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; margin-bottom: 8px; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th { background: #4f46e5; color: #ffffff; padding: 10px 12px; font-size: 11px; text-transform: uppercase; text-align: left; font-weight: 700; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155; }
        tr:nth-child(even) { background: #f8fafc; }
        
        .totals-container { display: flex; justify-content: flex-end; margin-bottom: 30px; }
        .totals-table { width: 320px; }
        .totals-table td { padding: 6px 12px; border-bottom: none; }
        .totals-table tr.grand-total { background: #eef2ff; font-weight: 800; font-size: 14px; color: #3730a3; }
        
        .footer-terms { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; pt: 20px; margin-top: 30px; }
        .terms p { font-size: 10px; color: #94a3b8; line-height: 1.5; }
        .signature-box { text-align: center; width: 200px; }
        .sig-line { border-bottom: 1px solid #94a3b8; margin-bottom: 6px; height: 40px; }
        
        @media print {
          body { padding: 0; }
          .invoice-box { border: none; padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      
      <div class="no-print" style="max-width: 850px; margin: 0 auto 20px auto; text-align: right;">
        <button onclick="window.print()" style="background: #4f46e5; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px;">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div class="invoice-box">
        
        <!-- Header with Company Logo -->
        <div class="header">
          <div class="company-brand">
            ${logoSrc ? `<img src="${logoSrc}" class="company-logo" alt="${companyName} Logo" />` : ''}
            <div class="company-details">
              <h1>${companyName}</h1>
              <p>${companyAddress}</p>
              <p><strong>GSTIN:</strong> ${companyGst} | <strong>PAN:</strong> ${companyPan}</p>
              <p><strong>Phone:</strong> ${companyContact} | <strong>Email:</strong> ${companyEmail}</p>
            </div>
          </div>
          <div class="invoice-title-block">
            <h2>TAX INVOICE</h2>
            <p style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 4px;"># ${invNumber}</p>
            <span class="inv-badge ${status === 'Paid' ? 'badge-paid' : status === 'Pending' ? 'badge-pending' : 'badge-overdue'}">
              STATUS: ${status.toUpperCase()}
            </span>
          </div>
        </div>

        <!-- Meta Grid -->
        <div class="meta-grid">
          <div class="meta-col">
            <h3>Invoice Date</h3>
            <p>${invDate}</p>
          </div>
          <div class="meta-col">
            <h3>Place of Supply</h3>
            <p>Tamil Nadu (33)</p>
          </div>
          <div class="meta-col">
            <h3>Reverse Charge</h3>
            <p>No (N/A)</p>
          </div>
        </div>

        <!-- Bill To -->
        <div class="bill-to-section">
          <div class="bill-card">
            <h3>Billed To Customer</h3>
            <p style="font-size: 14px; font-weight: 800; color: #0f172a;">${custName}</p>
            <p style="font-family: monospace; color: #475569; margin-top: 4px;"><strong>GSTIN:</strong> ${custGst}</p>
            <p style="color: #64748b; margin-top: 2px;">Chennai, Tamil Nadu, India</p>
          </div>
        </div>

        <!-- Items Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 45%;">Description of Services / Items</th>
              <th style="width: 15%;">HSN/SAC</th>
              <th style="width: 10%; text-align: center;">Qty</th>
              <th style="width: 12%; text-align: right;">Rate (₹)</th>
              <th style="width: 13%; text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${item.description}</strong></td>
                <td style="font-family: monospace;">${item.hsnSac || '998222'}</td>
                <td style="text-align: center;">${item.quantity || 1}</td>
                <td style="text-align: right; font-family: monospace;">₹${(item.unitPrice || item.amount || 0).toLocaleString('en-IN')}</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold;">₹${(item.amount || 0).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals Breakdown -->
        <div class="totals-container">
          <table class="totals-table">
            <tr>
              <td style="color: #64748b;">Subtotal (Taxable Amount):</td>
              <td style="text-align: right; font-family: monospace; font-weight: 600;">₹${subtotal.toLocaleString('en-IN')}</td>
            </tr>
            ${cgst > 0 ? `
              <tr>
                <td style="color: #64748b;">CGST (9%):</td>
                <td style="text-align: right; font-family: monospace;">₹${cgst.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="color: #64748b;">SGST (9%):</td>
                <td style="text-align: right; font-family: monospace;">₹${sgst.toLocaleString('en-IN')}</td>
              </tr>
            ` : `
              <tr>
                <td style="color: #64748b;">IGST (18%):</td>
                <td style="text-align: right; font-family: monospace;">₹${igst.toLocaleString('en-IN')}</td>
              </tr>
            `}
            <tr>
              <td style="color: #64748b; font-weight: 600;">Total Tax Amount:</td>
              <td style="text-align: right; font-family: monospace; font-weight: 600; color: #4f46e5;">₹${totalTax.toLocaleString('en-IN')}</td>
            </tr>
            <tr class="grand-total">
              <td>Grand Total (INR):</td>
              <td style="text-align: right; font-family: monospace;">₹${grandTotal.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <!-- Footer & Signature -->
        <div class="footer-terms">
          <div class="terms">
            <p><strong>Terms & Conditions:</strong></p>
            <p>1. Payment due within 15 days of invoice date.</p>
            <p>2. E-invoice digitally generated under Section 31 of CGST Act 2017.</p>
            <p>3. Subject to Chennai Jurisdiction only.</p>
          </div>
          <div class="signature-box">
            <div class="sig-line"></div>
            <p style="font-size: 11px; font-weight: bold; color: #0f172a;">For ${companyName}</p>
            <p style="font-size: 10px; color: #64748b;">Authorized Signatory</p>
          </div>
        </div>

      </div>

    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
