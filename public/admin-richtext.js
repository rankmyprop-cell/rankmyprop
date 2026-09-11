(function () {
  "use strict";

  var page = (window.location.pathname.split("/").pop() || "").toLowerCase();
  if (!/^admin-/.test(page)) return;

  var areas = Array.prototype.slice.call(document.querySelectorAll("textarea"));
  if (!areas.length) return;

  var style = document.createElement("style");
  style.textContent = [
    ".rmp-rt-wrap{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}",
    ".rmp-rt-btn{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#f1f5ff;border-radius:999px;padding:6px 12px;font: 600 12px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer}",
    ".rmp-rt-btn:hover{border-color:rgba(122,116,255,.5);background:rgba(122,116,255,.18)}"
  ].join("");
  document.head.appendChild(style);

  function ping(el) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function wrap(el, left, right, placeholder) {
    var start = Number(el.selectionStart || 0);
    var end = Number(el.selectionEnd || 0);
    var selected = el.value.slice(start, end) || placeholder;
    var insert = left + selected + right;
    el.focus();
    if (typeof el.setRangeText === "function") {
      el.setRangeText(insert, start, end, "select");
      el.selectionStart = start + left.length;
      el.selectionEnd = start + left.length + selected.length;
    } else {
      el.value = el.value.slice(0, start) + insert + el.value.slice(end);
      el.selectionStart = start + left.length;
      el.selectionEnd = start + left.length + selected.length;
    }
    ping(el);
  }

  function linkify(el) {
    var start = Number(el.selectionStart || 0);
    var end = Number(el.selectionEnd || 0);
    var selected = el.value.slice(start, end).trim();
    var text = selected || "link text";
    var href = window.prompt("Enter URL", "https://");
    if (!href) return;
    href = String(href).trim();
    if (!href) return;
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(href)) href = "https://" + href;

    var insert = "[" + text + "](" + href + ")";
    el.focus();
    if (typeof el.setRangeText === "function") {
      el.setRangeText(insert, start, end, "end");
    } else {
      el.value = el.value.slice(0, start) + insert + el.value.slice(end);
      el.selectionStart = el.selectionEnd = start + insert.length;
    }
    ping(el);
  }

  areas.forEach(function (el) {
    if (!el || el.dataset.richtextReady === "1" || el.dataset.noRichtext === "1") return;
    el.dataset.richtextReady = "1";

    var bar = document.createElement("div");
    bar.className = "rmp-rt-wrap";
    bar.innerHTML = [
      '<button type="button" class="rmp-rt-btn" data-cmd="bold">Bold</button>',
      '<button type="button" class="rmp-rt-btn" data-cmd="italic">Italic</button>',
      '<button type="button" class="rmp-rt-btn" data-cmd="highlight">Highlight</button>',
      '<button type="button" class="rmp-rt-btn" data-cmd="link">Link</button>'
    ].join("");

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-cmd]");
      if (!btn) return;
      var cmd = btn.dataset.cmd;
      if (cmd === "bold") wrap(el, "**", "**", "bold text");
      if (cmd === "italic") wrap(el, "*", "*", "italic text");
      if (cmd === "highlight") wrap(el, "==", "==", "highlight text");
      if (cmd === "link") linkify(el);
    });

    el.parentNode.insertBefore(bar, el);
  });
})();
