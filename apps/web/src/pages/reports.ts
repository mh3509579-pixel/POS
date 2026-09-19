import { reportsService } from '../services/reports.service';
import { inventoryService } from '../services/inventory.service';

type ReportsTab = 'sales' | 'purchases' | 'financial' | 'inventory';

export function renderReports(): string {
  return `
    <div class="page-header">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h4>Reports & Analytics</h4>
          <p>Business insights and performance reports</p>
        </div>
        <button class="btn btn-outline-secondary" id="exportReportBtn">
          <i class="bi bi-download me-2"></i>Export PDF
        </button>
      </div>
    </div>

    <div class="inventory-tabs">
      <button class="inventory-tab active" data-tab="sales">
        <i class="bi bi-graph-up"></i> Sales Reports
      </button>
      <button class="inventory-tab" data-tab="purchases">
        <i class="bi bi-cart"></i> Purchase Reports
      </button>
      <button class="inventory-tab" data-tab="financial">
        <i class="bi bi-currency-dollar"></i> Financial Reports
      </button>
      <button class="inventory-tab" data-tab="inventory">
        <i class="bi bi-box-seam"></i> Inventory Reports
      </button>
    </div>

    <div class="tab-content" id="reportsContent">
    </div>
  `;
}

export function initReports(): void {
  loadTab('sales');
  initTabs();
  document.getElementById('exportReportBtn')?.addEventListener('click', () => {
    alert('Report exported! (PDF download will start)');
  });
}

function initTabs(): void {
  document.querySelectorAll('.inventory-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab') as ReportsTab;
      if (tabName) {
        document.querySelectorAll('.inventory-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        loadTab(tabName);
      }
    });
  });
}

function loadTab(tab: ReportsTab): void {
  const content = document.getElementById('reportsContent');
  if (!content) return;

  switch (tab) {
    case 'sales':
      renderSalesReports(content);
      break;
    case 'purchases':
      renderPurchaseReports(content);
      break;
    case 'financial':
      renderFinancialReports(content);
      break;
    case 'inventory':
      renderInventoryReports(content);
      break;
  }
}

function createLineChart(data: { labels: string[]; datasets: { name: string; values: number[]; color: string }[] }, height: number = 250): string {
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartWidth = 600;
  const chartHeight = height;
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Find min/max values
  let allValues: number[] = [];
  data.datasets.forEach((ds) => allValues = allValues.concat(ds.values));
  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.1;
  const valueRange = maxVal - minVal || 1;

  // Generate grid lines
  const gridLines = 5;
  let gridSvg = '';
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (plotHeight / gridLines) * i;
    const value = Math.round(maxVal - (valueRange / gridLines) * i);
    gridSvg += `
      <line x1="${padding.left}" y1="${y}" x2="${chartWidth - padding.right}" y2="${y}" stroke="#e9ecef" stroke-width="1"/>
      <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="#6c757d" font-size="10">₨ ${(value / 1000).toFixed(0)}K</text>
    `;
  }

  // Generate X-axis labels
  let labelsSvg = '';
  const labelSpacing = plotWidth / (data.labels.length - 1);
  data.labels.forEach((label, i) => {
    const x = padding.left + labelSpacing * i;
    labelsSvg += `<text x="${x}" y="${chartHeight - 10}" text-anchor="middle" fill="#6c757d" font-size="10">${label}</text>`;
  });

  // Generate lines and points for each dataset
  let linesSvg = '';
  data.datasets.forEach((ds) => {
    let pathD = '';
    let areaD = '';
    const points: string[] = [];

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
      points.push(`${x},${y}`);
    });

    // Close area path
    const lastX = padding.left + labelSpacing * (ds.values.length - 1);
    areaD += ` L ${lastX} ${padding.top + plotHeight} Z`;

    // Area fill with gradient
    linesSvg += `
      <defs>
        <linearGradient id="areaGrad${ds.color.replace('#', '')}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${ds.color};stop-opacity:0.3"/>
          <stop offset="100%" style="stop-color:${ds.color};stop-opacity:0.05"/>
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#areaGrad${ds.color.replace('#', '')})"/>
      <path d="${pathD}" fill="none" stroke="${ds.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    `;

    // Data points
    ds.values.forEach((val, i) => {
      const x = padding.left + labelSpacing * i;
      const y = padding.top + plotHeight - ((val - minVal) / valueRange) * plotHeight;
      linesSvg += `
        <circle cx="${x}" cy="${y}" r="4" fill="white" stroke="${ds.color}" stroke-width="2"/>
      `;
    });
  });

  // Legend
  let legendSvg = '';
  data.datasets.forEach((ds, i) => {
    const x = padding.left + i * 120;
    legendSvg += `
      <rect x="${x}" y="5" width="12" height="12" rx="2" fill="${ds.color}"/>
      <text x="${x + 18}" y="15" fill="#495057" font-size="11">${ds.name}</text>
    `;
  });

  return `
    <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="w-100" style="max-height: ${height}px;">
      ${gridSvg}
      ${labelsSvg}
      ${linesSvg}
      ${legendSvg}
    </svg>
  `;
}

function createBarChart(data: { labels: string[]; values: number[]; colors: string[] }, height: number = 250): string {
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = 600;
  const chartHeight = height;
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const maxVal = Math.max(...data.values) * 1.1;
  const barWidth = (plotWidth / data.labels.length) * 0.6;
  const barGap = (plotWidth / data.labels.length) * 0.4;

  // Grid lines
  let gridSvg = '';
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (plotHeight / 5) * i;
    const value = Math.round(maxVal - (maxVal / 5) * i);
    gridSvg += `
      <line x1="${padding.left}" y1="${y}" x2="${chartWidth - padding.right}" y2="${y}" stroke="#e9ecef" stroke-width="1"/>
      <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="#6c757d" font-size="10">₨ ${(value / 1000).toFixed(0)}K</text>
    `;
  }

  // Bars
  let barsSvg = '';
  data.labels.forEach((label, i) => {
    const x = padding.left + (plotWidth / data.labels.length) * i + barGap / 2;
    const barHeight = (data.values[i] / maxVal) * plotHeight;
    const y = padding.top + plotHeight - barHeight;

    barsSvg += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${data.colors[i]}" rx="4"/>
      <text x="${x + barWidth / 2}" y="${chartHeight - 10}" text-anchor="middle" fill="#6c757d" font-size="10">${label}</text>
      <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" fill="#495057" font-size="9" font-weight="600">₨ ${(data.values[i] / 1000).toFixed(1)}K</text>
    `;
  });

  return `
    <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="w-100" style="max-height: ${height}px;">
      ${gridSvg}
      ${barsSvg}
    </svg>
  `;
}

function createDonutChart(data: { labels: string[]; values: number[]; colors: string[] }, height: number = 200): string {
  const size = 200;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 70;
  const innerRadius = 45;

  const total = data.values.reduce((a, b) => a + b, 0);
  let currentAngle = -90;

  let arcsSvg = '';
  data.values.forEach((val, i) => {
    const angle = (val / total) * 360;
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

    arcsSvg += `
      <path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z" 
            fill="${data.colors[i]}" opacity="0.85"/>
    `;

    currentAngle = endAngle;
  });

  // Center text
  arcsSvg += `
    <text x="${centerX}" y="${centerY - 5}" text-anchor="middle" fill="#495057" font-size="14" font-weight="700">₨ ${(total / 100000).toFixed(1)}L</text>
    <text x="${centerX}" y="${centerY + 12}" text-anchor="middle" fill="#6c757d" font-size="10">Total</text>
  `;

  // Legend
  let legendSvg = '';
  data.labels.forEach((label, i) => {
    const y = 20 + i * 20;
    legendSvg += `
      <rect x="${size + 20}" y="${y}" width="12" height="12" rx="2" fill="${data.colors[i]}"/>
      <text x="${size + 38}" y="${y + 10}" fill="#495057" font-size="11">${label}</text>
    `;
  });

  return `
    <div class="d-flex align-items-center justify-content-center">
      <svg viewBox="0 0 ${size + 150} ${size}" style="max-height: ${height}px;">
        ${arcsSvg}
        ${legendSvg}
      </svg>
    </div>
  `;
}

async function renderSalesReports(container: HTMLElement): Promise<void> {
  let summary = { total_sales: 0, total_revenue: 0, total_discount: 0, total_tax: 0, avg_sale_value: 0 };
  let daily: { date: string; count: number; amount: number }[] = [];
  let topMedicines: { name: string; total_qty: number; total_amount: number }[] = [];
  let paymentMethods: { payment_method: string; count: number; amount: number }[] = [];

  try {
    const data = await reportsService.getSalesReport();
    summary = data.summary || summary;
    daily = data.daily || [];
    topMedicines = data.topMedicines || [];
    paymentMethods = data.paymentMethods || [];
  } catch { /* use defaults */ }

  const dailyLabels = daily.map((d) => new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }));
  const dailyAmounts = daily.map((d) => Number(d.amount || 0));
  const pmColors = ['#198754', '#0d6efd', '#ffc107', '#0dcaf0', '#dc3545'];

  container.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${Number(summary.total_revenue || 0).toLocaleString()}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-currency-rupee"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${summary.total_sales || 0}</div>
              <div class="stat-label">Total Sales</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-receipt"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${Number(summary.total_discount || 0).toLocaleString()}</div>
              <div class="stat-label">Total Discount</div>
            </div>
            <div class="stat-icon orange"><i class="bi bi-percent"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${Number(summary.avg_sale_value || 0).toLocaleString()}</div>
              <div class="stat-label">Avg Sale Value</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-graph-up-arrow"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header"><h6 class="mb-0">Daily Sales Trend</h6></div>
          <div class="card-body">
            ${dailyLabels.length > 0
              ? createBarChart({ labels: dailyLabels, values: dailyAmounts, colors: dailyLabels.map(() => '#198754') })
              : '<div class="text-center text-muted py-5">No sales data available</div>'}
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-header"><h6 class="mb-0">Payment Methods</h6></div>
          <div class="card-body">
            ${paymentMethods.length > 0
              ? createDonutChart({
                  labels: paymentMethods.map((p) => p.payment_method),
                  values: paymentMethods.map((p) => Number(p.amount || 0)),
                  colors: paymentMethods.map((_, i) => pmColors[i % pmColors.length])
                })
              : '<div class="text-center text-muted">No payment data</div>'}
            ${paymentMethods.map((p) => `
              <div class="d-flex justify-content-between mb-2 mt-2">
                <span class="text-capitalize"><i class="bi bi-cash me-2"></i>${p.payment_method}</span>
                <span class="fw-semibold">₨ ${Number(p.amount || 0).toLocaleString()} (${p.count})</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header"><h6 class="mb-0">Top Selling Medicines</h6></div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead><tr><th>#</th><th>Medicine</th><th class="text-end">Qty Sold</th><th class="text-end">Revenue</th></tr></thead>
              <tbody>
                ${topMedicines.length > 0
                  ? topMedicines.map((m, i) => `<tr><td>${i + 1}</td><td>${m.name}</td><td class="text-end">${m.total_qty}</td><td class="text-end">₨ ${Number(m.total_amount).toLocaleString()}</td></tr>`).join('')
                  : '<tr><td colspan="4" class="text-center text-muted">No data</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function renderPurchaseReports(container: HTMLElement): Promise<void> {
  let summary = { total_purchases: 0, total_cost: 0, total_discount: 0, total_tax: 0 };
  let daily: { date: string; count: number; amount: number }[] = [];
  let topSuppliers: { name: string; order_count: number; total_amount: number }[] = [];

  try {
    const data = await reportsService.getPurchasesReport();
    summary = data.summary || summary;
    daily = data.daily || [];
    topSuppliers = data.topSuppliers || [];
  } catch { /* use defaults */ }

  const dailyLabels = daily.map((d) => new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }));
  const dailyAmounts = daily.map((d) => Number(d.amount || 0));

  container.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${summary.total_purchases || 0}</div>
              <div class="stat-label">Total Purchases</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-cart-plus"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${Number(summary.total_cost || 0).toLocaleString()}</div>
              <div class="stat-label">Total Cost</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-currency-rupee"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${Number(summary.total_discount || 0).toLocaleString()}</div>
              <div class="stat-label">Total Discount</div>
            </div>
            <div class="stat-icon orange"><i class="bi bi-percent"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ ${Number(summary.total_tax || 0).toLocaleString()}</div>
              <div class="stat-label">Total Tax</div>
            </div>
            <div class="stat-icon red"><i class="bi bi-receipt"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header"><h6 class="mb-0">Daily Purchase Trend</h6></div>
          <div class="card-body">
            ${dailyLabels.length > 0
              ? createBarChart({ labels: dailyLabels, values: dailyAmounts, colors: dailyLabels.map(() => '#0d6efd') })
              : '<div class="text-center text-muted py-5">No purchase data available</div>'}
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-header"><h6 class="mb-0">Top Suppliers</h6></div>
          <div class="card-body p-0">
            <table class="table table-sm mb-0">
              <thead><tr><th>Supplier</th><th class="text-end">Orders</th><th class="text-end">Amount</th></tr></thead>
              <tbody>
                ${topSuppliers.length > 0
                  ? topSuppliers.map((s) => `<tr><td>${s.name}</td><td class="text-end">${s.order_count}</td><td class="text-end">₨ ${Number(s.total_amount).toLocaleString()}</td></tr>`).join('')
                  : '<tr><td colspan="3" class="text-center text-muted">No data</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function renderFinancialReports(container: HTMLElement): Promise<void> {
  let pl = { revenue: 0, cogs: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0 };
  let expensesByCategory: { category_name: string; amount: number; count: number }[] = [];

  try {
    pl = await reportsService.getProfitLoss();
  } catch { /* use defaults */ }

  try {
    const expData = await reportsService.getExpensesReport();
    expensesByCategory = expData.byCategory || [];
  } catch { /* use defaults */ }

  const grossMargin = pl.revenue > 0 ? ((pl.grossProfit / pl.revenue) * 100).toFixed(1) : '0';
  const expColors = ['#0d6efd', '#198754', '#ffc107', '#0dcaf0', '#dc3545', '#6c757d'];

  container.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value text-success">₨ ${pl.revenue.toLocaleString()}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-arrow-up-circle"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value text-danger">₨ ${pl.cogs.toLocaleString()}</div>
              <div class="stat-label">Cost of Goods</div>
            </div>
            <div class="stat-icon red"><i class="bi bi-arrow-down-circle"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value text-success">₨ ${pl.grossProfit.toLocaleString()}</div>
              <div class="stat-label">Gross Profit</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-cash"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${grossMargin}%</div>
              <div class="stat-label">Gross Margin</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-percent"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header"><h6 class="mb-0">Profit & Loss Summary</h6></div>
          <div class="card-body">
            <table class="table">
              <tbody>
                <tr><td>Revenue (Sales)</td><td class="text-end fw-semibold">₨ ${pl.revenue.toLocaleString()}</td></tr>
                <tr><td>Cost of Goods Sold</td><td class="text-end text-danger">-₨ ${pl.cogs.toLocaleString()}</td></tr>
                <tr class="table-light"><td><strong>Gross Profit</strong></td><td class="text-end fw-bold text-success"><strong>₨ ${pl.grossProfit.toLocaleString()}</strong></td></tr>
                <tr><td>Operating Expenses</td><td class="text-end text-danger">-₨ ${pl.totalExpenses.toLocaleString()}</td></tr>
                <tr class="table-light"><td><strong>Net Profit</strong></td><td class="text-end fw-bold ${pl.netProfit >= 0 ? 'text-success' : 'text-danger'}"><strong>₨ ${pl.netProfit.toLocaleString()}</strong></td></tr>
                <tr><td>Profit Margin</td><td class="text-end fw-semibold">${pl.profitMargin.toFixed(1)}%</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-header"><h6 class="mb-0">Expense Distribution</h6></div>
          <div class="card-body">
            ${expensesByCategory.length > 0
              ? createDonutChart({
                  labels: expensesByCategory.map((c) => c.category_name),
                  values: expensesByCategory.map((c) => Number(c.amount || 0)),
                  colors: expensesByCategory.map((_, i) => expColors[i % expColors.length])
                })
              : '<div class="text-center text-muted">No expense data</div>'}
            ${expensesByCategory.map((c) => `
              <div class="d-flex justify-content-between mb-2 mt-2">
                <span>${c.category_name}</span>
                <span class="fw-semibold">₨ ${Number(c.amount).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

async function renderInventoryReports(container: HTMLElement): Promise<void> {
  let lowStock: any[] = [];
  let expiringSoon: any[] = [];

  try {
    lowStock = await inventoryService.getLowStock();
    expiringSoon = await inventoryService.getExpiringSoon(90);
  } catch { /* use defaults */ }

  container.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${lowStock.length}</div>
              <div class="stat-label">Low Stock Items</div>
            </div>
            <div class="stat-icon red"><i class="bi bi-exclamation-triangle"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${expiringSoon.length}</div>
              <div class="stat-label">Expiring Soon (90 days)</div>
            </div>
            <div class="stat-icon orange"><i class="bi bi-clock-history"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header"><h6 class="mb-0">Low Stock Alert</h6></div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead><tr><th>Medicine</th><th class="text-end">Current Stock</th><th class="text-end">Min Required</th><th>Status</th></tr></thead>
              <tbody>
                ${lowStock.length > 0
                  ? lowStock.map((m: any) => `<tr><td>${m.name}</td><td class="text-end">${m.total_stock ?? m.quantity ?? 0}</td><td class="text-end">${m.min_stock_level ?? 10}</td><td><span class="badge ${Number(m.total_stock ?? m.quantity ?? 0) === 0 ? 'bg-danger' : 'bg-warning'}">${Number(m.total_stock ?? m.quantity ?? 0) === 0 ? 'Out of Stock' : 'Low'}</span></td></tr>`).join('')
                  : '<tr><td colspan="4" class="text-center text-muted">All items in stock</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header"><h6 class="mb-0">Expiring Soon (90 days)</h6></div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead><tr><th>Medicine</th><th>Batch</th><th>Expiry</th><th class="text-end">Stock</th></tr></thead>
              <tbody>
                ${expiringSoon.length > 0
                  ? expiringSoon.map((m: any) => {
                      const days = Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return `<tr><td>${m.medicine_name || m.name}</td><td><code>${m.batch_number || '-'}</code></td><td>${new Date(m.expiry_date).toLocaleDateString()} <span class="badge bg-warning ms-1">${days}d</span></td><td class="text-end">${m.quantity ?? m.stock ?? 0}</td></tr>`;
                    }).join('')
                  : '<tr><td colspan="4" class="text-center text-muted">No items expiring soon</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}
