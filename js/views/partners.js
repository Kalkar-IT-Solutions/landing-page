// "Partner vor Ort": a marked place for local businesses at the end of a
// detail page. Comes from the backend; without one, nothing shows.

import { apiBase, dayOf, partnersOn } from '../core.js';
import { lang, t } from '../i18n.js';
import { h, kennung, link, slot } from '../ui.js';
import * as data from '../data.js';

export function partnerSlot(slotName) {
  if (!apiBase || !partnersOn) return null;
  return slot(data.partners(), (p) => {
    const today = dayOf(new Date());
    const partner = (p.partners ?? []).find((x) => (x.slots ?? []).includes(slotName)
      && (!x.from || x.from <= today) && (!x.until || x.until >= today));
    if (partner) {
      return h('aside.partner',
        kennung(t('partnerLabel')),
        h('p.partner-name', partner.name),
        partner.text ? h('p', (lang === 'en' && partner.textEn) || partner.text) : null,
        partner.url ? link(t('partnerVisit'), partner.url) : null);
    }
    if ((p.vacancySlots ?? []).includes(slotName) && p.contact) {
      return h('aside.partner.partner--vacant',
        kennung(t('partnerLabel')),
        h('p.partner-name', t('partnerVacancyTitle')),
        h('p', t('partnerVacancyText')),
        link(t('partnerVacancyAction'), p.contact));
    }
    return null;
  }, { quiet: true });
}
