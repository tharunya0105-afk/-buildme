async function test() {
  // Step 1: get csrf
  const csrfRes = await fetch('https://buildme-tau.vercel.app/api/auth/csrf');
  const cookiesHeader = csrfRes.headers.get('set-cookie');
  const csrfData = await csrfRes.json();

  // Parse cookies
  const cookieMap = {};
  if (cookiesHeader) {
    cookiesHeader.split(/,(?=\s*__)/).forEach(c => {
      const parts = c.trim().split(';')[0].split('=');
      if (parts[0] && parts[1]) cookieMap[parts[0].trim()] = parts[1].trim();
    });
  }

  const cookieStr = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ');

  // Step 2: login
  const body = new URLSearchParams({
    email: 'engineer@buildme.demo',
    password: 'demo1234',
    csrfToken: csrfData.csrfToken,
    json: 'true',
    redirect: 'false'
  });

  const loginRes = await fetch('https://buildme-tau.vercel.app/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieStr
    },
    body: body.toString()
  });

  console.log('Login status:', loginRes.status);
  const loginSetCookie = loginRes.headers.get('set-cookie');
  if (loginSetCookie) {
    loginSetCookie.split(/,(?=\s*__)/).forEach(c => {
      const parts = c.trim().split(';')[0].split('=');
      if (parts[0] && parts[1]) cookieMap[parts[0].trim()] = parts[1].trim();
    });
  }

  const authCookieStr = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ');

  // Step 3: fetch /api/projects
  const projRes = await fetch('https://buildme-tau.vercel.app/api/projects', {
    headers: { 'Cookie': authCookieStr }
  });
  console.log('/api/projects status:', projRes.status);
  const projData = await projRes.text();
  console.log('/api/projects sample:', projData.slice(0, 300));

  // Step 4: fetch /api/dashboard
  const dashRes = await fetch('https://buildme-tau.vercel.app/api/dashboard', {
    headers: { 'Cookie': authCookieStr }
  });
  console.log('/api/dashboard status:', dashRes.status);
  const dashData = await dashRes.text();
  console.log('/api/dashboard sample:', dashData.slice(0, 300));
}

test().catch(console.error);
