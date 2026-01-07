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
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Berea Study</div>
        <p className={styles.tagline}>Scripture-guided AI</p>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href ? styles.navLinkActive : styles.navLink
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <SignedOut>
            <Link
              href="/sign-up"
              className={
                pathname.startsWith('/sign-up')
                  ? styles.navLinkActive
                  : styles.navLink
              }
            >
              <span className={styles.navIcon}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M5 19.5a7 7 0 0 1 14 0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Signup
            </Link>
          </SignedOut>
        </nav>
        <div className={styles.sidebarFooter}>
          <SignedOut>
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
      </aside>

      <div className={styles.main}>
        <div className={styles.topbar}>
          <span className={styles.topbarLabel}>
            Calm, Scripture-first guidance
          </span>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
