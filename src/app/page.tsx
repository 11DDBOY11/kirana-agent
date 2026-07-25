const pipeline = [
  "WhatsApp message received",
  "Items extracted and checked",
  "GST invoice saved",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f7f2] px-6 py-16 text-[#1e2a22] sm:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold tracking-[0.18em] text-[#39704a] uppercase">
          Kirana WhatsApp Billing Agent
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Bills and GST, right from WhatsApp.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#526257]">
          Send a typed bill, voice note, or photo. The agent creates a GST-ready
          invoice, saves it to your ledger, and answers everyday sales questions.
        </p>

        <section className="mt-12 rounded-3xl border border-[#d9dfd5] bg-white p-7 shadow-sm sm:p-10">
          <p className="font-mono text-sm text-[#39704a]">Agent pipeline</p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {pipeline.map((step, index) => (
              <li key={step} className="rounded-2xl bg-[#eef5ed] p-5">
                <span className="text-sm font-bold text-[#39704a]">0{index + 1}</span>
                <p className="mt-5 font-semibold">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
