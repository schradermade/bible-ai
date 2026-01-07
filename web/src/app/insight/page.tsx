'use client';

import { useEffect, useState } from 'react';
import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Image from 'next/image';
import styles from './page.module.css';

type InsightResponse = {
  reference: string;
  sections: { title: string; content: string }[];
};

type BillingStatus = {
  isActive: boolean;
  usageCount: number;
  usageLimit: number;
  periodEnd: string;
};

export default function InsightPage() {
  const { isSignedIn } = useAuth();
  const [reference, setReference] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InsightResponse | null>(null);
  const [saved, setSaved] = useState(false);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(
    null
  );

  useEffect(() => {
    if (!isSignedIn) {
      setBillingStatus(null);
      return;
    }

    const loadStatus = async () => {
      const response = await fetch('/api/billing/status');
      if (!response.ok) return;
      const payload = (await response.json()) as BillingStatus;
      setBillingStatus(payload);
    };

    loadStatus();
  }, [isSignedIn]);

  const applyReference = (value: string) => {
    setReference(value);
  };

  const applyQuestion = (value: string) => {
    setQuestion(value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSignedIn) {
      setError('Sign in to request insights.');
      return;
    }
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, question }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          payload && typeof payload.message === 'string'
            ? payload.message
            : 'Unable to generate explanation.';
        throw new Error(message);
      }

      const json = (await response.json()) as InsightResponse;
      setData(json);
      if (billingStatus) {
        setBillingStatus({
          ...billingStatus,
          usageCount: Math.min(
            billingStatus.usageLimit,
            billingStatus.usageCount + 1
          ),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;

    const response = await fetch('/api/ai/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'verse_explanation',
        reference: data.reference,
        prompt: question,
        response: JSON.stringify(data),
      }),
    });

    if (response.ok) {
      setSaved(true);
      return;
    }

    const payload = await response.json().catch(() => null);
    const message =
      payload && typeof payload.message === 'string'
        ? payload.message
        : 'Unable to save insight.';
    setError(message);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <div className="icon">
              <Image
                src="/insight.png"
                alt="Insight"
                fill
                sizes="80px"
                className="iconImage"
              />
            </div>
            <h1 className={styles.title}>Insights</h1>
          </div>
          <p className={styles.eyebrow}>AI-guided insight</p>
          <p>
            Choose a passage, set the lens, and receive a calm, Scripture-first
            response.
          </p>
        </div>
        <div className={styles.statusPill}>
          <span>Scripture-first</span>
          <span>Non-prescriptive</span>
        </div>
      </header>

      <div className={styles.layout}>
        <form className={styles.composer} onSubmit={handleSubmit}>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldHeader}>
              <h2>Passage</h2>
              <p>Start with a verse, chapter, or range.</p>
            </div>
            <div className={styles.inputWrap}>
              <input
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Romans 8:1–4"
                aria-label="Passage reference"
                required
              />
            </div>
            <div className={styles.chips}>
              {['Psalm 23', 'John 15:1-8', 'Romans 8:1-4'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={styles.chip}
                  onClick={() => applyReference(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldHeader}>
              <h2>Focus</h2>
              <p>Tell the AI what you want to understand most.</p>
            </div>
            <div className={styles.textareaWrap}>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Example: What does this mean for daily life?"
                rows={4}
                aria-label="Focus question"
              />
            </div>
            <div className={styles.chips}>
              {[
                'Clarify the plain meaning.',
                'Give historical context.',
                'How do Christians differ here?',
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={styles.chip}
                  onClick={() => applyQuestion(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.footer}>
            <p className={styles.guardrail}>
              The AI responds with Scripture, context, and reflection—never
              directives.
            </p>
            {billingStatus ? (
              <p className={styles.usage}>
                {billingStatus.usageCount}/{billingStatus.usageLimit} insights
                used this month.
              </p>
            ) : null}
            <button type="submit" disabled={loading || !isSignedIn}>
              {loading ? 'Working...' : 'Get insight'}
            </button>
            {isSignedIn ? null : (
              <p className={styles.helper}>Sign in to request insights.</p>
            )}
          </div>
        </form>

        <section className={styles.responsePanel}>
          {!data ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>
                Your response will appear here
              </p>
              <p>
                Ask about a passage and the AI will return a structured response
                you can save and revisit.
              </p>
              <div className={styles.emptyGrid}>
                <div>
                  <h3>What the text clearly says</h3>
                  <p>Short, grounded explanation.</p>
                </div>
                <div>
                  <h3>Context to consider</h3>
                  <p>Historical and literary context.</p>
                </div>
                <div>
                  <h3>Reflection question</h3>
                  <p>Invitational prompt to slow down.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.response}>
              <div className={styles.responseHeader}>
                <p className={styles.responseTag}>Response</p>
                <h2>{data.reference}</h2>
              </div>
              <div className={styles.responseBody}>
                <div className={styles.sections}>
                  {data.sections.map((section) => (
                    <div key={section.title} className={styles.sectionCard}>
                      <h3>{section.title}</h3>
                      <p>{section.content}</p>
                    </div>
                  ))}
                </div>
                <div className={styles.actions}>
                  <SignedIn>
                    {billingStatus?.isActive ? (
                      <button type="button" onClick={handleSave}>
                        {saved ? 'Saved' : 'Save insight'}
                      </button>
                    ) : (
                      <a className={styles.upgradeLink} href="/billing">
                        Upgrade to save
                      </a>
                    )}
                  </SignedIn>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button type="button">Sign in to save</button>
                    </SignInButton>
                  </SignedOut>
                </div>
                {isSignedIn ? null : (
                  <p className={styles.helper}>
                    Sign in to keep your insights.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
