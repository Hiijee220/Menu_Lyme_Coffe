// Keep popup sign-in directly inside the click handler for Safari.
export function hasSessionStorage(getStorage=()=>window.sessionStorage){
  try{const s=getStorage(),key='lyme-login-check-'+Math.random();s.setItem(key,key);const ok=s.getItem(key)===key;s.removeItem(key);return ok;}catch{return false;}
}
export function loginError(error){
  if(/popup|web-storage-unsupported|missing-initial-state|invalid-auth-event/.test(error.code||'')||/initial state|sessionStorage/i.test(error.message||''))return 'Login belum selesai. Jika muncul “Unable to save initial state”, tutup jendela login dan buka halaman admin langsung di aplikasi Safari/Chrome. Pada iPhone, tekan ikon Safari di kanan bawah, atau salin link di atas lalu tempel di Safari. Setelah itu tekan Masuk dengan Google kembali.';
  return null;
}
export function bindAdminLogin({auth,setPersistence,browserSessionPersistence,GoogleAuthProvider,signInWithPopup,status,explain}){
  const button=document.querySelector('#google-login'),copy=document.querySelector('#copy-admin-link'),link=document.querySelector('#admin-page-link');
  const url=new URL(location.pathname,location.origin).href;
  link.href=url;link.textContent=url;
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(url);status('Link disalin. Buka aplikasi Safari/Chrome, tempel di kolom alamat, lalu masuk dengan Google.');}catch{status('Salin alamat yang ditampilkan di atas, lalu tempel di aplikasi Safari/Chrome.');}});
  button.disabled=true;
  function storageReady(){if(hasSessionStorage())return true;status('Browser tidak dapat menyimpan sesi login. Buka link admin di aplikasi Safari/Chrome melalui petunjuk di atas.',true);return false;}
  if(storageReady())setPersistence(auth,browserSessionPersistence).then(()=>{button.disabled=false;}).catch(error=>status(loginError(error)||explain(error),true));
  button.addEventListener('click',()=>{
    if(!storageReady()){button.disabled=true;return;}
    button.disabled=true;status('Membuka login Google…');
    const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
    // Avoid a redirect fallback: Safari may lose auth state across domains.
    const help=setTimeout(()=>status('Jika muncul “Unable to save initial state”, tutup jendela login dan buka link admin langsung di aplikasi Safari/Chrome sesuai petunjuk di atas.'),12000);
    try{Promise.resolve(signInWithPopup(auth,provider)).catch(error=>status(loginError(error)||explain(error),true)).finally(()=>{clearTimeout(help);button.disabled=false;});}catch(error){clearTimeout(help);button.disabled=false;status(loginError(error)||explain(error),true);}
  });
}
