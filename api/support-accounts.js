"use strict";

const { audit, ceoIdentity, getSupabaseAdmin } = require("./_lib/clients");
const { HttpError, handler, json, method } = require("./_lib/http");
const { listAllUsers, listSupportProfiles, saveSupportProfile, updateSupportProfileStatus } = require("./_lib/support-store");

function validPassword(value = "") {
  return String(value).length >= 10;
}

module.exports = handler(async (req, res) => {
  method(req, ["GET", "POST", "PATCH"]);
  const ceo = await ceoIdentity(req);
  const supabase = getSupabaseAdmin();

  if (req.method === "GET") {
    return json(res, 200, { ok: true, rows: await listSupportProfiles(supabase) });
  }

  const action = String(req.body?.action || "");
  if (req.method === "POST" && action === "create") {
    const displayName = String(req.body?.displayName || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!displayName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !validPassword(password)) {
      throw new HttpError(400, "Name, valid email, and a temporary password of at least 10 characters are required.", "invalid_input");
    }
    let user = null;
    let createdNewAuthUser = false;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, role: "support", status: "active" },
      app_metadata: { role: "support", support_status: "active" }
    });
    if (!error && data?.user) {
      user = data.user;
      createdNewAuthUser = true;
    } else {
      const existing = (await listAllUsers(supabase)).find((item) => String(item.email || "").toLowerCase() === email);
      if (!existing) throw new HttpError(409, `Support account could not be created: ${error?.message || "email may already exist"}`, "account_create_failed");
      user = existing;
      await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    }
    try {
      await saveSupportProfile(supabase, {
        userId: user.id,
        displayName,
        status: "active",
        createdByUid: ceo.uid
      });
    } catch (profileError) {
      if (createdNewAuthUser) await supabase.auth.admin.deleteUser(user.id).catch(() => {});
      throw profileError;
    }
    await audit(ceo, createdNewAuthUser ? "support_account_created" : "support_account_recovered", "support_profile", user.id);
    return json(res, createdNewAuthUser ? 201 : 200, { ok: true, id: user.id, recovered: !createdNewAuthUser });
  }

  if (req.method === "PATCH" && action === "status") {
    const userId = String(req.body?.userId || "");
    const status = String(req.body?.status || "").toLowerCase();
    if (!userId || !["active", "disabled"].includes(status)) throw new HttpError(400, "Valid account and status are required.", "invalid_input");
    await updateSupportProfileStatus(supabase, userId, status);
    await audit(ceo, `support_account_${status}`, "support_profile", userId);
    return json(res, 200, { ok: true });
  }

  if (req.method === "PATCH" && action === "password") {
    const userId = String(req.body?.userId || "");
    const password = String(req.body?.password || "");
    if (!userId || !validPassword(password)) throw new HttpError(400, "A password of at least 10 characters is required.", "invalid_input");
    const existing = (await listSupportProfiles(supabase)).find((profile) => profile.user_id === userId);
    if (existing?.role !== "support") throw new HttpError(404, "Support account not found.", "not_found");
    const { error } = await supabase.auth.admin.updateUserById(userId, { password });
    if (error) throw new HttpError(503, "Support password could not be changed.", "password_update_failed");
    await audit(ceo, "support_password_changed", "support_profile", userId);
    return json(res, 200, { ok: true });
  }

  throw new HttpError(400, "Unsupported account action.", "invalid_action");
});
