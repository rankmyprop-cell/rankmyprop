(() => {
  if (window.__rmpAdminTableControlsBooted) return;
  window.__rmpAdminTableControlsBooted = true;

  function injectStyle() {
    if (document.getElementById("rmpAdminTableControlsStyle")) return;
    const st = document.createElement("style");
    st.id = "rmpAdminTableControlsStyle";
    st.textContent = [
      ".rmp-admin-table-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 10px}",
      ".rmp-admin-table-controls input,.rmp-admin-table-controls select{height:38px;min-width:180px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#e8edff;padding:0 12px}",
      ".rmp-admin-table-controls input::placeholder{color:#9aa3bf}"
    ].join("");
    document.head.appendChild(st);
  }

  function parseDate(text = "") {
    const raw = String(text || "").trim();
    if (!raw) return 0;
    const direct = Date.parse(raw);
    if (Number.isFinite(direct)) return direct;
    const mmddyyyy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mmddyyyy) {
      const [_, m, d, y] = mmddyyyy;
      const dt = Date.parse(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
      return Number.isFinite(dt) ? dt : 0;
    }
    return 0;
  }

  function getCellText(row, index = 0) {
    const cells = row.querySelectorAll("td");
    return String(cells[index]?.textContent || "").trim();
  }

  function attachControls(tableWrap) {
    if (!tableWrap || tableWrap.dataset.rmpCtlDone === "1") return;
    const table = tableWrap.querySelector("table");
    const tbody = tableWrap.querySelector("tbody");
    if (!table || !tbody) return;
    tableWrap.dataset.rmpCtlDone = "1";

    const controls = document.createElement("div");
    controls.className = "rmp-admin-table-controls";
    controls.innerHTML = [
      '<input type="search" placeholder="Search..." aria-label="Search table rows">',
      '<select aria-label="Sort table rows">',
      '<option value="latest">Latest</option>',
      '<option value="oldest">Oldest</option>',
      '<option value="asc">A-Z</option>',
      '<option value="desc">Z-A</option>',
      "</select>"
    ].join("");
    tableWrap.parentNode.insertBefore(controls, tableWrap);

    const search = controls.querySelector("input");
    const sort = controls.querySelector("select");
    const colCount = Math.max(1, table.querySelectorAll("thead th").length || 1);
    const emptyRow = () => `<tr><td colspan="${colCount}" class="empty">No matching records.</td></tr>`;

    let baseRows = [];
    let applying = false;
    let pending = false;
    let observer = null;

    function refreshBaseRows() {
      baseRows = Array.from(tbody.querySelectorAll("tr")).filter((row) => !row.querySelector(".empty"));
    }

    function apply() {
      if (applying) {
        pending = true;
        return;
      }
      applying = true;
      const q = String(search.value || "").trim().toLowerCase();
      const mode = String(sort.value || "latest");
      let rows = [...baseRows];

      if (q) {
        rows = rows.filter((row) => String(row.textContent || "").toLowerCase().includes(q));
      }

      if (mode === "asc") {
        rows.sort((a, b) => getCellText(a, 0).localeCompare(getCellText(b, 0)));
      } else if (mode === "desc") {
        rows.sort((a, b) => getCellText(b, 0).localeCompare(getCellText(a, 0)));
      } else if (mode === "oldest") {
        rows.sort((a, b) => parseDate(getCellText(a, 0)) - parseDate(getCellText(b, 0)));
      } else {
        rows.sort((a, b) => parseDate(getCellText(b, 0)) - parseDate(getCellText(a, 0)));
      }

      if (observer) observer.disconnect();
      if (!rows.length) {
        tbody.innerHTML = emptyRow();
      } else {
        tbody.innerHTML = "";
        rows.forEach((row) => tbody.appendChild(row));
      }
      if (observer) observer.observe(tbody, { childList: true });
      applying = false;
      if (pending) {
        pending = false;
        setTimeout(apply, 0);
      }
    }

    search.addEventListener("input", apply);
    sort.addEventListener("change", apply);

    observer = new MutationObserver(() => {
      if (applying) return;
      refreshBaseRows();
      apply();
    });
    observer.observe(tbody, { childList: true });

    refreshBaseRows();
    apply();
  }

  function boot() {
    injectStyle();
    document.querySelectorAll(".table-wrap").forEach(attachControls);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
