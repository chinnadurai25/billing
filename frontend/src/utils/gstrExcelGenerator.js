import * as XLSX from 'xlsx';

const GST_STATE_CODES = {
  '33': 'Tamil Nadu',
  '29': 'Karnataka',
  '27': 'Maharashtra',
  '36': 'Telangana',
  '07': 'Delhi',
  '19': 'West Bengal',
  '24': 'Gujarat',
  '32': 'Kerala',
  '37': 'Andhra Pradesh',
  '09': 'Uttar Pradesh',
  '08': 'Rajasthan',
  '03': 'Punjab',
  '10': 'Bihar',
  '23': 'Madhya Pradesh',
  '21': 'Odisha',
  '18': 'Assam',
  '02': 'Himachal Pradesh',
  '06': 'Haryana',
  '01': 'Jammu and Kashmir',
  '30': 'Goa',
  '05': 'Uttarakhand',
  '14': 'Manipur',
  '15': 'Mizoram',
  '13': 'Nagaland',
  '17': 'Meghalaya',
  '16': 'Tripura',
  '04': 'Chandigarh',
  '35': 'Andaman and Nicobar Islands',
  '34': 'Puducherry',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '38': 'Ladakh'
};

export const getStateFromGstOrAddress = (gstNum, fallbackState = '') => {
  if (fallbackState && typeof fallbackState === 'string' && fallbackState.trim() && fallbackState.trim() !== 'India') {
    return fallbackState.trim();
  }
  if (gstNum && typeof gstNum === 'string' && gstNum.length >= 2) {
    const code = gstNum.slice(0, 2);
    if (GST_STATE_CODES[code]) {
      return GST_STATE_CODES[code];
    }
  }
  return 'Tamil Nadu';
};

export const processGSTRData = (invoices = [], customers = [], userState = 'Tamil Nadu', selectedMonthYear = 'all', products = []) => {
  let filteredInvoices = invoices;

  if (selectedMonthYear && selectedMonthYear !== 'all') {
    filteredInvoices = invoices.filter((inv) => {
      const dateVal = inv.date || inv.created_at || '';
      if (!dateVal) return false;
      const strVal = String(dateVal).trim();
      if (strVal.startsWith(selectedMonthYear)) return true;
      try {
        const d = new Date(strVal);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          return `${yyyy}-${mm}` === selectedMonthYear;
        }
      } catch (e) {}
      return false;
    });
  }

  const customerMap = new Map();
  customers.forEach((c) => {
    if (c.id) {
      customerMap.set(String(c.id), c);
      customerMap.set(String(c.id).toLowerCase(), c);
    }
    if (c.name) customerMap.set(c.name.toLowerCase().trim(), c);
  });

  const registeredProductMap = new Map();
  (products || []).forEach((p) => {
    const titleKey = (p.title || p.name || '').toLowerCase().trim();
    if (titleKey) registeredProductMap.set(titleKey, p);
    if (p.id) registeredProductMap.set(String(p.id).toLowerCase().trim(), p);
    if (p.hsnSac || p.hsn_sac) {
      const hsnKey = String(p.hsnSac || p.hsn_sac).toLowerCase().trim();
      if (!registeredProductMap.has(hsnKey)) registeredProductMap.set(hsnKey, p);
    }
  });

  const b2bRows = [];
  const b2cRows = [];
  const hsnMap = new Map();

  filteredInvoices.forEach((inv) => {
    const custIdKey = inv.customerId || inv.customer_id || inv.userId;
    const custNameKey = (inv.customerName || inv.customer_name || '').toLowerCase().trim();

    const matchedCust = customerMap.get(String(custIdKey)) || 
                        customerMap.get(String(custIdKey).toLowerCase()) || 
                        customerMap.get(custNameKey);

    const rawGst = (
      inv.customerGst ||
      inv.customer_gst ||
      inv.customerGstNo ||
      inv.customer_gst_no ||
      inv.gstNumber ||
      inv.gst_number ||
      matchedCust?.gstNumber ||
      matchedCust?.gst_number ||
      matchedCust?.gstNo ||
      matchedCust?.gst_no ||
      ''
    ).toString().trim().toUpperCase();

    const stateOfSupply = getStateFromGstOrAddress(rawGst, inv.state || matchedCust?.state || userState);

    const isB2B = Boolean(rawGst && rawGst.length >= 10 && rawGst !== 'N/A' && rawGst !== 'NONE' && rawGst !== 'NULL');
    const taxableValue = parseFloat(inv.subtotal ?? (inv.grandTotal - (inv.totalTax || 0))) || 0;
    
    // Compute CGST, SGST, IGST
    let igst = parseFloat(inv.igst || 0);
    let cgst = parseFloat(inv.cgst || 0);
    let sgst = parseFloat(inv.sgst || 0);

    const userStateNorm = (userState || 'Tamil Nadu').toLowerCase().trim();
    const supplyStateNorm = (stateOfSupply || 'Tamil Nadu').toLowerCase().trim();
    const isInterstate = supplyStateNorm !== userStateNorm;

    if (igst === 0 && cgst === 0 && sgst === 0) {
      const totalTax = parseFloat(inv.totalTax ?? (inv.grandTotal - taxableValue)) || 0;
      if (isInterstate) {
        igst = totalTax;
      } else {
        cgst = totalTax / 2;
        sgst = totalTax / 2;
      }
    }

    // Tax rate calculation
    let taxRateStr = '18%';
    if (taxableValue > 0 && (igst + cgst + sgst) > 0) {
      const totalT = igst + cgst + sgst;
      const calcPct = Math.round((totalT / taxableValue) * 100);
      taxRateStr = `${calcPct}%`;
    }

    const invNo = inv.invoiceNumber || inv.invoice_number || inv.id;
    const custName = inv.customerName || inv.customer_name || matchedCust?.name || (isB2B ? 'B2B Corporate Client' : 'Retail Customer');
    const invDate = inv.date || inv.created_at || '';

    if (isB2B) {
      b2bRows.push({
        slNo: b2bRows.length + 1,
        invoiceNo: invNo,
        customerName: custName,
        gstNumber: rawGst,
        invoiceDate: invDate,
        taxRate: taxRateStr,
        taxableValue: Math.round(taxableValue * 100) / 100,
        igst: Math.round(igst * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        stateOfSupply: stateOfSupply
      });
    } else {
      b2cRows.push({
        slNo: b2cRows.length + 1,
        invoiceNo: invNo,
        customerName: custName,
        invoiceDate: invDate,
        taxRate: taxRateStr,
        taxableValue: Math.round(taxableValue * 100) / 100,
        igst: Math.round(igst * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        stateOfSupply: stateOfSupply
      });
    }

    // Process line items for Product & Service HSN Summary
    let rawItems = inv.items;
    if (typeof rawItems === 'string') {
      try {
        rawItems = JSON.parse(rawItems);
      } catch (e) {
        rawItems = [];
      }
    }
    let items = Array.isArray(rawItems) ? rawItems : [];
    if (items.length === 0 && (inv.productName || inv.serviceName || inv.description || inv.item_name)) {
      const desc = inv.productName || inv.serviceName || inv.description || inv.item_name;
      items = [{
        description: desc,
        hsnSac: inv.hsnSac || inv.hsn_sac || inv.hsnCode || '',
        quantity: parseFloat(inv.quantity || 1) || 1,
        unit: inv.unit || inv.uom || 'NOS',
        unitPrice: taxableValue,
        taxPercent: parseFloat(inv.taxPercent || inv.tax_percent || 18) || 18,
        amount: taxableValue
      }];
    }

    items.forEach((item) => {
      const itemRawName = (item.description || item.title || item.name || item.itemName || '').trim();
      if (!itemRawName) return;
      const itemRawHsn = (item.hsnSac || item.hsn_sac || item.hsnCode || item.hsn || '').toString().trim();

      // Match against registered Products & Services catalog
      const matchedProduct = registeredProductMap.get(itemRawName.toLowerCase()) || 
                             registeredProductMap.get(itemRawHsn.toLowerCase()) ||
                             (products || []).find(p => p.title && itemRawName.toLowerCase().includes(p.title.toLowerCase().trim()));

      const name = matchedProduct ? (matchedProduct.title || matchedProduct.name) : itemRawName;
      const hsn = matchedProduct 
        ? (matchedProduct.hsnSac || matchedProduct.hsn_sac || '998222') 
        : (itemRawHsn || (name.toLowerCase().includes('service') ? '998222' : '847130'));
      const uom = (item.unit || item.uom || item.unitOfMeasurement || matchedProduct?.unit || (String(hsn).startsWith('99') ? 'OTH-OTHERS' : 'NOS-NUMBERS')).toString().trim().toUpperCase();
      const qty = parseFloat(item.quantity ?? item.qty ?? 1) || 1;
      const itemTaxRate = parseFloat(item.taxPercent ?? item.tax_percent ?? item.taxRate ?? matchedProduct?.taxPercent ?? 18) || 18;
      const itemTaxRateStr = `${Math.round(itemTaxRate)}%`;
      const itemTaxableVal = parseFloat(item.amount ?? item.taxableValue ?? (qty * (item.unitPrice || item.rate || 0))) || 0;

      const totalTaxForItem = (itemTaxableVal * itemTaxRate) / 100;
      let itemIgst = 0;
      let itemCgst = 0;
      let itemSgst = 0;

      if (isInterstate) {
        itemIgst = totalTaxForItem;
      } else {
        itemCgst = totalTaxForItem / 2;
        itemSgst = totalTaxForItem / 2;
      }

      const mapKey = `${name}___${hsn}___${uom}___${itemTaxRateStr}`;
      if (hsnMap.has(mapKey)) {
        const existing = hsnMap.get(mapKey);
        existing.totalQty += qty;
        existing.taxableValue += itemTaxableVal;
        existing.igst += itemIgst;
        existing.cgst += itemCgst;
        existing.sgst += itemSgst;
      } else {
        hsnMap.set(mapKey, {
          productName: name,
          hsn: hsn,
          uom: uom,
          totalQty: qty,
          taxRate: itemTaxRateStr,
          taxableValue: itemTaxableVal,
          igst: itemIgst,
          cgst: itemCgst,
          sgst: itemSgst
        });
      }
    });
  });

  const hsnSummaryRows = Array.from(hsnMap.values()).map((r, idx) => ({
    slNo: idx + 1,
    productName: r.productName,
    hsn: r.hsn,
    uom: r.uom,
    totalQty: Math.round(r.totalQty * 100) / 100,
    taxRate: r.taxRate,
    taxableValue: Math.round(r.taxableValue * 100) / 100,
    igst: Math.round(r.igst * 100) / 100,
    cgst: Math.round(r.cgst * 100) / 100,
    sgst: Math.round(r.sgst * 100) / 100
  }));

  // Process Document Issued details (GSTR-1 Table 13)
  const salesInvoices = filteredInvoices.filter(inv => {
    const docType = inv.documentType || inv.document_type || '';
    if (!docType || docType === 'Sales Invoice') return true;
    const invId = String(inv.invoiceNumber || inv.invoice_number || inv.id || '');
    return invId.startsWith('INV');
  });

  const deliveryChallans = filteredInvoices.filter(inv => {
    const docType = inv.documentType || inv.document_type || '';
    if (docType === 'Delivery Challan') return true;
    const invId = String(inv.invoiceNumber || inv.invoice_number || inv.id || '');
    return invId.startsWith('DC');
  });

  const getDocStats = (list, category, name) => {
    if (!list || list.length === 0) {
      return {
        docCategory: category,
        docName: name,
        slNoFrom: 'N/A',
        slNoTo: 'N/A',
        totalCount: 0,
        cancelled: 0,
        netIssued: 0
      };
    }

    const parsedNums = list.map((d, index) => {
      const invStr = String(d.invoiceNumber || d.invoice_number || d.id || '');
      const matches = invStr.match(/\d+/g);
      if (matches && matches.length > 0) {
        const val = parseInt(matches[matches.length - 1], 10);
        if (!isNaN(val)) return val;
      }
      return index + 1;
    });

    parsedNums.sort((a, b) => a - b);

    const totalCount = list.length;
    const cancelled = list.filter(d => (d.status || '').toLowerCase() === 'cancelled').length;
    const netIssued = totalCount - cancelled;

    return {
      docCategory: category,
      docName: name,
      slNoFrom: parsedNums[0] ?? 1,
      slNoTo: parsedNums[parsedNums.length - 1] ?? totalCount,
      totalCount,
      cancelled,
      netIssued
    };
  };

  const docIssuedRows = [
    getDocStats(salesInvoices, 'salse invoice', 'Invoice for outward supplies'),
    getDocStats(deliveryChallans, 'delevery chellan', 'for Job work')
  ];

  return { b2bRows, b2cRows, hsnSummaryRows, docIssuedRows, filteredInvoices };
};

export const downloadGSTRExcelReport = ({ 
  companyName = 'MY COMPANY', 
  monthYearLabel = 'AUGUST 2026', 
  b2bRows = [], 
  b2cRows = [],
  hsnSummaryRows = [],
  docIssuedRows = []
}) => {
  const wb = XLSX.utils.book_new();

  const titleText = `${companyName.toUpperCase()}  ${monthYearLabel.toUpperCase()}`;

  // -------------------------------------------------------------
  // 1. Build B2B Sheet (Sheet Name: "b2b")
  // -------------------------------------------------------------
  const b2bHeader = [
    'SL NO',
    'Invoice No',
    'customer Name',
    'GST Number',
    'Invoice Date',
    'Tax of Rate',
    'Taxable Value',
    'IGST',
    'CGST',
    'SGST',
    'state of Supply'
  ];

  let b2bTotalTaxable = 0;
  let b2bTotalIGST = 0;
  let b2bTotalCGST = 0;
  let b2bTotalSGST = 0;

  const b2bDataRows = b2bRows.map((r, idx) => {
    b2bTotalTaxable += r.taxableValue;
    b2bTotalIGST += r.igst;
    b2bTotalCGST += r.cgst;
    b2bTotalSGST += r.sgst;

    return [
      idx + 1,
      r.invoiceNo,
      r.customerName,
      r.gstNumber,
      r.invoiceDate,
      r.taxRate,
      r.taxableValue,
      r.igst,
      r.cgst,
      r.sgst,
      r.stateOfSupply
    ];
  });

  const b2bTotalsRow = [
    'TOTAL',
    '',
    '',
    '',
    '',
    '',
    Math.round(b2bTotalTaxable * 100) / 100,
    Math.round(b2bTotalIGST * 100) / 100,
    Math.round(b2bTotalCGST * 100) / 100,
    Math.round(b2bTotalSGST * 100) / 100,
    ''
  ];

  const b2bSheetAOA = [
    [titleText],
    b2bHeader,
    ...b2bDataRows,
    ...(b2bDataRows.length > 0 ? [b2bTotalsRow] : [])
  ];

  const wsB2B = XLSX.utils.aoa_to_sheet(b2bSheetAOA);
  wsB2B['!cols'] = [
    { wch: 8 },  // SL NO
    { wch: 18 }, // Invoice No
    { wch: 26 }, // customer Name
    { wch: 18 }, // GST Number
    { wch: 14 }, // Invoice Date
    { wch: 12 }, // Tax of Rate
    { wch: 16 }, // Taxable Value
    { wch: 12 }, // IGST
    { wch: 12 }, // CGST
    { wch: 12 }, // SGST
    { wch: 18 }  // state of Supply
  ];

  XLSX.utils.book_append_sheet(wb, wsB2B, 'b2b');

  // -------------------------------------------------------------
  // 2. Build B2C Sheet (Sheet Name: "b2c")
  // -------------------------------------------------------------
  const b2cHeader = [
    'SL NO',
    'Invoice No',
    'customer Name',
    'Invoice Date',
    'Tax Rate',
    'Taxable Value',
    'IGST',
    'CGST',
    'SGST',
    'State of Supply'
  ];

  let b2cTotalTaxable = 0;
  let b2cTotalIGST = 0;
  let b2cTotalCGST = 0;
  let b2cTotalSGST = 0;

  const b2cDataRows = b2cRows.map((r, idx) => {
    b2cTotalTaxable += r.taxableValue;
    b2cTotalIGST += r.igst;
    b2cTotalCGST += r.cgst;
    b2cTotalSGST += r.sgst;

    return [
      idx + 1,
      r.invoiceNo,
      r.customerName,
      r.invoiceDate,
      r.taxRate,
      r.taxableValue,
      r.igst,
      r.cgst,
      r.sgst,
      r.stateOfSupply
    ];
  });

  const b2cTotalsRow = [
    'TOTAL',
    '',
    '',
    '',
    '',
    Math.round(b2cTotalTaxable * 100) / 100,
    Math.round(b2cTotalIGST * 100) / 100,
    Math.round(b2cTotalCGST * 100) / 100,
    Math.round(b2cTotalSGST * 100) / 100,
    ''
  ];

  const b2cSheetAOA = [
    [titleText],
    b2cHeader,
    ...b2cDataRows,
    ...(b2cDataRows.length > 0 ? [b2cTotalsRow] : [])
  ];

  const wsB2C = XLSX.utils.aoa_to_sheet(b2cSheetAOA);
  wsB2C['!cols'] = [
    { wch: 8 },  // SL NO
    { wch: 18 }, // Invoice No
    { wch: 26 }, // customer Name
    { wch: 14 }, // Invoice Date
    { wch: 12 }, // Tax Rate
    { wch: 16 }, // Taxable Value
    { wch: 12 }, // IGST
    { wch: 12 }, // CGST
    { wch: 12 }, // SGST
    { wch: 18 }  // State of Supply
  ];

  XLSX.utils.book_append_sheet(wb, wsB2C, 'b2c');

  // -------------------------------------------------------------
  // 3. Build HSN Summary Sheet (Sheet Name: "HSN summary")
  // -------------------------------------------------------------
  const hsnHeader = [
    'Service & product name',
    'HSN',
    'Unit of Measurement',
    'Total Qty',
    'Tax Rate',
    'Total Taxable Value',
    'IGST',
    'CGST',
    'SGST'
  ];

  let hsnTotalQty = 0;
  let hsnTotalTaxable = 0;
  let hsnTotalIGST = 0;
  let hsnTotalCGST = 0;
  let hsnTotalSGST = 0;

  const hsnDataRows = hsnSummaryRows.map((r) => {
    hsnTotalQty += r.totalQty;
    hsnTotalTaxable += r.taxableValue;
    hsnTotalIGST += r.igst;
    hsnTotalCGST += r.cgst;
    hsnTotalSGST += r.sgst;

    return [
      r.productName,
      r.hsn,
      r.uom,
      r.totalQty,
      r.taxRate,
      r.taxableValue,
      r.igst,
      r.cgst,
      r.sgst
    ];
  });

  const hsnTotalsRow = [
    'TOTAL',
    '( will come total details to validate individual )',
    '',
    Math.round(hsnTotalQty * 100) / 100,
    '',
    Math.round(hsnTotalTaxable * 100) / 100,
    Math.round(hsnTotalIGST * 100) / 100,
    Math.round(hsnTotalCGST * 100) / 100,
    Math.round(hsnTotalSGST * 100) / 100
  ];

  const hsnSheetAOA = [
    [titleText],
    hsnHeader,
    ...hsnDataRows,
    ...(hsnDataRows.length > 0 ? [hsnTotalsRow] : [])
  ];

  const wsHSN = XLSX.utils.aoa_to_sheet(hsnSheetAOA);
  wsHSN['!cols'] = [
    { wch: 32 }, // Service & product name
    { wch: 14 }, // HSN
    { wch: 22 }, // Unit of Measurement
    { wch: 14 }, // Total Qty
    { wch: 12 }, // Tax Rate
    { wch: 18 }, // Total Taxable Value
    { wch: 14 }, // IGST
    { wch: 14 }, // CGST
    { wch: 14 }  // SGST
  ];

  XLSX.utils.book_append_sheet(wb, wsHSN, 'HSN summary');

  // -------------------------------------------------------------
  // 4. Build Document Issued Sheet (Sheet Name: "document issued")
  // -------------------------------------------------------------
  const docSheetAOA = [
    [titleText],
    []
  ];

  (docIssuedRows || []).forEach((item) => {
    docSheetAOA.push([item.docCategory]);
    docSheetAOA.push([item.docName, 'sl No From', 'Sl No To', 'Total Count', 'Cancelled', 'Net issued']);
    docSheetAOA.push([
      item.docName,
      item.slNoFrom,
      item.slNoTo,
      item.totalCount,
      item.cancelled,
      item.netIssued
    ]);
    docSheetAOA.push([]);
  });

  const wsDoc = XLSX.utils.aoa_to_sheet(docSheetAOA);
  wsDoc['!cols'] = [
    { wch: 32 }, // Nature of Document / Name
    { wch: 20 }, // sl No From
    { wch: 20 }, // Sl No To
    { wch: 14 }, // Total Count
    { wch: 14 }, // Cancelled
    { wch: 14 }  // Net issued
  ];

  XLSX.utils.book_append_sheet(wb, wsDoc, 'document issued');

  // Generate filename: GSTR1_Report_Company_Period.xlsx
  const safeComp = companyName.replace(/[^a-zA-Z0-9]/g, '_');
  const safePeriod = monthYearLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `GSTR1_Report_${safeComp}_${safePeriod}.xlsx`;

  XLSX.writeFile(wb, fileName);
};
