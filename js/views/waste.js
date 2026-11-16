// Abfall: the district from the street, the next pickups and a calendar
// file with a reminder the evening before (the web's stand-in for the
// notifications of the old mobile apps).

import { dayOf, daysBetween, normalize, store } from '../core.js';
import { t, fmt, local } from '../i18n.js';
import { h, section, statusLine, source, link, pageHead, list, row } from '../ui.js';
import * as data from '../data.js';
import { partnerSlot } from './partners.js';

export async function wastePage({ rerender }) {
  const waste = await data.wasteCalendar();
  const district = store.get('district');
  const optional = store.get('wasteOptional') === true;
  const districtName = (id) => local(waste.districts.find((d) => d.id === id), 'name');
  const streets = [...new Set(waste.districts.flatMap((d) => d.areas))].sort((a, b) => a.localeCompare(b, 'de'));

  const result = h('p.field-result', { 'aria-live': 'polite' });
  const input = h('input.hz-input', {
    id: 'street',
    type: 'search',
    list: 'streets',
    autocomplete: 'off',
    placeholder: t('wasteStreetHint'),
    value: store.get('street') ?? '',
    oninput: (e) => {
      const q = normalize(e.target.value);
      if (q.length < 3) {
        result.textContent = '';
        return;
      }
      const match = streets.find((s) => normalize(s) === q) ?? (streets.filter((s) => normalize(s).startsWith(q)).length === 1
        ? streets.find((s) => normalize(s).startsWith(q)) : null);
      if (!match) {
        result.textContent = streets.some((s) => normalize(s).includes(q)) ? '' : t('wasteStreetNone');
        return;
      }
      const ids = data.districtsOf(waste, match);
      store.set('street', match);
      if (ids.length === 1) {
        store.set('district', ids[0]);
        rerender();
      } else {
        result.textContent = ids.map(districtName).join(' / ');
      }
    },
  });
  const datalist = h('datalist', { id: 'streets' }, streets.map((s) => h('option', { value: s })));

  const choose = h('div.hz-segmented.district-choice', { role: 'group', 'aria-label': t('wasteDistrict') },
    waste.districts.map((d) => h('button', {
      type: 'button',
      'aria-pressed': d.id === district ? 'true' : 'false',
      onclick: () => {
        store.set('district', d.id);
        rerender();
      },
    }, local(d, 'name'))));

  const settings = section(null,
    h('div.hz-field', h('label', { for: 'street' }, t('wasteStreet')), input, datalist,
      h('span.hz-help', t('wasteStreetHelp')), result),
    h('div.hz-field', h('span.field-label', t('wasteDistrict')), choose),
    h('label.toggle',
      h('input.hz-switch', {
        type: 'checkbox',
        role: 'switch',
        checked: optional,
        onchange: (e) => {
          store.set('wasteOptional', e.target.checked || null);
          rerender();
        },
      }),
      h('span', h('span.toggle-title', t('wasteOptional')), h('span.hz-help', t('wasteOptionalDetail')))),
  );

  let upcoming;
  if (!district) {
    upcoming = statusLine('neutral', t('wasteNoDistrict'));
  } else {
    const today = dayOf(new Date());
    const pickups = data.pickups(waste, district, { optional });
    upcoming = pickups.length
      ? list(pickups.slice(0, 12).map((p) => row({
        title: p.types.map((type) => local(type, 'name')).join(', '),
        meta: [h('span.row-meta.hz-mono', `${fmt.shortDate(new Date(`${p.date}T00:00:00`))} · ${t('daysUntil', daysBetween(today, p.date))}`)],
      })))
      : statusLine('neutral', t('wasteNoneLeft', districtName(district)));
  }

  return h('div.page',
    pageHead('Kalkar', t('navWaste')),
    settings,
    section(t('wasteUpcoming'), upcoming,
      h('p.row-meta', t('wasteCalendarEnds', fmt.date(new Date(`${waste.validTo}T00:00:00`))))),
    district ? section(t('wasteReminder'),
      h('p', t('wasteReminderDetail')),
      h('button.hz-button.hz-button--primary', {
        type: 'button',
        onclick: () => downloadIcs(waste, district, optional, districtName(district)),
      }, t('wasteReminderAction'))) : null,
    section(null,
      waste.calendarUrl ? h('p', link(t('wasteCalendarPdf'), waste.calendarUrl)) : null,
      source(t('wasteSource'))),
    partnerSlot('waste'),
  );
}

/** An iCalendar file with every pickup and an alarm at 19:00 the day before. */
function downloadIcs(waste, district, optional, name) {
  const pickups = data.pickups(waste, district, { optional });
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const esc = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kalkar Kompakt//Abfall//DE', 'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${esc(`Abfall ${name}`)}`];
  for (const p of pickups) {
    const day = p.date.replace(/-/g, '');
    const next = new Date(`${p.date}T00:00:00`);
    next.setDate(next.getDate() + 1);
    lines.push('BEGIN:VEVENT', `UID:${day}-${district}-${optional ? 'o' : 'r'}@kalkar-kompakt`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${dayOf(next).replace(/-/g, '')}`,
      `SUMMARY:${esc(p.types.map((type) => local(type, 'name')).join(', '))}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(p.types.map((type) => local(type, 'name')).join(', '))}`,
      'TRIGGER:-PT5H', 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `abfall-kalkar-bezirk-${district}.ics` });
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}
