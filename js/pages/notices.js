async function renderNotices() {
  const container = document.getElementById('page-container');
  container.innerHTML = loading();
  try {
    const res = await api.get('/notices');
    const notices = res.notices || [];
    const canPost = isCommittee(currentUser.role);

    container.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">Notice Board</div>
          <div class="page-subtitle">Society announcements and updates</div>
        </div>
        ${canPost ? `<button class="btn-primary" id="post-notice-btn">+ Post Notice</button>` : ''}
      </div>
      <div class="filters">
        <select id="notice-filter" onchange="filterNotices()">
          <option value="">All Categories</option>
          <option value="general">General</option>
          <option value="maintenance">Maintenance</option>
          <option value="meeting">Meeting</option>
          <option value="event">Event</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      <div class="notice-list" id="notice-list">
        ${renderNoticeList(notices, canPost)}
      </div>`;

    window._allNotices = notices;
    window.filterNotices = () => {
      const cat = document.getElementById('notice-filter').value;
      const filtered = cat ? window._allNotices.filter(n => n.category === cat) : window._allNotices;
      document.getElementById('notice-list').innerHTML = renderNoticeList(filtered, canPost);
    };

    if (canPost) {
      document.getElementById('post-notice-btn').addEventListener('click', showPostModal);
    }
  } catch (err) {
    container.innerHTML = `<div class="form-error">${err.message}</div>`;
  }
}

function renderNoticeList(notices, canPost) {
  if (notices.length === 0) return empty('No notices posted yet', '📢');
  return notices.map(n => `
    <div class="notice-card ${n.category}" id="notice-${n._id}">
      ${canPost ? `<button class="notice-delete" onclick="deleteNotice('${n._id}')">×</button>` : ''}
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span class="badge badge-${n.category}">${n.category}</span>
      </div>
      <div class="notice-title">${n.title}</div>
      <div class="notice-content">${n.content}</div>
      <div class="notice-meta">
        <span>📌 ${n.postedBy?.name || '—'} (${n.postedBy?.role || ''})</span>
        <span>🕐 ${formatDate(n.createdAt)}</span>
        ${n.expiryDate ? `<span>⏰ Expires: ${formatDate(n.expiryDate)}</span>` : ''}
      </div>
    </div>`).join('');
}

function showPostModal() {
  const html = `
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">Post Notice</span>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="form-group">
            <label>Title</label>
            <input type="text" id="nt-title" placeholder="Notice title..." required>
          </div>
          <div class="form-group">
            <label>Category</label>
            <select id="nt-cat">
              <option value="general">General</option>
              <option value="maintenance">Maintenance</option>
              <option value="meeting">Meeting</option>
              <option value="event">Event</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div class="form-group">
            <label>Content</label>
            <textarea id="nt-content" placeholder="Notice details..." style="min-height:120px" required></textarea>
          </div>
          <div class="form-group">
            <label>Expiry Date (optional)</label>
            <input type="date" id="nt-expiry">
          </div>
          <div id="nt-error" class="form-error hidden"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn-primary" id="nt-submit">Post Notice</button>
      </div>
    </div>`;

  openModal(html);
  document.getElementById('nt-submit').addEventListener('click', async () => {
    const errEl = document.getElementById('nt-error');
    errEl.classList.add('hidden');
    try {
      await api.post('/notices', {
        title: document.getElementById('nt-title').value,
        category: document.getElementById('nt-cat').value,
        content: document.getElementById('nt-content').value,
        expiryDate: document.getElementById('nt-expiry').value || undefined
      });
      closeModal();
      toast('Notice posted!', 'success');
      renderNotices();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
  });
}

async function deleteNotice(id) {
  confirm('Remove this notice?', async () => {
    try {
      await api.delete(`/notices/${id}`);
      document.getElementById(`notice-${id}`)?.remove();
      toast('Notice removed', 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}