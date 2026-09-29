const fs = require("node:fs");
const SOURCE = "/tmp/rmp-auth-users.json";
const SECRET = "/tmp/rmp-migration-secret";
const ENDPOINT = "https://rankmyprop-api.theforexclue.workers.dev/v1/migration/auth";

async function main() {
  const source = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
  const secret = fs.readFileSync(SECRET, "utf8").trim();
  const users = (source.users || []).map((user) => ({
    id: user.localId,
    email: user.email || `${user.localId}@migration.invalid`,
    displayName: user.displayName || null,
    disabled: Boolean(user.disabled),
    emailVerified: Boolean(user.emailVerified),
    photoUrl: user.photoUrl || null,
    providers: user.providerUserInfo || [],
    createdAt: user.createdAt ? new Date(Number(user.createdAt)).toISOString() : null,
    lastSignedInAt: user.lastSignedInAt ? new Date(Number(user.lastSignedInAt)).toISOString() : null,
  }));
  let imported = 0;
  for (let index = 0; index < users.length; index += 50) {
    const response = await fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json", "x-rmp-migration-key": secret }, body: JSON.stringify({ users: users.slice(index, index + 50) }) });
    if (!response.ok) throw new Error(`Auth migration failed (${response.status}): ${(await response.text()).slice(0, 400)}`);
    imported += Number((await response.json()).imported || 0);
  }
  console.log(JSON.stringify({ imported, credentialMaterialTransferred: false, federatedAccounts: users.filter((user) => user.providers.length).length }, null, 2));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
