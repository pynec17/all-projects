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
        : el("pre", "", "<code>" + esc(example.code) + "</code>"));
      wrap.appendChild(el("p", "takeaway",
        "<strong>" + (example.simple ? "Key point:" : "Why it matters:") + "</strong> " + md(example.takeaway)));
      return wrap;
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

    function renderGuideCode(block) {
      var wrap = el("div", "guide-code");
      var pre = el("pre", "", "<code>" + esc(block.code) + "</code>");
      wrap.appendChild(pre);
      if (!block.run) {
        if (block.caption) wrap.appendChild(el("p", "guide-caption", rich(block.caption)));
        return wrap;
      }

      var editor = el("textarea", "editor guide-editor");
      editor.setAttribute("wrap", "off");
      editor.setAttribute("spellcheck", "false");
      editor.setAttribute("autocapitalize", "off");
      editor.setAttribute("aria-label", "Editable example");
      editor.value = block.code;
      editor.hidden = true;
      tabIndent(editor);
      wrap.appendChild(editor);

      var bar = el("div", "guide-code-bar");
      var runBtn = el("button", "btn small primary", "Try it");
      var jsBtn = el("button", "btn small", "Show JavaScript");
      var resetBtn = el("button", "btn small", "Reset");
      runBtn.type = jsBtn.type = resetBtn.type = "button";
      resetBtn.hidden = true;
      var status = el("span", "status");
      bar.appendChild(runBtn);
      bar.appendChild(jsBtn);
      bar.appendChild(resetBtn);
      bar.appendChild(status);
      wrap.appendChild(bar);
      if (block.caption) wrap.appendChild(el("p", "guide-caption", rich(block.caption)));

      var out = el("div", "guide-out");
      out.hidden = true;
      wrap.appendChild(out);
      var jsOut = el("div", "guide-js");
      jsOut.hidden = true;
      wrap.appendChild(jsOut);

      function sizeEditor() {
        editor.style.height = (editor.value.split("\n").length * 21 + 28) + "px";
      }

      function startEditing() {
        if (!editor.hidden) return;
        pre.hidden = true;
        editor.hidden = false;
        resetBtn.hidden = false;
        runBtn.textContent = "Run";
        sizeEditor();
      }

      function withCompiler(work) {
        status.textContent = "Loading the TypeScript compiler…";
        runBtn.disabled = jsBtn.disabled = true;
        engine.ensure().then(work).catch(function (err) {
          out.hidden = false;
          out.innerHTML = '<div class="guide-out-label bad">Error</div><pre class="guide-out-lines bad"></pre>';
          out.querySelector("pre").textContent = err.message;
        }).then(function () {
          status.textContent = "";
          runBtn.disabled = jsBtn.disabled = false;
        });
      }

      function run() {
        startEditing();
        withCompiler(function () {
          var code = editor.value;
          var diags = engine.checkSnippet(code);
          out.hidden = false;
          if (diags.length) {
            out.innerHTML = '<div class="guide-out-label bad">Type errors</div><pre class="guide-out-lines bad"></pre>';
            out.querySelector("pre").textContent = diags.map(function (d) {
              return (d.line ? "Line " + d.line + ": " : "") + d.message;
            }).join("\n");
            return;
          }
          var result = engine.runJs(engine.transpileForRun(code), []);
          var lines = result.logs.slice();
          if (result.error) lines.push("Runtime error: " + result.error.message);
          out.innerHTML = '<div class="guide-out-label good">✓ Compiles. Output</div><pre class="guide-out-lines"></pre>';
          out.querySelector("pre").textContent = lines.length ? lines.join("\n") : "(no console output)";
          if (!jsOut.hidden) showJs();
        });
      }

      function showJs() {
        var js = engine.transpileForRun(editor.value).replace(/\n+$/, "");
        jsOut.hidden = false;
        jsOut.innerHTML = '<div class="guide-out-label">Emitted JavaScript (types erased)</div><pre></pre>';
        jsOut.querySelector("pre").textContent = js;
        jsBtn.textContent = "Hide JavaScript";
      }

      runBtn.addEventListener("click", run);
      jsBtn.addEventListener("click", function () {
        if (!jsOut.hidden) {
          jsOut.hidden = true;
          jsBtn.textContent = "Show JavaScript";
          return;
        }
        withCompiler(showJs);
      });
      resetBtn.addEventListener("click", function () {
        editor.value = block.code;
        sizeEditor();
        out.hidden = true;
        if (!jsOut.hidden) withCompiler(showJs);
      });
      editor.addEventListener("input", sizeEditor);
      editor.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
      });
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
      renderLabTask: renderLabTask,
      search: search,
      get: get,
      set: set
    };
  };
})();
