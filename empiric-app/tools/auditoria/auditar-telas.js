const { chromium } = require('playwright');
const R = {
  admin: ['/admin','/admin/imoveis','/admin/imoveis/novo','/admin/imoveis/d0000000-0000-4000-8000-000000000001','/admin/proprietarios','/admin/inquilinos','/admin/pessoas/novo?papel=tenant','/admin/pessoas/b0000000-0000-4000-8000-000000000001','/admin/contratos','/admin/contratos/novo','/admin/contratos/e0000000-0000-4000-8000-000000000001','/admin/financeiro','/admin/financeiro/novo','/admin/financeiro/f0000000-0000-4000-8000-000000000001','/admin/documentos','/admin/documentos/novo','/admin/agenda','/admin/agenda?v=semana','/admin/agenda?v=dia','/admin/chamados','/admin/comunicados','/admin/notificacoes','/admin/configuracoes'],
  owner: ['/proprietario','/proprietario/financeiro','/proprietario/documentos','/proprietario/imoveis','/proprietario/notificacoes'],
  tenant: ['/inquilino','/inquilino/faturas','/inquilino/documentos','/inquilino/chamados','/inquilino/indique','/inquilino/notificacoes'],
};
const VP = [['monitor',1920,1080],['notebook',1366,768],['tablet',820,1180],['celular',390,844]];
const cookie = (role) => 'base64-' + Buffer.from(JSON.stringify({ access_token: 'mock-' + role, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r', user: { id: 'x', aud: 'authenticated' } })).toString('base64url');
(async () => {
  const b = await chromium.launch(); const out = {}; const shots = process.argv[2] === 'shots';
  for (const role of Object.keys(R)) for (const [vn, w, h] of VP) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: vn !== 'monitor' && vn !== 'notebook' });
    await ctx.addCookies([{ name: 'sb-localhost-auth-token', value: cookie(role), domain: 'localhost', path: '/' }]);
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !m.text().includes('favicon') && errs.push(m.text().slice(0, 140)));
    for (const r of R[role]) {
      const resp = await p.goto('http://localhost:3200' + r, { waitUntil: 'networkidle' }).catch(e => null);
      await p.waitForTimeout(150);
      const res = await p.evaluate((touch) => {
        const iss = []; const vw = document.documentElement.clientWidth;
        if (document.body.scrollWidth > vw + 2) iss.push('rolagem horizontal da página ' + (document.body.scrollWidth - vw) + 'px');
        if (/Algo deu errado|Página não encontrada|Não foi possível carregar/.test(document.body.innerText)) iss.push('TELA DE ERRO: ' + document.querySelector('h1')?.innerText);
        document.querySelectorAll('main *').forEach(el => { const r = el.getBoundingClientRect(); if (!r.width) return; if (el.closest('.overflow-x-auto,dialog')) return; if (r.right > vw + 1) iss.push('sai da tela: ' + el.tagName + '.' + String(el.className).split(' ').slice(0, 2).join('.') + ' +' + Math.round(r.right - vw)); });
        if (touch) document.querySelectorAll('main button, main a, main input:not([type=hidden]), main select, nav button, nav a').forEach(el => { const r = el.getBoundingClientRect(); if (!r.width || r.height === 0) return; if (r.height < 40 && getComputedStyle(el).display !== 'inline') iss.push('toque pequeno: ' + ((el.innerText || el.getAttribute('aria-label') || el.name || el.type || '').trim().slice(0, 22)) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); });
        return [...new Set(iss)].slice(0, 12);
      }, vn === 'tablet' || vn === 'celular');
      if (resp && resp.status() >= 400) res.unshift('HTTP ' + resp.status());
      if (res.length) out[`${role} ${vn} ${r}`] = res;
      if (shots && (vn === 'celular' || vn === 'notebook')) await p.screenshot({ path: `tools/auditoria/capturas/${role}-${vn}-${r.replace(/[/?=]/g, '_').slice(0, 60)}.png`, fullPage: true });
    }
    if (errs.length) out[`${role} ${vn} console`] = [...new Set(errs)].slice(0, 8);
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
