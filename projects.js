/*
 * projects.js — the list of projects shown on the index.
 *
 * This is the ONLY file you edit to add a project to the list.
 * index.html reads this array and builds the index automatically.
 *
 * Each entry:
 *   slug        folder name for the project, e.g. "word-counter"   (required)
 *   title       display name shown on the index                    (required)
 *   description one short line under the title                      (optional)
 *   type        a short label, e.g. "tool" / "game" / "experiment" (optional)
 *   added       ISO date "YYYY-MM-DD" — newest sorts to the top     (optional)
 *   href        override the link if it isn't at ./slug/            (optional)
 *
 * To add a project: copy a line, change the values, save. That's it.
 */
window.PROJECTS = [
  {
    slug: "file-upload",
    title: "File Upload",
    description: "Browse or drag a file in and hold it on the page, ready for processing.",
    type: "tool",
    added: "2026-09-07"
  },
  {
    slug: "react-questions",
    title: "React Questions",
    description: "Write real React components and get them auto-tested, live in the browser.",
    type: "tool",
    added: "2026-08-25"
  },
  {
    slug: "countdown-numbers",
    title: "Countdown Numbers",
    description: "Combine six numbers to hit the target before the 30-second clock runs out.",
    type: "game",
    added: "2026-08-03"
  },
  {
    slug: "number-hunt",
    title: "Number Hunt",
    description: "Guess the hidden number in as few tries as you can.",
    type: "game",
    added: "2026-01-05"
  }
];
