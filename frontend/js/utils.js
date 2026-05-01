// Utility functions shared across pages
function showAlert(msg, type = 'success') {
  const existing = document.querySelector('.alert');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  div.innerHTML = `${type === 'success' ? '✓' : '✕'} ${msg}`;
  document.querySelector('.container, .auth-container').prepend(div);
  setTimeout(() => { div.style.opacity = '0'; div.style.transform = 'translateY(-8px)'; setTimeout(() => div.remove(), 300); }, 4000);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateLong(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function isOverdue(dueDate, status) {
  if (!dueDate || status === 'Done') return false;
  const now = new Date(); now.setHours(0,0,0,0);
  return new Date(dueDate) < now;
}

function statusBadge(status) {
  const cls = status === 'To Do' ? 'badge-todo' : status === 'In Progress' ? 'badge-progress' : 'badge-done';
  return `<span class="badge ${cls}">${status}</span>`;
}

function roleBadge(role) {
  return `<span class="badge badge-${role === 'Admin' ? 'admin' : 'member'}">${role}</span>`;
}

function avatar(name) {
  return `<span class="assignee-avatar">${name.charAt(0).toUpperCase()}</span>`;
}

async function checkAuth() {
  try {
    const data = await API.me();
    return data.user;
  } catch { return null; }
}

function renderNavbar(user) {
  const nav = document.getElementById('navbar-content');
  if (!nav) return;
  if (user) {
    nav.innerHTML = `
      <li><a href="/dashboard.html" class="nav-link" id="nav-dashboard">Dashboard</a></li>
      <li><a href="/projects.html" class="nav-link" id="nav-projects">Projects</a></li>
      <li class="nav-user">
        <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
        <a href="#" class="nav-link" id="nav-logout">Logout</a>
      </li>`;
    document.getElementById('nav-logout').addEventListener('click', async (e) => {
      e.preventDefault();
      await API.logout();
      window.location.href = '/';
    });
  } else {
    nav.innerHTML = `
      <li><a href="/" class="nav-link" id="nav-login">Login</a></li>
      <li><a href="/signup.html" class="btn btn-primary btn-sm" id="nav-signup">Sign Up</a></li>`;
  }
}
