/* =========================================================
   Salong N.T – JavaScript

   Sidan fungerar utan JS. Det här lägger till:
   mobilmeny, dagens öppettider, effekter vid scroll (skugga på
   sidhuvudet, parallax, intoning) och att mobilens bokningsknapp
   göms när den inte behövs.
   ========================================================= */

const $ = (selector) => document.querySelector(selector);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PARALLAX_SPEED = 0.2; // 0 = bilden följer sidan, 1 = står still

document.documentElement.classList.add('js'); // CSS:en döljer data-reveal bara när JS körs

/* ---------- Mobilmeny ---------- */
const toggle = $('.nav-toggle');
const nav = $('#nav');

const setMenu = (open) => {
  nav.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', open);
};

toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) {
    setMenu(false);
    toggle.focus();
  }
});

/* ---------- Dagens öppettider ----------
   Läser tabellen i index.html (måndag–söndag i den ordningen).
   Format: "10–19", "9.30–18" eller "Stängt". */
const toMinutes = (time) => {
  const [h, m = 0] = time.split(/[.:]/).map(Number);
  return h * 60 + m;
};

function updateToday() {
  const now = new Date();
  const rows = document.querySelectorAll('#hours tr');
  const today = rows[(now.getDay() + 6) % 7]; // getDay(): 0 = söndag
  rows.forEach((row) => row.classList.toggle('is-today', row === today));

  const hours = today.cells[1].textContent.trim();
  const [, opens, closes] = hours.match(/^([\d.:]+)\s*[–-]\s*([\d.:]+)$/) ?? [];
  const minutes = now.getHours() * 60 + now.getMinutes();
  const isOpen = opens && minutes >= toMinutes(opens) && minutes < toMinutes(closes);

  const status = $('#today-status');
  status.classList.toggle('is-open', Boolean(isOpen));
  if (!opens) status.textContent = /stängt/i.test(hours) ? 'Stängt idag' : `Öppet idag ${hours}`;
  else if (minutes < toMinutes(opens)) status.textContent = `Öppnar idag ${opens}`;
  else status.textContent = isOpen ? `Öppet nu – stänger ${closes}` : 'Stängt för idag';
}

updateToday();
setInterval(updateToday, 60_000); // håll texten aktuell om sidan står öppen

/* ---------- Scroll: skugga på sidhuvudet och parallax ---------- */
const header = $('.site-header');
const photo = $('.hero__photo');
let ticking = false;

function onScroll() {
  ticking = false;
  header.classList.toggle('is-scrolled', scrollY > 8);
  // Bilden flyttas nedåt med en del av scrollen och glider in bakom priserna
  if (photo && !reduceMotion && scrollY < innerHeight * 2) {
    photo.style.setProperty('--parallax', `${scrollY * PARALLAX_SPEED}px`);
  }
}

addEventListener('scroll', () => ticking || (ticking = requestAnimationFrame(onScroll)), {
  passive: true,
});
onScroll();

/* ---------- Intoning: element med data-reveal tonar in en gång ---------- */
const revealer = new IntersectionObserver(
  (entries) =>
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      target.classList.add('is-visible');
      revealer.unobserve(target);
    }),
  { rootMargin: '0px 0px -10% 0px' },
);
document.querySelectorAll('[data-reveal]').forEach((el) => revealer.observe(el));

/* ---------- Göm mobilens bokningsknapp vid bokningssektionen och sidfoten ---------- */
const mobileBook = $('.mobile-book');
const inView = new Set();
const bookWatcher = new IntersectionObserver((entries) => {
  entries.forEach(({ isIntersecting, target }) =>
    isIntersecting ? inView.add(target) : inView.delete(target),
  );
  mobileBook.classList.toggle('is-hidden', inView.size > 0);
});
document.querySelectorAll('#boka, .site-footer').forEach((el) => bookWatcher.observe(el));
