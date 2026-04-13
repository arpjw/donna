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

export default function PrivacyPage() {
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
          Privacy Policy
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
              Overview
            </h2>
            <p>
              Donna (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;the Service&rdquo;) is a regulatory intelligence platform operated by Donna Platform, Inc. This Privacy Policy explains what information we collect when you use Donna, how we use it, and what choices you have. We take your privacy seriously and do not sell your data to anyone.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              What data we collect
            </h2>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Account information.</strong> When you sign up, we collect your email address and name via Clerk, our authentication provider. You may also provide your company name and company size during onboarding.
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Profile preferences.</strong> To personalize your regulatory feed, we collect the industries your company operates in, the jurisdictions you care about (states and federal), and your alert and digest preferences. You provide this during onboarding and can update it anytime in Settings.
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Usage data.</strong> We log actions you take within the product — documents you view, tasks you create, annotations you add, and feedback you give on regulatory changes. This data powers your audit trail and improves the relevance of your feed over time.
            </p>
            <p>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Payment information.</strong> If you subscribe to the Pro plan, payment is processed by Stripe. We do not store your credit card number. Stripe provides us with a payment token and subscription status only.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              How we use your data
            </h2>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Personalization.</strong> Your industry and jurisdiction profile is used to score every regulatory change for relevance to your business. Only changes that meet your relevance threshold appear in your feed or trigger alerts.
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Alerts and digests.</strong> We use your email address and digest preferences to send you regulatory briefings and real-time alerts via Resend, our transactional email provider.
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>AI processing.</strong> When we summarize regulatory documents, we send document text to Anthropic&rsquo;s Claude API for analysis. We do not send your personal information or company profile to Anthropic as part of this process.
            </p>
            <p>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Service improvement.</strong> We use aggregated, anonymized usage data to understand how people use the product and to improve it. We do not use your individual data to train external AI models.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Third parties we work with
            </h2>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Clerk</strong> — authentication and user session management. Clerk stores your email, name, and login credentials on your behalf.
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Stripe</strong> — payment processing for Pro subscriptions. Stripe is PCI-DSS compliant and handles all card data.
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Resend</strong> — transactional email delivery for alerts and digests. Resend receives your email address and the content of messages we send you.
            </p>
            <p>
              <strong style={{ color: "#D4CFC7", fontWeight: 500 }}>Anthropic</strong> — AI summarization of regulatory documents. Document text is sent to Anthropic&rsquo;s API; your personal data and company profile are not included.
            </p>
            <p style={{ marginTop: 12 }}>
              We do not share your data with advertising networks, data brokers, or any other third parties beyond those listed above.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Data retention
            </h2>
            <p>
              We retain your account data for as long as your account is active. If you cancel your subscription and request account deletion, we will delete your profile, preferences, tasks, annotations, and audit log within 30 days. Regulatory documents and their AI-generated summaries are part of our shared database and are retained regardless of individual account status.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Your rights
            </h2>
            <p style={{ marginBottom: 12 }}>
              You have the right to access the personal data we hold about you, to correct inaccurate data, to request deletion of your account, and to export your data in a portable format. You can update most information directly in Settings. For deletion requests or data export, contact us at the address below.
            </p>
            <p>
              If you are located in California, you have additional rights under the California Consumer Privacy Act (CCPA). If you are in the European Economic Area, you have rights under GDPR. We honor these rights regardless of where you are located.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0EDE6", marginBottom: 12 }}>
              Contact
            </h2>
            <p>
              If you have questions about this policy or want to exercise your privacy rights, contact us at{" "}
              <a
                href="mailto:hello@donnaplatform.com"
                style={{ color: "#C4855A", textDecoration: "none" }}
              >
                hello@donnaplatform.com
              </a>
              . We respond to all privacy inquiries within 5 business days.
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
