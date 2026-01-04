"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import styles from "./app-shell.module.css";

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/explain", label: "Explain" },
  { href: "/saved", label: "Saved" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Bible AI</div>
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
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <SignedOut>
            <SignInButton mode="modal">
              <button className={styles.signIn}>Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
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
