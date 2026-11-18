# GitHub profile redesign · design

Date: 2026-11-18. Repo: `dnlbbrg/dnlbbrg` (public profile README repo).

## Intent

People from the Home Assistant community land on github.com/dnlbbrg (from videos, HACS, issues).
The profile has one job: advertise Daniel's projects to them, and look exceptional while doing it.
Today it is the stock template look (capsule-render waves, typing SVG, badge rows, skill icons,
streak stats, activity graph, contribution snake, emoji bullets), which Daniel calls "super
hässlich". It also carries private material (books, press, photography) that does not belong there.

## Goals

- A calm, editorial, typographic profile (approach A) that stands out by quality alone.
- Home Assistant work leads; other projects follow as a compact secondary block.
- The auto-updated list of the latest Alles Automatisch videos stays.
- Correct profile header: full name, one bio line, website, pinned repositories.
- Works in GitHub light and dark mode.

## Non-goals

- Live numbers rendered into images (dashboard approach C). Possible later, not now.
- Any change to the linked websites.

## Anti-goals (a failure even if it technically works)

- **No emojis**, anywhere (README, alt texts, headings, commit-visible text). Daniel said so explicitly.
- No stock widgets: no capsule-render, typing SVG, shields.io badge rows, skillicons, streak or
  activity graphs, snake, profile views counter, 3D contribution graph.
- No private material: books, press, media features, photography, Pixelgranaten, Kamerakram,
  Instagram, tageslicht.studio.
- No AI default looks (global rules): no pill or chip rows, no reassurance claim row, no neon or
  purple gradient palette, no banned typeface without a reason from the subject.
- No dash punctuation (`—`, `–`) in any text; German text with real umlauts.

## Constraints

- GitHub sanitises README HTML: no CSS, no JS, no `<style>`. All visual design lives in images
  committed to the repo, referenced by relative path.
- Images are served through GitHub's camo proxy as `<img>`: SVGs cannot load external fonts or
  scripts. Text inside an SVG must be converted to outlines (paths) at build time, so the result
  never depends on fonts installed on the viewer's machine.
- Light/dark: `<picture>` with `<source media="(prefers-color-scheme: dark)">` per image, two
  files per image.
- Images that are links: wrap `<img>`/`<picture>` in `<a href>`; every image has a real alt text
  (the readable content, since screen readers and search see only that).
- SVG animation (SMIL or CSS inside the SVG file) works inside `<img>`; if used, it is subtle,
  one-time or slow, and the static frame must look finished.
- The repo is public, so its GitHub Actions cost nothing. The blog post workflow stays.
- English in the repo (file names, commit messages). The README's visible copy language: see
  "Left to the builder".

## Approaches considered

| | Approach | Trade-off |
|---|---|---|
| **A · Editorial** (picked) | Typographic header and project cards as custom SVGs, hairlines, generous space, own light and dark set | Stands out by quality, not by gimmick; needs careful type work |
| B · Profile as Home Assistant dashboard | Projects as dashboard tiles, animated switch in the header | Instantly readable for the community, but risks looking like a toy if under-executed |
| C · B plus live numbers | Daily Action renders tiles with real stats | More moving parts; a broken data source must never blank the tiles |

Daniel picked A.

## Visual language

- Brand base is Alles Automatisch, because that is what this audience knows Daniel from
  (`~/Projects/alles-automatisch/src/app/globals.css`): navy ink `#10172B`, coral `#F0665B`
  (ink variant `#C0392F` for small text on light), mint `#89C9BA` (ink variant `#2F7D6B`),
  ground `#F9F9F9`. Dark mode: GitHub's dark canvas is `#0D1117`; images use a transparent or
  matching ground so they sit flush in both themes.
- Typography: a display face plus a text face chosen from the subject (method: skill
  `frontend-design`, `reference/typography.md`), justified in a short note in this repo. The
  Alles Automatisch site uses DM Sans; DM Sans is on the banned-without-reason list, and "it is the
  brand's face" is an acceptable reason only if the builder decides to stay with it. The
  danielboberg.de stack (Instrument Serif, Hanken Grotesk) is not used.
- Hairline dividers instead of boxes; JetBrains Mono only as a deliberate accent (indices,
  labels), never as a "technical" shortcut.

## Content and order

1. **Header image** (linked to alles-automatisch.de): name "Daniel Boberg", one line on what he
   does for this audience (Home Assistant videos and tools). Light and dark file.
2. **Home Assistant** section, large cards, one image per card, each card a link:
   - Alles Automatisch: YouTube channel and site (alles-automatisch.de,
     youtube.com/@alles-automatisch). Subscriber count only as static text if used at all
     (14.700 as of 2026-11-18, source: skill `daniel-boberg` references/kanaele.md).
   - SmartHome Finder (smarthome-finder.com): find devices that fit your ecosystem.
3. **Latest videos**: the existing `<!-- BLOG-POST-LIST:START -->` / `END` block and
   `blog-posts.yml`, unchanged in function. A section heading in the new style above it.
4. **More projects**: one compact block, smaller than the HA cards: Folnaro, Brick Storage,
   Wortglut, SteadyCost, QRVisit, Life Counter, Deixis plugin (github.com/dnlbbrg/deixis-plugin)
   (each a link to its site, one short line each).
5. **Contact**: one quiet line or small image with links to alles-automatisch.de,
   danielboberg.de, YouTube, LinkedIn (`linkedin.com/in/dnlbbrg/`). No badge row.

Removed: About Me emoji list, Tech Stack, GitHub Stats, Activity Graph, Contribution Snake,
Published Books, Media & Press, footer wave, profile views counter.

## Profile settings (outside the README, via `gh api` / web)

- Name: "Daniel Boberg". Bio: one line, no emoji (draft by the builder, Daniel approves).
- Website: alles-automatisch.de (fits the audience; danielboberg.de is linked in the README).
- Pinned repositories: Daniel's own public repos only; today that is `deixis-plugin`. Forks of
  other people's work (HA-Toniebox, HA-Apps) are never pinned or presented as his projects.
- Delete the old forks of unrelated projects: `core-js`, `firebase-import`, `keep-a-changelog`,
  `Creative-Commons-Markdown`, `dice-css` (decided by Daniel 2026-11-18; irreversible, so the
  builder lists each one with `gh repo view` right before deleting). `default` (HACS),
  `raycast-extensions`, `HA-Toniebox`, `HA-Apps` stay: they are contribution forks.
- `snake.yml` and its `output` branch, and the `profile-3d-contrib/` folder, become unused and go
  (workflow deleted from the repo; `output` branch deleted after Daniel's Go, since that is not
  reversible from the trash).

## Verification

- Render check of the README as GitHub shows it, in light and dark mode, desktop and narrow mobile
  width (GitHub's own rendering, not a local Markdown preview): screenshots looked at, not just
  a passing script.
- Every image loads, every link resolves (HTTP 200), every alt text is meaningful.
- Scan of README and SVG text for emojis and `—`/`–`.

## Staging (my call after the builder check)

- Build on a branch `redesign` of `dnlbbrg/dnlbbrg`. The old README stays live on `main` until
  the new one is complete.
- Render checks run on the branch's repo page (`github.com/dnlbbrg/dnlbbrg/tree/redesign`), which
  uses the same README renderer, camo proxy and `<picture>` handling; only the profile chrome
  (avatar column, pinned repos) is missing there.
- Then one merge to `main` and a final check on github.com/dnlbbrg itself, with profile settings
  applied in the same step.

## Copy and URLs (my call after the builder check)

- The builder writes all copy (header line, card texts, one line per project, contact line) from
  public sources: the live sites, the current README, skill `daniel-boberg` references
  (`projekte.md`, `kanaele.md`). Nothing is invented; a claim not found in a source is left out.
- URLs come from the current README (all verified live at build time with HTTP 200).
  LinkedIn is `https://www.linkedin.com/in/dnlbbrg/`.
- Copy lives in one data file read by the image script, so a wording change is one edit plus one
  command. Daniel approves the copy at the visual review, not as a separate gate.

## Left to the builder

- Exact typefaces (with the justification note), layout of header and cards, image sizes, whether
  anything animates.
- README copy language (German suits the German-speaking audience of the channel; English suits
  GitHub; Daniel decides at review if the builder is unsure).
- The script that outlines text and writes the SVGs (lives in this repo, so later edits are one
  command).

## Decided by Daniel (2026-11-18)

- HA-Toniebox and HA-Apps stay off the profile (forks of other people's repos).
- The old unrelated forks are deleted.
- Deixis plugin appears under "More projects".
