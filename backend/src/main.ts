import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { configureApp } from "./bootstrap";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  configureApp(app);
  await app.listen(
    Number(process.env.PORT || 4000),
    process.env.HOST || "127.0.0.1",
  );
}

void bootstrap().catch(() => {
    console.error(
      "API startup failed. Check configuration and PostgreSQL connectivity.",
    );
    process.exitCode = 1;
  });
