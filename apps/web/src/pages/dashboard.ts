import { medicineStore } from '../stores/medicine.store';
import { medicineService } from '../services/medicine.service';
import { customerService } from '../services/customer.service';
import { supplierService } from '../services/supplier.service';

interface DashboardData {
  sales: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    todayCount: number;
    recent: { invoice: string; customer: string; amount: number; status: string; date: string }[];
  };
  purchases: {
    today: number;
    thisMonth: number;
    pendingPayments: number;
    recent: { po: string; supplier: string; amount: number; status: string; date: string }[];
  };
  inventory: {
    totalMedicines: number;
    totalStockValue: number;
    lowStock: number;
    expiringSoon: number;
    outOfStock: number;
    lowStockItems: { name: string; stock: number; minRequired: number }[];
    expiringItems: { name: string; batch: string; expiry: string; stock: number }[];
  };
  customers: {
    total: number;
    pendingReceivable: number;
    topCustomers: { name: string; type: string; balance: number }[];
  };
  suppliers: {
    total: number;
    pendingPayable: number;
  };
  expenses: {
    today: number;
    thisMonth: number;
  };
  accounting: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
  };
}

function getDashboardData(): DashboardData {
  const medicines = medicineStore.getAll();
  
  return {
    sales: {
      today: 1538,
      thisWeek: 45250,
      thisMonth: 185000,
      todayCount: 12,
      recent: [
        { invoice: 'INV-2026-000005', customer: 'Ali Hassan', amount: 168, status: 'completed', date: '2026-09-13T16:00:00' },
        { invoice: 'INV-2026-000004', customer: 'Walk-in Customer', amount: 173.25, status: 'completed', date: '2026-09-12T09:15:00' },
        { invoice: 'INV-2026-000003', customer: 'Fatima Shah', amount: 630, status: 'completed', date: '2026-09-12T14:20:00' },
        { invoice: 'INV-2026-000002', customer: 'Ahmed Khan', amount: 525, status: 'completed', date: '2026-09-13T11:45:00' },
        { invoice: 'INV-2026-000001', customer: 'Walk-in Customer', amount: 141.75, status: 'completed', date: '2026-09-13T10:30:00' },
      ],
    },
    purchases: {
      today: 40000,
      thisMonth: 285000,
      pendingPayments: 295000,
      recent: [
        { po: 'PO-2026-000005', supplier: 'Lahore Medical', amount: 65000, status: 'received', date: '2026-09-08' },
        { po: 'PO-2026-000004', supplier: 'Karachi Pharma', amount: 45000, status: 'received', date: '2026-09-05' },
        { po: 'PO-2026-000003', supplier: 'Global Pharma', amount: 85000, status: 'received', date: '2026-09-03' },
        { po: 'PO-2026-000002', supplier: 'Islamabad Drug', amount: 35000, status: 'pending', date: '2026-09-01' },
        { po: 'PO-2026-000001', supplier: 'Karachi Pharma', amount: 40000, status: 'received', date: '2026-09-13' },
      ],
    },
    inventory: {
      totalMedicines: medicines.length || 20,
      totalStockValue: medicines.reduce((sum, m) => sum + (m.stock * m.purchasePrice), 0) || 1105000,
      lowStock: medicines.filter((m) => m.stock < 50).length || 3,
      expiringSoon: 2,
      outOfStock: medicines.filter((m) => m.stock === 0).length || 0,
      lowStockItems: [
        { name: 'Cetirizine 10mg', stock: 15, minRequired: 50 },
        { name: 'Brufen 400mg', stock: 28, minRequired: 50 },
        { name: 'Dolo 650', stock: 20, minRequired: 40 },
      ],
      expiringItems: [
        { name: 'Amoxicillin 500mg', batch: 'A001', expiry: '2026-10-15', stock: 150 },
        { name: 'Cetirizine 10mg', batch: 'C001', expiry: '2026-10-20', stock: 15 },
      ],
    },
    customers: {
      total: 6,
      pendingReceivable: 177000,
      topCustomers: [
        { name: 'MedCity Hospital', type: 'wholesale', balance: 125000 },
        { name: 'Kamran Brothers', type: 'wholesale', balance: 45000 },
        { name: 'Ali Hassan', type: 'regular', balance: 4500 },
        { name: 'Ahmed Khan', type: 'regular', balance: 2500 },
      ],
    },
    suppliers: {
      total: 6,
      pendingPayable: 295000,
    },
    expenses: {
      today: 0,
      thisMonth: 254700,
    },
    accounting: {
      revenue: 2250000,
      cogs: 1525000,
      grossProfit: 725000,
      netProfit: 446800,
      profitMargin: 32.2,
    },
  };
}

function createMiniLineChart(values: number[], color: string, width: number = 100, height: number = 30): string {
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;
  
  const points = values.map((val, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((val - minVal) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return `
    <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="miniGrad${color.replace('#', '')}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:0.3"/>
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.05"/>
        </linearGradient>
      </defs>
      <polygon points="${areaPoints}" fill="url(#miniGrad${color.replace('#', '')})"/>
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

function createDonutChart(data: { value: number; color: string }[], size: number = 80): string {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -90;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 30;
  const innerRadius = 18;

  let arcs = '';
  data.forEach((d) => {
    const angle = (d.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const ix1 = centerX + innerRadius * Math.cos(startRad);
    const iy1 = centerY + innerRadius * Math.sin(startRad);
    const ix2 = centerX + innerRadius * Math.cos(endRad);
    const iy2 = centerY + innerRadius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    arcs += `<path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z" fill="${d.color}"/>`;
    currentAngle = endAngle;
  });

  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${arcs}</svg>`;
}

export function renderDashboard(): string {
  const data = getDashboardData();

  return `
    <div class="page-header">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h4>Dashboard</h4>
          <p>Welcome back, Super Admin. Here's your pharmacy overview.</p>
        </div>
        <div class="d-flex gap-2">
          <span class="badge bg-success"><i class="bi bi-circle-fill me-1" style="font-size: 6px;"></i>Live</span>
          <button class="btn btn-outline-secondary btn-sm" id="refreshDashboard">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Stats -->
    <div class="row g-3 mb-4">
      <div class="col-md-6 col-xl-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${data.sales.today.toLocaleString()}</div>
              <div class="stat-label">Today's Sales</div>
              <small class="text-success"><i class="bi bi-arrow-up"></i> ${data.sales.todayCount} transactions</small>
            </div>
            <div class="stat-icon green">
              <i class="bi bi-currency-dollar"></i>
            </div>
          </div>
          <div class="mt-2">
            ${createMiniLineChart([12500, 8200, 15800, 10200, 18500, 14200, data.sales.today], '#198754')}
          </div>
        </div>
      </div>
      <div class="col-md-6 col-xl-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${data.inventory.totalMedicines}</div>
              <div class="stat-label">Total Medicines</div>
              <small class="text-primary"><i class="bi bi-box-seam"></i> ₨ ${(data.inventory.totalStockValue / 100000).toFixed(1)}L stock</small>
            </div>
            <div class="stat-icon blue">
              <i class="bi bi-capsule"></i>
            </div>
          </div>
          <div class="mt-2">
            ${createMiniLineChart([15, 16, 17, 18, 19, 20, data.inventory.totalMedicines], '#0d6efd')}
          </div>
        </div>
      </div>
      <div class="col-md-6 col-xl-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value text-warning">${data.inventory.lowStock}</div>
              <div class="stat-label">Low Stock Items</div>
              <small class="text-danger"><i class="bi bi-exclamation-triangle"></i> Needs attention</small>
            </div>
            <div class="stat-icon orange">
              <i class="bi bi-exclamation-triangle"></i>
            </div>
          </div>
          <div class="mt-2">
            ${createMiniLineChart([2, 1, 3, 2, 4, 3, data.inventory.lowStock], '#ffc107')}
          </div>
        </div>
      </div>
      <div class="col-md-6 col-xl-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value text-danger">${data.inventory.expiringSoon}</div>
              <div class="stat-label">Expiring Soon</div>
              <small class="text-danger"><i class="bi bi-clock-history"></i> Within 30 days</small>
            </div>
            <div class="stat-icon red">
              <i class="bi bi-clock-history"></i>
            </div>
          </div>
          <div class="mt-2">
            ${createMiniLineChart([1, 0, 1, 2, 1, 2, data.inventory.expiringSoon], '#dc3545')}
          </div>
        </div>
      </div>
    </div>

    <!-- Financial Stats -->
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card bg-gradient-success text-white">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${(data.sales.thisMonth / 1000).toFixed(0)}K</div>
              <div class="stat-label opacity-75">Monthly Sales</div>
            </div>
            <i class="bi bi-graph-up-arrow fs-1 opacity-50"></i>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card bg-gradient-primary text-white">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${(data.purchases.thisMonth / 1000).toFixed(0)}K</div>
              <div class="stat-label opacity-75">Monthly Purchases</div>
            </div>
            <i class="bi bi-cart-plus fs-1 opacity-50"></i>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card bg-gradient-danger text-white">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${(data.expenses.thisMonth / 1000).toFixed(0)}K</div>
              <div class="stat-label opacity-75">Monthly Expenses</div>
            </div>
            <i class="bi bi-wallet2 fs-1 opacity-50"></i>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card bg-gradient-warning text-white">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${(data.accounting.netProfit / 1000).toFixed(0)}K</div>
              <div class="stat-label opacity-75">Net Profit</div>
            </div>
            <i class="bi bi-cash-coin fs-1 opacity-50"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <!-- Sales Trend Chart -->
      <div class="col-lg-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Sales Trend (Last 7 Days)</h6>
            <div class="d-flex gap-3">
              <span class="badge bg-success"><i class="bi bi-circle-fill me-1" style="font-size: 6px;"></i>This Week</span>
              <span class="badge bg-secondary"><i class="bi bi-circle-fill me-1" style="font-size: 6px;"></i>Last Week</span>
            </div>
          </div>
          <div class="card-body">
            ${createLineChart({
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [
                { name: 'This Week', values: [12500, 8200, 15800, 10200, 18500, 14200, 7800], color: '#198754' },
                { name: 'Last Week', values: [10000, 12000, 9500, 14000, 11000, 16000, 8500], color: '#6c757d' },
              ]
            }, 200)}
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="col-lg-4">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Quick Overview</h6>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span><i class="bi bi-people text-primary me-2"></i>Customers</span>
                <span class="fw-semibold">${data.customers.total}</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-primary" style="width: ${data.customers.total * 15}%"></div>
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span><i class="bi bi-truck text-success me-2"></i>Suppliers</span>
                <span class="fw-semibold">${data.suppliers.total}</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-success" style="width: ${data.suppliers.total * 15}%"></div>
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span><i class="bi bi-wallet2 text-danger me-2"></i>Receivable</span>
                <span class="fw-semibold">₨ ${(data.customers.pendingReceivable / 1000).toFixed(0)}K</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-danger" style="width: ${(data.customers.pendingReceivable / 200000) * 100}%"></div>
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span><i class="bi bi-wallet text-warning me-2"></i>Payable</span>
                <span class="fw-semibold">₨ ${(data.suppliers.pendingPayable / 1000).toFixed(0)}K</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-warning" style="width: ${(data.suppliers.pendingPayable / 400000) * 100}%"></div>
              </div>
            </div>
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span><i class="bi bi-percent text-info me-2"></i>Profit Margin</span>
                <span class="fw-semibold">${data.accounting.profitMargin}%</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-info" style="width: ${data.accounting.profitMargin}%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <!-- Recent Sales -->
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Recent Sales</h6>
            <button class="btn btn-sm btn-outline-secondary view-all-btn" data-page="sales">View All</button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th class="text-end">Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.sales.recent.map((s) => `
                    <tr>
                      <td><code>${s.invoice}</code></td>
                      <td>${s.customer}</td>
                      <td class="text-end fw-semibold">₨ ${s.amount.toLocaleString()}</td>
                      <td><small>${new Date(s.date).toLocaleDateString()}</small></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Purchases -->
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Recent Purchases</h6>
            <button class="btn btn-sm btn-outline-secondary view-all-btn" data-page="purchases">View All</button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>PO #</th>
                    <th>Supplier</th>
                    <th class="text-end">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.purchases.recent.map((p) => `
                    <tr>
                      <td><code>${p.po}</code></td>
                      <td>${p.supplier}</td>
                      <td class="text-end fw-semibold">₨ ${p.amount.toLocaleString()}</td>
                      <td><span class="badge ${p.status === 'received' ? 'bg-success' : 'bg-warning'} text-capitalize">${p.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <!-- Low Stock Alert -->
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0"><i class="bi bi-exclamation-triangle text-warning me-2"></i>Low Stock Alert</h6>
            <button class="btn btn-sm btn-outline-warning view-all-btn" data-page="inventory">View All</button>
          </div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th class="text-end">Stock</th>
                  <th class="text-end">Min Required</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${data.inventory.lowStockItems.map((item) => {
                  const percent = (item.stock / item.minRequired) * 100;
                  const status = percent < 30 ? 'Critical' : 'Low';
                  const badge = percent < 30 ? 'bg-danger' : 'bg-warning';
                  return `
                    <tr>
                      <td>${item.name}</td>
                      <td class="text-end">${item.stock}</td>
                      <td class="text-end">${item.minRequired}</td>
                      <td><span class="badge ${badge}">${status}</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Expiring Soon -->
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0"><i class="bi bi-clock-history text-danger me-2"></i>Expiring Soon</h6>
            <button class="btn btn-sm btn-outline-danger view-all-btn" data-page="inventory">View All</button>
          </div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Expiry</th>
                  <th class="text-end">Stock</th>
                </tr>
              </thead>
              <tbody>
                ${data.inventory.expiringItems.map((item) => {
                  const daysLeft = Math.ceil((new Date(item.expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return `
                    <tr>
                      <td>${item.name}</td>
                      <td><code>${item.batch}</code></td>
                      <td>${item.expiry} <small class="text-danger">(${daysLeft}d)</small></td>
                      <td class="text-end">${item.stock}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <!-- Top Customers -->
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Top Customers</h6>
            <button class="btn btn-sm btn-outline-secondary view-all-btn" data-page="customers">View All</button>
          </div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Type</th>
                  <th class="text-end">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${data.customers.topCustomers.map((c) => {
                  const typeColors: Record<string, string> = { wholesale: 'bg-success', premium: 'bg-warning', regular: 'bg-info' };
                  return `
                    <tr>
                      <td>${c.name}</td>
                      <td><span class="badge ${typeColors[c.type] || 'bg-secondary'} text-capitalize">${c.type}</span></td>
                      <td class="text-end ${c.balance > 0 ? 'text-danger fw-semibold' : 'text-success'}">
                        ${c.balance > 0 ? `₨ ${c.balance.toLocaleString()}` : 'Clear'}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Financial Summary -->
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Financial Summary</h6>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
              <span class="text-muted">Revenue (YTD)</span>
              <span class="fw-bold text-success">₨ ${(data.accounting.revenue / 100000).toFixed(1)}L</span>
            </div>
            <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
              <span class="text-muted">Cost of Goods</span>
              <span class="fw-bold text-danger">₨ ${(data.accounting.cogs / 100000).toFixed(1)}L</span>
            </div>
            <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
              <span class="text-muted">Gross Profit</span>
              <span class="fw-bold text-success">₨ ${(data.accounting.grossProfit / 100000).toFixed(1)}L</span>
            </div>
            <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
              <span class="text-muted">Expenses</span>
              <span class="fw-bold text-danger">₨ ${(data.expenses.thisMonth / 1000).toFixed(0)}K/month</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-muted">Net Profit</span>
              <span class="fw-bold text-success fs-5">₨ ${(data.accounting.netProfit / 100000).toFixed(1)}L</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Accounts Receivable & Payable -->
    <div class="row g-3">
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Accounts Receivable</h6>
            <span class="badge bg-danger">₨ ${(data.customers.pendingReceivable / 1000).toFixed(0)}K pending</span>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span>MedCity Hospital</span>
                <span class="text-danger">₨ 1,25,000</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-danger" style="width: 70%"></div>
              </div>
              <small class="text-muted">60+ days overdue</small>
            </div>
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span>Kamran Brothers</span>
                <span class="text-danger">₨ 45,000</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-warning" style="width: 25%"></div>
              </div>
              <small class="text-muted">45 days overdue</small>
            </div>
            <div>
              <div class="d-flex justify-content-between mb-1">
                <span>Others</span>
                <span class="text-danger">₨ 7,000</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-info" style="width: 4%"></div>
              </div>
              <small class="text-muted">15-30 days</small>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Accounts Payable</h6>
            <span class="badge bg-warning">₨ ${(data.suppliers.pendingPayable / 1000).toFixed(0)}K pending</span>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span>Global Pharma Imports</span>
                <span class="text-danger">₨ 1,25,000</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-danger" style="width: 42%"></div>
              </div>
              <small class="text-muted">60+ days overdue</small>
            </div>
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span>Karachi Pharma</span>
                <span class="text-danger">₨ 85,000</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-warning" style="width: 29%"></div>
              </div>
              <small class="text-muted">30 days overdue</small>
            </div>
            <div>
              <div class="d-flex justify-content-between mb-1">
                <span>Others</span>
                <span class="text-danger">₨ 85,000</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-info" style="width: 29%"></div>
              </div>
              <small class="text-muted">15-30 days</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initDashboard(): void {
  // Try loading stats from API
  Promise.all([
    customerService.getStats().catch(() => null),
    supplierService.getStats().catch(() => null),
    medicineService.getLowStock().catch(() => null),
  ]).then(([customerStats, supplierStats, lowStock]) => {
    if (customerStats) {
      const totalCustomers = document.getElementById('totalCustomers');
      if (totalCustomers) totalCustomers.textContent = String(customerStats.total);
    }
    if (supplierStats) {
      const totalSuppliers = document.getElementById('totalSuppliers');
      if (totalSuppliers) totalSuppliers.textContent = String(supplierStats.total);
    }
    if (lowStock) {
      const lowStockCount = document.getElementById('lowStockCount');
      if (lowStockCount) lowStockCount.textContent = String(lowStock.length);
    }
  });

  document.querySelectorAll('.view-all-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page');
      if (page) {
        // Navigate to the page using sidebar navigation
        const navItem = document.querySelector(`.sidebar-nav .nav-item[data-page="${page}"]`);
        if (navItem) {
          navItem.dispatchEvent(new Event('click'));
        }
      }
    });
  });

  document.getElementById('refreshDashboard')?.addEventListener('click', () => {
    const content = document.getElementById('pageContent');
    if (content) {
      content.innerHTML = renderDashboard();
      initDashboard();
    }
  });
}

function createLineChart(data: { labels: string[]; datasets: { name: string; values: number[]; color: string }[] }, height: number = 200): string {
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = 600;
  const chartHeight = height;
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  let allValues: number[] = [];
  data.datasets.forEach((ds) => allValues = allValues.concat(ds.values));
  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.1;
  const valueRange = maxVal - minVal || 1;

  let gridSvg = '';
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (plotHeight / 4) * i;
    const value = Math.round(maxVal - (valueRange / 4) * i);
    gridSvg += `
      <line x1="${padding.left}" y1="${y}" x2="${chartWidth - padding.right}" y2="${y}" stroke="#e9ecef" stroke-width="1"/>
      <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="#6c757d" font-size="9">₨ ${(value / 1000).toFixed(0)}K</text>
    `;
  }

  const labelSpacing = plotWidth / (data.labels.length - 1);
  let labelsSvg = '';
  data.labels.forEach((label, i) => {
    const x = padding.left + labelSpacing * i;
    labelsSvg += `<text x="${x}" y="${chartHeight - 8}" text-anchor="middle" fill="#6c757d" font-size="9">${label}</text>`;
  });

  let linesSvg = '';
  data.datasets.forEach((ds) => {
    let pathD = '';
    let areaD = '';

    ds.values.forEach((val, i) => {
      const x = padding.left + labelSpacing * i;
      const y = padding.top + plotHeight - ((val - minVal) / valueRange) * plotHeight;
      
      if (i === 0) {
        pathD += `M ${x} ${y}`;
        areaD += `M ${x} ${padding.top + plotHeight} L ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
        areaD += ` L ${x} ${y}`;
      }
    });

    const lastX = padding.left + labelSpacing * (ds.values.length - 1);
    areaD += ` L ${lastX} ${padding.top + plotHeight} Z`;

    linesSvg += `
      <defs>
        <linearGradient id="dashGrad${ds.color.replace('#', '')}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${ds.color};stop-opacity:0.2"/>
          <stop offset="100%" style="stop-color:${ds.color};stop-opacity:0.02"/>
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#dashGrad${ds.color.replace('#', '')})"/>
      <path d="${pathD}" fill="none" stroke="${ds.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `;

    ds.values.forEach((val, i) => {
      const x = padding.left + labelSpacing * i;
      const y = padding.top + plotHeight - ((val - minVal) / valueRange) * plotHeight;
      linesSvg += `<circle cx="${x}" cy="${y}" r="3" fill="white" stroke="${ds.color}" stroke-width="2"/>`;
    });
  });

  return `
    <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="w-100" style="max-height: ${height}px;">
      ${gridSvg}
      ${labelsSvg}
      ${linesSvg}
    </svg>
  `;
}
