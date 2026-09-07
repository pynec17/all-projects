// The loaded file lives here for whatever comes next (e.g. sending to an LLM).
var state = { file: null, previewUrl: null };

var dropzone = document.getElementById("dropzone");
var fileInput = document.getElementById("fileInput");
var fileInfo = document.getElementById("fileInfo");
var fileGlyph = document.getElementById("fileGlyph");
var fileName = document.getElementById("fileName");
var fileDetail = document.getElementById("fileDetail");
var removeFile = document.getElementById("removeFile");
var preview = document.getElementById("preview");
var next = document.getElementById("next");
var processBtn = document.getElementById("processBtn");

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
  dropzone.style.display = "";
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
