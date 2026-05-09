const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function formatCurrency(n) {
  return '₹' + (n || 0).toLocaleString('en-IN');
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function monthName(m) { return MONTH_NAMES[m - 1] || ''; }

function loading() {
  return `<div class="loading"><div class="spinner"></div></div>`;
}

function empty(msg = 'No data found', icon = '📭') {
  return `<div class="empty"><div class="empty-icon">${icon}</div><p>${msg}</p></div>`;
}

function openModal(html) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = html;
  document.getElementById('modals').appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  return overlay;
}

function closeModal() {
  const m = document.querySelector('.modal-overlay');
  if (m) m.remove();
}

function isCommittee(role) {
  return ['secretary', 'treasurer', 'chairman'].includes(role);
}

function roleBadge(role) {
  return `<span class="badge badge-${role}">${role}</span>`;
}

function statusBadge(status) {
  const icons = { paid: '✓', pending: '◷', overdue: '!' };
  return `<span class="badge badge-${status}">${icons[status] || ''} ${status}</span>`;
}

function confirm(msg, onYes) {
  const html = `
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">Confirm</span>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body"><p>${msg}</p></div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn-danger" id="confirm-yes">Yes, confirm</button>
      </div>
    </div>`;
  const overlay = openModal(html);
  overlay.querySelector('#confirm-yes').addEventListener('click', () => { closeModal(); onYes(); });
}