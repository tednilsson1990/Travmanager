import { rnd, klamp, LÄNGD, kmtid } from "./engine-util.js";
import { spårfördel, framförSpår, ärSpringspår } from "./data-lopp.js";

const DT = 0.25;            // sekunder per tick
const MAXTID = 400;
const BILDINTERVALL = 0.5;
const MÅLGAP = 2.6;         // meter mellan hjul och nos i kön
const SÖKFÖNSTER = 13;      // så långt fram man letar efter rygg att lägga sig i
/* Extraväg utvändigt. Geometriskt: en halvcirkel med en meter större radie
   är π meter längre, alltså ~6,3 m per varv på en tusenmetersbana — cirka
   0,63 %. Tidigare låg värdet på dubbla det. */
const EXTRA_VÄG = 0.0063;

/* Kraftuttag per läge. Dödens är dyrast eftersom man varken har rygg
   eller kort väg. Andra utvändigt har rygg av dödenshästen. */
const KOSTNAD = {
  ledare: 0.97,
  rygg: 0.82,     // andra invändigt
  kö: 0.80,       // tredje invändigt och bakåt
  friInner: 0.93, // inne men utan rygg
  öppet: 0.95,    // open stretch — kort väg men ingen rygg
  dödens: 1.08,   // första utvändigt
  utvRygg: 0.88,  // andra och tredje utvändigt, med rygg
  tredje: 1.18,   // tredje spåret med rygg — alltid dyrare
  tredjeFri: 1.34, // tredje spåret utan rygg
  vitt: 1.06,      // fjärde spåret och bortom, med rygg — bara på upploppet
  vittFri: 1.22,   // fjärde spåret utan rygg: fri väg, men längst väg
};

/**
 * Tick-baserad loppsimulering.
 *
 * Positionerna bildar ett rutnät precis som i verkligheten: ledare, rygg
 * ledaren, tredje invändigt och bakåt i den inre kön, samt dödens, andra
 * och tredje utvändigt i den yttre. Fältet hålls packat — alla ligger på
 * varandras hjul tills någon aktivt gör något.
 *
 * Placering, avstånd och km/h läses ur meter och m/s. Ingen separat
 * placeringsformel finns.
 */
export function simulera(fält, lopp) {
  const dist = lopp.dist;
  const bild = [];
  const kommentar = [];
  const säg = (t, k = "") => kommentar.push({ t, k });

  const snittKapacitet =
    fält.reduce((a, h) => a + (h.start + h.fart + h.styrka) / 3, 0) / fält.length;

  /* Marschfarten sätts av fältet, inte av ledarens toppfart. Alla hästar i
     ett lopp KAN hålla tempot — skillnaden mellan dem visar sig i vad de har
     kvar på upploppet, inte i om de hänger med på baksidan. */
  const vmaxAv = (h) => (11.78 + h.fart * 0.042) * (1 + (h.form - 50) * 0.0016);
  const sorteradeVmax = fält.map(vmaxAv).sort((a, b) => a - b);
  const fältTempo = sorteradeVmax[Math.floor(sorteradeVmax.length / 2)] * 1.025;

  /* Dold dagsform. Publiken ser form och meriter, men inte att hästen
     kände sig tung i morse. En stark häst som inte var bra den dagen
     presterar under sin kapacitet — och det gynnar alla andra. */
  const dagsformAv = () => {
    const r = Math.random();
    if (r < 0.05) return { värde: rnd(0.885, 0.94), text: "kändes aldrig bra" };
    if (r < 0.14) return { värde: rnd(0.95, 0.985), text: "gick under sin förmåga" };
    if (r > 0.94) return { värde: rnd(1.02, 1.05), text: "var på toppdag" };
    return { värde: rnd(0.99, 1.012), text: null };
  };

  const H = fält.map((h) => {
    const kapacitet = (h.start + h.fart + h.styrka) / 3;
    const dag = dagsformAv();
    return {
      dagsform: dag.värde, dagsformText: dag.text,
      h, kusk: h.kusk, taktik: h.taktik, spår: h.spår,
      d: 0, v: 0,
      vmax: vmaxAv(h) * dag.värde,
      kraft: (100 + (h.form - 50) * 0.28 + (h.energi - 85) * 0.12) * dag.värde,
      sf: 0.68 + (h.styrka / 100) * 0.62,
      kol: 0,                       // 0 innerspår, 1 utvändigt, 2 tredje spår
      galopp: 0, ur: false,
      låst: false, instängd: false,
      skyddTid: 0, utanSkyddTid: 0, dödensTid: 0,
      respekt: klamp(h.streck / 45, 0, 1),
      /* Kuskens plan för dagen.
         Kapaciteten väger LÄTT här med flit. Låter man den styra sorterar
         fältet sig efter styrka redan i första kurvan, och då blir varje
         position en ranking av hästarna i stället för ett utfall av loppet.
         I verkligheten avgörs resan av spår, startsnabbhet och tur — en bra
         häst hamnar ofta illa utan att ha valt det, och en billig häst kan
         få loppets bästa resa. */
      ambition: klamp(
        0.5 + (kapacitet - snittKapacitet) / 130
        + (h.kusk.taktik - 60) / 240
        + (h.taktik === "utv" ? 0.3 : h.taktik === "ledning" ? 0.22 : h.taktik === "skydd" ? -0.26 : 0)
        + rnd(-0.22, 0.22),        // dagens plan, inte hästens rankning
        0, 1
      ),
      friTill: 0, galoppTills: -1,
      tapp: 0,   // meter som ska förloras gradvis, inte i ett hopp
      /* Kusken påverkar NÄR rycket sätts in, inte hur fort hästen springer.
         En sämre kusk missar tajmingen — rycker för tidigt eller för sent. */
      spurtFel: rnd(-1, 1),
      mål: null, sista800: null, sista400: null,
    };
  });

  /* ---------- Startmomentet ---------- */
  H.forEach((s) => {
    const utlösning =
      s.h.start * 0.72 + s.kusk.start * 0.34 + spårfördel(s.spår, lopp.start) + rnd(-7, 7) +
      (s.taktik === "ledning" ? 9 : s.taktik === "rygg" ? 4
        : s.taktik === "spurt" ? -9 : s.taktik === "skydd" ? -3 : 0);
    /* Tillägg i voltstart: hästar utöver första volten startar 20 meter
       längre bak och måste alltså springa längre till samma mållinje. */
    const bakomVolt = lopp.förstaVolt && s.spår > lopp.förstaVolt;
    s.tilläggsmeter = bakomVolt ? (lopp.tillägg || 20) : 0;
    s.d = Math.max(0, (utlösning - 40) * 0.28) - s.tilläggsmeter;
    s.v = 12.6 + utlösning * 0.012;
    /* "En häst har en speed att tillgå — antingen i starten eller i
       avslutningen." Den som laddar för spets betalar i tanken, och det
       är därför en hårt utkörd ledare kan ta slut. */
    s.startinsats = Math.max(0, utlösning - 42) * 0.30
      + (s.taktik === "ledning" ? 7 : s.taktik === "rygg" ? 3 : 0);
    s.kraft -= s.startinsats;

    /* Voltstart handlar om att LYCKAS med starten, autostart om att
       accelerera. Därför betydligt högre galopprisk i volt, och högst
       av allt från springspåren där tajmingen är svårast. */
    let p = 0.05 * (1 + (70 - s.h.lynne) / 85) * (1 - (s.kusk.kyla - 50) / 190);
    if (lopp.start === "volt") p *= 1.7;
    if (bakomVolt) p *= 1.25;
    if (ärSpringspår(s.spår, lopp.start)) p *= 1.5;
    if (s.taktik === "ledning") p *= 1.35;
    if (Math.random() < p) {
      s.galopp = 1; s.kraft -= 16; s.d -= rnd(18, 34); s.v = 9;
      if (Math.random() < 0.26) s.ur = true;
      säg(`<b>${s.h.namn}</b> galopperar i starten${s.ur ? " och blir bortkörd" : ""}.`, "illa");
    }
  });

  /* Alla beslut i en tick fattas utifrån samma ögonblicksbild. Utan den
     kan två hästar sikta på varandra — den ena har hunnit flytta sig, den
     andra inte — och då bromsar de ner varandra till gånggrepp. */
  const frys = () => H.forEach((s) => { s.d0 = s.d; s.v0 = s.v; s.kol0 = s.kol; });
  /* Andra ledet i autostart: man löser inte ut själv utan följer hästen
     framför. En snabb häst framför ger draghjälp, en långsam blir en propp. */
  if (lopp.start === "bil") {
    H.forEach((s) => {
      const frampår = framförSpår(s.spår);
      if (!frampår) return;
      const framme = H.find((o) => o.spår === frampår);
      if (!framme) return;
      const propp = (framme.h.start - 55) * 0.16;   // hjälper eller hindrar
      s.d += propp;
      s.startberoende = framme;
      /* Galopperar hästen framför blir bakspårshästen störd — den måste
         väja och tappar mark, och kan själv rivas med. */
      if (framme.galopp) {
        s.d -= rnd(6, 16);
        if (Math.random() < 0.12) {
          s.galopp = 1; s.kraft -= 10; s.v *= 0.75;
          säg(`<b>${s.h.namn}</b> störs av galoppen framför.`, "illa");
        }
      }
    });
  }

  const iOrdning = () => H.filter((s) => !s.ur).sort((a, b) => b.d0 - a.d0);
  /** Närmaste häst framför i samma kolumn, oavsett avstånd — sätter tempot. */
  /* En häst som galopperar styrs ut ur spåret. Den slutar alltså blockera
     dem bakom — galoppen blir en lucka för någon annan, inte en propp för
     hela kön. */
  const urVägen = (o) => o.galoppTills > t;

  const närmastFram = (s) => {
    let bäst = null;
    H.forEach((o) => {
      if (o === s || o.ur || o.kol0 !== s.kol0 || urVägen(o)) return;
      const gap = o.d0 - s.d0;
      if (gap > 0.4 && (!bäst || gap < bäst.d0 - s.d0)) bäst = o;
    });
    return bäst;
  };
  /** Rygg får man bara på nära håll. */
  const framför = (s) => {
    const n = närmastFram(s);
    return n && n.d0 - s.d0 < SÖKFÖNSTER ? n : null;
  };
  /* Ekipagen ligger inte sida vid sida. Den utvändiga raden är förskjuten
     en halv häst framåt — dödenshästen går vid ledarens hjul och täcker
     därmed tvåan snett bakom sig. Fönstret nedan är ungefär ett ekipages
     längd, förskjutet framåt: från strax bakom till drygt en längd före. */
  const TÄCKER_BAK = 0.8;   // meter bakom en själv
  const TÄCKER_FRAM = 4.2;  // meter framför en själv
  const upptaget = (kol, d, bak = TÄCKER_BAK, fram = TÄCKER_FRAM) =>
    H.some((o) => !o.ur && !urVägen(o) && o.kol0 === kol &&
      o.d0 - d > -bak && o.d0 - d < fram);
  /** Plats i sin egen kolumn, 1 = främst. */
  const platsIKolumn = (s) =>
    H.filter((o) => !o.ur && o.kol0 === s.kol0 && o.d0 > s.d0).length + 1;

  const ordningstal = (n) => (n <= 2 ? `${n}:a` : `${n}:e`);

  /* Ett utvändigt läge definieras av VEM man ligger jämsides med, inte av
     hur många som råkar ligga framför i samma kolumn. Dödens är hästen vid
     ledarens hjul. En häst som just svängt ut från tionde plats ligger
     utvändigt bakom fältet — inte i dödens. Ytterraden ligger dessutom en
     halv häst framför den den täcker. */
  const jämsides = (s) => {
    let bäst = null, bästAvst = 99;
    H.forEach((o) => {
      if (o.ur || o.kol0 !== 0 || o === s) return;
      const avst = Math.abs(o.d0 - s.d0 + 1.3);
      if (avst < bästAvst) { bästAvst = avst; bäst = o; }
    });
    return bästAvst <= 4.2 ? platsIKolumn(bäst) : null;
  };
  const lägeAv = (s, ledare) => {
    if (s.ur) return "ur";
    if (s === ledare) return "leder";
    const n = platsIKolumn(s);
    if (s.kol < 0) return "öppna innerspåret";
    if (s.kol === 0) {
      if (s.instängd) return "instängd";
      if (n === 1) return "leder";
      if (n === 2) return "rygg ledaren";
      return `${ordningstal(n)} invändigt`;
    }
    if (s.kol === 1) {
      const bredvid = jämsides(s);
      if (bredvid === null) return "utvändigt bakom fältet";
      return bredvid === 1 ? "dödens" : `${ordningstal(bredvid)} utvändigt`;
    }
    if (s.kol === 2) return `${ordningstal(n)} i tredje spåret`;
    return `${ordningstal(s.kol + 1)} spåret`;
  };
  const kostnadFör = (s, ledare, harSkydd) => {
    if (s === ledare) return KOSTNAD.ledare;
    if (s.kol === 0) {
      if (!harSkydd) return KOSTNAD.friInner;
      return platsIKolumn(s) === 2 ? KOSTNAD.rygg : KOSTNAD.kö;
    }
    if (s.kol0 < 0) return KOSTNAD.öppet;
    if (s.kol0 >= 3) return harSkydd ? KOSTNAD.vitt : KOSTNAD.vittFri;
    if (s.kol0 === 2) return harSkydd ? KOSTNAD.tredje : KOSTNAD.tredjeFri;
    return harSkydd ? KOSTNAD.utvRygg : KOSTNAD.dödens;
  };

  frys();
  let t = 0, klara = 0, förraLedare = null;
  let senasteUtflyttning = -99;   // när någon senast gick ut — driver kedjan
  const levande = H.filter((s) => !s.ur).length;

  while (t < MAXTID && klara < levande) {
    t += DT;
    frys();
    const ord = iOrdning();
    const främst = ord[0];                       // längst fram oavsett spår
    /* Ledaren i travmening är den som går först vid staketet. En häst som
       ligger snäppet före utanför är i dödens, inte i ledningen. */
    const led = ord.find((x) => x.kol0 === 0) || främst;
    const kvar = dist - (främst ? främst.d : 0);
    const upplopp = kvar < 420;

    if (led && led !== förraLedare && t > 3) {
      säg(förraLedare
        ? `<b>${led.h.namn}</b> tar över ledningen från <b>${förraLedare.h.namn}</b>.`
        : `<b>${led.h.namn}</b> leder fältet.`, "hot");
      förraLedare = led;
    }

    H.forEach((s) => {
      if (s.ur || s.mål !== null) return;

      /* Den som gått förbi hela innerraden går ner till spåret och blir
         ledare på riktigt. Utan detta blir en häst "ledare" medan den
         fortfarande ligger utvändigt, och ytterradens platser räknas fel. */
      if (s.kol > 0 && !upplopp) {
        const innerFramför = H.some((o) => !o.ur && o.kol0 === 0 && o.d0 > s.d0 - 7.0);
        if (!innerFramför) { s.kol = 0; }
      }

      const drag = framför(s);
      const harSkydd = !!drag;
      harSkydd ? (s.skyddTid += DT) : (s.utanSkyddTid += DT);
      if (s.kol >= 1 && !harSkydd && platsIKolumn(s) === 1) s.dödensTid += DT;

      /* ---------- Positionsbeslut var tredje sekund ---------- */
      /* Besluten fattas var tredje sekund under resan — men varje sekund
         på upploppet, för det är där fältet fäller ut för att få fri väg. */
      const beslutsintervall = kvar < lopp.bana * 0.5 ? 1.5 : 3;
      if (Math.abs(t % beslutsintervall) < DT && t > 2) {
        const blockerad = harSkydd && drag.d0 - s.d0 < MÅLGAP + 1.6;
        /* Alla vill ha bästa möjliga position, inte bara den som är låst.
           Det är så den yttre kolonnen bildas — och det är den som stänger
           in innerspåret. Utan den blir rygg ledaren orimligt stark. */
        /* Rygg ledaren lämnar man inte frivilligt — det är loppets bästa
           läge. Man sitter kvar och väntar, och kommer ut först när luckan
           uppstår: dödenshästen tappar, eller ledaren drar ifrån. */
        const iRygg = s.kol0 === 0 && platsIKolumn(s) === 2;

        /* Ledaren väger av: är den som pressar bättre än jag, och är rygg
           ledaren ett vettigt läge här? Då släpper man hellre än duellerar. */
        if (s === led && kvar > 500) {
          const pressare = H.find((o) => !o.ur && o.kol0 === 1 && platsIKolumn(o) === 1);
          const vinsthål = lopp.openStretch ? 0.05 : 0.04;
          s.släpperTill = (pressare && pressare.ambition > s.ambition + 0.08 &&
            Math.random() < vinsthål) ? pressare : null;
        } else if (s !== led) {
          s.släpperTill = null;
        }
        const ledarenTappar = led.v0 < fältTempo * 0.95;
        /* Ett halvvarv från mål börjar de starka gå. Det är inte upploppet
           som avgör när ryckningen sätts in — bra hästar med krafter kvar
           går ut redan i sista kurvans ingång, ofta tre spår. */
        /* Första riktiga attacken kommer 900–700 m kvar, när andra och
           tredje utvändigt lämnar sina ryggar och går först i tredjespår. */
        const attackfönster = kvar < 900;
        const långspurt = attackfönster && s.kraft > 55 && s.ambition > 0.5;
        const villFram = (upplopp || långspurt) ? true : iRygg
          ? (ledarenTappar && kvar < 900)
          : (s.taktik === "ledning" && s !== led) ||
            (s.taktik === "utv" && kvar > dist * 0.5) ||
            (s.taktik === "spurt" && kvar < 700) ||
            (s.taktik === "rygg" && ord.indexOf(s) > 2) ||
            (s.ambition > 0.45 && kvar < dist * 0.75) ||
            blockerad;

        /* Dödens är i verkligheten något man oftast TVINGAS till, inte något
           man väljer. Kuskar söker hellre rygg på den som redan gått ut.
           Utan den asymmetrin hamnar alla toppekipage frivilligt i dödens. */
        const uteUtanRygg = s.kol === 0 && !upptaget(1, s.d0);
        const kostarDödens = uteUtanRygg
          ? (s.ambition < 0.5 ? 0.15 : Math.pow(s.ambition, 2))
          : 1.6; // att lägga sig i rygg på dödenshästen är mycket attraktivt
        /* Kedjeeffekten: när en häst går ut följer ofta den bakom, och
           sedan nästa. Utan den töms ytterraden i stället för att fyllas
           på, och då får rygg ledaren fri väg ut — vilket den sällan får. */
        const iKedjan = t - senasteUtflyttning < 6 ? 1.7 : 1;
        /* Varje ytterligare spår utåt är osannolikare än det förra. Sju i
           bredd på upploppet förekommer, men är inte normalbilden. */
        const yttreMotstånd = 1 / (1 + s.kol0 * 0.72);
        const respekt = drag ? drag.respekt : 0;
        const chans = villFram
          ? (upplopp ? 0.55 : (långspurt || (s.kol0 >= 1 && attackfönster)) ? 0.3
             : blockerad ? 0.16 : 0.03)
            * iKedjan * yttreMotstånd * kostarDödens * (1 - respekt * 0.5)
            * (0.65 + s.kusk.taktik / 180)
          : 0;

        /* Man går aldrig ut utan skäl. Ledaren har fri väg och har inget
           att vinna på att lämna staketet — och den som inte har någon
           framför sig i sin kolumn har heller inget att passera. */
        const harNågonFramför = !!drag;
        const fårGåUtAlls = s !== led && harNågonFramför;
        /* "Gå först i tredjespår": andra och tredje utvändigt lämnar sina
           ryggar i attackfönstret och går ut ytterligare ett spår. Det är
           den vanligaste attacken i ett travlopp. */
        const lämnaRyggen = s.kol0 >= 1 && attackfönster && s.kraft > 42;
        /* På upploppet fälls fältet ut över hela banbredden. Den som ligger
           tredje utvändigt kan följa med ut och få fri väg i fjärde spåret —
           med rygg hela vägen dit och därmed krafter kvar. Under resans gång
           är tredje spåret däremot ett dyrt övergångsläge. */
        const maxKol = upplopp ? 6 : 2;
        const fårTaTredje = upplopp || s.kol === 0 || långspurt || lämnaRyggen ||
          (blockerad && s.ambition > 0.6 && s.kraft > 48);
        /* Är platsen rakt utanför upptagen kan man ändå gå ut — men då får
           man vänta in luckan och hamnar bakom den som redan ligger där.
           Det är så den yttre kolonnen byggs, och det är kolonnen som
           stänger in innerspåret. */
        /* Open stretch: på banor med öppet innerspår kan den som sitter
           fast bakom ledaren gå INÅT i stället för utåt de sista metrarna.
           Det är hela poängen med konstruktionen — rygg ledaren får en
           väg förbi som annars inte finns. */
        if (lopp.openStretch && kvar < 190 && s.kol === 0 && blockerad &&
            !upptaget(-1, s.d0) && Math.random() < 0.055) {
          s.kol = -1;
          säg(`<b>${s.h.namn}</b> går in i det öppna innerspåret.`, "hot");
        }
        const rakt = !upptaget(s.kol + 1, s.d0);
        const bakom = blockerad && !upptaget(s.kol + 1, s.d0 - 5.5, 0.8, 4.2);
        if (fårGåUtAlls && s.kraft > 28 && Math.random() < chans && s.kol < maxKol &&
            fårTaTredje && (rakt || bakom)) {
          s.kol++;
          s.kraft -= 1.2;
          /* Raderna ligger sammanflätade: den som svänger ut hamnar mellan
             hästen den låg bakom och den framför, alltså en halv häst bak.
             Det är så ytterraden täcker in hela innerkön. */
          s.tapp += 1.3;              // svänger ut och tappar en halv häst
          senasteUtflyttning = t;
          if (!rakt) s.tapp += 3.2; // fick vänta in luckan och tappade mark
          /* Att fälla ut sent kostar fart och meter: man styr ut, tappar
             rygg och får längre väg medan den framför redan är i rullning. */
          if (upplopp) { s.tapp += 1.8; s.kraft -= 3; }
          const nyPlats = platsIKolumn(s);
          if (s.kol === 1 && nyPlats === 1) säg(`<b>${s.h.namn}</b> går ut i dödens.`, "hot");
          else if (s.kol === 1) säg(`<b>${s.h.namn}</b> går ut och upp utvändigt.`, "");
          const g = 0.03 * (1 + (70 - s.h.lynne) / 95) * (1 - (s.kusk.kyla - 50) / 200);
          if (Math.random() < g) {
            s.galopp++; s.kraft -= 14; s.v *= 0.6;
            s.galoppTills = t + rnd(2.5, 5);       // styrs ut ur spåret
            if (s.kol < 2) s.kol++;
            säg(`<b>${s.h.namn}</b> galopperar i rycket.`, "illa");
          }
        } else if (s.kol > 0 && !upptaget(s.kol - 1, s.d0) &&
                   ((s.kol >= 2 && !attackfönster) || !villFram || s.kraft < 38) &&
                   Math.random() < (s.kol >= 2 ? 0.7 : 0.5)) {
          s.kol--; // in i ledet igen så fort en lucka finns
        }
      }

      /* ---------- Önskad fart ---------- */
      let mål;
      /* Rycket sätts in när kusken bedömer att krafterna räcker hem.
         Mycket kvar i tanken ger tidigare ryck; dålig tajming straffar sig. */
      const idealSpurt = 300 + klamp(s.kraft, 0, 60) * 2.2;
      const tajmingsfel = s.spurtFel * (1 - s.kusk.avslutning / 100) * 260;
      const spurtNu = kvar < idealSpurt + tajmingsfel;

      if (spurtNu) {
        mål = s.vmax * 1.05;
      } else if (s === led && s.släpperTill) {
        /* Snabb men svagare häst tar spetsen och släpper sedan en bättre
           häst förbi för att få rygg ledaren. Vanligt, särskilt på banor
           med öppet innerspår där rygg ledaren är ett vinnarläge. */
        mål = Math.min(s.vmax, s.släpperTill.v0 - 0.35);
      } else if (s === led) {
        /* Ledningens verkliga värde ligger i att kusken sätter farten.
           Får ekipaget vara ifred sänks tempot och krafterna sparas till
           upploppet. Kommer någon utvändigt måste ledaren försvara sig. */
        const press = H.some((o) => !o.ur && o.kol0 > 0 && Math.abs(o.d0 - s.d0) < 8);
        mål = Math.min(s.vmax * 1.02, fältTempo * (press ? 1.05 : 1.02));
      } else {
        /* Fältet är packat. Alla siktar på hjulet framför — även den som
           ligger långt bak försöker upp i kön, inte gå på egen marschfart.
           Den som inte har farten nog faller tillbaka av sig själv. */
        const fram = närmastFram(s);
        /* Justeringen måste vara begränsad nedåt. Ligger man tätare än
           målgapet vill man sakta in — men om alla gör det utan tak bromsar
           klungan ner sig själv till gånggrepp. Man får ge sig en aning,
           aldrig mer. */
        if (fram) {
          /* Dämpad följning. Ren avståndsreglering ger kövågor: man gasar,
             kommer för nära, bromsar. Genom att också väga in fartskillnaden
             lägger sig ekipaget stilla på hjulet framför. */
          const avstånd = fram.d0 - s.d0 - MÅLGAP;
          const fartskillnad = s.v - fram.v0;
          mål = Math.min(fram.v0 + klamp(avstånd * 0.32 - fartskillnad * 0.25, -0.3, 2.5), s.vmax);
        } else if (s.kol0 >= 1) {
          /* Först utvändigt utan rygg. En stark häst ligger där för att
             pressa och gå förbi. En svagare vill egentligen inte vara där
             alls och sätter inget tempo — vilket i sin tur lockar fram en
             bättre häst som kliver upp och tar över dödens. */
          const orkarPressa = s.ambition > 0.45 && s.kraft > 35;
          /* Marginalen måste bero på hur långt bak man ligger. Med en fast
             marginal på 0,45 m/s tar det längre tid än hela loppet att hämta
             trettio meter — och då blir "utvändigt" i praktiken en andra kö
             bakom fältet i stället för en rad bredvid det. Den som svänger ut
             gör det för att avancera, och avancerar därefter snabbt. */
          const attHämta = led.d0 - s.d0;
          mål = orkarPressa
            ? Math.min(s.vmax * 1.06, led.v0 + klamp(0.4 + attHämta * 0.035, 0.4, 2.1))
            : Math.min(s.vmax, led.v0 - 0.1);
        } else {
          // Först i sin kolumn men inte i ledningen: håll tempo med ledaren
          mål = Math.min(led.v0 + klamp((led.d0 - s.d0 - MÅLGAP) * 0.35, -0.2, 2.5), s.vmax);
        }
      }

      /* Låst innerspår som TILLSTÅND, inte som tärningskast per tick.
         Man hamnar fast direkt när geometrin stänger till, och kommer loss
         när en lucka faktiskt öppnar sig — bedöms två gånger per sekund,
         inte femton. Kuskens taktikvärde avgör hur snabbt luckan hittas. */
      /* Fysisk blockering: man kan inte springa genom hästen framför.
         Ligger man på dess hjul är farten låst till dess fart — vill man
         fortare måste man ut i ett annat spår. Det gäller alla i kön,
         även rygg ledaren, och är själva skälet till att kön inne är en
         dålig plats att vinna ifrån. */
      const bakomHjulet = drag && drag.d0 - s.d0 < MÅLGAP + 1.5;
      if (bakomHjulet) mål = Math.min(mål, drag.v0);
      // Instängd = låst bakom hjulet OCH utan väg ut
      const geoLåst = bakomHjulet && s.kol === 0 && upptaget(1, s.d0);
      /* Man kommer inte loss genom att ha tur — man kommer loss när
         geometrin öppnar sig: hästen framför tappar, eller platsen utanför
         blir ledig. Kusken påverkar hur snabbt luckan utnyttjas, inte om
         den finns. Det är därför kön innerspår är en dålig vinnarplats. */
      if (!geoLåst) {
        s.låst = false;
      } else if (!s.låst) {
        s.låst = true;
      } else if (Math.abs(t % 1.5) < DT) {
        const seg = klamp(0.02 + (s.kusk.taktik - 60) / 900, 0.005, 0.09);
        if (Math.random() < seg) { s.låst = false; s.friTill = t + 3; }
      }
      s.instängd = s.låst && kvar < 500;

      /* ---------- Kraft och förflyttning ---------- */
      s.kraft = Math.max(0, s.kraft - DT * 0.62 * Math.pow(s.v / 13.6, 3)
        * kostnadFör(s, led, harSkydd) / s.sf);
      /* Taket faller med krafterna. Med full kraft kan även en långsammare
         häst hänga med i tempot — men det kostar mer, eftersom uttaget går
         i kubik mot farten. Det är så svagare hästar spricker sent. */
      const tak = Math.max(s.vmax, fältTempo) * (0.70 + 0.32 * klamp(s.kraft / 55, 0, 1));
      mål = Math.min(mål, tak);
      s.v = Math.max(8, s.v + (mål - s.v) * (mål > s.v ? 0.55 : 0.9) * DT * 2.2);

      // Utvändigt är längre väg runt banan — samma fart ger mindre avancemang
      s.d += (s.v * DT) / (1 + Math.max(0, s.kol) * EXTRA_VÄG);
      if (s.tapp > 0) {                    // ta ut tappet mjukt, inte i ett hopp
        const av = Math.min(s.tapp, 1.6 * DT);
        s.d -= av;
        s.tapp -= av;
      }

      if (s.sista800 === null && s.d >= dist - 800) s.sista800 = t;
      if (s.sista400 === null && s.d >= dist - 400) s.sista400 = t;
      if (s.d >= dist && s.mål === null) { s.mål = t - (s.d - dist) / s.v; klara++; }
    });

    if (Math.abs(t % BILDINTERVALL) < DT) {
      const l = iOrdning()[0];
      const stakettvå = iOrdning().find((x) => x.kol0 === 0) || l;
      bild.push({
        tid: t,
        meter: Math.round(l ? Math.min(l.d, dist) : 0),
        pos: H.map((s) => ({
          namn: s.h.namn, spår: s.spår, egen: s.h.egen, ur: s.ur,
          d: Math.min(s.d, dist), lane: Math.min(6, Math.max(0, s.kol)), iMål: s.mål !== null,
        })),
        rader: iOrdning().map((s, i) => ({
          namn: s.h.namn, spår: s.spår, egen: s.h.egen,
          avst: i === 0 ? 0 : (l.d0 - s.d0) / LÄNGD,
          fart: s.v * 3.6,
          kraft: s.kraft,
          läge: s.mål !== null ? "i mål" : lägeAv(s, stakettvå),
          kol: Math.min(3, Math.max(0, s.kol0)),
          rang: s.kol0 >= 1 ? (jämsides(s) ?? 99) : platsIKolumn(s),
        })),
        ur: H.filter((s) => s.ur).map((s) => ({ namn: s.h.namn, spår: s.spår })),
        text: kommentar.splice(0),
      });
    }
  }

  H.filter((s) => !s.ur && s.mål === null)
    .forEach((s) => (s.mål = t + (dist - s.d) / Math.max(s.v, 6)));

  const resultat = H.filter((s) => !s.ur)
    .sort((a, b) => a.mål - b.mål)
    .map((s, i) => ({
      häst: s.h, plats: i + 1, sek: s.mål, km: s.mål / (dist / 1000),
      kusk: s.kusk, spår: s.spår, streck: s.h.streck,
      sista800: s.sista800 !== null ? s.mål - s.sista800 : null,
      sista400: s.sista400 !== null ? s.mål - s.sista400 : null,
      läge: s.dödensTid > 25 ? "dödens" : s.kol > 0 ? "utvändigt"
        : s.skyddTid > s.utanSkyddTid ? "rygg/inner" : "fri inner",
      utanSkydd: s.utanSkyddTid,
      dödensTid: s.dödensTid,
      dagsform: s.dagsform, dagsformText: s.dagsformText,
      ur: false,
    }));

  H.filter((s) => s.ur).forEach((s) =>
    resultat.push({ häst: s.h, plats: null, kusk: s.kusk, spår: s.spår, streck: s.h.streck, ur: true }));

  if (bild.length) {
    bild[bild.length - 1].text.push({
      t: `<b>${resultat[0].häst.namn}</b> vinner på ${kmtid(resultat[0].km)}.`, k: "hot",
    });
  }
  return { bild, resultat };
}
