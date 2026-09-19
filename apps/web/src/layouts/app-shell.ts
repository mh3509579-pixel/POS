import { authService } from '../services/auth.service';
import { notificationService } from '../services/notification.service';

function hasPermission(page: string, role: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    admin: ['dashboard', 'pos', 'medicines', 'inventory', 'purchases', 'sales', 'customers', 'suppliers', 'expenses', 'chart-of-accounts', 'journal-entries', 'trial-balance', 'reports', 'users', 'audit', 'backup', 'settings'],
    stock_manager: ['dashboard', 'medicines', 'inventory', 'purchases', 'suppliers', 'sales'],
    cashier: ['dashboard', 'pos', 'customers'],
  };
  return rolePermissions[role]?.includes(page) ?? false;
}

export function renderAppShell(): string {
  const user = authService.getUser();
  const role = user?.role_name || 'admin';

  const navItems = [
    { section: 'Main', items: [
      { page: 'dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
      { page: 'pos', icon: 'bi-cart3', label: 'POS' },
    ]},
    { section: 'Inventory', items: [
      { page: 'medicines', icon: 'bi-capsule', label: 'Medicines' },
      { page: 'inventory', icon: 'bi-box-seam', label: 'Inventory' },
    ]},
    { section: 'Transactions', items: [
      { page: 'purchases', icon: 'bi-bag-plus', label: 'Purchases' },
      { page: 'sales', icon: 'bi-receipt', label: 'Sales' },
    ]},
    { section: 'People', items: [
      { page: 'customers', icon: 'bi-people', label: 'Customers' },
      { page: 'suppliers', icon: 'bi-truck', label: 'Suppliers' },
    ]},
    { section: 'Finance', items: [
      { page: 'expenses', icon: 'bi-wallet2', label: 'Expenses' },
      { page: 'chart-of-accounts', icon: 'bi-journal-bookmark', label: 'Chart of Accounts' },
      { page: 'journal-entries', icon: 'bi-journal-text', label: 'Journal Entries' },
      { page: 'trial-balance', icon: 'bi-calculator', label: 'Trial Balance' },
      { page: 'reports', icon: 'bi-bar-chart-line', label: 'Reports' },
    ]},
    { section: 'Administration', items: [
      { page: 'users', icon: 'bi-person-gear', label: 'Users' },
      { page: 'audit', icon: 'bi-journal-text', label: 'Audit Log' },
      { page: 'backup', icon: 'bi-cloud-upload', label: 'Backup' },
      { page: 'settings', icon: 'bi-gear', label: 'Settings' },
    ]},
  ];

  let sidebarNav = '';
  for (const group of navItems) {
    const visibleItems = group.items.filter((item) => hasPermission(item.page, role));
    if (visibleItems.length === 0) continue;
    sidebarNav += `<div class="nav-section">${group.section}</div>`;
    for (const item of visibleItems) {
      const activeClass = item.page === 'dashboard' ? ' active' : '';
      sidebarNav += `
        <a class="nav-item${activeClass}" data-page="${item.page}" href="#${item.page}">
          <i class="bi ${item.icon}"></i>
          <span>${item.label}</span>
        </a>`;
    }
  }

  return `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo-wrapper">
            <img src="/POS logo.png" alt="Hussain Son's Pharmacy" class="sidebar-logo" />
          </div>
          <div class="brand-text">
            <h5>Hussain Son's Pharmacy</h5>
            <small>POS & Management System</small>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${sidebarNav}
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">${user?.full_name?.substring(0, 2).toUpperCase() || 'GU'}</div>
            <div class="user-details">
              <div class="user-name">${user?.full_name || 'Guest User'}</div>
              <div class="user-role">${user?.role_name || 'User'}</div>
            </div>
            <button class="btn btn-link text-white p-0" title="Logout">
              <i class="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </aside>

      <main class="main-content">
        <header class="topbar">
          <div class="topbar-left">
            <button class="btn btn-link d-lg-none" id="toggleSidebar">
              <i class="bi bi-list fs-4"></i>
            </button>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="#dashboard">Home</a></li>
                <li class="breadcrumb-item active" id="breadcrumbPage">Dashboard</li>
              </ol>
            </nav>
          </div>
          <div class="topbar-right">
            <div class="notification-wrapper" style="position:relative">
              <button class="icon-btn" title="Notifications" id="notificationBtn">
                <i class="bi bi-bell"></i>
                <span class="badge" id="notificationBadge" style="display:none">0</span>
              </button>
              <div class="notification-dropdown" id="notificationDropdown" style="display:none;position:absolute;right:0;top:100%;width:360px;max-height:480px;overflow-y:auto;background:#fff;border:1px solid #dee2e6;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:1050;">
                <div style="padding:12px 16px;border-bottom:1px solid #dee2e6;display:flex;justify-content:space-between;align-items:center">
                  <strong>Notifications</strong>
                  <button class="btn btn-sm btn-link text-decoration-none p-0" id="markAllReadBtn">Mark all read</button>
                </div>
                <div id="notificationList"></div>
              </div>
            </div>
            <button class="icon-btn" title="Settings">
              <i class="bi bi-gear"></i>
            </button>
            <button class="icon-btn" title="Logout" id="logoutBtn">
              <i class="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </header>
        <div class="page-content" id="pageContent">
        </div>
      </main>
    </div>

    <script type="module">
      import { notificationService } from '../services/notification.service';

      const badge = document.getElementById('notificationBadge');
      const btn = document.getElementById('notificationBtn');
      const dropdown = document.getElementById('notificationDropdown');
      const list = document.getElementById('notificationList');
      const markAllBtn = document.getElementById('markAllReadBtn');

      async function loadNotifications() {
        try {
          const { data, unread_count } = await notificationService.getAll(20, 0);
          if (unread_count > 0) {
            badge.style.display = '';
            badge.textContent = unread_count > 99 ? '99+' : unread_count;
          } else {
            badge.style.display = 'none';
          }
          list.innerHTML = data.length === 0
            ? '<div class="text-center text-muted p-3">No notifications</div>'
            : data.map(n => \`
              <div class="notification-item" data-id="\${n.id}" style="padding:10px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;\${n.is_read ? '' : 'background:#f0f7ff;'}">
                <div style="display:flex;justify-content:space-between;align-items:start">
                  <div>
                    <div style="font-weight:\${n.is_read ? '400' : '600'};font-size:14px">\${n.title}</div>
                    <div style="font-size:12px;color:#666;margin-top:2px">\${n.message}</div>
                  </div>
                  <small class="text-muted" style="white-space:nowrap;margin-left:8px;font-size:11px">\${new Date(n.created_at).toLocaleString()}</small>
                </div>
              </div>
            \`).join('');

          list.querySelectorAll('.notification-item').forEach(el => {
            el.addEventListener('click', async () => {
              const id = Number(el.dataset.id);
              await notificationService.markAsRead(id);
              el.style.background = '';
              loadNotifications();
            });
          });
        } catch (e) {
          console.error('Failed to load notifications', e);
        }
      }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      });

      document.addEventListener('click', () => { dropdown.style.display = 'none'; });
      dropdown.addEventListener('click', (e) => e.stopPropagation());

      markAllBtn.addEventListener('click', async () => {
        await notificationService.markAllAsRead();
        loadNotifications();
      });

      loadNotifications();
      setInterval(loadNotifications, 60000);
    </script>
  `;
}
