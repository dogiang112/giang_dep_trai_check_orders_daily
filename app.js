const MAX_THREADS = 5;

const els = {
  form: document.getElementById('config-form'),
  date: document.getElementById('date'),
  apiKey: document.getElementById('apiKey'),
  shopId: document.getElementById('shopId'),
  gsUrl: document.getElementById('gsUrl'),
  exportNowBtn: document.getElementById('exportNowBtn'),
  addGroupBtn: document.getElementById('addGroupBtn'),
  groupName: document.getElementById('groupName'),
  groupPids: document.getElementById('groupPids'),
  groupList: document.getElementById('groupList'),
  clearGroupsBtn: document.getElementById('clearGroupsBtn'),
  loadSampleBtn: document.getElementById('loadSampleBtn'),
  exportGroupsBtn: document.getElementById('exportGroupsBtn'),
  status: document.getElementById('status'),
  progress: document.getElementById('progress'),
  results: document.getElementById('results'),
  statsCard: document.getElementById('stats-card'),
  successCount: document.getElementById('success-count'),
  failedCount: document.getElementById('failed-count'),
  totalCount: document.getElementById('total-count'),
  successRate: document.getElementById('success-rate'),
};

let productGroups = {}; // { groupName: [pid, ...] }
let latestSummaries = null; // Lưu bản tóm tắt gần nhất để xuất

function saveState() {
  const state = {
    date: els.date.value,
    apiKey: els.apiKey.value ? '__MASKED__' : '',
    shopId: els.shopId.value,
    groups: productGroups,
  };
  localStorage.setItem('tdtn_state', JSON.stringify(state));
}

function loadState() {
  const s = localStorage.getItem('tdtn_state');
  if (!s) return;
  try {
    const state = JSON.parse(s);
    if (state.date) els.date.value = state.date;
    if (state.shopId) els.shopId.value = state.shopId;
    if (state.groups) productGroups = state.groups;
    renderGroups();
  } catch {}
}

function setStatus(text) {
  els.status.textContent = text;
}

function setProgress(pct) {
  if (pct === null) {
    els.progress.hidden = true;
    els.progress.value = 0;
    return;
  }
  els.progress.hidden = false;
  els.progress.value = pct;
}

function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function updateExportButtonState() {
  const hasSummaries = !!latestSummaries;
  const urlOk = els.gsUrl && isValidUrl(els.gsUrl.value.trim());
  if (!els.exportNowBtn) return;
  els.exportNowBtn.disabled = !(hasSummaries && urlOk);
}

function formatNumber(n) {
  return new Intl.NumberFormat('vi-VN').format(n);
}

function showStats(success, failed, total) {
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
  
  els.successCount.textContent = formatNumber(success);
  els.failedCount.textContent = formatNumber(failed);
  els.totalCount.textContent = formatNumber(total);
  els.successRate.textContent = `${successRate}%`;
  
  els.statsCard.style.display = 'block';
}

function renderGroups() {
  els.groupList.innerHTML = '';
  const entries = Object.entries(productGroups);
  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'group-card';
    empty.textContent = 'Chưa có nhóm nào. Hãy thêm nhóm ở trên.';
    els.groupList.appendChild(empty);
    return;
  }
  for (const [groupName, pids] of entries) {
    const card = document.createElement('div');
    card.className = 'group-card';

    const header = document.createElement('div');
    header.className = 'group-card-header';

    const title = document.createElement('div');
    title.className = 'group-title';
    title.textContent = groupName;

    const btns = document.createElement('div');
    const del = document.createElement('button');
    del.className = 'danger';
    del.type = 'button';
    del.textContent = '×';
    del.title = 'Xóa nhóm';
    del.onclick = () => { delete productGroups[groupName]; renderGroups(); saveState(); };
    btns.appendChild(del);

    header.appendChild(title);
    header.appendChild(btns);

    const pidList = document.createElement('div');
    pidList.className = 'pid-list';
    pidList.style.display = 'none'; // Ẩn danh sách product ID
    for (const pid of pids) {
      const badge = document.createElement('span');
      badge.className = 'pid-badge';
      badge.textContent = pid;
      const rm = document.createElement('button');
      rm.className = 'pid-remove';
      rm.type = 'button';
      rm.textContent = '×';
      rm.title = 'Xoá ID này khỏi nhóm';
      rm.onclick = () => {
        productGroups[groupName] = productGroups[groupName].filter(x => x !== pid);
        renderGroups();
        saveState();
      };
      badge.appendChild(rm);
      pidList.appendChild(badge);
    }

    const addRow = document.createElement('div');
    addRow.style.marginTop = '8px';
    addRow.style.display = 'none'; // Ẩn phần thêm product ID
    const addInput = document.createElement('input');
    addInput.placeholder = 'Thêm ID sản phẩm, cách nhau bởi dấu phẩy';
    addInput.style.width = '70%';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'secondary';
    addBtn.textContent = 'Thêm ID';
    addBtn.style.marginLeft = '8px';
    addBtn.onclick = () => {
      const ids = addInput.value.split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length === 0) return;
      const set = new Set(productGroups[groupName]);
      for (const id of ids) set.add(id);
      productGroups[groupName] = Array.from(set);
      renderGroups();
      saveState();
      addInput.value = '';
    };
    addRow.appendChild(addInput);
    addRow.appendChild(addBtn);

    card.appendChild(header);
    card.appendChild(pidList);
    card.appendChild(addRow);
    els.groupList.appendChild(card);
  }
}

function addGroupFromInputs() {
  const name = els.groupName.value.trim();
  const pids = els.groupPids.value.split(',').map(s => s.trim()).filter(Boolean);
  if (!name || pids.length === 0) return;
  const set = new Set(productGroups[name] || []);
  for (const id of pids) set.add(id);
  productGroups[name] = Array.from(set);
  els.groupName.value = '';
  els.groupPids.value = '';
  renderGroups();
  saveState();
}

els.addGroupBtn.addEventListener('click', addGroupFromInputs);
els.clearGroupsBtn.addEventListener('click', () => { productGroups = {}; renderGroups(); saveState(); });

// Event listeners cho các button mới
els.loadSampleBtn.addEventListener('click', loadFixedGroups);

els.exportGroupsBtn.addEventListener('click', () => {
  setStatus('Chức năng xuất nhóm đã được ẩn theo yêu cầu');
});


function buildOrdersUrl(shopId) {
  return `https://pos.pages.fm/api/v1/shops/${shopId}/orders`;
}
function buildOrderDetailUrl(shopId, orderId) {
  return `https://pos.pages.fm/api/v1/shops/${shopId}/orders/${orderId}`;
}

function toTimestampAtTZ(dateStr, h, m, s, tzOffsetHours) {
  const [y, mo, d] = dateStr.split('-').map(n => parseInt(n, 10));
  const utc = Date.UTC(y, mo - 1, d, h - tzOffsetHours, m, s, 0);
  return Math.floor(utc / 1000);
}

async function fetchOrderIds(apiKey, shopId, date) {
  const url = buildOrdersUrl(shopId);
  const startDateTime = toTimestampAtTZ(date, 0, 0, 0, -7 * -1); // we'll set below properly
}

async function fetchOrderIdsPaged(apiKey, shopId, date) {
  const url = buildOrdersUrl(shopId);
  const startTs = toTimestampAtTZ(date, 0, 0, 0, 7);
  const endTs = toTimestampAtTZ(date, 23, 59, 59, 7);
  const orderIds = [];
  let page = 1;
  while (true) {
    const params = new URLSearchParams({
      api_key: apiKey,
      page_size: '100',
      page_number: String(page),
      startDateTime: String(startTs),
      endDateTime: String(endTs),
    });
    const res = await fetch(`${url}?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Lỗi API orders: ${res.status} - ${text}`);
    }
    const data = await res.json();
    const orders = data.data || data.orders || data.list || data.items || [];
    if (!Array.isArray(orders) || orders.length === 0) break;
    for (const o of orders) { if (o && o.id) orderIds.push(o.id); }
    if (orders.length < 100) break;
    page += 1;
  }
  return orderIds;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchOrderDetailWithRetry(apiKey, shopId, orderId) {
  const url = buildOrderDetailUrl(shopId, orderId);
  const maxRetries = 3;
  const retryDelay = 2000;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) await sleep(retryDelay * attempt);
    try {
      const res = await fetch(`${url}?${new URLSearchParams({ api_key: apiKey }).toString()}`, { method: 'GET' });
      if (res.status === 200) {
        const data = await res.json();
        const order = data.data || data.order || data;
        if (order && typeof order === 'object') return order;
      } else if (res.status === 429) {
        const wait = retryDelay * Math.pow(2, attempt);
        setStatus(`Rate limit cho đơn ${orderId}, chờ ${wait/1000}s...`);
        await sleep(wait);
        continue;
      } else {
        const text = await res.text();
        console.warn(`Lỗi đơn ${orderId}: ${res.status} - ${text}`);
        break;
      }
    } catch (e) {
      console.warn(`Lỗi lấy đơn ${orderId} (lần ${attempt + 1}):`, e);
      if (attempt < maxRetries - 1) await sleep(retryDelay);
    }
  }
  return null;
}

async function promisePool(items, worker, concurrency, onProgress) {
  const results = new Array(items.length);
  let nextIndex = 0;
  let done = 0;
  const workers = new Array(Math.min(concurrency, items.length)).fill(0).map(async () => {
    while (true) {
      const current = nextIndex++;
      if (current >= items.length) break;
      try {
        results[current] = await worker(items[current], current);
      } finally {
        done++;
        if (onProgress) onProgress(done, items.length);
      }
    }
  });
  await Promise.all(workers);
  return results;
}

function analyze(productGroupsMap, orders) {
  const result = {};
  for (const [groupName, pids] of Object.entries(productGroupsMap)) {
    result[groupName] = {
      group_name: groupName,
      product_ids: pids,
      total_orders: 0,
      total_quantity: 0,
      total_money_to_collect: 0,
      related_items: {}, // pid -> { name, total_qty }
    };
  }

  for (const order of orders) {
    if (!order) continue;
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) continue;
    const orderPidSet = new Set(items.map(i => i && i.product_id).filter(Boolean));
    const money = order.money_to_collect || 0;
    if (orderPidSet.size === 0) continue;

    for (const [groupName, pids] of Object.entries(productGroupsMap)) {
      const hasAny = pids.some(pid => orderPidSet.has(pid));
      if (!hasAny) continue;
      const r = result[groupName];
      r.total_orders += 1;
      r.total_money_to_collect += money;
      for (const item of items) {
        if (!item || !item.product_id) continue;
        const pid = item.product_id;
        const name = (item.variation_info && item.variation_info.name) || '';
        const qty = item.quantity || 0;
        if (pids.includes(pid)) r.total_quantity += qty;
        if (!r.related_items[pid]) r.related_items[pid] = { name: name, total_qty: 0 };
        r.related_items[pid].name = name || r.related_items[pid].name;
        r.related_items[pid].total_qty += qty;
      }
    }
  }
  return result;
}

function renderResults(summaries) {
  els.results.innerHTML = '';
  latestSummaries = summaries;
  updateExportButtonState();
  for (const [groupName, summary] of Object.entries(summaries)) {
    const card = document.createElement('div');
    card.className = 'result-card';

    const header = document.createElement('div');
    header.className = 'result-header';
    const h = document.createElement('div');
    h.textContent = groupName;
    h.style.fontWeight = '700';
    h.style.fontSize = '16px';

    const metrics = document.createElement('div');
    metrics.className = 'metrics';
    const m1 = document.createElement('div'); m1.className = 'metric'; m1.textContent = `Đơn: ${formatNumber(summary.total_orders)}`;
    const m2 = document.createElement('div'); m2.className = 'metric'; m2.textContent = `Số lượng: ${formatNumber(summary.total_quantity)}`;
    const m3 = document.createElement('div'); m3.className = 'metric'; m3.textContent = `COD: ${formatNumber(summary.total_money_to_collect)} đ`;
    metrics.appendChild(m1); metrics.appendChild(m2); metrics.appendChild(m3);

    header.appendChild(h);
    header.appendChild(metrics);

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Tên</th><th>S.Lượng</th></tr>';
    const tbody = document.createElement('tbody');
    const entries = Object.entries(summary.related_items || {});
    entries.sort((a,b) => (b[1].total_qty||0) - (a[1].total_qty||0));
    for (const [pid, info] of entries) {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td'); td1.textContent = info.name || '';
      const td2 = document.createElement('td'); td2.textContent = String(info.total_qty || 0);
      tr.appendChild(td1); tr.appendChild(td2);
      tbody.appendChild(tr);
    }
    table.appendChild(thead);
    table.appendChild(tbody);

    card.appendChild(header);
    card.appendChild(table);
    els.results.appendChild(card);
  }
}

function buildMetricsRowsFromSummaries(summaries, dateStr) {
  const rows = [];
  for (const [groupName, s] of Object.entries(summaries || {})) {
    rows.push({
      date: dateStr,
      group_name: groupName,
      total_orders: s.total_orders || 0,
      total_quantity: s.total_quantity || 0,
      total_money_to_collect: s.total_money_to_collect || 0,
    });
  }
  return rows;
}


async function runAnalysis(evt) {
  evt.preventDefault();
  const apiKey = els.apiKey.value.trim();
  const shopId = els.shopId.value.trim();
  const date = els.date.value.trim();
  if (!apiKey || !shopId || !date) { setStatus('Vui lòng nhập đủ ngày, API Key và Shop ID'); return; }
  if (Object.keys(productGroups).length === 0) { setStatus('Chưa có nhóm sản phẩm'); return; }

  setStatus('Đang lấy danh sách đơn trong ngày...');
  setProgress(3);
  
  // Ẩn section thống kê khi bắt đầu phân tích mới
  els.statsCard.style.display = 'none';
  let orderIds = [];
  try {
    orderIds = await fetchOrderIdsPaged(apiKey, shopId, date);
  } catch (e) {
    setStatus(`Lỗi lấy danh sách đơn: ${e.message || e}`);
    setProgress(null);
    return;
  }
  setStatus(`Đã lấy ${orderIds.length} đơn. Đang tải chi tiết...`);
  if (orderIds.length === 0) { setProgress(null); return; }

  let doneCount = 0;
  const orders = await promisePool(orderIds, async (oid) => {
    const order = await fetchOrderDetailWithRetry(apiKey, shopId, oid);
    doneCount++;
    setProgress(Math.round((doneCount / orderIds.length) * 100));
    return order;
  }, MAX_THREADS);

  const success = orders.filter(Boolean).length;
  const failed = orders.length - success;
  const total = orders.length;
  
  setStatus(`Hoàn thành phân tích! Đã xử lý ${total} đơn hàng.`);
  setProgress(null);

  // Hiển thị thống kê chi tiết
  showStats(success, failed, total);

  const summaries = analyze(productGroups, orders);
  renderResults(summaries);

  saveState();
}

els.form.addEventListener('submit', runAnalysis);

async function exportToGoogleSheets() {
  const url = els.gsUrl.value.trim();
  if (!isValidUrl(url)) { setStatus('URL không hợp lệ'); return; }
  if (!latestSummaries) { setStatus('Chưa có dữ liệu để xuất'); return; }
  const rows = buildMetricsRowsFromSummaries(latestSummaries, els.date.value);
  const productRows = buildProductQuantityRowsFromSummaries(latestSummaries, els.date.value);
  if (productRows.length === 0) {
    setStatus('Cảnh báo: Không có product_rows nào được tạo (chỉ xuất ID nằm trong nhóm).');
  } else {
    const sample = productRows.slice(0, 3).map(r => `${r.product_id}:${r.total_quantity}`).join(', ');
    setStatus(`Chuẩn bị xuất ${productRows.length} product_rows. Ví dụ ID:Qty ${sample}`);
  }
  if (rows.length === 0 && productRows.length === 0) { setStatus('Không có hàng dữ liệu để xuất'); return; }
  const payload = { type: 'metrics', date: els.date.value, rows, product_rows: productRows };
  try {
    els.exportNowBtn.disabled = true;
    setStatus(`Đang xuất ${rows.length} hàng nhóm + ${productRows.length} hàng theo product_id sang Google Sheets...`);
    // Gửi JSON dưới content-type text/plain để tránh preflight; GAS parse e.postData.contents
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const rawText = await res.text();
    if (!res.ok) {
      throw new Error(`${res.status} - ${rawText}`);
    }
    let info = {};
    try { info = JSON.parse(rawText); } catch { info = { raw: rawText }; }
    const msg = info && info.ok
      ? (() => {
          const metricsUpdated = (info.results && info.results.metrics && info.results.metrics.groupsUpdated) || (info.result && info.result.metrics && info.result.metrics.groupsUpdated) || 0;
          const productUpdated = (info.results && info.results.product && info.results.product.updated) || (info.result && info.result.product && info.result.product.updated) || 0;
          const productMissing = (info.results && info.results.product && Array.isArray(info.results.product.missing) && info.results.product.missing.length) || (info.result && info.result.product && Array.isArray(info.result.product.missing) && info.result.product.missing.length) || 0;
          return `Xuất thành công: groupsUpdated=${metricsUpdated}, productUpdated=${productUpdated}, productMissing=${productMissing}`;
        })()
      : `Xuất xong nhưng phản hồi: ${rawText}`;
    setStatus(msg);
  } catch (e) {
    setStatus(`Xuất thất bại: ${e.message || e}`);
  } finally {
    updateExportButtonState();
  }
}

// Định nghĩa các nhóm sản phẩm cố định
const FIXED_PRODUCT_GROUPS = {
  "(1) Văn_Trúc        :": ["94b73162-db8e-45f2-91d3-ccf4365ef521"],
  "(2) Mẹ_Thuốc        :": ["b31f9bcf-09ee-4ff9-9a60-54dc4f66ebb1"],
  "(3) Chàm_Mèo        :": ["034c3893-264a-49d4-b3d2-85255aeb3dc7", "b4c79f4f-5882-4388-8818-ddf8c3bdf1db","396dfd64-c838-4385-aa1b-d87b3802d7a4"],
  "(4) Sung_Cảnh       :": ["f34f5a3d-5b41-4b94-88de-49fe85e1c3a4"],
  "(5) Búp_Sen         :": ["515fac53-1d92-44b6-919c-ab772a07c8fe"],
  "(6) Sâm_Béo         :":["dbe8ac7d-4189-4f17-b6e2-a7bc047eacab"],
  "(7) May_Mắn         :":["a04219f6-ac73-4b30-8d1b-bddea5d32802"],
  "(8) Kim_ngân        :":["26f05750-3b94-4581-b40a-25de62b0a7bc"],
  "(9) Khúng_Khéng     :":["25515516-abde-4adf-8192-69c6efb1c635", "9dee6257-225a-4f74-8f95-22716662fa2d"],
  "(10) Trục_Hàn       :":["59a39c1a-fe01-44d1-b587-81fefd614dd2"],
  "(11) Vông_Nem       :":["fb322786-0e89-4f88-a61c-83f3447f4b82"],
  "(12) Giống_bứa      :":["f40a795c-c9a6-4e04-bf89-a2232bab915b"],
  "(13) Bưởi_Non        :": ["872518d8-c806-4fde-bdc5-2858a73bc6b6", "10a784f2-4c3c-47c0-ab60-0d4e3e94b9a6"],
  "(14) Tía_Tô         :":["62ad48ab-86f4-45d5-ba6b-3de38925e938"],
  "(15) TNK+cỏ_xước    :":["40d00e4d-5c95-4095-961c-b8edbff7a41f"],
  "(16) Vỏ_Trâm        :":["8637e0b0-be69-4bba-a627-dc5a6cfa8778"],
  "(17) Ngót_Rừng      :":["6cb9b9da-7e22-439d-b4cd-33f3c939dd6f"],
 // "Thằn lằn cẩm thạch":["bdabf31f-cd55-41da-a6fc-c661d7c5b21d"],
  "(18) Tùng_Kim_Cương :":["b6679c70-7fe2-4f35-9a2d-21148a1628a8"],
  "(19) Lan_Chuông     :":["35adaa92-6c1e-4b33-9d7b-de46f68c2475"],
  "(20) Bầu_Đất_Mâm_Xôi:":["5010c8de-bffe-400a-9a5f-08c38b29b4b6"],
  "(21) Dòi_Tía        :":["01e7fe63-9769-4c3d-90fc-81d4914b531f", "a3922dbf-c250-44cb-b3eb-291e75881164"],
  //"Ớt ngũ sắc":["b45e1d76-0268-4b94-aa59-df2740deb7e6"],
  "(22) Lựu_Bonsai     :":["8851ae14-3a95-4199-9559-d42e6f651772"],
  "(23) Hồng_Ngọc_Mai  :":["b41d3ba0-b8d3-4aea-a638-c95cbd5cf7ea"],
  "(24) Giống_Nhội     :":["d47bc13c-c669-44a5-9759-87a04b69519a"],
  "(25) Tam_Thất_Bắc   :":["5eb99318-6623-42ca-afb6-859ecbe6395e"],
  "(26) Trầu_Bà        :":["610f2e28-eb90-4e1b-95f8-fc1b1bacec9c", "2a0d217a-94b6-469d-b222-859b3c3b61b3"],
  "(28) Vạn_tuế        :":["327efe46-126d-4fa4-9c9f-7566979a9879"],
};

function loadFixedGroups() {
  productGroups = { ...FIXED_PRODUCT_GROUPS };
  renderGroups();
  saveState();
  setStatus('Đã tải nhóm mẫu thành công!');
}

(function init() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  els.date.value = `${yyyy}-${mm}-${dd}`;
  loadState();
  
  
  renderGroups();
  if (els.gsUrl) {
    els.gsUrl.addEventListener('input', updateExportButtonState);
  }
  if (els.exportNowBtn) {
    els.exportNowBtn.addEventListener('click', exportToGoogleSheets);
  }
  updateExportButtonState();
})();

// Trích xuất số lượng theo product_id từ summaries để xuất sang trang tính
function buildProductQuantityRowsFromSummaries(summaries, dateStr) {
  const rows = [];
  for (const [groupName, s] of Object.entries(summaries || {})) {
    const related = s.related_items || {};
    const allowedIds = new Set((s.product_ids || []).length ? s.product_ids : (productGroups[groupName] || []));
    for (const [productId, info] of Object.entries(related)) {
      if (allowedIds.size > 0 && !allowedIds.has(productId)) continue; // chỉ xuất ID thuộc nhóm
      rows.push({
        date: dateStr,
        group_name: groupName,
        product_id: productId,
        product_name: info.name || '',
        total_quantity: info.total_qty || 0,
      });
    }
  }
  return rows;
}

