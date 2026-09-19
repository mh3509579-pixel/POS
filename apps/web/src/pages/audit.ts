import { auditService, AuditLog } from '../services/audit.service';

let auditLogs: AuditLog[] = [];
let totalLogs = 0;

export function renderAudit(): string {
  return `
    <div class="page-header">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h4>Audit Log</h4>
          <p>Track all system activities and user actions</p>
        </div>
        <button class="btn btn-outline-secondary" id="exportAuditBtn">
          <i class="bi bi-download me-2"></i>Export Log
        </button>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value" id="auditTotal">-</div>
              <div class="stat-label">Total Events</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-list-ul"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value" id="auditToday">-</div>
              <div class="stat-label">Today</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-check-circle"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value" id="auditFailed">-</div>
              <div class="stat-label">Failed / Errors</div>
            </div>
            <div class="stat-icon red"><i class="bi bi-x-circle"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="searchAudit" placeholder="Search logs...">
            </div>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="filterAction">
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="filterModule">
              <option value="">All Modules</option>
              <option value="sale">Sales</option>
              <option value="purchase">Purchases</option>
              <option value="medicine">Medicines</option>
              <option value="expense">Expenses</option>
              <option value="user">Users</option>
              <option value="auth">Auth</option>
              <option value="settings">Settings</option>
            </select>
          </div>
          <div class="col-md-2">
            <input type="date" class="form-control" id="filterStartDate">
          </div>
          <div class="col-md-2">
            <input type="date" class="form-control" id="filterEndDate">
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
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody id="auditTableBody">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function initAudit(): void {
  loadStats();
  loadLogs();

  document.getElementById('searchAudit')?.addEventListener('input', () => loadLogs());
  document.getElementById('filterAction')?.addEventListener('change', () => loadLogs());
  document.getElementById('filterModule')?.addEventListener('change', () => loadLogs());
  document.getElementById('filterStartDate')?.addEventListener('change', () => loadLogs());
  document.getElementById('filterEndDate')?.addEventListener('change', () => loadLogs());
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    (document.getElementById('searchAudit') as HTMLInputElement).value = '';
    (document.getElementById('filterAction') as HTMLSelectElement).value = '';
    (document.getElementById('filterModule') as HTMLSelectElement).value = '';
    (document.getElementById('filterStartDate') as HTMLInputElement).value = '';
    (document.getElementById('filterEndDate') as HTMLInputElement).value = '';
    loadLogs();
  });

  document.getElementById('exportAuditBtn')?.addEventListener('click', exportCsv);
}

async function loadStats(): Promise<void> {
  try {
    const stats = await auditService.getStats();
    const totalEl = document.getElementById('auditTotal');
    const todayEl = document.getElementById('auditToday');
    const failedEl = document.getElementById('auditFailed');
    if (totalEl) totalEl.textContent = String(stats.total);
    if (todayEl) todayEl.textContent = String(stats.today);
    if (failedEl) failedEl.textContent = String(stats.failed);
  } catch {
    const totalEl = document.getElementById('auditTotal');
    const todayEl = document.getElementById('auditToday');
    const failedEl = document.getElementById('auditFailed');
    if (totalEl) totalEl.textContent = '0';
    if (todayEl) todayEl.textContent = '0';
    if (failedEl) failedEl.textContent = '0';
  }
}

async function loadLogs(): Promise<void> {
  const action = (document.getElementById('filterAction') as HTMLSelectElement)?.value || '';
  const entity_type = (document.getElementById('filterModule') as HTMLSelectElement)?.value || '';
  const start_date = (document.getElementById('filterStartDate') as HTMLInputElement)?.value || '';
  const end_date = (document.getElementById('filterEndDate') as HTMLInputElement)?.value || '';

  try {
    const { data, total } = await auditService.getAll({
      limit: 200,
      action: action || undefined,
      entity_type: entity_type || undefined,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
    });
    auditLogs = data;
    totalLogs = total;
  } catch {
    auditLogs = [];
    totalLogs = 0;
  }

  renderTable();
}

function renderTable(): void {
  const search = (document.getElementById('searchAudit') as HTMLInputElement)?.value.toLowerCase() || '';

  const filtered = auditLogs.filter((l) => {
    const desc = l.new_values ? String(l.new_values).slice(0, 200) : '';
    const matchSearch = !search ||
      (l.user_name || '').toLowerCase().includes(search) ||
      (l.username || '').toLowerCase().includes(search) ||
      l.action.toLowerCase().includes(search) ||
      l.entity_type.toLowerCase().includes(search) ||
      desc.toLowerCase().includes(search);
    return matchSearch;
  });

  const tbody = document.getElementById('auditTableBody');
  if (!tbody) return;

  const actionColors: Record<string, string> = {
    LOGIN: 'success',
    LOGOUT: 'secondary',
    CREATE: 'primary',
    UPDATE: 'warning',
    DELETE: 'danger',
  };

  const actionIcons: Record<string, string> = {
    LOGIN: 'bi-box-arrow-in-right',
    LOGOUT: 'bi-box-arrow-right',
    CREATE: 'bi-plus-circle',
    UPDATE: 'bi-pencil',
    DELETE: 'bi-trash',
  };

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-5">
          <div class="text-muted">
            <i class="bi bi-list-ul fs-1 d-block mb-2"></i>
            <h6>No audit logs found</h6>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((l) => {
    const details = l.new_values ? String(l.new_values).slice(0, 120) : l.entity_type + (l.entity_id ? ` #${l.entity_id}` : '');
    return `
      <tr>
        <td>
          <div>${new Date(l.created_at).toLocaleDateString()}</div>
          <small class="text-muted">${new Date(l.created_at).toLocaleTimeString()}</small>
        </td>
        <td class="fw-semibold">${l.user_name || l.username || 'System'}</td>
        <td>
          <span class="badge bg-${actionColors[l.action] || 'secondary'}">
            <i class="bi ${actionIcons[l.action] || 'bi-circle'} me-1"></i>
            ${l.action}
          </span>
        </td>
        <td><span class="badge bg-light text-dark text-capitalize">${l.entity_type}</span></td>
        <td>${details}</td>
        <td><code>${l.ip_address || '-'}</code></td>
      </tr>
    `;
  }).join('');
}

function exportCsv(): void {
  if (auditLogs.length === 0) {
    alert('No logs to export');
    return;
  }
  const headers = ['Time', 'User', 'Action', 'Module', 'Entity ID', 'IP'];
  const rows = auditLogs.map((l) => [
    l.created_at,
    l.user_name || l.username || '',
    l.action,
    l.entity_type,
    l.entity_id || '',
    l.ip_address || '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
