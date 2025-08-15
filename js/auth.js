// auth.js
(function(){
  const form = document.getElementById('loginForm');
  const demoGoogle = document.getElementById('googleDemo');
  function signin(name, email){
    const user = { name, email, ts: Date.now() };
    localStorage.setItem('ecocart.user', JSON.stringify(user));
    window.location.href = 'dashboard.html';
  }
  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const email = fd.get('email'); const pass = fd.get('password');
    if(String(pass).length>=4) signin(String(email).split('@')[0], email);
  });
  demoGoogle?.addEventListener('click', ()=> signin('Google User', 'google@demo.com'));
})();
