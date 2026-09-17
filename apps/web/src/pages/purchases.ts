import { medicineStore } from '../stores/medicine.store';
import { createLineChart, createDonutChart } from '../utils/charts';
import { purchaseService, Purchase as ApiPurchase } from '../services/purchase.service';

type PurchaseTab = 'list' | 'new' | 'returns';

interface Supplier {
  id: number;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

interface PurchaseItem {
  medicine_id: number;
  medicine_name: string;
  batch: string;
  expiry: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  total: number;
}

interface Purchase {
  id: number;
  purchase_number: string;
  supplier: Supplier;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}

let suppliers: Supplier[] = [];
let purchases: Purchase[] = [];
let currentTab: PurchaseTab = 'list';
let cart: PurchaseItem[] = [];
let selectedSupplier: Supplier | null = null;

export function renderPurchases(): string {
  return `
    <div class="page-header d-flex justify-content-between align-items-center">
      <div>
        <h4>Purchases</h4>
        <p>Manage purchase orders and supplier transactions</p>
      </div>
      <button class="btn btn-brand-green" id="newPurchaseBtn">
        <i class="bi bi-plus-lg me-2"></i>New Purchase
      </button>
    </div>

    <div class="inventory-tabs">
      <button class="inventory-tab active" data-tab="list">
        <i class="bi bi-list-ul"></i> Purchase List
      </button>
      <button class="inventory-tab" data-tab="new">
        <i class="bi bi-plus-circle"></i> New Purchase
      </button>
      <button class="inventory-tab" data-tab="returns">
        <i class="bi bi-arrow-return-left"></i> Purchase Returns
      </button>
    </div>

    <div class="tab-content" id="purchaseContent">
    </div>
  `;
}

export function initPurchases(): void {
  loadPurchases();
  initTabs();
}

async function loadPurchases(): Promise<void> {
  try {
    const { data } = await purchaseService.getAll(500);
    purchases = data.map((p) => ({
      id: p.id,
      purchase_number: p.purchase_number,
      supplier: { id: p.supplier_id, name: (p as any).supplier_name || '', phone: '', address: '', balance: 0 },
      items: [],
      subtotal: p.subtotal,
      discount: p.discount_amount,
      tax: p.tax_amount,
      total: p.total_amount,
      status: p.status,
      payment_status: p.payment_status,
      created_at: p.created_at,
    }));
  } catch {
    purchases = [];
  }
  loadTab(currentTab);
}

function initTabs(): void {
  document.querySelectorAll('.inventory-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab') as PurchaseTab;
      if (tabName) {
        document.querySelectorAll('.inventory-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        loadTab(tabName);
      }
    });
  });

  document.getElementById('newPurchaseBtn')?.addEventListener('click', () => {
    document.querySelectorAll('.inventory-tab').forEach((t) => t.classList.remove('active'));
    document.querySelector('[data-tab="new"]')?.classList.add('active');
    loadTab('new');
  });
}

function loadTab(tab: PurchaseTab): void {
  currentTab = tab;
  const content = document.getElementById('purchaseContent');
  if (!content) return;

  switch (tab) {
    case 'list':
      renderPurchaseList(content);
      break;
    case 'new':
      renderNewPurchase(content);
      break;
    case 'returns':
      renderPurchaseReturns(content);
      break;
  }
}

function renderPurchaseList(container: HTMLElement): void {
  container.innerHTML = `
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="searchPurchase" placeholder="Search purchases...">
            </div>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="filterPayment">
              <option value="">All Payment</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div class="col-md-2">
            <input type="date" class="form-control" id="filterDateFrom" placeholder="From Date">
          </div>
          <div class="col-md-2">
            <input type="date" class="form-control" id="filterDateTo" placeholder="To Date">
          </div>
          <div class="col-md-1">
            <button class="btn btn-outline-secondary w-100" id="resetFilters">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${purchases.length}</div>
              <div class="stat-label">Total Purchases</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-bag"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${purchases.reduce((s, p) => s + p.total, 0).toLocaleString()}</div>
              <div class="stat-label">Total Value</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-currency-dollar"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${purchases.filter((p) => p.payment_status === 'unpaid').length}</div>
              <div class="stat-label">Unpaid</div>
            </div>
            <div class="stat-icon orange"><i class="bi bi-exclamation-triangle"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${purchases.filter((p) => p.status === 'pending').length}</div>
              <div class="stat-label">Pending</div>
            </div>
            <div class="stat-icon red"><i class="bi bi-clock"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">Monthly Purchase Trend</h6>
          </div>
          <div class="card-body">
            ${createLineChart({
              labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
              datasets: [
                { name: 'Purchases', values: [180000, 240000, 200000, 260000, 285000, 220000], color: '#0d6efd' },
                { name: 'Payments', values: [150000, 200000, 180000, 220000, 250000, 195000], color: '#198754' },
              ]
            }, 200)}
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Payment Status</h6>
          </div>
          <div class="card-body">
            ${createDonutChart({
              labels: ['Paid', 'Partial', 'Unpaid'],
              values: [
                purchases.filter((p) => p.payment_status === 'paid').length,
                purchases.filter((p) => p.payment_status === 'partial').length,
                purchases.filter((p) => p.payment_status === 'unpaid').length,
              ],
              colors: ['#198754', '#ffc107', '#dc3545']
            }, 140)}
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Purchase Orders</h6>
        <span class="text-muted" id="purchaseCount">${purchases.length} purchases</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Purchase #</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody id="purchaseTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  function renderTable(): void {
    const search = (document.getElementById('searchPurchase') as HTMLInputElement)?.value.toLowerCase() || '';
    const status = (document.getElementById('filterStatus') as HTMLSelectElement)?.value || '';
    const payment = (document.getElementById('filterPayment') as HTMLSelectElement)?.value || '';

    const filtered = purchases.filter((p) => {
      const matchSearch = !search || 
        p.purchase_number.toLowerCase().includes(search) || 
        p.supplier.name.toLowerCase().includes(search);
      const matchStatus = !status || p.status === status;
      const matchPayment = !payment || p.payment_status === payment;
      return matchSearch && matchStatus && matchPayment;
    });

    const tbody = document.getElementById('purchaseTableBody');
    const countEl = document.getElementById('purchaseCount');
    if (countEl) countEl.textContent = `${filtered.length} purchases`;
    if (!tbody) return;

    const statusColors: Record<string, string> = {
      pending: 'badge-warning',
      received: 'badge-success',
      cancelled: 'badge-danger',
    };

    const paymentColors: Record<string, string> = {
      paid: 'badge-success',
      partial: 'badge-warning',
      unpaid: 'badge-danger',
    };

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5">
            <div class="text-muted">
              <i class="bi bi-bag fs-1 d-block mb-2"></i>
              <h6>No purchases found</h6>
              <p class="mb-0">Create your first purchase to get started</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((p) => `
      <tr>
        <td><code>${p.purchase_number}</code></td>
        <td>${new Date(p.created_at).toLocaleDateString()}</td>
        <td>
          <div class="fw-semibold">${p.supplier.name}</div>
          <small class="text-muted">${p.supplier.phone}</small>
        </td>
        <td>${p.items.length} items</td>
        <td class="fw-semibold">₨ ${p.total.toLocaleString()}</td>
        <td><span class="badge-status ${paymentColors[p.payment_status]} text-capitalize">${p.payment_status}</span></td>
        <td><span class="badge-status ${statusColors[p.status]} text-capitalize">${p.status}</span></td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary view-btn" data-id="${p.id}" title="View">
              <i class="bi bi-eye"></i>
            </button>
            ${p.status === 'pending' ? `
              <button class="btn btn-outline-success receive-btn" data-id="${p.id}" title="Receive">
                <i class="bi bi-check-lg"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.view-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id') || '0');
        viewPurchase(id);
      });
    });

    tbody.querySelectorAll('.receive-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id') || '0');
        receivePurchase(id);
      });
    });
  }

  document.getElementById('searchPurchase')?.addEventListener('input', renderTable);
  document.getElementById('filterStatus')?.addEventListener('change', renderTable);
  document.getElementById('filterPayment')?.addEventListener('change', renderTable);
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    (document.getElementById('searchPurchase') as HTMLInputElement).value = '';
    (document.getElementById('filterStatus') as HTMLSelectElement).value = '';
    (document.getElementById('filterPayment') as HTMLSelectElement).value = '';
    renderTable();
  });

  renderTable();
}

function viewPurchase(id: number): void {
  const purchase = purchases.find((p) => p.id === id);
  if (!purchase) return;

  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Purchase ${purchase.purchase_number}</h5>
          <button type="button" class="btn-close modal-close-btn"></button>
        </div>
        <div class="modal-body">
          <div class="row mb-4">
            <div class="col-md-6">
              <h6 class="text-muted mb-2">Supplier Information</h6>
              <p class="mb-1"><strong>${purchase.supplier.name}</strong></p>
              <p class="mb-1"><small>${purchase.supplier.phone}</small></p>
              <p class="mb-0"><small>${purchase.supplier.address}</small></p>
            </div>
            <div class="col-md-6 text-md-end">
              <h6 class="text-muted mb-2">Purchase Details</h6>
              <p class="mb-1">Date: <strong>${new Date(purchase.created_at).toLocaleDateString()}</strong></p>
              <p class="mb-1">Status: <span class="badge-status badge-${purchase.status === 'received' ? 'success' : 'warning'} text-capitalize">${purchase.status}</span></p>
              <p class="mb-0">Payment: <span class="badge-status badge-${purchase.payment_status === 'paid' ? 'success' : purchase.payment_status === 'partial' ? 'warning' : 'danger'} text-capitalize">${purchase.payment_status}</span></p>
            </div>
          </div>

          <h6 class="text-muted mb-2">Items</h6>
          <div class="table-responsive">
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Expiry</th>
                  <th class="text-end">Qty</th>
                  <th class="text-end">Price</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                ${purchase.items.map((item) => `
                  <tr>
                    <td>${item.medicine_name}</td>
                    <td><code>${item.batch}</code></td>
                    <td>${item.expiry}</td>
                    <td class="text-end">${item.quantity}</td>
                    <td class="text-end">₨ ${item.purchase_price}</td>
                    <td class="text-end">₨ ${item.total.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="row justify-content-end">
            <div class="col-md-4">
              <table class="table table-sm">
                <tbody>
                  <tr><td>Subtotal</td><td class="text-end">₨ ${purchase.subtotal.toLocaleString()}</td></tr>
                  <tr><td>Discount</td><td class="text-end">- ₨ ${purchase.discount.toLocaleString()}</td></tr>
                  <tr><td>Tax</td><td class="text-end">₨ ${purchase.tax.toLocaleString()}</td></tr>
                  <tr class="table-light"><td><strong>Total</strong></td><td class="text-end"><strong>₨ ${purchase.total.toLocaleString()}</strong></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-close-btn">Close</button>
          <button type="button" class="btn btn-outline-secondary"><i class="bi bi-printer me-2"></i>Print</button>
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
}

function receivePurchase(id: number): void {
  if (!confirm('Are you sure you want to mark this purchase as received?')) return;
  
  const purchase = purchases.find((p) => p.id === id);
  if (purchase) {
    purchase.status = 'received';
    
    // Update stock for each item
    purchase.items.forEach((item) => {
      const med = medicineStore.getAll().find((m) => m.id === item.medicine_id);
      if (med) {
        medicineStore.updateStock(item.medicine_id, item.quantity);
      }
    });
    
    alert('Purchase received successfully! Stock updated.');
    loadTab('list');
  }
}

function renderNewPurchase(container: HTMLElement): void {
  cart = [];
  selectedSupplier = null;

  container.innerHTML = `
    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card mb-4">
          <div class="card-header">
            <h6 class="mb-0">Supplier Information</h6>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Select Supplier <span class="text-danger">*</span></label>
                <select class="form-select" id="selectSupplier" required>
                  <option value="">Choose Supplier</option>
                  ${suppliers.map((s) => `<option value="${s.id}">${s.name} - ₨ ${s.balance.toLocaleString()}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Invoice Number</label>
                <input type="text" class="form-control" id="supplierInvoice" placeholder="Invoice #">
              </div>
              <div class="col-md-3">
                <label class="form-label">Purchase Date</label>
                <input type="date" class="form-control" id="purchaseDate" value="${new Date().toISOString().split('T')[0]}">
              </div>
            </div>
            <div id="supplierInfo" class="mt-3 d-none">
              <div class="alert alert-info mb-0">
                <div class="row">
                  <div class="col-md-4"><strong>Phone:</strong> <span id="supplierPhone"></span></div>
                  <div class="col-md-4"><strong>Address:</strong> <span id="supplierAddress"></span></div>
                  <div class="col-md-4"><strong>Balance:</strong> <span id="supplierBalance"></span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Add Medicines</h6>
          </div>
          <div class="card-body">
            <div class="row g-3 mb-3">
              <div class="col-md-4">
                <label class="form-label">Select Medicine <span class="text-danger">*</span></label>
                <select class="form-select" id="selectMedicine">
                  <option value="">Choose Medicine</option>
                  ${medicineStore.getAll().map((m) => `<option value="${m.id}" data-name="${m.name}">${m.name} (${m.batch})</option>`).join('')}
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label">Batch # <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="itemBatch" placeholder="Batch">
              </div>
              <div class="col-md-2">
                <label class="form-label">Expiry <span class="text-danger">*</span></label>
                <input type="date" class="form-control" id="itemExpiry">
              </div>
              <div class="col-md-1">
                <label class="form-label">Qty <span class="text-danger">*</span></label>
                <input type="number" class="form-control" id="itemQty" min="1" value="1">
              </div>
              <div class="col-md-1">
                <label class="form-label">P. Price <span class="text-danger">*</span></label>
                <input type="number" class="form-control" id="itemPrice" min="0" step="0.01" value="0">
              </div>
              <div class="col-md-1">
                <label class="form-label">S. Price <span class="text-danger">*</span></label>
                <input type="number" class="form-control" id="itemSalePrice" min="0" step="0.01" value="0">
              </div>
              <div class="col-md-1 d-flex align-items-end">
                <button class="btn btn-brand-green w-100" id="addItemBtn">
                  <i class="bi bi-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">Purchase Items</h6>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine</th>
                    <th>Batch</th>
                    <th>Expiry</th>
                    <th class="text-end">Qty</th>
                    <th class="text-end">Price</th>
                    <th class="text-end">Sale Price</th>
                    <th class="text-end">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="cartItems">
                </tbody>
              </table>
            </div>
            <div id="emptyCart" class="text-center py-5 text-muted">
              <i class="bi bi-cart fs-1 d-block mb-2"></i>
              <p>No items added yet</p>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card sticky-top" style="top: 80px;">
          <div class="card-header">
            <h6 class="mb-0">Order Summary</h6>
          </div>
          <div class="card-body">
            <div class="summary-row d-flex justify-content-between mb-2">
              <span>Subtotal</span>
              <span id="summarySubtotal">₨ 0</span>
            </div>
            <div class="summary-row d-flex justify-content-between mb-2">
              <span>Discount</span>
              <div class="d-flex align-items-center gap-2">
                <input type="number" class="form-control form-control-sm text-end" style="width: 100px;" id="discountAmount" min="0" value="0">
              </div>
            </div>
            <div class="summary-row d-flex justify-content-between mb-2">
              <span>Tax (GST)</span>
              <div class="d-flex align-items-center gap-2">
                <input type="number" class="form-control form-control-sm text-end" style="width: 80px;" id="taxRate" min="0" max="100" value="0">
                <span>%</span>
              </div>
            </div>
            <hr>
            <div class="d-flex justify-content-between mb-3">
              <strong>Total</strong>
              <strong id="summaryTotal" class="text-brand-green">₨ 0</strong>
            </div>

            <div class="mb-3">
              <label class="form-label">Payment Method</label>
              <select class="form-select" id="paymentMethod">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit">Credit (Pay Later)</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Amount Paid</label>
              <input type="number" class="form-control" id="amountPaid" min="0" value="0">
            </div>

            <div class="mb-3">
              <label class="form-label">Notes</label>
              <textarea class="form-control" id="purchaseNotes" rows="2" placeholder="Additional notes..."></textarea>
            </div>

            <button class="btn btn-brand-green w-100 btn-lg" id="savePurchaseBtn">
              <i class="bi bi-check-circle me-2"></i>Save Purchase
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('selectSupplier')?.addEventListener('change', (e) => {
    const id = parseInt((e.target as HTMLSelectElement).value);
    selectedSupplier = suppliers.find((s) => s.id === id) || null;
    const info = document.getElementById('supplierInfo');
    if (selectedSupplier && info) {
      document.getElementById('supplierPhone')!.textContent = selectedSupplier.phone;
      document.getElementById('supplierAddress')!.textContent = selectedSupplier.address;
      document.getElementById('supplierBalance')!.textContent = `₨ ${selectedSupplier.balance.toLocaleString()}`;
      info.classList.remove('d-none');
    } else if (info) {
      info.classList.add('d-none');
    }
  });

  document.getElementById('addItemBtn')?.addEventListener('click', addItemToCart);

  document.getElementById('discountAmount')?.addEventListener('input', updateSummary);
  document.getElementById('taxRate')?.addEventListener('input', updateSummary);

  document.getElementById('savePurchaseBtn')?.addEventListener('click', savePurchase);

  renderCart();
}

function addItemToCart(): void {
  const medicineId = parseInt((document.getElementById('selectMedicine') as HTMLSelectElement).value);
  const batch = (document.getElementById('itemBatch') as HTMLInputElement).value;
  const expiry = (document.getElementById('itemExpiry') as HTMLInputElement).value;
  const quantity = parseInt((document.getElementById('itemQty') as HTMLInputElement).value) || 1;
  const purchasePrice = parseFloat((document.getElementById('itemPrice') as HTMLInputElement).value) || 0;
  const salePrice = parseFloat((document.getElementById('itemSalePrice') as HTMLInputElement).value) || 0;

  if (!medicineId || !batch || !expiry || purchasePrice <= 0) {
    alert('Please fill all required fields');
    return;
  }

  const medicine = medicineStore.getById(medicineId);
  if (!medicine) {
    alert('Medicine not found');
    return;
  }

  cart.push({
    medicine_id: medicineId,
    medicine_name: medicine.name,
    batch,
    expiry,
    quantity,
    purchase_price: purchasePrice,
    sale_price: salePrice,
    total: quantity * purchasePrice,
  });

  // Clear form
  (document.getElementById('itemBatch') as HTMLInputElement).value = '';
  (document.getElementById('itemExpiry') as HTMLInputElement).value = '';
  (document.getElementById('itemQty') as HTMLInputElement).value = '1';
  (document.getElementById('itemPrice') as HTMLInputElement).value = '0';
  (document.getElementById('itemSalePrice') as HTMLInputElement).value = '0';

  renderCart();
  updateSummary();
}

function renderCart(): void {
  const tbody = document.getElementById('cartItems');
  const emptyCart = document.getElementById('emptyCart');
  if (!tbody) return;

  if (cart.length === 0) {
    tbody.innerHTML = '';
    if (emptyCart) emptyCart.classList.remove('d-none');
    return;
  }

  if (emptyCart) emptyCart.classList.add('d-none');

  tbody.innerHTML = cart.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td class="fw-semibold">${item.medicine_name}</td>
      <td><code>${item.batch}</code></td>
      <td>${item.expiry}</td>
      <td class="text-end">${item.quantity}</td>
      <td class="text-end">₨ ${item.purchase_price}</td>
      <td class="text-end">₨ ${item.sale_price}</td>
      <td class="text-end fw-semibold">₨ ${item.total.toLocaleString()}</td>
      <td>
        <button class="btn btn-sm btn-outline-danger remove-item" data-index="${index}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.remove-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-index') || '0');
      cart.splice(index, 1);
      renderCart();
      updateSummary();
    });
  });
}

function updateSummary(): void {
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discount = parseFloat((document.getElementById('discountAmount') as HTMLInputElement)?.value) || 0;
  const taxRate = parseFloat((document.getElementById('taxRate') as HTMLInputElement)?.value) || 0;
  const taxable = subtotal - discount;
  const tax = taxable * (taxRate / 100);
  const total = taxable + tax;

  const subtotalEl = document.getElementById('summarySubtotal');
  const totalEl = document.getElementById('summaryTotal');
  if (subtotalEl) subtotalEl.textContent = `₨ ${subtotal.toLocaleString()}`;
  if (totalEl) totalEl.textContent = `₨ ${total.toLocaleString()}`;
}

function savePurchase(): void {
  if (!selectedSupplier) {
    alert('Please select a supplier');
    return;
  }

  if (cart.length === 0) {
    alert('Please add at least one item');
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discount = parseFloat((document.getElementById('discountAmount') as HTMLInputElement)?.value) || 0;
  const taxRate = parseFloat((document.getElementById('taxRate') as HTMLInputElement)?.value) || 0;
  const taxable = subtotal - discount;
  const tax = taxable * (taxRate / 100);
  const total = taxable + tax;

  const amountPaid = parseFloat((document.getElementById('amountPaid') as HTMLInputElement)?.value) || 0;
  const paymentMethod = (document.getElementById('paymentMethod') as HTMLSelectElement).value;

  let paymentStatus = 'unpaid';
  if (amountPaid >= total) paymentStatus = 'paid';
  else if (amountPaid > 0) paymentStatus = 'partial';

  const newPurchase: Purchase = {
    id: purchases.length + 1,
    purchase_number: `PO-2026-${String(purchases.length + 1).padStart(6, '0')}`,
    supplier: selectedSupplier,
    items: [...cart],
    subtotal,
    discount,
    tax,
    total,
    status: 'pending',
    payment_status: paymentStatus,
    created_at: new Date().toISOString(),
  };

  purchases.push(newPurchase);
  
  // Add items to medicine store
  cart.forEach((item) => {
    const existingMed = medicineStore.getAll().find((m) => m.id === item.medicine_id);
    if (existingMed) {
      medicineStore.updateStock(item.medicine_id, item.quantity);
    }
  });

  alert(`Purchase ${newPurchase.purchase_number} created successfully!`);
  
  // Reset form
  cart = [];
  selectedSupplier = null;
  loadTab('list');
}

function renderPurchaseReturns(container: HTMLElement): void {
  const returns = [
    { id: 1, date: '2026-09-12', purchase: 'PO-2026-000001', supplier: 'Karachi Pharmaceuticals', items: 2, total: 5000, status: 'completed' },
    { id: 2, date: '2026-09-11', purchase: 'PO-2026-000002', supplier: 'Lahore Medical Suppliers', items: 1, total: 2500, status: 'pending' },
  ];

  container.innerHTML = `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Purchase Returns</h6>
        <button class="btn btn-sm btn-brand-green" id="newReturnBtn">
          <i class="bi bi-plus-lg me-2"></i>New Return
        </button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Return #</th>
                <th>Date</th>
                <th>Original Purchase</th>
                <th>Supplier</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${returns.length === 0 ? `
                <tr>
                  <td colspan="8" class="text-center py-5">
                    <div class="text-muted">
                      <i class="bi bi-arrow-return-left fs-1 d-block mb-2"></i>
                      <h6>No purchase returns</h6>
                    </div>
                  </td>
                </tr>
              ` : returns.map((r) => `
                <tr>
                  <td><code>PR-2026-${String(r.id).padStart(4, '0')}</code></td>
                  <td>${new Date(r.date).toLocaleDateString()}</td>
                  <td><code>${r.purchase}</code></td>
                  <td>${r.supplier}</td>
                  <td>${r.items} items</td>
                  <td class="fw-semibold">₨ ${r.total.toLocaleString()}</td>
                  <td><span class="badge-status ${r.status === 'completed' ? 'badge-success' : 'badge-warning'} text-capitalize">${r.status}</span></td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary"><i class="bi bi-eye"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('newReturnBtn')?.addEventListener('click', () => {
    alert('Purchase return form will be implemented in the next phase.');
  });
}
