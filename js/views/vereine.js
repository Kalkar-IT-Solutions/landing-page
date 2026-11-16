// Vereine: the town's club directory by kind, for the chosen Ortsteil
// first, then the clubs of the whole town (most name no Ortsteil).

import { apiBase, seed } from '../core.js';
import { t } from '../i18n.js';
import { h, section, statusLine, source, pageHead, link } from '../ui.js';
import * as data from '../data.js';
import { reportBlock } from './community.js';

const ORDER = ['Sport', 'Schützen', 'Karneval', 'Musik/Chor', 'Musik/Tambourcorps', 'Bruderschaft (kirchlich)',
  'Gilde (kirchlich)', 'Landfrauen', 'Feuerwehr', 'Politik', 'Sonstiges'];

function grouped(list, ortsteilName) {
  const groups = new Map();
  for (const v of list) {
    const key = ORDER.includes(v.category) ? v.category : 'Sonstiges';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(v);
  }
  return ORDER.filter((k) => groups.has(k)).map((k) => section(t('vereinCategory', k), h('ul.list',
    groups.get(k).sort((a, b) => a.name.localeCompare(b.name, 'de')).map((v) => h('li', h('div.row', h('span.row-body',
      h('span.row-title', v.name),
      (v.ortsteile ?? []).length ? h('span.row-meta', v.ortsteile.map(ortsteilName).join(', ')) : null,
      v.reported ? h('span.row-tag', t('reportedByUsers')) : null,
      h('span.row-links',
        v.website ? link(t('website'), v.website) : null,
        v.page ? link(t('vereinTownEntry'), v.page) : null))))))));
}

export async function vereinePage() {
  const ortsteil = await data.currentOrtsteil();
  const [info, all] = await Promise.all([seed('ortsteile'), data.vereine()]);
  const name = (id) => info.ortsteile.find((o) => o.id === id)?.name ?? id;
  const here = ortsteil ? all.filter((v) => (v.ortsteile ?? []).includes(ortsteil.id)) : all;
  const townWide = ortsteil ? all.filter((v) => !(v.ortsteile ?? []).length) : [];
  return h('div.page',
    pageHead(ortsteil?.name ?? 'Kalkar', t('vereineTitle')),
    here.length ? grouped(here, name) : statusLine('neutral', t('vereineEmpty', ortsteil?.name ?? 'Kalkar')),
    townWide.length ? h('details.more', h('summary', `${t('vereineTownWide')} · ${townWide.length}`), grouped(townWide, name)) : null,
    apiBase ? reportBlock('verein', t('reportVereinMissing'), t('reportVereinAction')) : null,
    source(h('span', t('vereineSource'), ' · ', link('kalkar.de/vereine', info.vereinePage))),
  );
}
