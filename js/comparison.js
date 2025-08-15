// comparison.js
import './utils.js';
import { toast, imgOrPlaceholder } from './utils.js';
import { computeLeafScore, estimateCarbonGrams } from './ratingEngine.js';

const API = 'https://world.openfoodfacts.org/api/v2/product/';

function leafs(n){
  const arr = [];
  for(let i=0;i<5;i++){ arr.push(`<span class="leaf">${i<n?'🍃':'🌱'}</span>`); }
  return `<div class="rating">${arr.join('')}</div>`;
}

async function fetchByCode(code){
  const res = await fetch(`${API}${encodeURIComponent(code)}.json`);
  const data = await res.json();
  return data.product;
}

function renderProduct(p, target){
  if(!p){ target.innerHTML = '<p class="muted">No product selected.</p>'; return; }
  p.__leafs = computeLeafScore(p); p.__co2 = estimateCarbonGrams(p);
  target.innerHTML = `
    <div class="row"><img src="${imgOrPlaceholder(p.image_small_url||p.image_front_url)}" style="width:96px;height:96px;object-fit:cover;border-radius:12px;margin-right:.75rem">
    <div><h3>${p.product_name||'Unknown'}</h3><div class="muted">${p.brands||''}</div></div></div>
    <div class="row"><span class="badge">${leafs(p.__leafs)}</span><span class="badge">~ ${Math.round(p.__co2/1000)} kg CO₂e</span></div>
    <p class="muted">Labels: ${(p.labels||'').split(',').slice(0,6).join(', ')}</p>
    <div class="row"><button class="btn" id="saveBtn">Save</button></div>
  `;
  document.getElementById('saveBtn')?.addEventListener('click', ()=>{
    const favs = JSON.parse(localStorage.getItem('ecocart.favs')||'[]');
    if(!favs.find(x=>x.code===p.code)){
      favs.push({code:p.code, name:p.product_name, brand:p.brands, image:p.image_front_url||'', rating:p.__leafs});
      localStorage.setItem('ecocart.favs', JSON.stringify(favs));
      toast('Saved');
    } else toast('Already saved');
  });
}

async function loadSelected(){
  const code = localStorage.getItem('ecocart.selected');
  const target = document.getElementById('productDetail');
  if(!code){ renderProduct(null, target); return; }
  const p = await fetchByCode(code);
  renderProduct(p, target);
}

async function searchCompare(q){
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=1&page_size=8&fields=code,product_name,brands,image_small_url,image_front_url,labels,labels_tags,packaging,nutrition_grades,nutrition_grade_fr,nova_group,quantity`;
  const res = await fetch(url);
  const data = await res.json();
  const grid = document.getElementById('compareResults');
  grid.innerHTML='';
  (data.products||[]).forEach(p=>{
    p.__leafs = computeLeafScore(p); p.__co2 = estimateCarbonGrams(p);
    const card = document.createElement('article');
    card.className='card';
    card.innerHTML = `
      <img src="${imgOrPlaceholder(p.image_small_url||p.image_front_url)}" alt="${p.product_name}">
      <div class="p">
        <h3>${p.product_name||'Unknown'}</h3>
        <div class="row"><span class="badge">${leafs(p.__leafs)}</span><span class="badge">~ ${Math.round(p.__co2/1000)} kg CO₂e</span></div>
        <button class="btn" data-code="${p.code}">Compare</button>
      </div>`;
    grid.appendChild(card);
  });
  grid.addEventListener('click',(e)=>{
    const code = e.target?.dataset?.code;
    if(!code) return;
    localStorage.setItem('ecocart.selected', code);
    loadSelected();
    toast('Replaced selection');
  }, { once:true });
}

document.getElementById('compareForm')?.addEventListener('submit',(e)=>{
  e.preventDefault();
  const q = document.getElementById('cmpQuery').value.trim();
  if(q) searchCompare(q);
});

window.addEventListener('DOMContentLoaded', ()=>{
  loadSelected();
  const list = JSON.parse(localStorage.getItem('ecocart.compare')||'[]');
  if(list.length===2){
    // bonus: quick leaf comparison in toast
    Promise.all(list.map(fetchByCode)).then(([a,b])=>{
      const la = computeLeafScore(a), lb = computeLeafScore(b);
      const better = la===lb ? 'Both similar' : (la>lb? a.product_name : b.product_name);
      toast(`Comparison ready: ${better} scores better on sustainability.`);
    }).catch(()=>{});
  }
});
