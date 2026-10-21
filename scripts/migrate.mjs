import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(url, {
  max: 1,
  ssl: url.includes("localhost") || url.includes("railway.internal") ? false : "require",
});

const migrate = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  const dir = path.join(root, "migrations");
  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    const applied = await sql`SELECT 1 FROM schema_migrations WHERE id = ${file}`;
    if (applied.length) continue;
    const text = fs.readFileSync(path.join(dir, file), "utf8");
    await sql.unsafe(text);
    await sql`INSERT INTO schema_migrations (id) VALUES (${file})`;
    console.log("applied", file);
  }
  console.log("migrations complete");
};

migrate()
  .then(async () => {
    await sql.end();
  })
  .catch(async (err) => {
    console.error(err instanceof Error ? err.message : "migration failed");
    await sql.end({ timeout: 1 });
    process.exit(1);
  });
