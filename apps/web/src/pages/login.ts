export function renderLoginPage(): string {
  return `
    <div class="login-page">
      <div class="login-left">
        <div class="brand-logo">
          <img src="/POS logo.png" alt="Hussain Son's Pharmacy Logo" class="logo-img" />
        </div>
        <h1>Hussain Son's Pharmacy</h1>
        <p>POS & Management System</p>
        <div class="features">
          <div class="feature-item">
            <i class="bi bi-cart-check"></i>
            <span>Point of Sale</span>
          </div>
          <div class="feature-item">
            <i class="bi bi-box-seam"></i>
            <span>Inventory</span>
          </div>
          <div class="feature-item">
            <i class="bi bi-graph-up"></i>
            <span>Reports</span>
          </div>
          <div class="feature-item">
            <i class="bi bi-shield-check"></i>
            <span>Secure</span>
          </div>
        </div>
        <div class="demo-credentials">
          <p><strong>Demo Credentials:</strong></p>
          <small>Admin: admin / admin123</small><br>
          <small>Cashier: cashier / cashier123</small><br>
          <small>Stock: stockmanager / stock123</small>
        </div>
      </div>
      <div class="login-right">
        <div class="login-form">
          <div class="form-header">
            <div class="user-avatar">
              <i class="bi bi-person"></i>
            </div>
            <h2>Welcome Back</h2>
            <p>Sign in to your account</p>
          </div>
          <form id="loginForm">
            <div id="loginError" class="login-error" style="display:none;"></div>
            <div class="form-floating mb-3">
              <input
                type="text"
                class="form-control"
                id="username"
                placeholder="Username or Email"
                required
              />
              <label for="username">Username / Email</label>
            </div>
            <div class="form-floating mb-3 password-wrapper">
              <input
                type="password"
                class="form-control"
                id="password"
                placeholder="Password"
                required
              />
              <label for="password">Password</label>
              <button type="button" class="password-toggle" id="togglePassword">
                <i class="bi bi-eye-slash"></i>
              </button>
            </div>
            <div class="form-options">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="remember" checked />
                <label class="form-check-label" for="remember">Remember me</label>
              </div>
              <a href="#" class="forgot-link">Forgot Password?</a>
            </div>
            <button type="submit" class="btn btn-login">
              <i class="bi bi-box-arrow-in-right me-2"></i>Sign In
            </button>
            <div class="create-account">
              <span class="text-muted">Don't have an account? </span>
              <a href="#">Contact Admin</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}
