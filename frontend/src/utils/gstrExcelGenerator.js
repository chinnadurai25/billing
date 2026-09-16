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

export const processGSTRData = (invoices = [], customers = [], userState = 'Tamil Nadu', selectedMonthYear = 'all') => {
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

  const b2bRows = [];
  const b2cRows = [];

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
  });

  return { b2bRows, b2cRows, filteredInvoices };
};

export const downloadGSTRExcelReport = ({ companyName = 'MY COMPANY', monthYearLabel = 'AUGUST 2026', b2bRows = [], b2cRows = [] }) => {
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

  // Generate filename: GSTR1_Report_Company_Period.xlsx
  const safeComp = companyName.replace(/[^a-zA-Z0-9]/g, '_');
  const safePeriod = monthYearLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `GSTR1_Report_${safeComp}_${safePeriod}.xlsx`;

  XLSX.writeFile(wb, fileName);
};
