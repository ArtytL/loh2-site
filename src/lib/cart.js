// แหล่งเก็บตะกร้าแบบง่าย ๆ
const KEY = "cart";

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function save(list){
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("cart:change"));
}

export const cart = {
  list(){ return load(); },
  count(){ return load().reduce((s,it)=> s+it.qty, 0); },
  total(){ return load().reduce((s,it)=> s + it.price*it.qty, 0); },
  add(item, qty=1){
    const list = load();
    const i = list.findIndex(x=>x.id===item.id);
    if(i>=0) list[i].qty += qty;
    else list.unshift({...item, qty});
    save(list);
  },
  setQty(id, qty){
    const list = load();
    const i = list.findIndex(x=>x.id===id);
    if(i>=0){
      list[i].qty = Math.max(0, qty);
      if(list[i].qty===0) list.splice(i,1);
      save(list);
    }
  },
  remove(id){
    const list = load().filter(x=>x.id!==id);
    save(list);
  },
  clear(){
    save([]);
  }
};
