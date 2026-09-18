import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createPool } from "../src/database/database.ts";
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
const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMainModule)
  migrate().catch((error: unknown) => {
    console.error("Migration failed. Check database connectivity and migration SQL.");
    console.error(error);
    process.exitCode = 1;
  });
