import "dotenv/config";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createPool } from "../src/database/database.js";

async function main() {
  const url = new URL(process.env.DATABASE_URL || "");
  const directory = resolve(__dirname, "../.local/pg");
  if (
    process.env.NODE_ENV === "production" ||
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    url.port !== "55432" ||
    !existsSync(resolve(directory, "PG_VERSION"))
  ) {
    console.log("Using externally managed PostgreSQL; local startup skipped.");
    return;
  }
  const status = spawnSync("pg_ctl", ["-D", directory, "status"], {
    encoding: "utf8",
  });
  if (status.error)
    throw new Error(
      "pg_ctl is unavailable. Add your PostgreSQL bin directory to PATH.",
    );
  if (status.status === 3) {
    console.log(
      "Starting the existing local PostgreSQL cluster on port 55432...",
    );
    const result = spawnSync(
      "pg_ctl",
      [
        "-D",
        directory,
        "-l",
        resolve(directory, "../postgres.log"),
        "-o",
        "-p 55432 -h 127.0.0.1",
        "-w",
        "-t",
        "30",
        "start",
      ],
      { stdio: "inherit" },
    );
    if (result.error || result.status !== 0)
      throw new Error("PostgreSQL did not start. Check .local/postgres.log.");
  } else if (status.status !== 0) {
    throw new Error("Unable to check the local PostgreSQL cluster status.");
  }
  const pool = createPool();
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL is ready; DATABASE_URL connection verified.");
  } finally {
    await pool.end();
  }
}
main().catch(() => {
  console.error(
    "Local database startup failed. Check pg_ctl on PATH, .local/postgres.log and DATABASE_URL. No data was reset.",
  );
  process.exitCode = 1;
});
