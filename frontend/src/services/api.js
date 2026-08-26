const API_BASE_URL = 'http://localhost:5000/api';

// Helper for HTTP requests
async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn(`Backend connection note at ${endpoint}:`, err.message);
    return { success: false, fallback: true, message: err.message };
  }
}

export const api = {
  // Auth
  registerUser: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  loginUser: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  loginAdmin: (credentials) => request('/auth/admin/login', { method: 'POST', body: JSON.stringify(credentials) }),

  // 1. REGISTRATION ( CUSTOMER )
  getCustomers: () => request('/customers'),
  registerCustomer: (custData) => request('/customers', { method: 'POST', body: JSON.stringify(custData) }),

  // 2. REGISTRATION ( BANK / CASH )
  getBankAccounts: () => request('/bank-accounts'),
  registerBankCash: (bankData) => request('/bank-accounts', { method: 'POST', body: JSON.stringify(bankData) }),

  // 3. REGISTRATION ( SALES / SERVICES )
  getProducts: () => request('/products'),
  registerSalesService: (itemData) => request('/products', { method: 'POST', body: JSON.stringify(itemData) }),

  // Invoices
  getInvoices: () => request('/invoices'),
  createInvoice: (invoiceData) => request('/invoices', { method: 'POST', body: JSON.stringify(invoiceData) }),

  // Admin Registered Users
  getAdminUsers: () => request('/admin/users'),
};
