import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {setLogLevel,doc,writeBatch,setDoc,getDoc,updateDoc,deleteDoc,collection,getDocs,query,where,serverTimestamp} from 'firebase/firestore';
setLogLevel('silent');
const projectId='demo-lyme-commerce';
const env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8088,rules:await readFile(new URL('../firebase/firestore.rules',import.meta.url),'utf8')}});
const base=JSON.parse(await readFile(new URL('../menu.json',import.meta.url),'utf8'));
const config={acceptingOrders:true,qrEnabled:false,qrImage:'',qrLabel:'',transferEnabled:false,bankName:'',accountNumber:'',accountName:'',cashEnabled:true,updatedAt:serverTimestamp()};
await env.withSecurityRulesDisabled(async c=>{for(const p of base)await setDoc(doc(c.firestore(),'lymeMenus',p.id),{...p,updatedAt:serverTimestamp()});await setDoc(doc(c.firestore(),'lymeCommerce','settings'),config);await setDoc(doc(c.firestore(),'lymeAdmins','editor@example.com'),{email:'editor@example.com',enabled:true});});
const a=env.authenticatedContext('customer-a').firestore(),b=env.authenticatedContext('customer-b').firestore(),owner=env.authenticatedContext('owner',{email:'remajasilo.rs@gmail.com',email_verified:true}).firestore(),editor=env.authenticatedContext('editor',{email:'editor@example.com',email_verified:true}).firestore(),outsider=env.authenticatedContext('outsider',{email:'other@example.com',email_verified:true}).firestore(),publicDb=env.unauthenticatedContext().firestore();
let counter=1,passed=0;function orderId(){return 'LYME-'+(counter++).toString(16).padStart(16,'0');}function order(id,overrides={}){const items=base.slice(0,8).map(p=>({productId:p.id,name:p.name,quantity:2,unitPrice:p.price+(p.milk?6000:0),lineTotal:(p.price+(p.milk?6000:0))*2,temperature:p.temperature[0]||'',sweetness:p.sweetness?'Normal':'',milk:p.milk?'Oat milk':'',note:'Sedikit es'}));return {id,ownerUid:'customer-a',customerName:'Penguji',service:'dine-in',table:'5',note:'Semua disajikan bersama',items,total:items.reduce((n,i)=>n+i.lineTotal,0),paymentMethod:'cash',paymentLabel:'Bayar di kasir',qrImage:'',status:'pending',paymentStatus:'unpaid',paymentClaimed:false,paymentReference:'',adminNote:'',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),...overrides};}
function create(db,id,data){const batch=writeBatch(db);batch.set(doc(db,'lymeOrders',id),data);data.items.forEach((item,index)=>batch.set(doc(db,'lymeOrders',id,'items',String(index)),{ownerUid:data.ownerUid,item,createdAt:serverTimestamp()}));return batch.commit();}
async function check(label,p){await p;passed++;console.log('PASS',label);}
try{
const id=orderId(),o=order(id);await check('8 menu + oat surcharge accepted',assertSucceeds(create(a,id,o)));
await check('owner customer reads order',assertSucceeds(getDoc(doc(a,'lymeOrders',id))));
await check('missing order can be checked before idempotent create',assertSucceeds(getDoc(doc(a,'lymeOrders',orderId()))));
await check('other customer cannot read',assertFails(getDoc(doc(b,'lymeOrders',id))));
await check('anonymous public cannot read',assertFails(getDoc(doc(publicDb,'lymeOrders',id))));
await check('customer cannot list all orders',assertFails(getDocs(collection(a,'lymeOrders'))));
await check('customer can list own orders',assertSucceeds(getDocs(query(collection(a,'lymeOrders'),where('ownerUid','==','customer-a')))));
await check('editor can list orders',assertSucceeds(getDocs(collection(editor,'lymeOrders'))));
await check('outsider cannot list orders',assertFails(getDocs(collection(outsider,'lymeOrders'))));
for(const [label,change] of [['total tampering',{total:1}],['owner spoofing',{ownerUid:'customer-b'}],['prepaid spoofing',{paymentStatus:'paid'}],['disabled QR',{paymentMethod:'qr',paymentLabel:'',qrImage:''}],['negative quantity',{items:o.items.map((i,n)=>n?i:{...i,quantity:-1})}],['price tampering',{items:o.items.map((i,n)=>n?i:{...i,unitPrice:1,lineTotal:2})}],['extra items',{items:[...o.items,o.items[0]]}]]){const k=orderId();await check(label,assertFails(create(a,k,order(k,change))));}
await check('customer cannot mark paid',assertFails(updateDoc(doc(a,'lymeOrders',id),{paymentStatus:'paid',updatedAt:serverTimestamp()})));
await check('customer cannot change note/price after submit',assertFails(updateDoc(doc(a,'lymeOrders',id),{note:'Changed',updatedAt:serverTimestamp()})));
await check('cannot complete unpaid',assertFails(updateDoc(doc(owner,'lymeOrders',id),{status:'completed',updatedAt:serverTimestamp()})));
await check('admin mark paid + preparing',assertSucceeds(updateDoc(doc(editor,'lymeOrders',id),{paymentStatus:'paid',status:'preparing',updatedAt:serverTimestamp()})));
await check('no return paid to unpaid',assertFails(updateDoc(doc(owner,'lymeOrders',id),{paymentStatus:'unpaid',updatedAt:serverTimestamp()})));
await check('admin cannot overwrite ordered items',assertFails(updateDoc(doc(owner,'lymeOrders',id),{total:1,updatedAt:serverTimestamp()})));
await check('admin ready',assertSucceeds(updateDoc(doc(owner,'lymeOrders',id),{status:'ready',updatedAt:serverTimestamp()})));
await check('admin complete paid',assertSucceeds(updateDoc(doc(owner,'lymeOrders',id),{status:'completed',updatedAt:serverTimestamp()})));
await check('order ledger cannot delete',assertFails(deleteDoc(doc(owner,'lymeOrders',id))));
await check('customer cannot change merchant account',assertFails(setDoc(doc(a,'lymeCommerce','settings'),{...config,accountNumber:'123'})));
await check('QR without image rejected',assertFails(setDoc(doc(owner,'lymeCommerce','settings'),{...config,qrEnabled:true})));
const qrConfig={...config,qrEnabled:true,qrLabel:'Merchant Lyme',qrImage:'data:image/png;base64,aGVsbG8=',transferEnabled:true,bankName:'Bank Pengujian',accountNumber:'12345',accountName:'Toko Pengujian'};await check('admin merchant settings',assertSucceeds(setDoc(doc(owner,'lymeCommerce','settings'),qrConfig)));
const qrId=orderId();await check('QR correct merchant snapshot',assertSucceeds(create(a,qrId,order(qrId,{paymentMethod:'qr',paymentLabel:qrConfig.qrLabel,qrImage:qrConfig.qrImage}))));
await check('claim payment stays unpaid',assertSucceeds(updateDoc(doc(a,'lymeOrders',qrId),{paymentClaimed:true,paymentReference:'Penguji 123',updatedAt:serverTimestamp()})));
await check('someone else cannot claim',assertFails(updateDoc(doc(b,'lymeOrders',qrId),{paymentClaimed:true,paymentReference:'Other',updatedAt:serverTimestamp()})));
const tf=orderId();await check('transfer correct merchant snapshot',assertSucceeds(create(a,tf,order(tf,{paymentMethod:'transfer',paymentLabel:'Bank Pengujian · 12345 · a.n. Toko Pengujian'}))));
const missing=orderId();await check('order without atomic item records rejected',assertFails(setDoc(doc(a,'lymeOrders',missing),order(missing))));
const unpaid=orderId();await check('second cash order accepted',assertSucceeds(create(a,unpaid,order(unpaid))));await updateDoc(doc(owner,'lymeOrders',unpaid),{status:'preparing',updatedAt:serverTimestamp()});await updateDoc(doc(owner,'lymeOrders',unpaid),{status:'ready',updatedAt:serverTimestamp()});await check('ready unpaid order cannot complete',assertFails(updateDoc(doc(owner,'lymeOrders',unpaid),{status:'completed',updatedAt:serverTimestamp()})));
const stale=orderId(),staleOrder=order(stale);for(let i=0;i<staleOrder.items.length;i++)await setDoc(doc(a,'lymeOrders',stale,'items',String(i)),{ownerUid:'customer-a',item:staleOrder.items[i],createdAt:serverTimestamp()});await check('old standalone item records cannot be reused for checkout',assertFails(setDoc(doc(a,'lymeOrders',stale),staleOrder)));
const mismatch=orderId();await check('forged bank destination rejected',assertFails(create(a,mismatch,order(mismatch,{paymentMethod:'transfer',paymentLabel:'Other bank'}))));
await check('editor cannot grant another admin',assertFails(setDoc(doc(editor,'lymeAdmins','attacker@example.com'),{email:'attacker@example.com',enabled:true,updatedAt:serverTimestamp()})));
await env.withSecurityRulesDisabled(async c=>{await updateDoc(doc(c.firestore(),'lymeMenus',base[0].id),{available:false});});const sold=orderId();await check('sold-out product rejected',assertFails(create(a,sold,order(sold))));
await check('close checkout',assertSucceeds(setDoc(doc(owner,'lymeCommerce','settings'),{...config,acceptingOrders:false})));const closed=orderId();await check('closed store rejects order',assertFails(create(a,closed,order(closed))));
console.log('PASSED',passed,'security checks');
}finally{await env.cleanup();}
