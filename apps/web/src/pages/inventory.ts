import { medicineStore, Medicine } from '../stores/medicine.store';
import { inventoryService } from '../services/inventory.service';

type InventoryTab = 'overview' | 'batches' | 'low-stock' | 'expiring' | 'expired' | 'movements' | 'adjustments';

let currentTab: InventoryTab = 'overview';

export function renderInventory(): string {
  return `
    <div class="page-header">
      <h4>Inventory Management</h4>
      <p>Monitor stock levels, batches, and expiry dates</p>
    </div>

    <div class="inventory-tabs">
      <button class="inventory-tab active" data-tab="overview">
        <i class="bi bi-grid"></i> Overview
      </button>
      <button class="inventory-tab" data-tab="batches">
        <i class="bi bi-layer-group"></i> Batches
      </button>
      <button class="inventory-tab" data-tab="low-stock">
        <i class="bi bi-exclamation-triangle"></i> Low Stock
      </button>
      <button class="inventory-tab" data-tab="expiring">
        <i class="bi bi-clock-history"></i> Expiring Soon
      </button>
      <button class="inventory-tab" data-tab="expired">
        <i class="bi bi-x-circle"></i> Expired
      </button>
      <button class="inventory-tab" data-tab="movements">
        <i class="bi bi-arrow-left-right"></i> Movements
      </button>
      <button class="inventory-tab" data-tab="adjustments">
        <i class="bi bi-sliders"></i> Adjustments
      </button>
    </div>

    <div class="tab-content" id="inventoryContent">
    </div>
  `;
}

export function initInventory(): void {
  medicineStore.loadMedicines().catch(() => {});
  loadTab('overview');
  initTabs();
}

function initTabs(): void {
  document.querySelectorAll('.inventory-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab') as InventoryTab;
      if (tabName) {
        document.querySelectorAll('.inventory-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        loadTab(tabName);
      }
    });
  });
}

function loadTab(tab: InventoryTab): void {
  currentTab = tab;
  const content = document.getElementById('inventoryContent');
  if (!content) return;

  switch (tab) {
    case 'overview':
      renderOverview(content);
      break;
    case 'batches':
      renderBatches(content);
      break;
    case 'low-stock':
      renderLowStock(content);
      break;
    case 'expiring':
      renderExpiring(content);
      break;
    case 'expired':
      renderExpired(content);
      break;
    case 'movements':
      renderMovements(content);
      break;
    case 'adjustments':
      renderAdjustments(content);
      break;
  }
}

function renderOverview(container: HTMLElement): void {
  const medicines = medicineStore.getAll();
  
  const totalMedicines = medicines.length;
  const totalStockValue = medicines.reduce((sum, m) => sum + (m.purchasePrice * m.stock), 0);
  const totalSaleValue = medicines.reduce((sum, m) => sum + (m.salePrice * m.stock), 0);
  const lowStockCount = medicines.filter((m) => m.stock <= m.reorderLevel && m.stock > 0).length;
  const outOfStockCount = medicines.filter((m) => m.stock === 0).length;
  const expiringCount = medicines.filter((m) => {
    const days = Math.ceil((new Date(m.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 90;
  }).length;
  const expiredCount = medicines.filter((m) => new Date(m.expiry) < new Date()).length;

  container.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${totalMedicines}</div>
              <div class="stat-label">Total Medicines</div>
            </div>
            <div class="stat-icon blue">
              <i class="bi bi-capsule"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${totalStockValue.toLocaleString()}</div>
              <div class="stat-label">Stock Value (Cost)</div>
            </div>
            <div class="stat-icon green">
              <i class="bi bi-currency-dollar"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${totalSaleValue.toLocaleString()}</div>
              <div class="stat-label">Stock Value (Sale)</div>
            </div>
            <div class="stat-icon green">
              <i class="bi bi-graph-up"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${totalSaleValue - totalStockValue}</div>
              <div class="stat-label">Potential Profit</div>
            </div>
            <div class="stat-icon orange">
              <i class="bi bi-cash-stack"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="inventory-alert-card warning">
          <div class="alert-icon">
            <i class="bi bi-exclamation-triangle"></i>
          </div>
          <div class="alert-info">
            <div class="alert-count">${lowStockCount}</div>
            <div class="alert-label">Low Stock Items</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="inventory-alert-card danger">
          <div class="alert-icon">
            <i class="bi bi-x-circle"></i>
          </div>
          <div class="alert-info">
            <div class="alert-count">${outOfStockCount}</div>
            <div class="alert-label">Out of Stock</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="inventory-alert-card warning">
          <div class="alert-icon">
            <i class="bi bi-clock-history"></i>
          </div>
          <div class="alert-info">
            <div class="alert-count">${expiringCount}</div>
            <div class="alert-label">Expiring Soon</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="inventory-alert-card danger">
          <div class="alert-icon">
            <i class="bi bi-calendar-x"></i>
          </div>
          <div class="alert-info">
            <div class="alert-count">${expiredCount}</div>
            <div class="alert-label">Expired</div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-lg-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Stock by Category</h6>
          </div>
          <div class="card-body">
            ${renderCategoryChart(medicines)}
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">Top 5 Low Stock Items</h6>
          </div>
          <div class="card-body p-0">
            ${renderLowStockList(medicines.slice().sort((a, b) => a.stock - b.stock).slice(0, 5))}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCategoryChart(medicines: Medicine[]): string {
  const categories: Record<string, { count: number; stock: number; value: number }> = {};
  
  medicines.forEach((m) => {
    if (!categories[m.category]) {
      categories[m.category] = { count: 0, stock: 0, value: 0 };
    }
    categories[m.category].count++;
    categories[m.category].stock += m.stock;
    categories[m.category].value += m.stock * m.salePrice;
  });

  const totalStock = medicines.reduce((sum, m) => sum + m.stock, 0);
  
  const colors: Record<string, string> = {
    tablets: '#159447',
    capsules: '#1976d2',
    syrups: '#f59e0b',
    injections: '#dc3545',
    ointments: '#9c27b0',
    drops: '#00bcd4',
    powder: '#795548',
  };

  return Object.entries(categories).map(([cat, data]) => {
    const percentage = totalStock > 0 ? (data.stock / totalStock) * 100 : 0;
    return `
      <div class="category-bar mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span class="text-capitalize fw-semibold">${cat}</span>
          <span class="text-muted">${data.count} medicines | ₨ ${data.value.toLocaleString()}</span>
        </div>
        <div class="progress" style="height: 8px;">
          <div class="progress-bar" style="width: ${percentage}%; background: ${colors[cat] || '#6c757d'}"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderLowStockList(medicines: Medicine[]): string {
  if (medicines.length === 0) {
    return `<div class="text-center py-4 text-muted"><i class="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>All items are well stocked</div>`;
  }

  return medicines.map((m) => `
    <div class="d-flex align-items-center justify-content-between p-3 border-bottom">
      <div>
        <div class="fw-semibold">${m.name}</div>
        <small class="text-muted">${m.batch}</small>
      </div>
      <div class="text-end">
        <span class="badge-status ${m.stock === 0 ? 'badge-danger' : 'badge-warning'}">${m.stock} ${m.unit}</span>
      </div>
    </div>
  `).join('');
}

function renderBatches(container: HTMLElement): void {
  const medicines = medicineStore.getAll();

  container.innerHTML = `
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="searchBatch" placeholder="Search by name or batch...">
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" id="filterCategory">
              <option value="">All Categories</option>
              <option value="tablets">Tablets</option>
              <option value="capsules">Capsules</option>
              <option value="syrups">Syrups</option>
              <option value="injections">Injections</option>
              <option value="ointments">Ointments</option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select" id="sortBy">
              <option value="name">Sort by Name</option>
              <option value="stock-asc">Stock (Low to High)</option>
              <option value="stock-desc">Stock (High to Low)</option>
              <option value="expiry">Expiry (Nearest)</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Medicine Batches</h6>
        <span class="text-muted" id="batchCount">${medicines.length} batches</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Batch #</th>
                <th>Category</th>
                <th>Expiry</th>
                <th>Stock</th>
                <th>Purchase Price</th>
                <th>Sale Price</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="batchTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  function renderBatchTable(): void {
    const search = (document.getElementById('searchBatch') as HTMLInputElement)?.value.toLowerCase() || '';
    const category = (document.getElementById('filterCategory') as HTMLSelectElement)?.value || '';
    const sortBy = (document.getElementById('sortBy') as HTMLSelectElement)?.value || 'name';

    const filtered = medicines.filter((m) => {
      const matchSearch = !search || m.name.toLowerCase().includes(search) || m.batch.toLowerCase().includes(search);
      const matchCategory = !category || m.category === category;
      return matchSearch && matchCategory;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'stock-asc': return a.stock - b.stock;
        case 'stock-desc': return b.stock - a.stock;
        case 'expiry': return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
        default: return a.name.localeCompare(b.name);
      }
    });

    const tbody = document.getElementById('batchTableBody');
    const countEl = document.getElementById('batchCount');
    if (countEl) countEl.textContent = `${filtered.length} batches`;
    if (!tbody) return;

    tbody.innerHTML = filtered.map((m) => {
      const expiryDate = new Date(m.expiry);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      let expiryStatus = '';
      if (daysUntilExpiry < 0) expiryStatus = 'badge-danger';
      else if (daysUntilExpiry <= 30) expiryStatus = 'badge-danger';
      else if (daysUntilExpiry <= 90) expiryStatus = 'badge-warning';
      else expiryStatus = 'badge-success';

      let stockStatus = '';
      if (m.stock === 0) stockStatus = 'badge-danger';
      else if (m.stock <= m.reorderLevel) stockStatus = 'badge-warning';
      else stockStatus = 'badge-success';

      return `
        <tr>
          <td>
            <div class="fw-semibold">${m.name}</div>
            <small class="text-muted">${m.generic}</small>
          </td>
          <td><code>${m.batch}</code></td>
          <td class="text-capitalize">${m.category}</td>
          <td>
            <span class="badge-status ${expiryStatus}">${m.expiry}</span>
          </td>
          <td>
            <span class="badge-status ${stockStatus}">${m.stock} ${m.unit}</span>
          </td>
          <td>₨ ${m.purchasePrice.toFixed(2)}</td>
          <td>₨ ${m.salePrice.toFixed(2)}</td>
          <td>₨ ${(m.stock * m.salePrice).toLocaleString()}</td>
          <td>
            ${daysUntilExpiry < 0 ? '<span class="badge-status badge-danger">Expired</span>' : 
              m.stock === 0 ? '<span class="badge-status badge-danger">Out of Stock</span>' :
              m.stock <= m.reorderLevel ? '<span class="badge-status badge-warning">Low Stock</span>' :
              '<span class="badge-status badge-success">OK</span>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  document.getElementById('searchBatch')?.addEventListener('input', renderBatchTable);
  document.getElementById('filterCategory')?.addEventListener('change', renderBatchTable);
  document.getElementById('sortBy')?.addEventListener('change', renderBatchTable);
  renderBatchTable();
}

function renderLowStock(container: HTMLElement): void {
  const medicines = medicineStore.getAll();
  const lowStock = medicines.filter((m) => m.stock <= m.reorderLevel).sort((a, b) => a.stock - b.stock);

  container.innerHTML = `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Low Stock Items</h6>
        <span class="badge-status badge-warning">${lowStock.length} items</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Batch</th>
                <th>Current Stock</th>
                <th>Reorder Level</th>
                <th>Status</th>
                <th>Deficit</th>
              </tr>
            </thead>
            <tbody>
              ${lowStock.length === 0 ? `
                <tr>
                  <td colspan="6" class="text-center py-5">
                    <div class="text-muted">
                      <i class="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
                      <h6>All items are well stocked</h6>
                    </div>
                  </td>
                </tr>
              ` : lowStock.map((m) => `
                <tr>
                  <td>
                    <div class="fw-semibold">${m.name}</div>
                    <small class="text-muted">${m.generic}</small>
                  </td>
                  <td><code>${m.batch}</code></td>
                  <td><span class="badge-status ${m.stock === 0 ? 'badge-danger' : 'badge-warning'}">${m.stock} ${m.unit}</span></td>
                  <td>${m.reorderLevel} ${m.unit}</td>
                  <td>
                    ${m.stock === 0 ? 
                      '<span class="badge-status badge-danger">Out of Stock</span>' : 
                      '<span class="badge-status badge-warning">Low Stock</span>'}
                  </td>
                  <td class="text-danger fw-semibold">${Math.max(0, m.reorderLevel - m.stock)} ${m.unit}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderExpiring(container: HTMLElement): void {
  const medicines = medicineStore.getAll();
  const today = new Date();
  
  const expiring = medicines.filter((m) => {
    const days = Math.ceil((new Date(m.expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 90;
  }).sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());

  container.innerHTML = `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Expiring Within 90 Days</h6>
        <span class="badge-status badge-warning">${expiring.length} items</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Batch</th>
                <th>Expiry Date</th>
                <th>Days Left</th>
                <th>Stock</th>
                <th>Value at Risk</th>
              </tr>
            </thead>
            <tbody>
              ${expiring.length === 0 ? `
                <tr>
                  <td colspan="6" class="text-center py-5">
                    <div class="text-muted">
                      <i class="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
                      <h6>No medicines expiring soon</h6>
                    </div>
                  </td>
                </tr>
              ` : expiring.map((m) => {
                const days = Math.ceil((new Date(m.expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return `
                  <tr>
                    <td>
                      <div class="fw-semibold">${m.name}</div>
                      <small class="text-muted">${m.generic}</small>
                    </td>
                    <td><code>${m.batch}</code></td>
                    <td>${m.expiry}</td>
                    <td>
                      <span class="badge-status ${days <= 30 ? 'badge-danger' : 'badge-warning'}">${days} days</span>
                    </td>
                    <td>${m.stock} ${m.unit}</td>
                    <td class="text-danger fw-semibold">₨ ${(m.stock * m.purchasePrice).toLocaleString()}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderExpired(container: HTMLElement): void {
  const medicines = medicineStore.getAll();
  const expired = medicines.filter((m) => new Date(m.expiry) < new Date());

  container.innerHTML = `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Expired Medicines</h6>
        <span class="badge-status badge-danger">${expired.length} items</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Batch</th>
                <th>Expiry Date</th>
                <th>Days Expired</th>
                <th>Stock</th>
                <th>Loss Value</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${expired.length === 0 ? `
                <tr>
                  <td colspan="7" class="text-center py-5">
                    <div class="text-muted">
                      <i class="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
                      <h6>No expired medicines</h6>
                    </div>
                  </td>
                </tr>
              ` : expired.map((m) => {
                const days = Math.ceil((Date.now() - new Date(m.expiry).getTime()) / (1000 * 60 * 60 * 24));
                return `
                  <tr>
                    <td>
                      <div class="fw-semibold">${m.name}</div>
                      <small class="text-muted">${m.generic}</small>
                    </td>
                    <td><code>${m.batch}</code></td>
                    <td>${m.expiry}</td>
                    <td><span class="badge-status badge-danger">${days} days</span></td>
                    <td>${m.stock} ${m.unit}</td>
                    <td class="text-danger fw-semibold">₨ ${(m.stock * m.purchasePrice).toLocaleString()}</td>
                    <td>
                      <button class="btn btn-sm btn-outline-danger write-off-btn" data-id="${m.id}">
                        <i class="bi bi-trash"></i> Write Off
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('.write-off-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0');
      if (confirm('Are you sure you want to write off this expired medicine?')) {
        const med = medicineStore.getById(id);
        if (med) {
          medicineStore.updateStock(id, -med.stock);
          renderExpired(container);
        }
      }
    });
  });
}

async function renderMovements(container: HTMLElement): Promise<void> {
  let movements: any[] = [];
  try {
    const { data } = await inventoryService.getStockMovements(100);
    movements = data.map((m: any) => ({
      id: m.id,
      date: m.movement_date,
      medicine: m.medicine_name,
      batch: m.batch_number,
      type: m.movement_type,
      quantity: m.quantity,
      reference: m.reference_type ? `${m.reference_type}-${m.reference_id || ''}` : '-',
    }));
  } catch {
    movements = [
      { id: 1, date: '2026-09-13', medicine: 'Paracetamol 500mg', batch: 'P001', type: 'sale', quantity: -10, reference: 'INV-2026-000001' },
      { id: 2, date: '2026-09-13', medicine: 'Amoxicillin 500mg', batch: 'A001', type: 'purchase', quantity: 100, reference: 'PO-2026-000001' },
      { id: 3, date: '2026-09-12', medicine: 'Cetirizine 10mg', batch: 'C001', type: 'sale', quantity: -5, reference: 'INV-2026-000002' },
    ];
  }

  const typeColors: Record<string, string> = {
    sale: 'badge-danger',
    purchase: 'badge-success',
    adjustment: 'badge-warning',
    return: 'badge-info',
  };

  container.innerHTML = `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Stock Movements</h6>
        <span class="text-muted">Recent activity</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Date</th>
                <th>Medicine</th>
                <th>Batch</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              ${movements.map((m) => `
                <tr>
                  <td>${new Date(m.date).toLocaleDateString()}</td>
                  <td>${m.medicine}</td>
                  <td><code>${m.batch}</code></td>
                  <td><span class="badge-status ${typeColors[m.type] || ''} text-capitalize">${m.type}</span></td>
                  <td class="${m.quantity > 0 ? 'text-success' : 'text-danger'} fw-semibold">
                    ${m.quantity > 0 ? '+' : ''}${m.quantity}
                  </td>
                  <td><code>${m.reference}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderAdjustments(container: HTMLElement): void {
  container.innerHTML = `
    <div class="row g-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">New Stock Adjustment</h6>
          </div>
          <div class="card-body">
            <form id="adjustmentForm">
              <div class="mb-3">
                <label class="form-label">Select Medicine <span class="text-danger">*</span></label>
                <select class="form-select" id="adjMedicine" required>
                  <option value="">Select Medicine</option>
                  ${medicineStore.getAll().map((m) => `
                    <option value="${m.id}">${m.name} (${m.batch}) - Stock: ${m.stock}</option>
                  `).join('')}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Adjustment Type <span class="text-danger">*</span></label>
                <select class="form-select" id="adjType" required>
                  <option value="add">Add Stock (+)</option>
                  <option value="remove">Remove Stock (-)</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Quantity <span class="text-danger">*</span></label>
                <input type="number" class="form-control" id="adjQuantity" min="1" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Reason <span class="text-danger">*</span></label>
                <select class="form-select" id="adjReason" required>
                  <option value="">Select Reason</option>
                  <option value="damaged">Damaged</option>
                  <option value="expired">Expired</option>
                  <option value="lost">Lost/Stolen</option>
                  <option value="found">Found</option>
                  <option value="correction">Inventory Correction</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Notes</label>
                <textarea class="form-control" id="adjNotes" rows="2"></textarea>
              </div>
              <button type="submit" class="btn btn-brand-green w-100">
                <i class="bi bi-check-lg me-2"></i>Submit Adjustment
              </button>
            </form>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">Recent Adjustments</h6>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Medicine</th>
                    <th>Qty</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody id="adjustmentsList">
                  <tr>
                    <td colspan="4" class="text-center py-4 text-muted">
                      <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                      No adjustments yet
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('adjustmentForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const medicineId = parseInt((document.getElementById('adjMedicine') as HTMLSelectElement).value);
    const type = (document.getElementById('adjType') as HTMLSelectElement).value;
    const quantity = parseInt((document.getElementById('adjQuantity') as HTMLInputElement).value);
    const reason = (document.getElementById('adjReason') as HTMLSelectElement).value;

    const med = medicineStore.getById(medicineId);
    if (!med) {
      alert('Please select a medicine');
      return;
    }

    const adjustQuantity = type === 'add' ? quantity : -quantity;
    
    if (type === 'remove' && quantity > med.stock) {
      alert('Cannot remove more than available stock');
      return;
    }

    medicineStore.updateStock(medicineId, adjustQuantity);
    
    const tbody = document.getElementById('adjustmentsList');
    if (tbody) {
      const newRow = `
        <tr>
          <td>${new Date().toLocaleDateString()}</td>
          <td>${med.name}</td>
          <td class="${adjustQuantity > 0 ? 'text-success' : 'text-danger'} fw-semibold">
            ${adjustQuantity > 0 ? '+' : ''}${adjustQuantity}
          </td>
          <td class="text-capitalize">${reason}</td>
        </tr>
      `;
      if (tbody.querySelector('td[colspan]')) {
        tbody.innerHTML = newRow;
      } else {
        tbody.insertAdjacentHTML('afterbegin', newRow);
      }
    }

    (document.getElementById('adjustmentForm') as HTMLFormElement)?.reset();
    alert('Stock adjustment submitted successfully!');
  });
}
