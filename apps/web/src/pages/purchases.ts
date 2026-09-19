import { medicineStore } from '../stores/medicine.store';
import { createLineChart, createDonutChart } from '../utils/charts';
import { purchaseService, Purchase as ApiPurchase, PurchaseReturn, PurchaseWithItems } from '../services/purchase.service';
import { supplierService } from '../services/supplier.service';
import { confirmAction, successToast, errorToast } from '../utils/alerts';

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
  loadSuppliers();
  loadPurchases();
  initTabs();
}

async function loadSuppliers(): Promise<void> {
  try {
    const { data } = await supplierService.getAll({ limit: 100 });
    suppliers = data.map((s: any) => ({
      id: s.id,
      name: s.name,
      phone: s.phone || '',
      address: s.address || '',
      balance: s.balance || 0,
    }));
  } catch {
    suppliers = [];
  }
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
    const dateFrom = (document.getElementById('filterDateFrom') as HTMLInputElement)?.value || '';
    const dateTo = (document.getElementById('filterDateTo') as HTMLInputElement)?.value || '';

    const filtered = purchases.filter((p) => {
      const matchSearch = !search || 
        p.purchase_number.toLowerCase().includes(search) || 
        p.supplier.name.toLowerCase().includes(search);
      const matchStatus = !status || p.status === status;
      const matchPayment = !payment || p.payment_status === payment;
      if (dateFrom && new Date(p.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(p.created_at) > new Date(dateTo + 'T23:59:59')) return false;
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
  document.getElementById('filterDateFrom')?.addEventListener('change', renderTable);
  document.getElementById('filterDateTo')?.addEventListener('change', renderTable);
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    (document.getElementById('searchPurchase') as HTMLInputElement).value = '';
    (document.getElementById('filterStatus') as HTMLSelectElement).value = '';
    (document.getElementById('filterPayment') as HTMLSelectElement).value = '';
    (document.getElementById('filterDateFrom') as HTMLInputElement).value = '';
    (document.getElementById('filterDateTo') as HTMLInputElement).value = '';
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

async function receivePurchase(id: number): Promise<void> {
  if (!(await confirmAction('Receive Purchase?', 'Stock will be updated.'))) return;
  
  try {
    await purchaseService.receive(id);
    const purchase = purchases.find((p) => p.id === id);
    if (purchase) {
      purchase.status = 'received';
      purchase.items.forEach((item) => {
        medicineStore.updateStock(item.medicine_id, item.quantity);
      });
    }
    successToast('Purchase received successfully! Stock updated.');
    loadTab('list');
  } catch (error) {
    console.warn('API receive failed, processing locally:', error);
    const purchase = purchases.find((p) => p.id === id);
    if (purchase) {
      purchase.status = 'received';
      purchase.items.forEach((item) => {
        medicineStore.updateStock(item.medicine_id, item.quantity);
      });
    }
    successToast('Purchase received locally! Stock updated.');
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

async function savePurchase(): Promise<void> {
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

  try {
    await purchaseService.create({
      supplier_id: selectedSupplier.id,
      items: cart.map((item) => ({
        medicine_id: item.medicine_id,
        batch_number: item.batch,
        expiry_date: item.expiry,
        quantity: item.quantity,
        unit_price: item.purchase_price,
        sale_price: item.sale_price,
      })),
      discount,
      tax_rate: taxRate,
    });
    successToast('Purchase created successfully!');
  } catch (error) {
    console.warn('API purchase creation failed, processing locally:', error);
  }

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

  cart = [];
  selectedSupplier = null;
  loadTab('list');
}

async function renderPurchaseReturns(container: HTMLElement): Promise<void> {
  container.innerHTML = `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Purchase Returns</h6>
        <button class="btn btn-sm btn-brand-green" id="newReturnBtn">
          <i class="bi bi-plus-lg me-2"></i>Process Return
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
                <th>Total</th>
                <th>Refund Method</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody id="returnsTableBody">
              <tr>
                <td colspan="8" class="text-center py-5">
                  <div class="text-muted">
                    <i class="bi bi-arrow-return-left fs-1 d-block mb-2"></i>
                    <h6>Loading returns...</h6>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('newReturnBtn')?.addEventListener('click', () => {
    openProcessReturnModal();
  });

  await loadPurchaseReturns();
}

async function loadPurchaseReturns(): Promise<void> {
  const tbody = document.getElementById('returnsTableBody');
  if (!tbody) return;

  try {
    const { data: returns } = await purchaseService.getReturns(200);

    if (returns.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5">
            <div class="text-muted">
              <i class="bi bi-arrow-return-left fs-1 d-block mb-2"></i>
              <h6>No purchase returns</h6>
              <p class="mb-0">Process a return to get started</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const statusColors: Record<string, string> = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      completed: 'badge-success',
    };

    tbody.innerHTML = returns.map((r) => `
      <tr>
        <td><code>${r.return_number}</code></td>
        <td>${new Date(r.created_at).toLocaleDateString()}</td>
        <td><code>${r.purchase_number || `PUR-${r.purchase_id}`}</code></td>
        <td>${r.supplier_name || 'N/A'}</td>
        <td class="fw-semibold text-danger">₨ ${r.total_amount.toLocaleString()}</td>
        <td class="text-capitalize">${r.refund_method}</td>
        <td><span class="badge-status ${statusColors[r.status] || 'badge-secondary'} text-capitalize">${r.status}</span></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary view-return-btn" data-id="${r.id}" title="View Details">
            <i class="bi bi-eye"></i>
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.view-return-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-id') || '0');
        await viewPurchaseReturn(id);
      });
    });
  } catch (error) {
    console.error('Failed to load purchase returns:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5">
          <div class="text-muted">
            <i class="bi bi-exclamation-triangle fs-1 d-block mb-2"></i>
            <h6>Failed to load returns</h6>
            <p class="mb-0">Please try again later</p>
          </div>
        </td>
      </tr>
    `;
  }
}

async function viewPurchaseReturn(id: number): Promise<void> {
  try {
    const ret = await purchaseService.getReturnById(id);

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Purchase Return ${ret.return_number}</h5>
            <button type="button" class="btn-close modal-close-btn"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-4">
              <div class="col-md-4">
                <h6 class="text-muted mb-2">Return Details</h6>
                <p class="mb-1">Date: <strong>${new Date(ret.created_at).toLocaleDateString()}</strong></p>
                <p class="mb-1">Status: <span class="badge-status ${ret.status === 'approved' ? 'badge-success' : ret.status === 'rejected' ? 'badge-danger' : 'badge-warning'} text-capitalize">${ret.status}</span></p>
                <p class="mb-0">Refund: <strong class="text-capitalize">${ret.refund_method}</strong></p>
              </div>
              <div class="col-md-4">
                <h6 class="text-muted mb-2">Original Purchase</h6>
                <p class="mb-1"><code>${ret.purchase_number || `PUR-${ret.purchase_id}`}</code></p>
                <p class="mb-0"><small>${ret.supplier_name || 'N/A'}</small></p>
              </div>
              <div class="col-md-4">
                <h6 class="text-muted mb-2">Reason</h6>
                <p class="mb-0">${ret.reason || 'No reason provided'}</p>
              </div>
            </div>

            <h6 class="text-muted mb-2">Returned Items</h6>
            <div class="table-responsive">
              <table class="table table-bordered">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th class="text-end">Qty</th>
                    <th class="text-end">Unit Price</th>
                    <th class="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${(ret.items || []).map((item) => `
                    <tr>
                      <td>${item.medicine_name || `Medicine #${item.medicine_id}`}</td>
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
                    <tr class="table-light"><td><strong>Total Refund</strong></td><td class="text-end"><strong class="text-danger">₨ ${ret.total_amount.toLocaleString()}</strong></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary modal-close-btn">Close</button>
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
  } catch (error) {
    console.error('Failed to load return details:', error);
      errorToast('Failed to load return details.');
  }
}

async function openProcessReturnModal(): Promise<void> {
  let selectedPurchaseId = 0;
  let selectedPurchase: PurchaseWithItems | null = null;

  const modal = document.createElement('div');
  modal.className = 'modal show';

  async function refreshPurchaseList() {
    const purchaseSelect = modal.querySelector('#returnPurchaseSelect') as HTMLSelectElement;
    if (!purchaseSelect) return;

    try {
      const { data } = await purchaseService.getAll(200);
      const receivedPurchases = data.filter((p) => p.status === 'received');
      purchaseSelect.innerHTML = `
        <option value="">Choose Purchase Order</option>
        ${receivedPurchases.map((p) => `<option value="${p.id}">${p.purchase_number} - ₨ ${p.total_amount.toLocaleString()}</option>`).join('')}
      `;
    } catch {
      purchaseSelect.innerHTML = `<option value="">Failed to load purchases</option>`;
    }
  }

  function renderItemSelection() {
    const itemsContainer = modal.querySelector('#returnItemsContainer');
    if (!itemsContainer || !selectedPurchase) return;

    itemsContainer.innerHTML = `
      <div class="table-responsive">
        <table class="table table-bordered">
          <thead>
            <tr>
              <th style="width:40px"><input type="checkbox" id="selectAllItems" checked></th>
              <th>Medicine</th>
              <th class="text-end">Purchased Qty</th>
              <th class="text-end">Unit Price</th>
              <th class="text-end">Return Qty</th>
              <th class="text-end">Total</th>
            </tr>
          </thead>
          <tbody>
            ${selectedPurchase.items.map((item) => `
              <tr data-purchase-item-id="${item.id}" data-medicine-id="${item.medicine_id}" data-price="${item.purchase_price}">
                <td><input type="checkbox" class="return-item-check" data-index="${item.id}" checked></td>
                <td>${item.batch_number || `Medicine #${item.medicine_id}`}</td>
                <td class="text-end">${item.quantity}</td>
                <td class="text-end">₨ ${item.purchase_price}</td>
                <td class="text-end">
                  <input type="number" class="form-control form-control-sm return-qty" 
                    data-index="${item.id}" min="1" max="${item.quantity}" value="${item.quantity}" 
                    style="width:70px; display:inline-block;">
                </td>
                <td class="text-end return-line-total" data-index="${item.id}">₨ ${(item.quantity * item.purchase_price).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    itemsContainer.querySelectorAll('.return-qty').forEach((input) => {
      input.addEventListener('change', () => {
        const idx = (input as HTMLInputElement).getAttribute('data-index');
        const maxQty = selectedPurchase!.items.find((i) => i.id === parseInt(idx!))?.quantity || 0;
        let val = parseInt((input as HTMLInputElement).value) || 0;
        if (val > maxQty) val = maxQty;
        if (val < 0) val = 0;
        (input as HTMLInputElement).value = String(val);

        const price = parseFloat(input.closest('tr')?.getAttribute('data-price') || '0');
        const totalEl = itemsContainer.querySelector(`.return-line-total[data-index="${idx}"]`);
        if (totalEl) totalEl.textContent = `₨ ${(val * price).toLocaleString()}`;
      });
    });

    const selectAll = modal.querySelector('#selectAllItems') as HTMLInputElement;
    selectAll?.addEventListener('change', () => {
      itemsContainer.querySelectorAll('.return-item-check').forEach((cb) => {
        (cb as HTMLInputElement).checked = selectAll.checked;
      });
    });
  }

  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Process Purchase Return</h5>
          <button type="button" class="btn-close modal-close-btn"></button>
        </div>
        <div class="modal-body">
          <div class="row g-3 mb-4">
            <div class="col-md-6">
              <label class="form-label">Select Purchase <span class="text-danger">*</span></label>
              <select class="form-select" id="returnPurchaseSelect">
                <option value="">Loading purchases...</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Refund Method <span class="text-danger">*</span></label>
              <select class="form-select" id="returnRefundMethod">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="credit">Credit</option>
              </select>
            </div>
          </div>
          <div class="row g-3 mb-4">
            <div class="col-md-12">
              <label class="form-label">Reason</label>
              <textarea class="form-control" id="returnReason" rows="2" placeholder="Reason for return (optional)"></textarea>
            </div>
          </div>
          <div id="returnItemsContainer"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
          <button type="button" class="btn btn-danger" id="submitReturnBtn">
            <i class="bi bi-arrow-return-left me-2"></i>Submit Return
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

  const purchaseSelect = modal.querySelector('#returnPurchaseSelect') as HTMLSelectElement;
  purchaseSelect.addEventListener('change', async () => {
    selectedPurchaseId = parseInt(purchaseSelect.value);
    if (!selectedPurchaseId) {
      selectedPurchase = null;
      (modal.querySelector('#returnItemsContainer') as HTMLElement).innerHTML = '';
      return;
    }
    try {
      selectedPurchase = await purchaseService.getById(selectedPurchaseId);
      renderItemSelection();
    } catch (error) {
      console.error('Failed to load purchase details:', error);
      errorToast('Failed to load purchase details.');
    }
  });

  modal.querySelector('#submitReturnBtn')?.addEventListener('click', async () => {
    if (!selectedPurchaseId || !selectedPurchase) {
      errorToast('Please select a purchase order');
      return;
    }

    const refundMethod = (modal.querySelector('#returnRefundMethod') as HTMLSelectElement).value as 'cash' | 'card' | 'credit';
    const reason = (modal.querySelector('#returnReason') as HTMLTextAreaElement).value;

    const returnItems: { purchase_item_id: number; medicine_id: number; batch_id?: number | null; quantity: number; purchase_price: number }[] = [];

    modal.querySelectorAll('.return-item-check').forEach((cb) => {
      if (!(cb as HTMLInputElement).checked) return;
      const row = cb.closest('tr');
      if (!row) return;
      const purchaseItemId = parseInt(row.getAttribute('data-purchase-item-id') || '0');
      const medicineId = parseInt(row.getAttribute('data-medicine-id') || '0');
      const price = parseFloat(row.getAttribute('data-price') || '0');
      const qtyInput = row.querySelector('.return-qty') as HTMLInputElement;
      const qty = parseInt(qtyInput?.value || '0');
      if (qty > 0) {
        returnItems.push({
          purchase_item_id: purchaseItemId,
          medicine_id: medicineId,
          quantity: qty,
          purchase_price: price,
        });
      }
    });

    if (returnItems.length === 0) {
      errorToast('Please select at least one item to return');
      return;
    }

    const total = returnItems.reduce((s, i) => s + i.quantity * i.purchase_price, 0);
    if (!(await confirmAction('Process Return?', `Refund of ₨ ${total.toLocaleString()} will be issued.`))) return;

    try {
      await purchaseService.createReturn({
        purchase_id: selectedPurchaseId,
        supplier_id: selectedPurchase.supplier_id,
        items: returnItems,
        refund_method: refundMethod,
        reason: reason || undefined,
      });
      successToast('Purchase return processed successfully!');
      modal.remove();
      await loadPurchaseReturns();
    } catch (error: any) {
      console.error('Failed to create return:', error);
      const msg = error?.response?.data?.message || 'Failed to process return. Please try again.';
      errorToast(msg);
    }
  });

  await refreshPurchaseList();
}
