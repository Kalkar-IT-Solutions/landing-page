// The shell: title bar, Ortsteil, language and appearance, and the router.
// Routes live in the hash (#/abfall), so the app runs from any folder on
// any webspace without rewrite rules.

import { refreshLive } from './core.js';
import { lang, setLanguage, t } from './i18n.js';
import { applyTheme } from './settings.js';
import { h, symbol } from './ui.js';
import { homePage } from './views/home.js';
import { weatherPage } from './views/weather.js';
import { wastePage } from './views/waste.js';
import { eventsPage } from './views/events.js';
import { shoppingPage, foodPage } from './views/shopping.js';
import { vereinePage } from './views/vereine.js';
import { infoPage } from './views/info.js';
import { roadsPage } from './views/roads.js';
import { mapPage } from './views/map.js';

const ROUTES = {
  '': homePage,
  wetter: weatherPage,
  abfall: wastePage,
  termine: eventsPage,
  einkaufen: shoppingPage,
  essen: foodPage,
  vereine: vereinePage,
  info: infoPage,
  strassen: roadsPage,
  karte: mapPage,
};

const main = document.getElementById('main');
let renderId = 0;

function route() {
  const [name, ...rest] = location.hash.replace(/^#\/?/, '').split('/');
  return { name: ROUTES[name] ? name : '', params: rest.map(decodeURIComponent) };
}

async function render({ keepScroll = false } = {}) {
  const id = ++renderId;
  const { name, params } = route();
  const y = window.scrollY;
  document.body.dataset.page = name || 'start';
  const page = await ROUTES[name]({ params, rerender: () => render({ keepScroll: true }) });
  if (id !== renderId) return;
  main.replaceChildren(page);
  renderBar(name);
  window.scrollTo(0, keepScroll ? y : 0);
  if (!keepScroll) {
    const heading = main.querySelector('h1');
    if (heading && name) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
  const title = main.querySelector('h1')?.textContent;
  document.title = name && title ? `${title} · ${t('appTitle')}` : t('appTitle');
}

// ---------------------------------------------------------------- bar

const bar = document.getElementById('bar');

function renderBar(name) {
  const refreshButton = h('button.bar-button', {
    type: 'button',
    'aria-label': t('refresh'),
    title: t('refresh'),
    onclick: () => {
      refreshLive();
      render({ keepScroll: true });
    },
  }, symbol('refresh'));
  // The start page carries its tools in its own head; no empty bar.
  bar.hidden = !name;
  bar.replaceChildren(
    name
      ? h('a.bar-back', { href: '#/' }, symbol('arrow_back'), h('span', t('back')))
      : h('span'),
    refreshButton,
  );
}

// ---------------------------------------------------------------- start

setLanguage(lang);
applyTheme();
window.addEventListener('hashchange', () => render());
// Coming back to a tab after a while: fresh data, same place.
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now();
  else if (hiddenAt && Date.now() - hiddenAt > 10 * 60 * 1000) {
    refreshLive();
    render({ keepScroll: true });
  }
});
render();
