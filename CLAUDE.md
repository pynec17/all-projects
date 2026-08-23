# Project: My Projects

A static site that indexes small web projects — tools, games, experiments, whatever —
and links to each one. It's served by GitHub Pages straight from the `main` branch.
There is **no build step** and **no framework** — plain HTML, CSS, and JavaScript only.

## Repo layout

```
/
├── index.html      the projects index (do NOT hand-edit the project list here)
├── projects.js     the list of projects — THIS is where projects are registered
├── word-counter/   each project lives in its own folder with an index.html
│   └── index.html
└── number-hunt/
    └── index.html
```

`index.html` reads the `window.PROJECTS` array from `projects.js` and renders the
index automatically. Adding a project is two steps: create its folder, then add
one entry to `projects.js`.

## How to add a new project

When asked to build something and add it (e.g. "build X and add it to my projects"):

1. **Create a folder** named with a short, descriptive, lowercase-hyphenated slug
   (e.g. `unit-converter/`, `snake/`, `color-tester/`). Slugs must be unique.

2. **Build the project** as a single self-contained `index.html` inside that folder.
   - Vanilla HTML/CSS/JS by default. No dependencies or build tooling unless the
     user asks for them.
   - Must work as a static file over `https://` on GitHub Pages — use only
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

- Pushing to `main` triggers the GitHub Pages deploy, so a merged change is what
  makes the site update.
- Keep each change to one project plus its `projects.js` entry so pull requests
  stay easy to review from a phone.
- Commit messages: short and plain, e.g. `Add unit-converter`.
