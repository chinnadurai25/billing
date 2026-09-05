export const initialUserData = {
  fullName: "Chinna Durai",
  contactNumber: "+91 98765 43210",
  email: "chinna.durai@billson.io",
  companyName: "Durai Tax Advisory & Financials Ltd",
  companyAddress: "Suite 402, Quantum Tech Tower, Inner Ring Road",
  city: "Chennai",
  state: "Tamil Nadu",
  country: "India",
  pincode: "600032",
  gstNumber: "33AAACD1234F1Z5",
  panNumber: "AAACD1234F",
  businessType: "Private Limited",
  businessCategory: "Financial & Tax Services",
  username: "chinna_durai",
  plan: "Pro SaaS Plan",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
};

export const initialCustomers = [
  { id: "CUST-001", name: "Acme Global Solutions", email: "billing@acmeglobal.com", phone: "+91 98400 11223", gstNumber: "29AABCA1234B1Z2", city: "Bengaluru", state: "Karnataka", totalBilled: 145000, status: "Active" },
  { id: "CUST-002", name: "Zenith Retail Infra", email: "finance@zenithretail.in", phone: "+91 97100 44556", gstNumber: "33BBCCZ5678K1Z8", city: "Chennai", state: "Tamil Nadu", totalBilled: 98000, status: "Active" },
  { id: "CUST-003", name: "Apex Logistics Tech", email: "accounts@apexlogistics.io", phone: "+91 99600 77889", gstNumber: "27CCCAP9988P1Z4", city: "Mumbai", state: "Maharashtra", totalBilled: 230000, status: "Active" },
  { id: "CUST-004", name: "Nova Biotech Ltd", email: "tax@novabiotech.org", phone: "+91 94400 33445", gstNumber: "36DDDNB4455M1Z9", city: "Hyderabad", state: "Telangana", totalBilled: 64000, status: "Pending Audit" },
  { id: "CUST-005", name: "Vanguard Design Studio", email: "hello@vanguarddesign.com", phone: "+91 98800 22110", gstNumber: "33EEEVD8877Q1Z1", city: "Coimbatore", state: "Tamil Nadu", totalBilled: 42000, status: "Active" },
];

export const initialProductsServices = [
  { id: "SRV-101", title: "GSTR-1 & GSTR-3B Monthly Tax Filing", hsnSac: "998222", rate: 12500, taxPercent: 18, category: "Tax Compliance" },
  { id: "SRV-102", title: "Corporate Income Tax Return (ITR-6)", hsnSac: "998231", rate: 35000, taxPercent: 18, category: "Income Tax" },
  { id: "SRV-103", title: "GST Annual Audit & Reconciliation", hsnSac: "998221", rate: 48000, taxPercent: 18, category: "Auditing" },
  { id: "SRV-104", title: "TDS / TCS Quarterly Advisory & Returns", hsnSac: "998212", rate: 15000, taxPercent: 18, category: "Direct Tax" },
  { id: "SRV-105", title: "Transfer Pricing Documentation", hsnSac: "998240", rate: 75000, taxPercent: 18, category: "International Tax" },
];

export const initialInvoices = [
  {
    id: "INV-2026-089",
    invoiceNumber: "TP-2026-089",
    customerName: "Acme Global Solutions",
    customerGst: "29AABCA1234B1Z2",
    date: "2026-08-24",
    dueDate: "2026-09-07",
    subtotal: 50000,
    cgst: 4500,
    sgst: 4500,
    igst: 0,
    totalTax: 9000,
    grandTotal: 59000,
    status: "Paid",
    items: [
      { description: "GSTR-1 & GSTR-3B Monthly Tax Filing (Q2)", hsnSac: "998222", quantity: 2, unitPrice: 12500, taxPercent: 18, amount: 25000 },
      { description: "TDS / TCS Quarterly Returns", hsnSac: "998212", quantity: 1, unitPrice: 25000, taxPercent: 18, amount: 25000 },
    ]
  },
  {
    id: "INV-2026-088",
    invoiceNumber: "TP-2026-088",
    customerName: "Apex Logistics Tech",
    customerGst: "27CCCAP9988P1Z4",
    date: "2026-08-21",
    dueDate: "2026-09-04",
    subtotal: 75000,
    cgst: 0,
    sgst: 0,
    igst: 13500,
    totalTax: 13500,
    grandTotal: 88500,
    status: "Pending",
    items: [
      { description: "Transfer Pricing Documentation", hsnSac: "998240", quantity: 1, unitPrice: 75000, taxPercent: 18, amount: 75000 },
    ]
  },
  {
    id: "INV-2026-087",
    invoiceNumber: "TP-2026-087",
    customerName: "Zenith Retail Infra",
    customerGst: "33BBCCZ5678K1Z8",
    date: "2026-08-15",
    dueDate: "2026-08-25",
    subtotal: 35000,
    cgst: 3150,
    sgst: 3150,
    igst: 0,
    totalTax: 6300,
    grandTotal: 41300,
    status: "Overdue",
    items: [
      { description: "Corporate Income Tax Return (ITR-6)", hsnSac: "998231", quantity: 1, unitPrice: 35000, taxPercent: 18, amount: 35000 },
    ]
  },
  {
    id: "INV-2026-086",
    invoiceNumber: "TP-2026-086",
    customerName: "Nova Biotech Ltd",
    customerGst: "36DDDNB4455M1Z9",
    date: "2026-08-10",
    dueDate: "2026-08-24",
    subtotal: 48000,
    cgst: 0,
    sgst: 0,
    igst: 8640,
    totalTax: 8640,
    grandTotal: 56640,
    status: "Paid",
    items: [
      { description: "GST Annual Audit & Reconciliation", hsnSac: "998221", quantity: 1, unitPrice: 48000, taxPercent: 18, amount: 48000 },
    ]
  },
  {
    id: "INV-2026-085",
    invoiceNumber: "TP-2026-085",
    customerName: "Vanguard Design Studio",
    customerGst: "33EEEVD8877Q1Z1",
    date: "2026-08-02",
    dueDate: "2026-08-16",
    subtotal: 25000,
    cgst: 2250,
    sgst: 2250,
    igst: 0,
    totalTax: 4500,
    grandTotal: 29500,
    status: "Paid",
    items: [
      { description: "GSTR-1 & GSTR-3B Monthly Tax Filing", hsnSac: "998222", quantity: 2, unitPrice: 12500, taxPercent: 18, amount: 25000 }
    ]
  }
];

export const initialAdminUsers = [
  { id: "USR-901", name: "Chinna Durai", company: "Durai Tax Advisory", email: "chinna.durai@billson.io", role: "Super Admin / User", plan: "Enterprise Pro", status: "Active", gst: "33AAACD1234F1Z5", registeredDate: "2026-01-15" },
  { id: "USR-902", name: "Ananya Sharma", company: "KPMG Advisory India", email: "ananya.s@kpmg-demo.in", role: "Tax Consultant", plan: "Pro SaaS", status: "Active", gst: "27AABCK9911X1Z0", registeredDate: "2026-03-22" },
  { id: "USR-903", name: "Vikram Singhania", company: "Singhania & Co Audit", email: "vikram@singhania-tax.com", role: "Tax Consultant", plan: "Pro SaaS", status: "Active", gst: "07AAACV7744G1Z2", registeredDate: "2026-04-10" },
  { id: "USR-904", name: "Priya Nair", company: "Nair Financial Group", email: "priya@nairfin.org", role: "User", plan: "Starter", status: "Pending Audit", gst: "32AAACN5522H1Z6", registeredDate: "2026-06-05" },
  { id: "USR-905", name: "Rohan Kulkarni", company: "Kulkarni Associates", email: "rohan@kulkarnitax.in", role: "User", plan: "Starter", status: "Suspended", gst: "27AAACK1100F1Z9", registeredDate: "2026-07-18" },
];

export const monthlyRevenueData = [
  { month: "Jan", revenue: 420000, tax: 75600, invoices: 28 },
  { month: "Feb", revenue: 490000, tax: 88200, invoices: 34 },
  { month: "Mar", revenue: 680000, tax: 122400, invoices: 52 },
  { month: "Apr", revenue: 540000, tax: 97200, invoices: 41 },
  { month: "May", revenue: 720000, tax: 129600, invoices: 58 },
  { month: "Jun", revenue: 810000, tax: 145800, invoices: 64 },
  { month: "Jul", revenue: 890000, tax: 160200, invoices: 71 },
  { month: "Aug", revenue: 1050000, tax: 189000, invoices: 84 },
];

export const taxBreakdownData = [
  { name: "CGST (Central)", value: 42, color: "#6366f1" },
  { name: "SGST (State)", value: 42, color: "#06b6d4" },
  { name: "IGST (Integrated)", value: 16, color: "#8b5cf6" },
];

export const adminActivityLogs = [
  { id: 1, action: "User Registration", detail: "Chinna Durai registered new enterprise company 'Durai Tax Advisory'", timestamp: "10 mins ago", type: "user" },
  { id: 2, action: "GSTIN Verification", detail: "Auto-verified GSTIN 33AAACD1234F1Z5 via Govt API portal", timestamp: "25 mins ago", type: "system" },
  { id: 3, action: "Invoice Created", detail: "Invoice TP-2026-089 (₹59,000) generated with 18% CGST/SGST", timestamp: "1 hour ago", type: "billing" },
  { id: 4, action: "Admin Security Audit", detail: "Admin authentication logged from IP 103.115.42.10 (SSL TLS 1.3)", timestamp: "2 hours ago", type: "security" },
  { id: 5, action: "Tax Report Export", detail: "GSTR-1 CSV summary exported for August 2026 tax cycle", timestamp: "4 hours ago", type: "tax" },
];
