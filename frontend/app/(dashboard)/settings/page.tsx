"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";

const INDUSTRIES = [
  "fintech", "healthcare", "saas", "manufacturing", "retail",
  "real_estate", "energy", "education", "financial_services",
  "insurance", "legal", "government_contracting",
];

const JURISDICTIONS_FEDERAL = ["federal"];
const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const ALERT_THRESHOLDS = [
  { value: "high", label: "High impact only" },
  { value: "medium", label: "High & Medium" },
  { value: "all", label: "All changes" },
];

const DIGEST_CADENCES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

export default function SettingsPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [jurisdictions, setJurisdictions] = useState<string[]>([]);
  const [alertThreshold, setAlertThreshold] = useState("high");
  const [digestCadence, setDigestCadence] = useState("weekly");

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getToken();
        const p = await usersApi.me(token ?? undefined);
        setProfile(p);
        setFullName(p.full_name ?? "");
        setCompanyName(p.company_name ?? "");
        setIndustries(p.industries ?? []);
        setJurisdictions(p.jurisdictions ?? []);
        setAlertThreshold(p.alert_threshold ?? "high");
        setDigestCadence(p.digest_cadence ?? "weekly");
      } catch (e: unknown) {
        if (e && typeof e === "object" && "status" in e && (e as { status: number }).status === 404) {
          router.push("/onboarding");
          return;
        }
        setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [getToken]);

  const toggleItem = (
    list: string[],
    setList: (v: string[]) => void,
    item: string
  ) => {
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = await getToken();
      await usersApi.update(
        {
          full_name: fullName,
          company_name: companyName,
          industries,
          jurisdictions,
          alert_threshold: alertThreshold as UserProfile["alert_threshold"],
          digest_cadence: digestCadence as UserProfile["digest_cadence"],
        },
        token ?? undefined
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[720px] mx-auto px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded w-1/3" />
          <div className="h-4 bg-white/5 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-8">
      <div className="border-b border-border pb-5 mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary">
          Settings
        </h1>
        <p className="text-sm text-text-secondary font-sans mt-1">
          Manage your profile, watchlist, and notification preferences
        </p>
      </div>

      <div className="space-y-10">
        {/* Profile */}
        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
            Profile
          </h2>
          <div className="space-y-4">
            <Field label="Full name">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-base"
              />
            </Field>
            <Field label="Company name">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input-base"
              />
            </Field>
            {profile && (
              <Field label="Email">
                <input type="text" value={profile.email} readOnly className="input-base opacity-50 cursor-not-allowed" />
              </Field>
            )}
          </div>
        </section>

        {/* Industries */}
        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-1">
            Industries
          </h2>
          <p className="text-xs text-text-tertiary font-sans mb-4">
            Select the industries relevant to your compliance responsibilities
          </p>
          <div className="flex flex-wrap gap-2">
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
        </section>

        {/* Jurisdictions */}
        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-1">
            Jurisdictions
          </h2>
          <p className="text-xs text-text-tertiary font-sans mb-4">
            Select the jurisdictions where you have compliance obligations
          </p>
          <div className="mb-3">
            <button
              onClick={() => toggleItem(jurisdictions, setJurisdictions, "federal")}
              className={`px-3 py-1.5 rounded border text-xs font-mono uppercase tracking-wider transition-colors ${
                jurisdictions.includes("federal")
                  ? "bg-crimson/10 border-crimson/40 text-crimson"
                  : "border-border text-text-tertiary hover:border-white/20 hover:text-text-secondary"
              }`}
            >
              Federal
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATES.map((state) => (
              <button
                key={state}
                onClick={() => toggleItem(jurisdictions, setJurisdictions, state)}
                className={`px-2.5 py-1 rounded border text-xs font-mono tracking-wider transition-colors ${
                  jurisdictions.includes(state)
                    ? "bg-crimson/10 border-crimson/40 text-crimson"
                    : "border-border text-text-tertiary hover:border-white/20 hover:text-text-secondary"
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </section>

        {/* Alert settings */}
        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-4">
            Alert Preferences
          </h2>
          <div className="space-y-4">
            <Field label="Alert threshold">
              <div className="flex flex-col sm:flex-row gap-2">
                {ALERT_THRESHOLDS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setAlertThreshold(value)}
                    className={`flex-1 py-2 rounded border text-xs font-mono uppercase tracking-wider transition-colors ${
                      alertThreshold === value
                        ? "bg-crimson/10 border-crimson/40 text-crimson"
                        : "border-border text-text-tertiary hover:border-white/20"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Digest cadence">
              <div className="flex gap-2">
                {DIGEST_CADENCES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setDigestCadence(value)}
                    className={`flex-1 py-2 rounded border text-xs font-mono uppercase tracking-wider transition-colors ${
                      digestCadence === value
                        ? "bg-crimson/10 border-crimson/40 text-crimson"
                        : "border-border text-text-tertiary hover:border-white/20"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </section>

        {/* Save */}
        {error && (
          <p className="text-sm text-impact-high font-sans">{error}</p>
        )}
        <div className="flex items-center gap-4 pb-8">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {saved && (
            <span className="text-xs text-impact-low font-mono">Saved!</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-text-tertiary font-mono uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
