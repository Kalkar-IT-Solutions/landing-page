// Einkaufen (markets, shops, farm shops) and Essen & Trinken.

import { apiBase, isOpenNow, seed } from '../core.js';
import { t } from '../i18n.js';
import { h, section, statusLine, source, pageHead, link, openLine, row, list } from '../ui.js';
import * as data from '../data.js';
import { reportBlock } from './community.js';

function placeRow(p, ortsteilName) {
  const where = [p.address, p.ortsteil && p.ortsteil !== 'umgebung' ? ortsteilName(p.ortsteil) : null].filter(Boolean);
  const facts = [
    p.products?.length ? h('span.row-meta', p.products.join(', ')) : null,
    p.always ? statusLine('positive', t('farmAlways')) : openLine(p.hours),
    !p.always && !p.hours && p.hoursText ? h('span.row-meta.hz-mono', p.hoursText) : null,
    p.hours && p.hoursText ? h('span.row-meta.hz-mono', p.hoursText) : null,
    p.season ? h('span.row-meta', p.season) : null,
    p.reported ? h('span.row-tag', t('reportedByUsers')) : null,
  ];
  const links = [
    p.website ? link(t('website'), p.website) : null,
    p.phone ? link(p.phone, `tel:${p.phone.replace(/[^\d+]/g, '')}`) : null,
    p.lat ? link('OpenStreetMap', `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=17/${p.lat}/${p.lon}`) : null,
  ].filter(Boolean);
  return h('li', h('div.row',
    h('span.row-body',
      h('span.row-title', p.name),
      h('span.row-meta', [t('kind', p.kind), ...where].join(' · ')),
      facts,
      links.length ? h('span.row-links', links) : null)));
}

/** Open places first, then by name. */
function byOpen(a, b) {
  return Number(isOpenNow(b)) - Number(isOpenNow(a)) || a.name.localeCompare(b.name, 'de');
}

export async function shoppingPage() {
  const ortsteil = await data.currentOrtsteil();
  const [info, shops, farms] = await Promise.all([seed('ortsteile'), seed('geschaefte'), data.farmShops()]);
  const name = (id) => info.ortsteile.find((o) => o.id === id)?.name ?? '';
  const markets = info.markets.filter((m) => !ortsteil || m.ortsteil === ortsteil.id);
  const shopsHere = shops.shops.filter((s) => !ortsteil || s.ortsteil === ortsteil.id).sort(byOpen);
  const farmsHere = farms.filter((s) => (ortsteil ? s.ortsteil === ortsteil.id : s.ortsteil !== 'umgebung')).sort(byOpen);
  const farmsNear = farms.filter((s) => s.ortsteil === 'umgebung' || (ortsteil && s.ortsteil !== ortsteil.id)).sort(byOpen);

  return h('div.page',
    pageHead(ortsteil?.name ?? 'Kalkar', t('shoppingTitle')),
    markets.length ? section(t('shoppingMarkets'), list(markets.map((m) => row({
      title: m.name,
      meta: [[m.when, m.time].filter(Boolean).join(' · '), m.place],
      href: m.source,
    })))) : null,
    shopsHere.length ? section(t('shoppingShops'), h('ul.list', shopsHere.map((s) => placeRow(s, name))),
      source(t('shopsSource'))) : null,
    section(t('farmShopsTitle'),
      farmsHere.length ? h('ul.list', farmsHere.map((s) => placeRow(s, name))) : statusLine('neutral', t('farmEmpty', ortsteil?.name ?? 'Kalkar'))),
    farmsNear.length ? section(t('farmShopsNearby'), h('ul.list', farmsNear.map((s) => placeRow(s, name)))) : null,
    apiBase ? reportBlock('hofladen', t('reportFarmMissing'), t('reportFarmAction')) : null,
    source(t('farmSource')),
  );
}

export async function foodPage() {
  const ortsteil = await data.currentOrtsteil();
  const [info, food] = await Promise.all([seed('ortsteile'), seed('gastro')]);
  const name = (id) => info.ortsteile.find((o) => o.id === id)?.name ?? '';
  const here = food.shops.filter((p) => !ortsteil || p.ortsteil === ortsteil.id).sort(byOpen);
  const kinds = [...new Set(here.map((p) => p.kind))];
  return h('div.page',
    pageHead(ortsteil?.name ?? 'Kalkar', t('navFood')),
    here.length
      ? kinds.map((k) => section(t('kind', k), h('ul.list', here.filter((p) => p.kind === k).map((p) => placeRow(p, name)))))
      : statusLine('neutral', t('foodEmpty', ortsteil?.name ?? 'Kalkar')),
    source(t('foodSource')),
  );
}

