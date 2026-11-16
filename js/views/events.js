// Termine: events by day, council meetings, holidays and school breaks,
// "Läuft gerade" for exhibitions and breaks, and "Mein Kalender" with the
// saved events and the pickups of the chosen district.

import { apiBase, addDays, dayOf, holidayOn, store } from '../core.js';
import { t, fmt, local } from '../i18n.js';
import { h, section, statusLine, source, pageHead, symbol, slot, link } from '../ui.js';
import * as data from '../data.js';
import { partnerSlot } from './partners.js';
import { reportBlock } from './community.js';

const saved = () => new Set(store.get('saved') ?? []);

function toggleSaved(key) {
  const set = saved();
  if (set.has(key)) set.delete(key);
  else set.add(key);
  store.set('saved', [...set]);
  return set.has(key);
}

export async function eventsPage({ params, rerender }) {
  const filter = ['rat', 'mein'].includes(params[0]) ? params[0] : 'alle';
  const ortsteil = await data.currentOrtsteil();
  const { ortsteile } = await (await import('../core.js')).seed('ortsteile');
  const ortsteilName = (id) => ortsteile.find((o) => o.id === id)?.name;

  const tabs = h('nav.hz-tabs.event-tabs', { 'aria-label': t('navEvents') },
    [['alle', t('eventsAll')], ['rat', t('eventsCouncil')], ['mein', t('eventsMine')]].map(([id, label]) =>
      h('a', { href: `#/termine${id === 'alle' ? '' : `/${id}`}`, 'aria-current': id === filter ? 'page' : null }, label)));

  const content = slot(Promise.all([data.events(), data.calendarMarks(dayOf(new Date()), addDays(dayOf(new Date()), 120)),
    data.wasteCalendar()]), ([events, marks, waste]) => {
    const today = dayOf(new Date());
    const keep = saved();
    let shown = events;
    if (filter === 'rat') shown = events.filter((e) => e.kind === 'council');
    if (filter === 'mein') shown = events.filter((e) => keep.has(e.key));
    else if (ortsteil && filter === 'alle') shown = shown.filter((e) => e.ortsteile.includes(ortsteil.id) || e.ortsteile.length === 0);

    // Running: started before today and still on (exhibitions, markets).
    const running = filter === 'alle' ? shown.filter((e) => e.day < today && e.lastDay >= today) : [];
    const upcoming = shown.filter((e) => e.day >= today);

    const pickups = [];
    if (filter === 'mein' && store.get('district')) {
      for (const p of data.pickups(waste, store.get('district'), { optional: store.get('wasteOptional') === true }).slice(0, 10)) {
        pickups.push({ day: p.date, pickup: p.types.map((type) => local(type, 'name')).join(', ') });
      }
    }

    const days = new Map();
    const add = (day, item) => {
      if (!days.has(day)) days.set(day, []);
      days.get(day).push(item);
    };
    for (const e of upcoming) add(e.day, { event: e });
    for (const p of pickups) add(p.day, p);
    const last = [...days.keys()].sort().at(-1) ?? today;
    if (filter === 'alle') {
      for (let d = today; d <= last; d = addDays(d, 1)) {
        const holiday = holidayOn(d);
        if (holiday) add(d, { mark: t('holiday', holiday), kind: t('markHoliday') });
      }
      for (const b of marks.breaks) {
        if (b.first >= today && b.first <= last) add(b.first, { mark: t('schoolBreak', b.kind), kind: `${t('markSchoolBreak')} · ${fmt.dayMonthRange(b.first, b.last)}` });
      }
    }

    if (days.size === 0 && running.length === 0) {
      if (filter === 'mein') return [statusLine('neutral', t('mineEmpty')), h('p.row-meta', t('mineEmptyDetail'))];
      if (ortsteil) return [statusLine('neutral', t('eventsOrtsteilEmpty', ortsteil.name)), h('p.row-meta', t('eventsOrtsteilEmptyDetail'))];
      return statusLine('neutral', t('eventsNone'));
    }

    const eventRow = (e) => {
      const isSaved = keep.has(e.key);
      const star = h('button.star', {
        type: 'button',
        'aria-pressed': isSaved ? 'true' : 'false',
        'aria-label': isSaved ? t('eventSaved') : t('eventSave'),
        title: isSaved ? t('eventSaved') : t('eventSave'),
        onclick: (ev) => {
          ev.preventDefault();
          const now = toggleSaved(e.key);
          ev.currentTarget.setAttribute('aria-pressed', now ? 'true' : 'false');
          ev.currentTarget.replaceChildren(symbol(now ? 'star_fill' : 'star'));
          if (filter === 'mein') rerender();
        },
      }, symbol(isSaved ? 'star_fill' : 'star'));
      const time = e.allDay ? (e.lastDay !== e.day ? `${t('eventAllDay')} · ${fmt.dayMonthRange(e.day, e.lastDay)}` : t('eventAllDay')) : fmt.time(e.start);
      const where = [e.place, ...e.ortsteile.map(ortsteilName).filter(Boolean)].filter(Boolean);
      const meta = [
        h('span.row-meta.hz-mono', time),
        where.length ? h('span.row-meta', where.join(' · ')) : null,
        e.kind === 'council' ? h('span.row-tag', t('eventCouncil')) : null,
        e.origin === 'users' ? h('span.row-tag', t('reportedByUsers')) : null,
      ];
      const title = e.url ? link(e.title, e.url, { class: 'row-title' }) : h('span.row-title', e.title);
      return h('li', h('div.row', h('span.row-body', title, meta), h('span.row-trail', star)));
    };

    return [
      running.length ? section(t('eventsRunning'), h('ul.list', running.map(eventRow))) : null,
      [...days.keys()].sort().map((day) => h('section.day',
        h('h2.t-kennung.hz-kennung.section-head', day === today ? `${t('daysUntil', 0)} · ${fmt.shortDate(new Date(`${day}T00:00:00`))}` : fmt.weekday(new Date(`${day}T00:00:00`))),
        h('ul.list', days.get(day).map((item) => {
          if (item.event) return eventRow(item.event);
          if (item.pickup) return h('li', h('div.row', h('span.row-body', h('span.row-title', item.pickup), h('span.row-meta', t('minePickup')))));
          return h('li', h('div.row.row--mark', h('span.row-body', h('span.row-title', item.mark), h('span.row-meta', item.kind))));
        })))),
    ];
  }, { what: t('navEvents') });

  return h('div.page',
    pageHead(ortsteil?.name ?? 'Kalkar', t('navEvents')),
    tabs,
    content,
    apiBase ? reportBlock('event', t('reportEventMissing'), t('reportEventAction')) : null,
    source(t('eventsSource')),
    partnerSlot('events'),
  );
}
