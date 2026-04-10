"use client";

import { useState } from "react";
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
  const [companyName, setCompanyName] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [jurisdictions, setJurisdictions] = useState<string[]>(["federal"]);
  const [alertThreshold, setAlertThreshold] = useState("high");
  const [digestCadence, setDigestCadence] = useState("weekly");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleItem = (
    list: string[],
    setList: (v: string[]) => void,
    item: string
  ) => {
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
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

  return (
    <div className="min-h-screen bg-shell flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl font-semibold text-text-primary tracking-tight">
            Donna
          </h1>
          <p className="text-xs text-text-tertiary font-mono uppercase tracking-widest mt-2">
            Always three steps ahead.
          </p>
        </div>

        {/* Progress */}
        {step !== "done" && (
          <div className="flex gap-1 mb-8">
            {(["welcome", "industries", "jurisdictions", "alerts"] as Step[]).map(
              (s, i) => {
                const steps = ["welcome", "industries", "jurisdictions", "alerts"];
                const current = steps.indexOf(step);
                const idx = steps.indexOf(s);
                return (
                  <div
                    key={s}
                    className={`h-0.5 flex-1 rounded transition-colors ${
                      idx <= current ? "bg-crimson" : "bg-border"
                    }`}
                  />
                );
              }
            )}
          </div>
        )}

        {/* Steps */}
        {step === "welcome" && (
          <div className="border border-border rounded p-8">
            <h2 className="font-display text-2xl font-semibold text-text-primary mb-3">
              Welcome to Donna
            </h2>
            <p className="text-sm text-text-secondary font-sans mb-6 leading-relaxed">
              Donna monitors the regulatory landscape so you don't have to. We'll
              scan federal and state regulatory bodies, extract what matters for
              your business, and deliver plain-language summaries directly to you.
            </p>
            <p className="text-sm text-text-secondary font-sans mb-6">
              Let's set up your profile so Donna knows what to watch.
            </p>
            <div className="mb-6">
              <label className="block text-xs text-text-tertiary font-mono uppercase tracking-wider mb-1.5">
                Company name (optional)
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                className="input-base w-full"
              />
            </div>
            <Button variant="primary" className="w-full" onClick={() => setStep("industries")}>
              Get started →
            </Button>
          </div>
        )}

        {step === "industries" && (
          <div className="border border-border rounded p-8">
            <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
              Your industry
            </h2>
            <p className="text-sm text-text-secondary font-sans mb-6">
              Select the industries relevant to your compliance responsibilities.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  onClick={() => toggleItem(industries, setIndustries, ind)}
                  className={`px-3 py-1.5 rounded border text-xs font-mono uppercase tracking-wider transition-colors ${
                    industries.includes(ind)
                      ? "bg-crimson/10 border-crimson/40 text-crimson"
                      : "border-border text-text-tertiary hover:border-white/20 hover:text-text-secondary"
                  }`}
                >
                  {ind.replace("_", " ")}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep("welcome")} className="flex-1">
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
          <div className="border border-border rounded p-8">
            <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
              Your jurisdictions
            </h2>
            <p className="text-sm text-text-secondary font-sans mb-6">
              Select the jurisdictions where you have compliance obligations.
            </p>
            <div className="mb-4">
              <button
                onClick={() => toggleItem(jurisdictions, setJurisdictions, "federal")}
                className={`px-3 py-1.5 rounded border text-xs font-mono uppercase tracking-wider transition-colors ${
                  jurisdictions.includes("federal")
                    ? "bg-crimson/10 border-crimson/40 text-crimson"
                    : "border-border text-text-tertiary hover:border-white/20"
                }`}
              >
                Federal
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-8 max-h-48 overflow-y-auto">
              {STATES.map((state) => (
                <button
                  key={state}
                  onClick={() => toggleItem(jurisdictions, setJurisdictions, state)}
                  className={`px-2.5 py-1 rounded border text-xs font-mono tracking-wider transition-colors ${
                    jurisdictions.includes(state)
                      ? "bg-crimson/10 border-crimson/40 text-crimson"
                      : "border-border text-text-tertiary hover:border-white/20"
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep("industries")} className="flex-1">
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
          <div className="border border-border rounded p-8">
            <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
              Alert preferences
            </h2>
            <p className="text-sm text-text-secondary font-sans mb-6">
              How should Donna reach you?
            </p>

            <div className="mb-6">
              <p className="text-xs text-text-tertiary font-mono uppercase tracking-wider mb-3">
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
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      alertThreshold === value
                        ? "bg-crimson/10 border-crimson/40"
                        : "border-border hover:border-white/20"
                    }`}
                  >
                    <p className={`text-xs font-mono uppercase tracking-wider ${
                      alertThreshold === value ? "text-crimson" : "text-text-secondary"
                    }`}>
                      {label}
                    </p>
                    <p className="text-xs text-text-tertiary font-sans mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="text-xs text-text-tertiary font-mono uppercase tracking-wider mb-3">
                Digest cadence
              </p>
              <div className="flex gap-2">
                {["daily", "weekly"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setDigestCadence(c)}
                    className={`flex-1 py-2 rounded border text-xs font-mono uppercase tracking-wider transition-colors ${
                      digestCadence === c
                        ? "bg-crimson/10 border-crimson/40 text-crimson"
                        : "border-border text-text-tertiary hover:border-white/20"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-impact-high text-xs font-sans mb-4">{error}</p>}

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep("jurisdictions")} className="flex-1">
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
          <div className="border border-border rounded p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-impact-low/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-impact-low text-lg">✓</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
              Donna is setting up your feed
            </h2>
            <p className="text-sm text-text-secondary font-sans">
              Analyzing regulations across your industries and jurisdictions...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
