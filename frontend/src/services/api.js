const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? `${window.location.origin}/api`
  : 'http://localhost:5000/api';

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

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return data;
    } else {
      const text = await res.text();
      console.warn(`Non-JSON API response from ${endpoint}:`, text.substring(0, 200));
      return { 
        success: false, 
        message: res.status === 413 ? 'Company logo image file size is too large' : `Server HTTP Error (${res.status})` 
      };
    }
  } catch (err) {
    console.warn(`Backend connection note at ${endpoint}:`, err.message);
    return { success: false, fallback: true, message: err.message };
  }
}

export const api = {
  // Auth & OTP
  registerUser: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  loginUser: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  loginAdmin: (credentials) => request('/auth/admin/login', { method: 'POST', body: JSON.stringify(credentials) }),
  sendOtp: (data) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyOtp: (data) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  updateUserProfile: (userId, profileData) => request(`/auth/profile/${userId}`, { method: 'PUT', body: JSON.stringify(profileData) }),
  changeUserPassword: (userId, passwordData) => request(`/auth/change-password/${userId}`, { method: 'POST', body: JSON.stringify(passwordData) }),

  // 1. REGISTRATION ( CUSTOMER )
  getCustomers: (userId) => request(`/customers${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`),
  registerCustomer: (custData) => request('/customers', { method: 'POST', body: JSON.stringify(custData) }),
  updateCustomer: (id, custData) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(custData) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  // 2. REGISTRATION ( BANK / CASH )
  getBankAccounts: (userId) => request(`/bank-accounts${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`),
  registerBankCash: (bankData) => request('/bank-accounts', { method: 'POST', body: JSON.stringify(bankData) }),
  updateBankAccount: (id, bankData) => request(`/bank-accounts/${id}`, { method: 'PUT', body: JSON.stringify(bankData) }),
  deleteBankAccount: (id) => request(`/bank-accounts/${id}`, { method: 'DELETE' }),

  // 3. REGISTRATION ( SALES / SERVICES )
  getProducts: (userId) => request(`/products${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`),
  registerSalesService: (itemData) => request('/products', { method: 'POST', body: JSON.stringify(itemData) }),
  updateProduct: (id, itemData) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(itemData) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: (userId) => request(`/invoices${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`),
  createInvoice: (invoiceData) => request('/invoices', { method: 'POST', body: JSON.stringify(invoiceData) }),
  updateInvoice: (id, invoiceData) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(invoiceData) }),
  deleteInvoice: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),

  // Admin Registered Users
  getAdminUsers: () => request('/admin/users'),
};
