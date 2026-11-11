(function () {
  "use strict";

  var TS_VERSION = "5.4.5";
  var CDN = "https://cdn.jsdelivr.net/npm/typescript@" + TS_VERSION + "/lib/";
  var LIBS = ["lib.es2022.d.ts", "lib.dom.d.ts"];

  var state = { promise: null, ts: null, libs: null };

  function loadCompiler() {
    return new Promise(function (resolve, reject) {
      if (window.ts) { resolve(window.ts); return; }
      var script = document.createElement("script");
      script.src = CDN + "typescript.js";
      script.onload = function () {
        if (window.ts) resolve(window.ts);
        else reject(new Error("The TypeScript compiler loaded but didn't start. Reload and try again."));
      };
      script.onerror = function () {
        reject(new Error("Couldn't download the TypeScript compiler. Check your connection and try again."));
      };
      document.head.appendChild(script);
    });
  }

  // Lib files reference each other via /// <reference lib="..." />; crawl the graph in parallel waves.
  function loadLibs() {
    var cache = {};
    var seen = {};
    var queue = LIBS.slice();

    function wave() {
      var batch = queue.filter(function (name) { return !seen[name]; });
      queue = [];
      if (batch.length === 0) return Promise.resolve();
      batch.forEach(function (name) { seen[name] = true; });
      return Promise.all(batch.map(function (name) {
        return fetch(CDN + name)
          .then(function (res) { return res.ok ? res.text() : ""; })
          .catch(function () { return ""; })
          .then(function (text) {
            if (!text) return;
            cache[name] = text;
            var re = /\/\/\/\s*<reference\s+lib=["']([^"']+)["']\s*\/>/g;
            var m;
            while ((m = re.exec(text))) queue.push("lib." + m[1].toLowerCase() + ".d.ts");
          });
      })).then(wave);
    }

    return wave().then(function () {
      if (LIBS.some(function (name) { return !cache[name]; })) {
        throw new Error("Couldn't download TypeScript's built-in type definitions. Check your connection and try again.");
      }
      return cache;
    });
  }

  function ensure() {
    if (state.ts && state.libs) return Promise.resolve(state.ts);
    if (!state.promise) {
      state.promise = loadCompiler()
        .then(function (ts) {
          state.ts = ts;
          return loadLibs();
        })
        .then(function (libs) {
          state.libs = libs;
          return state.ts;
        })
        .catch(function (err) {
          state.promise = null;
          throw err;
        });
    }
    return state.promise;
  }

  function makeHost(files, outputs) {
    var ts = state.ts;
    var libs = state.libs;

    function read(path) {
      if (files[path] !== undefined) return files[path];
      var base = path.replace(/^.*\//, "");
      if (/^lib\..*\.d\.ts$/.test(base) && libs[base] !== undefined) return libs[base];
      return undefined;
    }

    function hasDir(dir) {
      if (dir === "" || dir === "/") return true;
      var prefix = dir.replace(/\/$/, "") + "/";
      return Object.keys(files).some(function (p) { return p.indexOf(prefix) === 0; });
    }

    return {
      getSourceFile: function (fileName, languageVersion) {
        var text = read(fileName);
        return text === undefined ? undefined : ts.createSourceFile(fileName, text, languageVersion, true);
      },
      writeFile: function (fileName, text) { outputs[fileName] = text; },
      getDefaultLibFileName: function () { return "/" + LIBS[0]; },
      getDefaultLibLocation: function () { return "/"; },
      useCaseSensitiveFileNames: function () { return true; },
      getCanonicalFileName: function (fileName) { return fileName; },
      getCurrentDirectory: function () { return "/"; },
      getNewLine: function () { return "\n"; },
      fileExists: function (fileName) { return read(fileName) !== undefined; },
      readFile: function (fileName) { return read(fileName); },
      directoryExists: hasDir,
      getDirectories: function (dir) {
        var prefix = dir.replace(/\/$/, "") + "/";
        var out = {};
        Object.keys(files).forEach(function (p) {
          if (p.indexOf(prefix) === 0) {
            var rest = p.slice(prefix.length);
            if (rest.indexOf("/") > 0) out[rest.split("/")[0]] = true;
          }
        });
        return Object.keys(out);
      },
      realpath: function (p) { return p; }
    };
  }

  function toDiagnostic(d) {
    var ts = state.ts;
    var out = {
      file: d.file ? d.file.fileName : null,
      line: null,
      column: null,
      code: d.code,
      isError: d.category === ts.DiagnosticCategory.Error,
      message: ts.flattenDiagnosticMessageText(d.messageText, " ")
    };
    if (d.file && d.start !== undefined) {
      var pos = d.file.getLineAndCharacterOfPosition(d.start);
      out.line = pos.line + 1;
      out.column = pos.character + 1;
    }
    return out;
  }

  function formatDiagnostic(d) {
    var where = d.file ? d.file.replace(/^\//, "") + (d.line ? "(" + d.line + "," + d.column + ")" : "") + ": " : "";
    return where + (d.isError ? "error" : "warning") + " TS" + d.code + ": " + d.message;
  }

  function withManagedOptions(options) {
    options.lib = LIBS.slice();
    options.skipLibCheck = true;
    if (!options.types) options.types = [];
    return options;
  }

  function sourceFiles(files) {
    return Object.keys(files).filter(function (p) {
      return /\.tsx?$/.test(p) && p.indexOf("/node_modules/") !== 0;
    });
  }

  function checkSnippet(code) {
    var ts = state.ts;
    var files = { "/input.ts": code };
    var options = withManagedOptions({
      target: ts.ScriptTarget.ES2017,
      module: ts.ModuleKind.None,
      strict: true
    });
    var program = ts.createProgram(["/input.ts"], options, makeHost(files, {}));
    return ts.getPreEmitDiagnostics(program)
      .filter(function (d) { return d.file && d.file.fileName === "/input.ts"; })
      .map(toDiagnostic);
  }

  function transpileForRun(code) {
    var ts = state.ts;
    return ts.transpileModule(code, {
      compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.None }
    }).outputText;
  }

  function safeStringify(obj) {
    try { return JSON.stringify(obj); } catch (e) { return String(obj); }
  }

  function runJs(jsCode, exposeNames) {
    var logs = [];
    var originalLog = console.log;
    console.log = function () {
      logs.push(Array.prototype.map.call(arguments, function (a) {
        return (typeof a === "object" && a !== null) ? safeStringify(a) : String(a);
      }).join(" "));
    };
    var exportsObj = {};
    var error = null;
    try {
      var returnExpr = "({" + (exposeNames || []).map(function (n) {
        return JSON.stringify(n) + ": (typeof " + n + " !== 'undefined' ? " + n + " : undefined)";
      }).join(",") + "})";
      exportsObj = new Function(jsCode + "\nreturn " + returnExpr + ";")();
    } catch (e) {
      error = e;
    } finally {
      console.log = originalLog;
    }
    return { logs: logs, exports: exportsObj || {}, error: error };
  }

  function buildProject(files) {
    var ts = state.ts;
    var rootNames = sourceFiles(files);
    var options = {};
    var configErrors = [];
    var configText = files["/tsconfig.json"];

    if (configText !== undefined) {
      var parsed = ts.parseConfigFileTextToJson("/tsconfig.json", configText);
      if (parsed.error) {
        configErrors.push(parsed.error);
      } else {
        var parseHost = {
          useCaseSensitiveFileNames: true,
          readDirectory: function () { return rootNames.slice(); },
          fileExists: function (p) { return files[p] !== undefined; },
          readFile: function (p) { return files[p]; }
        };
        var result = ts.parseJsonConfigFileContent(parsed.config, parseHost, "/", undefined, "/tsconfig.json");
        options = result.options;
        configErrors = result.errors.filter(function (e) { return e.code !== 18003; });
        if (result.fileNames.length) rootNames = result.fileNames;
      }
    }

    withManagedOptions(options);
    var outputs = {};
    var diagnostics = configErrors.map(toDiagnostic);

    if (configErrors.length === 0) {
      var program = ts.createProgram(rootNames, options, makeHost(files, outputs));
      var emit = program.emit();
      diagnostics = ts.getPreEmitDiagnostics(program).concat(emit.diagnostics).map(toDiagnostic);
    }

    var seen = {};
    diagnostics = diagnostics.filter(function (d) {
      var key = formatDiagnostic(d);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });

    return {
      options: options,
      outputs: outputs,
      diagnostics: diagnostics,
      errorCount: diagnostics.filter(function (d) { return d.isError; }).length
    };
  }

  function compilePredict(files, compilerOptionsJson) {
    var ts = state.ts;
    var converted = ts.convertCompilerOptionsFromJson(compilerOptionsJson, "/");
    var options = withManagedOptions(converted.options);
    options.noEmitOnError = false;
    var outputs = {};
    var program = ts.createProgram(sourceFiles(files), options, makeHost(files, outputs));
    program.emit();
    return outputs;
  }

  window.TSW_ENGINE = {
    ensure: ensure,
    checkSnippet: checkSnippet,
    transpileForRun: transpileForRun,
    runJs: runJs,
    buildProject: buildProject,
    compilePredict: compilePredict,
    formatDiagnostic: formatDiagnostic
  };
})();
