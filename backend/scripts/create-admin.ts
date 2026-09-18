import "dotenv/config";
import { z } from "zod";
import { createPool } from "../src/database/database.js";
import { hashPassword } from "../src/auth/password.js";
async function main() {
  const input = z
    .object({
      ADMIN_EMAIL: z.email().transform((v) => v.toLowerCase()),
      ADMIN_NAME: z.string().min(2),
      ADMIN_PASSWORD: z.string().min(12).max(128),
    })
    .parse(process.env);
  const pool = createPool();
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(61042002)");
    if (
      Number(
        (
          await c.query<{ total: string }>(
            "SELECT count(*) AS total FROM users",
          )
        ).rows[0].total,
      ) > 0
    )
      throw new Error(
        "An admin already exists; use the authenticated users API.",
      );
    await c.query(
      "INSERT INTO users(email,name,password_hash,role) VALUES($1,$2,$3,'OWNER')",
      [
        input.ADMIN_EMAIL,
        input.ADMIN_NAME,
        await hashPassword(input.ADMIN_PASSWORD),
      ],
    );
    await c.query("COMMIT");
    console.log("Initial owner created. No credentials were logged.");
  } catch (error) {
    await c.query("ROLLBACK");
    throw error;
  } finally {
    c.release();
    await pool.end();
  }
}
main().catch(() => {
  console.error(
    "Owner creation failed. Provide a valid ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD (12+ characters). This command only works before the first user exists.",
  );
  process.exitCode = 1;
});
