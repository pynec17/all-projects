(function () {
  "use strict";

  var tocEl = document.getElementById("toc");
  var contentEl = document.getElementById("content");
  var railEl = document.getElementById("rail");
  var xpEl = document.getElementById("xp-pill");
  var searchEl = document.getElementById("search");
  var resultsEl = document.getElementById("search-results");
  var contentsBtn = document.getElementById("contents-btn");

  var ui = window.TSW_UI({ prefix: "ts-workbook:", onChange: refreshChrome });
  var esc = ui.esc, md = ui.md, el = ui.el;
  var route = null;

  function chapterNumber(level) {
    var n = 0;
    for (var i = 0; i <= ui.levelIndex(level.id); i++) if (ui.levels[i].kind === "chapter") n++;
    return n;
  }

  function labNumber(level) {
    var n = 0;
    for (var i = 0; i <= ui.levelIndex(level.id); i++) if (ui.levels[i].kind === "lab") n++;
    return n;
  }

  function levelLabel(level) {
    return level.kind === "lab" ? "Lab " + labNumber(level) : String(chapterNumber(level)).padStart(2, "0");
  }

  var GUIDE = { id: "guide", index: 0, label: "Guide", short: "Guide" };

  function sectionsFor(level) {
    if (level.kind === "lab") {
      return [GUIDE].concat(level.lab.tasks.map(function (t, i) {
        return { id: "tasks", index: i, label: t.title, short: "Task " + (i + 1), done: ui.isDone("lab", t.id) };
      }));
    }
    return [
      GUIDE,
      { id: "examples", index: 0, label: "Examples", short: "Examples" },
      { id: "quiz", index: 0, label: "Quiz", short: "Quiz", count: ui.sectionCounts(level, "theory") },
      { id: "challenges", index: 0, label: "Code challenges", short: "Challenges", count: ui.sectionCounts(level, "challenges") }
    ];
  }

  function hashFor(level, section, index) {
    return "#" + level.id + "/" + section + (index ? "/" + index : "");
  }

  // Where "Continue" should take you inside a level: its guide if you haven't
  // started it, otherwise the first unanswered question, challenge or task.
  function resumeHash(level) {
    if (ui.levelCounts(level).done === 0) return hashFor(level, "guide", 0);
    if (level.kind === "lab") {
      var t = level.lab.tasks.findIndex(function (task) { return !ui.isDone("lab", task.id); });
      return hashFor(level, "tasks", Math.max(0, t));
    }
    var q = level.chapter.theory.findIndex(function (item) { return !ui.isDone("theory", item.id); });
    if (q !== -1) return hashFor(level, "quiz", q);
    return hashFor(level, "challenges", 0);
  }

  // The level to continue: the last one you visited, unless it's finished.
  function resumeLevel() {
    var last = ui.levels[ui.levelIndex(ui.get("last"))];
    if (last) {
      var c = ui.levelCounts(last);
      if (c.done < c.total) return last;
    }
    return ui.firstUnfinished();
  }

  function parseHash() {
    var parts = location.hash.replace(/^#\/?/, "").split("/");
    if (!parts[0] || parts[0] === "home") return { home: true };
    if (parts[0] === "glossary") return { glossary: true, term: parts[1] || "" };
    var level = ui.levels[ui.levelIndex(parts[0])];
    if (!level) return { home: true };
    if (parts[1] === "theory") parts[1] = "quiz";   // old links
    var valid = level.kind === "lab" ? ["guide", "tasks"] : ["guide", "examples", "quiz", "challenges"];
    var section = valid.indexOf(parts[1]) === -1 ? valid[0] : parts[1];
    var index = Math.max(0, parseInt(parts[2], 10) || 0);
    if (section === "tasks") index = Math.min(index, level.lab.tasks.length - 1);
    return { level: level, section: section, index: index };
  }

  function isActiveSection(s) {
    return route.section === s.id && (s.id !== "tasks" || route.index === s.index);
  }

  function nextStop() {
    var level = route.level;
    var secs = sectionsFor(level);
    for (var i = 0; i < secs.length; i++) {
      if (isActiveSection(secs[i]) && i + 1 < secs.length) {
        return { href: hashFor(level, secs[i + 1].id, secs[i + 1].index), label: secs[i + 1].short + (secs[i + 1].id === "tasks" ? ": " + secs[i + 1].label : "") };
      }
    }
    var next = ui.levels[ui.levelIndex(level.id) + 1];
    if (!next) return null;
    var first = sectionsFor(next)[0];
    return { href: hashFor(next, first.id, 0), label: levelLabel(next) + " · " + next.title };
  }

  function prevStop() {
    var level = route.level;
    var secs = sectionsFor(level);
    for (var i = 0; i < secs.length; i++) {
      if (isActiveSection(secs[i]) && i > 0) {
        return { href: hashFor(level, secs[i - 1].id, secs[i - 1].index), label: secs[i - 1].short };
      }
    }
    return null;
  }

  function render() {
    route = parseHash();
    if (route.level) ui.set("last", route.level.id);
    document.body.classList.remove("toc-open");
    contentsBtn.setAttribute("aria-expanded", "false");
    refreshChrome();
    renderContent();
  }

  function refreshChrome() {
    if (!route) return;
    renderToc();
    renderRail();
    renderXp();
    renderChips();
  }

  function renderXp() {
    var s = ui.streak();
    xpEl.textContent = "⚡ " + ui.xp() + " XP" + (s ? " · 🔥 " + s : "");
  }

  function renderToc() {
    tocEl.innerHTML = "";
    var home = el("a", "toc-level toc-home" + (route.home ? " active" : ""));
    home.href = "#";
    home.innerHTML =
      '<span class="toc-mark" aria-hidden="true">⌂</span>' +
      '<span class="toc-num"></span>' +
      '<span class="toc-title">Start here</span>' +
      '<span class="toc-count"></span>';
    if (route.home) home.setAttribute("aria-current", "true");
    tocEl.appendChild(home);

    ui.levels.forEach(function (level) {
      var c = ui.levelCounts(level);
      var state = c.done === c.total ? "done" : (c.done > 0 ? "partial" : "");
      var active = level === route.level;
      var a = el("a", "toc-level kind-" + level.kind + (active ? " active" : "") + (state ? " " + state : ""));
      a.href = hashFor(level, sectionsFor(level)[0].id, 0);
      a.innerHTML =
        '<span class="toc-mark" aria-hidden="true">' + (state === "done" ? "✓" : (state === "partial" ? "◐" : "○")) + "</span>" +
        '<span class="toc-num">' + levelLabel(level) + "</span>" +
        '<span class="toc-title">' + esc(level.title) + "</span>" +
        '<span class="toc-count">' + c.done + "/" + c.total + "</span>";
      if (active) a.setAttribute("aria-current", "true");
      tocEl.appendChild(a);

      if (!active) return;
      sectionsFor(level).forEach(function (s) {
        var sub = el("a", "toc-sub" + (isActiveSection(s) ? " active" : ""));
        sub.href = hashFor(level, s.id, s.index);
        var right = "";
        if (s.count) right = '<span class="sub-count' + (s.count.done === s.count.total ? " done" : "") + '">' + s.count.done + "/" + s.count.total + "</span>";
        else if (s.id === "tasks") right = '<span class="sub-count' + (s.done ? " done" : "") + '">' + (s.done ? "✓" : "○") + "</span>";
        sub.innerHTML = '<span class="sub-label">' + esc(s.id === "tasks" ? s.short + " · " + s.label : s.label) + "</span>" + right;
        tocEl.appendChild(sub);
      });
    });

    var g = el("a", "toc-level toc-glossary" + (route.glossary ? " active" : ""));
    g.href = "#glossary";
    g.innerHTML =
      '<span class="toc-mark" aria-hidden="true">◆</span>' +
      '<span class="toc-num">A–Z</span>' +
      '<span class="toc-title">Glossary</span>' +
      '<span class="toc-count">' + ui.glossaryCount + "</span>";
    if (route.glossary) g.setAttribute("aria-current", "true");
    tocEl.appendChild(g);
  }

  function renderRail() {
    var today = ui.todayCount();
    var goal = ui.DAILY_GOAL;
    var streak = ui.streak();
    var t = ui.totals();
    var squares = "";
    for (var i = 0; i < goal; i++) squares += '<span class="' + (i < today ? "on" : "") + '"></span>';

    var upNext = "";
    var here = route.level || ui.firstUnfinished();
    var current = ui.levelCounts(here);
    if (current.done < current.total) {
      upNext = route.level
        ? "<strong>" + (current.total - current.done) + "</strong> left in " + esc(here.title) + "."
        : 'Next: <a href="' + hashFor(here, sectionsFor(here)[0].id, 0) + '">' + esc(levelLabel(here) + " · " + here.title) + "</a>";
    } else {
      var next = ui.firstUnfinished();
      upNext = next && ui.levelCounts(next).done < ui.levelCounts(next).total
        ? 'Next: <a href="' + hashFor(next, sectionsFor(next)[0].id, 0) + '">' + esc(levelLabel(next) + " · " + next.title) + "</a>"
        : "Everything's complete. Nice work.";
    }

    railEl.innerHTML =
      '<div class="rail-block"><h2>Today</h2><div class="goal">' + squares + "</div>" +
      (today >= goal ? "<strong>Daily goal done.</strong>" : "<strong>" + today + " of " + goal + "</strong> answers toward today's goal.") + "</div>" +
      '<div class="rail-block"><h2>Streak</h2>' +
      (streak ? "🔥 <strong>" + streak + " day" + (streak === 1 ? "" : "s") + "</strong> in a row." : "Answer something today to start a streak.") + "</div>" +
      '<div class="rail-block"><h2>Overall</h2><div class="bar"><span style="width:' + Math.round((t.done / t.total) * 100) + '%"></span></div>' +
      "<strong>" + t.done + " / " + t.total + "</strong> complete · " + ui.xp() + " XP</div>" +
      '<div class="rail-block"><h2>Up next</h2>' + upNext + "</div>" +
      '<div class="rail-block"><h2>Shortcuts</h2><span class="kbd">1</span>–<span class="kbd">4</span> pick an answer, <span class="kbd">Enter</span> check, <span class="kbd">←</span> <span class="kbd">→</span> move between questions, <span class="kbd">/</span> search.</div>';
  }

  function renderChips() {
    var chips = document.getElementById("chips");
    if (!chips || !route.level) return;
    chips.innerHTML = "";
    sectionsFor(route.level).forEach(function (s) {
      var a = el("a", "chip" + (isActiveSection(s) ? " active" : ""));
      a.href = hashFor(route.level, s.id, s.index);
      var extra = "";
      if (s.count) extra = '<span class="n">' + s.count.done + "/" + s.count.total + "</span>";
      else if (s.id === "tasks" && s.done) extra = '<span class="n">✓</span>';
      a.innerHTML = esc(s.short) + extra;
      chips.appendChild(a);
    });
  }

  function scrollToNth(selector, n) {
    if (!n) return;
    var target = contentEl.querySelectorAll(selector)[n];
    if (target) setTimeout(function () { target.scrollIntoView({ block: "start" }); window.scrollBy(0, -70); }, 0);
  }

  function longName(level) {
    return (level.kind === "lab" ? "Lab " + labNumber(level) : "Chapter " + chapterNumber(level)) + " · " + level.title;
  }

  function renderHome() {
    var t = ui.totals();
    var allDone = t.done === t.total;
    // "Started" means you've answered something or at least opened a chapter before.
    var started = t.done > 0 || ui.levelIndex(ui.get("last")) !== -1;
    var resume = started ? resumeLevel() : ui.levels[0];
    var rc = ui.levelCounts(resume);

    // Which chapter number each lab comes after, for the "Project Labs" note.
    var labAfter = ui.levels.filter(function (l) { return l.kind === "lab"; }).map(function (lab) {
      var prev = ui.levels[ui.levelIndex(lab.id) - 1];
      return chapterNumber(prev);
    });

    var steps = [
      ["Guide", "Read the explanation: the key syntax at a glance, then each idea with examples you can edit and run. Hover over or tap underlined terms for a quick definition."],
      ["Examples", "Short, simple examples first, then patterns you'll meet in real codebases."],
      ["Quiz", "One question at a time, to check the ideas have stuck. +10 XP each."],
      ["Challenges", "Write real TypeScript in the browser. It's type-checked by the actual compiler, then tested. +20 to 50 XP."]
    ];

    var wrap = el("div", "home");
    wrap.innerHTML =
      '<div class="crumb">TypeScript Workbook</div>' +
      "<h1>Learn TypeScript, building on the JavaScript you know</h1>" +
      '<p class="home-lede">This workbook teaches TypeScript from the beginning, for people who already write JavaScript. Each chapter explains one part of the language, shows it in action, then checks you\'ve got it with a quiz and code challenges, compiled by the real TypeScript compiler right here in the browser.</p>' +

      '<div class="home-continue">' +
      '<div class="home-continue-text">' +
      '<span class="k">' + (allDone ? "Everything's complete" : (started ? "Continue where you left off" : "Start here")) + "</span>" +
      "<strong>" + esc(longName(resume)) + "</strong>" +
      '<span class="home-continue-meta">' + (started ? rc.done + " of " + rc.total + " done" : "Begins with the guide: what TypeScript adds to JavaScript") + "</span>" +
      "</div>" +
      '<a class="btn primary home-go" href="' + resumeHash(resume) + '">' + (allDone ? "Review it →" : (started ? "Continue →" : "Start chapter 1 →")) + "</a>" +
      "</div>" +

      (t.done
        ? '<div class="home-progress"><div class="bar"><span style="width:' + Math.round((t.done / t.total) * 100) + '%"></span></div>' +
          "<span>" + t.done + " of " + t.total + " questions, challenges and lab tasks done · " + ui.xp() + " XP</span></div>"
        : "") +

      '<h2 class="home-h2">How each chapter works</h2>' +
      '<ol class="home-steps">' +
      steps.map(function (s, i) {
        return '<li><span class="home-step-num">' + (i + 1) + "</span><div><strong>" + s[0] + "</strong><p>" + s[1] + "</p></div></li>";
      }).join("") +
      "</ol>" +
      '<p class="home-note"><span class="home-lab-tag">Lab</span> After chapters ' + labAfter.slice(0, -1).join(", ") + " and " + labAfter[labAfter.length - 1] +
      ", a <strong>Project Lab</strong> gives you a small multi-file project in an editor: change the tsconfig, fix what the compiler finds, and see exactly what it emits.</p>" +

      '<h2 class="home-h2">Contents</h2>' +
      '<div class="home-contents" id="home-contents"></div>' +

      '<h2 class="home-h2">Also here</h2>' +
      '<div class="home-extras">' +
      '<a class="home-extra" href="#glossary"><strong>Glossary</strong><span>' + ui.glossaryCount + " key terms with short definitions, from <code>any</code> to <code>unknown</code>.</span></a>" +
      '<button type="button" class="home-extra" id="home-search"><strong>Search</strong><span>Press <span class="kbd">/</span> to search guides, terms and questions.</span></button>' +
      '<div class="home-extra"><strong>Progress</strong><span>Saved in this browser. Answer something each day to build a streak.</span></div>' +
      "</div>";
    contentEl.appendChild(wrap);

    var list = document.getElementById("home-contents");
    ui.levels.forEach(function (level) {
      var c = ui.levelCounts(level);
      var state = c.done === c.total ? "done" : (c.done > 0 ? "partial" : "");
      var row = el("a", "home-row kind-" + level.kind + (state ? " " + state : "") + (level === resume && !allDone ? " current" : ""));
      row.href = c.done ? resumeHash(level) : hashFor(level, "guide", 0);
      row.innerHTML =
        '<span class="home-row-mark" aria-hidden="true">' + (state === "done" ? "✓" : (state === "partial" ? "◐" : "○")) + "</span>" +
        '<span class="home-row-num">' + levelLabel(level) + "</span>" +
        '<span class="home-row-body"><span class="home-row-title">' + esc(level.title) + "</span>" +
        '<span class="home-row-blurb">' + md(level.kind === "lab" ? level.lab.blurb : level.chapter.blurb) + "</span></span>" +
        '<span class="home-row-count">' + c.done + "/" + c.total + "</span>";
      list.appendChild(row);
    });

    document.getElementById("home-search").addEventListener("click", function () { searchEl.focus(); });
  }

  function renderContent() {
    var level = route.level;
    contentEl.innerHTML = "";
    window.scrollTo(0, 0);

    if (route.home) {
      renderHome();
      return;
    }

    if (route.glossary) {
      contentEl.appendChild(el("div", "level-head",
        '<div class="crumb">Reference</div><h1>Glossary</h1>' +
        '<p class="blurb">Every key term in the workbook, in one place. Underlined terms elsewhere show these definitions when you hover or tap them.</p>'));
      contentEl.appendChild(ui.renderGlossary(route.term));
      return;
    }

    var head = el("div", "level-head");
    head.innerHTML =
      '<div class="crumb">' + (level.kind === "lab" ? "Project lab " + labNumber(level) : "Chapter " + chapterNumber(level)) + "</div>" +
      "<h1>" + esc(level.title) + "</h1>" +
      '<p class="blurb">' + md(level.kind === "lab" ? level.lab.blurb : level.chapter.blurb) + "</p>" +
      '<div class="chips" id="chips"></div>';
    contentEl.appendChild(head);
    renderChips();

    var body = el("div", "section-body");
    contentEl.appendChild(body);

    if (route.section === "quiz") {
      body.appendChild(ui.renderDeck(level.chapter, route.index, function (i) {
        history.replaceState(null, "", hashFor(level, "quiz", i));
        route.index = i;
      }));
    } else if (route.section === "challenges") {
      body.appendChild(el("p", "section-intro", "Write real TypeScript. Run & check type-checks it with the actual compiler in strict mode, then runs tests against it."));
      level.chapter.challenges.forEach(function (c) { body.appendChild(ui.renderChallenge(c)); });
      scrollToNth(".challenge", route.index);
    } else if (route.section === "examples") {
      body.appendChild(ui.renderExamples(level.chapter));
      scrollToNth(".example", route.index);
    } else if (route.section === "guide") {
      var guide = ui.renderGuide(level);
      body.appendChild(guide);
      if (route.index) guide.scrollToSection(route.index - 1);
    } else if (route.section === "tasks") {
      body.appendChild(ui.renderLabTask(level.lab.tasks[route.index]));
    }

    var nav = el("div", "next-nav");
    var prev = prevStop();
    var next = nextStop();
    if (prev) nav.appendChild(el("a", "next-link", '<span class="k">← Back</span>' + esc(prev.label)));
    if (next) nav.appendChild(el("a", "next-link forward", '<span class="k">Up next →</span>' + esc(next.label)));
    if (prev) nav.children[0].href = prev.href;
    if (next) nav.lastChild.href = next.href;
    contentEl.appendChild(nav);
  }

  function showResults() {
    var hits = ui.search(searchEl.value);
    resultsEl.innerHTML = "";
    if (searchEl.value.trim().length < 2) { resultsEl.hidden = true; return; }
    if (!hits.length) {
      resultsEl.appendChild(el("div", "no-results", "No matches. Try a keyword like “generic” or “tsconfig”."));
    }
    hits.forEach(function (hit) {
      var b = el("button", "result",
        '<span class="result-kind">' + esc(hit.level ? hit.kind + " · " + levelLabel(hit.level) + " " + hit.level.title : hit.kind) + "</span>" +
        '<span class="result-text">' + esc(hit.text) + "</span>");
      b.type = "button";
      b.addEventListener("click", function () { choose(hit); });
      resultsEl.appendChild(b);
    });
    resultsEl.hidden = false;
  }

  function choose(hit) {
    searchEl.value = "";
    resultsEl.hidden = true;
    searchEl.blur();
    var target = hit.href || hashFor(hit.level, hit.section, hit.index);
    if (location.hash === target) render(); else location.hash = target;
  }

  searchEl.addEventListener("input", showResults);
  searchEl.addEventListener("focus", showResults);
  searchEl.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { searchEl.value = ""; resultsEl.hidden = true; searchEl.blur(); }
    if (e.key === "Enter") {
      var hits = ui.search(searchEl.value);
      if (hits.length) choose(hits[0]);
    }
    if (e.key === "ArrowDown") {
      var first = resultsEl.querySelector(".result");
      if (first) { e.preventDefault(); first.focus(); }
    }
  });
  resultsEl.addEventListener("keydown", function (e) {
    var items = Array.prototype.slice.call(resultsEl.querySelectorAll(".result"));
    var i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown" && i < items.length - 1) { e.preventDefault(); items[i + 1].focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); (i > 0 ? items[i - 1] : searchEl).focus(); }
    if (e.key === "Escape") { resultsEl.hidden = true; searchEl.focus(); }
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search")) resultsEl.hidden = true;
  });

  contentsBtn.addEventListener("click", function () {
    var open = document.body.classList.toggle("toc-open");
    contentsBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("keydown", function (e) {
    var t = e.target;
    var typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (e.key === "/" && !typing) {
      e.preventDefault();
      searchEl.focus();
      return;
    }
    ui.handleKey(e);
  });

  document.getElementById("bionic-slot").outerHTML = ui.bionicButton();
  ui.setupBionic(["#content", ".term-pop"]);

  window.addEventListener("hashchange", render);
  render();
})();
