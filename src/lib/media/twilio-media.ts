import { env } from "@/lib/env";

export class MediaProcessingError extends Error {}

export type MediaKind = "voice" | "photo";

export function detectMediaKind(contentType: string | null): MediaKind {
  if (contentType?.startsWith("audio/")) return "voice";
  if (contentType?.startsWith("image/")) return "photo";
  throw new MediaProcessingError("Photo ya voice note bhejiye. Other file types abhi supported nahi hain.");
}

export async function downloadTwilioMedia(url: string): Promise<Uint8Array> {
  const credentials = Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString("base64");
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${credentials}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new MediaProcessingError("Media download nahi ho paya. Kripya file dobara bhejiye.");
  }

  const contentLength = Number(response.headers.get("content-length") ?? "0");
  if (contentLength > 25 * 1024 * 1024) {
    throw new MediaProcessingError("File 25 MB se chhoti bhejiye.");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > 25 * 1024 * 1024) {
    throw new MediaProcessingError("File 25 MB se chhoti bhejiye.");
  }
  return bytes;
}
