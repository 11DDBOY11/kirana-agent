import { NextRequest } from "next/server";

import { env } from "@/lib/env";
import { runTextBillingPipeline } from "@/lib/billing/pipeline";
import { downloadTwilioMedia, detectMediaKind, MediaProcessingError } from "@/lib/media/twilio-media";
import { mediaToBillText } from "@/lib/media/openai-media";
import { isValidTwilioSignature } from "@/lib/twilio/signature";
import { twimlMessage } from "@/lib/twilio/twiml";
import { detectTextMessageIntent, parseInboundMessage } from "@/lib/whatsapp/inbound";

export const runtime = "nodejs";

function xmlResponse(message: string, status = 200): Response {
  return new Response(twimlMessage(message), {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function GET() {
  return Response.json({ status: "ok", service: "kirana-whatsapp-webhook" });
}

export async function POST(request: NextRequest) {
  let form: URLSearchParams;

  try {
    form = new URLSearchParams(await request.text());
  } catch (error) {
    console.error("[webhook:received] Unable to read Twilio payload", error);
    return xmlResponse("Message padh nahi paaye. Kripya dobara bhejiye.", 400);
  }

  try {
    const expectedUrl = `${env.twilioWebhookBaseUrl}${request.nextUrl.pathname}`;
    const validSignature = isValidTwilioSignature({
      authToken: env.twilioAuthToken,
      signature: request.headers.get("x-twilio-signature"),
      url: expectedUrl,
      params: form,
    });

    if (!validSignature) {
      console.warn("[webhook:rejected] Invalid Twilio signature");
      return xmlResponse("Invalid webhook request.", 403);
    }

    const inbound = parseInboundMessage(form);
    console.info("[webhook:received]", {
      messageSid: inbound.messageSid,
      from: inbound.from,
      mediaCount: inbound.mediaCount,
      bodyLength: inbound.body.length,
    });

    if (!inbound.from) {
      return xmlResponse("Phone number nahi mila. Kripya dobara bhejiye.", 400);
    }

    if (inbound.mediaCount > 0) {
      if (inbound.mediaCount !== 1 || !inbound.mediaUrl || !inbound.mediaContentType) {
        return xmlResponse("Ek time par sirf ek photo ya voice note bhejiye.");
      }
      const kind = detectMediaKind(inbound.mediaContentType);
      console.info("[webhook:media-received]", { messageSid: inbound.messageSid, kind });
      const bytes = await downloadTwilioMedia(inbound.mediaUrl);
      const rawBillText = await mediaToBillText({ kind, bytes, contentType: inbound.mediaContentType });
      console.info("[webhook:media-extracted]", { messageSid: inbound.messageSid, kind, transcriptLength: rawBillText.length });
      let result: ReturnType<typeof runTextBillingPipeline>;
      try {
        result = runTextBillingPipeline(rawBillText);
      } catch (error) {
        console.warn("[webhook:media-bill-not-readable]", { messageSid: inbound.messageSid, error });
        return xmlResponse("Bill ke items clearly read nahi huye. Kripya clear photo ya voice note dobara bhejiye.");
      }
      if (!result.review.valid) {
        return xmlResponse("Bill mein kuch math issue mila. Kripya items aur price dobara bhejiye.");
      }
      return xmlResponse(result.invoiceText);
    }

    const intent = detectTextMessageIntent(inbound.body);
    console.info("[webhook:intent-detected]", { messageSid: inbound.messageSid, intent });

    if (intent === "new_bill") {
      const result = runTextBillingPipeline(inbound.body);
      if (!result.review.valid) {
        return xmlResponse("Bill mein kuch math issue mila. Kripya items aur price dobara bhejiye.");
      }
      return xmlResponse(result.invoiceText);
    }

    return xmlResponse(
      "Namaste! Bill text mein bhejiye, jaise: 2kg atta 90rs, 1 soap 60rs. GST aur summary queries bhi jaldi available hongi.",
    );
  } catch (error) {
    if (error instanceof MediaProcessingError) {
      return xmlResponse(error.message);
    }
    console.error("[webhook:failed]", error);
    return xmlResponse(
      "Abhi bill process nahi ho paya. Kripya 1 minute mein dobara bhejiye.",
      500,
    );
  }
}
