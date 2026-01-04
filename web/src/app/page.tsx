import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Scripture-guided AI</p>
        <h1 className={styles.title}>How would you like to explore today?</h1>
        <p className={styles.subtitle}>
          Choose a guided path to keep the experience focused and calm.
        </p>
      </section>

      <section className={styles.options}>
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
      </section>

      <section className={styles.secondary}>
        <Link href="/saved" className={styles.link}>
          View saved insights
        </Link>
      </section>
    </div>
  );
}
