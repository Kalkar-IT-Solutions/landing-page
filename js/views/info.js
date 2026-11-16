// Info: emergency first, then what is near (Vor Ort), the town hall and
// other places with "open now", parking, the official gazette and links.

import { apiBase, contact, seed } from '../core.js';
import { t, fmt, local } from '../i18n.js';
import { h, badge, section, statusLine, source, pageHead, link, facts, openLine, slot, list, row } from '../ui.js';
import * as data from '../data.js';
import { partnerSlot } from './partners.js';
import { settingsBlock } from '../settings.js';

function infoSection(s) {
  return section(local(s, 'title'),
    openLine(s.hours),
    facts(s.facts.map((f) => ({ term: local(f, 'term'), value: local(f, 'value'), href: f.link }))),
    s.hours?.note ? h('p.row-meta', s.hours.note) : null);
}

function departuresBlock(ortsteil) {
  const stop = data.STOPS[ortsteil?.id ?? 'kalkar'];
  const closure = data.closureOf(stop);
  const served = closure?.replacement ?? stop;
  return section(t('departuresTitle', served.name),
    closure ? statusLine('warning', t('departuresMoved', stop.name, fmt.date(new Date(`${closure.until}T00:00:00`)), served.name)) : null,
    slot(data.departures(served), (d) => [
      d.live ? null : statusLine('neutral', t('departuresPlanOnly')),
      d.list.length ? h('ul.list.departures', d.list.map((x) => h('li', h('div.row',
        h('span.row-lead.hz-mono.line', x.line),
        h('span.row-body', h('span.row-title', x.destination)),
        h('span.row-trail.hz-mono',
          x.cancelled ? badge('critical', t('departuresCancelled')) : fmt.time(x.planned),
          !x.cancelled && x.estimated && x.estimated - x.planned >= 60000
            ? h('span.late', ` ${t('departuresLate', Math.round((x.estimated - x.planned) / 60000))}`) : null)))))
        : statusLine('neutral', t('departuresNone')),
      source(d.live ? t('departuresSource', fmt.time(d.at)) : t('departuresPlanSource')),
    ]));
}

function localBlock(ortsteil, info) {
  if (!ortsteil) return section(t('localTitle'), h('p.row-meta', t('localHint')));
  const churches = info.parishes.flatMap((p) => p.churches.filter((c) => c.ortsteil === ortsteil.id).map((c) => ({ ...c, parish: p })));
  const markets = info.markets.filter((m) => m.ortsteil === ortsteil.id);
  const places = info.places[ortsteil.id];
  return section(`${t('localTitle')} · ${ortsteil.name}`,
    churches.length ? [h('h3.t-kennung.hz-kennung.sub-head', t('localChurches')), list(churches.map((c) => row({
      title: c.name,
      meta: [c.address, c.parish.name],
      href: c.parish.website,
    })))] : null,
    h('p.row-links', link(t('localServices', 'katholisch'), info.services.catholic), link(t('localServices', 'evangelisch'), info.services.protestant)),
    markets.length ? [h('h3.t-kennung.hz-kennung.sub-head', t('shoppingMarkets')), list(markets.map((m) => row({
      title: m.name, meta: [[m.when, m.time].filter(Boolean).join(' · '), m.place], href: m.source,
    })))] : null,
    places ? [h('h3.t-kennung.hz-kennung.sub-head', t('localPlaces')), list(places.items.map((p) => row({ title: p }))),
      source(link(new URL(places.source).hostname, places.source))] : null,
  );
}

export async function infoPage({ rerender }) {
  const ortsteil = await data.currentOrtsteil();
  const [info, ortsteile, parking] = await Promise.all([seed('info'), seed('ortsteile'), seed('parking')]);
  const pinned = info.sections.filter((s) => s.pinned);
  const rest = info.sections.filter((s) => !s.pinned);
  const parkingHere = parking.parking.filter((p) => p.ortsteil === (ortsteil?.id ?? 'kalkar'));
  const parkingShown = parkingHere.length ? parkingHere : parking.parking.filter((p) => p.ortsteil === 'kalkar');

  return h('div.page',
    pageHead(ortsteil?.name ?? 'Kalkar', t('navInfo')),
    pinned.map(infoSection),
    apiBase ? section(t('pharmaciesTitle'), slot(data.pharmacies(), (p) => [
      list((p.pharmacies ?? []).map((x) => row({
        title: x.name,
        meta: [x.address, x.distanceKm ? t('roadDistance', fmt.number(x.distanceKm)) : null].filter(Boolean),
        href: x.phone ? `tel:${x.phone.replace(/[^\d+]/g, '')}` : null,
        trail: x.phone ? h('span.hz-mono', x.phone) : null,
      }))),
      source(h('span', t('pharmaciesSource'), ' · ', link('aknr.de', 'https://www.aknr.de/notdienst'))),
    ], { what: t('pharmaciesTitle') })) : null,
    departuresBlock(ortsteil),
    localBlock(ortsteil, ortsteile),
    apiBase && ortsteil ? slot(data.parishNews(), (n) => section(t('localParish'),
      list((n.news ?? []).slice(0, 5).map((x) => row({
        title: x.title, meta: [x.date ? fmt.date(new Date(`${x.date}T00:00:00`)) : null], href: x.url,
      }))),
      n.bulletin ? h('p', link(`Gemeinde aktuell · ${fmt.date(new Date(`${n.bulletin.date}T00:00:00`))} (PDF)`, n.bulletin.url)) : null,
    ), { quiet: true }) : null,
    rest.map(infoSection),
    section(t('parkingTitle'), list(parkingShown.map((p) => row({
      title: [p.ref, p.name ?? t('parkingPlace')].filter(Boolean).join(' · '),
      meta: [p.street, [
        p.spaces ? t('parkingSpaces', p.spaces) : null,
        p.fee === true ? t('parkingFee') : p.fee === false ? t('parkingFree') : null,
        p.disabledSpaces ? t('parkingDisabled', p.disabledSpaces) : null,
      ].filter(Boolean).join(' · ')],
      href: `https://www.openstreetmap.org/${p.osm}`,
    }))), source(t('parkingSource'))),
    section(t('infoGazette'), slot(data.gazette(), (issues) => [
      list(issues.slice(0, 5).map((i) => row({
        title: i.title, meta: [i.date ? fmt.date(new Date(`${i.date}T00:00:00`)) : null], href: i.url,
      }))),
      h('p', link(t('infoGazetteAll'), info.gazette.url)),
    ])),
    section(t('infoLinks'), list(info.links.map((l) => row({ title: local(l, 'title'), href: l.url })))),
    partnerSlot('info'),
    section(t('settingsTitle'), settingsBlock(rerender)),
    section(t('infoAbout'),
      h('p', t('infoNotOfficial')),
      h('p', t('infoAttribution')),
      apiBase ? h('p.row-meta', t('infoPrivacy')) : null,
      contact ? h('p', link(t('infoContact'), contact)) : null,
      h('p.row-meta', t('infoAsOf', fmt.date(new Date(`${info.asOf}T00:00:00`)))),
    ),
  );
}
