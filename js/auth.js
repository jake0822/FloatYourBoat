/**
 * auth.js — FloatYourBoat Authentication Module
 * Handles login, registration, session management, and nav rendering.
 */

// ── Session ───────────────────────────────────────────────────────────────────
function getCurrentUser() {
  const raw = sessionStorage.getItem(FYB.KEYS.CURRENT_USER);
  return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
  sessionStorage.setItem(FYB.KEYS.CURRENT_USER, JSON.stringify(user));
}

function logout() {
  sessionStorage.removeItem(FYB.KEYS.CURRENT_USER);
  window.location.href = 'index.html';
}

/**
 * Redirect to login if no user is in session.
 * Call from pages that require authentication.
 */
function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = 'index.html';
  }
}

/**
 * Redirect to login if no user, or if user is not a buyer.
 */
function requireBuyer() {
  const user = getCurrentUser();
  if (!user || user.role !== 'buyer') {
    window.location.href = user ? 'browse.html' : 'index.html';
  }
}

/**
 * Redirect to login if no user, or if user is not a seller.
 */
function requireSeller() {
  const user = getCurrentUser();
  if (!user || user.role !== 'seller') {
    window.location.href = user ? 'browse.html' : 'index.html';
  }
}

// ── Login ──────────────────────────────────────────────────────────────────────
function login(username, password) {
  const user = FYB.getUserByUsername(username.trim());
  if (!user) return { error: 'No account found with that username.' };
  if (user.password !== password) return { error: 'Incorrect password.' };
  setCurrentUser(user);
  return { user };
}

// ── Register ───────────────────────────────────────────────────────────────────
function register(username, password, name, email, role) {
  if (!username || !password || !name || !email || !role) {
    return { error: 'All fields are required.' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }
  const result = FYB.registerUser({ username: username.trim(), password, name: name.trim(), email: email.trim(), role });
  if (result.error) return result;
  setCurrentUser(result);
  return { user: result };
}

// ── Navigation Rendering ───────────────────────────────────────────────────────
/**
 * Render the shared navbar into any element with id="navbar".
 * Highlights the active page link based on the current filename.
 */
function renderNav() {
  const el = document.getElementById('navbar');
  if (!el) return;

  const user = getCurrentUser();
  const page = location.pathname.split('/').pop() || 'index.html';

  const active = (href) => page === href ? 'active' : '';

  let navLinks = `
    <a href="browse.html" class="${active('browse.html')}">Browse</a>
  `;

  let userSection = '';
  if (user) {
    if (user.role === 'buyer') {
      navLinks += `<a href="saved.html" class="${active('saved.html')}">Saved</a>`;
    }
    if (user.role === 'seller') {
      navLinks += `<a href="seller.html" class="${active('seller.html')}">My Listings</a>`;
    }
    userSection = `
      <div class="user-info">
        <span>Hi, ${escapeHtml(user.name.split(' ')[0])}</span>
        <span class="role-badge">${escapeHtml(user.role)}</span>
        <button class="btn btn-outline btn-sm" onclick="FYBAuth.logout()">Logout</button>
      </div>
    `;
  } else {
    userSection = `<a href="index.html" class="btn btn-outline btn-sm ${active('index.html')}">Login</a>`;
  }

  el.innerHTML = `
    <a href="browse.html" class="brand">
      <span class="anchor-icon">⚓</span> FloatYourBoat
    </a>
    <nav>${navLinks}</nav>
    ${userSection}
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Exports ───────────────────────────────────────────────────────────────────
window.FYBAuth = {
  getCurrentUser,
  setCurrentUser,
  logout,
  requireAuth,
  requireBuyer,
  requireSeller,
  login,
  register,
  renderNav,
  escapeHtml,
};
