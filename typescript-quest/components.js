(function () {
  "use strict";

  var DAILY_GOAL = 5;
  var CHALLENGE_XP = { Easy: 20, Medium: 30, Hard: 50 };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function md(s) {
    return esc(s)
      .replace(/```\w*\n?([\s\S]*?)\n?```/g, "<pre><code>$1</code></pre>")
      .replace(/`([^`\n]+)`/g, "<code>$1</code>");
  }

  function plain(s) {
    return String(s).replace(/<[^>]+>/g, "").replace(/```[\s\S]*?```/g, " ").replace(/`/g, "").replace(/&[a-z]+;/g, " ");
  }

  function normalizeAnswer(s) {
    return String(s).replace(/[`;]/g, "").replace(/\s+/g, "").toLowerCase();
  }

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function ok(name, pass, detail) {
    return { name: name, pass: !!pass, detail: detail || "" };
  }

  function todayKey(date) {
    var d = date || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  window.TSW_UI = function (opts) {
    var prefix = opts.prefix;
    var content = window.TSW_CONTENT;
    var engine = window.TSW_ENGINE;
    var levels = content.levels;
    var onChange = opts.onChange || function () {};

    function get(key) {
      try { return localStorage.getItem(prefix + key); } catch (e) { return null; }
    }
    function set(key, value) {
      try { localStorage.setItem(prefix + key, value); } catch (e) {}
    }
    function getJson(key, fallback) {
      try { var v = get(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    }

    function isDone(kind, id) { return get(kind + ":" + id) === "1"; }

    function markDone(kind, id) {
      if (isDone(kind, id)) return;
      set(kind + ":" + id, "1");
      var days = getJson("days", {});
      var key = todayKey();
      days[key] = (days[key] || 0) + 1;
      set("days", JSON.stringify(days));
      onChange();
    }

    function levelCounts(level) {
      if (level.kind === "lab") {
        return {
          done: level.lab.tasks.filter(function (t) { return isDone("lab", t.id); }).length,
          total: level.lab.tasks.length
        };
      }
      var ch = level.chapter;
      return {
        done: ch.theory.filter(function (q) { return isDone("theory", q.id); }).length +
          ch.challenges.filter(function (c) { return isDone("solved", c.id); }).length,
        total: ch.theory.length + ch.challenges.length
      };
    }

    function sectionCounts(level, section) {
      var ch = level.chapter;
      if (section === "theory") return { done: ch.theory.filter(function (q) { return isDone("theory", q.id); }).length, total: ch.theory.length };
      if (section === "challenges") return { done: ch.challenges.filter(function (c) { return isDone("solved", c.id); }).length, total: ch.challenges.length };
      return null;
    }

    function levelIndex(id) {
      for (var i = 0; i < levels.length; i++) if (levels[i].id === id) return i;
      return -1;
    }

    function levelUnlocked(level) {
      var i = levelIndex(level.id);
      if (i <= 0) return true;
      if (levelCounts(level).done > 0) return true;
      var prev = levelCounts(levels[i - 1]);
      return prev.done / prev.total >= 0.5;
    }

    function totals() {
      var done = 0, total = 0;
      levels.forEach(function (l) { var c = levelCounts(l); done += c.done; total += c.total; });
      return { done: done, total: total };
    }

    function xp() {
      var sum = 0;
      content.chapters.forEach(function (ch) {
        ch.theory.forEach(function (q) { if (isDone("theory", q.id)) sum += 10; });
        ch.challenges.forEach(function (c) { if (isDone("solved", c.id)) sum += CHALLENGE_XP[c.difficulty] || 20; });
      });
      content.labs.forEach(function (lab) {
        lab.tasks.forEach(function (t) { if (isDone("lab", t.id)) sum += taskXp(t); });
      });
      return sum;
    }

    function taskXp(task) { return task.kind === "build" ? 40 : 20; }

    function todayCount() {
      return getJson("days", {})[todayKey()] || 0;
    }

    function streak() {
      var days = getJson("days", {});
      var d = new Date();
      if (!days[todayKey(d)]) d.setDate(d.getDate() - 1);
      var count = 0;
      while (days[todayKey(d)]) {
        count++;
        d.setDate(d.getDate() - 1);
      }
      return count;
    }

    function nextLocked() {
      for (var i = 1; i < levels.length; i++) {
        if (!levelUnlocked(levels[i])) return { level: levels[i], prev: levels[i - 1] };
      }
      return null;
    }

    function firstUnfinished() {
      for (var i = 0; i < levels.length; i++) {
        var c = levelCounts(levels[i]);
        if (c.done < c.total) return levels[i];
      }
      return levels[0];
    }

    // ------------------------------------------------------------------
    // Theory deck: one question at a time
    // ------------------------------------------------------------------

    var activeDeck = null;

    function renderDeck(chapter, startIndex, onMove) {
      var questions = chapter.theory;
      var idx = Math.max(0, Math.min(startIndex || 0, questions.length - 1));
      var root = el("div", "deck");
      var segs = el("div", "deck-segments");
      var card = el("div", "deck-card");
      root.appendChild(segs);
      root.appendChild(card);
      var selected = null;
      var api = {};

      function renderSegments() {
        segs.innerHTML = "";
        questions.forEach(function (q, i) {
          var s = el("button", "deck-seg" + (isDone("theory", q.id) ? " done" : "") + (i === idx ? " current" : ""));
          s.type = "button";
          s.setAttribute("aria-label", "Question " + (i + 1) + (isDone("theory", q.id) ? ", answered" : ""));
          s.addEventListener("click", function () { go(i); });
          segs.appendChild(s);
        });
      }

      function renderCard() {
        var q = questions[idx];
        var answered = isDone("theory", q.id);
        selected = answered && q.type === "mc" ? q.correct : null;
        card.innerHTML = "";
        card.appendChild(el("div", "deck-meta", "Question " + (idx + 1) + " of " + questions.length + (answered ? ' <span class="deck-answered">✓ answered</span>' : "")));
        card.appendChild(el("div", "deck-prompt", md(q.prompt)));

        var choicesEl;
        var textInput = null;
        if (q.type === "mc") {
          choicesEl = el("div", "deck-choices" + (q.options.some(function (o) { return o.length > 48; }) ? " long" : ""));
          q.options.forEach(function (opt, i) {
            var b = el("button", "choice" + (selected === i ? " selected" : ""), '<span class="choice-key">' + (i + 1) + "</span><span>" + md(opt) + "</span>");
            b.type = "button";
            b.addEventListener("click", function () { choose(i); });
            choicesEl.appendChild(b);
          });
        } else {
          choicesEl = el("div", "deck-text");
          textInput = el("input", "text-answer");
          textInput.type = "text";
          textInput.placeholder = "Type your answer";
          textInput.autocomplete = "off";
          textInput.spellcheck = false;
          if (answered) textInput.value = q.accept[0];
          textInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") { e.preventDefault(); primary(); }
          });
          textInput.addEventListener("input", function () { feedback.hidden = true; });
          choicesEl.appendChild(textInput);
        }
        card.appendChild(choicesEl);

        var feedback = el("div", "deck-feedback");
        feedback.hidden = true;
        card.appendChild(feedback);
        if (answered) showCorrect(feedback, q);

        var controls = el("div", "deck-controls");
        var prev = el("button", "btn ghost", "←");
        prev.type = "button";
        prev.setAttribute("aria-label", "Previous question");
        prev.disabled = idx === 0;
        prev.addEventListener("click", function () { go(idx - 1); });
        var hint = el("span", "deck-hint", q.type === "mc" ? "Press 1–" + q.options.length + ", then Enter" : "Type, then Enter");
        var main = el("button", "btn primary", answered ? (idx < questions.length - 1 ? "Next →" : "Done") : "Check");
        main.type = "button";
        main.addEventListener("click", primary);
        controls.appendChild(prev);
        controls.appendChild(hint);
        controls.appendChild(main);
        card.appendChild(controls);

        function choose(i) {
          if (isDone("theory", q.id)) return;
          selected = i;
          feedback.hidden = true;
          Array.prototype.forEach.call(choicesEl.children, function (c, j) {
            c.classList.toggle("selected", j === i);
          });
        }

        function primary() {
          if (isDone("theory", q.id)) {
            if (idx < questions.length - 1) go(idx + 1);
            return;
          }
          var correct;
          if (q.type === "mc") {
            if (selected === null) {
              feedback.hidden = false;
              feedback.className = "deck-feedback warn";
              feedback.textContent = "Pick an answer first.";
              return;
            }
            correct = selected === q.correct;
          } else {
            var v = normalizeAnswer(textInput.value);
            if (!v) {
              feedback.hidden = false;
              feedback.className = "deck-feedback warn";
              feedback.textContent = "Type an answer first.";
              return;
            }
            correct = q.accept.some(function (a) { return normalizeAnswer(a) === v; });
          }
          if (correct) {
            markDone("theory", q.id);
            renderSegments();
            renderCard();
          } else {
            feedback.hidden = false;
            feedback.className = "deck-feedback bad";
            feedback.textContent = "Not quite. Try again.";
            if (q.type === "mc") choicesEl.children[selected].classList.add("wrong");
          }
        }

        api.choose = function (i) { if (q.type === "mc" && i < q.options.length) choose(i); };
        api.primary = primary;
        api.hasTextInput = !!textInput;
      }

      function showCorrect(feedback, q) {
        feedback.hidden = false;
        feedback.className = "deck-feedback good";
        feedback.innerHTML = "<strong>Correct.</strong> " + md(q.explanation);
        glossify(feedback);   // terms are linked only after answering, so they can't give answers away
      }

      function go(i) {
        if (i < 0 || i >= questions.length) return;
        idx = i;
        renderSegments();
        renderCard();
        if (onMove) onMove(idx);
      }

      api.go = function (delta) { go(idx + delta); };
      renderSegments();
      renderCard();
      activeDeck = api;
      return root;
    }

    function handleKey(e) {
      if (!activeDeck || !document.body.contains(document.querySelector(".deck"))) return;
      var t = e.target;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter" && t && (t.tagName === "BUTTON" || t.tagName === "A")) return;
      if (/^[1-9]$/.test(e.key)) { activeDeck.choose(Number(e.key) - 1); e.preventDefault(); }
      else if (e.key === "Enter") { activeDeck.primary(); e.preventDefault(); }
      else if (e.key === "ArrowRight") { activeDeck.go(1); }
      else if (e.key === "ArrowLeft") { activeDeck.go(-1); }
    }

    // ------------------------------------------------------------------
    // Code challenges
    // ------------------------------------------------------------------

    function describeTypeTest(testLines, index) {
      for (var i = Math.min(index, testLines.length - 1); i >= 0; i--) {
        var m = /^\s*\/\/\s*test:\s*(.*)$/.exec(testLines[i]);
        if (m) return m[1];
      }
      return "a hidden type check";
    }

    function tabIndent(textarea) {
      textarea.addEventListener("keydown", function (e) {
        if (e.key === "Tab" && !e.shiftKey) {
          e.preventDefault();
          var start = textarea.selectionStart;
          var end = textarea.selectionEnd;
          textarea.value = textarea.value.slice(0, start) + "  " + textarea.value.slice(end);
          textarea.selectionStart = textarea.selectionEnd = start + 2;
          textarea.dispatchEvent(new Event("input"));
        }
      });
    }

    function renderList(container, items, cls) {
      container.innerHTML = "";
      items.forEach(function (item) {
        var li = el("li", cls ? cls(item) : "");
        li.textContent = item.text;
        container.appendChild(li);
      });
    }

    function renderChallenge(challenge) {
      var wrap = el("div", "challenge" + (isDone("solved", challenge.id) ? " solved" : ""));
      wrap.id = "challenge-" + challenge.id;
      wrap.innerHTML =
        '<div class="challenge-head">' +
        '<span class="tag">' + esc(challenge.difficulty) + " · +" + (CHALLENGE_XP[challenge.difficulty] || 20) + " XP</span>" +
        "<h3>" + esc(challenge.title) + "</h3>" +
        '<span class="solved-tag"' + (isDone("solved", challenge.id) ? "" : " hidden") + ">✓ solved</span>" +
        "</div>" +
        '<div class="prompt">' + challenge.prompt + "</div>" +
        (challenge.typeTests ? '<p class="note">Hidden type tests also check your types, not just what your code outputs.</p>' : "") +
        '<textarea class="editor" wrap="off" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Your TypeScript code"></textarea>' +
        '<div class="controls">' +
        '<button type="button" class="btn primary run-btn">Run &amp; check</button>' +
        '<button type="button" class="btn reset-btn">Reset</button>' +
        '<button type="button" class="btn solution-btn">Show solution</button>' +
        '<span class="status"></span>' +
        "</div>" +
        '<div class="output diagnostics" hidden><h4>Type errors</h4><ul class="diag-list"></ul></div>' +
        '<div class="output results" hidden><h4>Tests</h4><ul class="result-list"></ul></div>' +
        '<div class="solution-block" hidden><pre class="solution-code"></pre>' +
        '<button type="button" class="btn load-solution-btn">Load into editor</button></div>';

      glossify(wrap.querySelector(".prompt"));
      var editor = wrap.querySelector(".editor");
      var runBtn = wrap.querySelector(".run-btn");
      var status = wrap.querySelector(".status");
      var diagBox = wrap.querySelector(".diagnostics");
      var diagList = wrap.querySelector(".diag-list");
      var resultBox = wrap.querySelector(".results");
      var resultList = wrap.querySelector(".result-list");
      var solutionBlock = wrap.querySelector(".solution-block");
      var solutionBtn = wrap.querySelector(".solution-btn");

      editor.value = get("code:" + challenge.id) || challenge.starter;
      wrap.querySelector(".solution-code").textContent = challenge.solution;
      tabIndent(editor);
      editor.addEventListener("input", function () { set("code:" + challenge.id, editor.value); });
      editor.addEventListener("focus", function () { engine.ensure().catch(function () {}); });

      function showDiags(lines) {
        diagBox.hidden = false;
        renderList(diagList, lines.map(function (t) { return { text: t }; }));
      }

      runBtn.addEventListener("click", function () {
        set("code:" + challenge.id, editor.value);
        diagBox.hidden = true;
        resultBox.hidden = true;
        runBtn.disabled = true;
        status.textContent = "Loading the TypeScript compiler…";

        engine.ensure().then(function () {
          var code = editor.value;
          var userLines = code.split("\n").length;
          var testLines = challenge.typeTests ? challenge.typeTests.split("\n") : [];
          var diags = engine.checkSnippet(challenge.typeTests ? code + "\n" + challenge.typeTests : code);
          if (diags.length) {
            showDiags(diags.map(function (d) {
              if (d.line && d.line > userLines) {
                return "Hidden type test failed: " + describeTypeTest(testLines, d.line - userLines - 1) +
                  (d.code === 2578 ? " (expected a type error here, but there wasn't one)" : " (" + d.message + ")");
              }
              return (d.line ? "Line " + d.line + ": " : "") + d.message;
            }));
            return;
          }
          var run = engine.runJs(engine.transpileForRun(code), challenge.exposes || []);
          if (run.error) {
            showDiags(["Runtime error: " + run.error.message]);
            return;
          }
          var results;
          try {
            results = challenge.run({ exports: run.exports, logs: run.logs });
          } catch (err) {
            results = [ok("your code can be called by the tests", false, err.message)];
          }
          resultBox.hidden = false;
          renderList(resultList, results.map(function (r) {
            return { text: (r.pass ? "✓ " : "✗ ") + r.name + (r.detail && !r.pass ? " (" + r.detail + ")" : ""), pass: r.pass };
          }), function (item) { return item.pass ? "pass" : "fail"; });
          if (results.length && results.every(function (r) { return r.pass; })) {
            markDone("solved", challenge.id);
            wrap.classList.add("solved");
            wrap.querySelector(".solved-tag").hidden = false;
          }
        }).catch(function (err) {
          showDiags([err.message]);
        }).then(function () {
          runBtn.disabled = false;
          status.textContent = "";
        });
      });

      wrap.querySelector(".reset-btn").addEventListener("click", function () {
        if (!confirm("Reset this challenge back to the starter code?")) return;
        editor.value = challenge.starter;
        set("code:" + challenge.id, editor.value);
        diagBox.hidden = true;
        resultBox.hidden = true;
      });

      solutionBtn.addEventListener("click", function () {
        solutionBlock.hidden = !solutionBlock.hidden;
        solutionBtn.textContent = solutionBlock.hidden ? "Show solution" : "Hide solution";
      });

      wrap.querySelector(".load-solution-btn").addEventListener("click", function () {
        if (!confirm("Replace your code with the solution?")) return;
        editor.value = challenge.solution;
        set("code:" + challenge.id, editor.value);
      });

      return wrap;
    }

    function renderExample(example) {
      var wrap = el("div", "example" + (example.simple ? " simple" : ""));
      wrap.id = "example-" + example.id;
      wrap.innerHTML =
        "<h3>" + md(example.title) + "</h3>" +
        '<p class="scenario">' + md(example.scenario) + "</p>";
      // Simple examples are self-contained, so they get Try it / Show JavaScript.
      wrap.appendChild(example.simple
        ? renderGuideCode({ code: example.code, run: true })
        : el("pre", "", "<code>" + highlight(example.code) + "</code>"));
      wrap.appendChild(el("p", "takeaway",
        "<strong>" + (example.simple ? "Key point:" : "Why it matters:") + "</strong> " + md(example.takeaway)));
      return glossify(wrap);
    }

    function renderExamples(chapter) {
      var wrap = el("div", "examples");
      var groups = [
        { title: "Simple examples", intro: "Short and self-contained. Press Try it to edit and run them.", items: chapter.examples.filter(function (e) { return e.simple; }) },
        { title: "Real-world examples", intro: "Patterns you'll meet in real codebases, and why they're typed the way they are.", items: chapter.examples.filter(function (e) { return !e.simple; }) }
      ];
      groups.forEach(function (g) {
        if (!g.items.length) return;
        wrap.appendChild(el("h2", "examples-group", esc(g.title)));
        wrap.appendChild(el("p", "examples-intro", esc(g.intro)));
        g.items.forEach(function (ex) { wrap.appendChild(renderExample(ex)); });
      });
      return wrap;
    }

    // ------------------------------------------------------------------
    // Glossary: term links with hover/tap definitions (terms in glossary.js)
    // ------------------------------------------------------------------

    var GLOSSARY = window.TSW_GLOSSARY || [];
    var glossById = {};
    GLOSSARY.forEach(function (g) { glossById[g.id] = g; });

    function levelName(levelId) {
      var i = levelIndex(levelId);
      if (i === -1) return "";
      var level = levels[i], n = 0;
      for (var j = 0; j <= i; j++) if (levels[j].kind === level.kind) n++;
      return (level.kind === "lab" ? "Lab " + n : "Chapter " + n) + " · " + level.title;
    }

    // Tags inside which terms are never linked.
    var NO_TERMS = { PRE: 1, TEXTAREA: 1, BUTTON: 1, A: 1, H1: 1, H2: 1, H3: 1, H4: 1, INPUT: 1, SELECT: 1, TABLE: 1 };

    // Link the first mention of each glossary term inside root. `seen` is shared
    // across one container (a guide section, a quiz card…) so a term is linked once.
    function glossify(root, seen) {
      if (!GLOSSARY.length || !root) return root;
      seen = seen || {};
      walk(root);
      return root;

      function walk(node) {
        var child = node.firstChild;
        while (child) {
          var next = child.nextSibling;
          if (child.nodeType === 1) {
            if (NO_TERMS[child.tagName] || child.classList.contains("term") || child.classList.contains("choice") || child.classList.contains("pchoice") || child.classList.contains("vsc")) {
              // skip
            } else if (child.tagName === "CODE") {
              linkCode(child);
            } else {
              walk(child);
            }
          } else if (child.nodeType === 3 && child.nodeValue.trim()) {
            linkText(child);
          }
          child = next;
        }
      }

      function makeTerm(id) {
        var span = document.createElement("span");
        span.className = "term";
        span.setAttribute("data-term", id);
        span.setAttribute("tabindex", "0");
        span.setAttribute("role", "button");
        span.setAttribute("aria-label", "Definition: " + glossById[id].term);
        return span;
      }

      function linkCode(codeEl) {
        var text = codeEl.textContent;
        for (var i = 0; i < GLOSSARY.length; i++) {
          var g = GLOSSARY[i];
          if (!g.code || seen[g.id]) continue;
          if (g.code.some(function (re) { return re.test(text); })) {
            seen[g.id] = true;
            var span = makeTerm(g.id);
            codeEl.parentNode.replaceChild(span, codeEl);
            span.appendChild(codeEl);
            return;
          }
        }
      }

      function linkText(textNode) {
        var text = textNode.nodeValue;
        var hits = [];
        GLOSSARY.forEach(function (g) {
          if (!g.words || seen[g.id]) return;
          g.words.forEach(function (re) {
            var global = new RegExp(re.source, re.flags.indexOf("g") === -1 ? re.flags + "g" : re.flags);
            var m;
            while ((m = global.exec(text))) {
              hits.push({ start: m.index, end: m.index + m[0].length, id: g.id });
              if (!m[0].length) global.lastIndex++;
            }
          });
        });
        if (!hits.length) return;
        // Earliest first; for ties, the longest match wins ("discriminated union" over "union").
        hits.sort(function (a, b) { return a.start - b.start || (b.end - b.start) - (a.end - a.start); });
        var chosen = [], lastEnd = 0;
        hits.forEach(function (h) {
          if (h.start < lastEnd || seen[h.id]) return;
          seen[h.id] = true;
          chosen.push(h);
          lastEnd = h.end;
        });
        if (!chosen.length) return;
        var frag = document.createDocumentFragment(), pos = 0;
        chosen.forEach(function (h) {
          if (h.start > pos) frag.appendChild(document.createTextNode(text.slice(pos, h.start)));
          var span = makeTerm(h.id);
          span.textContent = text.slice(h.start, h.end);
          frag.appendChild(span);
          pos = h.end;
        });
        if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
        textNode.parentNode.replaceChild(frag, textNode);
      }
    }

    // One shared popover for every term on the page.
    var pop = null, popTerm = null, popPinned = false, hoverTimer = null, hideTimer = null;

    function ensurePopover() {
      if (pop) return pop;
      pop = el("div", "term-pop");
      pop.setAttribute("role", "dialog");
      pop.hidden = true;
      document.body.appendChild(pop);
      pop.addEventListener("pointerenter", function () { clearTimeout(hideTimer); });
      pop.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && !popPinned) scheduleHide(); });
      pop.addEventListener("click", function (e) { if (e.target.closest("a")) hidePopover(); });

      document.addEventListener("pointerover", function (e) {
        if (e.pointerType !== "mouse") return;
        var t = e.target.closest && e.target.closest(".term");
        if (!t || popPinned) return;
        clearTimeout(hideTimer);
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { showPopover(t, false); }, 120);
      });
      document.addEventListener("pointerout", function (e) {
        if (e.pointerType !== "mouse") return;
        var t = e.target.closest && e.target.closest(".term");
        if (!t) return;
        clearTimeout(hoverTimer);
        if (!popPinned) scheduleHide();
      });
      document.addEventListener("click", function (e) {
        var t = e.target.closest && e.target.closest(".term");
        if (t) {
          e.preventDefault();
          if (popTerm === t && popPinned) hidePopover(); else showPopover(t, true);
          return;
        }
        if (!pop.hidden && !pop.contains(e.target)) hidePopover();
      });
      document.addEventListener("keydown", function (e) {
        var t = e.target.closest && e.target.closest(".term");
        if (t && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          e.stopPropagation();
          if (popTerm === t && !pop.hidden) hidePopover(); else showPopover(t, true);
        } else if (e.key === "Escape" && !pop.hidden) {
          var back = popTerm;
          hidePopover();
          if (back) back.focus();
          e.stopPropagation();
        }
      }, true);
      window.addEventListener("scroll", function () { if (!pop.hidden) placePopover(); }, true);
      window.addEventListener("resize", function () { if (!pop.hidden) placePopover(); });
      window.addEventListener("hashchange", hidePopover);
      return pop;
    }

    function scheduleHide() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hidePopover, 220);
    }

    function hidePopover() {
      if (!pop) return;
      pop.hidden = true;
      if (popTerm) popTerm.setAttribute("aria-expanded", "false");
      popTerm = null;
      popPinned = false;
    }

    function showPopover(term, pinned) {
      ensurePopover();
      var g = glossById[term.getAttribute("data-term")];
      if (!g) return;
      if (popTerm && popTerm !== term) popTerm.setAttribute("aria-expanded", "false");
      popTerm = term;
      popPinned = pinned;
      term.setAttribute("aria-expanded", "true");
      var links = '<a href="#glossary/' + g.id + '">Glossary</a>';
      if (g.more) links = '<a href="#' + g.more + '/guide">More: ' + esc(levelName(g.more)) + " →</a>" + links;
      if (g.level) links = '<a href="#' + g.level + '/guide">' + esc(levelName(g.level)) + " →</a>" + links;
      pop.innerHTML =
        '<div class="term-pop-name">' + esc(g.term) + (g.level ? "" : ' <span class="term-pop-tag">JavaScript</span>') + "</div>" +
        "<p>" + md(g.def) + "</p>" +
        '<div class="term-pop-links">' + links + "</div>";
      pop.hidden = false;
      placePopover();
    }

    function placePopover() {
      if (!popTerm || !document.body.contains(popTerm)) { hidePopover(); return; }
      var r = popTerm.getBoundingClientRect();
      var w = Math.min(320, window.innerWidth - 16);
      pop.style.width = w + "px";
      var left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
      var h = pop.offsetHeight;
      var top = r.bottom + 6;
      if (top + h > window.innerHeight - 8 && r.top - h - 6 > 8) top = r.top - h - 6;
      pop.style.left = left + "px";
      pop.style.top = top + "px";
    }

    if (GLOSSARY.length) {
      if (document.body) ensurePopover();
      else document.addEventListener("DOMContentLoaded", ensurePopover);
    }

    // ------------------------------------------------------------------
    // Bionic reading: bold the first part of each word in reading text
    // ------------------------------------------------------------------

    var bionic = { on: get("bionic") === "1", roots: [], observer: null };
    var BIONIC_SKIP = "pre, code, textarea, input, select, kbd, script, style, b.bio, .no-bionic, [contenteditable='true'], [data-bionic-toggle]";
    var WORD = /[\p{L}\p{N}][\p{L}\p{N}'’]*/gu;

    function bionicText(node) {
      var parent = node.parentElement;
      if (!parent || parent.closest(BIONIC_SKIP)) return;
      var text = node.nodeValue;
      WORD.lastIndex = 0;
      if (!WORD.test(text)) return;
      WORD.lastIndex = 0;
      var frag = document.createDocumentFragment(), pos = 0, m;
      while ((m = WORD.exec(text))) {
        var w = m[0];
        var n = w.length <= 3 ? 1 : Math.ceil(w.length * 0.45);
        if (m.index > pos) frag.appendChild(document.createTextNode(text.slice(pos, m.index)));
        var b = document.createElement("b");
        b.className = "bio";
        b.textContent = w.slice(0, n);
        frag.appendChild(b);
        if (n < w.length) frag.appendChild(document.createTextNode(w.slice(n)));
        pos = m.index + w.length;
      }
      if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
      parent.replaceChild(frag, node);
    }

    function bionicApply(node) {
      if (node.nodeType === 3) { bionicText(node); return; }
      if (node.nodeType !== 1 || node.closest(BIONIC_SKIP)) return;
      var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      var texts = [];
      while (walker.nextNode()) texts.push(walker.currentNode);
      texts.forEach(bionicText);
    }

    function bionicRemove(root) {
      Array.prototype.forEach.call(root.querySelectorAll("b.bio"), function (b) {
        b.parentNode.replaceChild(document.createTextNode(b.textContent), b);
      });
      root.normalize();
    }

    function bionicRootSelector() { return bionic.roots.join(", "); }

    function bionicEachRoot(fn) {
      if (!bionic.roots.length) return;
      Array.prototype.forEach.call(document.querySelectorAll(bionicRootSelector()), fn);
    }

    function bionicWatch() {
      if (bionic.observer) return;
      var opts = { childList: true, subtree: true };
      bionic.observer = new MutationObserver(function (mutations) {
        if (!bionic.on) return;
        bionic.observer.disconnect();
        var sel = bionicRootSelector();
        mutations.forEach(function (mu) {
          Array.prototype.forEach.call(mu.addedNodes, function (node) {
            if (!node.isConnected) return;
            var elNode = node.nodeType === 1 ? node : node.parentElement;
            if (!elNode) return;
            if (elNode.closest(sel)) bionicApply(node);
            else if (node.nodeType === 1) Array.prototype.forEach.call(node.querySelectorAll(sel), bionicApply);
          });
        });
        bionic.observer.observe(document.body, opts);
      });
      bionic.observer.observe(document.body, opts);
    }

    function syncBionicButtons() {
      Array.prototype.forEach.call(document.querySelectorAll("[data-bionic-toggle]"), function (b) {
        b.setAttribute("aria-pressed", bionic.on ? "true" : "false");
      });
    }

    function setBionic(on) {
      bionic.on = on;
      set("bionic", on ? "1" : "0");
      if (bionic.observer) bionic.observer.disconnect();
      bionicEachRoot(on ? bionicApply : bionicRemove);
      if (bionic.observer) bionic.observer.observe(document.body, { childList: true, subtree: true });
      syncBionicButtons();
    }

    // roots: CSS selectors for the areas that hold reading text.
    function setupBionic(roots) {
      bionic.roots = roots;
      bionicWatch();
      document.addEventListener("click", function (e) {
        var btn = e.target.closest && e.target.closest("[data-bionic-toggle]");
        if (btn) setBionic(!bionic.on);
      });
      if (bionic.on) bionicEachRoot(bionicApply);
      syncBionicButtons();
    }

    function bionicButton(extraClass) {
      return '<button type="button" class="bionic-toggle' + (extraClass ? " " + extraClass : "") + '" data-bionic-toggle aria-pressed="' + (bionic.on ? "true" : "false") +
        '" title="Bionic reading: bold the start of each word to help your eyes move through text">' +
        '<span aria-hidden="true"><b>Bi</b>onic</span><span class="sr-only"> reading</span></button>';
    }

    function renderGlossary(focusId) {
      var wrap = el("div", "glossary");
      var filter = el("input", "glossary-filter");
      filter.type = "search";
      filter.placeholder = "Filter " + GLOSSARY.length + " terms";
      filter.setAttribute("aria-label", "Filter the glossary");
      wrap.appendChild(filter);

      var sorted = GLOSSARY.slice().sort(function (a, b) {
        return a.term.replace(/^[^A-Za-z]+/, "").toLowerCase().localeCompare(b.term.replace(/^[^A-Za-z]+/, "").toLowerCase());
      });
      var list = el("div", "glossary-list");
      var empty = el("p", "glossary-empty", "No terms match.");
      empty.hidden = true;
      sorted.forEach(function (g) {
        var item = el("div", "gloss-entry");
        item.id = "gloss-" + g.id;
        var meta = g.level
          ? 'Covered in <a href="#' + g.level + '/guide">' + esc(levelName(g.level)) + "</a>" +
            (g.more ? ' and <a href="#' + g.more + '/guide">' + esc(levelName(g.more)) + "</a>" : "")
          : "Plain JavaScript syntax" +
            (g.more ? ' · used in <a href="#' + g.more + '/guide">' + esc(levelName(g.more)) + "</a>" : "");
        item.innerHTML = "<h3>" + esc(g.term) + "</h3><p>" + md(g.def) + '</p><div class="gloss-meta">' + meta + "</div>";
        item.setAttribute("data-search", (g.term + " " + plain(g.def)).toLowerCase());
        list.appendChild(item);
      });
      wrap.appendChild(list);
      wrap.appendChild(empty);

      filter.addEventListener("input", function () {
        var q = filter.value.trim().toLowerCase();
        var shown = 0;
        Array.prototype.forEach.call(list.children, function (item) {
          var match = !q || item.getAttribute("data-search").indexOf(q) !== -1;
          item.hidden = !match;
          if (match) shown++;
        });
        empty.hidden = shown > 0;
      });

      if (focusId && glossById[focusId]) {
        setTimeout(function () {
          var target = document.getElementById("gloss-" + focusId);
          if (!target) return;
          target.classList.add("focus");
          window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY - 90);
        }, 50);
      }
      return wrap;
    }

    // ------------------------------------------------------------------
    // Guide: the per-level reference guide (content in lessons.js)
    // ------------------------------------------------------------------

    // md() plus **bold** and *italic*, applied outside <code> spans only.
    function rich(s) {
      return md(s).split(/(<code>[\s\S]*?<\/code>|<pre>[\s\S]*?<\/pre>)/).map(function (part, i) {
        if (i % 2) return part;
        return part
          .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
          .replace(/(^|[\s(“"])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
      }).join("");
    }

    var CALLOUTS = { tip: "Tip", warn: "Watch out", real: "In real projects" };

    function renderGuideBlock(block) {
      if (typeof block === "string") return el("p", "", rich(block));
      if (block.code !== undefined) return renderGuideCode(block);
      if (block.list) {
        var ul = el("ul", "guide-list");
        block.list.forEach(function (item) { ul.appendChild(el("li", "", rich(item))); });
        return ul;
      }
      for (var kind in CALLOUTS) {
        if (block[kind]) {
          return el("div", "guide-callout " + kind, '<span class="guide-callout-label">' + CALLOUTS[kind] + "</span>" + rich(block[kind]));
        }
      }
      return el("div");
    }

    // ------------------------------------------------------------------
    // Syntax highlighting (small TypeScript tokenizer, VS Code-style classes)
    // ------------------------------------------------------------------

    var KW_DECL = /^(const|let|var|function|class|interface|type|enum|extends|implements|new|this|super|typeof|keyof|instanceof|in|of|as|satisfies|is|readonly|private|public|protected|static|abstract|declare|namespace|module|get|set|async|infer|void|null|undefined|true|false|never|unknown|any)$/;
    var KW_CTRL = /^(return|if|else|for|while|do|switch|case|default|break|continue|throw|try|catch|finally|await|import|export|from|yield)$/;
    var KW_TYPE = /^(string|number|boolean|bigint|symbol|object)$/;
    var TOKEN = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d[\d_]*(?:\.\d+)?n?\b)|([A-Za-z_$#][\w$]*)|(\s+)|([\s\S])/g;

    function tokenize(code) {
      var out = [], m, prevSig = "";
      TOKEN.lastIndex = 0;
      while ((m = TOKEN.exec(code))) {
        var t = m[0], cls = "";
        if (m[1]) cls = "tok-com";
        else if (m[2]) cls = "tok-str";
        else if (m[3]) cls = "tok-num";
        else if (m[4]) {
          var rest = code.slice(TOKEN.lastIndex);
          if (KW_CTRL.test(t)) cls = "tok-ctrl";
          else if (KW_TYPE.test(t) && prevSig !== ".") cls = "tok-type";
          else if (KW_DECL.test(t) && prevSig !== ".") cls = "tok-kw";
          else if (/^\s*(<[^<>()]*>)?\s*\(/.test(rest)) cls = "tok-fn";
          else if (/^[A-Z]/.test(t)) cls = "tok-type";
          else cls = "tok-var";
        } else if (m[6]) {
          cls = "tok-punc";
        }
        out.push({ cls: cls, text: t });
        if (!m[5]) prevSig = t;
      }
      return out;
    }

    // Returns one HTML string per line, with spans re-opened across line breaks.
    function highlightLines(code) {
      var lines = [""];
      tokenize(code).forEach(function (tok) {
        tok.text.split("\n").forEach(function (part, i) {
          if (i > 0) lines.push("");
          if (part) lines[lines.length - 1] += tok.cls ? '<span class="' + tok.cls + '">' + esc(part) + "</span>" : esc(part);
        });
      });
      return lines;
    }

    function highlight(code) { return highlightLines(code).join("\n"); }

    // ------------------------------------------------------------------
    // Guide code blocks: highlighted <pre>, or a VS Code-style editor
    // ------------------------------------------------------------------

    function insertText(textarea, text) {
      textarea.focus();
      // execCommand keeps the browser's undo history working; fall back if it's unavailable.
      if (!document.execCommand || !document.execCommand("insertText", false, text)) {
        textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, "end");
        textarea.dispatchEvent(new Event("input"));
      }
    }

    function renderGuideCode(block) {
      if (!block.run) {
        var plainWrap = el("div", "guide-code");
        plainWrap.appendChild(el("pre", "", "<code>" + highlight(block.code) + "</code>"));
        if (block.caption) plainWrap.appendChild(el("p", "guide-caption", rich(block.caption)));
        return plainWrap;
      }

      var wrap = el("div", "guide-code");
      var vsc = el("div", "vsc no-bionic");
      vsc.innerHTML =
        '<div class="vsc-titlebar">' +
        '<span class="vsc-tab"><span class="ficon ts">TS</span>' + esc(block.file || "example.ts") + "</span>" +
        '<span class="vsc-actions">' +
        '<button type="button" class="vsc-btn vsc-run" title="Run (Ctrl+Enter)">▶ Run</button>' +
        '<button type="button" class="vsc-btn vsc-js" title="See the JavaScript this compiles to">JS</button>' +
        '<button type="button" class="vsc-btn vsc-reset" title="Reset to the original code" hidden>↺</button>' +
        "</span></div>" +
        '<div class="vsc-body">' +
        '<pre class="vsc-gutter" aria-hidden="true"></pre>' +
        '<div class="vsc-code">' +
        '<pre class="vsc-hl" aria-hidden="true"><code></code></pre>' +
        '<textarea class="vsc-input" wrap="off" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Editable TypeScript example. Ctrl+Enter runs it."></textarea>' +
        "</div></div>" +
        '<div class="vsc-panel" hidden>' +
        '<div class="vsc-panel-tabs" role="tablist">' +
        '<button type="button" role="tab" data-panel="problems">Problems <span class="vsc-badge" hidden></span></button>' +
        '<button type="button" role="tab" data-panel="output">Output</button>' +
        '<button type="button" role="tab" data-panel="js">JavaScript</button>' +
        "</div>" +
        '<div class="vsc-panel-body"></div>' +
        "</div>" +
        '<div class="vsc-status">' +
        '<span class="vsc-status-problems">⊗ 0</span>' +
        '<span class="vsc-status-msg">Edit the code, then ▶ Run</span>' +
        '<span class="vsc-status-pos">Ln 1, Col 1</span>' +
        "<span>TypeScript</span>" +
        "</div>";
      wrap.appendChild(vsc);
      if (block.caption) wrap.appendChild(el("p", "guide-caption", rich(block.caption)));

      var ta = vsc.querySelector(".vsc-input");
      var hl = vsc.querySelector(".vsc-hl code");
      var hlPre = vsc.querySelector(".vsc-hl");
      var gutter = vsc.querySelector(".vsc-gutter");
      var panel = vsc.querySelector(".vsc-panel");
      var panelBody = vsc.querySelector(".vsc-panel-body");
      var badge = vsc.querySelector(".vsc-badge");
      var runBtn = vsc.querySelector(".vsc-run");
      var jsBtn = vsc.querySelector(".vsc-js");
      var resetBtn = vsc.querySelector(".vsc-reset");
      var statusProblems = vsc.querySelector(".vsc-status-problems");
      var statusMsg = vsc.querySelector(".vsc-status-msg");
      var statusPos = vsc.querySelector(".vsc-status-pos");

      var state = { diags: null, logs: null, js: null, errorLines: {}, active: "output", ran: false };
      ta.value = block.code;

      function paint() {
        var lines = highlightLines(ta.value);
        hl.innerHTML = lines.map(function (line, i) {
          return '<span class="vsc-line' + (state.errorLines[i + 1] ? " err" : "") + '">' + (line || " ") + "</span>";
        }).join("\n");
        var nums = "";
        for (var i = 1; i <= lines.length; i++) nums += '<span class="' + (state.errorLines[i] ? "err" : "") + '">' + i + "</span>\n";
        gutter.innerHTML = nums;
        // 20px lines + 10px top and bottom padding + 16px of room for a horizontal
        // scrollbar, so the textarea never needs to scroll vertically.
        ta.style.height = (lines.length * 20 + 36) + "px";
        resetBtn.hidden = ta.value === block.code;
      }

      function syncScroll() {
        hlPre.scrollLeft = ta.scrollLeft;
        hlPre.scrollTop = ta.scrollTop;
      }

      function updatePos() {
        var before = ta.value.slice(0, ta.selectionStart).split("\n");
        statusPos.textContent = "Ln " + before.length + ", Col " + (before[before.length - 1].length + 1);
      }

      function showPanel(which) {
        state.active = which;
        panel.hidden = false;
        Array.prototype.forEach.call(panel.querySelectorAll("[data-panel]"), function (b) {
          b.setAttribute("aria-selected", b.getAttribute("data-panel") === which ? "true" : "false");
        });
        panelBody.innerHTML = "";
        if (which === "problems") {
          if (!state.diags || !state.diags.length) {
            panelBody.appendChild(el("div", "vsc-empty", state.diags ? "No problems have been detected." : "Run the code to check it."));
            return;
          }
          state.diags.forEach(function (d) {
            var row = el("button", "vsc-problem",
              '<span class="vsc-x">⊗</span><span class="vsc-problem-msg"></span><span class="vsc-problem-pos">' + (d.line ? "[Ln " + d.line + ", Col " + d.column + "]" : "") + "</span>");
            row.type = "button";
            row.querySelector(".vsc-problem-msg").textContent = d.message;
            row.addEventListener("click", function () { goToLine(d.line, d.column); });
            panelBody.appendChild(row);
          });
        } else if (which === "output") {
          var pre = el("pre", "vsc-terminal");
          if (state.diags && state.diags.length) pre.textContent = "Not run: fix the problems first.";
          else if (state.logs) pre.textContent = state.logs.length ? state.logs.join("\n") : "(no console output)";
          else pre.textContent = "Run the code to see its output.";
          panelBody.appendChild(pre);
        } else {
          var jsPre = el("pre", "vsc-terminal");
          jsPre.innerHTML = state.js === null ? "…" : highlight(state.js);
          panelBody.appendChild(el("div", "vsc-panel-note", "What runs: the same code with every type erased."));
          panelBody.appendChild(jsPre);
        }
      }

      function goToLine(line, col) {
        if (!line) return;
        var lines = ta.value.split("\n"), pos = 0;
        for (var i = 0; i < line - 1 && i < lines.length; i++) pos += lines[i].length + 1;
        pos += Math.max(0, (col || 1) - 1);
        ta.focus();
        ta.setSelectionRange(pos, pos);
        updatePos();
      }

      function withCompiler(work) {
        statusMsg.textContent = "Loading the TypeScript compiler…";
        runBtn.disabled = jsBtn.disabled = true;
        engine.ensure().then(work).catch(function (err) {
          state.diags = [{ message: err.message, line: 0, column: 0 }];
          showPanel("problems");
        }).then(function () {
          runBtn.disabled = jsBtn.disabled = false;
        });
      }

      function run() {
        withCompiler(function () {
          var code = ta.value;
          var diags = engine.checkSnippet(code);
          state.diags = diags;
          state.errorLines = {};
          diags.forEach(function (d) { if (d.line) state.errorLines[d.line] = true; });
          state.js = engine.transpileForRun(code).replace(/\n+$/, "");
          state.logs = null;
          if (!diags.length) {
            var result = engine.runJs(state.js, []);
            state.logs = result.logs.slice();
            if (result.error) state.logs.push("Uncaught " + (result.error.name || "Error") + ": " + result.error.message);
          }
          state.ran = true;
          paint();
          var n = diags.length;
          statusProblems.textContent = "⊗ " + n;
          statusProblems.classList.toggle("bad", n > 0);
          badge.hidden = !n;
          badge.textContent = n;
          statusMsg.textContent = n ? n + " problem" + (n === 1 ? "" : "s") + ": not run" : "✓ Compiled and ran";
          showPanel(n ? "problems" : (state.active === "js" ? "js" : "output"));
        });
      }

      runBtn.addEventListener("click", run);
      jsBtn.addEventListener("click", function () {
        if (!panel.hidden && state.active === "js") { panel.hidden = true; return; }
        withCompiler(function () {
          state.js = engine.transpileForRun(ta.value).replace(/\n+$/, "");
          statusMsg.textContent = "Showing the emitted JavaScript";
          showPanel("js");
        });
      });
      resetBtn.addEventListener("click", function () {
        ta.value = block.code;
        state = { diags: null, logs: null, js: null, errorLines: {}, active: "output", ran: false };
        panel.hidden = true;
        statusProblems.textContent = "⊗ 0";
        statusProblems.classList.remove("bad");
        badge.hidden = true;
        statusMsg.textContent = "Reset to the original code";
        paint();
      });
      Array.prototype.forEach.call(panel.querySelectorAll("[data-panel]"), function (b) {
        b.addEventListener("click", function () {
          var which = b.getAttribute("data-panel");
          if (which === "js" && state.js === null) {
            withCompiler(function () { state.js = engine.transpileForRun(ta.value).replace(/\n+$/, ""); showPanel("js"); });
          } else {
            showPanel(which);
          }
        });
      });

      ta.addEventListener("input", function () {
        // Edited since the last run: drop the stale error marks until it runs again.
        state.errorLines = {};
        paint();
        syncScroll();
        updatePos();
      });
      ta.addEventListener("scroll", syncScroll);
      ta.addEventListener("click", updatePos);
      ta.addEventListener("keyup", updatePos);
      ta.addEventListener("focus", function () { engine.ensure().catch(function () {}); });
      ta.addEventListener("keydown", function (e) {
        var v = ta.value, s = ta.selectionStart, end = ta.selectionEnd;
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          run();
        } else if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
          // Keep the current line's indentation; indent one more level after an opening bracket.
          e.preventDefault();
          var lineStart = v.lastIndexOf("\n", s - 1) + 1;
          var indent = v.slice(lineStart, s).match(/^\s*/)[0];
          var before = v.slice(lineStart, s).replace(/\s+$/, "");
          var opens = /[{([]$/.test(before);
          var closes = /^\s*[})\]]/.test(v.slice(end));
          if (opens && closes) {
            insertText(ta, "\n" + indent + "  " + "\n" + indent);
            var caret = s + 1 + indent.length + 2;
            ta.setSelectionRange(caret, caret);
          } else {
            insertText(ta, "\n" + indent + (opens ? "  " : ""));
          }
        } else if (e.key === "Tab" && !e.shiftKey && s === end) {
          e.preventDefault();
          insertText(ta, "  ");
        } else if (e.key === "/" && (e.ctrlKey || e.metaKey)) {
          // Toggle // comments on the selected lines.
          e.preventDefault();
          var from = v.lastIndexOf("\n", s - 1) + 1;
          var toNl = v.indexOf("\n", Math.max(end - (end > s && v[end - 1] === "\n" ? 1 : 0), s));
          var to = toNl === -1 ? v.length : toNl;
          var chunk = v.slice(from, to).split("\n");
          var allCommented = chunk.every(function (l) { return !l.trim() || /^\s*\/\//.test(l); });
          var changed = chunk.map(function (l) {
            if (!l.trim()) return l;
            return allCommented ? l.replace(/^(\s*)\/\/ ?/, "$1") : l.replace(/^(\s*)/, "$1// ");
          }).join("\n");
          ta.setSelectionRange(from, to);
          insertText(ta, changed);
          ta.setSelectionRange(from, from + changed.length);
        }
      });

      paint();
      return wrap;
    }

    function renderGuide(level, opts) {
      opts = opts || {};
      var guide = level.guide;
      var wrap = el("div", "guide");
      if (!guide) {
        wrap.appendChild(el("p", "section-intro", "No guide for this one yet."));
        return wrap;
      }

      wrap.appendChild(el("div", "guide-meta",
        "<span>Reference guide</span><span>~" + guide.minutes + " min read</span>"));
      wrap.appendChild(el("p", "guide-summary", rich(guide.summary)));

      if (guide.glance && guide.glance.length) {
        var glance = el("div", "guide-glance");
        var rows = guide.glance.map(function (row) {
          return "<tr><td><code>" + esc(row[0]) + "</code></td><td>" + rich(row[1]) + "</td></tr>";
        }).join("");
        glance.innerHTML = "<h3>At a glance</h3><table><tbody>" + rows + "</tbody></table>";
        wrap.appendChild(glance);
      }

      var sectionEls = [];
      if (!opts.compact && guide.sections.length > 2) {
        var jump = el("nav", "guide-jump");
        jump.setAttribute("aria-label", "Jump to a section");
        guide.sections.forEach(function (s, i) {
          var b = el("button", "", esc(s.title));
          b.type = "button";
          b.addEventListener("click", function () {
            sectionEls[i].scrollIntoView({ behavior: "smooth", block: "start" });
          });
          jump.appendChild(b);
        });
        wrap.appendChild(jump);
      }

      guide.sections.forEach(function (s) {
        var sec = el("section", "guide-section");
        sec.appendChild(el("h3", "", rich(s.title)));
        s.blocks.forEach(function (b) { sec.appendChild(renderGuideBlock(b)); });
        glossify(sec);
        sectionEls.push(sec);
        wrap.appendChild(sec);
      });

      if (guide.gotchas && guide.gotchas.length) {
        var g = el("section", "guide-section guide-gotchas");
        g.appendChild(el("h3", "", "Gotchas"));
        var list = el("ul", "gotcha-list");
        guide.gotchas.forEach(function (item) {
          var li = el("li", "", '<p>' + rich(item.text) + "</p>");
          if (item.bad || item.good) {
            var pair = el("div", "gotcha-pair");
            if (item.bad) pair.appendChild(el("div", "gotcha-code bad", '<span class="gotcha-mark">✗</span><pre><code>' + esc(item.bad) + "</code></pre>"));
            if (item.good) pair.appendChild(el("div", "gotcha-code good", '<span class="gotcha-mark">✓</span><pre><code>' + esc(item.good) + "</code></pre>"));
            li.appendChild(pair);
          }
          list.appendChild(li);
        });
        g.appendChild(list);
        glossify(g);
        sectionEls.push(g);
        wrap.appendChild(g);
      }

      wrap.scrollToSection = function (i) {
        var target = sectionEls[i];
        if (!target) return;
        setTimeout(function () {
          window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY - 80);
        }, 50);
      };
      return wrap;
    }

    // ------------------------------------------------------------------
    // Project Lab
    // ------------------------------------------------------------------

    function fileIcon(path) {
      if (/\.d\.ts$/.test(path)) return '<span class="ficon dts">DT</span>';
      if (/\.ts$/.test(path)) return '<span class="ficon ts">TS</span>';
      if (/\.js$/.test(path)) return '<span class="ficon js">JS</span>';
      if (/tsconfig\.json$/.test(path)) return '<span class="ficon cfg">{}</span>';
      if (/\.json$/.test(path)) return '<span class="ficon json">{}</span>';
      return '<span class="ficon">·</span>';
    }

    function shortPath(p) { return p.replace(/^\//, ""); }

    function renderLabTask(task) {
      return task.kind === "predict" ? renderPredict(task) : renderBuild(task);
    }

    function renderBuild(task) {
      var saved = getJson("labfiles:" + task.id, null);
      var files = Object.assign({}, task.files, saved || {});
      var readonly = task.readonly || [];
      var outputs = {};
      var openPath = task.openFile || Object.keys(files)[0];
      var solved = isDone("lab", task.id);

      var wrap = el("div", "lab lab-build" + (solved ? " solved" : ""));
      wrap.innerHTML =
        '<div class="lab-grid">' +
        '<aside class="lab-task">' +
        '<div class="lab-kicker">TASK · ' + esc(task.difficulty) + " · +" + taskXp(task) + ' XP <span class="lab-solved"' + (solved ? "" : " hidden") + ">✓ solved</span></div>" +
        '<h3 class="lab-title">' + esc(task.title) + "</h3>" +
        '<div class="lab-prompt">' + task.prompt + "</div>" +
        '<div class="lab-kicker">CHECKS</div>' +
        '<ul class="lab-checks"></ul>' +
        '<div class="lab-actions">' +
        '<button type="button" class="lab-btn primary build-btn">▶ Build</button>' +
        '<button type="button" class="lab-btn reset-btn">Reset</button>' +
        '<button type="button" class="lab-btn solution-btn">Solution</button>' +
        "</div>" +
        '<p class="lab-small-note">Editing works best on a bigger screen.</p>' +
        "</aside>" +
        '<aside class="lab-files"><div class="lab-kicker">PROJECT</div><div class="file-list"></div></aside>' +
        '<div class="lab-main">' +
        '<div class="lab-tab"><span class="tab-name"></span><span class="tab-badge" hidden>read-only</span></div>' +
        '<div class="lab-editor"><pre class="gutter" aria-hidden="true"></pre><textarea wrap="off" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="File contents"></textarea></div>' +
        '<div class="lab-terminal" aria-live="polite"><div class="term-line dim">Press Build to run tsc.</div></div>' +
        "</div>" +
        "</div>" +
        '<div class="lab-solution" hidden></div>';

      var fileList = wrap.querySelector(".file-list");
      var textarea = wrap.querySelector(".lab-editor textarea");
      var gutter = wrap.querySelector(".gutter");
      var tabName = wrap.querySelector(".tab-name");
      var tabBadge = wrap.querySelector(".tab-badge");
      var terminal = wrap.querySelector(".lab-terminal");
      glossify(wrap.querySelector(".lab-prompt"));
      var checksEl = wrap.querySelector(".lab-checks");
      var buildBtn = wrap.querySelector(".build-btn");
      var solutionEl = wrap.querySelector(".lab-solution");

      function renderChecks(states) {
        checksEl.innerHTML = "";
        task.checks.forEach(function (c, i) {
          var s = states ? states[i] : null;
          var li = el("li", s === null ? "" : (s ? "pass" : "fail"));
          li.innerHTML = '<span class="ck" aria-hidden="true">' + (s === null ? "○" : (s ? "✓" : "✗")) + "</span> " + esc(c.name);
          checksEl.appendChild(li);
        });
      }

      function isOutput(p) { return outputs[p] !== undefined && files[p] === undefined; }
      function isReadonly(p) { return isOutput(p) || readonly.indexOf(p) !== -1; }

      function renderFiles() {
        fileList.innerHTML = "";
        var paths = Object.keys(files).sort(function (a, b) {
          var an = a.indexOf("/node_modules/") === 0, bn = b.indexOf("/node_modules/") === 0;
          if (an !== bn) return an ? 1 : -1;
          return a < b ? -1 : 1;
        });
        paths.forEach(function (p) { fileList.appendChild(fileButton(p, false)); });
        var outPaths = Object.keys(outputs).filter(function (p) { return files[p] === undefined; }).sort();
        if (outPaths.length) {
          fileList.appendChild(el("div", "file-group", "OUTPUT"));
          outPaths.forEach(function (p) { fileList.appendChild(fileButton(p, true)); });
        }
      }

      function fileButton(p, isOut) {
        var depth = p.split("/").length - 2;
        var b = el("button", "file" + (p === openPath ? " active" : "") + (isOut ? " out" : ""),
          fileIcon(p) + '<span class="fname">' + esc(shortPath(p)) + "</span>");
        b.type = "button";
        b.style.setProperty("--depth", Math.min(depth, 3));
        b.title = shortPath(p);
        b.addEventListener("click", function () { open(p); });
        return b;
      }

      function syncGutter() {
        var n = textarea.value.split("\n").length;
        var lines = [];
        for (var i = 1; i <= n; i++) lines.push(i);
        gutter.textContent = lines.join("\n");
        gutter.scrollTop = textarea.scrollTop;
      }

      function open(p) {
        openPath = p;
        textarea.value = files[p] !== undefined ? files[p] : (outputs[p] || "");
        textarea.readOnly = isReadonly(p);
        tabName.innerHTML = fileIcon(p) + " " + esc(shortPath(p));
        tabBadge.hidden = !textarea.readOnly;
        tabBadge.textContent = isOutput(p) ? "compiled output" : "read-only";
        renderFiles();
        syncGutter();
      }

      function save() {
        var edits = {};
        Object.keys(files).forEach(function (p) {
          if (files[p] !== task.files[p]) edits[p] = files[p];
        });
        set("labfiles:" + task.id, JSON.stringify(edits));
      }

      textarea.addEventListener("input", function () {
        if (textarea.readOnly) return;
        files[openPath] = textarea.value;
        save();
        syncGutter();
      });
      textarea.addEventListener("scroll", function () { gutter.scrollTop = textarea.scrollTop; });
      textarea.addEventListener("focus", function () { engine.ensure().catch(function () {}); });
      tabIndent(textarea);

      function term(lines) {
        terminal.innerHTML = "";
        lines.forEach(function (l) {
          var d = el("div", "term-line " + (l.cls || ""));
          d.textContent = l.text;
          terminal.appendChild(d);
        });
      }

      buildBtn.addEventListener("click", function () {
        buildBtn.disabled = true;
        term([{ text: "$ tsc", cls: "cmd" }, { text: "Loading the TypeScript compiler…", cls: "dim" }]);
        engine.ensure().then(function () {
          var result = engine.buildProject(files);
          outputs = result.outputs;
          var lines = [{ text: "$ tsc", cls: "cmd" }];
          result.diagnostics.forEach(function (d) {
            lines.push({ text: engine.formatDiagnostic(d), cls: d.isError ? "err" : "warn" });
          });
          if (result.errorCount) {
            lines.push({ text: "Found " + result.errorCount + " error" + (result.errorCount === 1 ? "" : "s") + ".", cls: "err" });
          }
          var emitted = Object.keys(outputs).sort().map(shortPath);
          lines.push({ text: emitted.length ? "Emitted " + emitted.join(", ") : "Nothing was emitted.", cls: result.errorCount ? "dim" : "ok" });

          var exportsObj = {};
          if (task.runFile && outputs[task.runFile]) {
            lines.push({ text: "$ node " + shortPath(task.runFile), cls: "cmd" });
            var run = engine.runJs(outputs[task.runFile], task.exposes);
            run.logs.forEach(function (l) { lines.push({ text: l }); });
            if (run.error) lines.push({ text: run.error.name + ": " + run.error.message, cls: "err" });
            exportsObj = run.exports;
          }
          term(lines);

          var ctx = { options: result.options, outputs: outputs, diagnostics: result.diagnostics, errorCount: result.errorCount, exports: exportsObj, files: files };
          var states = task.checks.map(function (c) {
            try { return !!c.test(ctx); } catch (e) { return false; }
          });
          renderChecks(states);
          renderFiles();
          if (states.every(Boolean)) {
            markDone("lab", task.id);
            wrap.classList.add("solved");
            wrap.querySelector(".lab-solved").hidden = false;
          }
        }).catch(function (err) {
          term([{ text: "$ tsc", cls: "cmd" }, { text: err.message, cls: "err" }]);
        }).then(function () {
          buildBtn.disabled = false;
        });
      });

      wrap.querySelector(".reset-btn").addEventListener("click", function () {
        if (!confirm("Reset every file in this project back to how it started?")) return;
        files = Object.assign({}, task.files);
        outputs = {};
        set("labfiles:" + task.id, "{}");
        renderChecks(null);
        term([{ text: "Press Build to run tsc.", cls: "dim" }]);
        open(task.openFile || Object.keys(files)[0]);
      });

      wrap.querySelector(".solution-btn").addEventListener("click", function () {
        if (!solutionEl.hidden) { solutionEl.hidden = true; return; }
        solutionEl.innerHTML = '<div class="lab-kicker">SOLUTION</div>';
        Object.keys(task.solution).forEach(function (p) {
          solutionEl.appendChild(el("div", "sol-file", fileIcon(p) + " " + esc(shortPath(p))));
          var pre = el("pre");
          pre.textContent = task.solution[p];
          solutionEl.appendChild(pre);
        });
        var load = el("button", "lab-btn", "Load solution into the project");
        load.type = "button";
        load.addEventListener("click", function () {
          if (!confirm("Replace your files with the solution?")) return;
          Object.assign(files, task.solution);
          save();
          open(openPath);
        });
        solutionEl.appendChild(load);
        solutionEl.hidden = false;
      });

      renderChecks(null);
      open(openPath);
      return wrap;
    }

    function renderPredict(task) {
      var solved = isDone("lab", task.id);
      var wrap = el("div", "lab lab-predict" + (solved ? " solved" : ""));
      var optionText = Object.keys(task.compilerOptions).map(function (k) { return k + ": " + task.compilerOptions[k]; }).join(" · ");
      var outPath = task.showFile.replace(/\.ts$/, ".js");
      var picked = {};
      var viewPath = task.showFile;

      wrap.innerHTML =
        '<div class="lab-kicker">COMPILER · WHAT GETS EMITTED? · +' + taskXp(task) + ' XP <span class="lab-solved"' + (solved ? "" : " hidden") + '>✓ solved</span><span class="lab-opts">' + esc(optionText) + "</span></div>" +
        '<h3 class="lab-title">' + esc(task.title) + "</h3>" +
        '<div class="predict-files"></div>' +
        '<div class="predict-panes">' +
        '<div class="pane"><div class="pane-head src-head"></div><pre class="src-code"></pre></div>' +
        '<div class="pane hidden-pane"><div class="pane-head">' + fileIcon(outPath) + " " + esc(shortPath(outPath)) + '</div><pre class="out-code"><span class="placeholder">Hidden until you answer</span></pre></div>' +
        "</div>" +
        '<div class="predict-question">' + md(task.question) + ' <span class="predict-hint">Pick all that apply.</span></div>' +
        '<div class="predict-choices"></div>' +
        '<div class="lab-actions"><button type="button" class="lab-btn primary check-btn">Check</button><span class="predict-feedback"></span></div>' +
        '<div class="predict-explain" hidden></div>';

      var filesEl = wrap.querySelector(".predict-files");
      var srcHead = wrap.querySelector(".src-head");
      var srcCode = wrap.querySelector(".src-code");
      var outCode = wrap.querySelector(".out-code");
      var choicesEl = wrap.querySelector(".predict-choices");
      var feedback = wrap.querySelector(".predict-feedback");
      var explain = wrap.querySelector(".predict-explain");
      var hiddenPane = wrap.querySelector(".hidden-pane");

      function showSource(p) {
        viewPath = p;
        srcHead.innerHTML = fileIcon(p) + " " + esc(shortPath(p));
        srcCode.textContent = task.files[p];
        filesEl.innerHTML = "";
        var paths = Object.keys(task.files);
        if (paths.length > 1) {
          paths.forEach(function (fp) {
            var b = el("button", "file-chip" + (fp === viewPath ? " active" : ""), fileIcon(fp) + " " + esc(shortPath(fp)));
            b.type = "button";
            b.addEventListener("click", function () { showSource(fp); });
            filesEl.appendChild(b);
          });
        }
      }

      task.choices.forEach(function (c, i) {
        var b = el("button", "pchoice", '<span class="pbox" aria-hidden="true">✓</span><span>' + md(c) + "</span>");
        b.type = "button";
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () {
          picked[i] = !picked[i];
          choicesEl.classList.remove("checked");
          b.classList.toggle("on", !!picked[i]);
          b.setAttribute("aria-pressed", picked[i] ? "true" : "false");
          feedback.textContent = "";
        });
        choicesEl.appendChild(b);
      });

      function reveal() {
        outCode.textContent = "Compiling…";
        engine.ensure().then(function () {
          var outs = engine.compilePredict(task.files, task.compilerOptions);
          outCode.textContent = outs[outPath] !== undefined ? outs[outPath] : "(nothing emitted)";
          hiddenPane.classList.add("revealed");
        }).catch(function (err) {
          outCode.textContent = err.message;
        });
      }

      function showExplanation(correct) {
        explain.hidden = false;
        explain.innerHTML = (correct ? "<strong>Correct.</strong> " : "<strong>Not quite.</strong> Compare your picks with the real output. ") + md(task.explanation);
        glossify(explain);
      }

      wrap.querySelector(".check-btn").addEventListener("click", function () {
        var chosen = task.choices.map(function (_, i) { return !!picked[i]; });
        if (!chosen.some(Boolean)) {
          feedback.textContent = "Pick at least one answer first.";
          feedback.className = "predict-feedback warn";
          return;
        }
        var correct = chosen.every(function (v, i) { return v === (task.correct.indexOf(i) !== -1); });
        feedback.textContent = correct ? "✓ Correct" : "✗ Not quite";
        feedback.className = "predict-feedback " + (correct ? "good" : "bad");
        Array.prototype.forEach.call(choicesEl.children, function (b, i) {
          b.classList.toggle("should", task.correct.indexOf(i) !== -1);
        });
        choicesEl.classList.add("checked");
        showExplanation(correct);
        reveal();
        if (correct) {
          markDone("lab", task.id);
          wrap.classList.add("solved");
          wrap.querySelector(".lab-solved").hidden = false;
        }
      });

      showSource(task.showFile);
      if (solved) {
        task.correct.forEach(function (i) {
          picked[i] = true;
          choicesEl.children[i].classList.add("on", "should");
        });
        choicesEl.classList.add("checked");
        showExplanation(true);
        reveal();
      }
      return wrap;
    }

    // ------------------------------------------------------------------
    // Search
    // ------------------------------------------------------------------

    var searchIndex = null;

    function buildSearchIndex() {
      var items = [];
      levels.forEach(function (level) {
        if (level.kind === "chapter") {
          level.chapter.theory.forEach(function (q, i) {
            items.push({ level: level, section: "quiz", index: i, kind: "Quiz", text: plain(q.prompt) });
          });
          level.chapter.challenges.forEach(function (c, i) {
            items.push({ level: level, section: "challenges", index: i, kind: "Challenge", text: c.title, extra: plain(c.prompt) });
          });
          level.chapter.examples.forEach(function (ex, i) {
            items.push({ level: level, section: "examples", index: i, kind: "Example", text: plain(ex.title), extra: plain(ex.scenario) });
          });
        } else {
          level.lab.tasks.forEach(function (t, i) {
            items.push({ level: level, section: "tasks", index: i, kind: "Lab task", text: t.title, extra: plain(t.prompt || t.question || "") });
          });
        }
        // Guide hits: index 0 is the top of the guide, index i + 1 is section i.
        // (Glossary hits are added once, after this loop.)
        if (level.guide) {
          level.guide.glance.forEach(function (row) {
            items.push({ level: level, section: "guide", index: 0, kind: "Guide", text: row[0], extra: plain(row[1]) });
          });
          level.guide.sections.forEach(function (s, i) {
            var body = s.blocks.map(function (b) {
              if (typeof b === "string") return b;
              return b.code || (b.list ? b.list.join(" ") : "") || b.tip || b.warn || b.real || "";
            }).join(" ");
            items.push({ level: level, section: "guide", index: i + 1, kind: "Guide", text: plain(s.title), extra: plain(body) });
          });
        }
      });
      GLOSSARY.forEach(function (g) {
        items.push({ href: "#glossary/" + g.id, kind: "Glossary", text: g.term, extra: plain(g.def) });
      });
      return items;
    }

    function search(query) {
      var q = query.trim().toLowerCase();
      if (q.length < 2) return [];
      if (!searchIndex) searchIndex = buildSearchIndex();
      var hits = searchIndex.filter(function (it) {
        return it.text.toLowerCase().indexOf(q) !== -1 || (it.extra && it.extra.toLowerCase().indexOf(q) !== -1);
      });
      hits.sort(function (a, b) {
        return (b.text.toLowerCase().indexOf(q) !== -1) - (a.text.toLowerCase().indexOf(q) !== -1);
      });
      return hits.slice(0, 8);
    }

    return {
      DAILY_GOAL: DAILY_GOAL,
      levels: levels,
      esc: esc,
      md: md,
      el: el,
      isDone: isDone,
      levelCounts: levelCounts,
      sectionCounts: sectionCounts,
      levelIndex: levelIndex,
      levelUnlocked: levelUnlocked,
      totals: totals,
      xp: xp,
      todayCount: todayCount,
      streak: streak,
      nextLocked: nextLocked,
      firstUnfinished: firstUnfinished,
      taskXp: taskXp,
      renderDeck: renderDeck,
      handleKey: handleKey,
      renderChallenge: renderChallenge,
      renderExample: renderExample,
      renderExamples: renderExamples,
      renderGuide: renderGuide,
      renderGlossary: renderGlossary,
      setupBionic: setupBionic,
      bionicButton: bionicButton,
      glossaryCount: GLOSSARY.length,
      renderLabTask: renderLabTask,
      search: search,
      get: get,
      set: set
    };
  };
})();
