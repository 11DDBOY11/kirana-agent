"use client";

import { FormEvent, useState } from "react";

import type { BillingPipelineResult } from "@/lib/billing/types";

const example = "2kg atta 90rs, 1 dish soap 60rs";

export default function DevTestPage() {
  const [text, setText] = useState(example);
  const [token, setToken] = useState("");
  const [result, setResult] = useState<BillingPipelineResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    const response = await fetch("/api/dev/test", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-dev-test-token": token },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Pipeline request failed.");
      return;
    }
    setResult(data);
  }

  return (
    <main className="min-h-screen bg-[#f8f7f2] px-5 py-10 text-[#1e2a22] sm:px-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold tracking-[0.16em] text-[#39704a] uppercase">Internal pipeline inspector</p>
        <h1 className="mt-3 text-3xl font-bold">Test a WhatsApp bill without Twilio</h1>
        <p className="mt-3 max-w-3xl text-[#526257]">This calls the same server-side text billing function as the WhatsApp webhook. It is not linked from the public page.</p>
        <form className="mt-8 rounded-2xl border border-[#d9dfd5] bg-white p-6 shadow-sm" onSubmit={send}>
          <label className="block text-sm font-semibold" htmlFor="bill">Bill text</label>
          <textarea id="bill" className="mt-2 min-h-28 w-full rounded-xl border border-[#b9c7ba] p-3" value={text} onChange={(event) => setText(event.target.value)} />
          <label className="mt-4 block text-sm font-semibold" htmlFor="token">Production test token (only needed after deployment)</label>
          <input id="token" type="password" className="mt-2 w-full rounded-xl border border-[#b9c7ba] p-3" value={token} onChange={(event) => setToken(event.target.value)} />
          <button className="mt-5 rounded-xl bg-[#39704a] px-5 py-3 font-semibold text-white disabled:opacity-60" disabled={loading} type="submit">{loading ? "Running pipeline…" : "Send"}</button>
        </form>
        {error && <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
        {result && <Results result={result} />}
      </div>
    </main>
  );
}

function Results({ result }: { result: BillingPipelineResult }) {
  return <section className="mt-8 grid gap-5">
    <Panel title="1. Extracted JSON"><pre>{JSON.stringify(result.extraction, null, 2)}</pre></Panel>
    <Panel title="2. GST calculation and slab breakdown"><pre>{JSON.stringify(result.gst, null, 2)}</pre></Panel>
    <Panel title="3. Agentic review / validation"><pre>{JSON.stringify(result.review, null, 2)}</pre></Panel>
    <Panel title="4. WhatsApp invoice reply"><pre className="whitespace-pre-wrap">{result.invoiceText}</pre></Panel>
  </section>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <article className="rounded-2xl border border-[#d9dfd5] bg-white p-6 shadow-sm"><h2 className="font-bold">{title}</h2><div className="mt-4 overflow-auto rounded-xl bg-[#1e2a22] p-4 text-sm leading-6 text-[#e5f2e7]">{children}</div></article>;
}
