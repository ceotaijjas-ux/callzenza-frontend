"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav>
      <div className="wrap" style={{ maxWidth: 1200 }}>
        <div className="nav-inner">
          <Link href="/" className="logo">
            <span className="logo-mark"><Sparkles size={16} strokeWidth={2.5} /></span>CallZenza
          </Link>
          <div className="nav-links">
            <Link href="/" className={pathname === "/" ? "active" : ""}>Home</Link>
            <Link href="/solutions" className={pathname === "/solutions" ? "active" : ""}>Solutions</Link>
            <Link href="/features" className={pathname === "/features" ? "active" : ""}>Features</Link>
            <Link href="/industries" className={pathname === "/industries" ? "active" : ""}>Industries</Link>
            <Link href="/pricing" className={pathname === "/pricing" ? "active" : ""}>Pricing</Link>
            <Link href="/contact" className={pathname === "/contact" ? "active" : ""}>Contact</Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href="/login" className="nav-login-btn">
              Login
            </Link>
            <Link href="/register" className="btn btn-grad" style={{ padding: "8px 18px", fontSize: "0.86rem" }}>
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

