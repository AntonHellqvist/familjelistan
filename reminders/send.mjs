// Skickar pushpåminnelser för Familjelistan. Körs automatiskt av GitHub Actions var 15:e minut.
//  - Morgonpåminnelse: första körningen efter kl. 07 får var och en dagens och försenade uppgifter.
//  - Ny uppgift: den som fått en uppgift av någon annan får en notis.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccount) {
  console.log('Hemligheten FIREBASE_SERVICE_ACCOUNT saknas – hoppar över (se GUIDE.md, steg 6).');
  process.exit(0);
}
initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
const db = getFirestore();

const TZ = 'Europe/Stockholm';
const MORNING_HOUR = 7;
const APP_URL = process.env.APP_URL || '';
const now = new Date();
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(now); // ÅÅÅÅ-MM-DD
const hour = Number(new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, hour: '2-digit', hour12: false }).format(now));

async function notify(uid, title, body) {
  const user = await db.doc(`users/${uid}`).get();
  const tokens = (user.get('pushOn') && user.get('fcmTokens')) || [];
  if (!tokens.length) return;
  const res = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    webpush: APP_URL ? { notification: { icon: `${APP_URL}icons/icon-192.png` } } : undefined,
  });
  // Rensa bort telefoner som inte längre finns.
  const dead = tokens.filter((_, i) => {
    const code = res.responses[i].error?.code;
    return code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token';
  });
  if (dead.length) await user.ref.update({ fcmTokens: FieldValue.arrayRemove(...dead) });
  console.log(`Skickade "${title}" till ${tokens.length - dead.length} enhet(er).`);
}

// Viktiga (stjärnmärkta) uppgifter först, med en stjärna framför.
const preview = list => {
  const tasks = [...list].sort((a, b) => (b.important ? 1 : 0) - (a.important ? 1 : 0));
  const names = tasks.slice(0, 3).map(t => (t.important ? '⭐ ' : '') + t.title).join(', ');
  return tasks.length > 3 ? `${names} och ${tasks.length - 3} till` : names;
};

const isLeap = y => new Date(Date.UTC(y, 1, 29)).getUTCMonth() === 1;
const mdOn = (md, y) => (md === '02-29' && !isLeap(y) ? '02-28' : md);

// Födelsedagar och händelser i kalendern som infaller idag.
function todaysEvents(events) {
  const y = +today.slice(0, 4), md = today.slice(5);
  const out = [];
  for (const e of events) {
    if (e.type === 'birthday' && mdOn(e.md, y) === md) {
      out.unshift(e.year ? `🎂 ${e.title} fyller ${y - e.year} år` : `🎂 ${e.title} har födelsedag`);
    } else if (e.type === 'event' && (e.date === today || (e.yearly && e.date < today && mdOn(e.date.slice(5), y) === md))) {
      out.push(`📅 ${e.time ? e.time + ' ' : ''}${e.title}`);
    }
  }
  return out;
}

const families = await db.collection('families').get();
for (const fam of families.docs) {
  const members = fam.get('members') || [];
  const memberInfo = fam.get('memberInfo') || {};
  const open = await fam.ref.collection('tasks').where('done', '==', false).get();

  // Nya uppgifter som någon har gett någon annan.
  for (const doc of open.docs.filter(d => d.get('assignNotify') === true)) {
    const t = doc.data();
    if (t.assignee && members.includes(t.assignee)) {
      const by = memberInfo[t.assignedBy]?.name || 'Någon';
      await notify(t.assignee, `${by} gav dig en uppgift`, t.title);
    }
    await doc.ref.update({ assignNotify: false });
  }

  // Morgonpåminnelse, en gång per dag: dagens uppgifter, födelsedagar och händelser.
  if (hour >= MORNING_HOUR && hour < 12 && fam.get('morningSent') !== today) {
    const due = open.docs.map(d => d.data()).filter(t => t.due && t.due <= today);
    const special = todaysEvents((await fam.ref.collection('events').get()).docs.map(d => d.data()));
    for (const uid of members) {
      const mine = due.filter(t => !t.assignee || t.assignee === uid);
      if (!mine.length && !special.length) continue;
      if (mine.length) {
        const late = mine.filter(t => t.due < today).length;
        const stars = mine.filter(t => t.important).length;
        const title = `${mine.length} ${mine.length === 1 ? 'sak' : 'saker'} att göra idag${late ? ` (${late} försenad${late === 1 ? '' : 'e'})` : ''}${stars ? ` – ${stars} viktig${stars === 1 ? '' : 'a'} ⭐` : ''}`;
        await notify(uid, title, [preview(mine), ...special].join('\n'));
      } else {
        await notify(uid, `Idag: ${special[0]}`, special.slice(1).join('\n') || 'Ha en fin dag!');
      }
    }
    await fam.ref.update({ morningSent: today });
  }
}
console.log('Klart.');
