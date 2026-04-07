const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const css = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#111;background:#fff}
  @page{size:A4;margin:15mm 18mm}
  @media print{.no-print{display:none!important}}
  .pb{page-break-before:always}
  .header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1d4ed8;padding-bottom:10px;margin-bottom:16px}
  .brand{font-size:18px;font-weight:800;color:#1d4ed8}.sub{font-size:11px;color:#6b7280;margin-top:2px}
  .meta{text-align:right;font-size:11px;color:#6b7280}.dnum{font-family:monospace;font-size:15px;font-weight:700;color:#111}
  .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
  .card{border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px}
  .cv{font-size:22px;font-weight:800;color:#1d4ed8}.cl{font-size:10px;color:#6b7280;margin-top:2px}
  h2{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin:14px 0 6px}
  .box{border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:12px}
  .box-head{background:#f9fafb;padding:6px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;border-bottom:1px solid #e5e7eb}
  .ret-head{background:#fffbeb;color:#92400e;border-color:#fde68a}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;border-bottom:1px solid #e5e7eb;padding:6px 10px}
  td{padding:7px 10px;border-bottom:1px solid #f3f4f6;font-size:11px;vertical-align:top}
  tr:last-child td{border-bottom:none}
  .mono{font-family:monospace;font-weight:700}
  .rh{border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;margin-bottom:12px;background:#f8fafc}
  .rname{font-size:15px;font-weight:700}.rmeta{color:#6b7280;font-size:11px;margin-top:3px}
  .sig{margin-top:20px;padding-top:12px;border-top:1px dashed #d1d5db;display:flex;justify-content:space-between;color:#9ca3af;font-size:10px}
  .tag{display:inline-block;background:#f3f4f6;padding:2px 8px;border-radius:4px;font-family:monospace;font-size:11px;font-weight:700}
  .ret-tag{background:#fef3c7;color:#92400e}
  .note{color:#6b7280;font-style:italic;font-size:11px}
  .photo-thumb{width:48px;height:48px;object-fit:cover;border-radius:4px;border:1px solid #e5e7eb}
`;

function itemsTable(items, isPhoto) {
  if (!items.length) return `<p style="padding:10px 12px;color:#9ca3af;font-style:italic;font-size:11px">No items recorded</p>`;
  if (isPhoto) return `
    <table><thead><tr><th>Photo</th><th>Brand</th><th>Model</th><th>Year</th><th>Note</th><th>Qty</th></tr></thead><tbody>
    ${items.map(i => `<tr>
      <td>${i.photo_url ? `<img src="${i.photo_url}" class="photo-thumb"/>` : '—'}</td>
      <td>${i.vehicle_brand||'—'}</td><td>${i.vehicle_model||'—'}</td>
      <td>${i.manufacture_year||'—'}</td>
      <td class="note">${i.note||'—'}</td>
      <td style="font-weight:700">${i.quantity}</td>
    </tr>`).join('')}
    </tbody></table>`;
  return `
    <table><thead><tr><th>Brand</th><th>Model</th><th>Product / Part</th><th>SKU</th><th>Qty</th></tr></thead><tbody>
    ${items.map(i => `<tr>
      <td>${i.vehicle_brand||'—'}</td><td>${i.vehicle_model||'—'}</td>
      <td>${i.product_name||''}${i.part_name ? ' · '+i.part_name : ''}</td>
      <td class="mono" style="font-size:10px;color:#6b7280">${i.sku||'—'}</td>
      <td style="font-weight:700">${i.quantity}</td>
    </tr>`).join('')}
    </tbody></table>`;
}

function returnItemsTable(items) {
  if (!items.length) return '';
  return `
    <table><thead><tr><th>Brand</th><th>Model</th><th>Product / Part</th><th>Qty</th></tr></thead><tbody>
    ${items.map(i => {
      const brand   = i.photo_brand || i.vehicle_brand || '—';
      const model   = i.photo_model || i.vehicle_model || '—';
      const product = i.product_name ? `${i.product_name}${i.part_name ? ' · '+i.part_name : ''}` : '—';
      return `<tr><td>${brand}</td><td>${model}</td><td>${product}</td><td style="font-weight:700">${i.quantity}</td></tr>`;
    }).join('')}
    </tbody></table>`;
}

function retailerPage(orders, linkedReturn, dispatch, isFirst) {
  const first = orders[0];
  const ordersHtml = orders.map(order => `
    <div style="margin-bottom:14px">
      <div style="margin-bottom:8px">
        <span class="tag">${order.order_number}</span>
        ${order.notes ? `<span class="note" style="margin-left:8px">Note: ${order.notes}</span>` : ''}
      </div>
      <div class="box">
        <div class="box-head">Items</div>
        ${itemsTable(order.items, order.order_type === 'photo')}
      </div>
    </div>`).join('');

  const retSection = linkedReturn ? `
    <div class="box" style="border-color:#fde68a">
      <div class="box-head ret-head">↩ Return Pickup &nbsp;·&nbsp; <span class="ret-tag mono">${linkedReturn.return_number}</span></div>
      ${linkedReturn.reason ? `<div style="padding:7px 12px;border-bottom:1px solid #fde68a" class="note">"${linkedReturn.reason}"</div>` : ''}
      ${returnItemsTable(linkedReturn.items)}
    </div>` : '';

  return `
    <div class="${isFirst ? '' : 'pb'}">
      <div class="header">
        <div><div class="brand">Purzaa</div><div class="sub">${dispatch.dispatch_number} &nbsp;·&nbsp; Retailer Sheet</div></div>
        <div class="meta"><div>${dispatch.city}${dispatch.state ? ', '+dispatch.state : ''}</div><div>${fmt(dispatch.created_at)}</div></div>
      </div>
      <div class="rh">
        <div class="rname">${first.retailer_name}</div>
        <div class="rmeta">${[first.mobile, first.city, first.state].filter(Boolean).join(' · ')}</div>
      </div>
      ${ordersHtml}
      ${retSection}
      <div class="sig"><span>Signature: _______________________</span><span>Date: _______________________</span></div>
    </div>`;
}

function returnOnlyPage(ret, dispatch) {
  return `
    <div class="pb">
      <div class="header">
        <div><div class="brand">Purzaa</div><div class="sub">${dispatch.dispatch_number} &nbsp;·&nbsp; Return Pickup</div></div>
        <div class="meta"><div>${dispatch.city}${dispatch.state ? ', '+dispatch.state : ''}</div><div>${fmt(dispatch.created_at)}</div></div>
      </div>
      <div class="rh">
        <div class="rname">${ret.retailer_name}</div>
        <div class="rmeta">${[ret.mobile, ret.city, ret.state].filter(Boolean).join(' · ')}</div>
      </div>
      <div class="box" style="border-color:#fde68a">
        <div class="box-head ret-head">↩ Return &nbsp;·&nbsp; <span class="ret-tag mono">${ret.return_number}</span></div>
        ${ret.reason ? `<div style="padding:7px 12px;border-bottom:1px solid #fde68a" class="note">"${ret.reason}"</div>` : ''}
        ${returnItemsTable(ret.items)}
      </div>
      <div class="sig"><span>Signature: _______________________</span><span>Date: _______________________</span></div>
    </div>`;
}

export function printDispatch(data) {
  const orders  = data.orders || [];
  const returns = data.return_delivery?.requests || [];
  const totalItems  = orders.reduce((s, o) => s + o.items.length, 0);
  const returnCount = returns.length;

  const retByRetailer = {};
  for (const r of returns) retByRetailer[r.retailer_id] = r;
  const orderRetailerIds = new Set(orders.map(o => o.retailer_id));
  const standaloneReturns = returns.filter(r => !orderRetailerIds.has(r.retailer_id));

  const summaryPage = `
    <div>
      <div class="header">
        <div><div class="brand">Purzaa</div><div class="sub">Dispatch Run Sheet</div></div>
        <div class="meta">
          <div class="dnum">${data.dispatch_number}</div>
          <div>${data.city}${data.state ? ', '+data.state : ''} &nbsp;·&nbsp; ${fmt(data.created_at)}</div>
        </div>
      </div>
      <div class="cards">
        <div class="card"><div class="cv">${orders.length}</div><div class="cl">Orders</div></div>
        <div class="card"><div class="cv">${totalItems}</div><div class="cl">Total Items</div></div>
        <div class="card"><div class="cv">${returnCount}</div><div class="cl">Return Pickups</div></div>
      </div>
      <h2>Orders</h2>
      <div class="box"><table>
        <thead><tr><th>#</th><th>Order No</th><th>Retailer</th><th>Mobile</th><th>City</th><th>Items</th></tr></thead>
        <tbody>${orders.map((o,i) => `<tr>
          <td style="color:#9ca3af">${i+1}</td>
          <td class="mono">${o.order_number}</td>
          <td style="font-weight:600">${o.retailer_name}</td>
          <td>${o.mobile||'—'}</td><td>${o.city||'—'}</td>
          <td>${o.items.length}</td>
        </tr>`).join('')}</tbody>
      </table></div>
      ${returnCount > 0 ? `
        <h2>Return Pickups</h2>
        <div class="box"><table>
          <thead><tr><th>#</th><th>Return No</th><th>Retailer</th><th>Mobile</th><th>City</th><th>Reason</th></tr></thead>
          <tbody>${returns.map((r,i) => `<tr>
            <td style="color:#9ca3af">${i+1}</td>
            <td class="mono ret-tag" style="border-radius:3px;padding:2px 6px">${r.return_number}</td>
            <td style="font-weight:600">${r.retailer_name}</td>
            <td>${r.mobile||'—'}</td><td>${r.city||'—'}</td>
            <td class="note">${r.reason||'—'}</td>
          </tr>`).join('')}</tbody>
        </table></div>` : ''}
    </div>`;

  const seen = {};
  const retailerGroups = [];
  for (const o of orders) {
    if (!seen[o.retailer_id]) { seen[o.retailer_id] = []; retailerGroups.push(seen[o.retailer_id]); }
    seen[o.retailer_id].push(o);
  }
  const retailerPages = retailerGroups.map((group, i) =>
    retailerPage(group, retByRetailer[group[0].retailer_id] || null, data, i === 0)
  ).join('');

  const returnPages = standaloneReturns.map(r => returnOnlyPage(r, data)).join('');

  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to print the dispatch sheet.'); return; }

  win.document.write(`<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <title>${data.dispatch_number}</title>
  <style>${css}</style>
</head><body>
  <div class="no-print" style="position:sticky;top:0;z-index:999;background:#1d4ed8;color:#fff;padding:8px 16px;font-size:12px;display:flex;align-items:center;gap:12px">
    <span style="flex:1">Print or save as PDF using your browser's print dialog.</span>
    <button onclick="window.print()" style="background:#fff;color:#1d4ed8;border:none;padding:5px 14px;border-radius:4px;font-weight:700;cursor:pointer;font-size:12px">Print / Save PDF</button>
    <button onclick="window.close()" style="background:transparent;color:#bfdbfe;border:1px solid #bfdbfe;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:12px">Close</button>
  </div>
  <div style="padding:15mm 18mm">
    ${summaryPage}
    <div class="pb">${retailerPages}${returnPages}</div>
  </div>
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 800);
}
