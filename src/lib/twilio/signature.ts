import { createHmac, timingSafeEqual } from "node:crypto";

/** Validates Twilio's X-Twilio-Signature for form-encoded webhooks. */
export function isValidTwilioSignature({
  authToken,
  signature,
  url,
  params,
}: {
  authToken: string;
  signature: string | null;
  url: string;
  params: URLSearchParams;
}): boolean {
  if (!signature) return false;

  const sortedPairs = [...params.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const payload = `${url}${sortedPairs.map(([key, value]) => `${key}${value}`).join("")}`;
  const expected = createHmac("sha1", authToken).update(payload).digest("base64");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}
