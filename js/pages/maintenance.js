async function renderMaintenance() {
  const container = document.getElementById('page-container');
  container.innerHTML = loading();
  try {
    const res = await api.get('/maintenance');
    const schedules = res.schedules || [];
    const canManage = isCommittee(currentUser.role);
    container.innerHTML = `
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <div class="page-title">Maintenance Schedules</div>
          <div class="page-subtitle">Monthly maintenance amounts issued by committee</div>
        </div>
        ${canManage ? `<button class="btn-primary" id="issue-btn">+ Issue New</button>` : ''}
      </div>
      <div class="card">
        <div class="table-wrap">
          ${schedules.length === 0 ? empty('No maintenance schedules yet', '📋') : `
          <table>
            <thead>
              <tr>
                <th>Month / Year</th><th>Amount</th><th>Due Date</th><th>Late Fee</th><th>Breakdown</th><th>Issued By</th>
                ${canManage ? '<th>Actions</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${schedules.map(s => `
                <tr>
                  <td><strong>${monthName(s.month)} ${s.year}</strong></td>
                  <td style="font-weight:700;color:var(--accent)">${formatCurrency(s.amount)}</td>
                  <td>${formatDate(s.dueDate)}</td>
                  <td>${s.lateFee ? formatCurrency(s.lateFee) : '—'}</td>
                  <td style="font-size:12px;color:var(--text2)">${s.extraCharges && s.extraCharges.length > 0 ? s.extraCharges.map(c => c.label + ': ' + formatCurrency(c.amount)).join('<br>') : '—'}</td>
                  <td>${s.issuedBy ? s.issuedBy.name + ' (' + s.issuedBy.role + ')' : '—'}</td>
                  ${canManage ? `<td><div class="action-btns">
                    <button class="btn-secondary btn-sm" onclick="viewPaymentSummary('${s._id}','${monthName(s.month)} ${s.year}')">Summary</button>
                    ${currentUser.role === 'chairman' ? `<button class="btn-danger btn-sm" onclick="deleteMaintenance('${s._id}')">Delete</button>` : ''}
                  </div></td>` : ''}
                </tr>`).join('')}
            </tbody>
          </table>`}
        </div>
      </div>`;
    if (canManage) {
      document.getElementById('issue-btn').addEventListener('click', showIssueModal);
    }
  } catch (err) {
    container.innerHTML = `<div class="form-error">${err.message}</div>`;
  }
}

function showIssueModal() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const dueDefault = new Date(now.getFullYear(), now.getMonth() + 1, 10).toISOString().split('T')[0];
  const monthOptions = MONTH_NAMES.map((m,i) => '<option value="'+(i+1)+'" '+(i+1===nextMonth.getMonth()+1?'selected':'')+'>'+m+'</option>').join('');
  const html = `
    <div class="modal" style="max-width:600px">
      <div class="modal-header">
        <span class="modal-title">Issue Maintenance</span>
        <button class="modal-close" onclick="closeModal()">x</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="form-row">
            <div class="form-group"><label>Month</label><select id="iss-month">${monthOptions}</select></div>
            <div class="form-group"><label>Year</label><input type="number" id="iss-year" value="${nextMonth.getFullYear()}" min="2020" max="2040"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Due Date</label><input type="date" id="iss-duedate" value="${dueDefault}" required></div>
            <div class="form-group"><label>Late Fee</label><input type="number" id="iss-latefee" placeholder="100" min="0" value="0"></div>
          </div>
          <div>
            <label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--text2);display:block;margin-bottom:8px;">Maintenance Breakdown</label>
            <div id="charges-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px;"></div>
            <button type="button" onclick="addChargeLine()" class="btn-secondary btn-sm">+ Add Item</button>
          </div>
          <div style="background:var(--surface2);border-radius:var(--radius);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;font-weight:600;">Total Amount</span>
            <span id="total-display" style="font-size:20px;font-weight:700;color:var(--accent)">0</span>
          </div>
          <div class="form-group"><label>Notes</label><textarea id="iss-desc" placeholder="Any additional notes..."></textarea></div>
          <div id="iss-error" class="form-error hidden"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn-primary" id="iss-submit">Issue Maintenance</button>
      </div>
    </div>`;
  openModal(html);
  addChargeLine();
  updateTotal();
  document.getElementById('iss-submit').addEventListener('click', async () => {
    const errEl = document.getElementById('iss-error');
    errEl.classList.add('hidden');
    try {
      const charges = getCharges();
      if (charges.length === 0) { errEl.textContent = 'Please add at least one charge item'; errEl.classList.remove('hidden'); return; }
      const total = charges.reduce((sum, c) => sum + c.amount, 0);
      if (total <= 0) { errEl.textContent = 'Total must be greater than 0'; errEl.classList.remove('hidden'); return; }
      await api.post('/maintenance', {
        month: parseInt(document.getElementById('iss-month').value),
        year: parseInt(document.getElementById('iss-year').value),
        amount: total,
        lateFee: parseFloat(document.getElementById('iss-latefee').value) || 0,
        dueDate: document.getElementById('iss-duedate').value,
        description: document.getElementById('iss-desc').value,
        extraCharges: charges
      });
      closeModal();
      toast('Maintenance issued successfully!', 'success');
      renderMaintenance();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
  });
}

function addChargeLine() {
  const list = document.getElementById('charges-list');
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:8px;align-items:center;';
  div.innerHTML = '<input type="text" placeholder="e.g. Water Charges" style="flex:1;padding:8px 12px;border:1.5px solid var(--border);border-radius:var(--radius);font-family:inherit;font-size:13px;background:var(--surface);color:var(--text);outline:none;" oninput="updateTotal()"><input type="number" placeholder="Amount" min="0" style="width:120px;padding:8px 12px;border:1.5px solid var(--border);border-radius:var(--radius);font-family:inherit;font-size:13px;background:var(--surface);color:var(--text);outline:none;" oninput="updateTotal()"><button type="button" onclick="this.parentElement.remove();updateTotal()" style="background:var(--red-bg);color:var(--red);border:none;border-radius:var(--radius);padding:8px 10px;cursor:pointer;font-size:14px;">x</button>';
  list.appendChild(div);
}

function getCharges() {
  const rows = document.querySelectorAll('#charges-list > div');
  const charges = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const label = inputs[0].value.trim();
    const amount = parseFloat(inputs[1].value) || 0;
    if (label && amount > 0) charges.push({ label, amount });
  });
  return charges;
}

function updateTotal() {
  const charges = getCharges();
  const total = charges.reduce((sum, c) => sum + c.amount, 0);
  const el = document.getElementById('total-display');
  if (el) el.textContent = formatCurrency(total);
}

async function viewPaymentSummary(maintenanceId, label) {
  const overlay = openModal('<div class="modal" style="max-width:700px"><div class="modal-header"><span class="modal-title">Payment Summary - ' + label + '</span><button class="modal-close" onclick="closeModal()">x</button></div><div class="modal-body">' + loading() + '</div></div>');
  try {
    const res = await api.get('/payments/summary/' + maintenanceId);
    const { summary, payments } = res;
    overlay.querySelector('.modal-body').innerHTML = `
      <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px;">
        <div class="stat-card green"><div class="stat-label">Paid</div><div class="stat-value">${summary.paid}</div></div>
        <div class="stat-card amber"><div class="stat-label">Pending</div><div class="stat-value">${summary.pending}</div></div>
        <div class="stat-card red"><div class="stat-label">Overdue</div><div class="stat-value">${summary.overdue}</div></div>
        <div class="stat-card blue"><div class="stat-label">Collected</div><div class="stat-value" style="font-size:20px">${formatCurrency(summary.totalCollected)}</div></div>
      </div>
      <div class="table-wrap" style="max-height:360px;overflow-y:auto;">
        <table>
          <thead><tr><th>Flat</th><th>Member</th><th>Status</th><th>Amount</th><th>Paid On</th><th>Action</th></tr></thead>
          <tbody>${payments.map(p => `<tr class="row-${p.status}"><td><strong>${p.flatNumber}</strong></td><td>${p.member?.name||'—'}</td><td>${statusBadge(p.status)}</td><td>${formatCurrency(p.totalAmount)}</td><td>${p.status==='paid'?formatDate(p.paymentDate):'—'}</td><td>${p.status!=='paid'?'<button class="btn-success btn-sm" onclick="recordPaymentFromModal(\''+p._id+'\')">Mark Paid</button>':'✓'}</td></tr>`).join('')}</tbody>
        </table>
      </div>`;
  } catch (err) {
    overlay.querySelector('.modal-body').innerHTML = '<div class="form-error">' + err.message + '</div>';
  }
}

async function recordPaymentFromModal(paymentId) {
  try {
    await api.post('/payments/record', { paymentId, paymentMethod: 'cash' });
    toast('Payment recorded!', 'success');
    closeModal();
    renderMaintenance();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteMaintenance(id) {
  confirm('Delete this maintenance schedule? All related payment records will also be deleted.', async () => {
    try {
      await api.delete('/maintenance/' + id);
      toast('Maintenance deleted', 'info');
      renderMaintenance();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}