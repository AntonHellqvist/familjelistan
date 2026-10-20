import { initBackend, COLORS } from './backend.js';

/* ---------------- Konstanter ---------------- */

const EMOJIS = ['✅', '🛒', '🏠', '🧹', '🚗', '🎁', '✈️', '🌱', '🐶', '💼', '🎉', '📚', '🔧', '🍽️', '💊', '🎄'];
const REPEATS = { '': 'Upprepas inte', daily: 'Varje dag', weekly: 'Varje vecka', biweekly: 'Varannan vecka', monthly: 'Varje månad', yearly: 'Varje år' };
const WEEKDAYS = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MONTHS_LONG = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];

// Kategorier för inköpslistor, i ungefär den ordning man går i en butik.
const CATS = [
  ['frukt', '🍎 Frukt & grönt', ['äpple', 'banan', 'apelsin', 'citron', 'lime', 'päron', 'druv', 'melon', 'bär', 'jordgubb', 'blåbär', 'hallon', 'tomat', 'gurka', 'sallad', 'paprika', 'lök', 'vitlök', 'potatis', 'morot', 'morötter', 'broccoli', 'blomkål', 'spenat', 'avokado', 'svamp', 'champinjon', 'zucchini', 'kål', 'purjo', 'ingefära', 'basilika', 'persilja', 'dill', 'frukt', 'grönsak', 'majs', 'kiwi', 'mango', 'clementin', 'rödbet', 'selleri', 'rädis', 'sparris', 'aubergine', 'chili']],
  ['brod', '🍞 Bröd', ['bröd', 'limpa', 'fralla', 'frallor', 'knäcke', 'tortilla', 'bulle', 'bullar', 'baguette', 'kaka', 'kakor', 'toast', 'pitabröd', 'croissant', 'skorpor']],
  ['mejeri', '🥛 Mejeri & ägg', ['mjölk', 'fil', 'yoghurt', 'grädde', 'smör', 'ost', 'ägg', 'kvarg', 'crème', 'creme', 'keso', 'margarin', 'filmjölk', 'halloumi', 'fetaost', 'mozzarella', 'parmesan']],
  ['kott', '🥩 Kött, fisk & chark', ['kött', 'färs', 'kyckling', 'fläsk', 'bacon', 'korv', 'skinka', 'lax', 'fisk', 'torsk', 'räkor', 'tonfisk', 'biff', 'kotlett', 'salami', 'kalkon', 'pålägg', 'falukorv', 'entrecote', 'oxfilé']],
  ['fryst', '🧊 Fryst', ['glass', 'fryst', 'frysta', 'pizza', 'pommes', 'isbitar']],
  ['skafferi', '🥫 Skafferi', ['pasta', 'spaghetti', 'makaroner', 'ris', 'mjöl', 'socker', 'salt', 'peppar', 'krydd', 'olja', 'olivolja', 'vinäger', 'ketchup', 'senap', 'majonnäs', 'buljong', 'konserv', 'krossade', 'müsli', 'flingor', 'havregryn', 'gryn', 'honung', 'sylt', 'nötter', 'kaffe', 'te', 'tepåsar', 'choklad', 'chips', 'godis', 'kex', 'soja', 'sås', 'linser', 'tacos', 'popcorn', 'nudlar', 'bönor', 'kikärtor', 'jäst', 'bakpulver', 'kakao']],
  ['dryck', '🧃 Dryck', ['juice', 'läsk', 'vatten', 'öl', 'vin', 'dricka', 'saft', 'cola', 'kombucha', 'mineralvatten']],
  ['hushall', '🧻 Hushåll', ['toapapper', 'toalettpapper', 'hushållspapper', 'diskmedel', 'tvättmedel', 'sköljmedel', 'sopsäck', 'soppåse', 'folie', 'plastfolie', 'bakplåtspapper', 'batteri', 'glödlampa', 'tändstickor', 'ljus', 'rengöring', 'servett', 'påsar', 'diskborste', 'disksvamp', 'maskindisk', 'kattmat', 'hundmat']],
  ['hygien', '🧴 Hygien & apotek', ['tandkräm', 'tandborste', 'schampo', 'balsam', 'tvål', 'deodorant', 'deo', 'rakhyvel', 'bomull', 'plåster', 'alvedon', 'ipren', 'medicin', 'solkräm', 'hudkräm', 'bindor', 'tamponger', 'blöjor', 'våtservetter', 'tandtråd']],
  ['ovrigt', '🧺 Övrigt', []],
];
const CAT_LABEL = Object.fromEntries(CATS.map(([k, l]) => [k, l]));

/* ---------------- Hjälpfunktioner ---------------- */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const vibrate = () => navigator.vibrate?.(8);

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const today = () => iso(new Date());
const dayDiff = s => Math.round((parseIso(s) - parseIso(today())) / 86400000);
function nextWeekday(wd, strictlyAfterToday = false) {
  const d = new Date();
  let diff = (wd - d.getDay() + 7) % 7;
  if (diff === 0 && strictlyAfterToday) diff = 7;
  return iso(addDays(d, diff));
}
function fmtDue(s) {
  const n = dayDiff(s);
  if (n === 0) return 'Idag';
  if (n === 1) return 'Imorgon';
  if (n === -1) return 'Igår';
  const d = parseIso(s);
  if (n > 1 && n < 7) return cap(WEEKDAYS[d.getDay()]);
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() !== new Date().getFullYear() ? `${base} ${d.getFullYear()}` : base;
}
function nextDue(due, repeat) {
  const t = today();
  let d = parseIso(due || t);
  const step = () => {
    if (repeat === 'daily') d = addDays(d, 1);
    else if (repeat === 'weekly') d = addDays(d, 7);
    else if (repeat === 'biweekly') d = addDays(d, 14);
    else if (repeat === 'monthly') d = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
    else if (repeat === 'yearly') d = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate());
  };
  do step(); while (iso(d) <= t);
  return iso(d);
}

function guessCat(title) {
  const s = title.toLowerCase();
  const words = s.split(/[\s,.\-/]+/).filter(Boolean);
  for (const [key, , kws] of CATS) {
    for (const k of kws) {
      if (words.some(w => w.startsWith(k) || (k.length >= 4 && w.endsWith(k))) || (k.length >= 5 && s.includes(k))) return key;
    }
  }
  return 'ovrigt';
}

// Förstår snabbinmatning som "Byt däck imorgon @Pappa" eller "Ta ut soporna varje tisdag".
function parseQuick(text) {
  const words = text.trim().split(/\s+/);
  const out = [];
  let due = null, repeat = '', assignee = null;
  for (let i = 0; i < words.length; i++) {
    const w = words[i], lw = w.toLowerCase().replace(/[.,!]$/, '');
    const next = words[i + 1]?.toLowerCase().replace(/[.,!]$/, '');
    if (lw.startsWith('@') && lw.length > 1) {
      const m = members().find(m => m.name.toLowerCase().startsWith(lw.slice(1)));
      if (m) { assignee = m.uid; continue; }
    }
    if (i > 0 && (lw === 'idag' || lw === 'ikväll')) { due = today(); continue; }
    if (i > 0 && (lw === 'imorgon' || lw === 'imorn')) { due = iso(addDays(new Date(), 1)); continue; }
    if (i > 0 && lw === 'varje' && next) {
      const map = { dag: 'daily', vecka: 'weekly', månad: 'monthly', år: 'yearly' };
      if (map[next]) { repeat = map[next]; due = due || today(); i++; continue; }
      const wd = WEEKDAYS.indexOf(next);
      if (wd >= 0) { repeat = 'weekly'; due = nextWeekday(wd); i++; continue; }
    }
    if (i > 0 && lw === 'på' && WEEKDAYS.includes(next)) { due = nextWeekday(WEEKDAYS.indexOf(next)); i++; continue; }
    if (i > 0 && WEEKDAYS.includes(lw)) { due = nextWeekday(WEEKDAYS.indexOf(lw)); continue; }
    out.push(w);
  }
  return { title: out.join(' ') || text.trim(), due, repeat, assignee };
}

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/* ---------------- Tillstånd ---------------- */

const S = {
  user: null, profile: null, familyId: null, family: null, familyMissing: false,
  lists: [], tasks: [],
  view: 'today', listId: null, filter: 'all', showDone: false,
  screen: null, onboardMode: null,
};
let B;
let profileUnsub = null;
let familyUnsubs = [];
let installPrompt = null;
let pushRefreshed = false;
const joinParam = new URLSearchParams(location.search).get('join');

const me = () => S.user?.uid;
const fid = () => S.familyId;
const members = () => (S.family?.members || []).map(uid => ({ uid, name: '?', color: '#999', ...(S.family.memberInfo?.[uid] || {}) }));
const member = uid => members().find(m => m.uid === uid);
const listById = id => S.lists.find(l => l.id === id);
const taskById = id => S.tasks.find(t => t.id === id);
const sortedLists = () => [...S.lists].sort((a, b) => (a.ts || 0) - (b.ts || 0));
const firstTodoList = () => sortedLists().find(l => l.type !== 'shopping');
const byDue = (a, b) => (a.due || '9999').localeCompare(b.due || '9999') || (a.ts || 0) - (b.ts || 0);
const matchesFilter = t => S.filter === 'all' || t.assignee === S.filter;
const isDoneToday = t => [t.doneAt, t.lastDoneAt].some(x => x && iso(new Date(x)) === today());

function run(p) {
  Promise.resolve(p).catch(err => { console.error(err); toast(friendlyError(err)); });
}
function friendlyError(err) {
  const map = {
    'auth/network-request-failed': 'Ingen internetanslutning.',
    'auth/invalid-credential': 'Fel e-post eller lösenord.',
    'auth/wrong-password': 'Fel e-post eller lösenord.',
    'auth/user-not-found': 'Det finns inget konto med den e-postadressen.',
    'auth/invalid-email': 'E-postadressen ser inte rätt ut.',
    'auth/missing-password': 'Skriv ett lösenord.',
    'auth/weak-password': 'Lösenordet måste vara minst 6 tecken.',
    'auth/email-already-in-use': 'Det finns redan ett konto med den e-posten. Välj "Logga in" istället.',
    'auth/credential-already-in-use': 'Det finns redan ett konto med den e-posten. Välj "Logga in" istället.',
    'auth/provider-already-linked': 'Det här kontot har redan en e-post kopplad.',
    'auth/too-many-requests': 'För många försök. Vänta en stund och försök igen.',
    'auth/operation-not-allowed': 'Inloggning med e-post är inte påslagen i Firebase ännu.',
    'permission-denied': 'Du har inte behörighet att göra det.',
  };
  return map[err?.code] || err?.message || 'Något gick fel.';
}

/* ---------------- Uppstart ---------------- */

async function boot() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  // Be webbläsaren att inte rensa appens data (inloggning och cache) när det blir ont om utrymme.
  navigator.storage?.persist?.().catch(() => {});
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; if (S.view === 'family') render(); });

  try {
    B = await initBackend();
  } catch (err) {
    console.error(err);
    $('#content').innerHTML = `<div class="empty"><div class="big">📡</div>Kunde inte starta appen. Kontrollera internetanslutningen och försök igen.</div>`;
    return;
  }
  $('#demo-banner').hidden = !B.demo;
  bindStaticEvents();

  B.onAuthChange((user, err) => {
    profileUnsub?.(); profileUnsub = null;
    detachFamily();
    S.user = user; S.profile = null; S.authError = err || null;
    if (!user) return render();
    profileUnsub = B.watchProfile(user.uid, p => {
      S.profile = p;
      if (p.familyId && p.familyId !== S.familyId) attachFamily(p.familyId);
      if (!p.familyId) detachFamily();
      render();
      // Förnya notis-token en gång per start (den kan bytas ut av telefonen).
      if (!pushRefreshed && p.pushOn && self.Notification?.permission === 'granted') {
        pushRefreshed = true;
        B.enablePush(me(), onForegroundPush).catch(() => {});
      }
    });
    render();
  });
}

function attachFamily(id) {
  detachFamily();
  S.familyId = id;
  familyUnsubs = [
    B.watchFamily(id, f => { S.family = f; S.familyMissing = !f; render(); }, () => { S.familyMissing = true; render(); }),
    B.watchLists(id, l => { S.lists = l; render(); }),
    B.watchTasks(id, t => { S.tasks = t; render(); }),
  ];
}
function detachFamily() {
  familyUnsubs.forEach(u => u?.());
  familyUnsubs = [];
  Object.assign(S, { familyId: null, family: null, familyMissing: false, lists: [], tasks: [] });
}

function onForegroundPush(n) {
  if (n.title || n.body) toast(`🔔 ${[n.title, n.body].filter(Boolean).join(': ')}`);
}

/* ---------------- Rendering ---------------- */

function setChrome(on) {
  $('#tabs').hidden = !on;
  if (!on) $('#composer').hidden = true;
}

function render() {
  if (!B) return;
  if (!S.user) return S.authError ? renderNoConnection() : renderLoading();
  if (!S.profile) return renderLoading();
  if (!S.profile.familyId || S.familyMissing) return renderOnboarding();
  if (!S.family) return renderLoading();

  S.screen = 'main';
  setChrome(true);
  if (S.view === 'list' && !listById(S.listId)) S.view = 'lists';
  ({ today: renderToday, lists: renderLists, list: renderList, family: renderFamily })[S.view]();
  updateComposer();
  const tab = S.view === 'list' ? 'lists' : S.view;
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
}

function renderLoading() {
  if (S.screen === 'loading') return;
  S.screen = 'loading';
  setChrome(false);
  $('#top').innerHTML = '';
  $('#content').innerHTML = '<div class="loading">Laddar…</div>';
}

function avatar(m, cls = '') {
  if (!m) return '';
  return `<span class="avatar ${cls}" style="--c:${esc(m.color)}" title="${esc(m.name)}">${esc((m.name || '?')[0].toUpperCase())}</span>`;
}

function filterChips() {
  if (members().length < 2) return '';
  const chip = (v, label, color) =>
    `<button class="chip ${S.filter === v ? 'on' : ''}" data-act="filter" data-v="${esc(v)}">${color ? `<span class="dot" style="background:${esc(color)}"></span>` : ''}${esc(label)}</button>`;
  return `<div class="chips">${chip('all', 'Alla')}${members().map(m => chip(m.uid, m.uid === me() ? 'Jag' : m.name, m.color)).join('')}</div>`;
}

function taskHtml(t, { showList = false } = {}) {
  const m = member(t.assignee);
  const list = listById(t.listId);
  const meta = [];
  if (t.due && !t.done) {
    const n = dayDiff(t.due);
    meta.push(`<span class="${n < 0 ? 'late' : n === 0 ? 'today' : ''}">📅 ${esc(fmtDue(t.due))}</span>`);
  }
  if (t.repeat) meta.push(`<span>🔁 ${esc(REPEATS[t.repeat])}</span>`);
  if (showList && list) meta.push(`<span>${esc(list.emoji)} ${esc(list.name)}</span>`);
  if (t.note) meta.push('<span>📝</span>');
  if (t.done && t.doneBy) meta.push(`<span>✓ ${esc(member(t.doneBy)?.name || '')}</span>`);
  const color = m?.color || '';
  return `<li class="task ${t.done ? 'done' : ''}" data-id="${esc(t.id)}">
    <button class="check" data-act="toggle" aria-label="Bocka av" ${color ? `style="--c:${esc(color)}"` : ''}></button>
    <div class="body" data-act="edit">
      <div class="title">${esc(t.title)}</div>
      ${meta.length ? `<div class="meta">${meta.join('')}</div>` : ''}
    </div>
    ${avatar(m)}
  </li>`;
}

function section(title, tasks, opts = {}) {
  if (!tasks.length) return '';
  const head = title ? `<div class="section-title ${opts.danger ? 'danger' : ''}"><span>${esc(title)}</span>${opts.action || ''}</div>` : '';
  return `${head}<div class="card"><ul class="tasks">${tasks.map(t => taskHtml(t, opts)).join('')}</ul></div>`;
}

/* --- Idag --- */
function renderToday() {
  const now = new Date();
  const h = now.getHours();
  const greet = h < 10 ? 'God morgon' : h < 18 ? 'Hej' : 'God kväll';
  const myName = member(me())?.name || S.profile.name || '';
  $('#top').innerHTML = `<div style="flex:1;min-width:0">
      <h1>${esc(greet)}${myName ? `, ${esc(myName)}` : ''}!</h1>
      <div class="sub">${cap(WEEKDAYS[now.getDay()])} ${now.getDate()} ${MONTHS_LONG[now.getMonth()]}</div>
    </div>`;

  const open = S.tasks.filter(t => !t.done && t.due && dayDiff(t.due) <= 7 && matchesFilter(t)).sort(byDue);
  const late = open.filter(t => dayDiff(t.due) < 0);
  const tod = open.filter(t => dayDiff(t.due) === 0);
  const soon = open.filter(t => dayDiff(t.due) > 0);
  const doneToday = S.tasks.filter(isDoneToday).length;

  let html = filterChips();
  if (!B.demo && !S.user.email) html += `<button class="stat" style="display:block;width:100%;text-align:left;background:var(--chip);color:var(--text)" data-act="link-email">🔒 <b>Spara ditt konto med e-post</b> så att du aldrig tappar bort familjen. <span class="link">Gör det nu ›</span></button>`;
  if (doneToday) html += `<div class="stat">🎉 Familjen har klarat ${doneToday} ${doneToday === 1 ? 'sak' : 'saker'} idag</div>`;
  html += section('Försenat', late, { showList: true, danger: true });
  html += section('Idag', tod, { showList: true });
  html += section('Kommande veckan', soon, { showList: true });
  if (!open.length) {
    html += `<div class="empty"><div class="big">☀️</div>${S.filter === 'all' ? 'Inget planerat just nu.' : 'Inget planerat för den här personen.'}<br>Skriv nedan för att lägga till något för idag.</div>`;
  }
  $('#content').innerHTML = html;
}

/* --- Listor --- */
function renderLists() {
  $('#top').innerHTML = `<h1>Listor</h1>`;
  const cards = sortedLists().map(l => {
    const open = S.tasks.filter(t => t.listId === l.id && !t.done).length;
    return `<button class="list-card" data-act="open-list" data-id="${esc(l.id)}">
      <div class="emoji">${esc(l.emoji || '📋')}</div>
      <div><div class="name">${esc(l.name)}</div>
      <div class="count">${open ? `${open} kvar` : 'Allt klart ✓'}</div></div>
    </button>`;
  }).join('');
  $('#content').innerHTML = `<div class="grid">${cards}<button class="list-card new" data-act="new-list">＋ Ny lista</button></div>`;
}

function renderList() {
  const list = listById(S.listId);
  const shop = list.type === 'shopping';
  $('#top').innerHTML = `
    <button class="icon-btn back-btn" data-act="back" aria-label="Tillbaka">‹</button>
    <h1>${esc(list.emoji || '')} ${esc(list.name)}</h1>
    <button class="icon-btn" data-act="edit-list" aria-label="Ändra lista">⋯</button>`;

  const all = S.tasks.filter(t => t.listId === list.id);
  const open = all.filter(t => !t.done && (shop || matchesFilter(t)));
  const done = all.filter(t => t.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  let html = shop ? '' : filterChips();

  if (shop) {
    for (const [key, label] of CATS) {
      const items = open.filter(t => (t.category || 'ovrigt') === key).sort((a, b) => (a.ts || 0) - (b.ts || 0));
      html += section(label, items);
    }
  } else {
    open.sort(byDue);
    const late = open.filter(t => t.due && dayDiff(t.due) < 0);
    const tod = open.filter(t => t.due && dayDiff(t.due) === 0);
    const later = open.filter(t => t.due && dayDiff(t.due) > 0);
    const none = open.filter(t => !t.due);
    const groups = [late, tod, later, none].filter(g => g.length).length;
    html += section('Försenat', late, { danger: true });
    html += section('Idag', tod);
    html += section('Kommande', later);
    html += section(groups > 1 ? 'Utan datum' : '', none);
  }

  if (!open.length) {
    html += `<div class="empty"><div class="big">${shop ? '🛒' : '✨'}</div>${shop ? 'Inköpslistan är tom.' : 'Inget kvar att göra här!'}</div>`;
  }

  if (done.length) {
    const label = shop ? `I korgen (${done.length})` : `Klara (${done.length})`;
    const actions = `<span>${S.showDone ? `<button data-act="clear-done">${shop ? 'Töm' : 'Rensa'}</button> &nbsp; ` : ''}<button data-act="toggle-done">${S.showDone ? 'Dölj' : 'Visa'}</button></span>`;
    html += `<div class="section-title"><span>${label}</span>${actions}</div>`;
    if (S.showDone) {
      html += `<div class="card"><ul class="tasks">${done.map(t => taskHtml(t)).join('')}</ul></div>`;
      if (shop) html += `<p class="hint">Tryck på en vara för att lägga tillbaka den på listan.</p>`;
    }
  }
  $('#content').innerHTML = html;
}

/* --- Familj --- */
function renderFamily() {
  const f = S.family;
  $('#top').innerHTML = `<h1>${esc(f.name)}</h1><button class="icon-btn" data-act="rename-family" aria-label="Byt namn på familjen">✏️</button>`;
  const memberRows = members().map(m => `
    <div class="row">${avatar(m, 'lg')}<div class="grow"><div>${esc(m.name)}${m.uid === me() ? ' <span class="small">(du)</span>' : ''}</div>
    <div class="small">${S.tasks.filter(t => !t.done && t.assignee === m.uid).length} uppgifter</div></div>
    ${m.uid === me() ? '<button class="link" data-act="edit-profile">Ändra</button>' : `<button class="link" style="color:var(--muted)" data-act="remove-member" data-uid="${esc(m.uid)}">Ta bort</button>`}</div>`).join('');

  const pushOn = S.profile.pushOn && self.Notification?.permission === 'granted';
  let pushHtml;
  if (isIOS && !isStandalone()) {
    pushHtml = `<div class="row"><div class="grow small">På iPhone fungerar notiser först när appen ligger på hemskärmen (se nedan). Öppna den sedan därifrån.</div></div>`;
  } else {
    pushHtml = `<div class="row"><div class="grow"><div>${pushOn ? 'Notiser är på 🔔' : 'Notiser är av'}</div>
      <div class="small">Påminnelse kl. 07 om dagens uppgifter, och när någon ger dig en uppgift.</div></div></div>
      <div class="btn-row"><button class="btn ${pushOn ? 'secondary' : ''}" data-act="${pushOn ? 'push-off' : 'push-on'}">${pushOn ? 'Stäng av notiser' : 'Slå på notiser'}</button></div>`;
  }

  let installHtml = '';
  if (!isStandalone()) {
    let how;
    if (installPrompt) how = `<div class="btn-row"><button class="btn" data-act="install">Installera appen</button></div>`;
    else if (isIOS) how = `<div class="row"><div class="grow small">Öppna sidan i <b>Safari</b>, tryck på <b>Dela</b> (rutan med pilen) och välj <b>Lägg till på hemskärmen</b>.</div></div>`;
    else how = `<div class="row"><div class="grow small">Öppna sidan i <b>Chrome</b> eller <b>Samsung Internet</b>, tryck på menyn (⋮ eller ☰) och välj <b>Lägg till på startskärmen</b> / <b>Installera app</b>.</div></div>`;
    installHtml = `<div class="section-title"><span>Installera på telefonen</span></div><div class="card">${how}</div>`;
  }

  $('#content').innerHTML = `
    <div class="section-title"><span>Medlemmar</span></div>
    <div class="card">${memberRows}</div>

    <div class="section-title"><span>Bjud in familjen</span></div>
    <div class="card">
      <div class="code">${esc(f.code)}</div>
      <p class="hint" style="text-align:center;margin:0 12px">Skicka länken, eller be dem välja "Gå med i familj" och skriva in koden.</p>
      <div class="btn-row"><button class="btn" data-act="share">Dela inbjudan</button></div>
    </div>

    <div class="section-title"><span>Notiser</span></div>
    <div class="card">${pushHtml}</div>

    ${B.demo ? '' : `<div class="section-title"><span>Mitt konto</span></div>
    <div class="card">${S.user.email
      ? `<div class="row"><div class="grow"><div>Inloggad som</div><div class="small">${esc(S.user.email)}</div></div></div>
         <div class="btn-row"><button class="btn secondary" data-act="sign-out">Logga ut</button></div>`
      : `<div class="row"><div class="grow small">Ditt konto är inte kopplat till någon e-post än. Om appen glömmer den här telefonen kommer du inte tillbaka in.</div></div>
         <div class="btn-row"><button class="btn" data-act="link-email">Spara konto med e-post</button></div>`}
    </div>`}

    ${installHtml}

    ${B.demo ? '<div style="margin-top:28px"><button class="btn secondary" data-act="logout">Återställ demon</button></div>' : ''}
`;
}

/* --- Ingen anslutning --- */
function renderNoConnection() {
  if (S.screen === 'offline') return;
  S.screen = 'offline';
  setChrome(false);
  $('#top').innerHTML = '';
  $('#content').innerHTML = `
    <div class="empty"><div class="big">📡</div>Kunde inte ansluta till familjens listor.<br>Kontrollera internet och försök igen.
    <p><button class="btn" style="max-width:220px;margin:16px auto 0" onclick="location.reload()">Försök igen</button></p></div>`;
}

/* --- Skapa eller gå med i familj --- */
function renderOnboarding() {
  const mode = S.onboardMode || (joinParam ? 'join' : 'create');
  if (mode === 'login') return renderLogin();
  const key = 'onboard-' + mode;
  if (S.screen === key) return;
  S.screen = key;
  setChrome(false);
  const d = S.onbDraft || {};
  const name = d.name ?? (S.profile?.name || '');
  let color = d.color || S.profile?.color || COLORS[3];
  const needsEmail = !B.demo && !S.user.email;
  $('#top').innerHTML = '';
  $('#content').innerHTML = `
    <div class="auth">
      <h2>Välkommen! 👋</h2>
      <p class="lead">${S.familyMissing ? 'Det här kontot är inte längre med i en familj.' : joinParam ? 'Du har blivit inbjuden! Skapa ditt konto så är du med.' : 'Skapa ditt konto och koppla ihop dig med familjen.'}</p>
      <form id="onb-form">
        <label class="field"><span>Ditt namn</span><input class="input" name="name" value="${esc(name)}" autocomplete="given-name" required></label>
        <div class="field"><span>Din färg</span><div class="colors">${COLORS.map(c => `<button type="button" class="color ${c === color ? 'on' : ''}" style="--c:${c}" data-color="${c}" aria-label="Färg"></button>`).join('')}</div></div>
        ${needsEmail ? `
          <label class="field"><span>E-post</span><input class="input" name="email" type="email" inputmode="email" autocomplete="email" value="${esc(d.email || '')}" required></label>
          <label class="field"><span>Välj ett lösenord (minst 6 tecken)</span><input class="input" name="password" type="password" autocomplete="new-password" minlength="6" value="${esc(d.password || '')}" required></label>
        ` : ''}
        <div class="seg" style="margin:20px 0 16px">
          <button type="button" data-mode="create" class="${mode === 'create' ? 'on' : ''}">Skapa ny familj</button>
          <button type="button" data-mode="join" class="${mode === 'join' ? 'on' : ''}">Gå med i familj</button>
        </div>
        ${mode === 'create'
          ? '<label class="field"><span>Familjens namn</span><input class="input" name="family" placeholder="T.ex. Familjen Andersson" required></label><p class="hint">Du får sedan en kod som resten av familjen använder för att gå med.</p>'
          : `<label class="field"><span>Inbjudningskod</span><input class="input" name="code" value="${esc(joinParam || '')}" placeholder="T.ex. K7PX2M" autocapitalize="characters" style="text-transform:uppercase;letter-spacing:.1em" required></label>`}
        <div class="error" id="onb-error"></div>
        <button class="btn" type="submit">${mode === 'create' ? 'Skapa familj' : 'Gå med'}</button>
        ${needsEmail ? '<p style="text-align:center">Har du redan ett konto? <button type="button" class="link" data-mode="login">Logga in</button></p>' : ''}
      </form>
    </div>`;
  const fm = $('#onb-form');
  const saveDraft = () => { S.onbDraft = { name: fm.name.value, color, email: fm.email?.value, password: fm.password?.value }; };
  $$('[data-color]').forEach(b => b.onclick = () => {
    color = b.dataset.color;
    $$('[data-color]').forEach(x => x.classList.toggle('on', x === b));
  });
  $$('#onb-form [data-mode]').forEach(b => b.onclick = () => { saveDraft(); S.onboardMode = b.dataset.mode; render(); });
  fm.onsubmit = async e => {
    e.preventDefault();
    const btn = fm.querySelector('[type=submit]');
    const info = { name: fm.name.value.trim(), color };
    $('#onb-error').textContent = '';
    btn.disabled = true;
    try {
      // Kolla igen här: e-posten kan redan vara kopplad om ett tidigare försök stoppade senare.
      if (needsEmail && !S.user.email) S.user = await B.linkEmail(fm.email.value.trim(), fm.password.value);
      if (mode === 'create') await B.createFamily(me(), fm.family.value.trim(), info);
      else await B.joinFamily(me(), fm.code.value.trim().toUpperCase(), info);
      if (joinParam) history.replaceState(null, '', location.pathname);
      S.onbDraft = null;
      S.view = 'today';
    } catch (err) {
      saveDraft();
      $('#onb-error').textContent = friendlyError(err);
      btn.disabled = false;
    }
  };
}

/* --- Logga in med befintligt konto --- */
function renderLogin() {
  if (S.screen === 'login') return;
  S.screen = 'login';
  setChrome(false);
  $('#top').innerHTML = '';
  $('#content').innerHTML = `
    <div class="auth">
      <img class="logo" src="icons/icon-192.png" alt="">
      <h2>Logga in</h2>
      <p class="lead">Med e-posten du kopplade till Familjelistan.</p>
      <form id="login-form">
        <label class="field"><span>E-post</span><input class="input" name="email" type="email" inputmode="email" autocomplete="email" value="${esc(S.onbDraft?.email || '')}" required></label>
        <label class="field"><span>Lösenord</span><input class="input" name="password" type="password" autocomplete="current-password" required></label>
        <div class="error" id="login-error"></div>
        <button class="btn" type="submit">Logga in</button>
        <p style="text-align:center"><button type="button" class="link" data-act="forgot">Glömt lösenordet?</button></p>
        <p style="text-align:center">Ny här? <button type="button" class="link" data-act="to-signup">Skapa konto</button></p>
      </form>
    </div>`;
  const fm = $('#login-form');
  fm.querySelector('[data-act="to-signup"]').onclick = () => { S.onboardMode = null; render(); };
  fm.querySelector('[data-act="forgot"]').onclick = async () => {
    const email = fm.email.value.trim();
    if (!email) return ($('#login-error').textContent = 'Skriv din e-post först.');
    try { await B.resetPassword(email); toast('Vi har mejlat en länk för att välja nytt lösenord. Kolla även skräpposten.'); }
    catch (err) { $('#login-error').textContent = friendlyError(err); }
  };
  fm.onsubmit = async e => {
    e.preventDefault();
    const btn = fm.querySelector('[type=submit]');
    $('#login-error').textContent = '';
    btn.disabled = true;
    try {
      await B.signInEmail(fm.email.value.trim(), fm.password.value);
      S.onboardMode = null; S.onbDraft = null; S.view = 'today';
    } catch (err) {
      $('#login-error').textContent = friendlyError(err);
      btn.disabled = false;
    }
  };
}

/* --- Konto: koppla e-post --- */
function openAccountSheet() {
  const sh = openSheet(`
    <h3>Spara ditt konto</h3>
    <p class="hint" style="margin:0 0 16px">Koppla en e-post till ditt konto. Då kan du logga in igen om du byter telefon eller om appen har glömt dig. Allt du har behålls.</p>
    <form id="acc-form">
      <label class="field"><span>E-post</span><input class="input" name="email" type="email" inputmode="email" autocomplete="email" required></label>
      <label class="field"><span>Välj ett lösenord (minst 6 tecken)</span><input class="input" name="password" type="password" autocomplete="new-password" minlength="6" required></label>
      <div class="error" id="acc-error"></div>
      <button class="btn" type="submit">Spara konto</button>
    </form>`);
  const fm = $('#acc-form', sh);
  fm.onsubmit = async e => {
    e.preventDefault();
    const btn = fm.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      S.user = await B.linkEmail(fm.email.value.trim(), fm.password.value);
      closeSheet();
      toast('Kontot är sparat ✓');
      render();
    } catch (err) {
      $('#acc-error', sh).textContent = friendlyError(err);
      btn.disabled = false;
    }
  };
}

/* ---------------- Inmatningsfältet ---------------- */

function composerList() {
  if (S.view === 'list') return listById(S.listId);
  if (S.view === 'today') return firstTodoList();
  return null;
}

function updateComposer() {
  const list = composerList();
  const el = $('#composer');
  el.hidden = !list;
  if (!list) return;
  const input = $('#composer-input');
  const shop = list.type === 'shopping';
  input.placeholder = shop ? 'Lägg till vara… (t.ex. mjölk, bröd)'
    : S.view === 'today' ? 'Något som ska göras idag…'
    : 'T.ex. "Byt däck imorgon @Pappa"';
  const openTitles = new Set(S.tasks.filter(t => t.listId === list.id && !t.done).map(t => t.title.toLowerCase()));
  const sugg = shop ? (list.recent || []).filter(r => !openTitles.has(r.toLowerCase())) : [];
  $('#suggestions').innerHTML = sugg.map(s => `<option value="${esc(s)}">`).join('');
}

function submitComposer(e) {
  e.preventDefault();
  const input = $('#composer-input');
  const text = input.value.trim();
  const list = composerList();
  if (!text || !list) return;
  input.value = '';

  if (list.type === 'shopping') {
    for (const raw of text.split(/[,\n]/)) {
      const title = cap(raw.trim());
      if (!title) continue;
      const existing = S.tasks.find(t => t.listId === list.id && t.title.toLowerCase() === title.toLowerCase());
      if (existing && !existing.done) continue;
      if (existing) run(B.updateTask(fid(), existing.id, { done: false, doneBy: null, doneAt: null }));
      else run(B.addTask(fid(), { listId: list.id, title, category: guessCat(title), createdBy: me(), done: false }));
      if (!(list.recent || []).includes(title)) run(B.rememberItem(fid(), list.id, title));
    }
    return;
  }

  const p = parseQuick(text);
  if (!p.due && S.view === 'today') p.due = today();
  if (!p.assignee && S.filter !== 'all') p.assignee = S.filter;
  run(B.addTask(fid(), {
    listId: list.id, title: cap(p.title), due: p.due || null, repeat: p.repeat || null,
    assignee: p.assignee || null, assignedBy: p.assignee ? me() : null, assignNotify: !!p.assignee && p.assignee !== me(),
    createdBy: me(), done: false,
  }));
  const bits = [p.due && fmtDue(p.due).toLowerCase(), p.repeat && REPEATS[p.repeat].toLowerCase(), member(p.assignee)?.name].filter(Boolean);
  if (bits.length) toast(`Tillagd · ${bits.join(' · ')}`);
}

/* ---------------- Åtgärder ---------------- */

function toggleTask(id) {
  const t = taskById(id);
  if (!t) return;
  vibrate();
  const shop = listById(t.listId)?.type === 'shopping';
  if (!t.done && t.repeat) {
    const next = nextDue(t.due, t.repeat);
    const prev = { due: t.due || null, lastDoneBy: t.lastDoneBy || null, lastDoneAt: t.lastDoneAt || null };
    run(B.updateTask(fid(), id, { due: next, lastDoneBy: me(), lastDoneAt: Date.now() }));
    toast(`Klart! Nästa gång: ${fmtDue(next).toLowerCase()}`, 'Ångra', () => run(B.updateTask(fid(), id, prev)));
  } else if (!t.done) {
    run(B.updateTask(fid(), id, { done: true, doneBy: me(), doneAt: Date.now() }));
    if (!shop) toast('Bra jobbat! ✓', 'Ångra', () => run(B.updateTask(fid(), id, { done: false, doneBy: null, doneAt: null })));
  } else {
    run(B.updateTask(fid(), id, { done: false, doneBy: null, doneAt: null }));
  }
}

function clearDone() {
  const list = listById(S.listId);
  const ids = S.tasks.filter(t => t.listId === list.id && t.done).map(t => t.id);
  if (!ids.length) return;
  if (!confirm(`Ta bort ${ids.length} avbockade ${ids.length === 1 ? 'sak' : 'saker'} för gott?`)) return;
  run(B.deleteTasks(fid(), ids));
}

async function share() {
  const url = `${location.origin}${location.pathname}?join=${S.family.code}`;
  const text = `Gå med i ${S.family.name} i Familjelistan! Koden är ${S.family.code}.`;
  if (navigator.share) {
    try { await navigator.share({ title: 'Familjelistan', text, url }); } catch {}
  } else {
    try { await navigator.clipboard.writeText(`${text} ${url}`); toast('Inbjudan kopierad!'); }
    catch { prompt('Kopiera inbjudan:', `${text} ${url}`); }
  }
}

function bindStaticEvents() {
  $('#composer').addEventListener('submit', submitComposer);

  $('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    S.view = b.dataset.tab;
    S.showDone = false;
    scrollTo(0, 0);
    render();
  });

  const handle = e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const id = el.closest('[data-id]')?.dataset.id;
    switch (el.dataset.act) {
      case 'toggle': return toggleTask(id);
      case 'edit': return openTaskSheet(taskById(id));
      case 'filter': S.filter = el.dataset.v; return render();
      case 'open-list': S.view = 'list'; S.listId = id; S.showDone = false; scrollTo(0, 0); return render();
      case 'back': S.view = 'lists'; return render();
      case 'new-list': return openListSheet(null);
      case 'edit-list': return openListSheet(listById(S.listId));
      case 'toggle-done': S.showDone = !S.showDone; return render();
      case 'clear-done': return clearDone();
      case 'share': return share();
      case 'edit-profile': return openProfileSheet();
      case 'link-email': return openAccountSheet();
      case 'sign-out':
        if (confirm('Logga ut från Familjelistan på den här telefonen?')) { S.onboardMode = 'login'; S.view = 'today'; run(B.signOut()); }
        return;
      case 'rename-family': {
        const n = prompt('Familjens namn:', S.family.name);
        if (n?.trim()) run(B.updateFamily(fid(), { name: n.trim() }));
        return;
      }
      case 'push-on':
        return B.enablePush(me(), onForegroundPush).then(() => toast('Notiser påslagna 🔔')).catch(err => toast(friendlyError(err)));
      case 'push-off': return run(B.disablePush(me()));
      case 'install': installPrompt?.prompt(); installPrompt = null; return;
      case 'logout':
        if (confirm('Återställa demon till startläget?')) run(B.signOut());
        return;
      case 'remove-member': {
        const m = member(el.dataset.uid);
        if (m && confirm(`Ta bort ${m.name} från familjen? (Använd det t.ex. om någon har bytt telefon och gått med på nytt.)`)) run(B.removeMember(fid(), m.uid));
        return;
      }
    }
  };
  $('#content').addEventListener('click', handle);
  $('#top').addEventListener('click', handle);

  $('#sheet-wrap').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
}

/* ---------------- Bottenpaneler ---------------- */

function openSheet(html) {
  $('#sheet').innerHTML = `<div class="grab"></div>${html}`;
  $('#sheet-wrap').hidden = false;
  document.body.style.overflow = 'hidden';
  return $('#sheet');
}
function closeSheet() {
  $('#sheet-wrap').hidden = true;
  document.body.style.overflow = '';
}

function openTaskSheet(t) {
  if (!t) return;
  const list = listById(t.listId);
  const shop = list?.type === 'shopping';
  let assignee = t.assignee || null;
  const dueChips = [
    ['', 'Inget datum'], [today(), 'Idag'], [iso(addDays(new Date(), 1)), 'Imorgon'],
    [nextWeekday(6), 'I helgen'], [nextWeekday(1, true), 'Nästa vecka'],
  ];
  const doneInfo = t.done && t.doneBy
    ? `<p class="hint">Avbockad av ${esc(member(t.doneBy)?.name || 'någon')}${t.doneAt ? ` ${new Date(t.doneAt).toLocaleString('sv-SE', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}.</p>`
    : t.lastDoneBy ? `<p class="hint">Senast gjord av ${esc(member(t.lastDoneBy)?.name || 'någon')}${t.lastDoneAt ? ` ${new Date(t.lastDoneAt).toLocaleDateString('sv-SE')}` : ''}.</p>` : '';

  const sh = openSheet(`
    <label class="field"><span>${shop ? 'Vara' : 'Uppgift'}</span><input class="input" id="f-title" value="${esc(t.title)}"></label>
    <label class="field"><span>Anteckning</span><textarea class="input" id="f-note" placeholder="${shop ? 'T.ex. 2 st, laktosfri' : 'Detaljer, länk, telefonnummer…'}">${esc(t.note || '')}</textarea></label>
    <div class="field"><span>Vem ska göra det?</span><div class="chips" id="f-assignee">
      <button type="button" class="chip ${!assignee ? 'on' : ''}" data-v="">Vem som helst</button>
      ${members().map(m => `<button type="button" class="chip ${assignee === m.uid ? 'on' : ''}" data-v="${esc(m.uid)}"><span class="dot" style="background:${esc(m.color)}"></span>${esc(m.uid === me() ? 'Jag' : m.name)}</button>`).join('')}
    </div></div>
    ${shop ? `
      <label class="field"><span>Kategori</span><select class="input" id="f-cat">${CATS.map(([k, l]) => `<option value="${k}" ${(t.category || 'ovrigt') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    ` : `
      <div class="field"><span>När?</span>
        <div class="chips" id="f-due-chips">${dueChips.map(([v, l]) => `<button type="button" class="chip" data-v="${v}">${l}</button>`).join('')}</div>
        <input class="input" type="date" id="f-due" value="${esc(t.due || '')}">
      </div>
      <label class="field"><span>Upprepa</span><select class="input" id="f-repeat">${Object.entries(REPEATS).map(([k, l]) => `<option value="${k}" ${(t.repeat || '') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    `}
    <label class="field"><span>Lista</span><select class="input" id="f-list">${sortedLists().map(l => `<option value="${esc(l.id)}" ${l.id === t.listId ? 'selected' : ''}>${esc(l.emoji)} ${esc(l.name)}</option>`).join('')}</select></label>
    ${doneInfo}
    <button class="btn" id="f-save">Spara</button>
    <button class="btn danger" id="f-delete">Ta bort</button>
  `);

  const syncDueChips = () => {
    const v = $('#f-due', sh)?.value || '';
    $$('#f-due-chips .chip', sh).forEach(c => c.classList.toggle('on', c.dataset.v === v));
  };
  syncDueChips();
  $('#f-due', sh)?.addEventListener('change', syncDueChips);
  $('#f-due-chips', sh)?.addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    $('#f-due', sh).value = c.dataset.v;
    syncDueChips();
  });
  $('#f-assignee', sh).addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    assignee = c.dataset.v || null;
    $$('#f-assignee .chip', sh).forEach(x => x.classList.toggle('on', x === c));
  });

  $('#f-save', sh).onclick = () => {
    const title = $('#f-title', sh).value.trim();
    if (!title) return $('#f-title', sh).focus();
    const data = { title, note: $('#f-note', sh).value.trim() || null, assignee, listId: $('#f-list', sh).value };
    if (assignee && assignee !== t.assignee) Object.assign(data, { assignedBy: me(), assignNotify: assignee !== me() });
    if (shop) data.category = $('#f-cat', sh).value;
    else {
      data.due = $('#f-due', sh).value || null;
      data.repeat = $('#f-repeat', sh).value || null;
      if (data.repeat && !data.due) data.due = today();
    }
    run(B.updateTask(fid(), t.id, data));
    closeSheet();
  };
  $('#f-delete', sh).onclick = () => {
    const snapshot = { ...t }; delete snapshot.id;
    run(B.deleteTasks(fid(), [t.id]));
    closeSheet();
    toast('Borttagen', 'Ångra', () => run(B.addTask(fid(), snapshot)));
  };
}

function openListSheet(list) {
  let emoji = list?.emoji || '📋';
  let type = list?.type || 'todo';
  const sh = openSheet(`
    <h3>${list ? 'Ändra lista' : 'Ny lista'}</h3>
    <label class="field"><span>Namn</span><input class="input" id="l-name" value="${esc(list?.name || '')}" placeholder="T.ex. Semester, Bilen, Julklappar"></label>
    <div class="field"><span>Ikon</span><div class="emojis" id="l-emoji">${EMOJIS.map(e => `<button type="button" class="emoji-btn ${e === emoji ? 'on' : ''}" data-v="${e}">${e}</button>`).join('')}</div></div>
    <div class="field"><span>Typ av lista</span><div class="seg" id="l-type">
      <button type="button" data-v="todo" class="${type === 'todo' ? 'on' : ''}">✅ Att göra</button>
      <button type="button" data-v="shopping" class="${type === 'shopping' ? 'on' : ''}">🛒 Inköpslista</button>
    </div></div>
    <p class="hint">Inköpslistor sorterar varorna efter butikens avdelningar och kommer ihåg vanliga varor.</p>
    <button class="btn" id="l-save">${list ? 'Spara' : 'Skapa lista'}</button>
    ${list ? '<button class="btn danger" id="l-delete">Ta bort listan</button>' : ''}
  `);
  if (!list) setTimeout(() => $('#l-name', sh).focus(), 250);
  $('#l-emoji', sh).onclick = e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    emoji = b.dataset.v;
    $$('#l-emoji .emoji-btn', sh).forEach(x => x.classList.toggle('on', x === b));
  };
  $('#l-type', sh).onclick = e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    type = b.dataset.v;
    $$('#l-type button', sh).forEach(x => x.classList.toggle('on', x === b));
    if (type === 'shopping' && emoji === '📋') { emoji = '🛒'; $$('#l-emoji .emoji-btn', sh).forEach(x => x.classList.toggle('on', x.dataset.v === emoji)); }
  };
  $('#l-save', sh).onclick = () => {
    const name = $('#l-name', sh).value.trim();
    if (!name) return $('#l-name', sh).focus();
    if (list) run(B.updateList(fid(), list.id, { name, emoji, type }));
    else run(B.addList(fid(), { name, emoji, type, createdBy: me() }));
    closeSheet();
  };
  $('#l-delete', sh)?.addEventListener('click', () => {
    const ids = S.tasks.filter(t => t.listId === list.id).map(t => t.id);
    if (!confirm(`Ta bort listan "${list.name}" och ${ids.length} ${ids.length === 1 ? 'sak' : 'saker'} i den? Det går inte att ångra.`)) return;
    run(B.deleteList(fid(), list.id, ids));
    S.view = 'lists';
    closeSheet();
    render();
  });
}

function openProfileSheet() {
  const m = member(me());
  let color = m?.color || COLORS[0];
  const sh = openSheet(`
    <h3>Min profil</h3>
    <label class="field"><span>Namn</span><input class="input" id="p-name" value="${esc(m?.name || '')}"></label>
    <div class="field"><span>Färg</span><div class="colors" id="p-colors">${COLORS.map(c => `<button type="button" class="color ${c === color ? 'on' : ''}" style="--c:${c}" data-v="${c}" aria-label="Färg"></button>`).join('')}</div></div>
    <button class="btn" id="p-save">Spara</button>
  `);
  $('#p-colors', sh).onclick = e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    color = b.dataset.v;
    $$('#p-colors .color', sh).forEach(x => x.classList.toggle('on', x === b));
  };
  $('#p-save', sh).onclick = () => {
    const name = $('#p-name', sh).value.trim();
    if (!name) return;
    run(B.saveProfile(me(), { name, color }));
    run(B.updateMember(fid(), me(), { name, color }));
    closeSheet();
  };
}

/* ---------------- Toast ---------------- */

let toastTimer;
function toast(msg, actionLabel, onAction) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${actionLabel ? `<button>${esc(actionLabel)}</button>` : ''}`;
  el.hidden = false;
  if (actionLabel) el.querySelector('button').onclick = () => { el.hidden = true; onAction(); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, actionLabel ? 5000 : 2800);
}

boot();
