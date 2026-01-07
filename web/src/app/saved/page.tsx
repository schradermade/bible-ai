import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import styles from "./page.module.css";
import SignInAction from "@/components/SignInAction";
import { getSubscriptionStatus } from "@/lib/billing";

export default async function SavedPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Saved insights</h1>
        </header>
        <div className={styles.empty}>
          <p>Sign in to view saved insights.</p>
          <SignInAction />
        </div>
      </div>
    );
  }

  const subscription = await getSubscriptionStatus(userId);
  if (!subscription.isActive) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Saved insights</h1>
        </header>
        <div className={styles.empty}>
          <p>Upgrade to save and view insights.</p>
          <a href="/billing">View plans</a>
        </div>
      </div>
    );
  }

  const saved = await prisma.savedAiResponse.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Saved insights</h1>
      </header>
      <div className={styles.list}>
        {saved.length === 0 ? (
          <p>No saved insights yet.</p>
        ) : (
          saved.map((item) => (
            <article key={item.id} className={styles.card}>
              <div>
                <p className={styles.meta}>{item.feature.replace("_", " ")}</p>
                {item.reference ? <h2>{item.reference}</h2> : null}
              </div>
              <pre className={styles.response}>{item.response}</pre>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
