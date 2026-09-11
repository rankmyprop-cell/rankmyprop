(() => {
  "use strict";

  const date = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value || "";
  const dailyLabel = `${value("day")} ${value("month")} ${value("year")}`.trim();
  const dateTime = `${value("year")}-${String(new Intl.DateTimeFormat("en-GB", { month: "2-digit", timeZone: "Asia/Kolkata" }).format(date)).padStart(2, "0")}-${String(new Intl.DateTimeFormat("en-GB", { day: "2-digit", timeZone: "Asia/Kolkata" }).format(date)).padStart(2, "0")}`;
  const selector = [
    ".offers-updated",
    ".compare-updated",
    ".company-updated",
    ".rmp-seo-updated",
    "#reviewsLastUpdated",
    "#dedicatedReviewUpdated",
    ".meta",
    "small",
  ].join(",");

  function syncLabel(element) {
    if (!(element instanceof HTMLElement)) return;
    const current = String(element.textContent || "").trim();

    if (element.matches("#reviewsLastUpdated,#dedicatedReviewUpdated")) {
      if (current !== dailyLabel) element.textContent = dailyLabel;
      return;
    }

    if (element.matches(".meta")) {
      if (!/Updated(?:\s+on)?\s*:?\s*[^•]*$/i.test(current)) return;
      const next = current.replace(/Updated(?:\s+on)?\s*:?\s*[^•]*$/i, `Updated on ${dailyLabel}`);
      if (next !== current) element.textContent = next;
      return;
    }

    if (element.matches("small") && !element.matches("#reviewsLastUpdated,#dedicatedReviewUpdated")) {
      if (!/^Last Updated\s*:/i.test(current)) return;
      const embeddedDate = element.querySelector("#reviewsLastUpdated,#dedicatedReviewUpdated");
      if (embeddedDate) {
        syncLabel(embeddedDate);
        const prefix = element.firstChild;
        if (prefix?.nodeType === Node.TEXT_NODE && prefix.textContent !== "Updated on: ") {
          prefix.textContent = "Updated on: ";
        }
        return;
      }
      const next = `Updated on ${dailyLabel}`;
      if (current !== next) element.textContent = next;
      return;
    }

    if (!/(?:Last Updated|Updated on)\s*:/i.test(current)) return;
    if (element.matches(".company-updated")) {
      const time = element.querySelector("time") || document.createElement("time");
      time.dateTime = dateTime;
      time.textContent = dailyLabel;
      if (!element.contains(time) || current !== `Updated on: ${dailyLabel}`) {
        element.replaceChildren(document.createTextNode("Updated on: "), time);
      }
      return;
    }

    const span = element.querySelector("span") || document.createElement("span");
    span.textContent = dailyLabel;
    if (!element.contains(span) || current !== `Updated on: ${dailyLabel}`) {
      element.replaceChildren(document.createTextNode("Updated on: "), span);
    }
  }

  function scan(root = document) {
    if (root instanceof HTMLElement && root.matches(selector)) syncLabel(root);
    root.querySelectorAll?.(selector).forEach(syncLabel);
  }

  function start() {
    scan(document);
    new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === "characterData") {
          syncLabel(record.target.parentElement);
          return;
        }
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) scan(node);
          else if (node.parentElement) syncLabel(node.parentElement);
        });
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
