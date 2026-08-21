# Decisions

Why the engine is shaped the way it is. Each entry is a choice that could
reasonably have gone the other way.

## The artist picks the premise, not the model

A model asked to invent a premise from a Spotify page picks the median
premise, because the median is what "safe" looks like from inside a training
distribution. The single most valuable input — what the artist knows about
their own work — is the one thing not in any dataset. So the engine generates
options and refuses to choose between them.

## Topology is the divergence axis, not colour

Three "different" premises that share a topology are the same site with
different paint. Requiring a unique topology per premise forces the difference
to be structural: a room you move through is not a document you are cleared
into, and they produce different builds, not different palettes.

## The lexicon is the tell

The fastest way to spot a generated artist site is that it has a section
called "Contact". A named world does not — The Vault has ACCESS, the Mission
File has COMMS. The audit fails a build whose lexicon contains a generic label,
because at that point the premise stopped at the palette and never reached the
copy.

## Sealed claims render, they do not disappear

The obvious handling for an unverifiable claim is to drop it. Rendering it as a
redaction with its reason attached is better for two reasons: the gap stays
visible to whoever maintains the site, and admitting you are holding something
back reads as more credible than a page of round numbers. This move was
invented by hand on 100bandplan.com before the engine existed.

## The cream ban is a shape test, not a list

A list of banned hex codes is evaded by nudging one channel — `#F7F1E7` is
banned, `#F9F3E9` is not, and they are the same colour. Testing hue,
saturation and lightness catches the whole neighbourhood. There is a
`brandExemption` escape hatch because a client whose brand genuinely is cream
exists; taking it requires stating the reason in the call.

## Static HTML, no framework

The reference sites are zero-build static HTML and they are the best of the
set. Static output means the emitted site has no dependency that can rot, can
be read and hand-edited by whoever inherits it, and degrades to readable
content if every script fails. The studio is a Next.js app; what it emits is not.

## The release path infers rather than assumes

An update path that imposes its own markup on a hand-built site destroys the
thing it was called to preserve. Reading the host's repeated item pattern out
of the file means the engine writes in the site's own idiom even for a world it
has never seen.

## Verification is a human step, and the engine says so

The audit checks contrast, palette, lexicon and move count. It cannot see the
rendered page. A new plate landed exactly behind the centrepiece — invisible,
with tag balance green and every check passing. Only a screenshot caught it.
`findFreePlacement` closes that specific hole; the general lesson (an automated
check cannot confirm something is visible) is in the README's limits section
rather than papered over.
