"use client";

import { FormEvent, useState } from "react";
import type { BillingPipelineResult } from "@/lib/billing/types";

const example = "2kg atta 90rs, 1 dish soap 60rs";

export default function DevTestPage() {
  const [text, setText] = useState(example);
  const [audio, setAudio] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [token, setToken] = useState("");
  const [result, setResult] = useState<BillingPipelineResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function runRequest(body: BodyInit, contentType?: string) {
    const headers: Record<string, string> = { "x-dev-test-token": token };
    if (contentType) headers["Content-Type"] = contentType;
    const response = await fetch("/api/dev/test", { method: "POST", headers, body });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Pipeline request failed.");
    setResult(data);
  }

  async function sendText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setResult(null);
    try { await runRequest(JSON.stringify({ text }), "application/json"); } catch (reason) { setError(reason instanceof Error ? reason.message : "Pipeline request failed."); }
    setLoading(false);
  }

  async function sendMedia(file: File | null) {
    if (!file) { setError("Choose a file first."); return; }
    setLoading(true); setError(""); setResult(null);
    const form = new FormData(); form.set("media", file);
    try { await runRequest(form); } catch (reason) { setError(reason instanceof Error ? reason.message : "Pipeline request failed."); }
    setLoading(false);
  }

  return <main className="min-h-screen bg-[#f8f7f2] px-5 py-10 text-[#1e2a22] sm:px-10"><div className="mx-auto max-w-5xl">
    <p className="text-sm font-semibold tracking-[0.16em] text-[#39704a] uppercase">Internal pipeline inspector</p>
    <h1 className="mt-3 text-3xl font-bold">Test a WhatsApp bill without Twilio</h1>
    <p className="mt-3 max-w-3xl text-[#526257]">Text, audio, and photo inputs call the same server-side pipeline functions used by the WhatsApp webhook. This page is not linked publicly.</p>
    <form className="mt-8 rounded-2xl border border-[#d9dfd5] bg-white p-6 shadow-sm" onSubmit={sendText}>
      <label className="block text-sm font-semibold" htmlFor="bill">Bill text</label><textarea id="bill" className="mt-2 min-h-28 w-full rounded-xl border border-[#b9c7ba] p-3" value={text} onChange={(event) => setText(event.target.value)} />
      <label className="mt-4 block text-sm font-semibold" htmlFor="token">Production test token (only needed after deployment)</label><input id="token" type="password" className="mt-2 w-full rounded-xl border border-[#b9c7ba] p-3" value={token} onChange={(event) => setToken(event.target.value)} />
      <button className="mt-5 rounded-xl bg-[#39704a] px-5 py-3 font-semibold text-white disabled:opacity-60" disabled={loading} type="submit">{loading ? "Running pipeline…" : "Send text bill"}</button>
    </form>
    <section className="mt-5 grid gap-5 sm:grid-cols-2">
      <label className="rounded-2xl border border-[#d9dfd5] bg-white p-6 shadow-sm"><span className="block font-semibold">Voice bill</span><input className="mt-4 block w-full text-sm" type="file" accept="audio/ogg,audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/webm,.ogg,.mp3,.m4a,.webm" onChange={(event) => setAudio(event.target.files?.[0] ?? null)} /><button className="mt-5 rounded-xl bg-[#39704a] px-4 py-2 font-semibold text-white disabled:opacity-60" disabled={loading} type="button" onClick={() => sendMedia(audio)}>{loading ? "Running…" : "Send voice bill"}</button></label>
      <label className="rounded-2xl border border-[#d9dfd5] bg-white p-6 shadow-sm"><span className="block font-semibold">Photo bill</span><input className="mt-4 block w-full text-sm" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={(event) => setImage(event.target.files?.[0] ?? null)} /><button className="mt-5 rounded-xl bg-[#39704a] px-4 py-2 font-semibold text-white disabled:opacity-60" disabled={loading} type="button" onClick={() => sendMedia(image)}>{loading ? "Running…" : "Send photo bill"}</button></label>
    </section>
    {error && <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
    {result && <Results result={result} />}
  </div></main>;
}

function Results({ result }: { result: BillingPipelineResult }) { return <section className="mt-8 grid gap-5"><Panel title="1. Extracted JSON"><pre>{JSON.stringify(result.extraction, null, 2)}</pre></Panel><Panel title="2. GST calculation and slab breakdown"><pre>{JSON.stringify(result.gst, null, 2)}</pre></Panel><Panel title="3. Agentic review / validation"><pre>{JSON.stringify(result.review, null, 2)}</pre></Panel><Panel title="4. WhatsApp invoice reply"><pre className="whitespace-pre-wrap">{result.invoiceText}</pre></Panel></section>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <article className="rounded-2xl border border-[#d9dfd5] bg-white p-6 shadow-sm"><h2 className="font-bold">{title}</h2><div className="mt-4 overflow-auto rounded-xl bg-[#1e2a22] p-4 text-sm leading-6 text-[#e5f2e7]">{children}</div></article>; }
