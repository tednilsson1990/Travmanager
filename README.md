# Stallet — travmanager

Managerspel för travsport. **Inget byggsteg.** Ingen `npm install`, ingen
node_modules. Filerna körs precis som de ligger, direkt i webbläsaren.

## Varför byggfritt

Projektet utvecklas från mobilen. Ett byggsteg skulle kräva en dator, så
beroendena (preact + htm) hämtas som ES-moduler via en importmap i
`index.html`. Följden: du kan ändra vilken enskild fil som helst i GitHubs
webbeditor, committa, och ändringen är live direkt.

## Publicera

1. Skapa ett repo på GitHub och lägg in filerna.
2. Settings → Pages → Source: **Deploy from a branch**, branch `main`, mapp `/`.
3. Öppna URL:en i mobilen → Dela → **Lägg till på hemskärmen**.

Manifestet gör att den startar i helskärm utan adressfält. Karriären sparas i
localStorage och ligger kvar mellan besöken.

## Struktur

Alla filer ligger i samma mapp, utan undermappar — det gör att de går att
ladda upp i ett svep från en telefon. Prefixet i filnamnet är mappen.

```
index.html              importmap + manifest, enda HTML-filen
manifest.webmanifest    hemskärmsapp
styles.css
main.js                 monterar appen
data-namnpaket.js       ALLT namngivande: banor, kuskar, loppserier, hästnamn
data-kalender.js        tävlingskalender, propositioner, storlopp
data-lopp.js            taktiker och spårens värde
data-*.js               ägare, hingstar, kuskar, namn
engine-util.js          slump, formatering, nummertäcken
engine-hast.js          hästar, distansprofiler, träningsformer
engine-streck.js        streckprocent ur publikens synvinkel
engine-simulera.js      tick-baserad loppsimulering (0,25 s)
engine-vecka.js         veckoloop, mediareaktioner, ägarkrav, stallform
state-spel.js           speltillstånd + sparfil
ui-*.js                 preact-komponenter, en fil per vy
```

`engine-*` känner inte till gränssnittet och går att testa fristående.

### Namnlagret

All identitet ligger i `data-namnpaket.js` och ingenstans annars. Motorn
känner bara till egenskaper — banlängd, upploppets längd, open stretch,
kuskens startsnabbhet. Ett licensierat namnpaket kan därför bytas in senare
utan att röra simuleringen. Bygg aldrig in ett namn någon annanstans.

## Modellen i korthet

**Hästen** har fyra sanna egenskaper — startsnabbhet, toppfart, ork, lynne —
plus form, energi och uppmärksamhet. Publiken ser bara de tre sista.

**Loppet** simuleras i tick om 0,25 sekunder. Placering, avstånd i längder och
km/h läses ur meter och m/s; ingen separat placeringsformel finns. Rygg ger
30 % lägre kraftuttag, utvändigt kostar 10 % extra, kraftuttaget växer i kubik
mot farten. Instängd uppstår geometriskt när innerhästen har någon inom fyra
meter framför och utvändigt är blockerat.

**Sfären** sluter cirkeln: media driver uppmärksamhet → uppmärksamhet driver
streckprocent → hög streckprocent ger respekt ute på banan men också krav från
spelarna. En fallen favorit kostar renommé och spelförtroende, vilket sänker
framtida streck.

Kalibrerat mot 300 simulerade lopp: segrartid median 1.12,3 och favoriten
vinner 35 % vid 29 % streck.

## Nästa steg

- Tävlingskalender med propositioner istället för tre fasta lopp
- Rivaliserande tränare och en tabell att jagas av
- Kuskar som tackar nej för att de fått bättre erbjudande i samma lopp
- Service worker så spelet fungerar offline
