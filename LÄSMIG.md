# BILDLISTAN — allt spelet kan visa

STATUS EFTER TEDS LEVERANS (v75): 61 filer på plats — hela kärnan, alla
åtta dräktfoton, nio banor plus Kronvallen, hästhuvuden i upp till tre
varianter, journalisterna, ikonen och fem nya motiv som fått egna
platser: seger-storlopp (storloppssegerns sida), malfoto (överst i
facit), traning (dagbokens topp), rekrytering och avsked-forsteman
(personalscenerna). Reservmaterial som ännu saknar plats ligger kvar
hos Ted: trav, lopp, intervju, efter-lopp, seger2, comeback2,
hast-pa-gard(2), stall-morgon2, bana-kronvallen2/3.

Kvar att göra om andan faller på: kandidaternas könsvarianter och
fler pälsvarianter (fux/svart har två, skimmel/ljusbrun en).

Spelet fungerar helt utan bildfiler: varje plats har en SVG-reserv.
Lägger du JPG-filer i den här mappen med exakt dessa namn används de
automatiskt. Bildlagret har TVÅ SKIKT:

  KÄRNAN (8 bilder)      täcker varenda plats i spelet
  UTÖKNINGEN (10 bilder)  ger scentyperna egna motiv; saknas en
                          utökningsbild faller platsen automatiskt
                          tillbaka på sin kärnbild (reservkedjan i
                          ui-grafik.js), sedan på SVG

Gör alltså kärnan först — då är spelet komplett — och fyll på
utökningen i den takt det roar.

FORMAT
  Scener:    1200 × 800 px (3:2), JPG sRGB kvalitet ~80, under 300 kB.
             Visas beskurna till bred banner (max ~240 px hög på skärm):
             håll motivet i MITTENBANDET, inget viktigt i över/underkant.
             I tidningsscenerna tonas de mot svartvitt (saturate 0.7) —
             de ska tåla att se ut som pressfoton.
  Porträtt:  512 × 512 px kvadrat, under 150 kB. Beskärs RUNT —
             ansiktet centrerat, luft runt om.
  Ikoner:    PNG med genomskinlighet där inget annat anges.
FILNAMN: exakt som nedan — gemener, inga åäö, ändelse .jpg (ikoner .png).

## KÄRNAN — 8 bilder som täcker allt

| Filnamn        | Typ     | Används i | Motiv |
|----------------|---------|-----------|-------|
| gard-hero.jpg  | scen    | Prologens öppning, Travbladets förstasida vid generationsskiftet, reserv för avsked/rekord | Mindre svensk travgård i grå morgondimma/regn, äldre stallängor, våt grusplan, blekt skylt |
| bana-kvall.jpg | scen    | Elevens seger, banflytten, reserv för rivaler/facit | Travbana i kvällsmörker under strålkastare, ekipage i rörelse, publik som silhuetter |
| seger.jpg      | scen    | Storloppssegerns tidningssida (spelets vanligaste stora bild), reserv för arv/comeback/krans | Vinnarcirkel: travhäst med segertäcke och krans, kusk i dräkt, kvällsljus, blixtar |
| stall-morgon.jpg | scen  | Reserv för skada/agare | Stallgång i tidig morgon, boxdörrar, en häst som tittar ut, dammigt motljus |
| mentor-man.jpg | porträtt | Mentorkort/prolog/runa när mentorn är man (Evert, Åke) | Äldre svensk travtränare, keps och regnjacka vid stalldörr, allvarlig men varm |
| mentor-kvinna.jpg | porträtt | Samma platser när mentorn är kvinna (Gunhild, Berit) | Äldre svensk travtränarinna, keps och regnjacka vid stalldörr, allvarlig men varm |
| mentor.jpg     | porträtt | Könlös reserv om ovanstående saknas, samt samtalsscenens reserv | Valfri av de två — eller stalldörren utan person |
| forstaman.jpg  | porträtt | Reserv för kontor (avgångs- och rekryteringsscenerna) | Yngre stallanställd i stallgång, arbetshandskar, öppen blick |
| kandidat-fostrare.jpg | porträtt | Rekryteringen (reserv för -man/-kvinna) | Lugn stallmänniska 45–60 i arbetskläder, stallgång |
| kandidat-padrivare.jpg | porträtt | Rekryteringen (reserv) | Energisk person 30–45, träningsoverall, vid banan |
| kandidat-taktiker.jpg | porträtt | Rekryteringen (reserv) | Person 35–55, läsglasögon, programblad, kontorshörna i stall |

Kandidaternas namn dras ur en blandad pool, så vill du finlira finns
könsspecifika platser: `kandidat-{profil}-man.jpg` och
`kandidat-{profil}-kvinna.jpg` (sex filer). Saknas de används den
könlösa per profil ovan — välj då ett motiv där personen inte dominerar
(halvfigur bakifrån i stallgång fungerar för alla).

(Kandidaterna är tre filer men räknas som en plats — gör alla tre ihop.)

## UTÖKNINGEN — 10 bilder med automatisk reserv

| Filnamn      | Reserv       | Scen | Motiv |
|--------------|--------------|------|-------|
| arv.jpg      | seger        | SOM SIN MOR — dottern vinner moderns lopp | Sto med föl i sommarhage, eller vinnarcirkel med äldre åskådare på läktaren i förgrunden |
| avsked.jpg   | gard-hero    | Tidningssidan när en trotjänare slutar | Häst som leds ut i beteshage i motljus, grinden öppen, tom sulky vid staketet |
| rekord.jpg   | gard-hero    | REKORDET FALLER | Gammal trätavla i stallgång med målade siffror och årtal, någon når upp med krita |
| rivaler.jpg  | bana-kvall   | ELEVEN SLOG MÄSTAREN | Två ekipage sida vid sida på upploppet, hjul mot hjul, kvällsljus |
| kontor.jpg   | forstaman    | Stallkontoret: avgångssamtalet och rekryteringen | Enkelt stallkontor: skrivbord, propositioner, kaffetermos, rosetter på väggen, fönster mot gårdsplanen |
| agare.jpg    | stall-morgon | TELEFONEN RINGER — ägaren har en till häst | Häst som lastas ur transport på gårdsplan, förväntansfulla människor |
| samtalet.jpg | mentor       | Kvällsscenen vid mentorns bortgång | Tom veranda i skymning, en uppslagen travtidning på bordet, varmt fönsterljus. STILLA — inga personer |
| krans.jpg    | seger        | KRANSEN SOM VÄGER MEST — minnesloppssegern | Segerkrans i närbild hängd över sulkyns räcke, kvällsljus, oskarp publik |
| skada.jpg    | stall-morgon | SKADEALARM | Veterinär som känner på ett framben i stallgång, lugnt allvar — INTE dramatiskt, ingen synlig skada |
| comeback.jpg | seger        | TILLBAKA — OCH FÖRBI ALLA | Häst i vått morgonljus på rakbanan, ånga ur nosen, ensam i jobb |

## HÄSTHUVUDENA — 6 foton täcker alla hästar (12 med varianter)

Hästarna genereras i tusental, så en bild per häst är omöjlig — men
pälsen härleds deterministiskt ur namnet, och sex huvudfoton täcker
därmed varenda häst som föds. Samma häst får ALLTID samma bild. Visas i
stallistan, hästsidan och säsongens häst; loppvyn behåller den tecknade
travhästen med sulky (banan är rörelse, stallet är individ).

FORMAT: 800 × 800 px kvadrat, JPG, under 200 kB. Hästhuvud i profil
eller trekvartsprofil, grunt skärpedjup, stallmiljö eller neutral fond.
Pälsfärgen MÅSTE stämma — det är hela kopplingen:

| Filnamn           | Päls |
|-------------------|------|
| hast-brun.jpg     | Brun: varmbrun kropp, mörkbrun man |
| hast-morkbrun.jpg | Mörkbrun/svartbrun, nästan svart man |
| hast-fux.jpg      | Fux: rödbrun/kopparröd, man i samma ton eller ljusare |
| hast-svart.jpg    | Svart, helsvart man |
| hast-skimmel.jpg  | Skimmel: grå/gråvit, mörkare man |
| hast-ljusbrun.jpg | Ljusbrun, mörk man |

VALFRITT: en andra variant per päls — `hast-brun-2.jpg` osv (annat
huvud, annan vinkel, samma pälsfärg). Hästarna delas då i två halvor
via namnhashen så att två bruna hästar i samma stall inte ser
identiska ut. Saknas varianten används grundbilden.

## BANORNA — 9 valfria, en per bana

Visas i prologens banval och i banflyttscenen (reserv: bana-kvall).
FORMAT: 1200 × 800 px som scenerna. Motiv: banmiljö i DAGSLJUS — läktare,
upplopp, totalisatortavla; varje bana får gärna en egen karaktär enligt
kolumnen. Detta är småbanorna: inga arenor, mer folkpark.

| Filnamn            | Karaktär |
|--------------------|----------|
| bana-nordstad.jpg   | Nordlig, barrskog bakom bortre långsidan |
| bana-kvarnbacken.jpg| Kuperad, gammal kvarn eller silo i fonden |
| bana-bjorkeby.jpg   | Björkallé längs upploppet |
| bana-storangen.jpg  | Öppen slätt, vid himmel |
| bana-vinterviken.jpg| Vatten skymtar bakom banan |
| bana-sundtravet.jpg | Bro eller sund i fonden |
| bana-ekhaga.jpg     | Gamla ekar innanför oval |
| bana-sorgarden.jpg  | Röda ladugårdslängor intill banan |
| bana-kronvallen.jpg | STORBANAN — landets Solvalla: riktig arena med stor huvudläktare under tak, storbildsskärm, bred publikplats. Enda banan som FÅR se ut som en arena — det är kontrasten mot folkparkerna som gör den stor |

## JOURNALISTERNA — 3 bylinebilder

Visas som liten rund bild vid "Text: {namn}" på tidningssidorna.
FORMAT: 512 × 512 px porträtt. Saknas de visas initialer — helt okej.

| Filnamn                      | Person |
|------------------------------|--------|
| journalist-cecilia-ramnek.jpg| Krönikören: kvinna 50–60, kavaj över stallväst, penna bakom örat |
| journalist-janne-fyhr.jpg    | Sifferjägaren: man 40–55, glasögon, statistikblad, skrivbordslampa |
| journalist-sara-lindeberg.jpg| Nyhetsjägaren: kvinna 30–40, mikrofon/telefon, vid stallbacken |

## VYTOPPARNA — 2 valfria

| Filnamn        | Storlek  | Plats | Motiv |
|----------------|----------|-------|-------|
| hage.jpg       | 1200×800 | Avelsvyns topp (reserv gard-hero) | Ston med föl i sommarhage, morgondis |
| sasong-slut.jpg| 1200×800 | Säsongsavslutets topp (reserv bana-kvall) | Tom travbana i höstljus, löv på upploppet, nedsläckta strålkastare |

## DRÄKTERNA — 8 foton (mockupstilen)

Dräktvalet visar en inbyggd SVG-illustration tills fotona finns — lägg
dem här så används de automatiskt i BÅDE stora förhandsvisningen och
tumnaglarna (samma foto bär båda; enhetligheten är premiumkänslan).

FORMAT: 800 × 1000 px (4:5) JPG, ljus beige/grå studiofond INBAKAD
(ingen genomskinlighet), under 250 kB. Halvkropp rakt framifrån:
hjälm i accentfärgen med MÖRKT VISIR (inga ansikten), blank tävlings-
jacka i grundfärgen med brett bröstband och ärmdetaljer i accentfärgen,
vit byxlinning i underkant. EXAKT samma kameravinkel, ljus och
beskärning på alla åtta — generera gärna alla i samma svep med samma
grundprompt och byt bara färgorden.

Promptstomme: "studio product photo, front view, harness racing driver
suit on invisible mannequin, glossy racing jacket, dark visor helmet,
white pants, soft beige studio background, symmetrical, centered" +
färgerna nedan.

| Filnamn (EXAKT, med åäö) | Tröja (grund) | Band/manschett/hjälm |
|--------------------------|---------------|----------------------|
| drakt-vinröd.jpg   | Vinröd #7a1f2b | Guld #e8c766 |
| drakt-kungsblå.jpg | Kungsblå #1d3f8f | Vit #f5f5f0 |
| drakt-grön.jpg     | Skogsgrön #1f5c33 | Gul #f2d43d |
| drakt-svart.jpg    | Svart #191919 | Orange #f28c28 |
| drakt-vit.jpg      | Vit #f2efe8   | Röd #b3252e |
| drakt-lila.jpg     | Lila #4b2a6b  | Silver #cfcfd6 |
| drakt-brun.jpg     | Kastanj #5c3a21 | Kräm #efe3c8 |
| drakt-turkos.jpg   | Petrol #0f5a5f | Vit #f0f4f2 |

Filnamnen följer dräkternas id och innehåller åäö — drakt-vinröd.jpg,
drakt-kungsblå.jpg, drakt-grön.jpg. PNG fungerar också (provas som
andrahand), men jpg med inbakad fond är enklast och minst.

## IKONERNA — appens ansikte

| Filnamn   | Storlek | Format | Används till | Motiv |
|-----------|---------|--------|--------------|-------|
| ikon.png  | 512×512 | PNG, HELT UTAN genomskinlighet, motiv inom mittre 80 % (maskable) | PWA-ikon (hemskärm Android/desktop) och apple-touch-icon | Stiliserad travhäst med sulky i profil på mörk botten (#0E141B), guldgul accent (#F2B134). Enkel siluett — läsbar i 48 px |

En fil räcker: manifestet pekar på ikon.png för både "any" och
"maskable", och index.html använder samma fil som apple-touch-icon.
Vill du finlira: en variant 180×180 döpt apple-touch-icon.png med lite
mer luft — men det är överkurs, iOS skalar 512:an fint.

Favicon behövs inte separat — appen körs som PWA/hemskärmsapp.

## PRESSBILDERNA — hur tidningen använder bilderna

Pressnotiserna i Sfären är medvetet bildlösa (radhöjd och lästempo).
Bilden hör till TIDNINGSSIDORNA — helskärmsscenerna i stil "tidning" —
och där gör samma foto dubbel tjänst: scenen tonar det mot svartvitt
med förhöjd kontrast så att det ser ut som ett pressfoto, medan
kvällsscenerna visar det i färg. Du behöver alltså INTE separata
pressversioner: gör bilderna i färg med dokumentär ton, så sköter
CSS-filtret tidningskänslan.

Tidningssidor och deras bilder (allt via reservkedjan ovan):
  Storloppsseger → seger    Arvet → arv          Avskedet → avsked
  Rekordet → rekord         Eleven → rivaler     Skadan → skada
  Comebacken → comeback     Runan → mentor       Generationsskiftet → gard-hero
  Storloppsfacit → facit.jpg (valfri extra: tom vinnarcirkel i regn,
  reserv bana-kvall)

## KÖNSLOGIKEN

Personerna dras ur namnpooler med både kvinnor och män (mentorerna är
två av varje). Bildplatserna väljer därför fil efter förnamnet
(`könAvFörnamn` i data-namnpaket.js — exakt uppslagning, alla namn är
våra egna) med reservkedja: `mentor-kvinna.jpg → mentor.jpg → initialer`.
Berit får aldrig mer bild på en karl.

## PROMPT-TIPS (gäller alla)

- Skriv uttryckligen "harness racing, sulky, Swedish trotting horse" —
  AI-verktyg ritar annars engelska galopphästar med jockey.
- "Muted Nordic light, overcast, documentary photography, 35mm" ger
  rätt ton. UNDVIK "cinematic, epic, dramatic lighting" — det blir
  glansig sportreklam, och spelets formspråk är blekt papper och
  kvällsmörker.
- Kvällsbilderna: "floodlit racetrack at night, warm sodium light" —
  strålkastargult (#F2B134) är spelets accentfärg, bilder som bär den
  tonen smälter in.
- Porträtten: "weathered face, work clothes, natural light" — inga
  studioleenden. Människorna i spelet arbetar i stall.
- Håll bildernas underkant ren: scenrubrikerna ligger direkt under.

## PRIORITETSORDNING OM TIDEN ÄR KNAPP

1. ikon.png — syns varje gång appen öppnas
2. seger.jpg — spelets vanligaste stora bild
3. gard-hero.jpg — första bilden en ny spelare ser
4. mentor.jpg + bana-kvall.jpg
5. resten av kärnan
6. hästhuvudena (6 st) — syns i varje stallbesök, störst vardagseffekt
7. scenutökningen, i den ordning karriären hinner dit:
   kontor → skada → avsked → arv → krans → samtalet → övriga
8. banorna, journalisterna, vytopparna och pälsvarianterna sist
