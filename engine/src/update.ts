/**
 * COLD OPEN — the release patch.
 *
 * The second capability, and the one that decides whether this is a toy.
 * Artists come back when a record drops. The engine has to handle "new
 * release" on a site it did NOT generate, without flattening the world that
 * is already there.
 *
 * So this module never re-emits. It reads the existing markup, works out the
 * site's own vocabulary from what is actually in the file, and applies
 * surgical edits in that vocabulary — then proves it did not break the
 * markup, because a green build is not proof.
 */

import { Ledger, renderValue } from './ledger.ts';

export interface NumericClaim {
  /** ledger id holding the CURRENT verified value */
  readonly factId: string;
  /** the stale string as it appears in the file right now */
  readonly was: string;
  /** how many times it appears — all occurrences are replaced */
  readonly occurrences: number;
}

export interface ReleasePatch {
  /** what is being added, in the site's own words */
  readonly headline: string;
  /** ledger ids that must exist before this patch is allowed to run */
  readonly requires: readonly string[];
  /** stale → current numeric corrections */
  readonly corrections: readonly NumericClaim[];
  /** raw HTML block to insert, authored in the host site's classes */
  readonly insert?: { html: string; afterMarker: string };
}

export class PatchRefused extends Error {
  constructor(msg: string) { super(`COLD OPEN refused the patch: ${msg}`); this.name = 'PatchRefused'; }
}

/* ------------------------------------------------------------------ */
/* WORLD EXTRACTION — read the world out of a site we did not build     */
/* ------------------------------------------------------------------ */

export interface ExtractedWorld {
  readonly cssVars: Record<string, string>;
  readonly fontFamilies: string[];
  /** every all-caps mono-ish label found — this IS the site's lexicon */
  readonly lexicon: string[];
  readonly docCodes: string[];
  readonly classNames: string[];
}

export function extractWorld(html: string, css: string): ExtractedWorld {
  const cssVars: Record<string, string> = {};
  for (const m of css.matchAll(/--([\w-]+)\s*:\s*([^;}]+)/g)) cssVars[m[1]] = m[2].trim();

  const fontFamilies = [...new Set(
    [...css.matchAll(/font-family\s*:\s*([^;}]+)/g)].map(m => m[1].split(',')[0].replace(/['"]/g, '').trim())
  )].filter(f => f && !f.startsWith('var('));

  // section slugs / kickers: short all-caps strings inside tags
  const lexicon = [...new Set(
    [...html.matchAll(/>([A-Z0-9][A-Z0-9 ·\/'&.-]{2,28})</g)].map(m => m[1].trim())
  )].filter(s => /[A-Z]{2}/.test(s) && s.length <= 28);

  const docCodes = [...new Set([...html.matchAll(/\b([A-Z]{2,5}[- ]?\d{2,4}[A-Z]?[-\d]*)\b/g)].map(m => m[1]))];
  const classNames = [...new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/)))];

  return { cssVars, fontFamilies, lexicon, docCodes, classNames };
}

/* ------------------------------------------------------------------ */
/* TAG BALANCE — a green build is not proof                            */
/* ------------------------------------------------------------------ */

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

export interface BalanceReport { readonly ok: boolean; readonly unclosed: string[]; readonly stray: string[]; readonly counts: Record<string, number>; }

/**
 * Counts opens and closes per tag across a region. Vite will happily copy
 * malformed HTML with a clean exit code, so the assertion has to be ours:
 * after any programmatic rewrite of markup, the region's tag balance must be
 * identical to what it was before.
 */
export function tagBalance(html: string): BalanceReport {
  const stack: string[] = [];
  const stray: string[] = [];
  const counts: Record<string, number> = {};
  const stripped = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');

  for (const m of stripped.matchAll(/<(\/?)([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g)) {
    const [, closing, rawTag, selfClose] = m;
    const tag = rawTag.toLowerCase();
    if (VOID.has(tag) || selfClose === '/') continue;
    counts[tag] = (counts[tag] ?? 0) + (closing ? -1 : 1);
    if (closing) {
      const i = stack.lastIndexOf(tag);
      if (i === -1) stray.push(tag); else stack.splice(i, 1);
    } else stack.push(tag);
  }
  return { ok: stack.length === 0 && stray.length === 0, unclosed: stack, stray, counts };
}

export function assertBalancePreserved(before: string, after: string): void {
  const b = tagBalance(before), a = tagBalance(after);
  const tags = new Set([...Object.keys(b.counts), ...Object.keys(a.counts)]);
  const drift: string[] = [];
  for (const t of tags) {
    const bc = b.counts[t] ?? 0, ac = a.counts[t] ?? 0;
    if (bc !== ac) drift.push(`<${t}> balance moved ${bc} → ${ac}`);
  }
  if (drift.length) throw new PatchRefused(`markup balance changed:\n  - ${drift.join('\n  - ')}`);
  if (b.ok && !a.ok) throw new PatchRefused(`markup was balanced before and is not now (unclosed: ${a.unclosed.join(', ')}; stray: ${a.stray.join(', ')})`);
}

/* ------------------------------------------------------------------ */
/* APPLY                                                               */
/* ------------------------------------------------------------------ */

export interface PatchResult {
  readonly html: string;
  readonly applied: string[];
  readonly skipped: string[];
  readonly balance: BalanceReport;
}

export function applyPatch(html: string, patch: ReleasePatch, ledger: Ledger): PatchResult {
  for (const id of patch.requires) {
    if (!ledger.has(id)) throw new PatchRefused(`required fact "${id}" is not in the ledger — verify it from a primary source before this ships`);
  }

  let out = html;
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const c of patch.corrections) {
    const f = ledger.require(c.factId);
    const now = renderValue(f);
    const found = out.split(c.was).length - 1;
    if (found === 0) { skipped.push(`"${c.was}" not found (already corrected, or the markup moved)`); continue; }
    if (found !== c.occurrences) {
      throw new PatchRefused(`"${c.was}" appears ${found} time(s), the patch expected ${c.occurrences}. The file has drifted — re-read it before patching.`);
    }
    out = out.split(c.was).join(now);
    applied.push(`${c.factId}: ${c.was} → ${now}  (${f.sourceUrl}, read ${f.verifiedAt})`);
  }

  if (patch.insert) {
    const idx = out.indexOf(patch.insert.afterMarker);
    if (idx === -1) throw new PatchRefused(`insertion marker not found: ${patch.insert.afterMarker.slice(0, 80)}`);
    // Anchor on a string that cannot prefix-match its own container.
    const cut = idx + patch.insert.afterMarker.length;
    out = out.slice(0, cut) + '\n' + patch.insert.html + '\n' + out.slice(cut);
    applied.push(`inserted: ${patch.headline}`);
  }

  assertBalancePreserved(html, out);
  return { html: out, applied, skipped, balance: tagBalance(out) };
}
