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

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
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
          <div className="h-8 skeleton rounded w-1/3" />
          <div className="h-4 skeleton rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-8">
      <div className="pb-5 mb-8" style={{ borderBottom: "1px solid #E2DDD5" }}>
        <h1 className="font-display" style={{ fontSize: 26, color: "#1C1814" }}>
          Settings
        </h1>
        <p className="font-sans text-sm mt-1" style={{ color: "#6B655C", fontWeight: 300 }}>
          Manage your profile, watchlist, and notification preferences
        </p>
      </div>

      <div className="space-y-10">
        {/* Profile */}
        <section>
          <h2 className="font-display italic mb-4" style={{ fontSize: 18, color: "#1C1814" }}>
            Profile
          </h2>
          <div className="space-y-4">
            <Field label="Full name">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-base w-full"
              />
            </Field>
            <Field label="Company name">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input-base w-full"
              />
            </Field>
            {profile && (
              <Field label="Email">
                <input type="text" value={profile.email} readOnly className="input-base w-full opacity-50 cursor-not-allowed" />
              </Field>
            )}
          </div>
        </section>

        {/* Industries */}
        <section>
          <h2 className="font-display italic mb-1" style={{ fontSize: 18, color: "#1C1814" }}>
            Industries
          </h2>
          <p className="font-sans text-xs mb-4" style={{ color: "#9E9890", fontWeight: 300 }}>
            Select the industries relevant to your compliance responsibilities
          </p>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((ind) => (
              <SelectPill
                key={ind}
                active={industries.includes(ind)}
                onClick={() => toggleItem(industries, setIndustries, ind)}
              >
                {ind.replace("_", " ")}
              </SelectPill>
            ))}
          </div>
        </section>

        {/* Jurisdictions */}
        <section>
          <h2 className="font-display italic mb-1" style={{ fontSize: 18, color: "#1C1814" }}>
            Jurisdictions
          </h2>
          <p className="font-sans text-xs mb-4" style={{ color: "#9E9890", fontWeight: 300 }}>
            Select the jurisdictions where you have compliance obligations
          </p>
          <div className="mb-3">
            <SelectPill
              active={jurisdictions.includes("federal")}
              onClick={() => toggleItem(jurisdictions, setJurisdictions, "federal")}
            >
              Federal
            </SelectPill>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATES.map((state) => (
              <SelectPill
                key={state}
                active={jurisdictions.includes(state)}
                onClick={() => toggleItem(jurisdictions, setJurisdictions, state)}
                compact
              >
                {state}
              </SelectPill>
            ))}
          </div>
        </section>

        {/* Alert settings */}
        <section>
          <h2 className="font-display italic mb-4" style={{ fontSize: 18, color: "#1C1814" }}>
            Alert Preferences
          </h2>
          <div className="space-y-4">
            <Field label="Alert threshold">
              <div className="flex flex-col sm:flex-row gap-2">
                {ALERT_THRESHOLDS.map(({ value, label }) => (
                  <SelectPill
                    key={value}
                    active={alertThreshold === value}
                    onClick={() => setAlertThreshold(value)}
                  >
                    {label}
                  </SelectPill>
                ))}
              </div>
            </Field>
            <Field label="Digest cadence">
              <div className="flex gap-2">
                {DIGEST_CADENCES.map(({ value, label }) => (
                  <SelectPill
                    key={value}
                    active={digestCadence === value}
                    onClick={() => setDigestCadence(value)}
                  >
                    {label}
                  </SelectPill>
                ))}
              </div>
            </Field>
          </div>
        </section>

        {error && (
          <p className="font-sans text-sm" style={{ color: "#B85C5C" }}>{error}</p>
        )}
        <div className="flex items-center gap-4 pb-8">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {saved && (
            <span className="font-mono text-xs" style={{ color: "#7B9E87" }}>Saved!</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block font-mono uppercase tracking-wider mb-1.5"
        style={{ fontSize: 10, color: "#9E9890" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectPill({
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
          ? { background: "rgba(196,133,90,0.10)", border: "1px solid rgba(196,133,90,0.40)", color: "#C4855A" }
          : { border: "1px solid #E2DDD5", color: "#9E9890" }),
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#6B655C";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#9E9890";
      }}
    >
      {children}
    </button>
  );
}
