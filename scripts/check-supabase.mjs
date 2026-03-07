import fs from "node:fs";

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const env = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const [key, ...rest] = trimmed.split("=");
    env[key.trim()] = rest.join("=").trim();
  }

  return env;
}

async function checkTable(baseUrl, anonKey, tableName) {
  const response = await fetch(`${baseUrl}/rest/v1/${tableName}?select=*&limit=1`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = text;
  }

  return {
    table: tableName,
    status: response.status,
    payload,
  };
}

async function main() {
  const env = {
    ...readEnvFile(".env.local"),
    ...process.env,
  };

  const baseUrl = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!baseUrl || !anonKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    process.exit(1);
  }

  let host = "invalid-url";
  try {
    host = new URL(baseUrl).host;
  } catch {
    host = "invalid-url";
  }

  console.log(`Supabase project: ${host}`);

  const tables = ["profiles", "rides", "ratings"];
  const results = await Promise.all(tables.map((table) => checkTable(baseUrl, anonKey, table)));

  let allGood = true;
  for (const result of results) {
    if (result.status === 200) {
      console.log(`✅ ${result.table}: reachable`);
      continue;
    }

    allGood = false;
    const message =
      typeof result.payload === "object" && result.payload && "message" in result.payload
        ? result.payload.message
        : JSON.stringify(result.payload);
    console.log(`❌ ${result.table}: HTTP ${result.status} - ${message}`);
  }

  if (!allGood) {
    console.log("\nRun supabase-schema.sql in this project SQL editor, then run this check again.");
    process.exit(2);
  }

  console.log("\nAll required tables are available.");
}

main().catch((error) => {
  console.error("Failed to run Supabase check:", error);
  process.exit(1);
});
