import React from "react";
import Link from "next/link";

export default function NexoraLanding() {
  return (
    <main className="cursor-default select-none">
      <header className="hero" id="home">
        <div className="hero-glow"></div>
        <div className="wrap hero-grid">
          <div>
            <div className="badge">
              <span className="dot-live"></span>Enterprise AI platform, live in production
            </div>
            <h1>
              Run your business on <span className="grad">intelligent automation.</span>
            </h1>
            <p className="sub">
              CallZenza unifies voice AI, document intelligence, and workflow automation into one
              platform — so your teams move faster and your data finally works for you.
            </p>
            <div className="hero-ctas">
              <Link href="/signup" className="btn btn-grad">
                Get started →
              </Link>
              <Link href="/solutions" className="btn btn-ghost-dark">
                Explore solutions
              </Link>
            </div>
            <div className="hero-trust">
              <span>✓ No credit card required</span>
              <span>✓ SOC 2 &amp; GDPR compliant</span>
              <span>✓ Live in under 2 weeks</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="dash-panel glass">
              <div className="dash-top">
                <div>
                  <div className="dash-title">Operations Overview</div>
                  <div className="dash-sub">Last updated 2 min ago</div>
                </div>
                <div className="dash-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="kpi-row">
                <div className="kpi-mini">
                  <div className="n">12,536</div>
                  <div className="l">Total interactions</div>
                  <div className="c">▲ 12.3%</div>
                </div>
                <div className="kpi-mini">
                  <div className="n">98.4%</div>
                  <div className="l">Automation rate</div>
                  <div className="c">▲ 4.1%</div>
                </div>
                <div className="kpi-mini">
                  <div className="n">2,356</div>
                  <div className="l">Qualified leads</div>
                  <div className="c">▲ 13.7%</div>
                </div>
              </div>
              <div className="chart-mini">
                <svg viewBox="0 0 300 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polyline
                    points="0,70 30,58 60,64 90,32 120,46 150,20 180,40 210,18 240,34 270,12 300,26"
                    fill="none"
                    stroke="#5B3FE0"
                    strokeWidth="2.5"
                  />
                  <polygon
                    points="0,70 30,58 60,64 90,32 120,46 150,20 180,40 210,18 240,34 270,12 300,26 300,100 0,100"
                    fill="url(#hg)"
                  />
                </svg>
              </div>
            </div>
            <div className="float-kpi glass fk1">
              <div className="ic" style={{ background: "#E7F8F1" }}>
                📈
              </div>
              <div>
                <div className="t">Revenue impact</div>
                <div className="s">+ this quarter</div>
              </div>
            </div>
            <div className="float-kpi glass fk2">
              <div className="ic" style={{ background: "#EFEBFE" }}>
                ⚡
              </div>
              <div>
                <div className="t">Tasks automated</div>
                <div className="s">18,204 this month</div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-fade"></div>
      </header>

      <section className="trust-strip">
        <div className="wrap">
          <div className="strip-label">Trusted by 500+ enterprise teams worldwide</div>
          <div className="trust-logos">
            <span>Northwind</span>
            <span>Solace Health</span>
            <span>Meridian</span>
            <span>Vantra</span>
            <span>GlobalSoft</span>
            <span>CloudVerse</span>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--bg-soft)" }}>
        <div className="wrap">
          <div className="eyebrow">Dashboard</div>
          <h2>Every metric that matters, in one view</h2>
          <p className="section-sub">
            Real performance data — calls, resolution, sentiment, and agent scoring — updating
            live across your organization.
          </p>

          <div className="showcase-panel glass">
            <div className="showcase-top">
              <div className="kpi-card">
                <div className="n">24,532</div>
                <div className="l">Total conversations</div>
                <div className="c">▲ 9.4%</div>
              </div>
              <div className="kpi-card">
                <div className="n">8,425</div>
                <div className="l">Active users</div>
                <div className="c">▲ 6.1%</div>
              </div>
              <div className="kpi-card">
                <div className="n">92.6%</div>
                <div className="l">Resolution rate</div>
                <div className="c">▲ 2.8%</div>
              </div>
              <div className="kpi-card">
                <div className="n">4.7/5</div>
                <div className="l">CSAT score</div>
                <div className="c">▲ 0.3</div>
              </div>
            </div>
            <div className="showcase-mid">
              <div className="chart-card-lg">
                <h4>Conversations over time</h4>
                <svg viewBox="0 0 400 140" style={{ width: "100%", height: 140 }}>
                  <rect x="10" y="70" width="18" height="60" rx="4" fill="#7C5CFF" />
                  <rect x="40" y="50" width="18" height="80" rx="4" fill="#5B8DF7" />
                  <rect x="70" y="85" width="18" height="45" rx="4" fill="#7C5CFF" />
                  <rect x="100" y="35" width="18" height="95" rx="4" fill="#5B8DF7" />
                  <rect x="130" y="60" width="18" height="70" rx="4" fill="#7C5CFF" />
                  <rect x="160" y="25" width="18" height="105" rx="4" fill="#5B8DF7" />
                  <rect x="190" y="55" width="18" height="75" rx="4" fill="#7C5CFF" />
                  <rect x="220" y="40" width="18" height="90" rx="4" fill="#5B8DF7" />
                  <rect x="250" y="65" width="18" height="65" rx="4" fill="#7C5CFF" />
                  <rect x="280" y="30" width="18" height="100" rx="4" fill="#5B8DF7" />
                  <rect x="310" y="48" width="18" height="82" rx="4" fill="#7C5CFF" />
                  <rect x="340" y="58" width="18" height="72" rx="4" fill="#5B8DF7" />
                  <rect x="370" y="38" width="18" height="92" rx="4" fill="#7C5CFF" />
                </svg>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Conversations</th>
                      <th>Resolved</th>
                      <th>CSAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Maya Chen</td>
                      <td>1,240</td>
                      <td>1,196</td>
                      <td>
                        <span className="score-pill">4.9</span>
                      </td>
                    </tr>
                    <tr>
                      <td>Diego Ramos</td>
                      <td>1,108</td>
                      <td>1,042</td>
                      <td>
                        <span className="score-pill">4.8</span>
                      </td>
                    </tr>
                    <tr>
                      <td>Priya Nair</td>
                      <td>980</td>
                      <td>905</td>
                      <td>
                        <span className="score-pill">4.7</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="chart-card-lg">
                <h4>Channel distribution</h4>
                <div className="pie-wrap">
                  <div className="pie"></div>
                  <div className="pie-legend">
                    <div>
                      <span className="sw" style={{ background: "var(--purple)" }}></span>
                      Voice — 45%
                    </div>
                    <div>
                      <span className="sw" style={{ background: "var(--blue)" }}></span>
                      Chat — 27%
                    </div>
                    <div>
                      <span className="sw" style={{ background: "var(--green)" }}></span>
                      Email — 18%
                    </div>
                    <div>
                      <span className="sw" style={{ background: "var(--amber)" }}></span>
                      Other — 10%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="eyebrow">Why CallZenza</div>
          <h2>Benefits that show up on the balance sheet</h2>
          <div className="benefit-grid">
            <div className="benefit-card">
              <div className="ic">🧠</div>
              <h4>AI-native architecture</h4>
              <p>Built on modern models, not bolted onto legacy software.</p>
            </div>
            <div className="benefit-card">
              <div className="ic">🔌</div>
              <h4>Seamless integration</h4>
              <p>Connects to your stack in days, not quarters.</p>
            </div>
            <div className="benefit-card">
              <div className="ic">☁️</div>
              <h4>Enterprise-grade cloud</h4>
              <p>99.99% uptime with regional data residency options.</p>
            </div>
            <div className="benefit-card">
              <div className="ic">⚡</div>
              <h4>Real-time insight</h4>
              <p>Decisions made on what's happening now, not last month.</p>
            </div>
            <div className="benefit-card">
              <div className="ic">🎧</div>
              <h4>24/7 white-glove support</h4>
              <p>A dedicated team, not a ticket queue.</p>
            </div>
            <div className="benefit-card">
              <div className="ic">📈</div>
              <h4>Scales with you</h4>
              <p>From one team to a global operation, without re-platforming.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--bg-soft)" }}>
        <div className="wrap">
          <div className="eyebrow">How it works</div>
          <h2>Live in five simple steps</h2>
          <div className="steps">
            <div className="step">
              <div className="step-ic">🔗</div>
              <h4>Connect</h4>
              <p>Link your data and existing tools.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-ic">🛠️</div>
              <h4>Configure</h4>
              <p>Set up workflows for your business.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-ic">🤖</div>
              <h4>Automate</h4>
              <p>AI takes over the repetitive work.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-ic">📊</div>
              <h4>Analyze</h4>
              <p>See results in live dashboards.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-ic">🚀</div>
              <h4>Grow</h4>
              <p>Scale what's working, automatically.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="testimonials">
        <div className="wrap">
          <div className="eyebrow">Customers</div>
          <h2>What our customers say</h2>
          <div className="test-grid">
            <div className="test-card">
              <div className="stars">★★★★★</div>
              <p>
                CallZenza cut our average response time by 70% in the first quarter. The ROI was
                obvious within weeks.
              </p>
              <div className="test-who">
                <span className="avatar"></span>
                <div>
                  <div className="name">Elena Marsh</div>
                  <div className="role">VP Operations, Northwind</div>
                </div>
              </div>
            </div>
            <div className="test-card">
              <div className="stars">★★★★★</div>
              <p>
                The voice assistant genuinely feels human. Our customers can't tell — and our
                team finally has bandwidth back.
              </p>
              <div className="test-who">
                <span className="avatar"></span>
                <div>
                  <div className="name">Raj Patel</div>
                  <div className="role">Head of CX, Vantra</div>
                </div>
              </div>
            </div>
            <div className="test-card">
              <div className="stars">★★★★★</div>
              <p>
                Implementation was smooth, support was excellent, and the dashboards are the
                best I've used at this price point.
              </p>
              <div className="test-who">
                <span className="avatar"></span>
                <div>
                  <div className="name">Sofia Lindqvist</div>
                  <div className="role">Director of IT, Meridian</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
