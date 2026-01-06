import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Scripture-guided AI</p>
          <h1 className={styles.title}>
            Study the Bible with clarity, humility, and calm.
          </h1>
          <p className={styles.subtitle}>
            Bible AI helps you understand Scripture, reflect on life, and stay
            anchored in the text without being overwhelmed.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/insight">
              Get insight on a passage
            </Link>
            <Link className={styles.secondary} href="/saved">
              View saved insights
            </Link>
          </div>
          <p className={styles.premiumCue}>
            Premium unlocks discernment, encouragement, and prophecy guidance.
          </p>
          <div className={styles.trustRow}>
            <span>Scripture-first</span>
            <span>AI-guided</span>
            <span>Non-prescriptive</span>
          </div>
        </div>
        <div className={styles.heroPanel}>
          <div className={styles.panelHeader}>
            <p>Guided entry point</p>
            <span>Start here</span>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.panelCard}>
              <h3>Insight on a passage</h3>
              <p>Explain Scripture with context and careful reflection.</p>
              <Link className={styles.panelLink} href="/insight">
                Start
              </Link>
            </div>
            <div className={styles.panelCardDisabled}>
              <h3>Think through a decision</h3>
              <p>Guided reflection rooted in biblical wisdom.</p>
              <span>Coming soon</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.preview}>
        <div className={styles.previewCopy}>
          <h2>What you get</h2>
          <ul className={styles.featureList}>
            <li>
              <strong>Scripture insight</strong> with context and clarity.
            </li>
            <li>
              <strong>Discern decisions</strong> with biblical principles.
            </li>
            <li>
              <strong>Encouragement</strong> grounded in Scripture.
            </li>
          </ul>
        </div>
        <div className={styles.previewCard}>
          <p className={styles.previewTitle}>Sample response</p>
          <p className={styles.previewRef}>Romans 8:1</p>
          <div className={styles.previewSection}>
            <h4>What the text clearly says</h4>
            <p>
              Those who belong to Christ are no longer under condemnation. The
              verse speaks assurance, not permission to ignore wisdom.
            </p>
          </div>
          <div className={styles.previewSection}>
            <h4>Reflection question</h4>
            <p>
              Where do you still carry guilt that this passage invites you to
              release?
            </p>
          </div>
        </div>
      </section>

      <section className={styles.callout}>
        <div>
          <h2>Designed for trust, not noise.</h2>
          <p>
            This is not a chatbot. It is a Scripture-guided companion that keeps
            the text central and invites thoughtful reflection.
          </p>
        </div>
        <div className={styles.calloutStats}>
          <div>
            <span>3</span>
            <p>Layers of explanation</p>
          </div>
          <div>
            <span>0</span>
            <p>Autonomous AI actions</p>
          </div>
          <div>
            <span>100%</span>
            <p>Scripture-first responses</p>
          </div>
        </div>
      </section>
    </div>
  );
}
