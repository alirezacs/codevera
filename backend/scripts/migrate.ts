import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPool } from "../src/database/database";
export async function migrate(url = process.env.DATABASE_URL) {
  const pool = createPool(url);
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(61042001)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const applied = new Set(
      (
        await client.query<{ name: string }>(
          "SELECT name FROM schema_migrations",
        )
      ).rows.map((row) => row.name),
    );
    for (const file of readdirSync(resolve("migrations"))
      .filter((file) => file.endsWith(".sql"))
      .sort()) {
      if (applied.has(file)) continue;
      await client.query("BEGIN");
      try {
        await client.query(readFileSync(resolve("migrations", file), "utf8"));
        await client.query("INSERT INTO schema_migrations(name) VALUES ($1)", [
          file,
        ]);
        await client.query("COMMIT");
        console.log("Applied " + file);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(61042001)");
    client.release();
    await pool.end();
  }
}
if (require.main === module)
  migrate().catch(() => {
    console.error(
      "Migration failed. Check database connectivity and migration SQL.",
    );
    process.exitCode = 1;
  });
