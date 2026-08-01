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
localStorage och ligger kvar mellan besöken. Service workern cachar alla filer
vid första besöket, så spelet startar även utan nät.

**Versionsnumret finns på TVÅ ställen:** `?v=N` i `index.html` och `VERSION`
i `sw.js`. De ska alltid höjas ihop. Höjs bara det ena serverar service
workern den gamla versionen för evigt — även online.

## Struktur

Alla filer ligger i samma mapp, utan undermappar — det gör att de går att
ladda upp i ett svep från en telefon. Prefixet i filnamnet är mappen.

```
index.html              importmap + manifest, enda HTML-filen
sw.js                   service worker — spelet fungerar utan nät
ui-startvy.js           spelstarten: namn, dräkt, hemmabana
ui-gardvy.js            gården: byggen, boxar, personal
ui-prolog.js            prologens scener: mentorkort, övertagande, rekrytering
engine-prolog.js        säsong 0: mentorn, introhästarna, gårdshistorien
engine-handelser.js     händelsemotorn — spelets strukturerade minne och buss
engine-lyssnare.js      reaktionerna: press, mentor, ägare, förstaman, troféer
ui-journalvy.js         Stalljournalen: krönika, säsonger, rekord, troféer
engine-storlopp.js      storloppsbågen: kval, uppladdning, världens favorit
engine-scener.js        helskärmsscenerna och deras val
ui-scenvy.js            scenens yta: kvällsmörker, bild, rubrik, val
engine-personal.js      personalens karriärer, ägarrelationer, banflytten
engine-rekord.js        rekordtavlan, hall of fame, säsongskrönikan
engine-mentor.js        mentorns sista båge: närvaro, bortgång, minneslopp
engine-motgang.js       motgången: stjärnskada, favoritfall, svacka, comeback
engine-varldsrost.js    världens röst: liga, sviter, miljonärer, uppstickaren
ui-grafik.js            bildspråket: hästsilhuetter, dräkter, gårdskartan
ui-hemvy.js             Hem — dagens redaktionella uppslag
engine-forstaman.js     förstamannen: träningsråd och loppmatchning
engine-gard.js          anläggningens effekter på veckan
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

**En kusk kan vara uppbokad** av ett annat stall i just det loppet — då
hjälper varken renommé eller pengar. Elitkuskarna är tagna i ungefär vart
tredje lopp, breda kåren i vart åttonde, och en god relation gör att kusken
håller sig ledig för din skull. De uppbokade sitter sedan på riktigt i
startlistan, på de starkaste motståndarna. Att samma kusk är ledig i nästa
avdelning är poängen: ibland är rätt drag att byta lopp i stället för kusk.

Uppbokningen avgörs av en hash på (säsong, vecka, lopp, kusk) — inte av
`slump()`. Därför ger samma fråga alltid samma svar hur många gånger vyn än
ritas om, och kalibreringens seedade körningar förblir reproducerbara.

**Kuskkännedom.** En kusk som kört hästen förut kör den bättre: upp till
18 % färre galopper och skarpare spurttajming efter sex gemensamma starter.
Kännedomen bor på hästen (`kuskbekant`), följer med i sparfilen och visas i
anmälan. Effekten sitter i risk och tajming — aldrig i hästens fart — och
mätt över 600 lopp flyttar den snittplaceringen bara någon hundradel.
Världens hästar saknar fältet och påverkas inte, så kalibreringen är orörd.
Tillsammans med uppbokningen ger det trohet ett pris och ett värde: byter du
kusk för att din vanliga är uppbokad börjar den nya om från noll.

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

### Säsongen och karriären

Efter sista veckan avslutas säsongen: slutplacering i tränarligan, insprunget,
segrar och stallets bästa häst skrivs in i en historik som visas under Sfären.
Därefter startar nästa säsong.

**Alla hästar åldras och utvecklas** — dina och världens. En treåring växer
kraftigt, en sjuåring står stilla, en elvaåring tappar. En häst med 55 i
kapacitet toppar kring 63 vid sju års ålder och är nere på 52 vid tretton.
Hästar över tretton pensioneras.

**Världens stall får en ny årgång varje år**, och de äldsta lämnar plats. Utan
det stiger världens snittålder ett år per säsong och unghästloppen står till
slut tomma. Med det ligger populationen stabil kring 183 hästar och en dryg
sjättedel är treåringar.

### Aveln

Ett sto kan bara bära ett föl i taget, och dräktigheten är tio veckor — halva
säsongen. Tidigare kunde samma sto betäckas varje vecka så länge kassan
räckte, vilket gjorde aveln till en hästautomat i stället för ett
långsiktigt beslut.

### Storloppen

En seger i ett storlopp eller en storspelsavdelning ger mer än prispengar:
spelförtroendet stiger, och en ägare hör ofta av sig direkt efteråt och vill
placera en häst hos dig. Det är den snabbaste vägen uppåt för ett litet
stall — och skälet att satsa en häst på ett lopp den kanske inte klarar.

### Formraden

Varje häst för loppbok — dina och världens. De senaste starterna visas i
travets eget skrivsätt, nyast först: **1-3-d-2-5**, där d är diskvalificerad.
Den syns på hästkortet och i marknaden, och är avgörande för ett köpbeslut:
totalsiffror säger vad hästen gjort på tre år, formraden vad den gör nu.

### Hästmarknaden

Varje vecka ligger sex till åtta hästar ute: överskott från AI-stallen — äldre
hästar och sådana som inte håller stallets klass — plus ett par otestade
treåringar från uppfödningen.

Du köper på **offentlig information**: ålder, meriter, form och ett omdöme.
Aldrig de sanna värdena. Det är först när hästen springer du vet vad du köpt,
precis som i verklig hästhandel. Priset följer prispengar per start, ålder och
form; en fyraåring kostar långt mer än en tioåring med samma siffror, eftersom
man betalar för de år som återstår.

En såld häst försvinner inte ur världen — den hamnar i ett annat stall och kan
möta dig i ett lopp längre fram.

**Världen handlar också med sig själv.** Varje vecka byter en eller två hästar
stall utan din inblandning: ett stall i knipa säljer sin bästa häst, ett
starkt köper på sig. Över en säsong blir det ett trettiotal affärer, och
stallstorlekarna glider isär — utbudet du ser nästa vecka har ändrats av skäl
som inte har med dig att göra.

### Ekonomin

Drift 3 200 kr per häst och vecka. Ägarhästar betalar 9 800 kr i träningsarvode
och är därför stallets ekonomiska ryggrad — de kommer när renommét stiger.

Kassan har ett golv: går den under noll varnar spelet, och efter tre veckor i
rad tvingas en försäljning fram. En karriär som tyst blivit omöjlig är värre
än en som tar slut med besked.

**Renommét har också ett golv**, och det är viktigare än det låter. Vid noll
tackar alla kuskar nej och inga ägare hör av sig — karriären låser sig
permanent. Ett testspel över fyra säsonger fastnade på sista plats med
renommé 0 av den anledningen. Golvet följer stallets faktiska verksamhet:
antal hästar och insprunget. Med det klättrade samma testspel från
tjugoförsta till tolfte plats på tre säsonger.

**Var man börjar.** AI-stallen tjänar mellan 156 000 och 4,6 miljoner på en
säsong. Ett nystartat stall med tre hästar landar kring 250 000 och hamnar
ungefär på artonde plats av tjugoen. De svagaste stallen är alltså möjliga att
passera direkt, medan toppen kräver flera säsonger av växande stall och
välkalibrerade köp. Tabellen visar även insprunget per häst, eftersom ett
stall med tio hästar alltid tjänar mer än ett med fyra — men inte
nödvändigtvis är bättre.

### Världen

Tjugo AI-stall med namngivna tränare och egna filosofier, och drygt 180
beständiga hästar. De tävlar mot varandra även de veckor du inte möter dem,
och deras startsummor flyttar dem mellan klasserna. AI-loppen avgörs med en
snabbmodell i stället för tick-simulering — ingen ser dem, och en vecka tar
då fyra millisekunder i stället för drygt en sekund.

## Kalibrering

All slump går genom `slump()` i `engine-util.js`. I spelet är det
Math.random; i kalibrering sätts en seedad generator med
`sättRng(seedad(frö))`. Samma seed ger exakt samma lopp.

```
node verifiera.mjs             FÖRE VARJE PAKETERING: importmap, sw, versioner
node kalibrering.mjs           tolv fasta seeds à 120 lopp
node kalibrering.mjs 18472     bara den seeden
node diagnos-ledarbyte.mjs     ledarbyten: håller 1000-metersledaren?
node diagnos-ytterrad.mjs      ytterraden: vem täcker rygg ledaren?
node diagnos-radenergi.mjs     raden bakåt: energi eller beteende?
node prov-handelser.mjs        händelsebussen: utlöses varje reaktion?
node prov-storlopp.mjs         bågen, avelshagen och arvet
node prov-scener.mjs           scenkön, valen och deras effekter
node prov-personal.mjs         förstamansbågen, gamla bekanta, ägarna
node prov-rekord.mjs           rekordtavlan, hall of fame, krönikan
node prov-mentor.mjs           mentorns båge: varsamheten, minnesloppet
node prov-motgang.mjs          motgångens trösklar och cirklar
node prov-varldsrost.mjs       världsröstens throttling
```

`verifiera.mjs` föddes ur ett tyst fel: en textersättning som missade
sitt ankare no-opade utan besked, tre filer hamnade aldrig i importmappen
och en uppdatering gav svart skärm. Sidan har numera också en vakthund:
är sidan tom efter sex sekunder provhämtas varje fil ur importmappen och
de som saknas listas på skärmen — en svart skärm ska aldrig mer vara stum.

Regeln bakom `diagnos-ledarbyte.mjs` gäller alla framtida trimningar: bygg
ett mätskript som testar hypotesen INNAN motorn röres, och spara skriptet i
repot så att mätningen kan göras om.

### Om måttet — läs detta innan något trimmas

Källmaterialet (Statistikbibeln, Åbystatistiken) anger segrarens position
**cirka 1 000 meter från mål**. Det är därför huvudmåttet.

Tidigare mättes i stället "var vinnaren tillbringade mest tid mellan 20 och
80 procent av loppet" — ett eget påfund som gav systematiskt andra siffror
och som motorn under en period trimmades emot. Skillnaden är stor: en häst
kan ligga 1 200 meter i andra utvändigt, gå fram sista 700 och då räknas som
dödens av tidsmåttet men som andra utvändigt av källans.

Diagnostiken nedan visar hur mycket det spelar roll — vinnaren har varit i
dödens någon gång i tre lopp av fyra, men tillbringar i snitt bara 220 meter
där mot 800 i ledningen.

**Trimma aldrig mot ett mått som inte är källans.**

### Läget i version 49

Tolv seeds, 120 lopp per seed, hela kalendern.

| Läge 1 000 m från mål | Vår | Mål | |
|---|---|---|---|
| Ledningen | 38,5 % | 42 | −3 |
| Dödens | 13,8 % | 13 | ✓ |
| Rygg ledaren | 13,1 % | 7 | +6 |
| Andra utvändigt | 6,1 % | 9,6 | −3 |
| Tredje utvändigt | 6,3 % | 7 | ✓ |
| Tredje invändigt | 4,1 % | 3 | ✓ |

Total avvikelse 15,7 — ner från 22,3 i v43 och 19,2 i v47, utan regression
i något mått. Rygg ledaren under +7 för första gången.

Spelmarknaden: favoriten streckas 36 %, två främsta 54 %, tre främsta 65 %,
mot verklighetens 35, 55–60 och 70–75. Fältets bästa häst vinner 37 %, inom
det verkliga spannet 30–40. Favoriten vinner 21 % — marknaden är mer
självsäker än träffsäker, delvis med flit genom marknadsbruset på ±8,5 %.

Ledaren har någon utvändigt intill sig 69 % av loppet, men utsätts för
verklig press — någon som håller farten vid hjulet — 38 % av tiden. Det är
skillnaden mellan närvaro och tryck.

### Kvarvarande avvikelser

**Rygg ledaren vinner för ofta** — 13,7 % mot måltalet 7.

**Sent ledarförsvar (v47).** Diagnostiken i `diagnos-ledarbyte.mjs` visade
att ledningen −6 och rygg ledaren +8 hade samma orsak: ledarbytet var för
billigt. 1000-metersledaren vann bara 33 % mot verklighetens 42, och när hen
kördes om kom vinnaren oftast från rygg ledaren (16 % av loppen) eller
dödens (16 %). Åtgärd: i sista 900 metrarna försvarar ledaren spetsen upp
till `max(plan, 1,032)` och får sträcka sig till 1,028 × toppfart —
utmanaren ska förbi på egen kraft, i dödens, inte vinkas förbi.

Dosen är medvetet mild. Starkare försvar (1,045/1,035) tog ledningen ända
till 40,9 ✓ men sänkte tredje utvändigt till 3,5 — samma jämnt-ut-byte som
stationshållningen. Milda dosen förbättrar allt den rör utan att försämra
något: ledningen −6 → −3, rygg +8 → +7, andra utvändigt −5 → −4.

Kvarvarande grundproblem: modellen är rättad så att hästen kommer loss av GEOMETRIN, inte av tur: en
tidigare slumpmässig frigörelsechans per 1,5 sekund är borttagen. Nu öppnar
sig läget när ledaren drar ifrån, dödenshästen tappar eller avancerar, och
ingen fyller luckan. Fältet fäller dessutom ut först i de sista 300 metrarna
i stället för 420, eftersom luckan i verkligheten oftast kommer då — när
kuskarna gör sina drag inför upploppet. Det tog siffran från 15,9 till 13,4; sena ledarförsvaret därefter till 13,7 med bättre helhet.

Diagnostik: av vinnarna som låg i rygg ledaren vid 1 000 meter låg bara 3 %
kvar där vid 300 meter. 36 % hade tagit ledningen, 28 % låg utvändigt bakom
fältet, 18 % i dödens. Positionen lämnas alltså och betalas för, precis som
den ska — det är magnituden som är fel, inte mekaniken. Sannolikt är det för
lätt att avancera hela vägen till ledningen.

Prövat och avfärdat, i tur och ordning:

1. Dyrare sen utfällning som skalar med antalet hästar utanför
   (13,4 → 14,4 %, alltså ingen effekt).
2. **Rang mot rang-station med 9-metersfönster.** Försämrade totalen till
   22,4 och avfärdades — FELAKTIGT. Raden ligger 17–27 meter bak, så
   9-metersfönstret gjorde att rangsiktet föll tillbaka till närmaste-
   varianten i nästan alla lopp: experimentet testade aldrig sin hypotes.
   Utan fönstret (v49, se nedan) är samma idé projektets största vinst.
   Lärdom: när ett experiment ger noll effekt på mekanismen det riktar sig
   mot — kontrollera att det ÄR aktivt innan hypotesen avfärdas.
3. **Bredare blockeringsfönster för instängd.** Visade sig vara en dubblett:
   TÄCKER_FRAM är redan 4,2 m, så dödens på 1,3 längder före blockerar redan
   utgången rakt ut. Kalibreringen blev identisk till decimalen — död kod,
   borttagen.

4. **Avdriftsstopp och långsamt avancemang för icke-pressare** utvändigt
   utan rygg. Avdriften −0,1 m/s var verklighetsvidrig och togs bort
   (behållet), men gav ensam bara decimaler. Att därtill låta icke-pressare
   klättra mot dödens FÖRSÄMRADE (20,6): de nådde fram, tömdes på 1,34×
   och rev täckningen bakom sig. Klättringen återställd.

**Radensfixen (v49).** `diagnos-radenergi.mjs` avgjorde frågan energi
eller beteende: radens främsta ytterhäst låg 7–11 längder bakom ryggen med
kraft 47+ kvar — mer än ryggen själv. Beteende alltså. Åtgärden är rang
mot rang-siktet utan avståndsfönster: ytterhäst nummer k hör hemma
jämsides innerhäst nummer k oavsett hur långt bak den halkat. Klampen och
kontakttaket begränsar stigtakten, så en tom häst når ändå aldrig upp —
men en pigg slutar sikta fel. Resultat: total avvikelse 19,2 → 15,7,
täckningen av ryggen 22 → 27 %, luckorna mitt i raden 25 → 21 %, radens
eftersläpning 10,9 → 9,2 längder. Tider, galoppfrekvens och marknad
orörda.

Kvarvarande: raden ligger fortfarande bakom i 49 % av loppen — hästarna
siktar nu rätt men stigtakten hinner inte ikapp när eftersläpningen väl
uppstått. Stigtaktsklampen 2,2 → 2,9 är prövad: geometrin blev bättre
(raden bakom 47 → 43,5 %) men kalibreringen backade till 17,1 — dödens
och andra utvändigt betalade för trafiken. Återställd. Nästa idé bör
angripa VARFÖR eftersläpningen uppstår (utflyttningar sker långt bak i
fältet) snarare än hur fort den hämtas in.

Rygghästen är instängd 27–46 % av loppet, men borde vara det så länge det
finns en yttre rad alls — någon ligger utvändigt intill ledaren 70 % av
tiden. Ytterraden ligger inte tillräckligt konsekvent jämsides med innerköns
FRÄMRE del.

**Tredje utvändigt vinner för sällan** — 3,5 % mot måltalet 7.

Prövat och avfärdat, i tur och ordning:

1. Sänkt kraftuttag utvändigt med rygg (0,88 → 0,84 → 0,80). Flyttade
   siffran mellan 2,9 och 3,8 procent — energin är inte begränsningen.
2. **Attack med rygg** — hästen bakom en som just gått ut får haka på, lägga
   sig i dess rygg och slippa väntekostnaden. Mekaniken fungerar och står nu
   för en tredjedel av alla utflyttningar, vilket är ett realistiskt
   beteende i sig. Men vinstfördelningen rörde sig knappt.

3. **Stationshållning** — utvändiga hästar med rygg håller position jämsides
   en bestämd innerhäst, en halv hästlängd bakom, i stället för att följa
   den utvändiga hästen framför på fast avstånd. Det löste tredje utvändigt
   (3,5 → 5,6 %, inom mål) men försämrade andra utvändigt lika mycket.

Den totala avvikelsen mot måltalen är oförändrad: 22,1 före stationshållningen,
22,3 efter. Ombyggnaden behölls ändå, eftersom den är fysiskt sannare —
ytterraden ligger nu bredvid innerkön i stället för att följa sig själv.

## Galoppdiskningen som frös loppet (v113 — speltestfynd i motorn)

Ted: "när en häst galopperar avslutas inte loppet." Rotorsaken satt i
simulatorns slutvillkor: LEVANDE räknades EN GÅNG före loppet, så en
häst som diskades mitt i (galopp med bortkörning) aldrig nådde mål —
och klara < levande blev aldrig sant. Loppet malde till maxtiden och
uppspelningen såg ut att aldrig ta slut.

Lagningen är minsta möjliga: levande räknas om varje varv — start-
diskade var aldrig med, mittdiskade sänker kravet i samma stund de
körs bort. Ren räkning, ingen slump, inget beteende i loppet ändras;
full svitkörning grön efteråt (järnregeln för motorn). Empiriskt
verifierad över 150 provocerade lopp: 36 mittdiskningar, värsta 462
rutor mot 481 för rena lopp — diskade lopp slutar i samma takt. Och
en PERMANENT VAKT i analyssviten provocerar galopper varje körning
och låser att diskade lopp aldrig drar iväg igen.

(En lärdom ur felsökningen: diskningsorsaken bor på simtillståndet,
inte på hästen — första detektorn läste fel fält och "hittade" noll
diskningar. Sonden som avslöjade det ledde rakt till vakten.)

## Klickvakten och sparfilsexporten (v114 — beskedsknappen säsong 2)

Teds rapport: bekräftaknappen i onsdagens uttagningsbesked slutade
reagera i säsong 2 — utan felbanner. Motorn är frikänd (säsong 2-
reproduktion med lärlingskusk: uttagningen ger "med", bekräftelsen
"bekräftad", inkorgen bygger rent), komponentens villkor likaså. Det
som återstår är att klickets mutation kastar och tystas någonstans på
vägen. Två åtgärder:

**Klickvakten:** uppdatera-vägen (varje knapptryck i spelet går genom
den) fångar nu mutationsfel, sparar och ritar om ÄNDÅ, och kastar om
felet asynkront så den globala felbannern GARANTERAT visar meddelande
och rad. Tystnad är inte längre ett möjligt utfall — nästa tryck ger
antingen skärmbyte eller exakt diagnos.

**Sparfilsexporten:** Kontoret har fått en Felsökning-ruta med
»Exportera sparfilen« — sparfilen som nedladdningsbar fil, så exakt
samma läge kan återskapas där felet uppstod. (Felbannern hade knappen
sedan länge — nu finns den även utan krasch.)

## Spelrapportens sex punkter (v113)

**Galoppen och loppet som "inte avslutas".** Inte återskapat: 400
provlopp med tvingade galoppörer — simulatorn avslutar alltid (värsta
bildlängd 387 rutor), analysen och efterloppet klarar bortkörda
hästar. I stället för en gissad lagning: ett FELSKYDD i avslutningen —
kastar något där visas felet och raden PÅ SKÄRMEN med en
tillbaka-knapp, i stället för tyst frysning. Nästa gång det händer
ger skärmen exakt diagnos.

**Sponsorkravet ("massor lopp men inget kört").** Riktig bugg:
inkorgens och veckomötets kravtexter läste krav.nu/krav.mål — fält
som aldrig funnits. Framsteget bor i avtalets status via kravläge().
Lagade, och avtalen är säsongsbundna: "veckor kvar" räknas nu ur
säsongen. Mötet säger dessutom när kravet är uppfyllt och bonusen
säkrad.

**Efteranalysen i inkorgen + uttalandet.** Varje start sparar en
analyspost (avslutningen), och måndagens inkorg bär EFTERANALYSEN som
rapport: utfallet, förstamannens avgörande och läxa — och PRESSEN
VÄNTAR: uttalandet som beslut med toner formulerade ur utfallet
("Svårt att vinna från det läget" vid favoritfall, "Bra prestation
för den här klassen" vid pallplats, "Sånt händer — hon är bättre än
så här" vid bortkörning). Valet blir en pressnotis med din signatur
och en liten hypeeffekt. På köpet: analysens min-extraktion hade
SAMMA egen-flagg-bugg som v106 lagade i avslutningen — med
stallkamrater analyserades fel häst. Lagad via identitet.

**Lärlings- och bronsloppen som ställdes in.** Mätt: Lärlingsserien
7 av 14 inställda (snitt 4,3 anmälda). Två rattar utan motoringrepp:
lågklassloppen bär UTVECKLINGSVÄRDE i AI-nyttan (en start är värd
något i sig för vardagshästen), och arrangören VÄRNAR breddloppen —
nivå under 46 ger upp till +24 procentenheter körvilja i 4–7-spannet,
som i verkligheten där låga klasser hellre körs tunna än ställs in.
Efter: 2 av 14, snitt 6,8.

**Open stretch på loppkartan.** Kärnfynd: simulatorn HAR öppna
innerspåret (kol −1) men bildgenereringen klampade visningsraden till
0 — hästen på open stretch ritades som INNE. Klampen släppt (ren
observation, ingen dynamikändring) och närbilden ritar spåret:
streckad guldlinje och etiketten ÖPPET under INNE när loppet har
open stretch.

**"Få hästar pressar ledaren?"** Mätt med världens riktiga taktikval:
100 av 100 lopp har verkliga angrepp (någon rider >12 s utan rygg
utvändigt), 1,7 ledarbyten per lopp, ~20 s dödens per häst i snitt.
Pressen finns i motorn — upplevelsen kan vara visuell (närbildens
tempo). Ingen motorändring utan belägg: fånga gärna ett konkret lopp
som känns fel, så jämförs det mot siffrorna.

## Stallkamraternas röster i kusksamtalet (v112 — speltestfynd)

Ted körde två hästar i samma lopp — och kusksamtalet handlade bara om
den ena. Riktigt: samtalet byggdes när det bara fanns en styrd häst,
och v106:s stallkamrater kom aldrig in i det.

Nu får samtalet ett Stallkamraterna-block: varje kamrats kusk säger
sitt i ett eget samtalskort — spåret, den redan satta taktiken med
kuskens egna ord (»Jag laddar för spets — sen får vi se vem som vill
betala«, »Ryggläge och tålamod», »Jag tar det lugnt tidigt och litar
på avslutningen«) och en ärlig formkänsla ur hästens verkliga läge
(»känns riktigt fin i kroppen« / »har känts tyngre än vanligt«).
Kortare än huvudsamtalet med flit: deras taktik är redan bestämd —
det här är rösten, inte ett beslut. Ditt eget samtal med din kusk är
oförändrat: det är fortfarande där taktiken och slutordern sätts.

## Världens utveckling, etapp A (v111 — kap 20.8, Teds viktigaste)

"När du spelar tio säsonger ska världen vara helt annorlunda."
Hästarna åldrades och pensionerades redan — nu även människorna.
Ny motor engine-varldsutveckling.js, krokad i säsongsskiftet:

**Kuskkåren lever.** Varje kusk har en ålder — grundåldern hashas ur
namnet (24–55 år: en verklig kår har veteraner nära pension dag ett)
och stiger med säsongerna. Vid 58+ hänger de äldsta upp sulkyn, högst
två per säsongsskifte så kåren glesnar i verklig takt. Varje säsong
DEBUTERAR en lärling ur namnpaketets listor (löpnumret stegas
deterministiskt förbi namnkrockar med 90-mannakåren): lågt arvode,
inga krav, ingen ryktbarhet — och hungrig startrelation. HELA spelet
läser den aktiva kåren: kuskväljaren, reservlistan, drömkuskarna och
världens fältrustning (aktivaKuskar i data-kuskar; rustaFält och
körVärldensVecka tar kåren; kuskEfterNamn hittar lärlingar när spelet
skickas med). Efter tio säsonger — provat — är tolv veteraner borta
och nio lärlingar inne: kuskkåren är en annan än den du började med.

**Sponsorsfären omsätts.** Varannan säsong lämnar en sponsortyp
sporten (hash-vald bland dem du inte har avtal med) och försvinner ur
erbjudandeflödet. En dörr som stod öppen är stängd.

**Pressen berättar** om varje förändring — pensioneringen ("En av
sportens största lämnar vid 61. Banorna blir sig inte lika."),
lärlingslicensen, sponsorpengarna — och därmed inkorgen och Sfären.
Allt hash-avgjort ur säsong och namn: ingen slump i motorflödet,
samma karriär ger samma värld. Tjugoförsta provsviten kör tio
säsonger och låser takten, åldersgolvet, krocksäkringen, den aktiva
kårens spegling och determinismen.

Kvar i 20.8 (etapp B): tränarstall som läggs ner eller tas över,
journalistgenerationerna, banrenoveringarna — och lärlingslicensernas
spelregler (18.6: viktlättnad i loppen).

## Ägarnas och kuskarnas röster (v110 — kap 19 C + FM-punkt 3–4)

Skötarmallen fick sällskap. Två nya röster i inkorgen, båda lästa rent
ur befintliga motorer:

**Ägarna ringer.** Tacksamtalet: en ägares häst vann i helgen — en
replikväxling färgad av ägartypen (den känslosamma "grät en skvätt vid
mållinjen", tävlingsmänniskan har "redan börjat fundera på nästa
lopp"). Så byggs Teds exempel "Anders uppskattar att du alltid ringer
efter loppen" — fast åt andra hållet: det är ägaren som ringer dig.
Och det otåliga samtalet: hästen har stått fem veckor och relationen
kärvar — "jag betalar träningsavgift varje månad och hästen står
hemma" — med ett VAL SOM BÄR RISK: »Lova en start inom tre veckor«
värmer kommunikationen nu (ägarKontakt +7) och bokför löftet med
deadline; »Var ärlig — hästen behöver tid« kostar lite värme (−2) men
bygger ingen bomb. Löftet FÖLJS UPP i veckomotorn
(följUppÄgarlöften i engine-agare, provad isolerat): startar hästen i
tid stärks relationen (+5) — passerar deadlinen rasar den (−12) och
ägaren säger det rakt ut i inkorgen veckan därpå: "Du lovade en start.
Det blev ingen. Jag glömmer inte sånt."

**Kusken sms:ar på måndagen** efter helgens körning, ur radens
VERKLIGA innehåll: segern ("hon svarade direkt när jag klickade"),
dödensresan ("vi fick betala hela vägen hem — inte hästens fel"),
pallplatsen, den grå dagen ("spara inte på henne för det — det fanns
mer än resultatet visar"). Relation ≥ 70 ger den trogna kuskens
tillägg: "som alltid, tack för förtroendet." Ingen mekanik — bara
människan.

## Statistiklagret (v109 — kap 20.3, FM-punkt 2)

"Man ska kunna grotta ner sig i siffror i timmar." Tjugonde provsviten
och två nya filer:

**Positionsdatan kompletterad — det brådskande.** Målraden klassade
position sedan v88 (dödens, utvändigt, rygg/inner, fri inner) men
LEDNINGEN saknades: ledaren räknades som "fri inner". Simulatorn fick
en ledningsräknare — REN OBSERVATION bredvid de befintliga
tidräknarna, inga beteende- eller slumpändringar, full svitkörning
grön före vidare bygge — och målraden klassar nu "ledningen" när
ledtiden dominerar. Och BANAN sparas i resultatraden från och med nu
(efterLopp och stallkamratbokföringen): samma argument som
positionsdatan — varje vecka utan är historik som aldrig kan byggas.

**engine-statistik.js** — ren läsning, ingen egen lagring:
hästStatistik (starter/segrar/topp 3-procent, bästa kilometertid,
tabeller per bana, startmetod, distansgrupp, POSITION och kusk) och
tränarStatistik (karriärtotalerna bär helheten — inte de trunkerade
raderna — plus segerprocent, snittintjäning per start, bästa bana,
främsta kusk och säsongstabell över bevarade rader). Ärligheten är
inbyggd: rader utan bana eller läge hamnar utanför sina tabeller i
stället för att gissas, och vyn säger att radaggregaten gäller de
bevarade starterna (upp till 24 per häst).

**Statistiken** — ny sida under Mer i Travbladets tabellestetik:
tränarkortet överst, sedan häst för häst med positionstabellen där
Teds lista står: Ledningen, Dödens, Rygg. Tomma tabeller förklarar
sig: "positionsdata sparas från och med varje ny start."

## FM-anatomin och de riktiga rösterna (v108)

Ted skickade en FM-skärmbild: lista, stor läsyta med avsändare och
roll, strukturerat innehåll, åtgärdsknapparna i botten, NEXT UNREAD.
"Något sådant fast mobilt" — och sedan: "titta även hur innehållet
ser ut. Story med sin personal och riktiga dialoger. Som ett mail,
rapport, sms, artikel."

**Anatomin (mobilt = lägen i stället för spalter).** LISTAN:
segmenterad i Post och Nyheter (FM skiljer Inbox från News),
prioritetssektioner, typformade rader, »Läs nästa olästa (N) →«
överst. LÄSVYN: hela ytan blir meddelandet — huvud med initial,
avsändare och ROLL (»Ulla · Förstaman«), läsningstypografi, detalj-
tabell, och åtgärdsraden KLISTRAD I BOTTEN som i FM: besluten som
knappar plus »Nästa olästa →« som bär en genom hela posten (byter
segment själv när posten är slut och nyheterna tar vid). Läsvyn
ersätter både förhandet och helskärmen — på en telefon ÄR läsvyn
helskärmen.

**Innehållet — varje typ är sitt format på riktigt:**
MEJLET: arrangörens brev med hälsning, styckad brödtext, anmälnings-
tider och »Med vänlig hälsning, Tävlingsledningen«. RAPPORTEN:
veterinärens med versalrubriker (STATUS / BEDÖMNING / REKOMMENDATION),
detaljtabell — och sista skadeveckan ett RIKTIGT VAL: följ planen
eller ge en extra vecka (skadan +1, orken +12 — verkställt i motorn).
SAMTALET: sponsorbudet som replikväxling med tankstreck, fem repliker
som låter som en människa i luren. SMS:EN: skötaren — stallets tredje
röst, skapad ur namnpaketet per karriär — hörs från stallgången varje
vecka med text ur hästens VERKLIGA läge: sliten häst ger frågan »ska
jag ge hen en lugn dag i hagen?« (ja: ork +8, form −1), pigg häst ger
»hen ville MER hela passet«, lugn vecka ger »ibland är ingenting det
bästa nyheterna«. ARTIKELN: pressnotiserna fick brödtext i tonens
tempo. MÖTET: genomgångens sektioner under versalrubriker (EKONOMI /
FORMEN / STARTERNA / SPONSORN / ATT HÅLLA I HUVUDET) — och läsvyns
brödtext radbryter (pre-line) så rapporter, repliker och signaturer
står som de ska.

## Verklighetens delning och inkorgens ansiktslyft (v107)

Ted frågade "men så funkar det inte i verkligheten?" — och det gjorde
det inte. Delningen är omskriven efter Svensk Travsports egna regler
("Hur delar man lopp?", travsport.se):

**Spontandelning (vanliga lopp):** ordinarie (poängsorterade upp till
platstaket) LOTTAS mellan avdelningarna — deterministisk hästhash per
lopp och vecka, subjektoberoende så alla besked ser samma delning —
och RESERVERNA fyller på underifrån: strukna hästar får verklighetens
andra chans, och beskedet säger det ("Ni stod som reserv men fylldes
på — en andra chans"). **Delningsproposition (breddlopp, klasstak ≤
150 000 kr):** de anmälda listas efter startprissumma — lägst
insprunget möts i avdelning 1, nästa gäng i nästa. Ingen tränarhänsyn:
stallets hästar hamnar där pengarna faller. **Arrangörsbromsen:**
spontandelning kostar dubbla prispengar i verkligheten (ST:s
spontandelningspott är begränsad; främst unghästlopp och lägre klasser
delas) — här delar arrangören bara vardagsnivån; högre klasser
stryker. **Sammanhållningen från förra versionen är utriven** —
verkligheten SPRIDER tränarens hästar (seedad delning) eller struntar
i dem (delningsproposition); seedningen hör till uttagningslopp och
byggs med serierna (18.10). Följdbygge: anmälningskartan är nu STABIL
inom veckan (dubbelstartsskyddet flyttat till världskörningen), så
avdelning 2:s fält är identiskt med onsdagens besked även efter att
avdelning 1 körts — och helgen räknar körd PER HÄST: stallets hästar
i skilda avdelningar är två körningar, precis som för en riktig
tränare.

**Inkorgens ansiktslyft:** sektionsrubriker med antal och olästa,
tegelfärgad olästpunkt på varje rad, nyckelvärdet direkt i listan
(sponsorsamtalets "1 500 kr/v + 4 000 kr/seger" syns innan man
öppnar), nyheternas textrad tillbaka, veckomötet i eget tidningshuvud
(marin botten, "VECKANS GENOMGÅNG"-etikett) och förhandets
helskärmsknapp med klartext: »Läs i helskärm«.

## Stallets flera hästar och inkorgens ordning (v106 — spelrapporten)

Teds speltest hittade en riktig designmiss OCH tre följdbuggar:

**Flera egna i samma lopp — helt normalt i trav, aldrig hanterat.**
Uttagningen kördes per häst i isolering (hästarna såg aldrig
varandra), helgen prickade av LOPPET efter första starten (resten
låstes ute), och min-extraktionen ur simresultatet letade på
egen-flaggan — som med två egna pekade på den BÄST PLACERADE, inte den
styrda. Nu: uttagning(spel, lopp, häst, medEgna) räknar stallets alla
anmälda i loppet, SYMMETRISKT (samma anmälda mängd och sortering
oavsett vems besked som visas — provat: subjektet ändrar aldrig
fältet), vid delning hålls stallets hästar ihop i samma avdelning
(hästbestämt mål: dit poängbästa egna hamnade; platsbyte mot lägst-
poängade världshästar så storlekarna består). Helgen kör EN körning
per lopp: spelaren styr den först anmälda, stallkamraterna körs av
sina bokade kuskar (kusk + kuskens taktikval via samma välTaktik som
världen) i samma fält, alla arvoden dras. Efter loppet:
bokförStallkamrat — resultatrad i samma format, prispengar till kassan
efter kuskandel, startsumma, energi och form; press och ägardialog
förblir primärens (dokumenterad förenkling). Kamraternas placeringar
står i efter-steget, och min hämtas via IDENTITET, inte flagga.

**Inkorgens rörighet och valen.** Förhandet öppnades ÖVERST medan man
stod långt ner i listan — trycket såg ut att göra ingenting, och
besluten "gick inte att göra". Nu öppnas förhandet PÅ PLATS, direkt
under raden man tryckte, med besluten i sig. Och listan fick ordning:
tre sektioner med tunna rubriker — Kräver beslut, Förslag, Att läsa
(FM-punkt 16:s nivåer som RUM, inte bara kanter) — veckomötet fäst
överst, och en enhetlig radrytm så de olika meddelandeformerna står i
samma spalt i stället för att spreta.

## Veckomötet (v105 — kap 20.4, FM-punkt 6)

"Detta saknar nästan alla managerspel." Förstamannens veckans
genomgång är nu måndagens FÄSTA första rapport i inkorgen (händelse-
formatet fick fäst-fältet: fästa först, sedan prioriteterna) — skriven
i hans egen röst, där profilen färgar inledningen: fostraren ("Kaffet
är i, hästarna är ute"), pådrivaren ("Ingen lång sittning i dag"),
taktikern ("Jag har läst propositionerna två gånger och räknat en
tredje"). Sedan sektionerna med RIKTIGA siffror ur samma motorer som
resten av spelet: ekonomin (kassan, nettot och räckvidden i veckor när
det lutar fel), formen (vassaste hästen, och den som hänger efter),
starterna (anmälningsläget — eller förslaget när inget är inskickat),
sponsorläget (kravet och klockan) och problemen (skadelistan, ägare
som behöver ett samtal). Bara sektioner med något att säga.
Långtexten är byggd för v103:s förhand och helskärm: mötet LÄSES.

Plottrighetsprincipen håller: när genomgången bär ekonomisiffrorna
viker den lösa nettorapporten — den återkommer bara som eget beslut
när kassan inte täcker en månad. Utan förstaman: inget möte, ingen
låtsasröst. Stallmötets slots förblir mötets beslutsdel via genvägen.

Och provet betalade för sig direkt: sponsorsamtalet "avtalet löper
ut" (v99) läste spel.sponsor i SINGULAR — spelet lagrar avtalen i
spel.sponsorer. Notisen har aldrig kunnat avfyras i riktigt spel.
Lagad, och samtalet bär nu även kravläget.

## Kontinuitetsminnet (v104 — kap 20.2, FM-punkt 1: "allt kommer ihåg")

Spelet visste redan mycket — resultatrader, rivaliteter, loppnamn —
men refererade aldrig till det. Ny motor engine-minnen.js: ren läsning
av det som redan sparas, formulerad som kontextrader där laddningen
byggs.

**Karriärtotalerna börjar räknas.** spel.karriär (starter, segrar,
prispengar, storloppssegrar) bokförs i efterLopp, med en ÄRLIG
grundplåt för pågående karriärer: summan av nuvarande hästars rader —
sålda hästars starter saknas och det låtsas vi inte om. spel.loppfacit
minns stallets bästa insats per lopp, så »ni vann det här i fjol«
fungerar även när hästen är en annan. Rivaliteterna spårar nu också
VEM som vann senast — det är den raden man minns.

**Raderna landar på tre ställen.** Lottningen: Minnet-kortet (max tre
rader, viktigast först): »En seger i dag blir stallets 50:e«, »Möte 4
med Stormvind. Ställningen: 1–2. Senast vann Stormvind.«, »Provhästen
var 3:a i det här loppet senast — revanschen ligger framdukad.«
Efteranalysen: milstolpsraden med guldkant när siffran är jämn
(»Stallets 10:e seger — en siffra att skåla i«, första segern och
första storloppssegern får egna) — och ALDRIG annars: elfte segern är
bara en seger, ingen falsk högtid. Inkorgen: förstamannens sms på
måndagen när nästa seger ÄR siffran: »Jag räknade i går kväll.«

Nittonde provsviten: grundplåtens ärlighet, stolparnas trappa,
rivalradens ställning, loppminnets egen-mot-stallets, och att
milstolpsraden kommer exakt när siffran är jämn.

## Förhandsfönstret, helskärmen och storyn i posten (v103)

Teds riktning: nu när typerna sitter kan storydelarna flytta in i
inkorgen — men då behövs ett STORT förhandsfönster för valt meddelande
och möjlighet att öppna helskärm, för meddelanden kan vara långa och
storyn blir bättre av utrymme.

**Tre läsdjup.** Listan: kompakta rader per typ, en rad text, snabb
att skumma. Förhandet: valt meddelande öppnas stort överst i typens
formspråk — hela texten i styckad prosa, detaljraderna, besluten, och
helskärmsknappen. Helskärmen: hela sidan blir meddelandet — tidnings-
sida för nyheter (etikett, stor rubrik, långläsningstypografi med
640 px spaltbredd), fullformat för samtal och brev — och BESLUTEN
FÖLJER MED: man skriver på ett sponsoravtal från helskärmen.

**Långtexterna.** Händelseformatet bär nu ett valfritt lång-fält:
listraden nöjer sig med text (ingressen), förhand och helskärm visar
lång (hela brödtexten, styckad på tomrad).

**Storyn i posten.** Huvudnyheten blir ett urklipp med sin etikett,
ingress som listtext och hela brödtexten i långfältet — och
följetongens trådar (satsningen, comebacken, frågetecknet,
förstamannens framtid, eleven jagar) landar som notiser med riktig
prosa. Trådkällan flyttade till motorn (berättelsetrådar i
engine-inkorg) och DELAS med Sfären, så tidningen och posten aldrig
berättar olika. Sfären behåller sina — Teds ord var "också", inte
"i stället".

## Klockan synlig, inkorgen per typ, anmälan läsbar (v102)

Teds tre träffar efter v101 — alla rättvisa:

**"Vart hoppar man fram i tiden?"** Klockan fanns men syntes inte.
Headerns veckoruta visar nu VAR i veckan man står — »Vecka 6/18 ·
onsdag« — och inkorgens metarad likaså. Hoppa fram har ett synligt NU.

**"Inkorgen är inte alls som vi pratade om."** Rätt: dokumentets kärna
är att allt samlas i EN inkorg men PRESENTERAS OLIKA — och v99–v100
byggde en uniform lista med små typetiketter. Omgjord: sms är
chattbubblor med avsändarinitial, samtal är samtalskort (»Inkommande
samtal · väntar på svar«, stor avsändare, citatet i kursiv, svaren som
knappar — man BESVARAR ett samtal), mejl är brevkort med Från/Ämne
över en linjal, rapporter är trycksaker med dubbellinje, nyheter är
Travbladets urklipp (samma klipp-klass som tidningen). Besluten i
meddelandet och prioritetskanterna består.

**"Extremt mycket text i loppanmälan."** Bantad till fyra synliga
rader: kuskvarning och bedömning (bara när de avviker), distans-
varning (bara när den är dålig) och EN sammanfattningsrad (distans,
bana, förstapris, insats). Allt annat — proposition, klassläge,
startpoäng, bana/pris i detalj, resa, ekipaget, stängda lopp,
drömkuskar, insats- och riskrutan — bor under »Visa detaljer«, ett
tryck bort. Beslutet syns; fördjupningen väntar.

## Klockan (v101 — kap 20.1, Teds tidsidé)

"Det behöver inte vara nästa vecka man hoppar fram." Veckan förblir
motorernas ryggrad — allt är veckonycklat, och det rör vi inte — men
veckan har fått STOPP, och knappen är inte längre »Kör veckan« utan
HOPPA FRAM, till nästa stopp som har något åt dig:

**Måndag** — veckans start i inkorgen: träningen, mötena, marknaden,
och anmälningarna är ÖPPNA. Du skickar in (flera hästar går bra),
det kostar ingenting, hästen försvinner ur väljaren och kvittot säger
det viktiga: beskedet kommer onsdag. **Onsdag** — uttagningsbeskeden,
en anmälan i taget: kom ni med? struken? delat? kuskens bekräftelse
eller avhopp med reservval. Bara utfallet sparas — loppet väntar.
**Helgen** — loppdagarna: de bekräftade starterna körs i tur och
ordning genom det befintliga flödet (lottning, press, kusksamtal,
loppet, efteranalysen), med delningens avdelning återskapad ur samma
deterministiska uttagning som onsdagens besked.

Tomma stopp slås ihop: en vecka utan anmälningar hoppar måndag → ny
vecka direkt, och ett hopp som låter obesvarade besked eller okörda
lopp förfalla VARNAR PÅ KNAPPEN (»väntande starter förfaller«) — inget
upptäcks efteråt. Hoppknappen finns i stallet och i inkorgen;
veckoväxlingen landar i inkorgen, mellanstoppen i loppfliken, och
inkorgen känner rytmen: onsdagens »Uttagningsbeskeden har kommit« är
en beslutshändelse, helgens »Loppdag« ett sms från förstamannen.

Det här löser den gamla skavanken att anmälan → uttagning → lopp
skedde i en enda sittning: spänningen i beskedet bor i väntan nu.
Artonde provsviten (prov-klocka.mjs) låser sammanslagningen,
övergångarna, förfallovarningen och att veckoväxlingen körs exakt en
gång — med injicerbar växling så logiken provas utan spelbygge.

## Inkorgen som beslutsrum (v100 — kap 19 etapp B+C)

Teds precisering efter v99: ALL kommunikation i spelet går genom
inkorgen — och man ska AGERA i notisen, inte länkas vidare jämt.

**Expandera i raden.** Trycket öppnar notisen på plats: hela texten,
detaljrader (sponsorbudets ersättning, förmån och krav) och knapparna.
Genvägen finns kvar men degraderad till en sekundär »Öppna →«-knapp
för den som vill se sammanhanget. Läst markeras vid öppning.

**Beslut direkt i inkorgen.** Händelseformatet bär nu beslut { typ,
ref, alternativ }, och verkställBeslut() muterar spelet med SAMMA
funktioner som vyerna — inkorgen är en dörr till motorerna, aldrig en
egen regeluppsättning. Två riktiga beslut i v100: sponsorerbjudandet
(»Skriv på« kör Kontorets teckna(), »Tacka nej« dess tackaNej()) och
förstamannens träningsjustering (»Lägg om enligt råden« applicerar
träningsråd på alla friska hästar med ett tryck — frågan självslocknar
när avvikelserna är noll, och »Behåll min plan« tystar den till nästa
vecka via inkorgBeslutade + veckbundna id:n). Vägvisarens gamla rader
för samma ärenden filtreras: en fråga ställs aldrig två gånger i samma
inkorg.

**All kommunikation genom inkorgen.** Hems tre sista kommunikations-
ytor flyttade in: förstamansraden, samtalskortet och hela Nästa
steg-panelen (vägvisarens rader ÄR förstamannens sms, med genvägar).
Hem är nu: gårdsbilden, bågkortet (en plan), Längre fram (riktmärken)
och ekonomifakta. Och veckorytmen (etapp B): »Kör veckan« landar i
inkorgen — den nya veckan börjar med vad har hänt och vad bör jag
göra, som i FM.

## Inkorgen, etapp A (v99 — kap 19, Teds FM-dokument)

Teds insikt ur många års Football Manager: inkorgen är inte en funktion
utan spelets motor — nästan varje beslut börjar där. Etapp A lägger
grunden: HÄNDELSEFORMATET och ett eget rum.

**engine-inkorg.js** — formatet { id, avsändare, typ, prioritet,
rubrik, text, flik } med dokumentets fem typer (sms, samtal, mejl,
rapport, nyhet) och tre prioritetsnivåer (beslut / rekommendation /
info). DERIVATION, INTE DUBBELLAGRING: veckans inkorg härleds ur
spelets tillstånd vid varje anrop — id:n är stabila innehållshashar,
så lästmarkeringarna (spel.inkorgLästa, takad till 120) överlever
omrendering utan att sparfilen växer. Adaptrarna läser BEFINTLIGA
motorer: vägvisaren blir förstamannens sms (akut ton = beslut krävs),
propositionsmotorn blir arrangörens mejl ("3 propositioner passar
stallet" — räknat med SAMMA loppläge som anmälans väljare, så inkorgen
aldrig lovar mer än loppfliken håller), skador blir veterinärrapporter,
negativt veckonetto en kontorsrapport (beslut när kassan inte täcker
en månad), sponsoravtal på upphällningen ett telefonsamtal, pressen
Travbladsnyheter.

**ui-inkorgvy.js** — egen flik mellan Hem och Stall, i Travbladets
estetik: typografiska etiketter i trycksvärta (SMS/TEL/BREV/RAPPORT/
NYTT), tegelkant på beslut, guldkant på förslag. Varje rad är en
genväg: trycket markerar läst och tar spelaren till vyn där man agerar
— aldrig en återvändsgränd. Flikraden bär ett olästmärke (ren CSS ur
data-attribut).

Sjuttonde provsviten (prov-inkorg.mjs): id-stabilitet, unika id:n,
prioritetssorteringen, att varje genväg pekar på en verklig flik och
att källorna täcks. Kvar i kap 19: B veckobrevet (öppnas vid ny vecka,
ersätter Hem-panelen), C beslutshändelser, D karriärdagboken.

## Avviker-läxan, avplottringen och guidningen (v98)

Teds skärmdump från produktionen: »Can't find variable: avviker« —
v90-flytten till vägvisaren tog variablerna men lämnade förstamans-
repliken som läste dem. Lagningen är två rader; LÄXAN är större:

**Verifieran fick en riktig stackmaskin.** Anropskontrollen såg bara
`namn()` — nakna variabler i mallarna slank igenom. Nu skalas koden med
en tillståndsstack (kod/kod-i-mall/kod-block/mall/rad/block/strängar)
som klarar nästlade html-mallar och räknar vanliga klamrar (en
destrukturering fick tidigare mallnivån att poppa i förtid), och ALLA
identifierare i ${...}-uttryck prövas mot deklarationer, importer,
pilparametrar och multideklarationer. Sabotagetestad åt båda hållen.

**Avplottringen (Teds tre punkter).** (1) Väljarna visar bara det som
går att välja: stängda lopp blev en orsaksrad UNDER loppväljaren
(»Stängda för Rimfrost Bris: Guldstoet — öppet endast för ston«),
drömkuskarna en aspirationsrad, de uppbokade helt ute (de syns ändå i
startlistan). Transparensen är orsaken, inte skräpet. (2) Storyn bor i
Sfären: tidningsklippet och berättelsetrådarna lämnade Hem — Travbladet
äger allt redaktionellt, Hem är VAD GÖR JAG NU (bågkortet stannar: det
är en plan, inte en story). (3) Guidningen där beslutet fattas:
förstamannen föreslår en FÄRDIG anmälan överst i loppfliken — häst i
form, bäst bedömda loppet, kusk som bekräftar direkt — och ett tryck
fyller i alla tre valen. Gamla matchningskortet gick upp i förslaget:
ett guidningskort, inte två konkurrerande.

## Kuskbokningen (v97 — manualen kap 9)

Kusken slutar vara en rullista och blir en relation med villkor. Tre
statusar, synliga redan i väljaren (data-kuskar äger dem):
"bekräftar" — tackar ja och står vid sitt ord; "preliminär" — de fem
mest eftertraktade kuskarna tackar preliminärt ja men kör helst
loppets bästa häst; "upptagen" — redan bokad i loppet (embryot från
v62, nu med namn).

**Bekräftelsen** prövas i uttagningsbeskedet, när fältet är känt:
stjärnkusken jämför din häst mot loppets bästa MED KUSKENS ÖGON — samma
kapacitetsmått som AI-tränarnas skattning, aldrig en titt i
simuleringen. Bland fältets tre bästa håller bokningen alltid. Annars
avgör relationen: vid 70+ hoppar stjärnan aldrig (den som kört för dig
i åratal står vid sitt ord), därunder är risken deterministisk ur
kusk + lopp + vecka — samma besked varje gång, aldrig ett omtärnat.
Avhoppet kommer i klartext på telefonen (»Fältets bästa är svår att
tacka nej till. Inget illa ment.«) och pekar alltid på hästen kusken
väljer i stället — som finns i fältet på riktigt.

**Reserven:** vid avhopp väljs ersättaren direkt i beskedet bland sex
villiga, med status och arvode synligt; arvodet som dras är reservens.
Struket eller inställt frigör bokningen utan kostnad som förut.
Kuskvalet blir därmed strategiskt på riktigt: stjärnan är bäst i
sulkyn men en risk bakom en halvbra häst — trotjänaren med hög
relation är garantin.

Provsviten: vanlig kusk hoppar aldrig, topp-tre-häst håller alltid
bokningen, hög relation gör stjärnan trofast, risken är risk (25 av 40
veckor bakom fältets sämsta) och avhoppet pekar på rätt häst.

## Delningen och bedömningsnivåerna (v96 — anmälan komplett)

Två manualbitar som gör anmälningsprocessen hel:

**Delningen (6.6).** Stor överanmälan i vardagslopp (fem eller fler
över platstaket) ger inte längre en strykningslista — loppet DELAS i
avdelningar och alla kommer med, precis som i svensk travvardag.
Poängsorterad round-robin ger jämna avdelningar (provet mäter
poängsummorna: ingen b-final), ren ceil utan avdelningstak (kartan kan
ge en populär proposition 37+ anmälda — tre avdelningar à 13 vore ett
regelbrott), och storlopp/V85 delas aldrig: deras fält ÄR poängen.
Spelarens avdelning får numret i loppnamnet så facit och loppboken
berättar rätt, och världsveckan delar med SAMMA funktion (delaFält
skickas in av veckomotorn) — världens delade lopp kör alla sina
avdelningar och delar ut prispengar i varje. Strykning finns kvar men
bara i mellanregistret (en till fyra över taket) — dramatiken sitter
där den ska.

**Bedömningsnivåerna (6.3).** Lämplighetsbedömningens precision beror
på organisationen. Nivå 0 — ingen förstaman: bara Berättigade/Inte
berättigad, ärligt sagt ("ingen lämplighetsbedömning utan förstaman");
regelfakta som behörighet och klassklättringsvarning får alla. Nivå 1 —
förstaman: de fyra grupperna. Nivå 2 — taktikern ("läser propositioner
som andra läser romaner") eller fem säsonger hos dig: siffrorna —
fönsterläget i procent och SENAST KÄNDA uttagningsgränsen i klassen,
arkiverad ur era egna uttagningar när beskedet bekräftas. Taktikern
minns det ni sett — inte det ni aldrig var med om.

## AI-tränarnas loppval (v95 — tävlingssystemets etapp D)

Världens tränare slutar vara statister. Ny motor engine-aitranare.js
ger manualens kap 12: varje stall väljer lopp åt sina hästar med VIKTAD
NYTTA — vinstchans, prispengar, utveckling, försiktighet — enligt sex
profiler (FILOSOFIER utökade med vikter; sjätte profilen "jagar
prispengar" ny). Ofullständig information är modellens mening:

**Synfelet.** Varje tränare över- eller undervärderar varje häst med en
hash-stabil bias skalad av profilens synfel — övertygelse, inte brus:
den övervärderade stjärnan förblir övervärderad, och 2 av 108
anmälningar i provet är felbedömningar klart uppåt. Rimliga misstag.

**Klassklättringsmedvetenheten** läser SAMMA klassklättring() som
spelarens varning: "tålmodig" värderar klättringsloppet mätbart lägre
än "jagar prispengar" — provat med samma häst, samma lopp, samma
synfel, bara profilen utbytt.

**EN anmälningskarta för hela spelet.** veckansAnmälningar(spel) är ren
hash — noll slump — och driver BÅDE spelarens uttagning (engine-anmalan
läser den; specialloppen minne/inbjudan behåller fönstermetoden) och
världsveckan (körVärldensVecka får kartan som argument av veckomotorn —
världsmotorn importerar aldrig uppåt). Konsistenslöftet: hästen som
slog dig i uttagningen kör faktiskt det loppet när världen körs, och en
struken AI-häst omplaceras inte — den vilar. Trösklarna delas via
arrangörenKör() så spelarens och världens lopp aldrig divergerar.

**Balansläxan i två steg, fångad av proven:** strikt argmax flockade
alla till samma lopp (22 anmälda till ett, var tredje lopp inställt) —
nu väljer hash bland loppen inom femton procent av toppnyttan, vilket
gav 7 % inställda och 67 % överanmälda över 136 provlopp. Sextonde
provsviten (prov-aitranare.mjs): kartans determinism, ett lopp per häst,
bara berättigade val, synfelets stabilitet, profilskillnaden och en hel
världssäsong där 170 av 182 hästar kommer till start via tränarnas val.

## Spårtrappan (v94 — tävlingssystemets etapp C, utan motoringrepp)

Etapp C skulle röra loppmotorn — men inventeringen visade att
motorarbetet redan var gjort, precis som voltens tillägg: spårfördel i
data-lopp bygger sedan länge på Svensk Travsports statistik över 33 958
lopp (puckeln: spår 4–5 vinner mest, spår 1 bara 10 %), andra ledet
straffas för att man inte styr sin egen start (9 bakom 1, 10 bakom 2),
springspåren och andra volten finns. Det som saknades var manualens
transparenskrav: MODELLEN VAR OSYNLIG FÖR SPELAREN.

**spårkaraktär() och spårtrappa()** i data-lopp läser exakt samma
fördelstal som utlösningen räknar med — trappan kan aldrig ljuga om
motorn (provat: varje trappsteg jämförs mot spårfördel). Lottningssteget
visar spårläget i klartext (»tian — andra ledet: du styr inte din egen
start; närmast framför står Rimfrost Bris«), guldlägen får guldkant och
svåra lägen varningsfärg, plus trappans sammanfattning: bäst och svårast
i dag. Kuskens läsning i kusksamtalet använder samma karaktär och
namnger hästen man startar bakom. Rättelse på vägen: voltens spår 8–12
är ANDRA VOLTEN (straffad i fördelen sedan länge) — karaktärstexten
säger det nu i stället för att låtsas att de står i första.

Ingen motorändring, ingen omkalibrering — bara samma kunskap på båda
sidor om skärmen. Etapp C:s återstod (situationsberoende bakspårsdjup
vid olika fältstorlekar) flyttas till förfining.

## Anmälan som process (v93 — tävlingssystemets etapp B)

Platsen i loppet är inte längre garanterad. Ny motor engine-anmalan.js
lägger uttagningen mellan anmälningsknappen och lottningen — spelarens
flöde, aldrig AI-veckans eller kalibreringens (byggFält är orörd).

**Anmälningsläget är ett faktum.** Världshästarna i klassfönstret
anmäler med två tredjedelars vilja, deterministiskt ur häst + lopp +
vecka (seedat urval enligt UI-hashregeln): samma lopp ger samma anmälda
hur många gånger spelaren än prövar, och spelets övriga slumpflöde rörs
inte. Balansen provkalibrerades: 1,6 × fönster och 76 % vilja gav 87 %
överanmälda lopp — tjat, inte dramatik — och justerades till 1,5 × och
66 %, vilket ger överanmälan ungefär varannan gång.

**Trösklarna (manualen 6.6):** 0–3 anmälda ställs in, 4–7 är
arrangörens beslut (deterministiskt viktat: sex anmälda körs oftare än
fyra), 8+ körs alltid. Ett arrangörskört tunt fält FÖRBLIR tunt — inga
påhittade hästar fyller ut spelarens lopp längre.

**Uttagningen (7.1):** startpoängen avgör — även för världens hästar,
vars loppbok bär pris per start sedan v93 (äldre rader ger bara
placeringspoäng tills de rullat ut: ärlig migrering, ingen skattning).
Ostartade går före i lopp med pengatak — det är där karriärer ska
börja. Vid lika poäng skiljer klassmeriterna (startsumman),
dokumenterat i beskedet i stället för godtycklig listordning.

**Beskedet:** alltid siffrorna — anmälda, platser, gränsen, din poäng —
och struken eller inställd anmälan kostar ingenting (kusken kördes
aldrig; arvodet dras först när platsen är klar) samt föreslår upp till
två berättigade alternativ samma vecka, bäst bedömning först. Spelaren
lämnas aldrig i en återvändsgränd.

Femtonde provsviten (prov-anmalan.mjs): determinism, trösklarna i 136
lopp över 25 världar, gränsen = de uttagnas lägsta, ingen struken över
gränsen, företrädesregeln och alternativens ordning.

## Klassningen och loppväljaren (v92 — tävlingssystemets etapp A)

Första etappen av Teds tävlingsmanual: transparensen före regelbredden.
Ny motor engine-proposition.js — förklaringsmaskinen. Loppmotorn vet
inte att den finns.

**Regelefterlevnaden först.** De fastställda taken bor nu som centrala
valideringsgränser i data-lopp.js (STARTREGLER: bil 12, volt 15 varav 12
per distans, monté 10). Kalendern bröt regeln: startmetoden slumpades
oberoende av klassens fältstorlek, så ett lärlingslopp kunde bli
AUTOSTART MED 15 HÄSTAR. Nu tar byggLopp min(klassens storlek, metodens
tak). Volten var däremot redan regelrätt — motorn har haft tilläggslogik
hela tiden (spår 13–15 startar 20 m bakom, förstaVolt: 12), vilket
krympte etapp C rejält. OMKALIBRERINGEN: fältstorleksändringen flyttar
siffrorna med flit — jämförelsen visar allt inom seedspann, målen ligger
kvar (ledningen 40,8 % mot mål 42 ✓) och de kända avvikelserna är
oförändrade i karaktär (rygg ledaren +6, andra utvändigt −4). Ingen ny
avvikelse infördes.

**Behörighet med exakta orsaker (manualen 2.3, 6.2).** behörighet()
svarar med bådas siffror: »startsumman 312 400 kr överstiger loppets tak
250 000 kr« — aldrig bara »högst 250 tkr«. Kalenderns startförbud ligger
kvar som säkerhetsnät så att två regler aldrig pekar åt olika håll.

**Loppväljaren i fyra grupper (6.2).** Anmälans loppval är nu optgroups:
Rekommenderade / Möjliga / Riskfyllda / Inte berättigad — de stängda
VISAS med orsak men går inte att välja, och byter spelaren häst hoppar
valet från ett stängt lopp till första berättigade. Riskfylld = hårt
inne i klassen (startsumman i pengafönstrets nedre fjärdedel), möjlig =
berättigad med utpekad distansnackdel. Bedömningsraden i loppfakta säger
vilket och varför.

**Klassklättringsvarningen (3.2) — manualens bästa spelidé.** I insats-
och riskrutan, FÖRE anmälan: »En seger lyfter startsumman till 290 000
kr — Bronsserien stängs.« Räknad mot samma klassgränser som kalendern
bygger loppen av; ingen varning när taken är långt borta.

**Startpoängen (7.1) räknas och visas.** Fem senaste starterna,
400/200/100/50/25 plus en poäng per vunna 100 kr — resultatraden har
sparat pris per start länge, så poängen räknas retroaktivt ur befintligt
data. Visas med begriplig prognos (»god chans att komma med vid
överanmälan«) i anmälans Din häst-rad och på hästsidans karriärflik,
tillsammans med nivåetiketten (»låg klass · passar oftast i lopp med
X–Y kr i förstapris« — vägledning, aldrig spärr). Uttagningen poängen
styr är etapp B.

Fjortonde provsviten (prov-proposition.mjs): hela säsongens 110 lopp
regelprövade, orsakstexterna sifferexakta, gruppprioriteringen,
varningens matematik och poängmodellen till punkt och pricka.

## Pälsskiftet, verifieraskärpningen och vägvisaren (v90)

**Kraschen.** Stallvyn föll med »Can't find variable: pälsskifte« —
funktionen anropades på två ställen men fanns INGENSTANS, och felet
fanns redan i v83-zippen: Hästbildens dokumentation har hela tiden
beskrivit den ("stallvyn räknar hästens plats bland stallkamrater med
samma päls, så tvillingfoton inte hamnar sida vid sida") men den skrevs
aldrig. Nu finns den, exakt som lovat, deterministisk enligt hashregeln.

**Läxan in i verifiera.** Ägarkontrollen från v70 kräver att namnet
EXPORTERAS av en modul för att bevakas — ett anrop av något som inte
finns alls sågs aldrig, och modulladdningen ser det inte heller
(referensen ligger i en komponentkropp som körs först vid rendering).
Ny kontroll: varje anropat namn måste vara deklarerat i filen
(funktion, konstant, parameter, destrukturering, metod eller import)
eller exporterat någonstans. Strängar och kommentarer blankas av en
riktig TECKENSKANNER — inte regex — så htm-mallarnas prosa försvinner
men koden i ${...} behålls: det var ju precis där kraschen bodde.
Kontrollen sabotagetestades (påhittad funktion → larm → återställt).

**Vägvisaren (kap 16).** Teds återkommande punkt: spelaren ska bli mer
ledd framåt. engine-vagvisare.js äger nu riktningen — vyer renderar,
motorer härleder: nästaSteg() flyttar hela uppgiftslogiken från hemvyn,
utökar den (formstark häst → »planera nästa start«, fullt stall → »dags
att bygga ut«) och SORTERAR efter angelägenhet så att första raden
alltid är veckans viktigaste. långsiktigt() (16.2) visar de två
NÄRMASTE onådda milstolparna med verklig progress — sex hästar,
halvmiljonen, större sponsor, miljonen, tre ägare med högsta
förtroende — i ett »Längre fram«-block på Hem. Uppnådda försvinner
tyst: riktmärken, inte uppdrag, ingenting belönas för att bockas av.
veckonetto flyttade samtidigt från ui-kontorvy till motorn där den hör
hemma. Trettonde provsviten (prov-vagvisare.mjs) låser sorteringen,
förutsättningarna, progressräkningen och pälsskifteslogiken.

## Travbladet (v89)

Journalisten dömer världen på om den producerar riktiga berättelser
eller slumpmässiga rubriker (kap 5). engine-travblad.js är redaktionen —
den värderar, räknar och frågar, men hittar aldrig på fakta.

**Förstasidan i Sfären (5.3, designförslag 9).** Nyhetsvärderingen
byggs av händelsemotorns betydelse: uppslaget är veckans TYNGSTA färska
händelse (≥ 55 — en lunchseger får aldrig ett uppslag), artiklarna är
pressens laddade rubriker från de två senaste veckorna i .artikel-mallen,
notiserna resten. Pressmallarnas tre storlekar från v55 bär äntligen en
hel förstasida, med TRAVBLADET-vinjett i tidningshuvudstil och kommande
storlopp som notis ur bågen.

**Statistikerns kolumn och krönikan (5.2, 5.5).** Janne Fyhr räknar
bara tal som finns: ligaplaceringen, stallformen, favoritfacit ("2 av 3
senaste favoritstarterna på pallen") och marknadsbilden. Cecilia Ramnek
läser samma siffror kritiskt — och kritiken KRÄVER facit: mönsterkritik
först vid tre favoritmissar i följd, kassakritik vid kris, formkritik
under 38. Annars saklig, ibland varm. Sportjournalistik, inte dokusåpa.

**Pressfrågan med minne (5.4).** Pressteget före loppet läser hästens
presshistorik (skriven av efterLopp: valet arkiveras med resultatet).
Prioriteringen följer nyhetsvärderingen: gamla förstamannen i fältet
slår allt (»Kim Ek möter dig som tränare för favoriten — hur känns
det?«), sedan det brutna löftet (»Förra gången lovade du seger och
hästen blev 6:a«), sedan tre nedtoningar i rad — sist den vanliga
frågan. Deterministiskt ur historiken, ingen slump.

**Favoritfacit och krönikörens kritik i pressen (5.5).** efterLopp
bokför varje favoritstart; tre missar i följd ger en kritikartikel av
krönikören i pressflödet — EN gång per svit, och en pallplats som
favorit nollställer. Statistikern och krönikan läser samma facit.

Tolfte provsviten (prov-travblad.mjs): hierarkin håller, statistikern
räknar rätt, kritiken kräver facit, frågeprioriteringen sitter och
veckomotorn bygger minnet. Kvar i kap 5: berättelsetrådar som följetong
(5.1 — Hem har trådarna, tidningen kunde följa upp dem) och fler
journalistidentiteter (5.2 har tre av sex).

## Efterloppsanalysen (v88)

Kapitel 14 ordagrant: efter loppet ska spelaren förstå vad planen var,
vad som hände, vilket beslut som blev avgörande, vad hästen gjorde bra
och vad nästa steg bör vara. Allt läses ur simuleringen som redan körts
(engine-analys.js) — bildrutorna och resultatet — med noll slump och
noll motorpåverkan i analysen själv. Samma lopp ger samma analys.

**Planen:** grundorder, din rekommendation och KUSKENS BESLUT — motorn
rapporterar nu utfallet strukturerat (`sim.ingripandeUtfall`, satt i
ingripande-branchen; omkalibrerad enligt järnregeln: identisk) i stället
för att analysen skulle strängmatcha referatet.

**Resan (plan 3.7):** position och läge vid 1 500/1 000/500 kvar,
attackpunkten (sista gången hästen lämnade innerspåret), meter i
ledningen/dödens/tredjespår, utan rygg (motorns sekundmått × 13),
extra löpt väg, instängd på upploppet, tempot öppning → avslutning
(ledarens fart som km-tid) och kraft kvar i mål. Skattningar ur
bildrutorna — samma upplösning spelaren såg loppet i, vilket är rätt
anspråksnivå, och rader under tröskelvärden visas inte alls.

**Avgörandet:** EN sak, viktigast först — galopp, sen instängning med
kraft kvar ("bittraste sortens förlust"), vägrad attack ("rätt beslut av
kusken; frågan är varför tanken var tom"), dödensresan (som kostnad
eller som bragd beroende på utfall), spetsen, tajmingen, eller ärligt:
ingen enskild vändpunkt. **Att ta med:** max två saker hästen gjorde
bra, lästa ur datat. **Nästa steg:** förstamannens rekommendation —
beräknad EFTER efterLopp så att den ser hästens verkliga läge, inklusive
en skada loppet just gav: vila vid tom tank, distansvarning ur
passningen, klassråd ur strecket, offensivare resa efter instängning.
Rollprincipen från v87 håller hela vägen: analysen är tränarens läsning
och förstamannens råd — aldrig ett facit om vad kusken borde ha känt.

prov-analys.mjs (elfte sviten): determinism över 60 lopp, fysiskt
rimliga mått i 60/60, attackpunkt och positioner lästa ur rutorna,
vägrad attack pekas ut i avgörandet och tom häst ger vilorekommendation.

## Kusken beslutar (v87)

Teds princip, nu inbyggd: TRÄNAREN KAN BARA GE REKOMMENDATIONER — det
är kusken som sitter bakom hästen, tar besluten och känner hur mycket
krafter som finns kvar. Slutordern är därför en rekommendation kusken
väger mot känslan: en attack följs bara om det finns något att attackera
med (kraft ≥ 30 vid punkten, kuskens känsla — spelaren ser aldrig
siffran). Är tanken tom vägrar kusken driva hästen och kör sin egen
tajming, och REFERATET berättar det: »Kim känner efter bakom Rimfrost
Bris — det finns inget att attackera med.« Följs rekommendationen syns
även det: »— som det var sagt i stallbacken.« Bedömningen är
deterministisk (noll nya slumpdragningar; branchen körs bara med
ingripande, aldrig i kalibreringen — omkalibrerad ändå enligt
järnregeln: identisk). prov-beslut.mjs fick tre nya prov: varje
rekommendation vid punkten lämnar exakt ett spår i referatet, kusken
vägrar ibland (22 av 77 attacklopp), och aldrig båda spåren i samma
lopp. Kusksamtalets språk följer med: "din rekommendation för resan",
och kusken lovar att väga in den — inte att lyda. Grundordern har alltid
fungerat så i motorn (taktiken är en ambitionsterm, inte ett skript);
nu säger spelet det högt.

## Allt sägs i stallbacken (v86)

Beslutsfönstret från v84 pausade loppet vid 500 kvar — men i trav finns
ingen radio, och tränaren pratar inte med kusken mitt i loppet. Teds
beslut: ALLT sker före loppet. Så pausen är borta och kusksamtalet blev
större — en riktig körorder i två delar:

**Kuskens läsning.** Samtalet öppnar med spåret, favoriten och en ÄRLIG
tempoläsning: motståndarnas körorder är redan satta i rustaFält, så
"minst tre vill till spets" är fältets verkliga plan, inte en påhittad
replik. Exakt utfall vet ingen förrän bilen släpper — läsningen är
kuskens, inte facit.

**Grundordern** — resan, som förut (spets, rygg, utvändigt, skydd,
spurt) med kuskens motiverade förslag.

**Slutordern** — NÄR avgörandet sätts in: "Gå på vid 500 kvar", "Spara
allt till upploppet", eller "kusken avgör" (ingen order — kuskens egen
tajming via avslutningsförmågan, som alltid). Rekommendationen läses ur
hästen (spurtare → vänta, orkeshäst → tidigt) och kuskens stil färgar
replikerna: en otålig kusk ÄLSKAR ordern att gå tidigt och lovar inget
om att sitta still — den klassiska konflikten spurtare/otålig kusk ska
SYNAS i samtalet. Ordern följer med in i motorn som `ingripande` — samma
mekanik som v84, applicerad vid ~500 kvar, noll nya slumpdragningar,
kalibreringen orörd, prov-beslut.mjs oförändrat grönt. Ingen paus, ingen
omsimulering, ingen seed: loppet körs en gång med allt bestämt, precis
som i verkligheten. Att ändra grundordern går med en tillbakaknapp innan
slutordern låses.

## Beslutet, mötet och kontoret (v84)

Spelkänslelyftet plus verksamhetsspelets grund — fyra system i en batch,
med loppmotorn rörd på EN punkt och omkalibrerad till identisk siffra.

**Slutordern** (byggd som beslutsfönster i v84, flyttad före loppet i
v86 — se det avsnittet). Motormekaniken: `simulera(fält, lopp, { vid:
500, order })` lägger ordern som en flagga på spelarens häst när gränsen
passeras, UTAN en enda slumpdragning. "Attack" tvingar spurten, höjer
utflyttningschansen (×2,6), öppnar tredjespåret och sänker kraftspärren
till 14 — avgörandet kommer vid punkten, och håller inte krafterna står
man still på upploppet. "Vänta" sitter still till 240 kvar — mer i
tanken, men vägen måste öppna sig. KALIBRERINGSLÖFTET: utan ingripande
ändras ingen kodväg — `node kalibrering.mjs` gav IDENTISK utskrift till
decimalen mot baslinjen (diffad, inte skattad). prov-beslut.mjs låser
löftena: determinism, identiskt prefix före ordern (6/6 lopp), verklig
effekt (attack ändrar utfallet i 38 % av loppen, vänta i 23 %) — och att
attack INTE är en vinstknapp (snittplacering ±0,24). Ordern läggs bara
på spelarens häst; världen och kalibreringen ser den aldrig.

**TV-läget och analystabellen (plan 13.1).** En växel över trackingen:
TV visar tätgruppen plus den egna hästen — banan och rösten bär. Analys
visar hela fältet med läge, avstånd, fart och kraft, och kolumnfärgen
till vänster ÄR ryggkedjan: benvit rand innerspåret, tegel ytterraden,
guld tredjespår. Båda läser samma bildrutor; ingen ny data i motorn.

**Stallmötet och veckoslotsen (plan 4.1, engine-stallmote.js).** En
tränares vecka är inte oändlig: snabbjobb, intervaller och startjobb är
KRÄVANDE pass, och organisationen orkar 3 per vecka + 1 för rakbanan,
+ 1 för backen, + 1 för förstamannen. Gränsen verkställs i körVecka —
överskott (i stallordning) flyttas ned till lugnt jobb med besked i
rapporten, så äldre sparfiler aldrig kraschar — och gränssnittet stänger
chipsen när veckan är full (samma komponent i hästkort och hästsida).
Stallmöteskortet visar slotsläget och källorna, och "Låt förstamannen
lägga planen" går genom `läggPlanMedSlots`: lägst form prioriteras till
de hårda passen. Designgränsen från v51 står: slotsen påverkar VECKAN,
aldrig loppmotorn.

**Insats & risk i anmälan.** En guldkantad ruta före Anmäl-knappen:
insatsen (arvode + resa — betalas oavsett), kraftkostnaden (14–24 energi
mot hästens aktuella), uppsidan (förstapris/garanterat), galopprisken
(EXAKT simuleringens travsäkerhetsformel plus voltstartens påslag),
skaderisken (efterLopps trösklar: sliten häst, ålder) och ägarkravets
nedräkning. Rutan hittar inget på — den läser vad motorn redan vet.

**Hästsidans fem flikar (designförslaget).** Översikt (staplarna,
personligheten läst ur lynnet, rekordet, senaste fem, träningen),
Karriär (siffrorna, loppfacit och milstolpstidslinjen), Form (formkurvan
— en SVG-tidningsgraf ur dagboken — plus dagbokstabellen), Mål (nästa
start via förstamannens riktiga loppmatchning, ägarkravet, närmaste
milstolpe härledd ur karriärläget) och Relationer (ägaren med relationen
ur ägarboken, kuskarna som kan hästen ur kuskbekant-datat, rivalerna).
Hästen som individ med historia — inte en rad värden.

**Ägarsystemet (kap 7, engine-agare.js).** Fem ägartyper i data-agare.js
— småägaren, uppfödaren, företagaren, storsatsaren, travfamiljen — och
typen avgörs av namnets hash: samma ägare är samma person i varje
karriär. Nöjdheten har TVÅ dimensioner (man kan vara nöjd sportsligt men
trött på tystnaden): sporten byggs av loppen, där efterLopps delta
skalas med typens resultatkänsla (storsatsaren glömmer aldrig en floppad
favorit), kommunikationen svalnar 1,2/tyst vecka och lyfts av möten och
av att ägarens häst kommer till start. Sammanvägningen skrivs till
`r.relation`, så ALLT befintligt (hästerbjudandet vid ≥ 80 i
engine-personal, kravlogiken i engine-vecka) fungerar orört — och äldre
sparfiler migreras i säkraÄgarprofil utan att tappa byggd relation.
Konsekvensen: under relation 18 flyttas hästen, med presskritik, aldrig
i tysthet. Mötet är Kontorets viktigaste knapp: "lyssna" värmer
kommunikationen, "be om tålamod" förlänger kravet två starter (EN gång
per krav) och tas emot efter typ — småägaren nickar, storsatsaren suckar
och drar av på sporten.

**Sponsorerna (kap 8, engine-sponsor.js).** Sex sponsortyper från lokal
företagspartner till nationell huvudsponsor, med namnpooler i
data-agare.js (namnregeln). Avtalet: fast veckoersättning, segerbonus,
ett säsongskrav och ibland en FÖRMÅN som är verklig, inte kosmetisk —
transportsponsorn halverar resekostnaden (anmälan läser resekostnad()),
fodersponsorn sänker driften 400 kr/häst/vecka (körVecka läser
foderrabatt()). Konflikten ur 8.3 bor i kravtyperna: den lokala vill se
hemmastarter, den nationella segrar var de än sker. Erbjudanden kommer
med renommét (max ett avtal, två från renommé 55), ligger tre veckor och
förfaller. Vid säsongsskiftet utvärderas kraven i körVecka: uppfyllt ger
fyra veckoersättningar i bonus och förnyat avtal med tio procent bättre
villkor; missat bryter avtalet offentligt och kostar två renommé.
Designgränsen igen: sponsorerna rör ekonomin och veckan — aldrig
loppmotorn.

**Kontoret (ui-kontorvy.js, under Mer).** Verksamhetens vy i dagsljus:
ekonomin som konsekvenser (fast veckonetto, "kassan räcker N veckor",
vad de tomma boxarna kostar — designförslagets punkt 6 i lättversion),
ägarna som personer (typ, vad de VILL, båda nöjdhetsstaplarna, hästarna,
senaste mötet, mötesknapparna) och sponsorerna (aktiva avtal med
kravläget, erbjudanden med hela avvägningen på bordet).

**Nästa steg på Hem (kap 16.5).** "I dag"-panelen döptes om och fick
verksamhetens rekommendationer: sponsorerbjudande som väntar (guldprick),
missnöjd ägare (tegel), kassaprognosen ur kontorets veckonetto ("fler
externa hästar skulle förbättra kassaflödet"), och sponsorkrav som
hänger löst sista fyra veckorna. Härlett ur spelläget, aldrig påhittat,
aldrig tvingande — öppna mål, inte uppdrag.

Nya filer: engine-stallmote.js, engine-agare.js, engine-sponsor.js,
ui-kontorvy.js, prov-beslut.mjs, prov-verksamhet.mjs. Provsviterna är nu
tio. Alla nya UI-val är deterministiska eller ur befintliga slumpflöden —
inga nya slump()-anrop i loppmotorns flöde (beslutspunkten drar noll).

## Fem idéer ur bilderna (v78)

Bildleveransen föreslog berättelser som systemen ännu inte gjorde.
Alla fem byggdes — ren berättelse ovanpå befintliga system, motorn orörd:

**Målfotot som ögonblick.** Skiljs tätduon av under ~0,08 s (en dryg
halvlängd) OCH spelarens häst är en av dem, hålls facit tillbaka en
knapptryckning: målfotobilden, pulserande MÅLFOTO-rubrik, "Domarnas
besked". Ren UI-teater i Facit-komponenten — resultatet är redan
avgjort, bara inte VISAT.

**Kvällen före.** Sista veckan före ett prestige 5-lopp med kvalad häst
slutar med en stilla kvällsscen (Kronvallens bildvariant): strålkastarna
släcks, i morgon tittar hela landet. Bågens sista andetag. OBS
nyckelformatet: bågens städning raderar allt som inte börjar med
"{säsong}:" — upptäckt i prov när scenen kom två gånger.

**Förlorarintervjun.** Storloppsfacit-sidan fick mikrofonen: skyll på
dagen (+hype, −spelförtroende), ta ansvaret (−hype, +förtroende,
+renommé) eller försvara hästen (++hype, −−förtroende). Den starkaste
intervjun i sporten är den efter förlusten.

**Albumet.** Journalen fick fliken album: krönikans händelser med
betydelse ≥ 70 som bildsidor (typ→motiv-mappning), nyast först, max 24.
Karriären som bläddringsbar fotohistoria — byggd helt av data och
bilder som redan fanns.

**Fölvisningen.** När gårdens egen uppfödning körs in: en hagsida med
härstamningen och förstamannens FÖRSTA LEDTRÅD om temperamentet — läst
ur starkaste egenskapen, utan siffror. Så lär man känna en unghäst i
verkligheten: på känn.

## Kandidaten från egna led (v77)

Teds bild "Kandidat från egna led" var mer än en scenbakgrund — den var
en KANDIDAT. Rekryteringen (både prologens och scenens) har nu fyra:
de tre yttre profilerna, och gårdens egen unga hästskötare. Designdok-
umentets mening är ordagrann: "min första förstaman var en ung
hästskötare."

Avvägningen: hen är 19–23, billigast (600 kr/v mot 900–1500), känner
redan varenda häst — men profilen LOTTAS (man vet inte vem någon är
förrän hen fått ansvar). Och lojaliteten är hens egenskap: urEgnaLed-
flaggan följer med anställningen och saktar ambitionskurvan till 55 %
— den som fostrats på gården drömmer inte bort sig lika fort, vilket
skjuter avgångssamtalet flera säsonger framåt. Eget porträtt
(kandidat-egna-led.jpg, beskuret ur Teds bild) med forstaman som
reserv. Sju nya prov i prov-personal.

## Variantrotationen (v76)

Teds princip: finns flera bilder ska ALLA användas. `data-bilder.js`
(datalager — motorn får aldrig importera UI, men båda får importera
data) äger registret: BILDVARIANTER säger hur många foton varje
scenmotiv har, HÄSTVARIANTER per päls, och bildvariant(id, frö) väljer
deterministiskt — scenens bildsträng löses vid SKAPANDET och sparas i
scenen, aldrig vid visningen, så en sparfil visar alltid samma bild.
Kronvallen roterar tre foton över säsongerna, storloppssegern växlar
mellan vinnarcirkeln och intervjubilden, facit mellan målfoto- och
efterloppsmotivet, hagen tre motiv per säsong.

**Stallkamrater med samma päls får garanterat olika foton:** stallvyn
räknar hästens plats bland samma-päls-kamrater (sorterat på id — stabilt
per sparfil) och skickar det som SKIFTE till Hästbild, som lägger det
på namnhashens grundval modulo pälsens variantantal. Utan skiftet
kolliderade två bruna hästar var tredje gång — och det är just sida
vid sida i stallistan som tvillingar skär sig.

Sist in fick trav.jpg och lopp.jpg platser som vytoppar i Sfären och
anmälan. Därmed är samtliga 72 levererade bilder i bruk.

## Bilderna på plats (v75)

Teds första bildleverans: 72 källbilder varav 61 konverterade in i
bilder/ (hela kärnan, alla dräktfoton, nio banor + Kronvallen,
hästhuvuden i upp till tre varianter, journalisterna, ikonen).
Pipelinen normaliserade tre fällor: VERSAL-ändelser och inledande
blanksteg i filnamn (GitHub Pages är skiftlägeskänsligt), macOS
NFD-teckenkodning (drakt-grön låg som g + kombinerande prickar och
matchade ingenting förrän NFC-normalisering), och vikten — PNG på
1,5–3 MB styck blev JPG i målstorlek, hela lagret 6,8 MB.

Fem nya motiv fick platser: seger-storlopp (storloppssegerns
tidningssida, reserv seger), malfoto (överst i facit — bilden domaren
tittar på), traning (dagbokens topp), rekrytering och avsked-forsteman
(personalscenerna, reserv kontor). Hästbilden delar nu hästarna i TRE
varianthinkar via namnhashen med mjuk reserv till grundbilden för
pälsar med färre foton.

## Dräktsteget mot mockupen (v74)

Teds mockup satte riktningen: fotorealistiska dräktfoton på ljus
studiofond, stora visningen i ram med skugga, färgstreck under namnet,
tumnaglar av SAMMA foton med marinblå ram och bockmärke på vald,
infonotis ("din stallfärg syns överallt i spelet") och knappen med
chevron. Byggt exakt så: fotokedjan provar drakt-{id}.jpg → .png i
bilder/ och rot innan SVG-illustrationen tar vid, samma foto bär både
stor visning och tumnagel (enhetligheten är premiumkänslan), och
prologstegen fick en tillbakapil så att man kan ångra sig genom hela
onboardingen. Fotospecen (800×1000 JPG, inbakad studiofond, exakt
samma vinkel på alla åtta, promptstomme med färgtabell) står i
bilder/LÄSMIG.md.

## Dräkten som identitet och tränarnamnet (v73)

**Dräktvalet gjordes om till onboardingens identitetsmoment.** I stället
för åtta små platta ikoner: en stor halvkroppsillustration (DräktIllustration
i ui-grafik.js — hjälm med mörkt visir, tröja med bröstband och
manschetter i accentfärgen, antydda veck, ljussättning uppifrån vänster,
tygstruktur som glest diagonalmönster, vit byxlinning; SAMMA geometri för
alla åtta så att kameravinkeln är identisk per konstruktion), mjuk
fade+scale när man byter (key-bytet startar animationen om),
färgkombinationen som namn under, och tumnaglar i exakt samma stil med
marinblå ram + pop på vald. Valfri bildöverstyrning per dräkt
(bilder/drakt-{id}.png) för den stora visningen; tumnaglarna förblir SVG
för enhetlighetens skull.

**Tränarnamnet blev ett eget beslut** — onboardingen är nu fyra beslut
(ditt namn, stallets namn, dräkten, hemmabanan) plus två berättelsesteg.
Namnet står i tränarligan som alla andras ("du" blev anonymt så fort
världen fick riktiga namn), lagras som spel.tränarnamn och migreras
tomt i äldre karriärer där ligan visar "du" som förr.

## Kronvallen — storbanan och nejet (v72)

Designdokumentets slutmål innehåller meningen "jag tackade nej till en
flytt till Solvalla och byggde i stället ut den gamla gården" — och det
valet kräver att storbanan FINNS. Kronvallen (storlek 4, öppet
innerspår, "huvudstadsbanan — här körs de lopp hela landet ser") är nu:

- **Storloppens hem:** prestige 5 (Kungsloppet, Sprinterkronan) körs
  alltid på Kronvallen; prestige 4 roterar på storlek 2–3. Småbanorna
  får aldrig storlopp — deras stolthet är minnesloppet och vardagen.
- **Karriärens sista dörr:** banerbjudandetrappan har fått steg 4 —
  renommé 82, 30 segrar OCH minst en storloppsseger. Dörren väntar
  tills meriterna finns.
- **Nejet är ett beat:** tackar spelaren nej till Kronvallen (och bara
  till storbanan) registreras `tackade_nej_storbanan` i krönikan,
  renommét stiger och pressen skriver "Gården är inte till salu — inte
  ens för huvudstaden." Nej till en mellanbana förblir ett artigt nej.
- Inbjudningsloppen bjuder aldrig till Kronvallen — dit bjuds man inte
  via brev.

En felplacering fångades på vägen: första försöket att styra storloppen
hamnade i inbjudningsloppets funktion där variabeln `mall` inte finns —
en runtime-krasch som verifierarens modulladdning inte ser (funktions-
kropp). Utfallslistan (`veckansLopp` för alla 20 veckor) avslöjade den;
den kontrollen är billig och kördes igen efter rättningen.

## Minnesloppskraschen och anropskontrollen (v71)

**Buggen:** loppfliken kraschade med "Can't find variable:
veckansMinneslopp" — anropet lades in i v65 men importraden föll bort
för att insticksankaret (`import { KUSKAR }`) inte matchade filens
verkliga rad (`import { KUSKAR, villig, ...`), och ersättningen skedde
tyst utan assert. Verifierarens modulladdning såg inget: referensen
ligger i en funktionskropp som bara körs när fliken öppnas.

**Lärdomen byggdes in:** verifieraren kontrollerar nu att varje namn som
exporteras av EXAKT en modul och ANROPAS i en fil också är importerat
eller deklarerat där. Kommentarer strippas före analysen (projektets
kommentarer nämner gärna funktioner vid namn), och parametrar räknas
som deklaration (skrivPress-injektionen är ett designmönster, inte ett
fel). Kontrollen regressionstestas genom att avsiktligt plocka bort
importen.

**Skörden:** utöver minnesloppsbuggen hittade kontrollen direkt TVÅ
äldre latenta krascher — inbjudningsveckans lopp anropade
inbjudningslopp() och medInbjudningspengar() utan import (kraschade
först den vecka en inbjudan gällde), samt en oanvänd slump-referens.
Tre buggar av samma klass, en kontroll som stänger klassen.

## Hästhuvudena och extrabildernas platser (v70)

**Riktiga hästhuvuden.** Hästarna genereras i tusental så en bild per
häst är omöjlig — men pälsen härleds redan deterministiskt ur namnet
(pälsFör), så SEX huvudfoton (hast-brun/morkbrun/fux/svart/skimmel/
ljusbrun.jpg, 800×800) täcker varenda häst som någonsin föds, med
valfria -2-varianter som delar hästarna i två halvor via samma hash.
PÄLSNAMN-listan i ui-grafik.js står i SAMMA ordning som PÄLSAR —
indexet är kontraktet; ändras ordningen byter varenda häst utseende i
sparade karriärer. Stallvyerna visar foto-först (HästEllerFoto) med den
tecknade travhästen som reserv; loppvyn behåller SVG:n — banan är
rörelse, stallet är individ.

**Fler platser:** banbilder per bana (bana-{nyckel}.jpg i prologens
banval och banflyttscenen, reserv bana-kvall), journalisternas
bylinebilder på tidningssidorna (journalist-{namn}.jpg, initialer som
reserv), avelshagens topp (hage.jpg) och säsongsavslutets topp
(sasong-slut.jpg). Allt valfritt, allt med reservkedja — bildmappen
kan växa i egen takt. Fullständig lista med storlekar och motiv i
bilder/LÄSMIG.md.

## Rätt ansikte och klippet på Hem (v69)

Två fynd från spel i mobilen. **Berit visades med bild på en karl:**
mentorpoolen har två kvinnor och två män men bildplatsen var en enda
`mentor.jpg`. Nu väljer alla persondrivna bildplatser fil efter
förnamnet — `könAvFörnamn` i namnpaketet är en EXAKT uppslagning (alla
namn i spelet kommer ur våra egna pooler, ingen heuristik) — med
reservkedja `mentor-kvinna.jpg → mentor.jpg → initialer`. Porträtt-
komponenten fick samma kedja som Bild. Kandidaterna kan finlira med
`kandidat-{profil}-{kön}.jpg`; samtalsscenens motiv är en tom veranda
och förblir könlös.

**Uppslaget på Hem såg ut som en dubblett av helskärmen** det just var
— hela scen-rubriken i full storlek låg kvar. Tänkt som eko, upplevt
som repris. Nu är det ett TIDNINGSKLIPP (.klipp): klippkant i tegel,
etikett "Ur Travbladet", rubrik i klippstorlek, en tvåraders rad.
Ögonblicket bor i scenen och i Journalen; Hem sparar urklippet.

## Bildlagrets två skikt (v68)

Bild-komponenten fick en RESERVKEDJA: en scen kan peka på en dedikerad
utökningsbild (`bild: "avsked", bildreserv: "gard-hero"`) och laddningen
provar i tur och ordning bilder/avsked.jpg → ./avsked.jpg →
bilder/gard-hero.jpg → ./gard-hero.jpg → SVG. Åtta KÄRNBILDER täcker
därmed hela spelet, och tio UTÖKNINGSBILDER (arv, avsked, rekord,
rivaler, kontor, agare, samtalet, krans, skada, comeback, facit) ger
scentyperna egna motiv i den takt bildmappen fylls — ingen plats gapar
någonsin tom. Hela listan med storlekar, motivbeskrivningar,
promptråd och prioritetsordning står i `bilder/LÄSMIG.md`; pressens
tidningssidor behöver inga egna bildversioner eftersom CSS-filtret
(saturate 0.7, förhöjd kontrast) gör färgfotona till pressfoton.

## Världens röst och variationsbredden (v67)

**Sfären handlar om fler än dig.** En tidning som bara skriver om ett
stall är ett medlemsblad. `engine-varldsrost.js` ger världens egna
följetonger notiser: ligadramatiken efter halva säsongen (dominans → "X
drar ifrån", jämn topp → "Rysare i ligatoppen"), segersviter, miljonärer
och exförstamansstallets frammarsch ("uppstickaren växer — alla vet var
hen lärde sig").

**Throttlingen ÄR designen**, och mätningen bevisade varför: första
varvet gav en svitnotis och en miljonnotis varannan vecka — i en värld
som kör sex lopp i veckan är fyra raka vanligare än det låter, och
meriterna byggs bakåt redan vid världsskapandet så miljongränsen
passeras i strid ström. Nu: sviter från FEM raka, en miljonrubrik per
säsong (resten markeras tyst), en ligarubrik per säsong, och högst en
världsföljetong var tredje vecka. Utfall på sex säsonger: 4 liga, 12
sviter, 7 miljonärer — världen sorlar utan att dränka.

**Variationsbredden.** En karriär är lång, och samma rubrik varje månad
gör tidningen till tapet. De mest repeterade texterna drar nu ur pooler:
medienotisernas formrubriker (4+3 varianter), storloppssegerns rubriker
och citat (3+2 per gren — dödens, skräll, spets, standard),
ägarreaktionerna, mentorns första_seger-samtal och hälsningar (8 st),
samt krönikans utgångar (2 per tabelläge). Effekterna är identiska —
bara språket varierar. Proven låser numera GRENEN, inte den exakta
strängen. Mätt: 254 unika rubriker över sex säsonger.

## Motgången som berättelse (v66)

Fram till v65 tändes nästan all berättelse av framgång. Men slutmålets
karriär är en berättelse om motgångar som ÖVERVANNS — och då måste
motgångarna först få finnas. Fyra bågar i `engine-motgang.js`:

**Stjärnans skada.** En vardagshäst som ömmar är en loggrad; en häst som
BETYDER något (4+ segrar, 500 tkr, hype 55+ eller storloppsseger) blir
händelsen `stjärnskada`. Lång frånvaro ger tidningssidan SKADEALARM med
förstamannens plan efter profil — men HÖGST EN skadeförstasida per
säsong. Första genomkörningen gav 65 sidor på sex säsonger i ett hårt
tränat stall, och en förstasida i veckan är ingen förstasida; resten
blir pressnotiser. Comebackscenen (TILLBAKA — OCH FÖRBI ALLA) kräver
att skadan VAR en förstasida — cirkeln som sluts måste ha öppnats;
övriga comebacksegrar blir en glad notis.

**Favoritfallet.** Tung favorit (streck ≥ 35) utanför pallen: i
vardagslopp en pressnotis av sifferjägaren och −2 spelförtroende; i
storlopp tidningssidan STORLOPPSFACIT och −4. Dagsformen mildrar tonen —
"VAR INTE SIG SJÄLV" i stället för "FAVORITFALLET", för en häst som inte
var sig själv döms inte som en bluff.

**Formsvackan.** Tre raka lopp utanför pallen för en stjärna väcker
frågan "Vad är det med X?" — EN gång per svacka (flaggan sitter på
hästen), −10 hype. Nästa pallplats nollställer räknaren och stänger
frågan med den goda nyheten "Svackan bruten". Vardagshästars svackor är
ingen nyhet alls.

**Krönikan minns motgången.** Två eller fler stjärnskador ger
skadeårets stycke; ett storloppsfavoritfall får sitt. En krönika som
bara minns segrarna är en annons, inte en krönika.

## Mentorns sista båge och gårdens synliga historia (v65)

**Närvaron glesnar.** Mentorn hör av sig efter pensionen — samtal,
vykort, en tyst stund vid staketet — men kurvan pekar nedåt med flit:
från var åttonde vecka året efter överlämningen till någon gång per
säsong efter tio år. Frånvaron ska hinna KÄNNAS innan beskedet kommer,
annars är beskedet bara text. (Mätt i prov: ~150 hälsningar/2000 veckor
år 2, ~21 år 12.)

**Bortgången — varsamheten är regeln.** Prövas en gång per säsongsskifte,
aldrig före säsong 5 (prologens efterklang behöver mentorn: arvet,
elevens seger, rekorden), sedan med växande sannolikhet från 78 års
ålder. Beskedet är två scener utan val — vissa scener ska bara få vara:
SAMTALET (kväll, grannen som ringer, "somnade in, stilla, hemma") och
TILL MINNE (Travbladets runa av krönikören, med överlämningens ord som
utdrag: "Tre veckor går du bredvid mig..."). Inga detaljer, ingen
dramatik. Därefter tystnar mentorns röst i lyssnarna — mentorn()-hjälparen
respekterar borta-flaggan — och arvets läktarrad ersätts av minnesraden:
"På läktaren saknades en."

**Minnesloppet.** Hemmabanan instiftar `{Namn}s Minne` (svensk genitiv:
namn på s får inget extra s — "Evert Sandelius Minne"), ett årligt lopp
samma vecka varje säsong, byggt på inbjudningsloppets deterministiska
stomme men på hemmabanan, prestige 4 och 25 % påslag i prisstegen.
Det går överst i anmälningslistan sin vecka, markerat ❦. Att VINNA det
är händelsen `minnesloppsseger` (80) och scenen KRANSEN SOM VÄGER MEST —
vissa segrar väger mer än sitt förstapris. Sorgen får en form som ger
tillbaka; det är travsportens eget sätt.

**Gården bär sin historia.** Gårdskartan visar nu segervimplar på
taknocken (en per storlopp, arv och minnesloppsseger, växelvis tegel och
guld), en mässingsskylt vid stalldörren när hall of fame fått sin första
häst, och MINNESEKEN vid staketet efter mentorns bortgång — planterad,
och står kvar. Framgången och sorgen syns från gårdsplanen, inte bara i
journalens listor.

## Tidningssidan och prologens rum (v64)

**Travbladet som helsida.** Nyhetsscenerna (storloppsseger, arvet,
avskedet, gårdsrekordet, elevens seger) renderas nu som en hel sida ur
travtidningen: tidningshuvudet med dubbellinjer och prisrad, avdelning i
tegel, jetterubrik i tryckstil, serifingress med anfang, faktaspalten
mellan linjer, citatet som utdrag, "Text: {signatur}" — och knappen
heter Vänd sida. Segerintervjuns val ligger under en tredubbel linje som
tidningens egen fråga. Tidningsnamnet bor i `data-namnpaket.js`
(namnregeln); stilen väljs per scen med `stil: "tidning"`.

Tumregeln som styr valet av stil: KVÄLLEN är upplevelsen (stallkontoret,
telefonen som ringer, avgångssamtalet), TIDNINGEN är eftermälet. Det som
är en nyhet ser ut som en nyhet.

**Prologen fick rum.** Spelstarten är inte längre en rullande blankett
utan fem helskärmssteg: pressuppslaget, ANKOMSTEN (regnet, mötet med
mentorn, gårdens siffror — bara berättelse, inget att fylla i), namnet,
dräkten och hemmabanan — ett beslut per skärm med storyn runt beslutet.
Stegen är LJUSA helskärmar (.helscen.ljus): prologen utspelas en regnig
förmiddag; kvällsmörkret sparas till loppen. När stallet öppnas trycks
generationsskiftet som Travbladets förstasida — spelarens första
tidningssida av många, byggd av spelets egna namn och siffror.

**Verifieraren laddar nu modulerna på riktigt.** Importgrafen är statisk
text — den ser inte fel som uppstår när modulkroppen KÖRS: TDZ i
importcirklar (registerläxan i v62, som fem provsviter missade),
syntaxfel, anrop av något som inte finns. Verifieraren bygger numera
preact/htm-stubbar i en temporär katalog och importerar varenda modul,
med fönsterglobaler stubbade för main.js. Det är den svarta skärmens
sista gömställe som stängs.

## Rekorden och säsongskrönikan (v63)

**Rekordtavlan** (spel.rekord) hänger i stallgången bredvid mentorns
gamla segerrekord: snabbaste segertid, största segermarginal, största
prispeng. Jämförelserna är ÄRLIGA eller inte alls: km-tid räknas enbart
vid seger och bilstart (voltens tillägg gör tiderna ojämförbara), och en
tvåas tid i ett uppdrivet lopp är ingen notering. Första noteringen
någonsin sätts tyst — allt är rekord när tavlan är tom; först när ett
riktigt rekord FALLER blir det händelse och press, signerad sifferjägaren.

**Hall of fame** (spel.hallOfFame): de tio största hästarna genom
tiderna, invalda vid pensionen på merit — insprunget väger tyngst,
segrar och storlopp därtill (storloppsbonusen är äran; prispengen ligger
redan i insprunget). Tio platser, inte ett arkiv: att en gammal stjärna
petas när en större går i pension är poängen. Väggen ska vara svår.

**Säsongskrönikan** skrivs av krönikören i samma sekund som säsongen
avslutas — medan händelserna ligger färska — och sparas PÅ historikraden,
så att säsong 3:s text kan läsas i säsong 9. Texten byggs av det som
hände, inte av en mall med luckor: årets ögonblick (största händelsen,
med egen formulering per typ — arvet, dödensresan, elevens seger),
säsongens häst, noteringarna som föll, avskeden, och en utgång färgad av
tabelläget. Ett tomt år ger en kort krönika; tomrummet är också en
berättelse. Krönikan visas i säsongsavslutet och för alltid under
Journal → säsonger; rekordtavlan och hall of fame under Journal → rekord.

**Två skavanker åtgärdade i samma veva:** alert()-rutan med pensionerade
hästar vid säsongsstart är borta (trotjänarna får riktiga scener, resten
står i krönikan), och ett faktafel som funnits sedan v50: "säsongens
häst"-siffran är hästens KARRIÄRTOTAL, inte årets intjänat — texten sa
"under året" och ljög så fort hästen tjänat mer än stallets årsresultat.
Upptäckt när en genomkörningskrönika påstod 2,4 mkr "under året" i ett
stall som sprang in 1,6. Texterna säger nu "i karriären".

## Personalen och relationerna (v62)

Designdokumentets mening: *"Min första förstaman var en ung hästskötare
som senare lämnade och blev min största rival."* Hela den bågen finns nu.

**Förstamannens ambition** växer varje vecka — snabbast för pådrivaren —
tar språng vid storloppssegrar och står still när stallet går i motvind
(renommé < 30). Vid mogen ambition efter minst en hel säsong kommer
helskärmsscenen: hen står i dörren och vill starta eget. Tre svar:
SLÄPP (ni skiljs som vänner), MOTBUD (lön ×1,6; ambitionen faller till 55
men drömmen dör inte, och nästa motbud blir dyrare) eller DELÄGARSKAP
(hen stannar för gott — ambitionen fryses, som en delägares gör).

**Släpper du** föds `Stall {Efternamn}` i världen med fem hästar och en
filosofi ur profilen. Från den stunden bygger världsmotorn hens fält och
liga precis som alla andras: rivaliteten UPPSTÅR av att ni delar banor,
den simuleras inte fram — samma princip som hästrivaliteterna. Direkt
därpå kommer rekryteringsscenen: tre kandidater som val, profilerna som
i prologen. Möts ni i loppen skriver pressen — men bara när det bär
(någon vann, eller ni gick i mål sida vid sida). Första gången hens häst
slår din: händelsen `eleven_slog_mästaren`, scen, uppslag, och mentorn
som ringer, road: »Jag minns när DU först slog MIG.«

**Ägarna minns.** Relationen (spel.ägarrelationer) byggs av segrar,
pallplatser och uppfyllda krav; rivs av skador och missade krav. Vid 80
ringer telefonen som scen: ägaren har köpt en BÄTTRE häst och vill
placera den hos dig — ta emot (nivån skalar med renommét, generöst krav)
eller tacka nej (−20 relation, men dörren stängs inte för alltid). Så
växer uppdragsstall i verkligheten: på rykte hos ägarna.

**Banflytten är en scen** ("TELEFONEN RINGER") med flytta/stanna som val.
Kortet i stallvyn ligger kvar som reserv: räcker inte kassan i scenen
väntar erbjudandet där.

**Journalisterna återkommer.** Tre signaturer i `data-namnpaket.js`
(namnregeln!): krönikören tar de stora ögonblicken och avskeden,
sifferjägaren formkurvor och miljonärer, nyhetsjägaren rivaliteter.
`skrivPress` tar en frivillig signatur som Sfären renderar som
"Text: {namn}" — en tidning utan bekanta bylines är bara text.

**Registerläxan:** valeffektregistret flyttade in SOM EGENSKAP PÅ EN
FUNKTION (`valregister()`) i stället för en konstant. Importcirkeln
scener → vecka → personal → scener gör att personal registrerar sina
effekter innan scenmodulens konstanter initierats — en const gav
TDZ-krasch vid start, den sortens svarta skärm verifieraren inte ser.
Funktionsdeklarationer finns före all körning; det är därför registret
bor i en.

## Helskärmsscenerna (v61)

De stora ögonblicken förtjänar mer plats än en ruta högst upp på Hem.
En storloppsseger, ett fullbordat arv, en trotjänare som slutar eller ett
gårdsrekord som faller tar nu ÖVER SKÄRMEN, i kvällens visuella språk —
banan under strålkastare, bild (`seger.jpg`/`gard-hero.jpg` med
SVG-reserv), stor rubrik, faktaruta, citat. Först när spelaren går vidare
öppnas vardagsvyn, och samma uppslag ligger då kvar på Hem som veckans
rubrik. En källa, två visningar: scenen och uppslaget byggs av samma
händelsedata.

**Valen.** Vissa scener frågar något. Segerintervjun: tala upp hästen
(hype och förväntan stiger), håll igen (spelförtroendet uppskattar det)
eller ge kusken äran (relationen byggs). Stjärnstoets avsked: behåll
henne i avelshagen — och chansen till arvet — eller sälj till ett bud som
växer med meriterna. Effekterna är små och väldokumenterade; scenerna rör
aldrig loppmotorn.

**Serialiserbarheten är regeln som bär allt.** Kön (`spel.scener`) sparas
med spelet, så en halvläst scen står kvar efter omstart. Därför bär en
scen ALDRIG funktioner — valen är typ + data, effekterna bor i
`VALEFFEKTER` i `engine-scener.js`. En scen med val kan bara stängas av
ett giltigt val (ett felskickat id förbrukar inte spelarens beslut),
medan en okänd EFFEKT är ett versionsglapp: valet är gjort, scenen
stängs, effekten uteblir snällt. Högst fem scener i kön, viktigast först.

**Dramaturgigränsen:** scenen tar aldrig över mitt i loppfliken — först
målgången och facit, sedan uppslaget när spelaren lämnar loppet. Och
inte allt blir en scen: rivaliteter, formnotiser och vardagssegrar bor
kvar i pressflödet. Får allt helskärm betyder ingenting något.

## Storloppsbågen och generationerna (v60)

**Bågen.** Ett storlopp börjar inte den vecka det körs. `engine-storlopp.js`
tittar fyra veckor framåt i kalendern och låter loppet kasta skugga:
upptakten i pressen (kandidaterna räknas, världens troliga favorit pekas
ut ur AI-stallens meriter), jakten på startsumman två veckor före ("38 tkr
saknas — och två veckor kvar att springa in dem"), och laddningen sista
veckan, som registreras som händelse så att förstamannen kommenterar
upplägget efter sin profil. På Hem ligger bågkortet med kvalade hästar
och exakt vad de nära saknar — kvalgränsen förvandlar en fjärdeplats i
Silverserien från tröstpris till ett steg mot Kungsloppet.

Bågen är HÄRLEDD, inte lagrad: kalendern är deterministisk så allt räknas
fram ur spelläget varje vecka. Det enda som sparas är vilka pressetapper
som skrivits (`spel.bågeSkrivet`, en per lopp och säsong, städas vid
säsongsskifte). Designgräns: filen läser världen och skriver press — den
rör aldrig fältbygget eller loppmotorn. Skuggan är berättelse och mål,
inte en hand på tärningen.

**Avelshagen.** Ett pensionerat eget sto med minst två segrar eller
300 tkr insprunget försvinner inte — hon flyttar till `spel.avelsston`
och kan betäckas från avelsvyn. Egenskaperna fryses FÖRE det sista
ålderstappet (ögonblicksbild i `nySäsong`; arvsanlag åldras inte — det
första provet av det här avslöjade att fölen annars ärvde en extra
årgång förfall). Högst sex i hagen, till 20 års ålder, äldst lämnar.

**Arvet.** Föl bär `morId`, `mor` och `far` in i vuxenlivet. När en häst
vinner ett storlopp söks moderns storloppssegrar i KRÖNIKAN — inte i
stallet, för modern kan vara såld eller pensionerad; det är precis det
händelseminnet finns för. Samma loppnamn ⇒ händelsen `arvet`
(betydelse 96): uppslaget SOM SIN MOR på Hem, trofé, och mentorn på
läktaren — designdokumentets slutscen. `prov-storlopp.mjs` låser hela
kedjan, inklusive att fel lopp INTE utlöser den.

## Händelsebussen (v59)

Designdokumentets bärande princip: **en registrering, flera reaktioner.**
En storloppsseger ska ge huvudartikel på Hem, notis i Sfären, replik från
förstamannen, samtal från mentorn, reaktion från ägaren, milstolpe i
hästens tidslinje, trofé i gården, post i säsongskrönikan och ökat
renommé — allt ur samma händelse. Fram till v58 var motorn byggd för det
men fan-outen var det inte: mentorns repliker låg hårdkodade inne i
`registreraHändelse`, och allt annat skrevs på egen hand i den vy som
råkade behöva det. Samma seger beskrevs på fem ställen med fem sanningar.

**Bussen.** `påHändelse(typ, hanterare)` registrerar en reaktion; `"*"`
lyssnar på allt. `registreraHändelse` sänder till alla som anmält sig.
Motorn känner inte längre till vad press, mentor eller troféer är —
reaktionerna bor i `engine-lyssnare.js`, som importeras för sin
sidoeffekt av `engine-vecka.js`. En ny berättelse är därmed en lyssnare
till, inte en ändring mitt i motorn.

Ett fel i en lyssnare fångas och hamnar i `spel.logg` i stället för att
fälla de andra. En trasig pressrubrik ska aldrig kunna bli svart skärm.

**Aktörer är id:n.** `aktörer: { hästId, kuskNamn, ägare, förstamanId }`.
Namn duger till text men inte till minne: en häst byter stall, en kusk
byter tröja, och fas 4–5 (rivaliteter, avkommor, återkommande personer)
kräver att aktören går att slå upp år senare. `slåUppHäst(spel, id)` letar
i stallet och sedan i världen. Visningsnamnet följer med som `hästNamn`,
och gamla anrop med `{ häst: "Namnet" }` normaliseras automatiskt — äldre
sparfilers krönikor fortsätter fungera.

**Loppfakta plockas ut en gång.** `loppfakta(sim, min, lopp, häst)` läser
favoritskap, position vid 1 000 meter, meter utan rygg, marginal, segertid
och motståndare direkt ur simuleringen och lägger dem i händelsens data.
Positionen tas ur bildrutan närmast 1 000 meter kvar — källans mått, samma
som kalibreringen. Funktionen drar aldrig slump och rör aldrig motorn:
kalibreringen är identisk till decimalen efter ombyggnaden.

**Rivaliteter upptäcks ur data.** Varje lopp räknas alla motståndare som
slutade inom två placeringar som ett möte. Vid femte mötet utropas
rivaliteten — en gång, och bara den hårdaste per lopp. Att räkna bara den
allra närmaste hästen prövades först och gav 51 par på 62 lopp utan att en
enda rivalitet uppstod: motståndaren närmast i mål är sällan densamma två
gånger. Med det bredare måttet föds fyra till sex rivaliteter på fyra
säsonger, vilket är ungefär vad en karriär tål.

**Stalljournalen** (`ui-journalvy.js`, under Mer) är den vy krönikan
saknade: hela minnet i omvänd kronologi med betydelsen synlig i tyngden,
troférummet, och rivaliteterna med ställning. Vyn hittar aldrig på text —
allt som visas är registrerade händelser. Ser något fel ut där är felet i
registreringen.

**Träningsdagboken** ligger på hästsidan som fjärde flik: veckans pass och
vad hästen svarade, med formens förändring per vecka. Utan den är
träningen ett val utan historia — man ser var man står, aldrig vad som
förde en dit.

**Pensioneringen** är karriärens sista rubrik, inte en tyst radering ur
en lista. Betydelsen följer vad hästen betydde: segrar, insprunget och
eventuell storloppsseger avgör om det blir ett uppslag på Hem med
faktaruta och plats i troférummet, eller en notis i flödet.

## Skissernas sista paneler (v57)

Träningsplanen (panel 6) i ärlig veckoform: rutnät över hela stallet med
figur, vald träning som färgkodat pass, energi/form-läget och
förstamannens invändning som guldflagga — spelet är veckobaserat, så
planen visar veckan i stället för ett påhittat dagsschema. Segerartikeln
(panel 3) skrivs av loppfakta efter stora segrar: KROSSADE MOTSTÅNDET
vid dödensresa, SKRÄLLEN INGEN SÅG KOMMA under 12 %, LEDDE FRÅN START
TILL MÅL i spets — med faktaruta (segertid, marginal i längder,
spelprocent, meter utan rygg) och kuskcitat. Säsongskrönikan (panel 9)
fick rubrik efter utfall, säsongens häst med figur, höjdpunkterna ur
händelsemotorn och förstamannens slutord färgat av profilen.

Bildspecifikationen ligger i bilder/LÄSMIG.md: åtta valfria JPG-filer
(scener 1200×800, porträtt 512×512) med exakta filnamn och prompttips.

## Skissernas paneler (v56)

Designskissernas layouter, byggda på riktigt: ATG-startlistan (spår, häst
med ålder och kön, kusk, starter/segrar/insprunget i tkr, streck och
formrad för egen häst), hästsidan med flikar (Översikt med förstamannens
rapport och träningsval, Karriär med siffror och loppfacit, Berättelse
med tidslinjen ur händelsemotorn — öppnas genom tryck på hästkortet) och
porträtt på mentorn och förstamanskandidaterna.

Fotona ur skisserna kan spelet inte generera — men platserna finns.
`bilder/`-mappen tar emot JPG-filer med bestämda namn (se
`bilder/LÄSMIG.md` med motivlista och prompttips); finns bilden används
den, annars tar SVG-reserverna över: gården i regndis som öppningsscen
och initialporträtt i stallets färger. Spelet är alltså komplett utan en
enda bildfil, och blir skisserna med dem.

## Travpressens designsystem (v55)

Tesen, ur designdokumentet: sportpress när spelet berättar, tävlingsprogram
när spelaren analyserar, stallkontor när spelaren planerar. Paletten är
travpressens: benvitt papper, trycksvärta i marinblå, tegelröd för stora
rubriker, dämpad guld för prestige, grönt för form. Signaturen är
kontrasten: analys och planering sker i dagsljus på papper — men själva
loppet körs fortfarande i kvällsmörker under strålkastare (banvyn,
närbilden, lottningen behåller nattpaletten).

Pressmallar i tre storlekar bär hierarkin: .scen (helskärmsuppslag med
etikett, rubrik, ingress och citat — används för öppningen, övertagandet
och rekryteringen), .artikel (mellannyhet med färgad kant) och .notis
(en rad i flödet). Om allt får en stor rubrik känns ingenting stort.

Navigationen är fem sektioner: Hem, Stall, Lopp, Sfären och Mer (Gård,
Marknad, Avel). Hem är karriärens dagliga nav: huvudnyheten som uppslag,
"I dag" med uppgifter härledda ur spelläget (väntande erbjudanden,
startklara hästar, träningsavvikelser) som länkar till rätt flik,
förstamannens veckorad, ekonomin och pressflödet.

Spelet öppnar numera som ett pressuppslag — EN GÅRD VÄNTAR PÅ SIN
ARVTAGARE, med mentorns citat och gårdens historia — innan namnvalet.
Hästkorten har fått sin berättelse: en tidslinje med milstolparna ur
händelsemotorn. Det emotionella först, siffrorna efteråt.

## Bildspråket (v54)

All grafik är egen SVG i `ui-grafik.js` — inga bildfiler, inga
nätberoenden, skarpt i alla storlekar och fungerar offline. Travhästen
med sulky ritas i sidoprofil i flygande trav; pälsfärgen härleds
deterministiskt ur hästens namn (samma häst, samma päls, varje gång) och
kusken bär stallets dräkt. Dräkten är ett plagg med ärmar, bröstrand och
hjälm — inte en färgruta. Gårdskartan är signaturen: en kvällsscen där
varje bygge syns när det är byggt — stallängan visar exakt gårdens antal
boxdörrar, rakbanan läggs bakom stallet, backen reser sig till höger,
vattenbandet får sitt hus, och gårdsveteranen står vid staketet om
trotjänaren pensionerades dit. Framgång ska synas från gårdsplanen.

Ytpoleringen behåller nattravsidentiteten (strålkastargult över mörk
oval, Big Shoulders + mono) men med mjukare kort, pillernavigering med
frostat glas, levande staplar och tryckrespons på knappar. Respekterar
prefers-reduced-motion och har synligt tangentbordsfokus.

## Prologen och minnet (v52)

**Karriären börjar i säsong 0, vecka 18.** Spelaren är förstaman hos en
äldre tränare som ska gå i pension — tre veckor sida vid sida, sedan
nyckelknippan. Mentorn är en person med namn, ålder, filosofi (försiktig,
offensiv eller unghästmänniska), en gammal stjärnhäst och en största seger.
Hen kommenterar veckan, reagerar på spelarens träningsval från vecka 19
(»kom ihåg att orken bara är 38«) och tar avsked med en text som skrivs av
det som faktiskt hände i sista loppet — seger, förlust eller galopp.

**Introhästarna** har roller, inte kloner: trotjänaren (gammal, travsäker,
mentorns hjärta), den osäkra unghästen (talang med galopp i benen),
vardagshästen (brödföda) och arvtagaren (den möjliga första profilen).
Egenskaperna varierar mellan karriärer inom rollens spann.

**Övertagandet** är prologens final med val som följer med: gårdens namn
(förvalta arvet, döpa om, kombinera), trotjänarens öde (en säsong till
eller pension på gården — hen blir då `spel.gårdsveteran`), och ekonomin
(sälja vardagshästen för startkapital). Säsong 1 öppnar sedan med
karriärens första stora rekrytering: tre förstamanskandidater med profil,
ålder, lönekrav och pitch.

**Händelsemotorn** (`engine-handelser.js`) är storysystemets grund:
`registreraHändelse` sparar typ, betydelse (0–100), aktörer och data i
`spel.krönika`, som överlever veckorna. En registrering, flera reaktioner:
pressen skriver, mentorn ringer efter första segern och gratulerar
storloppssegrar, gårdsrekordet uppdateras. Hästarna får biografier
(`häst.milstolpar`): första start, första prispeng, första seger,
storloppsseger, miljonen, comeback efter skada. Säsongskrönikan visar
säsongens tre största händelser.

**Gårdshistorien**: grundår, bästa häst, största seger och ett
säsongssegerrekord — som spelaren kan slå, med press och mentorreplik.
Resan går från att förvalta någon annans historia till att skriva sin egen.

Kvarvarande faser ur storyplanen, i prioritetsordning: (3) permanenta
ägare och återkommande journalister, (5) generationer — avkommor efter
gamla stjärnor, personal som blir konkurrenter. Klart i v59: (2)
hästbiografier i gränssnittet och efterloppsanalys med flera röster, (4)
rivaliteter som upptäcks ur data, samt troférummets grund.

## Karriärbågen (v50)

Spelet börjar med tre val: stallnamn, dräkt och hemmabana. Bara de små
banorna (storlek 1 i `BANOR`) har plats för en okänd tränare — de stora
får man förtjäna. Hemmabanan är ekonomi på riktigt: bortalopp kostar
1 200 kr i resa, hemmalopp ger hemmapubliken (1 000 kr + 8 % av bruttot).

**Förstamannen** anställs vid uppstarten (äldre sparfiler får en med en
pressnotis första veckan). Profilen — fostrare, pådrivare eller taktiker —
färgar råden. Hen föreslår träning per häst med motivering och en knapp
som lägger hela veckans träning, och pekar i anmälan ut veckans lämpligaste
lopp för vald häst. Råden är regelstyrda och deterministiska; poängen är
att lära ut hur man tänker, inte att spela åt spelaren.

**Uppstigningen.** Vinst i ett lopp med minst 40 000 i förstapris kan ge
en inbjudan till arrangörens lopp två veckor senare: högre klass, fältet
byggs av nivån, prispengarna växlas upp 1,6×. Vid renommé 40/6 segrar
respektive 62/16 hör en större bana av med ett flytterbjudande (60 000
respektive 140 000 kr) — flytten byter hemmabana och därmed var storloppen
ligger nära. Erbjudandet ligger kvar tills spelaren väljer.

**Gården (v51).** Stallet börjar med fyra boxar och en grusad slinga.
Boxarna är stallets tak — ägarförfrågningar slutar komma när det är fullt —
och byggs ut två i taget. Rakbanan lyfter snabbjobben, backen bygger ork
med avtagande utbyte mot ett tak (en svag häst vinner ~5 punkter på en
säsong, en stark nästan inget), vattenbandet återhämtar och skonar.
Veterinären kortar varje skada en vecka, hovslagaren sänker skaderisken.
Allt kostar drift per vecka — pengar som kunde ha blivit hästar.

DESIGNGRÄNS: gården påverkar VECKAN (träning, återhämtning, skador,
kapacitet) — aldrig loppmotorn. Kalibreringen kan inte se om spelaren har
vattenband. Äldre sparfiler migreras till 8 boxar (gamla taket) utan byggen.

Nästa etapp av bågen: fler anställda med egna profiler (unghästtränare,
transport), förstamansrepliker efter lopp — hen såg samma lopp som du —
och långsiktiga mål som visas i spelet (vinn storloppen, bli landets
bästa tränare via tränarligan).

## Nästa steg

- Rygg ledaren vinner för ofta (13,1 % mot mål 7) och andra utvändigt för
  sällan (6,1 % mot 9,6) — raden siktar rätt men ligger ändå bakom i halva
  loppen; stigtaktsklampen är prövad och avfärdad, nästa angrepp är VAR
  utflyttningarna sker (de byggs långt bak i fältet)
Storyplanens fem faser är därmed byggda, inklusive de sena punkterna.
Naturliga nästa steg är innehållsbredd snarare än nya system: fler
händelsetyper på bussen, fler krönikeformuleringar, fler scener på
befintlig scenmotor — samt bilder i bilder/-mappen.
Klart och struket: tävlingskalendern med propositioner, tränarligan,
uppbokade kuskar (v45), service workern (v44), kuskkännedomen (v46),
ledarförsvaret (v47), radensfixen (v49) och karriärbågen med spelstart,
förstaman och uppstigning (v50) gården med byggen och personal (v51), prologen med mentor,
övertagande, förstamansrekrytering och händelsemotorn (v52) samt
händelsebussen med lyssnare, rivaliteter, stalljournal, träningsdagbok
och pensioneringar (v59) samt storloppsbågen, avelshagen och arvet (v60) och helskärmsscenerna
med val (v61) samt personalens karriärer, ägarrelationerna och
journalisternas signaturer (v62) och rekordtavlan, hall of fame och
säsongskrönikorna (v63) samt tidningssidan och prologens
helskärmsberättelse (v64) och mentorns sista båge med minnesloppet och
gårdens synliga historia (v65) samt motgången som berättelse (v66) och världens röst med
variationsbredden (v67) samt bildlagrets reservkedja (v68) och rätt ansikte med klippet på
Hem (v69) samt hästhuvudena och extrabildernas platser (v70) och
anropskontrollen efter minnesloppskraschen (v71) samt Kronvallen med
storbanenejet (v72) och dräkten som identitet med tränarnamnet (v73) samt dräktsteget mot
mockupen (v74) och bilderna på plats (v75), variantrotationen (v76) samt kandidaten
från egna led (v77) och de fem bildidéerna (v78) samt beslutsfönstret med seedad
omsimulering, stallmötets veckoslots, insats & risk i anmälan,
hästsidans fem flikar, TV/analysläget, ägarsystemet, sponsorerna,
Kontoret och Nästa steg-panelen (v84), kusksamtalets körorder i två
delar (v86), kuskens vetorätt (v87) samt efterloppsanalysen (v88) och Travbladet (v89) samt pälsskifteslagningen,
verifieraskärpningen och vägvisaren (v90),
tävlingsmanualen som kapitel 18 (v91) och tävlingssystemets etapp A —
klassningen, loppväljaren och startpoängen (v92) samt etapp B —
anmälan som process med uttagning, trösklar och besked (v93) samt
etapp C — spårtrappan som gör motorns spårkunskap synlig (v94) och
etapp D — AI-tränarnas loppval med en gemensam anmälningskarta (v95)
samt delningen och de organisationsberoende bedömningsnivåerna (v96)
och kuskbokningens statusar med bekräftelse och reserv (v97), följt av
v98: avviker-lagningen, verifierans stackmaskin, avplottrade väljare,
storyflytten till Sfären och förstamannens förslag i anmälan, samt
inkorgens etapp A — händelseformatet och det egna rummet (v99) — och
v100: inkorgen som beslutsrum där all kommunikation bor och notiserna
expanderas och besvaras i raden, samt v101: klockan — veckans stopp
och Hoppa fram-knappen (Teds tidsidé, kap 20.1) — och v102: klockan
synlig i headern, inkorgen presenterad per meddelandetyp och
loppanmälan bantad till läsbarhet. v103 ger inkorgen tre läsdjup —
lista, stort förhandsfönster och helskärm — och flyttar in storyn:
huvudnyheten och följetongens trådar ur en delad källa. v104 ger
spelet minne: karriärtotaler, loppfacit och rivalhistorik som
kontextrader i lottningen, efteranalysen och inkorgen (kap 20.2).
v105 ger måndagen sitt möte: förstamannens genomgång som fäst rapport
i egen röst (kap 20.4) — och lagar sponsorsamtalets fältbugg. v106,
ur Teds speltest: flera egna hästar i samma lopp på riktigt
(symmetrisk uttagning, sammanhållen delning, stallkamratsbokföring)
samt inkorgens sektioner och förhandet på plats. v107 skriver om
delningen efter Svensk Travsports verkliga regler (spontandelning med
lottning och reservpåfyllning, delningsproposition med prissumme-
grupper, arrangörsbroms) och ger inkorgen sitt ansiktslyft. v108 ger
den FM:s anatomi — lista ⇄ läsvy med Nästa olästa och åtgärdsraden i
botten — och riktiga röster: brev som brev, rapporter med struktur
och val, samtal som repliker, skötaren som stallets tredje röst.
v109 bygger statistiklagret: ledningen i positionsklassen, banan i
resultatraden och Statistiken-sidan under Mer (kap 20.3). v110 ger
ägarna och kuskarna röster: tacksamtal och otåliga samtal med
löftesbeslut som följs upp, och kuskens måndags-sms ur helgens rad.
v111 sätter världen i rörelse: kuskgenerationerna (pensioneringar och
lärlingsdebuter genom hela spelet), sponsoromsättningen och pressen
som berättar — kap 20.8, etapp A. v112 ger stallkamraternas kuskar
röster i kusksamtalet inför loppet. v113 lagar motorbuggen där en
galoppdiskning mitt i loppet frös slutvillkoret — med permanent vakt.
