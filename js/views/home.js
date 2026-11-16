// The start page: warnings and closures on top, then the tiles.

import { refreshLive, apiBase, dayOf, daysBetween, isOpenNow, seed, store } from '../core.js';
import { lang, t, fmt, local } from '../i18n.js';
import { h, symbol, kennung, notice, statusLine, slot, openLine } from '../ui.js';
import * as data from '../data.js';
import { reviewCard } from './community.js';
import { ortsteilSelect } from '../settings.js';

function tile(href, title, body, { small = false } = {}) {
  return h(`a.tile${small ? '.tile--small' : ''}`, { href }, kennung(title, 'h2'), h('div.tile-body', body));
}

export async function homePage({ rerender }) {
  const ortsteil = await data.currentOrtsteil();
  const place = ortsteil?.name ?? 'Kalkar';

  const warnings = slot(data.warnings(), (list) => list.slice(0, 3).map((w) => notice(
    w.rank <= 1 ? 'critical' : 'warning',
    t('warningSeverity', w.severity),
    (lang === 'en' && w.headlines.en) || w.headline,
    '#/wetter',
  )), { quiet: true });

  const closures = slot(data.activeClosures(ortsteil), (list) => (list.length
    ? notice('warning', t('homeClosures', list.length, place), list.map((w) => w.title).join(' · '), '#/strassen')
    : null), { quiet: true });

  const tiles = h('div.tiles',
    tile('#/wetter', t('navWeather'), weatherTile()),
    tile('#/abfall', t('navWaste'), wasteTile()),
    tile('#/termine', t('navEvents'), eventsTile(ortsteil)),
    tile('#/einkaufen', t('navShopping'), shoppingTile(ortsteil)),
    tile('#/essen', t('navFood'), foodTile(ortsteil)),
    tile('#/vereine', t('navVereine'), vereineTile(ortsteil), { small: true }),
    tile('#/info', t('navInfo'), infoTile(), { small: true }),
  );

  return h('div.page.page--home',
    h('header.page-head.page-head--home',
      h('p.t-kennung.hz-kennung', fmt.weekday(new Date())),
      h('button.bar-button.home-refresh', { type: 'button', 'aria-label': t('refresh'), title: t('refresh'),
        onclick: () => { refreshLive(); rerender(); } }, symbol('refresh')),
      h('h1.t-title-1', t('appTitle')),
      await ortsteilSelect(rerender)),
    h('div.notices', warnings, closures),
    apiBase ? reviewCard(['event', 'roadwork', 'verein', 'hofladen']) : null,
    tiles,
    h('nav.home-more',
      h('a.hz-button.hz-button--secondary', { href: '#/karte' }, t('navMap')),
      h('a.hz-button.hz-button--secondary', { href: '#/strassen' }, t('navRoads'))),
  );
}

function weatherTile() {
  return [
    slot(data.warnings(), (list) => (list.length
      ? statusLine(list[0].rank <= 1 ? 'critical' : 'warning', t('warnings', list.length))
      : statusLine('positive', t('warningsNone'))), { quiet: true }),
    slot(data.weather(), (w) => h('p.metric',
      h('span.metric-label', t('condition', w.condition)),
      h('span.metric-value', typeof w.temperature === 'number' ? fmt.celsius(w.temperature) : t('noValue'))),
    { what: t('weatherTitle') }),
    slot(data.gauges(), (list) => h('p.tile-meta.hz-mono',
      t('homeRhine', fmt.cm(list[0].cm), t('gaugeState', list[0].level))), { quiet: true }),
  ];
}

function wasteTile() {
  const district = store.get('district');
  if (!district) return statusLine('neutral', t('wasteNoDistrictShort'));
  return slot(data.wasteCalendar(), (waste) => {
    const next = data.pickups(waste, district, { optional: store.get('wasteOptional') === true })[0];
    if (!next) return statusLine('neutral', t('wasteNoneLeft', waste.districts.find((d) => d.id === district)?.name ?? ''));
    const days = daysBetween(dayOf(new Date()), next.date);
    return [
      h('p.metric', h('span.metric-label', t('daysUntil', days)),
        h('span.metric-value', fmt.shortDate(new Date(`${next.date}T00:00:00`)))),
      h('p.tile-text', next.types.map((type) => local(type, 'name')).join(', ')),
    ];
  });
}

function eventsTile(ortsteil) {
  return slot(data.events(), (list) => {
    const today = dayOf(new Date());
    const starting = list.filter((e) => e.day >= today);
    const localNext = ortsteil
      ? starting.find((e) => e.ortsteile.includes(ortsteil.id) && daysBetween(today, e.day) < 28)
      : null;
    const next = localNext ?? starting[0] ?? list[0];
    if (!next) return statusLine('neutral', t('eventsNone'));
    const thisWeek = starting.filter((e) => daysBetween(today, e.day) < 7).length;
    return [
      h('p.tile-meta.hz-mono', next.allDay ? fmt.shortDate(next.start) : fmt.when(next.start)),
      h('p.tile-text', next.title),
      localNext ? h('p.tile-muted', t('homeEventIn', ortsteil.name)) : null,
      thisWeek > 1 ? h('p.tile-muted', t('homeMoreEvents', thisWeek - 1)) : null,
    ];
  });
}

function shoppingTile(ortsteil) {
  return slot(Promise.all([data.farmShops(), seed('ortsteile')]), ([shops, info]) => {
    const here = shops.filter((s) => (ortsteil ? s.ortsteil === ortsteil.id : s.ortsteil !== 'umgebung'));
    const open = here.filter((s) => isOpenNow(s)).length;
    const market = info.markets.find((m) => (ortsteil ? m.ortsteil === ortsteil.id : true) && /wöchentlich/.test(m.when ?? ''));
    return [
      h('p.tile-text', t('homeFarmShops', here.length)),
      here.length ? statusLine(open > 0 ? 'positive' : 'neutral', t('homeFarmShopsOpen', open)) : null,
      market ? h('p.tile-muted', [market.name, market.when].filter(Boolean).join(' · ')) : null,
    ];
  });
}

function foodTile(ortsteil) {
  return slot(seed('gastro'), ({ shops }) => {
    const here = shops.filter((p) => !ortsteil || p.ortsteil === ortsteil.id);
    const open = here.filter((p) => isOpenNow(p)).length;
    const kinds = new Map();
    for (const p of here) kinds.set(p.kind, (kinds.get(p.kind) ?? 0) + 1);
    const common = [...kinds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => t('kind', k));
    return [
      h('p.tile-text', t('homeFood', here.length)),
      open ? statusLine('positive', t('homeFarmShopsOpen', open)) : null,
      common.length ? h('p.tile-muted', common.join(', ')) : null,
    ];
  });
}

function vereineTile(ortsteil) {
  return slot(data.vereine(), (list) => {
    const n = ortsteil ? list.filter((v) => (v.ortsteile ?? []).includes(ortsteil.id)).length : list.length;
    return h('p.tile-text', t('homeVereine', n, ortsteil?.name));
  });
}

function infoTile() {
  return slot(Promise.all([seed('info'), data.gazette()]), ([info, issues]) => {
    const hours = info.sections.find((s) => s.hours)?.hours;
    const issue = issues[0];
    return [
      hours ? h('p.tile-text', t('homeRathaus')) : null,
      openLine(hours),
      issue ? h('p.tile-muted', issue.date ? t('homeNewGazette', issue.title, fmt.date(new Date(`${issue.date}T00:00:00`))) : issue.title) : null,
    ];
  });
}
