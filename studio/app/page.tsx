'use client';
import { useState, useEffect } from 'react';

type Cand = { key: string; name: string; image?: string; genre?: string; country?: string;
  signal?: { label: string; value: string }; links: { platform: string; url: string }[]; sources: string[] };
type Fact = { id: string; label: string; value: string | number; sourceUrl: string; verifiedAt: string; note?: string };
type Sealed = { id: string; label: string; reason: string; unblockedBy: string };
type Question = { id: string; ask: string; why: string; leverage: string; changes: string; kind: string; options?: string[] };
type Premise = { name: string; logline: string; topology: string; ground: string; accent: string;
  thresholdGesture: string; thresholdLabel: string; lexicon: Record<string, string>; rationale: string; fromAnswers: string[] };

type Palette = { accent: string; ground: string; rationale: string };
type Swatch = { accent: string; ground: string | null; label: string; sourceUrl: string; share: number };
type Sampled = { url: string; label: string; sourceUrl: string; kind: string; top: string | null; share: number };

const STEPS = ['Name', 'Confirm', 'Evidence', 'Palette', 'Interview', 'Premise', 'Build'];

export default function Studio() {
  const [step, setStep] = useState(0);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [cands, setCands] = useState<Cand[]>([]);
  const [searched, setSearched] = useState<string[]>([]);
  const [picked, setPicked] = useState<Cand | null>(null);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [sealed, setSealed] = useState<Sealed[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState('');
  const [premises, setPremises] = useState<Premise[]>([]);
  const [chosen, setChosen] = useState<Premise | null>(null);
  const [palette, setPalette] = useState<Palette | null>(null);
  const [palFrom, setPalFrom] = useState<{ label: string; sourceUrl: string; share: number } | null>(null);
  const [alts, setAlts] = useState<Swatch[]>([]);
  const [sampled, setSampled] = useState<Sampled[]>([]);
  const [palNote, setPalNote] = useState('');
  const [pickedPal, setPickedPal] = useState<{ accent: string; ground: string; from: string } | null>(null);
  const [built, setBuilt] = useState<{ audit: any; previewUrl: string } | null>(null);

  useEffect(() => { fetch('/api/questions').then(r => r.json()).then(d => setQuestions(d.questions ?? [])); }, []);

  async function runDiscover() {
    if (!q.trim()) return;
    setBusy(true); setErr('');
    try {
      const d = await fetch(`/api/discover?q=${encodeURIComponent(q)}`).then(r => r.json());
      setCands(d.candidates ?? []); setSearched(d.searched ?? []); setStep(1);
      if (!d.candidates?.length) setErr(`Nothing came back for "${q}" from ${(d.searched ?? []).join(', ')}. That is a real answer, not a bug — an artist with no DSP presence needs their links entered by hand.`);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  async function confirmArtist(c: Cand) {
    setPicked(c); setBusy(true);
    try {
      const d = await fetch('/api/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) }).then(r => r.json());
      setFacts(d.facts ?? []); setSealed(d.sealed ?? []); setStep(2);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  async function loadPalette() {
    setBusy(true); setErr(''); setPalNote('');
    try {
      const appleArtistId = picked?.links.find(l => l.platform === 'Apple Music')?.url?.match(/\/(\d+)(?:\?|$)/)?.[1]
        ?? (picked?.key.startsWith('apple:') ? picked.key.slice(6) : undefined);
      const d = await fetch('/api/palette', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appleArtistId }) }).then(r => r.json());
      setPalette(d.proposal ?? null); setPalFrom(d.from ?? null);
      setAlts(d.alternates ?? []); setSampled(d.sampled ?? []);
      if (d.note) setPalNote(d.note);
      if (d.proposal) setPickedPal({ accent: d.proposal.accent, ground: d.proposal.ground, from: d.from?.label ?? 'artwork' });
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  function answer(val: string) {
    const cur = questions[qi];
    const next = { ...answers, [cur.id]: val };
    setAnswers(next); setDraft('');
    if (qi + 1 < questions.length) setQi(qi + 1); else setStep(5);
  }

  async function makePremises() {
    setBusy(true); setErr('');
    try {
      const d = await fetch('/api/premises', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist: picked?.name, answers, facts, palette: pickedPal }) }).then(r => r.json());
      if (d.error) { setErr(d.error); return; }
      setPremises(d.premises ?? []); setStep(5);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  const cur = questions[qi];
  const archLeft = questions.filter(x => x.leverage === 'architecture' && !answers[x.id]).length;

  return (
    <div className="shell">
      <div className="top">
        <div className="brand"><b>COLD OPEN</b><i>NAMED-PREMISE ENGINE</i></div>
        <span className="note">{picked ? picked.name.toUpperCase() : 'NO ARTIST SELECTED'}</span>
      </div>

      <div className="steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`step ${i === step ? 'now' : i < step ? 'done' : ''}`}>
            <span className="n">{String(i + 1).padStart(2, '0')}</span><span className="t">{s}</span>
          </div>
        ))}
      </div>

      {err && <div className="audit" style={{ borderColor: 'var(--warn)' }}><p style={{ fontSize: 13, color: 'var(--warn)', lineHeight: 1.6 }}>{err}</p></div>}

      {/* 1 — NAME */}
      {step === 0 && (
        <>
          <h1>Who are we building for?</h1>
          <p className="lede">Type the artist's name. We'll look for them across Apple Music, Deezer and MusicBrainz, then ask you to confirm which one is the right person before anything else happens.</p>
          <div className="bigfield">
            <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && runDiscover()} placeholder="e.g. Shortiie Raw" autoFocus />
            <button className="btn" onClick={runDiscover} disabled={busy || !q.trim()}>{busy ? <><span className="spin" />Looking</> : 'Find them'}</button>
          </div>
        </>
      )}

      {/* 2 — CONFIRM */}
      {step === 1 && (
        <>
          <p className="slug">Step 2 · Confirm</p>
          <h1>Is this the right person?</h1>
          <p className="lede">
            Same-name artists are common, so nothing is assumed. Pick the one that's actually them —
            the photo, genre and follower count are there to tell them apart.
            {searched.length > 0 && <> Searched: <span className="mono" style={{ color: 'var(--dim)' }}>{searched.join(' · ')}</span>.</>}
          </p>
          <div className="cands">
            {cands.map(c => (
              <button key={c.key} className={`cand ${picked?.key === c.key ? 'sel' : ''}`} onClick={() => confirmArtist(c)}>
                {c.image ? <img className="av" src={c.image} alt="" /> : <span className="av" />}
                <span style={{ flex: 1 }}>
                  <span className="nm" style={{ display: 'block' }}>{c.name}</span>
                  <span className="mt" style={{ display: 'block' }}>
                    {c.genre ?? 'genre unknown'}{c.country ? ` · ${c.country}` : ''}
                    {c.signal && <><br />{c.signal.value} {c.signal.label}</>}
                  </span>
                  <span className="pl">
                    {[...new Set(c.links.map(l => l.platform))].map(pf => <span key={pf}>{pf}</span>)}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="row">
            <button className="btn ghost" onClick={() => setStep(0)}>← Different name</button>
            <span className="note">None of these? The artist may have no DSP footprint — that changes what the site should be, and is worth knowing now.</span>
          </div>
        </>
      )}

      {/* 3 — EVIDENCE */}
      {step === 2 && (
        <>
          <p className="slug">Step 3 · Evidence</p>
          <h1>Here's what we can prove.</h1>
          <p className="lede">
            Every row carries the page it was read from. Anything we couldn't verify is <b>sealed</b> — it will
            never be printed as a number on the site. If a figure matters and isn't here, add its source before building.
          </p>
          <table className="evi">
            <thead><tr><th>Figure</th><th>Value</th><th>Read from</th><th>Status</th></tr></thead>
            <tbody>
              {facts.map(f => (
                <tr key={f.id}>
                  <td>{f.label}</td><td className="v">{typeof f.value === 'number' ? f.value.toLocaleString() : f.value}</td>
                  <td><a href={f.sourceUrl} target="_blank" rel="noopener">{f.sourceUrl}</a></td>
                  <td><span className="pill ok">verified {f.verifiedAt}</span></td>
                </tr>
              ))}
              {sealed.map(s => (
                <tr key={s.id} className="sealed">
                  <td>{s.label}</td><td className="v">████ withheld</td><td>{s.reason}</td><td><span className="pill warn">sealed</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row">
            <button className="btn" onClick={() => { setStep(3); loadPalette(); }}>Read their colour →</button>
            <span className="note">{facts.length} verified · {sealed.length} sealed</span>
          </div>
        </>
      )}

      {/* 4 — PALETTE */}
      {step === 3 && (
        <>
          <p className="slug">Step 4 · Palette</p>
          <h1>Their colour, not ours.</h1>
          <p className="lede">
            Read off their own release artwork, not chosen from taste. A palette picked by eye is a
            palette picked from the median — this one can only look like them. Each option is cited to
            the single record it came from, and none of them is a pair the build would later refuse.
          </p>

          {busy && <div className="row"><span className="spin" /><span className="note">Decoding their artwork…</span></div>}
          {palNote && !busy && <p className="note">{palNote}</p>}

          {palette && (
            <>
              <div className="palhero" style={{ background: palette.ground }}>
                <span className="paldot" style={{ background: palette.accent }} />
                <span className="palmeta">
                  <b className="mono" style={{ color: palette.accent }}>{palette.accent}</b>
                  <i className="mono">on {palette.ground}</i>
                  {palFrom && <em>{palFrom.share}% of usable pixels · {palFrom.label}</em>}
                </span>
              </div>
              <p className="note" style={{ marginTop: 10 }}>{palette.rationale}</p>
            </>
          )}

          {alts.length > 0 && (
            <>
              <p className="slug" style={{ marginTop: 26 }}>Or another record of theirs</p>
              <div className="alts">
                {[{ accent: palette!.accent, ground: palette!.ground, label: palFrom?.label ?? 'artwork', sourceUrl: palFrom?.sourceUrl ?? '#', share: palFrom?.share ?? 0 }, ...alts].map(sw => (
                  <button key={sw.accent + sw.label}
                    className={`alt ${pickedPal?.accent === sw.accent ? 'sel' : ''}`}
                    style={{ background: sw.ground ?? '#0b0b0d' }}
                    onClick={() => setPickedPal({ accent: sw.accent, ground: sw.ground ?? '#0b0b0d', from: sw.label })}>
                    <span className="bar" style={{ background: sw.accent }} />
                    <span className="mono" style={{ color: sw.accent }}>{sw.accent}</span>
                    <span className="who">{sw.label}</span>
                    <span className="share">{sw.share}%</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {sampled.length > 0 && (
            <>
              <p className="slug" style={{ marginTop: 26 }}>What was read — {sampled.length} covers</p>
              <div className="covers">
                {sampled.map(c => (
                  <a key={c.url} className="cover" href={c.sourceUrl} target="_blank" rel="noopener" title={`${c.label} — ${c.share}% ${c.top}`}>
                    <img src={c.url} alt={c.label} />
                    {c.top && <span className="chip" style={{ background: c.top }} />}
                  </a>
                ))}
              </div>
            </>
          )}

          <div className="row">
            <button className="btn" onClick={() => setStep(4)} disabled={busy}>
              {pickedPal ? 'Start the interview →' : 'Skip — no artwork to read →'}
            </button>
            {pickedPal && <span className="note">{pickedPal.accent} from {pickedPal.from}. The premise inherits it.</span>}
            {!busy && !palette && <button className="btn ghost" onClick={loadPalette}>Try again</button>}
          </div>
        </>
      )}

      {/* 5 — INTERVIEW */}
      {step === 4 && cur && (
        <>
          <p className="slug">Step 5 · Interview — question {qi + 1} of {questions.length}</p>
          <div className="q">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span className={`lev ${cur.leverage}`}>{cur.leverage}</span>
              {archLeft > 0 && <span className="note">{archLeft} architecture question{archLeft === 1 ? '' : 's'} left</span>}
            </div>
            <p className="ask">{cur.ask}</p>
            {cur.kind === 'either' && cur.options ? (
              <div className="pickrow">{cur.options.map(o => <button key={o} onClick={() => answer(o)}>{o}</button>)}</div>
            ) : (
              <>
                <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="In your own words. There is no wrong answer here — this is the part no model can guess." />
                <div className="row">
                  <button className="btn" onClick={() => answer(draft)} disabled={!draft.trim()}>Next question →</button>
                  {qi > 0 && <button className="btn ghost" onClick={() => setQi(qi - 1)}>← Back</button>}
                </div>
              </>
            )}
            <div className="why"><b>Why we're asking:</b> {cur.why}<br /><b>What it changes:</b> {cur.changes}</div>
          </div>
          <div className="row"><button className="btn ghost" onClick={makePremises} disabled={busy || archLeft > 0}>
            {busy ? <><span className="spin" />Drafting worlds</> : archLeft > 0 ? `Answer the ${archLeft} architecture question${archLeft === 1 ? '' : 's'} first` : 'I\'m done — draft the worlds'}
          </button></div>
        </>
      )}

      {/* 6 — PREMISE */}
      {step === 5 && (
        <>
          <p className="slug">Step 6 · Premise</p>
          <h1>Three worlds. Pick one.</h1>
          <p className="lede">
            These are deliberately different <b>shapes</b> of site, not three colourways of the same page.
            Whichever you pick, everything after this is derived from it — type, motion, the way in, what
            each section is even called. <b>You pick the world. The engine doesn't.</b>
          </p>
          {premises.length === 0 && <div className="row"><button className="btn" onClick={makePremises} disabled={busy}>{busy ? <><span className="spin" />Drafting</> : 'Draft the three worlds'}</button></div>}
          <div className="prems">
            {premises.map(p => (
              <button key={p.name} className="prem" onClick={() => { setChosen(p); setStep(6); }}>
                <span className="swatch" style={{ background: p.ground, color: p.accent }}>
                  <span className="thr" style={{ color: p.accent }}>{p.thresholdLabel}</span>
                  <span className="topo">{p.topology}</span>
                  <span className="nm">{p.name}</span>
                </span>
                <span className="body" style={{ display: 'block' }}>
                  <span className="log" style={{ display: 'block' }}>{p.logline}</span>
                  <span className="lex">{Object.values(p.lexicon).slice(0, 6).map((v, i) => <span key={i}>{v}</span>)}</span>
                  <span className="rat" style={{ display: 'block' }}>{p.rationale}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* 7 — BUILD */}
      {step === 6 && chosen && (
        <>
          <p className="slug">Step 7 · Build</p>
          <h1>{chosen.name}</h1>
          <p className="lede">{chosen.logline}</p>
          {built ? (
            <>
              <div className="audit">
                <h2>Build audit</h2>
                <ul>
                  <li>Moves implemented: {built.audit.moveCount}/7</li>
                  {built.audit.problems?.length
                    ? built.audit.problems.map((p: string, i: number) => <li key={i} style={{ color: 'var(--bad)' }}>✕ {p}</li>)
                    : <li style={{ color: 'var(--ok)' }}>✓ No problems — every figure sourced, palette committed, lexicon named from the world</li>}
                </ul>
              </div>
              <iframe className="frame" src={built.previewUrl} title="preview" />
            </>
          ) : (
            <div className="row"><button className="btn" onClick={async () => {
              setBusy(true);
              const d = await fetch('/api/build', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ premise: chosen, artist: picked, facts, sealed, answers, palette: pickedPal }) }).then(r => r.json());
              setBuilt(d); setBusy(false);
            }} disabled={busy}>{busy ? <><span className="spin" />Building</> : 'Build the site'}</button></div>
          )}
        </>
      )}
    </div>
  );
}
