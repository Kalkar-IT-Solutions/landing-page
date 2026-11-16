// Shared logic without any DOM: dates, holidays, opening hours, fetching
// and the little that is stored in the browser. Times are Kalkar's wall
// clock; the app assumes the browser runs in Germany, as the Flutter app did.

const config = window.KOMPAKT_CONFIG ?? {};

/** The backend (Supabase Edge Function) or "" when this copy runs without one. */
export const apiBase = (config.apiBase ?? '').replace(/\/$/, '');

/** Where the map tiles and glyphs live; "" hides the map. */
export const mapBase = (config.mapBase ?? '').replace(/\/$/, '');

/** Whether the places for local businesses show (docs/partner.md). */
export const partnersOn = config.partners === true;

/** Contact for corrections and partners, shown on the info page. */
export const contact = config.contact ?? '';

// ---------------------------------------------------------------- dates

/** A day without a time, as "YYYY-MM-DD"; sorts and compares as a string. */
export function dayOf(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The local midnight of [day]. */
export function dateOf(day) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day, n) {
  const d = dateOf(day);
  d.setDate(d.getDate() + n);
  return dayOf(d);
}

/** Whole days from [from] to [to], both "YYYY-MM-DD". */
export function daysBetween(from, to) {
  return Math.round((dateOf(to) - dateOf(from)) / 86400000);
}

/** Monday 1 … Sunday 7, as in Dart and the seed files. */
export function weekdayOf(day) {
  return dateOf(day).getDay() || 7;
}

/**
 * A wall-clock time from the sources: "2026-11-25T18:00:00" (local),
 * "2026-11-25" (a day) or an instant with offset ("…Z", "+01:00").
 */
export function parseTime(value) {
  if (typeof value !== 'string' || !value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return dateOf(value);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function minutesOf(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// ---------------------------------------------------------------- holidays

export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return dayOf(new Date(year, month - 1, day));
}

/** The public holidays of North Rhine-Westphalia: day → key. */
export function nrwHolidays(year) {
  const easter = easterSunday(year);
  const fixed = (m, d) => `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return new Map([
    [fixed(1, 1), 'neujahr'],
    [addDays(easter, -2), 'karfreitag'],
    [addDays(easter, 1), 'ostermontag'],
    [fixed(5, 1), 'tagDerArbeit'],
    [addDays(easter, 39), 'himmelfahrt'],
    [addDays(easter, 50), 'pfingstmontag'],
    [addDays(easter, 60), 'fronleichnam'],
    [fixed(10, 3), 'einheit'],
    [fixed(11, 1), 'allerheiligen'],
    [fixed(12, 25), 'weihnachten1'],
    [fixed(12, 26), 'weihnachten2'],
  ]);
}

export function holidayOn(day) {
  return nrwHolidays(Number(day.slice(0, 4))).get(day) ?? null;
}

// ---------------------------------------------------------------- opening hours

/**
 * Opening hours as in the seed files:
 * {slots: [{days: [1..7], from: "09:00", to: "13:00", months?: [..]}],
 *  closedOnHolidays?, closedDates?: ["12-24"], closedOnRosenmontag?}
 */
function isClosedOn(hours, day) {
  if ((hours.closedDates ?? []).includes(day.slice(5))) return true;
  if (hours.closedOnHolidays && holidayOn(day)) return true;
  if (hours.closedOnRosenmontag && addDays(easterSunday(Number(day.slice(0, 4))), -48) === day) return true;
  return false;
}

function slotsOn(hours, day) {
  const weekday = weekdayOf(day);
  const month = Number(day.slice(5, 7));
  return (hours.slots ?? [])
    .filter((s) => (s.days ?? []).includes(weekday) && (!s.months?.length || s.months.includes(month)))
    .map((s) => ({ from: minutesOf(s.from), to: minutesOf(s.to) }))
    .filter((s) => s.from !== null && s.to !== null);
}

/** {open: true, until: Date} or {open: false, opensAt: Date|null}. */
export function openState(hours, now = new Date()) {
  const today = dayOf(now);
  const minute = now.getHours() * 60 + now.getMinutes();
  if (!isClosedOn(hours, today)) {
    for (const s of slotsOn(hours, today)) {
      if (s.from <= minute && minute < s.to) {
        const until = dateOf(today);
        until.setMinutes(s.to);
        return { open: true, until };
      }
    }
  }
  for (let offset = 0; offset < 14; offset++) {
    const day = addDays(today, offset);
    if (isClosedOn(hours, day)) continue;
    const starts = slotsOn(hours, day)
      .map((s) => s.from)
      .filter((from) => offset > 0 || from > minute)
      .sort((a, b) => a - b);
    if (starts.length) {
      const opensAt = dateOf(day);
      opensAt.setMinutes(starts[0]);
      return { open: false, opensAt };
    }
  }
  return { open: false, opensAt: null };
}

export function isOpenNow(place, now = new Date()) {
  if (place.always) return true;
  return place.hours ? openState(place.hours, now).open : false;
}

// ---------------------------------------------------------------- fetching

const seedCache = new Map();

/** A file of the app itself (data/…), fetched once per visit. */
export function seed(name) {
  if (!seedCache.has(name)) {
    seedCache.set(name, fetchJson(`data/${name}.json`).catch((error) => {
      seedCache.delete(name);
      throw error;
    }));
  }
  return seedCache.get(name);
}

/** JSON from [url]; throws an Error whose message is shown to people. */
export async function fetchJson(url, { timeout = 12000, ...init } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  let response;
  try {
    response = await fetch(url, { ...init, signal: controller.signal });
  } catch {
    throw new Error('network');
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new Error(`status:${response.status}`);
  try {
    return await response.json();
  } catch {
    throw new Error('format');
  }
}

const liveCache = new Map();

/**
 * A live source, kept for [maxAge] seconds within the visit. The last good
 * answer also goes into localStorage, so a page that loses its connection
 * still shows something, marked with its time.
 * Resolves to {value, at, stale} or rejects with the reason.
 */
export function live(key, load, { maxAge = 300 } = {}) {
  const hit = liveCache.get(key);
  if (hit && Date.now() - hit.time < maxAge * 1000) return hit.promise;
  const promise = load().then(
    (value) => {
      const at = new Date();
      store.set(`live:${key}`, { value, at: at.toISOString() });
      return { value, at, stale: false };
    },
    (error) => {
      liveCache.delete(key);
      const kept = store.get(`live:${key}`);
      if (kept) return { value: kept.value, at: new Date(kept.at), stale: true, error: error.message };
      throw error;
    },
  );
  liveCache.set(key, { time: Date.now(), promise });
  return promise;
}

/** Forget the live answers, so the next read fetches anew. */
export function refreshLive() {
  liveCache.clear();
}

/** A route of the backend, or a rejection when there is none. */
export function api(route, init) {
  if (!apiBase) return Promise.reject(new Error('offline-backend'));
  return fetchJson(`${apiBase}${route}`, init);
}

// ---------------------------------------------------------------- storage

/** localStorage with JSON, quiet when the browser refuses it. */
export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(`kompakt:${key}`);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      if (value === null || value === undefined) localStorage.removeItem(`kompakt:${key}`);
      else localStorage.setItem(`kompakt:${key}`, JSON.stringify(value));
    } catch {
      // Private mode or full: the app works without.
    }
  },
};

/** A random id for this browser, sent with reports; only its hash is kept. */
export function deviceId() {
  let id = store.get('device');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : [...crypto.getRandomValues(new Uint8Array(16))]
      .map((b) => b.toString(16).padStart(2, '0')).join('');
    store.set('device', id);
  }
  return id;
}

// ---------------------------------------------------------------- small helpers

export function normalize(text) {
  return (text ?? '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/str\.?(\s|$)/g, 'strasse$1')
    .trim();
}

/** Distance in km between two points (lat/lon in degrees). */
export function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
