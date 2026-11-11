(function () {
  "use strict";

  var app = document.getElementById("app");
  var drawer = document.getElementById("drawer");
  var drawerBody = document.getElementById("drawer-body");
  var drawerTitle = document.getElementById("drawer-title");
  var scrim = document.getElementById("scrim");
  var toastEl = document.getElementById("toast");

  var ui = window.TSW_UI({ prefix: "ts-quest:", onChange: onProgress });
  var esc = ui.esc, el = ui.el;
  var route = null;
  var snapshot = takeSnapshot();
  var toastTimer = null;

  function levelLabel(level) {
    var c = 0, l = 0;
    for (var i = 0; i <= ui.levelIndex(level.id); i++) {
      if (ui.levels[i].kind === "lab") l++; else c++;
    }
    return level.kind === "lab" ? "LAB " + l : String(c).padStart(2, "0");
  }

  function stars(level) {
    var c = ui.levelCounts(level);
    var n = c.done === c.total ? 3 : Math.floor((c.done / c.total) * 3);
    return "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n);
  }

  var GUIDE = { id: "guide", index: 0, label: "Guide" };

  function sectionsFor(level) {
    if (level.kind === "lab") {
      return [GUIDE].concat(level.lab.tasks.map(function (t, i) {
        return { id: "tasks", index: i, label: "Task " + (i + 1), done: ui.isDone("lab", t.id) };
      }));
    }
    var th = ui.sectionCounts(level, "theory");
    var ch = ui.sectionCounts(level, "challenges");
    return [
      GUIDE,
      { id: "examples", index: 0, label: "Examples" },
      { id: "quiz", index: 0, label: "Quiz", count: th },
      { id: "challenges", index: 0, label: "Challenges", count: ch }
    ];
  }

  function hashFor(level, section, index) {
    return "#" + level.id + (section ? "/" + section + (index ? "/" + index : "") : "");
  }

  function resumeHash(level) {
    // A level you haven't started opens on its guide.
    if (ui.levelCounts(level).done === 0) return hashFor(level, "guide", 0);
    if (level.kind === "lab") {
      var t = level.lab.tasks.findIndex(function (task) { return !ui.isDone("lab", task.id); });
      return hashFor(level, "tasks", Math.max(0, t));
    }
    var q = level.chapter.theory.findIndex(function (item) { return !ui.isDone("theory", item.id); });
    if (q !== -1) return hashFor(level, "quiz", q);
    return hashFor(level, "challenges", 0);
  }

  function parseHash() {
    var parts = location.hash.replace(/^#\/?/, "").split("/");
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

  function takeSnapshot() {
    var unlocked = {};
    ui.levels.forEach(function (l) { unlocked[l.id] = ui.levelUnlocked(l); });
    var complete = {};
    ui.levels.forEach(function (l) { var c = ui.levelCounts(l); complete[l.id] = c.done === c.total; });
    return { xp: ui.xp(), unlocked: unlocked, complete: complete };
  }

  function onProgress() {
    var before = snapshot;
    snapshot = takeSnapshot();
    var lines = [];
    var gained = snapshot.xp - before.xp;
    if (gained > 0) lines.push("+" + gained + " XP");
    ui.levels.forEach(function (l) {
      if (snapshot.complete[l.id] && !before.complete[l.id]) lines.push("Level complete: " + l.title + " ★★★");
      if (snapshot.unlocked[l.id] && !before.unlocked[l.id]) lines.push("Unlocked: " + levelLabel(l) + " " + l.title);
    });
    if (lines.length) toast(lines);
    renderStats();
    renderTabs();
  }

  function toast(lines) {
    toastEl.innerHTML = lines.map(function (l, i) { return '<div class="' + (i === 0 ? "toast-main" : "toast-sub") + '">' + esc(l) + "</div>"; }).join("");
    toastEl.hidden = false;
    toastEl.classList.remove("show");
    void toastEl.offsetWidth;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, lines.length > 1 ? 3600 : 1800);
  }

  function pills() {
    var s = ui.streak();
    return '<span class="pill xp">⚡ ' + ui.xp() + "</span>" +
      '<span class="pill streak" title="Day streak">🔥 ' + s + "</span>";
  }

  function renderStats() {
    document.querySelectorAll("[data-stats]").forEach(function (node) { node.innerHTML = pills(); });
  }

  function render() {
    route = parseHash();
    closeDrawer();
    window.scrollTo(0, 0);
    if (route.home) renderHome();
    else if (route.glossary) renderGlossaryPage();
    else renderLevel();
  }

  function renderGlossaryPage() {
    document.body.className = "glossary-view";
    app.innerHTML =
      '<header class="level-bar">' +
      '<a class="map-link" href="#">◀ Map</a>' +
      '<span class="level-name">Glossary</span>' +
      ui.bionicButton("bar-bionic glossary-bionic") +
      '<div class="stats" data-stats></div>' +
      "</header>" +
      '<main class="level-main">' +
      '<div class="level-intro"><h1>Glossary</h1><p class="blurb">Every key term in one place. Underlined terms in guides and examples show these definitions when you hover over them or tap them.</p></div>' +
      '<div id="glossary"></div>' +
      "</main>";
    renderStats();
    document.getElementById("glossary").appendChild(ui.renderGlossary(route.term));
  }

  function renderHome() {
    document.body.className = "home";
    var t = ui.totals();
    var today = ui.todayCount();
    var goal = ui.DAILY_GOAL;
    var squares = "";
    for (var i = 0; i < goal; i++) squares += '<span class="' + (i < today ? "on" : "") + '"></span>';
    var resume = ui.firstUnfinished();
    var rc = ui.levelCounts(resume);

    app.innerHTML =
      '<header class="home-head">' +
      '<a class="back" href="../">&#9664; INDEX</a>' +
      '<div class="title-row"><h1>TypeScript Quest</h1><div class="stats" data-stats></div></div>' +
      '<p class="tagline">Learn TypeScript one level at a time. Get halfway through a level to unlock the next one, and earn XP for everything you solve.</p>' +
      '<div class="home-links"><a class="glossary-link" href="#glossary">Glossary · ' + ui.glossaryCount + " terms →</a>" + ui.bionicButton() + "</div>" +
      '<div class="goal-row"><div class="goal">' + squares + '</div><span>' +
      (today >= goal ? "Daily goal done" : today + " / " + goal + " today") + '</span><span class="overall">' + Math.round((t.done / t.total) * 100) + "% complete</span></div>" +
      "</header>" +
      '<main class="map"><div class="tiles" id="tiles"></div>' +
      '<a class="continue" href="' + resumeHash(resume) + '"><span class="continue-text">' +
      (rc.done === rc.total ? "Everything's complete. Replay any level." : (rc.done ? "Continue " : "Start ") + "<strong>" + esc(resume.title) + "</strong> · " + rc.done + "/" + rc.total) +
      '</span><span class="play">Play →</span></a></main>';

    renderStats();
    var tiles = document.getElementById("tiles");
    ui.levels.forEach(function (level) {
      var c = ui.levelCounts(level);
      var unlocked = ui.levelUnlocked(level);
      var state = !unlocked ? "locked" : (c.done === c.total ? "done" : (level === resume ? "current" : (c.done ? "started" : "open")));
      var a = el("a", "tile " + state + (level.kind === "lab" ? " is-lab" : ""));
      a.href = resumeHash(level);
      var foot;
      if (state === "locked") foot = '<span class="tile-foot">🔒 locked</span>';
      else if (state === "current" || state === "started") foot = '<span class="tile-bar"><span style="width:' + Math.round((c.done / c.total) * 100) + '%"></span></span>';
      else foot = '<span class="tile-foot">' + (level.kind === "lab" ? "editor · " : "") + stars(level) + "</span>";
      a.innerHTML =
        '<span class="tile-num">' + levelLabel(level) + (state === "current" ? " · now" : "") + "</span>" +
        '<span class="tile-title">' + esc(level.title) + "</span>" +
        '<span class="tile-count">' + c.done + "/" + c.total + "</span>" + foot;
      a.setAttribute("aria-label", levelLabel(level) + " " + level.title + ", " + c.done + " of " + c.total + " done" + (state === "locked" ? ", locked" : ""));
      if (state === "locked") {
        a.addEventListener("click", function (e) {
          var prev = ui.levels[ui.levelIndex(level.id) - 1];
          if (!confirm("This level unlocks when you're halfway through " + prev.title + ". Open it anyway?")) e.preventDefault();
        });
      }
      tiles.appendChild(a);
    });
  }

  function renderTabs() {
    var tabs = document.getElementById("tabs");
    if (!tabs || !route || route.home) return;
    tabs.innerHTML = "";
    sectionsFor(route.level).forEach(function (s) {
      var active = route.section === s.id && (s.id !== "tasks" || route.index === s.index);
      var a = el("a", "tab" + (active ? " active" : ""));
      a.href = hashFor(route.level, s.id, s.index);
      var extra = s.count ? ' <span class="n">' + s.count.done + "/" + s.count.total + "</span>" : (s.done ? ' <span class="n">✓</span>' : "");
      a.innerHTML = esc(s.label) + extra;
      if (active) a.setAttribute("aria-current", "page");
      tabs.appendChild(a);
    });
  }

  function renderLevel() {
    var level = route.level;
    document.body.className = "level-view";

    app.innerHTML =
      '<header class="level-bar">' +
      '<a class="map-link" href="#">◀ Map</a>' +
      '<span class="level-name"><span class="level-num">' + levelLabel(level) + "</span> " + esc(level.title) + "</span>" +
      '<button type="button" class="handbook-btn" id="handbook-btn">Handbook</button>' +
      ui.bionicButton("bar-bionic") +
      '<div class="stats" data-stats></div>' +
      "</header>" +
      '<main class="level-main">' +
      '<div class="level-intro"><h1>' + esc(level.title) + '</h1><p class="blurb">' + ui.md(level.kind === "lab" ? level.lab.blurb : level.chapter.blurb) + "</p></div>" +
      '<nav class="tabs" id="tabs" aria-label="Sections"></nav>' +
      '<div id="section"></div>' +
      '<div class="level-foot" id="level-foot"></div>' +
      "</main>" +
      '<nav class="bottom-bar" aria-label="Quick actions">' +
      '<a href="#">◀ Map</a>' +
      '<button type="button" id="handbook-btn-2">Handbook</button>' +
      ui.bionicButton() +
      '<span data-stats class="stats"></span>' +
      "</nav>";

    renderStats();
    renderTabs();
    document.getElementById("handbook-btn").addEventListener("click", openDrawer);
    document.getElementById("handbook-btn-2").addEventListener("click", openDrawer);

    var section = document.getElementById("section");
    if (route.section === "guide") {
      section.appendChild(ui.renderGuide(level));
    } else if (route.section === "quiz") {
      section.appendChild(ui.renderDeck(level.chapter, route.index, function (i) {
        history.replaceState(null, "", hashFor(level, "quiz", i));
        route.index = i;
      }));
    } else if (route.section === "challenges") {
      level.chapter.challenges.forEach(function (ch) { section.appendChild(ui.renderChallenge(ch)); });
    } else if (route.section === "examples") {
      section.appendChild(ui.renderExamples(level.chapter));
    } else {
      section.appendChild(ui.renderLabTask(level.lab.tasks[route.index]));
    }

    var foot = document.getElementById("level-foot");
    var secs = sectionsFor(level);
    var pos = secs.findIndex(function (s) { return s.id === route.section && (s.id !== "tasks" || s.index === route.index); });
    var nextLevel = ui.levels[ui.levelIndex(level.id) + 1];
    if (pos < secs.length - 1) {
      foot.innerHTML = '<a class="next-btn" href="' + hashFor(level, secs[pos + 1].id, secs[pos + 1].index) + '">Next: ' + esc(secs[pos + 1].label) + " →</a>";
    } else if (nextLevel) {
      foot.innerHTML = '<a class="next-btn" href="' + (ui.levelUnlocked(nextLevel) ? resumeHash(nextLevel) : "#") + '">' +
        (ui.levelUnlocked(nextLevel) ? "Next level: " + esc(nextLevel.title) + " →" : "Back to the map →") + "</a>";
    } else {
      foot.innerHTML = '<a class="next-btn" href="#">Back to the map →</a>';
    }
  }

  function openDrawer() {
    var level = route.level;
    drawerTitle.textContent = "Handbook · " + level.title;
    drawerBody.innerHTML = "";
    drawerBody.appendChild(ui.renderGuide(level, { compact: true }));
    drawerBody.appendChild(el("a", "drawer-glossary", "Open the full glossary →"));
    drawerBody.lastChild.href = "#glossary";
    drawer.hidden = false;
    scrim.hidden = false;
    document.body.classList.add("drawer-open");
    document.getElementById("drawer-close").focus();
  }

  function closeDrawer() {
    drawer.hidden = true;
    scrim.hidden = true;
    document.body.classList.remove("drawer-open");
  }

  document.getElementById("drawer-close").addEventListener("click", closeDrawer);
  scrim.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !drawer.hidden) { closeDrawer(); return; }
    if (!drawer.hidden) return;
    ui.handleKey(e);
  });

  ui.setupBionic([".level-main", ".home-head", ".drawer-body", ".term-pop"]);

  window.addEventListener("hashchange", render);
  render();
})();
