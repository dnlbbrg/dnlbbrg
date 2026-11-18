# Typography

**Face:** D-DIN by Datto (SIL Open Font License, `fonts/OFL.txt`), a revival of DIN 1451.

**Why it comes from the subject:** the profile speaks to people who wire their homes. The printed
matter of that world is German technical lettering: fuse box label strips, circuit breaker
markings, rating plates, wiring diagrams. That letter is DIN 1451, a narrow, monoline engineering
grotesque. D-DIN is a free face of exactly that kind, so the type and the header motif (a row of
circuit breakers on a DIN rail) tell the same story.

**How the family is used:** contrast comes from width, not from a second family.

| Role | Cut | Size (wide header / cards) |
|---|---|---|
| Name, card titles | D-DIN Condensed Bold | 120 / 54 / 34 |
| Body lines | D-DIN Regular | 30 / 22 / 21 |
| Labels, indices, meta | D-DIN Exp Bold, caps, tracked 0.10 to 0.14 em | 18 / 14 / 13 |
| Contact links | D-DIN Bold | 20 |

Not used: the danielboberg.de stack (Instrument Serif, Hanken Grotesk) and the faces listed in
skill `frontend-design` `reference/ai-defaults.md`.

All text is converted to outlines by `scripts/build.mjs`; the fonts are never loaded by a viewer.
Change copy in `content/profile.json`, then run `npm run build` (images and README) and `npm test`.
