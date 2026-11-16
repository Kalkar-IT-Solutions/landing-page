// The choices of a visitor: Ortsteil (start page), language and
// appearance (info page). Kept out of the bar so it stays quiet.

import { seed, store } from './core.js';
import { lang, setLanguage, t } from './i18n.js';
import { h, symbol } from './ui.js';

export function applyTheme() {
  const theme = store.get('theme');
  if (theme) document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

export async function ortsteilSelect(rerender) {
  const { ortsteile } = await seed('ortsteile');
  const current = store.get('ortsteil');
  const select = h('select.hz-input.ortsteil-select', {
    'aria-label': t('ortsteilTitle'),
    onchange: (e) => {
      store.set('ortsteil', e.target.value || null);
      rerender();
    },
  },
  h('option', { value: '' }, t('ortsteilAll')),
  ortsteile.map((o) => h('option', { value: o.id, selected: o.id === current }, o.name)));
  // Own chevron: the native one sits on the frame line.
  return h('span.select-wrap', select, symbol('expand_more'));
}

function segmented(label, options, current, choose) {
  return h('div.hz-field', h('span.field-label', label),
    h('div.hz-segmented', { role: 'group', 'aria-label': label },
      options.map(([value, text]) => h('button', {
        type: 'button',
        'aria-pressed': value === current ? 'true' : 'false',
        onclick: () => choose(value),
      }, text))));
}

export function settingsBlock(rerender) {
  return [
    segmented(t('language'), [['de', 'Deutsch'], ['en', 'English']], lang, (v) => {
      setLanguage(v);
      rerender();
    }),
    segmented(t('theme'), [['auto', t('themeAuto')], ['light', t('themeLight')], ['dark', t('themeDark')]],
      store.get('theme') ?? 'auto', (v) => {
        store.set('theme', v === 'auto' ? null : v);
        applyTheme();
        rerender();
      }),
  ];
}
