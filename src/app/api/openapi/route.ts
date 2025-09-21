import { NextRequest, NextResponse } from "next/server";
import packageJson from "../../../../package.json" assert { type: "json" };

export async function GET(_req: NextRequest) {
  const openapi = {
    openapi: "3.1.0",
    info: {
      title: "Bug Tracker API",
      version: packageJson.version || "1.0.0",
      description:
        "REST API for the Bug Tracker app. All authenticated routes require a Bearer token in the Authorization header.",
    },
    servers: [{ url: "/api" }],
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": { description: "OK" },
          },
        },
      },
      "/users": {
        get: { summary: "List users" },
        post: { summary: "Create user" },
      },
      "/users/{id}": {
        get: { summary: "Get user" },
        patch: { summary: "Update user" },
        delete: { summary: "Delete user" },
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      },
      "/projects": {
        get: { summary: "List projects" },
        post: { summary: "Create project" },
      },
      "/projects/{id}": {
        get: { summary: "Get project" },
        patch: { summary: "Update project" },
        delete: { summary: "Delete project" },
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      },
      "/projects/{id}/members": {
        get: { summary: "List project members" },
        post: { summary: "Add project member" },
        patch: { summary: "Update project member" },
        delete: { summary: "Remove project member" },
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      },
      "/bugs": {
        get: { summary: "List bugs" },
        post: { summary: "Create bug" },
      },
      "/bugs/{id}": {
        get: { summary: "Get bug" },
        patch: { summary: "Update bug" },
        delete: { summary: "Delete bug" },
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      },
      "/bugs/{id}/comments": {
        get: { summary: "List bug comments" },
        post: { summary: "Create bug comment" },
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      },
      "/comments/{id}": {
        get: { summary: "Get comment" },
        delete: { summary: "Delete comment" },
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      },
      "/bugs/{id}/history": {
        get: { summary: "Get bug history" },
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
      },
      // --- Attachments ---
      "/attachments": {
        get: {
          summary: "List attachments",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 }, description: "Items per page" },
            { name: "offset", in: "query", schema: { type: "integer", minimum: 0 }, description: "Offset for pagination" },
            { name: "issueId", in: "query", schema: { type: "integer" }, description: "Filter by issue id" },
            { name: "projectId", in: "query", schema: { type: "integer" }, description: "Filter by project id" },
            { name: "sort", in: "query", schema: { type: "string", enum: ["createdAt", "filename", "size"] } },
            { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"] } }
          ],
          responses: {
            "200": { description: "Attachment list", content: { "application/json": { schema: { $ref: "#/components/schemas/AttachmentList" } } } },
          },
        },
        post: {
          summary: "Upload attachment",
          description: "Upload a file as multipart/form-data. Fields: file, issueId?, projectId?",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: { type: "string", format: "binary" },
                    issueId: { type: "integer", nullable: true },
                    projectId: { type: "integer", nullable: true },
                  },
                  required: ["file"],
                },
              },
            },
          },
          responses: {
            "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Attachment" } } } },
            "400": { description: "Validation error" },
            "413": { description: "File too large" },
          },
        },
      },
      "/attachments/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        get: {
          summary: "Get attachment",
          responses: { "200": { description: "Attachment", content: { "application/json": { schema: { $ref: "#/components/schemas/Attachment" } } } }, "404": { description: "Not found" } },
        },
        delete: {
          summary: "Delete attachment",
          responses: { "204": { description: "Deleted" }, "404": { description: "Not found" } },
        },
      },
      "/bugs/{id}/attachments": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        get: {
          summary: "List attachments for a bug",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
            { name: "sort", in: "query", schema: { type: "string", enum: ["createdAt", "filename"] } },
            { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          ],
          responses: {
            "200": { description: "Attachment list", content: { "application/json": { schema: { $ref: "#/components/schemas/AttachmentList" } } } },
            "404": { description: "Bug not found" },
          },
        },
      },
      "/projects/{id}/attachments": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        get: {
          summary: "List attachments for a project",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
            { name: "sort", in: "query", schema: { type: "string", enum: ["createdAt", "filename"] } },
            { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          ],
          responses: {
            "200": { description: "Attachment list", content: { "application/json": { schema: { $ref: "#/components/schemas/AttachmentList" } } } },
            "404": { description: "Project not found" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Attachment: {
          type: "object",
          properties: {
            id: { type: "integer" },
            filename: { type: "string" },
            storedName: { type: "string" },
            path: { type: "string" },
            mime: { type: "string" },
            size: { type: "integer" },
            issueId: { type: ["integer", "null"] },
            projectId: { type: ["integer", "null"] },
            uploaderId: { type: ["integer", "null"] },
            createdAt: { type: ["string", "integer", "null"], description: "ISO string or timestamp" },
          },
          required: ["id", "filename", "storedName", "path", "mime", "size"],
        },
        AttachmentList: {
          type: "object",
          properties: {
            data: { type: "array", items: { $ref: "#/components/schemas/Attachment" } },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer" },
                pageSize: { type: "integer" },
                total: { type: "integer" },
                totalPages: { type: "integer" },
                offset: { type: "integer" },
                hasNext: { type: ["boolean", "null"] },
                hasPrevious: { type: ["boolean", "null"] },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  } as const;

  return NextResponse.json(openapi);
}