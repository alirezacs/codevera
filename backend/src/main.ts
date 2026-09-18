import "dotenv/config";
import { createApp } from "./bootstrap";
void createApp()
  .then((app) =>
    app.listen(
      Number(process.env.PORT || 4000),
      process.env.HOST || "127.0.0.1",
    ),
  )
  .catch(() => {
    console.error(
      "API startup failed. Check configuration and PostgreSQL connectivity.",
    );
    process.exitCode = 1;
  });
