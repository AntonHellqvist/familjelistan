// Datalagret. Två varianter med samma funktioner:
//  - Firebase: delad data i molnet, synkas direkt mellan alla telefoner.
//  - Demo: används när config.js saknar Firebase-inställningar. Sparar bara lokalt.

const FIREBASE_VERSION = '10.12.2';
const CDN = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;

export const COLORS = ['#e8594f', '#f2a33a', '#3fae6a', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

export const DEFAULT_LISTS = [
  { name: 'Att göra', emoji: '✅', type: 'todo' },
  { name: 'Handla', emoji: '🛒', type: 'shopping' },
];

// Inbjudningskod utan förväxlingsbara tecken (0/O, 1/I).
function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  const rnd = crypto.getRandomValues(new Uint32Array(6));
  for (const n of rnd) s += chars[n % chars.length];
  return s;
}

export async function initBackend() {
  const cfg = self.FAMILY_CONFIG || {};
  return cfg.firebase ? createFirebase(cfg) : createDemo();
}

/* ---------------- Firebase ---------------- */

async function createFirebase(cfg) {
  const [appM, A, F] = await Promise.all([
    import(CDN + 'firebase-app.js'),
    import(CDN + 'firebase-auth.js'),
    import(CDN + 'firebase-firestore.js'),
  ]);
  const app = appM.initializeApp(cfg.firebase);
  const auth = A.getAuth(app);
  auth.languageCode = 'sv'; // mejl om nytt lösenord skickas på svenska
  let db;
  try {
    // Lokal cache gör att appen fungerar utan nät och synkar när den är online igen.
    db = F.initializeFirestore(app, {
      localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
    });
  } catch {
    db = F.getFirestore(app);
  }

  const userDoc = uid => F.doc(db, 'users', uid);
  const famDoc = fid => F.doc(db, 'families', fid);
  const col = (fid, name) => F.collection(db, 'families', fid, name);
  const item = (fid, name, id) => F.doc(db, 'families', fid, name, id);
  const docs = qs => qs.docs.map(d => ({ id: d.id, ...d.data() }));

  // Förladda notismodulen så att knappen "Slå på notiser" svarar direkt.
  const messagingP = import(CDN + 'firebase-messaging.js').catch(() => null);

  return {
    demo: false,
    pushConfigured: !!cfg.vapidKey,

    // Varje telefon får först en osynlig identitet. Den kopplas sedan till en e-post (linkEmail),
    // så att man kan logga in igen på en ny telefon eller om appen har glömt en.
    onAuthChange: cb => A.onAuthStateChanged(auth, u => {
      if (u) cb({ uid: u.uid, email: u.email || null });
      else A.signInAnonymously(auth).catch(err => cb(null, err));
    }),
    async linkEmail(email, password) {
      const cred = A.EmailAuthProvider.credential(email, password);
      await A.linkWithCredential(auth.currentUser, cred);
      await F.setDoc(userDoc(auth.currentUser.uid), { email }, { merge: true });
      return { uid: auth.currentUser.uid, email };
    },
    async signInEmail(email, password) {
      const prev = auth.currentUser?.isAnonymous ? auth.currentUser.uid : null;
      const { user } = await A.signInWithEmailAndPassword(auth, email, password);
      // Om den här telefonen redan gått med i familjen utan konto: ta bort dubbletten.
      if (prev && prev !== user.uid) {
        try {
          const fid = (await F.getDoc(userDoc(user.uid))).get('familyId');
          const fam = fid && await F.getDoc(famDoc(fid));
          if (fam?.exists() && (fam.get('members') || []).includes(prev)) {
            await F.updateDoc(famDoc(fid), { members: F.arrayRemove(prev), [`memberInfo.${prev}`]: F.deleteField() });
          }
        } catch {}
      }
    },
    resetPassword: email => A.sendPasswordResetEmail(auth, email),
    signOut: () => A.signOut(auth),

    watchProfile: (uid, cb) => F.onSnapshot(userDoc(uid), s => cb(s.data() || {}), () => cb({})),
    saveProfile: (uid, data) => F.setDoc(userDoc(uid), data, { merge: true }),

    async createFamily(uid, name, me) {
      const ref = F.doc(F.collection(db, 'families'));
      const code = makeCode();
      const b = F.writeBatch(db);
      b.set(ref, { name, code, members: [uid], memberInfo: { [uid]: me }, ts: Date.now() });
      b.set(F.doc(db, 'joinCodes', code), { familyId: ref.id });
      await b.commit();
      await Promise.all(DEFAULT_LISTS.map((l, i) => F.addDoc(col(ref.id, 'lists'), { ...l, createdBy: uid, ts: Date.now() + i })));
      await F.setDoc(userDoc(uid), { ...me, familyId: ref.id }, { merge: true });
    },
    async joinFamily(uid, code, me) {
      const s = await F.getDoc(F.doc(db, 'joinCodes', code));
      if (!s.exists()) throw new Error('Hittade ingen familj med den koden.');
      const fid = s.data().familyId;
      await F.updateDoc(famDoc(fid), { members: F.arrayUnion(uid), [`memberInfo.${uid}`]: me });
      await F.setDoc(userDoc(uid), { ...me, familyId: fid }, { merge: true });
    },
    updateMember: (fid, uid, info) => F.updateDoc(famDoc(fid), { [`memberInfo.${uid}`]: info }),
    removeMember: (fid, uid) => F.updateDoc(famDoc(fid), { members: F.arrayRemove(uid), [`memberInfo.${uid}`]: F.deleteField() }),
    updateFamily: (fid, data) => F.updateDoc(famDoc(fid), data),

    watchFamily: (fid, cb, onError) => F.onSnapshot(famDoc(fid), s => cb(s.exists() ? { id: s.id, ...s.data() } : null), onError),
    watchLists: (fid, cb) => F.onSnapshot(col(fid, 'lists'), qs => cb(docs(qs))),
    watchTasks: (fid, cb) => F.onSnapshot(col(fid, 'tasks'), qs => cb(docs(qs))),

    addList: (fid, data) => F.addDoc(col(fid, 'lists'), { ...data, ts: Date.now() }),
    updateList: (fid, id, data) => F.updateDoc(item(fid, 'lists', id), data),
    async deleteList(fid, id, taskIds) {
      const b = F.writeBatch(db);
      taskIds.forEach(t => b.delete(item(fid, 'tasks', t)));
      b.delete(item(fid, 'lists', id));
      await b.commit();
    },
    rememberItem: (fid, listId, title) => F.updateDoc(item(fid, 'lists', listId), { recent: F.arrayUnion(title) }),

    addTask: (fid, data) => F.addDoc(col(fid, 'tasks'), { ...data, ts: Date.now() }),
    updateTask: (fid, id, data) => F.updateDoc(item(fid, 'tasks', id), data),
    async deleteTasks(fid, ids) {
      const b = F.writeBatch(db);
      ids.forEach(t => b.delete(item(fid, 'tasks', t)));
      await b.commit();
    },

    // Måste anropas direkt från ett knapptryck (krav på iPhone).
    async enablePush(uid, onForeground) {
      if (!('Notification' in self)) throw new Error('Den här webbläsaren stöder inte notiser. På iPhone måste appen först läggas till på hemskärmen.');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') throw new Error('Notiser är avstängda. Du kan slå på dem i telefonens inställningar.');
      if (!cfg.vapidKey) throw new Error('Pushnotiser är inte konfigurerade ännu (se GUIDE.md, steg 5).');
      const M = await messagingP;
      if (!M || !(await M.isSupported())) throw new Error('Notiser stöds inte här.');
      const messaging = M.getMessaging(app);
      const token = await M.getToken(messaging, {
        vapidKey: cfg.vapidKey,
        serviceWorkerRegistration: await navigator.serviceWorker.ready,
      });
      await F.setDoc(userDoc(uid), { fcmTokens: F.arrayUnion(token), pushOn: true }, { merge: true });
      M.onMessage(messaging, p => onForeground?.(p.notification || {}));
    },
    async disablePush(uid) {
      await F.setDoc(userDoc(uid), { fcmTokens: [], pushOn: false }, { merge: true });
    },
  };
}

/* ---------------- Demo ---------------- */

function createDemo() {
  const KEY = 'familjelistan-demo-v1';
  const uid = 'me';
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
  const id = () => Math.random().toString(36).slice(2, 10);

  function seed() {
    const now = Date.now();
    return {
      profile: { name: 'Du', color: '#3b82f6', familyId: 'demo' },
      family: {
        id: 'demo', name: 'Familjen', code: 'DEMO42', members: ['me', 'pappa', 'mamma'],
        memberInfo: {
          me: { name: 'Du', color: '#3b82f6' },
          pappa: { name: 'Pappa', color: '#3fae6a' },
          mamma: { name: 'Mamma', color: '#ec4899' },
        },
      },
      lists: [
        { id: 'l1', name: 'Att göra', emoji: '✅', type: 'todo', ts: now },
        { id: 'l2', name: 'Handla', emoji: '🛒', type: 'shopping', ts: now + 1, recent: ['Mjölk', 'Bananer', 'Kaffe', 'Toapapper', 'Bröd'] },
        { id: 'l3', name: 'Hemmet', emoji: '🏠', type: 'todo', ts: now + 2 },
      ],
      tasks: [
        { id: id(), listId: 'l1', title: 'Byt till vinterdäck', assignee: 'pappa', due: day(2), ts: now },
        { id: id(), listId: 'l1', title: 'Boka tandläkare', assignee: 'me', due: day(-1), ts: now + 1 },
        { id: id(), listId: 'l1', title: 'Betala elräkningen', assignee: 'mamma', due: day(0), ts: now + 2 },
        { id: id(), listId: 'l3', title: 'Ta ut soporna', assignee: 'me', due: day(0), repeat: 'weekly', ts: now + 3 },
        { id: id(), listId: 'l3', title: 'Vattna blommorna', due: day(3), repeat: 'weekly', ts: now + 4 },
        { id: id(), listId: 'l3', title: 'Rensa förrådet', ts: now + 5 },
        { id: id(), listId: 'l2', title: 'Mjölk', category: 'mejeri', ts: now + 6 },
        { id: id(), listId: 'l2', title: 'Bananer', category: 'frukt', ts: now + 7 },
        { id: id(), listId: 'l2', title: 'Kaffe', category: 'skafferi', ts: now + 8 },
        { id: id(), listId: 'l2', title: 'Toapapper', category: 'hushall', ts: now + 9, done: true, doneBy: 'mamma', doneAt: now },
      ],
    };
  }

  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { data = seed(); }
  const L = { profile: new Set(), family: new Set(), lists: new Set(), tasks: new Set() };
  const clone = x => JSON.parse(JSON.stringify(x));
  const emit = () => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
    L.profile.forEach(cb => cb(clone(data.profile)));
    L.family.forEach(cb => cb(clone(data.family)));
    L.lists.forEach(cb => cb(clone(data.lists)));
    L.tasks.forEach(cb => cb(clone(data.tasks)));
  };
  const watch = (set, value) => cb => { set.add(cb); setTimeout(() => cb(clone(value())), 0); return () => set.delete(cb); };
  const later = fn => (...a) => { fn(...a); emit(); return Promise.resolve(); };

  return {
    demo: true,
    pushConfigured: false,
    onAuthChange: cb => { setTimeout(() => cb({ uid, email: data.profile.email || null }), 0); return () => {}; },
    async linkEmail(email) { data.profile.email = email; emit(); return { uid, email }; },
    signInEmail: async () => {},
    resetPassword: async () => {},
    signOut: async () => { localStorage.removeItem(KEY); location.reload(); },

    watchProfile: (_, cb) => watch(L.profile, () => data.profile)(cb),
    saveProfile: later((_, d) => Object.assign(data.profile, d)),
    createFamily: later(() => {}), joinFamily: later(() => {}),
    updateMember: later((_, u, info) => { data.family.memberInfo[u] = info; }),
    removeMember: later((_, u) => {
      data.family.members = data.family.members.filter(m => m !== u);
      delete data.family.memberInfo[u];
    }),
    updateFamily: later((_, d) => Object.assign(data.family, d)),

    watchFamily: (_, cb) => watch(L.family, () => data.family)(cb),
    watchLists: (_, cb) => watch(L.lists, () => data.lists)(cb),
    watchTasks: (_, cb) => watch(L.tasks, () => data.tasks)(cb),

    addList: later((_, d) => data.lists.push({ ...d, id: id(), ts: Date.now() })),
    updateList: later((_, lid, d) => Object.assign(data.lists.find(l => l.id === lid) || {}, d)),
    deleteList: later((_, lid) => {
      data.lists = data.lists.filter(l => l.id !== lid);
      data.tasks = data.tasks.filter(t => t.listId !== lid);
    }),
    rememberItem: later((_, lid, title) => {
      const l = data.lists.find(x => x.id === lid);
      if (l) { l.recent = l.recent || []; if (!l.recent.includes(title)) l.recent.push(title); }
    }),
    addTask: later((_, d) => data.tasks.push({ ...d, id: id(), ts: Date.now() })),
    updateTask: later((_, tid, d) => Object.assign(data.tasks.find(t => t.id === tid) || {}, d)),
    deleteTasks: later((_, ids) => { data.tasks = data.tasks.filter(t => !ids.includes(t.id)); }),

    enablePush: async () => { throw new Error('Notiser fungerar inte i demoläget.'); },
    disablePush: async () => {},
  };
}
