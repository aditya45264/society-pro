async function renderPayments() {
  const container = document.getElementById('page-container');
  container.innerHTML = loading();
  try {
    if (isCommittee(currentUser.role)) {
      await renderCommitteePayments(container);
    } else {
      await renderMemberPayments(container);
    }
  } catch (err) {
    container.innerHTML = `<div class="form-error">${err.message}</div>`;
  }
}

async function renderCommitteePayments(container) {
  const now = new Date();
  let month = now.getMonth() + 1, year = now.getFullYear(), status = '';

  const fetchAndRender = async () => {
    let url = `/payments?month=${month}&year=${year}`;
    if (status) url += `&status=${status}`;
    const res = await api.get(url);
    const payments = res.payments || [];
    const paid = payments.filter(p => p.status === 'paid');
    const pending = payments.filter(p => p.status === 'pending');
    const overdue = payments.filter(p => p.status === 'overdue');

    document.getElementById('pay-stats').innerHTML = `
      <div class="stat-card green"><div class="stat-label">Paid</div><div class="stat-value">${paid.length}</div><div class="stat-note">${formatCurrency(paid.reduce((s,p)=>s+p.totalAmount,0))}</div></div>
      <div class="stat-card amber"><div class="stat-label">Pending</div><div class="stat-value">${pending.length}</div></div>
      <div class="stat-card red"><div class="stat-label">Overdue</div><div class="stat-value">${overdue.length}</div><div class="stat-note">${formatCurrency(overdue.reduce((s,p)=>s+p.totalAmount,0))}</div></div>`;

    document.getElementById('pay-table').innerHTML = payments.length === 0 ? empty('No payments found') : `
      <table>
        <thead><tr><th>Flat</th><th>Member</th><th>Wing</th><th>Month</th><th>Amount</th><th>Status</th><th>Method</th><th>Paid On</th><th>Action</th></tr></thead>
        <tbody>
          ${payments.map(p => `
            <tr class="row-${p.status}">
              <td><strong>${p.flatNumber}</strong></td>
              <td>${p.member?.name || '—'}<br><span style="font-size:11px;color:var(--text3)">${p.member?.phone || ''}</span></td>
              <td>${p.member?.wing || '—'}</td>
              <td>${monthName(p.month)} ${p.year}</td>
              <td style="font-weight:600">${formatCurrency(p.totalAmount)}</td>
              <td>${statusBadge(p.status)}</td>
              <td style="font-size:12px">${p.paymentMethod || '—'}</td>
              <td style="font-size:12px">${p.status === 'paid' ? formatDate(p.paymentDate) : '—'}</td>
              <td>${p.status !== 'paid' ? `<button class="btn-success btn-sm" onclick="showRecordModal('${p._id}')">Mark Paid</button>` : '<span style="color:var(--green)">✓</span>'}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  };

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Payments</div>
        <div class="page-subtitle">Track and manage maintenance payments</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn-secondary" onclick="markOverdue()">Mark Overdue</button>
        <button class="btn-primary" onclick="navigateTo('dues')">View Dues</button>
      </div>
    </div>
    <div class="stat-grid" id="pay-stats" style="grid-template-columns:repeat(3,1fr)"></div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Payment Records</span>
        <div class="filters" style="margin:0">
          <select id="f-month">${MONTH_NAMES.map((m,i)=>`<option value="${i+1}" ${i+1===month?'selected':''}>${m}</option>`).join('')}</select>
          <select id="f-year">
            ${[now.getFullYear()-1,now.getFullYear(),now.getFullYear()+1].map(y=>`<option value="${y}" ${y===year?'selected':''}>${y}</option>`).join('')}
          </select>
          <select id="f-status">
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>
      <div class="table-wrap" id="pay-table">${loading()}</div>
    </div>`;

  await fetchAndRender();

  ['f-month','f-year','f-status'].forEach(id => {
    document.getElementById(id).addEventListener('change', async () => {
      month = parseInt(document.getElementById('f-month').value);
      year = parseInt(document.getElementById('f-year').value);
      status = document.getElementById('f-status').value;
      document.getElementById('pay-table').innerHTML = loading();
      await fetchAndRender();
    });
  });
}

async function renderMemberPayments(container) {
  const res = await api.get('/payments/my-status');
  const payments = res.payments || [];
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">My Payments</div>
      <div class="page-subtitle">Flat ${currentUser.flatNumber} — Payment history</div>
    </div>
    <div class="card">
      <div class="table-wrap">
        ${payments.length === 0 ? empty('No payment records yet') : `
        <table>
          <thead><tr><th>Month</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Paid On</th><th>Method</th><th>Action</th></tr></thead>
          <tbody>
            ${payments.map(p => `
              <tr class="row-${p.status}">
                <td><strong>${monthName(p.maintenance?.month)} ${p.maintenance?.year}</strong></td>
                <td style="font-weight:600">${formatCurrency(p.totalAmount)}</td>
                <td>${formatDate(p.maintenance?.dueDate)}</td>
                <td>${statusBadge(p.status)}</td>
                <td>${p.status==='paid'?formatDate(p.paymentDate):'—'}</td>
                <td style="font-size:12px">${p.paymentMethod||'—'}</td>
                <td>${p.status !== 'paid' ? `<button class="btn-primary btn-sm" onclick="payNow('${p._id}', ${p.totalAmount}, '${monthName(p.maintenance?.month)} ${p.maintenance?.year}')">Pay Now</button>` : '<span style="color:var(--green)">✓ Paid</span>'}</td>
              </tr>`).join('')}
          </tbody>
        </table>`}
      </div>
    </div>`;
}

async function renderMyPayments() { await renderPayments(); }

function showRecordModal(paymentId) {
  const html = `
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">Record Payment</span>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="form-group">
            <label>Payment Method</label>
            <select id="rec-method">
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="online">Online Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div class="form-group">
            <label>Transaction ID (optional)</label>
            <input type="text" id="rec-txn" placeholder="UPI/Reference number">
          </div>
          <div class="form-group">
            <label>Late Fee (₹)</label>
            <input type="number" id="rec-latefee" value="0" min="0">
          </div>
          <div class="form-group">
            <label>Remarks</label>
            <input type="text" id="rec-remarks" placeholder="Any notes...">
          </div>
          <div id="rec-error" class="form-error hidden"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn-success" id="rec-submit">✓ Record as Paid</button>
      </div>
    </div>`;

  openModal(html);
  document.getElementById('rec-submit').addEventListener('click', async () => {
    const errEl = document.getElementById('rec-error');
    errEl.classList.add('hidden');
    try {
      await api.post('/payments/record', {
        paymentId,
        paymentMethod: document.getElementById('rec-method').value,
        transactionId: document.getElementById('rec-txn').value,
        lateFee: parseFloat(document.getElementById('rec-latefee').value) || 0,
        remarks: document.getElementById('rec-remarks').value
      });
      closeModal();
      toast('Payment recorded successfully!', 'success');
      renderPayments();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
  });
}

async function markOverdue() {
  try {
    const res = await api.post('/payments/mark-overdue', {});
    toast(res.message, 'info');
    renderPayments();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function renderDues() {
  const container = document.getElementById('page-container');
  container.innerHTML = loading();
  try {
    const res = await api.get('/payments/dues/list');
    const payments = res.payments || [];
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">Dues & Arrears</div>
        <div class="page-subtitle">All pending and overdue payments — Total: ${formatCurrency(res.totalDues)}</div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">${res.count} dues found</span></div>
        <div class="table-wrap">
          ${payments.length === 0 ? empty('No dues! All payments are up to date 🎉', '🎉') : `
          <table>
            <thead><tr><th>Flat</th><th>Member</th><th>Month</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${payments.map(p=>`
                <tr class="row-${p.status}">
                  <td><strong>${p.flatNumber}</strong></td>
                  <td>${p.member?.name||'—'}<br><span style="font-size:11px;color:var(--text3)">${p.member?.phone||''}</span></td>
                  <td>${monthName(p.maintenance?.month)} ${p.maintenance?.year}</td>
                  <td style="font-weight:600;color:var(--red)">${formatCurrency(p.totalAmount)}</td>
                  <td>${formatDate(p.maintenance?.dueDate)}</td>
                  <td>${statusBadge(p.status)}</td>
                  <td><button class="btn-success btn-sm" onclick="showRecordModal('${p._id}')">Mark Paid</button></td>
                </tr>`).join('')}
            </tbody>
          </table>`}
        </div>
      </div>`;
  } catch (err) {
    container.innerHTML = `<div class="form-error">${err.message}</div>`;
  }
}

async function payNow(paymentId, amount, label) {
  try {
    const res = await api.post('/razorpay/create-order', { paymentId });
    if (!res.success) return toast('Failed to create order', 'error');

    const options = {
      key: res.key,
      amount: amount * 100,
      currency: 'INR',
      name: 'SocietyPro',
      description: `Maintenance - ${label}`,
      order_id: res.order.id,
      handler: async function(response) {
        try {
          const verifyRes = await api.post('/razorpay/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            paymentId
          });
          if (verifyRes.success) {
            toast('Payment successful! 🎉', 'success');
            renderPayments();
          }
        } catch (err) {
          toast('Payment verification failed', 'error');
        }
      },
      prefill: {
        name: currentUser.name,
        email: currentUser.email
      },
      theme: {
        color: '#1a3461'
      }
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function(response) {
      toast('Payment failed: ' + response.error.description, 'error');
    });
    rzp.open();
  } catch (err) {
    toast(err.message, 'error');
  }
}