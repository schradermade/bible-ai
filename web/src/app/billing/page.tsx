import { auth } from "@clerk/nextjs/server";
import styles from "./page.module.css";
import SignInAction from "@/components/SignInAction";
import BillingActions from "@/components/BillingActions";
import {
  getBillingPeriodEnd,
  getBillingPeriodStart,
  getSubscriptionStatus,
  getUsageCount,
  getUsageLimit,
  INSIGHT_FEATURE_KEY,
} from "@/lib/billing";

const PLAN_NAME = "Berea Study Plus";
const PLAN_PRICE_LABEL = process.env.NEXT_PUBLIC_PRO_PRICE_LABEL ?? "$8 / month";
const FREE_PLAN_LABEL = "Berea Study Free";

export default async function BillingPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Billing</p>
            <h1>Keep the study calm, focused, and unlimited.</h1>
            <p className={styles.subcopy}>
              Upgrade to unlock deeper monthly insight sessions and save every
              response for later.
            </p>
          </div>
        </header>
        <section className={styles.pricingGrid}>
          <article className={styles.planCard}>
            <p className={styles.planEyebrow}>Current plan</p>
            <h2>{FREE_PLAN_LABEL}</h2>
            <p className={styles.planPrice}>$0</p>
            <ul className={styles.planList}>
              <li>10 AI insights per month</li>
              <li>Session-based responses</li>
              <li>Community-grade support</li>
            </ul>
            <p className={styles.planNote}>Best for occasional study.</p>
          </article>

          <article className={styles.planCardFeatured}>
            <div className={styles.planHighlight}>
              <p className={styles.planEyebrow}>{PLAN_NAME}</p>
              <span className={styles.badge}>Most loved</span>
            </div>
            <h2>{PLAN_PRICE_LABEL}</h2>
            <p className={styles.planPriceMeta}>Billed monthly · Cancel anytime</p>
            <ul className={styles.planList}>
              <li>100 AI insights per month</li>
              <li>Save and revisit every insight</li>
              <li>Priority processing and support</li>
            </ul>
            <div className={styles.cta}>
              <SignInAction label="Sign in to subscribe" />
            </div>
          </article>
        </section>
      </div>
    );
  }

  const subscription = await getSubscriptionStatus(userId);
  const usageCount = await getUsageCount(userId, INSIGHT_FEATURE_KEY);
  const usageLimit = getUsageLimit(subscription.isActive);
  const periodStart = getBillingPeriodStart();
  const periodEnd = getBillingPeriodEnd();
  const usagePercent =
    usageLimit > 0 ? Math.min(100, Math.round((usageCount / usageLimit) * 100)) : 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Billing</p>
          <h1>Keep the study calm, focused, and unlimited.</h1>
          <p className={styles.subcopy}>
            Upgrade to unlock deeper monthly insight sessions and save every
            response for later.
          </p>
        </div>
        <div className={styles.statusPill}>
          <span>{subscription.isActive ? "Plus active" : "Free plan"}</span>
          <span>
            {subscription.cancelAtPeriodEnd
              ? "Cancels at period end"
              : "Monthly renewal"}
          </span>
        </div>
      </header>

      <section className={styles.pricingGrid}>
        <article className={styles.planCard}>
          <p className={styles.planEyebrow}>Current plan</p>
          <h2>{FREE_PLAN_LABEL}</h2>
          <p className={styles.planPrice}>$0</p>
          <ul className={styles.planList}>
            <li>10 AI insights per month</li>
            <li>Session-based responses</li>
            <li>Community-grade support</li>
          </ul>
          <p className={styles.planNote}>Best for occasional study.</p>
        </article>

        <article className={styles.planCardFeatured}>
          <div className={styles.planHighlight}>
            <p className={styles.planEyebrow}>{PLAN_NAME}</p>
            <span className={styles.badge}>Most loved</span>
          </div>
          <h2>{PLAN_PRICE_LABEL}</h2>
          <p className={styles.planPriceMeta}>Billed monthly · Cancel anytime</p>
          <ul className={styles.planList}>
            <li>100 AI insights per month</li>
            <li>Save and revisit every insight</li>
            <li>Priority processing and support</li>
          </ul>
          <div className={styles.cta}>
            <BillingActions
              isActive={subscription.isActive}
              cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
            />
            <p className={styles.status}>
              {subscription.isActive ? "Active" : "Free plan"}
              {subscription.cancelAtPeriodEnd
                ? " · Cancels at period end"
                : ""}
            </p>
          </div>
        </article>
      </section>

      <section className={styles.usageCard}>
        <div className={styles.usageHeader}>
          <div>
            <h3>Monthly insight usage</h3>
            <p className={styles.period}>
              {periodStart.toLocaleDateString()} –{" "}
              {periodEnd.toLocaleDateString()}
            </p>
          </div>
          <p className={styles.usage}>
            {usageCount}/{usageLimit}
          </p>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <p className={styles.progressNote}>{usagePercent}% of monthly limit</p>
      </section>
    </div>
  );
}
