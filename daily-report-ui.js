import {reportXlsx} from './report-xlsx.js?v=20261102-income';
import {db,collection,query,where,orderBy,onSnapshot} from './firebase-client.js?v=20261101-commerce';
import {money,esc,methods,orderStates,payStates} from './commerce.js?v=20261101-official';
import {reportDate,dayBounds,summarizeDay,orderDate,REPORT_ZONE} from './daily-report.js?v=20261101-report';
export function mountDailyReport(){
  const $=s=>document.querySelector(s);let stop=null,epoch=0,active=false,current=null,followToday=true;
  const date=$('#report-date'),download=$('#report-download'),notice=$('#report-status'),content=$('#report-content');
  date.value=reportDate();
  function clear(){epoch++;stop?.();stop=null;active=false;current=null;content.replaceChildren();download.disabled=true;notice.textContent='';}
  function load(){
    stop?.();stop=null;const version=++epoch;current=null;content.replaceChildren();download.disabled=true;if(!active)return;
    try{const {start,end}=dayBounds(date.value);notice.textContent='Memuat seluruh transaksi pada tanggal ini…';
      stop=onSnapshot(query(collection(db,'lymeOrders'),where('createdAt','>=',start),where('createdAt','<',end),orderBy('createdAt','asc')),{includeMetadataChanges:true},snapshot=>{
        if(version!==epoch)return;const report=summarizeDay(snapshot.docs.map(d=>d.data()),date.value);const confirmed=!snapshot.metadata.fromCache&&!snapshot.metadata.hasPendingWrites;
        current=confirmed?report:null;download.disabled=!confirmed;notice.textContent=confirmed?`${report.rows.length} pesanan · Diperbarui otomatis · WITA`:'Data sementara dari perangkat. Menunggu koneksi Firebase sebelum laporan dapat diunduh.';render(report);
      },error=>{if(version!==epoch)return;current=null;download.disabled=true;content.replaceChildren();notice.textContent='Laporan belum dapat dimuat. Periksa jaringan dan akses admin, lalu tekan Muat ulang. '+(error.code||'');});
    }catch(error){notice.textContent=error.message;}
  }
  function render(r){
    content.innerHTML=`<div class="report-stats"><div><small>Pendapatan lunas</small><strong>${money(r.revenue)}</strong><span>${r.paidCount} pesanan lunas</span></div><div><small>Belum lunas</small><strong>${money(r.unpaidTotal)}</strong><span>${r.unpaidCount} pesanan</span></div><div><small>Dibatalkan</small><strong>${r.cancelledCount} pesanan</strong><span>${money(r.cancelledTotal)} dikecualikan</span></div></div>${r.cancelledPaid?`<p class="notice">${money(r.cancelledPaid)} dari pesanan dibatalkan sudah berstatus lunas. Kasir perlu menindaklanjuti pengembalian dana; angka ini tidak termasuk pendapatan di atas.</p>`:''}<h3>Rincian pembayaran lunas</h3><div class="report-payments">${r.payments.map(p=>`<div><span>${methods[p.method]} <small>(${p.count} pesanan)</small></span><strong>${money(p.total)}</strong></div>`).join('')}</div><details><summary>Menu terjual · ${r.products.reduce((n,p)=>n+p.quantity,0)} item dari pesanan lunas</summary>${r.products.length?`<div class="report-table"><table><thead><tr><th>Menu / harga satuan</th><th>Jumlah</th><th>Penjualan</th></tr></thead><tbody>${r.products.map(p=>`<tr><td>${esc(p.name)}<small>${money(p.unitPrice)}</small></td><td>${p.quantity}</td><td>${money(p.total)}</td></tr>`).join('')}</tbody></table></div>`:'<p>Belum ada menu terjual dari pesanan lunas.</p>'}</details><details><summary>Semua transaksi tanggal ini · ${r.rows.length} pesanan</summary>${r.rows.length?`<div class="report-table"><table><thead><tr><th>Pesanan / pelanggan</th><th>Status</th><th>Total</th></tr></thead><tbody>${r.rows.map(o=>`<tr><td>${esc(o.id)}<small>${new Intl.DateTimeFormat('id-ID',{timeZone:REPORT_ZONE,timeStyle:'short'}).format(orderDate(o.createdAt))} · ${esc(o.customerName)}</small></td><td>${esc(orderStates[o.status])}<small>${esc(payStates[o.paymentStatus])} · ${esc(methods[o.paymentMethod])}</small></td><td>${money(o.total)}</td></tr>`).join('')}</tbody></table></div>`:'<p>Belum ada transaksi pada tanggal ini.</p>'}</details>`;
  }
  date.addEventListener('change',()=>{followToday=date.value===reportDate();load();});$('#report-today').addEventListener('click',()=>{followToday=true;date.value=reportDate();load();});$('#report-reload').addEventListener('click',load);
  function rollover(){if(active&&followToday&&date.value!==reportDate()){date.value=reportDate();load();}}
  setInterval(rollover,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)rollover();});
  download.addEventListener('click',()=>{if(!current)return;const blob=new Blob([reportXlsx(current)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Lyme-Penjualan-${current.day}-WITA.xlsx`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);});
  return {start(){active=true;load();},clear};
}
