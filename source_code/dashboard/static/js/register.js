
/* FUNZIONE CHE GESTISCE LA RICHIESTA DI REGISTRAZIONE */
document.addEventListener('DOMContentLoaded', () => {
  const form       = document.getElementById('register-form');
  const btn        = form.querySelector('button[type="submit"]');
  const errorDiv   = document.getElementById('reg-error');
  const successDiv = document.getElementById('reg-success');

  form.addEventListener('submit', async e => {

    e.preventDefault();
    [errorDiv, successDiv].forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
    const payload = Object.fromEntries(new FormData(form));

    if (payload.password !== payload.re_password) {
      errorDiv.textContent = 'Le password non corrispondono.';
      return errorDiv.style.display = 'block';
    }

    btn.classList.add('loading');
    btn.disabled = true;

    const start = Date.now();
    let resp;

    try {
      resp = await fetch('/auth/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } 
    catch (_) {
      errorDiv.textContent = 'Errore di rete: riprova più tardi';
      errorDiv.style.display = 'block';
    }

    const elapsed = Date.now() - start;
    if (elapsed < 1000) {
      await new Promise(r => setTimeout(r, 1000 - elapsed));
    }

    if (resp) {
      if (resp.status === 201 || resp.status === 204) {
        successDiv.textContent = 
          'Registrazione avvenuta! Controlla la tua email per l’attivazione.';
        successDiv.style.display = 'block';
        form.reset();
        setTimeout(() => window.location.href = '/', 2000);

      } 
      else {
        let errData = {};
        try { errData = await resp.json(); } catch {}
        const key = Object.keys(errData)[0] || 'detail';
        const msg = Array.isArray(errData[key])
          ? errData[key].join(' ')
          : errData[key] || 'Errore durante la registrazione.';
        errorDiv.textContent = msg;
        errorDiv.style.display = 'block';
      }
    }

    btn.classList.remove('loading');
    btn.disabled = false;
  });
});
