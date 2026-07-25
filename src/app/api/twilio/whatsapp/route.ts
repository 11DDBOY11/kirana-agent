import { NextRequest } from "next/server";

import { env } from "@/lib/env";
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
      console.info("[webhook:media-deferred]", { messageSid: inbound.messageSid });
      return xmlResponse(
        "Photo aur voice note support agle step mein activate ho raha hai. Abhi item aur price text mein bhejiye, jaise: 2kg atta 90rs.",
      );
    }

    const intent = detectTextMessageIntent(inbound.body);
    console.info("[webhook:intent-detected]", { messageSid: inbound.messageSid, intent });

    if (intent === "new_bill") {
      console.info("[webhook:text-bill-queued]", { messageSid: inbound.messageSid });
      return xmlResponse(
        "Bill mil gaya. Items aur GST check karke invoice bhej raha hoon. Bill save ho jayega.",
      );
    }

    return xmlResponse(
      "Namaste! Bill text mein bhejiye, jaise: 2kg atta 90rs, 1 soap 60rs. GST aur summary queries bhi jaldi available hongi.",
    );
  } catch (error) {
    console.error("[webhook:failed]", error);
    return xmlResponse(
      "Abhi bill process nahi ho paya. Kripya 1 minute mein dobara bhejiye.",
      500,
    );
  }
}
