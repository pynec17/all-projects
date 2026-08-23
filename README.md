# My Projects

A tiny static site that indexes small web projects — tools, games, experiments —
and links to each one. No build step, no framework: just HTML, CSS, and JS. Every
project lives in its own folder and gets one line in `projects.js`; the index
builds itself from that list.

## Run it locally

The index loads `projects.js` as a normal script, so you can just **double-click
`index.html`** to preview it — no local server needed.

## Add a project (by hand)

1. Make a folder, e.g. `unit-converter/`, and put a self-contained `index.html` in it.
2. Add an entry to the array in `projects.js`:
   ```js
   { slug: "unit-converter", title: "Unit Converter", description: "One line.", type: "tool", added: "2026-07-26" }
   ```
3. Save. The index now shows it.

## Add a project (from your phone, via Claude Code on the web)

1. In the Claude app, open the **Code** tab and start a session on this repo.
2. Say what you want, e.g. *"Build a small unit converter and add it to my projects."*
3. Claude builds it on a branch and opens a **pull request**.
4. Review and **merge** the PR (you can do this from the GitHub mobile app/site).
5. Merging into `main` triggers the deploy — the live site updates on next load.

`CLAUDE.md` holds the conventions (folder per project, register in `projects.js`,
match the style), so a short prompt is enough.

## Deploy (GitHub Pages)

1. Push this repo to GitHub.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Choose branch `main`, folder `/ (root)`, and save.
4. Your site goes live at `https://<username>.github.io/<repo>/` in a minute or two.
5. (Optional) Add a custom domain later under the same Pages settings.

## What's included

Two example projects so the structure is clear:
- `number-hunt/` — a small game
- `word-counter/` — a small tool

Replace or delete them as you like, then start adding your own.
