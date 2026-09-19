import { authService, User as ApiUser } from '../services/auth.service';
import { confirmAction, successToast, errorToast } from '../utils/alerts';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  role_id: number;
  status: string;
  last_login: string;
  avatar: string;
}

interface Role {
  id: number;
  name: string;
  label: string;
  color: string;
  description: string;
  permissions: string[];
}

let users: User[] = [];
let roles: Role[] = [];

const roleConfig: Record<string, { label: string; color: string; permissions: string[] }> = {
  admin: { label: 'Admin', color: 'danger', permissions: ['Full System Access', 'Manage Users', 'Settings', 'All Reports'] },
  stock_manager: { label: 'Stock Manager', color: 'warning', permissions: ['Medicines', 'Inventory', 'Purchases', 'Suppliers'] },
  cashier: { label: 'Cashier', color: 'success', permissions: ['POS', 'Medicines View', 'Customers'] },
};

export function renderUsers(): string {
  return `
    <div class="page-header">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h4>User Management</h4>
          <p>Manage system users and their roles</p>
        </div>
        <button class="btn btn-brand-green" id="addUserBtn">
          <i class="bi bi-person-plus me-2"></i>Add User
        </button>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${users.length}</div>
              <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-icon blue"><i class="bi bi-people"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${users.filter((u) => u.status === 'active').length}</div>
              <div class="stat-label">Active Users</div>
            </div>
            <div class="stat-icon green"><i class="bi bi-person-check"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${roles.length}</div>
              <div class="stat-label">Roles</div>
            </div>
            <div class="stat-icon orange"><i class="bi bi-shield-lock"></i></div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="stat-value">${users.filter((u) => u.status === 'inactive').length}</div>
              <div class="stat-label">Inactive Users</div>
            </div>
            <div class="stat-icon red"><i class="bi bi-person-x"></i></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="searchUser" placeholder="Search by name or email...">
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" id="filterRole">
              <option value="">All Roles</option>
              ${roles.map((r) => `<option value="${r.name}">${r.label}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-secondary w-100" id="resetFilters">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="mb-0">System Users</h6>
            <span class="text-muted">${users.length} users</span>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody id="usersTableBody">
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">Roles & Permissions</h6>
          </div>
          <div class="card-body">
            ${roles.map((r) => `
              <div class="mb-3 pb-3 border-bottom">
                <div class="d-flex align-items-center mb-2">
                  <span class="badge bg-${r.color} me-2">${r.label}</span>
                  <small class="text-muted">${users.filter((u) => u.role === r.name).length} users</small>
                </div>
                <div class="d-flex flex-wrap gap-1">
                  ${r.permissions.map((p) => `<small class="badge bg-light text-dark">${p}</small>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function initUsers(): Promise<void> {
  await loadRoles();
  populateRoleFilter();
  loadUsers();

  document.getElementById('searchUser')?.addEventListener('input', renderTable);
  document.getElementById('filterRole')?.addEventListener('change', renderTable);
  document.getElementById('filterStatus')?.addEventListener('change', renderTable);
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    (document.getElementById('searchUser') as HTMLInputElement).value = '';
    (document.getElementById('filterRole') as HTMLSelectElement).value = '';
    (document.getElementById('filterStatus') as HTMLSelectElement).value = '';
    renderTable();
  });

  document.getElementById('addUserBtn')?.addEventListener('click', () => showUserModal());
}

function populateRoleFilter(): void {
  const roleFilter = document.getElementById('filterRole') as HTMLSelectElement;
  if (roleFilter && roles.length > 0) {
    roleFilter.innerHTML = `<option value="">All Roles</option>` +
      roles.map((r) => `<option value="${r.name}">${r.label}</option>`).join('');
  }
}

async function loadRoles(): Promise<void> {
  try {
    const data = await authService.getAllRoles();
    roles = data
      .filter((r) => r.name !== 'SUPER_ADMIN')
      .map((r) => ({
        id: r.id,
        name: r.name,
        label: roleConfig[r.name]?.label || r.name,
        color: roleConfig[r.name]?.color || 'secondary',
        description: r.description || '',
        permissions: roleConfig[r.name]?.permissions || [],
      }));
  } catch {
    roles = Object.entries(roleConfig).map(([name, cfg], i) => ({
      id: i + 1,
      name,
      label: cfg.label,
      color: cfg.color,
      description: '',
      permissions: cfg.permissions,
    }));
  }
}

async function loadUsers(): Promise<void> {
  try {
    const data = await authService.getAllUsers();
    users = data.map((u) => ({
      id: u.id,
      name: u.full_name || u.username,
      email: u.email,
      phone: u.phone || '',
      role: u.role_name || 'user',
      role_id: u.role_id,
      status: u.is_active ? 'active' : 'inactive',
      last_login: '',
      avatar: (u.full_name || u.username).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
    }));
  } catch {
    users = [];
  }
  renderTable();
}

function renderTable(): void {
  const search = (document.getElementById('searchUser') as HTMLInputElement)?.value.toLowerCase() || '';
  const role = (document.getElementById('filterRole') as HTMLSelectElement)?.value || '';
  const status = (document.getElementById('filterStatus') as HTMLSelectElement)?.value || '';

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
    const matchRole = !role || u.role === role;
    const matchStatus = !status || u.status === status;
    return matchSearch && matchRole && matchStatus;
  });

  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  const roleColors: Record<string, string> = {
    admin: 'danger',
    stock_manager: 'warning',
    cashier: 'success',
  };

  const avatarColors: Record<string, string> = {
    admin: 'bg-danger',
    stock_manager: 'bg-warning',
    cashier: 'bg-success',
  };

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-5">
          <div class="text-muted">
            <i class="bi bi-people fs-1 d-block mb-2"></i>
            <h6>No users found</h6>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((u) => `
    <tr>
      <td>
        <div class="d-flex align-items-center">
          <div class="${avatarColors[u.role] || 'bg-secondary'} text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 36px; height: 36px; font-size: 12px; font-weight: 600;">
            ${u.avatar}
          </div>
          <div>
            <div class="fw-semibold">${u.name}</div>
            <small class="text-muted">${u.email}</small>
          </div>
        </div>
      </td>
      <td><span class="badge bg-${roleColors[u.role] || 'secondary'} text-capitalize">${u.role}</span></td>
      <td><span class="badge-status ${u.status === 'active' ? 'badge-success' : 'badge-secondary'} text-capitalize">${u.status}</span></td>
      <td>${u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
      <td class="text-end">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary edit-btn" data-id="${u.id}" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-danger toggle-btn" data-id="${u.id}" title="${u.status === 'active' ? 'Deactivate' : 'Activate'}">
            <i class="bi bi-${u.status === 'active' ? 'person-x' : 'person-check'}"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0');
      showUserModal(id);
    });
  });

  tbody.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.getAttribute('data-id') || '0');
      const user = users.find((u) => u.id === id);
      if (user) {
        const newActive = user.status !== 'active';
        if (await confirmAction('Toggle User Status?', 'Are you sure you want to change this user status.')) {
          try {
            await authService.updateUser(id, { is_active: newActive });
            await loadUsers();
            successToast('User status updated!');
          } catch {
            errorToast('Failed to update user status.');
          }
        }
      }
    });
  });
}

function showUserModal(editId?: number): void {
  const isEdit = editId !== undefined;
  const user = isEdit ? users.find((u) => u.id === editId) : null;

  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${isEdit ? 'Edit User' : 'Add New User'}</h5>
          <button type="button" class="btn-close modal-close-btn"></button>
        </div>
        <div class="modal-body">
          <form id="userForm">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Full Name *</label>
                <input type="text" class="form-control" id="userName" required value="${user?.name || ''}">
              </div>
              <div class="col-md-6">
                <label class="form-label">Email *</label>
                <input type="email" class="form-control" id="userEmail" required value="${user?.email || ''}">
              </div>
              <div class="col-md-6">
                <label class="form-label">Phone</label>
                <input type="tel" class="form-control" id="userPhone" value="${user?.phone || ''}">
              </div>
              <div class="col-md-6">
                <label class="form-label">Role *</label>
                <select class="form-select" id="userRole" required>
                  ${roles.map((r) => `<option value="${r.id}" ${user?.role_id === r.id ? 'selected' : ''}>${r.label}</option>`).join('')}
                </select>
              </div>
              ${!isEdit ? `
                <div class="col-md-6">
                  <label class="form-label">Username *</label>
                  <input type="text" class="form-control" id="userUsername" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Password *</label>
                  <input type="password" class="form-control" id="userPassword" required>
                </div>
              ` : ''}
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
          <button type="button" class="btn btn-brand-green" id="saveUserBtn">
            <i class="bi bi-check-lg me-2"></i>${isEdit ? 'Update' : 'Add'} User
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

  modal.querySelector('#saveUserBtn')?.addEventListener('click', async () => {
    const name = (modal.querySelector('#userName') as HTMLInputElement).value;
    const email = (modal.querySelector('#userEmail') as HTMLInputElement).value;
    const phone = (modal.querySelector('#userPhone') as HTMLInputElement).value;
    const roleId = parseInt((modal.querySelector('#userRole') as HTMLSelectElement).value);

    if (!name || !email || !roleId) {
      alert('Please fill required fields');
      return;
    }

    try {
      if (isEdit && user) {
        await authService.updateUser(user.id, {
          email,
          full_name: name,
          phone: phone || undefined,
          role_id: roleId,
        });
      } else {
        const username = (modal.querySelector('#userUsername') as HTMLInputElement)?.value;
        const password = (modal.querySelector('#userPassword') as HTMLInputElement)?.value;
        if (!username || !password) {
          alert('Username and password are required');
          return;
        }
        await authService.createUser({
          username,
          email,
          password,
          full_name: name,
          phone: phone || undefined,
          role_id: roleId,
        });
      }
      await loadUsers();
      modal.remove();
      successToast('User saved successfully!');
    } catch (err: any) {
      errorToast(err?.response?.data?.message || 'Failed to save user');
    }
  });
}
