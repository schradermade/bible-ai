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
  {
    href: '/circles',
    label: 'Circles',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle
          cx="9"
          cy="10"
          r="1.5"
          fill="currentColor"
        />
        <circle
          cx="15"
          cy="10"
          r="1.5"
          fill="currentColor"
        />
        <circle
          cx="12"
          cy="14"
          r="1.5"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const handleAvatarWrapperClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const wrapper = event.currentTarget;
    const button = wrapper.querySelector('button');
    if (!button) return;
    if (button.contains(event.target as Node)) return;
    button.click();
  };

  const handleAvatarWrapperKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    const wrapper = event.currentTarget;
    const button = wrapper.querySelector('button');
    if (button) {
      button.click();
    }
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.brandSection}>
            <div className={styles.brand}>
              <svg
                className={styles.brandIcon}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 19.4413 12.8787 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Berea Study
            </div>
            <p className={styles.tagline}>Bible study with AI</p>
          </div>
        </div>

        <div className={styles.marketingBar}>
          <div className={styles.trustBadge}>
            <span className={styles.trustBadgeCheck}>✓</span>
            <span>Scripture First, AI Supported</span>
          </div>

          <div className={styles.socialProof}>
            <span className={styles.socialProofIcon}>✦</span>
            <span>2,000+ daily students</span>
          </div>

          <div className={styles.freshBadge}>
            <span className={styles.freshBadgeIcon}>☀</span>
            <span>New Study Daily</span>
          </div>

          <div className={`${styles.tooltip} ${styles.tooltipTrust}`}>
            <p>
              <span className={styles.tooltipIcon}>✨</span> Our AI assists your
              study but never replaces the primacy of Scripture. You lead, AI
              supports.
            </p>
          </div>
          <div className={`${styles.tooltip} ${styles.tooltipSocial}`}>
            <p>
              <span className={styles.tooltipIcon}>✨</span> Join thousands of
              believers engaging with Scripture daily through thoughtful,
              AI-enhanced study.
            </p>
          </div>
          <div className={`${styles.tooltip} ${styles.tooltipFresh}`}>
            <p>
              <span className={styles.tooltipIcon}>✨</span> Fresh insights and
              study materials added every day to deepen your understanding of
              God&apos;s Word.
            </p>
          </div>
        </div>

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
            <div
              className={styles.avatarWrapper}
              role="button"
              tabIndex={0}
              onClick={handleAvatarWrapperClick}
              onKeyDown={handleAvatarWrapperKeyDown}
              aria-label="Open account menu"
            >
              <UserButton>
                <UserButton.UserProfilePage
                  label="Subscription"
                  url="subscription"
                  labelIcon={
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                    >
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
            </div>
          </SignedIn>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
