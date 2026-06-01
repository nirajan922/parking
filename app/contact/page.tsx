"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Smart Parking demo enquiry");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, subject, message }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to send message.");
      }

      setSuccessMessage("Message saved. It is now available in Supabase as assessment evidence.");
      setFullName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to send message.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_32rem),linear-gradient(135deg,#f8fbff_0%,#eef6ff_48%,#ffffff_100%)] px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/25">
              SP
            </span>
            <span>
              <span className="block text-base font-black text-slate-950">Smart Parking</span>
              <span className="block text-xs font-semibold text-slate-500">Contact</span>
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Dashboard
          </Link>
        </header>

        <section className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-600">
              Contact
            </p>
            <h1 className="mt-5 text-5xl font-black tracking-tight text-slate-950">
              Send a Smart Parking enquiry
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Messages are stored in Supabase so the prototype has a complete full-stack contact workflow.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/5"
          >
            {successMessage ? (
              <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {successMessage}
              </div>
            ) : null}
            {errorMessage ? (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-5">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Full name</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Subject</span>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Message</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  rows={6}
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full justify-center rounded-full bg-blue-600 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send message"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
