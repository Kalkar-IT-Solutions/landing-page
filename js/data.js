// Where each piece of data comes from. Three kinds of source:
//  - files of the app (data/*.json), always there;
//  - open APIs with CORS, read straight from the browser (Bright Sky,
//    PEGELONLINE);
//  - the backend (Supabase Edge Function), for sources without CORS, the
//    reports of users and live departures. A copy without backend
//    (config.js, apiBase "") falls back to the files or hides the part.

import { api, apiBase, dayOf, addDays, fetchJson, live, parseTime, seed, store, minutesOf, weekdayOf, daysBetween } from './core.js';

const KALKAR = { lat: 51.7389, lon: 6.2925 };

// ---------------------------------------------------------------- state

/** The chosen Ortsteil ({id, name}) or null for all of Kalkar. */
export async function currentOrtsteil() {
  const id = store.get('ortsteil');
  if (!id) return null;
  const { ortsteile } = await seed('ortsteile');
  return ortsteile.find((o) => o.id === id) ?? null;
}

// ---------------------------------------------------------------- weather and Rhine

export function warnings() {
  return live('warnings', async () => {
    const list = await api('/nina/dashboard/051540000000.json');
    if (!Array.isArray(list)) throw new Error('format');
    const order = ['Extreme', 'Severe', 'Moderate', 'Minor'];
    return list
      .map((item) => {
        const data = item.payload?.data ?? {};
        const titles = item.i18nTitle ?? {};
        const headline = titles.de ?? data.headline;
        if (!headline || !item.id) return null;
        return {
          id: item.id,
          headline,
          headlines: titles,
          severity: String(data.severity ?? item.severity ?? '').toLowerCase(),
          rank: (order.indexOf(data.severity ?? item.severity) + 5) % 5,
          provider: data.provider ?? '',
          sent: parseTime(item.sent ?? item.startDate),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank);
  }, { maxAge: 120 });
}

export function weather() {
  return live('weather', async () => {
    const json = await fetchJson(`https://api.brightsky.dev/current_weather?lat=${KALKAR.lat}&lon=${KALKAR.lon}`);
    const w = json.weather;
    if (!w?.timestamp) throw new Error('format');
    const station = (json.sources ?? []).find((s) => s.id === w.source_id) ?? json.sources?.[0];
    const name = (station?.station_name ?? '').toLowerCase().replace(/(^|[\s-])\S/g, (c) => c.toUpperCase());
    return {
      observedAt: new Date(w.timestamp),
      condition: w.icon,
      station: name,
      temperature: w.temperature,
      wind: w.wind_speed_10,
      gust: w.wind_gust_speed_10,
      windDirection: w.wind_direction_10,
      rain: w.precipitation_60,
      humidity: w.relative_humidity,
    };
  }, { maxAge: 600 });
}

export function forecast() {
  return live('forecast', async () => {
    const today = dayOf(new Date());
    const json = await fetchJson(`https://api.brightsky.dev/weather?lat=${KALKAR.lat}&lon=${KALKAR.lon}&date=${today}&last_date=${addDays(today, 4)}&tz=Europe/Berlin`);
    if (!Array.isArray(json.weather)) throw new Error('format');
    return json.weather.map((w) => ({
      at: new Date(w.timestamp),
      condition: w.icon,
      temperature: w.temperature,
      chance: w.precipitation_probability,
      rain: w.precipitation,
    }));
  }, { maxAge: 1800 });
}

/** Every third hour of the next twelve. */
export function nextHours(hours, now = new Date()) {
  return hours.filter((h) => h.at >= now).slice(0, 13).filter((h) => h.at.getHours() % 3 === 0);
}

/** Up to three whole days after today, each with most of its hours. */
export function nextDays(hours, now = new Date()) {
  const today = dayOf(now);
  const byDay = new Map();
  for (const h of hours) {
    const d = dayOf(h.at);
    if (d <= today) continue;
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d).push(h);
  }
  const values = (list, key) => list.map((h) => h[key]).filter((v) => typeof v === 'number');
  return [...byDay.entries()].slice(0, 3).filter(([, list]) => list.length >= 18).map(([day, list]) => {
    const temps = values(list, 'temperature');
    const chances = values(list, 'chance');
    return {
      day,
      condition: (list.find((h) => h.at.getHours() === 13) ?? list[Math.floor(list.length / 2)]).condition,
      min: temps.length ? Math.min(...temps) : null,
      max: temps.length ? Math.max(...temps) : null,
      chance: chances.length ? Math.max(...chances) : null,
      rain: values(list, 'rain').reduce((a, b) => a + b, 0),
    };
  });
}

export function gauges() {
  return live('gauges', async () => {
    const stations = ['REES', 'EMMERICH'];
    const answers = await Promise.all(stations.map((s) => fetchJson(
      `https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/${s}.json?includeTimeseries=true&includeCurrentMeasurement=true`)));
    return answers.map((json, i) => {
      const m = (json.timeseries ?? []).find((t) => t.shortname === 'W')?.currentMeasurement;
      if (!m) throw new Error('format');
      const level = m.stateNswHsw === 'high' ? 'aboveHsw' : (['low', 'normal', 'high'].includes(m.stateMnwMhw) ? m.stateMnwMhw : 'unknown');
      return { station: stations[i], cm: m.value, at: new Date(m.timestamp), level, km: json.km };
    });
  }, { maxAge: 600 });
}

export function pollen() {
  return live('pollen', async () => {
    const json = await api('/dwd/pollen.json');
    const region = (json.content ?? []).find((c) => c.partregion_id === 41);
    if (!region) throw new Error('format');
    const types = ['Hasel', 'Erle', 'Esche', 'Birke', 'Graeser', 'Roggen', 'Beifuss', 'Ambrosia'];
    const day = (key) => types.map((type) => ({ type, level: region.Pollen?.[type]?.[key] ?? null }));
    return { region: region.partregion_name, today: day('today'), tomorrow: day('tomorrow') };
  }, { maxAge: 3600 });
}

export function niederrhein() {
  return live('niederrhein', () => api('/wetter-niederrhein.json'), { maxAge: 1800 });
}

// ---------------------------------------------------------------- roads

export function roads() {
  return live('roads', async () => {
    const json = await api('/roads.json');
    return (json.works ?? []).map((w) => ({
      ...w,
      ortsteile: w.ortsteile ?? [],
      start: parseTime(w.start),
      end: parseTime(w.end),
      inTown: w.distanceKm === 0 || (w.ortsteile ?? []).length > 0,
    }));
  }, { maxAge: 900 });
}

/** Closures in Kalkar happening now, with those reported by users. */
export async function activeClosures(ortsteil) {
  const [official, reported] = await Promise.all([
    roads().then((r) => r.value).catch(() => []),
    communityItems().catch(() => []),
  ]);
  const fromUsers = reported.filter((c) => c.kind === 'roadwork' && c.payload.closed).map(roadworkFromReport);
  return [...fromUsers, ...official].filter((w) => w.kind === 'closure' && !w.planned && w.inTown
    && (!ortsteil || w.ortsteile.includes(ortsteil.id)));
}

export function roadworkFromReport(c) {
  const p = c.payload;
  return {
    title: p.place,
    road: 'Kalkar',
    kind: p.closed ? 'closure' : 'works',
    planned: false,
    details: p.note ?? '',
    start: null,
    end: p.until ? parseTime(p.until) : null,
    ortsteile: p.ortsteil ? [p.ortsteil] : [],
    inTown: true,
    distanceKm: 0,
    reported: true,
  };
}

// ---------------------------------------------------------------- community

export function communityItems() {
  if (!apiBase) return Promise.resolve([]);
  return live('community', async () => (await api('/community.json')).items ?? [], { maxAge: 300 })
    .then((r) => r.value);
}

export async function sendReport(kind, payload) {
  const response = await fetch(`${apiBase}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, payload, device: (await import('./core.js')).deviceId() }),
  }).catch(() => null);
  if (!response) throw new Error('network');
  if (response.status === 429) throw new Error('limit');
  if (response.status === 400) throw new Error('refused');
  if (!response.ok) throw new Error(`status:${response.status}`);
  return response.json();
}

export async function nextReview(kinds) {
  const { deviceId } = await import('./core.js');
  const json = await api(`/reports/review?device=${encodeURIComponent(deviceId())}&kinds=${kinds.join(',')}`);
  return json.report ?? null;
}

export async function vote(id, confirms) {
  const { deviceId } = await import('./core.js');
  const response = await fetch(`${apiBase}/reports/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, device: deviceId(), confirms }),
  });
  if (!response.ok) throw new Error(`status:${response.status}`);
  return response.json();
}

// ---------------------------------------------------------------- events

function eventFrom(e, origin) {
  const start = parseTime(e.start);
  if (!start) return null;
  const allDay = e.allDay ?? /^\d{4}-\d{2}-\d{2}$/.test(e.start);
  const end = parseTime(e.end);
  return {
    key: `${e.start}|${e.title}`,
    title: e.title,
    kind: e.kind ?? 'event',
    start,
    end,
    day: dayOf(start),
    lastDay: end ? dayOf(allDay ? end : new Date(end - 1)) : dayOf(start),
    allDay,
    place: e.place ?? '',
    url: e.url ?? '',
    ortsteile: e.ortsteile ?? [],
    origin,
  };
}

/**
 * All events from today: the snapshot in the app, council meetings and
 * club calendars live from the backend, events reported by users. A
 * live event replaces the snapshot's copy (same day and title).
 */
export async function events() {
  const [file, council, clubs, reported] = await Promise.all([
    seed('events'),
    live('council', () => api('/council.json'), { maxAge: 1800 }).then((r) => r.value.events ?? []).catch(() => null),
    live('clubs', () => api('/club-events.json'), { maxAge: 1800 }).then((r) => r.value.events ?? []).catch(() => []),
    communityItems().catch(() => []),
  ]);
  const today = dayOf(new Date());
  const fromFile = file.events.filter((e) => council === null || e.kind !== 'council');
  const all = [
    ...fromFile.map((e) => eventFrom(e, 'file')),
    ...(council ?? []).map((e) => eventFrom(e, 'live')),
    ...clubs.map((e) => eventFrom(e, 'live')),
    ...reported.filter((c) => c.kind === 'event').map((c) => eventFrom({
      title: c.payload.title,
      start: c.payload.time ? `${c.payload.date}T${c.payload.time}:00` : c.payload.date,
      allDay: !c.payload.time,
      place: c.payload.place,
      url: c.payload.url,
      ortsteile: c.payload.ortsteil ? [c.payload.ortsteil] : [],
    }, 'users')),
  ].filter((e) => e && e.lastDay >= today);
  const seen = new Set();
  const unique = [];
  for (const e of all.sort((a, b) => (a.origin === 'live' ? -1 : 0) - (b.origin === 'live' ? -1 : 0))) {
    const id = `${e.day}|${e.title.toLowerCase()}`;
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(e);
  }
  return unique.sort((a, b) => a.start - b.start);
}

/** Holidays and school breaks between [from] and [to] (days). */
export async function calendarMarks(from, to) {
  const { breaks } = await seed('ferien');
  return {
    breaks: breaks.filter((b) => b.last >= from && b.first <= to),
  };
}

// ---------------------------------------------------------------- waste

export async function wasteCalendar() {
  return seed('waste');
}

/** The district ids of [street], [] when unknown. */
export function districtsOf(waste, street) {
  return waste.districts.filter((d) => d.areas.includes(street)).map((d) => d.id);
}

/** The pickups of [district] from [today]: [{date, types: [...]}]. */
export function pickups(waste, district, { optional = false, today = dayOf(new Date()) } = {}) {
  const types = new Map(waste.types.map((t) => [t.id, t]));
  const byDay = new Map();
  for (const c of waste.collections) {
    if (c.district !== district || c.date < today) continue;
    const type = types.get(c.type);
    if (!type || (type.optional && !optional)) continue;
    if (!byDay.has(c.date)) byDay.set(c.date, []);
    byDay.get(c.date).push(type);
  }
  return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, list]) => ({ date, types: list }));
}

// ---------------------------------------------------------------- places

export async function farmShops() {
  const [file, reported] = await Promise.all([seed('hoflaeden'), communityItems().catch(() => [])]);
  return [
    ...file.shops,
    ...reported.filter((c) => c.kind === 'hofladen').map((c) => ({
      name: c.payload.name,
      kind: c.payload.kind,
      products: c.payload.products ?? [],
      hoursText: c.payload.hoursText,
      address: c.payload.address,
      ortsteil: c.payload.ortsteil ?? 'kalkar',
      website: c.payload.url,
      reported: true,
    })),
  ];
}

export async function vereine() {
  const [file, reported] = await Promise.all([seed('ortsteile'), communityItems().catch(() => [])]);
  return [
    ...file.vereine,
    ...reported.filter((c) => c.kind === 'verein').map((c) => ({
      name: c.payload.name,
      category: c.payload.category,
      ortsteile: c.payload.ortsteil ? [c.payload.ortsteil] : [],
      website: c.payload.url,
      reported: true,
    })),
  ];
}

// ---------------------------------------------------------------- info

export function gazette() {
  return live('gazette', () => api('/gazette.json'), { maxAge: 3600 }).then((r) => r.value.issues ?? [])
    .catch(async () => (await seed('info')).gazette.issues);
}

export function parishNews() {
  return live('parish', () => api('/parish-news.json'), { maxAge: 3600 });
}

export function pharmacies() {
  return live('pharmacies', () => api('/pharmacies.json'), { maxAge: 900 });
}

export function partners() {
  return live('partners', () => api('/partners.json'), { maxAge: 600 }).then((r) => r.value);
}

// ---------------------------------------------------------------- buses

export const STOPS = {
  kalkar: { id: 'de:05154:35649', name: 'Markt' },
  altkalkar: { id: 'de:05154:35646', name: 'Altkalkarer Straße' },
  appeldorn: { id: 'de:05154:35662', name: 'Appeldorn Markt' },
  'emmericher-eyland': { id: 'de:05154:35916', name: 'Köstershof' },
  grieth: { id: 'de:05154:35929', name: 'Grieth' },
  hanselaer: { id: 'de:05154:35643', name: 'Hanselaer' },
  hoennepel: { id: 'de:05154:35645', name: 'Hönnepel' },
  kehrum: { id: 'de:05154:35650', name: 'Kehrum' },
  neulouisendorf: { id: 'de:05154:35927', name: 'Hochstraße' },
  niedermoermter: { id: 'de:05154:35653', name: 'Niedermörmter Kirche' },
  wissel: { id: 'de:05154:35920', name: 'Wissel Grundschule' },
  wisselward: { id: 'de:05154:35918', name: 'Lockenhof' },
};

const FACHMARKTZENTRUM = { id: 'de:05154:37332', name: 'Fachmarktzentrum' };

/** Stops the buses skip for a while, with where they stop instead. */
export const STOP_CLOSURES = {
  'de:05154:35649': { replacement: FACHMARKTZENTRUM, until: '2027-01-29' },
  'de:05154:35646': { replacement: FACHMARKTZENTRUM, until: '2027-01-29' },
};

export function closureOf(stop, today = dayOf(new Date())) {
  const c = STOP_CLOSURES[stop.id];
  return c && c.until >= today ? c : null;
}

/** Departures by timetable (seed), for when live data is missing. */
export async function plannedDepartures(stopId, now = new Date(), count = 8) {
  const tt = await seed('timetable');
  const trips = tt.stops[stopId] ?? [];
  const today = dayOf(now);
  const runs = (service, day) => {
    const s = tt.services[service];
    if (!s) return false;
    if ((s.drop ?? []).includes(day)) return false;
    if ((s.add ?? []).includes(day)) return true;
    return day >= s.from && day <= s.to && s.days[weekdayOf(day) - 1] === '1';
  };
  const found = new Map();
  for (let offset = -1; offset <= 2 && found.size < count; offset++) {
    const day = addDays(today, offset);
    if (day > tt.validUntil) break;
    for (const [time, line, destination, service] of trips) {
      // Times past 24:00 belong to the day before.
      const minutes = minutesOf(time);
      if (minutes === null) continue;
      const at = new Date(`${day}T00:00:00`);
      at.setMinutes(minutes);
      if (at < now || !runs(service, day)) continue;
      found.set(`${at.getTime()}|${line}|${destination}`, { line, destination, planned: at });
    }
  }
  return [...found.values()].sort((a, b) => a.planned - b.planned).slice(0, count);
}

/** Live departures from the backend, or the timetable with planOnly. */
export async function departures(stop) {
  try {
    const json = await api(`/departures/${stop.id}.json`, { timeout: 8000 });
    return {
      live: true,
      at: new Date(),
      list: (json.departures ?? []).map((d) => ({
        line: d.line,
        destination: d.destination,
        planned: parseTime(d.planned),
        estimated: parseTime(d.estimated),
        cancelled: d.cancelled === true,
      })),
    };
  } catch {
    return { live: false, list: await plannedDepartures(stop.id) };
  }
}

export { daysBetween };
