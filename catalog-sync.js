import {auth,db,OWNER_EMAIL,doc,getDoc,runTransaction,serverTimestamp} from './firebase-client.js?v=20261101-commerce';
import {retiredMenuIds} from './catalog.js';
let synced=false;
// Owner imports the supplied catalog once. Later menu edits and uploads are preserved.
export async function syncOfficialCatalog(base){if(synced||!auth.currentUser?.emailVerified||auth.currentUser.email.toLowerCase()!==OWNER_EMAIL)return;await runTransaction(db,async tx=>{const products=[];for(const m of base){const ref=doc(db,'lymeMenus',m.id);products.push({m,ref,snap:await tx.get(ref)});}const old=[];for(const id of retiredMenuIds){const ref=doc(db,'lymeMenus',id);old.push({ref,snap:await tx.get(ref)});}for(const {m,ref,snap} of products)if(!snap.exists())tx.set(ref,{...m,updatedAt:serverTimestamp()});for(const {ref,snap} of old)if(snap.exists()&&snap.data().available!==false)tx.set(ref,{...snap.data(),available:false,updatedAt:serverTimestamp()});});synced=true;}
