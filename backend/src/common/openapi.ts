import { z } from "zod";
import type {
  OpenAPIObject,
  SchemaObject,
  OperationObject,
} from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
import {
  projectSchema,
  toolSchema,
  founderSchema,
  companySchema,
} from "../content/schemas";
import {
  bookingSchema,
  settingsSchema,
  messageSchema,
  statusSchema,
} from "../bookings/schemas";
import { loginSchema, passwordSchema } from "../auth/auth.controller";
import { createSchema, updateSchema } from "../auth/users.controller";
export function describeApi(document: OpenAPIObject) {
  const schemas = {
    ProjectInput: projectSchema,
    ToolInput: toolSchema,
    FounderInput: founderSchema,
    CompanyInput: companySchema,
    BookingInput: bookingSchema,
    ScheduleInput: settingsSchema,
    MessageInput: messageSchema,
    BookingStatus: statusSchema,
    Login: loginSchema,
    PasswordChange: passwordSchema,
    CreateUser: createSchema,
    UpdateUser: updateSchema,
  };
  document.components ??= {};
  document.components.schemas ??= {};
  for (const [name, schema] of Object.entries(schemas))
    document.components.schemas[name] = z.toJSONSchema(schema, {
      target: "openapi-3.0",
      io: "input",
      unrepresentable: "any",
    }) as SchemaObject;
  const bodies: [string, "post" | "put" | "patch", string][] = [
    ["/auth/login", "post", "Login"],
    ["/auth/password", "post", "PasswordChange"],
    ["/admin/users", "post", "CreateUser"],
    ["/admin/users/{id}", "patch", "UpdateUser"],
    ["/admin/company", "put", "CompanyInput"],
    ["/admin/consultation-settings", "put", "ScheduleInput"],
    ["/admin/bookings/{id}", "patch", "BookingStatus"],
    ["/bookings", "post", "BookingInput"],
    ["/contact", "post", "MessageInput"],
  ];
  for (const [path, method, schema] of bodies) {
    const op = document.paths["/api/v1" + path]?.[method];
    if (op)
      op.requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/" + schema },
          },
        },
      };
  }
  for (const [path, item] of Object.entries(document.paths)) {
    for (const method of ["get", "post", "put", "patch", "delete"] as const) {
      const operation = item[method] as OperationObject | undefined;
      if (!operation) continue;
      if (
        !path.includes("/admin/") &&
        !path.includes("/auth/me") &&
        !path.includes("/auth/password") &&
        !path.includes("/auth/logout")
      )
        operation.security = [];
      if (path.includes("{kind}")) {
        operation.parameters = operation.parameters?.filter(
          (p) => !("name" in p) || p.name !== "kind",
        );
        operation.parameters ??= [];
        operation.parameters.push({
          name: "kind",
          in: "path",
          required: true,
          schema: { type: "string", enum: ["projects", "tools", "founders"] },
        });
        if (method === "post" || method === "put")
          operation.requestBody = {
            required: true,
            description:
              "Choose the schema corresponding to the kind path parameter. PUT replaces the full editable record.",
            content: {
              "application/json": {
                schema: {
                  oneOf: ["ProjectInput", "ToolInput", "FounderInput"].map(
                    (name) => ({ $ref: "#/components/schemas/" + name }),
                  ),
                },
              },
            },
          };
      }
      if (
        method === "get" &&
        (/\/(projects|tools|founders|users|bookings|messages|audit-logs)$/.test(
          path,
        ) ||
          path.endsWith("/content/{kind}"))
      ) {
        operation.parameters ??= [];
        operation.parameters.push(
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 24 },
          },
        );
      }
      if (
        method === "get" &&
        /\/projects(?:\/\{slug\})?$/.test(path) &&
        !path.includes("/admin/")
      ) {
        operation.parameters ??= [];
        operation.parameters.push({
          name: "locale",
          in: "query",
          schema: { type: "string", enum: ["en", "fa"], default: "en" },
        });
      }
    }
  }
  return document;
}
