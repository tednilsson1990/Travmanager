/**
 * Service worker — spelet fungerar utan nät.
 *
 * VERSIONSNUMRET: samma N som i index.html. När v höjs där ska den höjas
 * här också — det är hela uppdateringsmekanismen. En ändrad sw.js får
 * webbläsaren att installera om workern, och det nya cachenamnet gör att
 * den gamla cachen städas bort. Glöms detta ser man den gamla versionen
 * för evigt, även online.
 */
const VERSION = 54;
const CACHE = `stallet-v${VERSION}`;

/* Allt spelet behöver för att starta helt utan nät. Egna filer med samma
   ?v som importmappen använder — annars cachas fel nyckel och träffas
   aldrig. */
const EGNA = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./ikon.png",
  `./styles.css?v=${VERSION}`,
  `./main.js?v=${VERSION}`,
  `./ui-app.js?v=${VERSION}`,
  `./ui-stallvy.js?v=${VERSION}`,
  `./ui-startvy.js?v=${VERSION}`,
  `./ui-gardvy.js?v=${VERSION}`,
  `./ui-prolog.js?v=${VERSION}`,
  `./ui-grafik.js?v=${VERSION}`,
  `./ui-loppvy.js?v=${VERSION}`,
  `./ui-marknadvy.js?v=${VERSION}`,
  `./ui-sfarvy.js?v=${VERSION}`,
  `./ui-avelvy.js?v=${VERSION}`,
  `./ui-banvy.js?v=${VERSION}`,
  `./ui-delar.js?v=${VERSION}`,
  `./state-spel.js?v=${VERSION}`,
  `./engine-hast.js?v=${VERSION}`,
  `./engine-forstaman.js?v=${VERSION}`,
  `./engine-gard.js?v=${VERSION}`,
  `./engine-prolog.js?v=${VERSION}`,
  `./engine-handelser.js?v=${VERSION}`,
  `./engine-marknad.js?v=${VERSION}`,
  `./engine-sasong.js?v=${VERSION}`,
  `./engine-simulera.js?v=${VERSION}`,
  `./engine-streck.js?v=${VERSION}`,
  `./engine-util.js?v=${VERSION}`,
  `./engine-varld.js?v=${VERSION}`,
  `./engine-vecka.js?v=${VERSION}`,
  `./data-agare.js?v=${VERSION}`,
  `./data-hingstar.js?v=${VERSION}`,
  `./data-kalender.js?v=${VERSION}`,
  `./data-kuskar.js?v=${VERSION}`,
  `./data-lopp.js?v=${VERSION}`,
  `./data-namn.js?v=${VERSION}`,
  `./data-namnpaket.js?v=${VERSION}`,
];

/* Beroendena från esm.sh. Dessa URL:er är oföränderliga (versionen står i
   adressen) så de hämtas en gång och ligger sedan kvar. Preacts huvudfil
   pekar vidare på interna filer — de fångas av fetch-hanteraren nedan
   första gången spelet körs online. */
const CDN = [
  "https://esm.sh/preact@10.23.2",
  "https://esm.sh/preact@10.23.2/hooks",
  "https://esm.sh/htm@3.1.1/preact?deps=preact@10.23.2",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (c) => {
      await c.addAll(EGNA);
      /* CDN-filerna får inte fälla installationen om esm.sh är nere —
         spelet fungerar ändå så länge de redan ligger i en äldre cache
         eller hämtas senare. */
      await Promise.allSettled(CDN.map((url) =>
        fetch(url).then((svar) => svar.ok && c.put(url, svar))
      ));
      self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((namn) =>
      Promise.all(namn.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  /* Sidan själv: nätet först, cachen som reserv. Så når en ny version
     användaren direkt vid nästa besök online, och offline startar den
     senast kända. */
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((svar) => {
          const kopia = svar.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", kopia));
          return svar;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  /* Allt annat: cachen först. Egna filer är versionerade i URL:en och
     CDN-filerna oföränderliga, så en cacheträff är alltid rätt svar.
     Missar — t.ex. Preacts interna filer eller Google Fonts — hämtas
     från nätet och läggs in för nästa gång. */
  e.respondWith(
    caches.match(e.request).then((träff) =>
      träff ||
      fetch(e.request).then((svar) => {
        if (svar.ok && (url.origin === location.origin ||
            url.hostname.endsWith("esm.sh") ||
            url.hostname.endsWith("gstatic.com") ||
            url.hostname.endsWith("googleapis.com"))) {
          const kopia = svar.clone();
          caches.open(CACHE).then((c) => c.put(e.request, kopia));
        }
        return svar;
      })
    )
  );
});
