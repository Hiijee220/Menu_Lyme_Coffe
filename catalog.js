export const retiredMenuIds=new Set(['brown-sugar','lyme-matcha','citrus-coffee','cafe-latte','americano','cappuccino','vanilla-latte','pure-matcha','chocolate','citrus-fizz','butter-croissant','almond-croissant']);
export const needsPrice=item=>(item.tags||[]).includes('Konfirmasi harga');
export function mergeCatalog(base,records){const saved=new Map(records.filter(m=>!retiredMenuIds.has(m.id)).map(m=>[m.id,m]));const baseIds=new Set(base.map(m=>m.id));return [...base.map(m=>saved.has(m.id)?{...m,...saved.get(m.id)}:m),...records.filter(m=>!retiredMenuIds.has(m.id)&&!baseIds.has(m.id))];}
