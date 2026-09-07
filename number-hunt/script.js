var target = Math.floor(Math.random() * 100) + 1;
var tries = 0;
var input = document.getElementById("guess");
var msg = document.getElementById("msg");
var triesEl = document.getElementById("tries");

function guess() {
  var v = parseInt(input.value, 10);
  if (isNaN(v) || v < 1 || v > 100) { msg.className = "msg"; msg.textContent = "Enter 1–100."; return; }
  tries++;
  triesEl.textContent = tries + (tries === 1 ? " guess" : " guesses");
  if (v === target) {
    msg.className = "msg win";
    msg.textContent = "Got it in " + tries + "! Refresh to play again.";
  } else if (v < target) {
    msg.className = "msg hot"; msg.textContent = "Higher ↑";
  } else {
    msg.className = "msg hot"; msg.textContent = "Lower ↓";
  }
  input.select();
}
document.getElementById("go").addEventListener("click", guess);
input.addEventListener("keydown", function (e) { if (e.key === "Enter") guess(); });
