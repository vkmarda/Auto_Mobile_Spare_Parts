import html2pdf from 'html2pdf.js';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const css = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#111;background:#fff}
  .header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1d4ed8;padding-bottom:8px;margin-bottom:14px}
  .brand{font-size:16px;font-weight:800;color:#1d4ed8}.sub{font-size:10px;color:#6b7280;margin-top:2px}
  .meta{text-align:right;font-size:10px;color:#6b7280}
  table{width:100%;border-collapse:collapse;font-size:10px}
  thead tr{background:#f1f5f9}
  th{text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;padding:6px 7px;border-bottom:2px solid #e2e8f0;white-space:nowrap}
  td{padding:5px 7px;vertical-align:top;border-bottom:1px solid #f1f5f9}
  .order-row td{background:#fafafa;border-top:2px solid #e2e8f0;font-weight:600}
  .item-row td{background:#fff}
  .ret-row td{background:#fffbeb;border-top:1px dashed #fde68a}
  .mono{font-family:monospace;font-weight:700}
  .dim{color:#9ca3af}
  .ret-tag{color:#d97706;font-family:monospace;font-weight:700}
  .status{display:inline-block;padding:1px 6px;border-radius:999px;font-size:9px;font-weight:600;background:#e0f2fe;color:#0369a1}
  .ret-status{background:#fef3c7;color:#92400e}
  .filters{font-size:10px;color:#6b7280;margin-bottom:10px;display:flex;gap:16px;flex-wrap:wrap}
  .filter-tag{background:#f1f5f9;padding:2px 8px;border-radius:4px}
`;

function statusBadge(s, cls = 'status') {
  return `<span class="${cls}">${s.replace(/_/g, ' ')}</span>`;
}

export async function printOrders(rows, filterSummary = '') {
  // rows: array of { order, orderItems, ret, retItems }
  const now = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const tableRows = rows.map(({ order, orderItems, ret, retItems }) => {
    const base = `
      <td class="mono">${order.order_number}</td>
      <td style="font-weight:600">${order.retailer_name}</td>
      <td><span style="font-family:monospace">${order.retailer_mobile || '—'}</span></td>
      <td>${order.retailer_city || '—'}</td>
      <td>${fmtDate(order.created_at)}</td>
      <td>${statusBadge(order.status)}</td>`;

    const itemRows = orderItems.length === 0
      ? `<tr class="order-row"><td colspan="2"></td>${base}<td class="dim">—</td><td class="dim">—</td><td class="dim">—</td><td class="dim">—</td><td class="dim">—</td><td></td><td></td><td></td><td></td><td></td></tr>`
      : orderItems.map((item, idx) => `
          <tr class="${idx === 0 ? 'order-row' : 'item-row'}">
            <td></td><td class="dim" style="font-size:9px;padding-left:14px">↳</td>
            ${idx === 0 ? base : `<td colspan="6"></td>`}
            <td>${item.vehicle_brand || '<span class="dim">—</span>'}</td>
            <td>${item.vehicle_model || '<span class="dim">—</span>'}</td>
            <td class="dim">${item.manufacture_year || '—'}</td>
            <td>${item.product_name || ''}${item.part_name ? ' · <span class="dim">'+item.part_name+'</span>' : ''}</td>
            <td class="mono dim" style="font-size:9px">${item.sku || '—'}</td>
            <td style="font-weight:700;text-align:right">${item.quantity}</td>
            <td></td><td></td><td></td><td></td><td></td>
          </tr>`).join('');

    const retRows = ret && retItems.length > 0
      ? retItems.map((ri, idx) => {
          const brand   = ri.vehicle_brand || ri.photo_brand || '—';
          const model   = ri.vehicle_model || ri.photo_model || '—';
          const product = ri.product_name ? `${ri.product_name}${ri.part_name ? ' · '+ri.part_name : ''}` : '—';
          return `<tr class="ret-row">
            <td colspan="8"></td>
            <td colspan="5" style="padding-left:14px">
              ${idx === 0 ? `<span class="ret-tag">${ret.return_number}</span>` : ''}
            </td>
            <td>${brand}</td><td>${model}</td><td>${product}</td>
            <td style="font-weight:700;text-align:right">${ri.quantity}</td>
            <td>${idx === 0 ? statusBadge(ret.status, 'ret-status') : ''}</td>
          </tr>`;
        }).join('')
      : ret ? `<tr class="ret-row"><td colspan="13"></td><td><span class="ret-tag">${ret.return_number}</span></td><td colspan="4"></td><td>${statusBadge(ret.status,'ret-status')}</td></tr>` : '';

    return itemRows + retRows;
  }).join('');

  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:277mm';
  container.innerHTML = `
    <style>${css}</style>
    <div style="padding:12mm 15mm;background:#fff">
      <div class="header">
        <div><div class="brand">🔧 Purzaa</div><div class="sub">Orders Export &nbsp;·&nbsp; ${rows.length} order${rows.length!==1?'s':''}</div></div>
        <div class="meta"><div>${now}</div>${filterSummary ? `<div style="margin-top:2px">${filterSummary}</div>` : ''}</div>
      </div>
      <table>
        <thead><tr>
          <th></th><th></th>
          <th>Order No</th><th>Retailer</th><th>Mobile</th><th>City</th><th>Date</th><th>Status</th>
          <th>Brand</th><th>Model</th><th>Year</th><th>Product / Part</th><th>SKU</th><th>Qty</th>
          <th>Return No</th><th>Ret Brand</th><th>Ret Model</th><th>Ret Product</th><th>Ret Qty</th><th>Return Status</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;
  document.body.appendChild(container);

  await html2pdf().set({
    margin:      0,
    filename:    `orders_${new Date().toISOString().slice(0,10)}.pdf`,
    image:       { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF:       { unit: 'mm', format: 'a4', orientation: 'landscape' },
    pagebreak:   { mode: 'avoid-all' },
  }).from(container).save();

  document.body.removeChild(container);
}
