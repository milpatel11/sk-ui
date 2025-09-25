"use client";

import React from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";

export type NavbarItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type NavbarProps = {
  brand?: React.ReactNode;
  items?: NavbarItem[];
  className?: string;
};

export default function Navbar({ brand, items = [], className }: NavbarProps) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  return (
    <header className={`${styles.header} ${className ?? ""}`.trim()}>
      <nav className={styles.nav} aria-label="Primary">
        <div className={styles.left}>
          <div className={styles.brand}>
            {brand ?? (
              <Link href="/" className={styles.brandLink}>
                SK UI
              </Link>
            )}
          </div>
        </div>
        <button
          className={styles.menuButton}
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls={`${id}-menu`}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.menuIcon} aria-hidden>
            ☰
          </span>
        </button>
        <ul id={`${id}-menu`} className={`${styles.menu} ${open ? styles.open : ""}`.trim()}>
          {items.map((item) => (
            <li key={item.href} className={styles.menuItem}>
              {item.external ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  {item.label}
                </a>
              ) : (
                <Link href={item.href} className={styles.link} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
