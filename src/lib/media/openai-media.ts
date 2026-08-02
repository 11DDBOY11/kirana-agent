import OpenAI, { toFile } from "openai";

import { env } from "@/lib/env";
import { MediaProcessingError, type MediaKind } from "@/lib/media/twilio-media";

function client() {
  return new OpenAI({
    apiKey: env.groqApiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

function extensionFor(contentType: string): string {
  if (contentType.includes("webm")) return "webm";
  if (contentType.includes("mpeg") || contentType.includes("mp3")) return "mp3";
  if (contentType.includes("mp4") || contentType.includes("m4a")) return "m4a";
  if (contentType.includes("wav")) return "wav";
  // WhatsApp often sends Ogg/Opus voice notes. The API receives the original
  // media file and returns a clear error if the provider cannot accept it.
  if (contentType.includes("ogg")) return "ogg";
  return "bin";
}

export async function transcribeVoice(bytes: Uint8Array, contentType: string): Promise<string> {
  try {
    const file = await toFile(bytes, `whatsapp-voice.${extensionFor(contentType)}`, { type: contentType });
    const transcription = await client().audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      prompt: "This is an Indian kirana shop bill spoken in Hindi, Hinglish, or English. Preserve item names, quantities, units, and prices.",
    });
    if (!transcription.text?.trim()) throw new Error("Empty transcript");
    return transcription.text.trim();
  } catch (error) {
    console.error("[media:transcription-failed]", error);
    throw new MediaProcessingError("Voice note samajh nahi aaya. Kripya thoda slowly bolkar dobara bhejiye.");
  }
}

export async function readBillPhoto(bytes: Uint8Array, contentType: string): Promise<string> {
  try {
    const imageUrl = `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
    const completion = await client().chat.completions.create({
      model: "qwen/qwen3.6-27b",
      temperature: 0,
      max_tokens: 300,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Read this Indian kirana bill exactly. Return only a comma-separated list in this format: quantity+unit item name totalRs. Example: 2kg atta 90rs, 1 dish soap 60rs. Do not invent illegible items; omit them." },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      }],
    });
    const text = completion.choices[0]?.message.content?.trim();
    if (!text) throw new Error("Empty vision result");
    return text;
  } catch (error) {
    console.error("[media:vision-failed]", error);
    throw new MediaProcessingError("Photo clearly read nahi ho payi. Kripya bright light mein seedhi photo dobara bhejiye.");
  }
}

export async function mediaToBillText({
  kind,
  bytes,
  contentType,
}: {
  kind: MediaKind;
  bytes: Uint8Array;
  contentType: string;
}): Promise<string> {
  return kind === "voice" ? transcribeVoice(bytes, contentType) : readBillPhoto(bytes, contentType);
}
