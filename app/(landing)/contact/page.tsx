import React from "react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <section className="cta-outer" id="contact">
      <div className="cta-band">
        <h2>Ready to transform your business?</h2>
        <p>
          Schedule a personalized demo and see how CallZenza fits into your operations in under
          30 minutes.
        </p>
        <div className="cta-ctas">
          <Link href="/login" className="btn btn-white">
            Get Started →
          </Link>
          <Link href="/login" className="btn btn-ghost-dark">
            Login
          </Link>
        </div>
      </div>
    </section>
  );
}
