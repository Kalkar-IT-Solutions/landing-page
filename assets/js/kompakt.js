// The motion of the Kalkar Kompakt teaser (layouts/kompakt.html). The page
// is whole without it; with it the phone in the hero runs through the
// screens, sections rise in as they come into view and the example report
// collects its three confirmations. With reduced motion nothing moves on
// its own: the screens change only on a click.
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('kk-js');
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Old installs of the web app kept a service worker for /kompakt/; it
  // would serve the old app here. The app itself no longer has one.
  if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) { if (/\/kompakt\/$/.test(r.scope)) r.unregister(); });
    }).catch(function () {});
  }

  // ---- The phone in the hero ----
  var slides = document.querySelectorAll('.kk-slide');
  var buttons = document.querySelectorAll('.kk-tour button');
  var current = 0;
  function show(i) {
    current = (i + slides.length) % slides.length;
    slides.forEach(function (s, n) { s.classList.toggle('is-on', n === current); });
    buttons.forEach(function (b, n) {
      if (n === current) {
        b.setAttribute('aria-current', 'true');
        // Restart the line that is the clock of this screen.
        var line = b.querySelector('i');
        line.style.animation = 'none'; void line.offsetWidth; line.style.animation = '';
      } else b.removeAttribute('aria-current');
    });
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () { show(Number(b.dataset.slide)); });
  });
  if (!calm && slides.length > 1) {
    // The fill of the current line ends: the next screen. Where the list is
    // hidden (narrow windows) a timer does the same.
    var tour = document.querySelector('.kk-tour');
    var aside = document.querySelector('.kk-aside');
    var paused = false;
    aside.addEventListener('pointerenter', function () { paused = true; });
    aside.addEventListener('pointerleave', function () { paused = false; });
    document.addEventListener('animationend', function (e) {
      if (e.animationName === 'kk-dwell' && e.target.closest('[aria-current]')) show(current + 1);
    }, true);
    setInterval(function () {
      if (tour && tour.offsetParent !== null) return;
      if (!paused && !document.hidden) show(current + 1);
    }, 5000);
  }

  // ---- Come into view ----
  var report = document.querySelector('.kk-report');
  function confirm(card) {
    var dots = card.querySelectorAll('.kk-dots i');
    var count = card.querySelector('.kk-report-count b');
    var n = 0;
    (function next() {
      if (n === dots.length) { card.classList.add('is-done'); return; }
      dots[n].classList.add('is-on');
      count.textContent = String(++n);
      setTimeout(next, calm ? 0 : 700);
    })();
  }
  var seen = function (el) {
    el.classList.add('is-in');
    if (el === report) setTimeout(function () { confirm(report); }, calm ? 0 : 600);
  };
  var items = document.querySelectorAll('.kk-reveal');
  if (!('IntersectionObserver' in window)) { items.forEach(seen); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { seen(e.target); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach(function (el) { io.observe(el); });
})();
