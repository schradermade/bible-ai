'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import styles from './app-shell.module.css';
import SubscriptionTab from './SubscriptionTab';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3 11.5 12 4l9 7.5v7.5a1 1 0 0 1-1 1h-5.5V15a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v5H4a1 1 0 0 1-1-1z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/insight',
    label: 'Insight',
    icon: (
      <Image
        src="/insight.png"
        alt=""
        width={48}
        height={48}
        style={{ width: '48px', height: '48px' }}
      />
    ),
  },
  {
    href: '/saved',
    label: 'Saved',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6.5 4.5h11a1 1 0 0 1 1 1v14.2a.8.8 0 0 1-1.3.6L12 16.8l-5.2 3.5a.8.8 0 0 1-1.3-.6V5.5a1 1 0 0 1 1-1z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.brandSection}>
            <div>
              <div className={styles.brand}>Berea Study</div>
              <p className={styles.tagline}>Daily Scripture study with AI</p>
            </div>
            <div className={styles.trustBadge}>Scripture-First</div>
          </div>
        </div>

        <div className={styles.socialProof}>Join 2,000+ students</div>

        <div className={styles.headerRight}>
          <SignedOut>
            <Link href="/sign-up">
              <div className={styles.ctaPill}>Free to start</div>
            </Link>
            <SignInButton mode="modal">
              <button className={styles.signIn}>Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton>
              <UserButton.UserProfilePage
                label="Subscription"
                url="subscription"
                labelIcon={
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                    <path
                      d="M3 8h18M3 12h18M3 16h18M7 4v16M17 4v16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              >
                <SubscriptionTab />
              </UserButton.UserProfilePage>
            </UserButton>
          </SignedIn>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
