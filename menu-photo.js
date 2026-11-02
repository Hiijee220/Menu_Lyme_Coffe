// Encode as JPEG: Safari may return uncompressed PNG for a WebP request.
export async function prepareMenuPhoto(file){
 if(!file||!file.size)throw Error('File gambar kosong. Pilih kembali foto dari Galeri atau File.');
 if(file.size>20*1024*1024)throw Error('Foto melebihi 20 MB. Pilih foto dengan ukuran lebih kecil.');
 if(file.type&&!file.type.startsWith('image/'))throw Error('File ini bukan gambar. Pilih JPG, PNG, WebP, atau foto dari Galeri.');
 const url=URL.createObjectURL(file);let image;
 try{
  image=await new Promise((resolve,reject)=>{const img=new Image();const timer=setTimeout(()=>{img.onload=img.onerror=null;reject(Error('Foto terlalu lama dibaca. Pilih ulang foto atau gunakan JPG/PNG.'));},20000);img.onload=()=>{clearTimeout(timer);resolve(img);};img.onerror=()=>{clearTimeout(timer);reject(Error('Foto tidak dapat dibaca browser. Untuk HEIC/HEIF, simpan atau ekspor sebagai JPG/PNG lalu pilih kembali.'));};img.src=url;});
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  if(!width||!height)throw Error('Ukuran gambar tidak valid. Pilih foto lain.');
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('Browser gagal memproses gambar. Coba buka ulang Safari.');
  for(let edge=1200;edge>=300;edge=Math.floor(edge*.75)){
   const scale=Math.min(1,edge/Math.max(width,height));canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
   for(const quality of [.85,.7,.55,.4]){const preview=canvas.toDataURL('image/jpeg',quality);if(/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(preview)&&preview.length<=600000)return {preview,content:preview.split(',')[1],extension:preview.startsWith('data:image/jpeg')?'jpg':'png'};}
  }
  throw Error('Foto belum dapat diperkecil. Gunakan JPG/PNG dengan resolusi lebih kecil.');
 }finally{URL.revokeObjectURL(url);}
}
