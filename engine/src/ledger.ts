/**
 * COLD OPEN — the fact ledger.
 *
 * The anti-fabrication spine. Nothing reaches a rendered page unless it
 * carries the URL it was read from and the date it was read. There is
 * deliberately no way to construct a renderable Fact without a source.
 *
 * A number without a source is not a "low confidence number". It is not a
 * number. It renders as a redaction bar or it does not render at all.
 */

export type FactKind =
  | 'count'      // 10,630,835 streams
  | 'date'       // 2026-08-18
  | 'title'      // "Die 2 Young"
  | 'credit'     // "Casper TNG, 100Bandplan"
  | 'award'      // "Platinum · Canada"
  | 'link'       // https://...
  | 'quote'      // verbatim words, attributed
  | 'text';      // any other short string

export interface Fact<T = string | number> {
  /** stable id, used by templates: ledger.get('spotify.monthly_listeners') */
  readonly id: string;
  readonly kind: FactKind;
  readonly value: T;
  /** human label as it should appear on the page, e.g. "MONTHLY LISTENERS" */
  readonly label: string;
  /** the URL this was actually read from. Required. No exceptions. */
  readonly sourceUrl: string;
  /** ISO date the source was read. Numbers rot; this is how we know how fast. */
  readonly verifiedAt: string;
  /**
   * How the value should be written when it lands in markup.
   *  'flex' — 10,630,835. The default: a real count read as a flex.
   *  'raw'  — 10630835. For machine slots (data-* attributes, JSON-LD,
   *           microdata) where a thousands separator silently truncates the
   *           value on parse. A comma in a data-target is a live bug that
   *           renders as a plausible-looking small number.
   *  'none' — the value verbatim, for strings that are already formatted.
   */
  readonly format?: 'flex' | 'raw' | 'none';
  /** free-text note on how it was read, for the audit trail */
  readonly note?: string;
}

/**
 * A claim that is believed but NOT verified. It can never render as a value.
 * It renders only inside the world's own chrome as a redaction, which is the
 * move James invented on 100BandPlan: the site admits it is holding something
 * back rather than inventing a number to fill the slot.
 */
export interface SealedClaim {
  readonly id: string;
  readonly label: string;
  /** why it is sealed — what was checked and what failed */
  readonly reason: string;
  /** what would unseal it */
  readonly unblockedBy: string;
}

export class UnsourcedFactError extends Error {
  constructor(id: string, detail: string) {
    super(`COLD OPEN refused fact "${id}": ${detail}. Every rendered fact needs a sourceUrl and verifiedAt. If you cannot source it, seal it.`);
    this.name = 'UnsourcedFactError';
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class Ledger {
  private facts = new Map<string, Fact<any>>();
  private sealed = new Map<string, SealedClaim>();
  /** ids that a template asked for and did not find — surfaced in the audit */
  private misses = new Set<string>();

  add<T extends string | number>(f: Fact<T>): this {
    if (!f.sourceUrl || !/^https?:\/\//.test(f.sourceUrl)) {
      throw new UnsourcedFactError(f.id, `sourceUrl "${f.sourceUrl}" is not an http(s) URL`);
    }
    if (!f.verifiedAt || !ISO_DATE.test(f.verifiedAt)) {
      throw new UnsourcedFactError(f.id, `verifiedAt "${f.verifiedAt}" is not an ISO date (YYYY-MM-DD)`);
    }
    if (f.value === '' || f.value === null || f.value === undefined) {
      throw new UnsourcedFactError(f.id, 'value is empty');
    }
    if (this.sealed.has(f.id)) {
      throw new UnsourcedFactError(f.id, 'this id is already SEALED — unseal it deliberately rather than shadowing it');
    }
    this.facts.set(f.id, f);
    return this;
  }

  seal(c: SealedClaim): this {
    if (this.facts.has(c.id)) {
      throw new UnsourcedFactError(c.id, 'this id is already a verified fact — remove the fact before sealing');
    }
    this.sealed.set(c.id, c);
    return this;
  }

  has(id: string): boolean { return this.facts.has(id); }
  isSealed(id: string): boolean { return this.sealed.has(id); }

  /** Returns the fact or undefined. Records the miss so the audit can report it. */
  get<T = string | number>(id: string): Fact<T> | undefined {
    const f = this.facts.get(id) as Fact<T> | undefined;
    if (!f && !this.sealed.has(id)) this.misses.add(id);
    return f;
  }

  /** Throws rather than rendering a hole. Use for facts a section cannot exist without. */
  require<T = string | number>(id: string): Fact<T> {
    const f = this.get<T>(id);
    if (!f) throw new UnsourcedFactError(id, this.sealed.has(id) ? 'it is SEALED and cannot be printed as a value' : 'not in the ledger');
    return f;
  }

  sealedClaim(id: string): SealedClaim | undefined { return this.sealed.get(id); }

  all(): Fact<any>[] { return [...this.facts.values()]; }
  allSealed(): SealedClaim[] { return [...this.sealed.values()]; }
  missed(): string[] { return [...this.misses]; }

  /** Facts older than `days` — numbers rot and the site should know it. */
  stale(days: number, asOf = new Date()): Fact<any>[] {
    const cutoff = asOf.getTime() - days * 864e5;
    return this.all().filter(f => Date.parse(f.verifiedAt) < cutoff);
  }

  /** The provenance table that ships in every generated site's SOURCES page. */
  toSourceTable(): { id: string; label: string; value: string; sourceUrl: string; verifiedAt: string }[] {
    return this.all()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(f => ({ id: f.id, label: f.label, value: String(f.value), sourceUrl: f.sourceUrl, verifiedAt: f.verifiedAt }));
  }

  static fromJSON(raw: { facts?: Fact<any>[]; sealed?: SealedClaim[] }): Ledger {
    const l = new Ledger();
    (raw.facts ?? []).forEach(f => l.add(f));
    (raw.sealed ?? []).forEach(s => l.seal(s));
    return l;
  }

  toJSON() { return { facts: this.all(), sealed: this.allSealed() }; }
}

/** Format a count the way a flex reads: 10,630,835 — never rounded, never "10M+". */
export function flex(n: number): string { return n.toLocaleString('en-US'); }

/** Render a fact's value for insertion into markup, honouring its format. */
export function renderValue(f: Fact<any>): string {
  if (f.format === 'raw' || f.format === 'none') return String(f.value);
  return typeof f.value === 'number' ? flex(f.value) : String(f.value);
}
