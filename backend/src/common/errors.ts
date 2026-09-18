import { ZodError } from "zod";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
@Catch()
export class Errors implements ExceptionFilter {
  private readonly logger = new Logger("API");
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    let status = 500;
    let message = "The server could not complete this request.";
    if (error instanceof HttpException) {
      status = error.getStatus();
      const body = error.getResponse();
      message =
        typeof body === "string"
          ? body
          : typeof body === "object" && "message" in body
            ? String(body.message)
            : error.message;
    } else if (
      error &&
      typeof error === "object" &&
      "type" in error &&
      (error.type === "entity.parse.failed" ||
        error.type === "entity.too.large")
    ) {
      status = error.type === "entity.too.large" ? 413 : 400;
      message = "Please send a valid JSON request within the size limit.";
    } else if (error instanceof ZodError) {
      status = 400;
      message = error.issues[0].message;
    } else if (error && typeof error === "object" && "code" in error) {
      if (error.code === "23505") {
        status = 409;
        message = "A record with this identifier already exists.";
      } else if (error.code === "23P01") {
        status = 409;
        message =
          "That time is no longer available. Please choose another slot.";
      }
    }
    if (status === 500)
      this.logger.error(
        "Unhandled API error",
        error instanceof Error
          ? error.stack?.split("\n").slice(0, 2).join("\n")
          : undefined,
      );
    response.status(status).json({ statusCode: status, error: message });
  }
}
