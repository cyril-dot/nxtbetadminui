// ==================== CONFIG ====================
const BASE_URL = 'https://futballbackend-production.up.railway.app'; // 👈 Set your API base URL here, e.g. 'https://api.futball.app'

let config = { baseUrl: BASE_URL, token: '' };

// ==================== SIDEBAR ====================
function openSidebar()  {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ==================== AUTH ====================
function logout() {
  if (!confirm('Sign out of the Super Admin panel?')) return;
  localStorage.removeItem('fb_token');
  window.location.href = 'auth.html';
}

// ==================== API ====================
// All responses follow { success, data, message } envelope.
// We unwrap data automatically; non-2xx throws with backend message.
async function api(path, method = 'GET', body = null) {
  if (!config.token)
    throw new Error('Not authenticated — please sign in again.');
  const opts = {
    method,
    headers: {
      'Authorization': 'Bearer ' + config.token,
      'Content-Type': 'application/json'
    }
  };
  if (body !== null) opts.body = JSON.stringify(body);
  const res  = await fetch(config.baseUrl + path, opts);
  let json;
  try { json = await res.json(); } catch(e) { throw new Error(`HTTP ${res.status} — no JSON body`); }
  if (!res.ok) {
    const msg = json.message || json.error || (json.errors && JSON.stringify(json.errors)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  // Unwrap { data: ... } envelope
  return json.data !== undefined ? json.data : json;
}

// ==================== ALERTS ====================
function showAlert(msg, type = 'info', duration = 4500) {
  const el = document.getElementById('alert-container');
  if (!el) return;
  const icons = { success:'✓', error:'✕', info:'ℹ', warning:'⚠' };
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  div.innerHTML = `<span>${icons[type]||'ℹ'}</span><span>${msg}</span>`;
  el.appendChild(div);
  setTimeout(() => div.remove(), duration);
}

// ==================== MODAL ====================
function openModal(title, html) {
  const t = document.getElementById('modal-title');
  if (t) t.textContent = title || 'Detail';
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-bg').classList.add('open');
}
function closeModal(e) {
  if (!e || e.target === document.getElementById('modal-bg'))
    document.getElementById('modal-bg').classList.remove('open');
}

// ==================== UTILS ====================
function fmt(n)      { return Number(n).toLocaleString('en-GH', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
function fmtDate(d)  { return d ? new Date(d).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'; }
function truncate(s, n=28) { return s && s.length > n ? s.slice(0,n)+'…' : (s||'—'); }
function coalesce(...args) { for (const a of args) if (a !== null && a !== undefined && a !== '') return a; return '—'; }

function statusBadge(s) {
  const map = {
    COMPLETED:'badge-green', APPROVED:'badge-green', PROCESSED:'badge-green',
    PAID:'badge-green', COMMISSION_SET:'badge-green', CLOSED:'badge-gray',
    PENDING:'badge-yellow', PENDING_COMMISSION:'badge-yellow', REQUESTED:'badge-yellow',
    FAILED:'badge-red', REJECTED:'badge-red',
    ADMIN:'badge-blue', SUPER_ADMIN:'badge-purple', USER:'badge-gray'
  };
  return `<span class="badge ${map[s]||'badge-gray'}">${s||'—'}</span>`;
}
function kindBadge(k) {
  const map = {
    DEPOSIT:'badge-green', WITHDRAW:'badge-red', WITHDRAW_HOLD:'badge-yellow',
    WITHDRAW_RELEASE:'badge-blue', BET_STAKE:'badge-yellow', BET_WIN:'badge-blue',
    REFERRAL_COMMISSION:'badge-purple', PAYOUT:'badge-red', ADJUSTMENT:'badge-gray',
    VIP_CASHBACK:'badge-purple', VIP_MEMBERSHIP:'badge-purple',
    WELCOME_BONUS:'badge-blue', WITHDRAWAL_REFUND:'badge-yellow', ADMIN_UPGRADE_FEE:'badge-yellow'
  };
  return `<span class="badge ${map[k]||'badge-gray'}">${k||'—'}</span>`;
}

function loading(msg='Loading…') {
  return `<div class="loading-row"><span class="spinner"></span>${msg}</div>`;
}
function empty(msg='No records found.') {
  return `<div class="empty"><div class="empty-icon">📭</div>${msg}</div>`;
}
function labeledTd(label, content) {
  return `<td data-label="${label}">${content}</td>`;
}
function detailRow(key, val) {
  const v = (val !== null && val !== undefined && val !== '') ? val : '<span style="color:var(--text-dim)">—</span>';
  return `<div class="detail-item"><div class="key">${key}</div><div class="val">${v}</div></div>`;
}

function paginator(page, totalPages, onPage) {
  if (totalPages <= 1) return '';
  return `<div class="pager">
    <button class="btn-ghost btn-sm" onclick="${onPage}(${page-1})" ${page===0?'disabled':''}>← Prev</button>
    <span class="pager-info">Page ${page+1} of ${totalPages}</span>
    <button class="btn-ghost btn-sm" onclick="${onPage}(${page+1})" ${page>=totalPages-1?'disabled':''}>Next →</button>
  </div>`;
}

// ==================== CSV EXPORT ====================
function exportCSV(filename, headers, rows) {
  const esc = v => {
    const s = (v === null || v === undefined) ? '' : String(v);
    return (s.includes(',') || s.includes('"') || s.includes('\n'))
      ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ==================== NAVIGATION ====================
let currentPage = 'dashboard';

function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  const titles = {
    dashboard:'Dashboard', admins:'Admin Accounts', users:'All Users',
    transactions:'Platform Transactions', binance:'Crypto Deposits',
    'upgrade-chats':'Admin Upgrade Chats', 'affiliate-withdrawals':'Affiliate Withdrawals',
    'payout-requests':'Payout Requests', 'audit-log':'Audit Log'
  };
  document.getElementById('page-title').textContent = titles[page] || page;
  document.getElementById('alert-container').innerHTML = '';
  reloadPage();
}

function reloadPage() {
  const pages = {
    dashboard:renderDashboard, admins:renderAdmins, users:renderUsers,
    transactions:renderTransactions, binance:renderBinance,
    'upgrade-chats':renderUpgradeChats, 'affiliate-withdrawals':renderAffiliateWithdrawals,
    'payout-requests':renderPayoutRequests, 'audit-log':renderAuditLog
  };
  (pages[currentPage] || renderDashboard)();
}

// ============================================================
// 1. DASHBOARD — GET /api/super-admin/metrics
//               GET /api/super-admin/metrics/deposits
// ============================================================
async function renderDashboard() {
  const c = document.getElementById('page-content');
  c.innerHTML = loading('Fetching platform metrics…');
  try {
    const [metrics, rev] = await Promise.all([
      api('/api/super-admin/metrics'),
      api('/api/super-admin/metrics/deposits')
    ]);
    c.innerHTML = `
      <div class="stat-grid">
        <div class="stat">
          <span class="stat-icon">👥</span>
          <div class="stat-label">Total Users</div>
          <div class="stat-value">${Number(metrics.totalUsers).toLocaleString()}</div>
        </div>
        <div class="stat">
          <span class="stat-icon">👤</span>
          <div class="stat-label">Total Admins</div>
          <div class="stat-value">${Number(metrics.totalAdmins).toLocaleString()}</div>
        </div>
        <div class="stat">
          <span class="stat-icon">🌐</span>
          <div class="stat-label">Platform</div>
          <div class="stat-value" style="font-size:17px">${metrics.platform}</div>
        </div>
      </div>

      <div class="section-title">💰 Revenue Overview — ${rev.currency}</div>
      <div class="stat-grid">
        <div class="stat">
          <span class="stat-icon">📥</span>
          <div class="stat-label">Deposits All Time</div>
          <div class="stat-value">₵${fmt(rev.totalDepositsAllTime)}</div>
          <div class="stat-sub">${Number(rev.totalDepositCount).toLocaleString()} transactions</div>
        </div>
        <div class="stat">
          <span class="stat-icon">📅</span>
          <div class="stat-label">Deposits This Month</div>
          <div class="stat-value">₵${fmt(rev.totalDepositsThisMonth)}</div>
        </div>
        <div class="stat">
          <span class="stat-icon">📆</span>
          <div class="stat-label">Deposits Today</div>
          <div class="stat-value">₵${fmt(rev.totalDepositsToday)}</div>
        </div>
        <div class="stat">
          <span class="stat-icon">📤</span>
          <div class="stat-label">Withdrawals All Time</div>
          <div class="stat-value" style="color:var(--red-text)">₵${fmt(rev.totalWithdrawalsAllTime)}</div>
          <div class="stat-sub">${Number(rev.totalWithdrawalCount).toLocaleString()} transactions</div>
        </div>
        <div class="stat">
          <span class="stat-icon">📉</span>
          <div class="stat-label">Withdrawals This Month</div>
          <div class="stat-value" style="color:var(--red-text)">₵${fmt(rev.totalWithdrawalsThisMonth)}</div>
        </div>
      </div>`;
  } catch (e) {
    c.innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
  }
}

// ============================================================
// 2. ADMINS — GET  /api/super-admin/admins
//             GET  /api/super-admin/admins/{id}
//             POST /api/super-admin/admins
// ============================================================
async function renderAdmins() {
  const c = document.getElementById('page-content');
  c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2>Admin Accounts</h2>
        <button class="btn-primary btn-sm" onclick="openCreateAdminModal()">+ New Admin</button>
      </div>
      <div class="card-body"><div id="admins-list">${loading()}</div></div>
    </div>`;
  try {
    const data = await api('/api/super-admin/admins');
    const list = Array.isArray(data) ? data : (data.content || []);
    if (!list.length) { document.getElementById('admins-list').innerHTML = empty('No admins found.'); return; }
    document.getElementById('admins-list').innerHTML = `
      <div class="tbl-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>${list.map(a => `<tr>
          ${labeledTd('Name', `${a.firstName||''} ${a.lastName||''}`.trim()||'—')}
          ${labeledTd('Email', a.email)}
          ${labeledTd('Role', statusBadge(a.role))}
          ${labeledTd('Actions', `<button class="btn-ghost btn-sm" onclick="viewAdmin('${a.id}')">View Detail</button>`)}
        </tr>`).join('')}</tbody>
      </table></div>`;
  } catch (e) {
    document.getElementById('admins-list').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
  }
}

async function viewAdmin(id) {
  openModal('Admin Detail', loading());
  try {
    const d = await api(`/api/super-admin/admins/${id}`);
    document.getElementById('modal-content').innerHTML = `
      <div class="section-title">Profile</div>
      <div class="detail-grid">
        ${detailRow('ID',             `<span class="mono">${d.id}</span>`)}
        ${detailRow('Email',          d.email)}
        ${detailRow('Name',           `${d.firstName||''} ${d.lastName||''}`.trim())}
        ${detailRow('Phone',          d.phone)}
        ${detailRow('Country',        d.country)}
        ${detailRow('Role',           statusBadge(d.role))}
        ${detailRow('Email Verified', d.emailVerified ? '✅ Yes' : '❌ No')}
        ${detailRow('Created',        fmtDate(d.createdAt))}
      </div>
      ${d.wallet ? `
        <div class="section-title">Wallet</div>
        <div class="detail-grid">
          ${detailRow('Wallet ID',          `<span class="mono">${d.wallet.walletId}</span>`)}
          ${detailRow('Balance',            `₵${fmt(d.wallet.balance)}`)}
          ${detailRow('Currency',           d.wallet.currency)}
          ${detailRow('Total Deposited',    `₵${fmt(d.wallet.totalDeposited)}`)}
          ${detailRow('Total Withdrawn',    `₵${fmt(d.wallet.totalWithdrawn)}`)}
          ${detailRow('Total Transactions', d.wallet.totalTransactions)}
        </div>` : ''}
      ${d.referral ? `
        <div class="section-title">Referral Link</div>
        <div class="detail-grid">
          ${detailRow('Link ID',           `<span class="mono">${d.referral.linkId}</span>`)}
          ${detailRow('Code',              d.referral.code)}
          ${detailRow('Commission Rate',   `${d.referral.commissionPercent}%`)}
          ${detailRow('Total Referrals',   d.referral.totalReferrals ?? 'N/A')}
          ${detailRow('Total Earnings',    d.referral.totalEarnings  != null ? '₵'+fmt(d.referral.totalEarnings) : 'N/A')}
        </div>` : ''}
      <div class="modal-footer"><button class="btn-ghost" onclick="closeModal()">Close</button></div>`;
  } catch (e) {
    document.getElementById('modal-content').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
  }
}

function openCreateAdminModal() {
  openModal('Create New Admin', `
    <div class="form-group" style="margin-bottom:12px">
      <label>Email *</label>
      <input id="ca-email" type="email" placeholder="admin@example.com">
    </div>
    <div class="form-group" style="margin-bottom:12px">
      <label>Password *</label>
      <input id="ca-pass" type="password" placeholder="Secure password (min 8 chars)">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="form-group"><label>First Name *</label><input id="ca-fn" type="text" placeholder="Jane"></div>
      <div class="form-group"><label>Last Name</label><input id="ca-ln" type="text" placeholder="Smith"></div>
    </div>
    <div id="ca-msg"></div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" id="ca-btn" onclick="createAdmin()">Create Admin</button>
    </div>`);
}

async function createAdmin() {
  const email     = document.getElementById('ca-email').value.trim();
  const password  = document.getElementById('ca-pass').value;
  const firstName = document.getElementById('ca-fn').value.trim();
  const lastName  = document.getElementById('ca-ln').value.trim();
  if (!email || !password || !firstName) {
    document.getElementById('ca-msg').innerHTML = '<div class="alert alert-error">✕ Email, password and first name are required.</div>';
    return;
  }
  const btn = document.getElementById('ca-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Creating…';
  try {
    await api('/api/super-admin/admins', 'POST', { email, password, firstName, lastName });
    closeModal();
    showAlert('Admin created successfully!', 'success');
    renderAdmins();
  } catch (e) {
    document.getElementById('ca-msg').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
    btn.disabled = false; btn.innerHTML = 'Create Admin';
  }
}

// ============================================================
// 3. USERS — GET /api/super-admin/users          (paginated, search, role)
//            GET /api/super-admin/users/{userId}
// ============================================================
let usersPage = 0, usersSearch = '', usersRole = '';

async function renderUsers(page = 0) {
  usersPage = page;
  const c = document.getElementById('page-content');
  c.innerHTML = `
    <div class="card">
      <div class="card-header"><h2>All Users</h2></div>
      <div class="card-body">
        <div class="form-row" style="margin-bottom:16px">
          <div class="form-group" style="flex:1;min-width:180px">
            <label>Search (email / name)</label>
            <input id="usr-search" type="text" placeholder="john@example.com…"
              value="${usersSearch}"
              oninput="usersSearch=this.value"
              onkeydown="if(event.key==='Enter')renderUsers(0)">
          </div>
          <div class="form-group">
            <label>Role</label>
            <select onchange="usersRole=this.value;renderUsers(0)">
              <option value=""             ${usersRole===''?'selected':''}>All roles</option>
              <option value="USER"         ${usersRole==='USER'?'selected':''}>USER</option>
              <option value="ADMIN"        ${usersRole==='ADMIN'?'selected':''}>ADMIN</option>
              <option value="SUPER_ADMIN"  ${usersRole==='SUPER_ADMIN'?'selected':''}>SUPER_ADMIN</option>
            </select>
          </div>
          <button class="btn-primary" style="align-self:flex-end" onclick="renderUsers(0)">Search</button>
          <button class="btn-ghost"   style="align-self:flex-end" onclick="usersSearch='';usersRole='';renderUsers(0)">Clear</button>
        </div>
        <div id="users-list">${loading()}</div>
      </div>
    </div>`;
  try {
    let q = `?page=${usersPage}&size=20`;
    if (usersSearch) q += `&search=${encodeURIComponent(usersSearch)}`;
    if (usersRole)   q += `&role=${usersRole}`;
    const data = await api(`/api/super-admin/users${q}`);
    const list = data.content || [];
    document.getElementById('users-list').innerHTML = list.length ? `
      <div class="tbl-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Country</th><th>Role</th><th>Verified</th><th>Joined</th><th></th></tr></thead>
        <tbody>${list.map(u => `<tr>
          ${labeledTd('Name',     `${u.firstName||''} ${u.lastName||''}`.trim()||'—')}
          ${labeledTd('Email',    u.email)}
          ${labeledTd('Phone',    `<span class="mono">${u.phone||'—'}</span>`)}
          ${labeledTd('Country',  u.country||'—')}
          ${labeledTd('Role',     statusBadge(u.role))}
          ${labeledTd('Verified', u.emailVerified ? '✅' : '❌')}
          ${labeledTd('Joined',   `<span class="mono">${fmtDate(u.createdAt)}</span>`)}
          ${labeledTd('',         `<button class="btn-ghost btn-sm" onclick="viewUser('${u.id}')">View</button>`)}
        </tr>`).join('')}</tbody>
      </table></div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;flex-wrap:wrap;gap:8px">
        <span class="pager-info">${data.totalElements.toLocaleString()} total users</span>
        ${paginator(usersPage, data.totalPages, 'renderUsers')}
      </div>` : empty('No users found.');
  } catch (e) {
    document.getElementById('users-list').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
  }
}

async function viewUser(id) {
  openModal('User Detail', loading());
  try {
    const d = await api(`/api/super-admin/users/${id}`);
    document.getElementById('modal-content').innerHTML = `
      <div class="section-title">Profile</div>
      <div class="detail-grid">
        ${detailRow('ID',             `<span class="mono">${d.id}</span>`)}
        ${detailRow('Email',          d.email)}
        ${detailRow('Name',           `${d.firstName||''} ${d.lastName||''}`.trim())}
        ${detailRow('Phone',          d.phone)}
        ${detailRow('Country',        d.country)}
        ${detailRow('Role',           statusBadge(d.role))}
        ${detailRow('Email Verified', d.emailVerified ? '✅ Yes' : '❌ No')}
        ${detailRow('Created',        fmtDate(d.createdAt))}
      </div>
      ${d.wallet ? `
        <div class="section-title">Wallet</div>
        <div class="detail-grid">
          ${detailRow('Wallet ID',          `<span class="mono">${d.wallet.walletId}</span>`)}
          ${detailRow('Balance',            `₵${fmt(d.wallet.balance)}`)}
          ${detailRow('Currency',           d.wallet.currency)}
          ${detailRow('Total Deposited',    `₵${fmt(d.wallet.totalDeposited)}`)}
          ${detailRow('Total Withdrawn',    `₵${fmt(d.wallet.totalWithdrawn)}`)}
          ${detailRow('Total Transactions', d.wallet.totalTransactions)}
        </div>` : '<div class="alert alert-info" style="margin-top:12px">ℹ No wallet found for this user.</div>'}
      <div class="modal-footer">
        <button class="btn-ghost btn-sm" onclick="viewUserTx('${id}')">View Transactions</button>
        <button class="btn-ghost" onclick="closeModal()">Close</button>
      </div>`;
  } catch (e) {
    document.getElementById('modal-content').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
  }
}

async function viewUserTx(userId) {
  closeModal();
  navigate('transactions');
  txWalletId = '';
  showAlert('Note: to filter by user, get their Wallet ID from the user detail and paste it in the Wallet ID filter.', 'info', 7000);
}

// ============================================================
// 4. TRANSACTIONS — GET /api/super-admin/transactions
// ============================================================
let txPage = 0, txKind = '', txStatus = '', txFrom = '', txTo = '', txWalletId = '';
const TX_KINDS = ['DEPOSIT','WITHDRAW','WITHDRAW_HOLD','WITHDRAW_RELEASE','BET_STAKE','BET_WIN',
  'REFERRAL_COMMISSION','PAYOUT','ADJUSTMENT','VIP_CASHBACK','VIP_MEMBERSHIP',
  'WELCOME_BONUS','WITHDRAWAL_REFUND','ADMIN_UPGRADE_FEE'];
const CREDIT_KINDS = new Set(['DEPOSIT','BET_WIN','REFERRAL_COMMISSION','WELCOME_BONUS','VIP_CASHBACK','WITHDRAW_RELEASE']);

async function renderTransactions(page = 0) {
  txPage = page;
  const c = document.getElementById('page-content');
  c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2>Platform Transactions</h2>
        <button class="btn-ghost btn-sm" onclick="exportTransactionsCSV()">⬇ Export CSV</button>
      </div>
      <div class="card-body">
        <div class="form-row" style="margin-bottom:16px">
          <div class="form-group">
            <label>Kind</label>
            <select id="tx-kind" onchange="txKind=this.value">
              <option value="">All kinds</option>
              ${TX_KINDS.map(k=>`<option value="${k}" ${txKind===k?'selected':''}>${k}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="tx-status" onchange="txStatus=this.value">
              <option value="">All</option>
              <option value="COMPLETED" ${txStatus==='COMPLETED'?'selected':''}>COMPLETED</option>
              <option value="PENDING"   ${txStatus==='PENDING'?'selected':''}>PENDING</option>
              <option value="FAILED"    ${txStatus==='FAILED'?'selected':''}>FAILED</option>
            </select>
          </div>
          <div class="form-group">
            <label>From</label>
            <input id="tx-from" type="datetime-local" onchange="txFrom=this.value?new Date(this.value).toISOString():''">
          </div>
          <div class="form-group">
            <label>To</label>
            <input id="tx-to" type="datetime-local" onchange="txTo=this.value?new Date(this.value).toISOString():''">
          </div>
          <div class="form-group" style="flex:1;min-width:150px">
            <label>Wallet ID (UUID)</label>
            <input id="tx-wallet" type="text" placeholder="Filter by wallet…" value="${txWalletId}" oninput="txWalletId=this.value">
          </div>
          <div style="display:flex;gap:6px;align-self:flex-end">
            <button class="btn-primary" onclick="renderTransactions(0)">Filter</button>
            <button class="btn-ghost"   onclick="txKind='';txStatus='';txFrom='';txTo='';txWalletId='';renderTransactions(0)">Clear</button>
          </div>
        </div>
        <div id="tx-list">${loading()}</div>
      </div>
    </div>`;
  try {
    let q = `?page=${txPage}&size=50`;
    if (txKind)     q += `&kind=${txKind}`;
    if (txStatus)   q += `&status=${txStatus}`;
    if (txFrom)     q += `&from=${txFrom}`;
    if (txTo)       q += `&to=${txTo}`;
    if (txWalletId) q += `&walletId=${encodeURIComponent(txWalletId)}`;
    const data = await api(`/api/super-admin/transactions${q}`);
    const list = data.content || [];
    document.getElementById('tx-list').innerHTML = list.length ? `
      <div class="tbl-wrap"><table>
        <thead><tr><th>Date</th><th>User Email</th><th>Kind</th><th>Amount</th><th>Balance After</th><th>Status</th><th>Provider Ref</th><th></th></tr></thead>
        <tbody>${list.map(t => `<tr>
          ${labeledTd('Date',         `<span class="mono">${fmtDate(t.createdAt)}</span>`)}
          ${labeledTd('User Email',   t.userEmail||'—')}
          ${labeledTd('Kind',         kindBadge(t.kind))}
          ${labeledTd('Amount',       `<strong style="color:${CREDIT_KINDS.has(t.kind)?'var(--green-text)':'var(--red-text)'}">₵${fmt(t.amount)}</strong>`)}
          ${labeledTd('Balance After',`₵${fmt(t.balanceAfter)}`)}
          ${labeledTd('Status',       statusBadge(t.status))}
          ${labeledTd('Provider Ref', `<span class="mono">${truncate(t.providerRef,20)}</span>`)}
          ${labeledTd('',             `<button class="btn-ghost btn-sm" onclick='viewTx(${JSON.stringify(t).replace(/'/g,"&#39;")})'>Detail</button>`)}
        </tr>`).join('')}</tbody>
      </table></div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;flex-wrap:wrap;gap:8px">
        <span class="pager-info">${data.totalElements.toLocaleString()} total transactions</span>
        ${paginator(txPage, data.totalPages, 'renderTransactions')}
      </div>` : empty('No transactions match the filters.');
  } catch (e) {
    document.getElementById('tx-list').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
  }
}

function viewTx(t) {
  openModal('Transaction Detail', `
    <div class="section-title">Transaction</div>
    <div class="detail-grid">
      ${detailRow('ID',            `<span class="mono">${t.id}</span>`)}
      ${detailRow('Kind',          kindBadge(t.kind))}
      ${detailRow('Status',        statusBadge(t.status))}
      ${detailRow('Amount',        `₵${fmt(t.amount)}`)}
      ${detailRow('Balance After', `₵${fmt(t.balanceAfter)}`)}
      ${detailRow('User Email',    t.userEmail)}
      ${detailRow('User ID',       `<span class="mono">${t.userId}</span>`)}
      ${detailRow('Wallet ID',     `<span class="mono">${t.walletId}</span>`)}
      ${detailRow('Provider Ref',  t.providerRef)}
      ${detailRow('Date',          fmtDate(t.createdAt))}
    </div>
    ${t.metadata ? `<div class="section-title">Metadata</div><pre class="json-pre">${JSON.stringify(t.metadata,null,2)}</pre>` : ''}
    <div class="modal-footer"><button class="btn-ghost" onclick="closeModal()">Close</button></div>`);
}

async function exportTransactionsCSV() {
  const btn = document.querySelector('[onclick="exportTransactionsCSV()"]');
  if (btn) { btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Exporting…'; }
  try {
    let rows=[], p=0, total=1;
    while (p < total) {
      let q = `?page=${p}&size=500`;
      if (txKind)     q+=`&kind=${txKind}`;
      if (txStatus)   q+=`&status=${txStatus}`;
      if (txFrom)     q+=`&from=${txFrom}`;
      if (txTo)       q+=`&to=${txTo}`;
      if (txWalletId) q+=`&walletId=${encodeURIComponent(txWalletId)}`;
      const d = await api(`/api/super-admin/transactions${q}`);
      rows = rows.concat(d.content||[]);
      total = d.totalPages||1;
      p++;
    }
    if (!rows.length) { showAlert('No data to export.','error'); return; }
    const headers = ['ID','User Email','User ID','Wallet ID','Kind','Amount (GHS)','Balance After','Status','Provider Ref','Date'];
    exportCSV(`transactions-${new Date().toISOString().slice(0,10)}.csv`, headers,
      rows.map(t=>[t.id,t.userEmail,t.userId,t.walletId,t.kind,t.amount,t.balanceAfter,t.status,t.providerRef||'',t.createdAt]));
    showAlert(`Exported ${rows.length} rows!`, 'success');
  } catch(e) { showAlert('Export failed: '+e.message,'error'); }
  finally { if (btn) { btn.disabled=false; btn.innerHTML='⬇ Export CSV'; } }
}

// ============================================================
// 5. BINANCE/CRYPTO DEPOSITS
// ============================================================
let binancePage=0, binanceTab='all';

async function renderBinance(page=0) {
  binancePage = page;
  const c = document.getElementById('page-content');
  c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2>Crypto / Binance Deposits</h2>
        <button class="btn-ghost btn-sm" onclick="exportBinanceCSV()">⬇ Export CSV</button>
      </div>
      <div class="card-body">
        <div class="tabs">
          <button class="tab ${binanceTab==='all'?'active':''}"     onclick="binanceTab='all';renderBinance(0)">All Deposits</button>
          <button class="tab ${binanceTab==='pending'?'active':''}" onclick="binanceTab='pending';renderBinance(0)">⏳ Pending Review</button>
        </div>
        <div id="binance-list">${loading()}</div>
      </div>
    </div>`;
  try {
    const ep = binanceTab==='pending'
      ? `/api/admin/binance-deposits/pending?page=${page}&size=20`
      : `/api/admin/binance-deposits?page=${page}&size=20`;
    const data = await api(ep);
    const list = data.content || [];
    document.getElementById('binance-list').innerHTML = list.length ? `
      <div class="tbl-wrap"><table>
        <thead><tr><th>Date</th><th>User ID</th><th>Coin/Network</th><th>Crypto Amt</th><th>Expected GHS</th><th>Credited GHS</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${list.map(d => `<tr>
          ${labeledTd('Date',         `<span class="mono">${fmtDate(d.createdAt)}</span>`)}
          ${labeledTd('User ID',      `<span class="mono">${truncate(d.userId,14)}</span>`)}
          ${labeledTd('Coin/Network', `<span class="badge badge-yellow">${d.coin}/${d.network}</span>`)}
          ${labeledTd('Crypto Amt',   d.cryptoAmount)}
          ${labeledTd('Expected GHS', `₵${fmt(d.expectedGhsAmount)}`)}
          ${labeledTd('Credited GHS', d.creditedGhsAmount!=null ? `₵${fmt(d.creditedGhsAmount)}` : '—')}
          ${labeledTd('Status',       statusBadge(d.status))}
          ${labeledTd('Actions', `<div class="btn-row">
            <button class="btn-ghost btn-sm" onclick="viewBinanceDeposit('${d.id}')">View</button>
            ${d.status==='PENDING'
              ? `<button class="btn-success btn-sm" onclick="openApproveDeposit('${d.id}',${d.expectedGhsAmount})">Approve</button>
                 <button class="btn-danger btn-sm"  onclick="openRejectDeposit('${d.id}')">Reject</button>`
              : ''}
          </div>`)}
        </tr>`).join('')}</tbody>
      </table></div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;flex-wrap:wrap;gap:8px">
        <span class="pager-info">${data.totalElements.toLocaleString()} total</span>
        ${paginator(binancePage, data.totalPages, 'renderBinance')}
      </div>` : empty('No deposits found.');
  } catch (e) {
    document.getElementById('binance-list').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
  }
}

async function viewBinanceDeposit(id) {
  openModal('Crypto Deposit Detail', loading());
  try {
    const d = await api(`/api/admin/binance-deposits/${id}`);
    document.getElementById('modal-content').innerHTML = `
      <div class="section-title">Deposit Info</div>
      <div class="detail-grid">
        ${detailRow('ID',                  `<span class="mono">${d.id}</span>`)}
        ${detailRow('Status',              statusBadge(d.status))}
        ${detailRow('Coin',                d.coin)}
        ${detailRow('Network',             d.network)}
        ${detailRow('Crypto Amount',       d.cryptoAmount)}
        ${detailRow('Expected GHS',        `₵${fmt(d.expectedGhsAmount)}`)}
        ${detailRow('Credited GHS',        d.creditedGhsAmount!=null ? `₵${fmt(d.creditedGhsAmount)}` : '—')}
        ${detailRow('TXID',                `<span class="mono">${d.txid||'—'}</span>`)}
        ${detailRow('Sender Address',      `<span class="mono" style="font-size:11px">${d.senderAddress||'—'}</span>`)}
        ${detailRow('User Note',           d.userNote)}
        ${detailRow('Admin Note',          d.adminNote)}
        ${detailRow('Reviewed By',         d.reviewedBy ? `<span class="mono">${d.reviewedBy}</span>` : '—')}
        ${detailRow('Reviewed At',         fmtDate(d.reviewedAt))}
        ${detailRow('Wallet Tx ID',        d.walletTransactionId ? `<span class="mono">${d.walletTransactionId}</span>` : '—')}
        ${detailRow('User ID',             `<span class="mono">${d.userId}</span>`)}
        ${detailRow('Created',             fmtDate(d.createdAt))}
        ${detailRow('Updated',             fmtDate(d.updatedAt))}
      </div>
      ${d.screenshotUrl ? `
        <div class="section-title">Payment Screenshot</div>
        <img class="screenshot-img" src="${d.screenshotUrl}"
             onclick="window.open('${d.screenshotUrl}','_blank')" alt="Payment proof">` : ''}
      <div class="modal-footer">
        ${d.status==='PENDING' ? `
          <button class="btn-success" onclick="closeModal();openApproveDeposit('${d.id}',${d.expectedGhsAmount})">Approve</button>
          <button class="btn-danger"  onclick="closeModal();openRejectDeposit('${d.id}')">Reject</button>` : ''}
        <button class="btn-ghost" onclick="closeModal()">Close</button>
      </div>`;
  } catch (e) {
    document.getElementById('modal-content').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
  }
}

function openApproveDeposit(id, expectedGhs) {
  openModal('Approve Deposit', `
    <div class="alert alert-info">ℹ The user's GHS wallet will be credited immediately on approval.</div>
    <div class="form-group" style="margin-bottom:12px">
      <label>GHS Amount to Credit * (adjust from expected if rate differs)</label>
      <input id="appr-amt" type="number" step="0.01" min="0.01" value="${expectedGhs}">
    </div>
    <div class="form-group" style="margin-bottom:12px">
      <label>Admin Note (optional)</label>
      <textarea id="appr-note" placeholder="Verified on-chain. Rate: 140 GHS/USDT."></textarea>
    </div>
    <div id="appr-msg"></div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-success" id="appr-btn" onclick="approveDeposit('${id}')">✓ Confirm Approve</button>
    </div>`);
}

async function approveDeposit(id) {
  const creditedGhsAmount = parseFloat(document.getElementById('appr-amt').value);
  const adminNote         = document.getElementById('appr-note').value.trim();
  if (!creditedGhsAmount || creditedGhsAmount <= 0) {
    document.getElementById('appr-msg').innerHTML = '<div class="alert alert-error">✕ Enter a valid GHS amount.</div>';
    return;
  }
  const btn = document.getElementById('appr-btn');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Approving…';
  try {
    await api(`/api/admin/binance-deposits/${id}/approve`, 'POST', { creditedGhsAmount, adminNote });
    closeModal();
    showAlert(`Deposit approved! ₵${fmt(creditedGhsAmount)} credited to user wallet.`, 'success');
    renderBinance(binancePage);
  } catch (e) {
    document.getElementById('appr-msg').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
    btn.disabled=false; btn.innerHTML='✓ Confirm Approve';
  }
}

function openRejectDeposit(id) {
  openModal('Reject Deposit', `
    <div class="alert alert-warning">⚠ The user's wallet will NOT be credited. This note will be visible to the user.</div>
    <div class="form-group" style="margin-bottom:12px;margin-top:4px">
      <label>Admin Note / Rejection Reason * (max 1000 chars)</label>
      <textarea id="rej-note" maxlength="1000" placeholder="TXID not found on TRC20 network after 24h."></textarea>
    </div>
    <div id="rej-msg"></div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-danger" id="rej-btn" onclick="rejectDeposit('${id}')">✕ Confirm Reject</button>
    </div>`);
}

async function rejectDeposit(id) {
  const adminNote = document.getElementById('rej-note').value.trim();
  if (!adminNote) {
    document.getElementById('rej-msg').innerHTML = '<div class="alert alert-error">✕ Rejection reason is required.</div>';
    return;
  }
  const btn = document.getElementById('rej-btn');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Rejecting…';
  try {
    await api(`/api/admin/binance-deposits/${id}/reject`, 'POST', { adminNote });
    closeModal();
    showAlert('Deposit rejected.', 'success');
    renderBinance(binancePage);
  } catch (e) {
    document.getElementById('rej-msg').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
    btn.disabled=false; btn.innerHTML='✕ Confirm Reject';
  }
}

async function exportBinanceCSV() {
  const btn = document.querySelector('[onclick="exportBinanceCSV()"]');
  if (btn) { btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Exporting…'; }
  try {
    let rows=[], p=0, total=1;
    while (p < total) {
      const ep = binanceTab==='pending'
        ? `/api/admin/binance-deposits/pending?page=${p}&size=100`
        : `/api/admin/binance-deposits?page=${p}&size=100`;
      const d = await api(ep);
      rows = rows.concat(d.content||[]);
      total = d.totalPages||1;
      p++;
    }
    if (!rows.length) { showAlert('No data to export.','error'); return; }
    const headers=['ID','User ID','TXID','Coin','Network','Crypto Amount','Expected GHS','Credited GHS',
      'Status','Sender Address','User Note','Admin Note','Reviewed By','Reviewed At',
      'Wallet Tx ID','Created At','Updated At'];
    exportCSV(`binance-deposits-${new Date().toISOString().slice(0,10)}.csv`, headers,
      rows.map(d=>[d.id,d.userId,d.txid,d.coin,d.network,d.cryptoAmount,d.expectedGhsAmount,
        d.creditedGhsAmount??'',d.status,d.senderAddress??'',d.userNote??'',d.adminNote??'',
        d.reviewedBy??'',d.reviewedAt??'',d.walletTransactionId??'',d.createdAt,d.updatedAt??'']));
    showAlert(`Exported ${rows.length} deposits to CSV!`, 'success');
  } catch(e) { showAlert('Export failed: '+e.message,'error'); }
  finally { if (btn) { btn.disabled=false; btn.innerHTML='⬇ Export CSV'; } }
}

// ============================================================
// 6. UPGRADE CHATS
// ============================================================
let chatTab = 'all';

async function renderUpgradeChats() {
  const c = document.getElementById('page-content');
  c.innerHTML = `
    <div class="card">
      <div class="card-header"><h2>Admin Upgrade Chats</h2></div>
      <div class="card-body">
        <div class="tabs">
          <button class="tab ${chatTab==='all'?'active':''}"     onclick="chatTab='all';renderUpgradeChats()">All Chats</button>
          <button class="tab ${chatTab==='pending'?'active':''}" onclick="chatTab='pending';renderUpgradeChats()">⏳ Pending Commission</button>
        </div>
        <div id="chats-list">${loading()}</div>
      </div>
    </div>`;
  try {
    const ep   = chatTab==='pending' ? '/api/super-admin/upgrade-chats/pending' : '/api/super-admin/upgrade-chats';
    const data = await api(ep);
    const list = Array.isArray(data) ? data : (data.content||[]);
    document.getElementById('chats-list').innerHTML = list.length ? `
      <div class="tbl-wrap"><table>
        <thead><tr><th>Chat ID</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
        <tbody>${list.map(ch => `<tr>
          ${labeledTd('Chat ID', `<span class="mono">${truncate(ch.id,32)}</span>`)}
          ${labeledTd('Status',  statusBadge(ch.status))}
          ${labeledTd('Created', `<span class="mono">${fmtDate(ch.createdAt)}</span>`)}
          ${labeledTd('Actions', `<div class="btn-row">
            <button class="btn-ghost btn-sm" onclick="openChat('${ch.id}','${ch.status}')">Open Chat</button>
            ${ch.status==='PENDING_COMMISSION'
              ? `<button class="btn-primary btn-sm" onclick="openSetCommission('${ch.id}')">Set Commission</button>`
              : ''}
          </div>`)}
        </tr>`).join('')}</tbody>
      </table></div>` : empty('No chats found.');
  } catch (e) {
    document.getElementById('chats-list').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
  }
}

async function openChat(chatId, status) {
  openModal('Upgrade Chat', loading());
  try {
    const msgs = await api(`/api/super-admin/upgrade-chats/${chatId}/messages`);
    const list = Array.isArray(msgs) ? msgs : (msgs.content||[]);
    document.getElementById('modal-content').innerHTML = `
      ${status==='PENDING_COMMISSION' ? `
        <div class="alert alert-warning" style="margin-bottom:14px">
          ⚠ This chat is awaiting commission rate assignment.
          <button class="btn-primary btn-sm" style="margin-left:10px" onclick="closeModal();openSetCommission('${chatId}')">Set Commission</button>
        </div>` : ''}
      <div class="chat-messages" id="chat-msgs">
        ${list.length ? list.map(m => `
          <div class="msg ${(m.senderRole||'system').toLowerCase()}">
            <div>${m.content}</div>
            <div class="msg-meta">${m.senderRole} · ${fmtDate(m.sentAt)}</div>
          </div>`).join('')
          : '<div style="text-align:center;color:var(--text-dim);padding:24px">No messages yet.</div>'}
      </div>
      <div class="form-group" style="margin-bottom:10px">
        <label>Reply as Super Admin (max 2000 chars)</label>
        <textarea id="chat-reply" maxlength="2000" placeholder="Type your message…"></textarea>
      </div>
      <div id="chat-alert"></div>
      <div class="modal-footer">
        <button class="btn-ghost" onclick="closeModal()">Close</button>
        <button class="btn-primary" id="chat-send-btn" onclick="sendChatMessage('${chatId}','${status}')">Send Message</button>
      </div>`;
    const box = document.getElementById('chat-msgs');
    if (box) box.scrollTop = box.scrollHeight;
  } catch (e) {
    document.getElementById('modal-content').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
  }
}

async function sendChatMessage(chatId, status) {
  const content = document.getElementById('chat-reply').value.trim();
  if (!content) {
    document.getElementById('chat-alert').innerHTML = '<div class="alert alert-error">✕ Message cannot be empty.</div>';
    return;
  }
  const btn = document.getElementById('chat-send-btn');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Sending…';
  try {
    await api(`/api/super-admin/upgrade-chats/${chatId}/messages`, 'POST', { content });
    openChat(chatId, status);
  } catch (e) {
    document.getElementById('chat-alert').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
    btn.disabled=false; btn.innerHTML='Send Message';
  }
}

function openSetCommission(chatId) {
  openModal('Set Commission Rate', `
    <p style="margin-bottom:16px">
      Finalise admin onboarding by setting the referral commission percentage.
      Valid range: <strong>0.1 – 100.0</strong>.
      Status will change to <span class="badge badge-green">COMMISSION_SET</span>.
    </p>
    <div class="form-group" style="margin-bottom:12px">
      <label>Commission Rate (%)</label>
      <input id="comm-rate" type="number" step="0.1" min="0.1" max="100" placeholder="55.0">
    </div>
    <div id="comm-msg"></div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" id="comm-btn" onclick="setCommission('${chatId}')">Confirm</button>
    </div>`);
}

async function setCommission(chatId) {
  const commissionRate = parseFloat(document.getElementById('comm-rate').value);
  if (!commissionRate || commissionRate < 0.1 || commissionRate > 100) {
    document.getElementById('comm-msg').innerHTML = '<div class="alert alert-error">✕ Enter a value between 0.1 and 100.</div>';
    return;
  }
  const btn = document.getElementById('comm-btn');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Setting…';
  try {
    await api(`/api/super-admin/upgrade-chats/${chatId}/set-commission`, 'POST', { commissionRate });
    closeModal();
    showAlert(`Commission set to ${commissionRate}%!`, 'success');
    renderUpgradeChats();
  } catch (e) {
    document.getElementById('comm-msg').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
    btn.disabled=false; btn.innerHTML='Confirm';
  }
}

// ============================================================
// 7. AFFILIATE WITHDRAWALS
// ============================================================
let affPage=0, affStatus='';

async function renderAffiliateWithdrawals(page=0) {
  affPage = page;
  const c = document.getElementById('page-content');
  c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2>Affiliate Withdrawals</h2>
        <button class="btn-ghost btn-sm" onclick="exportAffWithdrawalsCSV()">⬇ Export CSV</button>
      </div>
      <div class="card-body">
        <div class="form-row" style="margin-bottom:16px">
          <div class="form-group">
            <label>Status</label>
            <select onchange="affStatus=this.value;renderAffiliateWithdrawals(0)">
              <option value=""          ${affStatus===''?'selected':''}>All statuses</option>
              <option value="PENDING"   ${affStatus==='PENDING'?'selected':''}>PENDING</option>
              <option value="PROCESSED" ${affStatus==='PROCESSED'?'selected':''}>PROCESSED</option>
              <option value="REJECTED"  ${affStatus==='REJECTED'?'selected':''}>REJECTED</option>
            </select>
          </div>
        </div>
        <div id="aff-list">${loading()}</div>
      </div>
    </div>`;
  try {
    let q = `?page=${affPage}&size=20`;
    if (affStatus) q += `&status=${affStatus}`;
    const data = await api(`/api/super-admin/affiliate-withdrawals${q}`);
    const list = data.content || [];
    document.getElementById('aff-list').innerHTML = list.length ? `
      <div class="tbl-wrap"><table>
        <thead><tr><th>ID</th><th>User ID</th><th>Amount</th><th>Reference</th><th>Status</th><th>Created</th><th>Processed At</th><th>Reject Reason</th><th>Actions</th></tr></thead>
        <tbody>${list.map(w => `<tr>
          ${labeledTd('ID',             `<span class="mono">${truncate(w.id,16)}</span>`)}
          ${labeledTd('User ID',        `<span class="mono">${truncate(w.userId,14)}</span>`)}
          ${labeledTd('Amount',         `<strong>₵${fmt(w.amount)}</strong>`)}
          ${labeledTd('Reference',      `<span class="mono">${w.reference||'—'}</span>`)}
          ${labeledTd('Status',         statusBadge(w.status))}
          ${labeledTd('Created',        `<span class="mono">${fmtDate(w.createdAt)}</span>`)}
          ${labeledTd('Processed At',   `<span class="mono">${fmtDate(w.processedAt)}</span>`)}
          ${labeledTd('Reject Reason',  w.rejectReason||'—')}
          ${labeledTd('Actions', w.status==='PENDING' ? `<div class="btn-row">
            <button class="btn-success btn-sm" onclick="processAffWithdrawal('${w.id}')">Mark Processed</button>
            <button class="btn-danger btn-sm"  onclick="openRejectAffWithdrawal('${w.id}')">Reject</button>
          </div>` : '—')}
        </tr>`).join('')}</tbody>
      </table></div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;flex-wrap:wrap;gap:8px">
        <span class="pager-info">${data.totalElements.toLocaleString()} total</span>
        ${paginator(affPage, data.totalPages, 'renderAffiliateWithdrawals')}
      </div>` : empty('No withdrawals found.');
  } catch (e) {
    document.getElementById('aff-list').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
  }
}

async function processAffWithdrawal(id) {
  if (!confirm('Mark this withdrawal as PROCESSED? This records the payment as completed.')) return;
  try {
    await api(`/api/super-admin/affiliate-withdrawals/${id}/process`, 'POST');
    showAlert('Withdrawal marked as PROCESSED.', 'success');
    renderAffiliateWithdrawals(affPage);
  } catch (e) { showAlert('Error: '+e.message, 'error'); }
}

function openRejectAffWithdrawal(id) {
  openModal('Reject Withdrawal', `
    <div class="alert alert-warning">⚠ Rejecting will re-credit the user's affiliate wallet.</div>
    <div class="form-group" style="margin-bottom:12px;margin-top:4px">
      <label>Reason *</label>
      <textarea id="aff-rej-reason" placeholder="Bank account details not matching…"></textarea>
    </div>
    <div id="aff-rej-msg"></div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-danger" id="aff-rej-btn" onclick="rejectAffWithdrawal('${id}')">Reject & Re-credit Wallet</button>
    </div>`);
}

async function rejectAffWithdrawal(id) {
  const reason = document.getElementById('aff-rej-reason').value.trim();
  if (!reason) {
    document.getElementById('aff-rej-msg').innerHTML = '<div class="alert alert-error">✕ Reason is required.</div>';
    return;
  }
  const btn = document.getElementById('aff-rej-btn');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Rejecting…';
  try {
    await api(`/api/super-admin/affiliate-withdrawals/${id}/reject`, 'POST', { reason });
    closeModal();
    showAlert('Withdrawal rejected. Wallet re-credited.', 'success');
    renderAffiliateWithdrawals(affPage);
  } catch (e) {
    document.getElementById('aff-rej-msg').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
    btn.disabled=false; btn.innerHTML='Reject & Re-credit Wallet';
  }
}

async function exportAffWithdrawalsCSV() {
  const btn = document.querySelector('[onclick="exportAffWithdrawalsCSV()"]');
  if (btn) { btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Exporting…'; }
  try {
    let rows=[], p=0, total=1;
    while (p < total) {
      let q = `?page=${p}&size=100`;
      if (affStatus) q+=`&status=${affStatus}`;
      const d = await api(`/api/super-admin/affiliate-withdrawals${q}`);
      rows = rows.concat(d.content||[]);
      total = d.totalPages||1;
      p++;
    }
    if (!rows.length) { showAlert('No data to export.','error'); return; }
    const headers=['ID','User ID','Amount (GHS)','Reference','Status','Created At','Processed At','Reject Reason'];
    exportCSV(`affiliate-withdrawals-${new Date().toISOString().slice(0,10)}.csv`, headers,
      rows.map(w=>[w.id,w.userId,w.amount,w.reference,w.status,w.createdAt,w.processedAt??'',w.rejectReason??'']));
    showAlert(`Exported ${rows.length} rows!`, 'success');
  } catch(e) { showAlert('Export failed: '+e.message,'error'); }
  finally { if (btn) { btn.disabled=false; btn.innerHTML='⬇ Export CSV'; } }
}

// ============================================================
// 8. PAYOUT REQUESTS
// ============================================================
async function renderPayoutRequests() {
  const c = document.getElementById('page-content');
  c.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2>Admin Payout Requests</h2>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:var(--text-muted)">Note: API returns REQUESTED status only</span>
          <button class="btn-ghost btn-sm" onclick="renderPayoutRequests()">↻ Refresh</button>
        </div>
      </div>
      <div class="card-body"><div id="payout-list">${loading()}</div></div>
    </div>`;
  try {
    const data = await api('/api/super-admin/payout-requests');
    const list = Array.isArray(data) ? data : (data.content||[]);
    document.getElementById('payout-list').innerHTML = list.length ? `
      <div class="tbl-wrap"><table>
        <thead><tr><th>ID</th><th>Amount</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
        <tbody>${list.map(p => `<tr>
          ${labeledTd('ID',      `<span class="mono">${truncate(p.id,22)}</span>`)}
          ${labeledTd('Amount',  `<strong>₵${fmt(p.amount)}</strong>`)}
          ${labeledTd('Status',  statusBadge(p.status))}
          ${labeledTd('Created', `<span class="mono">${fmtDate(p.createdAt)}</span>`)}
          ${labeledTd('Actions', `<div class="btn-row">
            ${p.status==='REQUESTED' ? `
              <button class="btn-success btn-sm" onclick="approvePayoutReq('${p.id}')">Approve</button>
              <button class="btn-danger btn-sm"  onclick="openRejectPayoutReq('${p.id}')">Reject</button>` : ''}
            ${p.status==='APPROVED' ? `
              <button class="btn-primary btn-sm" onclick="markPayoutPaid('${p.id}')">Mark Paid</button>
              <button class="btn-danger btn-sm"  onclick="openRejectPayoutReq('${p.id}')">Reject</button>` : ''}
          </div>`)}
        </tr>`).join('')}</tbody>
      </table></div>` : empty('No pending payout requests.');
  } catch (e) {
    document.getElementById('payout-list').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
  }
}

async function approvePayoutReq(id) {
  if (!confirm('Approve this payout request? (Wallet not debited yet — debit happens on Mark Paid.)')) return;
  try {
    await api(`/api/super-admin/payout-requests/${id}/approve`, 'POST');
    showAlert('Payout approved. Use "Mark Paid" to debit the wallet when payment is sent.', 'success', 6000);
    renderPayoutRequests();
  } catch (e) { showAlert('Error: '+e.message, 'error'); }
}

async function markPayoutPaid(id) {
  if (!confirm("Mark as PAID? ⚠ This will immediately debit the admin's affiliate wallet.")) return;
  try {
    await api(`/api/super-admin/payout-requests/${id}/mark-paid`, 'POST');
    showAlert('Payout marked as PAID. Affiliate wallet debited.', 'success');
    renderPayoutRequests();
  } catch (e) { showAlert('Error: '+e.message, 'error'); }
}

function openRejectPayoutReq(id) {
  openModal('Reject Payout Request', `
    <div class="form-group" style="margin-bottom:12px">
      <label>Rejection Reason *</label>
      <textarea id="pr-rej-reason" placeholder="Insufficient verification…"></textarea>
    </div>
    <div id="pr-rej-msg"></div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-danger" id="pr-rej-btn" onclick="rejectPayoutReq('${id}')">Reject</button>
    </div>`);
}

async function rejectPayoutReq(id) {
  const reason = document.getElementById('pr-rej-reason').value.trim();
  if (!reason) {
    document.getElementById('pr-rej-msg').innerHTML = '<div class="alert alert-error">✕ Reason is required.</div>';
    return;
  }
  const btn = document.getElementById('pr-rej-btn');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Rejecting…';
  try {
    await api(`/api/super-admin/payout-requests/${id}/reject`, 'POST', { reason });
    closeModal();
    showAlert('Payout request rejected.', 'success');
    renderPayoutRequests();
  } catch (e) {
    document.getElementById('pr-rej-msg').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
    btn.disabled=false; btn.innerHTML='Reject';
  }
}

// ============================================================
// 9. AUDIT LOG
// ============================================================
let auditPage=0;

async function renderAuditLog(page=0) {
  auditPage = page;
  const c = document.getElementById('page-content');
  c.innerHTML = `
    <div class="card">
      <div class="card-header"><h2>Audit Log</h2></div>
      <div class="card-body"><div id="audit-list">${loading()}</div></div>
    </div>`;
  try {
    const data = await api(`/api/super-admin/audit-log?page=${auditPage}&size=50`);
    const list = data.content || [];
    document.getElementById('audit-list').innerHTML = list.length ? `
      <div class="tbl-wrap"><table>
        <thead><tr><th>Date</th><th>Action</th><th>Resource</th><th>Resource ID</th><th>Actor ID</th><th>Metadata</th></tr></thead>
        <tbody>${list.map(a => `<tr>
          ${labeledTd('Date',        `<span class="mono">${fmtDate(a.createdAt)}</span>`)}
          ${labeledTd('Action',      `<span class="badge badge-blue">${a.action||'—'}</span>`)}
          ${labeledTd('Resource',    a.resource||'—')}
          ${labeledTd('Resource ID', `<span class="mono">${truncate(a.resourceId,20)}</span>`)}
          ${labeledTd('Actor ID',    `<span class="mono">${truncate(a.actorId,20)}</span>`)}
          ${labeledTd('Metadata',    a.metadata ? `<span style="font-size:11px;color:var(--text-muted)">${JSON.stringify(a.metadata)}</span>` : '—')}
        </tr>`).join('')}</tbody>
      </table></div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;flex-wrap:wrap;gap:8px">
        <span class="pager-info">${data.totalElements.toLocaleString()} total entries</span>
        ${paginator(auditPage, data.totalPages, 'renderAuditLog')}
      </div>` : empty('No audit entries found.');
  } catch (e) {
    document.getElementById('audit-list').innerHTML = `<div class="alert alert-error">✕ ${e.message}</div>`;
  }
}

// ============================================================
// INIT — read token from localStorage, redirect to auth if missing
// ============================================================
window.onload = () => {
  const token = localStorage.getItem('fb_token');
  if (!token) {
    window.location.href = 'auth.html';
    return;
  }
  config.token = token;
  renderDashboard();
};
