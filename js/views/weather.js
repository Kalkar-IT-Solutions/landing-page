// Wetter & Rhein: warnings, current weather, forecast, Rhine levels, pollen.

import { apiBase, parseTime } from '../core.js';
import { lang, t, fmt } from '../i18n.js';
import { h, badge, section, slot, statusLine, facts, notice, source, link, pageHead, symbol } from '../ui.js';
import * as data from '../data.js';
import { partnerSlot } from './partners.js';

const ICONS = {
  'clear-day': 'wb_sunny', 'clear-night': 'nightlight_round', 'partly-cloudy-day': 'wb_twilight',
  'partly-cloudy-night': 'nightlight_round', cloudy: 'cloud', fog: 'blur_on', wind: 'waves', rain: 'water_drop',
  sleet: 'ac_unit', snow: 'ac_unit', hail: 'grain', thunderstorm: 'bolt',
};

const conditionIcon = (c) => symbol(ICONS[c] ?? 'cloud', t('condition', c));

export async function weatherPage() {
  return h('div.page',
    pageHead('Kreis Kleve · Kalkar', t('navWeather')),
    apiBase ? section(t('warningsTitle'), slot(data.warnings(), (list) => (list.length
      ? list.map((w) => notice(w.rank <= 1 ? 'critical' : 'warning', t('warningSeverity', w.severity),
        [(lang === 'en' && w.headlines.en) || w.headline, w.provider || w.sent
          ? h('span.notice-meta.hz-mono', [w.provider, w.sent ? fmt.when(w.sent) : null].filter(Boolean).join(' · ')) : null]))
      : statusLine('positive', t('warningsNone'))), { what: t('warningsTitle') })) : null,
    section(t('weatherTitle'), slot(data.weather(), (w) => [
      h('p.weather-now', conditionIcon(w.condition),
        h('span.weather-temp', typeof w.temperature === 'number' ? fmt.celsius(w.temperature) : t('noValue')),
        h('span.weather-cond', t('condition', w.condition))),
      facts([
        typeof w.wind === 'number' ? { term: t('wind'), value: `${fmt.kmh(w.wind)} ${typeof w.windDirection === 'number' ? t('compass')[Math.round((w.windDirection % 360) / 45) % 8] : ''}`.trim(), mono: true } : null,
        typeof w.gust === 'number' ? { term: t('gusts'), value: fmt.kmh(w.gust), mono: true } : null,
        typeof w.rain === 'number' ? { term: t('rain1h'), value: fmt.mm(w.rain), mono: true } : null,
        typeof w.humidity === 'number' ? { term: t('humidity'), value: fmt.percent(w.humidity), mono: true } : null,
      ]),
      source(t('station', w.station, fmt.when(w.observedAt))),
    ], { what: t('weatherTitle') })),
    section(t('forecastHours'), slot(data.forecast(), (hours) => {
      const next = data.nextHours(hours);
      const days = data.nextDays(hours);
      return [
        h('ol.forecast-hours', next.map((f) => h('li',
          h('span.hz-mono.forecast-time', fmt.time(f.at)),
          conditionIcon(f.condition),
          h('span.hz-mono', typeof f.temperature === 'number' ? `${fmt.number(f.temperature)}°` : t('noValue')),
          typeof f.chance === 'number' && f.chance >= 20 ? h('span.hz-mono.forecast-rain', fmt.percent(f.chance)) : null))),
        days.length ? h('h3.t-kennung.hz-kennung.sub-head', t('forecastDays')) : null,
        h('ul.list', days.map((d) => h('li', h('div.row',
          h('span.row-lead', conditionIcon(d.condition)),
          h('span.row-body', h('span.row-title', fmt.shortDate(new Date(`${d.day}T00:00:00`))),
            h('span.row-meta', [t('condition', d.condition),
              typeof d.chance === 'number' && d.chance >= 20 ? t('forecastRain', fmt.percent(d.chance)) : null].filter(Boolean).join(' · '))),
          h('span.row-trail.hz-mono', d.min === null ? '' : `${fmt.number(d.min)}° / ${fmt.number(d.max)}°`))))),
        source(t('forecastSource')),
      ];
    }, { what: t('forecastHours') })),
    apiBase ? slot(data.niederrhein(), (n) => section(t('niederrheinTitle'),
      h('p', t('niederrheinText')),
      h('p.hz-mono.row-meta', [
        n.lastUpdate ? t('niederrheinUpdated', fmt.when(parseTime(n.lastUpdate))) : null,
        n.nextUpdate ? t('niederrheinNext', fmt.when(parseTime(n.nextUpdate))) : null,
      ].filter(Boolean).join(' · ')),
      h('p', link('wetter-niederrhein.de', 'https://wetter-niederrhein.de/'))), { quiet: true }) : null,
    section(t('rhineTitle'), slot(data.gauges(), (list) => [
      h('ul.list', list.map((g) => h('li', h('div.row',
        h('span.row-body', h('span.row-title', t('gauge', g.station)),
          h('span.row-meta', t('gaugeMeta', g.km ? fmt.number(g.km, 1) : '–', fmt.when(g.at)))),
        h('span.row-trail', h('span.hz-mono.gauge-value', fmt.cm(g.cm)), ['high', 'aboveHsw'].includes(g.level) ? badge(g.level === 'aboveHsw' ? 'critical' : 'warning', t('gaugeState', g.level)) : h('span.gauge-state', t('gaugeState', g.level))))))),
      source(h('span', 'PEGELONLINE (WSV) · ', link('pegelonline.wsv.de', 'https://www.pegelonline.wsv.de/'))),
    ], { what: t('rhineTitle') })),
    apiBase ? section(t('pollenTitle'), slot(data.pollen(), (p) => {
      const notable = (day) => day.filter((x) => x.level && x.level !== '0' && x.level !== '-1');
      const today = notable(p.today);
      const tomorrow = notable(p.tomorrow);
      return [
        today.length
          ? facts(today.map((x) => ({ term: t('pollenType', x.type), value: t('pollenLevel', x.level) })))
          : statusLine('positive', t('pollenNone')),
        tomorrow.length ? h('p.row-meta', `${t('pollenTomorrow')}: ${tomorrow.map((x) => `${t('pollenType', x.type)} ${t('pollenLevel', x.level)}`).join(', ')}`) : null,
        source(t('pollenMeta', p.region)),
      ];
    }, { what: t('pollenTitle') })) : null,
    partnerSlot('weather'),
  );
}

