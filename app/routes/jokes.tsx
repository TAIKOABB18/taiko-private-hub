import { useCallback, useEffect, useState } from "react";
import type { MetaFunction } from "react-router";
import Sparkles from "lucide-react/dist/esm/icons/sparkles.js";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw.js";
import Copy from "lucide-react/dist/esm/icons/copy.js";
import Check from "lucide-react/dist/esm/icons/check.js";
import ExternalLink from "lucide-react/dist/esm/icons/external-link.js";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left.js";
import { Link } from "react-router";

export const meta: MetaFunction = () => [
  { title: "Joke Generator | TAIKO PRIVATE HUB" },
  { name: "description", content: "Generate a fresh joke from an external API." },
];

type Joke = {
  category: string;
  type: "single" | "twopart";
  joke?: string;
  setup?: string;
  delivery?: string;
  error?: boolean;
};

const API_URL = "https://v2.jokeapi.dev/joke/Any?safe-mode";

function jokeText(joke: Joke) {
  return joke.type === "single" ? joke.joke ?? "" : `${joke.setup ?? ""}\n\n${joke.delivery ?? ""}`;
}

export default function Jokes() {
  const [joke, setJoke] = useState<Joke | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const getJoke = useCallback(async () => {
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch(API_URL, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("The joke service is unavailable right now.");
      const nextJoke = (await response.json()) as Joke;
      if (nextJoke.error) throw new Error("The joke service returned an invalid response.");
      setJoke(nextJoke);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void getJoke();
  }, [getJoke]);

  async function copyJoke() {
    if (!joke) return;
    await navigator.clipboard.writeText(jokeText(joke));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="min-h-svh bg-[#020b17] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="mb-14 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft className="size-4" /> Back to hub
        </Link>

        <header className="mb-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
            <Sparkles className="size-3.5" /> External API playground
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">Make me laugh.</h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-400">A fresh, safe-for-work joke whenever you need a quick reset.</p>
        </header>

        <section className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900/70 p-6 shadow-2xl shadow-violet-950/20 sm:p-12" aria-live="polite">
          <div className="absolute -right-20 -top-24 size-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative min-h-64">
            {loading && (
              <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-slate-400">
                <RefreshCw className="size-8 animate-spin text-violet-300" />
                <p>Finding something funny…</p>
              </div>
            )}

            {!loading && error && (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <p className="mb-2 text-lg font-semibold text-white">Couldn&apos;t fetch a joke</p>
                <p className="mb-6 text-sm text-slate-400">{error}</p>
                <button onClick={() => void getJoke()} className="rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold transition hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300">Try again</button>
              </div>
            )}

            {!loading && !error && joke && (
              <div className="flex min-h-64 flex-col justify-between gap-8">
                <div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-violet-200">{joke.category}</span>
                  <blockquote className="mt-8 whitespace-pre-line font-display text-2xl font-semibold leading-relaxed text-slate-100 sm:text-3xl">“{jokeText(joke)}”</blockquote>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => void getJoke()} className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300"><RefreshCw className="size-4" /> New joke</button>
                  <button onClick={() => void copyJoke()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400">{copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}{copied ? "Copied" : "Copy joke"}</button>
                </div>
              </div>
            )}
          </div>
        </section>

        <footer className="mt-6 flex items-center justify-between text-xs text-slate-500">
          <span>Powered by JokeAPI</span>
          <a href="https://v2.jokeapi.dev/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition hover:text-slate-300">API docs <ExternalLink className="size-3" /></a>
        </footer>
      </div>
    </main>
  );
}
