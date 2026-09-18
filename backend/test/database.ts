import "dotenv/config";
import { createPool } from "../src/database/database.js";
import { migrate } from "../scripts/migrate.js";
import { seed } from "../scripts/seed.js";
export async function resetTestDatabase(url = process.env.TEST_DATABASE_URL) {
  if (
    !url ||
    url === process.env.DATABASE_URL ||
    !new URL(url).pathname.endsWith("_test")
  )
    throw new Error(
      "A separate TEST_DATABASE_URL ending in _test is required.",
    );
  await migrate(url);
  const pool = createPool(url);
  try {
    await pool.query(
      "TRUNCATE audit_logs,sessions,users,bookings,messages,projects,tools,founders,company,consultation_settings RESTART IDENTITY CASCADE",
    );
  } finally {
    await pool.end();
  }
  await seed(url);
  return url;
}
