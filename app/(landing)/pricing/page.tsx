import React from "react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <section className="section" id="pricing">
      <div className="wrap">
        <div className="eyebrow">Pricing</div>
        <h2>Simple, transparent pricing</h2>
        <p className="section-sub">
          Choose the plan that fits your business — upgrade any time as you grow.
        </p>
        <div className="price-grid">
          <div className="price-card">
            <div className="price-plan">Starter</div>
            <div className="price-desc">Perfect for small businesses</div>
            <div className="price-tag">
              $29<span>/month</span>
            </div>
            <ul className="price-feats">
              <li>Up to 5 users</li>
              <li>Core AI features</li>
              <li>Email support</li>
              <li>Standard integrations</li>
            </ul>
            <Link href="/login" className="btn btn-outline">
              Get started
            </Link>
          </div>
          <div className="price-card popular">
            <div className="popular-tag">Most popular</div>
            <div className="price-plan">Professional</div>
            <div className="price-desc">Best for growing teams</div>
            <div className="price-tag">
              $99<span>/month</span>
            </div>
            <ul className="price-feats">
              <li>Up to 50 users</li>
              <li>Advanced AI features</li>
              <li>Analytics dashboard</li>
              <li>API access</li>
              <li>Priority support</li>
            </ul>
            <Link href="/login" className="btn btn-grad">
              Get started
            </Link>
          </div>
          <div className="price-card">
            <div className="price-plan">Enterprise</div>
            <div className="price-desc">For large organizations</div>
            <div className="price-tag">Custom</div>
            <ul className="price-feats">
              <li>Unlimited users</li>
              <li>Custom integrations</li>
              <li>Dedicated support</li>
              <li>Advanced security</li>
              <li>SLA &amp; compliance</li>
            </ul>
            <Link href="/login" className="btn btn-outline">
              Contact sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
