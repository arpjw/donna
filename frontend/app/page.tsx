"use client";

import Link from "next/link";

function smoothScrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const navItems: { label: string; target: string }[] = [
  { label: "Product", target: "features" },
  { label: "Pricing", target: "pricing" },
  { label: "About", target: "about" },
];

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "var(--font-dm-sans)", background: "#0E0B08", color: "#F0EDE6", minHeight: "100vh" }}>
      <style>{`
        @keyframes statUnderlineGrow {
          from { width: 0px; opacity: 0; }
          to   { width: 40px; opacity: 1; }
        }
        .stat-underline {
          display: block;
          height: 1px;
          width: 40px;
          background: rgba(196,133,90,0.4);
          margin: 6px auto 0;
          animation: statUnderlineGrow 1.5s ease forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
      `}</style>

      {/* Navigation */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          height: 60,
          borderBottom: "1px solid #1E1A15",
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#0E0B08",
        }}
      >
        <span style={{ fontFamily: "var(--font-cormorant)", fontSize: 20, color: "#F0EDE6" }}>
          Donn<em style={{ color: "#C4855A", fontStyle: "italic" }}>a</em>
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {navItems.map(({ label, target }) => (
            <a
              key={label}
              href={`#${target}`}
              onClick={(e) => { e.preventDefault(); smoothScrollTo(target); }}
              style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#6B655C", textDecoration: "none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#F0EDE6")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#6B655C")}
            >
              {label}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            href="/sign-in"
            style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#9E9890", textDecoration: "none" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#F0EDE6")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#9E9890")}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: 12,
              fontWeight: 500,
              background: "#C4855A",
              color: "#fff",
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: 5,
            }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          position: "relative",
          padding: "120px 48px 100px",
          maxWidth: 1100,
          margin: "0 auto",
          overflow: "hidden",
        }}
      >
        {/* Large faint "D" letterform — background watermark */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            fontFamily: "var(--font-cormorant)",
            fontStyle: "italic",
            fontSize: 400,
            color: "rgba(196,133,90,0.04)",
            top: -60,
            left: -20,
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 0,
            lineHeight: 1,
          }}
        >
          D
        </span>

        {/* Horizontal grid lines */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0px, transparent 49px, rgba(196,133,90,0.06) 49px, rgba(196,133,90,0.06) 50px)",
          }}
        />

        {/* Orb 1 */}
        <div
          style={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "#C4855A",
            opacity: 0.15,
            top: 60,
            right: 80,
            filter: "blur(60px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        {/* Orb 2 */}
        <div
          style={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "#9B7FC7",
            opacity: 0.15,
            top: 160,
            right: 240,
            filter: "blur(50px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        {/* Orb 3 */}
        <div
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "#7B9E87",
            opacity: 0.15,
            top: 280,
            right: 60,
            filter: "blur(40px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        {/* Orb 4 */}
        <div
          style={{
            position: "absolute",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "#6B8CAE",
            opacity: 0.10,
            top: 380,
            right: 140,
            filter: "blur(30px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div style={{ width: 20, height: 1, background: "#C4855A" }} />
            <span
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: 10,
                color: "#C4855A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Regulatory intelligence, redesigned
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: 68,
              fontWeight: 400,
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
              marginBottom: 32,
              maxWidth: 640,
            }}
          >
            <span style={{ color: "#F0EDE6" }}>Always</span>
            <br />
            <em style={{ color: "#C4855A", fontStyle: "italic" }}>three steps</em>
            <br />
            <span style={{ color: "#7B9E87" }}>ahead.</span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: 15,
              fontWeight: 300,
              lineHeight: 1.7,
              color: "#6B655C",
              maxWidth: 480,
              marginBottom: 40,
            }}
          >
            Donna monitors every regulatory source that matters to your business, translates dense legal language into plain English, and delivers what you need to act — before your competitors even know it changed.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Link
              href="/sign-up"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: 14,
                fontWeight: 500,
                background: "#C4855A",
                color: "#fff",
                textDecoration: "none",
                padding: "12px 28px",
                borderRadius: 5,
              }}
            >
              Start free trial
            </Link>
            <Link
              href="/feed"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: 14,
                fontWeight: 400,
                color: "#9E9890",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#F0EDE6")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#9E9890")}
            >
              See a live demo →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: PROBLEM STATEMENT ── */}
      <section id="about">
        <div style={{ height: 1, background: "#1E1A15", margin: "0 48px" }} />
        <div
          style={{
            padding: "80px 48px",
            textAlign: "center",
          }}
        >
          <blockquote
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: 32,
              fontWeight: 400,
              fontStyle: "italic",
              color: "#D4CFC7",
              maxWidth: 640,
              margin: "0 auto 24px",
              lineHeight: 1.4,
            }}
          >
            &ldquo;The average compliance officer spends 6 hours per week reading regulatory notices. Most of them don&rsquo;t apply to her company. The ones that do — she finds out too late.&rdquo;
          </blockquote>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: 14,
              color: "#6B655C",
              maxWidth: 540,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Donna was built to fix this. Always-on monitoring, plain-language analysis, and personalized delivery — so you can focus on your work, not your inbox.
          </p>
        </div>
        <div style={{ height: 1, background: "#1E1A15", margin: "0 48px" }} />
      </section>

      {/* Stats row */}
      <div style={{ margin: "80px 48px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            background: "#141009",
            borderRadius: 8,
            overflow: "hidden",
            gap: 1,
          }}
        >
          {[
            { number: "1,292", label: "Changes monitored" },
            { number: "8", label: "Regulatory sources" },
            { number: "<48h", label: "Time to alert" },
            { number: "$0", label: "Missed changes" },
          ].map(({ number, label }) => (
            <div
              key={label}
              style={{ background: "#0E0B08", padding: "32px 28px", textAlign: "center" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: 36,
                  fontWeight: 400,
                  color: "#F0EDE6",
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {number}
              </p>
              <span className="stat-underline" />
              <p
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: 11,
                  color: "#6B655C",
                  letterSpacing: "0.04em",
                  marginTop: 8,
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div id="features" style={{ margin: "0 48px 80px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            background: "#1E1A15",
            gap: 1,
          }}
        >
          {/* Feature 1 — Always-on monitoring */}
          <div style={{ background: "#0E0B08", padding: "28px 24px" }}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block", marginBottom: 12 }}
              aria-hidden="true"
            >
              <path d="M 32 32 m -28 0 a 28 28 0 0 1 28 -28" stroke="#C4855A" strokeWidth="1.5" strokeOpacity="0.15" fill="none" strokeLinecap="round" />
              <path d="M 32 32 m -18 0 a 18 18 0 0 1 18 -18" stroke="#C4855A" strokeWidth="1.5" strokeOpacity="0.25" fill="none" strokeLinecap="round" />
              <path d="M 32 32 m -10 0 a 10 10 0 0 1 10 -10" stroke="#C4855A" strokeWidth="1.5" strokeOpacity="0.40" fill="none" strokeLinecap="round" />
              <circle cx="32" cy="32" r="3" fill="#C4855A" />
            </svg>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: "rgba(196,133,90,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 3, background: "#C4855A" }} />
            </div>
            <h3
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: 18,
                fontWeight: 400,
                color: "#F0EDE6",
                marginBottom: 10,
              }}
            >
              Always-on monitoring
            </h3>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 300, color: "#6B655C", lineHeight: 1.6 }}>
              Donna watches Federal Register, SEC EDGAR, CFPB, FTC, and state-level sources around the clock — so you never miss a publication that matters.
            </p>
          </div>

          {/* Feature 2 — Plain language analysis */}
          <div style={{ background: "#0E0B08", padding: "28px 24px" }}>
            <svg
              width="64"
              height="40"
              viewBox="0 0 64 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block", marginBottom: 12 }}
              aria-hidden="true"
            >
              <rect x="0" y="0"  width="64" height="2" fill="#7B9E87" fillOpacity="0.20" rx="1" />
              <rect x="0" y="8"  width="54" height="2" fill="#7B9E87" fillOpacity="0.30" rx="1" />
              <rect x="0" y="16" width="45" height="2" fill="#7B9E87" fillOpacity="0.40" rx="1" />
              <rect x="0" y="24" width="58" height="2" fill="#7B9E87" fillOpacity="0.30" rx="1" />
              <rect x="0"  y="32" width="22" height="2" fill="#7B9E87" fillOpacity="0.20" rx="1" />
              <rect x="24" y="32" width="16" height="2" fill="#7B9E87" fillOpacity="0.70" rx="1" />
            </svg>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: "rgba(123,158,135,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 3, background: "#7B9E87" }} />
            </div>
            <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: 18, fontWeight: 400, color: "#F0EDE6", marginBottom: 10 }}>
              Plain language analysis
            </h3>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 300, color: "#6B655C", lineHeight: 1.6 }}>
              Every regulatory change arrives pre-translated: a plain English summary, impact assessment, and specific action items written for compliance officers, not lawyers.
            </p>
          </div>

          {/* Feature 3 — Personalized */}
          <div style={{ background: "#0E0B08", padding: "28px 24px" }}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block", marginBottom: 12 }}
              aria-hidden="true"
            >
              <path d="M 8 10 L 56 10 L 32 54 Z" stroke="#9B7FC7" strokeWidth="1.5" strokeOpacity="0.40" fill="none" strokeLinejoin="round" />
              <line x1="14" y1="22" x2="50" y2="22" stroke="#9B7FC7" strokeWidth="1" strokeOpacity="0.20" />
              <line x1="20" y1="33" x2="44" y2="33" stroke="#9B7FC7" strokeWidth="1" strokeOpacity="0.20" />
              <line x1="26" y1="43" x2="38" y2="43" stroke="#9B7FC7" strokeWidth="1" strokeOpacity="0.20" />
              <circle cx="32" cy="54" r="2.5" fill="#9B7FC7" />
            </svg>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: "rgba(155,127,199,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 3, background: "#9B7FC7" }} />
            </div>
            <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: 18, fontWeight: 400, color: "#F0EDE6", marginBottom: 10 }}>
              Personalized to your business
            </h3>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 300, color: "#6B655C", lineHeight: 1.6 }}>
              Tell Donna your industry and jurisdictions once. She filters everything else — so your feed shows only what actually applies to you, ranked by relevance.
            </p>
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <div style={{ margin: "0 48px 80px" }}>
        <div
          style={{
            background: "#141009",
            padding: "40px 48px",
            display: "flex",
            alignItems: "flex-start",
            gap: 48,
            borderRadius: 6,
          }}
        >
          <blockquote
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: 22,
              fontWeight: 300,
              fontStyle: "italic",
              color: "#D4CFC7",
              lineHeight: 1.5,
              flex: 1,
              margin: 0,
            }}
          >
            &ldquo;Before Donna, I was spending 6 hours a week reading regulatory notices that mostly didn&rsquo;t apply to us. Now I get a briefing every Monday morning that tells me exactly what{" "}
            <span style={{ color: "#C4855A", fontStyle: "normal" }}>we</span>{" "}
            need to do.&rdquo;
          </blockquote>

          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(196,133,90,0.20), rgba(155,127,199,0.20))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
                position: "relative",
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(196,133,90,0.30)" }} />
            </div>
            <div style={{ width: 64, height: 1, background: "rgba(212,207,199,0.20)", marginBottom: 12 }} />
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#F0EDE6", fontWeight: 500, marginBottom: 2, textAlign: "center" }}>
              Sarah Chen
            </p>
            <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: 11, color: "#6B655C", textAlign: "center" }}>
              Chief Compliance Officer, Series B Fintech
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: PRODUCT SCREENSHOT ── */}
      <section id="product" style={{ padding: "60px 48px", borderTop: "1px solid #1E1A15" }}>
        <p
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: 10,
            color: "#C4855A",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: 16,
          }}
        >
          The product
        </p>
        <h2
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: 36,
            fontWeight: 400,
            color: "#F0EDE6",
            marginBottom: 32,
          }}
        >
          Your regulatory feed, always up to date
        </h2>

        {/* Browser chrome mockup */}
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid #2E2A25",
          }}
        >
          {/* Browser bar */}
          <div
            style={{
              background: "#1C1814",
              height: 36,
              padding: "0 16px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#B85C5C" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D4893A" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7B9E87" }} />
            <div
              style={{
                flex: 1,
                background: "#0E0B08",
                borderRadius: 4,
                height: 20,
                margin: "0 12px",
                display: "flex",
                alignItems: "center",
                padding: "0 10px",
              }}
            >
              <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: 9, color: "#4A453F" }}>
                app.donnaplatform.com/feed
              </span>
            </div>
          </div>

          {/* Screen area */}
          <div
            style={{
              background: "#DDD8D0",
              padding: 1,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {/* Card 1 — HIGH */}
            <div style={{ background: "#F5F2EC", padding: "16px 20px", fontFamily: "var(--font-dm-sans)" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "#FAF0EC",
                    color: "#8B3A2F",
                    border: "1px solid #E8C4BC",
                    padding: "2px 7px",
                    borderRadius: 3,
                  }}
                >
                  HIGH
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "#F0EDE8",
                    color: "#5C5C5C",
                    border: "1px solid #D8D4CE",
                    padding: "2px 7px",
                    borderRadius: 3,
                  }}
                >
                  Final Rule
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "#F0EDE8",
                    color: "#5C5C5C",
                    border: "1px solid #D8D4CE",
                    padding: "2px 7px",
                    borderRadius: 3,
                  }}
                >
                  SEC EDGAR
                </span>
              </div>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 15, fontWeight: 500, color: "#111111", marginBottom: 6, lineHeight: 1.3 }}>
                SEC Adopts New Cybersecurity Risk Management Rules for Investment Advisers
              </p>
              <p style={{ fontSize: 11, color: "#5C5C5C", fontWeight: 300, lineHeight: 1.5, marginBottom: 8 }}>
                Registered investment advisers must adopt written cybersecurity policies with mandatory incident reporting within 48 hours.
              </p>
              <span
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: 9,
                  color: "#8B3A2F",
                  background: "#FAF0EC",
                  border: "1px solid #E8C4BC",
                  padding: "2px 8px",
                  borderRadius: 10,
                }}
              >
                Comment deadline in 6 days
              </span>
            </div>

            {/* Card 2 — MEDIUM */}
            <div style={{ background: "#F5F2EC", padding: "16px 20px", fontFamily: "var(--font-dm-sans)" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "#FDF4EC",
                    color: "#8B5A1F",
                    border: "1px solid #E8D0B0",
                    padding: "2px 7px",
                    borderRadius: 3,
                  }}
                >
                  MEDIUM
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "#F0EDE8",
                    color: "#5C5C5C",
                    border: "1px solid #D8D4CE",
                    padding: "2px 7px",
                    borderRadius: 3,
                  }}
                >
                  Proposed Rule
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "#F0EDE8",
                    color: "#5C5C5C",
                    border: "1px solid #D8D4CE",
                    padding: "2px 7px",
                    borderRadius: 3,
                  }}
                >
                  CFPB
                </span>
              </div>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 15, fontWeight: 500, color: "#111111", marginBottom: 6, lineHeight: 1.3 }}>
                CFPB Proposes Expanded Open Banking Data Sharing Requirements
              </p>
              <p style={{ fontSize: 11, color: "#5C5C5C", fontWeight: 300, lineHeight: 1.5 }}>
                Proposed amendments expand consumer rights to access and transfer financial data between institutions.
              </p>
            </div>

            {/* Card 3 — LOW */}
            <div style={{ background: "#F5F2EC", padding: "16px 20px", fontFamily: "var(--font-dm-sans)" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "#EEF5F0",
                    color: "#2E6B46",
                    border: "1px solid #B8D8C4",
                    padding: "2px 7px",
                    borderRadius: 3,
                  }}
                >
                  LOW
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "#F0EDE8",
                    color: "#5C5C5C",
                    border: "1px solid #D8D4CE",
                    padding: "2px 7px",
                    borderRadius: 3,
                  }}
                >
                  Guidance
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "#F0EDE8",
                    color: "#5C5C5C",
                    border: "1px solid #D8D4CE",
                    padding: "2px 7px",
                    borderRadius: 3,
                  }}
                >
                  Federal Register
                </span>
              </div>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 15, fontWeight: 500, color: "#111111", marginBottom: 6, lineHeight: 1.3 }}>
                Updated Guidance on Environmental Review for Technology Projects
              </p>
              <p style={{ fontSize: 11, color: "#5C5C5C", fontWeight: 300, lineHeight: 1.5 }}>
                New categorical exclusions for technology deployments under $10M reduce documentation burden.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: HOW IT WORKS ── */}
      <section style={{ padding: "80px 48px", borderTop: "1px solid #1E1A15" }}>
        <p
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: 10,
            color: "#C4855A",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: 16,
          }}
        >
          How it works
        </p>
        <h2
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: 36,
            fontWeight: 400,
            color: "#F0EDE6",
            marginBottom: 48,
          }}
        >
          Three steps to regulatory clarity
        </h2>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
          {[
            {
              num: "01",
              title: "Tell Donna about your business",
              desc: "Select your industry, jurisdictions, and the regulatory bodies that matter to you. Takes under 3 minutes.",
            },
            {
              num: "02",
              title: "Donna monitors everything",
              desc: "She watches Federal Register, SEC EDGAR, CFPB, FTC, and state-level sources around the clock — every day, including weekends.",
            },
            {
              num: "03",
              title: "You receive what matters",
              desc: "A weekly briefing lands in your inbox every Monday. High-impact changes trigger an immediate alert. Everything else waits until you need it.",
            },
          ].map(({ num, title, desc }, i) => (
            <div key={num} style={{ display: "flex", flex: 1, alignItems: "flex-start" }}>
              <div style={{ flex: 1, paddingRight: i < 2 ? 40 : 0 }}>
                <p
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: 48,
                    color: "#2E2A25",
                    lineHeight: 1,
                    marginBottom: 16,
                  }}
                >
                  {num}
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: 20,
                    fontWeight: 400,
                    color: "#F0EDE6",
                    marginBottom: 12,
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: 13,
                    fontWeight: 300,
                    color: "#6B655C",
                    lineHeight: 1.7,
                  }}
                >
                  {desc}
                </p>
              </div>
              {i < 2 && (
                <div
                  style={{
                    width: 1,
                    alignSelf: "stretch",
                    background: "#1E1A15",
                    flexShrink: 0,
                    marginRight: 40,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4: PRICING ── */}
      <section id="pricing" style={{ padding: "80px 48px", borderTop: "1px solid #1E1A15" }}>
        <p
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: 10,
            color: "#C4855A",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: 16,
          }}
        >
          Pricing
        </p>
        <h2
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: 36,
            fontWeight: 400,
            color: "#F0EDE6",
            marginBottom: 8,
          }}
        >
          Simple, transparent pricing
        </h2>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#6B655C", marginBottom: 40 }}>
          No contracts. No per-seat surprises. Cancel anytime.
        </p>

        {/* Pricing cards */}
        <div
          style={{
            maxWidth: 640,
            margin: "0 auto",
            display: "flex",
            gap: 1,
            background: "#1E1A15",
          }}
        >
          {/* Card 1 — Free Trial */}
          <div style={{ flex: 1, background: "#141009", padding: 32 }}>
            <p
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: 10,
                color: "#6B655C",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 20,
              }}
            >
              14-day trial
            </p>
            <p
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: 48,
                fontWeight: 400,
                color: "#F0EDE6",
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              $0
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#6B655C", marginBottom: 28 }}>
              No credit card required
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Full access to all features",
                "All regulatory sources",
                "Personalized feed and alerts",
                "Weekly digest emails",
              ].map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#6B655C" }}>
                  <span style={{ color: "#7B9E87", flexShrink: 0, marginTop: 1 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-up"
              style={{
                display: "block",
                textAlign: "center",
                fontFamily: "var(--font-dm-sans)",
                fontSize: 13,
                fontWeight: 500,
                background: "#C4855A",
                color: "#fff",
                textDecoration: "none",
                padding: "10px 0",
                borderRadius: 4,
              }}
            >
              Start free trial
            </Link>
          </div>

          {/* Card 2 — Pro */}
          <div style={{ flex: 1, background: "#1C1814", padding: 32, borderTop: "2px solid #C4855A" }}>
            <p
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: 10,
                color: "#C4855A",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 20,
              }}
            >
              Pro — most popular
            </p>
            <p
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: 48,
                fontWeight: 400,
                color: "#F0EDE6",
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              $149
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#6B655C", marginBottom: 28 }}>
              per month, billed monthly
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Full access to all features",
                "All regulatory sources",
                "Personalized feed and alerts",
                "Weekly digest emails",
                "Audit trail and PDF export",
                "Task and calendar management",
                "Document annotations",
                "Priority support",
              ].map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#6B655C" }}>
                  <span style={{ color: "#7B9E87", flexShrink: 0, marginTop: 1 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-up"
              style={{
                display: "block",
                textAlign: "center",
                fontFamily: "var(--font-dm-sans)",
                fontSize: 13,
                fontWeight: 500,
                background: "#C4855A",
                color: "#fff",
                textDecoration: "none",
                padding: "10px 0",
                borderRadius: 4,
              }}
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: FAQ ── */}
      <section style={{ padding: "80px 48px", borderTop: "1px solid #1E1A15" }}>
        <p
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: 10,
            color: "#C4855A",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: 16,
          }}
        >
          FAQ
        </p>
        <h2
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: 36,
            fontWeight: 400,
            color: "#F0EDE6",
            marginBottom: 40,
          }}
        >
          Questions we get asked
        </h2>

        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {[
            {
              q: "How is Donna different from a Google Alert?",
              a: "Google Alerts surface mentions of keywords across the entire web. Donna monitors specific regulatory sources, extracts structured data from each document, scores it for relevance to your specific business, and delivers a plain-language summary with recommended actions — not a list of links.",
            },
            {
              q: "What regulatory sources does Donna monitor?",
              a: "Federal Register, SEC EDGAR, CFPB, FTC, California AG, New York AG, and Texas AG — with more sources added regularly. You can also watch specific sources and receive immediate alerts when they publish.",
            },
            {
              q: "What happens if I miss something important?",
              a: "Donna maintains a full audit trail of every document flagged, every alert sent, and every task created. You can export this as a PDF compliance report covering any time period — useful for board reporting or regulatory inquiries.",
            },
            {
              q: "Is my data secure?",
              a: "Donna uses Clerk for authentication, PostgreSQL with row-level access controls for data storage, and does not share your profile or preferences with any third parties. Your compliance profile stays private.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes. No contracts, no cancellation fees. You can cancel from your account settings at any time and your access continues until the end of your billing period.",
            },
          ].map(({ q, a }) => (
            <div
              key={q}
              style={{
                borderBottom: "1px solid #1E1A15",
                padding: "20px 0",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: 14,
                  color: "#F0EDE6",
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                {q}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: 13,
                  fontWeight: 300,
                  color: "#6B655C",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 6: FOOTER ── */}
      <footer>
        {/* CTA top half */}
        <div
          style={{
            borderTop: "1px solid #1E1A15",
            padding: "60px 48px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: 36,
              fontWeight: 400,
              color: "#F0EDE6",
              marginBottom: 16,
            }}
          >
            Ready to be three steps ahead?
          </h2>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: 13,
              color: "#6B655C",
              fontWeight: 300,
              marginBottom: 32,
            }}
          >
            14-day free trial. No credit card required. Setup in under 3 minutes.
          </p>
          <Link
            href="/sign-up"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: 14,
              fontWeight: 500,
              background: "#C4855A",
              color: "#fff",
              textDecoration: "none",
              padding: "12px 32px",
              borderRadius: 5,
              display: "inline-block",
            }}
          >
            Start free trial
          </Link>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid #1E1A15",
            padding: "24px 48px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 16, fontStyle: "italic", color: "#F0EDE6", marginBottom: 4 }}>
              Donn<em style={{ color: "#C4855A" }}>a</em>
            </p>
            <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: 10, color: "#4A453F" }}>
              &copy; 2026 Donna. All rights reserved.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Contact", href: "mailto:hello@donnaplatform.com" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: 12,
                  color: "#6B655C",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#F0EDE6")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#6B655C")}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
