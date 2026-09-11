"use strict";

class HttpError extends Error {
  constructor(status, message, code = "request_failed") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function setPrivateHeaders(res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Vary", "Authorization");
}

function json(res, status, payload) {
  setPrivateHeaders(res);
  return res.status(status).json(payload);
}

function method(req, allowed = []) {
  if (!allowed.includes(req.method)) {
    throw new HttpError(405, "Method not allowed.", "method_not_allowed");
  }
}

function bearer(req) {
  const raw = String(req.headers.authorization || "");
  const match = raw.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, "Authentication required.", "missing_token");
  return match[1].trim();
}

function cleanError(error) {
  if (error instanceof HttpError) {
    return { status: error.status, body: { ok: false, error: error.message, code: error.code } };
  }
  console.error("[support-api]", error?.code || error?.name || "internal_error");
  return {
    status: 500,
    body: { ok: false, error: "The secure workspace could not complete this request.", code: "internal_error" }
  };
}

function handler(fn) {
  return async (req, res) => {
    setPrivateHeaders(res);
    try {
      return await fn(req, res);
    } catch (error) {
      const safe = cleanError(error);
      return json(res, safe.status, safe.body);
    }
  };
}

module.exports = { HttpError, bearer, handler, json, method, setPrivateHeaders };
