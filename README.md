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

Siffrorna nedan är hämtade ur koden och gäller version 34. **Ändras de i
`engine-simulera.js` ska den här listan uppdateras — annars beskriver
dokumentationen ett spel som inte finns.** Det har hänt en gång och kostade
mer förvirring än det var värt.

### Hästen

Fyra sanna grundegenskaper — startsnabbhet, toppfart, ork och lynne — plus
form, energi och uppmärksamhet. Publiken ser bara de tre sista. Därtill en
distansprofil (optimal distans och tolerans), travsäkerhet härledd ur lynne,
ålder och rutin, samt en dold dagsform: ungefär 5 % dåliga dagar och lika
många toppdagar.

### Loppet

Simuleras i tick om 0,25 sekunder. Placering, avstånd i längder och km/h
läses ur meter och m/s — ingen separat placeringsformel finns. Alla beslut i
en tick fattas utifrån en fryst ögonblicksbild, annars kan två hästar sikta
på varandra och bromsa ner varandra.

Längdled är kontinuerligt, sidled diskret: en kolumn 0 till 6. Etiketterna
härleds däremot geometriskt — "dödens" betyder att man ligger jämsides med
ledaren, inte att man står först i en lista.

**Kraftuttag per läge** (multiplikator på grunduttaget):

| Läge | Faktor |
|---|---|
| Tredje invändigt och bakåt | 0,80 |
| Rygg ledaren | 0,82 |
| Andra och tredje utvändigt, med rygg | 0,88 |
| Ledningen | 0,90 |
| Inne utan rygg | 0,93 |
| Open stretch | 0,95 |
| Fjärde spåret med rygg | 1,06 |
| Tredje spåret med rygg | 1,18 |
| Första utvändigt (dödens) | 1,34 |

Ryggfördelen är alltså ungefär **18 %** mot att gå utan, inte 30.

**Energin har två delar.** En grundkostnad på 0,115 per sekund som hästen
bär nästan hur länge som helst, och en brant del som slår in när farten
överstiger 93 % av toppfarten: `0,115 + 11,5 × över^1,55`. Utan
uppdelningen blir tanken en fast budget som töms av tiden, och då är hela
fältet slut långt före mål på 2640 meter.

Att springa över sin egen toppfart är dessutom fyra gånger dyrare per
procent. Det är så en långsammare häst kan hänga med i fältet och ändå vara
tom när det gäller — och det är därför ledningen är värd något: ledaren
behöver aldrig sträcka sig.

Utvändigt kostar 0,63 % extra väg per spårled, vilket motsvarar π meter per
halvcirkel på en tusenmetersbana.

### Tempot

Marschfarten sätts av fältets 30:e percentil, inte av medianen — annars
tvingas halva fältet sträcka sig hela loppet. Ledaren väljer sedan en
tempoplan när hen tar ledningen: smyg 0,905, normalt 0,965, utslagsgivande
1,025 eller maxfart 1,07. Valet styrs av kuskens offensivitet. Övriga
reagerar: går det långsamt måste någon göra något, går det hårt sitter fler
kvar.

### Loppets tre skeden

Positionsstrid det första kvartsvarvet där fältet sorterar sig och
ytterraden fylls. Sedan en mellanfas där man ligger stilla — men en stark
häst kliver ut och avancerar om ledaren inte pressas eller tempot är lågt.
Sist attackfönstret, vars läge sätts av kuskens tålamod: `480 + (100 −
tålamod) × 8,5` meter från mål.

### Kuskarna

Nittio kuskar i fem körstilar: spetskusk, smygkusk, stayerkusk, chanskusk
och taktiker. Stilen ger spann för offensivitet och tålamod, så två
spetskuskar liknar varandra utan att vara identiska. Kusken påverkar
tajming, beslutskvalitet och galopprisk — aldrig hästens fart direkt.

### Galopp

Fyra nivåer: kort felsteg (1,5–4 m förlorade), galopp (7–16 m), lång galopp
(22–42 m) och diskvalifikation. Vilken det blir avgörs av kuskens kyla.
Risken byggs av travsäkerheten gånger det som faktiskt händer — start +40 %,
voltstart +30 %, springspår +10 %, hård körning +15 %, stress +20 %,
positionsbyte +15 %, trängsel +25 %, trötthet +15 %, fart över kapacitet
+15 %.

Utfall: cirka 1,5 galopper per lopp i ett femtonhästarsfält, varav ungefär
en sjättedel leder till diskvalifikation.

### Spelmarknaden

Streckprocenten standardiseras inom loppet och koncentreras med en enda
parameter (`SKÄRPA` i `engine-streck.js`, för närvarande 0,92). Ett typiskt
lopp får då en favorit kring 25 %, två till tre hästar över 10 % och en
svans under 3 % — i stället för den utsmetade fördelning som tidigare gav
alla mellan 2 och 17 %.

Publiken bedömer efter form, segerprocent, **prispengar per start**,
uppmärksamhet, kuskens rykte och startspåret, med rätt startmetod. Inget av
hästens sanna värden ingår.

**Känt fel:** fältets objektivt bästa häst vinner bara 22 % av loppen, mot
30–40 % i verkligheten. Simuleringen är alltså för slumpmässig i förhållande
till kapacitet, och därför kan ingen marknad vara mer träffsäker än så.
Skärpan är satt för att matcha den träffsäkerheten, inte verklighetens.

### Sfären

Media driver uppmärksamhet, uppmärksamhet driver streckprocent, hög
streckprocent ger respekt ute på banan men också krav från spelarna. En
fallen favorit kostar renommé och spelförtroende, vilket sänker framtida
streck. Stallformen är offentlig och påverkar oddsen på alla dina hästar.
Marknadsbilden mäter om dina hästar brukar överträffa spelarnas rangordning
— gör de det blir de hårdare spelade och kanten äts upp.

### Världen

Tjugo AI-stall med namngivna tränare och egna filosofier, och drygt 180
beständiga hästar. De tävlar mot varandra även de veckor du inte möter dem,
och deras startsummor flyttar dem mellan klasserna. AI-loppen avgörs med en
snabbmodell i stället för tick-simulering — ingen ser dem, och en vecka tar
då fyra millisekunder i stället för drygt en sekund.

## Kalibrering

All slump går genom `slump()` i `engine-util.js`. I spelet är det
Math.random; i kalibrering och tester sätts en seedad generator med
`sättRng(seedad(frö))`. Samma seed ger exakt samma lopp, vilket gör att ett
misstänkt utfall går att köra om och felsöka.

```
node kalibrering.mjs           tolv seeds à 120 lopp
node kalibrering.mjs 18472     bara den seeden
```

Skriptet mäter segrarens resa, spelmarknadens fördelning och träffsäkerhet,
kilometertider, galoppfrekvens och hur mycket ledaren pressas — och visar
spridningen mellan seeds, så att en avvikelse går att skilja från brus.

**Läget i version 35** (tolv seeds, mål från Statistikbibeln):

| Läge | Vår | Mål |
|---|---|---|
| Ledningen | 49 % | 42 % |
| Rygg ledaren | 14 % | 7 % |
| Dödens | 8 % | 13 % |
| Andra utvändigt | 2 % | 9,6 % |
| Tredje utvändigt | 1 % | 7 % |
| Tredje invändigt | 4 % | 3 % |

De utvändiga lägena vinner alltså alldeles för sällan. Tidigare mätningar
visade motsatsen, men de kördes mot slumpgenererade motståndare i ett enda
lopp — den här mätningen använder världens hästar över hela kalendern och
är den som gäller.

Spelmarknaden: favoriten streckas 34 %, två främsta 52 %, tre främsta 63 %,
mot verklighetens 35, 55–60 och 70–75. Fältets bästa häst vinner 33 %, vilket
ligger inom det verkliga spannet 30–40. Favoriten vinner 19 % — marknaden är
alltså mer självsäker än den är träffsäker, delvis med flit genom
marknadsbruset på ±8,5 %.

## Nästa steg

- Tävlingskalender med propositioner istället för tre fasta lopp
- Rivaliserande tränare och en tabell att jagas av
- Kuskar som tackar nej för att de fått bättre erbjudande i samma lopp
- Service worker så spelet fungerar offline
