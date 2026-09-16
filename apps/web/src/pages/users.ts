interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  last_login: string;
  created_at: string;
  avatar: string;
}

const users: User[] = [
  { id: 1, name: 'Super Admin', email: 'admin@hussainsons.com', phone: '0321-1234567', role: 'admin', status: 'active', last_login: '2026-09-13T10:30:00', created_at: '2024-01-01', avatar: 'SA' },
  { id: 2, name: 'Ahmed Raza', email: 'ahmed.raza@hussainsons.com', phone: '0333-1234567', role: 'pharmacist', status: 'active', last_login: '2026-09-13T09:15:00', created_at: '2024-03-15', avatar: 'AR' },
  { id: 3, name: 'Sara Bibi', email: 'sara@hussainsons.com', phone: '0300-1234567', role: 'cashier', status: 'active', last_login: '2026-09-12T18:00:00', created_at: '2024-06-20', avatar: 'SB' },
  { id: 4, name: 'Usman Ali', email: 'usman@hussainsons.com', phone: '0311-1234567', role: 'inventory', status: 'active', last_login: '2026-09-11T16:45:00', created_at: '2025-01-10', avatar: 'UA' },
  { id: 5, name: 'Fatima Noor', email: 'fatima@hussainsons.com', phone: '0322-1234567', role: 'accountant', status: 'active', last_login: '2026-09-10T14:30:00', created_at: '2025-04-05', avatar: 'FN' },
  { id: 6, name: 'Hassan Shah', email: 'hassan@hussainsons.com', phone: '0345-1234567', role: 'cashier', status: 'inactive', last_login: '2026-08-15T12:00:00', created_at: '2025-06-01', avatar: 'HS' },
];

const roles = [
  { name: 'admin', label: 'Admin', color: 'danger', permissions: ['Full System Access', 'Manage Users', 'Settings', 'All Reports'] },
  { name: 'pharmacist', label: 'Pharmacist', color: 'primary', permissions: ['POS', 'Medicines', 'Inventory', 'Sales', 'Purchases'] },
  { name: 'cashier', label: 'Cashier', color: 'success', permissions: ['POS', 'Sales', 'Customers'] },
  { name: 'inventory', label: 'Inventory Manager', color: 'warning', permissions: ['Inventory', 'Purchases', 'Medicines'] },
  { name: 'accountant', label: 'Accountant', color: 'info', permissions: ['Chart of Accounts', 'Journal Entries', 'Reports', 'Expenses'] },
];

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

export function initUsers(): void {
  renderTable();
  
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
    pharmacist: 'primary',
    cashier: 'success',
    inventory: 'warning',
    accountant: 'info',
  };

  const avatarColors: Record<string, string> = {
    admin: 'bg-danger',
    pharmacist: 'bg-primary',
    cashier: 'bg-success',
    inventory: 'bg-warning',
    accountant: 'bg-info',
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
      <td>${new Date(u.last_login).toLocaleString()}</td>
      <td class="text-end">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary edit-btn" data-id="${u.id}" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-secondary reset-btn" data-id="${u.id}" title="Reset Password">
            <i class="bi bi-key"></i>
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

  tbody.querySelectorAll('.reset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0');
      const user = users.find((u) => u.id === id);
      if (user && confirm(`Reset password for "${user.name}"?`)) {
        alert(`Password reset email sent to ${user.email}`);
      }
    });
  });

  tbody.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id') || '0');
      const user = users.find((u) => u.id === id);
      if (user) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        if (confirm(`${newStatus === 'active' ? 'Activate' : 'Deactivate'} user "${user.name}"?`)) {
          user.status = newStatus;
          renderTable();
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
                <label class="form-label">Phone *</label>
                <input type="tel" class="form-control" id="userPhone" required value="${user?.phone || ''}">
              </div>
              <div class="col-md-6">
                <label class="form-label">Role *</label>
                <select class="form-select" id="userRole" required>
                  ${roles.map((r) => `<option value="${r.name}" ${user?.role === r.name ? 'selected' : ''}>${r.label}</option>`).join('')}
                </select>
              </div>
              ${!isEdit ? `
                <div class="col-md-6">
                  <label class="form-label">Password *</label>
                  <input type="password" class="form-control" id="userPassword" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Confirm Password *</label>
                  <input type="password" class="form-control" id="userConfirmPassword" required>
                </div>
              ` : ''}
              <div class="col-md-6">
                <label class="form-label">Status</label>
                <select class="form-select" id="userStatus">
                  <option value="active" ${user?.status === 'active' ? 'selected' : ''}>Active</option>
                  <option value="inactive" ${user?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
              </div>
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

  modal.querySelector('#saveUserBtn')?.addEventListener('click', () => {
    const name = (modal.querySelector('#userName') as HTMLInputElement).value;
    const email = (modal.querySelector('#userEmail') as HTMLInputElement).value;
    const phone = (modal.querySelector('#userPhone') as HTMLInputElement).value;
    const role = (modal.querySelector('#userRole') as HTMLSelectElement).value;
    const status = (modal.querySelector('#userStatus') as HTMLSelectElement).value;

    if (!name || !email || !phone || !role) {
      alert('Please fill required fields');
      return;
    }

    if (!isEdit) {
      const password = (modal.querySelector('#userPassword') as HTMLInputElement).value;
      const confirmPassword = (modal.querySelector('#userConfirmPassword') as HTMLInputElement).value;
      if (!password || password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
    }

    if (isEdit && user) {
      user.name = name;
      user.email = email;
      user.phone = phone;
      user.role = role;
      user.status = status;
      alert('User updated successfully!');
    } else {
      const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
      users.push({
        id: users.length + 1,
        name,
        email,
        phone,
        role,
        status,
        last_login: 'Never',
        created_at: new Date().toISOString().split('T')[0],
        avatar: initials,
      });
      alert('User added successfully!');
    }

    renderTable();
    modal.remove();
  });
}
