(function () {
  "use strict";

  var STORAGE_PREFIX = "react-questions:";
  var SOLVED_PREFIX = "react-questions-solved:";

  function qs(doc, testid) {
    return doc.querySelector('[data-testid="' + testid + '"]');
  }

  function textOf(el) {
    return el ? el.textContent.trim() : null;
  }

  function click(win, el) {
    el.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true }));
  }

  function setValue(win, el, value) {
    var proto = Object.getPrototypeOf(el);
    var setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, value);
    el.dispatchEvent(new win.Event("input", { bubbles: true }));
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function ok(name, pass, detail) {
    return { name: name, pass: !!pass, detail: detail || "" };
  }

  var QUESTIONS = [
    {
      id: "counter",
      title: "Counter",
      difficulty: "Easy",
      prompt: [
        "Build a <code>App</code> component that keeps a count in state and lets the user increment or decrement it.",
        "<ul>" +
          "<li>A paragraph with <code>data-testid=\"count\"</code> showing exactly <code>Count: {n}</code></li>" +
          "<li>A button with <code>data-testid=\"increment\"</code></li>" +
          "<li>A button with <code>data-testid=\"decrement\"</code></li>" +
          "<li>Count starts at <code>0</code></li>" +
        "</ul>"
      ].join("\n"),
      starter:
"function App() {\n" +
"  // TODO: add state for the count\n\n" +
"  return (\n" +
"    <div>\n" +
"      <p data-testid=\"count\">Count: 0</p>\n" +
"      <button data-testid=\"increment\">+</button>\n" +
"      <button data-testid=\"decrement\">-</button>\n" +
"    </div>\n" +
"  );\n" +
"}\n",
      solution:
"function App() {\n" +
"  const [count, setCount] = React.useState(0);\n\n" +
"  return (\n" +
"    <div>\n" +
"      <p data-testid=\"count\">Count: {count}</p>\n" +
"      <button data-testid=\"increment\" onClick={() => setCount(count + 1)}>+</button>\n" +
"      <button data-testid=\"decrement\" onClick={() => setCount(count - 1)}>-</button>\n" +
"    </div>\n" +
"  );\n" +
"}\n",
      tests: async function (doc, win) {
        var results = [];
        await wait(50);
        results.push(ok("starts at Count: 0", textOf(qs(doc, "count")) === "Count: 0", "got \"" + textOf(qs(doc, "count")) + "\""));

        var inc = qs(doc, "increment");
        click(win, inc);
        await wait(20);
        click(win, inc);
        await wait(30);
        results.push(ok("increments twice to Count: 2", textOf(qs(doc, "count")) === "Count: 2", "got \"" + textOf(qs(doc, "count")) + "\""));

        var dec = qs(doc, "decrement");
        click(win, dec);
        await wait(30);
        results.push(ok("decrements to Count: 1", textOf(qs(doc, "count")) === "Count: 1", "got \"" + textOf(qs(doc, "count")) + "\""));

        return results;
      }
    },
    {
      id: "toggle",
      title: "Toggle Visibility",
      difficulty: "Easy",
      prompt: [
        "Build an <code>App</code> that shows or hides a message when a button is clicked.",
        "<ul>" +
          "<li>A button with <code>data-testid=\"toggle\"</code></li>" +
          "<li>A paragraph with <code>data-testid=\"message\"</code> and the text <code>Peekaboo!</code></li>" +
          "<li>The message paragraph should only be in the page when it's shown &mdash; not just visually hidden</li>" +
          "<li>Start hidden</li>" +
        "</ul>"
      ].join("\n"),
      starter:
"function App() {\n" +
"  // TODO: add state to track whether the message is shown\n\n" +
"  return (\n" +
"    <div>\n" +
"      <button data-testid=\"toggle\">Show/Hide</button>\n" +
"      {/* TODO: only render this paragraph when shown */}\n" +
"      <p data-testid=\"message\">Peekaboo!</p>\n" +
"    </div>\n" +
"  );\n" +
"}\n",
      solution:
"function App() {\n" +
"  const [shown, setShown] = React.useState(false);\n\n" +
"  return (\n" +
"    <div>\n" +
"      <button data-testid=\"toggle\" onClick={() => setShown(!shown)}>Show/Hide</button>\n" +
"      {shown && <p data-testid=\"message\">Peekaboo!</p>}\n" +
"    </div>\n" +
"  );\n" +
"}\n",
      tests: async function (doc, win) {
        var results = [];
        await wait(50);
        results.push(ok("message hidden at first", !qs(doc, "message")));

        var btn = qs(doc, "toggle");
        click(win, btn);
        await wait(30);
        results.push(ok("message appears after click", textOf(qs(doc, "message")) === "Peekaboo!"));

        click(win, btn);
        await wait(30);
        results.push(ok("message disappears after second click", !qs(doc, "message")));

        return results;
      }
    },
    {
      id: "controlled-input",
      title: "Controlled Input",
      difficulty: "Medium",
      prompt: [
        "Build an <code>App</code> with a controlled text input that greets whoever is typing.",
        "<ul>" +
          "<li>A text input with <code>data-testid=\"name-input\"</code></li>" +
          "<li>A paragraph with <code>data-testid=\"greeting\"</code></li>" +
          "<li>While the input is empty, the greeting reads <code>Hello, stranger!</code></li>" +
          "<li>Once text is typed, it reads <code>Hello, {name}!</code>, updating as you type</li>" +
        "</ul>"
      ].join("\n"),
      starter:
"function App() {\n" +
"  // TODO: track the input's value in state\n\n" +
"  return (\n" +
"    <div>\n" +
"      <input data-testid=\"name-input\" placeholder=\"Your name\" />\n" +
"      <p data-testid=\"greeting\">Hello, stranger!</p>\n" +
"    </div>\n" +
"  );\n" +
"}\n",
      solution:
"function App() {\n" +
"  const [name, setName] = React.useState(\"\");\n\n" +
"  return (\n" +
"    <div>\n" +
"      <input\n" +
"        data-testid=\"name-input\"\n" +
"        placeholder=\"Your name\"\n" +
"        value={name}\n" +
"        onChange={(e) => setName(e.target.value)}\n" +
"      />\n" +
"      <p data-testid=\"greeting\">{name ? `Hello, ${name}!` : \"Hello, stranger!\"}</p>\n" +
"    </div>\n" +
"  );\n" +
"}\n",
      tests: async function (doc, win) {
        var results = [];
        await wait(50);
        results.push(ok("greets a stranger at first", textOf(qs(doc, "greeting")) === "Hello, stranger!", "got \"" + textOf(qs(doc, "greeting")) + "\""));

        var input = qs(doc, "name-input");
        setValue(win, input, "Ada");
        await wait(30);
        results.push(ok("greeting updates as you type", textOf(qs(doc, "greeting")) === "Hello, Ada!", "got \"" + textOf(qs(doc, "greeting")) + "\""));

        return results;
      }
    },
    {
      id: "list-rendering",
      title: "List Rendering",
      difficulty: "Medium",
      prompt: [
        "Render the given array of fruits as a list.",
        "<ul>" +
          "<li>A <code>&lt;ul&gt;</code> with <code>data-testid=\"fruit-list\"</code></li>" +
          "<li>One <code>&lt;li&gt;</code> per fruit, in order, each with a unique <code>key</code></li>" +
        "</ul>"
      ].join("\n"),
      starter:
"function App() {\n" +
"  const fruits = [\"Apple\", \"Banana\", \"Cherry\"];\n\n" +
"  return (\n" +
"    <ul data-testid=\"fruit-list\">\n" +
"      {/* TODO: render an <li> for each fruit, with a unique key */}\n" +
"    </ul>\n" +
"  );\n" +
"}\n",
      solution:
"function App() {\n" +
"  const fruits = [\"Apple\", \"Banana\", \"Cherry\"];\n\n" +
"  return (\n" +
"    <ul data-testid=\"fruit-list\">\n" +
"      {fruits.map((fruit) => (\n" +
"        <li key={fruit}>{fruit}</li>\n" +
"      ))}\n" +
"    </ul>\n" +
"  );\n" +
"}\n",
      tests: async function (doc, win) {
        var results = [];
        await wait(50);
        var list = qs(doc, "fruit-list");
        var items = list ? Array.prototype.slice.call(list.querySelectorAll("li")) : [];
        results.push(ok("renders 3 list items", items.length === 3, "got " + items.length));
        var texts = items.map(function (li) { return li.textContent.trim(); });
        results.push(ok("items are Apple, Banana, Cherry in order", JSON.stringify(texts) === JSON.stringify(["Apple", "Banana", "Cherry"]), "got " + JSON.stringify(texts)));
        return results;
      }
    },
    {
      id: "use-effect",
      title: "useEffect Timer",
      difficulty: "Medium",
      prompt: [
        "Build an <code>App</code> that starts in a loading state and becomes ready shortly after mounting.",
        "<ul>" +
          "<li>A paragraph with <code>data-testid=\"status\"</code>, starting with the text <code>Loading...</code></li>" +
          "<li>Using <code>useEffect</code>, after ~100ms set the status text to <code>Ready!</code></li>" +
        "</ul>"
      ].join("\n"),
      starter:
"function App() {\n" +
"  const [status, setStatus] = React.useState(\"Loading...\");\n\n" +
"  // TODO: after mount, wait 100ms then set status to \"Ready!\"\n\n" +
"  return <p data-testid=\"status\">{status}</p>;\n" +
"}\n",
      solution:
"function App() {\n" +
"  const [status, setStatus] = React.useState(\"Loading...\");\n\n" +
"  React.useEffect(() => {\n" +
"    const timer = setTimeout(() => setStatus(\"Ready!\"), 100);\n" +
"    return () => clearTimeout(timer);\n" +
"  }, []);\n\n" +
"  return <p data-testid=\"status\">{status}</p>;\n" +
"}\n",
      tests: async function (doc, win) {
        var results = [];
        await wait(30);
        results.push(ok("starts with Loading...", textOf(qs(doc, "status")) === "Loading...", "got \"" + textOf(qs(doc, "status")) + "\""));

        await wait(300);
        results.push(ok("becomes Ready! after mounting", textOf(qs(doc, "status")) === "Ready!", "got \"" + textOf(qs(doc, "status")) + "\""));

        return results;
      }
    },
    {
      id: "custom-hook",
      title: "Custom Hook",
      difficulty: "Hard",
      prompt: [
        "Write a custom hook <code>useToggle(initialValue)</code> that returns <code>[value, toggle]</code>, then use it to build a light switch.",
        "<ul>" +
          "<li><code>useToggle</code> returns the current boolean and a function that flips it</li>" +
          "<li>A paragraph with <code>data-testid=\"switch-status\"</code> showing <code>ON</code> or <code>OFF</code></li>" +
          "<li>A button with <code>data-testid=\"switch-button\"</code> that flips the switch</li>" +
          "<li>Starts <code>OFF</code></li>" +
        "</ul>"
      ].join("\n"),
      starter:
"function useToggle(initialValue = false) {\n" +
"  // TODO: implement a hook that returns [value, toggle]\n" +
"}\n\n" +
"function App() {\n" +
"  const [isOn, toggle] = useToggle(false);\n\n" +
"  return (\n" +
"    <div>\n" +
"      <p data-testid=\"switch-status\">{isOn ? \"ON\" : \"OFF\"}</p>\n" +
"      <button data-testid=\"switch-button\" onClick={toggle}>Flip</button>\n" +
"    </div>\n" +
"  );\n" +
"}\n",
      solution:
"function useToggle(initialValue = false) {\n" +
"  const [value, setValue] = React.useState(initialValue);\n" +
"  const toggle = () => setValue((v) => !v);\n" +
"  return [value, toggle];\n" +
"}\n\n" +
"function App() {\n" +
"  const [isOn, toggle] = useToggle(false);\n\n" +
"  return (\n" +
"    <div>\n" +
"      <p data-testid=\"switch-status\">{isOn ? \"ON\" : \"OFF\"}</p>\n" +
"      <button data-testid=\"switch-button\" onClick={toggle}>Flip</button>\n" +
"    </div>\n" +
"  );\n" +
"}\n",
      tests: async function (doc, win) {
        var results = [];
        await wait(50);
        results.push(ok("starts OFF", textOf(qs(doc, "switch-status")) === "OFF", "got \"" + textOf(qs(doc, "switch-status")) + "\""));

        var btn = qs(doc, "switch-button");
        click(win, btn);
        await wait(30);
        results.push(ok("flips to ON", textOf(qs(doc, "switch-status")) === "ON", "got \"" + textOf(qs(doc, "switch-status")) + "\""));

        click(win, btn);
        await wait(30);
        results.push(ok("flips back to OFF", textOf(qs(doc, "switch-status")) === "OFF", "got \"" + textOf(qs(doc, "switch-status")) + "\""));

        return results;
      }
    }
  ];

  var listEl = document.getElementById("question-list");
  var titleEl = document.getElementById("q-title");
  var difficultyEl = document.getElementById("q-difficulty");
  var promptEl = document.getElementById("q-prompt");
  var editorEl = document.getElementById("editor");
  var previewEl = document.getElementById("preview");
  var runBtn = document.getElementById("run-btn");
  var resetBtn = document.getElementById("reset-btn");
  var solutionBtn = document.getElementById("solution-btn");
  var solutionBlock = document.getElementById("solution-block");
  var solutionCodeEl = document.getElementById("solution-code");
  var loadSolutionBtn = document.getElementById("load-solution-btn");
  var resultsEl = document.getElementById("results");
  var resultListEl = document.getElementById("result-list");

  var currentIndex = 0;

  function codeStorageKey(q) { return STORAGE_PREFIX + q.id; }
  function solvedStorageKey(q) { return SOLVED_PREFIX + q.id; }

  function isSolved(q) {
    return localStorage.getItem(solvedStorageKey(q)) === "1";
  }

  function markSolved(q) {
    localStorage.setItem(solvedStorageKey(q), "1");
  }

  function loadCode(q) {
    return localStorage.getItem(codeStorageKey(q)) || q.starter;
  }

  function saveCode(q) {
    localStorage.setItem(codeStorageKey(q), editorEl.value);
  }

  function renderList() {
    listEl.innerHTML = "";
    QUESTIONS.forEach(function (q, i) {
      var btn = document.createElement("button");
      btn.className = i === currentIndex ? "active" : "";
      btn.innerHTML =
        q.title +
        (isSolved(q) ? '<span class="status solved">&#10003;</span>' : "") +
        '<span class="difficulty">' + q.difficulty + "</span>";
      btn.addEventListener("click", function () { selectQuestion(i); });
      listEl.appendChild(btn);
    });
  }

  function buildIframeDoc(code) {
    return "<!doctype html><html><head><meta charset=\"utf-8\">" +
      "<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:12px;color:#221d16;background:#fff;font-size:15px;}" +
      "button{font-family:inherit;padding:6px 12px;border-radius:6px;border:1px solid #ccc;background:#f6f1e7;cursor:pointer;}" +
      "input{font-family:inherit;padding:6px 8px;border-radius:6px;border:1px solid #ccc;}" +
      "#error-output{color:#c23c2a;font-family:'IBM Plex Mono',monospace;white-space:pre-wrap;font-size:12px;margin-top:10px;}</style>" +
      "</head><body>" +
      "<div id=\"root\"></div><div id=\"error-output\"></div>" +
      "<script src=\"https://unpkg.com/react@18/umd/react.development.js\"><\/script>" +
      "<script src=\"https://unpkg.com/react-dom@18/umd/react-dom.development.js\"><\/script>" +
      "<script src=\"https://unpkg.com/@babel/standalone/babel.min.js\"><\/script>" +
      "<script>window.addEventListener('error', function(e){document.getElementById('error-output').textContent='Error: '+e.message;});<\/script>" +
      "<script type=\"text/babel\">try{\n" + code + "\n" +
      "if (typeof App === 'undefined') { throw new Error('Define a component named App.'); }\n" +
      "ReactDOM.createRoot(document.getElementById('root')).render(<App />);\n" +
      "}catch(err){document.getElementById('error-output').textContent='Error: '+err.message;}<\/script>" +
      "</body></html>";
  }

  function selectQuestion(i) {
    currentIndex = i;
    var q = QUESTIONS[i];
    titleEl.textContent = q.title;
    difficultyEl.textContent = q.difficulty;
    promptEl.innerHTML = q.prompt;
    editorEl.value = loadCode(q);
    solutionBlock.hidden = true;
    solutionBtn.textContent = "Show Solution";
    solutionCodeEl.textContent = q.solution;
    resultsEl.hidden = true;
    resultListEl.innerHTML = "";
    renderList();
    runCurrent(false);
  }

  function renderResults(results) {
    resultListEl.innerHTML = "";
    results.forEach(function (r) {
      var li = document.createElement("li");
      li.className = r.pass ? "pass" : "fail";
      li.textContent = (r.pass ? "✓ " : "✗ ") + r.name + (r.detail ? " (" + r.detail + ")" : "");
      resultListEl.appendChild(li);
    });
    resultsEl.hidden = false;

    var q = QUESTIONS[currentIndex];
    if (results.length > 0 && results.every(function (r) { return r.pass; })) {
      markSolved(q);
      renderList();
    }
  }

  function runCurrent(withTests) {
    var q = QUESTIONS[currentIndex];
    saveCode(q);
    var code = editorEl.value;

    previewEl.onload = null;
    previewEl.srcdoc = buildIframeDoc(code);

    if (!withTests) return;

    previewEl.onload = function () {
      var doc, win;
      try {
        doc = previewEl.contentDocument;
        win = previewEl.contentWindow;
      } catch (e) {
        return;
      }
      q.tests(doc, win).then(renderResults).catch(function (err) {
        renderResults([ok("tests ran without errors", false, err.message)]);
      });
    };
  }

  editorEl.addEventListener("keydown", function (e) {
    if (e.key === "Tab") {
      e.preventDefault();
      var start = editorEl.selectionStart;
      var end = editorEl.selectionEnd;
      editorEl.value = editorEl.value.slice(0, start) + "  " + editorEl.value.slice(end);
      editorEl.selectionStart = editorEl.selectionEnd = start + 2;
    }
  });

  editorEl.addEventListener("input", function () {
    saveCode(QUESTIONS[currentIndex]);
  });

  runBtn.addEventListener("click", function () { runCurrent(true); });

  resetBtn.addEventListener("click", function () {
    var q = QUESTIONS[currentIndex];
    if (!confirm("Reset this question's code back to the starter?")) return;
    editorEl.value = q.starter;
    saveCode(q);
    resultsEl.hidden = true;
    runCurrent(false);
  });

  solutionBtn.addEventListener("click", function () {
    var showing = !solutionBlock.hidden;
    solutionBlock.hidden = showing;
    solutionBtn.textContent = showing ? "Show Solution" : "Hide Solution";
  });

  loadSolutionBtn.addEventListener("click", function () {
    var q = QUESTIONS[currentIndex];
    if (!confirm("Replace your code in the editor with the solution?")) return;
    editorEl.value = q.solution;
    saveCode(q);
    runCurrent(false);
  });

  selectQuestion(0);
})();
