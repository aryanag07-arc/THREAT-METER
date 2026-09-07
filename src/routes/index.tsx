import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { analyze, SAMPLES, type Analysis } from "@/lib/detector";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UPI-Shield — Spot Payment Scams & Coercion Instantly" },
      {
        name: "description",
        content:
          "Paste any suspicious SMS, WhatsApp or call transcript. UPI-Shield scores scam tactics, explains the red flags and gives a Hindi warning.",
      },
      { property: "og:title", content: "UPI-Shield — Payment Scam & Coercion Detector" },
      {
        property: "og:description",
        content:
          "Weighted tactic scoring for UPI scams: urgency, authority impersonation, OTP harvesting and coercion — with a Hindi warning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const LEVEL_META = {
  safe: { text: "Looks clean", color: "var(--safe)", tone: "No strong scam patterns" },
  suspicious: { text: "Suspicious", color: "var(--caution)", tone: "Some manipulation patterns" },
  high: { text: "High risk", color: "var(--danger)", tone: "Multiple scam tactics combined" },
  critical: { text: "Critical", color: "var(--critical)", tone: "Almost certainly a scam" },
} as const;

function Meter({ analysis }: { analysis: Analysis }) {
  const meta = LEVEL_META[analysis.level];
  const angle = (analysis.score / 100) * 360;
  return (
    <div className="flex items-center gap-6">
      <div
        className="relative grid size-32 shrink-0 place-items-center rounded-full transition-all duration-700"
        style={{
          background: `conic-gradient(${meta.color} ${angle}deg, var(--secondary) ${angle}deg)`,
        }}
      >
        <div className="grid size-24 place-items-center rounded-full bg-card">
          <span className="font-display text-3xl font-bold" style={{ color: meta.color }}>
            {analysis.score}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            risk
          </span>
        </div>
      </div>
      <div>
        <p className="font-display text-2xl font-semibold" style={{ color: meta.color }}>
          {meta.text}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{meta.tone}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          {analysis.signals.length} signal{analysis.signals.length === 1 ? "" : "s"} across{" "}
          {analysis.categories.length} tactic{analysis.categories.length === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}

function Index() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState("");

  const analysis = useMemo(
    () => (submitted.trim() ? analyze(submitted) : null),
    [submitted],
  );

  const maxPoints = analysis?.categories[0]?.points ?? 1;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 md:py-16">
      <header className="mb-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium tracking-wide text-primary">
          Contextual scam & coercion detection
        </span>
        <h1 className="mt-5 font-display text-4xl font-bold leading-tight md:text-5xl">
          UPI-Shield
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Paste a suspicious SMS, WhatsApp message or call transcript. UPI-Shield weighs the
          manipulation tactics behind it — urgency, authority impersonation, OTP harvesting,
          coercion — and explains the verdict in English and Hindi.
        </p>
      </header>

      <section className="panel p-5 md:p-7">
        <label htmlFor="msg" className="text-sm font-medium">
          Message to check
        </label>
        <textarea
          id="msg"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="e.g. Your account will be blocked today. Share OTP to complete KYC…"
          className="mt-2 w-full resize-y rounded-xl border border-input bg-background/60 p-4 font-mono text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubmitted(text)}
            disabled={!text.trim()}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            Analyze message
          </button>
          <button
            onClick={() => {
              setText("");
              setSubmitted("");
            }}
            className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary"
          >
            Clear
          </button>
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Try a sample
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  setText(s.text);
                  setSubmitted(s.text);
                }}
                className="rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 text-xs font-medium transition hover:border-primary/60 hover:text-primary"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {analysis && (
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="panel p-6">
            <h2 className="mb-5 font-display text-lg font-semibold">Threat meter</h2>
            <Meter analysis={analysis} />

            <div className="mt-6 space-y-3">
              {analysis.categories.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No known manipulation tactics detected.
                </p>
              )}
              {analysis.categories.map((c) => (
                <div key={c.category}>
                  <div className="flex justify-between text-xs">
                    <span>{c.label}</span>
                    <span className="text-muted-foreground">{c.points} pts</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${Math.max(8, (c.points / maxPoints) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Why it was flagged</h2>
            {analysis.signals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing in this message matches known scam behaviour.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {analysis.signals.map((s, i) => (
                  <li key={i} className="rounded-xl bg-secondary/50 px-3.5 py-2.5">
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      “{s.match}” · +{s.weight}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">What to do</h2>
            <ul className="space-y-2.5">
              {analysis.advice.map((a, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">हिंदी चेतावनी</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed">{analysis.hindi}</p>
          </div>
        </section>
      )}

      <footer className="mt-12 text-xs text-muted-foreground">
        Analysis runs entirely on your device — nothing you paste is uploaded. Report scams on
        1930 or cybercrime.gov.in.
      </footer>
    </main>
  );
}
