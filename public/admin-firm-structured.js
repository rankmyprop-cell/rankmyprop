(function () {
  "use strict";

  var pairEditors = [
    ["keyMetricsJson", "Key Metrics", "Metric name", "Metric value", "array"],
    ["tradingConditionsJson", "Trading Conditions", "Condition", "Answer", "array"],
    ["firmDetailsJson", "Firm Details", "Detail name", "Answer", "array"],
    ["statsJson", "Stats", "Stat label", "Stat value", "stats"],
    ["cardMetricsJson", "Listed Card Metrics", "Card field", "Answer", "object"],
    ["performanceJson", "Performance Scores", "Score category", "Score (0–5)", "object"]
  ];

  var columnEditors = [
    ["radarMetricsJson", "Performance Radar", ["label", "short", "value"], ["Full label", "Short label", "Score"]],
    ["leverageRowsJson", "Leverage Rows", ["instrument", "c1", "c2", "c3", "c4"], ["Instrument", "Option 1", "Option 2", "Option 3", "Variable"]],
    ["commissionsJson", "Commissions", ["title", "lines"], ["Market", "Commission lines"]],
    ["evaluationProgramsJson", "Evaluation Programs", ["program", "phase1", "phase2", "target", "allocation", "split", "features"], ["Program", "Phase 1", "Phase 2", "Target", "Allocation", "Profit split", "Features"]]
  ];

  var hiddenAdvanced = [
    "spreadsPanelDataJson",
    "announcementsPanelDataJson"
  ];

  function safeParse(value, fallback) {
    try {
      var parsed = JSON.parse(String(value || ""));
      return parsed == null ? fallback : parsed;
    } catch (_) {
      return fallback;
    }
  }

  function titleFromKey(key) {
    return String(key || "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function addStyles() {
    var style = document.createElement("style");
    style.textContent =
      ".rmp-structured-builder{grid-column:1/-1;display:grid;gap:16px;padding:18px;border:1px solid rgba(122,116,255,.28);border-radius:14px;background:rgba(122,116,255,.055)}" +
      ".rmp-structured-head h3{margin:0 0 5px}.rmp-structured-head p{margin:0;color:#9ca5c5;font-size:13px}" +
      ".rmp-structured-card{padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(7,8,17,.7)}" +
      ".rmp-structured-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;font-weight:800}" +
      ".rmp-row-list{display:grid;gap:10px}.rmp-editor-row{display:grid;grid-template-columns:repeat(var(--cols,2),minmax(0,1fr)) auto;gap:9px;align-items:end;padding:10px;border-radius:10px;background:rgba(255,255,255,.035)}" +
      ".rmp-editor-row label{display:grid;gap:5px;color:#aeb6d5;font-size:11px;font-weight:700}.rmp-editor-row input,.rmp-editor-row textarea{width:100%;min-height:40px;padding:9px 10px;border:1px solid rgba(255,255,255,.13);border-radius:8px;background:#0d0f19;color:#fff;font:inherit}" +
      ".rmp-add,.rmp-remove{border:0;border-radius:8px;padding:9px 12px;color:#fff;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.rmp-add{background:#6757f5}.rmp-remove{background:#35202b;color:#ff9fb0}" +
      ".rmp-platform-picker{display:flex;flex-wrap:wrap;gap:9px}.rmp-platform-pick{display:flex;align-items:center;gap:7px;padding:9px 11px;border:1px solid rgba(255,255,255,.13);border-radius:9px;background:#0d0f19;color:#dfe3f7;font-size:13px;font-weight:700}" +
      "@media(max-width:900px){.rmp-editor-row{grid-template-columns:1fr}.rmp-remove{width:100%}}";
    document.head.appendChild(style);
  }

  function rawField(name) {
    return document.querySelector('[name="' + name + '"]');
  }

  function hideRaw(name) {
    var input = rawField(name);
    var field = input && input.closest(".field");
    if (field) field.style.display = "none";
    return input;
  }

  function field(label, value, multiline) {
    var wrap = document.createElement("label");
    wrap.innerHTML = "<span>" + label + "</span>";
    var input = document.createElement(multiline ? "textarea" : "input");
    input.value = value == null ? "" : String(value);
    if (multiline) input.rows = 2;
    wrap.appendChild(input);
    return { wrap: wrap, input: input };
  }

  function createCard(root, title) {
    var card = document.createElement("section");
    card.className = "rmp-structured-card";
    card.innerHTML = '<div class="rmp-structured-title"><span>' + title + '</span><button class="rmp-add" type="button">+ Add row</button></div><div class="rmp-row-list"></div>';
    root.appendChild(card);
    return card;
  }

  function setupPairEditor(root, config) {
    var name = config[0], title = config[1], leftLabel = config[2], rightLabel = config[3], mode = config[4];
    var hidden = hideRaw(name);
    if (!hidden) return null;
    var card = createCard(root, title);
    var list = card.querySelector(".rmp-row-list");

    function addRow(label, value) {
      var row = document.createElement("div");
      row.className = "rmp-editor-row";
      row.style.setProperty("--cols", "2");
      var left = field(leftLabel, label, false);
      var right = field(rightLabel, value, false);
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "rmp-remove";
      remove.textContent = "Remove";
      remove.addEventListener("click", function () { row.remove(); });
      row.append(left.wrap, right.wrap, remove);
      list.appendChild(row);
    }

    function load() {
      list.innerHTML = "";
      var parsed = safeParse(hidden.value, mode === "array" || mode === "stats" ? [] : {});
      var rows = [];
      if (Array.isArray(parsed)) {
        rows = parsed.map(function (item) {
          return mode === "stats"
            ? [item && item.label, item && item.value]
            : [item && (item.label || item.name), item && item.value];
        });
      } else if (parsed && typeof parsed === "object") {
        rows = Object.entries(parsed);
      }
      rows.filter(function (row) { return row[0] || row[1]; }).forEach(function (row) { addRow(row[0], row[1]); });
      if (!list.children.length) addRow("", "");
    }

    function sync() {
      var entries = Array.from(list.querySelectorAll(".rmp-editor-row")).map(function (row) {
        var inputs = row.querySelectorAll("input,textarea");
        return [String(inputs[0].value || "").trim(), String(inputs[1].value || "").trim()];
      }).filter(function (entry) { return entry[0] || entry[1]; });
      var data;
      if (mode === "object") {
        data = Object.fromEntries(entries.filter(function (entry) { return entry[0]; }));
      } else if (mode === "stats") {
        data = entries.map(function (entry) { return { label: entry[0], value: entry[1] }; });
      } else {
        data = entries.map(function (entry) { return { label: entry[0], value: entry[1] }; });
      }
      hidden.value = JSON.stringify(data);
    }

    card.querySelector(".rmp-add").addEventListener("click", function () { addRow("", ""); });
    return { load: load, sync: sync };
  }

  function setupColumnEditor(root, config) {
    var name = config[0], title = config[1], keys = config[2], labels = config[3];
    var hidden = hideRaw(name);
    if (!hidden) return null;
    var card = createCard(root, title);
    var list = card.querySelector(".rmp-row-list");

    function addRow(data) {
      var row = document.createElement("div");
      row.className = "rmp-editor-row";
      row.style.setProperty("--cols", String(Math.min(keys.length, 4)));
      keys.forEach(function (key, index) {
        var value = data && data[key];
        if (Array.isArray(value)) value = value.join("\n");
        var item = field(labels[index], value, key === "lines" || key === "features");
        item.input.dataset.key = key;
        row.appendChild(item.wrap);
      });
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "rmp-remove";
      remove.textContent = "Remove";
      remove.addEventListener("click", function () { row.remove(); });
      row.appendChild(remove);
      list.appendChild(row);
    }

    function load() {
      list.innerHTML = "";
      var rows = safeParse(hidden.value, []);
      (Array.isArray(rows) ? rows : []).forEach(addRow);
      if (!list.children.length) addRow({});
    }

    function sync() {
      var rows = Array.from(list.querySelectorAll(".rmp-editor-row")).map(function (row) {
        var item = {};
        row.querySelectorAll("input,textarea").forEach(function (input) {
          var value = String(input.value || "").trim();
          item[input.dataset.key] = input.dataset.key === "lines" || input.dataset.key === "features"
            ? value.split(/\n+/).map(function (line) { return line.trim(); }).filter(Boolean)
            : value;
        });
        return item;
      }).filter(function (item) { return Object.values(item).some(Boolean); });
      hidden.value = JSON.stringify(rows);
    }

    card.querySelector(".rmp-add").addEventListener("click", function () { addRow({}); });
    return { load: load, sync: sync };
  }

  function setupPlatforms(root) {
    var hidden = document.querySelector('[name="platformsCsv"]');
    if (!hidden) return null;
    var fieldWrap = hidden.closest(".field");
    if (fieldWrap) fieldWrap.style.display = "none";
    var card = document.createElement("section");
    card.className = "rmp-structured-card";
    card.innerHTML = '<div class="rmp-structured-title"><span>Trading Platforms</span></div><div class="rmp-platform-picker"></div>';
    function platformKey(value) {
      var key = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      return key === "metatrader5" ? "mt5" : key;
    }
    var choices = ["MT4", "MetaTrader 5", "cTrader", "MatchTrader", "TradeLocker", "DXtrade", "Volumetrica"];
    var picker = card.querySelector(".rmp-platform-picker");
    choices.forEach(function (name) {
      var label = document.createElement("label");
      label.className = "rmp-platform-pick";
      label.innerHTML = '<input type="checkbox" value="' + name + '"><span>' + name + "</span>";
      picker.appendChild(label);
    });
    root.appendChild(card);
    return {
      load: function () {
        var active = new Set(String(hidden.value || "").split(",").map(platformKey));
        picker.querySelectorAll("input").forEach(function (input) {
          input.checked = active.has(platformKey(input.value));
        });
      },
      sync: function () {
        hidden.value = Array.from(picker.querySelectorAll("input:checked")).map(function (input) { return input.value; }).join(", ");
      }
    };
  }

  function init() {
    var form = document.getElementById("detailForm");
    if (!form) return;
    addStyles();
    var anchor = rawField("performanceJson");
    var anchorField = anchor && anchor.closest(".field");
    if (!anchorField) return;
    var builder = document.createElement("section");
    builder.className = "rmp-structured-builder";
    builder.innerHTML = '<div class="rmp-structured-head"><h3>Visual Firm Data Builder</h3><p>Add a field in the upper box and fill its answer below. No JSON editing is required.</p></div>';
    anchorField.parentNode.insertBefore(builder, anchorField);

    var editors = [];
    var platformEditor = setupPlatforms(builder);
    if (platformEditor) editors.push(platformEditor);
    pairEditors.forEach(function (config) {
      var editor = setupPairEditor(builder, config);
      if (editor) editors.push(editor);
    });
    columnEditors.forEach(function (config) {
      var editor = setupColumnEditor(builder, config);
      if (editor) editors.push(editor);
    });
    hiddenAdvanced.forEach(hideRaw);

    function load() { editors.forEach(function (editor) { editor.load(); }); }
    function sync() {
      editors.forEach(function (editor) { editor.sync(); });
      var evaluation = safeParse(rawField("evaluationProgramsJson")?.value, []);
      var stats = safeParse(rawField("statsJson")?.value, []);
      var challenges = rawField("challengesPanelDataJson");
      if (challenges) {
        var existingChallenges = safeParse(challenges.value, {});
        challenges.value = JSON.stringify(Object.assign({}, existingChallenges, { programs: evaluation, stats: stats }));
      }
      var conditions = safeParse(rawField("tradingConditionsJson")?.value, []);
      var rules = rawField("rulesPanelDataJson");
      if (rules && conditions.length) {
        var existingRules = safeParse(rules.value, {});
        existingRules.sections = existingRules.sections || {};
        var existingGeneral = existingRules.sections.general;
        if (!existingGeneral || !Array.isArray(existingGeneral.rules) || !existingGeneral.rules.length) {
          existingRules.sections.general = Object.assign({}, existingGeneral || {}, {
            title: "Trading Rules",
            desc: "Current rules configured in the firm editor.",
            rules: conditions.map(function (item) { return { title: item.label, text: item.value }; })
          });
        }
        rules.value = JSON.stringify(existingRules);
      }
    }

    window.RmpFirmStructuredEditor = { load: load, sync: sync };
    load();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
