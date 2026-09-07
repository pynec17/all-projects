# Project: My Projects

A static site that indexes small web projects — tools, games, experiments, whatever —
and links to each one. It's served by GitHub Pages straight from the `main` branch.
There is **no build step** and **no framework** — plain HTML, CSS, and JavaScript only.

## Repo layout

```
/
├── index.html      the projects index (do NOT hand-edit the project list here)
├── projects.js     the list of projects — THIS is where projects are registered
├── word-counter/   each project lives in its own folder with index.html/style.css/script.js
│   ├── index.html
│   ├── style.css
│   └── script.js
└── number-hunt/
    ├── index.html
    ├── style.css
    └── script.js
```

`index.html` (root) reads the `window.PROJECTS` array from `projects.js` and renders
the index automatically. Adding a project is two steps: create its folder, then add
one entry to `projects.js`.

## How to add a new project

When asked to build something and add it (e.g. "build X and add it to my projects"):

1. **Create a folder** named with a short, descriptive, lowercase-hyphenated slug
   (e.g. `unit-converter/`, `snake/`, `color-tester/`). Slugs must be unique.

2. **Build the project** as three files inside that folder: `index.html`,
   `style.css`, and `script.js`. This is the standard, expected structure for a
   small web project (a single inlined `index.html` reads as a prototype/snippet,
   not a finished piece — worth avoiding in anything that doubles as a portfolio).
   - `index.html` links the other two: `<link rel="stylesheet" href="style.css">`
     in `<head>`, `<script src="script.js"></script>` before `</body>`.
   - Vanilla HTML/CSS/JS by default. No dependencies or build tooling unless the
     user asks for them.
   - Must work as static files over `https://` on GitHub Pages — use only
     **relative paths** and no server-side code.
   - Include a back link to the index in the top-left corner:
     `<a href="../">&#9664; INDEX</a>`
   - Make it responsive and usable on a phone.

3. **Register it in `projects.js`** by adding one object to `window.PROJECTS`:
   ```js
   {
     slug: "unit-converter",
     title: "Unit Converter",
     description: "One line describing what it does.",
     type: "tool",          // e.g. tool / game / experiment / app — keep it short
     added: "YYYY-MM-DD"    // today's date; newest sorts to the top
   }
   ```

4. **Do not edit `index.html`** to add the project — it picks up new entries from
   `projects.js` on its own.

## Visual style (match this so projects feel like a set)

The index uses a warm paper background with a terracotta accent:

- Background `#f6f1e7`, surface `#fffdf8`, text `#221d16`, muted text `#8b8171`,
  accent `#cf5628`.
- Headings: `Fraunces` (italic, serif). Labels/numbers/tags: `IBM Plex Mono`. Body:
  system sans. (Both fonts load from Google Fonts.)
- Keep it light, warm, and legible; the terracotta is the only accent. A project can
  have its own character, but leaning on these tokens keeps the collection coherent.

## Git / deployment notes

- **No PR workflow.** This is a single-user repo. Once an idea has been discussed
  in chat and confirmed, just build it, commit, and push straight to `main` —
  don't open a pull request or ask for a merge. Only stop to check in if
  something about the request is genuinely unclear or worth discussing first.
- Keep each commit to one project plus its `projects.js` entry.
- Commit messages: short and plain, e.g. `Add unit-converter`.
- Pushing to `main` triggers the GitHub Pages deploy (classic branch-based Pages,
  not an Actions workflow). The live site is at `https://pynec17.github.io/all-projects/`
  — note the GitHub repo itself is named `all-projects` even though this local
  folder is `all-projects-clean`.
- **After pushing a new/updated project, confirm the deploy finished before
  replying**, then send the direct link to that project's page (not just the
  index) so it can be opened immediately:
  1. `git rev-parse HEAD` for the pushed commit SHA.
  2. Poll `gh api repos/pynec17/all-projects/pages/builds/latest` until `status`
     is `built` and `commit` matches that SHA (a few seconds to ~1 minute).
  3. Reply with `https://pynec17.github.io/all-projects/<slug>/`.
