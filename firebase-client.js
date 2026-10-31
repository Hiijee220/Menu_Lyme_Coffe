import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut,setPersistence,browserSessionPersistence} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {getFirestore,collection,doc,getDoc,getDocs,onSnapshot,runTransaction,serverTimestamp,setDoc,deleteDoc} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
const app=initializeApp({apiKey:'AIzaSyDGZdJo9iIbkU5L8dWGKpP0Gqq7SCulC68',authDomain:'menu-lyme-coffe.firebaseapp.com',projectId:'menu-lyme-coffe',storageBucket:'menu-lyme-coffe.firebasestorage.app',messagingSenderId:'713385287060',appId:'1:713385287060:web:110dee16f61dcc27b08381'});
export const db=getFirestore(app),auth=getAuth(app),OWNER_EMAIL='remajasilo.rs@gmail.com';
export {GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut,setPersistence,browserSessionPersistence,collection,doc,getDoc,getDocs,onSnapshot,runTransaction,serverTimestamp,setDoc,deleteDoc};
export function subscribeMenu(callback,onError){return onSnapshot(collection(db,'lymeMenus'),snapshot=>callback(snapshot.docs.map(d=>d.data())),onError);}
