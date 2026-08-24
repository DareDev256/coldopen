/**
 * THE RAIL — the one contact handler, emitted into every topology.
 *
 * 2026-08-24: this file exists because there were THREE copies of this handler
 * (js.ts, spatial-js.ts, webgl.ts) and all three carried the same defect. A fix
 * to one silently left the live site — which is spatial — still broken.
 *
 * The defect: `if (!r.ok) throw` treats HTTP 200 as delivery. FormSubmit answers
 * 200 with {"success":"false","message":"This form needs Activation..."} and
 * Formspree answers 200 with an {errors:[...]} envelope. shortiieraw.com and
 * musthavefrenchies.com both printed "RECEIVED. YOU WILL HEAR BACK." on
 * endpoints that were never activated, for as long as they had been live.
 *
 * A form that says "thanks!" regardless of what the server did is worse than no
 * form, because it hides a dead rail.
 */

/** The verdict function, named so the suite can extract and EXECUTE it. */
export function railVerdictJS(): string {
  return `
  function railVerdict(ok, status, text) {
    var data = null;
    try { data = JSON.parse(text); } catch (e) {}
    if (data && typeof data === 'object') {
      if ('success' in data && String(data.success) !== 'true') {
        throw new Error(data.message || 'REJECTED BY THE FORM SERVICE');
      }
      if (data.errors && data.errors.length) {
        throw new Error(data.errors.map(function (x) { return x.message || x; }).join('; '));
      }
      if ('ok' in data && data.ok === false) {
        throw new Error(data.message || 'REJECTED BY THE FORM SERVICE');
      }
    }
    if (!ok) throw new Error('HTTP ' + status);
    return true;
  }
`;
}

/** The submit listener. Assumes railVerdict() is in scope. */
export function railSubmitJS(): string {
  return `
  var form = document.getElementById('railForm');
  var msg = document.getElementById('formMsg');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var trap = form.querySelector('[name="_gotcha"]') || form.querySelector('[name="_honey"]');
    if (trap && trap.value) return;
    if (form.dataset.sending === '1') return;
    var b = form.querySelector('button[type="submit"]'), o = b.textContent;
    form.dataset.sending = '1';
    b.disabled = true; b.textContent = 'SENDING…';
    msg.className = 'form-msg mono'; msg.textContent = '';

    /* Stamp the subject, or the recipient's mail client bundles every lead into
       one thread and buries all but the newest. Measured on darewedding.com:
       34 submissions collapsed into ~16 visible threads. */
    var body = new FormData(form);
    var who = (body.get('name') || '').toString().trim();
    var stamp = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    if (!body.get('_subject')) body.set('_subject', 'NEW INQUIRY' + (who ? ' from ' + who : '') + ' (' + stamp + ')');
    if (body.get('email') && !body.get('_replyto')) body.set('_replyto', body.get('email'));
    if (!body.get('_template')) body.set('_template', 'table');

    fetch(form.action, { method: 'POST', body: body, headers: { Accept: 'application/json' } })
      .then(function (r) { return r.text().then(function (t) { return railVerdict(r.ok, r.status, t); }); })
      .then(function () {
        form.reset();
        msg.className = 'form-msg mono ok';
        msg.textContent = 'RECEIVED. YOU WILL HEAR BACK.';
      })
      .catch(function (err) {
        /* A failed send must never lose the person. Hand them the address that
           is already printed under the form. */
        var alt = document.querySelector('.alt a[href^="mailto:"]');
        var addr = alt ? alt.getAttribute('href').replace('mailto:', '') : '';
        msg.className = 'form-msg mono err';
        msg.textContent = 'DID NOT SEND. EMAIL' + (addr ? ' ' + addr.toUpperCase() : ' US') + ' INSTEAD.';
        if (window.console && console.warn) console.warn('[rail] ' + (err && err.message ? err.message : err));
      })
      .finally(function () { form.dataset.sending = ''; b.disabled = false; b.textContent = o; });
  });
`;
}

/** Verdict + listener, for an emitter that just wants the whole rail. */
export function railJS(): string {
  return railVerdictJS() + railSubmitJS();
}
