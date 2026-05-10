const ROUTES = {
  dashboard: renderDashboard,
  maintenance: renderMaintenance,
  payments: renderPayments,
  'my-payments': renderMyPayments,
  dues: renderDues,
  members: renderMembers,
  notices: renderNotices,
  profile: renderProfile
};

const MEMBER_NAV = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'my-payments', icon: '💳', label: 'My Payments' },
  { id: 'notices', icon: '📢', label: 'Notice Board' },
  { id: 'profile', icon: '👤', label: 'My Profile' }
];

const COMMITTEE_NAV = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'maintenance', icon: '🔧', label: 'Maintenance' },
  { id: 'payments', icon: '💳', label: 'Payments' },
  { id: 'dues', icon: '⚠️', label: 'Dues & Arrears' },
  { id: 'members', icon: '👥', label: 'Members' },
  { id: 'notices', icon: '📢', label: 'Notices' },
  { id: 'profile', icon: '👤', label: 'My Profile' }
];

let currentPage = 'dashboard';

function buildNav() {
  const nav = isCommittee(currentUser.role) ? COMMITTEE_NAV : MEMBER_NAV;
  const navEl = document.getElementById('sidebar-nav');
  navEl.innerHTML = nav.map(item => `
    <li>
      <a href="#" class="${item.id === currentPage ? 'active' : ''}" data-page="${item.id}">
        <span class="nav-icon">${item.icon}</span>
        ${item.label}
      </a>
    </li>`).join('');

  navEl.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });
}

function updateSidebarUser() {
  document.getElementById('sidebar-user').innerHTML = `
    <div class="user-name">${currentUser.name}</div>
    <div class="user-role">${currentUser.customRole || currentUser.role}</div>
    <div class="user-flat">Flat ${currentUser.flatNumber}</div>`;
}

function navigateTo(page) {
  if (!ROUTES[page]) return;
  currentPage = page;
  document.querySelectorAll('#sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
  ROUTES[page]();
  window.scrollTo(0, 0);
}

function initApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  updateSidebarUser();
  buildNav();
  navigateTo('dashboard');
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
  });
  document.getElementById('sidebar-overlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
  });
  if (checkAuth()) {
    initApp();
  }
});