import React from "react";

export default function SolutionsPage() {
  return (
    <section className="section" id="solutions">
      <div className="wrap">
        <div className="eyebrow">What we offer</div>
        <h2>AI solutions for modern enterprises</h2>
        <p className="section-sub">
          Six product pillars, one connected platform — built to automate, analyze, and
          accelerate every part of the business.
        </p>
        <div className="feature-grid" id="features">
          <div className="feature-card">
            <div className="f-icon" style={{ background: "#EFEBFE" }}>
              🎙️
            </div>
            <h3>AI Voice Assistant</h3>
            <p>Human-like inbound and outbound voice agents that handle real conversations at scale.</p>
          </div>
          <div className="feature-card">
            <div className="f-icon" style={{ background: "#E6F0FF" }}>
              💬
            </div>
            <h3>AI Chatbot</h3>
            <p>Instant, on-brand support across web, mobile, and messaging channels.</p>
          </div>
          <div className="feature-card">
            <div className="f-icon" style={{ background: "#E7F8F1" }}>
              📄
            </div>
            <h3>Document Intelligence</h3>
            <p>Extract and structure data from PDFs, invoices, and contracts automatically.</p>
          </div>
          <div className="feature-card">
            <div className="f-icon" style={{ background: "#FDF0E1" }}>
              ⚙️
            </div>
            <h3>Workflow Automation</h3>
            <p>Turn repetitive, multi-step processes into reliable automated pipelines.</p>
          </div>
          <div className="feature-card">
            <div className="f-icon" style={{ background: "#FDE9E9" }}>
              📊
            </div>
            <h3>Predictive Analytics</h3>
            <p>Forecast outcomes and surface the decisions worth making today.</p>
          </div>
          <div className="feature-card">
            <div className="f-icon" style={{ background: "#E6F0FF" }}>
              📈
            </div>
            <h3>Smart Reporting</h3>
            <p>Live dashboards and reports that update themselves — no spreadsheets required.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
