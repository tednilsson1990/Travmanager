# UTVECKLINGSPLAN (Teds dokument efter v78)

Arbetslistan framåt; bocka av med [KLART vNN].

- TRAVMANAGER
- Samlad utvecklingsplan efter v78
- Kodgranskning · Design · Travrealism · Story · Managerdel
- Utvecklingsunderlag för fortsatt arbete i Claude
## 1. Övergripande riktning
- Travmanager har nu tre tydligt starka kärnor:
- En avancerad och trovärdig loppsimulator.
- En berättelsevärld med prolog, media, relationer och karriärminne.
- En egen visuell identitet som blandar sportpress, tävlingsprogram och managerspel.
- Nästa steg bör inte vara att lägga till slumpmässiga funktioner. Fokus bör ligga på att rätta tekniska fel, göra loppen lättare att förstå, utveckla managerdelen betydligt mer och göra den avancerade koden synlig i gränssnittet.
## 2. Kritiska tekniska åtgärder
## 2.1 Rätta HÄSTVARIANTER-felet [KLART v79]
- Felet “Can't find variable: HÄSTVARIANTER” orsakas av att ui-grafik.js använder konstanten utan att importera den.
- Detta är högsta prioritet eftersom felet kan blockera hela appen när en hästbild ska renderas.
## 2.2 Utöka verifieringen
- Odefinierade variabler och konstanter.
- Saknade imports och felstavade identifiers.
- Exports som refereras men inte finns.
- Bildnamn som registrerats men saknas.
- Vyer som kraschar vid faktisk rendering.
## 2.3 Fullständigt smoke test
- Ett automatiskt användarflöde bör gå igenom hela huvudresan:
- Ny karriär
- Prologens första scen
- Namnval
- Stallnamn
- Dräktval
- Hemvyn
- Stallvyn och hästsidan
- Gårdsvyn
- Loppanmälan och kuskval
- Spårlottning och pressfråga
- Startlista
- Genomfört lopp
- Resultat och efterloppsscen
- Sparning och omladdning
## 2.4 Felhantering och diagnostik [KLART v79 utom Återgå till Hem]
- Ladda om.
- Kopiera felrapport.
- Återgå till Hem.
- Exportera sparfil för felsökning.
## 2.5 Sparsäkerhet [KLAR v149 — indikator, export/import (v79); autobackup: 3 rullande generationer inför varje ny vecka, återställning + filimport under Kontoret → Felsökning. Manuella sparplatser bedömda överflödiga: backupkedjan + export täcker behovet]
- Synlig sparindikator och tidpunkt för senaste lyckade sparning.
- Varning om sparningen misslyckas.
- Export och import av karriär.
- Flera sparplatser.
- Automatiska säkerhetskopior.
- Möjlighet att återställa senaste veckosparningen.
- Ett managerspel som ska kunna spelas i flera decennier måste behandla sparfilen som något mycket värdefullt.
## 3. Travspelarens perspektiv
- En travspelare kommer främst bedöma trovärdigheten i startlistor, spelprocent, utrustning, positioner, kuskarnas körsätt, lopptempo, taktiska beslut, galopper, propositioner och resultat över tid.
## 3.1 Kompletta startlistor [DELVIS v81 — utfällbara rader; utrustning saknas]
- Startnummer och spår
- Häst, ålder och kön
- Kusk och tränare
- Rekord och startprissumma
- Starter i år och segerprocent
- Senaste fem starterna
- Skor, balans och vagn
- Spelprocent och trend
- Galoppmarkeringar
- På mobil visas en kompakt rad som kan fällas ut för detaljer.
## 3.2 Levande spelprocent [KLART v81]
- Öppningsprocent
- Aktuell procent
- Förändring över tid
- Favoritmarkering
- Mest spelad senaste perioden
- Möjlig marknadsförklaring
- Spelet ska inte avslöja en exakt sann vinstchans. Osäkerhet och felvärderingar är en central del av travspel.
## 3.3 Varför marknaden spelar en häst [KLART v81]
- Bra spår
- Toppkusk
- Barfota för första gången
- Positiv tränarintervju
- Två raka segrar
- Svag form hos motståndarna
- Stort stall eller medial uppmärksamhet
## 3.4 Utrustning och balans
- Barfota runt om, fram eller bak
- Skor runt om
- Vanlig vagn eller amerikansk sulky
- Öppet, stängt eller norskt huvudlag
- Tydliga förändringar från föregående start
- Utrustningen ska påverka olika hästar olika. Det får inte finnas ett universellt bästa val.
## 3.5 Kuskstatistik och körstil
- Offensivitet
- Tålamod
- Startsnabbhet
- Voltstart
- Tempokänsla
- Förmåga i ryggar och ledningen
- Vilja att gå först i tredjespår
- Galoppsäkerhet
- Relation till hästen
## 3.6 Bättre travspråk [DELVIS v79 — utflyttningsrepliker]
- Den upprepade formuleringen “går ut och upp utvändigt” bör ersättas av situationsbaserade kommentarer:
- Går först i tredjespår.
- Hakar på i rygg.
- Lämnar andra utvändigt.
- Söker sig ut.
- Blir hängande.
- Når fram till dödens.
- Får andra utvändigt.
- Tappar ryggen.
- Provar i fjärdespår.
- Blir kvar invändigt.
- Söker lucka.
- Bromsas bakom trött häst.
## 3.7 Kilometertid och analys efter loppet [KLART v88 — alla nio måtten i efterloppsanalysen]
- Position vid 1 500, 1 000 och 500 meter kvar
- Meter i ledningen och utan rygg
- Meter i tredjespår
- Extra löpt väg
- Attackpunkt
- Avslutning sista 500
- Kraft kvar
- Galopp eller instängning
- Tempo första och sista varvet
## 4. Travtränarens perspektiv
- En travtränare kommer framför allt bedöma vardagen: träningsplanering, hälsa, återhämtning, matchning, personal, hästägare, ekonomi, resor, anläggning och långsiktiga mål.
## 4.1 Veckoplanering och stallmöte [KLART v84 — veckoslots, stallmöteskort, slot-medveten plan; fler passtyper kvar]
- Vila och återhämtning
- Lugnt jobb och intervaller
- Snabbjobb och backträning
- Start- och voltträning
- Miljöträning
- Veterinärkontroll
- Tävling och transport
## 4.2 Delegering
- Full kontroll: Spelaren bestämmer allt.
- Rådgivning: Förstamannen föreslår men frågar alltid.
- Delvis delegering: Förstamannen sköter vardagsträning och enklare matchning.
- Hög delegering: Spelaren fokuserar på stjärnhästar, storlopp, ekonomi och strategi.
## 4.3 Matchningsplan per häst
## 4.4 Hästens status
- Grundkapacitet
- Träningsform
- Dagsform
- Energi
- Hälsa
- Självförtroende
- Mental belastning
- Skaderisk
- En häst kan vara vältränad men trött, frisk men ur form eller i form men mentalt sliten.
## 4.5 Veterinär, hovslagare och skötare
- Hältkontroll, luftvägar, tänder och rehabiliteringsplan.
- Förebyggande undersökning och andra utlåtande.
- Hovslagarens kompetens inom balans, travsäkerhet och problemhovar.
- Passhästskötare som påverkar välmående, rapporter och tidig upptäckt av problem.
## 4.6 Transport och propositioner
- Avstånd, kostnad och restid
- Hästens resvana
- Övernattning
- Transportkapacitet
- Flera hästar på samma tävlingsdag
- Personalbehov
- Propositioner måste konsekvent kontrollera ålder, kön, startprissumma, tillägg, klass, distans, startmetod och kvalificering. En tioårig debutant ska inte hamna i ett åldersbegränsat unghästlopp.
## 5. Travjournalistens perspektiv [DELVIS v89 — förstasidan, rösterna, frågeminnet, favoritkritiken]
- En travjournalist kommer bedöma om världen producerar riktiga berättelser eller bara slumpmässiga rubriker. Journalisten vill se sammanhang, historik, personer, konflikter, uppföljningar, statistik och citat.
## 5.1 Berättelsetrådar över tid [DELVIS v82/v89 — trådarna på Hem; tidningens uppföljningar kvar]
## 5.2 Journalister med identitet [DELVIS v62/v89 — tre röster med egna avdelningar; tre identiteter kvar]
- Lokalreporter
- Statistiker
- Tidigare kusk
- Kritisk krönikör
- Sensationsreporter
- Branschjournalist
## 5.3 Nyhetsvärdering [KLART v89 — betydelsestyrd förstasida i tre storlekar]
- Sportslig betydelse
- Överraskning
- Lokal relevans
- Personkoppling
- Historisk betydelse
- Konflikt
- Ekonomisk betydelse
- En vanlig lunchseger ska inte få samma rubrikstorlek som stallets första storloppsseger.
## 5.4 Pressfrågor med minne [KLART v89 — alla tre exempelfrågorna, deterministiskt ur historiken]
- “Du har tonat ner hästen inför de tre senaste starterna. Är det försiktighet eller är du inte nöjd?”
- “Förra gången lovade du seger och hästen blev sexa. Varför ska spelarna tro på dig nu?”
- “Din tidigare förstaman möter dig som tränare för favoriten. Hur känns det?”
## 5.5 Statistik och rimlig kritik [KLART v89 — favoritfacit, mönsterkritik med nollställning, saklig krönika]
- Kritik bör främst uppstå efter upprepade favoritmisslyckanden, tveksam matchning, brutna löften, kuskkonflikt, svag stallform eller ekonomiska problem. Det ska kännas som sportjournalistik, inte dokusåpa.
## 6. Travmanager som verksamhetsspel
- Spelet heter Travmanager. Därför måste spelaren hantera en riktig travverksamhet, inte bara träna och starta hästar.
- Hästägare
- Sponsorer
- Ekonomi
- Personal
- Anläggning
- Stallplatser
- Marknad
- Kundrelationer
- Varumärke
- Långsiktig strategi
## 7. Hästägare som kärnsystem [DELVIS v84 — profiler, tvådimensionell nöjdhet, möten, konsekvenser]
## 7.1 Ägarprofiler [KLART v84 — fem typer, deterministiska ur namnet; andelsstallet kvar]
- Namn och ägartyp
- Ekonomi och investeringsvilja
- Tålamod och riskvilja
- Sportslig ambition
- Relation till spelaren
- Kommunikationsstil
- Favorithästar och tidigare stall
## Ägartyper
- Småägaren: Har en eller två hästar och är känslomässigt engagerad.
- Uppfödaren: Vill utveckla sin egen stam och tänker långsiktigt.
- Företagaren: Vill ha synlighet och representation.
- Storsatsaren: Köper dyrt och kräver resultat.
- Travfamiljen: Har traditioner, kontakter och tydliga åsikter.
- Andelsstallet: Många delägare, mer administration och större medial potential.
## 7.2 Ägaravtal och möten [DELVIS v84 — möten med tålamodsförhandling; avtalsvillkoren kvar]
- Träningsavgift
- Provision på prispengar
- Vem som bestämmer kusk och försäljning
- Ambitionsnivå och avtalstid
- Kostnadsansvar
- Kommunikationskrav
- Inför säsongen eller viktiga beslut kan ägaren vilja diskutera huvudmål, budget, kusk, utrustning, försäljning, avel, vila eller tränarbyte.
## 7.3 Ägarnöjdhet [KLART v84 — sport + kommunikation, typskalat, hästen flyttas vid bristning]
- Resultat jämfört med förväntningar
- Kommunikation
- Hästens utveckling och välmående
- Matchning
- Ekonomiskt utfall
- Hållna löften
- Medial synlighet
- En nöjd ägare kan lämna fler hästar, rekommendera stallet, köpa en bättre häst eller bidra till en investering. En missnöjd ägare kan kräva möte, byta kusk, stoppa en start, sälja eller flytta hästen.
## 8. Sponsringssystem [KLART v84 grund — sex typer, krav, verkliga förmåner, säsongsutvärdering]
## 8.1 Sponsortyper [KLART v84 — sex av nio typerna]
- Lokal företagspartner
- Foderleverantör
- Transportföretag
- Utrustningsleverantör
- Veterinärklinik
- Bilhandlare
- Regionalt varumärke
- Nationell huvudsponsor
- Tävlingspartner
## 8.2 Erbjudanden och krav [DELVIS v84 — ersättning, bonus, transport-/foderförmån; byggbidrag och representationsdagar kvar]
- Fast säsongsersättning
- Seger- och storloppsbonus
- Utrustningsrabatt
- Transportstöd
- Byggnadsbidrag
- Synlighet och renommé
- Sponsorer kan samtidigt kräva visst antal starter, lokal närvaro, intervjuer, goda resultat, representationsdagar eller professionell nivå på gården.
## 8.3 Förhandling och konflikt [DELVIS v84 — konflikten bor i kravtyperna hemmastarter mot segrar; förhandling kvar]
- En lokal sponsor kan vilja att stallet tävlar mer på hemmabanan, medan en nationell sponsor vill se storlopp och större synlighet. Sponsring ska ge pengar, men också relationer, krav och strategiska val.
## 9. Gårdens faciliteter och utveckling
## 9.1 Stall och kapacitet
- Nya boxar
- Fölboxar
- Sjukbox
- Karantänbox
- Gästboxar
- Ventilation
- Tvättplatser
## 9.2 Träningsfaciliteter
- Rakbana
- Rundbana
- Träningsbacke
- Skogsslinga
- Djupsand
- Vattenband
- Skrittmaskin
- Ridbana
- Start- och voltträningsområde
## 9.3 Hälsa, administration och logistik
- Spolspilta, kylutrustning och solarium
- Rehabiliteringsdel och veterinärundersökningsrum
- Stallkontor, personalrum, ägarlounge och mötesrum
- Transportgarage, lastningsramp, foderlager och gödselhantering
- Fölstall, fölhagar och unghästavdelning
## 9.4 Gårdsnivåer och specialisering
- Litet stall: 4-6 boxar och enkel träningsslinga.
- Etablerat stall: 10-16 boxar, rakbana och egen personal.
- Professionellt tävlingsstall: 20-30 boxar, rehabilitering, transport och ägarutrymmen.
- Elitstall: Flera stallängor, komplett träningsanläggning, avel och specialistpersonal.
- Utvecklingen bör inte vara helt linjär. Spelaren ska kunna specialisera sig som unghäststall, storloppsstall, breddstall, rehabiliteringsstall, uppfödarverksamhet eller litet exklusivt kvalitetsstall.
## 9.5 Byggprojekt och visuell gård
- När en facilitet byggs ska den dyka upp på gårdskartan. Spelaren ska visuellt kunna följa resan från fyra boxar till en större verksamhet.
## 10. Ekonomi och affärsmodell
## 10.1 Intäkter
- Träningsavgifter från ägare
- Procent på prispengar
- Egna prispengar
- Sponsorer
- Hästförsäljningar
- Avelsintäkter
- Uppfödarpremier
- Bonusar och event
## 10.2 Kostnader
- Löner och sociala kostnader
- Foder och strö
- Veterinär och hovslagare
- Transporter och kuskar
- Startavgifter
- Anläggningsdrift
- Lån och byggnation
- Utrustning, försäkringar och administration
## 10.3 Prognos och kostnad per box [DELVIS v84 — Kontorets ekonomi: fast veckonetto, veckor kvar, tomma boxars kostnad]
- Kassa
- Fasta veckokostnader
- Kostnad per häst
- Garanterade intäkter
- Beräknad likviditet
- Antal veckor kassan räcker
- Pågående investeringar
- Kommande större utgifter
- En tom box ska vara en ekonomisk förlust. En extern ägarhäst ger stabil träningsavgift, medan en egen häst kan ge större uppsida men högre risk.
## 11. Personalorganisation
- Förstaman: Träningsplan, matchning, personalledning, rådgivning och delegering.
- Hästskötare: Passhästar, välmående, rapporter, resor och ägarkontakt.
- Unghästansvarig: Inkörning, utveckling, travsäkerhet och mental status.
- Veterinär: Hälsa, behandling, rehabilitering och skadeförebyggande.
- Hovslagare: Balans, hovhälsa, travsäkerhet och utrustningsråd.
- Administratör: Anmälningar, ekonomi, avtal och sponsoradministration.
- Transportansvarig: Resor, logistik, samordning och transportkostnader.
- Kommunikationsansvarig: Media, sponsorer, event och stallprofil i större stall.
- Alla roller behöver inte finnas från början. Organisationen ska växa i takt med stallet.
## 12. Design och premiumkänsla
- Spelets nuvarande identitet bör behållas: varm benvit bakgrund, mörk marinblå, tegelröda detaljer, sportpressrubriker, tävlingsprogram och dokumentära bilder.
- Premiumkänslan ska komma från bättre informationshierarki, mer levande miljöer, tydligare återkoppling, konsekventa animationer, bättre ljud, mänskliga reaktioner och färre repetitiva texter.
## 12.1 Prologen
- Säkra mobilmarginaler.
- Tillbakaknappen får inte täcka text.
- Responsiv rubrikstorlek.
- Mindre tom yta.
- Konsekvent scenmall.
## 12.2 Hemvyn [DELVIS v83 — förstamannens kommentar; kvar: väder/årstidsbild]
- Gårdsbild som ändras med tid, väder och årstid
- Huvudnyhet
- Att göra
- Nästa lopp
- Stallstatus
- Ekonomisk sammanfattning
- Förstamannens kommentar
- Nyheter från världen
## 12.3 Navigation och topprad [DELVIS v84 — Kontor tillagt under Mer]
- Komprimera toppraden i lopp och artiklar. Förtydliga “Spelarna” till “Spelförtroende”. Överväg att byta “Mer” mot “Verksamhet”, med Gård, Ekonomi, Marknad, Avel, Sponsorer och Historik.
## 13. Loppresentationen
## 13.1 Två lägen [KLART v84]
- TV-läge: Stor bana, kommentator, främsta hästarna och mindre teknisk information.
- Analystläge: Hela fältet, positioner, kraft, fart, ryggkedjor och attackdata.
## 13.2 Tydliga händelsenivåer
- Stor händelse
- Galopp
- Diskvalifikation
- Ledningsbyte
- Upplopp
- Målgång
- Taktisk händelse
- Först i tredjespår
- Släpper ledningen
- Får andra utvändigt
- Blir instängd
- Får lucka
- Detalj
- Mindre positionsjusteringar
## 13.3 Kontroller och dramaturgi [DELVIS v84/v86 — slutordern ges i kusksamtalet före loppet och verkställs vid 500 kvar; autosänkning och fler farter kvar]
- Markera spelarens häst konsekvent.
- Automatiskt gå från 3× till 1× vid viktiga händelser.
- Ha fasta kontroller för paus, 1×, 3×, 10×, till 500 kvar, till upploppet och till mål.
## 14. Efterloppsanalys [KLART v88 — plan, resa, avgörande, det goda, nästa steg]
- Efter loppet ska spelaren förstå vad planen var, vad som hände, vilket beslut som blev avgörande, vad hästen gjorde bra och vad nästa steg bör vara.
## 15. Storysystemet ska synliggöras [DELVIS v82 — Pågående berättelser på Hem; avslutade/historiska finns i Albumet]
## Pågående berättelser
- Satsningen mot finalen
- Tränare under press
- Rivalitet
- Missnöjd ägare
- Förstaman funderar på framtiden
- Comeback
## Avslutade berättelser
- Första segern
- Lyckad comeback
- Flyttbeslut
- Gammal rivalitet
## Historiska ögonblick
- Första miljonen
- Första storloppssegern
- Ligaseger
- Gårdsrekord
- Viktig pensionering
## 16. Prioriterad utvecklingsordning
## 17. Slutmål
- Travspelaren: “Loppen och startlistorna går att analysera på riktigt.”
- Travtränaren: “Spelet förstår att arbetet sker varje dag, inte bara när startbilen släpper fältet.”
- Travjournalisten: “Världen producerar riktiga berättelser med sammanhang, statistik och människor.”
- Managerspelaren: “Jag bygger en verksamhet, hanterar ekonomi, personal, ägare, sponsorer och en gård som växer över tid.”
- Den långsiktiga spelaren: “Min karriär är unik och spelet kommer ihåg vad jag har gjort.”

## 17. Öppen värld med tydlig riktning (Teds tillägg, juli 2026) [DELVIS v84/v90]

Spelet ska kännas öppet men aldrig lämna spelaren undrande: två frågor ska
alltid gå att besvara — vad KAN jag göra, och vad BÖR jag göra härnäst?
Öppna mål i stället för uppdrag: alla val är rätt, inget bockas av för
belöning. (Ur separat designdokument; fullständig text hos Ted.)

## 17.1 Kortsiktiga mål [DELVIS v90 — härledda veckouppgifter i vägvisaren, angelägnast först]
## 17.2 Långsiktiga mål [DELVIS v90 — närmaste milstolparna med progress i Längre fram-blocket]
## 17.3 Mentor och förstaman som vägvisare [DELVIS v82 — förstamansraden på Hem; mentorns korta råd kvar]
## 17.4 Verksamhetsmål (stallinriktning: unghäst/elit/bredd/familj/avel/storlopp) [EJ PÅBÖRJAT]
## 17.5 Dynamiska rekommendationer [DELVIS v84/v90 — verksamhet, ekonomi, form och relationer täcks i Nästa steg]
## 17.6 Öppna mål i stället för uppdrag [PRINCIP — styr 17.1–17.5; inget belönas för avbockning]
## 17.7 Säsongsplan från förstamannen [EJ PÅBÖRJAT — presenteras som förstamannens ÅSIKT i löptext, inte som mätbar kravtabell (beslut efter v84-diskussionen)]


## 18. Tävlingssystem, klasser och anmälan (Teds designmanual v1, juli 2026) [EJ PÅBÖRJAT — dokumentet är källan; detta är lägesindex]

Kärnbeslutet: VAR ska hästen starta, NÄR, och vilket lopp balanserar
vinstchans, utveckling, ekonomi och långsiktigt mål? Propositionen avgör
behörighet — klassetiketten är bara vägledning. Fastställda spelregler:
autostart högst 12 (spår 1–8 + 9–12, aldrig tredje led), voltstart högst
15 varav högst 12 per distans, monté auto högst 10. Föränderliga gränser
i säsongsdata; taken är centrala valideringsgränser. Transparenskravet
gäller allt: spelaren får alltid en konkret förklaring.

## 18.1 Proposition och behörighet (dok kap 2, 4) [DELVIS v92 — behörighet med exakta sifferorsaker ur befintliga krav; segergränser, kvalstatus och licenser kvar]
## 18.2 Klasspyramid och nivåetikett (dok kap 3) [DELVIS v92 — nivåetikett med pengafönster + klassklättringsvarningen före anmälan; hela pyramiden 0–7 och STL-divisionerna kvar]
## 18.3 Loppväljaren i fyra grupper (dok kap 6.2–6.3) [KLART v96 — fyra grupper med orsak (v92) + bedömningsnivåer 0/1/2 efter organisationen med gränsminne (v96)]
## 18.4 Anmälan som process (dok kap 6–7) [KLART v96 i grunden — uttagning (v93) + delning i jämna avdelningar även i världsveckan (v96); anmälningsfönster över veckor och mörk anmälan kvar som fördjupning]
## 18.5 Startfält och spår (dok kap 5, 8) [KLART v94 i grunden — taken (v92), tillägg/andra volten (fanns), spårtrappa och spårkaraktär synliga i lottning och kusksamtal; situationsberoende bakspårsdjup som förfining]
## 18.6 Kuskbokning och licenser (dok kap 9) [KLART v97 i grunden — statusar, relationsstyrd bekräftelse efter uttagningen, reservval; lärlingslicenser kvar]
## 18.7 Tävlingsplanering och matchningsassistent (dok kap 10) [DELVIS — loppmatchning + vägvisaren är embryon; personalens OENIGA röster kvar]
## 18.8 Startens verkliga kostnad (dok kap 11) [DELVIS v84 — insats/risk-rutan täcker arvode+resa+risk; personal, övernattning och chansprocent kvar]
## 18.9 AI-tränarnas loppval (dok kap 12) [KLART v95 — sex profiler, viktad nytta, synfel, klassklättringsmedvetenhet, gemensam anmälningskarta för spelaruttagning och världsvecka]
## 18.10 STL, serier, försök/final och årgångsvägar (dok kap 3.3–3.4, 4.7) [EJ PÅBÖRJAT — storloppsbågen är embryot till årgångsvägen]


# 19. INKORGEN — spelets nav (Teds dokument, juli 2026)

Teds kärninsikt ur Football Manager: inkorgen är inte en funktion utan
SPELETS MOTOR — nästan varje beslut börjar där, nästan varje system
kommunicerar genom den. Det här kapitlet är dokumentet inarbetat mot
det som redan finns i kodbasen.

## 19.1 Händelsesystemet (grunden — byggs först) [KLART v99 — engine-inkorg.js med formatet, sex källadaptrar, id-stabil derivation]
Ett gemensamt händelseformat: { avsändare, typ, prioritet, text,
genväg, beslut? }. Typerna ur dokumentet: sms/chatt, telefonsamtal,
mejl, rapport, nyhet — SAMMA data, olika presentation. Prioriteterna
är dokumentets tre nivåer: information / rekommendation / beslut krävs.
VIKTIGT: nästan alla källor finns redan som motorer — vägvisarens
nästaSteg (rekommendationer), pressen och huvudnyheten (nyheter),
uttagningsbeskeden (mejl), stallmötets slots (rapporter), ägar- och
sponsormöten (telefonsamtal), veterinär/skador (rapporter),
travbladet (nyheter). Inkorgen UNIFIERAR dem — den ersätter inte
motorerna, den blir deras gemensamma postlåda.

## 19.2 Veckobrevet
Vid varje ny vecka öppnas inkorgen först: "Vad har hänt?" (världens
resultat, pressen, ekonomiutfall) och "Vad bör jag göra nu?"
(vägvisarens rader som klickbara händelser). Hem-flikens Nästa
steg-panel migrerar in hit när inkorgen finns.

## 19.3 Genvägarna
Varje händelse pekar på sin vy: proposition → anmälan med loppet
förvalt; träningsrapport → hästsidan; sponsorbrev → kontoret; artikel
→ Travbladet. Inkorgen är aldrig en återvändsgränd (samma princip som
uttagningsbeskedets alternativlopp).

## 19.4 Historiken
Inkorgen sparas per säsong och blir karriärens dagbok: första hästen,
första segern, avgörande beslut. Sparfilstak: äldre säsonger
komprimeras till milstolpar (max ~40 rader/säsong).

## 19.5 Etappordning
A [KLART v99]: händelseformatet + inkorgsvyn (läsa, prioritetsmärken, genvägar) —
befintliga källor adapterade. B [KLART v100]: veckoskiftet landar i inkorgen; Nästa steg-panelen och förstamansraderna migrerade in.
C [PÅBÖRJAD v100, förhand/helskärm v103]: beslutsformatet + verkställBeslut; sponsorerbjudandet och träningsjusteringen besvaras i raden; tre läsdjup med långtextfält och storyn i posten (huvudnyheten + följetongen ur delad källa). Kvar: hästköpsbud. [v110: ägarfrågorna byggda — tacksamtalet, otåliga samtalet med ägarlöftet (uppföljt i veckomotorn med belöning/ras), löftesbrottets sms; kuskens måndagsröst] [v108: veterinärens vilobeslut och skötardagen tillkom; läsvyn med FM-anatomi; alla typer i sina riktiga format] D: historiken och dagboken. Story-principen från v98
gäller: inkorgen är ett EGET rum, inte insprängd i andra vyer.


# 20. FM-INSPIRATIONEN — karriärberättelsen (Teds dokument 2, juli 2026)

Teds slutsats är kapitlets ledstjärna: det största att ta från Football
Manager är ingen enskild funktion utan att spelet SKAPAR EN BERÄTTELSE
OM KARRIÄREN. Efter tio säsonger ska spelaren minnas ögonblicken —
"kommer du ihåg när Rimfrost Bris vann Derbyt fast ingen trodde på
henne?" Allt nedan tjänar det målet.

## 20.0 Ärlig lägesbild mot Teds 17 punkter
FINNS REDAN (helt eller i grunden): efteranalysen (kap 14, v88 — Teds
punkt 8 nästan ordagrant), inför lopp (kusksamtalet, spårtrappan,
Travbladets förhandstext — punkt 7), inbox-nivåerna 🟢🟡🔴 (punkt 16 =
inkorgens tre prioriteter, v99), personligheter (ägartyperna,
tränarfilosofierna med synfel, förstamansprofilerna — punkt 4),
relationer i grunden (kuskrelationen med spelmekanisk tyngd v97,
ägarnas tvådimensionella nöjdhet — punkt 3), nyhetsvärld i grunden
(Travbladet, krönikan, statistikern — punkt 5/13), viss historik
(presshistoriken, rivaliteterna, tidigare förstamän — punkt 1 i frö).
STÖRSTA GAPEN: kontinuitetsminnet (punkt 1 — spelet VET mycket men
REFERERAR sällan), statistiklagret (punkt 2 — data finns i resultat-
raderna men aggregeras inte), världens utveckling över säsonger
(punkt 17 — pensioneringar/generationsskiften finns för hästar,
inte för tränare/kuskar/journalister), milstolpar/Hall of Fame/
ikoner (9–11), rykten (12), scouting (14), hästägargruppen som
styrelse (15), veckomötet (6 — stallmötet finns men är slots, inte
genomgång).

## 20.1 Händelsestyrd klocka (Teds tidsidé — bygger direkt på inkorgen)
"Det behöver inte vara nästa vecka man hoppar fram — kanske några
timmar, en dag, en vecka, beroende på vad som händer och vilka
notiser som kommer."
ARKITEKTUR: veckan FÖRBLIR motorernas ryggrad (allt är veckonycklat —
en riktig dygnsklocka vore en omskrivning). Men veckan får STOPP:
en händelsekö per vecka (måndag: veckobrevet i inkorgen · tisdag:
anmälningarna stänger · onsdag: uttagningsbeskeden · torsdag:
kuskbekräftelserna · fredag–söndag: loppdagar · söndag kväll:
efteranalys + Travbladet). Knappen är inte "Kör veckan" utan "HOPPA
FRAM" — till nästa stopp som har något åt dig. Tomma stopp slås ihop
(inget åt dig ons+tors ⇒ hoppet går direkt till loppdagen). Det ger
FM-känslan av levd tid utan att röra motorernas veckologik, och löser
en verklig skavank: i dag sker anmälan → uttagning → lopp i en enda
sittning. Etapp: A [KLART v101; v107: delningen enligt verklighetens regler — spontandelning med lottning och reservpåfyllning, delningsproposition med prissummegrupper, arrangörsbroms, stabil anmälningskarta inom veckan, körd per häst. Seedad delning med tränarspridning väntar på serierna 18.10] — tre stopp (måndag/onsdag/helg), hoppknapp i
stall+inkorg med sammanslagning och förfallovarning, anmälan som
inlämning, beskedskö på onsdagen, loppdagskö på helgen, stoppnotiser
i inkorgen], B) loppdagar utspridda över fler dagar, C) notiser
tidsstämplade per stopp i historiken.

## 20.2 Kontinuitetsminnet (punkt 1 — "allt kommer ihåg") [GRUNDEN KLAR v104 — engine-minnen.js: karriärtotaler med ärlig grundplåt, loppfacit, rivalernas senast-vann; rader i lottningen, efteranalysen och inkorgen. KONTINUITETSPASSET v153 — gamla bekanta: sålda OCH ägarflyttade hästar lever vidare i världen (flytten raderade dem förut — lagat), stamboken följer deras segrar och pressen skriver "Gamla bekanta" (högst en rad/vecka); rivalfacit över karriären (spel.rivalfacit, räkningen i press + rivalens sms från möte 2); öde "flyttad" i stamboken. MINNESPUTSEN v156 — exägarmötet: står en såld/flyttad häst i fältet säger kusksamtalet det (minnenInförLopp läser stamboken); Travbladet-injektionen täcks av v153:s Gamla bekanta; säsongsfacit per lopp täcks av loppfacit (v104). 20.2 KOMPLETT]
En referensmotor (engine-minnen.js): ren läsning av det som redan
sparas, som producerar KONTEXTRADER överallt: "din 100:e seger om ni
vinner" (räknat ur facithistoriken), "ni möttes i våras — Stormvind
med nos" (rivaliteterna), "du vann det här loppet förra säsongen"
(loppnamn i facit). Raderna injiceras i kusksamtalet, Travbladet,
inkorgen och efteranalysen. Kräver att facit sparas per säsong med
loppnamn — kontrollera sparfilstaket.

## 20.3 Statistiklagret (punkt 2 — "grotta ner sig i timmar") [GRUNDEN KLAR v109 — ledningsklassen i målraden (ren observation), banan i resultatraden, engine-statistik med häst- och tränaraggregat, Statistiken under Mer. VÄDRET ETAPP A v154 — engine-vader.js: deterministiskt veckoväder (sol/mulet/regn, snö bara i vinterfönstret = barfota-reglerna), på telefonens hemskärm, i loppfakta och stämplat på varje resultatrad; statistiken grupperar ('är hon en regnhäst?'). EFFEKTEN (tider/galopprisk i väta) är motorändring — byggs med Ted vaken. REKORDÅRET v156 — bästa säsongen märks ut i Journalens säsongsflik (mest insprunget, segrar skiljer, kräver ≥2 säsonger). Kvar: open stretch-statistik (kräver open stretch-användning i raderna — motordata)]
Aggregat ur befintliga resultatrader: tränarstatistik (starter,
seger-%, plats-%, bästa bana/kusk, rekordår, snittintjäning) och
häststatistik (per bana, volt/auto, distans, position: ledning/
dödens/rygg — positionsdata finns i analysens bildrutor men sparas
inte per start i dag → börja spara position kompakt per resultatrad).
Egen vy under Mer: "Statistiken", Travbladets tabellestetik.

## 20.4 Veckomötet (punkt 6) [GRUNDEN KLAR v105 — genomgången som fäst måndagsrapport i förstamannens röst; slots kvar som beslutsdel via genväg] — ersätter/utvidgar stallmötets ram
Förstamannens "veckans genomgång" som inkorgens första notis varje
vecka (rapport-typ, expanderad: ekonomi, form, kommande starter,
personal, sponsorläge, problem, rekommendationer). Stallmötets slots
blir mötets BESLUTSDEL. Passar 20.1:s måndagsstopp.

## 20.5 Milstolpar, Hall of Fame, ikoner (9–11)
Milstolpsmotor (räknare + trösklar: segrar 1/50/100, starter 500,
miljonen, första storloppet, tränarår) → inkorgshändelse + dagboken
(19.4). Hall of Fame-vy efter säsong 3+: bästa hästar/kuskar/ägare
genom tiderna ur statistiklagret (20.3). Ikonstatus för hästar:
trösklar på segrar/storlopp → ⭐/⭐⭐, journalisterna refererar.

## 20.6 Rykten och medieröster (12–13)
Ryktesnotiser i Travbladet/inkorgen med SANNINGSHALT (hash-avgjord,
avslöjas senare — "inte alltid sant, precis som verkligheten").
Fler medieröster ovanpå krönikören: expertpanelen och podden som
återkommande format med egna personligheter (journalistprofiler:
positiv/skeptisk/sensationslysten — punkt 4).

## 20.7 Hästägargruppen som styrelse (15) + scouting (14) [SCOUTINGEN ETAPP A BYGGD v148: förstamannens scoutmejl ~var 3:e vecka om bästa unghästen i marknaden, anlagsordet sant — kräver seedad marknad (v148-fixen). STYRELSEMÅTTET BYGGT v151: ägarkretsens förtroende (resultat 35 % + utveckling 30 % + komm 20 % + ekonomi 15 %, ren derivation i engine-agare), kort på Kontoret, verkliga effekter — erbjudandeflöde/nivå i körVecka och flyttgränsens tålamod i ägarVecka. KUSKSCOUTEN v157 — förstamannens kusktips ~var 4:e vecka (förskjuten gate): kårens mest underskattade sulky (förmåga mot arvode och ryktbarhet, lärlingar premieras), mejl som pekar på relationsbygget. Kvar: scouting av personal/sponsorer]
Ägarnas samlade förtroende som styrelsemått (resultat, ekonomi,
kommunikation, utveckling — de två sista finns redan i ägarmotorns
nöjdhet). Högt förtroende ⇒ fler hästar, större investeringar,
tålamod. Scoutrapporter som inkorgshändelser: unghästar (finns i
marknaden), men även kuskar, personal, sponsorer och ägare.

## 20.8 Världens utveckling (17 — "viktigast") [ETAPP A KLAR v111 — kuskgenerationerna (hash-ålder, pension 58+, max 2/skifte, lärlingsdebut per säsong med krocksäkrade namn, aktiva kåren genom kuskväljare/reserver/världsrustning), sponsoromsättning varannan säsong, press för allt. ETAPP B v150 — tränargenerationerna (hash-ålder 38–61, pension 64+, max 1/skifte, arvtagare börjar unga 30–45 räknat från tillträdet, styrka ±0,08, krocksäkrade namn, spel.tränarvärld.skiften) och banrenoveringarna (~var 4:e säsong, spel.banvärld, press; publik-/underlagseffekter hör till 20.3-vädret). ETAPP C v152 — journalisterna: signaturen(spel, roll)-wrapper genom hela presslagret (11 ställen i lyssnare/travblad), byte ~var 5:e säsong ur JOURNALISTPOOL (datalagret), spel.pressvärld med historik, press om varje penna som läggs ner. 20.8 KOMPLETT]
Generationsskiften för MÄNNISKORNA, inte bara hästarna: tränare
lägger av (stall tas över/läggs ner), kuskar pensioneras och nya
lärlingar kliver in (knyter till lärlingslicenserna 18.6), journalister
byts, sponsorer försvinner ur sfären, banor renoveras. Säsongsskiftets
motor får en världsutvecklingsfas. Efter tio säsonger ska världen
vara HELT annorlunda — och dagboken (19.4) ska kunna visa vägen dit.

## 20.9 Byggordning (förslag)
1) 20.1 A — händelsestyrda klockan (förstärker inkorgen omedelbart,
   löser anmälan-i-en-sittning). 2) 20.2 — kontinuitetsminnet (störst
   berättelseeffekt per rad kod: datat finns). 3) 20.4 veckomötet.
   4) 20.3 statistiklagret + börja spara positionsdata direkt (ju
   tidigare desto längre historik). 5) 20.5–20.8 i säsongstakt.


## 18.11 Tränaren som kusk (Teds idé, juli 2026 — ANTECKNAD, byggs ej ännu)
I verkligheten kör många tränare sina hästar själva. I spelet:
- KÖRLICENSEN: spelaren kan välja SIG SJÄLV i kuskväljaren. Inget
  arvode och ingen kuskandel — men körförmågan är ens egen: start,
  avslutning och omdöme som EGNA attribut som utvecklas med körda
  lopp (långsamt, och sämre än proffsen länge).
- AVVÄGNINGEN som gör det till ett riktigt val: gratis och alltid
  "bekräftad" — men en sämre kusk kostar placeringar, och
  kuskrelationerna svalnar hos dem man slutar anlita.
- VÄRLDEN: AI-tränare med körlicens kör ibland sina egna hästar
  (hash-avgjort per tränare) — fältrustningen sätter då tränarnamnet
  som kusk. Knyter till 20.8 (tränarstallen) och 18.6 (licenserna:
  lärlings-/B-/A-licens som trappa även för spelaren).
- STATISTIKEN (20.3) får en egen rad: "körda av tränaren själv".


## 19.6 Inkorgen som förstasida — Hem avvecklas (Teds fråga, juli 2026 — ANTECKNAD, byggs ej ännu)
"Hemskärmen, behövs den?" Sedan v100 har Hem tömts på all kommunikation
— kvar är bara gårdsbilden, bågkortet, Längre fram och ekonomifakta.
Slutsteget i inkorgsdokumentets logik: inkorgen BLIR förstasidan och
hela systemets nav.
- FLIKRADEN: Inkorg först och som startflik; Hem utgår.
- ARVET fördelas: bågkortet och Längre fram → veckomötets genomgång
  (fästa raden bär redan veckans läge) eller egen fäst "Planen"-rad;
  ekonomifakta → veckomötet + Kontoret; gårdsbilden → Gården (och
  kanske som inkorgens bakgrundston — gården ska synas någonstans).
- SPELSTART/NYSTART och säsongstexterna behöver ny hemvist (bor de i
  HemVy i dag? Inventera före rivning).
- RISK att bevaka: inkorgen får inte bli ett skyltfönster för allt —
  prioritetssektionerna och Post/Nyheter-segmenten är skyddet.


# 21. POKÉMON-INSPIRATIONEN (Teds idé, juli 2026)
Pokémon är ett spel om anknytning till individer och deras utveckling
— travmanagerns själ. Mappningen, med travets verklighet som domare:
## 21.1 Startervalet [BYGGT v115] — tre startprofiler vid karriärstart
(spetsaren/stayern/talangen), tydligt olika, valet färgar resan.
Nivå 0-ärligt: karaktär i ord, inga siffror.
## 21.2 Genombrottet [BYGGT v115] — utvecklingen finns men firas inte.
Första stora klivet för en ung häst får ceremoni: press, guldrad i
efteranalysen, märke på hästkortet. Transformationen ska KÄNNAS.
## 21.3 Stamboken [ETAPP A BYGGD v146: egna hästar — register, öden (såld/pensionerad/avelshagen), familjer undan stammödrarna i Journalen, e./u.-notation; mötta hästar parkerat] — karriärvy över varje häst du ägt och mött:
blodslinjer, öden efter försäljning. Knyter till aveln och dagboken
(19 D). Samlarglädjen.
## 21.4 Dolda anlag [BYGGD v148: anlaget härleds ur hash (0,65–1,35, snitt 1,0 — ingen lagring, ingen migration), multiplicerar unga årens utveckling i åldraHäst; vetskapen okänd→anad (3 starter)→känd (8 starter/7 år) eller veterinärtest 6 tkr på hästsidan; alltid i ord, aldrig siffror] — hästens sanna tak delvis dolt, avslöjas genom
starter och veterinärtest. Upptäcktsglädjen. (AI:ns synfel finns —
detta är spelarens motsvarighet.)
## 21.5 Raritetshästen [BYGGD v147: hash-avgjord vit stjärna — 1/64 egna föl (drömmen ska gå att uppleva), 1/400 världens årgångar; press, hagen-scen, journalhändelse, märke ✶ i partyrad/startlista/stambok; noll egenskaper — realismvakten] — 1 på ~500 föds med unik teckning/vit stjärna.
Ren berättelsekrydda, pressen älskar henne. Billig, stor känsla.
## 21.6 Rivaltränaren [ETAPP A BYGGD v118] — Gary-draget: rivalen föds
ur startervalet (tar den kaxigaste kandidaten du lämnade), eget stall
i världen, hästen tävlar där på riktigt med nollmeriter. Rösterna:
hälsnings-sms, måndagsrösten efter hans starter, byggda på världens
verkliga siffror. KVAR (etapp B): mötesdetektionen (sms när ni står i
samma lopp — kräver anmälningskartan i inkorgen, väg prestandan),
rivalreaktionen efter direktmöten, pressens rivalitetsberättelse,
rivalens karriärbåge över säsonger (stallstyrkan växer med facit).
## 21.15 Hjälpen (Pokémons NPC-tips): en röst = ETT konkret tips i
rätt ögonblick, aldrig en manual. Vägvisaren och förstamannens
förslag finns; pröva mot principen: varje ny spelare-hjälp ska vara
en MÄNNISKA som säger en sak, inte en informationsruta.
## 21.7 Passar INTE: fångsten, striderna, EXPLICIT levelgrind —
travets verklighet vinner varje konflikt.
## 21.8 Klasstrappan [BYGGD v116] — levels gjorda travärliga: insprungna
pengar ÄR XP, Brons→Silver→Guld är levelkurvan. Brickan med steg
(III/II/I), XP-mätaren till nästa steg, och KLASSMÄRKET i loppvalet
(högt/mitt/lågt i kravspannet — det travtränare faktiskt tittar på).
## 21.9 Utrustningen (held items) — barfota/skor, jänkarvagn,
huvudlappar: verklig travbalansering med verkliga avvägningar
(barfota = snabbare men känsligare). Störst spelmekanisk kandidat.
## 21.10 Naturerna — hästens lynne/personlighet som NAMNGIVEN natur
("ettrig", "trygg", "lat") på hästkortet: gör befintliga dolda drag
läsbara, som Pokémons natures.
## 21.11 Typaffiniteter — vinterbanehästen, regnälskaren,
voltspecialisten: affinitetsbrickor ur verklig statistik (20.3-lagret
gör dem ärliga — visas först när datat finns).
## 21.12 Legendaren [BYGGD v146: hash-gatet fenomen ~var 8:e säsong, press följer segersviten, epilog vid pension, mötet bokförs i loppvyn — att SLÅ fenomenet är en karriärhändelse] — en gång per ~decennium föds världens fenomen
(en Victory Tilly): pressen följer den i åratal, att möta den är en
händelse. Hör ihop med världens utveckling (20.8).
## 21.14 ENKELHETSPRINCIPEN [PARTYRADEN BYGGD v117] — Game Boy-spelens
egentliga lärdom är inte fler system utan KOMPRIMERING: partymenyns
rad (namn + level + HP-stapel + statusbricka) läser hela laget på en
blick utan siffror. Varje ny travvy ska klara partymenyprovet: går
läget att se på en blick? Byggt: stallistans partyrad (orken som
HP-stapel grön/gul/röd, brickorna SKD/TOPPFORM/UR FORM, klasstaggen).
Kvar att pröva mot principen: loppväljaren, inkorgens rader, Sfären.
## 21.13 Taktikrepertoaren (movesets) — alla hästar kan inte alla
taktiker: spets-/ryggspecialister med repertoar som kan TRÄNAS bredare.
Kräver motorkoppling — varsamhet.


# 22. MIXEN — FM × POKÉMON (genomlysningen, aug 2026)
Teds riktning: spelet ska vara Football Manager och Pokémon i en
härlig mix — det bästa av allt. Genomlysningen av v84–v118 gav
principerna och prioriteringen nedan. De är RIBBAN för allt nytt.

## 22.1 Rollfördelningen (mixens grundlag)
FM ÄGER VÄRLDEN: sanningen, siffrorna, motståndet, kalendern,
inkorgen som arbetsplats. POKÉMON ÄGER RELATIONEN: individerna,
ceremonierna, läsbarheten, riktningen. Varje siffra ska vara
FM-ärlig; varje presentation ska vara Pokémon-läsbar. När de två
krockar i samma vy har presentationen misslyckats — inte världen.

## 22.2 Vad som redan sitter
FM-sidan: inkorgen med röster och beslut (v99–v110), klockan
(v101), veckomötet (v105), AI-tränarna med övertygelser och synfel,
verklighetens delning (v107), statistiklagret (v109), världens
generationer (v111), sponsorkraven som styrelsens förväntningar.
Pokémon-sidan: startervalet (v115), genombrottet (v115),
klasstrappan som levels (v116), partyraden med HP-stapeln (v117),
rivalen ur ditt val och mentorn som stannar (v118).

## 22.3 Mixens luckor (ärligt)
a) RIKTNINGEN: Pokémon visar alltid nästa gym — spelaren här kan
   inte alltid svara på "vad är mitt nästa märke?". Vägvisaren är
   reaktiv, inte målbild.
b) MÖTET: rivalen finns men MÖTS inte än (21.6 etapp B) — Garys
   loop kräver konfrontationsslaget.
c) DUBBELT SPRÅK i loppväljaren: Bedömningen (FM-ord) och Klassen
   (levelord) står som två domar sida vid sida — ska komprimeras
   till EN lägesrad (partymenyprovet, 21.14).
d) TVÅ KLASSLÄSNINGAR i koden: klassEtikett (proposition) och
   klassnivå (v116) lever parallellt — förenas till en källa.
e) SERIETRAPPAN OBYGGD: 18.10 är mixens kärnbygge — FM:s
   säsongsdrama OCH Pokémons gym-trappa i samma system.

## 22.4 Prioriteringen ("bästa av allt", i ordning)
1. SERIERNA SOM GYM-TRAPPA (18.10 + 20.5) [ETAPP A BYGGD v120:
   placeringspoäng per deltävling, serietabellen för hela världen i
   Sfären med egna hästar guldade, mästarkorningen i säsongsskiftet,
   märket i troférummet, mästarväggen. ETAPP B-FINALEN BYGGD v130: finallopp sista veckan med topp 8 (inbjudet fält, spår efter poängordning, 2,5× pris ur seriens egen proposition), uttagningens finalgren, kvalbeskedet i inkorgen, världens finaler i veckomotorn, korningen föredrar finalvinnaren med poäng som reserv. Kvar: seedad delning, mörk anmälan]
2. RIVALENS MÖTE (21.6 B): sms:et när ni står i samma lopp,
   reaktionen efteråt, pressens rivalitetsberättelse.
3. "NÄSTA MÅL"-RADEN: en (1) rad, alltid synlig — nästa klasskliv
   eller seriemål ur klasstrappan och kalendern. Pokémons riktning
   på FM:s data.
4. LOPPVÄLJARENS PARTYMENYPROV: Bedömning + Klass + distans
   komprimeras till en färgad lägesrad.
5. INKORGEN SOM NAV (19.6): FM:s hjärta som förstasida — med
   plottrighetsvakten som prologen lärde oss.
Därefter: utrustningen som held items (21.9) när mekanikutrymme
finns, och Teds tidsidé (timmar/dag/vecka) som rytmbygge.

## 22.6 REALISMVAKTEN (Teds direktiv, aug 2026): "ska fortfarande
vara ett travspel som både travspelare, tränare och travjournalister
ska känna handlar om trav och vara realistiskt."
GRUNDREGELN: Pokémon och Theme Park får synas i MEKANIK och KÄNSLA —
ALDRIG i vokabulären. Spelet säger ork, form, klass, proposition,
insprunget, byggrätt — aldrig XP, level, HP, held item.
GENOMLYSNINGEN (v122): språket håller ✓ (klasstrappan heter Brons/
Silver/Guld ur kalenderns verkliga krav; HP-stapeln heter ORK;
loppvalets märke talar om kravspannet som en tränare). Mekanikerna
mot verkligheten: delning enligt ST ✓, startpoäng ✓, lärlingslicenser
✓, kuskpension ✓, ägarlöften/träningsavgifter ✓, tränarcitat efter
lopp = travmedias vardag ✓, seriepoäng mot final = STL-divisionernas
kultur ✓ (etapp B-finalen gör det komplett).
BEVAKADE PUNKTER: (a) klasstegen "Brons II" är spelifiering — orden
i vyn är travord och gränserna verkliga, men om travspelare reagerar:
byt stegvisning mot ren kronräkning. (b) Rivalens ton var för
amerikanskt kaxig — JUSTERAD v123 till torr svensk travpik (kärv men
aldrig teatralisk). (c) Genombrottsmärket ✦ är estetik, inte påstådd
travterm — behåll diskret. (d) Kommande byggen realismprövas MOT
källa (ST:s regelverk, travsällskapens ordningar) som delningen
gjordes i v107.

## 22.5 Lärdomar ur bygghistorien (självkritiken)
Egen-flaggan bet två gånger (v106 avslutningen, v113 analysen) —
identitet före flaggor, alltid. Versionskedjan gick ut röd en gång
(v111) — nu grindad på alla sviter. Klasstaggen satt på fel kort
(v116) — UI-ändringar verifieras på RÄTT renderställe. Två
parallella klassläsningar (d ovan) — en sanning per begrepp.


# 23. GÅRDEN SOM LEVANDE VÄRLD (Teds idé, aug 2026 — förtydligad:
"en blandning av Pokémon och Theme Park": gå runt och VÄLJA saker
att addera — mer mark, ny träningsbana, nytt stall)
"Ska man göra det till en liten värld man kan gå runt i? Bygger man
en ny bana eller facilitet ändras gården visuellt."
ÄRLIG BEDÖMNING: en gångbar värld (styra en figur) är fel verktyg —
managerspelets natur och mobil-PWA:n talar emot, och gångtiden blir
friktion utan beslut. Men KÄNSLAN Ted pekar på är rätt och byggbar:
Pokémon-stadens "min plats som växer" utan gångsimulering.
## 23.0 THEME PARK-LOOPEN [BYGGD v122]: mark → byggrätt → bygg.
Tomter (2 från start, köps i block om två, stigande pris, tak 8),
byggrätter som faciliteterna kräver, TILL SALU-skylten och de
streckade tomterna PÅ kartan (tappbara → mark-/byggpanelen), och
migrering som ger äldre sparfiler marken de redan bebyggt. Kartan
fanns (stallängan växer med boxar, faciliteter ritas när de byggs,
vimplar/skylt/minnesträd) — nu är den handlingsplats, inte spegel.
## 23.1 Etapp A — Gårdsbilden som spegel: en ritad gårdsvy (SVG i
bankartans stil) i GårdVy där ANLÄGGNINGSNIVÅERNA styr det som syns:
stallbyggnadens längd följer boxplatserna, rakbanan/träningsbanan
ritas när den är byggd, hagarna, gårdsplanen. Bygger man — ändras
bilden. Det är kravet i Teds mening, uppfyllt bokstavligt.
## 23.2 Etapp B — Tappbar gård: byggnaderna är knappar (stallet →
stallvyn, kontorsflygeln → kontoret, banan → träningen, flaggstången
→ troférummet). "Gå runt" blir "peka dit du vill" — stadens känsla,
noll gångfriktion.
## 23.3 Etapp C — Livet i bilden: mästarflaggor på flaggstången per
seriemärke, genombrottshästens hage markerad, säsongens ljus (vinter/
sommar ur veckonumret), skötaren som figur vid stallgången.
## 23.4 Etapp D (om längtan består) — panorerbar scen: bilden bredare
än skärmen, dra i sidled. Fortfarande ingen gångsimulering.


# 24. TRAVSÄLLSKAPET — STYRELSEN PÅ HEMMABANAN (Teds idé, aug 2026)
"Möjlighet att växa fram — komma med i styrelsen på sin hemmabana
och vara med och påverka hur hemmabanan ska utvecklas."
DJUPT TRAVREALISTISKT: svenska banor ägs av travsällskap, och en
framgångsrik tränare som väljs in i sällskapets styrelse är exakt
så inflytande fungerar på riktigt. FM:s styrelserum — fast du sitter
I det, inte under det.
## 24.0 [ETAPP A BYGGD v124]: invalet (renommé ≥42 + två säsonger,
valberedningens samtal i inkorgen, avböjande gäller året), en motion
per säsong (hash-vald, bankänslig — open stretch föreslås aldrig där
den finns), rösten en av sju, bifall med VERKLIG effekt (open stretch
på hemmabanans alla lopp via justeraFörBanutveckling i alla tre
loppflöden; breddpriser +10 % på nivå ≤46), jävspressen när egen
vinning röstas igenom. [SÄLLSKAPSSIDAN BYGGD v145: status/krav
för oinvalda, bordets motion, protokollet med fem senaste utfallen
och din röst.] KVAR: (
historik), publik-/ungdomseffekterna, trappan mot ordförande (24.4),
egna motioner.
## 24.1 Invalet: renommé + säsonger på banan + relationer → valberedningen
hör av sig (inkorgssamtal, ett riktigt val: tacka ja tar TID — en
veckoslot? — men ger rösten). Aldrig köpbart, alltid förtjänat.
## 24.2 Motionerna: 1–2 per säsong, styrelsen röstar och DU har en
röst av flera (påverka, inte bestämma — realismen): open stretch-
bygge, nytt banunderlag, publikinvesteringar, ansökan om V75-datum,
höjda/sänkta banpriser, ungdomssatsning. Utfallen ändrar HEMMABANANS
data (openStretch-flaggan, prisnivåer, publiksnitt) — världen ändras
på riktigt av besluten.
## 24.3 Intressekonflikten (bästa dramat): det som gynnar banan
gynnar inte alltid ditt stall — och pressen frågar. Rösta för höjda
förstapris = bra för dig = Travbladet skriver om jäv. Trovärdigheten
som valuta.
## 24.4 Trappan: ledamot → vice ordförande → ordförande över
säsonger. Ordföranden får lägga EGNA motioner. Knyter till 20.8
(banorna utvecklas) och gym-trappans hemmabanekänsla.


# 25. BETALMODELLEN (Teds riktning, okt 2026 — ANTECKNAD, byggs ej ännu)
Utgångspunkt: gratis första säsongen, engångsköp runt 99 kr, plus
säsongspass eller liten månadsavgift för återkommande intäkt.
Betalning via Stripe eller Lemon Squeezy. Första målet: testa om 20
personer i en travgrupp faktiskt betalar.

## 25.1 Principerna (betalmodellens realismvakt)
- TID begränsas, aldrig FUNKTIONER: gratissäsongen är hela spelet.
  Spelet ska dömas på sin riktiga form, inte en stympad.
- Köpet ÄGER man: engångsköpet dras aldrig tillbaka bakom en senare
  prenumeration. Förtroendet i en liten travcommunity är allt.
- ALDRIG pay-to-win: inga köpta hästar, ingen köpt form, inga
  genvägar i sporten. Kosmetik (stallfärger, dräkter) är okej.
- Betalningen står UTANFÖR fiktionen: ren produktskärm vid
  säsongsskiftet. Travbladet säljer ingenting, mentorn tigger aldrig.
- Ärlig grind, inte DRM: en byggfri statisk app kan aldrig bli
  piratsäker — och för en travgrupp är det fel problem. Grinden ska
  vara värdig, inte vattentät.

## 25.2 Trappan
GRATIS — "Säsong ett":
  Hela spelet, hela första säsongen: prologen, startervalet, inkorgen,
  loppen, serierna, rivalen, säsongsskiftets korning och generations-
  skifte. Slutar på spelets bästa cliffhanger: världen har just
  förändrats och DIN karriär vill vidare.
KARRIÄREN — 99 kr, engångsköp:
  Obegränsade säsonger, för alltid. Alla nuvarande och kommande
  GRUNDFUNKTIONER ingår (buggfixar och kapitel som fördjupar det som
  finns). Marknadsraden: en V75-rad kostar mer.
STALLKLUBBEN — 19 kr/mån eller 149 kr/år (frivilligt lager ovanpå
  Karriären, för återkommande intäkt och de som vill stödja):
  - nya innehållskapitel FÖRST (travsällskapet etapp B, utrustningen,
    STL-finalerna — når alla senare, klubben får dem tidigt)
  - flera samtidiga karriärplatser (gratis/Karriären: en)
  - kosmetiken: egna stallfärger och dräktval
  - namnet på Stallklubbens medlemssida i Travbladet
  Säsongspass-varianten (om månadsavgift känns fel i testet): 79 kr
  per verklig säsong (halvår). Testet avgör vilken som känns rätt.

## 25.3 Betalväggens plats — och vad den säljer
Vid "Ny säsong"-knappen efter säsong 1: en (1) värdig skärm.
KÄRNKRAVET (Teds fråga "vem köper 99 kr engångs?" gav svaret): väggen
säljer ALDRIG en funktionslista — den säljer SPELARENS EGEN KARRIÄR.
Skärmen visar hans säsong: hästarna med namn, seriemästartiteln,
genombrottet, rivalens ställning — och raden "Din karriär fortsätter."
Köparen är inte någon som köper ett webbspel för 99 kr (den personen
finns inte); köparen är den som spelat klart säsong 1 och vill
vidare. Gratissäsongen är säljaren. Därtill: priset, köpknappen, och
"fortsätt titta runt gratis" (statistiken, troférummet, inkorgs-
historiken: karriären låses aldrig in, bara fortsättningen).
Sparfilen rörs aldrig av betalstatus.

## 25.4 Tekniken
- REKOMMENDATION FÖR TESTET: Lemon Squeezy (numera Stripe-ägt) som
  Merchant of Record — de hanterar momsen (25 % svensk moms på
  digitala tjänster, EU-regler vid försäljning utanför Sverige),
  vilket annars landar på Ted själv med Stripe direkt. Avgiften
  (~5 % + fast del) är priset för att slippa momsadministrationen —
  rätt byte vid 20 kunder. Stripe direkt är rätt först vid volym.
- Licensflödet (byggfritt, ingen egen server): köp i Lemon Squeezys
  checkout-overlay → licensnyckel → aktiveras i appen mot deras
  licens-API → status i sparfilen + localStorage. Offlinekontroll
  mot sparad aktivering; omvalidering i bakgrunden ibland.
- HOSTINGFLYTTEN (ärlig hake): GitHub Pages är inte avsett för
  kommersiell försäljning enligt villkoren. Vid betalstart flyttas
  appen till Cloudflare Pages eller Netlify (gratis, samma byggfria
  upplägg, egen domän — travmanager.se?). Flytten är trivial:
  samma filer, ny pekare.
- Prenumerationsstatus utan server är svagare än engångslicens
  (uppsägningar måste omvalideras) — även det talar för att testet
  börjar med engångsköpet och lägger klubben efteråt.

## 25.5 Testet: 20 personer i travgruppen
- UPPLÄGG: släpp länken i gruppen. Gratis säsong 1, betalvägg vid
  säsongsskiftet, pris 99 kr — INGEN kompisrabatt: testet mäter
  betalvilja, rabatt förstör mätningen.
- MÄT (manuellt räcker på 20): hur många startar en karriär, hur
  många NÅR säsongsskiftet (spelet själv är tratten), hur många
  köper, dagar från start till köp.
- MÅLBILD: minst 6 av 20 köper inom 30 dagar (30 % av de som fått
  hela säsong 1 gratis är ett starkt signal i en nischgrupp; under
  3 är signalen att priset eller väggens plats är fel — eller att
  säsong 1 inte bygger tillräcklig längtan, vilket är viktigare
  kunskap än intäkten).
- FRÅGA EFTERÅT: de som INTE köpte får en fråga — för dyrt, fel
  ställe, eller tappade intresset i vecka X? Tre svar räcker.
- REALISTISK RAM: kall gratis-till-betalt-konvertering ligger på
  1–5 % — en varm nischgrupp med hel säsong gratis spelar i en annan
  liga, men även 3–4 köp av 20 är DATA, inte fiasko: fyra köpare
  plus djupintervjuer är guld inför nästa grupp.
- OM 99 INTE BÄR (fallback-trappan, en variabel i taget): nästa
  grupp testar 49 kr; därefter "betala vad du vill, 99 föreslaget".
  Priset sänks aldrig för SAMMA grupp i efterhand — det straffar
  dem som betalade först.
- KONTEXTEN ÄR HALVA KÖPET: en länk i en gruppchatt signalerar inte
  "produkt". Egen domän, värdig betalskärm och riktigt kvitto (Lemon
  Squeezy) hör till testet, inte till senare.

## 25.6 Vad som aldrig säljs
Hästar, form, energi, kuskrelationer, seriepoäng, renommé,
sällskapsplatsen — ingenting som rör sporten. Travspelare känner
igen köpt framgång på lukten, och realismvakten (22.6) gäller
även kassan.


# 26. VÄGEN TILL DET KOMPLETTA SPELET (Teds direktiv, okt 2026 — STYRANDE)
Teds korrigering av första utkastet: "Vi ska bygga färdigt och ett
komplett spel först. Sen tänka lansering, premiär och betalvägg.
Bygga med tanke på betalväggen redan nu — men inte bygga in själva
betallösningen." Kvalitetsdirektivet står kvar: jobba snabbt, mer
premiumkänsla, ett riktigt spel — design, spelkänsla, äkthet,
trollbindande.

## 26.1 ARBETSSÄTTET (gäller från v128)
- MÅLET ÄR SPELET, inte släppet: hela planen byggs. Lansering,
  hosting och betalvägg (kapitel 25) byggs SIST, när spelet är klart.
- BETALVÄGGSMEDVETET, inte betalbyggt: (a) säsongsskiftet förblir
  den enda naturliga porten — inga funktioner får sudda den gränsen;
  (b) sparfilen hålls oberoende av all framtida betalstatus;
  (c) upplägget förblir byggfritt och flyttbart (hostingbytet ska
  vara trivialt den dagen); (d) ingen betalkod, inga licensfält,
  inga döda krokar i förväg.
- STÖRRE SLÄPP: ett arbetsblock (eller en sammanhållen del av ett)
  per version — färre cykler, mer per paket.
- SPELTESTGRINDEN: varje block slutar med Teds genomspelning på
  riktig enhet; fynd lagas innan nästa block.
- NYA IDÉER antecknas alltid i planen och får plats i rätt block —
  frysta är de inte, men de bryter inte pågående block.

## 26.2 BLOCK A — GRUNDEN HÅLLER (först, alltid)
a) Beskedsknappen säsong 2 (olöst) — BLOCKERAT PÅ TEDS DATA:
   bannerraden vid tryck i v114+ och sparfilen från Kontoret.
b) Galopphängningen (olöst) — BLOCKERAT PÅ TEDS DATA: nödfacit-raden.
c) Klassläsningarna förenas (klassEtikett + klassnivå → en källa).
d) Full mobilgenomspelning säsong 1→2, varje knapp.

## 26.3 BLOCK B — SPORTEN KOMPLETT (äktheten)
a) FINALVECKAN (18.10 B): seriernas topp 8 i riktiga finallopp —
   säsongens klimax. Största kvarvarande sportbygget.
b) Seedad delning med tränarspridning [BYGGD v140]: serielopp delas
   med snake-seedning (ettan i A, tvåan–trean i B) och stallkamrater
   byts till olika avdelningar — uttagningsloppens verkliga metod;
   i serielopp sprids även spelarens egna (vanliga lopp behåller
   v106-sammanhållningen och hash-lottningen). KVAR: mörk anmälan
   (anmäla utan kusk, val vid beskedet) — flödesändring som väntar
   på Teds riktning.
c) Lärlingsreglerna (18.6) [BYGGDA v134 — och verklighetsrättade:
   trav har ingen viktlättnad (det är galoppens regel) — lärlingslopp
   är lopp FÖRBEHÅLLNA lärlingslicens. lärlingsberättigad = v111:s
   lärlingar + kårens återväxt (ryktbarhet ≤ 25, ~20 av 90):
   spelarens väljare filtrerar med orsaken nära, världens rustning
   följer regeln, övriga serier orörda].
d) KLOCKANS TIDSRYTM (Teds tidsidé) [MEDVETET INTE nattbyggd:
   rytmen är spelets puls och smakkänslig — byggs med Ted vaken].
e) "Nästa mål"-raden [BYGGD v133]: engine-nastamal med åtta
   prioritetssteg (finalen > obesvarade besked > klasskliv >
   serietopp > valberedningen > tom tomt > måndagsanmälan > vilan),
   en klickbar guldrad under headern på alla flikar. Kap 16:s
   princip: intelligenta rekommendationer, aldrig uppdrag.
f) Tränaren som kusk (18.11) [BYGGD v137]: "Tränaren själv" först i
   kuskväljaren — arvode 0, kuskandel 0, alltid bekräftad; egna
   körattribut (start 38 → tak 62, +0,35/körning, pall ger extra);
   lärlingsberättigad de första 30 körningarna (18.6-koppling);
   statistiken får raden gratis via kusknamnet; var tredje AI-tränare
   kör sina egna (hash-avgjort, attribut 40–58). KVAR etapp B:
   tränarkuskarna i SPELARENS lopp (världshästarna där får poolkuskar
   än), renommé-/relationseffekter av att rata proffsen.

## 26.4 BLOCK C — BERÄTTELSEN KOMPLETT (trollbindningen)
a) Rivalens möte (21.6 B) [BYGGT v132]: onsdagsbeskedet upptäcker
   rivalhästen i fältet (sms före helgen), avslutningen bokför
   inbördes placering, måndagsreaktionen (fyra toner — tystar
   ordinarie måndagsrösten), pressen skriver om direktmötet. Kvar:
   rivalitetsberättelsen över flera säsonger (räkningen i siffror).
b) Karriärdagboken (19 D) [GRANSKAD v139: redan byggd i allt
   väsentligt — Stalljournalen har krönika, album, säsonger, rekord,
   troférum och rivaler. Kvar som finputs i F-blocket: per-säsongs-
   uppslag som väver rad + krönika + årets troféer/titlar].
c) Hall of Fame (20.5) [GRANSKAD v140: väggen finns — invald vid
   pension, visas i Stalljournalens rekordflik. Kvar: ikon-/legend-
   GRADERINGEN (⭐/⭐⭐) och att gamla profiler refereras i press].
d) Rykten (20.6) [BYGGDA v139]: pensionsrykten förankrade i
   generationsmaskinens VERKLIGA kö — sant rykte pekar på någon som
   faktiskt pensioneras nästa skifte (äldst först, högst två; säsong
   1 kan därför aldrig ha sanna — realism), falskt på någon som kör
   vidare. "Ryktet"-etikett i Travbladet-appen, facit vid skiftet:
   "Ryktet stämde" eller »Jag kör vidare«-dementi. Hash-avgjort.
   KVAR: fler ryktestyper (stallflytt, sponsorer) och medieröster.
e) Kontinuitetsminnets rest (20.2) [KUSKSAMTALET KLART v145:
   kusken MINNS i dialogen — »Förra gången här...« som guldkantad
   replik ur minnenInförLopp]. Kvar: exägarmöten, säsongsfacit,
   injektion i Travbladet.
f) Stamboken (21.3) och legendaren (21.12). [BYGGT v146]
g) Cliffhanger-passet: varje veckoslut lämnar minst en krok.

## 26.5 BLOCK D — VÄRLDEN OCH ROLLERNA KOMPLETTA
a) Världens etapp B (20.8): tränarstall som läggs ner/tas över,
   journalistgenerationer, banrenoveringar.
b) Scouting och hästägargruppen som styrelse (20.7).
c) Travsällskapets fortsättning (24): sällskapssidan i Kontoret,
   publik-/ungdomseffekterna, trappan mot ordförande, egna motioner.

## 26.6 BLOCK E — POKÉMON-LAGRET KOMPLETT (mekanik, aldrig vokabulär)
a) Utrustningen (21.9) [BYGGD v138 — Balansen]: barfota runt om
   (fart +, galopprisk +, FÖRBJUDEN på vinterbana med orsak),
   jänkarvagn (fart +, hyra 900 kr på loppdagen), huvudlappar
   (travsäkerhet +, start +). Opt-in i simulatorn med garanterad
   återställning (finally): utan val identiskt lopp, provat.
   Balanskortet i samtalssteget, valet klistrigt per häst, effekten
   per start. VÄRDENA KONSERVATIVA (uppmätt 0,22 s/km barfota —
   verkligheten ~1 s): Teds tuningpass väntar. KVAR: världens
   hästar balanserar inte än; kusksamtalet kan kommentera valet.
b) Dolda anlag (21.4): taket som avslöjas genom starter och test.
c) Naturerna (21.10) och typaffiniteterna (21.11, ur statistiklagret).
d) Raritetshästen (21.5).
e) Taktikrepertoaren (21.13) — motorvarsamhet, full omkalibrering.

## 26.7 BLOCK F — PREMIUMKÄNSLAN (Teds designskiss är facit)
Genomförs när innehållet står, så passet polerar det färdiga spelet
— men varje NY vy i block B–E byggs i skissens anda direkt.
a) Startsidan = inkorgen som nav (19.6): Hem avvecklas.
b) Hästsidan med flikar (Översikt/Karriär/Form/Mål/Relationer).
c) Loppvyn: TV-läge och analysläge, varierade händelsetexter.
d) Ekonomivyn med prognos ("kassan räcker 12 veckor").
e) Prologen filmisk.
f) Loppväljarens partymenyprov (22.4 #4).
g) Gårdens liv (23 C): mästarflaggor, säsongsljus, skötaren i bild.
h) Designsystempass: typografi, avstånd, övergångar — Travbladet
   konsekvent överallt.

## 26.8 BLOCK G — ROBUSTHETEN
a) Sparplatser och autobackup (2.5) — karriärer i åratal kräver det. [BYGGT v149]
b) Väder-/säsongsdata i resultatraden → statistikens sista tabeller
   (20.3 rest) + open stretch-statistik + rekordår.
c) Prestandapass: inkorgsbygget och världskörningen på äldre mobiler.

## 26.9 SEDAN — OCH FÖRST DÅ: LANSERINGEN
När block A–G är klara och genomspelade: kapitel 25 i sin helhet —
hostingflytt, domän, betalväggen (karriären som säljare, 25.3),
Lemon Squeezy, 20-personerstestet. Ingenting av det byggs före dess.


# 27. GRANSKNINGEN (okt 2026 — omstarten: "titta igenom allt")
Två fronter: maratonkörning av hela spelet huvudlöst, och
marknadsresearch mot andra spel. Fynden i korthet; åtgärderna är
inarbetade i kapitel 26-blocken.

## 27.1 KODHÄLSAN — motorn är frisk
Maratonkörningen: tre frön × tre fulla säsonger, ~80 egna starter
per karriär genom HELA kedjan (inkorg varje vecka, autobesvarade
beslut, anmälan→uttagning→bekräftelse→lopp→efterlopp→veckoskifte→
säsongsskifte): NOLL fel, NOLL invariantvarningar. Världen fungerar:
12 seriemästare korade, lärlingar debuterade, troféer lagda, sparfil
~370 kB (långt under localStorage-taket), kassan ändlig.
TRE SJÄLVLÄKNINGSHÅL hittade och LAGADE v129 (felklassen som knäcker
äldre sparfiler): spel.föl utan fält kraschade veckoskiftet,
ägarhäst utan krav kraschade efterloppet, min.streck utan värde
kraschade skrällpressen. Motorn antar inte längre — den självläker.
KVARSTÅENDE OLÖSTA (block A, fortsatt blockerade på Teds data):
beskedsknappen s2 och galopphängningen — maratonet stärker diagnosen
att BÅDA bor i UI-/sparfilsskiktet, inte motorn: motorkedjan kördes
~240 gånger över säsongsgränser utan fel. Teknisk skuld bekräftad:
klassEtikett/klassnivå dubbla (A-c).

## 27.2 ÄKTHETSDOMEN — vad travfolk får och saknar
HÅLLER: delning enligt ST, startpoäng, klasser ur insprunget,
kuskbokning med arvoden, lärlingar, voltstartens tillägg,
travsällskapet, pressetiken. SAKNAS (bekräftat i koden): VÄDER OCH
BANFÖRHÅLLANDEN (vinterbana!) — noll spår i motorn (G-blocket, höjd
prioritet: travsverige ÄR vinterbanor halva året); BARFOTA/SKONING —
finns inte (21.9, se 27.4: ingen konkurrent har det heller — bygget
är en differentierare, flyttas upp); MONTÉ — nämns bara i
regeldata, körs aldrig (parkerad medvetet, nischgren); LOPPFEEDENS VARIATION [ÅTGÄRDAD v135: hash-vald frasvariation i positionsbesluten och open stretch — skissens taktiska fraser inne ("tappar ryggen", "lämnar andra utvändigt"), 125 unika mallar uppmätta över 40 lopp, HELT slumpfritt: samma frö ger identiskt lopp]. BANORNA ÄR FIKTIVA
(Nordstad, Kvarnbacken...) — juridiskt tryggt och eget; riktiga
banor (Solvalla, Åby) vore säljande men kräver rättighetskoll —
medvetet val, står fast tills annat beslutas.

## 27.3 PREMIUMGAPET — mot designskissen och FM-lärdomen
Olevererat ur skissen = kapitel 26 F (bekräftat rätt lista):
TV-/analysläge, hästsidans flikar, ekonomiprognosen, filmisk prolog,
Hem→inkorg. FM26-LÄRDOMEN ur recensionerna: snygg motor räddar inte
rörig informationsarkitektur — recensenter mäter KLICK TILL
KÄRNUPPGIFT. Vår inkorgsarkitektur är rätt svar; F-passets regel:
inga nya menynivåer, varje vy ett huvudsyfte (skissens slutord).

## 27.3b UI-VAKTEN [v145 grundad; PÅ DJUPET v155 — startläges-props (startflik/startApp/startHästId, default = dagens beteende) låter vakten rendera journalens 7 flikar, telefonens 4 appar och hästsidans 5 flikar: 35 renderingar per körning. TDZ-klassens buggar kan inte längre gömma sig i oprovade lägen]

## 27.4 MARKNADEN — läget är bättre än väntat
- NAMNET ÄR LEDIGT: inget spel "Travmanager" finns eller har funnits.
  MEN travmanager.se är registrerad och parkerad (Loopia) — ÅTGÄRD
  FÖRE LANSERING: WHOIS-koll och försök köpa loss tidigt + PRV-
  sökning på varumärket. (Hör till 26.9, men kolla domänen NU —
  den blir inte billigare av att spelet blir känt.)
- INGEN svensk/nordisk travmanager existerar — marknadslucka.
  Närmaste konkurrent globalt: Off and Pacing (enda aktiva harness-
  managerspelet; dragplåster: riktiga banor, live-multiplayer).
- FÖRVÄNTNINGSLISTAN ur konkurrenternas recensioner, mappad:
  avelsdjup/dynastier ✓(avel finns; stamboken 21.3 fullbordar),
  loppkommentar ✓(feedens variation höjs, 27.2), statistik ✓,
  utrustning/skoning — UNIK LUCKA HOS ALLA, vår 21.9 flyttas TIDIGT
  i block E, banvariation ✓(fiktiva), väder ✗(27.2), regelverk/
  domare ✓(bortkörningar finns).
- NYA KANDIDATER granskningen väcker (antecknade, bryter inget
  block): SPELA PÅ LOPPEN SJÄLV — spelaren som V85-spelare med
  låtsaskassa (strecken och spelförtroendet finns redan; travspelare
  VILL spela — stor trollbindare, läggs som 27.4-kandidat i block C);
  multiplayer/ligor — konkurrenternas främsta dragplåster, men fel
  för arkitekturen nu (statisk PWA): PARKERAD tills efter lansering.


## 19.7 TELEFONEN [BYGGD v131 — Teds riktning: "travtränarens smartphone"]
Inkorgen ÄR tränarens mobil. MEDIET BÄR BRÅDSKAN: samtal = viktigt
(nyskadad häst → veterinären ringer; genombrott → journalisten
ringer), sms = personligt och snabbt, mejl = formellt (arrangören,
avtalen, veckans genomgång fäst), tidningen = omvärlden. Fyra appar
med olästmärken och statusrad (TRAVNET · v X · stopp). MEDDELANDEN
är TRÅDAR per person med historia (telefonloggen, tak 140, idempotent
arkivering vid varje klockhopp) — beslut besvaras som svarschips och
svaret står kvar som din utgående bubbla: chatten minns vad du sa.
SAMTAL är samtalsloggen ("Missat samtal — ring upp" i tegel för
obesvarade beslut). Läsvyn (FM-anatomin v108) behålls för samtal/
mejl/nyheter. BUGGFIX på köpet: rollklass-hjälparen låg efter läsvyn
(temporal dead zone) — att öppna ett meddelande har kastat
ReferenceError sedan v121; trolig rot till "frysta" upplevelser.
[v135: uttalandet FLYTTAT till journalistens samtal — Travbladet
ringer efter notabla lopp (seger/favoritfall/pall/bortkörning), den
grå mittendagen ringer ingen om; efteranalysrapporten behåller
analysen men inte beslutet.] KVAR: fler trådröster med historik.

# 28. KOMPLETTHETEN — FYRA PAR ÖGON (Teds direktiv 2026-10-10)

Direktivet: "kika vilka delar vi saknar och ska utveckla, som gör detta
komplett. Både som spel och som travrealism. Ur hästägarnas, spelarnas,
tränarnas och journalisternas ögon — men kanske främst travspelarens,
största spelargruppen. Tränare och ägare ska också tycka att det är kul."
Teds exempel: "om en häst är med på V75 (gör comeback på riktigt i
november) ökar samtal från journalister, ägare angelägna att anmäla,
större lopp, mer uppmärksamhet."

## 28.1 RAMPLJUSET [ETAPP A BYGGD v158: journalistens förhandssamtal med förhandsord-beslutet (tona upp/lugn/ned → hype ±, press), ägartrycket (kvalad ägarhäst utan anmälan → samtal med beslut, ägarKontakt/ägarSport), comebackdetektorn ärComeback (friskförklarad ≤4 v eller ≥8 v frånvaro) + comeback-förstasidan via bågeSkrivet, SPIKEN-bricka på favoriten i storloppens startlistor, SKRÄLL-rubrik när <6 %-streckad vinner det stora. Kvar B: omgångsnamnet/Storsjuan som begrepp i UI, förhandssida med fältranking, vinnarintervju, publikboost] — storspelsomgången (Teds exempel som system)
Det som saknas är inte storloppen (bågen finns, 4-veckorsskuggan skrivs)
utan KASKADEN runt dem — att hela världen vrider sig mot samma helg:
a) Omgången som begrepp: de tyngsta helgerna (prestige 4–5) är
   "storspelshelger" — spelomgången alla pratar om. Eget namn, INTE
   V75 (ATG:s varumärke): förslag "Storsjuan". Uppmärksamhetsnivå
   härleds ur prestige + bågens horisont.
b) Journalistsamtalen: din häst anmäld till storspelslopp → samtal i
   Telefonen FÖRE loppet (förhandsintervju med uttalande-val — hype
   och förväntan som insats, samma mekanik som pressvalen).
c) Ägartrycket: ägare med kvalificerade hästar RINGER och vill anmäla
   ("angeläget"-beslut i Telefonen) — kopplar styrelsemåttet (v151).
d) COMEBACKVINKELN (Teds kärnexempel): häst borta länge (skada/paus)
   som anmäls mot ett storspelslopp → comebackberättelse: pressetapper
   ("comeback i november"), journalistsamtal, publik- och hypeboost,
   och eget efterspel vare sig det går eller inte. Bygger på
   skadenyhets-tråden och comeback-milstolpen som redan finns.
e) Travbladets förhandssida: experterna rankar fältet, SPIKEN utses —
   att din häst är spiken är en känsla (och en press).
f) Efterspelet: vinnarintervju, större publik bokförd, skräll-rubrik
   när lågstreckad vinner.

## 28.2 SPELVÄRLDEN [a+b+e BYGGDA v158–v159: odds ur strecket i startlistan (~75/streck, travspråk '4,2 ggr'), skrällvarning i detaljraden (streck <8 % + form ≥60), tipsfacit bokförs per lopp (spiken = favoriten) och redovisas i säsongsbokslutet med ton efter utfall, SKRÄLL-rubriken i storlopp (v158). c OMGÅNGEN ETAPP A v161 — veckan före storloppet skriver Travbladet förhandstexten: världens tre meritrikaste väntade namn + fenomenet om aktivt (deterministiskt ur världen, fältet lottas på loppdagen som förut). Kvar: c etapp B läsbara världsfält, d tempot i referatet] — travspelarens ögon (största gruppen)
a) Odds bredvid strecken: härlett ur streck (≈0,8/andel), travspråk
   ("ca 4 gånger pengarna"). Ingen ny motor — ren presentation.
b) Travbladets tips på dina lopp: spik/varning/skräll före loppet,
   FACIT efteråt — tipsets träffsäkerhet över säsonger blir en del av
   journalistens profil (28.5).
c) "Omgången" i Travbladet: veckans storloppsfält LÄSBARA även när du
   inte har häst i loppet (travspelaren läser startlistor för nöjes
   skull — det är halva hobbyn).
d) Tempot i referatet: öppningstempo/slutvarv i loppanalysen.
e) Skrällen: vinnare under ~5 % streck får skrällrubrik + bokförs.
ANTECKNAT NEJ: spelaren ska inte själv spela pengar på lopp — tränare
får inte spela på egna hästar (realismvakten 22.6), och betting-sim
är ett annat spel än Travmanager.

## 28.3 TRÄNARDJUPET
a) Måla mot loppet: sätt MÅLLOPP per häst (storloppet om sex veckor);
   förstamannen föreslår träningsväg dit, formtoppning blir mekanik —
   bågen får en hand på ratten (dock ALDRIG på tärningen).
b) Rehabvalet vid skada: forcera (tidigare åter, återfallsrisk) eller
   låta läka (säkert, längre) — ett riktigt tränarbeslut.
c) Provloppet: inför comeback körs provlopp i verkligheten — knyter
   till 28.1 d som berättelse och formsignal.
d) Taktikrepertoaren (21.13) hör hit — byggs med Ted.

## 28.4 ÄGARDJUPET [b+c BYGGDA v160: ANDELSLAGET som ägartyp (tålamod 1,6 / resultatkänsla 0,5 / kommvikt 0,6 — tål allt utom tystnad; sparade profiler behåller sin typ, bara nya ägare mappas om), UPPFÖDARPREMIEN 10 % av prispengar för egenuppfödda — direkt i efterLopp för egna, via veckosynken mot världen för sålda/flyttade (deltat på intjänat, oavsett seger). Kvar: a ägartrycket (byggt i 28.1), d ägarmålet per säsong]
a) Ägartrycket i rampljuset — se 28.1 c.
b) ANDELSLAGET som ägartyp: travklubben med många delägare — hög
   kommunikationsvikt, folkfest i pressen när hästen vinner. Andels-
   hästar är stora i svensk trav; realism OCH charm.
c) UPPFÖDARPREMIEN: verklig mekanik — uppfödaren får procent av
   prispengar när hästen vinner, ÄVEN efter försäljning. Stamboken
   (v146) + Gamla bekanta (v153) gör den nästan gratis att bygga:
   dina uppfödda sålda hästar ger kronor och stolthet. Realism som
   varje hästägare känner igen.
d) Ägarmålet per säsong: "vi vill se henne i ett storlopp i år" —
   ger ägarrelationen en båge, inte bara ett saldo.

## 28.5 JOURNALISTDJUPET [a BYGGD v161: journalistvinkel(spel, roll) — entusiasten/granskaren/rubrikmakaren hashad ur NAMNET så generationsskiften byter spaltens karaktär; färgar förhandssamtalets ton och bytespressens presentation av nya pennan. Kvar: vinkeln i fler samtal och i krönikan]
a) Journalistprofilerna (20.2 punkt 4): de tre signaturerna får
   vinklar — positiv/skeptisk/sensationslysten — som färgar rubriker,
   frågor och tips. Generationsskiftena (v152) gör att en ny penna
   kan ha NY vinkel: redaktionen byter karaktär över åren.
b) Storspelsbevakningen — se 28.1 b/e/f.
c) Tipsfacit — se 28.2 b.
d) Årsgalan: säsongens priser ("Årets häst", "Årets kusk") som
   presshändelse vid skiftet — troférummet finns redan som hem.

## 28.6 REALISMLUCKORNA (travfolks blick, små men synliga)
a) Vädereffekten på tider/galopprisk (motorändring — med Ted vaken).
b) Barfota-tuningen: 0,22 s/km i dag, verkligheten närmare 1 — Teds
   siffra väntas.
c) Open stretch-statistik (kräver motordata om användning).
d) Monté (travets andra gren) — antecknad som framtida krydda, inte
   nödvändig för komplett.

## 28.7 BYGGORDNING (förslag)
1) 28.1 Rampljuset — Teds exempel, binder ihop alla fyra perspektiv
   och ger spelet sin "stora helg"-puls. 2) 28.2 a+b+e — travspelarens
   snabbaste vinster (odds, tips, skräll). 3) 28.4 c uppfödarpremien —
   billig realism på färdig infrastruktur. 4) 28.5 a profiler +
   28.2 c omgångssidan. 5) 28.3 a+b måla mot loppet + rehab.
   Smakkänsligt (med Ted): 21.13, klockan, designpasset, 28.6 a/b.

# 29. LÅGA TRÖSKELN (Teds direktiv 2026-10-10 kväll)

Direktivet: "titta igenom hela spelet, alla val, tänk enkelhet,
lättspelat, låg tröskel. Vad kan förstamannen hjälpa till med? Blir
det för mycket och komplicerat tappar det. En Harry Boy-spelare ska
uppskatta spelet lika mycket som en travtränare."

## 29.1 PRINCIPEN: DET GRÖNA SPÅRET
I varje val ska det finnas ett FÖRVALT, MOTIVERAT alternativ — så att
den som bara trycker på det rekommenderade hela vägen får en bra
upplevelse (Harry Boy-spåret), medan den som vill styra allt kan det
(tränarspåret). Ingen mekanik tas bort — tröskeln sänks genom att
expertisen (förstamannen, kusken) alltid erbjuder en väg.

## 29.2 GRANSKNINGEN — valpunkt för valpunkt
a) Träningen: råd fanns (hästsidan, veckomötet) men krävde handpåläggning
   varje vecka × varje häst. [LÖST v162: AUTOTRÄNINGEN — toggle i
   Stallet, förstamannen sätter träningen inför varje vecka, spelaren
   kan ändra enskilda hästar.]
b) Loppval/anmälan: nästaMål-raden, förslagskortet med direktknapp,
   bedömningen rekommenderad/möjlig/riskfylld — GRÖNT SPÅR FINNS.
c) Kuskvalet: Mina kuskar (v144) — GRÖNT SPÅR FINNS.
d) Taktik + slutorder: kuskens förslag var markerat men krävde två
   val. [LÖST v162: "LITA PÅ KUSKEN — KÖR LOPPET" — en knapp som tar
   kuskens resa och kuskens tajming. Harry Boy-spelarens hela
   loppbeslut är ett tryck.]
e) Balansen: FYND — v138:s väljare föll bort ur UI i en zip-
   återställning: motorn läste häst.balansVal men inget satte det.
   Differentieraren var död funktionalitet. [LÖST v162: hopfällt
   kort i kusksamtalet, förstamannens råd överst (väder- och
   vinterläst), default = skor = aldrig fel.]
f) FYND i samma granskning: Kusksamtalets minnen- och kamrater-props
   skickades aldrig från anropet — guldkantsrepliken (v145) och
   stallkamratspanelen var döda. [LAGADE v162.]
g) Pressval/uttalanden/sponsorbeslut/röster: ja/nej med motivtexter —
   OK som de är.
h) Marknad/avel: omdömen i ord, scout- och kusktips — OK.
i) Menystrukturen: 9+ vyer är spelets största kvarvarande tröskel.
   SMAKKÄNSLIGT — byggs med Ted (hör ihop med 22.4 #5 inkorgen som
   nav och 19.6 Hem→telefon).
j) Onboarding: prologen bär starten, men nya moment därefter
   (sällskapet, balansen, aveln) förklaras inte när de dyker upp
   första gången. FÖRSLAG etapp B: förstamannens förstagångsrepliker
   — EN rad första gången ett nytt moment syns, aldrig mer.
k) Förstamannens samlade roll efter v162: veckogenomgången, träningsråd
   + autoträning, balansråd, scoutrapporter, kusktips, nästa mål-raden.
   KVAR att ge honom: helgpaketet (föreslå veckans alla anmälningar
   med ett godkänn-tryck — etapp B, smakkänslig) och
   förstagångsreplikerna (j).

## 29.3 BYGGT v162
Autoträningen (a), Lita på kusken-knappen (d), Balansen med råd (e),
props-lagningarna (f). Kvar: i (med Ted), j, k-resterna.
