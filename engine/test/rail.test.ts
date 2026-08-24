import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emitJS } from '../src/emit/js.ts';
import { emitSpatialJS } from '../src/emit/spatial-js.ts';
import { railVerdictJS } from '../src/emit/rail.ts';
import type { World } from '../src/world.ts';

/* ---------- the rail must report the REAL result ----------
   2026-08-24: shortiieraw.com and musthavefrenchies.com both printed a success
   message on a FormSubmit endpoint that was never activated. FormSubmit answers
   HTTP 200 with {"success":"false"}, so `if (!r.ok)` is a false positive and
   every booking inquiry was silently dropped while the visitor was told it sent.
   These tests EXECUTE the emitted verdict function, they do not grep for it. */

const world: World = {
  id: 'w', name: 'The Vault', logline: 'l', artist: 'A', domain: 'd',
  palette: { ground: '#05090C', accent: '#3FD8FF', payoff: '#E6D9A8', ink: '#F2F5F8', muted: 'rgba(242,245,248,.6)' },
  type: { display: { family: 'Archivo', weights: [900], google: 'Archivo' },
          text: { family: 'Archivo', weights: [400], google: 'Archivo' },
          mono: { family: 'Space Mono', weights: [400], google: 'Space+Mono' } },
  lexicon: { enter: 'SCROLL TO ENTER', catalogue: 'THE DEPOSITS', story: 'THE RECORD', proof: 'RECEIPTS',
             contact: 'ACCESS', latest: 'LATEST DEPOSIT', unit: 'deposit', index: 'SOURCES' },
  threshold: { gesture: 'scroll', label: 'SCROLL TO ENTER', reward: 'THE ROOM OPENS', maxDwellMs: 7000 },
  chrome: { docCode: 'KMV-2026-0017', stamps: ['SECURED'], readout: '000\u00b0' },
  ground: { kind: 'video', src: 'v.mp4', treatment: ['grain'] },
  sound: { src: 's.mp3', label: 'SOUND', startsMuted: false },
  moves: ['named_premise', 'threshold_ritual', 'one_hue', 'live_numbers', 'video_ground', 'sound_control'],
} as World;

/** compile the SHIPPED verdict source into a callable function */
function verdictFromEmit(): (ok: boolean, status: number, text: string) => boolean {
  return new Function(`${railVerdictJS()}; return railVerdict;`)() as never;
}

test('a FormSubmit 200 that says success:"false" is a FAILURE, not a send', () => {
  const verdict = verdictFromEmit();
  const body = JSON.stringify({
    success: 'false',
    message: "This form needs Activation. We've sent you an email containing an 'Activate Form' link.",
  });
  assert.throws(() => verdict(true, 200, body), /needs Activation/);
});

test('a Formspree 200 carrying an errors[] envelope is a FAILURE', () => {
  const verdict = verdictFromEmit();
  const body = JSON.stringify({ errors: [{ message: 'Form not found' }] });
  assert.throws(() => verdict(true, 200, body), /Form not found/);
});

test('an {ok:false} envelope is a FAILURE', () => {
  const verdict = verdictFromEmit();
  assert.throws(() => verdict(true, 200, JSON.stringify({ ok: false, message: 'nope' })), /nope/);
});

test('a genuine success passes', () => {
  const verdict = verdictFromEmit();
  assert.equal(verdict(true, 200, JSON.stringify({ success: 'true', message: 'sent' })), true);
});

test('a non-JSON body with a real HTTP error still fails', () => {
  const verdict = verdictFromEmit();
  assert.throws(() => verdict(false, 502, '<html>bad gateway</html>'), /502/);
});

test('CONTROL: a non-JSON body with HTTP 200 passes, so the guard is not just refusing everything', () => {
  const verdict = verdictFromEmit();
  assert.equal(verdict(true, 200, 'OK'), true);
});

/* 2026-08-24: three emitters each carried their own copy of this handler, so
   fixing js.ts left the LIVE site — which is spatial — still broken. Every
   topology must resolve to the one shared rail. */
test('EVERY emitter ships the shared rail, not its own copy', () => {
  for (const [name, js] of [['js', emitJS(world)], ['spatial-js', emitSpatialJS(world)]] as const) {
    assert.match(js, /function railVerdict\(/, `${name} does not ship railVerdict`);
    assert.ok(
      !/if \(!r\.ok\) throw/.test(js),
      `${name} reverted to a bare r.ok check — HTTP 200 is not delivery`,
    );
  }
});

test('every submission carries a distinct subject, or the inbox bundles the leads', () => {
  const js = emitSpatialJS(world);
  assert.match(js, /_subject/, 'no per-submission subject: Gmail will thread every lead into one');
  assert.match(js, /_replyto/, 'no _replyto: replying goes to the form service, not the lead');
});

test('a failed send surfaces the address printed under the form', () => {
  const js = emitSpatialJS(world);
  assert.match(js, /DID NOT SEND/);
  assert.match(js, /mailto:/, 'the failure path must hand the visitor a real way through');
});
