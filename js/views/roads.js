// Straßen: closures and roadworks in Kalkar and around.

import { apiBase } from '../core.js';
import { t, fmt } from '../i18n.js';
import { h, section, statusLine, source, pageHead, link, slot, badge } from '../ui.js';
import * as data from '../data.js';
import { reportBlock } from './community.js';

function workRow(w, now) {
  const status = w.kind === 'closure' ? badge('critical', t('roadClosed')) : badge('warning', t('roadWorks'));
  const when = [
    w.planned && w.start ? t('roadFrom', fmt.date(w.start)) : null,
    w.end ? t('roadUntil', fmt.date(w.end)) : null,
  ].filter(Boolean).join(' · ');
  return h('li', h('div.row', h('span.row-body',
    h('span.row-head', status, w.planned && w.start > now ? badge('info', t('roadPlanned')) : null),
    h('span.row-title', [w.road && w.road !== 'Kalkar' ? w.road : null, w.title].filter(Boolean).join(' · ')),
    when ? h('span.row-meta.hz-mono', when) : null,
    h('span.row-meta', w.inTown ? t('roadInTown') : t('roadDistance', fmt.number(w.distanceKm))),
    w.details ? h('span.row-text', w.details) : null,
    w.reported ? h('span.row-tag', t('reportedByUsers')) : null,
    w.url ? h('span.row-links', link(new URL(w.url).hostname.replace(/^www\./, ''), w.url)) : null)));
}

export async function roadsPage() {
  const ortsteil = await data.currentOrtsteil();
  const all = Promise.all([
    data.roads(),
    data.communityItems().catch(() => []),
  ]).then(([official, reported]) => ({
    ...official,
    value: [...reported.filter((c) => c.kind === 'roadwork').map(data.roadworkFromReport), ...official.value],
  }));
  return h('div.page',
    pageHead(ortsteil?.name ?? 'Kalkar', t('roadsTitle')),
    apiBase ? slot(all, (works) => {
      const now = new Date();
      const inTown = works.filter((w) => w.inTown && (!ortsteil || w.ortsteile.length === 0 || w.ortsteile.includes(ortsteil.id)));
      const around = works.filter((w) => !w.inTown).sort((a, b) => a.distanceKm - b.distanceKm);
      if (!inTown.length && !around.length) return statusLine('positive', t('roadsNone'));
      return [
        inTown.length ? section(t('roadsInTown'), h('ul.list', inTown.map((w) => workRow(w, now)))) : null,
        around.length ? section(t('roadsAround'), h('ul.list', around.map((w) => workRow(w, now)))) : null,
      ];
    }, { what: t('roadsTitle') }) : statusLine('neutral', t('failure', 'offline-backend')),
    apiBase ? reportBlock('roadwork', t('reportRoadMissing'), t('reportRoadAction')) : null,
    source(t('roadsSource')),
  );
}
