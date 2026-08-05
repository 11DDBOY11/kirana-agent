import { NextRequest } from "next/server";

import { env } from "@/lib/env";
import { runMediaBillingPipeline, runTextBillingPipeline } from "@/lib/billing/pipeline";
import { answerLedgerQuery, saveInvoice } from "@/lib/ledger/service";
import { detectIncomingIntent, detectLedgerQuery, detectLanguage } from "@/lib/ledger/intent";
import { downloadTwilioMedia, detectMediaKind, MediaProcessingError } from "@/lib/media/twilio-media";
import { isValidTwilioSignature } from "@/lib/twilio/signature";
import { twimlMessage } from "@/lib/twilio/twiml";
import { parseInboundMessage } from "@/lib/whatsapp/inbound";

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
      let result: Awaited<ReturnType<typeof runMediaBillingPipeline>>;
      try {
        result = await runMediaBillingPipeline({ kind, bytes, contentType: inbound.mediaContentType });
      } catch (error) {
        console.warn("[webhook:media-bill-not-readable]", { messageSid: inbound.messageSid, error });
        return xmlResponse("Bill ke items clearly read nahi huye. Kripya clear photo ya voice note dobara bhejiye.");
      }
      if (!result.review.valid) {
        return xmlResponse("Bill mein kuch math issue mila. Kripya items aur price dobara bhejiye.");
      }
      await saveInvoice({ phone: inbound.from, rawInputType: kind, result });
      return xmlResponse(result.invoiceText);
    }

    const lang = detectLanguage(inbound.body);
    const intent = detectIncomingIntent(inbound.body);
    console.info("[webhook:intent-detected]", { messageSid: inbound.messageSid, intent, lang });

    if (intent === "new_bill") {
      const result = await runTextBillingPipeline(inbound.body, { language: lang });
      if (!result.review.valid) {
        const errorMsg = lang === "kannada"
          ? "ಬಿಲ್ಲು ಲೆಕ್ಕದಲ್ಲಿ ಸಮಸ್ಯೆ ಕಂಡುಬಂದಿದೆ. ದಯವಿಟ್ಟು ಪದಾರ್ಥಗಳು ಮತ್ತು ಬೆಲೆಯನ್ನು ಮತ್ತೊಮ್ಮೆ ಕಳುಹಿಸಿ."
          : lang === "hinglish"
          ? "Bill mein kuch math issue mila. Kripya items aur price dobara bhejiye."
          : "There was an issue with the bill calculation. Please send the items and prices again.";
        return xmlResponse(errorMsg);
      }
      await saveInvoice({ phone: inbound.from, rawInputType: "text", result });
      return xmlResponse(result.invoiceText);
    }

    const query = detectLedgerQuery(inbound.body);
    console.info("[webhook:query-detected]", { messageSid: inbound.messageSid, query });
    return xmlResponse(await answerLedgerQuery({ phone: inbound.from, query, replyLanguage: lang }));
  } catch (error) {
    if (error instanceof MediaProcessingError) {
      return xmlResponse(error.message);
    }
    console.error("[webhook:failed]", error);
    const bodyText = (error as { bodyText?: string })?.bodyText || "";
    const lang = detectLanguage(bodyText);
    const genericErrorMsg = lang === "kannada"
      ? "ಬಿಲ್ಲನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು 1 ನಿಮಿಷದ ನಂತರ ಮತ್ತೊಮ್ಮೆ ಕಳುಹಿಸಿ."
      : lang === "hinglish"
      ? "Abhi bill process nahi ho paya. Kripya 1 minute mein dobara bhejiye."
      : "Could not process the bill right now. Please try again in 1 minute.";
    return xmlResponse(genericErrorMsg, 500);
  }
}
