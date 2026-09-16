interface AuditLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  description: string;
  ip_address: string;
  status: string;
}

const auditLogs: AuditLog[] = [
  { id: 1, timestamp: '2026-09-13T10:30:15', user: 'Super Admin', action: 'LOGIN', module: 'Auth', description: 'Successful login', ip_address: '192.168.1.100', status: 'success' },
  { id: 2, timestamp: '2026-09-13T10:32:00', user: 'Super Admin', action: 'CREATE', module: 'Sales', description: 'Invoice INV-2026-000001 created - ₨ 141.75', ip_address: '192.168.1.100', status: 'success' },
  { id: 3, timestamp: '2026-09-13T10:35:22', user: 'Super Admin', action: 'UPDATE', module: 'Inventory', description: 'Stock updated for Paracetamol 500mg (P001)', ip_address: '192.168.1.100', status: 'success' },
  { id: 4, timestamp: '2026-09-13T10:40:00', user: 'Super Admin', action: 'CREATE', module: 'Sales', description: 'Invoice INV-2026-000002 created - ₨ 525.00', ip_address: '192.168.1.100', status: 'success' },
  { id: 5, timestamp: '2026-09-13T10:45:30', user: 'Ahmed Raza', action: 'LOGIN', module: 'Auth', description: 'Successful login', ip_address: '192.168.1.101', status: 'success' },
  { id: 6, timestamp: '2026-09-13T10:50:00', user: 'Ahmed Raza', action: 'UPDATE', module: 'Medicines', description: 'Medicine Amoxicillin 500mg updated', ip_address: '192.168.1.101', status: 'success' },
  { id: 7, timestamp: '2026-09-13T11:00:00', user: 'Sara Bibi', action: 'LOGIN', module: 'Auth', description: 'Successful login', ip_address: '192.168.1.102', status: 'success' },
  { id: 8, timestamp: '2026-09-13T11:15:00', user: 'Sara Bibi', action: 'CREATE', module: 'Sales', description: 'Invoice INV-2026-000003 created - ₨ 630.00', ip_address: '192.168.1.102', status: 'success' },
  { id: 9, timestamp: '2026-09-13T11:30:00', user: 'Super Admin', action: 'DELETE', module: 'Medicines', description: 'Attempted to delete medicine with active stock', ip_address: '192.168.1.100', status: 'failed' },
  { id: 10, timestamp: '2026-09-13T11:45:00', user: 'Super Admin', action: 'UPDATE', module: 'Settings', description: 'System settings updated', ip_address: '192.168.1.100', status: 'success' },
  { id: 11, timestamp: '2026-09-13T12:00:00', user: 'Usman Ali', action: 'LOGIN', module: 'Auth', description: 'Successful login', ip_address: '192.168.1.103', status: 'success' },
  { id: 12, timestamp: '2026-09-13T12:15:00', user: 'Usman Ali', action: 'CREATE', module: 'Purchases', description: 'Purchase PO-2026-000001 created - ₨ 40,000', ip_address: '192.168.1.103', status: 'success' },
  { id: 13, timestamp: '2026-09-13T12:30:00', user: 'Super Admin', action: 'EXPORT', module: 'Reports', description: 'Sales report exported (PDF)', ip_address: '192.168.1.100', status: 'success' },
  { id: 14, timestamp: '2026-09-13T12:45:00', user: 'Super Admin', action: 'BACKUP', module: 'System', description: 'Database backup created', ip_address: '192.168.1.100', status: 'success' },
  { id: 15, timestamp: '2026-09-13T13:00:00', user: 'Fatima Noor', action: 'LOGIN', module: 'Auth', description: 'Failed login attempt - wrong password', ip_address: '192.168.1.104', status: 'failed' },
  { id: 16, timestamp: '2026-09-13T13:01:00', user: 'Fatima Noor', action: 'LOGIN', module: 'Auth', description: 'Successful login', ip_address: '192.168.1.104', status: 'success' },
  { id: 17, timestamp: '2026-09-13T13:15:00', user: 'Fatima Noor', action: 'CREATE', module: 'Journal Entries', description: 'Journal entry JE-2026-001 created', ip_address: '192.168.1.104', status: 'success' },
  { id: 18, timestamp: '2026-09-13T13:30:00', user: 'Super Admin', action: 'UPDATE', module: 'Users', description: 'User Hassan Shah deactivated', ip_address: '192.168.1.100', status: 'success' },
  { id: 19, timestamp: '2026-09-13T13:45:00', user: 'Super Admin', action: 'PRINT', module: 'Sales', description: 'Invoice INV-2026-000002 printed', ip_address: '192.168.1.100', status: 'success' },
  { id: 20, timestamp: '2026-09-13T14:00:00', user: 'Super Admin', action: 'LOGOUT', module: 'Auth', description: 'User logged out', ip_address: '192.168.1.100', status: 'success' },
];

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
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${auditLogs.length}</div>
              <div class="stat-label">Total Events</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-list-ul"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${auditLogs.filter((l) => l.status === 'success').length}</div>
              <div class="stat-label">Successful</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-check-circle"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${auditLogs.filter((l) => l.status === 'failed').length}</div>
              <div class="stat-label">Failed</div>
            </div>
            <div class="stat-icon red"><i class="bi bi-x-circle"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${new Set(auditLogs.map((l) => l.user)).size}</div>
              <div class="stat-label">Active Users</div>
            </div>
            <div class="stat-icon orange"><i class="bi bi-people"></i></div>
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
            <select class="form-select" id="filterUser">
              <option value="">All Users</option>
              ${[...new Set(auditLogs.map((l) => l.user))].map((u) => `<option value="${u}">${u}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="filterAction">
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="EXPORT">Export</option>
              <option value="PRINT">Print</option>
              <option value="BACKUP">Backup</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="filterModule">
              <option value="">All Modules</option>
              <option value="Auth">Auth</option>
              <option value="Sales">Sales</option>
              <option value="Purchases">Purchases</option>
              <option value="Medicines">Medicines</option>
              <option value="Inventory">Inventory</option>
              <option value="Reports">Reports</option>
              <option value="Settings">Settings</option>
              <option value="System">System</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
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
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Description</th>
                <th>IP Address</th>
                <th>Status</th>
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
  renderTable();

  document.getElementById('searchAudit')?.addEventListener('input', renderTable);
  document.getElementById('filterUser')?.addEventListener('change', renderTable);
  document.getElementById('filterAction')?.addEventListener('change', renderTable);
  document.getElementById('filterModule')?.addEventListener('change', renderTable);
  document.getElementById('filterStatus')?.addEventListener('change', renderTable);
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    (document.getElementById('searchAudit') as HTMLInputElement).value = '';
    (document.getElementById('filterUser') as HTMLSelectElement).value = '';
    (document.getElementById('filterAction') as HTMLSelectElement).value = '';
    (document.getElementById('filterModule') as HTMLSelectElement).value = '';
    (document.getElementById('filterStatus') as HTMLSelectElement).value = '';
    renderTable();
  });

  document.getElementById('exportAuditBtn')?.addEventListener('click', () => {
    alert('Audit log exported! (CSV download will start)');
  });
}

function renderTable(): void {
  const search = (document.getElementById('searchAudit') as HTMLInputElement)?.value.toLowerCase() || '';
  const user = (document.getElementById('filterUser') as HTMLSelectElement)?.value || '';
  const action = (document.getElementById('filterAction') as HTMLSelectElement)?.value || '';
  const module = (document.getElementById('filterModule') as HTMLSelectElement)?.value || '';
  const status = (document.getElementById('filterStatus') as HTMLSelectElement)?.value || '';

  const filtered = auditLogs.filter((l) => {
    const matchSearch = !search || 
      l.description.toLowerCase().includes(search) || 
      l.user.toLowerCase().includes(search) ||
      l.ip_address.includes(search);
    const matchUser = !user || l.user === user;
    const matchAction = !action || l.action === action;
    const matchModule = !module || l.module === module;
    const matchStatus = !status || l.status === status;
    return matchSearch && matchUser && matchAction && matchModule && matchStatus;
  });

  const tbody = document.getElementById('auditTableBody');
  if (!tbody) return;

  const actionColors: Record<string, string> = {
    LOGIN: 'success',
    LOGOUT: 'secondary',
    CREATE: 'primary',
    UPDATE: 'warning',
    DELETE: 'danger',
    EXPORT: 'info',
    PRINT: 'info',
    BACKUP: 'success',
  };

  const actionIcons: Record<string, string> = {
    LOGIN: 'bi-box-arrow-in-right',
    LOGOUT: 'bi-box-arrow-right',
    CREATE: 'bi-plus-circle',
    UPDATE: 'bi-pencil',
    DELETE: 'bi-trash',
    EXPORT: 'bi-download',
    PRINT: 'bi-printer',
    BACKUP: 'bi-cloud-upload',
  };

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5">
          <div class="text-muted">
            <i class="bi bi-list-ul fs-1 d-block mb-2"></i>
            <h6>No audit logs found</h6>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((l) => `
    <tr>
      <td>
        <div>${new Date(l.timestamp).toLocaleDateString()}</div>
        <small class="text-muted">${new Date(l.timestamp).toLocaleTimeString()}</small>
      </td>
      <td class="fw-semibold">${l.user}</td>
      <td>
        <span class="badge bg-${actionColors[l.action] || 'secondary'}">
          <i class="bi ${actionIcons[l.action] || 'bi-circle'} me-1"></i>
          ${l.action}
        </span>
      </td>
      <td><span class="badge bg-light text-dark">${l.module}</span></td>
      <td>${l.description}</td>
      <td><code>${l.ip_address}</code></td>
      <td><span class="badge-status ${l.status === 'success' ? 'badge-success' : 'badge-danger'} text-capitalize">${l.status}</span></td>
    </tr>
  `).join('');
}
