// search.js
import { toast, imgOrPlaceholder, saveFavorite } from './utils.js';
import { computeLeafScore, estimateCarbonGrams } from './ratingEngine.js';

const API = 'https://world.openfoodfacts.org/cgi/search.pl';

const resultsEl = document.getElementById('results');
const metaEl = document.getElementById('resultsMeta');
const pager = document.getElementById('pager');

let currentPage = 1;
let lastQ = '';

function leafs(n){
  const arr = [];
  for(let i=0;i<5;i++){
    arr.push(`<span class="leaf">${i<n?'🍃':'🌱'}</span>`);
  }
  return `<div class="rating">${arr.join('')}</div>`;
}

async function search(q, page=1){
  lastQ = q;
  currentPage = page;
  metaEl.textContent = 'Searching…';
  resultsEl.innerHTML = '';
  pager.innerHTML='';

  const url = `${API}?search_terms=${encodeURIComponent(q)}&json=1&page_size=12&page=${page}&fields=code,product_name,brands,image_front_url,image_small_url,labels_tags,packaging,nutrition_grade_fr,nutrition_grades,countries,categories,nova_group,quantity`;

  const res = await fetch(url);
  const data = await res.json();

  const filters = [...document.querySelectorAll('.filters input[type=checkbox]:checked')].map(i=>i.value);
  let products = (data.products||[]).filter(p=>p.product_name);

  // compute scores and local carbon est
  products.forEach(p=>{
    p.__leafs = computeLeafScore(p);
    p.__co2 = estimateCarbonGrams(p);
  });

  // Apply sustainability filters
  if(filters.length){
    products = products.filter(p=>{
      const labels = (p.labels_tags||[]).join(' ').toLowerCase();
      const pack = (p.packaging||'').toLowerCase();
      return filters.every(f=>{
        if(f==='organic') return /organic|bio/.test(labels);
        if(f==='fair-trade') return /fair.?trade/.test(labels);
        if(f==='recyclable') return /recycl/.test(pack);
        if(f==='low-carbon') return p.__co2 < 1200;
        return true;
      });
    });
  }

  metaEl.textContent = `Found ${data.count} items · showing ${products.length} on page ${page}`;

  // Render
  const frag = document.createDocumentFragment();
  products.forEach(p=>{
    const card = document.createElement('article');
    card.className='card';
    card.innerHTML = `
      <img loading="lazy" src="${imgOrPlaceholder(p.image_small_url||p.image_front_url)}" alt="${p.product_name}">
      <div class="p">
        <h3>${p.product_name}</h3>
        <p class="muted">${p.brands||''}</p>
        <div class="row">
          <span class="badge leaf">${leafs(p.__leafs)}</span>
          <span class="badge">~ ${Math.round(p.__co2/1000)} kg CO₂e</span>
        </div>
        <div class="row">
          <button class="btn" data-code="${p.code}" data-action="view">View</button>
          <button class="btn ghost" data-code="${p.code}" data-action="save">Save</button>
          <button class="btn ghost" data-code="${p.code}" data-action="compare">Compare</button>
        </div>
      </div>`;
    frag.appendChild(card);
  });
  resultsEl.appendChild(frag);

  // Simple pager
  const totalPages = Math.ceil((data.count||0)/12);
  if(totalPages>1){
    const prev = document.createElement('button');
    prev.textContent = 'Prev';
    prev.disabled = page<=1;
    prev.onclick = ()=>search(lastQ, page-1);
    const next = document.createElement('button');
    next.textContent = 'Next';
    next.disabled = page>=totalPages;
    next.onclick = ()=>search(lastQ, page+1);
    pager.append(prev, next);
  }

  // Track viewed search terms
  const history = JSON.parse(localStorage.getItem('ecocart.history')||'[]');
  history.unshift({q, ts: Date.now(), count: data.count||0});
  localStorage.setItem('ecocart.history', JSON.stringify(history.slice(0,20)));

  // Remember last query
  localStorage.setItem('ecocart.lastq', q);
}

document.getElementById('searchForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const q = document.getElementById('q').value.trim();
  if(q) search(q);
});

// Delegate buttons
resultsEl?.addEventListener('click', (e)=>{
  const b = e.target.closest('button[data-action]');
  if(!b) return;
  const code = b.dataset.code;
  const action = b.dataset.action;
  const card = b.closest('card, article');
  const name = card?.querySelector('h3')?.textContent || 'Product';
  const img = card?.querySelector('img')?.src || '';
  if(action==='save'){
    saveFavorite({code, product_name: name, brands:'', image_front_url:img});
  }else if(action==='view'){
    localStorage.setItem('ecocart.selected', code);
    window.location.href = 'product.html';
  }else if(action==='compare'){
    const list = JSON.parse(localStorage.getItem('ecocart.compare')||'[]');
    if(!list.includes(code)) list.push(code);
    localStorage.setItem('ecocart.compare', JSON.stringify(list.slice(-2))); // keep last 2
    toast('Added to comparison list');
    window.location.href = 'product.html';
  }
});

// Auto-run sample search on first load
window.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('q')){
    const q = localStorage.getItem('ecocart.lastq') || 'cereal';
    document.getElementById('q').value = q;
    search(q);
  }
});
