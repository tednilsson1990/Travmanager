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
## 2.5 Sparsäkerhet [DELVIS v79 — indikator, export/import; kvar: sparplatser, autobackup]
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

## 20.2 Kontinuitetsminnet (punkt 1 — "allt kommer ihåg") [GRUNDEN KLAR v104 — engine-minnen.js: karriärtotaler med ärlig grundplåt, loppfacit, rivalernas senast-vann; rader i lottningen, efteranalysen och inkorgen. Kvar: exägarmöten, säsongsfacit per lopp, injektion i kusksamtal och Travbladet]
En referensmotor (engine-minnen.js): ren läsning av det som redan
sparas, som producerar KONTEXTRADER överallt: "din 100:e seger om ni
vinner" (räknat ur facithistoriken), "ni möttes i våras — Stormvind
med nos" (rivaliteterna), "du vann det här loppet förra säsongen"
(loppnamn i facit). Raderna injiceras i kusksamtalet, Travbladet,
inkorgen och efteranalysen. Kräver att facit sparas per säsong med
loppnamn — kontrollera sparfilstaket.

## 20.3 Statistiklagret (punkt 2 — "grotta ner sig i timmar") [GRUNDEN KLAR v109 — ledningsklassen i målraden (ren observation), banan i resultatraden, engine-statistik med häst- och tränaraggregat, Statistiken under Mer. Kvar: regn/sol och sommar/vinter (kräver väder-/säsongsdata i raderna), open stretch-statistik, rekordår-utmärkning]
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

## 20.7 Hästägargruppen som styrelse (15) + scouting (14)
Ägarnas samlade förtroende som styrelsemått (resultat, ekonomi,
kommunikation, utveckling — de två sista finns redan i ägarmotorns
nöjdhet). Högt förtroende ⇒ fler hästar, större investeringar,
tålamod. Scoutrapporter som inkorgshändelser: unghästar (finns i
marknaden), men även kuskar, personal, sponsorer och ägare.

## 20.8 Världens utveckling (17 — "viktigast") [ETAPP A KLAR v111 — kuskgenerationerna (hash-ålder, pension 58+, max 2/skifte, lärlingsdebut per säsong med krocksäkrade namn, aktiva kåren genom kuskväljare/reserver/världsrustning), sponsoromsättning varannan säsong, press för allt. Kvar B: tränarstall, journalister, banor; lärlingsreglerna hör till 18.6]
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
