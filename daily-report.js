export const REPORT_ZONE='Asia/Makassar';
export function reportDate(value=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:REPORT_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value);
  const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;
}
export function dayBounds(day){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Pilih tanggal laporan yang valid.');
  const start=new Date(day+'T00:00:00+08:00');
  if(!Number.isFinite(start.getTime())||reportDate(start)!==day)throw Error('Tanggal laporan tidak valid.');
  return {start,end:new Date(start.getTime()+86400000)};
}
export function orderDate(value){return value?.toDate?value.toDate():value instanceof Date?value:new Date(value);}
export function summarizeDay(orders,day){
  const {start,end}=dayBounds(day),rows=orders.filter(o=>{const t=orderDate(o.createdAt);return t>=start&&t<end;}).sort((a,b)=>orderDate(a.createdAt)-orderDate(b.createdAt));
  const paid=rows.filter(o=>o.paymentStatus==='paid'&&o.status!=='cancelled'),unpaid=rows.filter(o=>o.paymentStatus!=='paid'&&o.status!=='cancelled'),cancelled=rows.filter(o=>o.status==='cancelled');
  const sum=list=>list.reduce((n,o)=>n+o.total,0),payments=['qr','transfer','cash'].map(method=>{const list=paid.filter(o=>o.paymentMethod===method);return {method,count:list.length,total:sum(list)};});
  const products=new Map();for(const order of paid)for(const item of order.items){const key=JSON.stringify([item.productId,item.name,item.unitPrice]);const product=products.get(key)||{name:item.name,unitPrice:item.unitPrice,quantity:0,total:0};product.quantity+=item.quantity;product.total+=item.lineTotal;products.set(key,product);}
  return {day,rows,paidCount:paid.length,revenue:sum(paid),unpaidCount:unpaid.length,unpaidTotal:sum(unpaid),cancelledCount:cancelled.length,cancelledTotal:sum(cancelled),cancelledPaid:sum(cancelled.filter(o=>o.paymentStatus==='paid')),payments,products:[...products.values()].sort((a,b)=>b.total-a.total)};
}
const methods={qr:'QR',transfer:'Transfer bank',cash:'Cash / tunai'},states={pending:'Menunggu konfirmasi',preparing:'Sedang diproses',ready:'Siap diambil / disajikan',completed:'Selesai',cancelled:'Dibatalkan'},pay={paid:'Lunas',unpaid:'Belum dibayar',rejected:'Perlu diperiksa'};
// Quoting alone does not stop spreadsheet formulas in customer-entered cells.
export function csvCell(value){let s=String(value??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
export function dailyCsv(report){
  const r=report,lines=[['LYME COFFE — LAPORAN PENJUALAN HARIAN'],['Tanggal pesanan (WITA)',r.day],['Dasar laporan','Tanggal pesanan, bukan tanggal penerimaan uang. Status lunas terkini; pesanan dibatalkan dikecualikan.'],['Diekspor pada',new Intl.DateTimeFormat('id-ID',{timeZone:REPORT_ZONE,dateStyle:'medium',timeStyle:'medium'}).format(new Date())],[],['Ringkasan','Jumlah pesanan','Nilai (Rp)'],['Pendapatan lunas',r.paidCount,r.revenue],['Belum lunas',r.unpaidCount,r.unpaidTotal],['Dibatalkan',r.cancelledCount,r.cancelledTotal],['Dibatalkan setelah lunas — tindak lanjut kasir','',r.cancelledPaid],[],['Metode pembayaran','Pesanan lunas','Pendapatan (Rp)'],...r.payments.map(p=>[methods[p.method],p.count,p.total]),[],['Menu terjual — pesanan lunas','Harga satuan (Rp)','Jumlah','Penjualan (Rp)'],...r.products.map(p=>[p.name,p.unitPrice,p.quantity,p.total]),[],['RINCIAN TRANSAKSI'],['Nomor pesanan','Waktu pesanan (WITA)','Nama pelanggan','Layanan','Meja','Metode','Status pesanan','Pembayaran','Total (Rp)','Pendapatan dihitung (Rp)','Catatan pelanggan','Keterangan admin']];
  for(const o of r.rows)lines.push([o.id,new Intl.DateTimeFormat('id-ID',{timeZone:REPORT_ZONE,dateStyle:'short',timeStyle:'medium'}).format(orderDate(o.createdAt)),o.customerName,o.service==='dine-in'?'Makan di tempat':'Bawa pulang',o.table,methods[o.paymentMethod]||o.paymentMethod,states[o.status]||o.status,pay[o.paymentStatus]||o.paymentStatus,o.total,o.paymentStatus==='paid'&&o.status!=='cancelled'?o.total:0,o.note,o.adminNote]);
  lines.push([],['RINCIAN ITEM — SEMUA PESANAN'],['Nomor pesanan','Nama menu','Jumlah','Harga satuan (Rp)','Total item (Rp)','Suhu','Gula','Susu','Catatan item','Termasuk pendapatan']);
  for(const o of r.rows)for(const i of o.items)lines.push([o.id,i.name,i.quantity,i.unitPrice,i.lineTotal,i.temperature,i.sweetness,i.milk,i.note,o.paymentStatus==='paid'&&o.status!=='cancelled'?'Ya':'Tidak']);
  return '\ufeff'+lines.map(row=>row.map(csvCell).join(';')).join('\r\n');
}
