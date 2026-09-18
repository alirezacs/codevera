import "dotenv/config";
import { resetTestDatabase } from "./database.js";
import { createPool } from "../src/database/database.js";
import { hashPassword } from "../src/auth/password.js";
import { createApp } from "../src/bootstrap.js";
void (async () => {
  if (!process.env.BROWSER_TEST_DATABASE_URL)
    throw new Error("BROWSER_TEST_DATABASE_URL is required.");
  const url = await resetTestDatabase(process.env.BROWSER_TEST_DATABASE_URL);
  if (process.env.CODEVERA_TEST_ADMIN_PASSWORD) {
    const pool = createPool(url);
    try {
      await pool.query(
        "INSERT INTO users(email,name,password_hash,role) VALUES($1,$2,$3,'OWNER')",
        [
          "browser-owner@example.test",
          "Browser Test Owner",
          await hashPassword(process.env.CODEVERA_TEST_ADMIN_PASSWORD),
        ],
      );
    } finally {
      await pool.end();
    }
  }
  process.env.DATABASE_URL = url;
  process.env.NODE_ENV = "test";
  process.env.DOCS_ENABLED = "false";
  const app = await createApp();
  await app.listen(4100, "127.0.0.1");
  console.log("Test API ready at http://127.0.0.1:4100/api/v1");
})();
