import { describeApi } from "./common/openapi";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { Errors } from "./common/errors";
import { z } from "zod";
import { join } from "node:path";
export async function createApp() {
  z.object({
    DATABASE_URL: z.string().url(),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    SESSION_HOURS: z.coerce.number().min(1).max(24).default(8),
  }).parse(process.env);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger: process.env.NODE_ENV === "test" ? false : undefined,
  });
  app.use(helmet());
  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads" });
  app.use(json({ limit: "64kb" }));
  app.setGlobalPrefix("api/v1");
  app.useGlobalFilters(new Errors());
  app.enableCors({
    origin: (process.env.CORS_ORIGINS || "http://localhost:3000")
      .split(",")
      .map((v) => v.trim()),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  app.enableShutdownHooks();
  if (process.env.DOCS_ENABLED === "true") {
    const config = new DocumentBuilder()
      .setTitle("Codevera API")
      .setVersion("1.0")
      .setDescription(
        "Public content and protected admin endpoints. See README and OpenAPI JSON for payload schemas.",
      )
      .addBearerAuth()
      .build();
    SwaggerModule.setup(
      "api/docs",
      app,
      describeApi(SwaggerModule.createDocument(app, config)),
    );
  }
  return app;
}
