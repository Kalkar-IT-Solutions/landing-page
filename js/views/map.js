// Karte: Kalkar's own vector tiles (OpenStreetMap, served from
// config.mapBase) in Horizont's neutrals, with the places of the app.
// MapLibre GL JS comes with the app (vendor/maplibre) and loads only here.

import { mapBase, seed, store } from '../core.js';
import { t, local } from '../i18n.js';
import { h, statusLine, pageHead, source, link } from '../ui.js';
import * as data from '../data.js';

const BOUNDS = [6.10, 51.62, 6.52, 51.86];
const CATEGORIES = ['farm', 'shop', 'food', 'market', 'church', 'stop', 'parking', 'sport', 'kids', 'health', 'everyday',
  'leisure', 'stay', 'sight', 'museum', 'roadwork'];
const DEFAULT_ON = ['farm', 'shop', 'food', 'market', 'church', 'stop', 'sight', 'museum', 'roadwork'];

let loading;
function loadMapLibre() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  loading ??= new Promise((resolve, reject) => {
    document.head.append(h('link', { rel: 'stylesheet', href: 'vendor/maplibre/maplibre-gl.css' }));
    const script = h('script', { src: 'vendor/maplibre/maplibre-gl.js' });
    script.onload = () => resolve(window.maplibregl);
    script.onerror = () => reject(new Error('network'));
    document.head.append(script);
  });
  return loading;
}

function cssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(`--${name}`).trim();
}

/** Resolves light-dark() and color-mix() through a probe element. */
function color(name) {
  const probe = h('span', { style: { color: `var(--${name})`, display: 'none' } });
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value || cssVar(name);
}

function isDark() {
  const theme = document.documentElement.dataset.theme;
  if (theme) return theme === 'dark';
  return matchMedia('(prefers-color-scheme: dark)').matches;
}

/** The same quiet style as the old app (lib/features/map/map_style.dart). */
function style() {
  const dark = isDark();
  const water = dark ? '#22343D' : '#CFDDE5';
  const wood = dark ? '#1F2A20' : '#E1E8D8';
  const grass = dark ? '#212720' : '#E9EDE2';
  const road = dark ? '#3A3C36' : '#FFFFFF';
  const major = dark ? '#55574F' : '#F6E9C4';
  const majorCasing = dark ? '#6A6C63' : '#D8C391';
  const bg = color('bg');
  const zoomed = (a, b) => ['interpolate', ['exponential', 1.6], ['zoom'], 10, a, 18, b];
  const majorRoads = ['in', 'class', 'motorway', 'trunk', 'primary', 'secondary'];
  const minorRoads = ['in', 'class', 'tertiary', 'minor', 'service'];
  const line = (id, filter, lineColor, width, layer = 'transportation') => ({
    id, type: 'line', source: 'omt', 'source-layer': layer, filter,
    layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': lineColor, 'line-width': width },
  });
  const name = ['coalesce', ['get', 'name:de'], ['get', 'name']];
  return {
    version: 8,
    glyphs: `${mapBase}/fonts/{fontstack}/{range}.pbf`,
    sources: {
      omt: {
        type: 'vector', tiles: [`${mapBase}/kalkar/{z}/{x}/{y}.pbf`], minzoom: 0, maxzoom: 14, bounds: BOUNDS,
        attribution: t('mapAttribution'),
      },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': bg } },
      { id: 'wood', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['==', 'class', 'wood'], paint: { 'fill-color': wood } },
      { id: 'grass', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['in', 'class', 'grass', 'wetland'], paint: { 'fill-color': grass } },
      { id: 'town', type: 'fill', source: 'omt', 'source-layer': 'landuse', filter: ['in', 'class', 'residential', 'commercial', 'retail'], paint: { 'fill-color': color('sunken') } },
      { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': grass } },
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': water } },
      line('waterway', ['==', '$type', 'LineString'], water, zoomed(0.6, 3), 'waterway'),
      { id: 'building', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 14, paint: { 'fill-color': color('line'), 'fill-opacity': 0.6 } },
      line('road-path', ['in', 'class', 'path', 'track'], color('line-strong'), zoomed(0.3, 1.5)),
      line('road-minor-casing', minorRoads, color('line-strong'), zoomed(1.4, 12)),
      line('road-major-casing', majorRoads, majorCasing, zoomed(2.6, 18)),
      line('road-minor', minorRoads, road, zoomed(0.8, 10)),
      line('road-major', majorRoads, major, zoomed(1.6, 15)),
      line('rail', ['==', 'class', 'rail'], color('text-faint'), zoomed(0.6, 2)),
      {
        id: 'water-name', type: 'symbol', source: 'omt', 'source-layer': 'water_name',
        layout: { 'text-field': name, 'text-font': ['Noto Sans Italic'], 'text-size': 12, 'symbol-placement': 'line' },
        paint: { 'text-color': dark ? '#7FA3B5' : '#557A8C', 'text-halo-color': bg, 'text-halo-width': 1.2 },
      },
      {
        id: 'road-name', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 14,
        layout: { 'text-field': name, 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'symbol-placement': 'line' },
        paint: { 'text-color': color('text-muted'), 'text-halo-color': bg, 'text-halo-width': 1.4 },
      },
      {
        id: 'place', type: 'symbol', source: 'omt', 'source-layer': 'place',
        filter: ['in', 'class', 'city', 'town', 'village', 'suburb', 'hamlet'],
        layout: { 'text-field': name, 'text-font': ['Noto Sans Medium'], 'text-size': ['match', ['get', 'class'], ['city', 'town'], 16, 'village', 13, 11] },
        paint: { 'text-color': color('text'), 'text-halo-color': bg, 'text-halo-width': 1.6 },
      },
    ],
  };
}

/** All places of the app as GeoJSON points, each with its category. */
async function points() {
  const [farms, shops, food, sport, alltag, umgebung, umgebungOrte, orte, ortsteile, parking] = await Promise.all([
    data.farmShops(), seed('geschaefte'), seed('gastro'), seed('sport'), seed('alltag'), seed('umgebung'),
    seed('umgebung_orte'), seed('orte'), seed('ortsteile'), seed('parking')]);
  const features = [];
  const add = (category, p, name, detail, url) => {
    if (typeof p.lat !== 'number') return;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      properties: { category, name, detail: detail ?? '', url: url ?? '' },
    });
  };
  for (const p of farms) add('farm', p, p.name, [t('kind', p.kind), (p.products ?? []).join(', ')].filter(Boolean).join(' · '), p.website);
  for (const p of shops.shops) add('shop', p, p.name, [t('kind', p.kind), p.address].filter(Boolean).join(' · '), p.website);
  for (const p of food.shops) add('food', p, p.name, [t('kind', p.kind), p.address].filter(Boolean).join(' · '), p.website);
  for (const p of [...sport.places, ...alltag.places, ...umgebung.places, ...umgebungOrte.places]) {
    add(p.category, p, p.name, [local(p, 'description'), p.address ?? p.town].filter(Boolean).join(' · '), p.website);
  }
  for (const p of parking.parking) add('parking', p, [p.ref, p.name ?? t('parkingPlace')].filter(Boolean).join(' · '), p.street);
  const at = orte.places;
  for (const [key, p] of Object.entries(at)) {
    const [kind, rest] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
    if (kind === 'kirche') add('church', p, rest, p.query);
    if (kind === 'haltestelle') {
      const stop = Object.values(data.STOPS).find((s) => s.id === rest) ?? (rest === 'de:05154:37332' ? { name: 'Fachmarktzentrum' } : null);
      add('stop', p, stop?.name ?? rest, data.STOP_CLOSURES[rest] ? `${t('closed')} · ${data.STOP_CLOSURES[rest].replacement.name}` : '');
    }
    if (kind === 'sperrung') add('roadwork', p, rest.split('|')[1] ?? rest, rest.split('|')[0]);
  }
  for (const m of ortsteile.markets) {
    const p = at[`ort:${m.place}`];
    if (p) add('market', p, m.name, [m.when, m.time].filter(Boolean).join(' · '));
  }
  return { type: 'FeatureCollection', features };
}

export async function mapPage() {
  const ortsteil = await data.currentOrtsteil();
  if (!mapBase) return h('div.page', pageHead('Kalkar', t('mapTitle')), statusLine('neutral', t('mapUnavailable')));

  const on = new Set(store.get('mapFilter') ?? DEFAULT_ON);
  const box = h('div.map', { role: 'region', 'aria-label': t('mapTitle') });
  const filters = h('div.map-filters', { role: 'group', 'aria-label': t('mapFilter') });
  const status = h('div.slot');
  const page = h('div.page.page--map',
    pageHead(ortsteil?.name ?? 'Kalkar', t('mapTitle')),
    filters, status, box,
    source(h('span', link(t('mapAttribution'), 'https://www.openstreetmap.org/copyright'), ' · ODbL')));

  Promise.all([loadMapLibre(), points()]).then(([maplibregl, geo]) => {
    const counts = new Map();
    for (const f of geo.features) counts.set(f.properties.category, (counts.get(f.properties.category) ?? 0) + 1);
    const map = new maplibregl.Map({
      container: box,
      style: style(),
      bounds: [[6.22, 51.70], [6.40, 51.80]],
      maxBounds: [[BOUNDS[0] - 0.05, BOUNDS[1] - 0.03], [BOUNDS[2] + 0.05, BOUNDS[3] + 0.03]],
      attributionControl: { compact: true },
      cooperativeGestures: matchMedia('(pointer: coarse)').matches,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: false }), 'top-right');
    const filter = () => ['in', ['get', 'category'], ['literal', [...on]]];
    map.on('load', () => {
      map.addSource('places', { type: 'geojson', data: geo });
      map.addLayer({
        id: 'places', type: 'circle', source: 'places', filter: filter(),
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 15, 7],
          'circle-color': ['match', ['get', 'category'], 'stop', '#2E7D4F', 'roadwork', color('critical'), color('accent')],
          'circle-stroke-color': color('bg'),
          'circle-stroke-width': 1.5,
        },
      });
      map.on('click', 'places', (e) => {
        const p = e.features[0].properties;
        const content = h('div.map-popup', h('strong', p.name), p.detail ? h('span', p.detail) : null,
          h('span.row-meta', t('mapKind', p.category)), p.url ? link(t('website'), p.url) : null);
        new maplibregl.Popup({ closeButton: true, maxWidth: '260px' }).setLngLat(e.features[0].geometry.coordinates).setDOMContent(content).addTo(map);
      });
      map.on('mouseenter', 'places', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'places', () => { map.getCanvas().style.cursor = ''; });
    });
    filters.replaceChildren(...CATEGORIES.filter((c) => counts.has(c)).map((c) => h('button.chip', {
      type: 'button',
      'aria-pressed': on.has(c) ? 'true' : 'false',
      onclick: (e) => {
        if (on.has(c)) on.delete(c);
        else on.add(c);
        e.currentTarget.setAttribute('aria-pressed', on.has(c) ? 'true' : 'false');
        store.set('mapFilter', [...on]);
        if (map.getLayer('places')) map.setFilter('places', filter());
      },
    }, `${t('mapKind', c)} · ${counts.get(c)}`)));
  }).catch((error) => {
    console.error(error);
    status.replaceChildren(statusLine('neutral', t('mapUnavailable')));
  });

  return page;
}
