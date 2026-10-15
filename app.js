'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const ids = params.getAll('authorization_id');
  const authorizationId = ids[0];
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let client;
  let pending = false;
  let ready = false;
  function fail(message) { $('error').textContent = message; $('error').hidden = false; }
  function busy(value) {
    pending = value;
    for (const id of ['sign-in', 'approve', 'deny', 'sign-out']) $(id).disabled = value;
  }
  function redirectFromServer(value) {
    const url = new URL(value);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
      throw new Error('Unsupported callback');
    }
    location.assign(url.href);
  }
  async function loadRequest() {
    ready = false;
    $('consent').hidden = true;
    $('error').hidden = true;
    const {data: userData, error: userError} = await client.auth.getUser();
    if (userError || !userData.user) {
      $('login').hidden = false;
      $('status').textContent = 'Nejprve ověřte svůj účet. Potom uvidíte požadovaná oprávnění.';
      return;
    }
    $('login').hidden = true;
    const {data, error} = await client.auth.oauth.getAuthorizationDetails(authorizationId);
    if (error || !data) {
      $('status').textContent = 'Požadavek není dostupný nebo již vypršel. Spusťte připojení aplikace znovu.';
      return;
    }
    // Supabase returns a redirect when this client already has consent.
    if (data.redirect_url) { redirectFromServer(data.redirect_url); return; }
    if (!data.client || !data.redirect_uri || typeof data.scope !== 'string') throw new Error('Invalid authorization details');
    $('client-name').textContent = data.client.name || 'Aplikace bez názvu';
    $('client-id').textContent = data.client.id || 'Neuvedeno';
    $('redirect').textContent = data.redirect_uri;
    $('account').textContent = userData.user.email || userData.user.id;
    const labels = {openid:'Ověření vaší identity', email:'Vaše e-mailová adresa', profile:'Základní údaje profilu'};
    $('scopes').replaceChildren();
    const scopes = data.scope.trim().split(/\s+/).filter(Boolean);
    for (const scope of scopes) {
      const li = document.createElement('li');
      li.textContent = labels[scope] ? `${labels[scope]} (${scope})` : scope;
      $('scopes').append(li);
    }
    if (!scopes.length) {
      const li = document.createElement('li');
      li.textContent = 'Bez pojmenovaných oprávnění. Povolení přesto vytvoří přístupový token pro tuto aplikaci.';
      $('scopes').append(li);
    }
    $('status').textContent = 'Zkontrolujte aplikaci a rozhodněte o přístupu.';
    $('consent').hidden = false;
    ready = true;
  }
  $('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !client) return;
    busy(true); $('error').hidden = true;
    try {
      const {error} = await client.auth.signInWithPassword({email:$('email').value.trim(), password:$('password').value});
      $('password').value = '';
      if (error) { fail('Přihlášení se nezdařilo. Zkontrolujte e-mail a heslo a zkuste to znovu.'); return; }
      await loadRequest();
    } catch { fail('Služba není dostupná. Zkuste to prosím znovu.'); }
    finally { $('password').value = ''; busy(false); }
  });
  async function decide(approve) {
    if (pending || !ready) return;
    busy(true); $('error').hidden = true;
    try {
      const method = approve ? 'approveAuthorization' : 'denyAuthorization';
      const {data, error} = await client.auth.oauth[method](authorizationId, {skipBrowserRedirect:true});
      if (error || !data?.redirect_url) throw new Error('Authorization failed');
      ready = false;
      $('status').textContent = 'Přesměrováváme vás zpět do aplikace…';
      redirectFromServer(data.redirect_url);
    } catch { fail('Rozhodnutí se nepodařilo dokončit. Zkuste to znovu nebo zahajte nové připojení.'); }
    finally { busy(false); }
  }
  $('approve').addEventListener('click', () => decide(true));
  $('deny').addEventListener('click', () => decide(false));
  $('sign-out').addEventListener('click', async () => {
    if (pending) return;
    busy(true);
    try {
      const {error} = await client.auth.signOut({scope:'local'});
      if (error) throw error;
      await loadRequest();
    } catch { fail('Odhlášení se nezdařilo. Zkuste to znovu.'); }
    finally { busy(false); }
  });
  if (ids.length !== 1 || !uuid.test(authorizationId || '')) {
    $('status').textContent = 'Tuto stránku otevřete z aplikace, kterou chcete připojit. Chybí platný požadavek na autorizaci.';
    return;
  }
  try {
    if (window.top !== window.self) throw new Error('Embedded page');
    // Session-only storage avoids leaving a login behind after this tab is closed.
    client = window.supabase.createClient('https://lchqaaapvdthqkukpksm.supabase.co', 'sb_publishable_8WmIzUomXmck_4Gf53DrvA_5DUqLhmE', {
      auth:{storage:sessionStorage, storageKey:'learning-engine-dev-consent', persistSession:true, autoRefreshToken:true, detectSessionInUrl:false}
    });
    loadRequest().catch(() => fail('Požadavek nelze načíst. Zahajte připojení znovu.'));
  } catch { $('status').textContent = 'Stránku nelze bezpečně otevřít. Otevřete ji přímo v prohlížeči a povolte úložiště této relace.'; }
})();
