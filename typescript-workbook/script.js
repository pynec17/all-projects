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
      { id: "quiz", index: 0, label: "Quiz", short: "Quiz", count: ui.sectionCounts(level, "theory") },
      { id: "challenges", index: 0, label: "Code challenges", short: "Challenges", count: ui.sectionCounts(level, "challenges") },
      { id: "examples", index: 0, label: "Real-world examples", short: "Examples" }
    ];
  }

  function hashFor(level, section, index) {
    return "#" + level.id + "/" + section + (index ? "/" + index : "");
  }

  function parseHash() {
    var parts = location.hash.replace(/^#\/?/, "").split("/");
    var level = ui.levels[ui.levelIndex(parts[0])];
    if (!level) level = ui.levels[ui.levelIndex(ui.get("last"))] || ui.firstUnfinished();
    if (parts[1] === "theory") parts[1] = "quiz";   // old links
    var valid = level.kind === "lab" ? ["guide", "tasks"] : ["guide", "quiz", "challenges", "examples"];
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
    ui.set("last", route.level.id);
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
  }

  function renderRail() {
    var today = ui.todayCount();
    var goal = ui.DAILY_GOAL;
    var streak = ui.streak();
    var t = ui.totals();
    var squares = "";
    for (var i = 0; i < goal; i++) squares += '<span class="' + (i < today ? "on" : "") + '"></span>';

    var upNext = "";
    var current = ui.levelCounts(route.level);
    if (current.done < current.total) {
      upNext = "<strong>" + (current.total - current.done) + "</strong> left in " + esc(route.level.title) + ".";
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
    if (!chips) return;
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

  function renderContent() {
    var level = route.level;
    contentEl.innerHTML = "";
    window.scrollTo(0, 0);

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
      body.appendChild(el("p", "section-intro", "Patterns you'll meet in real codebases, and why they're typed the way they are."));
      level.chapter.examples.forEach(function (ex) { body.appendChild(ui.renderExample(ex)); });
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
        '<span class="result-kind">' + esc(hit.kind + " · " + levelLabel(hit.level) + " " + hit.level.title) + "</span>" +
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
    var target = hashFor(hit.level, hit.section, hit.index);
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

  window.addEventListener("hashchange", render);
  render();
})();
