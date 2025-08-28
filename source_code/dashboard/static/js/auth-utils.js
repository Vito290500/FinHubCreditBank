
/* UTILITY PER LA GESTION DELLA SCADENZA DEL TOKEN */
function handleTokenExpiration() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  alert('La tua sessione è scaduta. Verrai reindirizzato al login.');
  window.location.href = '/';
}

function isTokenExpired(response) {
  return response.status === 401;
}

function getAccessToken() {
  return localStorage.getItem('accessToken');
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

async function authFetch(url, options = {}) {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    handleTokenExpiration();
    return { response: { ok: false, status: 401 }, data: { detail: 'Token mancante' } };
  }

  const headers = {
    ...(options.headers || {}),
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  };
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers
  });

  if (isTokenExpired(response)) {
    handleTokenExpiration();
    return { response, data: { detail: 'Token scaduto' } };
  }

  let data = null;

  if (response.status !== 204) {
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
  }
  return { response, data };
}

function isAuthenticated() {
  return !!getAccessToken();
}

function requireAuth() {
  if (!isAuthenticated()) {
    handleTokenExpiration();
    return false;
  }
  return true;
}

window.authUtils = {
  handleTokenExpiration,
  isTokenExpired,
  getAccessToken,
  getRefreshToken,
  authFetch,
  isAuthenticated,
  requireAuth
};