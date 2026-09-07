// The loaded file lives here for whatever comes next (e.g. sending to an LLM).
var state = { file: null, previewUrl: null };

// Replace with your deployed Worker's URL (see file-upload/worker/).
var WORKER_URL = "https://file-analyzer.YOUR-SUBDOMAIN.workers.dev";

// application/msword (old .doc) isn't supported here — mammoth.js only reads .docx.
var ANALYZABLE_TYPES = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx"
};
var MAX_ANALYZE_BYTES = 15 * 1024 * 1024; // keeps the base64 payload under Claude's request-size limit

var dropzone = document.getElementById("dropzone");
var fileInput = document.getElementById("fileInput");
var fileInfo = document.getElementById("fileInfo");
var fileGlyph = document.getElementById("fileGlyph");
var fileName = document.getElementById("fileName");
var fileDetail = document.getElementById("fileDetail");
var removeFile = document.getElementById("removeFile");
var preview = document.getElementById("preview");
var next = document.getElementById("next");
var nextLabel = document.getElementById("nextLabel");
var processBtn = document.getElementById("processBtn");
var analysis = document.getElementById("analysis");
var analysisText = document.getElementById("analysisText");

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function extGlyph(name) {
  var m = /\.([a-z0-9]+)$/i.exec(name || "");
  return m ? m[1].toUpperCase().slice(0, 4) : "FILE";
}

function loadFile(file) {
  if (!file) return;
  state.file = file;

  fileGlyph.textContent = extGlyph(file.name);
  fileName.textContent = file.name;
  fileDetail.textContent = formatSize(file.size) + (file.type ? " · " + file.type : "");
  fileInfo.classList.add("show");

  if (state.previewUrl) {
    URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null;
  }
  preview.innerHTML = "";
  preview.classList.remove("show");

  if (file.type.indexOf("image/") === 0) {
    state.previewUrl = URL.createObjectURL(file);
    var img = document.createElement("img");
    img.src = state.previewUrl;
    preview.appendChild(img);
    preview.classList.add("show");
  } else if (file.type === "application/pdf") {
    state.previewUrl = URL.createObjectURL(file);
    var embed = document.createElement("embed");
    embed.src = state.previewUrl;
    embed.type = "application/pdf";
    preview.appendChild(embed);
    preview.classList.add("show");
  }

  var kind = ANALYZABLE_TYPES[file.type];
  processBtn.disabled = !kind;
  processBtn.textContent = "PROCESS →";
  nextLabel.textContent = kind
    ? "Ready to analyze with Claude."
    : "File held in memory. Only PDF and Word (.docx) files can be analyzed.";
  analysis.hidden = true;
  analysisText.textContent = "";

  next.classList.add("show");
  dropzone.style.display = "none";
}

function clearFile() {
  state.file = null;
  if (state.previewUrl) {
    URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null;
  }
  fileInput.value = "";
  fileInfo.classList.remove("show");
  preview.innerHTML = "";
  preview.classList.remove("show");
  next.classList.remove("show");
  analysis.hidden = true;
  analysisText.textContent = "";
  dropzone.style.display = "";
}

function fileToBase64(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function () { resolve(reader.result.split(",")[1]); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractDocxText(file) {
  return file.arrayBuffer().then(function (buffer) {
    return mammoth.extractRawText({ arrayBuffer: buffer });
  }).then(function (result) {
    return result.value;
  });
}

function analyzeFile() {
  var file = state.file;
  var kind = file && ANALYZABLE_TYPES[file.type];
  if (!kind) return;

  if (file.size > MAX_ANALYZE_BYTES) {
    analysisText.textContent = "That file's a bit large to analyze here (over " + formatSize(MAX_ANALYZE_BYTES) + ").";
    analysis.hidden = false;
    return;
  }

  processBtn.disabled = true;
  processBtn.textContent = "ANALYZING…";
  analysis.hidden = true;
  analysisText.textContent = "";

  var payload = { filename: file.name };
  var prep = kind === "pdf"
    ? fileToBase64(file).then(function (base64) { payload.data = base64; })
    : extractDocxText(file).then(function (text) { payload.text = text; });

  prep
    .then(function () {
      return fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    })
    .then(function (res) {
      if (!res.ok) throw new Error("Request failed (" + res.status + ")");
      return res.json();
    })
    .then(function (data) {
      analysisText.textContent = data.analysis || "No analysis returned.";
      analysis.hidden = false;
    })
    .catch(function (err) {
      analysisText.textContent = "Something went wrong: " + err.message;
      analysis.hidden = false;
    })
    .then(function () {
      processBtn.disabled = false;
      processBtn.textContent = "PROCESS →";
    });
}

dropzone.addEventListener("click", function () { fileInput.click(); });
fileInput.addEventListener("change", function () {
  if (fileInput.files && fileInput.files[0]) loadFile(fileInput.files[0]);
});

["dragenter", "dragover"].forEach(function (evt) {
  dropzone.addEventListener(evt, function (e) {
    e.preventDefault();
    dropzone.classList.add("drag");
  });
});
["dragleave", "dragend"].forEach(function (evt) {
  dropzone.addEventListener(evt, function (e) {
    e.preventDefault();
    dropzone.classList.remove("drag");
  });
});
dropzone.addEventListener("drop", function (e) {
  e.preventDefault();
  dropzone.classList.remove("drag");
  if (e.dataTransfer.files && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
});

removeFile.addEventListener("click", function (e) {
  e.stopPropagation();
  clearFile();
});

processBtn.addEventListener("click", analyzeFile);
