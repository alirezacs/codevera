import "dotenv/config";
import { readFileSync } from "node:fs";
import { createPool } from "../src/database/database";
import { z } from "zod";
const schema = z.object({
  bookings: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      phone: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      start_time: z.string(),
      end_time: z.string(),
      status: z.enum(["confirmed", "cancelled", "completed"]),
      created_at: z.string(),
    }),
  ),
  messages: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      contact: z.string(),
      message: z.string(),
      created_at: z.string(),
    }),
  ),
});
async function run() {
  const data = schema.parse(
    JSON.parse(
      readFileSync(process.argv[2] || ".local/legacy-data.json", "utf8"),
    ),
  );
  const pool = createPool();
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    for (const b of data.bookings)
      await c.query(
        "INSERT INTO bookings(id,name,phone,starts_at,ends_at,status,created_at) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING",
        [
          b.id,
          b.name,
          b.phone,
          `${b.date}T${b.start_time}:00Z`,
          `${b.date}T${b.end_time}:00Z`,
          b.status,
          b.created_at,
        ],
      );
    for (const m of data.messages)
      await c.query(
        "INSERT INTO messages(id,name,contact,message,created_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING",
        [m.id, m.name, m.contact, m.message, m.created_at],
      );
    await c.query("COMMIT");
    console.log("Legacy import complete. Existing identifiers preserved.");
  } catch (error) {
    await c.query("ROLLBACK");
    throw error;
  } finally {
    c.release();
    await pool.end();
  }
}
run().catch(() => {
  console.error(
    "Legacy import failed; transaction rolled back. Check input or conflicting bookings.",
  );
  process.exitCode = 1;
});
