import { describe, expect, it } from "vitest";

import { detectMediaKind, MediaProcessingError } from "@/lib/media/twilio-media";

describe("Twilio media classification", () => {
  it("recognizes voice and photo MIME types", () => {
    expect(detectMediaKind("audio/ogg")).toBe("voice");
    expect(detectMediaKind("image/jpeg")).toBe("photo");
  });

  it("rejects unsupported media before calling an AI service", () => {
    expect(() => detectMediaKind("application/pdf")).toThrow(MediaProcessingError);
  });
});
