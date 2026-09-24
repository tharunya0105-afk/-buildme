async function testHomeowner() {
  const csrfRes = await fetch('https://buildme-tau.vercel.app/api/auth/csrf');
  const cookiesHeader = csrfRes.headers.get('set-cookie');
  const csrfData = await csrfRes.json();

  const cookieMap = {};
  if (cookiesHeader) {
    cookiesHeader.split(/,(?=\s*__)/).forEach(c => {
      const parts = c.trim().split(';')[0].split('=');
      if (parts[0] && parts[1]) cookieMap[parts[0].trim()] = parts[1].trim();
    });
  }

  const cookieStr = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ');

  const body = new URLSearchParams({
    email: 'rkumar@buildme.demo',
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

  console.log('Homeowner login status:', loginRes.status);
  const loginSetCookie = loginRes.headers.get('set-cookie');
  if (loginSetCookie) {
    loginSetCookie.split(/,(?=\s*__)/).forEach(c => {
      const parts = c.trim().split(';')[0].split('=');
      if (parts[0] && parts[1]) cookieMap[parts[0].trim()] = parts[1].trim();
    });
  }

  const authCookieStr = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ');

  const projRes = await fetch('https://buildme-tau.vercel.app/api/projects', {
    headers: { 'Cookie': authCookieStr }
  });
  console.log('Homeowner /api/projects status:', projRes.status);
  const projs = await projRes.json();
  console.log('Homeowner projects count:', Array.isArray(projs) ? projs.length : projs);

  if (Array.isArray(projs) && projs.length > 0) {
    const pId = projs[0].id;
    const elemRes = await fetch(`https://buildme-tau.vercel.app/api/projects/${pId}/elements`, {
      headers: { 'Cookie': authCookieStr }
    });
    console.log(`Homeowner /api/projects/${pId}/elements status:`, elemRes.status);
  }
}

testHomeowner().catch(console.error);
