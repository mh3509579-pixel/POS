import { createDonutChart, createHorizontalBarChart } from '../utils/charts';
import { customerService, Customer as ApiCustomer } from '../services/customer.service';
import { confirmDelete, successToast, errorToast } from '../utils/alerts';

function formatAmount(n: number): string {
  if (n >= 10000000) return `₨ ${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₨ ${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₨ ${(n / 1000).toFixed(1)}K`;
  return `₨ ${n.toFixed(0)}`;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  cnic: string;
  type: 'regular' | 'premium' | 'wholesale';
  credit_limit: number;
  balance: number;
  total_purchases: number;
  last_purchase: string;
  created_at: string;
}

interface CustomerTransaction {
  id: number;
  date: string;
  type: 'sale' | 'payment' | 'return';
  invoice: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

let customers: Customer[] = [];
let filteredCustomers: Customer[] = [];

export function renderCustomers(): string {
  return `
    <div class="page-header">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h4>Customer Management</h4>
          <p>Manage customer profiles, balances, and transaction history</p>
        </div>
        <button class="btn btn-brand-green" id="addCustomerBtn">
          <i class="bi bi-person-plus me-2"></i>Add Customer
        </button>
      </div>
    </div>

    <div class="row g-3 mb-4" id="customerStats">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value" id="statTotal">0</div>
              <div class="stat-label">Total Customers</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-people"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value" id="statPremium">0</div>
              <div class="stat-label">Premium Customers</div>
            </div>
            <div class="stat-icon orange"><i class="bi bi-star"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value" id="statReceivable">₨ 0</div>
              <div class="stat-label">Total Receivable</div>
            </div>
            <div class="stat-icon red"><i class="bi bi-wallet2"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value" id="statSales">₨ 0</div>
              <div class="stat-label">Total Sales</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-graph-up"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Customer Types Distribution</h6>
          </div>
          <div class="card-body" id="customerTypeChart"></div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Top Customers by Purchases</h6>
          </div>
          <div class="card-body" id="topCustomersChart"></div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="searchCustomer" placeholder="Search customers...">
            </div>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="filterType">
              <option value="">All Types</option>
              <option value="regular">Regular</option>
              <option value="premium">Premium</option>
              <option value="wholesale">Wholesale</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="filterBalance">
              <option value="">All Balances</option>
              <option value="zero">Zero Balance</option>
              <option value="positive">Has Balance</option>
              <option value="high">High Balance (>₨50K)</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="sortBy">
              <option value="name">Sort by Name</option>
              <option value="purchases">Sort by Purchases</option>
              <option value="balance">Sort by Balance</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="viewMode">
              <option value="table">Table View</option>
              <option value="grid">Grid View</option>
            </select>
          </div>
          <div class="col-md-1">
            <button class="btn btn-outline-secondary w-100" id="resetFilters">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div id="customerView"></div>
  `;
}

function renderStats(): void {
  const total = customers.length;
  const premium = customers.filter((c) => c.type === 'premium').length;
  const receivable = customers.reduce((sum, c) => sum + c.balance, 0);
  const sales = customers.reduce((sum, c) => sum + c.total_purchases, 0);

  const totalEl = document.getElementById('statTotal');
  const premiumEl = document.getElementById('statPremium');
  const receivableEl = document.getElementById('statReceivable');
  const salesEl = document.getElementById('statSales');

  if (totalEl) totalEl.textContent = String(total);
  if (premiumEl) premiumEl.textContent = String(premium);
  if (receivableEl) receivableEl.textContent = formatAmount(receivable);
  if (salesEl) salesEl.textContent = formatAmount(sales);
}

function renderCharts(): void {
  const typeChart = document.getElementById('customerTypeChart');
  const topChart = document.getElementById('topCustomersChart');

  if (typeChart) {
    typeChart.innerHTML = createDonutChart({
      labels: ['Regular', 'Premium', 'Wholesale'],
      values: [
        customers.filter((c) => c.type === 'regular').length,
        customers.filter((c) => c.type === 'premium').length,
        customers.filter((c) => c.type === 'wholesale').length,
      ],
      colors: ['#0d6efd', '#ffc107', '#198754']
    }, 160);
  }

  if (topChart) {
    const sorted = [...customers].sort((a, b) => b.total_purchases - a.total_purchases).slice(0, 5);
    topChart.innerHTML = createHorizontalBarChart({
      labels: sorted.map((c) => c.name.length > 15 ? c.name.slice(0, 15) + '...' : c.name),
      values: sorted.map((c) => c.total_purchases),
      colors: ['#198754', '#0d6efd', '#ffc107', '#0dcaf0', '#6c757d']
    }, 160);
  }
}

export function initCustomers(): void {
  loadCustomers();
  initEventListeners();
}

async function loadCustomers(): Promise<void> {
  try {
    const { data } = await customerService.getAll({ limit: 500 });
    customers = data.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      cnic: c.cnic || '',
      type: c.type as 'regular' | 'premium' | 'wholesale',
      credit_limit: Number(c.credit_limit) || 0,
      balance: Number(c.current_balance) || 0,
      total_purchases: Number(c.total_purchases) || 0,
      last_purchase: c.updated_at,
      created_at: c.created_at,
    }));
    filteredCustomers = [...customers];
    renderStats();
    renderCharts();
    renderView();
  } catch {
    customers = [];
    filteredCustomers = [];
    renderStats();
    renderCharts();
    renderView();
  }
}

function initEventListeners(): void {
  document.getElementById('searchCustomer')?.addEventListener('input', () => {
    filterCustomers();
    renderView();
  });

  document.getElementById('filterType')?.addEventListener('change', () => {
    filterCustomers();
    renderView();
  });

  document.getElementById('filterBalance')?.addEventListener('change', () => {
    filterCustomers();
    renderView();
  });

  document.getElementById('sortBy')?.addEventListener('change', () => {
    filterCustomers();
    renderView();
  });

  document.getElementById('viewMode')?.addEventListener('change', () => {
    renderView();
  });

  document.getElementById('resetFilters')?.addEventListener('click', () => {
    (document.getElementById('searchCustomer') as HTMLInputElement).value = '';
    (document.getElementById('filterType') as HTMLSelectElement).value = '';
    (document.getElementById('filterBalance') as HTMLSelectElement).value = '';
    (document.getElementById('sortBy') as HTMLSelectElement).value = 'name';
    (document.getElementById('viewMode') as HTMLSelectElement).value = 'table';
    filteredCustomers = [...customers];
    renderView();
  });

  document.getElementById('addCustomerBtn')?.addEventListener('click', () => {
    showCustomerModal();
  });
}

function filterCustomers(): void {
  const search = (document.getElementById('searchCustomer') as HTMLInputElement)?.value.toLowerCase() || '';
  const type = (document.getElementById('filterType') as HTMLSelectElement)?.value || '';
  const balance = (document.getElementById('filterBalance') as HTMLSelectElement)?.value || '';
  const sortBy = (document.getElementById('sortBy') as HTMLSelectElement)?.value || 'name';

  filteredCustomers = customers.filter((c) => {
    const matchSearch = !search || 
      c.name.toLowerCase().includes(search) || 
      c.phone.includes(search) || 
      c.cnic.includes(search) ||
      c.email.toLowerCase().includes(search);
    
    const matchType = !type || c.type === type;

    let matchBalance = true;
    if (balance === 'zero') matchBalance = c.balance === 0;
    else if (balance === 'positive') matchBalance = c.balance > 0;
    else if (balance === 'high') matchBalance = c.balance > 50000;

    return matchSearch && matchType && matchBalance;
  });

  // Sort
  switch (sortBy) {
    case 'name':
      filteredCustomers.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'purchases':
      filteredCustomers.sort((a, b) => b.total_purchases - a.total_purchases);
      break;
    case 'balance':
      filteredCustomers.sort((a, b) => b.balance - a.balance);
      break;
    case 'recent':
      filteredCustomers.sort((a, b) => new Date(b.last_purchase).getTime() - new Date(a.last_purchase).getTime());
      break;
  }
}

function renderView(): void {
  const container = document.getElementById('customerView');
  if (!container) return;

  const viewMode = (document.getElementById('viewMode') as HTMLSelectElement)?.value || 'table';

  if (viewMode === 'grid') {
    renderGridView(container);
  } else {
    renderTableView(container);
  }
}

function renderGridView(container: HTMLElement): void {
  if (filteredCustomers.length === 0) {
    container.innerHTML = `
      <div class="card">
        <div class="card-body text-center py-5">
          <div class="text-muted">
            <i class="bi bi-people fs-1 d-block mb-2"></i>
            <h6>No customers found</h6>
            <p class="mb-0">Add your first customer to get started</p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const typeColors: Record<string, string> = {
    regular: 'badge-info',
    premium: 'badge-warning',
    wholesale: 'badge-success',
  };

  container.innerHTML = `
    <div class="row g-3">
      ${filteredCustomers.map((c) => `
        <div class="col-md-4 col-xl-3">
          <div class="card h-100">
            <div class="card-body">
              <div class="d-flex align-items-center mb-3">
                <div class="customer-avatar me-3">
                  <div class="avatar-circle blue">
                    <i class="bi bi-person"></i>
                  </div>
                </div>
                <div class="flex-grow-1">
                  <h6 class="mb-0">${c.name}</h6>
                  <small class="text-muted">${c.phone}</small>
                </div>
                <span class="badge-status ${typeColors[c.type]} text-capitalize">${c.type}</span>
              </div>
              
              <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                  <small class="text-muted">Balance:</small>
                  <small class="${c.balance > 0 ? 'text-danger' : 'text-success'} fw-semibold">
                    ${c.balance > 0 ? formatAmount(c.balance) : 'Clear'}
                  </small>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <small class="text-muted">Total Purchases:</small>
                  <small class="fw-semibold">${formatAmount(c.total_purchases)}</small>
                </div>
                <div class="d-flex justify-content-between">
                  <small class="text-muted">Last Purchase:</small>
                  <small>${c.last_purchase ? new Date(c.last_purchase).toLocaleDateString() : 'Never'}</small>
                </div>
              </div>

              <div class="progress mb-3" style="height: 6px;">
                <div class="progress-bar ${c.balance > c.credit_limit * 0.8 ? 'bg-danger' : 'bg-success'}" 
                     style="width: ${Math.min((c.total_purchases / c.credit_limit) * 100, 100)}%"></div>
              </div>
              <small class="text-muted d-block mb-3">
                Credit: ${formatAmount(c.credit_limit)}
              </small>

              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary flex-grow-1 view-details-btn" data-id="${c.id}">
                  <i class="bi bi-eye me-1"></i>Details
                </button>
                <button class="btn btn-sm btn-outline-secondary edit-btn" data-id="${c.id}">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${c.id}">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  attachCardEvents();
}

function renderTableView(container: HTMLElement): void {
  if (filteredCustomers.length === 0) {
    container.innerHTML = `
      <div class="card">
        <div class="card-body text-center py-5">
          <div class="text-muted">
            <i class="bi bi-people fs-1 d-block mb-2"></i>
            <h6>No customers found</h6>
            <p class="mb-0">Add your first customer to get started</p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const typeColors: Record<string, string> = {
    regular: 'badge-info',
    premium: 'badge-warning',
    wholesale: 'badge-success',
  };

  container.innerHTML = `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Customers</h6>
        <span class="text-muted">${filteredCustomers.length} customers</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Type</th>
                <th>CNIC</th>
                <th class="text-end">Credit Limit</th>
                <th class="text-end">Balance</th>
                <th class="text-end">Total Purchases</th>
                <th>Last Purchase</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCustomers.map((c) => `
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="avatar-circle blue me-2" style="width: 32px; height: 32px; font-size: 12px;">
                        <i class="bi bi-person"></i>
                      </div>
                      <div>
                        <div class="fw-semibold">${c.name}</div>
                        ${c.email ? `<small class="text-muted">${c.email}</small>` : ''}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>${c.phone}</div>
                    <small class="text-muted text-truncate d-block" style="max-width: 150px;">${c.address}</small>
                  </td>
                  <td><span class="badge-status ${typeColors[c.type]} text-capitalize">${c.type}</span></td>
                  <td><code>${c.cnic || '-'}</code></td>
                  <td class="text-end">${formatAmount(c.credit_limit)}</td>
                  <td class="text-end">
                    <span class="${c.balance > 0 ? 'text-danger fw-semibold' : 'text-success'}">
                      ${c.balance > 0 ? formatAmount(c.balance) : 'Clear'}
                    </span>
                  </td>
                  <td class="text-end">${formatAmount(c.total_purchases)}</td>
                  <td>${c.last_purchase ? new Date(c.last_purchase).toLocaleDateString() : 'Never'}</td>
                  <td class="text-end">
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-secondary view-details-btn" data-id="${c.id}" title="View Details">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-outline-secondary edit-btn" data-id="${c.id}" title="Edit">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-secondary delete-btn" data-id="${c.id}" title="Delete">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  attachCardEvents();
}

function attachCardEvents(): void {
  document.querySelectorAll('.view-details-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0');
      viewCustomerDetails(id);
    });
  });

  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0');
      showCustomerModal(id);
    });
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0');
      deleteCustomer(id);
    });
  });
}

function showCustomerModal(editId?: number): void {
  const isEdit = editId !== undefined;
  const customer = isEdit ? customers.find((c) => c.id === editId) : null;

  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${isEdit ? 'Edit Customer' : 'Add New Customer'}</h5>
          <button type="button" class="btn-close modal-close-btn"></button>
        </div>
        <div class="modal-body">
          <form id="customerForm">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Full Name *</label>
                <input type="text" class="form-control" id="custName" required value="${customer?.name || ''}">
              </div>
              <div class="col-md-6">
                <label class="form-label">Phone Number *</label>
                <input type="tel" class="form-control" id="custPhone" required value="${customer?.phone || ''}" placeholder="03XX-XXXXXXXX">
              </div>
              <div class="col-md-6">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" id="custEmail" value="${customer?.email || ''}" placeholder="customer@email.com">
              </div>
              <div class="col-md-6">
                <label class="form-label">CNIC</label>
                <input type="text" class="form-control" id="custCnic" value="${customer?.cnic || ''}" placeholder="42101-XXXXXXXX-X">
              </div>
              <div class="col-md-12">
                <label class="form-label">Address</label>
                <textarea class="form-control" id="custAddress" rows="2">${customer?.address || ''}</textarea>
              </div>
              <div class="col-md-4">
                <label class="form-label">Customer Type *</label>
                <select class="form-select" id="custType" required>
                  <option value="regular" ${customer?.type === 'regular' ? 'selected' : ''}>Regular</option>
                  <option value="premium" ${customer?.type === 'premium' ? 'selected' : ''}>Premium</option>
                  <option value="wholesale" ${customer?.type === 'wholesale' ? 'selected' : ''}>Wholesale</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Credit Limit (₨)</label>
                <input type="number" class="form-control" id="custCreditLimit" value="${customer?.credit_limit || 50000}" min="0">
              </div>
              <div class="col-md-4">
                <label class="form-label">Opening Balance (₨)</label>
                <input type="number" class="form-control" id="custBalance" value="${customer?.balance || 0}" min="0" ${isEdit ? 'readonly' : ''}>
                ${isEdit ? '<small class="text-muted">Use payments to adjust balance</small>' : ''}
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
          <button type="button" class="btn btn-brand-green" id="saveCustomerBtn">
            <i class="bi bi-check-lg me-2"></i>${isEdit ? 'Update' : 'Add'} Customer
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelectorAll('.modal-close-btn').forEach((btn) => {
    btn.addEventListener('click', () => modal.remove());
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#saveCustomerBtn')?.addEventListener('click', async () => {
    const name = (modal.querySelector('#custName') as HTMLInputElement).value;
    const phone = (modal.querySelector('#custPhone') as HTMLInputElement).value;
    const email = (modal.querySelector('#custEmail') as HTMLInputElement).value;
    const cnic = (modal.querySelector('#custCnic') as HTMLInputElement)?.value || '';
    const address = (modal.querySelector('#custAddress') as HTMLTextAreaElement).value;
    const type = (modal.querySelector('#custType') as HTMLSelectElement).value as Customer['type'];
    const creditLimit = parseInt((modal.querySelector('#custCreditLimit') as HTMLInputElement).value) || 50000;

    if (!name || !phone) {
      errorToast('Please fill required fields (Name, Phone)');
      return;
    }

    try {
      if (isEdit && customer) {
        await customerService.update(customer.id, { name, phone, email, cnic, address, type, credit_limit: creditLimit });
        successToast('Customer updated successfully!');
      } else {
        await customerService.create({ name, phone, email, cnic, address, type, credit_limit: creditLimit });
        successToast('Customer added successfully!');
      }
      modal.remove();
      await loadCustomers();
    } catch (err) {
      errorToast('Failed to save customer. Please try again.');
    }
  });
}

async function deleteCustomer(id: number): Promise<void> {
  const customer = customers.find((c) => c.id === id);
  if (!customer) return;

  if (customer.balance > 0) {
    errorToast('Cannot delete customer with outstanding balance!');
    return;
  }

  const confirmed = await confirmDelete('customer');
  if (!confirmed) return;

  try {
    await customerService.delete(id);
    successToast('Customer deleted successfully!');
    await loadCustomers();
  } catch {
    errorToast('Failed to delete customer.');
  }
}

function viewCustomerDetails(id: number): void {
  const customer = customers.find((c) => c.id === id);
  if (!customer) return;

  // Mock transactions
  const transactions: CustomerTransaction[] = [
    { id: 1, date: '2026-09-13', type: 'sale', invoice: 'INV-2026-000002', description: 'Medicine Purchase', debit: 525, credit: 0, balance: customer.balance },
    { id: 2, date: '2026-09-10', type: 'payment', invoice: 'PAY-2026-0001', description: 'Cash Payment', debit: 0, credit: 1000, balance: customer.balance + 1000 },
    { id: 3, date: '2026-09-08', type: 'sale', invoice: 'INV-2026-000005', description: 'Medicine Purchase', debit: 850, credit: 0, balance: customer.balance + 1000 - 850 },
    { id: 4, date: '2026-09-05', type: 'return', invoice: 'RET-2026-0001', description: 'Product Return', debit: 0, credit: 150, balance: customer.balance + 1000 - 850 + 150 },
  ];

  const typeColors: Record<string, string> = {
    regular: 'badge-info',
    premium: 'badge-warning',
    wholesale: 'badge-success',
  };

  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Customer Details</h5>
          <button type="button" class="btn-close modal-close-btn"></button>
        </div>
        <div class="modal-body">
          <div class="row mb-4">
            <div class="col-md-8">
              <div class="d-flex align-items-center mb-3">
                <div class="avatar-circle blue me-3" style="width: 60px; height: 60px; font-size: 24px;">
                  <i class="bi bi-person"></i>
                </div>
                <div>
                  <h4 class="mb-0">${customer.name}</h4>
                  <span class="badge-status ${typeColors[customer.type]} text-capitalize">${customer.type} Customer</span>
                </div>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <p class="mb-1"><i class="bi bi-telephone me-2 text-muted"></i>${customer.phone}</p>
                  ${customer.email ? `<p class="mb-1"><i class="bi bi-envelope me-2 text-muted"></i>${customer.email}</p>` : ''}
                  <p class="mb-0"><i class="bi bi-geo-alt me-2 text-muted"></i>${customer.address || 'No address'}</p>
                </div>
                <div class="col-md-6">
                  ${customer.cnic ? `<p class="mb-1"><i class="bi bi-card-heading me-2 text-muted"></i>CNIC: <code>${customer.cnic}</code></p>` : ''}
                  <p class="mb-1"><i class="bi bi-calendar me-2 text-muted"></i>Customer Since: ${new Date(customer.created_at).toLocaleDateString()}</p>
                  <p class="mb-0"><i class="bi bi-clock me-2 text-muted"></i>Last Purchase: ${customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString() : 'Never'}</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card bg-light">
                <div class="card-body">
                  <h6 class="card-title text-muted mb-3">Account Summary</h6>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Balance:</span>
                    <span class="fw-bold ${customer.balance > 0 ? 'text-danger' : 'text-success'}">
                      ${customer.balance > 0 ? formatAmount(customer.balance) : 'Clear'}
                    </span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Credit Limit:</span>
                    <span>${formatAmount(customer.credit_limit)}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Available Credit:</span>
                    <span class="text-success">${formatAmount(customer.credit_limit - customer.balance)}</span>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span>Total Purchases:</span>
                    <span class="fw-bold">${formatAmount(customer.total_purchases)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h6 class="text-muted mb-3">Transaction History</h6>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Invoice</th>
                  <th>Description</th>
                  <th class="text-end">Debit</th>
                  <th class="text-end">Credit</th>
                  <th class="text-end">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.map((t) => `
                  <tr>
                    <td>${new Date(t.date).toLocaleDateString()}</td>
                    <td>
                      <span class="badge-status ${t.type === 'sale' ? 'badge-info' : t.type === 'payment' ? 'badge-success' : 'badge-warning'} text-capitalize">
                        ${t.type}
                      </span>
                    </td>
                    <td><code>${t.invoice}</code></td>
                    <td>${t.description}</td>
                    <td class="text-end">${t.debit > 0 ? formatAmount(t.debit) : '-'}</td>
                    <td class="text-end">${t.credit > 0 ? formatAmount(t.credit) : '-'}</td>
                    <td class="text-end fw-semibold">${formatAmount(t.balance || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-close-btn">Close</button>
          <button type="button" class="btn btn-outline-success" id="recordPaymentBtn">
            <i class="bi bi-cash me-2"></i>Record Payment
          </button>
          <button type="button" class="btn btn-brand-green" id="editFromDetailsBtn">
            <i class="bi bi-pencil me-2"></i>Edit Customer
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelectorAll('.modal-close-btn').forEach((btn) => {
    btn.addEventListener('click', () => modal.remove());
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#editFromDetailsBtn')?.addEventListener('click', () => {
    modal.remove();
    showCustomerModal(customer.id);
  });

  modal.querySelector('#recordPaymentBtn')?.addEventListener('click', () => {
    modal.remove();
    recordPayment(customer);
  });
}

function recordPayment(customer: Customer): void {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Record Payment - ${customer.name}</h5>
          <button type="button" class="btn-close modal-close-btn"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-info">
            <div class="d-flex justify-content-between">
              <span>Current Balance:</span>
              <strong>${formatAmount(customer.balance)}</strong>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Payment Amount (₨) *</label>
            <input type="number" class="form-control" id="paymentAmount" min="1" max="${customer.balance}" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Payment Method *</label>
            <select class="form-select" id="paymentMethod">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Reference/Note</label>
            <input type="text" class="form-control" id="paymentNote" placeholder="Receipt # or note">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
          <button type="button" class="btn btn-success" id="savePaymentBtn">
            <i class="bi bi-check-lg me-2"></i>Record Payment
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelectorAll('.modal-close-btn').forEach((btn) => {
    btn.addEventListener('click', () => modal.remove());
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector('#savePaymentBtn')?.addEventListener('click', () => {
    const amount = parseInt((modal.querySelector('#paymentAmount') as HTMLInputElement).value) || 0;
    const method = (modal.querySelector('#paymentMethod') as HTMLSelectElement).value;
    const note = (modal.querySelector('#paymentNote') as HTMLInputElement).value;

    if (!amount || amount <= 0) {
      errorToast('Please enter a valid amount');
      return;
    }

    if (amount > customer.balance) {
      errorToast('Amount cannot exceed balance!');
      return;
    }

    customer.balance -= amount;
    filteredCustomers = [...customers];
    renderView();
    modal.remove();
    successToast(`Payment of ${formatAmount(amount)} recorded successfully! New Balance: ${formatAmount(customer.balance)}`);
  });
}
