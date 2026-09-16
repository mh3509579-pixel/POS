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

function renderSalesReports(container: HTMLElement): void {
  container.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ 1,538</div>
              <div class="stat-label">Today's Sales</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-cart-check"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ 45,250</div>
              <div class="stat-label">This Week</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-calendar-week"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ 1,85,000</div>
              <div class="stat-label">This Month</div>
            </div>
            <div class="stat-icon orange"><i class="bi bi-calendar-month"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ 22,50,000</div>
              <div class="stat-label">This Year</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-graph-up-arrow"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Daily Sales Trend</h6>
            <select class="form-select form-select-sm" style="width: auto;">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Month</option>
            </select>
          </div>
          <div class="card-body">
            ${createLineChart({
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [
                { name: 'Sales', values: [12500, 8200, 15800, 10200, 18500, 14200, 7800], color: '#198754' },
                { name: 'Last Week', values: [10000, 12000, 9500, 14000, 11000, 16000, 8500], color: '#0d6efd' },
              ]
            }, 280)}
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Payment Methods</h6>
          </div>
          <div class="card-body">
            ${createDonutChart({
              labels: ['Cash', 'Card', 'Credit'],
              values: [65, 25, 10],
              colors: ['#198754', '#0d6efd', '#ffc107']
            }, 180)}
            <div class="mt-3">
              <div class="d-flex justify-content-between mb-2">
                <span><i class="bi bi-cash me-2 text-success"></i>Cash</span>
                <span class="fw-semibold">₨ 1,20,250</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span><i class="bi bi-credit-card me-2 text-primary"></i>Card</span>
                <span class="fw-semibold">₨ 46,250</span>
              </div>
              <div class="d-flex justify-content-between">
                <span><i class="bi bi-clock me-2 text-warning"></i>Credit</span>
                <span class="fw-semibold">₨ 18,500</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Monthly Sales Comparison</h6>
          </div>
          <div class="card-body">
            ${createBarChart({
              labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
              values: [180000, 240000, 200000, 260000, 290000, 185000],
              colors: ['#0d6efd', '#198754', '#0d6efd', '#198754', '#ffc107', '#198754']
            }, 220)}
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Sales vs Returns</h6>
          </div>
          <div class="card-body">
            ${createLineChart({
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [
                { name: 'Sales', values: [150000, 180000, 165000, 180000, 240000, 200000], color: '#198754' },
                { name: 'Returns', values: [5000, 8000, 3000, 6000, 4500, 7000], color: '#dc3545' },
              ]
            }, 220)}
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Top Selling Medicines</h6>
          </div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead>
                <tr><th>#</th><th>Medicine</th><th class="text-end">Qty Sold</th><th class="text-end">Revenue</th></tr>
              </thead>
              <tbody>
                <tr><td>1</td><td>Paracetamol 500mg</td><td class="text-end">450</td><td class="text-end">₨ 22,500</td></tr>
                <tr><td>2</td><td>Amoxicillin 500mg</td><td class="text-end">320</td><td class="text-end">₨ 38,400</td></tr>
                <tr><td>3</td><td>Cetirizine 10mg</td><td class="text-end">280</td><td class="text-end">₨ 9,800</td></tr>
                <tr><td>4</td><td>Augmentin 625mg</td><td class="text-end">210</td><td class="text-end">₨ 58,800</td></tr>
                <tr><td>5</td><td>Nexium 40mg</td><td class="text-end">180</td><td class="text-end">₨ 81,000</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Top Customers</h6>
          </div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead>
                <tr><th>#</th><th>Customer</th><th>Type</th><th class="text-end">Purchases</th></tr>
              </thead>
              <tbody>
                <tr><td>1</td><td>MedCity Hospital</td><td><span class="badge bg-success">Wholesale</span></td><td class="text-end">₨ 25,00,000</td></tr>
                <tr><td>2</td><td>Kamran Brothers</td><td><span class="badge bg-success">Wholesale</span></td><td class="text-end">₨ 18,00,000</td></tr>
                <tr><td>3</td><td>Fatima Shah</td><td><span class="badge bg-warning">Premium</span></td><td class="text-end">₨ 3,80,000</td></tr>
                <tr><td>4</td><td>Sara Malik</td><td><span class="badge bg-warning">Premium</span></td><td class="text-end">₨ 1,95,000</td></tr>
                <tr><td>5</td><td>Ahmed Khan</td><td><span class="badge bg-info">Regular</span></td><td class="text-end">₨ 1,25,000</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPurchaseReports(container: HTMLElement): void {
  container.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ 40,000</div>
              <div class="stat-label">Today's Purchases</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-cart-plus"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ 2,85,000</div>
              <div class="stat-label">This Month</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-calendar-month"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ 2,95,000</div>
              <div class="stat-label">Pending Payments</div>
            </div>
            <div class="stat-icon red"><i class="bi bi-exclamation-triangle"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">42</div>
              <div class="stat-label">Orders This Month</div>
            </div>
            <div class="stat-icon orange"><i class="bi bi-receipt"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Monthly Purchase Trend</h6>
            <select class="form-select form-select-sm" style="width: auto;">
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div class="card-body">
            ${createLineChart({
              labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
              datasets: [
                { name: 'Purchases', values: [180000, 240000, 200000, 260000, 285000, 220000], color: '#0d6efd' },
                { name: 'Payments', values: [150000, 200000, 180000, 220000, 250000, 195000], color: '#198754' },
              ]
            }, 280)}
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Supplier-wise Purchases</h6>
          </div>
          <div class="card-body">
            ${createDonutChart({
              labels: ['Global Pharma', 'Karachi Pharma', 'Lahore Medical', 'Others'],
              values: [50, 25, 18, 20.5],
              colors: ['#198754', '#0d6efd', '#ffc107', '#6c757d']
            }, 180)}
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h6 class="mb-0">Pending Supplier Payments</h6>
      </div>
      <div class="card-body p-0">
        <table class="table table-hover mb-0">
          <thead>
            <tr><th>Supplier</th><th>Last Purchase</th><th class="text-end">Total Purchases</th><th class="text-end">Amount Paid</th><th class="text-end">Balance Due</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>Global Pharma Imports</td><td>2026-09-08</td><td class="text-end">₨ 50,00,000</td><td class="text-end">₨ 48,75,000</td><td class="text-end text-danger fw-semibold">₨ 1,25,000</td><td><span class="badge bg-warning">Pending</span></td></tr>
            <tr><td>Karachi Pharma Wholesalers</td><td>2026-09-13</td><td class="text-end">₨ 25,00,000</td><td class="text-end">₨ 24,15,000</td><td class="text-end text-danger fw-semibold">₨ 85,000</td><td><span class="badge bg-warning">Pending</span></td></tr>
            <tr><td>Lahore Medical Suppliers</td><td>2026-09-12</td><td class="text-end">₨ 18,00,000</td><td class="text-end">₨ 17,58,000</td><td class="text-end text-danger fw-semibold">₨ 42,000</td><td><span class="badge bg-warning">Pending</span></td></tr>
            <tr><td>Peshawar Pharma</td><td>2026-09-05</td><td class="text-end">₨ 6,80,000</td><td class="text-end">₨ 6,52,000</td><td class="text-end text-danger fw-semibold">₨ 28,000</td><td><span class="badge bg-warning">Pending</span></td></tr>
            <tr><td>Al-Rehman Medical Store</td><td>2026-09-01</td><td class="text-end">₨ 4,20,000</td><td class="text-end">₨ 4,05,000</td><td class="text-end text-danger fw-semibold">₨ 15,000</td><td><span class="badge bg-warning">Pending</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderFinancialReports(container: HTMLElement): void {
  container.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value text-success">₨ 22,50,000</div>
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
              <div class="stat-value text-danger">₨ 15,25,000</div>
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
              <div class="stat-value text-success">₨ 7,25,000</div>
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
              <div class="stat-value">32.2%</div>
              <div class="stat-label">Profit Margin</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-percent"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">Revenue vs Expenses vs Profit</h6>
          </div>
          <div class="card-body">
            ${createLineChart({
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
              datasets: [
                { name: 'Revenue', values: [180000, 200000, 190000, 220000, 280000, 250000, 260000, 290000, 185000], color: '#198754' },
                { name: 'Expenses', values: [120000, 130000, 125000, 140000, 160000, 150000, 155000, 170000, 140000], color: '#dc3545' },
                { name: 'Profit', values: [60000, 70000, 65000, 80000, 120000, 100000, 105000, 120000, 45000], color: '#0d6efd' },
              ]
            }, 300)}
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Expense Distribution</h6>
          </div>
          <div class="card-body">
            ${createDonutChart({
              labels: ['Rent', 'Salaries', 'Utilities', 'Marketing', 'Others'],
              values: [50000, 120000, 22500, 8500, 64700],
              colors: ['#0d6efd', '#198754', '#ffc107', '#0dcaf0', '#6c757d']
            }, 180)}
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Monthly Profit Trend</h6>
          </div>
          <div class="card-body">
            ${createBarChart({
              labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
              values: [80000, 120000, 100000, 105000, 120000, 45000],
              colors: ['#198754', '#198754', '#198754', '#198754', '#198754', '#ffc107']
            }, 220)}
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Gross Margin Trend</h6>
          </div>
          <div class="card-body">
            ${createLineChart({
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [
                { name: 'Margin %', values: [33, 35, 34, 36, 42, 40], color: '#0d6efd' },
              ]
            }, 220)}
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header"><h6 class="mb-0">Accounts Receivable</h6></div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead><tr><th>Customer</th><th class="text-end">Amount</th><th>Days</th></tr></thead>
              <tbody>
                <tr><td>MedCity Hospital</td><td class="text-end text-danger">₨ 1,25,000</td><td><span class="badge bg-danger">60+ days</span></td></tr>
                <tr><td>Kamran Brothers</td><td class="text-end text-danger">₨ 45,000</td><td><span class="badge bg-danger">45 days</span></td></tr>
                <tr><td>Ali Hassan</td><td class="text-end text-danger">₨ 4,500</td><td><span class="badge bg-warning">30 days</span></td></tr>
                <tr><td>Ahmed Khan</td><td class="text-end text-danger">₨ 2,500</td><td><span class="badge bg-info">15 days</span></td></tr>
              </tbody>
              <tfoot><tr class="table-light"><td><strong>Total</strong></td><td class="text-end text-danger"><strong>₨ 1,77,000</strong></td><td></td></tr></tfoot>
            </table>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header"><h6 class="mb-0">Accounts Payable</h6></div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead><tr><th>Supplier</th><th class="text-end">Amount</th><th>Days</th></tr></thead>
              <tbody>
                <tr><td>Global Pharma</td><td class="text-end text-danger">₨ 1,25,000</td><td><span class="badge bg-danger">60+ days</span></td></tr>
                <tr><td>Karachi Pharma</td><td class="text-end text-danger">₨ 85,000</td><td><span class="badge bg-warning">30 days</span></td></tr>
                <tr><td>Lahore Medical</td><td class="text-end text-danger">₨ 42,000</td><td><span class="badge bg-warning">30 days</span></td></tr>
                <tr><td>Peshawar Pharma</td><td class="text-end text-danger">₨ 28,000</td><td><span class="badge bg-info">15 days</span></td></tr>
                <tr><td>Al-Rehman</td><td class="text-end text-danger">₨ 15,000</td><td><span class="badge bg-info">15 days</span></td></tr>
              </tbody>
              <tfoot><tr class="table-light"><td><strong>Total</strong></td><td class="text-end text-danger"><strong>₨ 2,95,000</strong></td><td></td></tr></tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderInventoryReports(container: HTMLElement): void {
  container.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">20</div>
              <div class="stat-label">Total Medicines</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-box-seam"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">₨ 11,05,000</div>
              <div class="stat-label">Stock Value</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-cash-stack"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">3</div>
              <div class="stat-label">Low Stock Items</div>
            </div>
            <div class="stat-icon red"><i class="bi bi-exclamation-triangle"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">2</div>
              <div class="stat-label">Expiring Soon</div>
            </div>
            <div class="stat-icon orange"><i class="bi bi-clock-history"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">Stock Value by Category</h6>
          </div>
          <div class="card-body">
            ${createBarChart({
              labels: ['Pain Relief', 'Antibiotics', 'Antihistamines', 'Gastro', 'Cardiac', 'Others'],
              values: [280000, 350000, 120000, 210000, 150000, 80000],
              colors: ['#0d6efd', '#198754', '#ffc107', '#0dcaf0', '#dc3545', '#6c757d']
            }, 250)}
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Stock Status</h6>
          </div>
          <div class="card-body">
            ${createDonutChart({
              labels: ['In Stock', 'Low Stock', 'Out of Stock'],
              values: [15, 3, 0],
              colors: ['#198754', '#ffc107', '#dc3545']
            }, 160)}
            <div class="mt-3">
              <div class="d-flex justify-content-between mb-2">
                <span class="text-success"><i class="bi bi-check-circle me-2"></i>In Stock</span>
                <span class="fw-semibold">15 items (75%)</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span class="text-warning"><i class="bi bi-exclamation-circle me-2"></i>Low Stock</span>
                <span class="fw-semibold">3 items (15%)</span>
              </div>
              <div class="d-flex justify-content-between">
                <span class="text-danger"><i class="bi bi-x-circle me-2"></i>Out of Stock</span>
                <span class="fw-semibold">0 items (0%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Monthly Stock Movement</h6>
          </div>
          <div class="card-body">
            ${createLineChart({
              labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
              datasets: [
                { name: 'Stock In', values: [180000, 240000, 200000, 260000, 285000, 220000], color: '#198754' },
                { name: 'Stock Out', values: [150000, 200000, 180000, 220000, 250000, 195000], color: '#dc3545' },
              ]
            }, 220)}
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Expiry Distribution</h6>
          </div>
          <div class="card-body">
            ${createDonutChart({
              labels: ['>12 months', '6-12 months', '3-6 months', '<3 months'],
              values: [8, 6, 4, 2],
              colors: ['#198754', '#0d6efd', '#ffc107', '#dc3545']
            }, 160)}
            <div class="mt-3">
              <div class="d-flex justify-content-between mb-2">
                <span class="text-success"><i class="bi bi-check-circle me-2"></i>&gt;12 months</span>
                <span class="fw-semibold">8 items</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span class="text-primary"><i class="bi bi-clock me-2"></i>6-12 months</span>
                <span class="fw-semibold">6 items</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span class="text-warning"><i class="bi bi-exclamation-circle me-2"></i>3-6 months</span>
                <span class="fw-semibold">4 items</span>
              </div>
              <div class="d-flex justify-content-between">
                <span class="text-danger"><i class="bi bi-x-circle me-2"></i>&lt;3 months</span>
                <span class="fw-semibold">2 items</span>
              </div>
            </div>
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
              <thead><tr><th>Medicine</th><th class="text-end">Stock</th><th class="text-end">Min Required</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td>Cetirizine 10mg</td><td class="text-end">15</td><td class="text-end">50</td><td><span class="badge bg-danger">Critical</span></td></tr>
                <tr><td>Brufen 400mg</td><td class="text-end">28</td><td class="text-end">50</td><td><span class="badge bg-warning">Low</span></td></tr>
                <tr><td>Dolo 650</td><td class="text-end">20</td><td class="text-end">40</td><td><span class="badge bg-warning">Low</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header"><h6 class="mb-0">Expiring Soon (30 days)</h6></div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead><tr><th>Medicine</th><th>Batch</th><th>Expiry</th><th class="text-end">Stock</th></tr></thead>
              <tbody>
                <tr><td>Amoxicillin 500mg</td><td><code>A001</code></td><td>2026-10-15</td><td class="text-end">150</td></tr>
                <tr><td>Cetirizine 10mg</td><td><code>C001</code></td><td>2026-10-20</td><td class="text-end">15</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}
