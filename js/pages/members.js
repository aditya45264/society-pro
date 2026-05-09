async function renderMembers() {
  if (!isCommittee(currentUser.role)) {
    document.getElementById('page-container').innerHTML = `<div class="form-error">Access denied. Committee only.</div>`;
    return;
  }
  const container = document.getElementById('page-container');
  container.innerHTML = loading();
  try {
    const res = await api.get('/members');
    let members = res.members || [];

    const renderTable = (list) => {
      if (list.length === 0) return empty('No members found');
      return `
        <table>
          <thead><tr><th>Flat</th><th>Name</th><th>Wing</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${list.map(m => `
              <tr>
                <td><strong>${m.flatNumber}</strong></td>
                <td>${m.name}</td>
                <td>${m.wing || '—'}</td>
                <td style="font-size:12px">${m.email}</td>
                <td style="font-size:12px">${m.phone || '—'}</td>
                <td>${roleBadge(m.role)}</td>
                <td style="font-size:12px">${formatDate(m.joinedDate)}</td>
                <td><span class="badge ${m.isActive ? 'badge-paid' : 'badge-overdue'}">${m.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div class="action-btns">
                    <button class="btn-secondary btn-sm" onclick="editMember('${m._id}')">Edit</button>
                    ${currentUser.role === 'chairman' && m._id !== currentUser.id ? `<button class="btn-danger btn-sm" onclick="deactivateMember('${m._id}','${m.name}')">Deactivate</button>` : ''}
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>`;
    };

    container.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Members</div>
          <div class="page-subtitle">${members.length} residents registered</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">All Members</span>
          <div class="filters" style="margin:0">
            <input class="search-input" id="member-search" placeholder="Search name or flat..." oninput="filterMembers()">
            <select id="role-filter" onchange="filterMembers()">
              <option value="">All Roles</option>
              <option value="member">Member</option>
              <option value="secretary">Secretary</option>
              <option value="treasurer">Treasurer</option>
              <option value="chairman">Chairman</option>
            </select>
          </div>
        </div>
        <div class="table-wrap" id="members-table">${renderTable(members)}</div>
      </div>`;

    window._allMembers = members;
    window.filterMembers = () => {
      const q = document.getElementById('member-search').value.toLowerCase();
      const role = document.getElementById('role-filter').value;
      const filtered = window._allMembers.filter(m =>
        (!q || m.name.toLowerCase().includes(q) || m.flatNumber.toLowerCase().includes(q)) &&
        (!role || m.role === role)
      );
      document.getElementById('members-table').innerHTML = renderTable(filtered);
    };
  } catch (err) {
    container.innerHTML = `<div class="form-error">${err.message}</div>`;
  }
}

async function editMember(id) {
  try {
    const res = await api.get(`/members/${id}`);
    const m = res.member;
    const html = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Edit Member</span>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <div style="display:flex;flex-direction:column;gap:16px;">
            <div class="form-row">
              <div class="form-group"><label>Name</label><input id="em-name" value="${m.name}"></div>
              <div class="form-group"><label>Flat</label><input id="em-flat" value="${m.flatNumber}"></div>
            </div>
            <div class="form-group"><label>Email</label><input id="em-email" type="email" value="${m.email}"></div>
            <div class="form-row">
              <div class="form-group"><label>Phone</label><input id="em-phone" value="${m.phone||''}"></div>
              <div class="form-group"><label>Wing</label><input id="em-wing" value="${m.wing||''}"></div>
            </div>
            <div class="form-group">
              <label>Role</label>
              <select id="em-role">
                <option value="member" ${m.role==='member'?'selected':''}>Member</option>
                <option value="secretary" ${m.role==='secretary'?'selected':''}>Secretary</option>
                <option value="treasurer" ${m.role==='treasurer'?'selected':''}>Treasurer</option>
                <option value="chairman" ${m.role==='chairman'?'selected':''}>Chairman</option>
              </select>
            </div>
            <div id="em-error" class="form-error hidden"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="closeModal()">Cancel</button>
          <button class="btn-primary" id="em-save">Save Changes</button>
        </div>
      </div>`;
    openModal(html);
    document.getElementById('em-save').addEventListener('click', async () => {
      const errEl = document.getElementById('em-error');
      errEl.classList.add('hidden');
      try {
        await api.put(`/members/${id}`, {
          name: document.getElementById('em-name').value,
          email: document.getElementById('em-email').value,
          flatNumber: document.getElementById('em-flat').value,
          phone: document.getElementById('em-phone').value,
          wing: document.getElementById('em-wing').value,
          role: document.getElementById('em-role').value
        });
        closeModal();
        toast('Member updated!', 'success');
        renderMembers();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
      }
    });
  } catch (err) {
    toast(err.message, 'error');
  }
}

function deactivateMember(id, name) {
  confirm(`Deactivate ${name}? They will no longer have access.`, async () => {
    try {
      await api.delete(`/members/${id}`);
      toast(`${name} deactivated`, 'info');
      renderMembers();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}