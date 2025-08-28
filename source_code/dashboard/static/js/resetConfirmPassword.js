
/* FUNZIONE CHE GESTISCE LA RICHIESTA DI CONFERMA RESET PASSWORD */
document.getElementById('pw-reset-confirm')
  .addEventListener('submit', async e => {
    e.preventDefault();
    const msgEl = document.getElementById('msg-confirm-reset');
    msgEl.textContent = '';

    const parts = location.pathname.split('/').filter(Boolean);
    const [, uid, token] = parts;
    console.log('DEBUG reset:', { uid, token });

    const body = {
      uid,
      token,
      new_password:      e.target.new_password.value,
      re_new_password:   e.target.re_new_password.value
    };

    try {
      const res = await fetch('/auth/users/reset_password_confirm/', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        console.log('Status:', res.status);
        const payload = await res.json();
        console.log('Response body:', payload);
        throw new Error(Object.values(payload).flat().join(' ') || 'Errore');
      }

      msgEl.textContent = 'Password aggiornata! Reindirizzamento al login…';
      setTimeout(() => location.href = '/', 2000);

    } catch (err) {
      msgEl.textContent = 'Si è verificato un errore: ' + err.message;
    }
  });


