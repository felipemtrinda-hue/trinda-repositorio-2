// Backend simulado (somente para auditoria visual/responsiva local). Dados fictícios.
const http = require('http'); const fs = require('fs'); const path = require('path');
const photo = fs.readFileSync(path.join(__dirname, '../../public/icons/icon-512.png'));
const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const m = (n) => { const x = new Date(); x.setDate(1); x.setMonth(x.getMonth() + n); return x.toISOString().slice(0, 10); };
const ts = (n) => new Date(Date.now() + n * 864e5).toISOString();
const U = { admin: 'a0000000-0000-4000-8000-000000000001', owner: 'b0000000-0000-4000-8000-000000000001', tenant: 'c0000000-0000-4000-8000-000000000001' };
const P1 = 'p0000000-0000-4000-8000-000000000001'.replace('p', 'd'), P2 = 'd0000000-0000-4000-8000-000000000002', P3 = 'd0000000-0000-4000-8000-000000000003';
const L1 = 'e0000000-0000-4000-8000-000000000001', L2 = 'e0000000-0000-4000-8000-000000000002';
const profiles = [
  { id: U.admin, role: 'admin', status: 'active', full_name: 'Equipe Empiric', email: 'equipe@exemplo.com' },
  { id: U.owner, role: 'owner', status: 'active', full_name: 'Carlos Menezes', email: 'carlos@exemplo.com', phone: '42999000101', whatsapp: '42999000101', document_id: '52998224725', notes: '', lgpd_consent_at: ts(-200) },
  { id: 'b0000000-0000-4000-8000-000000000002', role: 'owner', status: 'invited', full_name: 'Helena Duarte', email: 'helena@exemplo.com' },
  { id: U.tenant, role: 'tenant', status: 'active', full_name: 'Mariana Souza', email: 'mariana@exemplo.com', phone: '42999000001', whatsapp: '42999000001', document_id: '', notes: '', lgpd_consent_at: ts(-300) },
  { id: 'c0000000-0000-4000-8000-000000000002', role: 'tenant', status: 'blocked', full_name: 'Rafael Lima', email: 'rafael@exemplo.com' },
];
const prop = (id, title, status, rent, district) => ({ id, code: 'EMP-' + id.slice(-3), title, kind: 'apartment', status, description: 'Apartamento claro, com sacada e vista livre.', street: 'Rua das Palmeiras', number: '410', complement: 'Ap 302', district, city: 'Ponta Grossa', state: 'PR', zip_code: '84010000', bedrooms: 2, bathrooms: 1, parking_spots: 1, area_m2: 68, rent_amount: rent, condo_amount: 360, iptu_amount: 60, features: ['Sacada', 'Churrasqueira'], created_at: ts(-100) });
const properties = [prop(P1, 'Apto 302 · Ed. Jardim das Flores', 'rented', 1850, 'Centro'), prop(P2, 'Casa Vila Estrela', 'rented', 2600, 'Vila Estrela'), prop(P3, 'Sala comercial 1204 com nome bem comprido para testar quebra', 'available', 1400, 'Centro')];
const pt = (id) => ({ title: properties.find(p => p.id === id).title, id });
const leases = [
  { id: L1, property_id: P1, tenant_id: U.tenant, status: 'active', start_date: m(-10), end_date: m(20), due_day: 10, rent_amount: 1850, adjustment_index: 'IGP-M', renewal_alert_days: 60, notes: '', property: pt(P1), tenant: { full_name: 'Mariana Souza' } },
  { id: L2, property_id: P2, tenant_id: 'c0000000-0000-4000-8000-000000000002', status: 'awaiting_signature', start_date: m(0), end_date: m(30), due_day: 5, rent_amount: 2600, renewal_alert_days: 60, property: pt(P2), tenant: { full_name: 'Rafael Lima' } },
];
const items = [{ id: 'i1', label: 'Aluguel', amount: 1850, position: 0 }, { id: 'i2', label: 'Condomínio', amount: 360, position: 1 }, { id: 'i3', label: 'IPTU (parcela)', amount: 60, position: 2 }];
const inv = (k, comp, due, status, extra = {}) => ({ id: 'f0000000-0000-4000-8000-00000000000' + k, lease_id: L1, competence: comp, due_date: due, amount: 2270, status, published_at: ts(-5), barcode: '23790.12345 60016.000046 12345.678901 1 26111400002270', pix_code: '00020126580014BR.GOV.BCB.PIX0136exemplo-chave52040000530398654072270.005802BR6304ABCD', document_id: 'g0000000-0000-4000-8000-000000000009'.replace('g', 'a'), paid_at: status === 'paid' ? ts(-30 * k) : null, paid_amount: status === 'paid' ? 2270 : null, items, payments: status === 'paid' ? [{ id: 'pay' + k, amount: 2270, paid_at: ts(-30 * k), method: 'pix', source: 'manual' }] : [], lease: { id: L1, property_id: P1, property: pt(P1), tenant: { full_name: 'Mariana Souza' } }, ...extra });
const invoices = [inv(1, m(0), d(10), 'pending'), inv(2, m(-1), m(-1).slice(0, 8) + '10', 'paid'), inv(3, m(-2), m(-2).slice(0, 8) + '10', 'paid'), inv(4, m(-3), m(-3).slice(0, 8) + '10', 'overdue', { published_at: null })];
const doc = (k, kind, title, extra = {}) => ({ id: 'a0000000-0000-4000-8000-00000000010' + k, kind, title, mime_type: 'application/pdf', size_bytes: 248000, published_at: ts(-k * 10), created_at: ts(-k * 10), base_year: null, competence: null, storage_path: kind + '/2026/x' + k + '.pdf', property: pt(P1), recipient: null, ...extra });
const documents = [doc(1, 'contract', 'Contrato de locação assinado'), doc(2, 'inspection', 'Laudo de vistoria de entrada'), doc(3, 'income_tax', 'Informe de rendimentos 2025', { base_year: 2025 }), doc(4, 'receipt', 'Recibo de repasse · outubro', { competence: m(-1) }), doc(5, 'receipt', 'Recibo de repasse · setembro', { competence: m(-2), published_at: null })];
const tickets = [{ id: 't1', number: 12, title: 'Vazamento na pia da cozinha', status: 'in_progress', created_at: ts(-3) }];
const calendar_events = [{ id: 'ev1', title: 'Início do contrato · Apto 302', kind: 'lease_start', starts_at: ts(2), all_day: true, created_by: null, lease_id: L1, property_id: P1 }, { id: 'ev2', title: 'Vistoria de saída', kind: 'inspection', starts_at: ts(5), all_day: false, created_by: U.admin, lease_id: null, property_id: P1 }, { id: 'ev3', title: 'Repasse aos proprietários', kind: 'payout', starts_at: ts(5), all_day: true, created_by: U.admin }, { id: 'ev4', title: 'Lembrete', kind: 'reminder', starts_at: ts(5), all_day: true, created_by: U.admin }, { id: 'ev5', title: 'Tarefa extra', kind: 'task', starts_at: ts(5), all_day: true, created_by: U.admin }];
const activity_logs = [{ id: 1, action: 'login', entity: 'auth', created_at: ts(-0.01), actor: { full_name: 'Mariana Souza' } }, { id: 2, action: 'upload', entity: 'documents', created_at: ts(-1), actor: { full_name: 'Equipe Empiric' } }, { id: 3, action: 'status_change', entity: 'invoices', created_at: ts(-2), actor: null }];
const notifications = [{ id: 'n1', title: 'Seu boleto vence em 10 dias', body: 'Vencimento ' + d(10), link: '/inquilino/faturas', read_at: null, created_at: ts(-0.1) }, { id: 'n2', title: 'Contrato disponível', body: 'Contrato de locação assinado', link: '/inquilino/documentos', read_at: ts(-1), created_at: ts(-2) }];
const property_photos = [{ id: 'ph1', storage_path: P1 + '/a.jpg', caption: null }, { id: 'ph2', storage_path: P1 + '/b.jpg', caption: null }];
const property_owners = [{ owner_id: U.owner, share_pct: 60, property_id: P1, owner: { full_name: 'Carlos Menezes', email: 'carlos@exemplo.com' }, property: { id: P1, title: properties[0].title, status: 'rented', city: 'Ponta Grossa' } }];
const settings = [{ key: 'whatsapp', value: { number: '5542999584779', default_message: 'Olá!' } }];
const summary = { properties: { total: 3, rented: 2, available: 1, reserved: 0, maintenance: 0 }, leases: { active: 1, expiring: 0, ended: 0, awaiting_signature: 1 }, invoices: { issued: 4, paid: 2, pending: 1, overdue: 1, received: 4540, receivable: 4540 }, tickets: { new: 1, analysis: 0, waiting_third_party: 0, in_progress: 1, done: 3 }, monthly: [-5, -4, -3, -2, -1, 0].map((k, i) => ({ month: m(k).slice(0, 7), received: [42000, 45000, 44000, 47000, 46000, 9000][i], open: [1000, 0, 3000, 500, 2000, 38000][i] })) };
const T = { profiles, properties, leases, invoices, documents, tickets, calendar_events, activity_logs, notifications, property_photos, property_owners, settings, invoice_items: items, payments: [], referral_program: [{ id: 1 }] };

function filter(rows, q) {
  for (const [k, v] of q) {
    if (['select', 'order', 'limit', 'offset', 'or', 'and'].includes(k)) continue;
    const mt = /^(eq|neq|is|in)\.(.*)$/.exec(v); if (!mt) continue;
    const [, op, val] = mt;
    rows = rows.filter(r => {
      if (!(k in r)) return true;
      const x = r[k] == null ? 'null' : String(r[k]);
      if (op === 'eq') return x === val; if (op === 'neq') return x !== val;
      if (op === 'is') return val === 'null' ? r[k] == null : r[k] != null;
      if (op === 'in') return val.replace(/[()]/g, '').split(',').includes(x);
      return true;
    });
  }
  return rows;
}
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); const send = (code, body, h = {}) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', ...h }); res.end(body == null ? '' : JSON.stringify(body)); };
  if (req.method === 'OPTIONS') return send(204);
  const tok = (req.headers.authorization || '').replace('Bearer ', '');
  const role = tok.startsWith('mock-') ? tok.slice(5) : null;
  if (u.pathname === '/auth/v1/user') return role ? send(200, { id: U[role], aud: 'authenticated', role: 'authenticated', email: role + '@exemplo.com', app_metadata: { role }, user_metadata: {} }) : send(401, { msg: 'no' });
  if (u.pathname.startsWith('/auth/v1/logout')) return send(204);
  if (u.pathname.startsWith('/storage/v1/object/sign/')) {
    if (req.method === 'GET') { res.writeHead(200, { 'content-type': 'image/png' }); return res.end(photo); }
    let b = ''; req.on('data', c => b += c); return req.on('end', () => { const j = b ? JSON.parse(b) : {}; if (j.paths) return send(200, j.paths.map(p => ({ path: p, signedURL: '/object/sign/imoveis/' + p + '?token=x', error: null }))); return send(200, { signedURL: '/object/sign/x.jpg?token=x' }); });
  }
  if (u.pathname.startsWith('/storage/v1/object/list')) return send(200, []);
  const rpc = /^\/rest\/v1\/rpc\/(\w+)/.exec(u.pathname);
  if (rpc) return send(200, rpc[1] === 'admin_dashboard_summary' ? summary : null);
  const tb = /^\/rest\/v1\/(\w+)/.exec(u.pathname);
  if (tb) {
    let rows = T[tb[1]] || [];
    if (tb[1] === 'profiles' && !u.searchParams.get('id') && !u.searchParams.get('role')) rows = rows.filter(r => r.id === U[role]);
    rows = filter(rows, u.searchParams.entries());
    const single = (req.headers.accept || '').includes('vnd.pgrst.object');
    const cnt = { 'content-range': `0-${Math.max(0, rows.length - 1)}/${rows.length}` };
    if (req.method === 'HEAD') return send(200, null, cnt);
    if (req.method !== 'GET') return send(200, single ? rows[0] || {} : rows);
    return single ? (rows[0] ? send(200, rows[0], cnt) : send(406, { code: 'PGRST116', message: 'no rows' })) : send(200, rows, cnt);
  }
  send(404, { error: 'mock: ' + u.pathname });
}).listen(54321, () => console.log('mock on 54321'));
