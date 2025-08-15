// utils.js
(function(){
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();
  const accountLink = document.getElementById('accountLink');
  const user = JSON.parse(localStorage.getItem('ecocart.user')||'null');
  if(accountLink){
    accountLink.textContent = user ? `Hi, ${user.name}` : 'Sign in';
  }
  const themeToggle = document.getElementById('themeToggle');
  const theme = localStorage.getItem('ecocart.theme') || 'light';
  document.body.classList.toggle('dark', theme==='dark');
  if(themeToggle){
    themeToggle.addEventListener('click', ()=>{
      const next = document.body.classList.contains('dark') ? 'light':'dark';
      localStorage.setItem('ecocart.theme', next);
      document.body.classList.toggle('dark', next==='dark');
      toast(`Theme set to ${next}`);
    });
  }
})();

export function toast(msg){
  const el = document.getElementById('toast');
  if(!el) return alert(msg);
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 2000);
}

export function fmtKg(n){ return (Math.round(n*10)/10).toFixed(1); }
export function imgOrPlaceholder(url){ return url || 'images/placeholder.png'; }

export function saveFavorite(item){
  const f = JSON.parse(localStorage.getItem('ecocart.favs')||'[]');
  if(!f.find(x=>x.code===item.code)){
    f.push({code:item.code,name:item.product_name,brand:item.brands,image:item.image_small_url||item.image_front_url||'', rating:item.__leafs||0});
    localStorage.setItem('ecocart.favs', JSON.stringify(f));
    toast('Saved to favorites');
  } else {
    toast('Already in favorites');
  }
}
