"use client";

import { useState } from "react";
import { useAuth, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import styles from "./page.module.css";

type ExplainResponse = {
  reference: string;
  sections: { title: string; content: string }[];
};

export default function ExplainPage() {
  const { isSignedIn } = useAuth();
  const [reference, setReference] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, question }),
      });

      if (!response.ok) {
        throw new Error("Unable to generate explanation.");
      }

      const json = (await response.json()) as ExplainResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;

    const response = await fetch("/api/ai/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feature: "verse_explanation",
        reference: data.reference,
        prompt: question,
        response: JSON.stringify(data),
      }),
    });

    if (response.ok) {
      setSaved(true);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Understand a passage</h1>
        <p>Ask for a calm, Scripture-first explanation.</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          Passage reference
          <input
            type="text"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Romans 8:1"
            required
          />
        </label>
        <label>
          Optional question
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What does this mean for daily life?"
            rows={3}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Explaining..." : "Explain this"}
        </button>
      </form>

      {error ? <p className={styles.error}>{error}</p> : null}

      {data ? (
        <section className={styles.response}>
          <h2>{data.reference}</h2>
          <div className={styles.sections}>
            {data.sections.map((section) => (
              <div key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.content}</p>
              </div>
            ))}
          </div>
          <div className={styles.actions}>
            <SignedIn>
              <button type="button" onClick={handleSave}>
                {saved ? "Saved" : "Save insight"}
              </button>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button type="button">Sign in to save</button>
              </SignInButton>
            </SignedOut>
          </div>
          {isSignedIn ? null : (
            <p className={styles.helper}>Sign in to keep your insights.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
