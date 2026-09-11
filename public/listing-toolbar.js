(function () {
  var styleId = "rmpListingToolbarStyles";
  if (!document.getElementById(styleId)) {
    var link = document.createElement("link");
    link.id = styleId;
    link.rel = "stylesheet";
    link.href = "/listing-toolbar.css";
    document.head.appendChild(link);
  }

  function closeAll(except) {
    document.querySelectorAll(".rmp-custom-select.is-open").forEach(function (item) {
      if (item !== except) item.classList.remove("is-open");
    });
  }

  function iconFor(id) {
    if (id === "country") {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 12h16M12 4c2.2 2.2 3.3 4.9 3.3 8S14.2 17.8 12 20M12 4c-2.2 2.2-3.3 4.9-3.3 8S9.8 17.8 12 20" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10M7 9h7M7 13h4M7 17h1M17 13v6m0 0-2.5-2.5M17 19l2.5-2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function enhanceSelect(select) {
    if (!select || select.dataset.rmpCustomReady === "true") return;
    select.dataset.rmpCustomReady = "true";

    var wrapper = document.createElement("div");
    wrapper.className = "rmp-custom-select";
    wrapper.dataset.selectId = select.id;
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "rmp-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML = '<span class="rmp-select-icon">' + iconFor(select.id) + '</span><span class="rmp-select-label"></span><svg class="rmp-select-chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    wrapper.appendChild(trigger);

    var menu = document.createElement("div");
    menu.className = "rmp-select-menu";
    menu.setAttribute("role", "listbox");
    wrapper.appendChild(menu);

    function displayText(option) {
      if (!option) return "";
      if (select.id === "sort") return "Sort: " + option.textContent.replace(/^Sort:\s*/i, "");
      return option.textContent;
    }

    function sync() {
      var selected = select.options[select.selectedIndex] || select.options[0];
      trigger.querySelector(".rmp-select-label").textContent = displayText(selected);
      menu.innerHTML = "";
      Array.from(select.options).forEach(function (option) {
        var item = document.createElement("button");
        item.type = "button";
        item.className = "rmp-select-option" + (option.selected ? " is-selected" : "");
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", option.selected ? "true" : "false");
        item.textContent = option.textContent;
        item.addEventListener("click", function () {
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          wrapper.classList.remove("is-open");
          trigger.setAttribute("aria-expanded", "false");
          sync();
        });
        menu.appendChild(item);
      });
    }

    trigger.addEventListener("click", function () {
      var opening = !wrapper.classList.contains("is-open");
      closeAll(wrapper);
      wrapper.classList.toggle("is-open", opening);
      trigger.setAttribute("aria-expanded", opening ? "true" : "false");
    });
    select.addEventListener("change", sync);
    new MutationObserver(sync).observe(select, { childList: true, subtree: true });
    sync();
  }

  function startLiveClock(age) {
    if (!age || age.dataset.rmpTimerReady === "true") return;
    age.dataset.rmpTimerReady = "true";
    var refreshWindowMs = 15 * 60 * 1000;
    function render() {
      var now = Date.now();
      var latestRefresh = Math.floor(now / refreshWindowMs) * refreshWindowMs;
      var minutes = Math.max(0, Math.floor((now - latestRefresh) / 60000));
      age.textContent = minutes === 0 ? "updated just now" : "updated " + minutes + " " + (minutes === 1 ? "min" : "mins") + " ago";
      age.title = "Directory data refreshes every 15 minutes";
    }
    render();
    window.setInterval(render, 30000);
  }

  function init() {
    var controls = document.querySelector(".controls");
    if (!controls) return;
    controls.classList.add("rmp-universal-toolbar");

    var liveStrip = controls.querySelector(".rmp-live-strip");
    var createdLive = false;
    if (!liveStrip) {
      createdLive = true;
      liveStrip = document.createElement("div");
      liveStrip.className = "rmp-live-strip";
      liveStrip.setAttribute("aria-label", "Ranking methodology and data freshness");
      liveStrip.innerHTML = '<a class="rmp-method-pill" href="/how-we-review"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.8 20 6v5.4c0 5.1-3.4 8.8-8 10.2-4.6-1.4-8-5.1-8-10.2V6l8-3.2Zm3.7 6.1-4.8 4.8-2.6-2.6-1.4 1.4 4 4 6.2-6.2-1.4-1.4Z"/></svg><span>How We Verify and Rank Firms</span></a><div class="rmp-live-pill"><span class="rmp-live-dot" aria-hidden="true"></span><span class="rmp-live-label">Live Data</span><span class="rmp-live-age" id="rmpLiveAge">updated just now</span></div>';
      controls.insertBefore(liveStrip, controls.firstChild);
    }

    var tools = controls.querySelector(".rmp-filter-tools");
    if (!tools) {
      tools = document.createElement("div");
      tools.className = "rmp-filter-tools";
      ["search", "sort", "country"].forEach(function (id) {
        var control = document.getElementById(id);
        if (control) tools.appendChild(control);
      });
      controls.appendChild(tools);
    }

    var tag = document.getElementById("tag");
    if (tag) tag.remove();
    enhanceSelect(document.getElementById("sort"));
    enhanceSelect(document.getElementById("country"));
    if (createdLive) startLiveClock(liveStrip.querySelector(".rmp-live-age"));
  }

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".rmp-custom-select")) closeAll();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeAll();
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
