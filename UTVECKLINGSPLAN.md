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