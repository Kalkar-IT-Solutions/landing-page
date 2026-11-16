// Mitmachen: report what is missing, and check what others reported.
// Only with a backend; the forms post to the Edge Function, which checks
// every field again (supabase/functions/kalkar-kompakt/parse.ts).

import { seed } from '../core.js';
import { t, fmt } from '../i18n.js';
import { h, statusLine, slot, symbol } from '../ui.js';
import * as data from '../data.js';

const CATEGORIES = ['Sport', 'Schützen', 'Karneval', 'Musik/Chor', 'Musik/Tambourcorps', 'Bruderschaft (kirchlich)',
  'Gilde (kirchlich)', 'Landfrauen', 'Feuerwehr', 'Politik', 'Sonstiges'];
const FARM_KINDS = ['hofladen', 'automat', 'selbstbedienung', 'saisonstand', 'hofcafe'];

function field(label, input, help) {
  const id = `f-${Math.random().toString(36).slice(2, 8)}`;
  input.id = id;
  return h('div.hz-field', h('label', { for: id }, label), input, help ? h('span.hz-help', help) : null);
}

const text = (name, attrs = {}) => h('input.hz-input', { name, type: 'text', autocomplete: 'off', ...attrs });

async function formFor(kind) {
  const { ortsteile } = await seed('ortsteile');
  const ortsteilSelect = h('select.hz-input', { name: 'ortsteil' },
    h('option', { value: '' }, t('fieldNone')),
    ortsteile.map((o) => h('option', { value: o.id }, o.name)));
  const today = new Date().toISOString().slice(0, 10);
  switch (kind) {
    case 'event':
      return [
        field(t('fieldTitle'), text('title', { required: true, minlength: 3, maxlength: 80 })),
        field(t('fieldDate'), h('input.hz-input', { name: 'date', type: 'date', required: true, min: today })),
        field(t('fieldTime'), h('input.hz-input', { name: 'time', type: 'time' })),
        field(t('fieldPlace'), text('place', { maxlength: 80 })),
        field(t('fieldOrtsteil'), ortsteilSelect),
        field(t('fieldLink'), h('input.hz-input', { name: 'url', type: 'url', pattern: 'https://.*' })),
      ];
    case 'roadwork':
      return [
        field(t('fieldStreet'), text('place', { required: true, minlength: 3, maxlength: 80 })),
        h('label.toggle', h('input.hz-switch', { type: 'checkbox', role: 'switch', name: 'closed', checked: true }), h('span.toggle-title', t('fieldClosed'))),
        field(t('fieldUntil'), h('input.hz-input', { name: 'until', type: 'date', min: today })),
        field(t('fieldNote'), text('note', { maxlength: 140 })),
        field(t('fieldOrtsteil'), ortsteilSelect),
      ];
    case 'verein':
      return [
        field(t('fieldName'), text('name', { required: true, minlength: 3, maxlength: 100 })),
        field(t('fieldCategory'), h('select.hz-input', { name: 'category' }, CATEGORIES.map((c) => h('option', { value: c }, t('vereinCategory', c))))),
        field(t('fieldOrtsteil'), ortsteilSelect),
        field(t('fieldWebsite'), h('input.hz-input', { name: 'url', type: 'url', pattern: 'https://.*' })),
      ];
    default:
      return [
        field(t('fieldFarmName'), text('name', { required: true, minlength: 3, maxlength: 80 })),
        field(t('fieldFarmKind'), h('select.hz-input', { name: 'kind' }, FARM_KINDS.map((k) => h('option', { value: k }, t('kind', k))))),
        field(t('fieldProducts'), text('products', { required: true, maxlength: 200 })),
        field(t('fieldHours'), text('hoursText', { maxlength: 100 })),
        field(t('fieldAddress'), text('address', { maxlength: 100 })),
        field(t('fieldOrtsteil'), ortsteilSelect),
        field(t('fieldWebsite'), h('input.hz-input', { name: 'url', type: 'url', pattern: 'https://.*' })),
      ];
  }
}

function payloadOf(kind, form) {
  const f = new FormData(form);
  const value = (n) => String(f.get(n) ?? '').trim();
  const p = {};
  for (const [k, v] of f.entries()) if (String(v).trim()) p[k] = String(v).trim();
  if (kind === 'roadwork') p.closed = form.elements.closed.checked;
  if (kind === 'hofladen') p.products = value('products').split(',').map((x) => x.trim()).filter(Boolean);
  return p;
}

/** "Ein Termin fehlt?" with a button that opens the report form in a dialog. */
export function reportBlock(kind, question, action) {
  const dialog = h('dialog.sheet', { 'aria-label': action });
  const open = async () => {
    const message = h('p.form-message', { 'aria-live': 'polite' });
    const form = h('form.sheet-form', { method: 'dialog' },
      h('h2.t-title-2', action),
      h('p.row-meta', t('reportRules')),
      await formFor(kind),
      message,
      h('div.sheet-actions',
        h('button.hz-button.hz-button--secondary', { type: 'button', onclick: () => dialog.close() }, t('reportCancel')),
        h('button.hz-button.hz-button--primary', { type: 'submit' }, t('reportSend'))));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      message.replaceChildren(t('loading'));
      try {
        await data.sendReport(kind, payloadOf(kind, form));
        form.replaceChildren(h('h2.t-title-2', action), statusLine('positive', t('reportThanks')),
          h('div.sheet-actions', h('button.hz-button.hz-button--primary', { type: 'button', onclick: () => dialog.close() }, t('ok'))));
      } catch (error) {
        const reason = error.message;
        message.replaceChildren(statusLine('critical', reason === 'limit' ? t('reportLimit')
          : reason === 'refused' ? t('reportRefused') : t('reportFailed', t('failure', reason))));
      }
    });
    dialog.replaceChildren(form);
    dialog.showModal();
  };
  return h('aside.report',
    h('p', question),
    h('button.hz-button.hz-button--secondary', { type: 'button', onclick: open }, symbol('add'), action),
    dialog);
}

function describe(report) {
  const p = report.payload ?? {};
  switch (report.kind) {
    case 'event':
      return [p.title, [p.date ? fmt.date(new Date(`${p.date}T00:00:00`)) : null, p.time, p.place].filter(Boolean).join(' · ')];
    case 'roadwork':
      return [p.place, [p.closed ? t('roadClosed') : t('roadWorks'), p.until ? t('roadUntil', fmt.date(new Date(`${p.until}T00:00:00`))) : null, p.note].filter(Boolean).join(' · ')];
    case 'verein':
      return [p.name, t('vereinCategory', p.category)];
    default:
      return [p.name, [t('kind', p.kind), (p.products ?? []).join(', '), p.hoursText].filter(Boolean).join(' · ')];
  }
}

/** "Stimmt das?": one open report of others, with three answers. */
export function reviewCard(kinds) {
  return slot(data.nextReview(kinds), (report) => {
    if (!report?.id) return null;
    const [title, detail] = describe(report);
    const card = h('aside.review',
      h('p.t-kennung.hz-kennung', `${t('reviewKind', report.kind)} · ${t('reviewQuestion')}`),
      h('p.review-title', title),
      detail ? h('p.row-meta', detail) : null,
      h('p.row-meta', t('reviewHint')));
    const answer = (confirms) => async () => {
      try {
        if (confirms !== null) await data.vote(report.id, confirms);
        card.replaceChildren(statusLine('positive', t('reviewThanks')));
      } catch (error) {
        card.append(statusLine('critical', t('failure', error.message)));
      }
    };
    card.append(h('div.review-actions',
      h('button.hz-button.hz-button--secondary', { type: 'button', onclick: answer(true) }, t('reviewYes')),
      h('button.hz-button.hz-button--secondary', { type: 'button', onclick: answer(false) }, t('reviewNo')),
      h('button.hz-button.hz-button--quiet', { type: 'button', onclick: answer(null) }, t('reviewUnsure'))));
    return card;
  }, { quiet: true });
}
