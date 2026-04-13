"use client";

import Link from "next/link";

const navItems: { label: string; target: string }[] = [
  { label: "Product", target: "features" },
  { label: "Pricing", target: "pricing" },
  { label: "About", target: "about" },
];

export default function TermsPage() {
  return (
    <div style={{ fontFamily: "var(--font-dm-sans)", background: "#0E0B08", color: "#F0EDE6", minHeight: "100vh" }}>
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
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-cormorant)", fontSize: 20, color: "#F0EDE6" }}>
            Donn<em style={{ color: "#C4855A", fontStyle: "italic" }}>a</em>
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {navItems.map(({ label, target }) => (
            <Link
              key={label}
              href={`/#${target}`}
              style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#6B655C", textDecoration: "none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#F0EDE6")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#6B655C")}
            >
              {label}
            </Link>
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

      {/* Content */}
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "80px 48px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: 48,
            fontWeight: 400,
            color: "#F0EDE6",
            marginBottom: 12,
          }}
        >
          Terms of Service
        </h1>
        <p
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: 11,
            color: "#6B655C",
            marginBottom: 56,
          }}
        >
          Last updated April 2026
        </p>

        <div
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: 14,
            fontWeight: 300,
            color: "#6B655C",
            lineHeight: 1.8,
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Agreement to these terms
            </h2>
            <p>
              By creating an account or using Donna (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, do not use the Service. These Terms apply to all users of Donna, including users on the free trial and paid subscription plans.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Description of the Service
            </h2>
            <p>
              Donna is a regulatory intelligence platform that monitors federal and state regulatory sources, generates AI-assisted summaries and analysis of regulatory documents, and delivers personalized briefings to in-house legal and compliance professionals. The Service includes a web application, email alerts, weekly digest emails, document annotation tools, task tracking, a compliance calendar, and audit reporting features.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Not legal advice
            </h2>
            <p>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Donna provides regulatory information, not legal advice.</strong> The summaries, analyses, recommended actions, and other content generated by Donna are produced by AI and are intended to help you identify regulatory developments — they are not a substitute for advice from a qualified attorney. Nothing in the Service creates an attorney-client relationship. You should consult qualified legal counsel before taking any action based on information provided by Donna.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Acceptable use
            </h2>
            <p style={{ marginBottom: 12 }}>
              You may use Donna only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Share your account credentials with others or allow multiple users to access the Service under a single account</li>
              <li>Attempt to reverse engineer, scrape, or systematically extract data from the Service</li>
              <li>Use the Service to build a competing regulatory intelligence product</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Circumvent any security or access control measures</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Subscription and billing
            </h2>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Free trial.</strong> New accounts receive a 14-day free trial with full access to all features. No credit card is required to start. At the end of the trial period, you may choose to subscribe to the Pro plan or your access will end.
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Pro plan.</strong> The Pro plan is $149 per month, billed monthly. You authorize us to charge your payment method on a recurring monthly basis until you cancel.
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Cancellation.</strong> You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of your current billing period. We do not provide refunds for partial months.
            </p>
            <p>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Price changes.</strong> We may change subscription pricing with 30 days&rsquo; advance notice. If you do not agree to a price change, you may cancel before the new price takes effect.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Intellectual property
            </h2>
            <p style={{ marginBottom: 12 }}>
              The Donna platform, including its software, design, trademarks, and AI-generated content, is owned by Donna Platform, Inc. We grant you a limited, non-exclusive, non-transferable license to use the Service for your internal compliance and legal operations.
            </p>
            <p>
              Regulatory documents monitored by Donna are published by government agencies and are generally in the public domain. AI-generated summaries of those documents are provided as part of the Service and may not be resold or sublicensed.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Limitation of liability
            </h2>
            <p style={{ marginBottom: 12 }}>
              To the fullest extent permitted by law, Donna Platform, Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to damages arising from your reliance on AI-generated regulatory summaries, missed regulatory deadlines, or compliance failures.
            </p>
            <p>
              In no event shall our total liability to you exceed the greater of (a) the total fees paid by you in the 12 months preceding the claim, or (b) $100. This limitation applies whether the claim is based in contract, tort, statute, or any other theory of liability.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Disclaimer of warranties
            </h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or that regulatory documents will be captured without delay or omission. We make no warranty as to the accuracy, completeness, or timeliness of any regulatory information provided through the Service.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in conduct that is harmful to other users or to the Service. You may terminate your account at any time by canceling your subscription and contacting us to request account deletion.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Governing law and disputes
            </h2>
            <p>
              These Terms are governed by the laws of the State of Delaware, without regard to its conflict-of-law principles. Any dispute arising from or relating to these Terms or the Service shall be resolved by binding arbitration in accordance with the American Arbitration Association rules, conducted in Delaware. You waive any right to a jury trial or class action proceeding.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Changes to these Terms
            </h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes by email or by posting a notice within the Service at least 14 days before the changes take effect. Continued use of the Service after changes take effect constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Contact
            </h2>
            <p>
              Questions about these Terms can be sent to{" "}
              <a
                href="mailto:hello@donnaplatform.com"
                style={{ color: "#C4855A", textDecoration: "none" }}
              >
                hello@donnaplatform.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>

      {/* Footer bottom bar */}
      <div
        style={{
          borderTop: "1px solid #1E1A15",
          padding: "24px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 40,
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
              style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#6B655C", textDecoration: "none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#F0EDE6")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#6B655C")}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
