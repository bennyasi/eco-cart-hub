// dashboard.js
import './utils.js'; // ensures theme/account label setup
import { toast } from './utils.js';

async function fetchCountryMeta(name){
  const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=name,region,capital,population,currencies,flags`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Country fetch failed');
  const [c] = await res.json();
  return c;
}

function loadFavs(){
  const favs = JSON.parse(localStorage.getItem('ecocart.favs')||'[]');
  const container = document.getElementById('favorites');
  container.innerHTML = '';
  favs.forEach(f=>{
    const row = document.createElement('div');
    row.className='card p';
    row.innerHTML = `<div class="row" style="justify-content:space-between">
      <div class="row"><img src="${f.image||''}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:8px;margin-right:.5rem">
      <div><strong>${f.name}</strong><div class="muted">${f.brand||''}</div></div></div>
      <div class="row">
        <span class="badge">⭐ ${f.rating||0}/5</span>
        <button class="btn ghost" data-code="${f.code}">Remove</button>
      </div></div>`;
    container.appendChild(row);
  });
  container.addEventListener('click',(e)=>{
    const code = e.target?.dataset?.code;
    if(!code) return;
    const next = favs.filter(x=>x.code!==code);
    localStorage.setItem('ecocart.favs', JSON.stringify(next));
    loadFavs();
    toast('Removed');
  }, { once:true });
}

function computeWeeklyReport(){
  const history = JSON.parse(localStorage.getItem('ecocart.history')||'[]');
  const itemsRated = Math.min(history.length, 20);
  // Fake but deterministic totals from actions
  const co2Saved = itemsRated * 0.3; // kg
  const waterSaved = itemsRated * 12; // liters
  document.getElementById('co2Saved').textContent = co2Saved.toFixed(1);
  document.getElementById('waterSaved').textContent = waterSaved.toFixed(0);
  document.getElementById('itemsRated').textContent = itemsRated;
  document.getElementById('weekNote').textContent = `Based on ${itemsRated} recent product checks.`;
}

function prefsInit(){
  const form = document.getElementById('prefs');
  const theme = localStorage.getItem('ecocart.theme') || 'light';
  form.theme.value = theme;
  form.country.value = localStorage.getItem('ecocart.country') || 'Nigeria';
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    localStorage.setItem('ecocart.theme', fd.get('theme'));
    localStorage.setItem('ecocart.country', fd.get('country'));
    document.body.classList.toggle('dark', fd.get('theme')==='dark');
    toast('Preferences saved');
    try{
      const meta = await fetchCountryMeta(fd.get('country'));
      document.getElementById('countryMeta').innerHTML = `
        <div class="row"><img src="${meta.flags.png}" alt="${meta.name.common}" style="width:28px;height:20px;border:1px solid #d0d5dd"> 
        <div>${meta.name.common} · ${meta.region} · Capital: ${meta.capital?.[0]||''} · Pop: ${meta.population.toLocaleString()}</div></div>`;
    }catch{ /* ignore */ }
  });
}

function forumInit(){
  const postsEl = document.getElementById('posts');
  const form = document.getElementById('newPost');
  function render(){
    const posts = JSON.parse(localStorage.getItem('ecocart.posts')||'[]');
    postsEl.innerHTML = '';
    posts.forEach((p,i)=>{
      const card = document.createElement('article');
      card.className='card p';
      card.innerHTML = `<strong>${p.name}</strong> <span class="muted">· ${new Date(p.ts).toLocaleString()}</span>
        <p>${p.text}</p>
        <div class="row"><button class="btn ghost" data-i="${i}">Delete</button></div>`;
      postsEl.appendChild(card);
    });
  }
  render();
  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    const text = document.getElementById('postText').value.trim();
    if(!text) return;
    const user = JSON.parse(localStorage.getItem('ecocart.user')||'{"name":"Guest"}');
    const posts = JSON.parse(localStorage.getItem('ecocart.posts')||'[]');
    posts.unshift({ name: user.name || 'Guest', text, ts: Date.now() });
    localStorage.setItem('ecocart.posts', JSON.stringify(posts.slice(0,100)));
    (document.getElementById('postText')).value='';
    render();
  });
  postsEl.addEventListener('click',(e)=>{
    const i = e.target?.dataset?.i;
    if(i==null) return;
    const posts = JSON.parse(localStorage.getItem('ecocart.posts')||'[]');
    posts.splice(Number(i),1);
    localStorage.setItem('ecocart.posts', JSON.stringify(posts));
    render();
  });
}

window.addEventListener('DOMContentLoaded', ()=>{
  computeWeeklyReport();
  prefsInit();
  forumInit();
  loadFavs();
});
