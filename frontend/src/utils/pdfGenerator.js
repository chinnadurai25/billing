/**
 * Professional Single-Layout Document & PDF Generator
 * Renders table with columns: Description/Item | HSN/SAC | Qty | Unit Price (₹) | Tax % | Amount (₹) | GST Amount (₹)
 * Dynamically loads Place of Supply & RCM from GST Governance Settings, Terms & Conditions from Settings, Subtotal, GST Amount, Grand Total, and Amount in Words.
 */

export const convertNumberToWords = (num) => {
  if (num === null || num === undefined || isNaN(num)) return 'Zero Indian Rupees Only';
  const n = Math.round(parseFloat(num));
  if (n === 0) return 'Zero Indian Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (number) => {
    if (number < 20) return a[number];
    if (number < 100) return b[Math.floor(number / 10)] + (number % 10 !== 0 ? ' ' + a[number % 10] : '');
    if (number < 1000) return a[Math.floor(number / 100)] + ' Hundred' + (number % 100 !== 0 ? ' ' + inWords(number % 100) : '');
    if (number < 100000) return inWords(Math.floor(number / 1000)) + ' Thousand' + (number % 1000 !== 0 ? ' ' + inWords(number % 1000) : '');
    if (number < 10000000) return inWords(Math.floor(number / 100000)) + ' Lakh' + (number % 100000 !== 0 ? ' ' + inWords(number % 100000) : '');
    return inWords(Math.floor(number / 10000000)) + ' Crore' + (number % 10000000 !== 0 ? ' ' + inWords(number % 10000000) : '');
  };

  return `${inWords(n)} Indian Rupees Only`;
};

export const generateInvoicePDF = (invoice, user) => {
  if (!invoice) return;

  const logoSrc = user?.companyLogo || user?.company_logo || null;
  const companyName = user?.companyName || user?.company_name || 'chinna.pvt';
  const companyAddress = user?.companyAddress || user?.company_address || 'thoothukudi';
  const companyGst = user?.gstNumber || user?.gst_number || '33AAACD1234F1Z5';
  const companyPan = user?.panNumber || user?.pan_number || 'AAACD1234F';
  const companyContact = user?.contactNumber || user?.phone || '9600989735';
  const companyEmail = user?.email || 'rchinna2003@gmail.com';

  const invNumber = invoice.invoiceNumber || invoice.invoice_number || 'BS-2026-101';
  
  // Clean ISO date format string
  const rawDate = invoice.date || new Date().toISOString().split('T')[0];
  const cleanInvDate = String(rawDate).includes('T') ? String(rawDate).split('T')[0] : String(rawDate);

  const status = invoice.status || 'Pending';

  const custName = invoice.customerName || invoice.customer_name || invoice.paidTo || invoice.paid_to || 'chinn';
  const custGst = invoice.customerGst || invoice.customer_gst || 'ROFM';

  // Retrieve GST Governance Settings dynamically
  let placeOfSupply = invoice?.placeOfSupply || invoice?.place_of_supply || user?.placeOfSupply || null;
  let isRcmEnabled = invoice?.reverseCharge || invoice?.reverse_charge || invoice?.enableRcm || false;

  try {
    const savedGst = localStorage.getItem('billson_global_gst_settings') ||
                     localStorage.getItem(`billson_gst_settings_${user?.id}`) ||
                     localStorage.getItem('billson_gst_settings_USR-901');
    if (savedGst) {
      const parsedGst = JSON.parse(savedGst);
      if (!placeOfSupply && parsedGst?.placeOfSupplyState) {
        placeOfSupply = parsedGst.placeOfSupplyState;
      }
      if (invoice?.reverseCharge === undefined && parsedGst?.enableRcmDefault) {
        isRcmEnabled = true;
      }
    }
  } catch (e) {}

  if (!placeOfSupply) placeOfSupply = 'Tamil Nadu (33)';

  // Header Title & Party Label
  const rawDocType = (invoice.documentType || invoice.document_type || '').toLowerCase();
  let headerTitle = 'TAX INVOICE';
  let partyLabel = 'BILLED TO CUSTOMER';

  if (rawDocType.includes('purchase') || invNumber.startsWith('PUR')) {
    headerTitle = 'PURCHASE INVOICE';
    partyLabel = 'BILLED FROM VENDOR';
  } else if (rawDocType.includes('estimate') || invNumber.startsWith('EST')) {
    headerTitle = 'ESTIMATE';
    partyLabel = 'ESTIMATE PREPARED FOR';
  } else if (rawDocType.includes('challan') || invNumber.startsWith('DC')) {
    headerTitle = 'DELIVERY CHALLAN';
    partyLabel = 'DELIVERED TO PARTY';
  } else if (rawDocType.includes('payment') || invNumber.startsWith('PAY')) {
    headerTitle = 'PAYMENT VOUCHER';
    partyLabel = 'PAID TO BENEFICIARY';
  } else {
    headerTitle = 'TAX INVOICE';
    partyLabel = 'BILLED TO CUSTOMER';
  }

  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
    {
      description: 'GSTR-1 & GSTR-3B Monthly Tax Filing & Compliance Services',
      hsnSac: '998222',
      quantity: 1,
      unitPrice: invoice.subtotal || invoice.grandTotal || 12500,
      taxPercent: 28,
      amount: invoice.subtotal || invoice.grandTotal || 12500
    }
  ];

  const subtotal = invoice.subtotal || items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
  const totalTax = invoice.totalTax || invoice.total_tax || (items.reduce((acc, i) => acc + ((parseFloat(i.amount || 0) * (parseFloat(i.taxPercent || 18))) / 100), 0));
  const grandTotal = invoice.grandTotal || invoice.grand_total || (subtotal + totalTax);

  // Retrieve Terms & Conditions dynamically from Settings
  let termsText = invoice?.footerTerms || invoice?.terms || user?.invoiceFooterTerms || user?.footerTerms || null;
  if (!termsText) {
    try {
      termsText = localStorage.getItem('billson_global_terms');
      if (!termsText) {
        const savedPrefs = localStorage.getItem(`billson_billing_prefs_${user?.id}`) || localStorage.getItem('billson_billing_prefs_USR-901');
        if (savedPrefs) {
          const parsed = JSON.parse(savedPrefs);
          if (parsed?.invoiceFooterTerms) termsText = parsed.invoiceFooterTerms;
        }
      }
    } catch (e) {}
  }

  if (!termsText || !termsText.trim()) {
    termsText = "1. Payment due within 15 days of document date.\n2. Generated under GST Advisory Framework.\n3. Subject to Jurisdiction only.";
  }

  const termsLines = termsText.split('\n').filter(line => line.trim().length > 0);
  const termsHtml = termsLines.map(line => `<p>${line.trim()}</p>`).join('');

  const printWindow = window.open('', '_blank');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${headerTitle} - ${invNumber}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        body { background: #ffffff; color: #1e293b; padding: 40px; font-size: 13px; line-height: 1.5; }
        .invoice-box { max-width: 900px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px; }
        
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #6366f1; margin-bottom: 25px; }
        .company-brand { display: flex; align-items: center; gap: 16px; }
        .logo-circle { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: #fff; font-size: 26px; font-weight: 800; display: flex; align-items: center; justify-content: center; text-transform: uppercase; }
        .company-logo { max-height: 60px; max-width: 160px; object-fit: contain; border-radius: 6px; }
        .company-details h1 { font-size: 20px; color: #0f172a; font-weight: 800; margin-bottom: 2px; }
        .company-details p { font-size: 11px; color: #64748b; line-height: 1.4; }
        
        .invoice-title-block { text-align: right; }
        .invoice-title-block h2 { font-size: 26px; font-weight: 900; color: #4f46e5; letter-spacing: 0.5px; }
        .invoice-title-block .inv-num { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 4px; }
        .inv-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-top: 6px; }
        .badge-paid { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
        .badge-pending { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .badge-overdue { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

        .meta-grid { display: flex; justify-content: space-between; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #f1f5f9; margin-bottom: 25px; }
        .meta-col { flex: 1; }
        .meta-col h3 { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .meta-col p { font-size: 12px; font-weight: 700; color: #1e293b; }

        .bill-to-section { display: flex; justify-content: space-between; margin-bottom: 25px; gap: 20px; }
        .bill-card { flex: 1; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; }
        .bill-card h3 { font-size: 11px; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; margin-bottom: 6px; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th { background: #4f46e5; color: #ffffff; padding: 10px 10px; font-size: 11px; text-transform: uppercase; text-align: left; font-weight: 700; }
        td { padding: 10px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155; }
        tr:nth-child(even) { background: #f8fafc; }
        
        .totals-container { display: flex; justify-content: flex-end; margin-bottom: 20px; }
        .totals-table { width: 360px; border-collapse: collapse; }
        .totals-table td { padding: 6px 12px; border-bottom: 1px solid #f1f5f9; }
        .totals-table tr.grand-total { background: #ecfdf5; font-weight: 800; font-size: 14px; color: #065f46; border: 1px solid #a7f3d0; }
        
        .amount-words-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 25px; }
        .amount-words-card span { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
        .amount-words-card p { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px; }

        .footer-terms { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px; }
        .terms p { font-size: 10px; color: #64748b; line-height: 1.5; }
        .terms strong { color: #475569; }
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
      
      <div class="no-print" style="max-width: 900px; margin: 0 auto 20px auto; text-align: right;">
        <button onclick="window.print()" style="background: #4f46e5; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px;">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div class="invoice-box">
        
        <!-- Header -->
        <div class="header">
          <div class="company-brand">
            ${logoSrc ? `<img src="${logoSrc}" class="company-logo" alt="${companyName}" />` : `
              <div class="logo-circle">${companyName.charAt(0).toUpperCase()}</div>
            `}
            <div class="company-details">
              <h1>${companyName}</h1>
              <p>${companyAddress}</p>
              <p><strong>GSTIN:</strong> ${companyGst} | <strong>PAN:</strong> ${companyPan}</p>
              <p><strong>Phone:</strong> ${companyContact} | <strong>Email:</strong> ${companyEmail}</p>
            </div>
          </div>
          <div class="invoice-title-block">
            <h2>${headerTitle}</h2>
            <p class="inv-num"># ${invNumber}</p>
            <span class="inv-badge ${status === 'Paid' ? 'badge-paid' : status === 'Pending' ? 'badge-pending' : 'badge-overdue'}">
              STATUS: ${status.toUpperCase()}
            </span>
          </div>
        </div>

        <!-- Meta Grid -->
        <div class="meta-grid">
          <div class="meta-col">
            <h3>${headerTitle.includes('PAYMENT') ? 'VOUCHER DATE' : 'INVOICE DATE'}</h3>
            <p>${cleanInvDate}</p>
          </div>
          <div class="meta-col">
            <h3>PLACE OF SUPPLY</h3>
            <p>${placeOfSupply}</p>
          </div>
          <div class="meta-col">
            <h3>REVERSE CHARGE</h3>
            <p>${isRcmEnabled ? 'Yes' : 'No (N/A)'}</p>
          </div>
        </div>

        <!-- Bill To -->
        <div class="bill-to-section">
          <div class="bill-card">
            <h3>${partyLabel}</h3>
            <p style="font-size: 14px; font-weight: 800; color: #0f172a;">${custName}</p>
            <p style="font-family: monospace; color: #475569; margin-top: 4px;"><strong>GSTIN:</strong> ${custGst}</p>
            <p style="color: #64748b; margin-top: 2px;">Chennai, Tamil Nadu, India</p>
          </div>
        </div>

        <!-- Items Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 4%;">#</th>
              <th style="width: 32%;">Description / Item</th>
              <th style="width: 12%;">HSN/SAC</th>
              <th style="width: 6%; text-align: center;">Qty</th>
              <th style="width: 13%; text-align: right;">Unit Price (₹)</th>
              <th style="width: 8%; text-align: center;">Tax %</th>
              <th style="width: 12.5%; text-align: right;">Amount (₹)</th>
              <th style="width: 12.5%; text-align: right;">GST Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, idx) => {
              const desc = item.description || item.title || item.name || 'Service / Product Item';
              const hsn = item.hsnSac || item.hsn_sac || '998222';
              const qty = item.quantity !== undefined ? item.quantity : 1;
              const rate = parseFloat(item.unitPrice || item.rate || item.amount || 0);
              const taxPct = parseFloat(item.taxPercent || item.tax_percent || 18);
              const itemAmount = parseFloat(item.amount || (qty * rate));
              const gstAmt = (itemAmount * taxPct) / 100;

              return `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><strong>${desc}</strong></td>
                  <td style="font-family: monospace;">${hsn}</td>
                  <td style="text-align: center;">${qty}</td>
                  <td style="text-align: right; font-family: monospace;">₹${rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style="text-align: center; font-family: monospace; color: #10b981; font-weight: bold;">${taxPct}%</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;">₹${itemAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold; color: #10b981;">₹${gstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Totals Breakdown -->
        <div class="totals-container">
          <table class="totals-table">
            <tr>
              <td style="color: #64748b; font-weight: 600;">Subtotal (Excl. GST):</td>
              <td style="text-align: right; font-family: monospace; font-weight: 600;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="color: #10b981; font-weight: 600;">Total GST Amount:</td>
              <td style="text-align: right; font-family: monospace; font-weight: 700; color: #10b981;">₹${totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr class="grand-total">
              <td style="font-weight: 800;">Grand Total (Incl. GST):</td>
              <td style="text-align: right; font-family: monospace; font-weight: 900;">₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </table>
        </div>

        <!-- Amount in Words Card -->
        <div class="amount-words-card">
          <span>Amount in Words:</span>
          <p>${convertNumberToWords(grandTotal)}</p>
        </div>

        <!-- Footer Terms & Signature -->
        <div class="footer-terms">
          <div class="terms">
            <p><strong>Terms & Conditions:</strong></p>
            ${termsHtml}
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
