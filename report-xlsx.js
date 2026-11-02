// Minimal OOXML workbook exporter. ZIP entries use STORE, supported by Excel/Numbers.
import {orderDate,REPORT_ZONE} from './daily-report.js?v=20261102-details';
const xml=s=>String(s??'').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const col=n=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
const enc=new TextEncoder();
function zip(files){const out=[],central=[];let offset=0;const bytes=(n)=>new Uint8Array(n),view=b=>new DataView(b.buffer);for(const [name,text] of files){const data=enc.encode(text),filename=enc.encode(name);let crc=0xffffffff;for(const b of data){crc^=b;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}crc=(crc^0xffffffff)>>>0;const local=bytes(30+filename.length),v=view(local);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,filename.length,true);local.set(filename,30);out.push(local,data);const c=bytes(46+filename.length),w=view(c);w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);w.setUint32(16,crc,true);w.setUint32(20,data.length,true);w.setUint32(24,data.length,true);w.setUint16(28,filename.length,true);w.setUint32(42,offset,true);c.set(filename,46);central.push(c);offset+=local.length+data.length;}const end=bytes(22),v=view(end);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,central.reduce((n,b)=>n+b.length,0),true);v.setUint32(16,offset,true);const all=[...out,...central,end],result=bytes(all.reduce((n,b)=>n+b.length,0));let p=0;for(const b of all){result.set(b,p);p+=b.length;}return result;}
const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main',REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const styles=`<styleSheet xmlns="${NS}"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;Rp&quot; #,##0"/></numFmts><fonts count="4"><font><sz val="11"/><name val="Calibri"/><color rgb="FF173F32"/></font><font><b/><sz val="18"/><name val="Calibri"/><color rgb="FF173F32"/></font><font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font><font><b/><sz val="11"/><name val="Calibri"/><color rgb="FF173F32"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF173F32"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFD5DECF"/></left><right style="thin"><color rgb="FFD5DECF"/></right><top style="thin"><color rgb="FFD5DECF"/></top><bottom style="thin"><color rgb="FFD5DECF"/></bottom></border></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="10"><xf fontId="0" fillId="0" borderId="0"/><xf fontId="1" fillId="0" borderId="0"/><xf fontId="2" fillId="2" borderId="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf fontId="0" fillId="0" borderId="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf fontId="0" fillId="0" borderId="1" numFmtId="164" applyNumberFormat="1"/><xf fontId="0" fillId="0" borderId="1" numFmtId="1" applyNumberFormat="1"/><xf fontId="3" fillId="0" borderId="0"/><xf fontId="3" fillId="0" borderId="1" numFmtId="164" applyNumberFormat="1"/><xf fontId="0" fillId="0" borderId="0" numFmtId="164" applyNumberFormat="1"/><xf fontId="0" fillId="0" borderId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
export function reportXlsx(r){
 const methods={qr:'QR',transfer:'Transfer bank',cash:'Cash / tunai'},states={pending:'Menunggu',preparing:'Diproses',ready:'Siap disajikan',completed:'Selesai',cancelled:'Dibatalkan'},pay={paid:'Lunas',unpaid:'Belum dibayar',rejected:'Perlu diperiksa'};
 const time=o=>new Intl.DateTimeFormat('id-ID',{timeZone:REPORT_ZONE,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(orderDate(o.createdAt));
 // Standalone closing statement; no attachment worksheets or signature area.
 const merges=[],rows=[];
 const c=(ref,value,style=0,formula)=>`<c r="${ref}" s="${style}"${typeof value==='number'?'':' t="inlineStr"'}>${typeof value==='number'?`${formula?`<f>${xml(formula)}</f>`:''}<v>${value}</v>`:`<is><t xml:space="preserve">${xml(value)}</t></is>`}</c>`;
 function row(n,cells,height=23){rows.push(`<row r="${n}" ht="${height}" customHeight="1">${cells.join('')}</row>`);}
 function full(n,text,style=0,height=23){merges.push(`A${n}:F${n}`);row(n,[c('A'+n,text,style)],height);}
 function line(n,code,label,count,amount,formula,bold=false){merges.push(`B${n}:C${n}`,`E${n}:F${n}`);row(n,[c('A'+n,code),c('B'+n,label,bold?6:0),c('D'+n,count,bold?6:0),c('E'+n,amount,bold?7:8,formula)],25);}
 full(1,'LYME COFFE & EATERY',1,32);full(2,'LAPORAN PENJUALAN HARIAN',6,25);
 full(4,'Periode pesanan : '+r.day+'  |  00.00–23.59 WITA');
 full(5,'No. laporan : PJH/'+r.day.replaceAll('-','')+'  |  Mata uang : Rupiah (IDR)');
 full(6,'Dicetak : '+new Intl.DateTimeFormat('id-ID',{timeZone:REPORT_ZONE,dateStyle:'long',timeStyle:'short'}).format(new Date())+' WITA');
 full(8,'A. RINGKASAN PENJUALAN',2,26);
 merges.push('B9:C9','E9:F9');row(9,[c('A9','No.',6),c('B9','Uraian',6),c('D9','Pesanan',6),c('E9','Jumlah (Rp)',6)],24);
 const gross=r.rows.reduce((n,o)=>n+o.total,0);
 line(10,'1','Nilai seluruh pesanan',r.rows.length,gross,undefined);
 line(11,'2','Pesanan dibatalkan',r.cancelledCount,r.cancelledTotal,undefined);
 line(12,'3','Penjualan tidak dibatalkan',r.paidCount+r.unpaidCount,r.revenue+r.unpaidTotal,'E10-E11',true);
 line(13,'4','Pesanan belum lunas',r.unpaidCount,r.unpaidTotal,undefined);
 line(14,'5','PENJUALAN LUNAS',r.paidCount,r.revenue,'E12-E13',true);
 full(16,'B. RINCIAN PENJUALAN LUNAS PER METODE',2,26);
 let i=17;for(const m of ['cash','qr','transfer']){const p=r.payments.find(p=>p.method===m);line(i++,String(i-17),methods[m],p?.count||0,p?.total||0,undefined);}
 line(20,'','TOTAL PENJUALAN LUNAS',r.paidCount,r.revenue,'SUM(E17:E19)',true);
 line(21,'','Selisih alokasi metode','',0,'E14-E20');
 full(23,'C. TRANSAKSI YANG PERLU DITINDAKLANJUTI',2,26);
 line(24,'1','Belum lunas / perlu diperiksa',r.unpaidCount,r.unpaidTotal,'E13');
 line(25,'2','Dibatalkan setelah lunas','',r.cancelledPaid,undefined);
 full(27,'Dasar penyusunan',6);
 full(28,'Penjualan dikelompokkan menurut tanggal pesanan dan status saat laporan diunduh. Pesanan dibatalkan dikecualikan dari penjualan lunas.',9,34);
 full(29,'Rincian metode menunjukkan pembayaran yang ditandai lunas oleh admin; belum merupakan pencocokan dengan saldo bank atau kas fisik.',9,34);
 full(30,'Pembatalan setelah lunas memerlukan tindak lanjut kasir. Biaya, HPP dan pengembalian dana aktual belum dicatat pada laporan ini.',9,34);

 let next=32;
 const wrapHeight=(text,width=90)=>Math.max(26,Math.ceil(String(text).length/width)*16+10);
 full(next++,'D. MENU TERJUAL — PESANAN LUNAS',2,26);
 let n=next++;merges.push(`B${n}:C${n}`);row(n,[c('A'+n,'No.',2),c('B'+n,'Menu / harga satuan',2),c('D'+n,'Jumlah',2),c('E'+n,'Penjualan (Rp)',2)],32);merges.push(`E${n}:F${n}`);
 const productStart=next;
 r.products.forEach((p,index)=>{const n=next++;merges.push(`B${n}:C${n}`,`E${n}:F${n}`);row(n,[c('A'+n,index+1,3),c('B'+n,p.name+'\nHarga: Rp'+new Intl.NumberFormat('id-ID').format(p.unitPrice),3),c('D'+n,p.quantity,5),c('E'+n,p.total,4)],Math.max(40,wrapHeight(p.name,35)+18));});
 if(!r.products.length)full(next++,'Belum ada menu terjual dari pesanan lunas.',9,26);
 const productEnd=next-1,itemCount=r.products.reduce((n,p)=>n+p.quantity,0);
 line(next++,'','TOTAL MENU TERJUAL',itemCount,r.revenue,r.products.length?`SUM(E${productStart}:E${productEnd})`:undefined,true);
 next++;
 full(next++,'E. RINCIAN PEMESAN DAN TRANSAKSI',2,26);
 n=next++;merges.push(`E${n}:F${n}`);row(n,[c('A'+n,'No.',2),c('B'+n,'Nama pemesan',2),c('C'+n,'Nomor / jam WITA',2),c('D'+n,'Item',2),c('E'+n,'Total pesanan (Rp)',2)],36);
 r.rows.forEach((o,index)=>{const n=next++,qty=o.items.reduce((v,i)=>v+i.quantity,0);merges.push(`E${n}:F${n}`);row(n,[c('A'+n,index+1,3),c('B'+n,o.customerName,3),c('C'+n,o.id+'\n'+time(o),3),c('D'+n,qty,5),c('E'+n,o.total,4)],Math.max(64,wrapHeight(o.customerName,22),wrapHeight(o.id,17)+18));
 const meta=`${states[o.status]||o.status} | ${pay[o.paymentStatus]||o.paymentStatus} | ${methods[o.paymentMethod]||o.paymentMethod} | ${o.service==='dine-in'?'Meja '+o.table:'Bawa pulang'}`;full(next++,meta,9,wrapHeight(meta));
 for(const item of o.items){const detail=`${item.quantity} × ${item.name} — Rp${new Intl.NumberFormat('id-ID').format(item.lineTotal)}${item.note?' | '+item.note:''}`;full(next++,detail,9,wrapHeight(detail));}
 if(o.note){const note='Catatan pemesan: '+o.note;full(next++,note,9,wrapHeight(note));}
 if(o.adminNote){const note='Keterangan admin: '+o.adminNote;full(next++,note,9,wrapHeight(note));}
 next++;
 });
 if(!r.rows.length)full(next++,'Tidak ada transaksi pada tanggal ini.',9,26);
 line(next++,'','TOTAL SELURUH PESANAN',r.rows.reduce((v,o)=>v+o.items.reduce((n,i)=>n+i.quantity,0),0),gross,'E10',true);
 full(next++,'Bagian E mencakup seluruh status pesanan. Jumlah item dan nilai penjualan lunas tercantum pada bagian D.',9,34);
 const lastRow=next-1;
 const summary=`<worksheet xmlns="${NS}"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><cols>${[7,24,19,12,15,15].map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${rows.join('')}</sheetData><mergeCells count="${merges.length}">${merges.map(ref=>`<mergeCell ref="${ref}"/>`).join('')}</mergeCells><pageMargins left="0.35" right="0.35" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/><headerFooter><oddFooter>&amp;L LyMe Coffe &amp;R Halaman &amp;P / &amp;N</oddFooter></headerFooter></worksheet>`;
 const files=[['xl/worksheets/sheet1.xml',summary],['xl/styles.xml',styles],
 ['xl/workbook.xml',`<workbook xmlns="${NS}" xmlns:r="${REL}"><sheets><sheet name="Ringkasan" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">'Ringkasan'!$A$1:$F$${lastRow}</definedName></definedNames><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`],
 ['xl/_rels/workbook.xml.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${REL}/styles" Target="styles.xml"/></Relationships>`],
 ['_rels/.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
 ['[Content_Types].xml',`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`]];
 return zip(files);
}
