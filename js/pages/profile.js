async function renderProfile() {
  const container = document.getElementById('page-container');
  const u = currentUser;
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">My Profile</div>
      <div class="page-subtitle">Manage your account details</div>
    </div>
    <div style="max-width:540px;">
      <div class="card" style="margin-bottom:20px;">
        <div class="card-body" style="display:flex;align-items:center;gap:16px;">
          <div style="width:60px;height:60px;border-radius:50%;background:var(--accent-light);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:var(--accent);">
            ${u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-size:18px;font-weight:700">${u.name}</div>
            <div style="color:var(--text2);font-size:13px">${u.email}</div>
            <div style="margin-top:6px;display:flex;gap:8px;">
              ${roleBadge(u.role)}
              <span class="badge badge-member">Flat ${u.flatNumber}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Edit Profile</span></div>
        <div class="card-body">
          <form id="profile-form" style="display:flex;flex-direction:column;gap:16px;">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" id="pf-name" value="${u.name}">
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" id="pf-phone" value="${u.phone || ''}">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Wing</label>
                <input type="text" id="pf-wing" value="${u.wing || ''}">
              </div>
              <div class="form-group">
                <label>Flat Number</label>
                <input type="text" value="${u.flatNumber}" disabled style="opacity:0.6;cursor:not-allowed">
              </div>
            </div>
            <div id="pf-error" class="form-error hidden"></div>
            <button type="submit" class="btn-primary">Save Changes</button>
          </form>
        </div>
      </div>
    </div>`;

  document.getElementById('profile-form').addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = document.getElementById('pf-error');
    errEl.classList.add('hidden');
    try {
      const res = await api.put('/auth/profile', {
        name: document.getElementById('pf-name').value,
        phone: document.getElementById('pf-phone').value,
        wing: document.getElementById('pf-wing').value
      });
      currentUser = { ...currentUser, ...res.user };
      localStorage.setItem('user', JSON.stringify(currentUser));
      toast('Profile updated!', 'success');
      updateSidebarUser();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
  });
}