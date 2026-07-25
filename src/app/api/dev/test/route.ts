import { NextRequest } from "next/server";

import { runTextBillingPipeline } from "@/lib/billing/pipeline";

export const runtime = "nodejs";

function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const configuredToken = process.env.DEV_TEST_ACCESS_TOKEN;
  return Boolean(configuredToken && request.headers.get("x-dev-test-token") === configuredToken);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "This internal tool requires a valid access token." }, { status: 401 });
  }

  try {
    const payload: unknown = await request.json();
    const text = typeof payload === "object" && payload !== null && "text" in payload ? payload.text : undefined;
    if (typeof text !== "string" || !text.trim()) {
      return Response.json({ error: "A bill text is required." }, { status: 400 });
    }

    return Response.json(runTextBillingPipeline(text.trim()));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pipeline failed unexpectedly.";
    console.error("[dev-test:failed]", error);
    return Response.json({ error: message }, { status: 422 });
  }
}
