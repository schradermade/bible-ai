import { SignUp } from "@clerk/nextjs";
import styles from "./page.module.css";

export default function SignUpPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>Single plan, full depth</p>
          <h1>Study Scripture with calm focus and lasting clarity.</h1>
          <p className={styles.lead}>
            One plan. No tiers. Everything you need to explore, reflect, and
            save every insight in a warm, studio-lit experience.
          </p>
        </div>

        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <div>
              <p className={styles.planLabel}>Berea Study Plus</p>
              <div className={styles.priceRow}>
                <span className={styles.price}>$8</span>
                <span className={styles.per}>/ month</span>
              </div>
            </div>
            <div className={styles.planStamp}>Unlimited focus</div>
          </div>
          <div className={styles.planMeta}>
            <span>100 insights per month</span>
            <span>Save every insight</span>
            <span>Priority processing</span>
          </div>
          <div className={styles.materialStrip}>
            <div className={`${styles.material} ${styles.materialBook}`}>
              <span>Bound study</span>
            </div>
            <div className={`${styles.material} ${styles.materialPaper}`}>
              <span>Parchment notes</span>
            </div>
            <div className={`${styles.material} ${styles.materialSeal}`}>
              <span>Gold seal</span>
            </div>
            <div className={`${styles.material} ${styles.materialSteel}`}>
              <span>Steel archive</span>
            </div>
          </div>
        </div>

        <div className={styles.featureGrid}>
          {[
            {
              title: "Measured guidance",
              copy: "Scripture-first responses that stay pastoral and grounded.",
              tone: styles.thumbParchment,
            },
            {
              title: "Keep your place",
              copy: "Save insights, notes, and references in one vault.",
              tone: styles.thumbBook,
            },
            {
              title: "Steady cadence",
              copy: "Monthly rhythm with clear usage and no surprises.",
              tone: styles.thumbSteel,
            },
            {
              title: "Crafted for focus",
              copy: "Quiet interfaces that feel like studio light on paper.",
              tone: styles.thumbGlass,
            },
          ].map((item) => (
            <div key={item.title} className={styles.featureCard}>
              <div className={`${styles.thumb} ${item.tone}`} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className={styles.signupPanel}>
        <div className={styles.signupFrame}>
          <div className={styles.signupHeader}>
            <p>Create your account</p>
            <span>Join in under a minute</span>
          </div>
          <SignUp />
        </div>
      </aside>
    </div>
  );
}
