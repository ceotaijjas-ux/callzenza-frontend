import React from "react";

export default function IndustriesPage() {
  return (
    <>
      <section
        className="section"
        id="industries"
        style={{ background: "var(--bg-soft)", paddingTop: 80, paddingBottom: 80 }}
      >
        <div className="wrap">
          <div className="eyebrow">Industries</div>
          <h2>Built for every regulated, high-stakes industry</h2>
          <div className="industry-row">
            <div className="industry-item"><span className="ic">🏥</span>Healthcare</div>
            <div className="industry-item"><span className="ic">🏦</span>Banking</div>
            <div className="industry-item"><span className="ic">🛒</span>Retail</div>
            <div className="industry-item"><span className="ic">🏭</span>Manufacturing</div>
            <div className="industry-item"><span className="ic">🎓</span>Education</div>
            <div className="industry-item"><span className="ic">🛡️</span>Insurance</div>
            <div className="industry-item"><span className="ic">🚚</span>Logistics</div>
            <div className="industry-item"><span className="ic">🏛️</span>Government</div>
            <div className="industry-item"><span className="ic">🏨</span>Hospitality</div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="eyebrow">Integrations</div>
          <h2>Connects to the tools you already run</h2>
          <div className="integration-grid">
            <div className="integration-item">Salesforce</div>
            <div className="integration-item">Zoho CRM</div>
            <div className="integration-item">HubSpot</div>
            <div className="integration-item">Twilio</div>
            <div className="integration-item">Microsoft Teams</div>
            <div className="integration-item">Cisco</div>
            <div className="integration-item">RingCentral</div>
            <div className="integration-item">Asterisk</div>
          </div>
        </div>
      </section>
    </>
  );
}
