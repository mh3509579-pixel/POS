import { createDonutChart, createHorizontalBarChart } from '../utils/charts';
import { supplierService, Supplier as ApiSupplier } from '../services/supplier.service';

interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  cnic: string;
  company: string;
  type: 'local' | 'national' | 'international';
  credit_limit: number;
  balance: number;
  total_purchases: number;
  last_purchase: string;
  rating: number;
  created_at: string;
}

interface SupplierTransaction {
  id: number;
  date: string;
  type: 'purchase' | 'payment' | 'return';
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

let suppliers: Supplier[] = [];
let filteredSuppliers: Supplier[] = [];

export function renderSuppliers(): string {
  return `
    <div class="page-header">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h4>Supplier Management</h4>
          <p>Manage supplier profiles, payments, and purchase history</p>
        </div>
        <button class="btn btn-brand-green" id="addSupplierBtn">
          <i class="bi bi-building me-2"></i>Add Supplier
        </button>
      </div>
    </div>

    <div class="row g-3 mb-4" id="supplierStats">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value" id="statTotal">0</div>
              <div class="stat-label">Total Suppliers</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-building"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value" id="statInternational">0</div>
              <div class="stat-label">International</div>
            </div>
            <div class="stat-icon orange"><i class="bi bi-globe"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value" id="statPayable">₨ 0</div>
              <div class="stat-label">Total Payable</div>
            </div>
            <div class="stat-icon red"><i class="bi bi-wallet2"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value" id="statPurchases">₨ 0</div>
              <div class="stat-label">Total Purchases</div>
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
            <h6 class="mb-0">Supplier Types</h6>
          </div>
          <div class="card-body" id="supplierTypeChart"></div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Top Suppliers by Purchases</h6>
          </div>
          <div class="card-body" id="topSuppliersChart"></div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="searchSupplier" placeholder="Search suppliers...">
            </div>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="filterType">
              <option value="">All Types</option>
              <option value="local">Local</option>
              <option value="national">National</option>
              <option value="international">International</option>
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
            <select class="form-select" id="filterRating">
              <option value="">All Ratings</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="sortBy">
              <option value="name">Sort by Name</option>
              <option value="purchases">Sort by Purchases</option>
              <option value="balance">Sort by Balance</option>
              <option value="rating">Sort by Rating</option>
              <option value="recent">Sort by Recent</option>
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

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Suppliers Directory</h6>
        <span class="text-muted" id="supplierCount">0 suppliers</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Rating</th>
                <th class="text-end">Credit Limit</th>
                <th class="text-end">Balance</th>
                <th class="text-end">Total Purchases</th>
                <th>Last Purchase</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody id="suppliersTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderStats(): void {
  const total = suppliers.length;
  const international = suppliers.filter((s) => s.type === 'international').length;
  const payable = suppliers.reduce((sum, s) => sum + s.balance, 0);
  const purchases = suppliers.reduce((sum, s) => sum + s.total_purchases, 0);

  const el = (id: string) => document.getElementById(id);
  if (el('statTotal')) el('statTotal')!.textContent = String(total);
  if (el('statInternational')) el('statInternational')!.textContent = String(international);
  if (el('statPayable')) el('statPayable')!.textContent = `₨ ${payable.toLocaleString()}`;
  if (el('statPurchases')) el('statPurchases')!.textContent = `₨ ${purchases.toLocaleString()}`;
}

function renderCharts(): void {
  const typeChart = document.getElementById('supplierTypeChart');
  const topChart = document.getElementById('topSuppliersChart');

  if (typeChart) {
    typeChart.innerHTML = createDonutChart({
      labels: ['Local', 'National', 'International'],
      values: [
        suppliers.filter((s) => s.type === 'local').length,
        suppliers.filter((s) => s.type === 'national').length,
        suppliers.filter((s) => s.type === 'international').length,
      ],
      colors: ['#0d6efd', '#ffc107', '#198754']
    }, 160);
  }

  if (topChart) {
    const sorted = [...suppliers].sort((a, b) => b.total_purchases - a.total_purchases).slice(0, 5);
    topChart.innerHTML = createHorizontalBarChart({
      labels: sorted.map((s) => s.name.length > 18 ? s.name.slice(0, 18) + '...' : s.name),
      values: sorted.map((s) => s.total_purchases),
      colors: ['#198754', '#0d6efd', '#ffc107', '#0dcaf0', '#6c757d']
    }, 160);
  }
}

export function initSuppliers(): void {
  loadSuppliers();
  initEventListeners();
}

async function loadSuppliers(): Promise<void> {
  try {
    const { data } = await supplierService.getAll({ limit: 500 });
    suppliers = data.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      cnic: s.tax_number || '',
      company: s.contact_person || '',
      type: s.type as 'local' | 'national' | 'international',
      credit_limit: s.payment_terms_days * 1000,
      balance: s.current_balance,
      total_purchases: s.total_purchases,
      last_purchase: s.updated_at,
      rating: s.rating,
      created_at: s.created_at,
    }));
    filteredSuppliers = [...suppliers];
    renderStats();
    renderCharts();
    renderTable();
  } catch {
    suppliers = [];
    filteredSuppliers = [];
    renderStats();
    renderCharts();
    renderTable();
  }
}

function initEventListeners(): void {
  document.getElementById('searchSupplier')?.addEventListener('input', () => {
    filterSuppliers();
    renderTable();
  });

  document.getElementById('filterType')?.addEventListener('change', () => {
    filterSuppliers();
    renderTable();
  });

  document.getElementById('filterBalance')?.addEventListener('change', () => {
    filterSuppliers();
    renderTable();
  });

  document.getElementById('filterRating')?.addEventListener('change', () => {
    filterSuppliers();
    renderTable();
  });

  document.getElementById('sortBy')?.addEventListener('change', () => {
    filterSuppliers();
    renderTable();
  });

  document.getElementById('resetFilters')?.addEventListener('click', () => {
    (document.getElementById('searchSupplier') as HTMLInputElement).value = '';
    (document.getElementById('filterType') as HTMLSelectElement).value = '';
    (document.getElementById('filterBalance') as HTMLSelectElement).value = '';
    (document.getElementById('filterRating') as HTMLSelectElement).value = '';
    (document.getElementById('sortBy') as HTMLSelectElement).value = 'name';
    filteredSuppliers = [...suppliers];
    renderTable();
  });

  document.getElementById('addSupplierBtn')?.addEventListener('click', () => {
    showSupplierModal();
  });
}

function filterSuppliers(): void {
  const search = (document.getElementById('searchSupplier') as HTMLInputElement)?.value.toLowerCase() || '';
  const type = (document.getElementById('filterType') as HTMLSelectElement)?.value || '';
  const balance = (document.getElementById('filterBalance') as HTMLSelectElement)?.value || '';
  const rating = (document.getElementById('filterRating') as HTMLSelectElement)?.value || '';
  const sortBy = (document.getElementById('sortBy') as HTMLSelectElement)?.value || 'name';

  filteredSuppliers = suppliers.filter((s) => {
    const matchSearch = !search || 
      s.name.toLowerCase().includes(search) || 
      s.phone.includes(search) || 
      s.company.toLowerCase().includes(search) ||
      s.email.toLowerCase().includes(search);
    
    const matchType = !type || s.type === type;

    let matchBalance = true;
    if (balance === 'zero') matchBalance = s.balance === 0;
    else if (balance === 'positive') matchBalance = s.balance > 0;
    else if (balance === 'high') matchBalance = s.balance > 50000;

    let matchRating = true;
    if (rating) matchRating = s.rating >= parseFloat(rating);

    return matchSearch && matchType && matchBalance && matchRating;
  });

  // Sort
  switch (sortBy) {
    case 'name':
      filteredSuppliers.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'purchases':
      filteredSuppliers.sort((a, b) => b.total_purchases - a.total_purchases);
      break;
    case 'balance':
      filteredSuppliers.sort((a, b) => b.balance - a.balance);
      break;
    case 'rating':
      filteredSuppliers.sort((a, b) => b.rating - a.rating);
      break;
    case 'recent':
      filteredSuppliers.sort((a, b) => new Date(b.last_purchase).getTime() - new Date(a.last_purchase).getTime());
      break;
  }
}

function renderTable(): void {
  const tbody = document.getElementById('suppliersTableBody');
  const countEl = document.getElementById('supplierCount');
  if (countEl) countEl.textContent = `${filteredSuppliers.length} suppliers`;
  if (!tbody) return;

  const typeColors: Record<string, string> = {
    local: 'badge-info',
    national: 'badge-warning',
    international: 'badge-success',
  };

  if (filteredSuppliers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-5">
          <div class="text-muted">
            <i class="bi bi-building fs-1 d-block mb-2"></i>
            <h6>No suppliers found</h6>
            <p class="mb-0">Add your first supplier to get started</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredSuppliers.map((s) => `
    <tr>
      <td>
        <div class="d-flex align-items-center">
          <div class="avatar-circle green me-2" style="width: 36px; height: 36px; font-size: 12px;">
            <i class="bi bi-building"></i>
          </div>
          <div>
            <div class="fw-semibold">${s.name}</div>
            <small class="text-muted">${s.company}</small>
          </div>
        </div>
      </td>
      <td>
        <div>${s.phone}</div>
        <small class="text-muted">${s.email}</small>
      </td>
      <td><span class="badge-status ${typeColors[s.type]} text-capitalize">${s.type}</span></td>
      <td>
        <div class="d-flex align-items-center">
          ${renderStars(s.rating)}
          <small class="ms-1">${s.rating}</small>
        </div>
      </td>
      <td class="text-end">₨ ${s.credit_limit.toLocaleString()}</td>
      <td class="text-end">
        <span class="${s.balance > 0 ? 'text-danger fw-semibold' : 'text-success'}">
          ${s.balance > 0 ? `₨ ${s.balance.toLocaleString()}` : 'Clear'}
        </span>
      </td>
      <td class="text-end">₨ ${s.total_purchases.toLocaleString()}</td>
      <td>${s.last_purchase ? new Date(s.last_purchase).toLocaleDateString() : 'Never'}</td>
      <td class="text-end">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary view-details-btn" data-id="${s.id}" title="View Details">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-outline-secondary edit-btn" data-id="${s.id}" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-danger delete-btn" data-id="${s.id}" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach events
  tbody.querySelectorAll('.view-details-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0');
      viewSupplierDetails(id);
    });
  });

  tbody.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0');
      showSupplierModal(id);
    });
  });

  tbody.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0');
      deleteSupplier(id);
    });
  });
}

function renderStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let stars = '';
  
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="bi bi-star-fill text-warning"></i>';
  }
  if (hasHalf) {
    stars += '<i class="bi bi-star-half text-warning"></i>';
  }
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="bi bi-star text-muted"></i>';
  }
  
  return stars;
}

function showSupplierModal(editId?: number): void {
  const isEdit = editId !== undefined;
  const supplier = isEdit ? suppliers.find((s) => s.id === editId) : null;

  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${isEdit ? 'Edit Supplier' : 'Add New Supplier'}</h5>
          <button type="button" class="btn-close modal-close-btn"></button>
        </div>
        <div class="modal-body">
          <form id="supplierForm">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Supplier Name *</label>
                <input type="text" class="form-control" id="supName" required value="${supplier?.name || ''}">
              </div>
              <div class="col-md-6">
                <label class="form-label">Company Name *</label>
                <input type="text" class="form-control" id="supCompany" required value="${supplier?.company || ''}">
              </div>
              <div class="col-md-6">
                <label class="form-label">Phone Number *</label>
                <input type="tel" class="form-control" id="supPhone" required value="${supplier?.phone || ''}" placeholder="021-XXXXXXXX or 03XX-XXXXXXXX">
              </div>
              <div class="col-md-6">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" id="supEmail" value="${supplier?.email || ''}" placeholder="supplier@email.com">
              </div>
              <div class="col-md-6">
                <label class="form-label">CNIC / NTN</label>
                <input type="text" class="form-control" id="supCnic" value="${supplier?.cnic || ''}" placeholder="42101-XXXXXXXX-X">
              </div>
              <div class="col-md-6">
                <label class="form-label">Supplier Type *</label>
                <select class="form-select" id="supType" required>
                  <option value="local" ${supplier?.type === 'local' ? 'selected' : ''}>Local</option>
                  <option value="national" ${supplier?.type === 'national' ? 'selected' : ''}>National</option>
                  <option value="international" ${supplier?.type === 'international' ? 'selected' : ''}>International</option>
                </select>
              </div>
              <div class="col-md-12">
                <label class="form-label">Address</label>
                <textarea class="form-control" id="supAddress" rows="2">${supplier?.address || ''}</textarea>
              </div>
              <div class="col-md-4">
                <label class="form-label">Credit Limit (₨)</label>
                <input type="number" class="form-control" id="supCreditLimit" value="${supplier?.credit_limit || 200000}" min="0">
              </div>
              <div class="col-md-4">
                <label class="form-label">Opening Balance (₨)</label>
                <input type="number" class="form-control" id="supBalance" value="${supplier?.balance || 0}" min="0" ${isEdit ? 'readonly' : ''}>
                ${isEdit ? '<small class="text-muted">Use payments to adjust balance</small>' : ''}
              </div>
              <div class="col-md-4">
                <label class="form-label">Rating (1-5)</label>
                <input type="number" class="form-control" id="supRating" value="${supplier?.rating || 4}" min="1" max="5" step="0.1">
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
          <button type="button" class="btn btn-brand-green" id="saveSupplierBtn">
            <i class="bi bi-check-lg me-2"></i>${isEdit ? 'Update' : 'Add'} Supplier
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

  modal.querySelector('#saveSupplierBtn')?.addEventListener('click', async () => {
    const name = (modal.querySelector('#supName') as HTMLInputElement).value;
    const phone = (modal.querySelector('#supPhone') as HTMLInputElement).value;
    const email = (modal.querySelector('#supEmail') as HTMLInputElement).value;
    const type = (modal.querySelector('#supType') as HTMLSelectElement).value as Supplier['type'];
    const address = (modal.querySelector('#supAddress') as HTMLTextAreaElement).value;
    const creditLimit = parseInt((modal.querySelector('#supCreditLimit') as HTMLInputElement).value) || 200000;
    const rating = parseFloat((modal.querySelector('#supRating') as HTMLInputElement).value) || 4;

    if (!name || !phone) {
      alert('Please fill required fields (Name, Phone)');
      return;
    }

    try {
      if (isEdit && supplier) {
        await supplierService.update(supplier.id, { name, phone, email, type, address, contact_person: name, payment_terms_days: Math.ceil(creditLimit / 1000) });
      } else {
        await supplierService.create({ name, phone, email, type, address, contact_person: name, payment_terms_days: Math.ceil(creditLimit / 1000) });
      }
      modal.remove();
      await loadSuppliers();
    } catch {
      alert('Failed to save supplier. Please try again.');
    }
  });
}

async function deleteSupplier(id: number): Promise<void> {
  const supplier = suppliers.find((s) => s.id === id);
  if (!supplier) return;

  if (supplier.balance > 0) {
    alert('Cannot delete supplier with outstanding balance!');
    return;
  }

  if (confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
    try {
      await supplierService.delete(id);
      await loadSuppliers();
    } catch {
      alert('Failed to delete supplier. Please try again.');
    }
  }
}

function viewSupplierDetails(id: number): void {
  const supplier = suppliers.find((s) => s.id === id);
  if (!supplier) return;

  // Mock transactions
  const transactions: SupplierTransaction[] = [
    { id: 1, date: '2026-09-13', type: 'purchase', reference: 'PO-2026-000001', description: 'Medicine Purchase', debit: 40000, credit: 0, balance: supplier.balance },
    { id: 2, date: '2026-09-10', type: 'payment', reference: 'PAY-2026-0001', description: 'Bank Transfer', debit: 0, credit: 50000, balance: supplier.balance + 50000 },
    { id: 3, date: '2026-09-08', type: 'purchase', reference: 'PO-2026-000005', description: 'Medicine Purchase', debit: 65000, credit: 0, balance: supplier.balance + 50000 - 65000 },
    { id: 4, date: '2026-09-05', type: 'return', reference: 'RET-2026-0001', description: 'Purchase Return', debit: 0, credit: 12000, balance: supplier.balance + 50000 - 65000 + 12000 },
  ];

  const typeColors: Record<string, string> = {
    local: 'badge-info',
    national: 'badge-warning',
    international: 'badge-success',
  };

  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Supplier Details</h5>
          <button type="button" class="btn-close modal-close-btn"></button>
        </div>
        <div class="modal-body">
          <div class="row mb-4">
            <div class="col-md-8">
              <div class="d-flex align-items-center mb-3">
                <div class="avatar-circle green me-3" style="width: 60px; height: 60px; font-size: 24px;">
                  <i class="bi bi-building"></i>
                </div>
                <div>
                  <h4 class="mb-0">${supplier.name}</h4>
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge-status ${typeColors[supplier.type]} text-capitalize">${supplier.type}</span>
                    <span class="text-muted">${supplier.company}</span>
                  </div>
                </div>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <p class="mb-1"><i class="bi bi-telephone me-2 text-muted"></i>${supplier.phone}</p>
                  ${supplier.email ? `<p class="mb-1"><i class="bi bi-envelope me-2 text-muted"></i>${supplier.email}</p>` : ''}
                  <p class="mb-0"><i class="bi bi-geo-alt me-2 text-muted"></i>${supplier.address || 'No address'}</p>
                </div>
                <div class="col-md-6">
                  ${supplier.cnic ? `<p class="mb-1"><i class="bi bi-card-heading me-2 text-muted"></i>CNIC/NTN: <code>${supplier.cnic}</code></p>` : ''}
                  <p class="mb-1"><i class="bi bi-calendar me-2 text-muted"></i>Supplier Since: ${new Date(supplier.created_at).toLocaleDateString()}</p>
                  <p class="mb-0">
                    <i class="bi bi-star-fill text-warning me-2"></i>Rating: ${supplier.rating}/5
                    <span class="ms-2">${renderStars(supplier.rating)}</span>
                  </p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card bg-light">
                <div class="card-body">
                  <h6 class="card-title text-muted mb-3">Account Summary</h6>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Balance:</span>
                    <span class="fw-bold ${supplier.balance > 0 ? 'text-danger' : 'text-success'}">
                      ${supplier.balance > 0 ? `₨ ${supplier.balance.toLocaleString()}` : 'Clear'}
                    </span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Credit Limit:</span>
                    <span>₨ ${supplier.credit_limit.toLocaleString()}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Available Credit:</span>
                    <span class="text-success">₨ ${(supplier.credit_limit - supplier.balance).toLocaleString()}</span>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span>Total Purchases:</span>
                    <span class="fw-bold">₨ ${supplier.total_purchases.toLocaleString()}</span>
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
                  <th>Reference</th>
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
                      <span class="badge-status ${t.type === 'purchase' ? 'badge-info' : t.type === 'payment' ? 'badge-success' : 'badge-warning'} text-capitalize">
                        ${t.type}
                      </span>
                    </td>
                    <td><code>${t.reference}</code></td>
                    <td>${t.description}</td>
                    <td class="text-end">${t.debit > 0 ? `₨ ${t.debit.toLocaleString()}` : '-'}</td>
                    <td class="text-end">${t.credit > 0 ? `₨ ${t.credit.toLocaleString()}` : '-'}</td>
                    <td class="text-end fw-semibold">₨ ${(t.balance || 0).toLocaleString()}</td>
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
            <i class="bi bi-pencil me-2"></i>Edit Supplier
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
    showSupplierModal(supplier.id);
  });

  modal.querySelector('#recordPaymentBtn')?.addEventListener('click', () => {
    modal.remove();
    recordPayment(supplier);
  });
}

function recordPayment(supplier: Supplier): void {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Record Payment - ${supplier.name}</h5>
          <button type="button" class="btn-close modal-close-btn"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-info">
            <div class="d-flex justify-content-between">
              <span>Current Balance:</span>
              <strong>₨ ${supplier.balance.toLocaleString()}</strong>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Payment Amount (₨) *</label>
            <input type="number" class="form-control" id="paymentAmount" min="1" max="${supplier.balance}" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Payment Method *</label>
            <select class="form-select" id="paymentMethod">
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="rtgs">RTGS/IBFT</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Reference/Note</label>
            <input type="text" class="form-control" id="paymentNote" placeholder="Receipt # or transaction ID">
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
      alert('Please enter a valid amount');
      return;
    }

    if (amount > supplier.balance) {
      alert('Amount cannot exceed balance!');
      return;
    }

    supplier.balance -= amount;
    filteredSuppliers = [...suppliers];
    renderTable();
    modal.remove();
    alert(`Payment of ₨ ${amount.toLocaleString()} recorded successfully!\nNew Balance: ₨ ${supplier.balance.toLocaleString()}`);
  });
}
