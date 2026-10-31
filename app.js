(() => {
  'use strict';
  const menu = window.LYME_MENU;
  const byId = new Map(menu.map(item => [item.id, item]));
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const rupiah = value => 'Rp' + new Intl.NumberFormat('id-ID').format(value);
  const compactPrice = value => (value / 1000).toString().replace('.', ',') + 'k';
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const persist = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Usable without local storage. */ } };
  const rawFavorites = read('lyme-favorites-v1', []);
  const favorites = new Set(Array.isArray(rawFavorites) ? rawFavorites.filter(id => byId.has(id)) : []);
  const rawCart = read('lyme-selection-v1', []);
  let cart = Array.isArray(rawCart) ? rawCart.filter(item => item && byId.has(item.productId) && typeof item.key === 'string').slice(0,80).map(item => {
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
    $('.bag-button').setAttribute('aria-label', `Buka pilihan saya, ${quantity} item`);
    const favCount = $('.fav-count');
    favCount.textContent = favorites.size;
    favCount.hidden = favorites.size === 0;
  }
  function renderMenu() {
    let items = menu.filter(item => (category === 'all' || (category === 'favorites' ? favorites.has(item.id) : item.category === category)) && `${item.name} ${item.description} ${item.tags.join(' ')}`.toLocaleLowerCase('id').includes(query));
    if (sort === 'price-asc') items.sort((a,b) => a.price-b.price);
    if (sort === 'price-desc') items.sort((a,b) => b.price-a.price);
    if (sort === 'name') items.sort((a,b) => a.name.localeCompare(b.name,'id'));
    $('#menu-grid').innerHTML = items.map((item,index) => `<article class="menu-card">
      <div class="card-image-wrap">
        <button class="card-image-button" type="button" data-product="${item.id}" aria-label="Lihat detail ${item.name}"><img src="${item.image}" alt="${item.alt}" loading="lazy" width="550" height="500" ${index>3?'decoding="async"':''}></button>
        ${item.label?`<span class="card-label ${item.category==='signature'?'signature-label':''}">${item.label}</span>`:''}
        <button class="favorite-button ${favorites.has(item.id)?'is-saved':''}" type="button" data-favorite="${item.id}" aria-pressed="${favorites.has(item.id)}" aria-label="${favorites.has(item.id)?'Hapus':'Simpan'} ${item.name} ${favorites.has(item.id)?'dari':'ke'} favorit">${icon('heart')}</button>
        <button class="quick-add" type="button" data-product="${item.id}" aria-label="Pilih ${item.name}">${icon('plus')}</button>
      </div>
      <div class="card-copy"><div class="card-title-line"><h3><button type="button" data-product="${item.id}">${item.name}</button></h3><span class="card-price" aria-label="${rupiah(item.price)}">${compactPrice(item.price)}</span></div><p class="card-description">${item.description}</p><div class="card-bottom"><div class="card-tags">${item.tags.map(tag=>`<span class="card-tag">${tag}</span>`).join('')}</div><button class="card-link" type="button" data-product="${item.id}" aria-label="Lihat detail ${item.name}">${icon('arrow-up')}</button></div></div>
    </article>`).join('');
    $('#results-count').textContent = `${items.length} ${category==='favorites'?'menu favoritmu':'menu untuk jedamu'}`;
    $('#menu-grid').hidden = items.length === 0;
    $('#empty-state').hidden = items.length !== 0;
    if (!items.length) {
      $('h3', $('#empty-state')).textContent = category==='favorites'&&!query?'Favoritmu dimulai di sini.':'Belum ketemu yang pas?';
      $('p', $('#empty-state')).textContent = category==='favorites'&&!query?'Ketuk ikon hati pada menu yang kamu suka.':'Coba kata lain, atau jelajahi semua menu kami.';
    }
    $$('.category-tab').forEach(button => { const active=button.dataset.category===category;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active)); });
    $('.favorites-link').classList.toggle('active',category==='favorites');
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
  function toggleFavorite(id, button) {
    const saved = !favorites.has(id);
    if (saved) favorites.add(id); else favorites.delete(id);
    persist('lyme-favorites-v1',[...favorites]);
    if (category === 'favorites') {
      const index=$$('[data-favorite]').indexOf(button);
      renderMenu();
      const next=$$('[data-favorite]')[Math.min(index,favorites.size-1)];
      (next||$('#reset-filters')).focus({preventScroll:true});
    } else {
      button.classList.toggle('is-saved', saved);
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', `${saved?'Hapus':'Simpan'} ${byId.get(id).name} ${saved?'dari':'ke'} favorit`);
      updateCounts();
    }
    toast(saved?'Disimpan ke favoritmu.':'Dihapus dari favorit.');
  }
  const options = (legend,name,values,selected) => `<fieldset class="option-group"><legend>${legend}</legend><div class="option-options">${values.map(value=>`<label class="option-pill"><input type="radio" name="${name}" value="${value}" ${value===selected?'checked':''}><span>${value}${value==='Oat milk'?'<small>+6k</small>':''}</span></label>`).join('')}</div></fieldset>`;
  function showProduct(id) {
    const product=byId.get(id);
    if (!product) return;
    const defaultTemperature=product.temperature.includes('Iced')?'Iced':product.temperature[0];
    $('#product-dialog-content').innerHTML=`<div class="product-detail"><div class="detail-visual"><img src="${product.image}" alt="${product.alt}" width="550" height="750">${product.label?`<span class="card-label signature-label">${product.label}</span>`:''}</div><div class="detail-copy"><p class="eyebrow">${product.category==='bites'?'A LITTLE BITE OF HAPPINESS':'A CUP FOR YOUR KIND OF DAY'}</p><h2 id="product-dialog-title">${product.name}</h2><p class="detail-description">${product.detail}</p><p class="detail-price">${rupiah(product.price)}</p><form id="product-form">${product.temperature.length?options('Suhu minuman','temperature',product.temperature,defaultTemperature):''}${product.sweetness?options('Tingkat manis','sweetness',['Normal','Lebih sedikit','Tanpa gula'],'Normal'):''}${product.milk?options('Pilihan susu','milk',['Susu biasa','Oat milk'],'Susu biasa'):''}<label class="note-label" for="detail-note">Catatan <span style="font-weight:400;color:var(--muted)">(opsional)</span></label><textarea class="detail-note" id="detail-note" name="note" maxlength="180" placeholder="Misalnya: esnya sedikit, ya."></textarea><div class="detail-actions"><div class="quantity-control"><button type="button" id="detail-minus" aria-label="Kurangi jumlah" disabled>${icon('minus')}</button><output id="detail-quantity" aria-label="Jumlah">1</output><button type="button" id="detail-plus" aria-label="Tambah jumlah">${icon('plus')}</button></div><button class="detail-add" type="submit">Tambah ke pilihan<strong id="detail-total">${rupiah(product.price)}</strong></button></div><p class="allergen-note">Menu dan harga masih berupa contoh.${product.milk?' Beri tahu barista jika kamu memiliki alergi susu.':''}</p></form></div></div>`;
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
      if(existing)existing.quantity+=quantity;
      else cart.push({...selection,key:crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2),quantity});
      saveCart();
      productDialog.close();
      toast(`${product.name} ditambahkan ke pilihanmu.`);
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
      return `<article class="cart-item"><img src="${product.image}" alt="${product.alt}" width="150" height="180"><div><div class="cart-item-heading"><h3>${product.name}</h3><button type="button" class="remove-item" data-remove="${escape(item.key)}" aria-label="Hapus ${product.name}">${icon('close')}</button></div><p class="cart-item-meta">${meta||'Teman ngopi'}</p>${item.note?`<p class="cart-item-note">“${escape(item.note)}”</p>`:''}<div class="cart-item-bottom"><div class="quantity-control"><button type="button" data-cart-step="-1" data-key="${escape(item.key)}" aria-label="Kurangi ${product.name}" ${item.quantity<=1?'disabled':''}>${icon('minus')}</button><output aria-label="Jumlah ${product.name}">${item.quantity}</output><button type="button" data-cart-step="1" data-key="${escape(item.key)}" aria-label="Tambah ${product.name}" ${item.quantity>=20?'disabled':''}>${icon('plus')}</button></div><span class="cart-item-price">${rupiah(itemUnitPrice(item)*item.quantity)}</span></div></div></article>`;
    }).join('');
    $('#cart-summary').innerHTML=`<div class="total-line"><span>Total pilihan</span><strong>${rupiah(cartTotal())}</strong></div><button class="button button-dark copy-selection" id="copy-selection" type="button">Salin daftar pilihan ${icon('copy')}</button><p class="summary-note">Tunjukkan daftar ini ke barista.<br>Daftar ini belum menjadi pesanan dan belum termasuk pembayaran.</p>`;
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
  async function copySelection(){
    const lines=['PILIHAN SAYA — LYME COFFEE',''];
    cart.forEach(item=>{
      const product=byId.get(item.productId);
      lines.push(`${item.quantity}× ${product.name} — ${rupiah(itemUnitPrice(item)*item.quantity)}`);
      const meta=[item.temperature,item.sweetness&&`Manis: ${item.sweetness}`,item.milk].filter(Boolean).join(' / ');
      if(meta)lines.push(meta);
      if(item.note)lines.push(`Catatan: ${item.note}`);
      lines.push('');
    });
    lines.push(`Total: ${rupiah(cartTotal())}`,'','Menu & harga contoh. Konfirmasi ke barista untuk pesanan.');
    const copied=await copyText(lines.join('\n'));
    toast(copied?'Daftar pilihan berhasil disalin.':'Belum bisa menyalin. Kamu bisa menunjukkan daftar ini langsung.');
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if(button.hasAttribute('data-close-dialog')){button.closest('dialog').close();return;}
    if(button.dataset.favorite){toggleFavorite(button.dataset.favorite,button);return;}
    if(button.dataset.product){showProduct(button.dataset.product);return;}
    if(button.dataset.category){setCategory(button.dataset.category);return;}
    if(button.dataset.action==='cart'){showCart();return;}
    if(button.dataset.action==='favorites'){
      $('#mobile-nav').hidden=true;$('#mobile-toggle').setAttribute('aria-expanded','false');
      setCategory('favorites',true);return;
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
    if(button.id==='copy-selection'){copySelection();return;}
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
})();
