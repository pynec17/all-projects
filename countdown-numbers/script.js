(function () {
  var LARGE = [25, 50, 75, 100];
  var SMALL = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10];

  var target = 0;
  var original = [];      // the 6 drawn numbers, fixed
  var slots = [];         // 6 fixed positions: {id, value, expr} or null (gap)
  var history = [];       // snapshots of slots for undo
  var nextId = 1;

  var selectedIndex = null;
  var selectedOp = null;
  var locked = false;

  var setupEl = document.getElementById("setup");
  var gameEl = document.getElementById("game");
  var tilesEl = document.getElementById("tiles");
  var opsEl = document.getElementById("ops");
  var targetEl = document.getElementById("target");
  var logEl = document.getElementById("log");
  var resultEl = document.getElementById("result");

  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("new-btn").addEventListener("click", function () {
    gameEl.classList.remove("active");
    setupEl.classList.remove("hidden");
  });
  document.getElementById("undo-btn").addEventListener("click", undo);
  document.getElementById("reset-btn").addEventListener("click", resetTiles);
  document.getElementById("submit-btn").addEventListener("click", submit);

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function startGame() {
    var largeCount = Math.floor(Math.random() * 5); // 0-4, decided for the player
    var largePool = shuffle(LARGE).slice(0, largeCount);
    var smallPool = shuffle(SMALL).slice(0, 6 - largeCount);
    var drawn = shuffle(largePool.concat(smallPool));

    original = drawn.slice();
    target = Math.floor(Math.random() * 899) + 101; // 101-999

    slots = drawn.map(function (v) { return { id: nextId++, value: v, expr: String(v) }; });
    history = [];
    selectedIndex = null;
    selectedOp = null;
    locked = false;

    targetEl.textContent = target;
    logEl.innerHTML = "";
    resultEl.innerHTML = "";
    document.getElementById("submit-btn").disabled = false;

    setupEl.classList.add("hidden");
    gameEl.classList.add("active");

    renderSlots();
    renderOps();
  }

  function renderSlots() {
    tilesEl.innerHTML = "";
    slots.forEach(function (t, idx) {
      var b = document.createElement("div");
      if (t === null) {
        b.className = "tile gap";
      } else {
        b.className = "tile" + (idx === selectedIndex ? " selected" : "");
        b.textContent = t.value;
        b.title = t.expr;
        b.addEventListener("click", function () { onSlotClick(idx); });
      }
      tilesEl.appendChild(b);
    });
    document.getElementById("undo-btn").disabled = history.length === 0 || locked;
    document.getElementById("reset-btn").disabled = history.length === 0 || locked;
  }

  function renderOps() {
    var opEls = opsEl.querySelectorAll(".op");
    opEls.forEach(function (el) {
      el.classList.toggle("selected", el.getAttribute("data-op") === selectedOp);
      el.onclick = function () { onOpClick(el.getAttribute("data-op")); };
    });
  }

  function setTilesDisabled(v) {
    tilesEl.querySelectorAll(".tile").forEach(function (el) {
      if (v) el.setAttribute("disabled", "disabled"); else el.removeAttribute("disabled");
    });
  }
  function setOpsDisabled(v) {
    opsEl.querySelectorAll(".op").forEach(function (el) {
      if (v) el.setAttribute("disabled", "disabled"); else el.removeAttribute("disabled");
    });
  }

  function onSlotClick(idx) {
    if (locked) return;
    if (slots[idx] === null) return;
    if (selectedIndex === idx) {
      selectedIndex = null;
      renderSlots();
      return;
    }
    if (selectedIndex === null) {
      selectedIndex = idx;
      renderSlots();
      return;
    }
    if (selectedOp === null) {
      // switch selection to the newly clicked tile
      selectedIndex = idx;
      renderSlots();
      return;
    }
    // we have slot A + op selected, this click is slot B
    combine(selectedIndex, idx, selectedOp);
  }

  function onOpClick(op) {
    if (locked) return;
    if (selectedIndex === null) return;
    selectedOp = (selectedOp === op) ? null : op;
    renderOps();
  }

  function combine(idxA, idxB, op) {
    var a = slots[idxA];
    var b = slots[idxB];
    if (!a || !b) return;

    var val;
    if (op === "+") val = a.value + b.value;
    else if (op === "-") {
      if (a.value === b.value) return;
      val = Math.abs(a.value - b.value);
    } else if (op === "*") val = a.value * b.value;
    else if (op === "/") {
      var hi = Math.max(a.value, b.value), lo = Math.min(a.value, b.value);
      if (lo === 0 || hi % lo !== 0) return;
      val = hi / lo;
    }
    if (!Number.isInteger(val) || val <= 0) return;

    var symbol = op === "-" ? (a.value >= b.value ? (a.expr + " - " + b.expr) : (b.expr + " - " + a.expr))
               : op === "/" ? (a.value >= b.value ? (a.expr + " / " + b.expr) : (b.expr + " / " + a.expr))
               : (a.expr + " " + (op === "*" ? "×" : op) + " " + b.expr);
    var expr = "(" + symbol + ")";

    history.push(slots.map(function (s) { return s ? { id: s.id, value: s.value, expr: s.expr } : null; }));

    var newTile = { id: nextId++, value: val, expr: expr };
    slots[idxA] = newTile;
    slots[idxB] = null;

    logLine(symbol + " = " + val);

    selectedIndex = null;
    selectedOp = null;
    renderSlots();
    renderOps();

    if (val === target) submit();
  }

  function logLine(text) {
    var d = document.createElement("div");
    d.textContent = text;
    logEl.appendChild(d);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function undo() {
    if (locked || history.length === 0) return;
    slots = history.pop();
    selectedIndex = null;
    selectedOp = null;
    if (logEl.lastChild) logEl.removeChild(logEl.lastChild);
    renderSlots();
    renderOps();
  }

  function resetTiles() {
    if (locked || history.length === 0) return;
    slots = original.map(function (v) { return { id: nextId++, value: v, expr: String(v) }; });
    history = [];
    selectedIndex = null;
    selectedOp = null;
    logEl.innerHTML = "";
    renderSlots();
    renderOps();
  }

  function submit() {
    if (locked) return;
    locked = true;
    setTilesDisabled(true);
    setOpsDisabled(true);
    finish();
  }

  function finish() {
    document.getElementById("submit-btn").disabled = true;
    document.getElementById("undo-btn").disabled = true;
    document.getElementById("reset-btn").disabled = true;

    var best = slots.reduce(function (b, t) {
      if (t === null) return b;
      var d = Math.abs(t.value - target);
      return (b === null || d < b.diff) ? { diff: d, tile: t } : b;
    }, null);

    var diff = best ? best.diff : Infinity;
    var score = diff === 0 ? 10 : diff <= 5 ? 7 : diff <= 10 ? 5 : 0;

    var html = "";
    if (best) {
      html += "Closest: <strong>" + best.tile.value + "</strong> (off by " + diff + ") &mdash; ";
    } else {
      html += "No numbers left. ";
    }
    html += "<span class=\"score\">" + score + " points</span>";

    var solved = solve(original, target);
    if (solved) {
      html += "<span class=\"solution\">Best possible: " + solved.expr + " = " + solved.value +
              (solved.value === target ? " (exact)" : " (off by " + Math.abs(solved.value - target) + ")") +
              "</span>";
    }
    resultEl.innerHTML = html;
  }

  // --- solver: brute-force search over all ways to combine the 6 numbers ---
  function solve(numbers, targetVal) {
    var start = numbers.map(function (v) { return { value: v, expr: String(v) }; });
    var best = null;

    function consider(item) {
      var d = Math.abs(item.value - targetVal);
      if (best === null || d < best.diff) best = { diff: d, value: item.value, expr: item.expr };
    }

    function search(list) {
      list.forEach(consider);
      if (best && best.diff === 0) return;
      for (var i = 0; i < list.length; i++) {
        for (var j = i + 1; j < list.length; j++) {
          var a = list[i], b = list[j];
          var rest = list.filter(function (_, idx) { return idx !== i && idx !== j; });
          var cands = [];

          cands.push({ value: a.value + b.value, expr: "(" + a.expr + " + " + b.expr + ")" });
          cands.push({ value: a.value * b.value, expr: "(" + a.expr + " × " + b.expr + ")" });
          if (a.value !== b.value) {
            var hi = a.value > b.value ? a : b, lo = a.value > b.value ? b : a;
            cands.push({ value: hi.value - lo.value, expr: "(" + hi.expr + " - " + lo.expr + ")" });
          }
          var hiv = Math.max(a.value, b.value), lov = Math.min(a.value, b.value);
          var hiT = a.value >= b.value ? a : b, loT = a.value >= b.value ? b : a;
          if (lov !== 0 && hiv % lov === 0) {
            cands.push({ value: hiv / lov, expr: "(" + hiT.expr + " / " + loT.expr + ")" });
          }

          cands.forEach(function (c) {
            if (!Number.isInteger(c.value) || c.value <= 0) return;
            search(rest.concat([c]));
            if (best && best.diff === 0) return;
          });
          if (best && best.diff === 0) return;
        }
        if (best && best.diff === 0) return;
      }
    }

    search(start);
    return best;
  }
})();
