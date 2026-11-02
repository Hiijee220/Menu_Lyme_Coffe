export const sizeParent=m=>(m.tags||[]).find(t=>t.startsWith('Induk: '))?.slice(7)||'';
export const sizeName=m=>sizeParent(m)?'Large/besar':'Medium/sedang';
export function sizeChoices(menu,m){return [m,...menu.filter(x=>sizeParent(x)===m.id)];}
export function largeVariant(m,price,available=true,old){const tags=(m.tags||[]).filter(t=>!t.startsWith('Induk: ')&&!t.startsWith('Ukuran: ')&&t!=='Konfirmasi harga');const result={...m,id:old?.id||m.id.slice(0,72)+'-large',name:m.name.slice(0,60)+' · Large/besar',price,available,tags:[...tags.slice(0,6),'Induk: '+m.id,'Ukuran: Large']};delete result.updatedAt;delete result.label;return result;}
