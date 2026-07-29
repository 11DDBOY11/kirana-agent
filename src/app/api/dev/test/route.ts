import { NextRequest } from "next/server";

import { runMediaBillingPipeline, runTextBillingPipeline } from "@/lib/billing/pipeline";
import { detectMediaKind } from "@/lib/media/twilio-media";

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
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("media");
      if (!(file instanceof File) || file.size === 0) {
        return Response.json({ error: "An audio or image file is required." }, { status: 400 });
      }
      if (file.size > 25 * 1024 * 1024) {
        return Response.json({ error: "Choose a file smaller than 25 MB." }, { status: 400 });
      }
      const kind = detectMediaKind(file.type);
      return Response.json(await runMediaBillingPipeline({ kind, bytes: new Uint8Array(await file.arrayBuffer()), contentType: file.type }));
    }

    const payload: unknown = await request.json();
    const text = typeof payload === "object" && payload !== null && "text" in payload ? payload.text : undefined;
    if (typeof text !== "string" || !text.trim()) {
      return Response.json({ error: "A bill text is required." }, { status: 400 });
    }

    return Response.json(await runTextBillingPipeline(text.trim()));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pipeline failed unexpectedly.";
    console.error("[dev-test:failed]", error);
    return Response.json({ error: message }, { status: 422 });
  }
}
