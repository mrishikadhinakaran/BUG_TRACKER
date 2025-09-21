"use client";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">API Documentation</h1>
        <p className="text-muted-foreground mb-6">
          OpenAPI spec is available at <code>/api/openapi</code>. This page renders it with Swagger UI.
        </p>
        <div className="bg-card rounded-md border">
          <SwaggerUI url="/api/openapi" docExpansion="list" defaultModelsExpandDepth={0} />
        </div>
      </div>
    </main>
  );
}