
/* FUNCTION THAT HANDLING LOGIN REQUEST */
document.addEventListener('DOMContentLoaded', () => {

  const form       = document.getElementById('login-form');
  const btn        = form.querySelector('button[type="submit"]');
  const globalErr  = document.getElementById('error');
  const emailInput = document.getElementById('email');
  const passInput  = document.getElementById('password');
  const emailErr   = document.getElementById('email-error');
  const passErr    = document.getElementById('password-error');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    [globalErr, emailErr, passErr].forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });

    [emailInput, passInput].forEach(i => i.parentElement.classList.remove('error'));
    let hasError = false;

    if (!emailInput.value.trim()) {
      emailErr.textContent = 'Email obbligatoria';
      emailErr.style.display = 'block';
      emailInput.parentElement.classList.add('error');
      hasError = true;
    }

    if (!passInput.value) {
      passErr.textContent = 'Password obbligatoria';
      passErr.style.display = 'block';
      passInput.parentElement.classList.add('error');
      hasError = true;
    }

    if (hasError) return;

    try {
      btn.classList.add('loading');
      btn.disabled = true;

      const resp = await fetch('/auth/jwt/create/', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          email: emailInput.value,
          password: passInput.value
        })
      });

      const data = await resp.json();

      if (!resp.ok) {

        if (data.email) {
          emailErr.textContent = data.email.join(' ');
          emailErr.style.display = 'block';
          emailInput.parentElement.classList.add('error');
        }
        if (data.password) {
          passErr.textContent = data.password.join(' ');
          passErr.style.display = 'block';
          passInput.parentElement.classList.add('error');
        }
        else if (resp.status === 401 && data.detail) {
          globalErr.textContent = data.detail;
          globalErr.style.display = 'block';
        }
        else {
          globalErr.textContent = data.detail || 'Credenziali non valide';
          globalErr.style.display = 'block';
        }
        return;
      }

      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      window.location.href = 'dashboard/homepage';

    } 
    catch (err) {
      globalErr.textContent = 'Errore di rete: riprova più tardi';
      globalErr.style.display = 'block';
    } 
    finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });
});
