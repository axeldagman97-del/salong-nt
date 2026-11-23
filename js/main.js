/* =========================================================
   Salong N.T – JavaScript

   Sidan fungerar helt utan JS. Det här lägger bara till:
   1. Mobilmeny
   2. Dagens öppettider (öppet nu / öppnar / stängt)
   3. Skugga på sidhuvudet vid scroll
   4. Intoning vid scroll ([data-reveal])
   ========================================================= */

// Talar om för CSS:en att JS körs. Utan klassen visas allt direkt.
document.documentElement.classList.add('js');

/* ---------- 1. Mobilmeny ---------- */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#nav');
  if (!toggle || !nav) return;

  const isOpen = () => nav.classList.contains('is-open');
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  // Stäng när man väljer en länk. En lyssnare på menyn räcker för alla länkar.
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  // Stäng med Escape och lämna fokus på knappen
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen()) return;
    setOpen(false);
    toggle.focus();
  });
}

/* ---------- 2. Dagens öppettider ---------- */
// Läser tiderna från tabellen i index.html, så de behöver bara ändras där.
// Format som stöds: "10–19", "10-19", "9.30–18" och "Stängt".
const HOURS_PATTERN =
  /^(\d{1,2}(?:[.:]\d{2})?)\s*[–-]\s*(\d{1,2}(?:[.:]\d{2})?)$/;

// "9.30" -> 570 (minuter efter midnatt)
function toMinutes(time) {
  const [hours, minutes = 0] = time.split(/[.:]/).map(Number);
  return hours * 60 + minutes;
}

// Ger texten för dagens status, t.ex. "Öppet nu – stänger 19"
function describeToday(hours, now) {
  const match = hours.match(HOURS_PATTERN);
  if (!match) {
    return /stängt/i.test(hours)
      ? { text: 'Stängt idag', isOpen: false }
      : { text: `Öppet idag ${hours}`, isOpen: false };
  }

  const [, opens, closes] = match;
  const minutes = now.getHours() * 60 + now.getMinutes();

  if (minutes < toMinutes(opens))
    return { text: `Öppnar idag ${opens}`, isOpen: false };
  if (minutes < toMinutes(closes))
    return { text: `Öppet nu – stänger ${closes}`, isOpen: true };
  return { text: 'Stängt för idag', isOpen: false };
}

function initTodayHours() {
  const status = document.querySelector('#today-status');
  const rows = document.querySelectorAll('#hours tr[data-day]');
  if (!status || !rows.length) return;

  const update = () => {
    const now = new Date();
    const today = String(now.getDay()); // 0 = söndag, 1 = måndag …
    let todayRow = null;

    rows.forEach((row) => {
      const isToday = row.dataset.day === today;
      row.classList.toggle('is-today', isToday);
      if (isToday) todayRow = row;
    });
    if (!todayRow) return;

    const { text, isOpen } = describeToday(
      todayRow.cells[1].textContent.trim(),
      now
    );
    status.textContent = text;
    status.classList.toggle('is-open', isOpen);
  };

  update();
  setInterval(update, 60 * 1000); // håll texten aktuell om sidan står öppen
}

/* ---------- 3. Skugga på sidhuvudet ---------- */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const update = () =>
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* ---------- 4. Intoning vid scroll ---------- */
// Lägg attributet data-reveal på ett element i index.html så tonar det in.
function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  const show = (el) => el.classList.add('is-visible');

  if (!('IntersectionObserver' in window)) {
    items.forEach(show);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        show(entry.target);
        observer.unobserve(entry.target); // bara en gång
      }
    },
    { rootMargin: '0px 0px -10% 0px' }
  );

  items.forEach((el) => observer.observe(el));
}

/* ---------- Start ---------- */
initMobileNav();
initTodayHours();
initHeaderScroll();
initReveal();
