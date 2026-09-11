"use strict";

const { getSupabaseAdmin } = require("./_lib/clients");
const { HttpError, handler, json, method } = require("./_lib/http");
const { getSupportProfile } = require("./_lib/support-store");

module.exports = handler(async (req, res) => {
  method(req, ["POST"]);
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!email || !password) throw new HttpError(400, "Email and password are required.", "invalid_input");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.session || !data?.user) {
    throw new HttpError(401, "Invalid support credentials.", "invalid_credentials");
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
});
