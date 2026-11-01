(async () => {
  'use strict';
  let menu = window.LYME_MENU;
  let firebaseLive=false;
  try { const response = await fetch('menu.json?v='+Date.now(), {cache:'no-store'}); if(response.ok) { const data=await response.json(); if(Array.isArray(data)&&data.length) menu=data; } } catch {}
  const byId = new Map(menu.map(item => [item.id, item]));
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const rupiah = value => 'Rp' + new Intl.NumberFormat('id-ID').format(value);
  const compactPrice = value => (value / 1000).toString().replace('.', ',') + 'k';
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const persist = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Usable without local storage. */ } };
  const isBestSeller = item => (item.tags || []).includes('Best Seller');
  const rawCart = read('lyme-selection-v1', []);
  let cart = Array.isArray(rawCart) ? rawCart.filter(item => item && byId.has(item.productId) && byId.get(item.productId).available!==false && typeof item.key === 'string').slice(0,80).map(item => {
    const product = byId.get(item.productId);
    return {key:item.key,productId:product.id,quantity:Math.max(1,Math.min(20,Number(item.quantity)||1)),temperature:product.temperature.includes(item.temperature)?item.temperature:(product.temperature[0]||''),sweetness:product.sweetness&&['Normal','Lebih sedikit','Tanpa gula'].includes(item.sweetness)?item.sweetness:'',milk:product.milk&&item.milk==='Oat milk'?'Oat milk':product.milk?'Susu biasa':'',note:String(item.note||'').slice(0,180)};
  }) : [];
  let category = 'all';
  let query = '';
  let sort = 'recommended';
  let toastTimer;
  const productDialog = $('#product-dialog');
  const cartDialog = $('#cart-dialog');

  function toast(message) {
    const node = $('#toast');
    $('span', node).textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 3200);
  }
  function openDialog(dialog) {
    $$('dialog[open]').forEach(node => node.close());
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => { if (!$('dialog[open]')) document.body.classList.remove('dialog-open'); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });

  function updateCounts() {
    const quantity = cart.reduce((total, item) => total + item.quantity, 0);
    $$('.cart-count').forEach(node => { node.textContent = quantity; });
    $('.bag-button').setAttribute('aria-label', `Buka keranjang, ${quantity} item`);
    const count = menu.filter(isBestSeller).length;
    const badge = $('.best-seller-count');
    badge.textContent = count;
    badge.hidden = count === 0;
  }
  function renderMenu() {
    document.querySelectorAll('.category-tab[data-category]').forEach(tab=>{const count=tab.querySelector('span');if(count)count.textContent=tab.dataset.category==='all'?menu.length:tab.dataset.category==='best-sellers'?menu.filter(isBestSeller).length:menu.filter(m=>m.category===tab.dataset.category).length;});
    const signature=byId.get('brown-sugar');if(signature){$('.hero-feature strong').textContent=signature.name;$('.hero-feature').disabled=signature.available===false;}
    let items = menu.filter(item => (category === 'all' || (category === 'best-sellers' ? isBestSeller(item) : item.category === category)) && `${escape(item.name)} ${escape(item.description)} ${item.tags.join(' ')}`.toLocaleLowerCase('id').includes(query));
    if (sort === 'recommended') items.sort((a,b) => Number(isBestSeller(b))-Number(isBestSeller(a)));
    if (sort === 'price-asc') items.sort((a,b) => a.price-b.price);
    if (sort === 'price-desc') items.sort((a,b) => b.price-a.price);
    if (sort === 'name') items.sort((a,b) => a.name.localeCompare(b.name,'id'));
    $('#menu-grid').innerHTML = items.map((item,index) => `<article class="menu-card ${item.available===false?'is-sold-out':''}">
      <div class="card-image-wrap">${item.available===false?'<span class="sold-out-badge">Habis sementara</span>':''}
        <button class="card-image-button" type="button" data-product="${item.id}" aria-label="Lihat detail ${escape(item.name)}"><img src="${item.image}" alt="${escape(item.alt)}" loading="lazy" width="550" height="500" ${index>3?'decoding="async"':''}></button>
        ${isBestSeller(item)?'<span class="card-label best-seller-label">★ Best Seller</span>':item.label?`<span class="card-label ${item.category==='signature'?'signature-label':''}">${escape(item.label)}</span>`:''}
        <button class="quick-add" ${item.available===false?'disabled':''} type="button" data-product="${item.id}" aria-label="Pilih ${escape(item.name)}">${icon('plus')}</button>
      </div>
      <div class="card-copy"><div class="card-title-line"><h3><button type="button" data-product="${item.id}">${escape(item.name)}</button></h3><span class="card-price" aria-label="${rupiah(item.price)}">${compactPrice(item.price)}</span></div><p class="card-description">${escape(item.description)}</p><div class="card-bottom"><div class="card-tags">${item.tags.filter(tag=>tag!=='Best Seller').map(tag=>`<span class="card-tag">${escape(tag)}</span>`).join('')}</div><button class="card-link" type="button" data-product="${item.id}" aria-label="Lihat detail ${escape(item.name)}">${icon('arrow-up')}</button></div></div>
    </article>`).join('');
    $('#results-count').textContent = `${items.length} ${category==='best-sellers'?'menu Best Seller':'menu untuk jedamu'}`;
    $('#menu-grid').hidden = items.length === 0;
    $('#empty-state').hidden = items.length !== 0;
    if (!items.length) {
      $('h3', $('#empty-state')).textContent = category==='best-sellers'&&!query?'Best Seller segera hadir.':'Belum ketemu yang pas?';
      $('p', $('#empty-state')).textContent = category==='best-sellers'&&!query?'Menu pilihan terlaris akan ditampilkan di sini. Jelajahi menu lainnya dulu, ya.':'Coba kata lain, atau jelajahi semua menu kami.';
    }
    $$('.category-tab').forEach(button => { const active=button.dataset.category===category;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active)); });
    $('.best-seller-link').classList.toggle('active',category==='best-sellers');
    updateCounts();
  }
  function setCategory(value, scroll=false) {
    category = value;
    renderMenu();
    const currentTab = $(`[data-category="${value}"]`);
    if (currentTab) {
      const tabs=$('.category-tabs');
      const left=currentTab.offsetLeft-tabs.offsetLeft;
      if (left<tabs.scrollLeft || left+currentTab.offsetWidth>tabs.scrollLeft+tabs.clientWidth) tabs.scrollTo({left:left-10,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }
    if (scroll) $('#menu').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  const options = (legend,name,values,selected) => `<fieldset class="option-group"><legend>${legend}</legend><div class="option-options">${values.map(value=>`<label class="option-pill"><input type="radio" name="${name}" value="${value}" ${value===selected?'checked':''}><span>${value}${value==='Oat milk'?'<small>+6k</small>':''}</span></label>`).join('')}</div></fieldset>`;
  function showProduct(id) {
    const product=byId.get(id);
    if (!product) return;
    if(product.available===false){toast('Menu ini sedang habis. Pilih menu lainnya, ya.');return;}
    const defaultTemperature=product.temperature.includes('Iced')?'Iced':product.temperature[0];
    $('#product-dialog-content').innerHTML=`<div class="product-detail"><div class="detail-visual"><img src="${product.image}" alt="${escape(product.alt)}" width="550" height="750">${isBestSeller(product)?'<span class="card-label best-seller-label">★ Best Seller</span>':product.label?`<span class="card-label signature-label">${escape(product.label)}</span>`:''}</div><div class="detail-copy"><p class="eyebrow">${product.category==='bites'?'A LITTLE BITE OF HAPPINESS':'A CUP FOR YOUR KIND OF DAY'}</p><h2 id="product-dialog-title">${escape(product.name)}</h2><p class="detail-description">${escape(product.detail)}</p><p class="detail-price">${rupiah(product.price)}</p><form id="product-form">${product.temperature.length?options('Suhu minuman','temperature',product.temperature,defaultTemperature):''}${product.sweetness?options('Tingkat manis','sweetness',['Normal','Lebih sedikit','Tanpa gula'],'Normal'):''}${product.milk?options('Pilihan susu','milk',['Susu biasa','Oat milk'],'Susu biasa'):''}<label class="note-label" for="detail-note">Catatan <span style="font-weight:400;color:var(--muted)">(opsional)</span></label><textarea class="detail-note" id="detail-note" name="note" maxlength="180" placeholder="Misalnya: esnya sedikit, ya."></textarea><div class="detail-actions"><div class="quantity-control"><button type="button" id="detail-minus" aria-label="Kurangi jumlah" disabled>${icon('minus')}</button><output id="detail-quantity" aria-label="Jumlah">1</output><button type="button" id="detail-plus" aria-label="Tambah jumlah">${icon('plus')}</button></div><button class="detail-add" type="submit">Tambah ke keranjang<strong id="detail-total">${rupiah(product.price)}</strong></button></div><p class="allergen-note">Harga sesuai menu yang dipilih.${product.milk?' Beri tahu barista jika kamu memiliki alergi susu.':''}</p></form></div></div>`;
    let quantity=1;
    const form=$('#product-form');
    function updateDetail(){
      $('#detail-quantity').textContent=quantity;
      $('#detail-minus').disabled=quantity<=1;
      $('#detail-plus').disabled=quantity>=20;
      $('#detail-total').textContent=rupiah((product.price+(new FormData(form).get('milk')==='Oat milk'?6000:0))*quantity);
    }
    $('#detail-minus').addEventListener('click',()=>{quantity=Math.max(1,quantity-1);updateDetail();});
    $('#detail-plus').addEventListener('click',()=>{quantity=Math.min(20,quantity+1);updateDetail();});
    form.addEventListener('change',updateDetail);
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const data=new FormData(form);
      const selection={productId:id,temperature:data.get('temperature')||'',sweetness:data.get('sweetness')||'',milk:data.get('milk')||'',note:String(data.get('note')||'').trim().slice(0,180)};
      const existing=cart.find(item=>item.productId===id&&item.temperature===selection.temperature&&item.sweetness===selection.sweetness&&item.milk===selection.milk&&item.note===selection.note&&item.quantity+quantity<=20);
      if(!existing&&cart.length>=8){toast('Maksimal 8 variasi menu per pesanan. Selesaikan pesanan ini terlebih dahulu.');return;}
      if(existing)existing.quantity+=quantity;
      else cart.push({...selection,key:crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2),quantity});
      saveCart();
      productDialog.close();
      toast(`${escape(product.name)} ditambahkan ke keranjangmu.`);
    });
    openDialog(productDialog);
    productDialog.scrollTop=0;
    $('.dialog-close',productDialog).focus({preventScroll:true});
  }
  const itemUnitPrice = item => byId.get(item.productId).price+(item.milk==='Oat milk'?6000:0);
  const cartTotal = () => cart.reduce((total,item)=>total+itemUnitPrice(item)*item.quantity,0);
  function saveCart(){persist('lyme-selection-v1',cart);updateCounts();}
  function renderCart(){
    const target=$('#cart-items');
    $('#cart-summary').hidden=cart.length===0;
    if(!cart.length){
      target.innerHTML=`<div class="cart-empty"><span>${icon('cup')}</span><h3>Masih ada ruang untuk rasa.</h3><p>Temukan minuman atau teman ngopi favoritmu,<br>lalu tambahkan ke pilihan di sini.</p><button class="button button-dark" type="button" id="browse-menu">Jelajahi menu ${icon('arrow')}</button></div>`;
      return;
    }
    target.innerHTML=cart.map(item=>{
      const product=byId.get(item.productId);
      const meta=[item.temperature,item.sweetness&&`Manis: ${item.sweetness.toLowerCase()}`,item.milk].filter(Boolean).join(' · ');
      return `<article class="cart-item"><img src="${product.image}" alt="${escape(product.alt)}" width="150" height="180"><div><div class="cart-item-heading"><h3>${escape(product.name)}</h3><button type="button" class="remove-item" data-remove="${escape(item.key)}" aria-label="Hapus ${escape(product.name)}">${icon('close')}</button></div><p class="cart-item-meta">${meta||'Teman ngopi'}</p>${item.note?`<p class="cart-item-note">“${escape(item.note)}”</p>`:''}<div class="cart-item-bottom"><div class="quantity-control"><button type="button" data-cart-step="-1" data-key="${escape(item.key)}" aria-label="Kurangi ${escape(product.name)}" ${item.quantity<=1?'disabled':''}>${icon('minus')}</button><output aria-label="Jumlah ${escape(product.name)}">${item.quantity}</output><button type="button" data-cart-step="1" data-key="${escape(item.key)}" aria-label="Tambah ${escape(product.name)}" ${item.quantity>=20?'disabled':''}>${icon('plus')}</button></div><span class="cart-item-price">${rupiah(itemUnitPrice(item)*item.quantity)}</span></div></div></article>`;
    }).join('');
    $('#cart-summary').innerHTML=`<div class="total-line"><span>Total pesanan</span><strong>${rupiah(cartTotal())}</strong></div><a class="button button-dark copy-selection" href="checkout.html">Lanjut ke checkout ${icon('arrow')}</a><a class="cart-transactions-link" href="transaksi.html">Lihat transaksi saya ↗</a><p class="summary-note">Periksa pesanan dan pilih QR, transfer, atau cash pada checkout.</p>`;
  }
  function showCart(){renderCart();openDialog(cartDialog);$('.icon-button',cartDialog).focus({preventScroll:true});}
  async function copyText(text){
    try {await navigator.clipboard.writeText(text);return true;}
    catch {
      const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.cssText='position:fixed;left:-9999px;top:0';
      const host=$('dialog[open]')||document.body;host.append(area);area.select();
      let copied=false;try{copied=document.execCommand('copy');}catch{}area.remove();return copied;
    }
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if(button.hasAttribute('data-close-dialog')){button.closest('dialog').close();return;}
    if(button.dataset.product){showProduct(button.dataset.product);return;}
    if(button.dataset.category){setCategory(button.dataset.category);return;}
    if(button.dataset.action==='cart'){showCart();return;}
    if(button.dataset.action==='best-sellers'){
      $('#mobile-nav').hidden=true;$('#mobile-toggle').setAttribute('aria-expanded','false');
      setCategory('best-sellers',true);return;
    }
    if(button.dataset.remove){
      const index=cart.findIndex(item=>item.key===button.dataset.remove);
      cart=cart.filter(item=>item.key!==button.dataset.remove);saveCart();renderCart();
      ($$('.remove-item')[Math.min(index,cart.length-1)]||$('#browse-menu')).focus({preventScroll:true});
      return;
    }
    if(button.dataset.cartStep){
      const item=cart.find(item=>item.key===button.dataset.key);
      if(item){item.quantity=Math.max(1,Math.min(20,item.quantity+Number(button.dataset.cartStep)));saveCart();renderCart();
        const replacement=$(`[data-key="${item.key}"][data-cart-step="${button.dataset.cartStep}"]`);if(replacement&&!replacement.disabled)replacement.focus({preventScroll:true});else $(`[data-key="${item.key}"]:not(:disabled)`)?.focus({preventScroll:true});
      }return;
    }
    if(button.id==='browse-menu'){cartDialog.close();setCategory('all',true);return;}
  });
  $('#menu-search').addEventListener('input',event=>{query=event.target.value.trim().toLocaleLowerCase('id');renderMenu();});
  $('#menu-sort').addEventListener('change',event=>{sort=event.target.value;renderMenu();});
  $('#reset-filters').addEventListener('click',()=>{query='';$('#menu-search').value='';setCategory('all');$('.category-tab').focus({preventScroll:true});});
  $('#mobile-toggle').addEventListener('click',()=>{const nav=$('#mobile-nav');nav.hidden=!nav.hidden;$('#mobile-toggle').setAttribute('aria-expanded',String(!nav.hidden));});
  $$('#mobile-nav a').forEach(link=>link.addEventListener('click',()=>{$('#mobile-nav').hidden=true;$('#mobile-toggle').setAttribute('aria-expanded','false');}));
  $('#share-menu').addEventListener('click',async()=>{
    const share={title:'Lyme Coffee — A little pause, a good cup.',text:'Temukan teman terbaik untuk jeda harimu di Lyme Coffee.',url:location.origin+location.pathname};
    if(navigator.share){try{await navigator.share(share);return;}catch(error){if(error.name==='AbortError')return;}}
    toast(await copyText(share.url)?'Link menu berhasil disalin.':'Link menu belum bisa disalin. Salin alamat dari browser kamu.');
  });
  renderMenu();
  const baseMenu=structuredClone(menu);
  import('./firebase-client.js?v=20261101-commerce').then(({subscribeMenu})=>subscribeMenu(records=>{
    if(!records.length)return;firebaseLive=true;const saved=new Map(records.map(m=>[m.id,m]));const baseIds=new Set(baseMenu.map(m=>m.id));menu=[...baseMenu.map(m=>saved.has(m.id)?{...m,...saved.get(m.id)}:m),...records.filter(m=>!baseIds.has(m.id))];byId.clear();menu.forEach(m=>byId.set(m.id,m));cart=cart.filter(item=>byId.has(item.productId)&&byId.get(item.productId).available!==false);saveCart();if(productDialog.open)productDialog.close();if(cartDialog.open)renderCart();renderMenu();
  },()=>{})).catch(()=>{});
  setInterval(async()=>{
    if(firebaseLive)return;
    try {const response=await fetch('menu.json?v='+Date.now(),{cache:'no-store'});if(!response.ok)return;const next=await response.json();if(!Array.isArray(next)||!next.length||JSON.stringify(next)===JSON.stringify(menu))return;menu=next;byId.clear();menu.forEach(item=>byId.set(item.id,item));cart=cart.filter(item=>byId.has(item.productId)&&byId.get(item.productId).available!==false);saveCart();if(productDialog.open)productDialog.close();if(cartDialog.open)renderCart();renderMenu();}catch{}
  },60000);
})();
