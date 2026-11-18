# GitHub Profile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stock-widget profile README of `dnlbbrg/dnlbbrg` with an editorial, image-based profile that advertises Daniel's projects to the Home Assistant community.

**Architecture:** One Node script (`scripts/build.mjs`) reads `content/profile.json` (all copy and URLs) and font files in `fonts/`, outlines all text to SVG paths with opentype.js and writes a light and a dark SVG per image into `img/`. `README.md` only arranges `<picture>` elements and keeps the blog post block. Guard tests scan copy, SVGs and README for emojis, dashes and missing alt texts.

**Tech Stack:** Node 22 (ESM), `opentype.js`, `node:test`, `gh` CLI, Playwright (render screenshots).

**Spec:** `docs/superpowers/specs/2026-11-18-github-profile-design.md`

## Global Constraints

- No emojis anywhere (README, alt texts, copy, commit-visible text).
- No `—` or `–` as punctuation in any text; German copy with real umlauts.
- No stock widgets: capsule-render, readme-typing-svg, shields.io, skillicons, streak/activity/snake, komarev, profile-3d-contrib.
- No books, press, photography, Pixelgranaten, Kamerakram, Instagram, tageslicht.studio.
- Palette: ink `#10172B`, coral `#F0665B` (small text on light `#C0392F`), mint `#89C9BA` (small text `#2F7D6B`), light ground `#F9F9F9`, dark ground matches GitHub `#0D1117` or transparent.
- Typefaces: not Instrument Serif, Hanken Grotesk, nor any banned face without a written reason in `docs/typography.md`; fonts must have a licence allowing embedding as outlines (OFL).
- All SVG text outlined to paths; no `<text>`, no external `href` in SVGs.
- English for file names, code, commits. No AI attribution trailers.
- LinkedIn: `https://www.linkedin.com/in/dnlbbrg/`. Alles Automatisch subscriber figure, if shown: 14.700 (as of 2026-11-18).
- Work on branch `redesign`; `main` changes only in Task 5.

## Review Focus

1. Dark mode: an image whose dark variant is missing or still has a light ground shows a bright block on GitHub dark. Test: every image key has both `-light.svg` and `-dark.svg` (Task 1 guard test).
2. Narrow mobile width: wide SVGs with small text become unreadable at 390 px. Check: the Task 4 screenshot at 390 px, smallest body text visibly legible; cards stack, not side by side, if needed.
3. Blog post workflow rewriting the README: `blog-post-workflow` must still find `<!-- BLOG-POST-LIST:START -->`/`END` on `main`. Test: guard test asserts both markers exist exactly once.
4. Dead links: a project URL that 404s on a public profile. Test: `scripts/check-links.mjs` exits 1 on any non-2xx/3xx (Task 3).
5. Copy drift into banned content (emoji in a project line, dash in a description). Test: guard test over `content/profile.json` and `README.md` (Task 1).

---

### Task 1: Copy data, scaffold and guard tests

**Files:**
- Create: `package.json` (`"type": "module"`, scripts `build`, `test`, `links`), `.gitignore` (`node_modules`)
- Create: `content/profile.json`
- Create: `test/guards.test.mjs`

**Interfaces:**
- Produces: `content/profile.json` shape
  `{ header: {name, line}, sections: {ha, videos, more, contact}, ha: [{key, title, line, url, meta?}], more: [{key, title, line, url}], contact: [{label, url}], bio }`
  Keys are kebab-case and become image file names.

- [ ] **Step 1:** Write the copy from public sources only (live sites, current README, skill `daniel-boberg` `references/projekte.md`, `kanaele.md`). `ha`: alles-automatisch, smarthome-finder. `more`: folnaro, brick-storage, wortglut, steadycost, qrvisit, life-counter, deixis (URL `https://github.com/dnlbbrg/deixis-plugin`). Contact: alles-automatisch.de, danielboberg.de, YouTube, LinkedIn. Bio: one line, at most 160 chars. Language: pick one, note the choice in the commit message.
- [ ] **Step 2:** Write `test/guards.test.mjs` with tests:
  - `no emoji in copy and README`: regex `/\p{Extended_Pictographic}/u` finds nothing in `content/profile.json` and `README.md`.
  - `no dash punctuation`: `/[—–]/` finds nothing in the same files.
  - `every image has both themes`: for every key in `ha`, `more`, plus `header`, section keys and `contact`, `img/<key>-light.svg` and `img/<key>-dark.svg` exist.
  - `svgs are outlined`: no file in `img/` contains `<text` or `href="http`.
  - `readme keeps blog markers`: `BLOG-POST-LIST:START` and `BLOG-POST-LIST:END` each occur once.
  - `readme has no stock widgets`: none of `capsule-render`, `readme-typing-svg`, `shields.io`, `skillicons`, `komarev`, `streak-stats`, `activity-graph`, `snake` occurs.
  - `every img has alt`: every `<img` in README has a non-empty `alt`.
- [ ] **Step 3:** Run `node --test`. Expected: FAIL (images missing, README still old).
- [ ] **Step 4:** Commit `Add profile copy and guard tests`.

### Task 2: Typography and image generator

**Files:**
- Create: `docs/typography.md` (chosen faces, why they fit the subject, licence)
- Create: `fonts/*.ttf|otf` (committed, OFL)
- Create: `scripts/build.mjs`
- Create: `img/*.svg` (generated, committed)
- Test: `test/build.test.mjs`

**Interfaces:**
- Consumes: `content/profile.json` (Task 1).
- Produces: `npm run build` writes `img/<key>-<theme>.svg` for `header`, `section-ha`, `section-videos`, `section-more`, each `ha` key, each `more` key, `contact`; `export function renderText(font, text, x, y, size, fill): string` (SVG path markup).

- [ ] **Step 1:** Choose typefaces with skill `frontend-design` `reference/typography.md`: display plus text, from the subject (automation, home, calm editorial). Compare at least two pairings rendered at real size; write the reason into `docs/typography.md`.
- [ ] **Step 2:** Write `test/build.test.mjs`: `renderText` returns a string starting with `<path` and no `<text`; running the build twice produces byte-identical files (deterministic).
- [ ] **Step 3:** Run `node --test test/build.test.mjs`. Expected: FAIL.
- [ ] **Step 4:** Implement `scripts/build.mjs`. Layout: header 1280 wide, HA cards full width (one per row), more-projects as compact rows with hairline dividers, section headings as small labelled images. Light and dark per image from the palette. Optional animation: only SMIL opacity/transform, once, finished-looking static frame.
- [ ] **Step 5:** `npm run build && node --test`. Expected: build tests PASS; `every image has both themes` and `svgs are outlined` PASS.
- [ ] **Step 6:** Open the SVGs side by side in a local HTML page (scratchpad, not the repo) on light and dark ground; look at every one.
- [ ] **Step 7:** Commit `Generate outlined profile images`.

### Task 3: README and cleanup

**Files:**
- Modify: `README.md` (full rewrite)
- Delete: `.github/workflows/snake.yml`, `profile-3d-contrib/`
- Keep: `.github/workflows/blog-posts.yml` unchanged
- Create: `scripts/check-links.mjs`

**Interfaces:**
- Consumes: `img/*.svg` names (Task 2), URLs from `content/profile.json`.

- [ ] **Step 1:** Rewrite `README.md`: header, section HA with HA cards, section videos with the unchanged marker block, section more with project rows, contact. Each image: `<a href="URL"><picture><source media="(prefers-color-scheme: dark)" srcset="img/K-dark.svg"><img src="img/K-light.svg" alt="TEXT" width="100%"></picture></a>`; alt = the image's readable copy.
- [ ] **Step 2:** `git rm` snake workflow and `profile-3d-contrib/`.
- [ ] **Step 3:** Implement `scripts/check-links.mjs`: collect all `href` from README and URLs from `profile.json`, HEAD (fallback GET) each, exit 1 on any status outside 200 to 399, print failures.
- [ ] **Step 4:** `node --test && node scripts/check-links.mjs`. Expected: all PASS, exit 0.
- [ ] **Step 5:** Commit `Rewrite the profile README around the new images`.

### Task 4: Render check on the branch and Daniel's review

- [ ] **Step 1:** `git push -u origin redesign` (public repo, workflows are schedule-only, no cost).
- [ ] **Step 2:** Playwright screenshots of `https://github.com/dnlbbrg/dnlbbrg/tree/redesign` at 1440 and 390 px, GitHub light and dark (set `colorScheme`), browser closed in `finally`. Script in scratchpad.
- [ ] **Step 3:** Look at every screenshot: no bright blocks in dark, text legible at 390, every image loaded.
- [ ] **Step 4:** Put screenshots plus the copy into `~/Desktop/GitHub-Profil/index.html`, open it, Daniel reviews look and copy. Fix rounds go back to Task 2/3; at most two rounds without progress.

### Task 5: Go live, profile settings, cleanup

- [ ] **Step 1:** After Daniel's approval: `git checkout main && git pull --rebase && git merge --ff-only redesign && git push`.
- [ ] **Step 2:** `gh api -X PATCH user -f name="Daniel Boberg" -f blog="https://alles-automatisch.de" -f bio="<bio from profile.json>"`; read back with `gh api user --jq '{name,bio,blog}'`.
- [ ] **Step 3:** Pin `deixis-plugin` (web UI: Customize your pins; no API). Ask Daniel to click it if no browser session is available.
- [ ] **Step 4:** For each of `core-js`, `firebase-import`, `keep-a-changelog`, `Creative-Commons-Markdown`, `dice-css`: `gh repo view dnlbbrg/<name> --json isFork,parent` (must be a fork), then `gh repo delete dnlbbrg/<name> --yes`. Needs `delete_repo` scope (`gh auth refresh -s delete_repo`).
- [ ] **Step 5:** Ask Daniel for Go, then `git push origin --delete output redesign`.
- [ ] **Step 6:** Screenshots of `https://github.com/dnlbbrg` light and dark, desktop and 390 px; look at them; trigger `gh workflow run blog-posts.yml` once (public repo, free) and confirm the README still renders with the video list.
- [ ] **Step 7:** Move `~/Desktop/GitHub-Profil/` contents away (screenshots deleted, nothing left on the Desktop).
