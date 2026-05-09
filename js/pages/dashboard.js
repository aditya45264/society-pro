async function renderDashboard() {
  const container = document.getElementById('page-container');
  container.innerHTML = loading();
  try {
    if (isCommittee(currentUser.role)) {
      await renderCommitteeDashboard(container);
    } else {
      await renderMemberDashboard(container);
    }
  } catch (err) {
    container.innerHTML = `<div class="form-error">${err.message}</div>`;
  }
}

async function renderCommitteeDashboard(container) {
  const [statsRes, mainRes, noticesRes] = await Promise.all([
    api.get('/dashboard/stats'),
    api.get('/maintenance/current'),
    api.get('/notices')
  ]);
  const s = statsRes.stats;
  const curr = mainRes.schedule;
  const notices = noticesRes.notices || [];
  const pct = s.paid + s.pending + s.overdue > 0 ? Math.round((s.paid / (s.paid + s.pending + s.overdue)) * 100) : 0;
  const maxTrend = Math.max(...s.trend.map(t => t.collected), 1);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">Good ${getGreeting()}, ${currentUser.name.split(' ')[0]}! 👋</div>
      <div class="page-subtitle">Society overview for ${new Date().toLocaleDateString('en-IN', {month:'long',year:'numeric'})}</div>
    </div>
    <div class="stat-grid">
      <div class="stat-card blue">
        <div class="stat-label">Total Members</div>
        <div class="stat-value">${s.totalMembers}</div>
        <div class="stat-note">Active residents</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">Paid This Month</div>
        <div class="stat-value">${s.paid}</div>
        <div class="stat-note">${formatCurrency(s.totalCollected)} collected</div>
      </div>
      <div class="stat-card amber">
        <div class="stat-label">Pending</div>
        <div class="stat-value">${s.pending}</div>
        <div class="stat-note">Awaiting payment</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">Overdue</div>
        <div class="stat-value">${s.overdue}</div>
        <div class="stat-note">${formatCurrency(s.totalDues)} outstanding</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
      <div class="card">
        <div class="card-header"><span class="card-title">This Month's Maintenance</span></div>
        <div class="card-body">
          ${curr ? `
            <div style="font-size:32px;font-weight:700;color:var(--accent);margin-bottom:8px;">${formatCurrency(curr.amount)}</div>
            <div style="font-size:13px;color:var(--text2);margin-bottom:4px;">Due: ${formatDate(curr.dueDate)}</div>
            ${curr.description ? `<div style="font-size:13px;color:var(--text2);">${curr.description}</div>` : ''}
            <div style="margin-top:14px;">
              <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text3);margin-bottom:4px;">
                <span>Collection Progress</span><span>${pct}%</span>
              </div>
              <div class="collection-bar"><div class="collection-fill" style="width:${pct}%"></div></div>
            </div>` :
            `<div style="color:var(--text3);font-size:14px;">No maintenance issued for this month yet.<br>
            <a href="#" onclick="navigateTo('maintenance')" style="color:var(--accent);">Issue maintenance →</a></div>`}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Collection Trend</span></div>
        <div class="card-body">
          <div class="trend-bars">
            ${s.trend.map(t => {
              const h = Math.max(4, Math.round((t.collected / maxTrend) * 72));
              return `<div class="trend-bar-wrap">
                <div class="trend-bar" style="height:${h}px" title="${MONTHS[t.month-1]} ${t.year}: ${formatCurrency(t.collected)}"></div>
                <div class="trend-bar-label">${MONTHS[t.month-1]}</div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Recent Notices</span>
        <button class="btn-primary btn-sm" onclick="navigateTo('notices')">View All</button>
      </div>
      <div class="card-body" style="padding:0">
        ${notices.length === 0 ? `<div style="padding:20px;">${empty('No active notices', '📢')}</div>` :
          `<div style="padding:16px;display:flex;flex-direction:column;gap:10px;">
            ${notices.slice(0,3).map(n => `
              <div class="notice-card ${n.category}">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <span class="badge badge-${n.category}">${n.category}</span>
                  <span class="notice-title" style="margin:0;font-size:14px;">${n.title}</span>
                </div>
                <div class="notice-content">${n.content.substring(0,100)}${n.content.length>100?'...':''}</div>
              </div>`).join('')}
          </div>`}
      </div>
    </div>`;
}

async function renderMemberDashboard(container) {
  const [statsRes, mainRes, noticesRes] = await Promise.all([
    api.get('/dashboard/member-stats'),
    api.get('/maintenance/current'),
    api.get('/notices')
  ]);
  const s = statsRes.stats;
  const curr = mainRes.schedule;
  const notices = noticesRes.notices || [];

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">Hello, ${currentUser.name.split(' ')[0]}! 👋</div>
      <div class="page-subtitle">Flat ${currentUser.flatNumber} — Payment overview</div>
    </div>
    <div class="stat-grid">
      <div class="stat-card green">
        <div class="stat-label">Paid</div>
        <div class="stat-value">${s.paid}</div>
        <div class="stat-note">${formatCurrency(s.totalPaid)} total</div>
      </div>
      <div class="stat-card amber">
        <div class="stat-label">Pending</div>
        <div class="stat-value">${s.pending}</div>
        <div class="stat-note">To be paid</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">Overdue</div>
        <div class="stat-value">${s.overdue}</div>
        <div class="stat-note">${formatCurrency(s.totalDues)} dues</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
      <div class="card">
        <div class="card-header"><span class="card-title">Current Month</span></div>
        <div class="card-body">
          ${curr ? `
            <div style="font-size:32px;font-weight:700;color:var(--accent);margin-bottom:8px;">${formatCurrency(curr.amount)}</div>
            <div style="font-size:13px;color:var(--text2);">Due by ${formatDate(curr.dueDate)}</div>
            ${curr.lateFee ? `<div style="font-size:12px;color:var(--amber);margin-top:4px;">Late fee: ${formatCurrency(curr.lateFee)}</div>` : ''}
            <div style="margin-top:14px;">
              <a href="#" onclick="navigateTo('my-payments')" class="btn-primary btn-sm">View My Payments</a>
            </div>` :
            `<p style="color:var(--text3);font-size:13px;">No maintenance issued yet.</p>`}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Notices</span></div>
        <div class="card-body" style="padding:12px;display:flex;flex-direction:column;gap:8px;">
          ${notices.length === 0 ? `<p style="color:var(--text3);font-size:13px;">No active notices.</p>` :
            notices.slice(0,4).map(n => `
              <div style="border-bottom:1px solid var(--border);padding-bottom:8px;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span class="badge badge-${n.category}">${n.category}</span>
                  <span style="font-size:13px;font-weight:600;">${n.title}</span>
                </div>
                <div style="font-size:12px;color:var(--text2);margin-top:3px;">${n.content.substring(0,60)}${n.content.length>60?'...':''}</div>
              </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}