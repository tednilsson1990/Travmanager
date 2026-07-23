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
engine-forstaman.js     förstamannen: träningsråd och loppmatchning
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
node kalibrering.mjs           tolv fasta seeds à 120 lopp
node kalibrering.mjs 18472     bara den seeden
node diagnos-ledarbyte.mjs     ledarbyten: håller 1000-metersledaren?
node diagnos-ytterrad.mjs      ytterraden: vem täcker rygg ledaren?
node diagnos-radenergi.mjs     raden bakåt: energi eller beteende?
```

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

Nästa etapp av bågen, i fallande ordning: egen hästgård med utbyggbara
träningsmöjligheter (rakbana, backe, vattenband), fler anställda med egna
profiler, och förstamansrepliker efter lopp — hen såg samma lopp som du.

## Nästa steg

- Rygg ledaren vinner för ofta (13,1 % mot mål 7) och andra utvändigt för
  sällan (6,1 % mot 9,6) — raden siktar rätt men ligger ändå bakom i halva
  loppen; stigtaktsklampen är prövad och avfärdad, nästa angrepp är VAR
  utflyttningarna sker (de byggs långt bak i fältet)
Klart och struket: tävlingskalendern med propositioner, tränarligan,
uppbokade kuskar (v45), service workern (v44), kuskkännedomen (v46),
ledarförsvaret (v47), radensfixen (v49) och karriärbågen med spelstart,
förstaman och uppstigning (v50).
