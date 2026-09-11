"use strict";

const PII_KEY = /(email|e-mail|mobile|phone|telephone|whatsapp|wano|wanumber|wanum|contactnumber|contactno|clientemail|clientphone|clientmobile|clientwhatsapp)/i;

function isPiiKey(key = "") {
  return PII_KEY.test(String(key).replace(/[_\s-]+/g, ""));
}

function stripPii(value, seen = new WeakSet()) {
  if (value == null || typeof value !== "object") return value;
  if (seen.has(value)) return null;
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => stripPii(item, seen));

  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (isPiiKey(key)) continue;
    out[key] = stripPii(child, seen);
  }
  return out;
}

function serialize(value) {
  if (value == null) return value;
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = serialize(child);
    return out;
  }
  return value;
}

module.exports = { isPiiKey, serialize, stripPii };
