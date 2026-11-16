// Building blocks in Horizont: elements, status, facts, lists and the
// pattern every live section follows (loading, value, stale, failure).

import { SYMBOLS } from './symbols.js';
import { t, fmt } from './i18n.js';
import { openState } from './core.js';

/** h('a.hz-row', {href}, child, …): an element with classes, attributes and children. */
export function h(tag, attrs, ...children) {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (classes.length) el.className = classes.join(' ');
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
    children.unshift(attrs);
    attrs = null;
  }
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else if (key === 'class') el.className += ` ${value}`;
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
    else if (key in el && key !== 'list' && typeof value !== 'string') el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false || child === '') continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/** A Material Symbol of Horizont's subset; nothing when the name is missing. */
export function symbol(name, label) {
  const code = SYMBOLS[name];
  if (!code) return null;
  return h('span.hz-symbol', { 'aria-hidden': label ? null : 'true', 'aria-label': label ?? null, role: label ? 'img' : null },
    String.fromCodePoint(Number(code)));
}

export function kennung(text, tag = 'p') {
  return h(`${tag}.t-kennung.hz-kennung`, text);
}

/** A section with a Kennung as its title, for detail pages. */
export function section(title, ...children) {
  return h('section.section', title ? h('h2.t-kennung.hz-kennung.section-head', title) : null, ...children);
}

const STATUS_SYMBOL = { positive: 'check', warning: 'warning', critical: 'report', info: 'info', neutral: null };

/** A line with sign, word and colour (rule five: never colour alone). */
export function statusLine(status, text) {
  return h(`p.status.status--${status}`, STATUS_SYMBOL[status] ? symbol(STATUS_SYMBOL[status]) : null, h('span', text));
}

export function badge(status, text) {
  return h(`span.hz-badge.hz-badge--${status}`, STATUS_SYMBOL[status] ? symbol(STATUS_SYMBOL[status]) : null, text);
}

/** A notice on a tinted surface: head line and body, optionally a link. */
export function notice(status, head, body, href) {
  const inner = [h('span.notice-sign', symbol(STATUS_SYMBOL[status] ?? 'info')),
    h('span.notice-text', h('strong', head), body ? h('span', body) : null)];
  return href
    ? h(`a.notice.notice--${status}`, { href }, inner)
    : h(`div.notice.notice--${status}`, inner);
}

/** Term and value on one baseline. items: [{term, value, href?, mono?}]. */
export function facts(items) {
  return h('dl.hz-facts.facts', items.filter(Boolean).map((f) => [
    h('dt', f.term),
    h('dd', { class: f.mono ? 'hz-mono' : null },
      f.href ? link(f.value, f.href) : f.value),
  ]));
}

/** A link that leaves the app opens in a new tab. */
export function link(text, href, attrs = {}) {
  const external = /^https?:/.test(href);
  return h('a', { href, target: external ? '_blank' : null, rel: external ? 'noopener' : null, ...attrs }, text);
}

/** A row of a list: title, meta lines, an optional link and trailing text. */
export function row({ title, meta = [], href, trail, lead, extra, selected }) {
  const body = h('span.row-body',
    h('span.row-title', title),
    meta.filter(Boolean).map((m) => (m instanceof Node ? m : h('span.row-meta', m))),
    extra ?? null);
  const children = [lead ? h('span.row-lead', lead) : null, body, trail ? h('span.row-trail', trail) : null];
  if (href) {
    const external = /^https?:/.test(href);
    return h('li', h('a.row', { href, target: external ? '_blank' : null, rel: external ? 'noopener' : null, 'aria-current': selected ? 'true' : null }, children));
  }
  return h('li', h('div.row', children));
}

export function list(rows) {
  return h('ul.list', rows);
}

export function source(text) {
  return h('p.source', text);
}

/** "Jetzt geöffnet · bis 18:00" as a status line, or null without hours. */
export function openLine(hours, now = new Date()) {
  if (!hours) return null;
  const s = openState(hours, now);
  if (s.open) return statusLine('positive', t('openUntil', fmt.time(s.until)));
  return statusLine('neutral', s.opensAt ? t('closedOpensAt', fmt.when(s.opensAt, now)) : t('closed'));
}

/**
 * A part of a page that loads: shows "loading" at once, then what
 * [render] makes of the value, or the failure. [promise] resolves to a
 * value or to {value, at, stale} from core.live.
 */
export function slot(promise, render, { what, quiet = false } = {}) {
  const el = h('div.slot', quiet ? null : h('p.loading', t('loading')));
  promise.then(
    (result) => {
      const isLive = result && typeof result === 'object' && 'stale' in result && 'at' in result;
      const value = isLive ? result.value : result;
      const content = render(value, isLive ? result : null);
      el.replaceChildren(...[content].flat(Infinity).filter(Boolean));
      if (isLive && result.stale) el.prepend(statusLine('warning', t('stale', fmt.when(result.at))));
    },
    (error) => {
      if (quiet) {
        el.remove();
        return;
      }
      el.replaceChildren(statusLine('neutral', t('unavailable', what ?? '', t('failure', error.message))));
    },
  );
  return el;
}

/** Text of a failure for people. */
export function failureText(error) {
  return t('failure', error?.message);
}

/** The visible title of a detail page. */
export function pageHead(kennungText, title, ...after) {
  return h('header.page-head', kennung(kennungText), h('h1.t-title-1', title), ...after);
}
