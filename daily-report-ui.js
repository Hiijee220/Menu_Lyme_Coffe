import {reportXlsx} from './report-xlsx.js?v=20261102-spacing';
import {db,collection,query,where,orderBy,onSnapshot} from './firebase-client.js?v=20261101-commerce';
import {money,esc,methods,orderStates,payStates} from './commerce.js?v=20261101-official';
import {
  reportDate, dayBounds, monthBounds, summarizeDay, summarizePaid,
  orderDate, REPORT_ZONE, DAILY_LIST_LIMIT
} from './daily-report.js?v=20261109-periods';

const fullDate = new Intl.DateTimeFormat('id-ID', {dateStyle: 'full', timeZone: REPORT_ZONE});
const monthName = new Intl.DateTimeFormat('id-ID', {month: 'long', year: 'numeric', timeZone: REPORT_ZONE});
function ordersInRange({start, end}) {
  return query(collection(db, 'lymeOrders'), where('createdAt', '>=', start),
    where('createdAt', '<', end), orderBy('createdAt', 'asc'));
}
export function mountDailyReport({onDay, canChangeDay}){
  const $ = s => document.querySelector(s);
  const date = $('#report-date'), download = $('#report-download');
  const notice = $('#report-status'), content = $('#report-content');
  const dayTotal = $('#paid-day-total'), monthTotal = $('#paid-month-total');
  const monthStatus = $('#month-status');
  let stopDay, stopMonth, dayEpoch = 0, monthEpoch = 0;
  let active = false, current = null, followToday = true, selectedDay = reportDate(), selectedMonth = '';
  date.value = date.max = selectedDay;

  function clear(){
    dayEpoch++;
    monthEpoch++;
    stopDay?.();
    stopMonth?.();
    stopDay = stopMonth = null;
    active = false;
    current = null;
    selectedMonth = '';
    content.replaceChildren();
    download.disabled = true;
    notice.textContent = monthStatus.textContent = '';
    dayTotal.textContent = monthTotal.textContent = '—';
  }

  function loadMonth(day, force){
    const month = day.slice(0, 7);
    if (month === selectedMonth && !force) return;
    stopMonth?.();
    selectedMonth = month;
    const version = ++monthEpoch;
    const bounds = monthBounds(day);
    $('#paid-month-period').textContent = monthName.format(bounds.start);
    monthTotal.textContent = '—';
    monthStatus.textContent = 'Memuat nilai lunas bulanan…';
    stopMonth = onSnapshot(ordersInRange(bounds), {includeMetadataChanges:true}, snapshot => {
      if (version !== monthEpoch) return;
      const confirmed = !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites;
      if (confirmed) {
        const {total, count} = summarizePaid(snapshot.docs.map(doc => doc.data()));
        monthTotal.textContent = money(total);
        $('#paid-month-period').textContent = monthName.format(bounds.start) + ' · ' + count + ' pesanan lunas';
      }
      monthStatus.textContent = confirmed ? '' : 'Menunggu koneksi Firebase untuk nilai lunas bulanan.';
    }, () => {
      if (version !== monthEpoch) return;
      monthTotal.textContent = '—';
      monthStatus.textContent = 'Nilai lunas bulanan belum dapat dimuat. Tekan Muat ulang untuk mencoba lagi.';
    });
  }

  function load(forceMonth = false){
    if (!active) return;
    const day = selectedDay;
    const bounds = dayBounds(day);
    const label = fullDate.format(bounds.start);
    stopDay?.();
    const version = ++dayEpoch;
    current = null;
    content.replaceChildren();
    download.disabled = true;
    dayTotal.textContent = '—';
    $('#paid-day-period').textContent = label;
    notice.textContent = 'Memuat seluruh transaksi pada tanggal ini…';
    onDay({day, label});
    stopDay = onSnapshot(ordersInRange(bounds), {includeMetadataChanges:true}, snapshot => {
      if (version !== dayEpoch) return;
      const report = summarizeDay(snapshot.docs.map(doc => doc.data()), day);
      const confirmed = !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites;
      current = confirmed ? report : null;
      download.disabled = !confirmed;
      dayTotal.textContent = confirmed ? money(report.revenue) : '—';
      $('#paid-day-period').textContent = confirmed ? label + ' · ' + report.paidCount + ' pesanan lunas' : label;
      notice.textContent = confirmed ? report.rows.length + ' pesanan · Diperbarui otomatis · WITA'
        : 'Data sementara dari perangkat. Menunggu koneksi Firebase sebelum laporan dapat diunduh.';
      render(report);
      onDay({day, label, report, confirmed});
    }, error => {
      if (version !== dayEpoch) return;
      current = null;
      download.disabled = true;
      dayTotal.textContent = '—';
      content.replaceChildren();
      notice.textContent = 'Laporan belum dapat dimuat. Periksa jaringan dan akses admin, lalu tekan Muat ulang. ' + (error.code || '');
      onDay({day, label, failed:true});
    });
    loadMonth(day, forceMonth);
  }

  function render(r){
    const latest = r.rows.slice(-DAILY_LIST_LIMIT).reverse();
    content.innerHTML=`<div class="report-stats"><div><small>Belum lunas</small><strong>${money(r.unpaidTotal)}</strong><span>${r.unpaidCount} pesanan</span></div><div><small>Dibatalkan</small><strong>${r.cancelledCount} pesanan</strong><span>${money(r.cancelledTotal)} dikecualikan</span></div></div>${r.cancelledPaid?`<p class="notice">${money(r.cancelledPaid)} dari pesanan dibatalkan sudah berstatus lunas. Kasir perlu menindaklanjuti pengembalian dana; angka ini tidak termasuk pendapatan di atas.</p>`:''}<h3>Rincian pembayaran lunas</h3><div class="report-payments">${r.payments.map(p=>`<div><span>${methods[p.method]} <small>(${p.count} pesanan)</small></span><strong>${money(p.total)}</strong></div>`).join('')}</div><details><summary>Menu terjual · ${r.products.reduce((n,p)=>n+p.quantity,0)} item dari pesanan lunas</summary>${r.products.length?`<div class="report-table"><table><thead><tr><th>Menu / harga satuan</th><th>Jumlah</th><th>Penjualan</th></tr></thead><tbody>${r.products.map(p=>`<tr><td>${esc(p.name)}<small>${money(p.unitPrice)}</small></td><td>${p.quantity}</td><td>${money(p.total)}</td></tr>`).join('')}</tbody></table></div>`:'<p>Belum ada menu terjual dari pesanan lunas.</p>'}</details><details><summary>Ringkasan transaksi · ${latest.length} dari ${r.rows.length} pesanan</summary>${r.rows.length?`<div class="report-table"><table><thead><tr><th>Pesanan / pelanggan</th><th>Status</th><th>Total</th></tr></thead><tbody>${latest.map(o=>`<tr><td>${esc(o.id)}<small>${new Intl.DateTimeFormat('id-ID',{timeZone:REPORT_ZONE,timeStyle:'short'}).format(orderDate(o.createdAt))} · ${esc(o.customerName)}</small></td><td>${esc(orderStates[o.status])}<small>${esc(payStates[o.paymentStatus])} · ${esc(methods[o.paymentMethod])}</small></td><td>${money(o.total)}</td></tr>`).join('')}</tbody></table></div>`:'<p>Belum ada transaksi pada tanggal ini.</p>'}</details>`;
  }
  function selectDay(day, automatic = false) {
    date.max = reportDate();
    try {
      dayBounds(day);
      if (day > date.max) throw Error('Tanggal belum tersedia.');
    } catch {
      date.value = selectedDay;
      return;
    }
    if (day !== selectedDay && !canChangeDay(automatic)) {
      date.value = selectedDay;
      return;
    }
    selectedDay = date.value = day;
    followToday = day === date.max;
    load();
  }
  date.addEventListener('change', () => selectDay(date.value));
  $('#report-today').addEventListener('click', () => selectDay(reportDate()));
  $('#report-reload').addEventListener('click', () => load(true));
  function rollover(){
    const today = reportDate();
    date.max = today;
    if (active && followToday && selectedDay !== today) selectDay(today, true);
  }
  setInterval(rollover, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) rollover(); });
  download.addEventListener('click',()=>{if(!current)return;const blob=new Blob([reportXlsx(current)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Lyme-Penjualan-${current.day}-WITA.xlsx`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);});
  return {start(){active=true;if(followToday)selectedDay=date.value=date.max=reportDate();load();},clear};
}
