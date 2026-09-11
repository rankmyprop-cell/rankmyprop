"use strict";

const crypto = require("node:crypto");
const { FieldValue } = require("firebase-admin/firestore");
const { ceoIdentity, firestore } = require("./_lib/clients");

const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function reply(res, status, payload) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(status).json(payload);
}

module.exports = async function newsletterSubscribe(req, res) {
  if (req.method === "GET") {
    try {
      await ceoIdentity(req);
      const snapshot = await firestore().collection("newsletter").get();
      const rows = snapshot.docs.map((document) => {
        const data = document.data() || {};
        const dateValue = (value) => value?.toDate?.().toISOString?.() || value || null;
        return {
          id: document.id,
          email: String(data.email || ""),
          source: String(data.source || ""),
          status: String(data.status || "active"),
          createdAt: dateValue(data.createdAt),
          updatedAt: dateValue(data.updatedAt)
        };
      });
      return reply(res, 200, { ok: true, rows });
    } catch (error) {
      const status = Number(error?.status) || 500;
      return reply(res, status, {
        ok: false,
        error: status === 401 || status === 403
          ? "Admin authentication is required."
          : "Could not load newsletter subscribers."
      });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return reply(res, 405, { ok: false, error: "Method not allowed." });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (email.length < 5 || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return reply(res, 400, { ok: false, error: "Enter a valid email address." });
  }

  try {
    const db = firestore();
    const id = crypto.createHash("sha256").update(email).digest("hex");
    const ref = db.collection("newsletter").doc(id);
    const alreadySubscribed = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.exists) {
        transaction.set(ref, {
          email,
          source: "rankmyprop-homepage",
          status: "active",
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        return true;
      }
      transaction.create(ref, {
        email,
        source: "rankmyprop-homepage",
        status: "active",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      return false;
    });

    return reply(res, alreadySubscribed ? 200 : 201, { ok: true, alreadySubscribed });
  } catch (error) {
    console.error("[newsletter-subscribe]", error?.code || error?.name || "write_failed");
    return reply(res, 503, {
      ok: false,
      error: "Newsletter subscription is temporarily unavailable. Please try again."
    });
  }
};
