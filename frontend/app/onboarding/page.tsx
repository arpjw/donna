"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { usersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

const INDUSTRIES = [
  "fintech", "healthcare", "saas", "manufacturing", "retail",
  "real_estate", "energy", "education", "financial_services",
  "insurance", "legal", "government_contracting",
];

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

type Step = "welcome" | "industries" | "jurisdictions" | "alerts" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [step, setStep] = useState<Step>("welcome");

  useEffect(() => {
    const checkOnboarded = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const profile = await usersApi.me(token);
        if (profile.onboarded_at) {
          router.push("/feed");
        }
      } catch {
        // 404 = no profile yet, stay on onboarding
      }
    };
    checkOnboarded();
  }, [getToken, router]);

  const [companyName, setCompanyName] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [jurisdictions, setJurisdictions] = useState<string[]>(["federal"]);
  const [alertThreshold, setAlertThreshold] = useState("high");
  const [digestCadence, setDigestCadence] = useState("weekly");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleComplete = async () => {
    try {
      setSubmitting(true);
      const token = await getToken();
      await usersApi.onboard(
        {
          company_name: companyName,
          industries,
          jurisdictions,
          alert_threshold: alertThreshold as "high" | "medium" | "all",
          digest_cadence: digestCadence as "daily" | "weekly",
        },
        token ?? undefined
      );
      setStep("done");
      setTimeout(() => router.push("/feed"), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save preferences");
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS_ORDER: Step[] = ["welcome", "industries", "jurisdictions", "alerts"];
  const stepIndex = STEPS_ORDER.indexOf(step as Step);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#0E0B08" }}
    >
      <div className="w-full max-w-lg">
        {/* Wordmark */}
        <div className="text-center mb-10">
          <h1 className="font-display" style={{ fontSize: 48, color: "#F0EDE6" }}>
            Donn<em style={{ color: "#C4855A", fontStyle: "italic" }}>a</em>
          </h1>
          <p className="font-mono uppercase tracking-widest mt-2" style={{ fontSize: 10, color: "#4A453F" }}>
            Always three steps ahead.
          </p>
        </div>

        {/* Progress */}
        {step !== "done" && (
          <>
            <p className="font-mono text-center mb-3" style={{ fontSize: 11, color: "#4A453F" }}>
              Step {stepIndex + 1} of 4
            </p>
            <div className="flex gap-1 mb-8">
              {STEPS_ORDER.map((s, idx) => (
                <div
                  key={s}
                  className="h-0.5 flex-1 rounded transition-colors"
                  style={{ background: idx <= stepIndex ? "#C4855A" : "#2A2420" }}
                />
              ))}
            </div>
          </>
        )}

        {/* Welcome step */}
        {step === "welcome" && (
          <div className="rounded p-8" style={{ background: "#1C1814", border: "1px solid #2A2420" }}>
            <h2 className="font-display text-2xl mb-3" style={{ color: "#D4CFC7" }}>
              Welcome to Donna
            </h2>
            <p className="font-sans text-sm mb-6 leading-relaxed" style={{ color: "#6B655C", fontWeight: 300 }}>
              Donna monitors the regulatory landscape so you don&apos;t have to. We&apos;ll scan federal and state regulatory bodies, extract what matters for your business, and deliver plain-language summaries directly to you.
            </p>
            <p className="font-sans text-sm mb-6" style={{ color: "#6B655C", fontWeight: 300 }}>
              Let&apos;s set up your profile so Donna knows what to watch.
            </p>
            <div className="mb-6">
              <label className="block font-mono uppercase tracking-wider mb-1.5" style={{ fontSize: 10, color: "#4A453F" }}>
                Company name (optional)
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                className="input-dark"
              />
            </div>
            <Button variant="primary" className="w-full" onClick={() => setStep("industries")}>
              Get started →
            </Button>
          </div>
        )}

        {step === "industries" && (
          <div className="rounded p-8" style={{ background: "#1C1814", border: "1px solid #2A2420" }}>
            <h2 className="font-display text-2xl mb-2" style={{ color: "#D4CFC7" }}>
              Your industry
            </h2>
            <p className="font-sans text-sm mb-6" style={{ color: "#6B655C", fontWeight: 300 }}>
              Select the industries relevant to your compliance responsibilities.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {INDUSTRIES.map((ind) => (
                <OnboardPill
                  key={ind}
                  active={industries.includes(ind)}
                  onClick={() => toggleItem(industries, setIndustries, ind)}
                >
                  {ind.replace("_", " ")}
                </OnboardPill>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep("welcome")} className="flex-1" style={{ color: "#4A453F" }}>
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setStep("jurisdictions")}
                disabled={industries.length === 0}
              >
                Continue →
              </Button>
            </div>
          </div>
        )}

        {step === "jurisdictions" && (
          <div className="rounded p-8" style={{ background: "#1C1814", border: "1px solid #2A2420" }}>
            <h2 className="font-display text-2xl mb-2" style={{ color: "#D4CFC7" }}>
              Your jurisdictions
            </h2>
            <p className="font-sans text-sm mb-6" style={{ color: "#6B655C", fontWeight: 300 }}>
              Select the jurisdictions where you have compliance obligations.
            </p>
            <div className="mb-4">
              <OnboardPill
                active={jurisdictions.includes("federal")}
                onClick={() => toggleItem(jurisdictions, setJurisdictions, "federal")}
              >
                Federal
              </OnboardPill>
            </div>
            <div className="flex flex-wrap gap-2 mb-8 max-h-48 overflow-y-auto">
              {STATES.map((state) => (
                <OnboardPill
                  key={state}
                  active={jurisdictions.includes(state)}
                  onClick={() => toggleItem(jurisdictions, setJurisdictions, state)}
                  compact
                >
                  {state}
                </OnboardPill>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep("industries")} className="flex-1" style={{ color: "#4A453F" }}>
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setStep("alerts")}
                disabled={jurisdictions.length === 0}
              >
                Continue →
              </Button>
            </div>
          </div>
        )}

        {step === "alerts" && (
          <div className="rounded p-8" style={{ background: "#1C1814", border: "1px solid #2A2420" }}>
            <h2 className="font-display text-2xl mb-2" style={{ color: "#D4CFC7" }}>
              Alert preferences
            </h2>
            <p className="font-sans text-sm mb-6" style={{ color: "#6B655C", fontWeight: 300 }}>
              How should Donna reach you?
            </p>

            <div className="mb-6">
              <p className="font-mono uppercase tracking-wider mb-3" style={{ fontSize: 10, color: "#4A453F" }}>
                Alert threshold
              </p>
              <div className="space-y-2">
                {[
                  { value: "high", label: "High impact only", desc: "Only critical changes requiring immediate action" },
                  { value: "medium", label: "High & Medium", desc: "Important changes worth your attention" },
                  { value: "all", label: "All changes", desc: "Everything Donna tracks in your area" },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setAlertThreshold(value)}
                    className="w-full text-left p-3 rounded transition-colors"
                    style={{
                      border: alertThreshold === value ? "1px solid rgba(196,133,90,0.40)" : "1px solid #2A2420",
                      background: alertThreshold === value ? "rgba(196,133,90,0.08)" : "transparent",
                    }}
                  >
                    <p className="font-mono uppercase tracking-wider" style={{ fontSize: 10, color: alertThreshold === value ? "#C4855A" : "#6B655C" }}>
                      {label}
                    </p>
                    <p className="font-sans text-xs mt-0.5" style={{ color: "#4A453F", fontWeight: 300 }}>{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="font-mono uppercase tracking-wider mb-3" style={{ fontSize: 10, color: "#4A453F" }}>
                Digest cadence
              </p>
              <div className="flex gap-2">
                {["daily", "weekly"].map((c) => (
                  <OnboardPill
                    key={c}
                    active={digestCadence === c}
                    onClick={() => setDigestCadence(c)}
                  >
                    {c}
                  </OnboardPill>
                ))}
              </div>
            </div>

            {error && <p className="font-sans text-xs mb-4" style={{ color: "#B85C5C" }}>{error}</p>}

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep("jurisdictions")} className="flex-1" style={{ color: "#4A453F" }}>
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleComplete}
                disabled={submitting}
              >
                {submitting ? "Setting up..." : "Complete setup →"}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="rounded p-8 text-center" style={{ background: "#1C1814", border: "1px solid #2A2420" }}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(123,158,135,0.20)" }}
            >
              <span style={{ color: "#7B9E87", fontSize: 18 }}>✓</span>
            </div>
            <h2 className="font-display text-2xl mb-2" style={{ color: "#D4CFC7" }}>
              Donna is setting up your feed
            </h2>
            <p className="font-sans text-sm" style={{ color: "#6B655C", fontWeight: 300 }}>
              Analyzing regulations across your industries and jurisdictions...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function OnboardPill({
  active,
  onClick,
  children,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded font-mono uppercase tracking-wider transition-colors"
      style={{
        fontSize: 10,
        padding: compact ? "4px 8px" : "6px 12px",
        ...(active
          ? { background: "rgba(196,133,90,0.12)", border: "1px solid rgba(196,133,90,0.40)", color: "#C4855A" }
          : { border: "1px solid #2A2420", color: "#4A453F" }),
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#8A837A";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#4A453F";
      }}
    >
      {children}
    </button>
  );
}
