"use strict";

const { getSupabaseAdmin, staffOrCeoIdentity } = require("./_lib/clients");
const { HttpError, handler, json, method } = require("./_lib/http");
const { getSupportProfile } = require("./_lib/support-store");

module.exports = handler(async (req, res) => {
  const isRefresh = req.query?.action === "refresh" || /\/support-refresh(?:\?|$)/.test(String(req.url || ""));
  if (isRefresh) {
    method(req, ["POST"]);
    const refreshToken = String(req.body?.refreshToken || "").trim();
    if (!refreshToken) throw new HttpError(400, "Refresh token is required.", "invalid_input");

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data?.session || !data?.user) {
      throw new HttpError(401, "Support session expired. Please log in again.", "invalid_token");
    }

    const profile = await getSupportProfile(supabase, data.user.id);
    if (!profile || profile.role !== "support" || profile.status !== "active") {
      await supabase.auth.admin.signOut(data.session.access_token).catch(() => {});
      throw new HttpError(403, "This support account is not active.", "forbidden");
    }

    return json(res, 200, {
      ok: true,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      },
      profile: { displayName: profile.display_name, role: profile.role, status: profile.status }
    });
  }

  method(req, ["GET"]);
  const actor = await staffOrCeoIdentity(req);
  return json(res, 200, {
    ok: true,
    profile: {
      uid: actor.uid,
      displayName: actor.displayName,
      role: actor.role,
      status: actor.status
    }
  });
});
