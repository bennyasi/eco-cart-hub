// ratingEngine.js
// Compute a 0-5 leaf sustainability score from Open Food Facts attributes
export function computeLeafScore(p){
  let score = 0;
  // Positive signals
  const labels = (p.labels_tags||[]).map(String);
  if(labels.some(l=>/organic|bio/.test(l))) score += 2;
  if(labels.some(l=>/fair.?trade/.test(l))) score += 1;
  const pack = (p.packaging||'').toLowerCase();
  if(/recycl/i.test(pack)) score += 1;
  // Nutrition grade (A best -> +1, E worst -> -1)
  const ng = (p.nutrition_grade_fr||p.nutrition_grades||'').toUpperCase();
  if(ng==='A') score += 1;
  if(ng==='E') score -= 1;
  // NOVA ultra-processed penalty
  const nova = Number(p.nova_group||0);
  if(nova>=4) score -= 1;
  // Origin: local-ish bonus if manufacturing country matches user pref (stored)
  const prefCountry = (localStorage.getItem('ecocart.country')||'').toLowerCase();
  const origin = (p.countries||'').toLowerCase();
  if(prefCountry && origin.includes(prefCountry)) score += 1;

  // Clamp 0..5
  score = Math.max(0, Math.min(5, score));
  return score;
}

// Very rough carbon estimator (grams CO2e) using category & packaging hints
export function estimateCarbonGrams(p){
  let base = 1200; // default per item baseline
  const cat = (p.categories||'').toLowerCase();
  if(/beef|red.?meat/.test(cat)) base = 8000;
  else if(/poultry|chicken/.test(cat)) base = 2500;
  else if(/dairy|cheese/.test(cat)) base = 3000;
  else if(/vegetable|fruit|plant/.test(cat)) base = 800;
  else if(/cereal|grain/.test(cat)) base = 900;

  const pack = (p.packaging||'').toLowerCase();
  if(/plastic/.test(pack)) base *= 1.15;
  if(/glass|metal|aluminium/.test(pack)) base *= 1.05;
  if(/recycl/.test(pack)) base *= 0.9;

  // Scale by quantity if available
  const qty = parseFloat(String(p.quantity||'').replace(/[^0-9.]/g,'')) || 1;
  if(qty>1) base *= Math.min(qty/100, 5); // crude scaling

  return Math.round(base);
}
