# Familjelistan – så kommer du igång

Appen är en "hemskärmsapp": en webbsida som installeras på telefonen och ser ut som en vanlig app.
Den fungerar likadant på iPhone och Samsung.

| Del | Var den ligger | Kostnad |
|---|---|---|
| Själva appen | GitHub Pages | Gratis |
| Familjens delade listor | Firebase (Googles databas) | Gratis, inget kort behövs |
| Pushpåminnelser | GitHub Actions | Gratis |

**Ingen behöver logga in.** Varje telefon kopplas till familjen en gång, via en inbjudningslänk,
och därefter öppnas appen direkt.

> 💡 Du behöver inte göra allt själv. Säg till Claude "hjälp mig med steg 3" så gör vi det tillsammans.

Utan inställningar startar appen i **demoläge** med påhittad data, så att du kan klicka runt.

---

## Steg 1 – Skapa databasen i Firebase

1. Gå till <https://console.firebase.google.com> och logga in med ett Google-konto.
2. Klicka **Skapa ett projekt**. Ge det ett namn, t.ex. `familjelistan`. Google Analytics behövs inte. Klicka **Skapa**.
3. I menyn till vänster: **Build → Authentication → Kom igång**. Välj **Anonym** (Anonymous), slå på den och klicka **Spara**.
   (Det betyder bara att telefonerna får en osynlig identitet. Ingen behöver skapa konto.)
4. I menyn: **Build → Firestore Database → Skapa databas**. Välj plats **europe-west1 (Belgium)** och **produktionsläge**.
5. När databasen är skapad: gå till fliken **Regler** (Rules). Ta bort allt som står där,
   klistra in hela innehållet från filen `firestore.rules` och klicka **Publicera**.
   Reglerna gör att bara de som är med i familjen kan se listorna.

## Steg 2 – Koppla appen till Firebase

1. Klicka på kugghjulet ⚙️ högst upp till vänster → **Projektinställningar**.
2. Längst ner under "Dina appar": klicka på ikonen **`</>`** (webb). Skriv ett smeknamn och klicka **Registrera app**.
3. Du ser ett kodblock med `const firebaseConfig = { ... }`. Kopiera allt mellan `{` och `}`.
4. Öppna `docs/config.js` och byt ut `firebase: null,` mot det du kopierade:

```js
self.FAMILY_CONFIG = {
  firebase: {
    apiKey: "AIza...",
    authDomain: "familjelistan.firebaseapp.com",
    projectId: "familjelistan",
    storageBucket: "familjelistan.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
  },
  vapidKey: ""
};
```

Det är okej att de här värdena ligger öppet på GitHub. De är inte hemliga, och säkerhetsreglerna skyddar datan.

## Steg 3 – Lägg upp appen på GitHub Pages

1. Gå till <https://github.com/new>. Döp repot till `familjelistan` och välj **Public**
   (det krävs för gratis GitHub Pages). Klicka **Create repository**.
2. Klicka **uploading an existing file** och dra in **allt** i appens mapp: `docs`, `reminders`,
   `.github`, `firestore.rules` och `GUIDE.md`. Klicka **Commit changes**.
   (Mappen `.github` är dold på Mac. Tryck <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>.</kbd> i Finder för att visa den.)
3. Gå till repots **Settings → Pages**. Under "Build and deployment" väljer du **Deploy from a branch**,
   branch **main** och mapp **/docs**. Klicka **Save**.
4. Efter någon minut visas adressen överst på sidan, t.ex. `https://dittnamn.github.io/familjelistan/`. **Det är din app!**
5. Tillbaka i Firebase: gå till **Authentication → Settings → Authorized domains → Add domain** och lägg till `dittnamn.github.io`.

## Steg 4 – Installera på telefonerna

1. Öppna appen på din telefon, välj **Skapa ny familj** och skriv ditt namn.
2. Gå till fliken **Familj** → **Dela inbjudan** och skicka länken till pappa och mamma, t.ex. via SMS.
3. De öppnar länken, skriver sitt namn och är med.
4. Lägg appen på hemskärmen:
   - **iPhone:** öppna länken i **Safari** → tryck **Dela** (rutan med pilen) → **Lägg till på hemskärmen**.
     Gör det *innan* du skriver ditt namn, eftersom appen på hemskärmen räknas som en egen telefon.
   - **Samsung:** öppna länken i **Chrome** eller **Samsung Internet** → menyn (⋮ eller ☰) → **Installera app**.

Har någon bytt telefon och gått med på nytt? Ta bort den gamla versionen av personen under fliken **Familj**.

---

## Steg 5 – Slå på notiser i appen

1. Firebase → ⚙️ **Projektinställningar → Cloud Messaging**. Under "Web Push certificates" klickar du **Generate key pair**.
2. Kopiera nyckeln och klistra in den i `docs/config.js` som `vapidKey: "..."`.
   Ladda upp den ändrade filen till GitHub (öppna `docs/config.js` på GitHub → pennan ✏️ → klistra in → **Commit changes**).
3. Öppna appen från hemskärmen på varje telefon → fliken **Familj** → **Slå på notiser**.
   På iPhone fungerar det bara när appen är öppnad från hemskärmen (iOS 16.4 eller senare).

## Steg 6 – Låt GitHub skicka påminnelserna

GitHub behöver en nyckel för att få läsa listorna och skicka notiser.

1. Firebase → ⚙️ **Projektinställningar → Tjänstkonton** (Service accounts) → **Generera ny privat nyckel**.
   En `.json`-fil laddas ner.
   ⚠️ **Den filen är hemlig.** Ladda aldrig upp den som fil till GitHub, och radera den från datorn när du är klar.
2. Öppna filen med TextEdit och kopiera **allt** innehåll.
3. På GitHub: repots **Settings → Secrets and variables → Actions → New repository secret**.
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Secret: klistra in innehållet. Klicka **Add secret**.
4. Testa: fliken **Actions** → **Påminnelser** → **Run workflow**. En grön bock betyder att det fungerar.

Vad som skickas:
- **Varje morgon strax efter kl. 07**: "3 saker att göra idag" med de första uppgifterna.
  Gäller dina egna och de som vem som helst kan göra.
- **Inom ca 15 minuter** när någon ger dig en uppgift: "Pappa gav dig en uppgift: Byt däck".

GitHub kan ibland vara några minuter sen, eftersom deras schemaläggning inte är på sekunden.

---

## Smarta saker att känna till

- **Snabbinmatning:** skriv `Byt däck imorgon @Pappa` eller `Ta ut soporna varje tisdag`, så sätts datum, person och upprepning automatiskt.
  Det fungerar med `idag`, `imorgon`, veckodagar, `varje dag/vecka/månad/år` och `@namn`.
- **Inköpslistor** sorteras efter butikens avdelningar. Skriv flera varor på en gång med kommatecken (`mjölk, bröd, ägg`).
  Varor ni köpt förut föreslås när du skriver.
- **Återkommande uppgifter** dyker upp igen med nästa datum när de bockas av.
- **Ångra:** efter att du bockat av eller tagit bort något visas en ångra-knapp i några sekunder.
- **Utan nät:** appen fungerar utan uppkoppling och synkar när telefonen är online igen.

## Uppdatera appen senare

Ändra filerna i mappen `docs` på GitHub. Telefonerna får den nya versionen nästa gång appen öppnas.
