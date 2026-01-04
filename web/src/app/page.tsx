import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Scripture-guided AI</p>
          <h1 className={styles.title}>Bible AI</h1>
          <p className={styles.subtitle}>
            A calm, Scripture-first companion for understanding the Bible and
            reflecting on life.
          </p>
        </div>
        <div className={styles.auth}>
          <SignedOut>
            <SignInButton mode="modal">
              <button className={styles.signIn}>Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h2>How would you like to explore today?</h2>
          <div className={styles.options}>
            <Link className={styles.card} href="/explain">
              <h3>Understand a passage</h3>
              <p>Explain Scripture with clarity and context.</p>
            </Link>
            <div className={styles.cardDisabled}>
              <h3>Think through a decision</h3>
              <p>Guided reflection rooted in biblical wisdom.</p>
              <span>Coming soon</span>
            </div>
            <div className={styles.cardDisabled}>
              <h3>Receive encouragement</h3>
              <p>Calm, Scripture-based reassurance.</p>
              <span>Coming soon</span>
            </div>
            <div className={styles.cardDisabled}>
              <h3>Learn about prophecy</h3>
              <p>Approach prophecy with humility and care.</p>
              <span>Coming soon</span>
            </div>
          </div>
        </section>

        <section className={styles.secondary}>
          <Link href="/saved" className={styles.link}>
            View saved insights
          </Link>
        </section>
      </main>
    </div>
  );
}
