"use client";

import Link from "next/link";

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
          {["Product", "Pricing", "About"].map((item) => (
            <a
              key={item}
              href="#"
              style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#6B655C", textDecoration: "none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#F0EDE6")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#6B655C")}
            >
              {item}
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
        {/* Orb 4 — new smaller orb */}
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

        {/* Hero content — sits above decorative layer */}
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

      {/* Stats row */}
      <div style={{ margin: "0 48px 80px" }}>
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
              {/* Animated underline */}
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
      <div style={{ margin: "0 48px 80px" }}>
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
            {/* Radar pulse SVG */}
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block", marginBottom: 12 }}
              aria-hidden="true"
            >
              {/* Outermost arc */}
              <path
                d="M 32 32 m -28 0 a 28 28 0 0 1 28 -28"
                stroke="#C4855A"
                strokeWidth="1.5"
                strokeOpacity="0.15"
                fill="none"
                strokeLinecap="round"
              />
              {/* Middle arc */}
              <path
                d="M 32 32 m -18 0 a 18 18 0 0 1 18 -18"
                stroke="#C4855A"
                strokeWidth="1.5"
                strokeOpacity="0.25"
                fill="none"
                strokeLinecap="round"
              />
              {/* Inner arc */}
              <path
                d="M 32 32 m -10 0 a 10 10 0 0 1 10 -10"
                stroke="#C4855A"
                strokeWidth="1.5"
                strokeOpacity="0.40"
                fill="none"
                strokeLinecap="round"
              />
              {/* Center dot */}
              <circle cx="32" cy="32" r="3" fill="#C4855A" />
            </svg>
            {/* Icon chip */}
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
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: 12,
                fontWeight: 300,
                color: "#6B655C",
                lineHeight: 1.6,
              }}
            >
              Donna watches Federal Register, SEC EDGAR, CFPB, FTC, and state-level sources around the clock — so you never miss a publication that matters.
            </p>
          </div>

          {/* Feature 2 — Plain language analysis */}
          <div style={{ background: "#0E0B08", padding: "28px 24px" }}>
            {/* Text-lines SVG */}
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
              {/* Last line: short non-highlighted stub + highlighted portion */}
              <rect x="0"  y="32" width="22" height="2" fill="#7B9E87" fillOpacity="0.20" rx="1" />
              <rect x="24" y="32" width="16" height="2" fill="#7B9E87" fillOpacity="0.70" rx="1" />
            </svg>
            {/* Icon chip */}
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
            <h3
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: 18,
                fontWeight: 400,
                color: "#F0EDE6",
                marginBottom: 10,
              }}
            >
              Plain language analysis
            </h3>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: 12,
                fontWeight: 300,
                color: "#6B655C",
                lineHeight: 1.6,
              }}
            >
              Every regulatory change arrives pre-translated: a plain English summary, impact assessment, and specific action items written for compliance officers, not lawyers.
            </p>
          </div>

          {/* Feature 3 — Personalized */}
          <div style={{ background: "#0E0B08", padding: "28px 24px" }}>
            {/* Funnel/filter SVG */}
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block", marginBottom: 12 }}
              aria-hidden="true"
            >
              {/* Downward-pointing triangle outline */}
              <path
                d="M 8 10 L 56 10 L 32 54 Z"
                stroke="#9B7FC7"
                strokeWidth="1.5"
                strokeOpacity="0.40"
                fill="none"
                strokeLinejoin="round"
              />
              {/* Three horizontal lines crossing through it */}
              <line x1="14" y1="22" x2="50" y2="22" stroke="#9B7FC7" strokeWidth="1" strokeOpacity="0.20" />
              <line x1="20" y1="33" x2="44" y2="33" stroke="#9B7FC7" strokeWidth="1" strokeOpacity="0.20" />
              <line x1="26" y1="43" x2="38" y2="43" stroke="#9B7FC7" strokeWidth="1" strokeOpacity="0.20" />
              {/* Tip dot */}
              <circle cx="32" cy="54" r="2.5" fill="#9B7FC7" />
            </svg>
            {/* Icon chip */}
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
            <h3
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: 18,
                fontWeight: 400,
                color: "#F0EDE6",
                marginBottom: 10,
              }}
            >
              Personalized to your business
            </h3>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: 12,
                fontWeight: 300,
                color: "#6B655C",
                lineHeight: 1.6,
              }}
            >
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
            "Before Donna, I was spending 6 hours a week reading regulatory notices that mostly didn't apply to us. Now I get a briefing every Monday morning that tells me exactly what{" "}
            <span style={{ color: "#C4855A", fontStyle: "normal" }}>we</span>{" "}
            need to do."
          </blockquote>

          {/* Abstract geometric portrait */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Outer circle with gradient background at 20% opacity */}
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
              {/* Inner circle */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(196,133,90,0.30)",
                }}
              />
            </div>
            {/* Shoulders line */}
            <div
              style={{
                width: 64,
                height: 1,
                background: "rgba(212,207,199,0.20)",
                marginBottom: 12,
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: 13,
                color: "#F0EDE6",
                fontWeight: 500,
                marginBottom: 2,
                textAlign: "center",
              }}
            >
              Sarah Chen
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: 11,
                color: "#6B655C",
                textAlign: "center",
              }}
            >
              Chief Compliance Officer, Series B Fintech
            </p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div
        style={{
          borderTop: "1px solid #1E1A15",
          padding: "64px 48px",
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
    </div>
  );
}
